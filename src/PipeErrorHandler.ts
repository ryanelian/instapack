import * as stream from 'stream';
import * as prettyJSON from 'prettyjson';
import glog from './GulpLog';
import * as chalk from 'chalk';

/**
 * An error handler for gulp compilation using plumber plugin.
 * Outputs a colored, formatted output when possible and emits an stream end event.
 * @param this 
 * @param error 
 */
export default function PipeErrorHandler(this: stream, error) {
    try {
        console.log(prettyJSON.render(error, {
            keysColor: 'red',
            dashColor: 'red',
        }));
    } catch (ex) {
        console.log(chalk.red(error));
    }
    this.emit('end');
}
