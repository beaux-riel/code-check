import { CodeIssue, CodeAnalysisReport } from '../types/index';

export interface AnalysisResultSchema {
  $schema: string;
  version: string;
  timestamp: string;
  analysisId: string;
  configuration: AnalysisConfiguration;
  summary: AnalysisSummary;
  files: AnalyzedFile[];
  issues: CodeIssue[];
  metrics: AnalysisMetrics;
  plugins: PluginResult[];
  recommendations: Recommendation[];
}

export interface AnalysisConfiguration {
  projectPath: string;
  includedFiles: string[];
  excludedFiles: string[];
  enabledPlugins: string[];
  rulesets: string[];
  severityConfig: {
    thresholds: Array<{
      level: 'error' | 'warning' | 'info';
      maxCount: number;
      failOnExceed: boolean;
    }>;
  };
}

export interface AnalysisSummary {
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  totalIssues: number;
  issuesByLevel: {
    error: number;
    warning: number;
    info: number;
  };
  executionTime: number;
  status: 'success' | 'partial' | 'failed';
  exitCode: number;
}

export interface AnalyzedFile {
  path: string;
  size: number;
  lastModified: string;
  language: string;
  encoding: string;
  linesOfCode: number;
  issueCount: number;
  complexity?: number;
  coverage?: number;
  plugins: string[];
  processingTime: number;
}

export interface AnalysisMetrics {
  performance: {
    totalExecutionTime: number;
    fileDiscoveryTime: number;
    analysisTime: number;
    reportGenerationTime: number;
  };
  quality: {
    codeQualityScore: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    testCoverage?: number;
  };
  security: {
    vulnerabilityCount: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    securityScore: number;
  };
  complexity: {
    averageComplexity: number;
    maxComplexity: number;
    complexityDistribution: Array<{
      range: string;
      count: number;
    }>;
  };
}

export interface PluginResult {
  name: string;
  version: string;
  executionTime: number;
  status: 'success' | 'failed' | 'skipped';
  issuesFound: number;
  filesProcessed: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  relatedIssues: string[];
  actionItems: string[];
  resources?: Array<{
    type: 'documentation' | 'tutorial' | 'tool';
    title: string;
    url: string;
  }>;
}

export class AnalysisResultSchemaValidator {
  private static readonly SCHEMA_VERSION = '1.0.0';
  private static readonly SCHEMA_URL =
    'https://schemas.code-check.dev/analysis-result/v1.0.0';

  public static createSchema(
    analysisId: string,
    config: AnalysisConfiguration,
    summary: AnalysisSummary,
    files: AnalyzedFile[],
    issues: CodeIssue[],
    metrics: AnalysisMetrics,
    plugins: PluginResult[],
    recommendations: Recommendation[] = []
  ): AnalysisResultSchema {
    return {
      $schema: this.SCHEMA_URL,
      version: this.SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      analysisId,
      configuration: config,
      summary,
      files,
      issues,
      metrics,
      plugins,
      recommendations,
    };
  }

  public static validate(result: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    const requiredFields = [
      '$schema',
      'version',
      'timestamp',
      'analysisId',
      'configuration',
      'summary',
      'files',
      'issues',
      'metrics',
      'plugins',
      'recommendations',
    ];

    for (const field of requiredFields) {
      if (!(field in result)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    if (result.version && typeof result.version !== 'string') {
      errors.push('version must be a string');
    }

    if (result.timestamp && !this.isValidISO8601(result.timestamp)) {
      errors.push('timestamp must be a valid ISO 8601 date string');
    }

    if (result.issues && !Array.isArray(result.issues)) {
      errors.push('issues must be an array');
    }

    if (result.files && !Array.isArray(result.files)) {
      errors.push('files must be an array');
    }

    if (result.plugins && !Array.isArray(result.plugins)) {
      errors.push('plugins must be an array');
    }

    // Validate issue structure
    if (result.issues && Array.isArray(result.issues)) {
      result.issues.forEach((issue: any, index: number) => {
        const issueErrors = this.validateIssue(issue);
        errors.push(...issueErrors.map((err) => `issues[${index}]: ${err}`));
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static validateIssue(issue: any): string[] {
    const errors: string[] = [];
    const requiredFields = ['id', 'severity', 'message', 'location'];

    for (const field of requiredFields) {
      if (!(field in issue)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (
      issue.severity &&
      !['error', 'warning', 'info'].includes(issue.severity)
    ) {
      errors.push('severity must be one of: error, warning, info');
    }

    if (issue.location) {
      const locationErrors = this.validateLocation(issue.location);
      errors.push(...locationErrors.map((err) => `location.${err}`));
    }

    return errors;
  }

  private static validateLocation(location: any): string[] {
    const errors: string[] = [];
    const requiredFields = ['file', 'line', 'column'];

    for (const field of requiredFields) {
      if (!(field in location)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (
      location.line &&
      (typeof location.line !== 'number' || location.line < 1)
    ) {
      errors.push('line must be a positive number');
    }

    if (
      location.column &&
      (typeof location.column !== 'number' || location.column < 1)
    ) {
      errors.push('column must be a positive number');
    }

    return errors;
  }

  private static isValidISO8601(dateString: string): boolean {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return iso8601Regex.test(dateString) && !isNaN(Date.parse(dateString));
  }

  public static toJSON(
    result: AnalysisResultSchema,
    pretty: boolean = false
  ): string {
    return JSON.stringify(result, null, pretty ? 2 : undefined);
  }

  public static fromJSON(json: string): AnalysisResultSchema {
    try {
      const parsed = JSON.parse(json);
      const validation = this.validate(parsed);

      if (!validation.valid) {
        throw new Error(
          `Invalid analysis result schema: ${validation.errors.join(', ')}`
        );
      }

      return parsed as AnalysisResultSchema;
    } catch (error) {
      throw new Error(
        `Failed to parse analysis result JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
