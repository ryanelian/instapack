"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptCheckerTool = void 0;
const TypeScript = require("typescript");
const chalk = require("chalk");
const fse = require("fs-extra");
const chokidar_1 = require("chokidar");
const allSettled = require("promise.allsettled");
allSettled.shim();
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const TypeScriptSourceStore_1 = require("./TypeScriptSourceStore");
const VoiceAssistant_1 = require("./VoiceAssistant");
const importESLintFrom_1 = require("./importers/importESLintFrom");
const VueTypeScriptParser_1 = require("./VueTypeScriptParser");
class TypeScriptCheckerTool {
    constructor(variables, sourceStore, compilerOptions, silent, eslint) {
        this.variables = variables;
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
    static async createToolAsync(variables) {
        const finder = new PathFinder_1.PathFinder(variables);
        const tsconfig = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration);
        let target = TypeScript.ScriptTarget.ES5;
        if (tsconfig.options.target) {
            target = tsconfig.options.target;
        }
        let tsVueParser;
        if (variables.vue) {
            tsVueParser = await VueTypeScriptParser_1.VueTypeScriptParser.createFrom(variables.vue.vue, variables.root);
        }
        const sourceStore = new TypeScriptSourceStore_1.TypeScriptSourceStore(target, tsVueParser);
        const loadSourceTask = sourceStore.loadFolder(finder.jsInputFolder);
        const eslint = await importESLintFrom_1.importESLintFrom(variables.root, finder.jsEntry);
        let versionAnnounce = `Using TypeScript ${chalk.greenBright(TypeScript.version)} `;
        if (eslint) {
            versionAnnounce += `+ ESLint ${chalk.greenBright(eslint.version)}`;
        }
        else {
            versionAnnounce += chalk.grey('(ESLint disabled)');
        }
        Shout_1.Shout.timed(versionAnnounce);
        await loadSourceTask;
        return new TypeScriptCheckerTool(variables, sourceStore, tsconfig.options, variables.mute, eslint === null || eslint === void 0 ? void 0 : eslint.linter);
    }
    createTypeCheckTasks() {
        const tsc = TypeScript.createProgram(this.sourceStore.sourcePaths, this.compilerOptions, this.host);
        const finder = new PathFinder_1.PathFinder(this.variables);
        const jsInputFolder = finder.jsInputFolder;
        return tsc.getSourceFiles().filter(source => {
            return source.fileName.startsWith(jsInputFolder);
        }).map(async (source) => {
            const diagnostics = tsc.getSemanticDiagnostics(source)
                .concat(tsc.getSyntacticDiagnostics(source));
            const tsErrors = this.renderDiagnostics(diagnostics);
            if (tsErrors.length) {
                return tsErrors;
            }
            const lintErrors = [];
            if (this.eslint) {
                const lintResults = await this.eslint.lintText(source.getFullText(), {
                    filePath: source.fileName
                });
                for (const lintResult of lintResults) {
                    for (const lintMessage of lintResult.messages) {
                        const renderLintErrorMessage = this.renderLintErrorMessage(source.fileName, lintMessage);
                        lintErrors.push(renderLintErrorMessage);
                    }
                }
            }
            return lintErrors;
        });
    }
    async typeCheck() {
        Shout_1.Shout.timed('Type-checking start...');
        const start = process.hrtime();
        try {
            const settledTasks = await Promise.allSettled(this.createTypeCheckTasks());
            const errors = [];
            for (const task of settledTasks) {
                if (task.status === 'fulfilled') {
                    if (task.value.length) {
                        errors.push(...task.value);
                    }
                }
                else {
                    Shout_1.Shout.error('during type-check: ', task.reason);
                }
            }
            if (errors.length > 0) {
                this.va.speak(`TYPESCRIPT: ${errors.length} ERROR!`);
                const errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            }
            else {
                this.va.rewind();
                console.log(chalk.greenBright('Types OK') + chalk.grey(': Successfully checked TypeScript project without errors.'));
            }
        }
        finally {
            const time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
            Shout_1.Shout.timed('Finished type-check after', chalk.greenBright(time));
        }
    }
    renderDiagnostics(diagnostics) {
        return diagnostics.map(diagnostic => {
            let error = chalk.redBright('TS' + diagnostic.code) + ' ';
            if (diagnostic.file && diagnostic.start) {
                const realFileName = this.sourceStore.getFilePath(diagnostic.file.fileName);
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += chalk.redBright(realFileName) + ' ' + chalk.yellowBright(`(${line + 1},${character + 1})`) + ':\n';
            }
            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });
    }
    renderLintErrorMessage(fileName, lintError) {
        const lintErrorMessage = chalk.redBright('ESLint') + ' '
            + chalk.redBright(fileName) + ' '
            + chalk.yellowBright(`(${lintError.line},${lintError.column})`) + ': '
            + chalk.grey(lintError.ruleId) + '\n'
            + lintError.message;
        return lintErrorMessage;
    }
    watch() {
        let debounced;
        const debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.typeCheck().catch(err => {
                    Shout_1.Shout.fatal('during type-checking!', err);
                });
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
