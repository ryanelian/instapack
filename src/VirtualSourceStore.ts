import * as fse from 'fs-extra';
import * as glob from 'glob';
import { createHash } from 'crypto';
import * as TypeScript from 'typescript';
import * as vueTemplateCompiler from 'vue-template-compiler';

/**
 * Contains virtual and cached source code for TypeScript project.
 */
export class VirtualSourceStore {
    /**
     * Gets the lookup from virtual source file path to TypeScript source file.
     */
    private readonly sources: IMapLike<TypeScript.SourceFile> = {};

    /**
     * Gets the lookup from virtual source file path to file content hash.
     */
    private readonly versions: IMapLike<string> = {};

    /**
     * Gets the lookup from virtual source file path to real file path for exotic (non-TypeScript) sources.
     */
    private readonly virtualToRealFilePaths: IMapLike<string> = {};

    /**
     * Gets the collection of TypeScript file paths to be used as program entry points.
     * (i.e. index module and declaration files)
     */
    private readonly includedFilePaths = new Set<string>();

    /**
     * Gets the injected TypeScript compiler options.
     */
    private readonly tsCompilerOptions: TypeScript.CompilerOptions;

    /**
     * Constructs a Virtual TypeScript Source Store using TypeScript compiler options as parameter.
     * @param tsCompilerOptions 
     */
    constructor(tsCompilerOptions: TypeScript.CompilerOptions) {
        this.tsCompilerOptions = tsCompilerOptions;
    }

    /**
     * Gets TypeScript program entry points, which consists of index module, declaration files, and exotic / non-TypeScript virtual modules.
     */
    get entryFilePaths(): string[] {
        let a1 = Array.from(this.includedFilePaths);
        let a2 = Object.keys(this.virtualToRealFilePaths);

        return a1.concat(a2);
    }

    /**
     * Versions a text-based file content using fast SHA-512 algorithm.
     * @param content 
     */
    private getFileContentHash(content: string): string {
        let hash = createHash('sha512');
        hash.update(content);
        return hash.digest('hex');
    }

    /**
     * Scan file system using non-TypeScript source glob to be tracked as virtual file.
     * @param globPattern 
     */
    addExoticSources(globPattern: string): Promise<void> {
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

    /**
     * Warm up source file cache using known entry files in parallel.
     */
    async preloadSources(): Promise<void> {
        let tasks: Promise<any>[] = [];
        // console.log(this.includedFilePaths);
        // console.log(this.virtualToRealFilePaths);

        for (let filePath of this.includedFilePaths) {
            tasks.push(this.addOrUpdateSourceAsync(filePath));
        }

        for (let virtualFilePath in this.virtualToRealFilePaths) {
            let realFilePath = this.virtualToRealFilePaths[virtualFilePath];
            tasks.push(this.addOrUpdateSourceAsync(realFilePath));
        }

        await Promise.all(tasks);
    }

    /**
     * Returns the real file path of given virtual file path.
     * @param virtualFilePath 
     */
    getRealFilePath(virtualFilePath: string): string {
        if (this.virtualToRealFilePaths[virtualFilePath]) {
            return this.virtualToRealFilePaths[virtualFilePath];
        }

        return virtualFilePath;
    }

    /**
     * Add a TypeScript file path to initially included file paths.
     * @param tsfilePath 
     */
    includeFile(tsfilePath: string): void {
        this.includedFilePaths.add(tsfilePath);
    }

    /**
     * Add multiple TypeScript file paths to initially included file paths.
     * @param tsfilePaths 
     */
    includeFiles(tsfilePaths: string[]): void {
        for (let filePath of tsfilePaths) {
            this.includedFilePaths.add(filePath);
        }
    }

    /**
     * The logic for extracting TypeScript code block from Vue Single-File Component.
     * @param raw 
     */
    private parseVueFile(raw: string): string {
        let parse = vueTemplateCompiler.parseComponent(raw);

        if (!parse.script) {
            return '';
        }

        if (parse.script.lang !== 'ts') {
            return '';
        }

        let charIndex: number = parse.script.start;
        let newlines = raw.substr(0, charIndex).match(/\r\n|\n|\r/g);
        let code: string = parse.script.content;

        if (newlines) {
            for (let newline of newlines) {
                code = '//' + newline + code;
            }
        }

        // console.log(code);
        return code;
    }

    /**
     * Cache the source file then returns TRUE if the source file was changed.
     * If source file is not standard TypeScript, will be parsed and cached as virtual TypeScript source file.
     * @param realFilePath 
     * @param raw 
     */
    private parseThenStoreSource(realFilePath: string, raw: string): boolean {
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

        // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/program.ts
        this.sources[virtualFilePath] = TypeScript.createSourceFile(virtualFilePath, raw, this.tsCompilerOptions.target);
        this.versions[virtualFilePath] = version;
        return true;
    }

    /**
     * Synchronously read then cache the source file.
     * @param realFilePath 
     */
    addOrUpdateSource(realFilePath: string): boolean {
        let raw = fse.readFileSync(realFilePath, 'utf8');
        return this.parseThenStoreSource(realFilePath, raw);
    }

    /**
     * Asynchronously read then cache the source file.
     * @param realFilePath 
     */
    async addOrUpdateSourceAsync(realFilePath: string): Promise<boolean> {
        let raw = await fse.readFile(realFilePath, 'utf8');
        // console.log('SOURCE (async) ' + realFilePath);
        return this.parseThenStoreSource(realFilePath, raw);
    }

    /**
     * Attempts to read source file from cache.
     * If fails, will synchronously read then cache the source file.
     * @param virtualFilePath 
     */
    getSource(virtualFilePath: string): TypeScript.SourceFile {
        if (this.sources[virtualFilePath]) {
            // console.log('SOURCE (cache) ' + virtualFilePath);
            return this.sources[virtualFilePath];
        }

        let realFilePath = this.getRealFilePath(virtualFilePath);
        this.addOrUpdateSource(realFilePath);

        // console.log('SOURCE (sync) ' + virtualFilePath);
        return this.sources[virtualFilePath];
    }

    /**
     * Remove the source file from cache.
     * If non-TypeScript source, attempts to untrack the virtual source file as well.  
     * @param realFilePath 
     */
    tryRemoveSource(realFilePath: string): boolean {
        if (realFilePath.endsWith('.d.ts') && this.includedFilePaths.has(realFilePath)) {
            this.includedFilePaths.delete(realFilePath);
        }

        let virtualFilePath = realFilePath;
        if (virtualFilePath.endsWith('.vue')) {
            virtualFilePath = virtualFilePath + '.ts';
            delete this.virtualToRealFilePaths[virtualFilePath];
        }

        if (this.sources[virtualFilePath]) {
            delete this.sources[virtualFilePath];
            delete this.versions[virtualFilePath];
            return true;
        }

        return false;
    }
}
