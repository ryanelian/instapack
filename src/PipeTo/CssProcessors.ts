import * as postcss from 'gulp-postcss';
import * as autoprefixer from 'autoprefixer';
import * as discardComments from 'postcss-discard-comments';

/**
 * Creates a new build pipe for applying vendor-specific prefixes and minification to CSS.
 */
export function CssProcessors() {
    let cssProcessors = [autoprefixer];

    cssProcessors.push(discardComments({
        removeAll: true
    }));

    return postcss(cssProcessors);
}
