"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTypeScriptInVueFile = void 0;
const VueTemplateCompiler = require("vue-template-compiler");
function parseTypeScriptInVueFile(raw) {
    const parse = VueTemplateCompiler.parseComponent(raw);
    if (!parse.script || !parse.script.start) {
        return '';
    }
    if (parse.script.lang !== 'ts') {
        return '';
    }
    const charIndex = parse.script.start;
    const newlines = raw.substr(0, charIndex).match(/\r\n|\n|\r/g);
    let code = parse.script.content;
    if (newlines) {
        for (const newline of newlines) {
            code = '//' + newline + code;
        }
    }
    return code;
}
exports.parseTypeScriptInVueFile = parseTypeScriptInVueFile;
