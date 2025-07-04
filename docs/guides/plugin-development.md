# Plugin Development Guide

## Overview

Code Check's extensible architecture allows you to create custom plugins to extend analysis capabilities. Plugins can implement static analysis rules, integrate with external tools, or add new types of analysis.

## Plugin Architecture

### Plugin Types

1. **Analysis Plugins**: Perform code analysis (static, dynamic, AI-powered)
2. **Integration Plugins**: Integrate with external tools (CI/CD, IDEs, databases)
3. **Report Plugins**: Generate custom report formats
4. **Rule Plugins**: Implement custom analysis rules

### Base Plugin Interface

```typescript
import {
  BasePlugin,
  PluginContext,
  PluginResult,
} from '@code-check/core-engine';

export interface IPlugin {
  name: string;
  version: string;
  description: string;
  category: PluginCategory;

  initialize(context: PluginContext): Promise<void>;
  analyze(context: PluginContext): Promise<PluginResult>;
  cleanup(): Promise<void>;
}

export enum PluginCategory {
  STATIC_ANALYSIS = 'static-analysis',
  DYNAMIC_ANALYSIS = 'dynamic-analysis',
  AI_ANALYSIS = 'ai-analysis',
  INTEGRATION = 'integration',
  REPORTING = 'reporting',
}
```

## Creating a Custom Plugin

### 1. Basic Plugin Structure

```typescript
// plugins/my-custom-plugin/src/index.ts
import {
  BasePlugin,
  PluginContext,
  PluginResult,
  PluginCategory,
} from '@code-check/core-engine';

export class MyCustomPlugin extends BasePlugin {
  name = 'my-custom-plugin';
  version = '1.0.0';
  description = 'A custom analysis plugin';
  category = PluginCategory.STATIC_ANALYSIS;

  private config: MyPluginConfig;

  constructor(config: MyPluginConfig = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
  }

  async initialize(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    this.logger.info(`Initializing ${this.name} plugin`);

    // Validate configuration
    await this.validateConfig();

    // Setup any external dependencies
    await this.setupDependencies();
  }

  async analyze(context: PluginContext): Promise<PluginResult> {
    const { files, projectPath, config } = context;
    const results: AnalysisResult[] = [];

    this.logger.info(`Analyzing ${files.length} files`);

    for (const file of files) {
      const fileResults = await this.analyzeFile(file, context);
      results.push(...fileResults);
    }

    return {
      pluginName: this.name,
      results,
      metrics: this.generateMetrics(results),
      suggestions: this.generateSuggestions(results),
    };
  }

  async cleanup(): Promise<void> {
    this.logger.info(`Cleaning up ${this.name} plugin`);
    // Cleanup resources, close connections, etc.
  }

  private async analyzeFile(
    file: FileInfo,
    context: PluginContext
  ): Promise<AnalysisResult[]> {
    // Implement file-specific analysis logic
    const results: AnalysisResult[] = [];

    try {
      const content = await context.fileSystem.readFile(file.path);
      const ast = await context.parser.parse(content, file.extension);

      // Custom analysis logic here
      const issues = await this.performCustomAnalysis(ast, file, context);

      results.push(
        ...issues.map((issue) => ({
          file: file.path,
          line: issue.line,
          column: issue.column,
          severity: issue.severity,
          message: issue.message,
          rule: issue.rule,
          suggestion: issue.suggestion,
        }))
      );
    } catch (error) {
      this.logger.error(`Error analyzing file ${file.path}:`, error);
    }

    return results;
  }

  private async performCustomAnalysis(
    ast: any,
    file: FileInfo,
    context: PluginContext
  ): Promise<Issue[]> {
    // Implement your custom analysis logic
    return [];
  }
}

interface MyPluginConfig {
  enabled?: boolean;
  severity?: 'error' | 'warn' | 'info';
  customOption?: string;
}

const defaultConfig: MyPluginConfig = {
  enabled: true,
  severity: 'warn',
  customOption: 'default',
};
```

### 2. Plugin Configuration

```typescript
// plugins/my-custom-plugin/src/config.ts
import { z } from 'zod';

export const MyPluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  severity: z.enum(['error', 'warn', 'info']).default('warn'),
  customOption: z.string().default('default'),
  rules: z.record(z.enum(['error', 'warn', 'info', 'off'])).default({}),
  thresholds: z
    .object({
      maxIssues: z.number().default(100),
      maxComplexity: z.number().default(10),
    })
    .default({}),
});

export type MyPluginConfig = z.infer<typeof MyPluginConfigSchema>;

export function validateConfig(config: unknown): MyPluginConfig {
  return MyPluginConfigSchema.parse(config);
}
```

### 3. Custom Rules

