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
const chokidar_1 = require("chokidar");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const TypeScriptSourceStore_1 = require("./TypeScriptSourceStore");
class TypeScriptCheckerTool {
    constructor(sourceStore, compilerOptions, tslintConfiguration) {
        this.sourceStore = sourceStore;
        this.compilerOptions = compilerOptions;
        this.host = TypeScript.createCompilerHost(compilerOptions);
        this.patchCompilerHost();
        this.tslintConfiguration = tslintConfiguration;
    }
    patchCompilerHost() {
        let rawFileCache = {};
        this.host.readFile = (fileName) => {
            let s = rawFileCache[fileName];
            if (s) {
                return s;
            }
            let fileContent = fse.readFileSync(fileName, 'utf8');
            rawFileCache[fileName] = fileContent;
            return fileContent;
        };
        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            return this.sourceStore.getSource(fileName);
        };
    }
    static createToolAsync(variables) {
        return __awaiter(this, void 0, void 0, function* () {
            let finder = new PathFinder_1.PathFinder(variables);
            let tsconfig = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration);
            let compilerOptions = tsconfig.options;
            let sourceStore = new TypeScriptSourceStore_1.TypeScriptSourceStore(compilerOptions.target || TypeScript.ScriptTarget.ES3);
            let loading = sourceStore.loadFolder(finder.jsInputFolder);
            let tslintConfiguration = undefined;
            let tslintFind = finder.findTslintConfiguration();
            if (tslintFind) {
                tslintConfiguration = tslintFind.results;
                Shout_1.Shout.timed('tslint:', chalk_1.default.cyan(tslintFind.path));
            }
            let tool = new TypeScriptCheckerTool(sourceStore, compilerOptions, tslintConfiguration);
            yield loading;
            return tool;
        });
    }
    typeCheck() {
        let tsc = TypeScript.createProgram(this.sourceStore.sourcePaths, this.compilerOptions, this.host);
        let linter = undefined;
        if (this.tslintConfiguration) {
            linter = new tslint.Linter({
                fix: false
            }, tsc);
        }
        Shout_1.Shout.timed('Type-checking using TypeScript', chalk_1.default.green(TypeScript.version));
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
                let realFileName = this.sourceStore.getFilePath(diagnostic.file.fileName);
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
        let realFileName = this.sourceStore.getFilePath(failure.getFileName());
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
        chokidar_1.watch(this.sourceStore.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file) => {
            this.sourceStore.loadFile(file).then(changed => {
                Shout_1.Shout.typescript(chalk_1.default.grey('tracking new file:', file));
                debounce();
            });
        })
            .on('change', (file) => {
            this.sourceStore.loadFile(file).then(changed => {
                if (changed) {
                    Shout_1.Shout.typescript(chalk_1.default.grey('updating file:', file));
                    debounce();
                }
            });
        })
            .on('unlink', (file) => {
            let deleted = this.sourceStore.removeFile(file);
            if (deleted) {
                Shout_1.Shout.typescript(chalk_1.default.grey('removing file:', file));
                debounce();
            }
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
