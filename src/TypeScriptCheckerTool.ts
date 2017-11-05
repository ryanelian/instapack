import * as TypeScript from 'typescript';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import { createHash } from 'crypto';

import hub from './EventHub';
import { Settings } from './Settings';
import { timedLog, CompilerFlags, convertAbsoluteToSourceMapPath } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { parseUserTsConfig } from './TypeScriptConfigurationReader';

/**
 * Key-value pair of file name to cached raw file content. Used for caching TypeScript Compiler Host readFile method.
 */
interface FileContentCache {
    [fileName: string]: string;
}

/**
 * Key-value pair of file name to TypeScript SourceFile. Used for caching TypeScript Compiler Host getSourceFile method.
 */
interface SourceCache {
    [fileName: string]: TypeScript.SourceFile;
}

/**
 * Key-value pair of file name to SHA-256 hash of its content. Used for detecting whether a file has been changed.
 */
interface FileVersions {
    [fileName: string]: string;
}

/**
 * Contains methods for static-checking TypeScript projects. 
 */
export class TypeScriptCheckerTool {

    /**
     * Gets the instapack Settings object.
     */
    private readonly settings: Settings;

    /**
     * Gets the raw files cache.
     */
    private readonly files: FileContentCache = {};

    /**
     * Gets the source files cache.
     */
    private readonly sources: SourceCache = {};

    /**
     * Gets the file versions store.
     */
    private readonly versions: FileVersions = {};

    /**
     * Gets the entry points to the TypeScript Program.
     */
    private readonly includeFiles: Set<string>;

    /**
     * Gets the shared TypeScript compiler options.
     */
    private readonly compilerOptions: TypeScript.CompilerOptions;

    /**
     * Gets the shared TypeScript compiler host.
     */
    private readonly host: TypeScript.CompilerHost;

    /**
     * Callback method handler for reading TypeScript SourceFile from disk. 
     */
    private readonly readSourceFile: (fileName: string, languageVersion: TypeScript.ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean) => TypeScript.SourceFile;

    /**
     * Constructs a new instance of TypeScriptCheckerTool using provided instapack Settings.
     * @param settings 
     */
    constructor(settings: Settings) {
        this.settings = settings;
        let tsconfig = parseUserTsConfig();

        let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));
        this.includeFiles = new Set<string>(definitions);
        this.includeFiles.add(this.slash(this.settings.jsEntry));

        this.compilerOptions = tsconfig.options;

        this.host = TypeScript.createCompilerHost(tsconfig.options);
        this.host.readFile = (fileName) => {
            // Apparently this is being used by TypeScript to read package.json in node_modules...
            // Probably to find .d.ts files?

            if (this.files[fileName]) {
                // console.log('READ (cache) ' + fileName);
                return this.files[fileName];
            }

            // package.json in node_modules should never change. Cache the contents once and re-use.
            // console.log('READ ' + fileName);

            let fileContent = TypeScript.sys.readFile(fileName, 'utf8');
            this.files[fileName] = fileContent;
            this.versions[fileName] = this.getFileContentHash(fileContent);
            return fileContent;
        }

        this.readSourceFile = this.host.getSourceFile;
        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            if (this.sources[fileName]) {
                // console.log('SOURCE (cache) ' + fileName);
                return this.sources[fileName];
            }

            // Cache Miss: should only happen during the initial check.
            // Subsequent queries should be cached prior checking by the watch function. 
            // console.log('SOURCE ' + fileName);

            this.addOrUpdateSourceFileCache(fileName);
            return this.sources[fileName];
        }
    }

    /**
     * Reads the SourceFile from disk then version it.
     * If the version changes, update the cache and return true.
     * Otherwise, returns false.
     * @param fileName 
     */
    private addOrUpdateSourceFileCache(fileName: string) {
        let source = this.readSourceFile(fileName, this.compilerOptions.target, error => {
            console.error(chalk.red('Error') + ' when reading SourceFile: ' + fileName);
            console.error(error);
        });

        let version = this.getFileContentHash(source.text);
        let lastVersion = this.versions[fileName];

        if (version === lastVersion) {
            return false;
        }

        this.sources[fileName] = source;
        this.versions[fileName] = version;
        return true;
    }

    /**
     * Versions a text-based file content using SHA-256 algorithm.
     * @param content 
     */
    private getFileContentHash(content: string) {
        let hash = createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }

    /**
     * Performs full static check (semantic and syntactic diagnostics) against the TypeScript project using the project entry file.
     */
    typeCheck() {
        let tsc = TypeScript.createProgram(Array.from(this.includeFiles), this.compilerOptions, this.host);

        timedLog('Type-checking using TypeScript', chalk.yellow(TypeScript.version));
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
            }
            if (!errors.length) {
                console.log(chalk.green('Types OK') + chalk.grey(': Successfully checked TypeScript project without errors.'));
            } else {
                let errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            }
        } finally {
            let time = prettyHrTime(process.hrtime(start));
            timedLog('Finished type-checking after', chalk.green(time));
            hub.buildDone();
        }
    }

    /**
     * Converts a collection of TypeScript Diagnostic objects to an array of colorful strings.
     * @param diagnostics 
     */
    renderDiagnostics(diagnostics: TypeScript.Diagnostic[]) {
        let errors = diagnostics.map(diagnostic => {
            let error = chalk.red('TS' + diagnostic.code) + ' ';

            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                error += chalk.red(diagnostic.file.fileName) + ' ' + chalk.yellow(`(${line + 1},${character + 1})`) + ':\n';
            }

            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });

        return errors;
    }

    /**
     * Converts Windows file path (from chokidar event handler parameter) to TypeScript fileName equivalent path.
     * @param fileName 
     */
    private slash(fileName: string) {
        return fileName.replace(/\\/g, '/');
    }

    /**
     * Tracks all TypeScript files (*.ts and *.tsx) in the project folder recursively.
     * On file creation / change / deletion, the project will be type-checked automatically.
     */
    watch() {
        let ready = false;

        let debounced: NodeJS.Timer;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.typeCheck();
            }, 300);
        };

        chokidar.watch(this.settings.tsGlobs)
            .on('add', (file: string) => {
                file = this.slash(file);

                if (file.endsWith('.d.ts')) {
                    this.includeFiles.add(file);
                }

                if (this.sources[file]) {
                    // Discovered source which already exists: should only happen during initial add event (ready === false)
                    return;
                }

                this.addOrUpdateSourceFileCache(file);

                if (!ready) {
                    // Discovered new sources during initial add event: stuffs which are not imported!
                    // No need to re-check now...
                    return;
                }

                console.log(chalk.blue('TypeScript') + chalk.grey(' tracking new file: ' + file));
                debounce();
            })
            .on('change', (file: string) => {
                file = this.slash(file);

                let changed = this.addOrUpdateSourceFileCache(file);
                if (changed) {
                    console.log(chalk.blue('TypeScript') + chalk.grey(' updating file: ' + file));
                    debounce();
                }
            })
            .on('unlink', (file: string) => {
                file = this.slash(file);

                if (file.endsWith('.d.ts')) {
                    this.includeFiles.delete(file);
                }

                if (this.sources[file]) {
                    console.log(chalk.blue('TypeScript') + chalk.grey(' removing file: ' + file));
                    delete this.sources[file];
                    delete this.versions[file];
                    debounce();
                }
            })
            .on('ready', () => {
                ready = true;
            });

        // console.log(Object.keys(this.files));
        // console.log(Object.keys(this.sources));
        // console.log(this.fileVersions);
        // console.log(this.includeFiles);
    }
}