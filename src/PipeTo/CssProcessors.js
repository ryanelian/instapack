import * as postcss from 'gulp-postcss';
import * as autoprefixer from 'autoprefixer';
import * as cssnano from 'cssnano';
let CssProcessors = productionMode => {
    let cssProcessors = [
        autoprefixer({
            browsers: ['ie >= 9', 'Android >= 4', 'last 3 versions']
        })
    ];
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
export { CssProcessors };
