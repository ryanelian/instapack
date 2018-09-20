"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath_1 = __importDefault(require("upath"));
const tslint_1 = require("tslint");
class PathFinder {
    constructor(variables) {
        this.variables = variables;
    }
    get root() {
        return this.variables.root;
    }
    get packageJson() {
        return upath_1.default.join(this.root, 'package.json');
    }
    get npmFolder() {
        return upath_1.default.join(this.root, 'node_modules');
    }
    get tsConfigJson() {
        return upath_1.default.join(this.root, 'tsconfig.json');
    }
    findTslintConfiguration() {
        let yaml = upath_1.default.join(this.root, 'tslint.yaml');
        let json = upath_1.default.join(this.root, 'tslint.json');
        let tslintFind = tslint_1.Configuration.findConfiguration(null, this.root);
        if (tslintFind.path && tslintFind.results) {
            let tslintPath = upath_1.default.toUnix(tslintFind.path);
            if (tslintPath === json || tslintPath === yaml) {
                return {
                    path: tslintPath,
                    results: tslintFind.results
                };
            }
        }
        return undefined;
    }
    get babelConfiguration() {
        return upath_1.default.join(this.root, '.babelrc');
    }
    get inputFolderName() {
        return this.variables.input;
    }
    get inputFolderPath() {
        return upath_1.default.join(this.root, this.inputFolderName);
    }
    get jsInputFolder() {
        return upath_1.default.join(this.inputFolderPath, 'js');
    }
    get jsEntry() {
        return upath_1.default.join(this.jsInputFolder, 'index.ts');
    }
    get vueGlobs() {
        return upath_1.default.join(this.jsInputFolder, '**', '*.vue');
    }
    get tsGlobs() {
        return upath_1.default.join(this.jsInputFolder, '**', '*.ts');
    }
    get tsxGlobs() {
        return upath_1.default.join(this.jsInputFolder, '**', '*.tsx');
    }
    get typeCheckGlobs() {
        return [this.tsGlobs, this.tsxGlobs, this.vueGlobs];
    }
    get cssInputFolder() {
        return upath_1.default.join(this.inputFolderPath, 'css');
    }
    get cssEntry() {
        return upath_1.default.join(this.cssInputFolder, 'index.scss');
    }
    get scssGlob() {
        return upath_1.default.join(this.cssInputFolder, '**', '*.scss');
    }
    get outputFolderName() {
        return this.variables.output;
    }
    get outputFolderPath() {
        return upath_1.default.join(this.root, this.outputFolderName);
    }
    get jsOutputFolder() {
        return upath_1.default.join(this.outputFolderPath, 'js');
    }
    get jsOutputFileName() {
        return this.variables.jsOut;
    }
    get jsChunkFileName() {
        return upath_1.default.removeExt(this.jsOutputFileName, '.js') + '.[name].js';
    }
    get jsOutputFilePath() {
        return upath_1.default.join(this.jsOutputFolder, this.jsOutputFileName);
    }
    get statsJsonFilePath() {
        return upath_1.default.join(this.jsOutputFolder, 'stats.json');
    }
    get cssOutputFolder() {
        return upath_1.default.join(this.outputFolderPath, 'css');
    }
    get cssOutputFileName() {
        return this.variables.cssOut;
    }
    get cssOutputFilePath() {
        return upath_1.default.join(this.cssOutputFolder, this.cssOutputFileName);
    }
}
exports.PathFinder = PathFinder;
