import * as through2 from 'through2';
import * as BufferList from 'bl';

/**
 * Creates a new build pipe for buffering a streaming vinyl file.
 */
export function Buffer() {
    return through2.obj(function (chunk, enc, next) {

        if (!chunk.isStream()) {
            next(null, chunk);
            return;
        }

        chunk.contents.pipe(BufferList(function (error, data) {
            if (error) {
                return next(error);
            }

            chunk.contents = data;
            next(null, chunk);
        }));
    });
};
