import * as vscode from 'vscode';

const QUOTES: { [index: string]: boolean } = {
    '"': true,
    '\'': true,
    '`': true
};

export function platformWin32(): boolean {
    return process.platform.includes('win32');
}

export function quote(value: string): string {
    const quoteSign = platformWin32() ? '"' : `'`;
    return [quoteSign, value, quoteSign].join('');
}

const TEST_NAME_REGEX = /(describe|it|test)\(("([^"]+)"|`([^`]+)`|'([^']+)'),/;

export function fixSlashes(s: string): string {
    return platformWin32() ? s.replace(/\\/g, '/') : s;
}

export const SLASH = '/';

function unquote(s: string): string {
    if (QUOTES[s[0]]) {
        s = s.substring(1);
    }

    if (QUOTES[s[s.length - 1]]) {
        s = s.substring(0, s.length - 1);
    }

    return s;
}

export function getTestName(editor: vscode.TextEditor) {
    const { selection, document } = editor;

    if (!selection.isEmpty) {
        const text = unquote(document.getText(selection));
        return text;
    }

    for (let currentLine = selection.active.line; currentLine >= 0; currentLine--) {
        const text = document.getText(new vscode.Range(currentLine, 0, currentLine, 100000));
        const match = TEST_NAME_REGEX.exec(text);

        if (match) {
            const testTitle = match[2];
            const charStart = text.indexOf(testTitle);
            const charEnd = charStart + testTitle.length;
            editor.selection = new vscode.Selection(currentLine, charStart, currentLine, charEnd);
            return unquote(testTitle);
        }
    }

    return '';
}
