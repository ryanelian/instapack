import * as upath from 'upath';
import resolve = require("enhanced-resolve");
import fs = require('fs');

/**
 * Implements a smarter Sass @import logic,
 * which performs resolution into node_modules and package.json:style!
 * @param source 
 * @param request 
 */
export function sassImport(source: string, request: string): string {
    // https://github.com/ryanelian/instapack/issues/99
    // source               :   "E:/VS/MyProject/client/css/index.scss"
    // request / @import    :   "@ryan/something"

    const lookupStartPath = upath.dirname(source);        // E:/VS/MyProject/client/css/
    const requestFileName = upath.basename(request);      // something
    const requestDir = upath.dirname(request);            // @ryan/

    if (requestFileName.startsWith('_') === false) {
        const partialFolderLookups = [lookupStartPath];
        if (requestDir !== '.') {
            // upath.dirname('test') === '.'
            // upath.dirname('test/') === '.' && upath.basename('test/') === 'test'
            // @import 'test' must not be resolved into /node_modules/_test.scss
            partialFolderLookups.push('node_modules');
        }

        const resolvePartialSCSS = resolve.create.sync({
            fileSystem: fs,
            extensions: ['.scss'],
            modules: partialFolderLookups,
            mainFiles: [],
            descriptionFiles: []
        });

        const partialFileName = '_' + upath.addExt(requestFileName, '.scss');     // _something.scss
        const partialRequest = upath.join(requestDir, partialFileName);           // @ryan/_something.scss

        // 3: E:/VS/MyProject/client/css/@ryan/_something.scss      (Standard)
        // 8: E:/VS/MyProject/node_modules/@ryan/_something.scss    (Standard+)
        try {
            return resolvePartialSCSS(lookupStartPath, partialRequest);
        } catch (ex) {
            // continue module resolution
        }
    }

    const resolveSCSS = resolve.create.sync({
        fileSystem: fs,
        extensions: ['.scss'],
        modules: [lookupStartPath, 'node_modules'],
        mainFiles: ['_index', 'index'],
        descriptionFiles: [],
        // mainFields: ['sass']
    });

    // 2: E:/VS/MyProject/client/css/@ryan/something.scss               (Standard)
    // 5: E:/VS/MyProject/client/css/@ryan/something/_index.scss        (Standard https://github.com/sass/sass/issues/690)
    // 5: E:/VS/MyProject/client/css/@ryan/something/index.scss         (Standard https://github.com/sass/sass/issues/690) 
    // 7: E:/VS/MyProject/node_modules/@ryan/something.scss             (Standard+)
    // 7: E:/VS/MyProject/node_modules/@ryan/something/_index.scss      (Standard+)
    // 7: E:/VS/MyProject/node_modules/@ryan/something/index.scss       (Standard+)
    try {
        return resolveSCSS(lookupStartPath, request);
    } catch (ex) {
        // continue module resolution
    }

    const resolveCSS = resolve.create.sync({
        fileSystem: fs,
        extensions: ['.css'],
        modules: [lookupStartPath, 'node_modules'],
        mainFields: ['style']
    });

    // http://sass.logdown.com/posts/7807041-feature-watchcss-imports-and-css-compatibility
    // 4: E:/VS/MyProject/client/css/@ryan/something.css                    (Standard)
    // 6: E:/VS/MyProject/client/css/@ryan/something/index.css              (Standard)
    // 9: E:/VS/MyProject/node_modules/@ryan/something.css                  (Standard+)
    // 9: E:/VS/MyProject/node_modules/@ryan/something/index.css            (Standard+)
    // 10: E:/VS/MyProject/node_modules/@ryan/something/package.json:style  (Custom, Node-like)
    return resolveCSS(lookupStartPath, request);

    // Standard+: when using node-sass includePaths option set to the node_modules folder. (Older instapack behavior)
}
