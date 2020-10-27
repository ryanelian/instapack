"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTypeScriptInVue3File = exports.parseTypeScriptInVueFile = void 0;
const VueTemplateCompiler = require("vue-template-compiler");
const compiler_sfc_1 = require("@vue/compiler-sfc");
function parseTypeScriptInVueFile(raw) {
    const sfc = VueTemplateCompiler.parseComponent(raw);
    if (!sfc.script || !sfc.script.start) {
        return '';
    }
    if (sfc.script.lang !== 'ts') {
        return '';
    }
    const start = sfc.script.start;
    const lines = raw.substr(0, start).match(/\r\n|\n|\r/g);
    let code = sfc.script.content;
    if (lines) {
        for (const newline of lines) {
            code = '//' + newline + code;
        }
    }
    return code;
}
exports.parseTypeScriptInVueFile = parseTypeScriptInVueFile;
function parseTypeScriptInVue3File(raw) {
    const sfc = compiler_sfc_1.parse(raw);
    if (!sfc.descriptor.script) {
        return '';
    }
    if (sfc.descriptor.script.lang !== 'ts') {
        return '';
    }
    const start = sfc.descriptor.script.loc.start.line;
    let code = sfc.descriptor.script.content;
    for (let line = 0; line < start; line++) {
        code = '//\n' + code;
    }
    return code;
}
exports.parseTypeScriptInVue3File = parseTypeScriptInVue3File;
