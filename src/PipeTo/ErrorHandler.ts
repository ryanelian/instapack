import * as plumber from 'gulp-plumber';
import * as gutil from 'gulp-util';

let ErrorHandler = () => {
    return plumber({
        errorHandler: function (this: any, error) {
            gutil.log(error);
            this.emit('end');
        }
    });
};

export { ErrorHandler }
