import * as TypeScript from 'typescript';
import * as tslint from 'tslint';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as upath from 'upath';
import { watch } from 'chokidar';

import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';
import { VirtualSourceStore } from './VirtualSourceStore';
import { IVariables } from './variables-factory/IVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { parseTypescriptConfig } from './TypescriptConfigParser';

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
     * Gets the TypeScript cache management object.
     */
    private readonly virtualSourceStore: VirtualSourceStore;

    /**
     * Gets tslint Configuration object, if exists.
     */
    private readonly tslintConfiguration: tslint.Configuration.IConfigurationFile | undefined;

    private readonly variables: IVariables;

    private readonly finder: PathFinder;

    /**
     * Constructs a new instance of TypeScriptCheckerTool using provided instapack Settings.
     * @param settings 
     */
    private constructor(
        variables: IVariables,
        compilerOptions: TypeScript.CompilerOptions,
        host: TypeScript.CompilerHost,
        virtualSourceStore: VirtualSourceStore,
        tslintConfiguration: tslint.Configuration.IConfigurationFile | undefined) {

        this.variables = variables;
        this.finder = new PathFinder(variables);

        this.compilerOptions = compilerOptions;
        this.host = host;
        this.patchCompilerHost();
        this.virtualSourceStore = virtualSourceStore;

        this.tslintConfiguration = tslintConfiguration;
    }

    patchCompilerHost() {
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
            return this.virtualSourceStore.getSource(fileName);
        }
    }

    static async createToolAsync(variables: IVariables): Promise<TypeScriptCheckerTool> {
        let finder = new PathFinder(variables);
        let tsconfig = parseTypescriptConfig(variables.root, variables.typescriptConfiguration);

        let compilerOptions = tsconfig.options;
        let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));

        let virtualSourceStore = new VirtualSourceStore(compilerOptions);
        virtualSourceStore.includeFile(finder.jsEntry);
        virtualSourceStore.includeFiles(definitions);

        let host = TypeScript.createCompilerHost(compilerOptions);

        let tslintConfiguration: tslint.Configuration.IConfigurationFile | undefined = undefined;
        let tslintFind = finder.findTslintConfiguration();
        if (tslintFind) {
            tslintConfiguration = tslintFind.results;
            Shout.timed('tslint:', chalk.cyan(tslintFind.path));
        }

        // How to add new file format / extension:
        // 1. add exotic source glob (and watch)
        // 2. add logic to parseThenStoreSource
        // 3. add check to delete virtual file path condition
        await virtualSourceStore.addExoticSources(finder.vueGlobs);
        await virtualSourceStore.preloadSources();

        let tool = new TypeScriptCheckerTool(variables, compilerOptions, host, virtualSourceStore, tslintConfiguration);
        return tool;
    }

    /**
     * Performs full static check (semantic and syntactic diagnostics) against the TypeScript application project.
     */
    typeCheck() {
        let entryPoints = this.virtualSourceStore.entryFilePaths;
        // console.log(entryPoints);
        let tsc = TypeScript.createProgram(entryPoints, this.compilerOptions, this.host);

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
                let realFileName = this.virtualSourceStore.getRealFilePath(diagnostic.file.fileName);
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
        let realFileName = this.virtualSourceStore.getRealFilePath(failure.getFileName());

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

        watch(this.finder.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file: string) => {
                file = upath.toUnix(file);

                this.virtualSourceStore.addOrUpdateSourceAsync(file).then(changed => {
                    Shout.typescript(chalk.grey('tracking new file:', file));
                    debounce();
                });
            })
            .on('change', (file: string) => {
                file = upath.toUnix(file);

                this.virtualSourceStore.addOrUpdateSourceAsync(file).then(changed => {
                    if (changed) {
                        Shout.typescript(chalk.grey('updating file:', file));
                        debounce();
                    }
                });
            })
            .on('unlink', (file: string) => {
                file = upath.toUnix(file);

                let deleted = this.virtualSourceStore.tryRemoveSource(file);
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
