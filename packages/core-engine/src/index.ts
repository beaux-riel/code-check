// Main engine
export { CodeCheckEngine, CodeCheckEngineConfig } from './engine.js';

// Analysis pipeline
export {
  AnalysisPipeline,
  AnalysisPipelineConfig,
  AnalysisPipelineResult,
} from './pipeline/AnalysisPipeline.js';

// Plugins
export { FileDiscoveryPlugin } from './plugins/FileDiscoveryPlugin.js';
export { ASTAnalysisPlugin } from './plugins/ASTAnalysisPlugin.js';
export { DynamicRunnerPlugin } from './plugins/DynamicRunnerPlugin.js';
export {
  LLMReasoningPlugin,
  LLMAnalysisResult,
} from './plugins/LLMReasoningPlugin.js';

// Static Analysis Plugins
export { ESLintPlugin, ESLintPluginConfig } from './plugins/ESLintPlugin.js';
export { TypeScriptPlugin } from './plugins/TypeScriptPlugin.js';
export { NpmAuditPlugin, NpmAuditConfig } from './plugins/NpmAuditPlugin.js';
export { SnykPlugin, SnykConfig } from './plugins/SnykPlugin.js';
export {
  CodeMetricsPlugin,
  CodeMetricsConfig,
} from './plugins/CodeMetricsPlugin.js';
export {
  StaticAnalysisOrchestrator,
  StaticAnalysisConfig,
} from './plugins/StaticAnalysisOrchestrator.js';

// Registry and configuration
export { RuleRegistry, Rule, RuleSet } from './registry/RuleRegistry.js';
export {
  SeverityConfigManager,
  SeverityConfig,
  SeverityLevel,
  SeverityThreshold,
  EscalationRule,
} from './config/SeverityConfig.js';

// Rule Library
export * from './rules/index.js';
export {
  CodeCheckConfig,
  CodeCheckConfigManager,
  defaultConfig,
} from './config/CodeCheckConfig.js';

// Worker execution
export {
  WorkerThreadExecutor,
  WorkerTask,
  WorkerResult,
  WorkerPoolOptions,
} from './execution/WorkerThreadExecutor.js';

// Reports
export {
  ReportGenerator,
  ReportConfig,
  ReportData,
} from './reports/ReportGenerator.js';

// JSON Schema
export {
  AnalysisResultSchema,
  AnalysisConfiguration,
  AnalysisSummary,
  AnalyzedFile,
  AnalysisMetrics,
  PluginResult,
  Recommendation,
  AnalysisResultSchemaValidator,
} from './schema/AnalysisResultSchema.js';

// Types
export * from './types/index.js';
