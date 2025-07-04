# Code Check API Documentation

This document provides comprehensive API documentation for the Code Check platform.

## Table of Contents

- [Core Engine API](#core-engine-api)
- [Shared Utilities API](#shared-utilities-api)
- [CLI API](#cli-api)
- [Plugin API](#plugin-api)
- [Configuration API](#configuration-api)

## Core Engine API

### `CodeCheckEngine`

The main analysis engine that orchestrates code analysis across multiple plugins.

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';

class CodeCheckEngine {
  constructor(config: CodeCheckConfig);

  async analyze(): Promise<AnalysisResult>;
  async analyzeFile(filePath: string): Promise<FileAnalysisResult>;
  async analyzeFiles(filePaths: string[]): Promise<AnalysisResult>;

  addPlugin(plugin: Plugin): void;
  removePlugin(pluginName: string): void;
  getPlugin(pluginName: string): Plugin | undefined;

  getMetrics(): EngineMetrics;
  dispose(): Promise<void>;
}
```

#### Constructor Parameters

- `config: CodeCheckConfig` - Configuration object for the engine

#### Methods

##### `analyze(): Promise<AnalysisResult>`

Performs comprehensive analysis of the configured project.

**Returns**: Promise that resolves to analysis results including issues, metrics, and suggestions.

**Example**:

```typescript
const engine = new CodeCheckEngine({
  projectPath: './src',
  plugins: ['static', 'dynamic', 'llm'],
});

const results = await engine.analyze();
console.log(`Found ${results.issues.length} issues`);
```

##### `analyzeFile(filePath: string): Promise<FileAnalysisResult>`

Analyzes a single file.

**Parameters**:

- `filePath: string` - Path to the file to analyze

**Returns**: Promise that resolves to file-specific analysis results.

##### `addPlugin(plugin: Plugin): void`

Adds a plugin to the analysis engine.

**Parameters**:

- `plugin: Plugin` - Plugin instance to add

### `AnalysisPipeline`

Manages the analysis workflow and plugin execution.

```typescript
class AnalysisPipeline {
  constructor(config: PipelineConfig);

  async execute(): Promise<PipelineResult>;
  async executePlugin(pluginName: string): Promise<PluginResult>;

  addStage(stage: PipelineStage): void;
  removeStage(stageName: string): void;

  getExecutionHistory(): ExecutionHistory[];
}
```

### Plugins

#### Base Plugin Interface

```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  category: PluginCategory;

  initialize(context: PluginContext): Promise<void>;
  analyze(context: PluginContext): Promise<PluginResult>;
  cleanup(): Promise<void>;
}
```

#### Built-in Plugins

##### `StaticAnalysisOrchestrator`

Orchestrates static analysis plugins including ESLint, TypeScript, and custom rules.

```typescript
class StaticAnalysisOrchestrator extends Plugin {
  async analyze(context: PluginContext): Promise<PluginResult>;

  addAnalyzer(analyzer: StaticAnalyzer): void;
  removeAnalyzer(name: string): void;
  getAnalyzers(): Map<string, StaticAnalyzer>;
}
```

##### `DynamicRunnerPlugin`

Executes dynamic analysis through test instrumentation.

```typescript
class DynamicRunnerPlugin extends Plugin {
  async analyze(context: PluginContext): Promise<PluginResult>;

  setTestRunner(runner: TestRunner): void;
  configureInstrumentation(config: InstrumentationConfig): void;
}
```

##### `LLMReasoningPlugin`

Provides AI-powered code analysis and suggestions.

```typescript
class LLMReasoningPlugin extends Plugin {
  constructor(aiProvider: AIProvider);

  async analyze(context: PluginContext): Promise<PluginResult>;

  setPromptTemplate(template: string): void;
  configureModel(config: ModelConfig): void;
}
```

## Shared Utilities API

### AI Provider Factory

```typescript
import {
  AIProviderFactory,
  OpenAIProvider,
  AnthropicProvider,
} from '@code-check/shared';

class AIProviderFactory {
  static create(
    type: 'openai' | 'anthropic' | 'ollama',
    config: any
  ): AIProvider;

  static registerProvider(name: string, provider: AIProvider): void;
  static getProvider(name: string): AIProvider | undefined;
}
```

### Configuration Schema

```typescript
import { ConfigSchema, validateConfig } from '@code-check/shared';

interface CodeCheckConfig {
  projectPath: string;
  outputPath?: string;
  plugins: PluginConfig;
  rules: RuleConfig;
  output: OutputConfig;
  aiProvider?: AIProviderConfig;
}

function validateConfig(config: unknown): CodeCheckConfig;
```

### Utility Functions

```typescript
import {
  logger,
  formatters,
  fileUtils,
  cacheManager
} from '@code-check/shared';

// Logging utilities
logger.info(message: string, meta?: any): void;
logger.error(message: string, error?: Error): void;
logger.debug(message: string, data?: any): void;

// Formatting utilities
formatters.formatCode(code: string, language: string): string;
formatters.formatDuration(ms: number): string;
formatters.formatBytes(bytes: number): string;

// File utilities
fileUtils.readFile(path: string): Promise<string>;
fileUtils.writeFile(path: string, content: string): Promise<void>;
fileUtils.ensureDir(path: string): Promise<void>;
fileUtils.glob(pattern: string, options?: GlobOptions): Promise<string[]>;

// Cache utilities
cacheManager.get(key: string): Promise<any>;
cacheManager.set(key: string, value: any, ttl?: number): Promise<void>;
cacheManager.clear(): Promise<void>;
```

## CLI API

### Command Interface

```typescript
import { CLI } from '@code-check/cli';

class CLI {
  static async run(args: string[]): Promise<void>;

  static registerCommand(command: Command): void;
  static getCommand(name: string): Command | undefined;
}

interface Command {
  name: string;
  description: string;
  options: CommandOption[];

  execute(args: ParsedArgs): Promise<void>;
}
```

### Built-in Commands

#### `audit` Command

```bash
code-check audit [path] [options]
```

**Options**:

- `--config, -c` - Configuration file path
- `--output, -o` - Output directory
- `--format, -f` - Output format (html, json, markdown)
- `--plugins, -p` - Enabled plugins
- `--rules, -r` - Rule configuration
- `--fail-on` - Failure threshold (error, warn, info)
- `--verbose, -v` - Verbose output
- `--debug` - Debug mode

## Plugin API

### Creating Custom Plugins

```typescript
import {
  BasePlugin,
  PluginContext,
  PluginResult,
} from '@code-check/core-engine';

class MyCustomPlugin extends BasePlugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'Custom analysis plugin';
  category = PluginCategory.STATIC_ANALYSIS;

  async initialize(context: PluginContext): Promise<void> {
    // Initialize plugin
  }

  async analyze(context: PluginContext): Promise<PluginResult> {
    // Perform analysis
    return {
      pluginName: this.name,
      results: [],
      metrics: {},
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}
```

### Plugin Context

```typescript
interface PluginContext {
  projectPath: string;
  files: FileInfo[];
  config: PluginConfig;
  logger: Logger;
  fileSystem: FileSystem;
  parser: CodeParser;
  aiProviderFactory: AIProviderFactory;
}
```

### Plugin Result

```typescript
interface PluginResult {
  pluginName: string;
  results: AnalysisResult[];
  metrics?: PluginMetrics;
  suggestions?: Suggestion[];
  executionTime?: number;
  error?: Error;
}
```

## Configuration API

### Configuration Schema

```typescript
interface CodeCheckConfig {
  // Project settings
  projectPath: string;
  outputPath?: string;
  include?: string[];
  exclude?: string[];

  // Plugin configuration
  plugins: {
    [pluginName: string]: PluginConfig;
  };

  // Rule configuration
  rules: {
    [ruleName: string]: RuleConfig;
  };

  // Output configuration
  output: {
    formats: OutputFormat[];
    htmlReport?: HtmlReportConfig;
    jsonReport?: JsonReportConfig;
    markdownReport?: MarkdownReportConfig;
  };

  // AI Provider configuration
  aiProvider?: {
    type: 'openai' | 'anthropic' | 'ollama';
    config: AIProviderConfig;
  };

  // Performance settings
  concurrency?: {
    maxWorkers?: number;
    chunkSize?: number;
  };

  // Caching settings
  cache?: {
    enabled?: boolean;
    ttl?: number;
    directory?: string;
  };
}
```

### Rule Configuration

```typescript
type RuleConfig =
  | 'off'
  | 'warn'
  | 'error'
  | ['off' | 'warn' | 'error', RuleOptions];

interface RuleOptions {
  [key: string]: any;
}
```

## Error Handling

### Error Types

```typescript
class CodeCheckError extends Error {
  code: string;
  details?: any;
}

class PluginError extends CodeCheckError {
  pluginName: string;
}

class ConfigurationError extends CodeCheckError {
  configPath?: string;
}

class AnalysisError extends CodeCheckError {
  filePath?: string;
  line?: number;
  column?: number;
}
```

### Error Handling Best Practices

1. **Graceful Degradation**: Continue analysis even if individual plugins fail
2. **Detailed Error Messages**: Provide context and suggestions for resolution
3. **Error Recovery**: Attempt to recover from transient errors
4. **Logging**: Log errors with appropriate detail level

## Events and Lifecycle

### Event System

```typescript
interface EventEmitter {
  on(event: string, listener: Function): void;
  off(event: string, listener: Function): void;
  emit(event: string, ...args: any[]): void;
}

// Available events
'analysis:start' - Analysis started
'analysis:progress' - Analysis progress update
'analysis:complete' - Analysis completed
'plugin:start' - Plugin execution started
'plugin:complete' - Plugin execution completed
'plugin:error' - Plugin execution error
'file:analyze' - File analysis event
```

### Lifecycle Hooks

```typescript
interface LifecycleHooks {
  beforeAnalysis?(context: AnalysisContext): Promise<void>;
  afterAnalysis?(
    context: AnalysisContext,
    result: AnalysisResult
  ): Promise<void>;
  beforePlugin?(pluginName: string, context: PluginContext): Promise<void>;
  afterPlugin?(pluginName: string, result: PluginResult): Promise<void>;
  onError?(error: Error, context: any): Promise<void>;
}
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**: Analyze files in parallel using worker threads
2. **Caching**: Cache analysis results to avoid redundant work
3. **Incremental Analysis**: Only analyze changed files
4. **Plugin Optimization**: Profile and optimize plugin performance
5. **Memory Management**: Monitor and manage memory usage

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  totalDuration: number;
  pluginDurations: Map<string, number>;
  filesAnalyzed: number;
  memoryUsage: MemoryUsage;
  cacheHitRate: number;
}
```

## Integration Examples

### CI/CD Integration

```yaml
# GitHub Actions
- name: Code Check Analysis
  run: |
    npx @code-check/cli audit . \
      --format json \
      --output ./reports \
      --fail-on error
```

### Programmatic Usage

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';
import { OpenAIProvider } from '@code-check/shared';

async function analyzeProject() {
  const engine = new CodeCheckEngine({
    projectPath: './src',
    plugins: {
      static: { enabled: true },
      llm: {
        enabled: true,
        provider: new OpenAIProvider(),
      },
    },
    rules: {
      'code-quality/complexity': 'error',
      'security/no-secrets': 'error',
    },
  });

  try {
    const results = await engine.analyze();

    console.log(`Analysis complete:`);
    console.log(`- Files analyzed: ${results.filesAnalyzed}`);
    console.log(`- Issues found: ${results.issues.length}`);
    console.log(
      `- Errors: ${results.issues.filter((i) => i.severity === 'error').length}`
    );
    console.log(
      `- Warnings: ${results.issues.filter((i) => i.severity === 'warn').length}`
    );

    return results;
  } finally {
    await engine.dispose();
  }
}
```

For complete API reference with detailed type definitions, see the generated TypeDoc documentation.
