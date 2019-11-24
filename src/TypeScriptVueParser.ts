import VueTemplateCompiler = require('vue-template-compiler');

/**
 * The logic for extracting TypeScript code block from Vue Single-File Component.
 * @param raw 
 */
export function parseTypeScriptInVueFile(raw: string): string {
    const parse = VueTemplateCompiler.parseComponent(raw);

    if (!parse.script || !parse.script.start) {
        return '';
    }

    if (parse.script.lang !== 'ts') {
        return '';
    }

    const charIndex: number = parse.script.start;
    const newlines = raw.substr(0, charIndex).match(/\r\n|\n|\r/g);
    let code: string = parse.script.content;

    if (newlines) {
        for (const newline of newlines) {
            code = '//' + newline + code;
        }
    }

    // console.log(code);
    return code;
}
