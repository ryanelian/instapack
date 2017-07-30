import * as stream from 'stream';
import * as prettyJSON from 'prettyjson';
import glog from './GulpLog';
import * as chalk from 'chalk';

export default function PipeErrorHandler(this: stream, error) {
    try {
        console.log(prettyJSON.render(error, {
            keysColor: 'red',
            dashColor: 'red',
        }));
    } catch (ex) {
        glog(chalk.red(error));
    }
    this.emit('end');
}
