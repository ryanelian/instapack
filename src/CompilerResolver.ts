import * as fse from 'fs-extra';
import { ResolverFactory } from 'enhanced-resolve';
import { Shout } from './Shout';
import chalk = require('chalk');

interface EnhancedResolver {
    resolve: (context: {}, lookupStartPath: string, request: string, resolveContext: {}, callback: (error: Error, resolution: string) => void) => void;
}

/**
 * Invoke enhanced-resolve custom resolver as a Promise.
 * @param lookupStartPath 
 * @param request 
 */
function resolveAsync(customResolver: EnhancedResolver, lookupStartPath: string, request: string): Promise<string> {
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

export interface CompilerRoute {
    compiler: unknown;
    compilerPath: string;
}

const vueCompilerResolveCache: MapLikeObject<CompilerRoute> = {};

async function tryGetProjectVueVersion(resolver: EnhancedResolver, projectBasePath: string): Promise<string | undefined> {
    try {
        const vueJsonPath = await resolveAsync(resolver, projectBasePath, 'vue/package.json');
        const vueJson = await fse.readJson(vueJsonPath);
        const vueVersion = vueJson['version'];
        return vueVersion;
    } catch (error) {
        return undefined;
    }
}

async function tryGetProjectVueCompilerVersion(resolver: EnhancedResolver, projectBasePath: string): Promise<string | undefined> {
    try {
        const vueCompilerJsonPath = await resolveAsync(resolver, projectBasePath, 'vue-template-compiler/package.json');
        const vueCompilerJson = await fse.readJson(vueCompilerJsonPath);
        const vueCompilerVersion = vueCompilerJson['version'];

        return vueCompilerVersion;
    } catch (error) {
        return undefined;
    }
}

export async function resolveVueTemplateCompiler(projectBasePath: string): Promise<CompilerRoute> {
    if (vueCompilerResolveCache[projectBasePath]) {
        return vueCompilerResolveCache[projectBasePath];
    }

    const resolver = ResolverFactory.createResolver({
        fileSystem: fse
    });

    let compilerRoute: CompilerRoute;
    const instapackVueCompilerVersion: string = require('vue-template-compiler/package.json')['version'];
    const vueVersion = await tryGetProjectVueVersion(resolver, projectBasePath);

    try {
        const vueCompilerVersion = await tryGetProjectVueCompilerVersion(resolver, projectBasePath);

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

        const compilerPath = await resolveAsync(resolver, projectBasePath, 'vue-template-compiler');
        compilerRoute = {
            compiler: require(compilerPath),
            compilerPath: compilerPath
        };

        Shout.timed('Using project Vue Template Compiler', chalk.green(vueCompilerVersion));
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
