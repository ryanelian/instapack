export interface IProjectSettings {
    root: string;
    input: string;
    output: string;
    jsOut: string;
    cssOut: string;
    port1: number;
    port2: number;
    alias: IMapLike<string>;
    externals: IMapLike<string>;
}
