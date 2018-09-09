import { loader } from 'webpack';
import { minify } from 'html-minifier';
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

export = function (this: loader.LoaderContext, html: string) {
    let template = minify(html, minifierOptions).trim();

    let fileName = this.resourcePath.toLowerCase();
    if (fileName.endsWith('.vue.html')) {
        this.emitWarning('HTML was imported as plain string: Importing .vue.html module has been obsoleted due to improved .vue Single-File Components tooling!');
    }

    template = JSON.stringify(template);
    template = 'module.exports = ' + template;
    // console.log("Template compiled: " + fileName + "\n" + template);

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
        let sm: any = gen.toJSON(); // HACK78
        this.callback(null, template, sm);
    } else {
        this.callback(null, template);
    }
};
