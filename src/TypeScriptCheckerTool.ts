import * as TypeScript from 'typescript';
import chalk = require('chalk');
import * as fse from 'fs-extra';
import { watch } from 'chokidar';
import type { ESLint, LintMessage } from 'eslint';
import allSettled = require('promise.allsettled');
allSettled.shim(); // will be a no-op if not needed

import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { parseTypescriptConfig } from './TypescriptConfigParser';
import { TypeScriptSourceStore } from './TypeScriptSourceStore';
import { VoiceAssistant } from './VoiceAssistant';
import { tryGetProjectESLint } from './PackageFinder';
import { VueTypeScriptParser } from './VueTypeScriptParser';

/**
 * Contains methods for static-checking TypeScript projects. 
 */
export class TypeScriptCheckerTool {

    /**
     * Gets the instapack build variables.
     */
    private variables: BuildVariables;

    /**
     * Gets the shared TypeScript compiler options.
     */
    private readonly compilerOptions: TypeScript.CompilerOptions;

    /**
     * Gets the shared TypeScript compiler host.
     */
    private readonly host: TypeScript.CompilerHost;

    /**
     * Gets the ESLint service, if available.
     */
    private readonly eslint: ESLint | undefined;

    /**
     * Gets the TypeScript cache management object.
     */
    sourceStore: TypeScriptSourceStore;

    private va: VoiceAssistant;

    /**
     * Constructs a new instance of TypeScriptCheckerTool using provided instapack Settings.
     * @param settings 
     */
    private constructor(
        variables: BuildVariables,
        sourceStore: TypeScriptSourceStore,
        compilerOptions: TypeScript.CompilerOptions,
        silent: boolean,
        eslint: ESLint | undefined) {

        this.variables = variables;
        this.sourceStore = sourceStore;
        this.eslint = eslint;
        this.va = new VoiceAssistant(silent);

        this.compilerOptions = compilerOptions;
        this.host = TypeScript.createCompilerHost(compilerOptions);
        this.patchCompilerHost();
    }

    /**
     * Modify TypeScript compiler host to use instapack's in-memory source cache.
     */
    private patchCompilerHost(): void {
        const rawFileCache: Record<string, string | undefined> = {};
        this.host.readFile = (fileName): string => {
            // Apparently this is being used by TypeScript to read package.json in node_modules...
            // Probably to find .d.ts files?

            const s = rawFileCache[fileName];
            if (s) {
                // console.log('READ (cache) ' + fileName);
                return s;
            }

            // package.json in node_modules should never change. Cache the contents once and re-use.
            // console.log('READ ' + fileName);

            const fileContent = fse.readFileSync(fileName, 'utf8');
            rawFileCache[fileName] = fileContent;
            return fileContent;
        }

        this.host.getSourceFile = (fileName): TypeScript.SourceFile => {
            return this.sourceStore.getSource(fileName);
        }
    }

    /**
     * Create TypeScript checker tool which targets JS source input folder.
     * @param variables 
     */
    static async createToolAsync(variables: BuildVariables): Promise<TypeScriptCheckerTool> {
        const finder = new PathFinder(variables);

        const tsconfig = parseTypescriptConfig(variables.root, variables.typescriptConfiguration);
        let target: TypeScript.ScriptTarget = TypeScript.ScriptTarget.ES5;
        if (tsconfig.options.target) { // if not ES3 or undefined
            target = tsconfig.options.target;
        }

        let tsVueParser: VueTypeScriptParser | undefined;
        if (variables.vue) {
            tsVueParser = await VueTypeScriptParser.createUsingProjectCompilerService(variables.vue.vue, variables.root)
        }
        const sourceStore = new TypeScriptSourceStore(target, tsVueParser);
        const loadSourceTask = sourceStore.loadFolder(finder.jsInputFolder);
        const eslint = await tryGetProjectESLint(variables.root, finder.jsEntry);

        let versionAnnounce = `Using TypeScript ${chalk.greenBright(TypeScript.version)} `;
        if (eslint) {
            versionAnnounce += `+ ESLint ${chalk.greenBright(eslint.version)}`;
        } else {
            versionAnnounce += chalk.grey('(ESLint disabled)');
        }

        Shout.timed(versionAnnounce);
        await loadSourceTask;
        return new TypeScriptCheckerTool(variables, sourceStore, tsconfig.options, variables.mute, eslint?.linter);
    }

