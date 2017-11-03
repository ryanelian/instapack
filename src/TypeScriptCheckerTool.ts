import * as TypeScript from 'typescript';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { createHash, Hash } from 'crypto';

import hub from './EventHub';
import { Settings } from './Settings';
import { timedLog, CompilerFlags, convertAbsoluteToSourceMapPath } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { parseUserTsConfig } from './TypeScriptConfigurationReader';

interface FileVersion {
    version: string;
    content: string;
}

interface FileVersionStore {
    [fileName: string]: FileVersion
}

export class TypeScriptCheckerTool {
    settings: Settings;
    flags: CompilerFlags;

    files: FileVersionStore = {};
    service: TypeScript.LanguageService;

    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings;
        this.flags = flags
        this.service = this.createLanguageService();
    }

    get fileNames() {
        return Object.keys(this.files);
    }

    createLanguageService() {
        let tsconfig = parseUserTsConfig();

        let tsc = TypeScript.createProgram(tsconfig.fileNames, tsconfig.options);
        let fileNames = tsc.getSourceFiles().map(Q => Q.fileName);

        for (let fileName of fileNames) {
            this.addOrUpdateFile(fileName);
        }

        let host: TypeScript.LanguageServiceHost = {
            getScriptFileNames: () => this.fileNames,
            getScriptVersion: (fileName) => this.files[fileName] && this.files[fileName].version,
            getScriptSnapshot: (fileName) => {
                let file = this.files[fileName];
                if (!file) {
                    return undefined;
                }
                return TypeScript.ScriptSnapshot.fromString(file.content);
            },
            getCurrentDirectory: () => process.cwd(),
            getCompilationSettings: () => tsconfig.options,
            getDefaultLibFileName: (options) => TypeScript.getDefaultLibFilePath(options),
            fileExists: TypeScript.sys.fileExists,
            readFile: TypeScript.sys.readFile,
            readDirectory: TypeScript.sys.readDirectory,
        };

        return TypeScript.createLanguageService(host, TypeScript.createDocumentRegistry());
    }

    private atFile(file: TypeScript.SourceFile) {
        let s = path.normalize(file.fileName);
        s = convertAbsoluteToSourceMapPath(this.settings.root, s);
        return chalk.red('@' + s);
    }

    outputDiagnostics(diagnostics: TypeScript.Diagnostic[]) {
        let errors = diagnostics.map(diagnostic => {
            let error = '\n' + chalk.red('Type Error') + ' ';

            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                error += this.atFile(diagnostic.file) + ' ' + chalk.yellow(`(${line + 1},${character + 1})`) + ': ';
            }

            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });

        for (let error of errors) {
            console.error(error);
        }
    }

    checkAll() {
        timedLog('Type-checking using TypeScript', chalk.yellow(TypeScript.version));
        let start = process.hrtime();

        try {
            let errorCount = 0;
            for (let fileName of this.fileNames) {
                if (fileName.endsWith('.d.ts')) {
                    continue;
                }

                let diagnostics = this.service.getSemanticDiagnostics(fileName)
                    .concat(this.service.getSyntacticDiagnostics(fileName));

                this.outputDiagnostics(diagnostics);
                errorCount += diagnostics.length;
            }
            if (!errorCount) {
                console.log(chalk.green('Types OK') + chalk.grey(': All TypeScript files are successfully checked without errors.'));
            } else {
                console.log();
            }
        } finally {
            let time = prettyHrTime(process.hrtime(start));
            timedLog('Finished type-checking after', chalk.green(time));
            hub.buildDone();
        }
    }

    private slash(fileName: string) {
        return fileName.replace(/\\/g, '/');
    }

    private addOrUpdateFile(fileName: string) {
        let hash = createHash('sha256');

        let content = TypeScript.sys.readFile(fileName, 'utf8');
        hash.update(content);
        let version = hash.digest('hex');

        this.files[fileName] = {
            content: content,
            version: version
        };
    }

    watch() {
        let debounced: NodeJS.Timer;

        chokidar.watch(this.settings.tsGlobs)
            .on('add', fileName => {
                fileName = this.slash(fileName);
                if (!this.files[fileName]) {
                    console.log(chalk.blue('Type-Checker') + chalk.grey(' tracking new file: ' + fileName));
                    this.addOrUpdateFile(fileName);

                    clearTimeout(debounced);
                    debounced = setTimeout(() => {
                        this.checkAll();
                    }, 300);
                }
            })
            .on('change', fileName => {
                fileName = this.slash(fileName);
                if (this.files[fileName]) {
                    console.log(chalk.blue('Type-Checker') + chalk.grey(' updating file: ' + fileName));
                    this.addOrUpdateFile(fileName);

                    clearTimeout(debounced);
                    debounced = setTimeout(() => {
                        this.checkAll();
                    }, 300);
                }
            })
            .on('unlink', fileName => {
                fileName = this.slash(fileName);
                if (this.files[fileName]) {
                    console.log(chalk.blue('Type-Checker') + chalk.grey(' removing file: ' + fileName));
                    delete this.files[fileName];

                    clearTimeout(debounced);
                    debounced = setTimeout(() => {
                        this.checkAll();
                    }, 300);
                }
            });
    }

    run() {
        this.checkAll();

        if (this.flags.watch) {
            this.watch();
        }
    }
}