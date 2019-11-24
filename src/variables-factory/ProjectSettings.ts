export interface ProjectSettings {
    root: string;
    input: string;
    output: string;
    jsOut: string;
    cssOut: string;
    port1: number;
    alias: MapLikeObject<string>;
    externals: MapLikeObject<string | string[] | MapLikeObject<string | string[]>>;
    namespace: string | undefined;
    copy: CopyOption[];
}

export interface CopyOption {
    library: string;
    files: string[];
    destination: string;
}
