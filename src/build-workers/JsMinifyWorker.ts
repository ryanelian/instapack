import * as UglifyJS from 'uglify-js';
import { IMinifyInputs } from '../IMinifyInputs';

/**
 * Accepts minification input parameter to used by UglifyJS minifier.
 */
export = function (input: IMinifyInputs, callback) {
    let minifyOptions: UglifyJS.MinifyOptions;
    if (input.map) {
        minifyOptions = {
            sourceMap: {
                content: input.map as any // HACK78
            }
        }
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
