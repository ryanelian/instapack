import * as gutil from 'gulp-util';
import * as uglifyjs from 'uglify-js';
import * as minifier from 'gulp-uglify/composer';

/**
 * Creates a new build pipe that minifies JavaScript output if productionMode is set to true.
 * @param productionMode 
 */
export function MinifyProductionJs(productionMode: boolean) {
    let minify = minifier(uglifyjs, console);
    let minifyOptions = {};
    return productionMode ? minify(minifyOptions) : gutil.noop();
};
