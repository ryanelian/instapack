import VueTemplateCompiler = require('vue-template-compiler');

/**
 * The logic for extracting TypeScript code block from Vue Single-File Component.
 * @param raw 
 */
export function parseTypeScriptInVueFile(raw: string): string {
    let parse = VueTemplateCompiler.parseComponent(raw);

    if (!parse.script) {
        return '';
    }

    if (parse.script.lang !== 'ts') {
        return '';
    }

    let charIndex: number = parse.script.start;
    let newlines = raw.substr(0, charIndex).match(/\r\n|\n|\r/g);
    let code: string = parse.script.content;

    if (newlines) {
        for (let newline of newlines) {
            code = '//' + newline + code;
        }
    }

    // console.log(code);
    return code;
}
