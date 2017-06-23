"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class Settings {
    constructor(root, input, output, concat) {
        this.root = root || process.cwd();
        this.input = input || 'client';
        this.output = output || 'wwwroot';
        this.concat = concat || {};
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
        return new Settings(folder, parse.input, parse.output, parse.concat);
    }
}
exports.Settings = Settings;
