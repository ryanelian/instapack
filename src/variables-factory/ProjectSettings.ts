export interface ProjectSettings {
    root: string;
    input: string;
    output: string;
    jsOut: string;
    cssOut: string;
    port1: number;
    alias: MapLike<string>;
    externals: MapLike<string | string[] | MapLike<string | string[]>>;
    namespace: string | undefined;
    copy: CopyOption[];
}

export interface CopyOption {
    library: string;
    files: string[];
    destination: string;
}
