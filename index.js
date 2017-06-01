import { Compiler } from './src/Compiler';
import { Scaffold } from './src/Scaffold';
export class Instapack {
    build(taskName, isProduction, watchMode) {
        let compiler = new Compiler(isProduction, watchMode);
        compiler.build(taskName);
    }
    scaffold(template) {
        let scaffold = new Scaffold();
        scaffold.usingTemplate(template);
    }
}
