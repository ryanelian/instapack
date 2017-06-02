import { Compiler } from './src/Compiler';
import { Scaffold } from './src/Scaffold';

/**
 * Exposes methods for developing a web application client project.
 */
export class instapack {

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
   * Performs web application client project compilation using a pre-configured task.
   * productionMode will minify the build output when set to true.
   * watchMode allows automatic rebuild on source code changes.
   * @param taskName 
   * @param isProduction 
   * @param watchMode 
   */
  build(taskName: string, productionMode: boolean, watchMode: boolean) {
    let compiler = new Compiler(productionMode, watchMode);
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
}
