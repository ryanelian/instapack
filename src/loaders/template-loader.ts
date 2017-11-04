import { loader } from 'webpack';
import { getOptions } from 'loader-utils';
import { minify } from 'html-minifier';
import { compile } from 'vue-template-compiler';
import { SourceMapGenerator } from 'source-map';

let minifierOptions = {
    caseSensitive: false,
    collapseBooleanAttributes: true,      // Not default
    collapseInlineTagWhitespace: false,
    collapseWhitespace: true,             // Not default
    conservativeCollapse: true,           // Not default
    decodeEntities: false,
    html5: true,
    includeAutoGeneratedTags: true,
    keepClosingSlash: false,
    minifyCSS: false,
    minifyJS: false,
    minifyURLs: false,
    preserveLineBreaks: false,
    preventAttributesEscaping: false,
    processConditionalComments: false,
    removeAttributeQuotes: false,
    removeComments: true,                 // Not default
    removeEmptyAttributes: false,
    removeEmptyElements: false,
    removeOptionalTags: false,
    removeRedundantAttributes: true,      // Not default
    removeScriptTypeAttributes: true,     // Not default
    removeStyleLinkTypeAttributes: true,  // Not default
    removeTagWhitespace: false,
    sortAttributes: true,                 // Not default
    sortClassName: true,                  // Not default
    trimCustomFragments: false,
    useShortDoctype: false
};

export interface TemplateLoaderOptions {
    mode: string
}

function functionWrap(s: string) {
    return 'function(){' + s + '}';
}

function functionArrayWrap(ar: string[]) {
    let result = ar.map(s => functionWrap(s)).join(',');
    return '[' + result + ']';
}

module.exports = function (this: loader.LoaderContext, html: string) {
    let options = getOptions(this) as TemplateLoaderOptions;

    let template = minify(html, minifierOptions).trim();
    let error = '';

    switch (options.mode) {
        case 'vue': {
            let vueResult = compile(template);
            // console.log('vue template: ' + file + '\n' + vueResult);
            let error = vueResult.errors[0];
            if (!error) {
                template = '{render:' + functionWrap(vueResult.render)
                    + ',staticRenderFns:' + functionArrayWrap(vueResult.staticRenderFns)
                    + '}';
            }
            break;
        }
        case 'string': {
            template = JSON.stringify(template);
            break;
        }
        default: {
            error = 'Unknown template-loader mode: ' + options.mode;
        }
    }

    template = 'module.exports = ' + template;
    // console.log("Templatify > " + file + "\n" + template);

    if (error) {
        this.callback(Error(error));
        return;
    }

    if (this.sourceMap) {
        let gen = new SourceMapGenerator({
            file: this.resourcePath + '.js'
        });

        gen.addMapping({
            source: this.resourcePath,
            generated: {
                column: 0,
                line: 1
            },
            original: {
                column: 0,
                line: 1
            }
        });

        gen.setSourceContent(this.resourcePath, html);

        this.callback(null, template, gen.toString());
    } else {
        this.callback(null, template);
    }
};
