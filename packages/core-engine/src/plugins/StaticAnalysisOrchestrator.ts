import {
  Plugin,
  PluginMetadata,
  CodeIssue,
  AnalysisContext,
  OperationResult,
} from '../types/index.js';
import {
  AnalysisResultSchema,
  AnalysisResultSchemaValidator,
  PluginResult,
  AnalyzedFile,
  AnalysisMetrics,
} from '../schema/AnalysisResultSchema.js';
import { ESLintPlugin, ESLintPluginConfig } from './ESLintPlugin.js';
import { TypeScriptPlugin } from './TypeScriptPlugin.js';
import { NpmAuditPlugin, NpmAuditConfig } from './NpmAuditPlugin.js';
import { SnykPlugin, SnykConfig } from './SnykPlugin.js';
import {
  CodeMetricsPlugin,
  CodeMetricsConfig,
  FileMetrics,
} from './CodeMetricsPlugin.js';
import fs from 'fs';
import path from 'path';

export interface StaticAnalysisConfig {
  eslint?: {
    enabled: boolean;
    config?: ESLintPluginConfig;
  };
  typescript?: {
    enabled: boolean;
    configFile?: string;
  };
  npmAudit?: {
    enabled: boolean;
    config?: NpmAuditConfig;
  };
  snyk?: {
    enabled: boolean;
    config?: SnykConfig;
  };
  codeMetrics?: {
    enabled: boolean;
    config?: CodeMetricsConfig;
  };
  parallelExecution?: boolean;
  maxConcurrentPlugins?: number;
  timeout?: number;
  failFast?: boolean;
  generateRecommendations?: boolean;
}

export class StaticAnalysisOrchestrator implements Plugin {
  public readonly metadata: PluginMetadata = {
    name: 'Static Analysis Orchestrator',
    version: '1.0.0',
    description:
      'Orchestrates multiple static analysis tools and maps outputs to unified schema',
    author: 'Code Check Team',
    dependencies: ['eslint', 'typescript', 'npm'],
  };

  private config: Required<StaticAnalysisConfig>;
  private plugins: Map<string, Plugin> = new Map();
  private startTime: number = 0;

