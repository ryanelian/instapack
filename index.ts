import { Compiler } from './src/Compiler';
import { Scaffold } from './src/Scaffold';

export class Instapack {

  build(taskName: string, isProduction: boolean, watchMode: boolean) {
    let compiler = new Compiler(isProduction, watchMode);
    compiler.build(taskName);
  }

  scaffold(template: string) {
    let scaffold = new Scaffold();
    scaffold.usingTemplate(template);
  }

}
