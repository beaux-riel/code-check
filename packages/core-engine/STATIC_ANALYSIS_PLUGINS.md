# Static Analysis Plugins

This document describes the static analysis tools integrated into the code-check system and how their outputs are mapped to the unified result schema.

## Overview

The static analysis system consists of several plugins that provide comprehensive code analysis:

1. **ESLintPlugin** - JavaScript/TypeScript linting and style checking
2. **TypeScriptPlugin** - TypeScript compiler diagnostics
3. **NpmAuditPlugin** - NPM dependency vulnerability scanning
4. **SnykPlugin** - Comprehensive security vulnerability scanning via Snyk API
5. **CodeMetricsPlugin** - Code quality metrics (complexity, maintainability, duplication)
6. **StaticAnalysisOrchestrator** - Coordinates all plugins and maps to unified schema

## Plugin Architecture

All plugins implement the `Plugin` interface:

```typescript
interface Plugin {
  readonly metadata: PluginMetadata;
  initialize(): Promise<void>;
  analyze(files: string[]): Promise<CodeIssue[]>;
  cleanup?(): Promise<void>;
}
```

## ESLint Plugin

Integrates ESLint for JavaScript/TypeScript code quality and style analysis.

### Configuration

```typescript
const eslintConfig: ESLintPluginConfig = {
  configFile: '.eslintrc.js',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  useEslintrc: true,
  fix: false,
  cache: true,
};

const eslintPlugin = new ESLintPlugin(eslintConfig);
```

### Output Mapping

- ESLint rule violations → `CodeIssue` with severity mapping (error/warning/info)
- Line/column positions preserved
- Fixable suggestions included
- Rule IDs maintained for traceability

## TypeScript Plugin

Uses TypeScript compiler API for static type checking.

### Configuration

```typescript
const typescriptPlugin = new TypeScriptPlugin('tsconfig.json');
```

### Output Mapping

