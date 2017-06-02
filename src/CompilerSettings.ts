import * as path from 'path';
import * as gutil from 'gulp-util';
import * as resolve from 'resolve';

/**
 * Dictionary<string, List<string>>
 */
export type ConcatenationLookup = {
    [key: string]: string[]
};

/**
 * Contains properties for setting the project builder class.
 */
export class CompilerSettings {

    /**
     * Gets the project root folder path.
     */
    readonly projectRoot: string;

    /**
     * Gets the root input folder name.
     */
    readonly input: string;

    /**
     * Gets the root output folder name.
     */
    readonly output: string;

    /**
     * Gets the unresolved concatenation map.
     */
    readonly concat: ConcatenationLookup;

    /**
     * Constructs a new instance of CompilerSettings.
     * @param projectRoot 
     * @param input 
     * @param output 
     * @param concat 
     */
    constructor(projectRoot: string, input: string, output: string, concat: ConcatenationLookup) {
        this.projectRoot = projectRoot || process.cwd();
        this.input = input || 'client';
        this.output = output || 'wwwroot';
        this.concat = concat || {};
    }

    /**
     * Gets the number of keys / target files in the concatenation map.
     */
    get concatCount(): number {
        return Object.keys(this.concat).length;
    }

    /**
     * Gets the resolved concatenation map.
     */
    get concatResolution(): ConcatenationLookup {
        let resolver: ConcatenationLookup = {};
        let resolverLength = 0;
        let resolveOption = { basedir: this.projectRoot };

        for (let concatResult in this.concat) {
            let resolverItems: string[] = [];

            let concatItems = this.concat[concatResult];
            for (let i in concatItems) {
                let concatModule = concatItems[i];
                let concatModulePath = resolve.sync(concatModule, resolveOption);
                resolverItems.push(concatModulePath);
            }

            resolverLength++;
            resolver[concatResult + '.js'] = resolverItems;
        }

        return resolver;
    }

    /**
     * Gets the full path to node_modules folder.
     */
    get npmFolder(): string {
        return path.join(this.projectRoot, 'node_modules');
    }

    /**
     * Gets the full path to bower_components folder.
     */
    get bowerFolder(): string {
        return path.join(this.projectRoot, 'bower_components');
    }

    /**
     * Gets the full path to the root input folder.
     */
    get inputFolder(): string {
        return path.join(this.projectRoot, this.input);
    }

    /**
     * Gets the full path to the index.ts entry point.
     */
    get jsEntry(): string {
        return path.join(this.inputFolder, 'js', 'index.ts');
    }

    /**
     * Gets the full path to the site.scss entry point.
     */
    get cssEntry(): string {
        return path.join(this.inputFolder, 'css', 'site.scss');
    }

    /**
     * Gets the glob pattern for watching changes of Sass source code files. 
     */
    get cssWatchGlob(): string {
        return path.join(this.inputFolder, 'css', '**', '*.scss');
    }

    /**
     * Gets the full path to the root output folder.
     */
    get outputFolder(): string {
        return path.join(this.projectRoot, this.output);
    }

    /**
     * Gets the full path to the JavaScript compilation and concatenation output folder.
     */
    get outputJsFolder(): string {
        return path.join(this.outputFolder, 'js');
    }

    /**
     * Gets the full path to the CSS compilation and concatenation output folder.
     */
    get outputCssFolder(): string {
        return path.join(this.outputFolder, 'css');
    }

    /**
     * Attempts to read the settings from package.json in the same folder where the command line is invoked at.
     */
    static tryRead(): CompilerSettings {
        let folder = process.cwd();
        let json = path.join(folder, 'package.json');
        let parse: any;

        try {
            gutil.log('Reading settings from', gutil.colors.cyan(json + ':instapack'));
            parse = require(json).instapack;
        } catch (ex) {
            gutil.log('Failed to read settings. Using default settings.');
        }

        if (!parse) {
            parse = {};
        }

        let settings = new CompilerSettings(folder, parse.input, parse.output, parse.concat);
        gutil.log('Using output folder', gutil.colors.cyan(settings.outputFolder));
        return settings;
    }
}
