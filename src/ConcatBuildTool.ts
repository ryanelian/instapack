import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk from 'chalk';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';
let Uglify = require('uglify-js');

import hub from './EventHub';
import { Settings } from './Settings';
import { ICompilerFlags, outputFileThenLog } from './CompilerUtilities';
import { Shout } from './Shout';
import { prettyHrTime } from './PrettyUnits';

let resolver = ResolverFactory.createResolver({
    fileSystem: new NodeJsInputFileSystem(),
    extensions: ['.js']
});

/**
 * A simple key-value pair for UglifyES code input.
 */
interface IConcatFiles {
    [name: string]: string
}

/**
 * Contains methods for concatenating JS files.
 */
export class ConcatBuildTool {

    /**
     * Gets the project settings.
     */
    private readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: ICompilerFlags;

    /**
     * Constructs a new instance of ConcatBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: ICompilerFlags) {
        this.settings = settings
        this.flags = flags;
    }

    /**
     * Attempts to asynchronously resolve a module using node resolution logic, relative to project folder path.
     * @param request 
     */
    resolve(request: string) {
        return new Promise<string>((ok, reject) => {
            resolver.resolve({}, this.settings.root, request, {}, (error: Error, result: string) => {
                if (error) {
                    reject(error);
                } else {
                    // console.log(this.settings.root, '+', request, '=', result);
                    ok(result);
                }
            });
        });
    }

    /**
     * Returns a promise for a concatenated file content as string, resulting from a list of node modules.
     * @param paths 
     */
    async resolveThenReadFiles(paths: string[]) {
        let p1 = paths.map(Q => this.resolve(Q));
        let resolutions = await Promise.all(p1);
        let p2 = resolutions.map(Q => fse.readFile(Q, 'utf8'));
        let contents = await Promise.all(p2);

        let files: IConcatFiles = {};

        for (let i = 0; i < resolutions.length; i++) {
            let key = '/' + upath.relative(this.settings.root, resolutions[i]);
            // console.log(resolutions[i] + ' ' + key);
            files[key] = contents[i];
        }

        return files;
    }

    /**
     * Accepts a file name and a list of files to be concatenated using UglifyES as asynchronous Promise with minify result.
     * @param target 
     * @param files 
     */
    concatFilesAsync(target: string, files: IConcatFiles) {
        let options = {};
        if (!this.flags.production) {
            options['compress'] = false;
            options['mangle'] = false;
            options['output'] = {
                beautify: true
            };
        }
        if (this.flags.sourceMap) {
            options['sourceMap'] = {
                filename: target,
                url: target + '.map',
                root: 'instapack://',
                includeSources: true
            };
        }

        return new Promise<any>((ok, error) => {
            let result = Uglify.minify(files, options);
            if (result.error) {
                error(result.error)
            } else {
                ok(result);
            }
        });
    }

    /**
     * Accepts a file name and a list of node modules relative to the root project path.
     * @param target 
     * @param modules 
     */
    async concatTarget(target: string, modules: string[]) {
        let files = await this.resolveThenReadFiles(modules);
        let result = await this.concatFilesAsync(target, files);

        let outPath = upath.join(this.settings.outputJsFolder, target);
        let p1 = outputFileThenLog(outPath, result.code);
        if (result.map) {
            await outputFileThenLog(outPath + '.map', result.map);
        }
        await p1;
    }

    /**
     * Returns a Promise which resolves when all concatenation tasks have been completed.
     */
    build() {
        let tasks: Promise<void>[] = [];
        let targets = this.settings.concat;

        for (let target in targets) {
            let modules = targets[target];
            if (!modules || modules.length === 0) {
                Shout.warning('concat list for', chalk.blue(target), 'is empty!');
                continue;
            }
            if (typeof modules === 'string') {
                modules = [modules];
                Shout.warning('concat list for', chalk.blue(target),
                    'is a', chalk.yellow('string'),
                    'instead of a', chalk.yellow('string[]')
                );
            }

            let o = target;
            if (o.endsWith('.js') === false) {
                o += '.js';
            }

            let t1 = this.concatTarget(o, modules).catch(error => {
                Shout.error('when concatenating', chalk.blue(o));
                console.error(error);
            });

            let sourceMapPath = upath.join(this.settings.outputJsFolder, o + '.map');
            let t2 = fse.remove(sourceMapPath);

            tasks.push(t1);
            tasks.push(t2);
        }

        return Promise.all(tasks);
    }

    /**
     * Executes build method with a stopwatch wrapper. 
     */
    async buildWithStopwatch() {
        let start = process.hrtime();
        try {
            await this.build();
        }
        finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished JS concat after', chalk.green(time));
            hub.buildDone();
        }
    }
}
