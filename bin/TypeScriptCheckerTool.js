"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const chalk_1 = require("chalk");
const fse = require("fs-extra");
const upath = require("upath");
const chokidar = require("chokidar");
const crypto_1 = require("crypto");
const EventHub_1 = require("./EventHub");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
class TypeScriptCheckerTool {
    constructor(settings) {
        this.files = {};
        this.sources = {};
        this.versions = {};
        this.settings = settings;
        let tsconfig = settings.readTsConfig();
        let definitions = tsconfig.fileNames.filter(Q => Q.endsWith('.d.ts'));
        this.includeFiles = new Set(definitions);
        this.includeFiles.add(this.settings.jsEntry);
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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let checks = Array.from(this.includeFiles).map(file => {
                    return fse.pathExists(file).then(exist => {
                        if (!exist) {
                            console.error(chalk_1.default.red('FATAL ERROR') + ' during type-check, included file not found: ' + chalk_1.default.grey(file));
                            throw new Error('File not found: ' + file);
                        }
                    });
                });
                yield Promise.all(checks);
            }
            catch (_a) {
                return;
            }
            let tsc = TypeScript.createProgram(Array.from(this.includeFiles), this.compilerOptions, this.host);
            Shout_1.Shout.timed('Type-checking using TypeScript', chalk_1.default.yellow(TypeScript.version));
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
                Shout_1.Shout.timed('Finished type-checking after', chalk_1.default.green(time));
                EventHub_1.default.buildDone();
            }
        });
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
    watch() {
        let debounced;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.typeCheck();
            }, 300);
        };
        chokidar.watch(this.settings.tsGlobs, {
            ignoreInitial: true
        })
            .on('add', (file) => {
            file = upath.toUnix(file);
            if (file.endsWith('.d.ts')) {
                this.includeFiles.add(file);
            }
            this.addOrUpdateSourceFileCache(file);
            console.log(chalk_1.default.blue('TypeScript') + chalk_1.default.grey(' tracking new file: ' + file));
            debounce();
        })
            .on('change', (file) => {
            file = upath.toUnix(file);
            let changed = this.addOrUpdateSourceFileCache(file);
            if (changed) {
                console.log(chalk_1.default.blue('TypeScript') + chalk_1.default.grey(' updating file: ' + file));
                debounce();
            }
        })
            .on('unlink', (file) => {
            file = upath.toUnix(file);
            if (file.endsWith('.d.ts') && this.includeFiles.has(file)) {
                this.includeFiles.delete(file);
            }
            console.log(chalk_1.default.blue('TypeScript') + chalk_1.default.grey(' removing file: ' + file));
            if (this.sources[file]) {
                delete this.sources[file];
                delete this.versions[file];
                debounce();
            }
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
