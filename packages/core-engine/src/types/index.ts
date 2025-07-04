// Re-export all shared types
export * from '@code-check/shared/types';

// Import types we need to reference
import { CodeIssue, CodeLocation, CodeRange } from '@code-check/shared/types';

// Plugin-specific types
export interface PluginMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author?: string;
  readonly dependencies?: string[];
}

export interface Plugin {
  readonly metadata: PluginMetadata;
  initialize(): Promise<void>;
  analyze(files: string[]): Promise<CodeIssue[]>;
  cleanup?(): Promise<void>;
}

// Analysis-specific types
export interface AnalysisOptions {
  projectPath: string;
  includedFiles?: string[];
  excludedFiles?: string[];
  enabledPlugins?: string[];
  rulesets?: string[];
  maxWorkers?: number;
  enableParallelExecution?: boolean;
  outputFormat?: 'json' | 'xml' | 'html';
  outputPath?: string;
}

export interface AnalysisContext {
  projectPath: string;
  currentFile?: string;
  options: AnalysisOptions;
  timestamp: string;
  analysisId: string;
}

// Worker thread types
export interface WorkerTaskContext {
  id: string;
  pluginName: string;
  files: string[];
  options: Record<string, any>;
  timeout?: number;
}

export interface WorkerExecutionResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  metadata?: Record<string, any>;
}

// Rule engine types
export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  enabled: boolean;
  fixable: boolean;
  tags: string[];
  configuration?: Record<string, any>;
  validate?: (context: AnalysisContext, data: any) => boolean;
}

export interface RuleViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: CodeLocation;
  range?: CodeRange;
  data?: any;
  suggestions?: string[];
}

// Pipeline types
export interface PipelineStage {
  name: string;
  description: string;
  enabled: boolean;
  parallel: boolean;
  dependencies?: string[];
  execute(context: AnalysisContext): Promise<StageResult>;
}

export interface StageResult {
  stageName: string;
  success: boolean;
  duration: number;
  issues: CodeIssue[];
  metadata?: Record<string, any>;
  error?: string;
}

export interface PipelineResult {
  success: boolean;
  duration: number;
  stages: StageResult[];
  totalIssues: number;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// Configuration types
export interface EngineConfiguration {
  analysis: AnalysisOptions;
  plugins: Record<string, any>;
  rules: Record<string, any>;
  severity: {
    thresholds: Array<{
      level: 'error' | 'warning' | 'info';
      maxCount: number;
      failOnExceed: boolean;
    }>;
  };
  workers: {
    maxWorkers: number;
    taskTimeout: number;
    retryAttempts: number;
  };
  output: {
    format: 'json' | 'xml' | 'html';
    path?: string;
    pretty: boolean;
  };
}

// Event types for pipeline communication
export interface PipelineEvent {
  type: string;
  timestamp: string;
  source: string;
  data?: any;
}

export interface AnalysisStartedEvent extends PipelineEvent {
  type: 'analysis.started';
  analysisId: string;
  projectPath: string;
}

export interface AnalysisProgressEvent extends PipelineEvent {
  type: 'analysis.progress';
  analysisId: string;
  stage: string;
  progress: number; // 0-100
  message?: string;
}

export interface AnalysisCompletedEvent extends PipelineEvent {
  type: 'analysis.completed';
  analysisId: string;
  result: PipelineResult;
}

export interface AnalysisErrorEvent extends PipelineEvent {
  type: 'analysis.error';
  analysisId: string;
  error: Error;
  stage?: string;
}

export type AnalysisPipelineEvent =
  | AnalysisStartedEvent
  | AnalysisProgressEvent
  | AnalysisCompletedEvent
  | AnalysisErrorEvent;

// Performance monitoring types
export interface PerformanceMetrics {
  totalExecutionTime: number;
  stageExecutionTimes: Record<string, number>;
  memoryUsage: {
    peak: number;
    average: number;
    final: number;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
  fileProcessingStats: {
    totalFiles: number;
    filesPerSecond: number;
    averageFileSize: number;
  };
}

// Security analysis types
export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: CodeLocation;
  cwe?: string; // Common Weakness Enumeration
  cvss?: number; // Common Vulnerability Scoring System
  remediation?: string;
  references?: string[];
}

// Code quality metrics
export interface QualityMetrics {
  maintainabilityIndex: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  duplicatedLines: number;
  testCoverage?: number;
  technicalDebt: number; // in hours
}

// Utility types
export type Severity = 'error' | 'warning' | 'info';
export type Status = 'success' | 'failed' | 'skipped' | 'partial';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// Function type for plugin factories
export type PluginFactory<T extends Plugin = Plugin> = (config?: any) => T;

// Generic result wrapper
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// File system helper types
export interface FileStats {
  path: string;
  size: number;
  modified: Date;
  created: Date;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  language?: string;
}
