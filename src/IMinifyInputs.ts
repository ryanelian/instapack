import { MinifyOptions } from 'uglify-js';
import { RawSourceMap } from 'source-map';

/**
 * Values required for operating UglifyJS 3 and webpack-sources, collected into an object.
 */
export interface IMinifyInputs {
    payload: IMapLike<string>;
    options?: MinifyOptions;
    code?: string;
    map?: RawSourceMap;
}
