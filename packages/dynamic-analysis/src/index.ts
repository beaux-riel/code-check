export { JestInstrumentation } from './jest/instrumentation';
export { CypressInstrumentation } from './cypress/instrumentation';
export { PerformanceProfiler } from './profiling/performance-profiler';
export { SecurityProbe } from './security/security-probe';
export { DynamicAnalysisEngine } from './engine/dynamic-analysis-engine';
export { RuntimeDataCollector } from './collector/runtime-data-collector';

export type {
  InstrumentationConfig,
  CoverageData,
  PerformanceMetrics,
  SecurityVulnerability,
  RuntimeAnalysisResult,
  DynamicAnalysisConfig,
} from './types';
