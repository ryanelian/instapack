interface WebpackError {
    stack: string;
    moduleId: string;
    loc: number;
}

interface WebpackAsset {
    emitted: boolean;
    size: number;
    name: string;
}

interface InstapackStats {
    errors: [string, WebpackError];
    warnings: string[];
    assets: WebpackAsset[];
}
