"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryGetProjectESLint = exports.resolveVueTemplateCompiler = void 0;
const fse = require("fs-extra");
const enhanced_resolve_1 = require("enhanced-resolve");
const Shout_1 = require("./Shout");
const chalk = require("chalk");
const VueTemplateCompiler = require("vue-template-compiler");
const upath = require("upath");
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
async function tryGetProjectPackageVersion(resolver, projectBasePath, packageName) {
    try {
        let jsonPath = await resolveAsync(resolver, projectBasePath, packageName + '/package.json');
        jsonPath = upath.toUnix(jsonPath);
        if (jsonPath.startsWith(projectBasePath) === false) {
            return undefined;
        }
        const json = await fse.readJson(jsonPath);
        const version = json['version'];
        return version;
    }
    catch (error) {
        return undefined;
    }
}
async function tryGetProjectPackage(resolver, projectBasePath, packageName) {
    try {
        let modulePath = await resolveAsync(resolver, projectBasePath, packageName);
        modulePath = upath.toUnix(modulePath);
        if (modulePath.startsWith(projectBasePath) === false) {
            return undefined;
        }
        return require(modulePath);
    }
    catch (error) {
        return undefined;
    }
}
async function resolveVueTemplateCompiler(projectBasePath) {
    const resolver = enhanced_resolve_1.ResolverFactory.createResolver({
        fileSystem: fse
    });
    const instapackVueCompilerVersion = require('vue-template-compiler/package.json')['version'];
    const vueVersion = await tryGetProjectPackageVersion(resolver, projectBasePath, 'vue');
    try {
        const vueCompilerVersion = await tryGetProjectPackageVersion(resolver, projectBasePath, 'vue-template-compiler');
        if (!vueVersion || !vueCompilerVersion) {
            throw new Error('Project Vue / Vue Template Compiler packages are not found.');
        }
        if (vueVersion !== vueCompilerVersion) {
            Shout_1.Shout.warning(`Project vue (${vueVersion}) and vue-template-compiler (${vueCompilerVersion}) version mismatch!`
                + chalk.grey(`
Fix the project package.json and make sure to use the same version for both:
    yarn add vue-template-compiler@${vueVersion} -D -E
                        OR
    npm install vue-template-compiler@${vueVersion} -D -E
`));
            Shout_1.Shout.warning('Fallback to instapack default built-in Vue Template Compiler...');
            throw new Error('Project vue and vue-template-compiler version mismatched!');
        }
        const compilerPath = await resolveAsync(resolver, projectBasePath, 'vue-template-compiler');
        Shout_1.Shout.timed('Using project Vue Template Compiler', chalk.green(vueCompilerVersion));
        return require(compilerPath);
    }
    catch (err) {
        if (vueVersion && vueVersion !== instapackVueCompilerVersion) {
            Shout_1.Shout.warning(`instapack built-in vue-template-compiler (${instapackVueCompilerVersion}) and project vue (${vueVersion}) version mismatch!`
                + chalk.grey(`
This may introduce bugs to the application. Please add a custom vue-template-compiler dependency to the project:
    yarn add vue-template-compiler@${vueVersion} -D -E
                        OR
    npm install vue-template-compiler@${vueVersion} -D -E
`));
        }
        return VueTemplateCompiler;
    }
}
exports.resolveVueTemplateCompiler = resolveVueTemplateCompiler;
async function tryGetProjectESLint(projectBasePath, indexTsPath) {
    const resolver = enhanced_resolve_1.ResolverFactory.createResolver({
        fileSystem: fse
    });
    try {
        const eslint = await tryGetProjectPackage(resolver, projectBasePath, 'eslint');
        const cliEngine = new eslint.CLIEngine({});
        cliEngine.getConfigForFile(indexTsPath);
        return eslint.CLIEngine;
    }
    catch (error) {
        return undefined;
    }
}
exports.tryGetProjectESLint = tryGetProjectESLint;
