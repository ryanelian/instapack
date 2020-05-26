declare module "eslint" {
    export interface ESLintOptions {
        cwd: string;
    }

    export interface LintResult {
        messages: LintMessage[];
    }

    export interface LintMessage {
        ruleId: string;
        message: string;
        line: number;
        column: number;
    }

    export interface LintTextOptions {
        filePath: string;
    }

    export class ESLint {
        constructor(options: ESLintOptions);
        lintText(code: string, options: LintTextOptions): Promise<LintResult[]>;
        calculateConfigForFile(filePath): Promise<unknown>;
        static version: string;
    }
}
