import * as TypeScript from 'typescript';
import chalk = require('chalk');
import * as fse from 'fs-extra';
import { watch } from 'chokidar';
import type { ESLint, LintMessage } from 'eslint';

import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { parseTypescriptConfig } from './TypescriptConfigParser';
import { TypeScriptSourceStore } from './TypeScriptSourceStore';
import { VoiceAssistant } from './VoiceAssistant';
import { tryGetProjectESLint } from './CompilerResolver';

/**
 * Contains methods for static-checking TypeScript projects. 
 */
export class TypeScriptCheckerTool {

    /**
     * Gets the path finder utility.
     */
    private finder: PathFinder;

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
        finder: PathFinder,
        sourceStore: TypeScriptSourceStore,
        compilerOptions: TypeScript.CompilerOptions,
        silent: boolean,
        eslint: ESLint | undefined) {

        this.finder = finder;
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

        const sourceStore = new TypeScriptSourceStore(target);
        const loadSourceTask = sourceStore.loadFolder(finder.jsInputFolder);
        const eslint = await tryGetProjectESLint(variables.root, finder.jsEntry);

        let versionAnnounce = `Using TypeScript ${chalk.green(TypeScript.version)} `;
        if (eslint) {
            versionAnnounce += `+ ESLint ${chalk.green(eslint.version)}`;
        } else {
            versionAnnounce += chalk.grey('(ESLint disabled)');
        }

        Shout.timed(versionAnnounce);
        await loadSourceTask;
        return new TypeScriptCheckerTool(finder, sourceStore, tsconfig.options, variables.mute, eslint?.linter);
    }

    /**
     * Performs TypeScript compile-time checks and lints against the project.
     */
    async typeCheck(): Promise<void> {
        // console.log(this.sourceStore.sourcePaths);
        const tsc = TypeScript.createProgram(this.sourceStore.sourcePaths, this.compilerOptions, this.host);
        Shout.timed('Type-checking start...');
        const start = process.hrtime();

        try {
            const errors: string[] = [];
            for (const source of tsc.getSourceFiles()) {
                // the filename SHOULD be UNIX path becacuse TypeScriptSourceStore.parseThenStoreSource
                if (source.fileName.startsWith(this.finder.jsInputFolder) == false) {
                    // do not check files in node_modules folder
                    continue;
                }
                // console.log(source.fileName);

                const diagnostics = tsc.getSemanticDiagnostics(source)
                    .concat(tsc.getSyntacticDiagnostics(source));

                const newErrors = this.renderDiagnostics(diagnostics);
                for (const error of newErrors) {
                    errors.push(error);
                }

                if (newErrors.length === 0 && this.eslint) {
                    try {
                        const lintResults = await this.eslint.lintText(source.getFullText(), {
                            filePath: source.fileName
                        });

                        for (const lintResult of lintResults) {
                            for (const lintMessage of lintResult.messages) {
                                const renderLintErrorMessage = this.renderLintErrorMessage(source.fileName, lintMessage);
                                errors.push(renderLintErrorMessage);
                            }
                        }
                    } catch (ex) {
                        // this should not happen because we checked for configuration prior type-checking
                        Shout.error(ex);
                    }
                }
            }

            if (errors.length > 0) {
                this.va.speak(`TYPESCRIPT: ${errors.length} ERROR!`);
                const errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            } else {
                this.va.rewind();
                console.log(chalk.green('Types OK') + chalk.grey(': Successfully checked TypeScript project without errors.'));
            }
        } finally {
            const time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished type-check after', chalk.green(time));
        }
    }

    /**
     * Converts a collection of TypeScript Diagnostic objects to an array of colorful strings.
     * @param diagnostics 
     */
    renderDiagnostics(diagnostics: TypeScript.Diagnostic[]): string[] {
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

    /**
     * Converts ESLint error object to instapack-formatted error message. 
     * @param fileName 
     * @param lintError 
     */
    renderLintErrorMessage(fileName: string, lintError: LintMessage): string {
        const lintErrorMessage = chalk.red('ESLint') + ' '
            + chalk.red(fileName) + ' '
            + chalk.yellow(`(${lintError.line},${lintError.column})`) + ': '
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
