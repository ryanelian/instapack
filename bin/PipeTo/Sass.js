"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sass = require("node-sass");
const through2 = require("through2");
const path = require("path");
const applySourceMap = require("vinyl-sourcemaps-apply");
function Sass(cssOut, includePaths) {
    return through2.obj(function (chunk, enc, next) {
        if (chunk.isNull()) {
            return next(null, chunk);
        }
        if (chunk.isStream()) {
            let error = new Error('Sass: Streaming is not supported!');
            return next(error);
        }
        let outFile = path.join(path.dirname(chunk.path), cssOut);
        let options = {
            outputStyle: 'compressed',
            outFile: outFile
        };
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
            chunk.path = outFile;
            chunk.contents = result.css;
            if (createSourceMap) {
                let smap = JSON.parse(result.map.toString());
                applySourceMap(chunk, smap);
            }
            next(null, chunk);
        });
    });
}
exports.Sass = Sass;
