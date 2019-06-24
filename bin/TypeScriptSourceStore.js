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
const upath = require("upath");
const fse = require("fs-extra");
const crypto_1 = require("crypto");
const TypeScript = require("typescript");
const glob = require("fast-glob");
const TypeScriptVueParser_1 = require("./TypeScriptVueParser");
class TypeScriptSourceStore {
    constructor(target) {
        this.sources = new Map();
        this._typeCheckGlobs = [];
        this.target = target;
    }
    get sourcePaths() {
        return Array.from(this.sources.keys());
    }
    getFilePath(sourcePath) {
        let s = this.sources.get(sourcePath);
        if (s) {
            return s.filePath;
        }
        else {
            return sourcePath;
        }
    }
    get typeCheckGlobs() {
        return this._typeCheckGlobs;
    }
    loadFolder(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            let tsGlobs = upath.join(folder, '**', '*.ts');
            let tsxGlobs = upath.join(folder, '**', '*.tsx');
            let vueGlobs = upath.join(folder, '**', '*.vue');
            this._typeCheckGlobs.push(tsGlobs, tsxGlobs, vueGlobs);
            let files = yield glob(this._typeCheckGlobs);
            let readSources = [];
            for (const file of files) {
                readSources.push(this.loadFile(file));
            }
            yield Promise.all(readSources);
        });
    }
    loadFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let raw = yield fse.readFile(filePath, 'utf8');
            return this.parseThenStoreSource(filePath, raw);
        });
    }
    loadFileSync(filePath) {
        let raw = fse.readFileSync(filePath, 'utf8');
        return this.parseThenStoreSource(filePath, raw);
    }
    calculateFileVersion(content) {
        let hash = crypto_1.createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }
    parseThenStoreSource(filePath, raw) {
        filePath = upath.toUnix(filePath);
        let sourcePath = filePath;
        if (filePath.endsWith('.vue')) {
            sourcePath = upath.addExt(filePath, '.ts');
            raw = TypeScriptVueParser_1.parseTypeScriptInVueFile(raw);
        }
        let version = this.calculateFileVersion(raw);
        let previousSource = this.sources.get(sourcePath);
        if (previousSource && previousSource.version === version) {
            return false;
        }
        this.sources.set(sourcePath, {
            filePath: filePath,
            source: TypeScript.createSourceFile(sourcePath, raw, this.target),
            version: version
        });
        return true;
    }
    getSource(sourcePath) {
        const s1 = this.sources.get(sourcePath);
        if (s1) {
            return s1.source;
        }
        let filePath = this.getFilePath(sourcePath);
        this.loadFileSync(filePath);
        const s2 = this.sources.get(sourcePath);
        if (!s2) {
            throw new Error(`Source ${sourcePath} should not be undefined!`);
        }
        return s2.source;
    }
    removeFile(filePath) {
        filePath = upath.toUnix(filePath);
        let sourcePath = filePath;
        if (filePath.endsWith('.vue')) {
            sourcePath = upath.addExt(filePath, '.ts');
        }
        return this.sources.delete(sourcePath);
    }
}
exports.TypeScriptSourceStore = TypeScriptSourceStore;
