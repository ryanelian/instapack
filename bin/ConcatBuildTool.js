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
const upath = require("upath");
const chalk_1 = require("chalk");
const enhanced_resolve_1 = require("enhanced-resolve");
let Uglify = require('uglify-js');
const EventHub_1 = require("./EventHub");
const CompilerUtilities_1 = require("./CompilerUtilities");
const Shout_1 = require("./Shout");
const PrettyUnits_1 = require("./PrettyUnits");
let resolver = enhanced_resolve_1.ResolverFactory.createResolver({
    fileSystem: new enhanced_resolve_1.NodeJsInputFileSystem(),
    extensions: ['.js']
});
class ConcatBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    resolve(request) {
        return new Promise((ok, reject) => {
            resolver.resolve({}, this.settings.root, request, {}, (error, result) => {
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
            let p1 = paths.map(Q => this.resolve(Q));
            let resolutions = yield Promise.all(p1);
            let p2 = resolutions.map(Q => fse.readFile(Q, 'utf8'));
            let contents = yield Promise.all(p2);
            let files = {};
            for (let i = 0; i < resolutions.length; i++) {
                let key = '/' + upath.relative(this.settings.root, resolutions[i]);
                files[key] = contents[i];
            }
            return files;
        });
    }
    concatFilesAsync(target, files) {
        let options = {};
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
            let result = Uglify.minify(files, options);
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
            let outPath = upath.join(this.settings.outputJsFolder, target);
            let p1 = CompilerUtilities_1.outputFileThenLog(outPath, result.code);
            if (result.map) {
                yield CompilerUtilities_1.outputFileThenLog(outPath + '.map', result.map);
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
                Shout_1.Shout.warning('concat list for', chalk_1.default.blue(target), 'is empty!');
                continue;
            }
            if (typeof modules === 'string') {
                modules = [modules];
                Shout_1.Shout.warning('concat list for', chalk_1.default.blue(target), 'is a', chalk_1.default.yellow('string'), 'instead of a', chalk_1.default.yellow('string[]'));
            }
            let o = target;
            if (o.endsWith('.js') === false) {
                o += '.js';
            }
            let t1 = this.concatTarget(o, modules).catch(error => {
                Shout_1.Shout.error('when concatenating', chalk_1.default.blue(o));
                Shout_1.Shout.stackTrace(error);
            });
            let sourceMapPath = upath.join(this.settings.outputJsFolder, o + '.map');
            let t2 = fse.remove(sourceMapPath);
            tasks.push(t1);
            tasks.push(t2);
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
                Shout_1.Shout.timed('Finished JS concat after', chalk_1.default.green(time));
                EventHub_1.default.buildDone();
            }
        });
    }
}
exports.ConcatBuildTool = ConcatBuildTool;
