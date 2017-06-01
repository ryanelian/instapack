import * as gsize from 'gulp-size';
let SizeLog = () => {
    return gsize({
        showFiles: true,
        showTotal: false
    });
};
export { SizeLog };
