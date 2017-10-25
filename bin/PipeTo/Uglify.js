"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UglifyES = require("uglify-es");
const through2 = require("through2");
const applySourceMap = require("vinyl-sourcemaps-apply");
const UglifyESOptions_1 = require("../UglifyESOptions");
function Uglify() {
    return through2.obj(function (chunk, enc, next) {
        if (chunk.isNull()) {
            return next(null, chunk);
        }
        if (chunk.isStream()) {
            let error = new Error('Uglify: Streaming is not supported!');
            return next(error);
        }
        let options = UglifyESOptions_1.createUglifyESOptions();
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
        let result = UglifyES.minify(files, options);
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
