"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const enhanced_resolve_1 = require("enhanced-resolve");
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
function sassImport(source, request) {
    return __awaiter(this, void 0, void 0, function* () {
        let lookupStartPath = upath.dirname(source);
        let requestFileName = upath.basename(request);
        let requestDir = upath.dirname(request);
        if (requestFileName.startsWith('_') === false) {
            let partialFolderLookups = [lookupStartPath];
            if (requestDir !== '.') {
                partialFolderLookups.push('node_modules');
            }
            let partialSassResolver = enhanced_resolve_1.ResolverFactory.createResolver({
                fileSystem: new enhanced_resolve_1.NodeJsInputFileSystem(),
                extensions: ['.scss'],
                modules: partialFolderLookups,
                mainFiles: [],
                descriptionFiles: []
            });
            let partialFileName = '_' + upath.addExt(requestFileName, '.scss');
            let partialRequest = upath.join(requestDir, partialFileName);
            try {
                return yield resolveAsync(partialSassResolver, lookupStartPath, partialRequest);
            }
            catch (error) {
            }
        }
        let sassResolver = enhanced_resolve_1.ResolverFactory.createResolver({
            fileSystem: new enhanced_resolve_1.NodeJsInputFileSystem(),
            extensions: ['.scss'],
            modules: [lookupStartPath, 'node_modules'],
            mainFiles: ['_index', 'index'],
            descriptionFiles: [],
        });
        try {
            return yield resolveAsync(sassResolver, lookupStartPath, request);
        }
        catch (error) {
        }
        let cssResolver = enhanced_resolve_1.ResolverFactory.createResolver({
            fileSystem: new enhanced_resolve_1.NodeJsInputFileSystem(),
            extensions: ['.css'],
            modules: [lookupStartPath, 'node_modules'],
            mainFields: ['style']
        });
        return yield resolveAsync(cssResolver, lookupStartPath, request);
    });
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
