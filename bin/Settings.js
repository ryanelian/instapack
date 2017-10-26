"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
class SettingsCore {
}
exports.SettingsCore = SettingsCore;
class Settings {
    constructor(root, settings) {
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
    get cacheFolder() {
        return path.join(os.tmpdir(), 'instapack', 'cache');
    }
    get concatCount() {
        return Object.keys(this.concat).length;
    }
    get packageJson() {
        return path.join(this.root, 'package.json');
    }
    get npmFolder() {
        return path.join(this.root, 'node_modules');
    }
    get bowerFolder() {
        return path.join(this.root, 'bower_components');
    }
    get inputFolder() {
        return path.join(this.root, this.input);
    }
    get inputJsFolder() {
        return path.join(this.inputFolder, 'js');
    }
    get inputCssFolder() {
        return path.join(this.inputFolder, 'css');
    }
    get jsEntry() {
        return path.join(this.inputJsFolder, 'index.ts');
    }
    get cssEntry() {
        return path.join(this.inputCssFolder, 'index.scss');
    }
    get scssGlob() {
        return path.join(this.inputCssFolder, '**', '*.scss');
    }
    get outputFolder() {
        return path.join(this.root, this.output);
    }
    get outputJsFolder() {
        return path.join(this.outputFolder, 'js');
    }
    get outputJsFile() {
        return path.join(this.outputJsFolder, this.jsOut);
    }
    get outputJsSourceMap() {
        return this.outputJsFile + '.map';
    }
    get outputCssFolder() {
        return path.join(this.outputFolder, 'css');
    }
    get outputCssFile() {
        return path.join(this.outputCssFolder, this.cssOut);
    }
    get outputCssSourceMap() {
        return this.outputCssFile + '.map';
    }
    static tryReadFromPackageJson() {
        let root = process.cwd();
        let parse;
        try {
            let json = path.join(root, 'package.json');
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
