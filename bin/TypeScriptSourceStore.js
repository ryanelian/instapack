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
        this.sourceToFilePaths = new Map();
        this.sources = {};
        this.sourceVersions = {};
        this._typeCheckGlobs = [];
        this.target = target;
    }
    get sourcePaths() {
        return Array.from(this.sourceToFilePaths.keys());
    }
    getFilePath(sourcePath) {
        return this.sourceToFilePaths.get(sourcePath) || sourcePath;
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
            let files = yield glob.async(this._typeCheckGlobs);
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
    versionSource(content) {
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
        let version = this.versionSource(raw);
        let lastVersion = this.sourceVersions[sourcePath];
        if (version === lastVersion) {
            return false;
        }
        this.sourceToFilePaths.set(sourcePath, filePath);
        this.sources[sourcePath] = TypeScript.createSourceFile(sourcePath, raw, this.target);
        this.sourceVersions[sourcePath] = version;
        return true;
    }
    getSource(sourcePath) {
        const s = this.sources[sourcePath];
        if (s) {
            return s;
        }
        let filePath = this.getFilePath(sourcePath);
        this.loadFileSync(filePath);
        const r = this.sources[sourcePath];
        if (!r) {
            throw new Error(`Source ${sourcePath} should not be undefined!`);
        }
        return r;
    }
    removeFile(filePath) {
        filePath = upath.toUnix(filePath);
        let sourcePath = filePath;
        if (filePath.endsWith('.vue')) {
            sourcePath = upath.addExt(filePath, '.ts');
        }
        this.sourceToFilePaths.delete(sourcePath);
        if (this.sources[sourcePath]) {
            this.sources[sourcePath] = undefined;
            this.sourceVersions[sourcePath] = undefined;
            return true;
        }
        return false;
    }
}
exports.TypeScriptSourceStore = TypeScriptSourceStore;
