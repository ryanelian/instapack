"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class Settings {
    constructor(root, input, output, concat, alias, externals, template) {
        this.root = root || process.cwd();
        this.input = input || 'client';
        this.output = output || 'wwwroot';
        this.concat = concat || {};
        this.alias = alias || {};
        this.externals = externals || {};
        this.template = template || 'string';
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
    get outputCssFolder() {
        return path.join(this.outputFolder, 'css');
    }
    static tryRead() {
        let folder = process.cwd();
        let parse;
        try {
            let json = path.join(folder, 'package.json');
            parse = require(json).instapack;
        }
        catch (ex) {
        }
        if (!parse) {
            parse = {};
        }
        return new Settings(folder, parse.input, parse.output, parse.concat, parse.alias, parse.externals, parse.template);
    }
}
exports.Settings = Settings;
