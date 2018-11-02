"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
function is2015Syntax(node) {
    if (TypeScript.isParameter(node)) {
        if (node.initializer) {
            return true;
        }
        if (node.dotDotDotToken) {
            return true;
        }
    }
    if (TypeScript.isSpreadElement(node)) {
        return true;
    }
    if (TypeScript.isComputedPropertyName(node)) {
        return true;
    }
    if (TypeScript.isShorthandPropertyAssignment(node)) {
        return true;
    }
    if (TypeScript.isMethodDeclaration(node)) {
        return true;
    }
    if (TypeScript.isForOfStatement(node)) {
        return true;
    }
    if (TypeScript.isNumericLiteral(node)) {
        let bitflag = node['numericLiteralFlags'];
        if (bitflag) {
            if (bitflag & (1 << 8)) {
                return true;
            }
            if (bitflag & (1 << 7)) {
                return true;
            }
        }
    }
    if (TypeScript.isTemplateExpression(node)) {
        return true;
    }
    if (TypeScript.isArrayBindingPattern(node)) {
        return true;
    }
    if (TypeScript.isObjectBindingPattern(node)) {
        return true;
    }
    if (TypeScript.isBinaryExpression(node)) {
        if (node.operatorToken.kind === TypeScript.SyntaxKind.EqualsToken) {
            if (TypeScript.isArrayLiteralExpression(node.left)) {
                return true;
            }
            if (TypeScript.isObjectLiteralExpression(node.left)) {
                return true;
            }
        }
    }
    if (TypeScript.isMetaProperty(node)) {
        if (node.keywordToken === TypeScript.SyntaxKind.NewKeyword) {
            if (node.name.escapedText === 'target') {
                return true;
            }
        }
    }
    if (TypeScript.isVariableDeclarationList(node)) {
        if (node.flags & TypeScript.NodeFlags.Const || node.flags & TypeScript.NodeFlags.Let) {
            return true;
        }
    }
    if (TypeScript.isArrowFunction(node)) {
        return true;
    }
    if (TypeScript.isClassDeclaration(node)) {
        return true;
    }
    if (TypeScript.isClassExpression(node)) {
        return true;
    }
    if (node.kind === TypeScript.SyntaxKind.SuperKeyword) {
        return true;
    }
    if (TypeScript.isFunctionDeclaration(node)) {
        if (node.asteriskToken) {
            return true;
        }
    }
    if (TypeScript.isYieldExpression(node)) {
        return true;
    }
    return false;
}
function is2016Syntax(node) {
    if (node.kind === TypeScript.SyntaxKind.AsteriskAsteriskToken) {
        return true;
    }
    if (node.kind === TypeScript.SyntaxKind.AsteriskAsteriskEqualsToken) {
        return true;
    }
    return false;
}
function is2017Syntax(node) {
    if (node.kind === TypeScript.SyntaxKind.AsyncKeyword) {
        return true;
    }
    if (node.kind === TypeScript.SyntaxKind.AwaitExpression) {
        return true;
    }
    return false;
}
function is2018Syntax(node) {
    if (TypeScript.isObjectBindingPattern(node)) {
        return node.elements.some(Q => Boolean(Q.dotDotDotToken));
    }
    if (TypeScript.isSpreadAssignment(node)) {
        return true;
    }
    if (TypeScript.isFunctionDeclaration(node)) {
        if (node.asteriskToken && node.modifiers) {
            let a = node.modifiers.some(Q => Q.kind === TypeScript.SyntaxKind.AsyncKeyword);
            return a;
        }
    }
    if (TypeScript.isMethodDeclaration(node)) {
        if (node.asteriskToken && node.modifiers) {
            let a = node.modifiers.some(Q => Q.kind === TypeScript.SyntaxKind.AsyncKeyword);
            return a;
        }
    }
    return false;
}
function is2019Syntax(node) {
    if (TypeScript.isCatchClause(node)) {
        if (!node.variableDeclaration) {
            return true;
        }
    }
    return false;
}
function traverse(node, cb, depth = 0) {
    cb(node);
    node.forEachChild(c => {
        traverse(c, cb, depth + 1);
    });
}
function checkLevel(sourcePath, source, languageTarget) {
    let ast = TypeScript.createSourceFile(sourcePath, source, languageTarget, true, TypeScript.ScriptKind.JS);
    let level = TypeScript.ScriptTarget.ES5;
    traverse(ast, node => {
        if (level < TypeScript.ScriptTarget.ESNext && is2019Syntax(node)) {
            level = TypeScript.ScriptTarget.ESNext;
        }
        else if (level < TypeScript.ScriptTarget.ES2018 && is2018Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2018;
        }
        else if (level < TypeScript.ScriptTarget.ES2017 && is2017Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2017;
        }
        else if (level < TypeScript.ScriptTarget.ES2016 && is2016Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2016;
        }
        else if (level < TypeScript.ScriptTarget.ES2015 && is2015Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2015;
        }
    });
    return {
        level: level,
        source: ast.getSourceFile()
    };
}
exports.checkLevel = checkLevel;
