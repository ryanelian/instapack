"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vue_template_compiler_1 = require("vue-template-compiler");
const source_map_1 = require("source-map");
function functionWrap(s) {
    return 'function(){' + s + '}';
}
function functionArrayWrap(ar) {
    let result = ar.map(s => functionWrap(s)).join(',');
    return '[' + result + ']';
}
module.exports = function (html) {
    let template = '';
    let vueResult = vue_template_compiler_1.compile(template);
    let error = vueResult.errors[0];
    if (!error) {
        template = '{render:' + functionWrap(vueResult.render)
            + ',staticRenderFns:' + functionArrayWrap(vueResult.staticRenderFns)
            + '}';
    }
    template = 'module.exports = ' + template;
    if (error) {
        this.callback(Error(error));
        return;
    }
    if (this.sourceMap) {
        let gen = new source_map_1.SourceMapGenerator({
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
        this.callback(null, template, sm);
    }
    else {
        this.callback(null, template);
    }
};
