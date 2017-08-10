"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UglifyJS = require("uglify-js");
const through2 = require("through2");
const applySourceMap = require("vinyl-sourcemaps-apply");
function Uglify() {
    return through2.obj(function (chunk, enc, next) {
        if (chunk.isNull()) {
            return next(null, chunk);
        }
        if (chunk.isStream()) {
            let error = new Error('MinifyProductionJs: Streaming is not supported!');
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
        chunk.contents = Buffer.from(result.code);
        if (createSourceMap) {
            applySourceMap(chunk, JSON.parse(result.map));
        }
        next(null, chunk);
    });
}
exports.Uglify = Uglify;
