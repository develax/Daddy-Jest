import * as vscode from 'vscode';
import * as _path from 'path';
import * as fs from 'fs';
import { getTestName, platformWin32, quote, fixSlashes, SLASH } from './util';

export async function activate(context: vscode.ExtensionContext) {
	vscode.window.onDidCloseTerminal((t) => {
		terminal = null;
	});

	context.subscriptions.push(runCurrentJest);
	context.subscriptions.push(debugDebugJest);
}

// this method is called when your extension is deactivated
export function deactivate() {
	return;
}

let terminal: vscode.Terminal | null;
const ERRORS = {
	TEST_NOT_FOUND: "Jest test(s) not found. Put cursor within `describe` or `it` or `test` block and repeat the command."
};


/**
 * Helpers
 */
const runCurrentJest = vscode.commands.registerCommand("daddy-jest.run-current-jest", async () => {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		return;
	}

	const configuration = '';// fixSlashes(getJestConfigPath());
	const testName = getTestName(editor);

	if (!testName) {
		vscode.window.showErrorMessage(ERRORS.TEST_NOT_FOUND);
		return;
	}

	const fileName = fixSlashes(editor.document.fileName);
	//vscode.window.showInformationMessage(`Run test(s): '${fileName}::${testName}'`);

	const jestPath = fixSlashes(getJestPath());
	let command = `node ${quote(jestPath)} ${quote(fileName)}`;

	if (configuration) {
		command += ` -c ${quote(configuration)}`;
	}

	if (testName) {
		command += ` -t ${quote(testName)}`;
	}

	await editor.document.save();
	printInTerminal(command, true);
});

const debugDebugJest = vscode.commands.registerCommand('daddy-jest.debug-current-jest', async () => {
	try {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const testName = getTestName(editor);

		if (!testName) {
			vscode.window.showErrorMessage(ERRORS.TEST_NOT_FOUND);
			return;
		}

		const fileName = fixSlashes(editor.document.fileName);
		//vscode.window.showInformationMessage(`Run test: '${testName}' from file '${fileName}'`);

		const jestConfigPaths: string[] | null = getJestConfigPaths();

		class Config {
			args: string[] = [];
			console = 'integratedTerminal';
			internalConsoleOptions = 'neverOpen';
			name = 'Debug Jest Tests';
			program = getJestPath();
			request = 'launch';
			type = 'node';
		}

		const config = new Config();

		config.args.push('-i');
		config.args.push(fileName);

		if (jestConfigPaths) {
			const jestConfigPathsFiltered = jestConfigPaths.filter(p => !p.endsWith('package.json'));

			if (jestConfigPathsFiltered.length < jestConfigPaths.length) {
				vscode.window.showWarningMessage("You shouldn't have added 'package.json' to Daddy-Jest config path(s)! It's used by default.");
			}

			// If not appropriate config is found then Jest will use 'package.json' by default.
			for (const jestConfigPath of jestConfigPathsFiltered) {
				if (JestConfig.canApply(jestConfigPath, fileName)) {
					config.args.push('-c');
					config.args.push(jestConfigPath);
					break;
				}
			}
		}

		config.args.push('-t');
		config.args.push(testName);
		await editor.document.save();
		vscode.debug.startDebugging(undefined, config);
	}
	catch (exc) {
		vscode.window.showErrorMessage(exc.message);
	}
});

abstract class JestConfig {
	static canApply(jestConfigPath: string, fileName: string): boolean {
		const jestConfigContent: string = fs.readFileSync(jestConfigPath, "utf-8");
		const jest: any = JSON.parse(jestConfigContent);

		if (!jest.rootDir) {
			throw new Error(`Jest config '${jestConfigPath}' doesn't contain 'rootDir' property.`);
		}

		const jestRootDir = joinPaths(getDirName(jestConfigPath), jest.rootDir);
		const testFilePath = getDirName(fileName);
		const identicalStart = findIdenticalStart(testFilePath, jestRootDir);
		return (identicalStart.length > getRootFolder().length);
	}
}

async function clearTerminal() {
	await vscode.commands.executeCommand('workbench.action.terminal.clear');
}

function getDirName(path: string): string {
	return fixSlashes(_path.join(_path.dirname(path), SLASH));
}

function joinPaths(...paths: string[]): string {
	return fixSlashes(_path.join(...paths, SLASH));
}

function printInTerminal(text: string, clear = false) {
	if (!terminal) {
		terminal = vscode.window.createTerminal('jest');
	}

	terminal.show();

	if (clear) {
		clearTerminal();
	}

	terminal.sendText(text);
}

function getJestPath(): string {
	const jestPath: any = vscode.workspace.getConfiguration().get('daddy-jest.jestPath');

	if (jestPath) {
		return jestPath;
	}

	const defaultJestFolder = platformWin32() ? 'node_modules/jest/bin/jest.js' : 'node_modules/.bin/jest';
	return _path.join(getRootFolder(), defaultJestFolder);
}

function getJestConfigPaths(): string[] | null {
	const paths: string[] = vscode.workspace.getConfiguration().get('daddy-jest.jestConfigPaths') || [];
	const path: string | undefined = vscode.workspace.getConfiguration().get('daddy-jest.jestConfigPath');
	const allPaths = paths.slice(); // Make a copy because there is a bug: `getConfiguration()` accumulates array elements if you add directly to it.

	if (path) {
		allPaths.push(path);
	}

	if (!allPaths.length) {
		return null;
	}

	return allPaths.map(p => fixSlashes(_path.join(getRootFolder(), p)));
}

function getRootFolder(): string {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders) {
		throw new Error("At least one workspace folder should be open.");
	}

	return fixSlashes(_path.join(workspaceFolders[0].uri.fsPath, SLASH));
}

function findIdenticalStart(s1: string, s2: string): string {
	let identicalLen = 0;

	for (let i = 0; i < s1.length; i++) {
		if (i >= s2.length || s1[i] !== s2[i]) {
			break;
		}

		identicalLen++;
	}

	return s1.substring(0, identicalLen);
}

function similar_text(first: string, second: string, percent: number = 0) {
	//   example 1: similar_text('Hello World!', 'Hello phpjs!');
	//   returns 1: 7
	//   example 2: similar_text('Hello World!', null);
	//   returns 2: 0

	first += '';
	second += '';

	var pos1 = 0,
		pos2 = 0,
		max = 0,
		firstLength = first.length,
		secondLength = second.length,
		p, q, l, sum;

	max = 0;

	for (p = 0; p < firstLength; p++) {
		for (q = 0; q < secondLength; q++) {
			// tslint:disable-next-line: curly
			for (l = 0; (p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++);
			if (l > max) {
				max = l;
				pos1 = p;
				pos2 = q;
			}
		}
	}

	sum = max;

	if (sum) {
		if (pos1 && pos2) {
			sum += similar_text(first.substr(0, pos1), second.substr(0, pos2));
		}

		if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) {
			sum += similar_text(first.substr(pos1 + max, firstLength - pos1 - max), second.substr(pos2 + max,
				secondLength - pos2 - max));
		}
	}

	if (!percent) {
		return sum;
	} else {
		return (sum * 200) / (firstLength + secondLength);
	}
}
