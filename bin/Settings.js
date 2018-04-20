"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const fse = require("fs-extra");
const TypeScript = require("typescript");
class Settings {
    constructor(root, settings) {
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
    get core() {
        return {
            alias: this.alias,
            concat: this.concat,
            cssOut: this.cssOut,
            externals: this.externals,
            input: this.input,
            jsOut: this.jsOut,
            output: this.output
        };
    }
    get jsOutVendorFileName() {
        return upath.removeExt(this.jsOut, '.js') + '.dll.js';
    }
    get concatCount() {
        return Object.keys(this.concat).length;
    }
    get packageJson() {
        return upath.join(this.root, 'package.json');
    }
    get tsConfigJson() {
        return upath.join(this.root, 'tsconfig.json');
    }
    readTsConfig() {
        let tsconfigJson = TypeScript.readConfigFile(this.tsConfigJson, TypeScript.sys.readFile);
        if (tsconfigJson.error) {
            throw Error(tsconfigJson.error.messageText.toString());
        }
        let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, this.root);
        if (tsconfig.errors.length) {
            throw Error(tsconfig.errors[0].messageText.toString());
        }
        return tsconfig;
    }
    get npmFolder() {
        return upath.join(this.root, 'node_modules');
    }
    get inputFolder() {
        return upath.join(this.root, this.input);
    }
    get inputJsFolder() {
        return upath.join(this.inputFolder, 'js');
    }
    get inputCssFolder() {
        return upath.join(this.inputFolder, 'css');
    }
    get jsEntry() {
        return upath.join(this.inputJsFolder, 'index.ts');
    }
    get cssEntry() {
        return upath.join(this.inputCssFolder, 'index.scss');
    }
    get scssGlob() {
        return upath.join(this.inputCssFolder, '**', '*.scss');
    }
    get vueGlobs() {
        return upath.join(this.inputJsFolder, '**', '*.vue');
    }
    get typeCheckGlobs() {
        let ts = upath.join(this.inputJsFolder, '**', '*.ts');
        let tsx = upath.join(this.inputJsFolder, '**', '*.tsx');
        return [ts, tsx, this.vueGlobs];
    }
    get outputFolder() {
        return upath.join(this.root, this.output);
    }
    get outputJsFolder() {
        return upath.join(this.outputFolder, 'js');
    }
    get outputJsFile() {
        return upath.join(this.outputJsFolder, this.jsOut);
    }
    get statJsonPath() {
        return upath.join(this.outputJsFolder, 'stats.json');
    }
    get outputCssFolder() {
        return upath.join(this.outputFolder, 'css');
    }
    get outputCssFile() {
        return upath.join(this.outputCssFolder, this.cssOut);
    }
    static tryReadFromPackageJson(root) {
        return __awaiter(this, void 0, void 0, function* () {
            let parse;
            try {
                let jsonPath = upath.join(root, 'package.json');
                let json = yield fse.readJson(jsonPath);
                parse = json.instapack;
            }
            catch (ex) {
            }
            if (!parse) {
                parse = {};
            }
            return new Settings(root, parse);
        });
    }
}
exports.Settings = Settings;
