import * as vscode from 'vscode';
import { AuditManager, AuditResult } from '../audit/AuditManager';
import { ApiClient } from '../api/ApiClient';

export class MetricsWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeCheckMetrics';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private auditManager: AuditManager,
    private apiClient: ApiClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'refresh':
            this.refresh();
            break;
          case 'runAudit':
            vscode.commands.executeCommand('code-check.startAudit');
            break;
          case 'runFullAudit':
            vscode.commands.executeCommand('code-check.startFullAudit');
            break;
          case 'exportReport':
            vscode.commands.executeCommand('code-check.exportReport');
            break;
          case 'clearDiagnostics':
            vscode.commands.executeCommand('code-check.clearDiagnostics');
            break;
          case 'showIssue':
            this.showIssue(message.issueId, message.filePath);
            break;
        }
      },
      undefined,
      []
    );

    // Initial load
    this.refresh();
  }

  public refresh() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'update',
        data: this.getMetricsData(),
      });
    }
  }

  private getMetricsData() {
    const latestResult = this.auditManager.getLatestResult();
    const auditHistory = this.auditManager.getAuditHistory().slice(0, 10); // Last 10 audits
    const isAuditRunning = this.auditManager.isAuditRunning();

    return {
      latestResult,
      auditHistory,
      isAuditRunning,
      timestamp: new Date().toISOString(),
    };
  }

  private async showIssue(issueId: string, filePath: string) {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // Find the issue and navigate to it
      const latestResult = this.auditManager.getLatestResult();
      if (latestResult) {
        const issue = latestResult.report.issues.find((i) => i.id === issueId);
        if (issue) {
          const line = Math.max(0, issue.location.line - 1);
          const column = Math.max(0, issue.location.column - 1);
          const position = new vscode.Position(line, column);

          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
          );
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        'node_modules',
        '@vscode/codicons',
        'dist',
        'codicon.css'
      )
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Check Metrics</title>
        <link href="${codiconsUri}" rel="stylesheet" />
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-sideBar-background);
                margin: 0;
                padding: 16px;
                line-height: 1.4;
            }

            .metrics-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .metric-card {
                background-color: var(--vscode-panel-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 12px;
            }

            .metric-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-weight: 600;
            }

            .metric-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 4px;
            }

            .metric-value.error {
                color: var(--vscode-errorForeground);
            }

            .metric-value.warning {
                color: var(--vscode-warningForeground);
            }

            .metric-value.info {
                color: var(--vscode-notificationsInfoIcon-foreground);
            }

            .metric-value.success {
                color: var(--vscode-testing-iconPassed);
            }

            .metric-label {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
            }

            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 16px;
            }

            .button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: background-color 0.2s;
            }

            .button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .button.secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .button.secondary:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .issues-list {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                margin-top: 8px;
            }

            .issue-item {
                padding: 8px 12px;
                border-bottom: 1px solid var(--vscode-panel-border);
                cursor: pointer;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }

            .issue-item:last-child {
                border-bottom: none;
            }

            .issue-item:hover {
                background-color: var(--vscode-list-hoverBackground);
            }

            .issue-severity {
                flex-shrink: 0;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                margin-top: 2px;
            }

            .issue-severity.error {
                background-color: var(--vscode-errorForeground);
            }

            .issue-severity.warning {
                background-color: var(--vscode-warningForeground);
            }

            .issue-severity.info {
                background-color: var(--vscode-notificationsInfoIcon-foreground);
            }

            .issue-content {
                flex: 1;
                min-width: 0;
            }

            .issue-message {
                font-size: 13px;
                margin-bottom: 2px;
                word-wrap: break-word;
            }

            .issue-location {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                font-family: var(--vscode-editor-font-family);
            }

            .history-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                max-height: 150px;
                overflow-y: auto;
            }

            .history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 8px;
                background-color: var(--vscode-input-background);
                border-radius: 2px;
                font-size: 12px;
            }

            .loading {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--vscode-progressBar-background);
            }

            .loading .codicon {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .no-data {
                text-align: center;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
                padding: 20px;
            }

            .summary-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 8px;
            }

            .summary-item {
                text-align: center;
                padding: 8px;
                background-color: var(--vscode-input-background);
                border-radius: 4px;
            }

            .summary-number {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 2px;
            }

            .summary-label {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div class="metrics-container">
            <div class="action-buttons">
                <button class="button" onclick="runAudit()">
                    <i class="codicon codicon-search"></i>
                    Run Audit
                </button>
                <button class="button secondary" onclick="runFullAudit()">
                    <i class="codicon codicon-folder"></i>
                    Full Project Audit
                </button>
                <button class="button secondary" onclick="refresh()">
                    <i class="codicon codicon-refresh"></i>
                    Refresh
                </button>
            </div>

            <div id="loading" class="loading" style="display: none;">
                <i class="codicon codicon-loading"></i>
                <span>Loading metrics...</span>
            </div>

            <div id="content" style="display: none;">
                <!-- Current Status -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="codicon codicon-pulse"></i>
                        Status
                    </div>
                    <div id="status-content"></div>
                </div>

                <!-- Issue Summary -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="codicon codicon-warning"></i>
                        Issues Found
                    </div>
                    <div id="issues-summary"></div>
                </div>

                <!-- Recent Issues -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="codicon codicon-list-unordered"></i>
                        Recent Issues
                    </div>
                    <div id="recent-issues"></div>
                </div>

                <!-- Audit History -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="codicon codicon-history"></i>
                        Audit History
                    </div>
                    <div id="audit-history"></div>
                </div>

                <!-- Actions -->
                <div class="action-buttons">
                    <button class="button secondary" onclick="exportReport()">
                        <i class="codicon codicon-export"></i>
                        Export Report
                    </button>
                    <button class="button secondary" onclick="clearDiagnostics()">
                        <i class="codicon codicon-clear-all"></i>
                        Clear Diagnostics
                    </button>
                </div>
            </div>

            <div id="no-data" class="no-data" style="display: none;">
                <i class="codicon codicon-info"></i>
                <p>No audit data available. Run an audit to see metrics.</p>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function runAudit() {
                vscode.postMessage({ type: 'runAudit' });
            }

            function runFullAudit() {
                vscode.postMessage({ type: 'runFullAudit' });
            }

            function refresh() {
                vscode.postMessage({ type: 'refresh' });
                showLoading();
            }

            function exportReport() {
                vscode.postMessage({ type: 'exportReport' });
            }

            function clearDiagnostics() {
                vscode.postMessage({ type: 'clearDiagnostics' });
            }

            function showIssue(issueId, filePath) {
                vscode.postMessage({ 
                    type: 'showIssue', 
                    issueId: issueId,
                    filePath: filePath 
                });
            }

            function showLoading() {
                document.getElementById('loading').style.display = 'flex';
                document.getElementById('content').style.display = 'none';
                document.getElementById('no-data').style.display = 'none';
            }

            function hideLoading() {
                document.getElementById('loading').style.display = 'none';
            }

            function updateMetrics(data) {
                hideLoading();

                if (!data.latestResult) {
                    document.getElementById('no-data').style.display = 'block';
                    return;
                }

                document.getElementById('content').style.display = 'block';

                // Update status
                updateStatus(data);

                // Update issues summary
                updateIssuesSummary(data.latestResult.report);

                // Update recent issues
                updateRecentIssues(data.latestResult.report.issues.slice(0, 5));

                // Update audit history
                updateAuditHistory(data.auditHistory);
            }

            function updateStatus(data) {
                const statusContent = document.getElementById('status-content');
                const isRunning = data.isAuditRunning;
                
                if (isRunning) {
                    statusContent.innerHTML = \`
                        <div class="loading">
                            <i class="codicon codicon-loading"></i>
                            <span>Audit in progress...</span>
                        </div>
                    \`;
                } else if (data.latestResult) {
                    const lastRun = new Date(data.latestResult.timestamp).toLocaleString();
                    statusContent.innerHTML = \`
                        <div class="metric-value success">Ready</div>
                        <div class="metric-label">Last audit: \${lastRun}</div>
                    \`;
                } else {
                    statusContent.innerHTML = \`
                        <div class="metric-value">Not Run</div>
                        <div class="metric-label">No audits performed</div>
                    \`;
                }
            }

            function updateIssuesSummary(report) {
                const summaryElement = document.getElementById('issues-summary');
                const summary = report.summary;
                
                summaryElement.innerHTML = \`
                    <div class="metric-value \${summary.totalIssues === 0 ? 'success' : 'warning'}">
                        \${summary.totalIssues}
                    </div>
                    <div class="metric-label">Total Issues</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-number error">\${summary.errorCount}</div>
                            <div class="summary-label">Errors</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number warning">\${summary.warningCount}</div>
                            <div class="summary-label">Warnings</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number info">\${summary.infoCount}</div>
                            <div class="summary-label">Info</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">\${summary.totalFiles}</div>
                            <div class="summary-label">Files</div>
                        </div>
                    </div>
                \`;
            }

            function updateRecentIssues(issues) {
                const issuesElement = document.getElementById('recent-issues');
                
                if (issues.length === 0) {
                    issuesElement.innerHTML = '<div class="no-data">No issues found!</div>';
                    return;
                }

                const issuesHtml = issues.map(issue => \`
                    <div class="issue-item" onclick="showIssue('\${issue.id}', '\${issue.location.file}')">
                        <div class="issue-severity \${issue.severity}"></div>
                        <div class="issue-content">
                            <div class="issue-message">\${issue.message}</div>
                            <div class="issue-location">
                                \${issue.location.file.split('/').pop()}:\${issue.location.line}:\${issue.location.column}
                            </div>
                        </div>
                    </div>
                \`).join('');

                issuesElement.innerHTML = \`<div class="issues-list">\${issuesHtml}</div>\`;
            }

            function updateAuditHistory(history) {
                const historyElement = document.getElementById('audit-history');
                
                if (history.length === 0) {
                    historyElement.innerHTML = '<div class="no-data">No audit history</div>';
                    return;
                }

                const historyHtml = history.map(audit => {
                    const timestamp = new Date(audit.timestamp).toLocaleString();
                    const issueCount = audit.report.summary.totalIssues;
                    return \`
                        <div class="history-item">
                            <span>\${audit.auditType} (\${issueCount} issues)</span>
                            <span>\${timestamp}</span>
                        </div>
                    \`;
                }).join('');

                historyElement.innerHTML = \`<div class="history-list">\${historyHtml}</div>\`;
            }

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'update':
                        updateMetrics(message.data);
                        break;
                }
            });

            // Initial loading state
            showLoading();
        </script>
    </body>
    </html>`;
  }
}
