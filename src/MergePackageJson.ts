/**
 * Sort an map-like object by its keys.
 * @param input 
 */
export function objectSortByKeys(input) {
    const output: any = {};

    const keys = Object.keys(input).sort();
    for (const key of keys) {
        output[key] = input[key];
    }

    return output;
}

/**
 * Merge existing project package.json with incoming template package.json 
 * by overriding instapack setting and package versions. (Keep the rest intact)
 * @param projectPackageJson 
 * @param templatePackageJson 
 */
export function mergePackageJson(projectPackageJson, templatePackageJson) {
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
                // override version of existing package in dev dependencies
                packageJson.devDependencies[packageName] = templatePackageJson.dependencies[packageName];
            } else {
                packageJson.dependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
        }
    }

    if (templatePackageJson.devDependencies) {
        for (const packageName in templatePackageJson.devDependencies) {
            if (packageJson.dependencies[packageName]) {
                // override version of existing package in normal dependencies
                packageJson.dependencies[packageName] = templatePackageJson.devDependencies[packageName];
            } else {
                packageJson.devDependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
        }
    }

    packageJson.dependencies = objectSortByKeys(packageJson.dependencies);
    packageJson.devDependencies = objectSortByKeys(packageJson.devDependencies);
    return packageJson;
}
