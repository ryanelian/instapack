type Severity = 0 | 1 | 2;

interface LintMessage {
    column: number;
    line: number;
    endColumn?: number;
    endLine?: number;
    ruleId: string | null;
    message: string;
    messageId?: string;
    nodeType?: string;
    fatal?: true;
    severity: Severity;
}
