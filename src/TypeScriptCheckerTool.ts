import * as TypeScript from 'typescript';
import * as tslint from 'tslint';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import { watch } from 'chokidar';

import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';
import { IVariables } from './variables-factory/IVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { parseTypescriptConfig } from './TypescriptConfigParser';
import { TypeScriptSourceStore } from './TypeScriptSourceStore';

/**
 * Contains methods for static-checking TypeScript projects. 
 */
export class TypeScriptCheckerTool {
    /**
     * Gets the shared TypeScript compiler options.
     */
    private readonly compilerOptions: TypeScript.CompilerOptions;

    /**
     * Gets the shared TypeScript compiler host.
     */
    private readonly host: TypeScript.CompilerHost;

    /**
     * Gets tslint Configuration object, if exists.
     */
    private readonly tslintConfiguration: tslint.Configuration.IConfigurationFile | undefined;

    /**
     * Gets the TypeScript cache management object.
     */
    sourceStore: TypeScriptSourceStore;

    /**
     * Constructs a new instance of TypeScriptCheckerTool using provided instapack Settings.
     * @param settings 
     */
    private constructor(
        sourceStore: TypeScriptSourceStore,
        compilerOptions: TypeScript.CompilerOptions,
        tslintConfiguration: tslint.Configuration.IConfigurationFile | undefined) {

        this.sourceStore = sourceStore;

        this.compilerOptions = compilerOptions;
        this.host = TypeScript.createCompilerHost(compilerOptions);
        this.patchCompilerHost();

        this.tslintConfiguration = tslintConfiguration;
    }

    /**
     * Modify TypeScript compiler host to use instapack's in-memory source cache.
     */
    private patchCompilerHost() {
        let rawFileCache: IMapLike<string | undefined> = {};
        this.host.readFile = (fileName) => {
            // Apparently this is being used by TypeScript to read package.json in node_modules...
            // Probably to find .d.ts files?

            let s = rawFileCache[fileName];
            if (s) {
                // console.log('READ (cache) ' + fileName);
                return s;
            }

            // package.json in node_modules should never change. Cache the contents once and re-use.
            // console.log('READ ' + fileName);

            let fileContent = fse.readFileSync(fileName, 'utf8');
            rawFileCache[fileName] = fileContent;
            return fileContent;
        }

        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            return this.sourceStore.getSource(fileName);
        }
    }

    /**
     * Create TypeScript checker tool which targets JS source input folder.
     * @param variables 
     */
    static async createToolAsync(variables: IVariables): Promise<TypeScriptCheckerTool> {
        let finder = new PathFinder(variables);

        let tsconfig = parseTypescriptConfig(variables.root, variables.typescriptConfiguration);
        let compilerOptions = tsconfig.options;

        let sourceStore = new TypeScriptSourceStore(compilerOptions.target || TypeScript.ScriptTarget.ES3);
        let loading = sourceStore.loadFolder(finder.jsInputFolder);

        let tslintConfiguration: tslint.Configuration.IConfigurationFile | undefined = undefined;
        let tslintFind = finder.findTslintConfiguration();
        if (tslintFind) {
            tslintConfiguration = tslintFind.results;
            Shout.timed('tslint:', chalk.cyan(tslintFind.path));
        }

        await loading;
        let tool = new TypeScriptCheckerTool(sourceStore, compilerOptions, tslintConfiguration);
        return tool;
    }

    /**
     * Performs TypeScript compile-time checks and lints against the project.
     */
    typeCheck() {
        // console.log(this.sourceStore.sourcePaths);
        let tsc = TypeScript.createProgram(this.sourceStore.sourcePaths, this.compilerOptions, this.host);

        // https://palantir.github.io/tslint/usage/type-checking/
        let linter: tslint.Linter | undefined = undefined;
        if (this.tslintConfiguration) {
            linter = new tslint.Linter({
                fix: false
            }, tsc);
        }

        Shout.timed('Type-checking using TypeScript', chalk.green(TypeScript.version));
        let start = process.hrtime();

        try {
            let errors: string[] = [];
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

                // https://palantir.github.io/tslint/usage/library/
                // "Please ensure that the TypeScript source files compile correctly before running the linter."
                if (newErrors.length === 0 && linter) {
                    linter.lint(source.fileName, source.text, this.tslintConfiguration);
                }
            }

            if (linter) {
                let lintResult = linter.getResult();
                // console.log(lintResult);
                for (let failure of lintResult.failures) {
                    let lintErrorMessage = this.renderLintFailure(failure);
                    errors.push(lintErrorMessage);
                }
            }

            if (errors.length > 0) {
                if (errors.length === 1) {
                    Shout.notify(`You have one TypeScript check error!`);
                } else {
                    Shout.notify(`You have ${errors.length} TypeScript check errors!`);
                }

                let errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            } else {
                console.log(chalk.green('Types OK') + chalk.grey(': Successfully checked TypeScript project without errors.'));
            }
        } finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished type-check after', chalk.green(time));
        }
    }

    /**
     * Converts a collection of TypeScript Diagnostic objects to an array of colorful strings.
     * @param diagnostics 
     */
    renderDiagnostics(diagnostics: TypeScript.Diagnostic[]): string[] {
        let errors = diagnostics.map(diagnostic => {
            let error = chalk.red('TS' + diagnostic.code) + ' ';

            if (diagnostic.file && diagnostic.start) {
                let realFileName = this.sourceStore.getFilePath(diagnostic.file.fileName);
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += chalk.red(realFileName) + ' ' + chalk.yellow(`(${line + 1},${character + 1})`) + ':\n';
            }

            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });

        return errors;
    }

    /**
     * Converts tslint failure object to instapack-formatted error message. 
     * @param failure 
     */
    renderLintFailure(failure: tslint.RuleFailure): string {
        let { line, character } = failure.getStartPosition().getLineAndCharacter();
        let realFileName = this.sourceStore.getFilePath(failure.getFileName());

        let lintErrorMessage = chalk.red('TSLINT') + ' '
            + chalk.red(realFileName) + ' '
            + chalk.yellow(`(${line + 1},${character + 1})`) + ': '
            + chalk.grey(failure.getRuleName()) + '\n'
            + failure.getFailure();

        return lintErrorMessage;
    }

    /**
     * Tracks all TypeScript files (*.ts and *.tsx) in the project folder recursively.
     * On file creation / change / deletion, the project will be type-checked automatically.
     */
    watch() {
        let debounced: NodeJS.Timer;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                try {
                    this.typeCheck();
                } catch (error) {
                    Shout.fatal('during type-checking!', error);
                }
            }, 300);
        };

        watch(this.sourceStore.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file: string) => {
                this.sourceStore.loadFile(file).then(changed => {
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
                let deleted = this.sourceStore.removeFile(file);
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
