import * as through2 from 'through2';
import * as vinyl from 'vinyl';

/**
 * Creates a new build pipe for converting fs stream into vinyl stream.
 * @param filename 
 */
export function Vinyl(filename: string) {
    let pass = true;
    let stream = through2.obj();
    let file = new vinyl({
        path: filename,
        contents: stream
    });

    return through2.obj(function (chunk, enc, next) {
        if (pass) {
            this.push(file);
            pass = false;
        }

        stream.push(chunk);
        next();
    }, function () {
        stream.push(null);
        this.push(null);
    });
};
