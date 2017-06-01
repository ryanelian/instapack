import * as postcss from 'gulp-postcss';
import * as autoprefixer from 'autoprefixer';
import * as cssnano from 'cssnano';

let CssProcessors = productionMode => {
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

export { CssProcessors }
