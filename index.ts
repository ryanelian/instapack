import { Compiler } from './src/Compiler';
import { Settings } from './src/Settings';
import { Scaffold } from './src/Scaffold';

import * as autoprefixer from 'autoprefixer';
import * as prettyJSON from 'prettyjson';

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
    return ['empty', 'aspnet', 'angularjs'];
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
   * @param productionMode 
   * @param watchMode 
   * @param serverPort 
   */
  build(taskName: string, productionMode: boolean, watchMode: boolean, serverPort: number) {
    let compiler = new Compiler(this.settings, {
      productionMode: productionMode,
      watchMode: watchMode,
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
   * Displays browser list used by autoprefixer, their statistics, and prefix rules.
   */
  displayAutoprefixInfo() {
    console.log(autoprefixer().info());
  }

  /**
   * Displays settings loaded from package.json, if exists.
   */
  displaySettings() {
    console.log(prettyJSON.render(this.settings));
  }
}
