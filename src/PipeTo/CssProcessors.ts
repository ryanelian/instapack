import * as postcss from 'gulp-postcss';
import * as autoprefixer from 'autoprefixer';
import * as cssnano from 'cssnano';

/**
 * Creates a new build pipe for applying vendor-specific prefixes to CSS and 
 * minify the files if productionMode is set to true.
 * @param productionMode 
 */
export function CssProcessors(productionMode: boolean) {
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
};
