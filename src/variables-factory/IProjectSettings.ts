export interface IProjectSettings {
    root: string;
    input: string;
    output: string;
    jsOut: string;
    cssOut: string;
    port1: number;
    alias: IMapLike<string>;
    externals: IMapLike<string | string[] | IMapLike<string | string[]>>;
    namespace: string | undefined;
    copy: ICopyOption[];
}

export interface ICopyOption {
    library: string;
    files: string[];
    destination: string;
}
