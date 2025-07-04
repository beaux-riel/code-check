import {
  CodeCheckEngine,
  CodeCheckEngineConfig,
  AnalysisPipelineResult,
} from '@code-check/core-engine';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import path from 'path';
import { CreateAuditRequest, AuditWebSocketMessage } from '../types/api';

export class AuditService extends EventEmitter {
  private prisma: PrismaClient;
  private runningAudits: Map<string, CodeCheckEngine> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  async createAudit(request: CreateAuditRequest): Promise<string> {
    // Create or find project
    const projectName =
      request.projectName || path.basename(request.projectPath);
    let project = await this.prisma.project.findFirst({
      where: { path: request.projectPath },
    });

    if (!project) {
      project = await this.prisma.project.create({
        data: {
          name: projectName,
          path: request.projectPath,
          description: request.projectDescription,
          repositoryUrl: request.repositoryUrl,
        },
      });
    }

    // Create audit record
    const audit = await this.prisma.audit.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
        enabledPlugins: JSON.stringify(request.enabledPlugins || []),
        rulesets: JSON.stringify(request.rulesets || []),
        configuration: JSON.stringify(request),
      },
    });

    return audit.id;
  }

  async startAudit(auditId: string): Promise<void> {
    const audit = await this.prisma.audit.findUnique({
      where: { id: auditId },
      include: { project: true },
    });

    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    if (audit.status !== 'PENDING') {
      throw new Error(`Audit ${auditId} is not in PENDING status`);
    }

    // Update status to RUNNING
    await this.prisma.audit.update({
      where: { id: auditId },
      data: { status: 'RUNNING' },
    });

    try {
      // Parse configuration
      const config = JSON.parse(
        audit.configuration || '{}'
      ) as CreateAuditRequest;

      // Create engine configuration
      const engineConfig: CodeCheckEngineConfig = {
        projectPath: audit.project.path,
        includedFiles: config.includedFiles,
        excludedFiles: config.excludedFiles,
        includePatterns: config.includePatterns,
        excludePatterns: config.excludePatterns,
        enabledPlugins: config.enabledPlugins,
        rulesets: config.rulesets,
        maxWorkers: config.maxWorkers,
        concurrency: config.concurrency,
        enableParallelExecution: config.enableParallelExecution,
        outputFormat: config.outputFormat,
        generateReports: config.generateReports,
        maxFileSize: config.maxFileSize,
        timeout: config.timeout,
        bail: config.bail,
        cache: config.cache,
      };

      // Create and initialize engine
      const engine = new CodeCheckEngine(engineConfig);
      this.runningAudits.set(auditId, engine);

      await engine.initialize();

      // Set up progress tracking
      engine.on('analysis.progress', (data: any) => {
        this.emitProgress(auditId, data);
      });

      engine.on('analysis.started', (data: any) => {
        this.emitStatusUpdate(auditId, 'RUNNING', 'Analysis started');
      });

      engine.on('analysis.error', (data: any) => {
        this.emitError(
          auditId,
          data.error?.message || 'Unknown error',
          data.stage
        );
      });

      // Start analysis
      const startTime = Date.now();
      const result = await engine.analyze({
        onProgress: (current: number, total: number) => {
          const progress = total > 0 ? Math.round((current / total) * 100) : 0;
          this.emitProgress(auditId, {
            stage: 'analysis',
            progress,
            filesProcessed: current,
            totalFiles: total,
          });
        },
        onFileComplete: () => {
          // Optional: emit file completion events
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Store results in database
      await this.storeAuditResults(auditId, result, duration);

      // Clean up
      this.runningAudits.delete(auditId);
      await engine.shutdown();

      // Emit completion event
      this.emitCompletion(auditId);
    } catch (error) {
      console.error(`Audit ${auditId} failed:`, error);

      // Update audit status to FAILED
      await this.prisma.audit.update({
        where: { id: auditId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      // Clean up
      this.runningAudits.delete(auditId);

      // Emit error event
      this.emitError(
        auditId,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async cancelAudit(auditId: string): Promise<void> {
    const audit = await this.prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    if (audit.status !== 'RUNNING') {
      throw new Error(`Audit ${auditId} is not running`);
    }

    // Stop the running engine
    const engine = this.runningAudits.get(auditId);
    if (engine) {
      await engine.shutdown();
      this.runningAudits.delete(auditId);
    }

    // Update status
    await this.prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    this.emitStatusUpdate(auditId, 'CANCELLED', 'Audit cancelled by user');
  }

  async getAuditStatus(auditId: string): Promise<any> {
    const audit = await this.prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
        issues: true,
        files: true,
      },
    });

    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    return {
      id: audit.id,
      projectId: audit.projectId,
      projectName: audit.project.name,
      status: audit.status,
      startedAt: audit.startedAt.toISOString(),
      completedAt: audit.completedAt?.toISOString(),
      duration: audit.duration,
      totalFiles: audit.totalFiles,
      totalIssues: audit.totalIssues,
      errorCount: audit.errorCount,
      warningCount: audit.warningCount,
      infoCount: audit.infoCount,
      memoryUsage: audit.memoryUsage,
      cpuUsage: audit.cpuUsage,
      errorMessage: audit.errorMessage,
      enabledPlugins: JSON.parse(audit.enabledPlugins || '[]'),
      rulesets: JSON.parse(audit.rulesets || '[]'),
      issues: audit.issues,
      files: audit.files,
    };
  }

  private async storeAuditResults(
    auditId: string,
    result: AnalysisPipelineResult,
    duration: number
  ): Promise<void> {
    // Count issues by severity
    const issues = result.issues || [];
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    // Update audit with results
    await this.prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration,
        totalFiles: result.filesAnalyzed || 0,
        totalIssues: issues.length,
        errorCount,
        warningCount,
        infoCount,
        memoryUsage: result.performance?.memoryUsage?.peak,
        cpuUsage: result.performance?.cpuUsage?.average,
      },
    });

    // Store file results
    if (result.fileResults) {
      for (const fileResult of result.fileResults) {
        const auditFile = await this.prisma.auditFile.create({
          data: {
            auditId,
            filePath: fileResult.path,
            fileSize: fileResult.size || 0,
            language: fileResult.language,
            linesOfCode: fileResult.linesOfCode || 0,
            issueCount: fileResult.issues?.length || 0,
            errorCount:
              fileResult.issues?.filter((i) => i.severity === 'error').length ||
              0,
            warningCount:
              fileResult.issues?.filter((i) => i.severity === 'warning')
                .length || 0,
            infoCount:
              fileResult.issues?.filter((i) => i.severity === 'info').length ||
              0,
            complexityScore: fileResult.metrics?.cyclomaticComplexity,
            maintainabilityIndex: fileResult.metrics?.maintainabilityIndex,
          },
        });

        // Store issues for this file
        if (fileResult.issues) {
          for (const issue of fileResult.issues) {
            await this.prisma.issue.create({
              data: {
                auditId,
                fileId: auditFile.id,
                severity: issue.severity.toUpperCase() as any,
                message: issue.message,
                rule: issue.rule,
                category: issue.category,
                filePath: issue.location.file,
                line: issue.location.line,
                column: issue.location.column,
                endLine: issue.range?.end.line,
                endColumn: issue.range?.end.column,
                fixable: issue.fixable || false,
                suggestions: JSON.stringify(issue.suggestions || []),
                codeSnippet: issue.codeSnippet,
                cwe: issue.cwe,
                cvss: issue.cvss,
              },
            });
          }
        }
      }
    }

    // Store issues without specific file association
    for (const issue of issues) {
      if (!result.fileResults?.some((fr) => fr.path === issue.location.file)) {
        await this.prisma.issue.create({
          data: {
            auditId,
            severity: issue.severity.toUpperCase() as any,
            message: issue.message,
            rule: issue.rule,
            category: issue.category,
            filePath: issue.location.file,
            line: issue.location.line,
            column: issue.location.column,
            endLine: issue.range?.end.line,
            endColumn: issue.range?.end.column,
            fixable: issue.fixable || false,
            suggestions: JSON.stringify(issue.suggestions || []),
            codeSnippet: issue.codeSnippet,
            cwe: issue.cwe,
            cvss: issue.cvss,
          },
        });
      }
    }
  }

  private emitProgress(auditId: string, data: any): void {
    const message: AuditWebSocketMessage = {
      type: 'audit.progress',
      timestamp: new Date().toISOString(),
      data: {
        auditId,
        ...data,
      },
    };
    this.emit('audit.progress', message);
  }

  private emitStatusUpdate(
    auditId: string,
    status: string,
    message?: string
  ): void {
    const wsMessage: AuditWebSocketMessage = {
      type: 'audit.status',
      timestamp: new Date().toISOString(),
      data: {
        auditId,
        status,
        message,
      },
    };
    this.emit('audit.status', wsMessage);
  }

  private emitCompletion(auditId: string): void {
    this.getAuditStatus(auditId).then((auditSummary) => {
      const message: AuditWebSocketMessage = {
        type: 'audit.completed',
        timestamp: new Date().toISOString(),
        data: auditSummary,
      };
      this.emit('audit.completed', message);
    });
  }

  private emitError(auditId: string, error: string, stage?: string): void {
    const message: AuditWebSocketMessage = {
      type: 'audit.error',
      timestamp: new Date().toISOString(),
      data: {
        auditId,
        error,
        stage,
      },
    };
    this.emit('audit.error', message);
  }
}
