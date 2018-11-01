import { minify, MinifyOptions, MinifyOutput } from 'uglify-js';
import Terser = require('terser');
import { IMinifyWorkerInput } from './IMinifyWorkerInput';

/**
 * Accepts minification input parameter to used by UglifyJS minifier.
 */
export = function (input: IMinifyWorkerInput, callback) {
    let minifyOptions: MinifyOptions = {
    };

    if (input.map) {
        minifyOptions.sourceMap = {
            content: input.map as any // HACK78
        };
    }

    let result: MinifyOutput;

    if (input.ecma === 5) {
        // colapse_vars issues:
        // 1. performance regressions   https://github.com/mishoo/UglifyJS2/issues/3174
        // 2. bad output                https://github.com/mishoo/UglifyJS2/issues/3247
        minifyOptions.compress = {
            collapse_vars: false,
            conditionals: false,     // https://github.com/mishoo/UglifyJS2/issues/3245#issuecomment-417940973
        };

        result = minify({
            [input.fileName]: input.code
        }, minifyOptions);
    } else {
        let terserOptions: any = minifyOptions;
        terserOptions.ecma = input.ecma;

        result = Terser.minify({
            [input.fileName]: input.code
        }, terserOptions);
    }

    if (result.error) {
        callback(result.error);
    } else {
        callback(null, result);
    }
}
