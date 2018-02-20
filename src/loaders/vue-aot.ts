import { loader } from 'webpack';
import { compile } from 'vue-template-compiler';
import { SourceMapGenerator } from 'source-map';

function functionWrap(s: string) {
    return 'function(){' + s + '}';
}

function functionArrayWrap(ar: string[]) {
    let result = ar.map(s => functionWrap(s)).join(',');
    return '[' + result + ']';
}

module.exports = function (this: loader.LoaderContext, html: string) {
    let template = '';
    let vueResult = compile(template);
    // console.log('vue template: ' + file + '\n' + vueResult);
    let error = vueResult.errors[0];
    if (!error) {
        template = '{render:' + functionWrap(vueResult.render)
            + ',staticRenderFns:' + functionArrayWrap(vueResult.staticRenderFns)
            + '}';
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
        let sm = gen.toJSON();
        // HACK: https://github.com/webpack/webpack-sources/issues/34
        this.callback(null, template, sm as any);
    } else {
        this.callback(null, template);
    }
};
