import * as through2 from 'through2';
import * as stream from 'stream';

/**
 * Creates a new build pipe for buffering a streaming vinyl file.
 */
export function VinylBuffer() {
    return through2.obj(function (chunk, enc, next) {

        if (!chunk.isStream()) {
            next(null, chunk);
            return;
        }

        let buffers = [];
        (chunk.contents as stream).on('data', (data: Buffer) => {
            buffers.push(data);
        });

        (chunk.contents as stream).on('error', (error: Error) => {
            next(error);
        });

        (chunk.contents as stream).on('end', () => {
            chunk.contents = Buffer.concat(buffers);
            next(null, chunk);
        });
    });
}
