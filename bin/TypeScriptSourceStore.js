"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptSourceStore = void 0;
const upath = require("upath");
const fse = require("fs-extra");
const crypto_1 = require("crypto");
const TypeScript = require("typescript");
const glob = require("fast-glob");
const Shout_1 = require("./Shout");
class TypeScriptSourceStore {
    constructor(target, tsVueParser) {
        this.sources = new Map();
        this._typeCheckGlobs = [];
        this.target = target;
        this.tsVueParser = tsVueParser;
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
        const hash = crypto_1.createHash('sha256');
        hash.update(content);
        return hash.digest('hex');
    }
    parseThenStoreSource(filePath, sourceCode) {
        filePath = upath.toUnix(filePath);
        let sourcePath = filePath;
        if (filePath.endsWith('.vue')) {
            sourcePath = upath.addExt(filePath, '.ts');
            if (this.tsVueParser) {
                sourceCode = this.tsVueParser.parse(sourceCode);
            }
            else {
                Shout_1.Shout.warning('Vue-TypeScript parser is not loaded!');
            }
        }
        const version = this.calculateFileVersion(sourceCode);
        const previousSource = this.sources.get(sourcePath);
        if (previousSource && previousSource.version === version) {
            return false;
        }
        this.sources.set(sourcePath, {
            filePath: filePath,
            source: TypeScript.createSourceFile(sourcePath, sourceCode, this.target),
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