  constructor(config: StaticAnalysisConfig = {}) {
    this.config = {
      eslint: { enabled: true },
      typescript: { enabled: true },
      npmAudit: { enabled: true },
      snyk: { enabled: false }, // Disabled by default (requires API key)
      codeMetrics: { enabled: true },
      parallelExecution: true,
      maxConcurrentPlugins: 4,
      timeout: 300000, // 5 minutes
      failFast: false,
      generateRecommendations: true,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    this.startTime = Date.now();

    // Initialize enabled plugins
    if (this.config.eslint.enabled) {
      const eslintPlugin = new ESLintPlugin(this.config.eslint.config);
      await eslintPlugin.initialize();
      this.plugins.set('eslint', eslintPlugin);
    }

    if (this.config.typescript.enabled) {
      const tsConfigFile =
        this.config.typescript.configFile || this.findTypeScriptConfig();
      if (tsConfigFile) {
        const typescriptPlugin = new TypeScriptPlugin(tsConfigFile);
        await typescriptPlugin.initialize();
        this.plugins.set('typescript', typescriptPlugin);
      }
    }

    if (this.config.npmAudit.enabled) {
      const npmAuditPlugin = new NpmAuditPlugin(this.config.npmAudit.config);
      await npmAuditPlugin.initialize();
      this.plugins.set('npmAudit', npmAuditPlugin);
    }

    if (this.config.snyk.enabled && this.config.snyk.config) {
      const snykPlugin = new SnykPlugin(this.config.snyk.config);
      await snykPlugin.initialize();
      this.plugins.set('snyk', snykPlugin);
    }

    if (this.config.codeMetrics.enabled) {
      const codeMetricsPlugin = new CodeMetricsPlugin(
        this.config.codeMetrics.config
      );
      await codeMetricsPlugin.initialize();
      this.plugins.set('codeMetrics', codeMetricsPlugin);
    }
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const allIssues: CodeIssue[] = [];
    const pluginResults: PluginResult[] = [];

    if (this.config.parallelExecution) {
      const results = await this.runPluginsInParallel(files);
      for (const result of results) {
        allIssues.push(...result.issues);
        pluginResults.push(result.pluginResult);
      }
    } else {
      for (const [name, plugin] of this.plugins) {
        const result = await this.runSinglePlugin(name, plugin, files);
        allIssues.push(...result.issues);
        pluginResults.push(result.pluginResult);
      }
    }

    return allIssues;
  }

  public async generateUnifiedReport(
    files: string[],
    analysisId: string,
    projectPath: string
  ): Promise<AnalysisResultSchema> {
    const fileAnalysisResults = new Map<string, AnalyzedFile>();
    const allIssues: CodeIssue[] = [];
    const pluginResults: PluginResult[] = [];

    // Run analysis
    if (this.config.parallelExecution) {
      const results = await this.runPluginsInParallel(files);
      for (const result of results) {
        allIssues.push(...result.issues);
        pluginResults.push(result.pluginResult);
      }
    } else {
      for (const [name, plugin] of this.plugins) {
        const result = await this.runSinglePlugin(name, plugin, files);
        allIssues.push(...result.issues);
        pluginResults.push(result.pluginResult);
      }
    }

    // Process files for analysis
    for (const file of files) {
      if (fs.existsSync(file)) {
        const analyzedFile = await this.createAnalyzedFile(
          file,
          allIssues,
          pluginResults
        );
        fileAnalysisResults.set(file, analyzedFile);
      }
    }

    // Calculate metrics
    const metrics = await this.calculateAnalysisMetrics(
      Array.from(fileAnalysisResults.values()),
      allIssues,
      pluginResults
    );

    // Generate configuration
    const configuration = {
      projectPath,
      includedFiles: files,
      excludedFiles: [],
      enabledPlugins: Array.from(this.plugins.keys()),
      rulesets: ['eslint:recommended', 'typescript:recommended'],
      severityConfig: {
        thresholds: [
          { level: 'error' as const, maxCount: 0, failOnExceed: true },
          { level: 'warning' as const, maxCount: 10, failOnExceed: false },
          { level: 'info' as const, maxCount: 50, failOnExceed: false },
        ],
      },
    };

    // Generate summary
    const summary = {
      totalFiles: files.length,
      analyzedFiles: fileAnalysisResults.size,
      skippedFiles: files.length - fileAnalysisResults.size,
      totalIssues: allIssues.length,
      issuesByLevel: {
        error: allIssues.filter((i) => i.severity === 'error').length,
        warning: allIssues.filter((i) => i.severity === 'warning').length,
        info: allIssues.filter((i) => i.severity === 'info').length,
      },
      executionTime: Date.now() - this.startTime,
      status: this.determineAnalysisStatus(allIssues, pluginResults),
      exitCode: this.calculateExitCode(allIssues, pluginResults),
    };

    // Generate recommendations
    const recommendations = this.config.generateRecommendations
      ? this.generateRecommendations(allIssues, metrics)
      : [];

    return AnalysisResultSchemaValidator.createSchema(
      analysisId,
      configuration,
      summary,
      Array.from(fileAnalysisResults.values()),
      allIssues,
      metrics,
      pluginResults,
      recommendations
    );
  }

  private async runPluginsInParallel(files: string[]): Promise<
    Array<{
      issues: CodeIssue[];
      pluginResult: PluginResult;
    }>
  > {
    const pluginEntries = Array.from(this.plugins.entries());
    const results: Array<{
      issues: CodeIssue[];
      pluginResult: PluginResult;
    }> = [];

    // Process plugins in batches to respect maxConcurrentPlugins
    for (
      let i = 0;
      i < pluginEntries.length;
      i += this.config.maxConcurrentPlugins
    ) {
      const batch = pluginEntries.slice(
        i,
        i + this.config.maxConcurrentPlugins
      );
      const batchPromises = batch.map(([name, plugin]) =>
        this.runSinglePlugin(name, plugin, files)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle failed plugin execution
          const errorResult = {
            issues: [
              {
                id: `plugin-error-${Date.now()}`,
                severity: 'error' as const,
                message: `Plugin execution failed: ${result.reason?.message || 'Unknown error'}`,
                rule: 'plugin-execution-error',
                location: {
                  file: files[0] || 'unknown',
                  line: 1,
                  column: 1,
                },
                fixable: false,
              },
            ],
            pluginResult: {
              name: 'unknown',
              version: '0.0.0',
              executionTime: 0,
              status: 'failed' as const,
              issuesFound: 0,
              filesProcessed: 0,
              error: result.reason?.message || 'Unknown error',
            },
          };
          results.push(errorResult);
        }
      }
    }

    return results;
  }

