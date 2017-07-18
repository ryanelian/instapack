import * as stream from 'stream';
import * as prettyJSON from 'prettyjson';
import * as gutil from 'gulp-util';

export let PipeErrorHandler = function (this: stream, error) {
    try {
        console.log(prettyJSON.render(error, {
            keysColor: 'red',
            dashColor: 'red',
        }));
    } catch (ex) {
        gutil.log(error);
    }
    this.emit('end');
}
