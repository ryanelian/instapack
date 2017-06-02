"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const gutil = require("gulp-util");
const resolve = require("resolve");
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
    get concatResolution() {
        let resolver = {};
        let resolverLength = 0;
        let resolveOption = { basedir: this.projectRoot };
        for (let concatResult in this.concat) {
            let resolverItems = [];
            let concatItems = this.concat[concatResult];
            for (let i in concatItems) {
                let concatModule = concatItems[i];
                let concatModulePath = resolve.sync(concatModule, resolveOption);
                resolverItems.push(concatModulePath);
            }
            resolverLength++;
            resolver[concatResult + '.js'] = resolverItems;
        }
        return resolver;
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
        let json = path.join(folder, 'package.json');
        let parse;
        try {
            gutil.log('Reading settings from', gutil.colors.cyan(json + ':instapack'));
            parse = require(json).instapack;
        }
        catch (ex) {
            gutil.log('Failed to read settings. Using default settings.');
        }
        if (!parse) {
            parse = {};
        }
        let settings = new CompilerSettings(folder, parse.input, parse.output, parse.concat);
        gutil.log('Using output folder', gutil.colors.cyan(settings.outputFolder));
        return settings;
    }
}
exports.CompilerSettings = CompilerSettings;
