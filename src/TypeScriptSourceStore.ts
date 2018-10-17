import * as upath from 'upath';
import * as fse from 'fs-extra';
import { createHash } from 'crypto';
import * as TypeScript from 'typescript';
import glob = require('fast-glob');
import { parseTypeScriptInVueFile } from './TypeScriptVueParser';

// Term Definitions:
// Source Path = Virtual File Path, always ends in .ts or .tsx
// File Path = Real / Physical File Path, may end in .vue or other exotic extensions

// How to add new file format / extension:
// 1. add exotic source glob to loadFolder
// 2. add custom extension parse logic to parseThenStoreSource
// 3. add check to delete virtual file path condition

interface ICachedSource {
    filePath: string;
    source: TypeScript.SourceFile;
    version: string;
}

/**
 * An in-memory cache of TypeScript source files.
 */
export class TypeScriptSourceStore {

    /**
     * Gets the cached source.
     */
    private readonly sources: Map<string, ICachedSource> = new Map<string, ICachedSource>();

    /**
     * Gets the parser language target.
     */
    target: TypeScript.ScriptTarget;

    constructor(target: TypeScript.ScriptTarget) {
        this.target = target;
    }

    get sourcePaths() {
        return Array.from(this.sources.keys());
    }

    /**
     * Returns the real file path of a source file path.
     * @param sourcePath 
     */
    getFilePath(sourcePath: string): string {
        let s = this.sources.get(sourcePath);
        if (s) {
            return s.filePath;
        } else {
            return sourcePath;
        }
    }

    private readonly _typeCheckGlobs: string[] = [];

    get typeCheckGlobs() {
        return this._typeCheckGlobs;
    }

    async loadFolder(folder: string) {
        let tsGlobs = upath.join(folder, '**', '*.ts');
        let tsxGlobs = upath.join(folder, '**', '*.tsx');
        let vueGlobs = upath.join(folder, '**', '*.vue');

        this._typeCheckGlobs.push(tsGlobs, tsxGlobs, vueGlobs);
        let files = await glob.async<string>(this._typeCheckGlobs);

        let readSources: Promise<boolean>[] = [];
        for (const file of files) {
            readSources.push(this.loadFile(file));
        }
        await Promise.all(readSources);
    }

    /**
     * Asynchronously read then cache the source file.
     * @param filePath 
     */
    async loadFile(filePath: string): Promise<boolean> {
        let raw = await fse.readFile(filePath, 'utf8');
        // console.log('LOAD ' + filePath);
        return this.parseThenStoreSource(filePath, raw);
    }

    /**
     * Synchronously read then cache the source file.
     * @param filePath 
     */
    loadFileSync(filePath: string): boolean {
        let raw = fse.readFileSync(filePath, 'utf8');
        // console.log('LOAD (sync) ' + filePath);
        return this.parseThenStoreSource(filePath, raw);
    }

    /**
     * Versions a text-based file content using fast SHA-512 algorithm.
     * @param content 
     */
    private calculateFileVersion(content: string): string {
        let hash = createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }

    /**
     * Cache the source file then returns TRUE if the source file was changed.
     * If source file is not standard TypeScript, will be tracked as virtual TypeScript source path.
     * @param filePath 
     * @param raw 
     */
    private parseThenStoreSource(filePath: string, raw: string): boolean {
        filePath = upath.toUnix(filePath);
        let sourcePath = filePath;

        if (filePath.endsWith('.vue')) {
            sourcePath = upath.addExt(filePath, '.ts');
            raw = parseTypeScriptInVueFile(raw);
        }

        let version = this.calculateFileVersion(raw);

        let previousSource = this.sources.get(sourcePath);
        if (previousSource && previousSource.version === version) {
            return false;
        }

        // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/program.ts
        this.sources.set(sourcePath, {
            filePath: filePath,
            source: TypeScript.createSourceFile(sourcePath, raw, this.target),
            version: version
        });
        return true;
    }

    /**
     * Attempts to read source file from cache.
     * If fails, will synchronously read then cache the source file.
     * @param sourcePath 
     */
    getSource(sourcePath: string): TypeScript.SourceFile {
        const s1 = this.sources.get(sourcePath);
        if (s1) {
            // console.log('SOURCE (cache) ' + sourcePath);
            return s1.source;
        }

        let filePath = this.getFilePath(sourcePath);
        this.loadFileSync(filePath);

        // console.log('SOURCE (sync) ' + sourcePath);
        const s2 = this.sources.get(sourcePath);
        if (!s2) {
            throw new Error(`Source ${sourcePath} should not be undefined!`);
        }

        return s2.source;
    }

    /**
     * Remove the source file from cache.
     * @param realFilePath 
     */
    removeFile(filePath: string): boolean {
        filePath = upath.toUnix(filePath);
        let sourcePath = filePath;

        if (filePath.endsWith('.vue')) {
            sourcePath = upath.addExt(filePath, '.ts');
        }

        return this.sources.delete(sourcePath);
    }
}