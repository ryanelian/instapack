"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sassImport = void 0;
const upath = require("upath");
const resolve = require("enhanced-resolve");
const fs = require("fs");
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
            fileSystem: fs,
            extensions: ['.scss'],
            modules: partialFolderLookups,
            mainFiles: [],
            descriptionFiles: []
        });
        const partialFileName = '_' + upath.addExt(requestFileName, '.scss');
        const partialRequest = upath.join(requestDir, partialFileName);
        try {
            return resolvePartialSCSS(lookupStartPath, partialRequest);
        }
        catch (ex) {
        }
    }
    const resolveSCSS = resolve.create.sync({
        fileSystem: fs,
        extensions: ['.scss'],
        modules: [lookupStartPath, 'node_modules'],
        mainFiles: ['_index', 'index'],
        descriptionFiles: [],
    });
    try {
        return resolveSCSS(lookupStartPath, request);
    }
    catch (ex) {
    }
    const resolveCSS = resolve.create.sync({
        fileSystem: fs,
        extensions: ['.css'],
        modules: [lookupStartPath, 'node_modules'],
        mainFields: ['style']
    });
    return resolveCSS(lookupStartPath, request);
}
exports.sassImport = sassImport;
