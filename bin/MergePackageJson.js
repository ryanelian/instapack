"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePackageJson = exports.objectSortByKeys = void 0;
function objectSortByKeys(input) {
    const output = {};
    const keys = Object.keys(input).sort();
    for (const key of keys) {
        output[key] = input[key];
    }
    return output;
}
exports.objectSortByKeys = objectSortByKeys;
function mergePackageJson(projectPackageJson, templatePackageJson) {
    const packageJson = JSON.parse(JSON.stringify(projectPackageJson));
    if (templatePackageJson.instapack) {
        packageJson.instapack = templatePackageJson.instapack;
    }
    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }
    if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
    }
    if (templatePackageJson.dependencies) {
        for (const packageName in templatePackageJson.dependencies) {
            if (packageJson.devDependencies[packageName]) {
                packageJson.devDependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
            else {
                packageJson.dependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
        }
    }
    if (templatePackageJson.devDependencies) {
        for (const packageName in templatePackageJson.devDependencies) {
            if (packageJson.dependencies[packageName]) {
                packageJson.dependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
            else {
                packageJson.devDependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
        }
    }
    packageJson.dependencies = objectSortByKeys(packageJson.dependencies);
    packageJson.devDependencies = objectSortByKeys(packageJson.devDependencies);
    return packageJson;
}
exports.mergePackageJson = mergePackageJson;
