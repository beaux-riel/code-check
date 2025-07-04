# Getting Started with Code Check

## Overview

Code Check is a comprehensive, AI-powered code analysis platform that combines static analysis, dynamic testing instrumentation, and intelligent recommendations to help you maintain high-quality, secure, and performant codebases.

## Features

- **Multi-layered Analysis**: Static analysis, dynamic testing, and AI-powered insights
- **Multiple Interfaces**: CLI, Web Dashboard, VS Code Extension, and Desktop App
- **Extensible Architecture**: Plugin system for custom rules and integrations
- **AI Integration**: Support for OpenAI, Anthropic, Ollama, and other AI providers
- **Comprehensive Reporting**: HTML, JSON, and Markdown reports with actionable insights

## Quick Start

### 1. Installation

#### Global Installation (Recommended)

```bash
npm install -g @code-check/cli
```

#### Using npx

```bash
npx @code-check/cli audit /path/to/your/project
```

#### From Source

```bash
git clone https://github.com/your-org/code-check.git
cd code-check
pnpm install
pnpm build
```

### 2. Basic Usage

#### CLI Analysis

```bash
# Basic project analysis
code-check audit /path/to/your/project

# With custom configuration
code-check audit /path/to/your/project --config ./code-check.config.js

# Specific output format
code-check audit /path/to/your/project --format json --output ./results.json
```

#### Programmatic Usage

```javascript
import { CodeCheckEngine } from '@code-check/core-engine';
import { OpenAIProvider } from '@code-check/shared';

const engine = new CodeCheckEngine({
  projectPath: '/path/to/your/project',
  aiProvider: new OpenAIProvider(),
  enabledPlugins: ['AST', 'Static', 'Dynamic', 'LLM'],
  outputFormat: 'json',
});

const results = await engine.analyze();
console.log('Analysis complete:', results);
```

### 3. Configuration

Create a `codecheck.config.ts` file in your project root:

```typescript
import { CodeCheckConfig } from '@code-check/core-engine';

export default {
  // Project settings
  projectPath: '.',
  outputPath: './.code-check',

  // Analysis plugins
  plugins: {
    static: {
      enabled: true,
      eslintConfig: '.eslintrc.js',
      tsConfig: './tsconfig.json',
    },
    dynamic: {
      enabled: true,
      testCommand: 'npm test',
      coverageThreshold: 80,
    },
    llm: {
      enabled: true,
      provider: 'openai',
      model: 'gpt-4',
    },
  },

  // Rule configuration
  rules: {
    'code-quality': 'error',
    security: 'error',
    performance: 'warn',
    maintainability: 'warn',
  },

  // Output format
  output: {
    format: ['html', 'json', 'markdown'],
    includeMetrics: true,
    includeSuggestions: true,
  },
} as CodeCheckConfig;
```

### 4. Web Dashboard

Start the web dashboard for a visual interface:

```bash
# Start the API backend
cd packages/api-backend
npm start

# Start the web dashboard
cd packages/web-app
npm start
```

Access the dashboard at `http://localhost:3000`

### 5. VS Code Extension

1. Install the Code Check extension from the VS Code marketplace
2. Configure your settings in VS Code settings.json:
   ```json
   {
     "codecheck.autoAnalysis": true,
     "codecheck.apiEndpoint": "http://localhost:3001",
     "codecheck.enableDiagnostics": true
   }
   ```

## Next Steps

- [Configuration Guide](./configuration.md) - Detailed configuration options
- [API Reference](../api/README.md) - Complete API documentation
- [Plugin Development](./plugin-development.md) - Creating custom plugins
- [Examples](../examples/) - Sample projects and use cases

## Support

- [GitHub Issues](https://github.com/your-org/code-check/issues)
- [Documentation](https://code-check.dev/docs)
- [Discord Community](https://discord.gg/code-check)
