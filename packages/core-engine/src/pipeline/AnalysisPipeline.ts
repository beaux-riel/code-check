import { EventEmitter } from 'events';
import { Plugin } from '../types/index';
import { CodeIssue, AnalysisEvent } from '@code-check/shared/types';
import { IAIProvider } from '@code-check/shared';
import { FileDiscoveryPlugin } from '../plugins/FileDiscoveryPlugin';
import { ASTAnalysisPlugin } from '../plugins/ASTAnalysisPlugin';
import { DynamicRunnerPlugin } from '../plugins/DynamicRunnerPlugin';
import { LLMReasoningPlugin } from '../plugins/LLMReasoningPlugin';
import { RuleRegistry } from '../registry/RuleRegistry';
import { SeverityConfigManager } from '../config/SeverityConfig';
import {
  WorkerThreadExecutor,
  WorkerTask,
} from '../execution/WorkerThreadExecutor';
import {
  AnalysisResultSchema,
  AnalysisConfiguration,
  AnalysisSummary,
  AnalyzedFile,
  AnalysisMetrics,
  PluginResult,
  Recommendation,
  AnalysisResultSchemaValidator,
} from '../schema/AnalysisResultSchema';

export interface AnalysisPipelineConfig {
  projectPath: string;
  includedFiles?: string[];
  excludedFiles?: string[];
  includePatterns?: string[];
  excludePatterns?: string[];
  enabledPlugins?: string[];
  rulesets?: string[];
  maxWorkers?: number;
  concurrency?: number;
  enableParallelExecution?: boolean;
  outputFormat?: 'json' | 'xml' | 'html' | 'markdown' | 'all';
  outputPath?: string;
  aiProvider?: IAIProvider;
  generateReports?: boolean;
  maxFileSize?: number;
  timeout?: number;
  bail?: boolean;
  cache?: boolean;
}

export interface AnalysisPipelineResult {
  success: boolean;
  analysisId: string;
  summary: AnalysisSummary;
  schema: AnalysisResultSchema;
  duration: number;
  errors: string[];
}

