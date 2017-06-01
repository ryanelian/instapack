"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
let CssProcessors = productionMode => {
    let cssProcessors = [
        autoprefixer({
            browsers: ['ie >= 9', 'Android >= 4', 'last 3 versions']
        })
    ];
    if (productionMode) {
        let minifier = cssnano({
            discardComments: {
                removeAll: true
            }
        });
        cssProcessors.push(minifier);
    }
    return postcss(cssProcessors);
};
exports.CssProcessors = CssProcessors;
