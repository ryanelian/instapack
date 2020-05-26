"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sassImport = void 0;
const upath = require("upath");
const resolve = require("enhanced-resolve");
function sassImport(source, request) {
    const lookupStartPath = upath.dirname(source);
    const requestFileName = upath.basename(request);
    const requestDir = upath.dirname(request);
    if (requestFileName.startsWith('_') === false) {
        const partialFolderLookups = [lookupStartPath];
        if (requestDir !== '.') {
            partialFolderLookups.push('node_modules');
        }
        const resolvePartialSCSS = resolve.create.sync({
            extensions: ['.scss'],
            modules: partialFolderLookups,
            mainFiles: [],
            descriptionFiles: []
        });
        const partialFileName = '_' + upath.addExt(requestFileName, '.scss');
        const partialRequest = upath.join(requestDir, partialFileName);
        try {
            const result = resolvePartialSCSS(lookupStartPath, partialRequest);
            if (result) {
                return result;
            }
        }
        catch (ex) {
        }
    }
    const resolveSCSS = resolve.create.sync({
        extensions: ['.scss'],
        modules: [lookupStartPath, 'node_modules'],
        mainFiles: ['_index', 'index'],
        descriptionFiles: [],
    });
    try {
        const result = resolveSCSS(lookupStartPath, request);
        if (result) {
            return result;
        }
    }
    catch (ex) {
    }
    const resolveCSS = resolve.create.sync({
        extensions: ['.css'],
        modules: [lookupStartPath, 'node_modules'],
        mainFields: ['style']
    });
    const cssResult = resolveCSS(lookupStartPath, request);
    if (cssResult) {
        return cssResult;
    }
    else {
        throw new Error(`CSS module not found: ${source} importing ${request}`);
    }
}
exports.sassImport = sassImport;
