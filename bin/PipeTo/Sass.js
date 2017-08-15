"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sass = require("node-sass");
const through2 = require("through2");
const applySourceMap = require("vinyl-sourcemaps-apply");
function replaceExtension(path, newExt) {
    return path.substr(0, path.lastIndexOf('.')) + newExt;
}
function Sass(includePaths) {
    return through2.obj(function (chunk, enc, next) {
        if (chunk.isNull()) {
            return next(null, chunk);
        }
        if (chunk.isStream()) {
            let error = new Error('Sass: Streaming is not supported!');
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
                applySourceMap(chunk, smap);
            }
            chunk.contents = result.css;
            chunk.path = replaceExtension(chunk.path, '.css');
            next(null, chunk);
        });
    });
}
exports.Sass = Sass;
