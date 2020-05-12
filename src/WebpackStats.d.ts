export interface WebpackError {
    stack: string;
    moduleId: string;
    loc: number;
}

export interface WebpackAsset {
    emitted: boolean;
    size: number;
    name: string;
}

export interface InstapackStats {
    errors: [string, WebpackError];
    warnings: string[];
    assets: WebpackAsset[];
}
