import * as vscode from 'vscode';
import { CodeCheckEngine } from '@code-check/core-engine';
import { formatOutput } from '@code-check/shared';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'code-check.helloWorld',
    () => {
      const engine = new CodeCheckEngine();
      const result = engine.analyze('sample code');
      vscode.window.showInformationMessage(formatOutput(result));
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Cleanup code here
}
