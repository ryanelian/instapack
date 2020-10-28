import { tryImportFrom } from './importers/tryImportFrom';

declare type Vue2Compiler = typeof import('vue-template-compiler');
declare type Vue3Compiler = typeof import('@vue/compiler-sfc');

export class VueTypeScriptParser {
    constructor(
        version: number,
        vue2Compiler: Vue2Compiler | undefined,
        vue3Compiler: Vue3Compiler | undefined
    ) {
        this.version = version;
        this.vue2Compiler = vue2Compiler;
        this.vue3Compiler = vue3Compiler;
    }

    private version = 0;
    private vue2Compiler: Vue2Compiler | undefined;
    private vue3Compiler: Vue3Compiler | undefined;

    static async createFrom(
        version: string,
        projectFolder: string
    ): Promise<VueTypeScriptParser> {
        const v2 = version.startsWith('2');
        const v3 = version.startsWith('3');

        return new VueTypeScriptParser(
            v2 ? 2 : (v3 ? 3 : 0),
            v2 ? await tryImportFrom<Vue2Compiler>(projectFolder, 'vue-template-compiler') : undefined,
            v3 ? await tryImportFrom<Vue3Compiler>(projectFolder, '@vue/compiler-sfc') : undefined
        );
    }

    parse(sourceCode: string): string {
        if (this.version === 2) {
            return this.parseVue2SingleFileComponent(sourceCode);
        }
        if (this.version === 3) {
            return this.parseVue3SingleFileComponent(sourceCode);
        }
        throw new Error('Unknown Vue.js version: ' + this.version);
    }

    /**
     * The logic for extracting TypeScript code block from Vue Single-File Component.
     * @param raw 
     */
    parseVue2SingleFileComponent(sourceCode: string): string {
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
        const newlinesCount = sourceCode.substr(0, start).match(/\r\n|\n|\r/g)?.length;
        let result = sfc.script.content;

        if (newlinesCount) {
            for (let x = 0; x < newlinesCount; x++) {
                result = '//\n' + result;
            }
        }

        // console.log(newlinesCount);
        // console.log('//////////////////');
        // console.log(sourceCode);
        // console.log('//////////////////');
        // console.log(result);
        return result;
    }

    parseVue3SingleFileComponent(sourceCode: string): string {
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

        // console.log(start);
        // console.log('//////////////////');
        // console.log(sourceCode);
        // console.log('//////////////////');
        // console.log(result);
        return result;
    }
}
