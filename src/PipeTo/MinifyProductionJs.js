import * as gutil from 'gulp-util';
import * as uglifyjs from 'uglify-js';
import * as minifier from 'gulp-uglify/composer';
let MinifyProductionJs = productionMode => {
    let minify = minifier(uglifyjs, console);
    let minifyOptions = {};
    return productionMode ? minify(minifyOptions) : gutil.noop();
};
export { MinifyProductionJs };
