import * as vscode from 'vscode';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'code-check.showMetrics';
    this.statusBarItem.show();

    this.updateStatus('$(shield) Code Check', 'Code Check is ready');
  }

  public updateStatus(text: string, tooltip?: string): void {
    this.statusBarItem.text = text;
    if (tooltip) {
      this.statusBarItem.tooltip = tooltip;
    }
  }

  public showProgress(message: string): void {
    this.statusBarItem.text = `$(loading~spin) ${message}`;
    this.statusBarItem.tooltip = message;
  }

  public showError(message: string): void {
    this.statusBarItem.text = `$(error) ${message}`;
    this.statusBarItem.tooltip = message;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.errorBackground'
    );

    // Clear error styling after 5 seconds
    setTimeout(() => {
      this.statusBarItem.backgroundColor = undefined;
    }, 5000);
  }

  public showWarning(message: string): void {
    this.statusBarItem.text = `$(warning) ${message}`;
    this.statusBarItem.tooltip = message;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );

    // Clear warning styling after 5 seconds
    setTimeout(() => {
      this.statusBarItem.backgroundColor = undefined;
    }, 5000);
  }

  public showSuccess(message: string): void {
    this.statusBarItem.text = `$(check) ${message}`;
    this.statusBarItem.tooltip = message;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.background'
    );
  }

  public hide(): void {
    this.statusBarItem.hide();
  }

  public show(): void {
    this.statusBarItem.show();
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
