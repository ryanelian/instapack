"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath_1 = __importDefault(require("upath"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const typescript_1 = __importDefault(require("typescript"));
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
    readTsConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            let tsconfigRaw = yield fs_extra_1.default.readFile(this.tsConfigJson, 'utf8');
            let tsconfigJson = typescript_1.default.parseConfigFileTextToJson(this.tsConfigJson, tsconfigRaw);
            if (tsconfigJson.error) {
                throw Error(tsconfigJson.error.messageText.toString());
            }
            let tsconfig = typescript_1.default.parseJsonConfigFileContent(tsconfigJson.config, typescript_1.default.sys, this.root);
            if (tsconfig.errors.length) {
                throw Error(tsconfig.errors[0].messageText.toString());
            }
            return tsconfig;
        });
    }
    get tslintJson() {
        return upath_1.default.join(this.root, 'tslint.json');
    }
    get tslintYaml() {
        return upath_1.default.join(this.root, 'tslint.yaml');
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
