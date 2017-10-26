import { Compiler, CompilerFlags } from './Compiler';
import { Settings } from './Settings';
import { Scaffold } from './Scaffold';

import * as fse from 'fs-extra';
import * as path from 'path';

/**
 * Exposes methods for developing a web app client project.
 */
export = class instapack {
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
        let templatesFolder = path.join(__dirname, '..', 'templates');

        let ar = fse.readdirSync(templatesFolder);
        let templates = ar.filter(Q => {
            let test = path.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });

        // This getter should only be called on `ipack new` command call. 
        // console.log(templates);
        return templates;
    }

    /**
     * Settings used for performing build tasks.
     */
    settings: Settings;

    /**
     * Constructs instapack class instance using settings read from project.json. 
     */
    constructor() {
        this.settings = Settings.tryReadFromPackageJson();
    }

    /**
     * Performs web app client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param flags 
     */
    build(taskName: string, flags: CompilerFlags) {
        let compiler = new Compiler(this.settings, flags);
        let scaffold = new Scaffold();

        if (compiler.needPackageRestore) {
            scaffold.restorePackages();
        }
        compiler.build(taskName);
    }

    /**
     * Performs new web app client project scaffolding using a template shipped in templates folder.
     * @param template 
     */
    async scaffold(template: string) {
        let scaffold = new Scaffold();
        await scaffold.usingTemplate(template);
    }

    /**
     * Cleans the JavaScript and CSS output folder and the temporary cache folder.
     */
    async clean() {
        let cleanCSS = fse.emptyDir(this.settings.outputCssFolder);
        let cleanJS = fse.emptyDir(this.settings.outputJsFolder);

        if (await fse.pathExists(this.settings.cacheFolder)) {
            try {
                let yesterday = new Date().getTime() - 24 * 60 * 60 * 1000;

                let files = await fse.readdir(this.settings.cacheFolder);
                for (let file of files) {
                    let filePath = path.join(this.settings.cacheFolder, file);
                    let stat = await fse.stat(filePath);
                    if (stat.ctimeMs < yesterday) {
                        await fse.remove(filePath);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }

        try {
            await cleanJS;
            console.log('Clean successful: ' + this.settings.outputJsFolder);
            await cleanCSS;
            console.log('Clean successful: ' + this.settings.outputCssFolder);
        } catch (error) {
            console.error(error);
        }
    }
}
