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
const VueTemplateCompiler = require("vue-template-compiler");
class VirtualSourceStore {
    constructor(tsCompilerOptions) {
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
                if (!realFilePath) {
                    throw new Error('Unexpected undefined value when iterating virtual-to-real file paths!');
                }
                tasks.push(this.addOrUpdateSourceAsync(realFilePath));
            }
            yield Promise.all(tasks);
        });
    }
    getRealFilePath(virtualFilePath) {
        let p = this.virtualToRealFilePaths[virtualFilePath];
        if (p) {
            return p;
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
        let parse = VueTemplateCompiler.parseComponent(raw);
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
        let target = this.tsCompilerOptions.target || TypeScript.ScriptTarget.ES5;
        this.sources[virtualFilePath] = TypeScript.createSourceFile(virtualFilePath, raw, target);
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
        let s = this.sources[virtualFilePath];
        if (s) {
            return s;
        }
        let realFilePath = this.getRealFilePath(virtualFilePath);
        this.addOrUpdateSource(realFilePath);
        s = this.sources[virtualFilePath];
        if (!s) {
            throw new Error(`Source ${virtualFilePath} was updated but is undefined!`);
        }
        return s;
    }
    tryRemoveSource(realFilePath) {
        if (realFilePath.endsWith('.d.ts') && this.includedFilePaths.has(realFilePath)) {
            this.includedFilePaths.delete(realFilePath);
        }
        let virtualFilePath = realFilePath;
        if (virtualFilePath.endsWith('.vue')) {
            virtualFilePath = virtualFilePath + '.ts';
            this.virtualToRealFilePaths[virtualFilePath] = undefined;
        }
        if (this.sources[virtualFilePath]) {
            this.sources[virtualFilePath] = undefined;
            this.versions[virtualFilePath] = undefined;
            return true;
        }
        return false;
    }
}
exports.VirtualSourceStore = VirtualSourceStore;
