"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const discardComments = require("postcss-discard-comments");
function CssProcessors() {
    let cssProcessors = [autoprefixer];
    cssProcessors.push(discardComments({
        removeAll: true
    }));
    return postcss(cssProcessors);
}
exports.CssProcessors = CssProcessors;
