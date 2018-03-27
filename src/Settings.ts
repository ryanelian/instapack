import * as upath from 'upath';
import * as fse from 'fs-extra';
import * as chalk from 'chalk';
import * as TypeScript from 'typescript';

/**
 * Dictionary<string, List<string>>
 */
export interface IConcatLookup {
    [key: string]: string[]
}

/**
 * Dictionary<string, string>
 */
export interface IModuleOverrides {
    [key: string]: string
}

/**
 * Values required to construct an instapack Settings object.
 */
export interface ISettingsCore {
    input: string;
    output: string;
    concat: IConcatLookup;
    alias: IModuleOverrides;
    externals: IModuleOverrides
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
    readonly concat: IConcatLookup;

    /**
     * Replaces dependency imports to another dependency. For example: {'vue': 'vue/dist/vue.common'}
     */
    readonly alias: IModuleOverrides;

    /**
     * Rewrites dependency imports to a window object. For example: {'jquery': '$'}
     */
    readonly externals: IModuleOverrides;

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
    constructor(root: string, settings: ISettingsCore) {
        this.root = root || process.cwd();
        this.input = settings.input || 'client';
        this.output = settings.output || 'wwwroot';
        this.concat = settings.concat || {};
        this.alias = settings.alias || {};
        this.externals = settings.externals || {};

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
     * Obtains simple and serializable object for constructing a full Settings object.
     */
    get core() {
        return {
            alias: this.alias,
            concat: this.concat,
            cssOut: this.cssOut,
            externals: this.externals,
            input: this.input,
            jsOut: this.jsOut,
            output: this.output
        } as ISettingsCore;
    }

    /**
    * Gets the JS output common / vendored modules chunk file name.
    * For example, ipack.dll.js
    */
    get jsOutVendorFileName(): string {
        return upath.removeExt(this.jsOut, '.js') + '.dll.js';
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
        return upath.join(this.root, 'package.json');
    }

    /**
     * Gets the full path to tsconfig.json file.
     */
    get tsConfigJson(): string {
        return upath.join(this.root, 'tsconfig.json');
    }

    /**
     * Reads the content of tsconfig.json.
     */
    readTsConfig(): TypeScript.ParsedCommandLine {
        let tsconfigJson = TypeScript.readConfigFile(this.tsConfigJson, TypeScript.sys.readFile);
        if (tsconfigJson.error) {
            throw Error(tsconfigJson.error.messageText.toString());
        }
        // console.log(tsconfigJson);
        let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, this.root);
        if (tsconfig.errors.length) {
            throw Error(tsconfig.errors[0].messageText.toString());
        }
        // console.log(tsconfig);
        return tsconfig;
    }

    /**
     * Gets the full path to node_modules folder.
     */
    get npmFolder(): string {
        return upath.join(this.root, 'node_modules');
    }

    /**
     * Gets the full path to the root client project folder.
     */
    get inputFolder(): string {
        return upath.join(this.root, this.input);
    }

    /**
     * Gets the full path to the root JS project folder.
     */
    get inputJsFolder(): string {
        return upath.join(this.inputFolder, 'js');
    }

    /**
     * Gets the full path to the root CSS project folder.
     */
    get inputCssFolder(): string {
        return upath.join(this.inputFolder, 'css');
    }

    /**
     * Gets the full path to the TypeScript project entry point.
     */
    get jsEntry(): string {
        return upath.join(this.inputJsFolder, 'index.ts');
    }

    /**
     * Gets the full path to the Sass project entry point.
     */
    get cssEntry(): string {
        return upath.join(this.inputCssFolder, 'index.scss');
    }

    /**
     * Gets the glob pattern for watching Sass project source code changes. 
     */
    get scssGlob(): string {
        return upath.join(this.inputCssFolder, '**', '*.scss');
    }

    /**
     * Gets the glob patterns for watching TypeScript project source code changes.
     */
    get tsGlobs(): string[] {
        let ts = upath.join(this.inputJsFolder, '**', '*.ts');
        let tsx = upath.join(this.inputJsFolder, '**', '*.tsx');
        return [ts, tsx];
    }

    /**
     * Gets the full path to the root output folder.
     */
    get outputFolder(): string {
        return upath.join(this.root, this.output);
    }

    /**
     * Gets the full path to the JavaScript compilation and concat output folder.
     */
    get outputJsFolder(): string {
        return upath.join(this.outputFolder, 'js');
    }

    /**
     * Gets the full path to the JS compilation output file.
     */
    get outputJsFile(): string {
        return upath.join(this.outputJsFolder, this.jsOut);
    }

    /**
     * Gets the full path to TypeScript build stats JSON file.
     */
    get statJsonPath(): string {
        return upath.join(this.outputJsFolder, 'stats.json');
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
        return upath.join(this.outputFolder, 'css');
    }

    /**
     * Gets the full path to the CSS compilation output file.
     */
    get outputCssFile(): string {
        return upath.join(this.outputCssFolder, this.cssOut);
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
    static tryReadFromPackageJson(root: string): Settings {
        let parse: any;

        try {
            let json = upath.join(root, 'package.json');
            // console.log('Loading settings ' + chalk.cyan(json));
            parse = fse.readJsonSync(json).instapack;
        } catch (ex) {
            // console.log('Failed to load settings. Using default settings.');
        }

        if (!parse) {
            parse = {};
        }

        return new Settings(root, parse);
    }
}
