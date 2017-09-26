import { Compiler } from './Compiler';
import { Settings } from './Settings';
import { Scaffold } from './Scaffold';

import * as fse from 'fs-extra';
import * as path from 'path';

/**
 * Exposes methods for developing a web application client project.
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
        this.settings = Settings.tryRead();
    }

    /**
     * Performs web application client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param minify 
     * @param watch 
     * @param map 
     * @param serverPort 
     */
    build(taskName: string, minify: boolean, watch: boolean, map: boolean, serverPort: number) {
        let compiler = new Compiler(this.settings, {
            minify: minify,
            watch: watch,
            map: map,
            serverPort: serverPort
        });
        let scaffold = new Scaffold();

        if (compiler.needPackageRestore()) {
            scaffold.restorePackages();
        }
        compiler.build(taskName);
    }

    /**
     * Performs web application client project initialization using a template shipped in templates folder.
     * @param template 
     */
    scaffold(template: string) {
        let scaffold = new Scaffold();
        scaffold.usingTemplate(template);
    }

    /**
     * Empties the content of the JavaScript and CSS output folder.
     */
    clean() {
        let dir1 = this.settings.outputCssFolder;
        let dir2 = this.settings.outputJsFolder;

        fse.emptyDir(dir1, err => {
            if (err) {
                console.log('Error when cleaning ' + dir1);
                console.log(err);
            } else {
                console.log('Successfully cleaned ' + dir1);
            }
        });

        fse.emptyDir(dir2, err => {
            if (err) {
                console.log('Error when cleaning ' + dir2);
                console.log(err);
            } else {
                console.log('Successfully cleaned ' + dir2);
            }
        });
    }
}
