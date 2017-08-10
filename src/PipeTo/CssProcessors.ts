import * as postcss from 'gulp-postcss';
import * as autoprefixer from 'autoprefixer';
import * as cssnano from 'cssnano';

/**
 * Creates a new build pipe for applying vendor-specific prefixes and minification to CSS.
 * @param minify 
 */
export function CssProcessors(minify: boolean) {
    let cssProcessors = [autoprefixer];

    if (minify) {
        let minifier = cssnano({
            discardComments: {
                removeAll: true
            }
        });

        cssProcessors.push(minifier);
    }

    return postcss(cssProcessors);
}
