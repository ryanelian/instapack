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
const fse = require("fs-extra");
const path = require("path");
const chalk_1 = require("chalk");
const resolve = require("resolve");
const UglifyES = require("uglify-es");
const UglifyESOptions_1 = require("./UglifyESOptions");
const CompilerUtilities_1 = require("./CompilerUtilities");
const PrettyUnits_1 = require("./PrettyUnits");
class ConcatBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    resolveAsPromise(path) {
        return new Promise((ok, reject) => {
            resolve(path, {
                basedir: this.settings.root
            }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(result);
                }
            });
        });
    }
    resolveThenReadFiles(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            let p1 = paths.map(Q => this.resolveAsPromise(Q));
            let resolutions = yield Promise.all(p1);
            let p2 = resolutions.map(Q => fse.readFile(Q, 'utf8'));
            let contents = yield Promise.all(p2);
            let files = {};
            for (let i = 0; i < resolutions.length; i++) {
                let key = CompilerUtilities_1.convertAbsoluteToSourceMapPath(this.settings.root, resolutions[i]);
                files[key] = contents[i];
            }
            return files;
        });
    }
    concatFilesAsync(target, files) {
        let options = UglifyESOptions_1.createUglifyESOptions();
        if (!this.flags.production) {
            options['compress'] = false;
            options['mangle'] = false;
            options['output'] = {
                beautify: true
            };
        }
        if (this.flags.sourceMap) {
            options['sourceMap'] = {
                filename: target,
                url: target + '.map',
                root: 'instapack://',
                includeSources: true
            };
        }
        return new Promise((ok, error) => {
            let result = UglifyES.minify(files, options);
            if (result.error) {
                error(result.error);
            }
            else {
                ok(result);
            }
        });
    }
    concatTarget(target, modules) {
        return __awaiter(this, void 0, void 0, function* () {
            let files = yield this.resolveThenReadFiles(modules);
            let result = yield this.concatFilesAsync(target, files);
            let outPath = path.join(this.settings.outputJsFolder, target);
            let p1 = CompilerUtilities_1.logAndWriteUtf8FileAsync(outPath, result.code);
            if (result.map) {
                yield CompilerUtilities_1.logAndWriteUtf8FileAsync(outPath + '.map', result.map);
            }
            yield p1;
        });
    }
    build() {
        let tasks = [];
        let targets = this.settings.concat;
        for (let target in targets) {
            let modules = targets[target];
            if (!modules || modules.length === 0) {
                CompilerUtilities_1.timedLog(chalk_1.default.red('WARNING'), 'concat list for', chalk_1.default.blue(target), 'is empty!');
                continue;
            }
            if (typeof modules === 'string') {
                modules = [modules];
                CompilerUtilities_1.timedLog(chalk_1.default.red('WARNING'), 'concat list for', chalk_1.default.blue(target), 'is a', chalk_1.default.yellow('string'), 'instead of a', chalk_1.default.yellow('string[]'));
            }
            let o = target;
            if (o.endsWith('.js') === false) {
                o += '.js';
            }
            fse.removeSync(path.join(this.settings.outputJsFolder, o + '.map'));
            let task = this.concatTarget(o, modules).catch(error => {
                CompilerUtilities_1.timedLog(chalk_1.default.red('ERROR'), 'when concatenating', chalk_1.default.blue(o));
                console.error(error);
            }).then(() => { });
            tasks.push(task);
        }
        return Promise.all(tasks);
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            let start = process.hrtime();
            try {
                yield this.build();
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                CompilerUtilities_1.timedLog('Finished JS concat after', chalk_1.default.green(time));
            }
        });
    }
}
exports.ConcatBuildTool = ConcatBuildTool;
