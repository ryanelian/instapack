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

/**
 * An in-memory cache of TypeScript source files.
 */
export class TypeScriptSourceStore {
    /**
     * Gets the lookup from TypeScript source file path to real / physical file path.
     */
    private readonly sourceToFilePaths: Map<string, string> = new Map<string, string>();

    /**
     * Gets the cached source.
     */
    private readonly sources: IMapLike<TypeScript.SourceFile | undefined> = {};

    /**
     * Gets the cached source version.
     */
    private readonly sourceVersions: IMapLike<string | undefined> = {};

    /**
     * Gets the parser language target.
     */
    target: TypeScript.ScriptTarget;

    constructor(target: TypeScript.ScriptTarget) {
        this.target = target;
    }

    get sourcePaths() {
        return Array.from(this.sourceToFilePaths.keys());
    }

    /**
     * Returns the real file path of a source file path.
     * @param sourcePath 
     */
    getFilePath(sourcePath: string): string {
        return this.sourceToFilePaths.get(sourcePath) || sourcePath;
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
    private versionSource(content: string): string {
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

        let version = this.versionSource(raw);
        let lastVersion = this.sourceVersions[sourcePath];
        if (version === lastVersion) {
            return false;
        }

        // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/program.ts
        this.sourceToFilePaths.set(sourcePath, filePath);
        this.sources[sourcePath] = TypeScript.createSourceFile(sourcePath, raw, this.target);
        this.sourceVersions[sourcePath] = version;
        return true;
    }

    /**
     * Attempts to read source file from cache.
     * If fails, will synchronously read then cache the source file.
     * @param sourcePath 
     */
    getSource(sourcePath: string): TypeScript.SourceFile {
        const s = this.sources[sourcePath];
        if (s) {
            // console.log('SOURCE (cache) ' + sourcePath);
            return s;
        }

        let filePath = this.getFilePath(sourcePath);
        this.loadFileSync(filePath);

        // console.log('SOURCE (sync) ' + sourcePath);
        const r = this.sources[sourcePath];
        if (!r) {
            throw new Error(`Source ${sourcePath} should not be undefined!`);
        }

        return r;
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

        this.sourceToFilePaths.delete(sourcePath);

        if (this.sources[sourcePath]) {
            this.sources[sourcePath] = undefined;
            this.sourceVersions[sourcePath] = undefined;
            return true;
        }

        return false;
    }
}