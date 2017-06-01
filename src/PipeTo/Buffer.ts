import * as through2 from 'through2';
import * as vinyl from 'vinyl';
import * as BufferList from 'bl';

let Buffer = () => {
    return through2.obj(function (chunk, enc, next) {
        let pipe = this;

        if (chunk.isNull()) {
            pipe.push(chunk);
            return next();
        }
        if (chunk.isBuffer()) {
            pipe.push(chunk);
            return next();
        }

        chunk.contents.pipe(BufferList(function (error, data) {
            if (error) {
                return next(error);
            }

            let file = new vinyl({
                path: chunk.path,
                contents: data
            });

            pipe.push(file);
            return next();
        }));
    });
};

export { Buffer }
