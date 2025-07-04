import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CodeCheckEngine } from '@code-check/core-engine';
import { CodeAnalysisReport, CodeIssue } from '@code-check/shared/types';
import { ApiClient } from '../api/ApiClient';
import { DiagnosticsManager } from '../diagnostics/DiagnosticsManager';
import { TelemetryManager } from '../telemetry/TelemetryManager';

export type AuditType = 'file' | 'folder' | 'workspace';

export interface AuditResult {
  report: CodeAnalysisReport;
  timestamp: Date;
  auditType: AuditType;
  targetPath: string;
}

export class AuditManager {
  private currentAudits = new Map<string, vscode.CancellationTokenSource>();
  private auditHistory: AuditResult[] = [];
  private engine: CodeCheckEngine;

  constructor(
    private context: vscode.ExtensionContext,
    private apiClient: ApiClient,
    private diagnosticsManager: DiagnosticsManager,
    private telemetryManager: TelemetryManager
  ) {
    this.engine = new CodeCheckEngine();
  }

  async startAudit(uri: vscode.Uri, type: AuditType): Promise<AuditResult> {
    const auditId = `${type}-${uri.fsPath}`;

    // Cancel existing audit for this path
    if (this.currentAudits.has(auditId)) {
      this.currentAudits.get(auditId)?.cancel();
    }

    const cancellationSource = new vscode.CancellationTokenSource();
    this.currentAudits.set(auditId, cancellationSource);

    try {
      const startTime = Date.now();

      // Show progress
      const progress = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Running ${type} audit...`,
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            cancellationSource.cancel();
          });

          progress.report({ increment: 0, message: 'Initializing...' });

          let report: CodeAnalysisReport;

          if (type === 'file') {
            report = await this.auditFile(
              uri,
              progress,
              cancellationSource.token
            );
          } else {
            report = await this.auditDirectory(
              uri,
              progress,
              cancellationSource.token
            );
          }

          return report;
        }
      );

      const result: AuditResult = {
        report: progress,
        timestamp: new Date(),
        auditType: type,
        targetPath: uri.fsPath,
      };

      // Update diagnostics
      this.updateDiagnosticsFromReport(result.report);

      // Store in history
      this.auditHistory.unshift(result);
      if (this.auditHistory.length > 50) {
        this.auditHistory = this.auditHistory.slice(0, 50);
      }

      // Send telemetry
      this.telemetryManager.sendEvent('audit.completed', {
        type,
        duration: Date.now() - startTime,
        issuesFound: result.report.issues.length,
        filesScanned: result.report.files.length,
      });

      vscode.window.showInformationMessage(
        `Audit completed: ${result.report.issues.length} issues found in ${result.report.files.length} files`
      );

      return result;
    } catch (error) {
      this.telemetryManager.sendEvent('audit.failed', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    } finally {
      this.currentAudits.delete(auditId);
    }
  }

  async startFullAudit(workspaceUri: vscode.Uri): Promise<AuditResult> {
    return this.startAudit(workspaceUri, 'workspace');
  }

  private async auditFile(
    uri: vscode.Uri,
    progress: vscode.Progress<{ increment?: number; message?: string }>,
    cancellationToken: vscode.CancellationToken
  ): Promise<CodeAnalysisReport> {
    progress.report({ increment: 25, message: 'Reading file...' });

    if (cancellationToken.isCancellationRequested) {
      throw new Error('Audit cancelled');
    }

    const content = await fs.readFile(uri.fsPath, 'utf8');

    progress.report({ increment: 50, message: 'Analyzing code...' });

    // Use local engine for single file analysis
    const result = await this.engine.analyze(content);

    progress.report({ increment: 75, message: 'Processing results...' });

    // Try to get additional analysis from API if available
    try {
      const apiResult = await this.apiClient.analyzeFile(uri.fsPath, content);
      if (apiResult) {
        // Merge results
        result.issues.push(...apiResult.issues);
      }
    } catch (error) {
      console.warn('API analysis failed, using local results only:', error);
    }

    progress.report({ increment: 100, message: 'Complete' });

    return {
      files: [uri.fsPath],
      issues: result.issues.map((issue) => ({
        ...issue,
        location: {
          ...issue.location,
          file: uri.fsPath,
        },
      })),
      summary: {
        totalFiles: 1,
        totalIssues: result.issues.length,
        errorCount: result.issues.filter((i) => i.severity === 'error').length,
        warningCount: result.issues.filter((i) => i.severity === 'warning')
          .length,
        infoCount: result.issues.filter((i) => i.severity === 'info').length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0, // Will be calculated by caller
        version: this.context.extension.packageJSON.version,
      },
    };
  }

  private async auditDirectory(
    uri: vscode.Uri,
    progress: vscode.Progress<{ increment?: number; message?: string }>,
    cancellationToken: vscode.CancellationToken
  ): Promise<CodeAnalysisReport> {
    progress.report({ increment: 10, message: 'Scanning files...' });

    if (cancellationToken.isCancellationRequested) {
      throw new Error('Audit cancelled');
    }

    const files = await this.findFiles(uri.fsPath);
    const totalFiles = files.length;

    if (totalFiles === 0) {
      return {
        files: [],
        issues: [],
        summary: {
          totalFiles: 0,
          totalIssues: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration: 0,
          version: this.context.extension.packageJSON.version,
        },
      };
    }

    const allIssues: CodeIssue[] = [];
    const processedFiles: string[] = [];

    // Process files in batches to avoid overwhelming the system
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (cancellationToken.isCancellationRequested) {
        throw new Error('Audit cancelled');
      }

      const batch = batches[batchIndex];
      const batchPromises = batch.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const result = await this.engine.analyze(content);

          const fileIssues = result.issues.map((issue) => ({
            ...issue,
            location: {
              ...issue.location,
              file: filePath,
            },
          }));

          return { filePath, issues: fileIssues };
        } catch (error) {
          console.warn(`Failed to analyze file ${filePath}:`, error);
          return { filePath, issues: [] };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        allIssues.push(...result.issues);
        processedFiles.push(result.filePath);
      }

      const progressPercent = 10 + ((batchIndex + 1) / batches.length) * 80;
      progress.report({
        increment: progressPercent,
        message: `Processed ${processedFiles.length}/${totalFiles} files...`,
      });
    }

    progress.report({ increment: 95, message: 'Generating report...' });

    return {
      files: processedFiles,
      issues: allIssues,
      summary: {
        totalFiles: processedFiles.length,
        totalIssues: allIssues.length,
        errorCount: allIssues.filter((i) => i.severity === 'error').length,
        warningCount: allIssues.filter((i) => i.severity === 'warning').length,
        infoCount: allIssues.filter((i) => i.severity === 'info').length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
        version: this.context.extension.packageJSON.version,
      },
    };
  }

  private async findFiles(dirPath: string): Promise<string[]> {
    const config = vscode.workspace.getConfiguration('codeCheck');
    const excludePatterns = config.get<string[]>('excludePatterns') || [];

    const supportedExtensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.py',
      '.java',
      '.cs',
      '.go',
      '.rs',
      '.php',
      '.rb',
    ];
    const files: string[] = [];

    const scanDirectory = async (currentPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(dirPath, fullPath);

          // Check exclude patterns
          const shouldExclude = excludePatterns.some((pattern) => {
            const regex = new RegExp(
              pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
            );
            return regex.test(relativePath) || regex.test(entry.name);
          });

          if (shouldExclude) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${currentPath}:`, error);
      }
    };

    await scanDirectory(dirPath);
    return files;
  }

  private updateDiagnosticsFromReport(report: CodeAnalysisReport): void {
    // Clear existing diagnostics for files in this report
    const fileUris = report.files.map((file) => vscode.Uri.file(file));
    fileUris.forEach((uri) => this.diagnosticsManager.clearDiagnostics(uri));

    // Group issues by file
    const issuesByFile = new Map<string, CodeIssue[]>();
    for (const issue of report.issues) {
      const file = issue.location.file;
      if (!issuesByFile.has(file)) {
        issuesByFile.set(file, []);
      }
      issuesByFile.get(file)!.push(issue);
    }

    // Set new diagnostics
    for (const [file, issues] of issuesByFile) {
      const uri = vscode.Uri.file(file);
      this.diagnosticsManager.setDiagnostics(uri, issues);
    }
  }

  async exportReport(): Promise<string | null> {
    if (this.auditHistory.length === 0) {
      vscode.window.showWarningMessage('No audit reports available to export');
      return null;
    }

    const latestResult = this.auditHistory[0];
    const timestamp = latestResult.timestamp
      .toISOString()
      .replace(/[:.]/g, '-');
    const fileName = `code-check-report-${timestamp}.json`;

    const exportUri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(fileName),
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*'],
      },
    });

    if (!exportUri) {
      return null;
    }

    const reportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        extensionVersion: this.context.extension.packageJSON.version,
      },
      auditResult: latestResult,
    };

    await fs.writeFile(exportUri.fsPath, JSON.stringify(reportData, null, 2));
    return exportUri.fsPath;
  }

  getAuditHistory(): AuditResult[] {
    return [...this.auditHistory];
  }

  getLatestResult(): AuditResult | null {
    return this.auditHistory[0] || null;
  }

  isAuditRunning(): boolean {
    return this.currentAudits.size > 0;
  }

  cancelAllAudits(): void {
    for (const cancellationSource of this.currentAudits.values()) {
      cancellationSource.cancel();
    }
    this.currentAudits.clear();
  }

  dispose(): void {
    this.cancelAllAudits();
  }
}
