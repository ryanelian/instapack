import { Compiler } from './Compiler';
import { ICompilerFlags } from './CompilerUtilities';
import { Settings } from './Settings';
import { Scaffold } from './Scaffold';

import * as fse from 'fs-extra';
import * as upath from 'upath';

/**
 * Exposes methods for developing a web app client project.
 */
export = class instapack {
    
    /**
     * Gets the project folder path. (Known as root in Settings.)
     */
    private readonly projectFolder: string;

    /**
     * Gets the settings used for performing build tasks.
     */
    readonly settings: Settings;

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
     * Constructs instapack class instance using settings read from project.json. 
     */
    constructor(projectFolder: string) {
        this.projectFolder = projectFolder;
        this.settings = Settings.tryReadFromPackageJson(projectFolder);
    }

    /**
     * Performs web app client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param flags 
     */
    build(taskName: string, flags: ICompilerFlags) {
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
        await scaffold.usingTemplate(template, this.projectFolder);
    }

    /**
     * Cleans the JavaScript and CSS output folder and the temporary cache folder.
     */
    async clean() {
        let cleanCSS = fse.emptyDir(this.settings.outputCssFolder);
        let cleanJS = fse.emptyDir(this.settings.outputJsFolder);

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
