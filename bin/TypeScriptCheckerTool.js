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
const glob = require("glob");
const templateCompiler = require("vue-template-compiler");
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
            let fileContent = fse.readFileSync(fileName, 'utf8');
            this.files[fileName] = fileContent;
            this.versions[fileName] = this.getFileContentHash(fileContent);
            return fileContent;
        };
        this.host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            if (this.sources[fileName]) {
                return this.sources[fileName];
            }
            this.addOrUpdateSourceFileCache(fileName);
            return this.sources[fileName];
        };
    }
    parseVueSource(fileName) {
        let redirect = upath.removeExt(fileName, '.ts');
        let vue = fse.readFileSync(redirect, 'utf8');
        let parse = templateCompiler.parseComponent(vue);
        if (!parse.script) {
            return '';
        }
        if (parse.script.lang !== 'ts') {
            return '';
        }
        return parse.script.content.trim();
    }
    addOrUpdateSourceFileCache(fileName) {
        if (fileName.endsWith('.d.ts')) {
            this.includeFiles.add(fileName);
        }
        if (fileName.endsWith('.vue')) {
            this.vueFiles.add(fileName);
            fileName = fileName + '.ts';
        }
        let text;
        if (fileName.endsWith('.vue.ts')) {
            text = this.parseVueSource(fileName);
        }
        else {
            text = fse.readFileSync(fileName, 'utf8');
        }
        let version = this.getFileContentHash(text);
        let lastVersion = this.versions[fileName];
        if (version === lastVersion) {
            return false;
        }
        this.sources[fileName] = TypeScript.createSourceFile(fileName, text, this.compilerOptions.target);
        this.versions[fileName] = version;
        return true;
    }
    tryDeleteSourceFileCache(fileName) {
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
    getFileContentHash(content) {
        let hash = crypto_1.createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }
    typeCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            let rootFiles = Array.from(this.includeFiles);
            if (this.vueFiles === undefined) {
                this.vueFiles = new Set();
                yield new Promise((ok, reject) => {
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
            let tsc = TypeScript.createProgram(rootFiles, this.compilerOptions, this.host);
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
                    if (errors.length === 1) {
                        Shout_1.Shout.notify(`You have one TypeScript check error!`);
                    }
                    else {
                        Shout_1.Shout.notify(`You have ${errors.length} TypeScript check errors!`);
                    }
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
                this.typeCheck().catch(error => {
                    Shout_1.Shout.fatal('during type-checking!', error);
                });
            }, 300);
        };
        chokidar.watch(this.settings.typeCheckGlobs, {
            ignoreInitial: true
        })
            .on('add', (file) => {
            file = upath.toUnix(file);
            this.addOrUpdateSourceFileCache(file);
            Shout_1.Shout.typescript(chalk_1.default.grey('tracking new file:', file));
            debounce();
        })
            .on('change', (file) => {
            file = upath.toUnix(file);
            let changed = this.addOrUpdateSourceFileCache(file);
            if (changed) {
                Shout_1.Shout.typescript(chalk_1.default.grey('updating file:', file));
                debounce();
            }
        })
            .on('unlink', (file) => {
            file = upath.toUnix(file);
            let deleted = this.tryDeleteSourceFileCache(file);
            if (deleted) {
                Shout_1.Shout.typescript(chalk_1.default.grey('removing file:', file));
                debounce();
            }
        });
    }
}
exports.TypeScriptCheckerTool = TypeScriptCheckerTool;
