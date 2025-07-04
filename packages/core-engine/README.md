# Core Auditing Engine

A comprehensive, plugin-based code analysis pipeline with AST/static analysis, dynamic execution, LLM-based reasoning, rule management, severity configuration, worker-thread execution, and standardized JSON result schema.

## Features

### 🔍 **File Discovery**

- Recursive file system traversal
- Configurable file extensions and patterns
- Smart filtering with include/exclude patterns
- Language detection based on file extensions

### 🌳 **AST/Static Analysis**

- TypeScript/JavaScript AST parsing using Babel
- Configurable static analysis rules
- Type annotation checking
- Code structure analysis
- Syntax error detection

### 🏃 **Dynamic Runtime Analysis**

- Code execution in sandboxed environments
- Performance monitoring (execution time, memory usage)
- Runtime error detection
- Multi-language support (JS, TS, Python, Shell)

### 🤖 **LLM-based Reasoning**

- AI-powered code analysis using configurable LLM providers
- Intelligent issue detection and reasoning
- Security vulnerability identification
- Code quality assessment with confidence scoring

### 📋 **Rule Registry**

- Centralized rule management system
- Rule sets and inheritance
- Configurable severity levels
- Rule categorization and tagging
- Runtime rule enabling/disabling

### ⚡ **Severity Configuration**

- Flexible severity level management
- Threshold-based analysis control
- Escalation rules
- Quality score calculation
- Severity distribution analytics

### 👥 **Worker Thread Execution**

- Concurrent analysis execution
- Configurable worker pool
- Task timeout and retry mechanisms
- Resource monitoring and management
- Fault tolerance and error handling

### 📊 **JSON Result Schema**

- Standardized analysis result format
- Schema validation and verification
- Comprehensive metrics and metadata
- Plugin execution results
- Actionable recommendations

## Installation

```bash
npm install @code-check/core-engine
```

## Quick Start

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';
import { AIProviderFactory } from '@code-check/shared';

