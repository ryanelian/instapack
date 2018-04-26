import * as UglifyJS from 'uglify-js';
import { IMinifyInputs } from '../IMinifyInputs';

/**
 * Accepts minification input parameter to used by UglifyJS minifier.
 */
export = function (input: IMinifyInputs, callback) {
    let result = UglifyJS.minify(input.payload, input.options);

    if (result.error) {
        callback(result.error);
    } else {
        callback(null, result);
    }
}
