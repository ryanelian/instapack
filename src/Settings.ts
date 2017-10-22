import * as path from 'path';
import * as chalk from 'chalk';

/**
 * Dictionary<string, List<string>>
 */
export interface ConcatLookup {
    [key: string]: string[]
}

/**
 * Dictionary<string, string>
 */
export interface ModuleOverrides {
    [key: string]: string
}

/**
 * Values required to construct an instapack Settings object.
 */
export class SettingsCore {
    input: string;
    output: string;
    concat: ConcatLookup;
    alias: ModuleOverrides;
    externals: ModuleOverrides
    template: string;
    jsOut: string;
    cssOut: string;
}

/**
 * Contains properties for setting the project builder class.
 */
export class Settings {
    /**
     * Gets the project root folder path.
     */
    readonly root: string;

    /**
     * Gets the root input folder name.
     */
    readonly input: string;

    /**
     * Gets the root output folder name.
     */
    readonly output: string;

    /**
     * Gets the unresolved concat map.
     */
    readonly concat: ConcatLookup;

    /**
     * Replaces dependency imports to another dependency. For example: {'vue': 'vue/dist/vue.common'}
     */
    readonly alias: ModuleOverrides;

    /**
     * Rewrites dependency imports to a window object. For example: {'jquery': '$'}
     */
    readonly externals: ModuleOverrides;

    /**
     * Gets the template compilation mode.
     */
    readonly template: string;

    /**
     * Gets the JS output file name.
     */
    readonly jsOut: string;

    /**
     * Gets the CSS output file name.
     */
    readonly cssOut: string;

    /**
     * Constructs a new instance of Settings using a root folder and an setting object parsed from package.json.
     * @param root 
     * @param settings 
     */
    constructor(root: string, settings: SettingsCore) {
        this.root = root || process.cwd();
        this.input = settings.input || 'client';
        this.output = settings.output || 'wwwroot';
        this.concat = settings.concat || {};
        this.alias = settings.alias || {};
        this.externals = settings.externals || {};
        this.template = settings.template || 'string';

        this.jsOut = settings.jsOut || 'ipack.js';
        if (this.jsOut.endsWith('.js') === false) {
            this.jsOut += '.js';
        }

        this.cssOut = settings.cssOut || 'ipack.css';
        if (this.cssOut.endsWith('.css') === false) {
            this.cssOut += '.css';
        }
    }

    /**
     * Gets the number of keys / target files in the concat map.
     */
    get concatCount(): number {
        return Object.keys(this.concat).length;
    }

    /**
     * Gets the full path to package.json file.
     */
    get packageJson(): string {
        return path.join(this.root, 'package.json');
    }

    /**
     * Gets the full path to node_modules folder.
     */
    get npmFolder(): string {
        return path.join(this.root, 'node_modules');
    }

    /**
     * Gets the full path to bower_components folder.
     */
    get bowerFolder(): string {
        return path.join(this.root, 'bower_components');
    }

    /**
     * Gets the full path to the root client project folder.
     */
    get inputFolder(): string {
        return path.join(this.root, this.input);
    }

    /**
     * Gets the full path to the root JS project folder.
     */
    get inputJsFolder(): string {
        return path.join(this.inputFolder, 'js');
    }

    /**
     * Gets the full path to the root CSS project folder.
     */
    get inputCssFolder(): string {
        return path.join(this.inputFolder, 'css');
    }

    /**
     * Gets the full path to the TypeScript project entry point.
     */
    get jsEntry(): string {
        return path.join(this.inputJsFolder, 'index.ts');
    }

    /**
     * Gets the full path to the Sass project entry point.
     */
    get cssEntry(): string {
        return path.join(this.inputCssFolder, 'index.scss');
    }

    /**
     * Gets the glob pattern for watching changes of Sass source code files. 
     */
    get scssGlob(): string {
        return path.join(this.inputCssFolder, '**', '*.scss');
    }

    /**
     * Gets the full path to the root output folder.
     */
    get outputFolder(): string {
        return path.join(this.root, this.output);
    }

    /**
     * Gets the full path to the JavaScript compilation and concat output folder.
     */
    get outputJsFolder(): string {
        return path.join(this.outputFolder, 'js');
    }

    /**
     * Gets the full path to the JS compilation output file.
     */
    get outputJsFile(): string {
        return path.join(this.outputJsFolder, this.jsOut);
    }

    /**
     * Gets the full path to the JS compilation output source map.
     */
    get outputJsSourceMap(): string {
        return this.outputJsFile + '.map';
    }

    /**
     * Gets the full path to the CSS compilation and concat output folder.
     */
    get outputCssFolder(): string {
        return path.join(this.outputFolder, 'css');
    }

    /**
     * Gets the full path to the CSS compilation output file.
     */
    get outputCssFile(): string {
        return path.join(this.outputCssFolder, this.cssOut);
    }

    /**
     * Gets the full path to the CSS compilation output source map.
     */
    get outputCssSourceMap(): string {
        return this.outputCssFile + '.map';
    }

    /**
     * Attempts to read the settings from package.json in the same folder where the command line is invoked at.
     */
    static tryReadFromPackageJson(): Settings {
        let root = process.cwd();
        let parse: any;

        try {
            let json = path.join(root, 'package.json');
            // console.log('Loading settings ' + chalk.cyan(json));
            parse = require(json).instapack;
        } catch (ex) {
            // console.log('Failed to load settings. Using default settings.');
        }

        if (!parse) {
            parse = {};
        }

        return new Settings(root, parse);
    }
}
