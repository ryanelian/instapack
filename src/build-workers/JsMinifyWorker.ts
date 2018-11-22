import * as UglifyJS from 'uglify-js';
import { IMinifyInputs } from '../IMinifyInputs';

/**
 * Accepts minification input parameter to used by UglifyJS minifier.
 */
export = function (input: IMinifyInputs, callback) {
    // collapse_vars issues:
    // 1. performance regressions   https://github.com/mishoo/UglifyJS2/issues/3174
    // 2. bad output                https://github.com/mishoo/UglifyJS2/issues/3247
    let minifyOptions: UglifyJS.MinifyOptions = {
        compress: {
            collapse_vars: false,
            conditionals: false,     // https://github.com/mishoo/UglifyJS2/issues/3245#issuecomment-417940973
        }
    };

    if (input.map) {
        minifyOptions.sourceMap = {
            content: input.map as any // HACK78
        };
    }

    let result = UglifyJS.minify({
        [input.fileName]: input.code
    }, minifyOptions);

    if (result.error) {
        callback(result.error);
    } else {
        callback(null, result);
    }
}
