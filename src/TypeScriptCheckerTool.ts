import * as TypeScript from 'typescript';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as upath from 'upath';
import * as chokidar from 'chokidar';
import * as glob from 'glob';
import * as parse5 from 'parse5';
import { createHash } from 'crypto';

import hub from './EventHub';
import { Settings } from './Settings';
import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';

/**
 * Key-value pair of file name to cached raw file content. Used for caching TypeScript Compiler Host readFile method.
 */
interface IFileContentCache {
    [fileName: string]: string;
}

/**
 * Key-value pair of file name to TypeScript SourceFile. Used for caching TypeScript Compiler Host getSourceFile method.
 */
interface ISourceCache {
    [fileName: string]: TypeScript.SourceFile;
}

/**
 * Key-value pair of file name to a unique hash of its content. Used for detecting whether a file has been changed.
 */
interface IFileVersions {
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
    private readonly files: IFileContentCache = {};

    /**
     * Gets the source files cache.
     */
    private readonly sources: ISourceCache = {};

    /**
     * Gets the file versions store.
     */
    private readonly versions: IFileVersions = {};

    /**
     * Gets the entry points to the TypeScript Program.
     */
    private includeFiles: Set<string>;

    /**
     * Gets the tracked .vue source code files.
     */
    private vueFiles: Set<string>;

    /**
     * Gets the shared TypeScript compiler options.
     */
    private readonly compilerOptions: TypeScript.CompilerOptions;

    /**
     * Gets the shared TypeScript compiler host.
     */
    private readonly host: TypeScript.CompilerHost;

    /**
     * Constructs a new instance of TypeScriptCheckerTool using provided instapack Settings.
     * @param settings 
     */
    constructor(settings: Settings) {
        this.settings = settings;
        let tsconfig = settings.readTsConfig();

        let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));
        this.includeFiles = new Set<string>(definitions);
        this.includeFiles.add(this.settings.jsEntry);

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

            let fileContent = fse.readFileSync(fileName, 'utf8');
            this.files[fileName] = fileContent;
            this.versions[fileName] = this.getFileContentHash(fileContent);
            return fileContent;
        }

        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            if (this.sources[fileName]) {
                // console.log('SOURCE (cache) ' + fileName);
                return this.sources[fileName];
            }

            // Cache Miss: should only happen during...
            // 1. first-time check.
            // 2. importing existing files which were not imported during first-time check.
            // Subsequent queries SHOULD be cached prior checking by the watch function.

            // console.log('SOURCE ' + fileName);
            this.addOrUpdateSourceFileCache(fileName);
            return this.sources[fileName];
        }
    }

    /**
     * Reads TypeScript source code from virtual .vue.ts file,
     * which corresponds to the real .vue file when script language is TypeScript.
     * @param fileName 
     */
    private parseVueSource(fileName: string): string {
        let redirect = upath.removeExt(fileName, '.ts');
        let vue = fse.readFileSync(redirect, 'utf8');
        let document = parse5.parseFragment(vue);

        // console.log(document);
        for (let tag of document.childNodes) {
            if (tag.tagName === 'script') {
                // console.log(tag);
                let lang = tag.attrs.filter(Q => Q.name === 'lang')[0];
                if (!lang) {
                    return ''; // JS Language
                }
                if (lang.value !== 'ts') {
                    return ''; // Unknown Language
                }

                let child = tag.childNodes.filter(Q => Q.nodeName === '#text')[0];
                if (!child) {
                    return ''; // Empty?
                }

                // console.log(child);
                let text = child.value as string;
                return text.trim();
            }
        }

        return ''; // No Script
    }

    /**
     * Reads the SourceFile from disk then version it.
     * If the version changes, update the cache and return true.
     * Otherwise, returns false.
     * @param fileName 
     */
    private addOrUpdateSourceFileCache(fileName: string): boolean {
        // console.log(fileName);

        if (fileName.endsWith('.d.ts')) {
            this.includeFiles.add(fileName);
        }

        // chokidar passes file name with .vue extension...
        if (fileName.endsWith('.vue')) {
            this.vueFiles.add(fileName);
            fileName = fileName + '.ts';
        }

        let text: string;
        // TypeScript requires file name with .ts extension!
        if (fileName.endsWith('.vue.ts')) {
            text = this.parseVueSource(fileName);
        } else {
            text = fse.readFileSync(fileName, 'utf8');
        }

        let version = this.getFileContentHash(text);
        let lastVersion = this.versions[fileName];

        if (version === lastVersion) {
            return false;
        }

        // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/program.ts
        this.sources[fileName] = TypeScript.createSourceFile(fileName, text, this.compilerOptions.target);
        this.versions[fileName] = version;
        return true;
    }

    /**
     * Removes source file from cache.
     * If file is a TypeScript definition file: put into root included files.
     * If file is a Vue single-file component: track, then rename extension.
     * @param fileName 
     */
    private tryDeleteSourceFileCache(fileName: string): boolean {
        if (fileName.endsWith('.d.ts') && this.includeFiles.has(fileName)) {
            this.includeFiles.delete(fileName);
        }

        if (fileName.endsWith('.vue') && this.vueFiles.has(fileName)) {
            this.vueFiles.delete(fileName);
            fileName = fileName + '.ts';
        }

        if (this.sources[fileName]) {
            delete this.sources[fileName];
            delete this.versions[fileName];
            return true;
        }

        return false;
    }

    /**
     * Versions a text-based file content using fast SHA-512 algorithm.
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
    async typeCheck() {
        let rootFiles = Array.from(this.includeFiles);

        // gather all vue files using glob pattern, then append .ts extension to enable type-check!
        // glob scan happens one-time during initial type-check only, and then cached for performance.
        // future file addition / deletion should during watch mode should manipulate vueFiles Set.
        if (this.vueFiles === undefined) {
            this.vueFiles = new Set<string>();
            await new Promise((ok, reject) => {
                glob(this.settings.vueGlobs, (error, files) => {
                    if (error) {
                        reject(error);
                    }
                    for (let file of files) {
                        this.vueFiles.add(file);
                    }
                    ok();
                });
            });
        }

        for (let file of this.vueFiles) {
            rootFiles.push(file + '.ts');
        }
        // console.log(rootFiles);

        let tsc = TypeScript.createProgram(rootFiles, this.compilerOptions, this.host);

        Shout.timed('Type-checking using TypeScript', chalk.yellow(TypeScript.version));
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
                if (errors.length === 1) {
                    Shout.notify(`You have one TypeScript check error!`);
                } else {
                    Shout.notify(`You have ${errors.length} TypeScript check errors!`);
                }

                let errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            }
        } finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished type-checking after', chalk.green(time));
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
     * Tracks all TypeScript files (*.ts and *.tsx) in the project folder recursively.
     * On file creation / change / deletion, the project will be type-checked automatically.
     */
    watch() {
        let debounced: NodeJS.Timer;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.typeCheck().catch(error => {
                    Shout.fatal('during type-checking!', error);
                });
            }, 300);
        };

        chokidar.watch(this.settings.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file: string) => {
                file = upath.toUnix(file);

                this.addOrUpdateSourceFileCache(file);
                Shout.typescript(chalk.grey('tracking new file:', file));
                debounce();
            })
            .on('change', (file: string) => {
                file = upath.toUnix(file);

                let changed = this.addOrUpdateSourceFileCache(file);
                if (changed) {
                    Shout.typescript(chalk.grey('updating file:', file));
                    debounce();
                }
            })
            .on('unlink', (file: string) => {
                file = upath.toUnix(file);

                let deleted = this.tryDeleteSourceFileCache(file);
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