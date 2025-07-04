import * as vscode from 'vscode';
import { CodeIssue } from '@code-check/shared/types';

export class DiagnosticsManager {
  private diagnosticsCollection: vscode.DiagnosticCollection;
  private issuesMap = new Map<string, CodeIssue[]>();

  constructor(private context: vscode.ExtensionContext) {
    this.diagnosticsCollection =
      vscode.languages.createDiagnosticCollection('codeCheck');
    this.context.subscriptions.push(this.diagnosticsCollection);
  }

  setDiagnostics(uri: vscode.Uri, issues: CodeIssue[]): void {
    const config = vscode.workspace.getConfiguration('codeCheck');
    const enableInlineDiagnostics = config.get<boolean>(
      'enableInlineDiagnostics',
      true
    );

    if (!enableInlineDiagnostics) {
      return;
    }

    const diagnosticsLevel = config.get<string>('diagnosticsLevel', 'warning');
    const filteredIssues = this.filterIssuesByLevel(issues, diagnosticsLevel);

    this.issuesMap.set(uri.toString(), filteredIssues);

    const diagnostics = filteredIssues.map((issue) =>
      this.createDiagnostic(issue)
    );
    this.diagnosticsCollection.set(uri, diagnostics);
  }

  clearDiagnostics(uri: vscode.Uri): void {
    this.issuesMap.delete(uri.toString());
    this.diagnosticsCollection.delete(uri);
  }

  clearAll(): void {
    this.issuesMap.clear();
    this.diagnosticsCollection.clear();
  }

  getDiagnostics(uri: vscode.Uri): vscode.Diagnostic[] {
    return this.diagnosticsCollection.get(uri) || [];
  }

  getIssues(uri: vscode.Uri): CodeIssue[] {
    return this.issuesMap.get(uri.toString()) || [];
  }

  getAllIssues(): Map<string, CodeIssue[]> {
    return new Map(this.issuesMap);
  }

  private createDiagnostic(issue: CodeIssue): vscode.Diagnostic {
    // Convert 1-based line numbers to 0-based for VS Code
    const line = Math.max(0, issue.location.line - 1);
    const column = Math.max(0, issue.location.column - 1);

    let range: vscode.Range;
    if (issue.range) {
      range = new vscode.Range(
        Math.max(0, issue.range.start.line - 1),
        Math.max(0, issue.range.start.column - 1),
        Math.max(0, issue.range.end.line - 1),
        Math.max(0, issue.range.end.column - 1)
      );
    } else {
      // Create a single-character range if no range is provided
      range = new vscode.Range(line, column, line, column + 1);
    }

    const diagnostic = new vscode.Diagnostic(
      range,
      issue.message,
      this.mapSeverity(issue.severity)
    );

    diagnostic.source = 'Code Check';
    diagnostic.code = issue.rule || issue.id;

    // Add related information if suggestions are available
    if (issue.suggestions && issue.suggestions.length > 0) {
      diagnostic.relatedInformation = issue.suggestions.map(
        (suggestion, index) =>
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(vscode.Uri.file(issue.location.file), range),
            `Suggestion ${index + 1}: ${suggestion}`
          )
      );
    }

    return diagnostic;
  }

  private mapSeverity(
    severity: 'error' | 'warning' | 'info'
  ): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'info':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  private filterIssuesByLevel(issues: CodeIssue[], level: string): CodeIssue[] {
    const severityOrder = ['info', 'warning', 'error'];
    const minIndex = severityOrder.indexOf(level);

    if (minIndex === -1) {
      return issues; // If level is invalid, return all issues
    }

    return issues.filter((issue) => {
      const issueIndex = severityOrder.indexOf(issue.severity);
      return issueIndex >= minIndex;
    });
  }

  // Utility methods for external use
  getIssueCount(uri?: vscode.Uri): number {
    if (uri) {
      return this.getIssues(uri).length;
    }

    let total = 0;
    for (const issues of this.issuesMap.values()) {
      total += issues.length;
    }
    return total;
  }

  getIssueCountBySeverity(uri?: vscode.Uri): {
    error: number;
    warning: number;
    info: number;
  } {
    let issues: CodeIssue[];

    if (uri) {
      issues = this.getIssues(uri);
    } else {
      issues = [];
      for (const fileIssues of this.issuesMap.values()) {
        issues.push(...fileIssues);
      }
    }

    return {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };
  }

  findIssuesInRange(uri: vscode.Uri, range: vscode.Range): CodeIssue[] {
    const issues = this.getIssues(uri);

    return issues.filter((issue) => {
      const issueLine = Math.max(0, issue.location.line - 1);
      const issueColumn = Math.max(0, issue.location.column - 1);
      const issuePosition = new vscode.Position(issueLine, issueColumn);

      return range.contains(issuePosition);
    });
  }

  dispose(): void {
    this.diagnosticsCollection.dispose();
    this.issuesMap.clear();
  }
}
