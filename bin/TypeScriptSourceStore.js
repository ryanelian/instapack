"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptSourceStore = void 0;
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
        const s = this.sources.get(sourcePath);
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
    async loadFolder(folder) {
        const tsGlobs = upath.join(folder, '**', '*.ts');
        const tsxGlobs = upath.join(folder, '**', '*.tsx');
        const vueGlobs = upath.join(folder, '**', '*.vue');
        this._typeCheckGlobs.push(tsGlobs, tsxGlobs, vueGlobs);
        const files = await glob(this._typeCheckGlobs);
        const readSources = [];
        for (const file of files) {
            readSources.push(this.loadFile(file));
        }
        await Promise.all(readSources);
    }
    async loadFile(filePath) {
        const raw = await fse.readFile(filePath, 'utf8');
        return this.parseThenStoreSource(filePath, raw);
    }
    loadFileSync(filePath) {
        const raw = fse.readFileSync(filePath, 'utf8');
        return this.parseThenStoreSource(filePath, raw);
    }
    calculateFileVersion(content) {
        const hash = crypto_1.createHash('sha512');
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
        const version = this.calculateFileVersion(raw);
        const previousSource = this.sources.get(sourcePath);
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
        const filePath = this.getFilePath(sourcePath);
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
