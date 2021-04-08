"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueTypeScriptParser = void 0;
const tryImportFrom_1 = require("./importers/tryImportFrom");
class VueTypeScriptParser {
    constructor(version, dir) {
        this.version = 0;
        if (version.startsWith('2')) {
            this.version = 2;
            this.vue2Compiler = tryImportFrom_1.tryImportFrom('vue-template-compiler', dir);
        }
        else if (version.startsWith('3')) {
            this.version = 3;
            this.vue3Compiler = tryImportFrom_1.tryImportFrom('@vue/compiler-sfc', dir);
        }
        else {
            throw new Error('Unknown Vue.js version: ' + this.version);
        }
    }
    parse(sourceCode) {
        if (this.version === 2) {
            return this.parseVue2SingleFileComponent(sourceCode);
        }
        if (this.version === 3) {
            return this.parseVue3SingleFileComponent(sourceCode);
        }
        throw new Error('Unknown Vue.js version: ' + this.version);
    }
    parseVue2SingleFileComponent(sourceCode) {
        var _a;
        if (!this.vue2Compiler) {
            throw new Error('Vue.js version 2 compiler service is not loaded!');
        }
        const sfc = this.vue2Compiler.parseComponent(sourceCode);
        if (!sfc.script || !sfc.script.start) {
            return '';
        }
        if (sfc.script.lang !== 'ts') {
            return '';
        }
        const start = sfc.script.start;
        const newlinesCount = (_a = sourceCode.substr(0, start).match(/\r\n|\n|\r/g)) === null || _a === void 0 ? void 0 : _a.length;
        let result = sfc.script.content;
        if (newlinesCount) {
            for (let x = 0; x < newlinesCount; x++) {
                result = '//\n' + result;
            }
        }
        return result;
    }
    parseVue3SingleFileComponent(sourceCode) {
        if (!this.vue3Compiler) {
            throw new Error('Vue.js version 3 compiler service is not loaded!');
        }
        const sfc = this.vue3Compiler.parse(sourceCode);
        if (!sfc.descriptor.script) {
            return '';
        }
        if (sfc.descriptor.script.lang !== 'ts') {
            return '';
        }
        const start = sfc.descriptor.script.loc.start.line;
        let result = sfc.descriptor.script.content;
        for (let line = 0; line < start - 1; line++) {
            result = '//\n' + result;
        }
        return result;
    }
}
exports.VueTypeScriptParser = VueTypeScriptParser;
