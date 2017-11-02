"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const chalk_1 = require("chalk");
const chokidar = require("chokidar");
const path = require("path");
const EventHub_1 = require("./EventHub");
const CompilerUtilities_1 = require("./CompilerUtilities");
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptConfigurationReader_1 = require("./TypeScriptConfigurationReader");
class TypeScriptCheckerTool {
    constructor(settings, flags) {
        this.files = {};
        this.settings = settings;
        this.flags = flags;
        this.service = this.createLanguageService();
    }
    get fileNames() {
        return Object.keys(this.files);
    }
    createLanguageService() {
        let tsconfig = TypeScriptConfigurationReader_1.parseUserTsConfig();
        let tsc = TypeScript.createProgram(tsconfig.fileNames, tsconfig.options);
        let fileNames = tsc.getSourceFiles().map(Q => Q.fileName);
        for (let fileName of fileNames) {
            this.files[fileName] = {
                version: 0
            };
        }
        let host = {
            getScriptFileNames: () => this.fileNames,
            getScriptVersion: (fileName) => this.files[fileName] && this.files[fileName].version.toString(),
            getScriptSnapshot: (fileName) => {
                if (!TypeScript.sys.fileExists(fileName)) {
                    return undefined;
                }
                let fileContent = TypeScript.sys.readFile(fileName, 'utf8');
                return TypeScript.ScriptSnapshot.fromString(fileContent);
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
    atFile(file) {
        let s = path.normalize(file.fileName);
        s = CompilerUtilities_1.convertAbsoluteToSourceMapPath(this.settings.root, s);
        return chalk_1.default.red('@' + s);
    }
    outputDiagnostics(diagnostics) {
        let errors = diagnostics.map(diagnostic => {
            let error = '\n' + chalk_1.default.red('Type Error') + ' ';
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += this.atFile(diagnostic.file) + ' ' + chalk_1.default.yellow(`(${line + 1},${character + 1})`) + ': ';
            }
            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });
        for (let error of errors) {
            console.error(error);
        }
    }
    checkAll() {
        CompilerUtilities_1.timedLog('Type-checking using TypeScript', chalk_1.default.yellow(TypeScript.version));
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
                console.log(chalk_1.default.green('Types OK') + chalk_1.default.grey(': All TypeScript files are successfully checked without errors.'));
            }
            else {
                console.log();
            }
        }
        finally {
            let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
            CompilerUtilities_1.timedLog('Finished type-checking after', chalk_1.default.green(time));
            EventHub_1.default.buildDone();
        }
    }
    slash(fileName) {
        return fileName.replace(/\\/g, '/');
    }
    watch() {
        let delayed;
        chokidar.watch(this.settings.tsGlobs)
            .on('add', path => {
            path = this.slash(path);
            if (!this.files[path]) {
                this.files[path] = {
                    version: 0
                };
                CompilerUtilities_1.timedLog('Tracking new file in Type-Checker: ' + path);
                clearTimeout(delayed);
                delayed = setTimeout(() => {
                    this.checkAll();
                }, 300);
            }
        })
            .on('change', path => {
            path = this.slash(path);
            if (this.files[path]) {
                this.files[path].version++;
                clearTimeout(delayed);
                delayed = setTimeout(() => {
                    this.checkAll();
                }, 300);
            }
        })
            .on('unlink', path => {
            path = this.slash(path);
            if (this.files[path]) {
                delete this.files[path];
                clearTimeout(delayed);
                delayed = setTimeout(() => {
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
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
