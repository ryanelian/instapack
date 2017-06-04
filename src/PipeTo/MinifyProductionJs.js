"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gutil = require("gulp-util");
const UglifyJS = require("uglify-js");
const through2 = require("through2");
const applySourceMap = require("vinyl-sourcemaps-apply");
function MinifyProductionJs(productionMode) {
    if (!productionMode) {
        return gutil.noop();
    }
    return through2.obj(function (chunk, enc, next) {
        if (chunk.isNull()) {
            return next(null, chunk);
        }
        if (chunk.isStream()) {
            let error = new gutil.PluginError({
                plugin: 'MinifyProductionJs',
                message: 'Streaming is not supported!'
            });
            return next(error);
        }
        let options = {};
        let createSourceMap = Boolean(chunk.sourceMap);
        if (createSourceMap) {
            options.sourceMap = {
                filename: chunk.sourceMap.file,
                content: chunk.sourceMap,
                includeSources: true
            };
        }
        let files = {};
        files[chunk.relative] = chunk.contents.toString();
        let result = UglifyJS.minify(files, options);
        if (result.error) {
            next(result.error);
        }
        chunk.contents = new Buffer(result.code);
        if (createSourceMap) {
            applySourceMap(chunk, JSON.parse(result.map));
        }
        next(null, chunk);
    });
}
exports.MinifyProductionJs = MinifyProductionJs;
;
