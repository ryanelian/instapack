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
const fse = require("fs-extra");
const glob = require("glob");
const crypto_1 = require("crypto");
const TypeScript = require("typescript");
const vueTemplateCompiler = require("vue-template-compiler");
class VirtualSourceStore {
    constructor(tsCompilerOptions) {
        this.raw = {};
        this.sources = {};
        this.versions = {};
        this.virtualToRealFilePaths = {};
        this.includedFilePaths = new Set();
        this.tsCompilerOptions = tsCompilerOptions;
    }
    get entryFilePaths() {
        let a1 = Array.from(this.includedFilePaths);
        let a2 = Object.keys(this.virtualToRealFilePaths);
        return a1.concat(a2);
    }
    getFileContentHash(content) {
        let hash = crypto_1.createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }
    addExoticSources(globPattern) {
        return new Promise((ok, reject) => {
            glob(globPattern, (error, files) => {
                if (error) {
                    reject(error);
                }
                for (let file of files) {
                    this.virtualToRealFilePaths[file + '.ts'] = file;
                }
                ok();
            });
        });
    }
    preloadSources() {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            for (let filePath of this.includedFilePaths) {
                tasks.push(this.addOrUpdateSourceAsync(filePath));
            }
            for (let virtualFilePath in this.virtualToRealFilePaths) {
                let realFilePath = this.virtualToRealFilePaths[virtualFilePath];
                tasks.push(this.addOrUpdateSourceAsync(realFilePath));
            }
            yield Promise.all(tasks);
        });
    }
    getRealFilePath(virtualFilePath) {
        if (this.virtualToRealFilePaths[virtualFilePath]) {
            return this.virtualToRealFilePaths[virtualFilePath];
        }
        return virtualFilePath;
    }
    includeFile(tsfilePath) {
        this.includedFilePaths.add(tsfilePath);
    }
    includeFiles(tsfilePaths) {
        for (let filePath of tsfilePaths) {
            this.includedFilePaths.add(filePath);
        }
    }
    parseVueFile(raw) {
        let parse = vueTemplateCompiler.parseComponent(raw);
        if (!parse.script) {
            return '';
        }
        if (parse.script.lang !== 'ts') {
            return '';
        }
        let charIndex = parse.script.start;
        let newlines = raw.substr(0, charIndex).match(/\r\n|\n|\r/g);
        let code = parse.script.content;
        if (newlines) {
            for (let newline of newlines) {
                code = '//' + newline + code;
            }
        }
        return code;
    }
    parseThenStoreSource(realFilePath, raw) {
        if (realFilePath.endsWith('.d.ts')) {
            this.includedFilePaths.add(realFilePath);
        }
        let virtualFilePath = realFilePath;
        if (virtualFilePath.endsWith('.vue')) {
            virtualFilePath = virtualFilePath + '.ts';
            this.virtualToRealFilePaths[virtualFilePath] = realFilePath;
            raw = this.parseVueFile(raw);
        }
        let version = this.getFileContentHash(raw);
        let lastVersion = this.versions[virtualFilePath];
        if (version === lastVersion) {
            return false;
        }
        this.raw[virtualFilePath] = raw;
        this.sources[virtualFilePath] = TypeScript.createSourceFile(virtualFilePath, raw, this.tsCompilerOptions.target);
        this.versions[virtualFilePath] = version;
        return true;
    }
    addOrUpdateSource(realFilePath) {
        let raw = fse.readFileSync(realFilePath, 'utf8');
        return this.parseThenStoreSource(realFilePath, raw);
    }
    addOrUpdateSourceAsync(realFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let raw = yield fse.readFile(realFilePath, 'utf8');
            return this.parseThenStoreSource(realFilePath, raw);
        });
    }
    getSource(virtualFilePath) {
        if (this.sources[virtualFilePath]) {
            return this.sources[virtualFilePath];
        }
        let realFilePath = this.getRealFilePath(virtualFilePath);
        this.addOrUpdateSource(realFilePath);
        return this.sources[virtualFilePath];
    }
    tryRemoveSource(realFilePath) {
        if (realFilePath.endsWith('.d.ts') && this.includedFilePaths.has(realFilePath)) {
            this.includedFilePaths.delete(realFilePath);
        }
        let virtualFilePath = realFilePath;
        if (virtualFilePath.endsWith('.vue')) {
            virtualFilePath = virtualFilePath + '.ts';
            delete this.virtualToRealFilePaths[virtualFilePath];
        }
        if (this.sources[virtualFilePath]) {
            delete this.raw[virtualFilePath];
            delete this.sources[virtualFilePath];
            delete this.versions[virtualFilePath];
            return true;
        }
        return false;
    }
}
exports.VirtualSourceStore = VirtualSourceStore;
