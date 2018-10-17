"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VueTemplateCompiler = require("vue-template-compiler");
function parseTypeScriptInVueFile(raw) {
    let parse = VueTemplateCompiler.parseComponent(raw);
    if (!parse.script) {
        return '';
    }
    if (parse.script.lang !== 'ts') {
        return '';
    }
    let charIndex = parse.script.start;
    let newlines = raw.substr(0, charIndex).match(/\r\n|\n|\r/g);
    let code = parse.script.content;
    if (newlines) {
        for (let newline of newlines) {
            code = '//' + newline + code;
        }
    }
    return code;
}
exports.parseTypeScriptInVueFile = parseTypeScriptInVueFile;
