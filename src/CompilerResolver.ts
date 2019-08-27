import * as fse from 'fs-extra';
import * as upath from 'upath';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';
import { Shout } from './Shout';
import chalk from 'chalk';

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

export interface ICompilerRoute {
    compiler: any;
    compilerPath: string;
}

let vueCompilerResolveCache: IMapLike<ICompilerRoute> = {};

async function tryGetProjectVueVersion(resolver, projectBasePath: string): Promise<string | undefined> {
    try {
        let vueJsonPath = await resolveAsync(resolver, projectBasePath, 'vue/package.json');
        let vueJson = await fse.readJson(vueJsonPath);
        let vueVersion = vueJson['version'];
        return vueVersion;
    } catch (error) {
        return undefined;
    }
}

async function tryGetProjectVueCompilerVersion(resolver, projectBasePath: string): Promise<string | undefined> {
    try {
        let vueCompilerJsonPath = await resolveAsync(resolver, projectBasePath, 'vue-template-compiler/package.json');
        let vueCompilerJson = await fse.readJson(vueCompilerJsonPath);
        let vueCompilerVersion = vueCompilerJson['version'];

        return vueCompilerVersion;
    } catch (error) {
        return undefined;
    }
}

export async function resolveVueTemplateCompiler(projectBasePath: string): Promise<ICompilerRoute> {
    if (vueCompilerResolveCache[projectBasePath]) {
        return vueCompilerResolveCache[projectBasePath];
    }

    let resolver = ResolverFactory.createResolver({
        fileSystem: new NodeJsInputFileSystem()
    });

    let compilerRoute: ICompilerRoute;
    let instapackVueCompilerVersion: string = require('vue-template-compiler/package.json')['version'];
    let vueVersion = await tryGetProjectVueVersion(resolver, projectBasePath);

    try {
        let vueCompilerVersion = await tryGetProjectVueCompilerVersion(resolver, projectBasePath);

        if (!vueVersion || !vueCompilerVersion) {
            throw new Error('Project Vue / Vue Template Compiler packages are not found.');
        }

        if (vueVersion !== vueCompilerVersion) {
            Shout.warning(`Project vue (${vueVersion}) and vue-template-compiler (${vueCompilerVersion}) version mismatch!`
                + chalk.grey(`
Fix the project package.json and make sure to use the same version for both:
    yarn add vue-template-compiler@${vueVersion} -D -E
                        OR
    npm install vue-template-compiler@${vueVersion} -D -E
`));
            Shout.warning('Fallback to instapack default built-in Vue Template Compiler...');
            throw new Error('Project vue and vue-template-compiler version mismatched!');
        }

        let compilerPath = await resolveAsync(resolver, projectBasePath, 'vue-template-compiler');
        compilerRoute = {
            compiler: require(compilerPath),
            compilerPath: compilerPath
        };

        Shout.timed(chalk.green('Vue Template Compiler'),
            'project custom version:',
            chalk.yellow(vueCompilerVersion)
        );
    } catch (err) {
        if (vueVersion && vueVersion !== instapackVueCompilerVersion) {
            Shout.warning(`instapack built-in vue-template-compiler (${instapackVueCompilerVersion}) and project vue (${vueVersion}) version mismatch!`
                + chalk.grey(`
This may introduce bugs to the application. Please add a custom vue-template-compiler dependency to the project:
    yarn add vue-template-compiler@${vueVersion} -D -E
                        OR
    npm install vue-template-compiler@${vueVersion} -D -E
`));
        }

        compilerRoute = {
            compiler: require('vue-template-compiler'),
            compilerPath: require.resolve('vue-template-compiler')
        };
    }

    return compilerRoute;
}
