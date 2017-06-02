"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
function CssProcessors(productionMode) {
    let cssProcessors = [autoprefixer];
    if (productionMode) {
        let minifier = cssnano({
            discardComments: {
                removeAll: true
            }
        });
        cssProcessors.push(minifier);
    }
    return postcss(cssProcessors);
}
exports.CssProcessors = CssProcessors;
;
