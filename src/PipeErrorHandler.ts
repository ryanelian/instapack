import * as stream from 'stream';
import glog from './GulpLog';
import chalk from 'chalk';
import { PrettyObject } from './PrettyObject';

let p = new PrettyObject();

/**
 * An error handler for gulp compilation using plumber plugin.
 * Outputs a colored, formatted output when possible and emits an stream end event.
 * @param this 
 * @param error 
 */
export default function PipeErrorHandler(this: stream, error) {
    try {
        console.error(p.render(error));
    } catch (ex) {
        console.error(chalk.red(error));
    }
    this.emit('end');
}
