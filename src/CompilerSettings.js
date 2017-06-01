"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const gutil = require("gulp-util");
const resolve = require("resolve");
class CompilerSettings {
    get concatResolution() {
        let resolver = {};
        let resolverLength = 0;
        let resolveOption = { basedir: this.projectFolder };
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
        return path.join(this.projectFolder, 'node_modules');
    }
    get bowerFolder() {
        return path.join(this.projectFolder, 'bower_components');
    }
    get inputFolder() {
        return path.join(this.projectFolder, this.input);
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
        return path.join(this.projectFolder, this.output);
    }
    get outputJsFolder() {
        return path.join(this.outputFolder, 'js');
    }
    get outputCssFolder() {
        return path.join(this.outputFolder, 'css');
    }
    static tryReadFromFile() {
        let settings = new CompilerSettings();
        settings.projectFolder = process.cwd();
        let json = path.join(settings.projectFolder, 'package.json');
        try {
            gutil.log('Reading settings from', gutil.colors.cyan(json + ':instapack'));
            let parse = require(json).instapack;
            settings.input = parse.input;
            settings.output = parse.output;
            settings.concat = parse.concat;
        }
        catch (error) {
            gutil.log('Failed to read settings. Using default settings.');
        }
        if (!settings.input) {
            settings.input = 'client';
        }
        if (!settings.output) {
            settings.output = 'wwwroot';
        }
        if (!settings.concat) {
            settings.concat = {};
        }
        gutil.log('Using output folder', gutil.colors.cyan(settings.outputFolder));
        return settings;
    }
}
exports.CompilerSettings = CompilerSettings;
