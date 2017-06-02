import * as plumber from 'gulp-plumber';
import * as gutil from 'gulp-util';
import * as prettyJSON from 'prettyjson';

/**
 * Creates a new build pipe for preventing subsequent pipes from stopping gulp-watch if build error occurs.
 */
export function ErrorHandler() {
    return plumber({
        errorHandler: function (this: any, error) {
            try {
                console.log(prettyJSON.render(error));
            } catch (ex) {
                gutil.log(error);
            }
            this.emit('end');
        }
    });
};
