"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const chalk = require("chalk");
class CompilerSettings {
    constructor(projectRoot, input, output, concat) {
        this.projectRoot = projectRoot || process.cwd();
        this.input = input || 'client';
        this.output = output || 'wwwroot';
        this.concat = concat || {};
    }
    get concatCount() {
        return Object.keys(this.concat).length;
    }
    get npmFolder() {
        return path.join(this.projectRoot, 'node_modules');
    }
    get bowerFolder() {
        return path.join(this.projectRoot, 'bower_components');
    }
    get inputFolder() {
        return path.join(this.projectRoot, this.input);
    }
    get jsEntry() {
        return path.join(this.inputFolder, 'js', 'index.ts');
    }
    get cssEntry() {
        return path.join(this.inputFolder, 'css', 'site.scss');
    }
    get cssWatchGlob() {
        return path.join(this.inputFolder, 'css', '**', '*.scss');
    }
    get outputFolder() {
        return path.join(this.projectRoot, this.output);
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
            console.log('Loading settings ' + chalk.cyan(json));
            parse = require(json).instapack;
        }
        catch (ex) {
            console.log('Failed to load settings. Using default settings.');
        }
        if (!parse) {
            parse = {};
        }
        return new CompilerSettings(folder, parse.input, parse.output, parse.concat);
    }
}
exports.CompilerSettings = CompilerSettings;