    /**
     * Type-checks all userland files in a TypeScript program.
     * If ESLint is enabled, run lint on files with no type errors.
     */
    createTypeCheckTasks(): Promise<string[]>[] {
        // console.log(this.sourceStore.sourcePaths);
        const tsc = TypeScript.createProgram(this.sourceStore.sourcePaths, this.compilerOptions, this.host);
        const finder = new PathFinder(this.variables);
        const jsInputFolder = finder.jsInputFolder;

        return tsc.getSourceFiles().filter(source => {
            // do not type-check files inside node_modules...
            // the filename SHOULD be UNIX path (because upath)
            // console.log(source.fileName);
            return source.fileName.startsWith(jsInputFolder);
        }).map(async source => {
            const diagnostics = tsc.getSemanticDiagnostics(source)
                .concat(tsc.getSyntacticDiagnostics(source));
            const tsErrors = this.renderDiagnostics(diagnostics);
            if (tsErrors.length) {
                return tsErrors;
            }

            const lintErrors: string[] = [];
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

    /**
     * Performs TypeScript compile-time checks and lints against the project.
     */
    async typeCheck(): Promise<void> {
        Shout.timed('Type-checking start...');
        const start = process.hrtime();

        try {
            // Promise.all is fail-fast
            // Promise.allSettled is fail-safe, which allows all files to be type-checked and linted correctly
            const settledTasks = await Promise.allSettled(this.createTypeCheckTasks());
            // console.log(settledTasks);
            const errors: string[] = [];
            for (const task of settledTasks) {
                if (task.status === 'fulfilled') {
                    if (task.value.length) {
                        errors.push(...task.value);
                    }
                } else {
                    Shout.error('during type-check: ', task.reason);
                }
            }

            if (errors.length > 0) {
                this.va.speak(`TYPESCRIPT: ${errors.length} ERROR!`);
                const errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            } else {
                this.va.rewind();
                console.log(chalk.greenBright('Types OK') + chalk.grey(': Successfully checked TypeScript project without errors.'));
            }
        } finally {
            const time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished type-check after', chalk.greenBright(time));
        }
    }

    /**
     * Converts a collection of TypeScript Diagnostic objects to an array of colorful strings.
     * @param diagnostics 
     */
    renderDiagnostics(diagnostics: TypeScript.Diagnostic[]): string[] {
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

    /**
     * Converts ESLint error object to instapack-formatted error message. 
     * @param fileName 
     * @param lintError 
     */
    renderLintErrorMessage(fileName: string, lintError: LintMessage): string {
        const lintErrorMessage = chalk.redBright('ESLint') + ' '
            + chalk.redBright(fileName) + ' '
            + chalk.yellowBright(`(${lintError.line},${lintError.column})`) + ': '
            + chalk.grey(lintError.ruleId) + '\n'
            + lintError.message;

        return lintErrorMessage;
    }

    /**
     * Tracks all TypeScript files (*.ts and *.tsx) in the project folder recursively.
     * On file creation / change / deletion, the project will be type-checked automatically.
     */
    watch(): void {
        let debounced: NodeJS.Timer;
        const debounce = (): void => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.typeCheck().catch(err => {
                    Shout.fatal('during type-checking!', err);
                });
            }, 300);
        };

        watch(this.sourceStore.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file: string) => {
                this.sourceStore.loadFile(file).then(() => {
                    Shout.typescript(chalk.grey('tracking new file:', file));
                    debounce();
                });
            })
            .on('change', (file: string) => {
                this.sourceStore.loadFile(file).then(changed => {
                    if (changed) {
                        Shout.typescript(chalk.grey('updating file:', file));
                        debounce();
                    }
                });
            })
            .on('unlink', (file: string) => {
                const deleted = this.sourceStore.removeFile(file);
                if (deleted) {
                    Shout.typescript(chalk.grey('removing file:', file));
                    debounce();
                }
            });

        // console.log(Object.keys(this.files));
        // console.log(Object.keys(this.sources));
        // console.log(this.fileVersions);
        // console.log(this.includeFiles);
    }
}
