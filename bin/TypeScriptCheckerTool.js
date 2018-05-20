"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const tslint = require("tslint");
const chalk_1 = require("chalk");
const fse = require("fs-extra");
const upath = require("upath");
const chokidar = require("chokidar");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const VirtualSourceStore_1 = require("./VirtualSourceStore");
class TypeScriptCheckerTool {
    constructor(settings) {
        this.settings = settings;
    }
    setupCompilerHost() {
        return __awaiter(this, void 0, void 0, function* () {
            let tsconfig = yield this.settings.readTsConfig();
            this.compilerOptions = tsconfig.options;
            this.virtualSourceStore = new VirtualSourceStore_1.VirtualSourceStore(this.compilerOptions);
            let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));
            this.virtualSourceStore.includeFile(this.settings.jsEntry);
            this.virtualSourceStore.includeFiles(definitions);
            this.host = TypeScript.createCompilerHost(tsconfig.options);
            let rawFileCache = {};
            this.host.readFile = (fileName) => {
                if (rawFileCache[fileName]) {
                    return rawFileCache[fileName];
                }
                let fileContent = fse.readFileSync(fileName, 'utf8');
                rawFileCache[fileName] = fileContent;
                return fileContent;
            };
            this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
                return this.virtualSourceStore.getSource(fileName);
            };
            yield this.virtualSourceStore.addExoticSources(this.settings.vueGlobs);
            yield this.virtualSourceStore.preloadSources();
            let tslintFind = tslint.Configuration.findConfiguration(null, this.settings.root);
            if (tslintFind.path) {
                Shout_1.Shout.timed('tslint:', chalk_1.default.cyan(tslintFind.path));
                this.tslintConfiguration = tslintFind.results;
            }
        });
    }
    typeCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            let entryPoints = this.virtualSourceStore.entryFilePaths;
            let tsc = TypeScript.createProgram(entryPoints, this.compilerOptions, this.host);
            let doLint = Boolean(this.tslintConfiguration);
            let linter = new tslint.Linter({
                fix: false
            }, tsc);
            Shout_1.Shout.timed('Type-checking using TypeScript', chalk_1.default.yellow(TypeScript.version));
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
                    if (newErrors.length === 0 && doLint) {
                        linter.lint(source.fileName, source.text, this.tslintConfiguration);
                    }
                }
                if (doLint) {
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
        });
    }
    renderDiagnostics(diagnostics) {
        let errors = diagnostics.map(diagnostic => {
            let error = chalk_1.default.red('TS' + diagnostic.code) + ' ';
            if (diagnostic.file) {
                let realFileName = this.virtualSourceStore.getRealFilePath(diagnostic.file.fileName);
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += chalk_1.default.red(realFileName) + ' ' + chalk_1.default.yellow(`(${line + 1},${character + 1})`) + ':\n';
            }
            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
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
                this.typeCheck().catch(error => {
                    Shout_1.Shout.fatal('during type-checking!', error);
                });
            }, 300);
        };
        chokidar.watch(this.settings.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file) => {
            file = upath.toUnix(file);
            this.virtualSourceStore.addOrUpdateSourceAsync(file).then(changed => {
                Shout_1.Shout.typescript(chalk_1.default.grey('tracking new file:', file));
                debounce();
            });
        })
            .on('change', (file) => {
            file = upath.toUnix(file);
            this.virtualSourceStore.addOrUpdateSourceAsync(file).then(changed => {
                if (changed) {
                    Shout_1.Shout.typescript(chalk_1.default.grey('updating file:', file));
                    debounce();
                }
            });
        })
            .on('unlink', (file) => {
            file = upath.toUnix(file);
            let deleted = this.virtualSourceStore.tryRemoveSource(file);
            if (deleted) {
                Shout_1.Shout.typescript(chalk_1.default.grey('removing file:', file));
                debounce();
            }
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