export class AnalysisPipeline extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private ruleRegistry: RuleRegistry;
  private severityManager: SeverityConfigManager;
  private workerExecutor: WorkerThreadExecutor;
  private config: AnalysisPipelineConfig;
  private analysisId: string;
  private discoveredFiles: string[] = [];

  constructor(config: AnalysisPipelineConfig) {
    super();
    this.config = config;
    this.analysisId = this.generateAnalysisId();
    this.ruleRegistry = new RuleRegistry();
    this.severityManager = new SeverityConfigManager();
    this.workerExecutor = new WorkerThreadExecutor({
      maxWorkers: config.maxWorkers,
      taskTimeout: 60000, // 1 minute timeout
      retryAttempts: 2,
    });

    this.initializePlugins();
  }

  public async initialize(): Promise<void> {
    this.emit('pipeline.initializing', { analysisId: this.analysisId });

    try {
      // Initialize worker thread executor
      await this.workerExecutor.initialize();

      // Initialize all plugins
      for (const [name, plugin] of this.plugins) {
        try {
          await plugin.initialize();
          this.emit('plugin.initialized', {
            name,
            analysisId: this.analysisId,
          });
        } catch (error) {
          this.emit('plugin.error', {
            name,
            error: error instanceof Error ? error.message : 'Unknown error',
            analysisId: this.analysisId,
          });
        }
      }

      this.emit('pipeline.initialized', { analysisId: this.analysisId });
    } catch (error) {
      this.emit('pipeline.error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        analysisId: this.analysisId,
      });
      throw error;
    }
  }

  public async analyze(options?: {
    onFileComplete?: () => void;
    onProgress?: (current: number, total: number) => void;
  }): Promise<AnalysisPipelineResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      this.emit('analysis.started', {
        type: 'analysis.started',
        timestamp: new Date().toISOString(),
        source: 'AnalysisPipeline',
        files: [],
        analysisId: this.analysisId,
      } as AnalysisEvent);

      // Step 1: File Discovery
      this.discoveredFiles = await this.discoverFiles();
      this.emit('analysis.files.discovered', {
        count: this.discoveredFiles.length,
        analysisId: this.analysisId,
      });

      // Initialize progress tracking
      if (options?.onProgress) {
        options.onProgress(0, this.discoveredFiles.length);
      }

      // Step 2: Create analysis tasks
      const tasks = this.createAnalysisTasks(this.discoveredFiles);

      // Step 3: Execute analysis
      let allIssues: CodeIssue[] = [];
      let pluginResults: PluginResult[] = [];

      if (this.config.enableParallelExecution) {
        const results = await this.workerExecutor.executeTasksParallel(tasks);
        const processedResults = this.processWorkerResults(results);
        allIssues = processedResults.issues;
        pluginResults = processedResults.pluginResults;
      } else {
        const results = await this.executeSequentially(
          this.discoveredFiles,
          options
        );
        allIssues = results.issues;
        pluginResults = results.pluginResults;
      }

      // Step 4: Process results and generate metrics
      const analyzedFiles = this.analyzeFiles(this.discoveredFiles);
      const metrics = this.calculateMetrics(
        allIssues,
        analyzedFiles,
        startTime
      );
      const summary = this.createSummary(
        this.discoveredFiles,
        allIssues,
        startTime,
        'success'
      );
      const recommendations = this.generateRecommendations(allIssues);

      // Step 5: Create result schema
      const schema = AnalysisResultSchemaValidator.createSchema(
        this.analysisId,
        this.createConfiguration(),
        summary,
        analyzedFiles,
        allIssues,
        metrics,
        pluginResults,
        recommendations
      );

      const result: AnalysisPipelineResult = {
        success: true,
        analysisId: this.analysisId,
        summary,
        schema,
        duration: Date.now() - startTime,
        errors,
      };

      this.emit('analysis.completed', {
        type: 'analysis.completed',
        timestamp: new Date().toISOString(),
        source: 'AnalysisPipeline',
        report: {
          files: this.discoveredFiles,
          issues: allIssues,
          summary: {
            totalFiles: summary.totalFiles,
            totalIssues: summary.totalIssues,
            errorCount: summary.issuesByLevel.error,
            warningCount: summary.issuesByLevel.warning,
            infoCount: summary.issuesByLevel.info,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            version: '1.0.0',
          },
        },
      } as AnalysisEvent);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      const summary = this.createSummary([], [], startTime, 'failed');

      this.emit('analysis.error', {
        type: 'analysis.error',
        timestamp: new Date().toISOString(),
        source: 'AnalysisPipeline',
        error: error instanceof Error ? error : new Error(errorMessage),
      } as AnalysisEvent);

      return {
        success: false,
        analysisId: this.analysisId,
        summary,
        schema: AnalysisResultSchemaValidator.createSchema(
          this.analysisId,
          this.createConfiguration(),
          summary,
          [],
          [],
          this.getEmptyMetrics(),
          [],
          []
        ),
        duration: Date.now() - startTime,
        errors,
      };
    }
  }

  public async shutdown(): Promise<void> {
    this.emit('pipeline.shutting.down', { analysisId: this.analysisId });

    // Cleanup plugins
    for (const [name, plugin] of this.plugins) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup();
        } catch (error) {
          console.error(`Error cleaning up plugin ${name}:`, error);
        }
      }
    }

    // Shutdown worker pool
    await this.workerExecutor.shutdown();

    this.emit('pipeline.shutdown', { analysisId: this.analysisId });
  }

  private initializePlugins(): void {
    // Always add file discovery plugin
    this.plugins.set('FileDiscovery', new FileDiscoveryPlugin());

    // Add other plugins based on configuration
    const enabledPlugins = this.config.enabledPlugins || [
      'AST',
      'Dynamic',
      'LLM',
    ];

    if (enabledPlugins.includes('AST')) {
      this.plugins.set('AST', new ASTAnalysisPlugin());
    }

    if (enabledPlugins.includes('Dynamic')) {
      this.plugins.set('Dynamic', new DynamicRunnerPlugin());
    }

    if (enabledPlugins.includes('LLM') && this.config.aiProvider) {
      this.plugins.set('LLM', new LLMReasoningPlugin(this.config.aiProvider));
    }
  }

  private async discoverFiles(): Promise<string[]> {
    const fileDiscovery = this.plugins.get(
      'FileDiscovery'
    ) as FileDiscoveryPlugin;
    return await fileDiscovery.discoverFiles(this.config.projectPath);
  }

  private createAnalysisTasks(files: string[]): WorkerTask[] {
    const tasks: WorkerTask[] = [];

    for (const [pluginName, plugin] of this.plugins) {
      if (pluginName === 'FileDiscovery') continue; // Skip file discovery in worker tasks

      tasks.push({
        id: `${pluginName}-${Date.now()}-${Math.random()}`,
        pluginName: plugin.metadata.name,
        files: files,
        options: {},
      });
    }

    return tasks;
  }

  private async executeSequentially(
    files: string[],
    options?: {
      onFileComplete?: () => void;
      onProgress?: (current: number, total: number) => void;
    }
  ): Promise<{
    issues: CodeIssue[];
    pluginResults: PluginResult[];
  }> {
    const allIssues: CodeIssue[] = [];
    const pluginResults: PluginResult[] = [];

    let processedFiles = 0;
    const totalFiles = files.length * (this.plugins.size - 1); // Exclude FileDiscovery plugin

    for (const [pluginName, plugin] of this.plugins) {
      if (pluginName === 'FileDiscovery') continue;

      const startTime = Date.now();
      try {
        // Process files individually to track progress
        const pluginIssues: CodeIssue[] = [];

        for (const file of files) {
          const fileIssues = await plugin.analyze([file]);
          pluginIssues.push(...fileIssues);

          processedFiles++;

          // Call progress callbacks
          if (options?.onFileComplete) {
            options.onFileComplete();
          }
          if (options?.onProgress) {
            options.onProgress(processedFiles, totalFiles);
          }
        }

        allIssues.push(...pluginIssues);

        pluginResults.push({
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          executionTime: Date.now() - startTime,
          status: 'success',
          issuesFound: pluginIssues.length,
          filesProcessed: files.length,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        pluginResults.push({
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          executionTime: Date.now() - startTime,
          status: 'failed',
          issuesFound: 0,
          filesProcessed: 0,
          error: errorMessage,
        });
      }
    }

    return { issues: allIssues, pluginResults };
  }

  private processWorkerResults(workerResults: Array<any>): {
    issues: CodeIssue[];
    pluginResults: PluginResult[];
  } {
    const allIssues: CodeIssue[] = [];
    const pluginResults: PluginResult[] = [];

    for (const result of workerResults) {
      allIssues.push(...(result.issues || []));

      // Convert worker result to plugin result
      pluginResults.push({
        name: result.pluginName || 'Unknown',
        version: '1.0.0',
        executionTime: result.duration || 0,
        status: result.success ? 'success' : 'failed',
        issuesFound: (result.issues || []).length,
        filesProcessed: 1,
        error: result.error,
      });
    }

    return { issues: allIssues, pluginResults };
  }

  private analyzeFiles(files: string[]): AnalyzedFile[] {
    return files.map((file) => ({
      path: file,
      size: 0, // Would need to read file stats
      lastModified: new Date().toISOString(),
      language: this.detectLanguage(file),
      encoding: 'utf-8',
      linesOfCode: 0, // Would need to count lines
      issueCount: 0, // Would need to count issues for this file
      plugins: Array.from(this.plugins.keys()),
      processingTime: 0,
    }));
  }

  private detectLanguage(file: string): string {
    const extension = file.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'TypeScript',
      js: 'JavaScript',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      go: 'Go',
      rs: 'Rust',
      rb: 'Ruby',
      php: 'PHP',
    };
    return languageMap[extension || ''] || 'Unknown';
  }

  private calculateMetrics(
    issues: CodeIssue[],
    files: AnalyzedFile[],
    startTime: number
  ): AnalysisMetrics {
    const issueCounts = {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      performance: {
        totalExecutionTime: Date.now() - startTime,
        fileDiscoveryTime: 100, // Mock value
        analysisTime: Date.now() - startTime - 100,
        reportGenerationTime: 50,
      },
      quality: {
        codeQualityScore: Math.max(
          0,
          100 - (issueCounts.error * 10 + issueCounts.warning * 5)
        ),
        maintainabilityIndex: 85, // Mock value
        technicalDebt: issueCounts.error + issueCounts.warning,
      },
      security: {
        vulnerabilityCount: issues.filter((i) => i.rule?.includes('security'))
          .length,
        riskLevel:
          issueCounts.error > 0
            ? 'high'
            : issueCounts.warning > 5
              ? 'medium'
              : 'low',
        securityScore: 85, // Mock value
      },
      complexity: {
        averageComplexity: 5, // Mock value
        maxComplexity: 15, // Mock value
        complexityDistribution: [
          { range: '1-5', count: 20 },
          { range: '6-10', count: 15 },
          { range: '11-15', count: 5 },
        ],
      },
    };
  }

  private createSummary(
    files: string[],
    issues: CodeIssue[],
    startTime: number,
    status: 'success' | 'partial' | 'failed'
  ): AnalysisSummary {
    const issueCounts = {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      totalFiles: files.length,
      analyzedFiles: files.length,
      skippedFiles: 0,
      totalIssues: issues.length,
      issuesByLevel: issueCounts,
      executionTime: Date.now() - startTime,
      status,
      exitCode: status === 'success' ? 0 : 1,
    };
  }

  private generateRecommendations(issues: CodeIssue[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Example recommendation based on issues
    if (issues.some((i) => i.rule === 'missing-return-type')) {
      recommendations.push({
        id: 'add-return-types',
        category: 'Type Safety',
        priority: 'medium',
        title: 'Add Return Type Annotations',
        description:
          'Functions should have explicit return type annotations to improve type safety',
        impact:
          'Improves code maintainability and catches type-related bugs early',
        effort: 'low',
        relatedIssues: issues
          .filter((i) => i.rule === 'missing-return-type')
          .map((i) => i.id),
        actionItems: [
          'Add return type annotations to all functions',
          'Configure TypeScript strict mode',
          'Set up pre-commit hooks to enforce type checking',
        ],
      });
    }

    return recommendations;
  }

  private createConfiguration(): AnalysisConfiguration {
    return {
      projectPath: this.config.projectPath,
      includedFiles: this.config.includedFiles || ['**/*.ts', '**/*.js'],
      excludedFiles: this.config.excludedFiles || [
        '**/node_modules/**',
        '**/dist/**',
      ],
      enabledPlugins: this.config.enabledPlugins || ['AST', 'Dynamic', 'LLM'],
      rulesets: this.config.rulesets || ['typescript-recommended'],
      severityConfig: {
        thresholds: this.severityManager.getAllThresholds(),
      },
    };
  }

  private getEmptyMetrics(): AnalysisMetrics {
    return {
      performance: {
        totalExecutionTime: 0,
        fileDiscoveryTime: 0,
        analysisTime: 0,
        reportGenerationTime: 0,
      },
      quality: {
        codeQualityScore: 0,
        maintainabilityIndex: 0,
        technicalDebt: 0,
      },
      security: {
        vulnerabilityCount: 0,
        riskLevel: 'low',
        securityScore: 0,
      },
      complexity: {
        averageComplexity: 0,
        maxComplexity: 0,
        complexityDistribution: [],
      },
    };
  }

  private generateAnalysisId(): string {
    return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getDiscoveredFiles(): string[] {
    return [...this.discoveredFiles];
  }
}
