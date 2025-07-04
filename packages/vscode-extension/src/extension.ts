import * as vscode from 'vscode';
import { CodeCheckEngine } from '@code-check/core-engine';
import { CodeAnalysisReport, CodeIssue } from '@code-check/shared/types';
import { AuditManager } from './audit/AuditManager';
import { DiagnosticsManager } from './diagnostics/DiagnosticsManager';
import { MetricsWebviewProvider } from './webview/MetricsWebviewProvider';
import { CodeCheckCodeLensProvider } from './codelens/CodeCheckCodeLensProvider';
import { ApiClient } from './api/ApiClient';
import { ConfigurationManager } from './config/ConfigurationManager';
import { TelemetryManager } from './telemetry/TelemetryManager';
import { StatusBarManager } from './statusbar/StatusBarManager';
import { LanguageServerManager } from './lsp/LanguageServerManager';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Code Check extension is now active!');

  // Set extension context for conditional views
  await vscode.commands.executeCommand(
    'setContext',
    'codeCheckExtensionActive',
    true
  );

  // Initialize managers
  const configManager = new ConfigurationManager();
  const telemetryManager = new TelemetryManager(context, configManager);
  const apiClient = new ApiClient(configManager);
  const diagnosticsManager = new DiagnosticsManager(context);
  const auditManager = new AuditManager(
    context,
    apiClient,
    diagnosticsManager,
    telemetryManager
  );
  const statusBarManager = new StatusBarManager();
  const languageServerManager = new LanguageServerManager(
    context,
    configManager
  );

  // Initialize webview provider
  const metricsProvider = new MetricsWebviewProvider(
    context.extensionUri,
    auditManager,
    apiClient
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codeCheckMetrics',
      metricsProvider
    )
  );

  // Initialize CodeLens provider
  const codeLensProvider = new CodeCheckCodeLensProvider(
    diagnosticsManager,
    auditManager
  );
  const supportedLanguages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'go',
    'rust',
    'php',
    'ruby',
  ];

  supportedLanguages.forEach((language) => {
    if (configManager.getConfig().enableCodeLens) {
      context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(language, codeLensProvider)
      );
    }
  });

  // Register commands
  registerCommands(
    context,
    auditManager,
    metricsProvider,
    diagnosticsManager,
    configManager,
    statusBarManager,
    languageServerManager
  );

  // Setup event listeners
  setupEventListeners(
    context,
    auditManager,
    diagnosticsManager,
    configManager,
    statusBarManager
  );

  // Initialize language server if enabled
  if (configManager.getConfig().enableLanguageServer) {
    await languageServerManager.start();
  }

  // Send activation telemetry
  telemetryManager.sendEvent('extension.activated', {
    version: context.extension.packageJSON.version,
    vscodeVersion: vscode.version,
  });

  statusBarManager.updateStatus('Ready', 'Code Check is ready');
}

