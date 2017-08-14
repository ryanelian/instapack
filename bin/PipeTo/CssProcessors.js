"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
function CssProcessors(minify) {
    let cssProcessors = [autoprefixer];
    if (minify) {
        let minifier = cssnano({
            preset: ['default', {
                    discardComments: {
                        removeAll: true,
                    },
                }]
        });
        cssProcessors.push(minifier);
    }
    return postcss(cssProcessors);
}
exports.CssProcessors = CssProcessors;
