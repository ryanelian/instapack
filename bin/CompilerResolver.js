"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryGetProjectESLint = exports.resolveVue2TemplateCompiler = void 0;
const fse = require("fs-extra");
const resolve = require("enhanced-resolve");
const Shout_1 = require("./Shout");
const chalk = require("chalk");
const VueTemplateCompiler = require("vue-template-compiler");
const upath = require("upath");
function resolveAsync(basePath, query) {
    return new Promise((ok, reject) => {
        resolve(basePath, query, (err, result) => {
            if (err) {
                reject(err);
            }
            else if (!result) {
                reject(`Resolve resulted in undefined value: ${basePath} imports ${query}`);
            }
            else {
                ok(result);
            }
        });
    });
}
async function tryGetProjectPackageVersion(projectBasePath, packageName) {
    try {
        let jsonPath = await resolveAsync(projectBasePath, packageName + '/package.json');
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
async function tryGetProjectPackage(projectBasePath, packageName) {
    try {
        let modulePath = await resolveAsync(projectBasePath, packageName);
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
async function resolveVue2TemplateCompiler(projectBasePath) {
    const instapackVueCompilerVersion = require('vue-template-compiler/package.json')['version'];
    const vueVersion = await tryGetProjectPackageVersion(projectBasePath, 'vue');
    try {
        const vueCompilerVersion = await tryGetProjectPackageVersion(projectBasePath, 'vue-template-compiler');
        if (!vueVersion || !vueCompilerVersion) {
            throw new Error('Project Vue / Vue Template Compiler packages are not found.');
        }
        if (vueVersion !== vueCompilerVersion) {
            Shout_1.Shout.warning(`Project vue (${vueVersion}) and vue-template-compiler (${vueCompilerVersion}) version mismatch!`
                + chalk.grey(`
Fix the project package.json and make sure to use the same version for both:
    npm install vue-template-compiler@${vueVersion} -D -E
`));
            Shout_1.Shout.warning('Fallback to instapack default built-in Vue Template Compiler...');
            throw new Error('Project vue and vue-template-compiler version mismatched!');
        }
        const compilerPath = await resolveAsync(projectBasePath, 'vue-template-compiler');
        Shout_1.Shout.timed('Using project Vue Template Compiler', chalk.green(vueCompilerVersion));
        return require(compilerPath);
    }
    catch (err) {
        if (vueVersion && vueVersion !== instapackVueCompilerVersion) {
            Shout_1.Shout.warning(`instapack built-in vue-template-compiler (${instapackVueCompilerVersion}) and project vue (${vueVersion}) version mismatch!`
                + chalk.grey(`
This may introduce bugs to the application. Please add a custom vue-template-compiler dependency to the project:
    npm install vue-template-compiler@${vueVersion} -D -E
`));
        }
        return VueTemplateCompiler;
    }
}
exports.resolveVue2TemplateCompiler = resolveVue2TemplateCompiler;
async function tryGetProjectESLint(projectBasePath, indexTsPath) {
    try {
        const eslintModule = await tryGetProjectPackage(projectBasePath, 'eslint');
        if (!eslintModule) {
            return undefined;
        }
        const ESLint = eslintModule.ESLint;
        const linter = new ESLint({
            cwd: projectBasePath
        });
        await linter.calculateConfigForFile(indexTsPath);
        return {
            linter: linter,
            version: ESLint.version
        };
    }
    catch (error) {
        return undefined;
    }
}
exports.tryGetProjectESLint = tryGetProjectESLint;
