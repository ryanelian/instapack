"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const chalk = require("chalk");
const fse = require("fs-extra");
const chokidar_1 = require("chokidar");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const TypeScriptSourceStore_1 = require("./TypeScriptSourceStore");
const VoiceAssistant_1 = require("./VoiceAssistant");
const CompilerResolver_1 = require("./CompilerResolver");
class TypeScriptCheckerTool {
    constructor(sourceStore, compilerOptions, silent, eslint) {
        this.sourceStore = sourceStore;
        this.eslint = eslint;
        this.va = new VoiceAssistant_1.VoiceAssistant(silent);
        this.compilerOptions = compilerOptions;
        this.host = TypeScript.createCompilerHost(compilerOptions);
        this.patchCompilerHost();
    }
    patchCompilerHost() {
        const rawFileCache = {};
        this.host.readFile = (fileName) => {
            const s = rawFileCache[fileName];
            if (s) {
                return s;
            }
            const fileContent = fse.readFileSync(fileName, 'utf8');
            rawFileCache[fileName] = fileContent;
            return fileContent;
        };
        this.host.getSourceFile = (fileName) => {
            return this.sourceStore.getSource(fileName);
        };
    }
    static createToolAsync(variables) {
        return __awaiter(this, void 0, void 0, function* () {
            const finder = new PathFinder_1.PathFinder(variables);
            const tsconfig = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration);
            const compilerOptions = tsconfig.options;
            const sourceStore = new TypeScriptSourceStore_1.TypeScriptSourceStore(compilerOptions.target || TypeScript.ScriptTarget.ES5);
            const loadSourceTask = sourceStore.loadFolder(finder.jsInputFolder);
            const eslintCtor = yield CompilerResolver_1.tryGetProjectESLint(finder.root, finder.jsEntry);
            let versionAnnounce = `Using TypeScript ${chalk.green(TypeScript.version)} `;
            if (eslintCtor) {
                versionAnnounce += `+ ESLint ${chalk.green(eslintCtor.version)}`;
            }
            else {
                versionAnnounce += chalk.grey('(ESLint disabled)');
            }
            let eslint;
            if (eslintCtor) {
                eslint = new eslintCtor({});
            }
            Shout_1.Shout.timed(versionAnnounce);
            yield loadSourceTask;
            return new TypeScriptCheckerTool(sourceStore, compilerOptions, variables.mute, eslint);
        });
    }
    typeCheck() {
        const tsc = TypeScript.createProgram(this.sourceStore.sourcePaths, this.compilerOptions, this.host);
        Shout_1.Shout.timed('Type-checking start...');
        const start = process.hrtime();
        try {
            const errors = [];
            for (const source of tsc.getSourceFiles()) {
                if (source.fileName.endsWith('.d.ts')) {
                    continue;
                }
                const diagnostics = tsc.getSemanticDiagnostics(source)
                    .concat(tsc.getSyntacticDiagnostics(source));
                const newErrors = this.renderDiagnostics(diagnostics);
                for (const error of newErrors) {
                    errors.push(error);
                }
                if (newErrors.length === 0 && this.eslint) {
                    try {
                        const eslintReport = this.eslint.executeOnText(source.getFullText(), source.fileName);
                        for (const result of eslintReport.results) {
                            for (const lintError of result.messages) {
                                const renderLintErrorMessage = this.renderLintErrorMessage(source.fileName, lintError);
                                errors.push(renderLintErrorMessage);
                            }
                        }
                    }
                    catch (ex) {
                        Shout_1.Shout.error(ex);
                    }
                }
            }
            if (errors.length > 0) {
                this.va.speak(`TYPESCRIPT: ${errors.length} ERROR!`);
                const errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            }
            else {
                this.va.rewind();
                console.log(chalk.green('Types OK') + chalk.grey(': Successfully checked TypeScript project without errors.'));
            }
        }
        finally {
            const time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
            Shout_1.Shout.timed('Finished type-check after', chalk.green(time));
        }
    }
    renderDiagnostics(diagnostics) {
        const errors = diagnostics.map(diagnostic => {
            let error = chalk.red('TS' + diagnostic.code) + ' ';
            if (diagnostic.file && diagnostic.start) {
                const realFileName = this.sourceStore.getFilePath(diagnostic.file.fileName);
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += chalk.red(realFileName) + ' ' + chalk.yellow(`(${line + 1},${character + 1})`) + ':\n';
            }
            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });
        return errors;
    }
    renderLintErrorMessage(fileName, lintError) {
        const lintErrorMessage = chalk.red('ESLint') + ' '
            + chalk.red(fileName) + ' '
            + chalk.yellow(`(${lintError.line},${lintError.column})`) + ': '
            + chalk.grey(lintError.ruleId) + '\n'
            + lintError.message;
        return lintErrorMessage;
    }
    watch() {
        let debounced;
        const debounce = () => {
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
            this.sourceStore.loadFile(file).then(() => {
                Shout_1.Shout.typescript(chalk.grey('tracking new file:', file));
                debounce();
            });
        })
            .on('change', (file) => {
            this.sourceStore.loadFile(file).then(changed => {
                if (changed) {
                    Shout_1.Shout.typescript(chalk.grey('updating file:', file));
                    debounce();
                }
            });
        })
            .on('unlink', (file) => {
            const deleted = this.sourceStore.removeFile(file);
            if (deleted) {
                Shout_1.Shout.typescript(chalk.grey('removing file:', file));
                debounce();
            }
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
