"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const enhanced_resolve_1 = require("enhanced-resolve");
const fs = require("fs");
function resolveAsync(customResolver, lookupStartPath, request) {
    return new Promise((ok, reject) => {
        customResolver.resolve({}, lookupStartPath, request, {}, (error, resolution) => {
            if (error) {
                reject(error);
            }
            else {
                ok(resolution);
            }
        });
    });
}
async function sassImport(source, request) {
    const lookupStartPath = upath.dirname(source);
    const requestFileName = upath.basename(request);
    const requestDir = upath.dirname(request);
    if (requestFileName.startsWith('_') === false) {
        const partialFolderLookups = [lookupStartPath];
        if (requestDir !== '.') {
            partialFolderLookups.push('node_modules');
        }
        const partialSassResolver = enhanced_resolve_1.ResolverFactory.createResolver({
            fileSystem: fs,
            extensions: ['.scss'],
            modules: partialFolderLookups,
            mainFiles: [],
            descriptionFiles: []
        });
        const partialFileName = '_' + upath.addExt(requestFileName, '.scss');
        const partialRequest = upath.join(requestDir, partialFileName);
        try {
            return await resolveAsync(partialSassResolver, lookupStartPath, partialRequest);
        }
        catch (ex) {
        }
    }
    const sassResolver = enhanced_resolve_1.ResolverFactory.createResolver({
        fileSystem: fs,
        extensions: ['.scss'],
        modules: [lookupStartPath, 'node_modules'],
        mainFiles: ['_index', 'index'],
        descriptionFiles: [],
    });
    try {
        return await resolveAsync(sassResolver, lookupStartPath, request);
    }
    catch (ex) {
    }
    const cssResolver = enhanced_resolve_1.ResolverFactory.createResolver({
        fileSystem: fs,
        extensions: ['.css'],
        modules: [lookupStartPath, 'node_modules'],
        mainFields: ['style']
    });
    return await resolveAsync(cssResolver, lookupStartPath, request);
}
exports.sassImport = sassImport;
function sassImporter(request, source, done) {
    sassImport(source, request).then(resolution => {
        done({
            file: resolution
        });
    }).catch(error => {
        done(error);
    });
}
exports.sassImporter = sassImporter;
