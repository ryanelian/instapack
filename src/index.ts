import fse from 'fs-extra';
import upath from 'upath';
import chalk from 'chalk';

import { ICommandLineFlags } from "./interfaces/ICommandLineFlags";
import { VariablesFactory } from "./VariablesFactory";
import { UserSettingsManager } from './UserSettingsManager';
import { PathFinder } from './PathFinder';
import { PackageManager } from './PackageManager';
import { Shout } from './Shout';
import { ToolOrchestrator } from './ToolOrchestrator';

/**
 * Exposes methods for developing a web app client project.
 */
export = class instapack {

    readonly projectFolder: string;

    /**
     * Constructs instapack class instance using settings read from project.json. 
     */
    constructor(projectFolder: string) {
        this.projectFolder = upath.normalize(projectFolder);
    }

    /**
     * Gets a list of string which contains tasks available for the build method.
     */
    get availableBuildTasks() {
        return ['all', 'js', 'css'];
    }

    /**
     * Gets a list of string which contains templates available for the scaffold method.
     */
    get availableTemplates() {
        let templatesFolder = upath.join(__dirname, '..', 'templates');

        let ar = fse.readdirSync(templatesFolder);
        let templates = ar.filter(Q => {
            let test = upath.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });

        // This getter should only be called on `ipack new` command call. 
        // console.log(templates);
        return templates;
    }

    /**
     * Gets all available keys for `instapack set` command.
     */
    get availableSettings() {
        return new UserSettingsManager().availableSettings;
    }

    /**
     * Performs web app client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param flags 
     */
    async build(taskName: string, flags: ICommandLineFlags) {

        let userMan = new UserSettingsManager();
        let v = new VariablesFactory();

        if (flags.verbose) {
            Shout.displayVerboseOutput = true;
        }

        // parallel IO
        let projectSettings = v.readProjectSettingsFrom(this.projectFolder);
        let dotEnv = v.readDotEnvFrom(this.projectFolder);
        let userSettings = userMan.readUserSettingsFrom(userMan.userSettingsFilePath);

        let variables = v.compile(flags, await projectSettings, await userSettings, await dotEnv);

        if (variables.muteNotification) {
            Shout.enableNotification = false;
        }

        if (variables.packageManager !== 'disabled') {
            let finder = new PathFinder(variables);
            let packageJsonPath = finder.packageJson;
            let packageJsonExists = await fse.pathExists(packageJsonPath);
            if (packageJsonExists) {
                try {
                    let pm = new PackageManager();
                    await pm.restore(variables.packageManager);
                } catch (error) {
                    Shout.error('when restoring package:', error);
                }
            } else {
                Shout.warning('unable to find', chalk.cyan(packageJsonPath), chalk.grey('skipping package restore...'));
            }
        }

        let tm = new ToolOrchestrator(variables);
        tm.outputBuildInformation();
        tm.build(taskName);
    }

    /**
     * Performs new web app client project scaffolding using a template shipped in templates folder.
     * @param template 
     */
    async scaffold(template: string) {
        let templateFolder = upath.join(__dirname, '../templates', template);

        let exist = await fse.pathExists(templateFolder);
        if (!exist) {
            Shout.error('Unable to find new project template for:', chalk.cyan(template));
            return;
        }

        let mergedPackageJson: any;
        let projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
        let templatePackageJsonPath = upath.join(templateFolder, 'package.json');
        if (await fse.pathExists(projectPackageJsonPath) && await fse.pathExists(templatePackageJsonPath)) {
            // would override, should merge fields instead: instapack, dependencies, and devDependencies
            let projectPackageJson = await fse.readJson(projectPackageJsonPath);
            let templatePackageJson = await fse.readJson(templatePackageJsonPath);

            mergedPackageJson = mergePackageJson(projectPackageJson, templatePackageJson);
        }

        console.log('Initializing new project using template:', chalk.cyan(template));
        console.log('Scaffolding project into your web app...');
        await fse.copy(templateFolder, this.projectFolder);

        if (mergedPackageJson) {
            console.log(`Merging ${chalk.blue('package.json')}...`);
            await fse.writeJson(projectPackageJsonPath, mergedPackageJson, {
                spaces: 2
            });
        }

        console.log(chalk.green('Scaffold completed.'), 'To build the app, type:', chalk.yellow('ipack'));
    }

    /**
     * Change an instapack user global setting.
     * @param key 
     * @param value 
     */
    async changeUserSettings(key: string, value: string) {
        let man = new UserSettingsManager();
        let valid = man.validate(key, value);
        if (!valid) {
            Shout.error('invalid setting! Please consult README.')
            return;
        }

        try {
            let file = man.userSettingsFilePath
            let settings = await man.readUserSettingsFrom(file);
            man.set(settings, key, value);
            await fse.outputJson(file, settings);
        } catch (error) {
            Shout.error('when saving new settings:', error);
        }
    }
}

/**
 * Sort an map-like object by its keys.
 * @param input 
 */
function objectSortByKeys(input) {
    let output: any = {};

    let keys = Object.keys(input).sort();
    for (let key of keys) {
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
function mergePackageJson(projectPackageJson, templatePackageJson) {
    let packageJson = JSON.parse(JSON.stringify(projectPackageJson));

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
        for (let packageName in templatePackageJson.dependencies) {
            if (packageJson.devDependencies[packageName]) {
                // override version of existing package in dev dependencies
                packageJson.devDependencies[packageName] = templatePackageJson.dependencies[packageName];
            } else {
                packageJson.dependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
        }
    }

    if (templatePackageJson.devDependencies) {
        for (let packageName in templatePackageJson.devDependencies) {
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
