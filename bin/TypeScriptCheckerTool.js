"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const chalk_1 = require("chalk");
const chokidar = require("chokidar");
const crypto_1 = require("crypto");
const EventHub_1 = require("./EventHub");
const CompilerUtilities_1 = require("./CompilerUtilities");
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptConfigurationReader_1 = require("./TypeScriptConfigurationReader");
class TypeScriptCheckerTool {
    constructor(settings) {
        this.files = {};
        this.sources = {};
        this.versions = {};
        this.settings = settings;
        let tsconfig = TypeScriptConfigurationReader_1.parseUserTsConfig();
        let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));
        this.includeFiles = new Set(definitions);
        this.includeFiles.add(this.slash(this.settings.jsEntry));
        this.compilerOptions = tsconfig.options;
        this.host = TypeScript.createCompilerHost(tsconfig.options);
        this.host.readFile = (fileName) => {
            if (this.files[fileName]) {
                return this.files[fileName];
            }
            let fileContent = TypeScript.sys.readFile(fileName, 'utf8');
            this.files[fileName] = fileContent;
            this.versions[fileName] = this.getFileContentHash(fileContent);
            return fileContent;
        };
        this.readSourceFile = this.host.getSourceFile;
        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            if (this.sources[fileName]) {
                return this.sources[fileName];
            }
            this.addOrUpdateSourceFileCache(fileName);
            return this.sources[fileName];
        };
    }
    addOrUpdateSourceFileCache(fileName) {
        let source = this.readSourceFile(fileName, this.compilerOptions.target, error => {
            console.error(chalk_1.default.red('Error') + ' when reading SourceFile: ' + fileName);
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
    getFileContentHash(content) {
        let hash = crypto_1.createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }
    typeCheck() {
        let tsc = TypeScript.createProgram(Array.from(this.includeFiles), this.compilerOptions, this.host);
        CompilerUtilities_1.timedLog('Type-checking using TypeScript', chalk_1.default.yellow(TypeScript.version));
        let start = process.hrtime();
        try {
            let errors = [];
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
                console.log(chalk_1.default.green('Types OK') + chalk_1.default.grey(': Successfully checked TypeScript project without errors.'));
            }
            else {
                let errorsOut = '\n' + errors.join('\n\n') + '\n';
                console.error(errorsOut);
            }
        }
        finally {
            let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
            CompilerUtilities_1.timedLog('Finished type-checking after', chalk_1.default.green(time));
            EventHub_1.default.buildDone();
        }
    }
    renderDiagnostics(diagnostics) {
        let errors = diagnostics.map(diagnostic => {
            let error = chalk_1.default.red('TS' + diagnostic.code) + ' ';
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                error += chalk_1.default.red(diagnostic.file.fileName) + ' ' + chalk_1.default.yellow(`(${line + 1},${character + 1})`) + ':\n';
            }
            error += TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            return error;
        });
        return errors;
    }
    slash(fileName) {
        return fileName.replace(/\\/g, '/');
    }
    watch() {
        let ready = false;
        let debounced;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.typeCheck();
            }, 300);
        };
        chokidar.watch(this.settings.tsGlobs)
            .on('add', (file) => {
            file = this.slash(file);
            if (file.endsWith('.d.ts')) {
                this.includeFiles.add(file);
            }
            if (this.sources[file]) {
                return;
            }
            this.addOrUpdateSourceFileCache(file);
            if (!ready) {
                return;
            }
            console.log(chalk_1.default.blue('TypeScript') + chalk_1.default.grey(' tracking new file: ' + file));
            debounce();
        })
            .on('change', (file) => {
            file = this.slash(file);
            let changed = this.addOrUpdateSourceFileCache(file);
            if (changed) {
                console.log(chalk_1.default.blue('TypeScript') + chalk_1.default.grey(' updating file: ' + file));
                debounce();
            }
        })
            .on('unlink', (file) => {
            file = this.slash(file);
            if (file.endsWith('.d.ts')) {
                this.includeFiles.delete(file);
            }
            if (this.sources[file]) {
                console.log(chalk_1.default.blue('TypeScript') + chalk_1.default.grey(' removing file: ' + file));
                delete this.sources[file];
                debounce();
            }
        })
            .on('ready', () => {
            ready = true;
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