- TypeScript compiler diagnostics → `CodeIssue`
- Diagnostic categories mapped to severity levels
- File positions accurately captured
- Error codes preserved (TS####)

## NPM Audit Plugin

Scans package.json dependencies for known security vulnerabilities.

### Configuration

```typescript
const npmAuditConfig: NpmAuditConfig = {
  auditLevel: 'low',
  productionOnly: false,
  timeout: 30000,
};

const npmAuditPlugin = new NpmAuditPlugin(npmAuditConfig);
```

### Output Mapping

- Vulnerability reports → `CodeIssue` with security context
- Severity levels mapped (critical/high → error, moderate → warning, low → info)
- Fix suggestions included when available
- Dependency locations in package.json identified

## Snyk Plugin

Integrates with Snyk API for comprehensive vulnerability scanning.

### Configuration

```typescript
const snykConfig: SnykConfig = {
  apiToken: process.env.SNYK_TOKEN,
  orgId: 'your-org-id',
  severityThreshold: 'medium',
};

const snykPlugin = new SnykPlugin(snykConfig);
```

### Output Mapping

- Snyk vulnerabilities → `CodeIssue` with detailed security metadata
- CVE/CWE information preserved
- Upgrade paths and patches suggested
- Malicious package detection

## Code Metrics Plugin

Calculates comprehensive code quality metrics using AST analysis.

### Configuration

```typescript
const metricsConfig: CodeMetricsConfig = {
  complexityThreshold: {
    cyclomatic: 10,
    cognitive: 15,
  },
  maintainabilityThreshold: 20,
  duplicateThreshold: 6,
  enabledMetrics: {
    complexity: true,
    maintainability: true,
    duplication: true,
    size: true,
    dependencies: true,
  },
};

const metricsPlugin = new CodeMetricsPlugin(metricsConfig);
```

### Metrics Calculated

- **Cyclomatic Complexity** - Decision points in code
- **Cognitive Complexity** - Mental burden of understanding code
- **Maintainability Index** - Overall maintainability score
- **Code Duplication** - Duplicated code blocks
- **File Dependencies** - Import/export analysis
- **Function/Class Metrics** - Per-construct analysis

### Output Mapping

- Metric violations → `CodeIssue` with specific suggestions
- File-level and function-level issues
- Cross-file duplication detection
- Maintainability recommendations

## Static Analysis Orchestrator

Coordinates all plugins and provides unified reporting.

### Configuration

```typescript
const orchestratorConfig: StaticAnalysisConfig = {
  eslint: { enabled: true },
  typescript: { enabled: true },
  npmAudit: { enabled: true },
  snyk: { enabled: false, config: snykConfig },
  codeMetrics: { enabled: true },
  parallelExecution: true,
  maxConcurrentPlugins: 4,
  generateRecommendations: true,
};

const orchestrator = new StaticAnalysisOrchestrator(orchestratorConfig);
```

### Unified Schema Mapping

The orchestrator maps all plugin outputs to the `AnalysisResultSchema`:

```typescript
interface AnalysisResultSchema {
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
```

### Key Features

- **Parallel Execution** - Plugins run concurrently for performance
- **Error Handling** - Failed plugins don't break entire analysis
- **Timeout Protection** - Prevents hanging analysis
- **Unified Metrics** - Aggregated quality, security, and complexity metrics
- **Automated Recommendations** - Generated based on analysis results

## Usage Example

```typescript
import { StaticAnalysisOrchestrator } from '@code-check/core-engine';

const orchestrator = new StaticAnalysisOrchestrator({
  eslint: { enabled: true },
  typescript: { enabled: true },
  codeMetrics: { enabled: true },
});

await orchestrator.initialize();

// Generate unified report
const report = await orchestrator.generateUnifiedReport(
  ['src/**/*.ts', 'src/**/*.js'],
  'analysis-123',
  '/path/to/project'
);

console.log(`Found ${report.summary.totalIssues} issues`);
console.log(`Security score: ${report.metrics.security.securityScore}`);
console.log(`Quality score: ${report.metrics.quality.codeQualityScore}`);

// Save report
fs.writeFileSync('analysis-report.json', JSON.stringify(report, null, 2));
```

## Plugin Results

Each plugin execution is tracked with detailed metadata:

```typescript
interface PluginResult {
  name: string;
  version: string;
  executionTime: number;
  status: 'success' | 'failed' | 'skipped';
  issuesFound: number;
  filesProcessed: number;
  error?: string;
  metadata?: Record<string, any>;
}
```

## Analysis Metrics

The unified metrics provide comprehensive project health insights:

- **Performance Metrics** - Execution times and processing stats
- **Quality Metrics** - Code quality score, maintainability, technical debt
- **Security Metrics** - Vulnerability count, risk level, security score
- **Complexity Metrics** - Average/max complexity, distribution

## Recommendations

The system generates actionable recommendations based on analysis results:

```typescript
interface Recommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  relatedIssues: string[];
  actionItems: string[];
}
```

## Best Practices

1. **Enable Caching** - ESLint and other tools support caching for faster runs
2. **Configure Appropriately** - Set reasonable thresholds for your project
3. **Use Parallel Execution** - Leverage concurrent processing for performance
4. **Monitor Plugin Health** - Check plugin results for failures
5. **Regular Updates** - Keep vulnerability databases current
6. **Customize Recommendations** - Tailor suggestions to your workflow

## Dependencies

The static analysis plugins require these dependencies:

- `eslint` - For ESLint plugin
- `typescript` - For TypeScript plugin
- `npm` - For NPM audit plugin
- `@babel/parser`, `@babel/traverse` - For code metrics plugin
- Network access to Snyk API (if using Snyk plugin)

## Error Handling

The system includes comprehensive error handling:

- Plugin failures are isolated and don't affect other plugins
- Timeout protection prevents hanging analysis
- Detailed error reporting for debugging
- Graceful degradation when tools are unavailable

This integration provides a comprehensive static analysis solution that combines multiple best-in-class tools while maintaining a unified interface and consistent output format.