  private async runSinglePlugin(
    name: string,
    plugin: Plugin,
    files: string[]
  ): Promise<{
    issues: CodeIssue[];
    pluginResult: PluginResult;
  }> {
    const startTime = Date.now();

    try {
      const issues = await Promise.race([
        plugin.analyze(files),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Plugin timeout')),
            this.config.timeout
          )
        ),
      ]);

      const executionTime = Date.now() - startTime;

      return {
        issues,
        pluginResult: {
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          executionTime,
          status: 'success',
          issuesFound: issues.length,
          filesProcessed: files.length,
          metadata: {
            description: plugin.metadata.description,
            author: plugin.metadata.author,
            dependencies: plugin.metadata.dependencies,
          },
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (this.config.failFast) {
        throw error;
      }

      return {
        issues: [],
        pluginResult: {
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          executionTime,
          status: 'failed',
          issuesFound: 0,
          filesProcessed: 0,
          error: errorMessage,
        },
      };
    }
  }

  private async createAnalyzedFile(
    filePath: string,
    allIssues: CodeIssue[],
    pluginResults: PluginResult[]
  ): Promise<AnalyzedFile> {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const fileIssues = allIssues.filter(
      (issue) => issue.location.file === filePath
    );
    const involvedPlugins = pluginResults
      .filter((result) => result.status === 'success')
      .map((result) => result.name);

    return {
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      language: this.detectLanguage(filePath),
      encoding: 'utf-8',
      linesOfCode: lines.filter((line) => line.trim().length > 0).length,
      issueCount: fileIssues.length,
      plugins: involvedPlugins,
      processingTime: 0, // This would be calculated during actual processing
    };
  }

  private async calculateAnalysisMetrics(
    files: AnalyzedFile[],
    issues: CodeIssue[],
    pluginResults: PluginResult[]
  ): Promise<AnalysisMetrics> {
    const totalExecutionTime = Date.now() - this.startTime;

    // Get metrics from CodeMetricsPlugin if available
    let avgComplexity = 0;
    let maxComplexity = 0;
    let maintainabilityIndex = 100;

    const codeMetricsPlugin = this.plugins.get(
      'codeMetrics'
    ) as CodeMetricsPlugin;
    if (codeMetricsPlugin) {
      // This is a simplified approach - in practice, you'd need to access the plugin's results
      avgComplexity = 5; // Placeholder
      maxComplexity = 15; // Placeholder
      maintainabilityIndex = 75; // Placeholder
    }

    return {
      performance: {
        totalExecutionTime,
        fileDiscoveryTime: 100, // Placeholder
        analysisTime: totalExecutionTime - 200,
        reportGenerationTime: 100,
      },
      quality: {
        codeQualityScore: this.calculateQualityScore(issues),
        maintainabilityIndex,
        technicalDebt: this.calculateTechnicalDebt(issues),
        testCoverage: undefined, // Would require coverage tool integration
      },
      security: {
        vulnerabilityCount: issues.filter(
          (i) =>
            i.rule?.includes('vulnerability') || i.rule?.includes('security')
        ).length,
        riskLevel: this.calculateRiskLevel(issues),
        securityScore: this.calculateSecurityScore(issues),
      },
      complexity: {
        averageComplexity: avgComplexity,
        maxComplexity,
        complexityDistribution: [
          { range: '1-5', count: 10 },
          { range: '6-10', count: 5 },
          { range: '11-15', count: 2 },
          { range: '16+', count: 1 },
        ],
      },
    };
  }

  private calculateQualityScore(issues: CodeIssue[]): number {
    const errorWeight = 10;
    const warningWeight = 3;
    const infoWeight = 1;

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    const totalPenalty =
      errorCount * errorWeight +
      warningCount * warningWeight +
      infoCount * infoWeight;
    const maxScore = 100;

    return Math.max(0, maxScore - totalPenalty);
  }

  private calculateTechnicalDebt(issues: CodeIssue[]): number {
    // Estimate technical debt in hours based on issue severity and fixability
    const errorHours = 2;
    const warningHours = 0.5;
    const infoHours = 0.1;

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    return (
      errorCount * errorHours +
      warningCount * warningHours +
      infoCount * infoHours
    );
  }

