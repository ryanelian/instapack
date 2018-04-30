import { RawSourceMap } from 'source-map';

/**
 * Values required for operating UglifyJS 3 and webpack-sources, collected into an object.
 */
export interface IMinifyInputs {
    fileName: string;
    code: string;
    map?: RawSourceMap;
}
