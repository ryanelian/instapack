import { Compiler } from './Compiler';
import { ICompilerFlags } from './CompilerUtilities';
import { Settings } from './Settings';

import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk from 'chalk';
import { GlobalSettingsManager } from './GlobalSettingsManager';
import { PackageManager } from './PackageManager';
import { Shout } from './Shout';

/**
 * Exposes methods for developing a web app client project.
 */
export = class instapack {
    /**
     * Gets the project folder path. (Known as root in Settings.)
     */
    private readonly projectFolder: string;

    /**
     * Gets the object responsible for reading and writing the instapack global settings.
     */
    readonly globalSettingsManager: GlobalSettingsManager;

    /**
     * Gets a list of string which contains tasks available for the build method.
     */
    get availableTasks() {
        return ['all', 'js', 'css', 'concat'];
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
        return this.globalSettingsManager.availableSettings;
    }

    /**
     * Constructs instapack class instance using settings read from project.json. 
     */
    constructor(projectFolder: string) {
        this.projectFolder = projectFolder;
        this.globalSettingsManager = new GlobalSettingsManager();
    }

    /**
     * Performs web app client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param flags 
     */
    async build(taskName: string, flags: ICompilerFlags) {

        let settings = await Settings.tryReadFromPackageJson(this.projectFolder);        
        let compiler = new Compiler(settings, flags);

        let globalSettings = await this.globalSettingsManager.tryRead();
        let packageManager = new PackageManager();

        // Shout.notify('Build start!');
        
        if (globalSettings.integrityCheck) {
            let packageJsonExists = await fse.pathExists(settings.packageJson);
            if (packageJsonExists) {
                try {
                    await packageManager.restore(globalSettings.packageManager);
                } catch (error) {
                    Shout.error('when restoring package:', error);
                }
            } else {
                Shout.warning('unable to find', chalk.cyan(settings.packageJson), chalk.grey('skipping package restore...'));
            }
        }

        compiler.build(taskName);
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

        console.log('Initializing new project using template:', chalk.cyan(template));
        console.log('Scaffolding project into your web app...');
        await fse.copy(templateFolder, this.projectFolder);
        console.log(chalk.green('Scaffold completed.'), 'To build the app, type:', chalk.yellow('ipack'));
    }

    /**
     * Cleans the JavaScript and CSS output folder and the temporary cache folder.
     */
    async clean() {
        let settings = await Settings.tryReadFromPackageJson(this.projectFolder);       
        let cleanCSS = fse.emptyDir(settings.outputCssFolder);
        let cleanJS = fse.emptyDir(settings.outputJsFolder);

        await cleanJS;
        console.log('Clean successful: ' + settings.outputJsFolder);
        await cleanCSS;
        console.log('Clean successful: ' + settings.outputCssFolder);
    }

    /**
     * Change an instapack global setting.
     * @param key 
     * @param value 
     */
    async changeGlobalSetting(key: string, value: string) {
        let valid = this.globalSettingsManager.validate(key, value);
        if (!valid) {
            Shout.error('invalid setting! Please consult README.')
            return;
        }

        try {
            await this.globalSettingsManager.set(key, value);
        } catch (error) {
            Shout.error('when saving new settings:', error);
        }
    }
}