```typescript
// plugins/my-custom-plugin/src/rules/my-rule.ts
import {
  BaseRule,
  RuleContext,
  RuleResult,
  Severity,
} from '@code-check/core-engine';

export class MyCustomRule extends BaseRule {
  name = 'my-custom-rule';
  description = 'Detects custom pattern violations';
  category = 'code-quality';
  severity = Severity.WARN;

  constructor(config: MyRuleConfig = {}) {
    super();
    this.config = { ...defaultRuleConfig, ...config };
  }

  async analyze(context: RuleContext): Promise<RuleResult[]> {
    const { ast, file, sourceCode } = context;
    const results: RuleResult[] = [];

    // Traverse AST and detect issues
    await this.traverseAST(ast, (node) => {
      if (this.isViolation(node, context)) {
        results.push({
          rule: this.name,
          message: this.generateMessage(node),
          severity: this.severity,
          line: node.loc?.start.line || 0,
          column: node.loc?.start.column || 0,
          endLine: node.loc?.end.line || 0,
          endColumn: node.loc?.end.column || 0,
          suggestion: this.generateSuggestion(node, context),
        });
      }
    });

    return results;
  }

  private isViolation(node: any, context: RuleContext): boolean {
    // Implement violation detection logic
    return false;
  }

  private generateMessage(node: any): string {
    return `Custom rule violation detected at ${node.type}`;
  }

  private generateSuggestion(node: any, context: RuleContext): string {
    return 'Consider refactoring this code';
  }
}

interface MyRuleConfig {
  enabled?: boolean;
  threshold?: number;
}

const defaultRuleConfig: MyRuleConfig = {
  enabled: true,
  threshold: 5,
};
```

## Advanced Plugin Features

### 1. Integration with External Tools

```typescript
// plugins/external-tool-plugin/src/index.ts
export class ExternalToolPlugin extends BasePlugin {
  private client: ExternalToolClient;

  async initialize(context: PluginContext): Promise<void> {
    this.client = new ExternalToolClient({
      apiKey: process.env.EXTERNAL_TOOL_API_KEY,
      baseUrl: this.config.baseUrl,
    });

    await this.client.authenticate();
  }

  async analyze(context: PluginContext): Promise<PluginResult> {
    const results: AnalysisResult[] = [];

    // Upload code to external tool
    const analysisId = await this.client.uploadProject(context.projectPath);

    // Wait for analysis completion
    const externalResults = await this.client.waitForResults(analysisId);

    // Convert external results to Code Check format
    results.push(...this.convertResults(externalResults));

    return {
      pluginName: this.name,
      results,
      metrics: this.generateMetrics(results),
    };
  }

  private convertResults(externalResults: any[]): AnalysisResult[] {
    return externalResults.map((result) => ({
      file: result.file,
      line: result.line,
      severity: this.mapSeverity(result.severity),
      message: result.message,
      rule: `external-tool/${result.ruleId}`,
    }));
  }
}
```

### 2. AI-Powered Analysis Plugin

```typescript
// plugins/ai-analysis-plugin/src/index.ts
export class AIAnalysisPlugin extends BasePlugin {
  private aiProvider: IAIProvider;

  async initialize(context: PluginContext): Promise<void> {
    this.aiProvider = context.aiProviderFactory.create(this.config.aiProvider);
  }

  async analyze(context: PluginContext): Promise<PluginResult> {
    const results: AnalysisResult[] = [];

    for (const file of context.files) {
      if (this.shouldAnalyzeFile(file)) {
        const aiResults = await this.analyzeWithAI(file, context);
        results.push(...aiResults);
      }
    }

    return {
      pluginName: this.name,
      results,
      aiInsights: this.generateAIInsights(results),
    };
  }

  private async analyzeWithAI(
    file: FileInfo,
    context: PluginContext
  ): Promise<AnalysisResult[]> {
    const content = await context.fileSystem.readFile(file.path);

    const prompt = this.buildAnalysisPrompt(content, file);
    const response = await this.aiProvider.analyze(prompt);

    return this.parseAIResponse(response, file);
  }

  private buildAnalysisPrompt(content: string, file: FileInfo): string {
    return `
      Analyze this ${file.extension} file for:
      1. Code quality issues
      2. Potential bugs
      3. Security vulnerabilities
      4. Performance improvements
      
      File: ${file.path}
      Content:
      \`\`\`${file.extension}
      ${content}
      \`\`\`
      
      Provide specific line numbers and actionable suggestions.
    `;
  }
}
```

### 3. Custom Report Generator Plugin

```typescript
// plugins/custom-report-plugin/src/index.ts
export class CustomReportPlugin extends BasePlugin {
  category = PluginCategory.REPORTING;