  private calculateRiskLevel(
    issues: CodeIssue[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const securityIssues = issues.filter(
      (i) =>
        i.rule?.includes('vulnerability') ||
        i.rule?.includes('security') ||
        i.rule?.includes('audit')
    );

    const criticalCount = securityIssues.filter(
      (i) => i.severity === 'error'
    ).length;
    const highCount = securityIssues.filter(
      (i) => i.severity === 'warning'
    ).length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 5) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }

  private calculateSecurityScore(issues: CodeIssue[]): number {
    const securityIssues = issues.filter(
      (i) =>
        i.rule?.includes('vulnerability') ||
        i.rule?.includes('security') ||
        i.rule?.includes('audit')
    );

    if (securityIssues.length === 0) return 100;

    const criticalPenalty = 25;
    const highPenalty = 10;
    const mediumPenalty = 5;

    const criticalCount = securityIssues.filter(
      (i) => i.severity === 'error'
    ).length;
    const highCount = securityIssues.filter(
      (i) => i.severity === 'warning'
    ).length;
    const mediumCount = securityIssues.filter(
      (i) => i.severity === 'info'
    ).length;

    const totalPenalty =
      criticalCount * criticalPenalty +
      highCount * highPenalty +
      mediumCount * mediumPenalty;

    return Math.max(0, 100 - totalPenalty);
  }

  private determineAnalysisStatus(
    issues: CodeIssue[],
    pluginResults: PluginResult[]
  ): 'success' | 'partial' | 'failed' {
    const hasFailedPlugins = pluginResults.some((r) => r.status === 'failed');
    const hasCriticalIssues = issues.some((i) => i.severity === 'error');

    if (hasFailedPlugins) return 'partial';
    if (hasCriticalIssues) return 'partial';
    return 'success';
  }

  private calculateExitCode(
    issues: CodeIssue[],
    pluginResults: PluginResult[]
  ): number {
    const hasFailedPlugins = pluginResults.some((r) => r.status === 'failed');
    const hasErrors = issues.some((i) => i.severity === 'error');

    if (hasFailedPlugins) return 2;
    if (hasErrors) return 1;
    return 0;
  }

  private generateRecommendations(
    issues: CodeIssue[],
    metrics: AnalysisMetrics
  ): any[] {
    const recommendations: any[] = [];

    // Security recommendations
    const securityIssues = issues.filter(
      (i) => i.rule?.includes('vulnerability') || i.rule?.includes('security')
    );

    if (securityIssues.length > 0) {
      recommendations.push({
        id: 'security-vulnerabilities',
        category: 'Security',
        priority: 'high',
        title: 'Address Security Vulnerabilities',
        description: `Found ${securityIssues.length} security-related issues that should be addressed.`,
        impact: 'Reduces security risks and potential attack vectors',
        effort: 'medium',
        relatedIssues: securityIssues.map((i) => i.id),
        actionItems: [
          'Review and fix security vulnerabilities',
          'Update dependencies to patched versions',
          'Implement security scanning in CI/CD pipeline',
        ],
      });
    }

    // Code quality recommendations
    if (metrics.quality.codeQualityScore < 80) {
      recommendations.push({
        id: 'code-quality-improvement',
        category: 'Code Quality',
        priority: 'medium',
        title: 'Improve Code Quality',
        description: `Current code quality score is ${metrics.quality.codeQualityScore}. Consider addressing warnings and refactoring complex code.`,
        impact: 'Improves code maintainability and reduces technical debt',
        effort: 'high',
        relatedIssues: issues
          .filter((i) => i.severity === 'warning')
          .map((i) => i.id),
        actionItems: [
          'Address ESLint warnings',
          'Refactor complex functions',
          'Add missing type annotations',
          'Improve code documentation',
        ],
      });
    }

    return recommendations;
  }

  private findTypeScriptConfig(): string | null {
    const possiblePaths = [
      'tsconfig.json',
      'tsconfig.build.json',
      'src/tsconfig.json',
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return path.resolve(configPath);
      }
    }

    return null;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.mjs': 'javascript',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
    };

    return languageMap[ext] || 'unknown';
  }

  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
    }
    this.plugins.clear();
  }

  public static createFactory(config?: StaticAnalysisConfig) {
    return () => new StaticAnalysisOrchestrator(config);
  }
}
