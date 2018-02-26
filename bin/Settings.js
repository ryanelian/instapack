"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const os = require("os");
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
    get jsOutSplitFileName() {
        return upath.removeExt(this.jsOut, '.js') + '_[name].js';
    }
    get jsOutVendorFileName() {
        return upath.removeExt(this.jsOut, '.js') + '_modules.js';
    }
    get cacheFolder() {
        return upath.join(os.tmpdir(), 'instapack', 'cache');
    }
    get concatCount() {
        return Object.keys(this.concat).length;
    }
    get packageJson() {
        return upath.join(this.root, 'package.json');
    }
    get npmFolder() {
        return upath.join(this.root, 'node_modules');
    }
    get bowerFolder() {
        return upath.join(this.root, 'bower_components');
    }
    get dllManifestJsonPath() {
        return upath.join(this.npmFolder, 'dll-manifest.json');
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
    get tsGlobs() {
        let ts = upath.join(this.inputJsFolder, '**', '*.ts');
        let tsx = upath.join(this.inputJsFolder, '**', '*.tsx');
        return [ts, tsx];
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
    get outputJsSourceMap() {
        return this.outputJsFile + '.map';
    }
    get outputCssFolder() {
        return upath.join(this.outputFolder, 'css');
    }
    get outputCssFile() {
        return upath.join(this.outputCssFolder, this.cssOut);
    }
    get outputCssSourceMap() {
        return this.outputCssFile + '.map';
    }
    static tryReadFromPackageJson() {
        let root = process.cwd();
        let parse;
        try {
            let json = upath.join(root, 'package.json');
            parse = require(json).instapack;
        }
        catch (ex) {
        }
        if (!parse) {
            parse = {};
        }
        return new Settings(root, parse);
    }
}
exports.Settings = Settings;
