import * as path from 'path';
import * as chalk from 'chalk';

/**
 * Dictionary<string, List<string>>
 */
export interface ConcatenationLookup {
    [key: string]: string[]
}

/**
 * Dictionary<string, string>
 */
export interface ModuleAliases {
    [key: string]: string
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
     * Gets the unresolved concatenation map.
     */
    readonly concat: ConcatenationLookup;

    /**
     * Overrides module imports, including sub-dependencies. For example: {'vue': 'vue/dist/vue.common'}
     */
    readonly alias: ModuleAliases;
    
    /**
     * Constructs a new instance of Settings.
     * @param root 
     * @param input 
     * @param output 
     * @param concat 
     */
    constructor(root: string, input: string, output: string, concat: ConcatenationLookup, alias: ModuleAliases) {
        this.root = root || process.cwd();
        this.input = input || 'client';
        this.output = output || 'wwwroot';
        this.concat = concat || {};
        this.alias = alias || {};
    }

    /**
     * Gets the number of keys / target files in the concatenation map.
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
     * Gets the full path to the index.ts entry point.
     */
    get jsEntry(): string {
        return path.join(this.inputJsFolder, 'index.ts');
    }

    /**
     * Gets the full path to the site.scss entry point.
     */
    get cssEntry(): string {
        return path.join(this.inputCssFolder, 'site.scss');
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
    static tryRead(): Settings {
        let folder = process.cwd();
        let parse: any;

        try {
            let json = path.join(folder, 'package.json');
            // console.log('Loading settings ' + chalk.cyan(json));
            parse = require(json).instapack;
        } catch (ex) {
            // console.log('Failed to load settings. Using default settings.');
        }

        if (!parse) {
            parse = {};
        }

        return new Settings(folder, parse.input, parse.output, parse.concat, parse.alias);
    }
}
