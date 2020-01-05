import * as upath from 'upath';
import { BuildVariables } from './BuildVariables';

/**
 * A very light and thin extension build on top of IVariables for getting various file paths. 
 */
export class PathFinder {

    private readonly variables: BuildVariables;

    /**
     * Creates a new instance of PathFinder class.
     * @param variables 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
    }

    /**
     * /project
     */
    get root(): string {
        return this.variables.root
    }

    /**
     * /project/package.json
     */
    get packageJson(): string {
        return upath.join(this.root, 'package.json');
    }

    /**
     * /project/node_modules/
     */
    get npmFolder(): string {
        return upath.join(this.root, 'node_modules');
    }

    /**
     * /project/tsconfig.json
     */
    get tsConfigJson(): string {
        return upath.join(this.root, 'tsconfig.json');
    }

    /**
     * /project/.babelrc
     */
    get babelConfiguration(): string {
        return upath.join(this.root, '.babelrc');
    }

    /**
     * client
     */
    get inputFolderName(): string {
        return this.variables.input;
    }

    /**
     * /project/client/
     */
    get inputFolderPath(): string {
        return upath.join(this.root, this.inputFolderName);
    }

    /**
     * /project/client/js/
     */
    get jsInputFolder(): string {
        return upath.join(this.inputFolderPath, 'js');
    }

    /**
     * /project/client/js/index.ts
     */
    get jsEntry(): string {
        return upath.join(this.jsInputFolder, 'index.ts');
    }

    /**
     * /project/client/css/
     */
    get cssInputFolder(): string {
        return upath.join(this.inputFolderPath, 'css');
    }

    /**
     * /project/client/css/index.scss
     */
    get cssEntry(): string {
        return upath.join(this.cssInputFolder, 'index.scss');
    }

    /**
     * /project/client/css/\*\*\/*.scss
     */
    get scssGlob(): string {
        return upath.join(this.cssInputFolder, '**', '*.scss');
    }

    /**
     * wwwroot
     */
    get outputFolderName(): string {
        return this.variables.output;
    }

    /**
     * /project/wwwroot/
     */
    get outputFolderPath(): string {
        return upath.join(this.root, this.outputFolderName);
    }

    /**
     * /project/wwwroot/js/
     */
    get jsOutputFolder(): string {
        return upath.join(this.outputFolderPath, 'js');
    }

    /**
     * ipack.js
     */
    get jsOutputFileName(): string {
        return upath.addExt(this.variables.jsOut, '.js');
    }

    /**
     * ipack.[name].js
     */
    get jsInitialChunkFileName(): string {
        return upath.removeExt(this.jsOutputFileName, '.js') + '.[name].js';
    }

    /**
     * ipack.[contenthash].js
     */
    get jsDynamicChunkFileName(): string {
        return upath.removeExt(this.jsOutputFileName, '.js') + '.[contenthash].js';
    }

    /**
     * /project/wwwroot/js/ipack.js
     */
    get jsOutputFilePath(): string {
        return upath.join(this.jsOutputFolder, this.jsOutputFileName);
    }

    /**
     * /project/wwwroot/js/stats.json
     */
    get statsJsonFilePath(): string {
        return upath.join(this.jsOutputFolder, 'stats.json');
    }

    /**
     * /project/wwwroot/css/
     */
    get cssOutputFolder(): string {
        return upath.join(this.outputFolderPath, 'css');
    }

    /**
     * ipack.css
     */
    get cssOutputFileName(): string {
        return upath.addExt(this.variables.cssOut, '.css');
    }

    /**
     * /project/wwwroot/css/ipack.css
     */
    get cssOutputFilePath(): string {
        return upath.join(this.cssOutputFolder, this.cssOutputFileName);
    }
}