function registerCommands(
  context: vscode.ExtensionContext,
  auditManager: AuditManager,
  metricsProvider: MetricsWebviewProvider,
  diagnosticsManager: DiagnosticsManager,
  configManager: ConfigurationManager,
  statusBarManager: StatusBarManager,
  languageServerManager: LanguageServerManager
) {
  const commands = [
    // Audit commands
    vscode.commands.registerCommand(
      'code-check.startAudit',
      async (uri?: vscode.Uri) => {
        const targetUri = uri || vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!targetUri) {
          vscode.window.showErrorMessage('No workspace folder found');
          return;
        }

        statusBarManager.updateStatus(
          '$(loading~spin) Auditing...',
          'Running code audit'
        );
        try {
          await auditManager.startAudit(targetUri, 'folder');
          statusBarManager.updateStatus(
            '$(check) Audit Complete',
            'Code audit completed'
          );
        } catch (error) {
          statusBarManager.updateStatus(
            '$(error) Audit Failed',
            'Code audit failed'
          );
          vscode.window.showErrorMessage(
            `Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    ),

    vscode.commands.registerCommand('code-check.startFullAudit', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      statusBarManager.updateStatus(
        '$(loading~spin) Full Audit...',
        'Running full project audit'
      );
      try {
        await auditManager.startFullAudit(workspaceFolder.uri);
        statusBarManager.updateStatus(
          '$(check) Full Audit Complete',
          'Full project audit completed'
        );
      } catch (error) {
        statusBarManager.updateStatus(
          '$(error) Full Audit Failed',
          'Full project audit failed'
        );
        vscode.window.showErrorMessage(
          `Full audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

    vscode.commands.registerCommand(
      'code-check.startFileAudit',
      async (uri?: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) {
          vscode.window.showErrorMessage('No active file found');
          return;
        }

        statusBarManager.updateStatus(
          '$(loading~spin) Auditing File...',
          'Running file audit'
        );
        try {
          await auditManager.startAudit(targetUri, 'file');
          statusBarManager.updateStatus(
            '$(check) File Audit Complete',
            'File audit completed'
          );
        } catch (error) {
          statusBarManager.updateStatus(
            '$(error) File Audit Failed',
            'File audit failed'
          );
          vscode.window.showErrorMessage(
            `File audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    ),

    // Metrics and UI commands
    vscode.commands.registerCommand('code-check.showMetrics', () => {
      vscode.commands.executeCommand('codeCheckMetrics.focus');
    }),

    vscode.commands.registerCommand('code-check.refreshMetrics', () => {
      metricsProvider.refresh();
    }),

    vscode.commands.registerCommand('code-check.clearDiagnostics', () => {
      diagnosticsManager.clearAll();
      statusBarManager.updateStatus(
        '$(check) Diagnostics Cleared',
        'All diagnostics cleared'
      );
    }),

    vscode.commands.registerCommand('code-check.exportReport', async () => {
      try {
        const reportPath = await auditManager.exportReport();
        if (reportPath) {
          const action = await vscode.window.showInformationMessage(
            `Report exported to: ${reportPath}`,
            'Open Report',
            'Show in Explorer'
          );

          if (action === 'Open Report') {
            const doc = await vscode.workspace.openTextDocument(reportPath);
            await vscode.window.showTextDocument(doc);
          } else if (action === 'Show in Explorer') {
            await vscode.commands.executeCommand(
              'revealFileInOS',
              vscode.Uri.file(reportPath)
            );
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

    vscode.commands.registerCommand('code-check.configureSettings', () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'codeCheck'
      );
    }),

    // Internal commands for CodeLens
    vscode.commands.registerCommand(
      'code-check.applyFix',
      async (uri: vscode.Uri, range: vscode.Range, fix: string) => {
        const editor = await vscode.window.showTextDocument(uri);
        await editor.edit((editBuilder) => {
          editBuilder.replace(range, fix);
        });
      }
    ),

    vscode.commands.registerCommand(
      'code-check.showIssueDetail',
      (issue: CodeIssue) => {
        const panel = vscode.window.createWebviewPanel(
          'codeCheckIssueDetail',
          'Code Check Issue Detail',
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );

        panel.webview.html = generateIssueDetailHtml(issue);
      }
    ),

    // Language server commands
    vscode.commands.registerCommand(
      'code-check.restartLanguageServer',
      async () => {
        await languageServerManager.restart();
        vscode.window.showInformationMessage(
          'Code Check Language Server restarted'
        );
      }
    ),
  ];

  context.subscriptions.push(...commands);
}

function setupEventListeners(
  context: vscode.ExtensionContext,
  auditManager: AuditManager,
  diagnosticsManager: DiagnosticsManager,
  configManager: ConfigurationManager,
  statusBarManager: StatusBarManager
) {
  // Listen for file saves
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (configManager.getConfig().autoRunOnSave) {
        await auditManager.startAudit(document.uri, 'file');
      }
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codeCheck')) {
        configManager.refresh();
        statusBarManager.updateStatus(
          '$(settings) Config Updated',
          'Configuration updated'
        );
      }
    })
  );

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const diagnostics = diagnosticsManager.getDiagnostics(
          editor.document.uri
        );
        if (diagnostics.length > 0) {
          statusBarManager.updateStatus(
            `$(warning) ${diagnostics.length} issue${diagnostics.length > 1 ? 's' : ''}`,
            `${diagnostics.length} issue${diagnostics.length > 1 ? 's' : ''} found in current file`
          );
        } else {
          statusBarManager.updateStatus('$(check) Clean', 'No issues found');
        }
      }
    })
  );

  // Listen for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      diagnosticsManager.clearAll();
      statusBarManager.updateStatus(
        '$(sync) Workspace Changed',
        'Workspace folders changed'
      );
    })
  );
}

function generateIssueDetailHtml(issue: CodeIssue): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Issue Detail</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                margin: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .issue-header {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .severity {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 0.8em;
                font-weight: bold;
                text-transform: uppercase;
            }
            .severity.error {
                background-color: var(--vscode-errorForeground);
                color: white;
            }
            .severity.warning {
                background-color: var(--vscode-warningForeground);
                color: black;
            }
            .severity.info {
                background-color: var(--vscode-notificationsInfoIcon-foreground);
                color: white;
            }
            .location {
                font-family: monospace;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                padding: 2px 4px;
                border-radius: 2px;
            }
            .suggestions {
                margin-top: 20px;
            }
            .suggestions h3 {
                margin-bottom: 10px;
            }
            .suggestions ul {
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        <div class="issue-header">
            <h2>${issue.message}</h2>
            <span class="severity ${issue.severity}">${issue.severity}</span>
            ${issue.rule ? `<span class="rule">Rule: ${issue.rule}</span>` : ''}
        </div>
        
        <div class="location">
            <strong>Location:</strong> ${issue.location.file}:${issue.location.line}:${issue.location.column}
        </div>
        
        ${
          issue.suggestions && issue.suggestions.length > 0
            ? `
            <div class="suggestions">
                <h3>Suggestions:</h3>
                <ul>
                    ${issue.suggestions.map((s) => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `
            : ''
        }
    </body>
    </html>
  `;
}

export function deactivate() {
  console.log('Code Check extension is being deactivated');
  // Cleanup is handled by the managers' disposal
}
