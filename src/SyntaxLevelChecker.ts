import * as TypeScript from 'typescript';

function is2015Syntax(node: TypeScript.Node) {
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
        // includes checking for *generator() methods
        return true;
    }

    if (TypeScript.isForOfStatement(node)) {
        return true;
    }

    if (TypeScript.isNumericLiteral(node)) {
        let bitflag = node['numericLiteralFlags'];
        if (bitflag) {
            if (bitflag & (1 << 8)) {
                // internal flag: Octal
                // https://github.com/Microsoft/TypeScript/blob/a4a1bed88bdcb160eff032790f05629f9fa955b4/src/compiler/types.ts#L1659
                return true;
            }
            if (bitflag & (1 << 7)) {
                // internal flag: Binary
                // https://github.com/Microsoft/TypeScript/blob/a4a1bed88bdcb160eff032790f05629f9fa955b4/src/compiler/types.ts#L1658
                return true;
            }
        }
    }

    if (TypeScript.isTemplateExpression(node)) {
        // includes TaggedTemplateExpression since it consists of Identifier + TemplateExpression
        return true;
    }

    // while we can't detect new RegExp call, we can try parsing ordinary /regexp/uy
    // if (TypeScript.isRegularExpressionLiteral(node)) {
    //     let flags = node.text.substr(node.text.lastIndexOf('/') + 1);
    //     // console.log(flags);
    //     if (flags.includes('u') || flags.includes('y')) {
    //         return true;
    //     }
    // }

    if (TypeScript.isArrayBindingPattern(node)) {
        return true;
    }

    if (TypeScript.isObjectBindingPattern(node)) {
        return true;
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
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

    // '\u' escaping
    // http://www.ecma-international.org/ecma-262/6.0/#sec-literals-string-literals

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target
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

    // also needs to be checked because super can be used outside class!
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super
    if (node.kind === TypeScript.SyntaxKind.SuperKeyword) {
        return true;
    }

    if (TypeScript.isFunctionDeclaration(node) || TypeScript.isFunctionExpression(node)) {
        if (node.asteriskToken) {
            // function* generator()
            return true;
        }
    }

    if (TypeScript.isYieldExpression(node)) {
        return true;
    }

    return false;
}

function is2016Syntax(node: TypeScript.Node) {
    if (node.kind === TypeScript.SyntaxKind.AsteriskAsteriskToken) {
        return true;
    }

    if (node.kind === TypeScript.SyntaxKind.AsteriskAsteriskEqualsToken) {
        return true;
    }

    if (TypeScript.isArrayBindingPattern(node)) {
        if (TypeScript.isBindingElement(node.parent) && node.parent.dotDotDotToken) {
            return true;
        }
    }

    return false;
}

function is2017Syntax(node: TypeScript.Node) {
    if (node.kind === TypeScript.SyntaxKind.AsyncKeyword) {
        return true;
    }

    if (TypeScript.isAwaitExpression(node)) {
        return true;
    }

    if (TypeScript.isFunctionLike(node) && node.parameters.hasTrailingComma) {
        return true;
    }

    if (TypeScript.isCallExpression(node) && node.arguments.hasTrailingComma) {
        return true;
    }

    return false;
}

function is2018Syntax(node: TypeScript.Node) {
    if (TypeScript.isObjectBindingPattern(node)) {
        return node.elements.some(Q => Boolean(Q.dotDotDotToken));
    }

    // SpreadAssignment extends ObjectLiteralElement:  { ...spread }
    if (TypeScript.isSpreadAssignment(node)) {
        return true;
    }

    if (TypeScript.isFunctionDeclaration(node) || TypeScript.isFunctionExpression(node) || TypeScript.isMethodDeclaration(node)) {
        if (node.asteriskToken && node.modifiers) {
            let hasAsync = node.modifiers.some(Q => Q.kind === TypeScript.SyntaxKind.AsyncKeyword);
            return hasAsync;
        }
    }

    if (TypeScript.isForOfStatement(node)) {
        if (node.awaitModifier) {
            return true;
        }
    }

    // /flag/s: https://tc39.github.io/ecma262/#sec-get-regexp.prototype.dotAll
    // if (TypeScript.isRegularExpressionLiteral(node)) {
    //     console.log(node);
    // }

    return false
}

function is2019Syntax(node: TypeScript.Node) {
    if (TypeScript.isCatchClause(node)) {
        if (!node.variableDeclaration) {
            return true;
        }
    }

    return false;
}

function is2020Syntax(node: TypeScript.Node) {
    if (TypeScript.isBigIntLiteral(node)) {
        return true;
    }

    // we don't check for globalThis because it is technically a basic syntax (polyfill available)
    return false;
}

function isESNextSyntax(node: TypeScript.Node) {
    if (node.kind === TypeScript.SyntaxKind.QuestionQuestionToken) {
        return true;
    }
    
    if (TypeScript.isOptionalChain(node)) {
        return true;
    }

    if (TypeScript.isDecorator(node)) {
        return true;
    }

    if (TypeScript.isPropertyDeclaration(node)) {
        return true;
    }

    // Ryan: test omitted for now due to performance concerns...
    // if (TypeScript.isNumericLiteral(node)){
    //     let numberSource = node.getFullText();
    //     if (numberSource.includes("_")){
    //         return true;
    //     }
    // }

    return false;
}

function traverse(node: TypeScript.Node, cb: (node: TypeScript.Node) => void, depth = 0) {
    // console.log(new Array(depth).join('--'), TypeScript.SyntaxKind[node.kind].toString());
    // console.log(new Array(depth).join('//'), node.getFullText());
    cb(node);

    node.forEachChild(c => {
        traverse(c, cb, depth + 1);
    });
}

interface IScriptLevel {
    level: TypeScript.ScriptTarget;
    source: TypeScript.SourceFile;
}

export function checkSyntaxLevel(sourcePath: string, source: string, languageTarget: TypeScript.ScriptTarget): IScriptLevel {
    // let sw = process.hrtime();
    let ast = TypeScript.createSourceFile(sourcePath, source, languageTarget, true, TypeScript.ScriptKind.JS);
    // console.log(sourcePath, prettyHrTime(process.hrtime(sw)));

    let level = TypeScript.ScriptTarget.ES5;
    traverse(ast, node => {
        if (level < TypeScript.ScriptTarget.ESNext && isESNextSyntax(node)) {
            level = TypeScript.ScriptTarget.ESNext;
        } else if (level < TypeScript.ScriptTarget.ES2020 && is2020Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2020;
        } else if (level < TypeScript.ScriptTarget.ES2019 && is2019Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2019;
        } else if (level < TypeScript.ScriptTarget.ES2018 && is2018Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2018;
        } else if (level < TypeScript.ScriptTarget.ES2017 && is2017Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2017;
        } else if (level < TypeScript.ScriptTarget.ES2016 && is2016Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2016;
        } else if (level < TypeScript.ScriptTarget.ES2015 && is2015Syntax(node)) {
            level = TypeScript.ScriptTarget.ES2015;
        }
    });
    // console.log(sourcePath, prettyHrTime(process.hrtime(sw)));

    return {
        level: level,
        source: ast
    };
}