  async analyze(context: PluginContext): Promise<PluginResult> {
    const { analysisResults } = context;

    // Generate custom report formats
    const htmlReport = await this.generateHTMLReport(analysisResults);
    const pdfReport = await this.generatePDFReport(analysisResults);
    const slackReport = await this.generateSlackReport(analysisResults);

    // Save reports
    await this.saveReports(
      {
        html: htmlReport,
        pdf: pdfReport,
        slack: slackReport,
      },
      context
    );

    return {
      pluginName: this.name,
      reports: ['custom-html', 'pdf', 'slack-notification'],
    };
  }

  private async generateHTMLReport(results: AnalysisResult[]): Promise<string> {
    // Custom HTML report generation
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Custom Code Analysis Report</title></head>
        <body>
          ${this.generateHTMLContent(results)}
        </body>
      </html>
    `;
  }

  private async generateSlackReport(results: AnalysisResult[]): Promise<any> {
    const summary = this.generateSummary(results);

    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Code Analysis Complete*\n${summary}`,
          },
        },
      ],
    };
  }
}
```

## Plugin Testing

### 1. Unit Tests

```typescript
// plugins/my-custom-plugin/src/__tests__/plugin.test.ts
import { MyCustomPlugin } from '../index';
import { createMockContext } from '@code-check/core-engine/test-utils';

describe('MyCustomPlugin', () => {
  let plugin: MyCustomPlugin;
  let mockContext: PluginContext;

  beforeEach(() => {
    plugin = new MyCustomPlugin();
    mockContext = createMockContext({
      files: [{ path: 'src/test.ts', extension: '.ts', size: 1000 }],
    });
  });

  it('should initialize successfully', async () => {
    await expect(plugin.initialize(mockContext)).resolves.not.toThrow();
  });

  it('should analyze files and return results', async () => {
    await plugin.initialize(mockContext);
    const result = await plugin.analyze(mockContext);

    expect(result.pluginName).toBe('my-custom-plugin');
    expect(result.results).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    mockContext.fileSystem.readFile = jest
      .fn()
      .mockRejectedValue(new Error('File not found'));

    await plugin.initialize(mockContext);
    const result = await plugin.analyze(mockContext);

    expect(result.results).toHaveLength(0);
  });
});
```

### 2. Integration Tests

```typescript
// plugins/my-custom-plugin/src/__tests__/integration.test.ts
import { CodeCheckEngine } from '@code-check/core-engine';
import { MyCustomPlugin } from '../index';

describe('MyCustomPlugin Integration', () => {
  it('should integrate with Code Check engine', async () => {
    const engine = new CodeCheckEngine({
      projectPath: './test-project',
      plugins: [new MyCustomPlugin()],
      outputFormat: 'json',
    });

    const results = await engine.analyze();

    expect(results.pluginResults).toHaveProperty('my-custom-plugin');
  });
});
```

## Plugin Packaging and Distribution

### 1. Package Structure

```
my-custom-plugin/
├── package.json
├── src/
│   ├── index.ts
│   ├── rules/
│   ├── config.ts
│   └── __tests__/
├── dist/
├── README.md
└── CHANGELOG.md
```

### 2. Package.json

```json
{
  "name": "@code-check/my-custom-plugin",
  "version": "1.0.0",
  "description": "Custom plugin for Code Check",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["code-check", "plugin", "static-analysis"],
  "peerDependencies": {
    "@code-check/core-engine": "^1.0.0"
  },
  "codecheck": {
    "plugin": true,
    "category": "static-analysis"
  }
}
```

### 3. Plugin Registry

```typescript
// Register plugin with Code Check
import { PluginRegistry } from '@code-check/core-engine';
import { MyCustomPlugin } from './my-custom-plugin';

PluginRegistry.register('my-custom-plugin', MyCustomPlugin);

// Or in configuration
export default {
  plugins: {
    'my-custom-plugin': {
      enabled: true,
      config: {
        customOption: 'value',
      },
    },
  },
} as CodeCheckConfig;
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully and provide meaningful error messages
2. **Performance**: Consider performance impact, especially for large codebases
3. **Logging**: Use the provided logger for consistent logging across plugins
4. **Configuration**: Make plugins configurable with sensible defaults
5. **Testing**: Write comprehensive tests for your plugin
6. **Documentation**: Provide clear documentation and examples
7. **Versioning**: Follow semantic versioning for plugin releases
8. **Dependencies**: Minimize external dependencies and declare them properly

## Plugin Examples

See the `/docs/examples/plugins/` directory for complete plugin examples:

- [ESLint Integration Plugin](../examples/plugins/eslint-plugin)
- [AI Code Review Plugin](../examples/plugins/ai-review-plugin)
- [Custom Metrics Plugin](../examples/plugins/metrics-plugin)
- [Slack Notification Plugin](../examples/plugins/slack-plugin)
