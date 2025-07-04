import * as vscode from 'vscode';
import { DiagnosticsManager } from '../diagnostics/DiagnosticsManager';
import { AuditManager } from '../audit/AuditManager';
import { CodeIssue } from '@code-check/shared/types';

export class CodeCheckCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(
    private diagnosticsManager: DiagnosticsManager,
    private auditManager: AuditManager
  ) {
    // Refresh CodeLens when diagnostics change
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for active editor changes to refresh CodeLens
    vscode.window.onDidChangeActiveTextEditor(() => {
      this._onDidChangeCodeLenses.fire();
    });

    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(() => {
      this._onDidChangeCodeLenses.fire();
    });

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codeCheck.enableCodeLens')) {
        this._onDidChangeCodeLenses.fire();
      }
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const config = vscode.workspace.getConfiguration('codeCheck');
    const enableCodeLens = config.get<boolean>('enableCodeLens', true);

    if (!enableCodeLens) {
      return [];
    }

    const issues = this.diagnosticsManager.getIssues(document.uri);
    const codeLenses: vscode.CodeLens[] = [];

    for (const issue of issues) {
      if (token.isCancellationRequested) {
        return [];
      }

      const codeLens = this.createCodeLensForIssue(issue, document);
      if (codeLens) {
        codeLenses.push(...codeLens);
      }
    }

    // Add summary CodeLens at the top of the file if there are issues
    if (issues.length > 0) {
      const summaryCodeLens = this.createSummaryCodeLens(issues, document);
      if (summaryCodeLens) {
        codeLenses.unshift(...summaryCodeLens);
      }
    }

    return codeLenses;
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    if (token.isCancellationRequested) {
      return null;
    }

    return codeLens;
  }

  private createCodeLensForIssue(
    issue: CodeIssue,
    document: vscode.TextDocument
  ): vscode.CodeLens[] | null {
    const line = Math.max(0, issue.location.line - 1);
    const column = Math.max(0, issue.location.column - 1);

    // Create range for the issue location
    let range: vscode.Range;
    if (issue.range) {
      range = new vscode.Range(
        Math.max(0, issue.range.start.line - 1),
        Math.max(0, issue.range.start.column - 1),
        Math.max(0, issue.range.end.line - 1),
        Math.max(0, issue.range.end.column - 1)
      );
    } else {
      // Try to get the whole line for better visibility
      const lineText = document.lineAt(line);
      range = new vscode.Range(line, 0, line, lineText.text.length);
    }

    const codeLenses: vscode.CodeLens[] = [];

    // Main issue CodeLens
    const issueCodeLens = new vscode.CodeLens(range, {
      title: `$(warning) ${issue.message}`,
      command: 'code-check.showIssueDetail',
      arguments: [issue],
    });
    codeLenses.push(issueCodeLens);

    // Fix suggestions CodeLens (if issue is fixable and has suggestions)
    if (issue.fixable && issue.suggestions && issue.suggestions.length > 0) {
      const fixCodeLens = new vscode.CodeLens(
        new vscode.Range(line, 0, line, 0),
        {
          title: `$(lightbulb) ${issue.suggestions.length} fix suggestion${issue.suggestions.length > 1 ? 's' : ''} available`,
          command: 'code-check.showFixSuggestions',
          arguments: [issue, document.uri, range],
        }
      );
      codeLenses.push(fixCodeLens);
    }

    // Quick fix CodeLens for common patterns
    const quickFix = this.generateQuickFix(issue, document, line);
    if (quickFix) {
      const quickFixCodeLens = new vscode.CodeLens(
        new vscode.Range(line, 0, line, 0),
        {
          title: `$(wrench) Quick Fix: ${quickFix.title}`,
          command: 'code-check.applyFix',
          arguments: [document.uri, range, quickFix.fix],
        }
      );
      codeLenses.push(quickFixCodeLens);
    }

    return codeLenses;
  }

  private createSummaryCodeLens(
    issues: CodeIssue[],
    document: vscode.TextDocument
  ): vscode.CodeLens[] | null {
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    const parts: string[] = [];
    if (errorCount > 0)
      parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
    if (warningCount > 0)
      parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    if (infoCount > 0) parts.push(`${infoCount} info`);

    const summaryText = parts.join(', ');
    const icon =
      errorCount > 0 ? '$(error)' : warningCount > 0 ? '$(warning)' : '$(info)';

    const summaryCodeLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
      title: `${icon} Code Check: ${summaryText} found`,
      command: 'code-check.showMetrics',
    });

    const actionCodeLenses: vscode.CodeLens[] = [
      new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
        title: '$(refresh) Re-audit file',
        command: 'code-check.startFileAudit',
        arguments: [document.uri],
      }),
    ];

    if (issues.some((i) => i.fixable)) {
      actionCodeLenses.push(
        new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
          title: '$(magic-wand) Fix all auto-fixable issues',
          command: 'code-check.fixAllIssues',
          arguments: [document.uri],
        })
      );
    }

    return [summaryCodeLens, ...actionCodeLenses];
  }

  private generateQuickFix(
    issue: CodeIssue,
    document: vscode.TextDocument,
    line: number
  ): { title: string; fix: string } | null {
    const lineText = document.lineAt(line).text;
    const ruleName = issue.rule?.toLowerCase() || '';

    // Common quick fixes based on rule patterns
    if (
      ruleName.includes('unused-var') ||
      ruleName.includes('no-unused-vars')
    ) {
      // Remove unused variable declaration
      if (
        lineText.includes('const ') ||
        lineText.includes('let ') ||
        lineText.includes('var ')
      ) {
        return {
          title: 'Remove unused variable',
          fix: lineText.replace(/^\s*(const|let|var)\s+\w+.*$/, ''),
        };
      }
    }

    if (ruleName.includes('semicolon') || ruleName.includes('semi')) {
      // Add missing semicolon
      if (!lineText.trim().endsWith(';')) {
        return {
          title: 'Add missing semicolon',
          fix: lineText.replace(/\s*$/, ';\n'),
        };
      }
    }

    if (ruleName.includes('quotes') || ruleName.includes('quote-style')) {
      // Convert single quotes to double quotes or vice versa
      if (lineText.includes("'")) {
        return {
          title: 'Convert to double quotes',
          fix: lineText.replace(/'/g, '"'),
        };
      } else if (lineText.includes('"')) {
        return {
          title: 'Convert to single quotes',
          fix: lineText.replace(/"/g, "'"),
        };
      }
    }

    if (ruleName.includes('indent') || ruleName.includes('indentation')) {
      // Fix indentation
      const expectedIndent = this.calculateExpectedIndent(document, line);
      if (expectedIndent !== null) {
        return {
          title: 'Fix indentation',
          fix: expectedIndent + lineText.trim(),
        };
      }
    }

    if (
      ruleName.includes('trailing-space') ||
      ruleName.includes('no-trailing-spaces')
    ) {
      // Remove trailing spaces
      return {
        title: 'Remove trailing spaces',
        fix: lineText.replace(/\s+$/, ''),
      };
    }

    // Security-related fixes
    if (ruleName.includes('sql-injection') || ruleName.includes('xss')) {
      return {
        title: 'Add input validation',
        fix:
          '// TODO: Add proper input validation and sanitization\n' + lineText,
      };
    }

    return null;
  }

  private calculateExpectedIndent(
    document: vscode.TextDocument,
    line: number
  ): string | null {
    const config = vscode.workspace.getConfiguration('', document.uri);
    const insertSpaces = config.get<boolean>('editor.insertSpaces', true);
    const tabSize = config.get<number>('editor.tabSize', 4);

    // Simple indentation calculation based on brackets
    let indentLevel = 0;
    for (let i = 0; i < line; i++) {
      const lineText = document.lineAt(i).text;
      indentLevel += (lineText.match(/[{(\[]/g) || []).length;
      indentLevel -= (lineText.match(/[})\]]/g) || []).length;
    }

    indentLevel = Math.max(0, indentLevel);

    if (insertSpaces) {
      return ' '.repeat(indentLevel * tabSize);
    } else {
      return '\t'.repeat(indentLevel);
    }
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public dispose(): void {
    this._onDidChangeCodeLenses.dispose();
  }
}
