"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gutil = require("gulp-util");
const sass = require("node-sass");
const through2 = require("through2");
const path = require("path");
const applySourceMap = require("vinyl-sourcemaps-apply");
function Sass(includePaths, projectFolder) {
    return through2.obj(function (chunk, enc, next) {
        if (chunk.isNull()) {
            return next(null, chunk);
        }
        if (chunk.isStream()) {
            let error = new gutil.PluginError({
                plugin: 'Sass',
                message: 'Streaming is not supported!'
            });
            return next(error);
        }
        let options = {};
        let createSourceMap = Boolean(chunk.sourceMap);
        options.data = chunk.contents.toString();
        options.file = chunk.path;
        options.includePaths = includePaths;
        if (createSourceMap) {
            options.sourceMap = chunk.path;
            options.omitSourceMapUrl = true;
            options.sourceMapContents = true;
        }
        sass.render(options, (error, result) => {
            if (error) {
                next(error);
                return;
            }
            if (createSourceMap) {
                let smap = JSON.parse(result.map.toString());
                let entry = path.relative(projectFolder, chunk.path);
                for (let i = 0; i < smap.sources.length; i++) {
                    let s = path.join(entry, '..', smap.sources[i]);
                    smap.sources[i] = s;
                }
                applySourceMap(chunk, smap);
            }
            chunk.contents = result.css;
            chunk.path = gutil.replaceExtension(chunk.path, '.css');
            next(null, chunk);
        });
    });
}
exports.Sass = Sass;
;
