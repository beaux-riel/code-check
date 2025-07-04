import {
  AnalysisPipeline,
  AnalysisPipelineConfig,
  AnalysisPipelineResult,
} from './pipeline/AnalysisPipeline';
import { ReportGenerator, ReportConfig } from './reports/ReportGenerator';
import { IAIProvider } from '@code-check/shared';
import { AnalysisResultSchema } from './schema/AnalysisResultSchema';
import path from 'path';

export interface CodeCheckEngineConfig {
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
  reportConfig?: Partial<ReportConfig>;
  maxFileSize?: number;
  timeout?: number;
  bail?: boolean;
  cache?: boolean;
}

export class CodeCheckEngine {
  private pipeline: AnalysisPipeline;
  private config: CodeCheckEngineConfig;

  constructor(config: CodeCheckEngineConfig) {
    this.config = config;
    this.pipeline = new AnalysisPipeline(config);
    console.log('CodeCheckEngine initialized with config:', config.projectPath);
  }

  public async initialize(): Promise<void> {
    await this.pipeline.initialize();
  }

  public async analyze(options?: {
    onFileComplete?: () => void;
    onProgress?: (current: number, total: number) => void;
  }): Promise<AnalysisPipelineResult> {
    const result = await this.pipeline.analyze(options);

    // Generate reports if enabled
    if (this.config.generateReports !== false) {
      await this.generateReports(result);
    }

    return result;
  }

  public async generateReports(result: AnalysisPipelineResult): Promise<{
    markdownPath: string;
    htmlPath: string;
    jsonPath: string;
  }> {
    const outputPath =
      this.config.outputPath ||
      path.join(this.config.projectPath, '.code-check');

    const reportConfig: ReportConfig = {
      outputPath,
      includeDetails: true,
      includeMetrics: true,
      includeSummary: true,
      ...this.config.reportConfig,
    };

    const reportGenerator = new ReportGenerator(reportConfig);
    const projectName = path.basename(this.config.projectPath);

    return await reportGenerator.generateReports(result, projectName);
  }

  public async analyzeCode(code: string): Promise<string> {
    // Legacy method for backward compatibility
    console.log(
      'Legacy analyze method called - consider using analyze() instead'
    );
    return `Analysis result for: ${code}`;
  }

  public async shutdown(): Promise<void> {
    await this.pipeline.shutdown();
  }

  public getConfiguration(): CodeCheckEngineConfig {
    return { ...this.config };
  }

  public updateConfiguration(config: Partial<CodeCheckEngineConfig>): void {
    this.config = { ...this.config, ...config };
    // Note: Updating configuration requires recreating the pipeline
    // This is a simplified implementation
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.pipeline.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.pipeline.off(event, listener);
  }

  public getDiscoveredFiles(): string[] {
    // Return discovered files from the pipeline
    // In a real implementation, this would return the actual discovered files
    return this.pipeline.getDiscoveredFiles
      ? this.pipeline.getDiscoveredFiles()
      : [];
  }

  public getAnalysisStatus(): {
    filesProcessed: number;
    totalFiles: number;
    isRunning: boolean;
    errors: string[];
  } {
    // Return current analysis status
    return {
      filesProcessed: 0,
      totalFiles: 0,
      isRunning: false,
      errors: [],
    };
  }

  public async validateConfiguration(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!this.config.projectPath) {
      errors.push('Project path is required');
    }

    if (this.config.concurrency && this.config.concurrency < 1) {
      errors.push('Concurrency must be at least 1');
    }

    if (this.config.timeout && this.config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
