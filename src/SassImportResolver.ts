import upath from 'upath';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';

/**
 * Invoke enhanced-resolve custom resolver as a Promise.
 * @param lookupStartPath 
 * @param request 
 */
function resolveAsync(customResolver, lookupStartPath: string, request: string) {
    return new Promise<string>((ok, reject) => {
        customResolver.resolve({}, lookupStartPath, request, {}, (error: Error, resolution: string) => {
            if (error) {
                reject(error);
            } else {
                // import resolution can be Windows / non-UNIX path!
                ok(resolution);
            }
        });
    });
}

/**
 * Implements a smarter Sass @import logic,
 * which performs resolution into node_modules and package.json:style!
 * @param source 
 * @param request 
 */
export async function sassImport(source: string, request: string): Promise<string> {
    // https://github.com/ryanelian/instapack/issues/99
    // source               :   "E:/VS/MyProject/client/css/index.scss"
    // request / @import    :   "@ryan/something"

    let lookupStartPath = upath.dirname(source);        // E:/VS/MyProject/client/css/
    let requestFileName = upath.basename(request);      // something
    let requestDir = upath.dirname(request);            // @ryan/

    if (requestFileName.startsWith('_') === false) {
        let partialFolderLookups = [lookupStartPath];
        if (requestDir !== '.') {
            // upath.dirname('test') === '.'
            // upath.dirname('test/') === '.' && upath.basename('test/') === 'test'
            // @import 'test' must not be resolved into /node_modules/_test.scss
            partialFolderLookups.push('node_modules');
        }

        let partialSassResolver = ResolverFactory.createResolver({
            fileSystem: new NodeJsInputFileSystem(),
            extensions: ['.scss'],
            modules: partialFolderLookups,
            mainFiles: [],
            descriptionFiles: []
        });

        let partialFileName = '_' + upath.addExt(requestFileName, '.scss');     // _something.scss
        let partialRequest = upath.join(requestDir, partialFileName);           // @ryan/_something.scss

        // 3: E:/VS/MyProject/client/css/@ryan/_something.scss      (Standard)
        // 8: E:/VS/MyProject/node_modules/@ryan/_something.scss    (Standard+)
        try {
            return await resolveAsync(partialSassResolver, lookupStartPath, partialRequest);
        } catch (error) {

        }
    }

    let sassResolver = ResolverFactory.createResolver({
        fileSystem: new NodeJsInputFileSystem(),
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
        return await resolveAsync(sassResolver, lookupStartPath, request);
    } catch (error) {

    }

    let cssResolver = ResolverFactory.createResolver({
        fileSystem: new NodeJsInputFileSystem(),
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
    return await resolveAsync(cssResolver, lookupStartPath, request);

    // Standard+: when using node-sass includePaths option set to the node_modules folder. (Older instapack behavior)
}

interface SassImporterCallbackParameter {
    file: string
}

type SassImporterCallback = (args: SassImporterCallbackParameter | Error) => {}

export function sassImporter(request: string, source: string, done: SassImporterCallback) {
    sassImport(source, request).then(resolution => {
        // console.log(source, '+', request, '=', resolution); console.log();
        done({
            file: resolution
        });
    }).catch(error => {
        done(error);
    });
}