// Initialize the engine
const engine = new CodeCheckEngine({
  projectPath: '/path/to/your/project',
  enabledPlugins: ['AST', 'Dynamic', 'LLM'],
  enableParallelExecution: true,
  maxWorkers: 4,
  aiProvider: AIProviderFactory.create('openai', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

// Initialize and run analysis
await engine.initialize();
const result = await engine.analyze();

// Process results
console.log(`Analysis completed in ${result.duration}ms`);
console.log(`Found ${result.summary.totalIssues} issues`);
console.log(
  `Quality Score: ${result.schema.metrics.quality.codeQualityScore}/100`
);

// Cleanup
await engine.shutdown();
```

## Core Components

### Analysis Pipeline

The main orchestrator that coordinates all analysis stages:

```typescript
import { AnalysisPipeline } from '@code-check/core-engine';

const pipeline = new AnalysisPipeline({
  projectPath: './src',
  enabledPlugins: ['AST', 'LLM'],
  rulesets: ['typescript-recommended', 'security-recommended'],
});

pipeline.on('analysis.started', (event) => {
  console.log('Analysis started:', event.analysisId);
});

pipeline.on('analysis.completed', (event) => {
  console.log('Analysis completed:', event.report);
});
```

### Plugin System

#### File Discovery Plugin

```typescript
import { FileDiscoveryPlugin } from '@code-check/core-engine';

const fileDiscovery = new FileDiscoveryPlugin();
await fileDiscovery.initialize();

const files = fileDiscovery.discoverFiles('./src', ['.ts', '.js']);
console.log(`Discovered ${files.length} files`);
```

#### AST Analysis Plugin

```typescript
import { ASTAnalysisPlugin } from '@code-check/core-engine';

const astAnalysis = new ASTAnalysisPlugin();
await astAnalysis.initialize();

const issues = await astAnalysis.analyze(['./src/file.ts']);
console.log(`Found ${issues.length} static analysis issues`);
```

#### Dynamic Runner Plugin

```typescript
import { DynamicRunnerPlugin } from '@code-check/core-engine';

const dynamicRunner = new DynamicRunnerPlugin();
await dynamicRunner.initialize();

const issues = await dynamicRunner.analyze(['./src/script.js']);
console.log(`Found ${issues.length} runtime issues`);
```

#### LLM Reasoning Plugin

```typescript
import { LLMReasoningPlugin } from '@code-check/core-engine';
import { AIProviderFactory } from '@code-check/shared';

const aiProvider = AIProviderFactory.create('openai', {
  apiKey: process.env.OPENAI_API_KEY,
});

const llmReasoning = new LLMReasoningPlugin(aiProvider);
await llmReasoning.initialize();

const issues = await llmReasoning.analyze(['./src/component.tsx']);
console.log(`Found ${issues.length} AI-detected issues`);
```

### Rule Management

```typescript
import { RuleRegistry } from '@code-check/core-engine';

const registry = new RuleRegistry();

// Register custom rule
registry.registerRule({
  id: 'custom-rule',
  name: 'Custom Rule',
  description: 'A custom analysis rule',
  severity: 'warning',
  category: 'Custom',
  enabled: true,
  fixable: false,
  tags: ['custom', 'quality'],
});

// Get enabled rules
const enabledRules = registry.getEnabledRules();
console.log(`${enabledRules.length} rules enabled`);
```

### Severity Configuration

```typescript
import { SeverityConfigManager } from '@code-check/core-engine';

const severityManager = new SeverityConfigManager();

// Update thresholds
severityManager.updateThreshold('error', 0, true); // Fail on any error
severityManager.updateThreshold('warning', 10, false); // Allow up to 10 warnings

// Check thresholds
const issueCounts = { error: 0, warning: 5, info: 20 };
const thresholdCheck = severityManager.checkThresholds(issueCounts);

if (thresholdCheck.exceeded) {
  console.log('Quality thresholds exceeded!');
}
```

### Worker Thread Execution

```typescript
import { WorkerThreadExecutor } from '@code-check/core-engine';

const executor = new WorkerThreadExecutor({
  maxWorkers: 4,
  taskTimeout: 30000,
  retryAttempts: 2,
});

await executor.initialize();

const tasks = [
  { id: 'task1', pluginName: 'AST Analysis', files: ['file1.ts'] },
  { id: 'task2', pluginName: 'LLM Reasoning', files: ['file2.ts'] },
];

const results = await executor.executeTasksParallel(tasks);
console.log(`Executed ${results.length} tasks in parallel`);

await executor.shutdown();
```

### Result Schema

```typescript
import { AnalysisResultSchemaValidator } from '@code-check/core-engine';

// Create standardized schema
const schema = AnalysisResultSchemaValidator.createSchema(
  'analysis-123',
  configuration,
  summary,
  files,
  issues,
  metrics,
  pluginResults,
  recommendations
);

// Validate schema
const validation = AnalysisResultSchemaValidator.validate(schema);
if (!validation.valid) {
  console.error('Schema validation failed:', validation.errors);
}

// Export as JSON
const jsonOutput = AnalysisResultSchemaValidator.toJSON(schema, true);
console.log(jsonOutput);
```

## Configuration

### Engine Configuration

```typescript
interface CodeCheckEngineConfig {
  projectPath: string; // Project root path
  includedFiles?: string[]; // File patterns to include
  excludedFiles?: string[]; // File patterns to exclude
  enabledPlugins?: string[]; // Plugins to enable
  rulesets?: string[]; // Rule sets to apply
  maxWorkers?: number; // Maximum worker threads
  enableParallelExecution?: boolean; // Enable parallel processing
  outputFormat?: 'json' | 'xml' | 'html'; // Output format
  outputPath?: string; // Output file path
  aiProvider?: IAIProvider; // AI provider for LLM analysis
}
```

### Plugin Configuration

Each plugin can be configured individually:

```typescript
// AST Analysis Plugin
const astConfig = {
  parserOptions: {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  },
  rules: ['missing-return-type', 'missing-type-annotation'],
};

// Dynamic Runner Plugin
const dynamicConfig = {
  timeout: 10000,
  supportedExtensions: ['.js', '.ts', '.py'],
  maxExecutionTime: 5000,
};

// LLM Reasoning Plugin
const llmConfig = {
  model: 'gpt-4',
  temperature: 0.3,
  maxTokens: 2000,
  analysisAreas: ['security', 'performance', 'quality'],
};
```

## Events

The engine emits various events during analysis:

```typescript
engine.on('pipeline.initializing', (data) => {
  console.log('Pipeline initializing:', data.analysisId);
});

engine.on('analysis.started', (event) => {
  console.log('Analysis started for files:', event.files);
});

engine.on('analysis.files.discovered', (data) => {
  console.log(`Discovered ${data.count} files`);
});

engine.on('plugin.initialized', (data) => {
  console.log(`Plugin ${data.name} initialized`);
});

engine.on('analysis.completed', (event) => {
  console.log('Analysis completed:', event.report.summary);
});

engine.on('analysis.error', (event) => {
  console.error('Analysis error:', event.error);
});
```

## Result Schema

The analysis produces a comprehensive JSON schema:

```json
{
  "$schema": "https://schemas.code-check.dev/analysis-result/v1.0.0",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "analysisId": "analysis-1705747800000-abc123def",
  "configuration": {
    "projectPath": "/project/src",
    "enabledPlugins": ["AST", "Dynamic", "LLM"],
    "rulesets": ["typescript-recommended"]
  },
  "summary": {
    "totalFiles": 45,
    "analyzedFiles": 45,
    "totalIssues": 23,
    "issuesByLevel": {
      "error": 2,
      "warning": 15,
      "info": 6
    },
    "executionTime": 12450,
    "status": "success"
  },
  "metrics": {
    "quality": {
      "codeQualityScore": 87,
      "maintainabilityIndex": 85,
      "technicalDebt": 17
    },
    "security": {
      "vulnerabilityCount": 1,
      "riskLevel": "medium",
      "securityScore": 85
    },
    "performance": {
      "totalExecutionTime": 12450
    }
  },
  "issues": [...],
  "files": [...],
  "plugins": [...],
  "recommendations": [...]
}
```

## Examples

### Basic TypeScript Project Analysis

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';

const engine = new CodeCheckEngine({
  projectPath: './my-typescript-project',
  enabledPlugins: ['AST'],
  rulesets: ['typescript-recommended'],
  outputFormat: 'json',
  outputPath: './analysis-report.json',
});

await engine.initialize();
const result = await engine.analyze();

if (result.success) {
  console.log('✅ Analysis completed successfully');
  console.log(
    `📊 Quality Score: ${result.schema.metrics.quality.codeQualityScore}/100`
  );
  console.log(`🐛 Issues Found: ${result.summary.totalIssues}`);
} else {
  console.error('❌ Analysis failed:', result.errors);
}

await engine.shutdown();
```

### Full-Stack Analysis with AI

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';
import { AIProviderFactory } from '@code-check/shared';

const aiProvider = AIProviderFactory.create('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

const engine = new CodeCheckEngine({
  projectPath: './full-stack-app',
  enabledPlugins: ['AST', 'Dynamic', 'LLM'],
  rulesets: ['typescript-recommended', 'security-recommended'],
  enableParallelExecution: true,
  maxWorkers: 8,
  aiProvider,
});

engine.on('analysis.progress', (event) => {
  console.log(`Progress: ${event.stage} - ${event.progress}%`);
});

await engine.initialize();
const result = await engine.analyze();

// Generate recommendations
for (const recommendation of result.schema.recommendations) {
  console.log(`💡 ${recommendation.title}`);
  console.log(`   Priority: ${recommendation.priority}`);
  console.log(`   Impact: ${recommendation.impact}`);
  console.log(`   Effort: ${recommendation.effort}`);
}

await engine.shutdown();
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support, please open an issue in the GitHub repository.
