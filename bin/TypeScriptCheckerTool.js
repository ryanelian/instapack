"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = __importDefault(require("typescript"));
const tslint_1 = __importDefault(require("tslint"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const upath_1 = __importDefault(require("upath"));
const chokidar_1 = __importDefault(require("chokidar"));
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const VirtualSourceStore_1 = require("./VirtualSourceStore");
const PathFinder_1 = require("./PathFinder");
class TypeScriptCheckerTool {
    constructor(variables, compilerOptions, host, virtualSourceStore, tslintConfiguration) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.compilerOptions = compilerOptions;
        this.host = host;
        this.patchCompilerHost();
        this.virtualSourceStore = virtualSourceStore;
        this.tslintConfiguration = tslintConfiguration;
    }
    patchCompilerHost() {
        let rawFileCache = {};
        this.host.readFile = (fileName) => {
            let s = rawFileCache[fileName];
            if (s) {
                return s;
            }
            let fileContent = fs_extra_1.default.readFileSync(fileName, 'utf8');
            rawFileCache[fileName] = fileContent;
            return fileContent;
        };
        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            return this.virtualSourceStore.getSource(fileName);
        };
    }
    static createToolAsync(variables) {
        return __awaiter(this, void 0, void 0, function* () {
            let finder = new PathFinder_1.PathFinder(variables);
            let tsconfig = yield finder.readTsConfig();
            let compilerOptions = tsconfig.options;
            let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));
            let virtualSourceStore = new VirtualSourceStore_1.VirtualSourceStore(compilerOptions);
            virtualSourceStore.includeFile(finder.jsEntry);
            virtualSourceStore.includeFiles(definitions);
            let host = typescript_1.default.createCompilerHost(compilerOptions);
            let tslintConfiguration = undefined;
            let tslintFind = finder.findTslintConfiguration();
            if (tslintFind) {
                tslintConfiguration = tslintFind.results;
                Shout_1.Shout.timed('tslint:', chalk_1.default.cyan(tslintFind.path));
            }
            yield virtualSourceStore.addExoticSources(finder.vueGlobs);
            yield virtualSourceStore.preloadSources();
            let tool = new TypeScriptCheckerTool(variables, compilerOptions, host, virtualSourceStore, tslintConfiguration);
            return tool;
        });
    }
    typeCheck() {
        let entryPoints = this.virtualSourceStore.entryFilePaths;
        let tsc = typescript_1.default.createProgram(entryPoints, this.compilerOptions, this.host);
        let linter = undefined;
        if (this.tslintConfiguration) {
            linter = new tslint_1.default.Linter({
                fix: false
            }, tsc);
        }
        Shout_1.Shout.timed('Type-checking using TypeScript', chalk_1.default.green(typescript_1.default.version));
        let start = process.hrtime();
        try {
            let errors = [];
            for (let source of tsc.getSourceFiles()) {
                if (source.fileName.endsWith('.d.ts')) {
                    continue;
                }
                let diagnostics = tsc.getSemanticDiagnostics(source)
                    .concat(tsc.getSyntacticDiagnostics(source));
                let newErrors = this.renderDiagnostics(diagnostics);
                for (let error of newErrors) {
                    errors.push(error);
                }
                if (newErrors.length === 0 && linter) {
                    linter.lint(source.fileName, source.text, this.tslintConfiguration);
                }
            }
            if (linter) {
                let lintResult = linter.getResult();
                for (let failure of lintResult.failures) {
                    let lintErrorMessage = this.renderLintFailure(failure);
                    errors.push(lintErrorMessage);
                }
            }
            if (errors.length > 0) {
                if (errors.length === 1) {
                    Shout_1.Shout.notify(`You have one TypeScript check error!`);
                }
                else {
                    Shout_1.Shout.notify(`You have ${errors.length} TypeScript check errors!`);
                }
                let errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            }
            else {
                console.log(chalk_1.default.green('Types OK') + chalk_1.default.grey(': Successfully checked TypeScript project without errors.'));
            }
        }
        finally {
            let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
            Shout_1.Shout.timed('Finished type-check after', chalk_1.default.green(time));
        }
    }
    renderDiagnostics(diagnostics) {
        let errors = diagnostics.map(diagnostic => {
            let error = chalk_1.default.red('TS' + diagnostic.code) + ' ';
            if (diagnostic.file && diagnostic.start) {
                let realFileName = this.virtualSourceStore.getRealFilePath(diagnostic.file.fileName);
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += chalk_1.default.red(realFileName) + ' ' + chalk_1.default.yellow(`(${line + 1},${character + 1})`) + ':\n';
            }
            error += typescript_1.default.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });
        return errors;
    }
    renderLintFailure(failure) {
        let { line, character } = failure.getStartPosition().getLineAndCharacter();
        let realFileName = this.virtualSourceStore.getRealFilePath(failure.getFileName());
        let lintErrorMessage = chalk_1.default.red('TSLINT') + ' '
            + chalk_1.default.red(realFileName) + ' '
            + chalk_1.default.yellow(`(${line + 1},${character + 1})`) + ': '
            + chalk_1.default.grey(failure.getRuleName()) + '\n'
            + failure.getFailure();
        return lintErrorMessage;
    }
    watch() {
        let debounced;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                try {
                    this.typeCheck();
                }
                catch (error) {
                    Shout_1.Shout.fatal('during type-checking!', error);
                }
            }, 300);
        };
        chokidar_1.default.watch(this.finder.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file) => {
            file = upath_1.default.toUnix(file);
            this.virtualSourceStore.addOrUpdateSourceAsync(file).then(changed => {
                Shout_1.Shout.typescript(chalk_1.default.grey('tracking new file:', file));
                debounce();
            });
        })
            .on('change', (file) => {
            file = upath_1.default.toUnix(file);
            this.virtualSourceStore.addOrUpdateSourceAsync(file).then(changed => {
                if (changed) {
                    Shout_1.Shout.typescript(chalk_1.default.grey('updating file:', file));
                    debounce();
                }
            });
        })
            .on('unlink', (file) => {
            file = upath_1.default.toUnix(file);
            let deleted = this.virtualSourceStore.tryRemoveSource(file);
            if (deleted) {
                Shout_1.Shout.typescript(chalk_1.default.grey('removing file:', file));
                debounce();
            }
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
