# Code Check - Complete Usage Instructions

This guide provides detailed step-by-step instructions for using Code Check across all available interfaces: CLI, Web UI, VS Code Extension, and Library integration.

## Table of Contents

1. [CLI Usage](#cli-usage)
2. [Web UI Usage](#web-ui-usage)
3. [VS Code Extension Usage](#vs-code-extension-usage)
4. [Library Integration Usage](#library-integration-usage)
5. [Configuration Reference](#configuration-reference)
6. [Troubleshooting](#troubleshooting)

---

## CLI Usage

The Command Line Interface is the most direct way to run Code Check analysis on your projects.

### Installation

#### Option 1: Global Installation (Recommended)

```bash
# Install globally via npm
npm install -g @code-check/cli

# Or install globally via pnpm
pnpm add -g @code-check/cli

# Or install globally via yarn
yarn global add @code-check/cli
```

#### Option 2: Use with npx (No Installation Required)

```bash
# Run directly with npx
npx @code-check/cli --help
```

#### Option 3: Development Installation

```bash
# Clone the repository
git clone https://github.com/your-org/code-check.git
cd code-check

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Link for global use
cd packages/cli
npm link
```

### Basic Commands

#### Quick Start - Analyze a Project

```bash
# Analyze current directory
code-check audit .

# Analyze specific directory
code-check audit /path/to/your/project

# Analyze with verbose output
code-check audit /path/to/your/project --verbose
```

#### Command Examples

```bash
# Basic analysis with default settings
code-check audit ./src

# Analysis with custom configuration file
code-check audit ./src --config ./code-check.config.js

# Analysis with specific plugins enabled
code-check audit ./src --plugins AST,Dynamic,LLM

# Analysis with custom output format
code-check audit ./src --output json --output-file ./report.json

# Analysis with specific rule sets
code-check audit ./src --rulesets typescript-recommended,security-recommended

# Analysis with severity threshold
code-check audit ./src --severity-threshold warning

# Analysis with parallel execution
code-check audit ./src --parallel --max-workers 8

# Analysis with AI provider configuration
code-check audit ./src --ai-provider openai --ai-model gpt-4
```

### Configuration Flags

| Flag                   | Description                       | Default                | Example                             |
| ---------------------- | --------------------------------- | ---------------------- | ----------------------------------- |
| `--config`             | Path to configuration file        | `code-check.config.js` | `--config ./my-config.js`           |
| `--plugins`            | Comma-separated list of plugins   | `AST,Static`           | `--plugins AST,Dynamic,LLM`         |
| `--rulesets`           | Comma-separated list of rule sets | `default`              | `--rulesets typescript-recommended` |
| `--output`             | Output format                     | `console`              | `--output json`                     |
| `--output-file`        | Output file path                  | -                      | `--output-file ./report.json`       |
| `--severity-threshold` | Minimum severity level            | `info`                 | `--severity-threshold warning`      |
| `--parallel`           | Enable parallel execution         | `false`                | `--parallel`                        |
| `--max-workers`        | Maximum worker threads            | `4`                    | `--max-workers 8`                   |
| `--ai-provider`        | AI provider for LLM analysis      | -                      | `--ai-provider openai`              |
| `--ai-model`           | AI model to use                   | `gpt-3.5-turbo`        | `--ai-model gpt-4`                  |
| `--verbose`            | Enable verbose logging            | `false`                | `--verbose`                         |
| `--silent`             | Suppress output                   | `false`                | `--silent`                          |
| `--include`            | Include file patterns             | -                      | `--include "**/*.ts"`               |
| `--exclude`            | Exclude file patterns             | -                      | `--exclude "node_modules/**"`       |

### Expected Output

#### Console Output (Default)

```bash
$ code-check audit ./src

🔍 Code Check Analysis Starting...
📁 Project: /Users/username/project/src
🔧 Configuration: code-check.config.js
🧩 Plugins: AST, Dynamic, LLM
📋 Rulesets: typescript-recommended, security-recommended

📊 Analysis Progress:
[████████████████████████████████████████] 100%

✅ Analysis Complete!

📈 Summary:
├── Total Files: 45
├── Analyzed Files: 45
├── Total Issues: 23
├── Errors: 2
├── Warnings: 15
└── Info: 6

🏆 Quality Score: 87/100
⚡ Execution Time: 12.45s

🔍 Top Issues:
1. Missing return type annotation (src/utils/helpers.ts:15)
2. Potential security vulnerability (src/auth/login.ts:32)
3. Unused import statement (src/components/Header.tsx:5)

💡 Recommendations:
- Add TypeScript return type annotations
- Review authentication logic for security
- Remove unused imports to improve bundle size

📄 Full report saved to: ./code-check-report.json
```

#### JSON Output

```bash
$ code-check audit ./src --output json --output-file report.json

{
  "$schema": "https://schemas.code-check.dev/analysis-result/v1.0.0",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "analysisId": "analysis-1705747800000-abc123def",
  "configuration": {
    "projectPath": "/Users/username/project/src",
    "enabledPlugins": ["AST", "Dynamic", "LLM"],
    "rulesets": ["typescript-recommended", "security-recommended"]
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
    }
  },
  "issues": [...],
  "files": [...],
  "recommendations": [...]
}
```

### Error Handling

```bash
# Common exit codes
# 0: Success
# 1: Analysis failed
# 2: Configuration error
# 3: Plugin error
# 4: Threshold exceeded

# Example error output
$ code-check audit ./nonexistent

❌ Error: Project path does not exist: ./nonexistent
Exit code: 2

# Example threshold exceeded
$ code-check audit ./src --severity-threshold error

⚠️  Quality thresholds exceeded!
├── Errors: 2 (threshold: 0)
├── Warnings: 15 (threshold: 10)
└── Overall: FAILED

Exit code: 4
```

### Cleanup

```bash
# Remove global installation
npm uninstall -g @code-check/cli

# Or with pnpm
pnpm remove -g @code-check/cli

# Clean up generated reports
rm -f code-check-report.json
rm -f code-check-report.xml
rm -f code-check-report.html
```

---

## Web UI Usage

The Web UI provides an interactive interface for running and viewing code analysis results.

### Installation

#### Development Setup

```bash
# Clone and navigate to project
git clone https://github.com/your-org/code-check.git
cd code-check

# Install dependencies
pnpm install

# Start the web application
pnpm --filter @code-check/web-app dev
```

#### Production Build

```bash
# Build for production
pnpm --filter @code-check/web-app build

# Serve production build
pnpm --filter @code-check/web-app preview
```

### Accessing the Web UI

```bash
# Development server
http://localhost:5173

# Production server (if deployed)
https://your-domain.com/code-check
```

### Step-by-Step Usage

#### 1. Project Setup

![Project Setup Screenshot](./screenshots/web-ui-project-setup.png)

1. **Open the Web UI** in your browser
2. **Click "New Analysis"** on the dashboard
3. **Enter Project Path** - Browse or type the path to your project
4. **Select Analysis Type**:
   - Quick Scan (AST only)
   - Standard Analysis (AST + Static)
   - Comprehensive Analysis (AST + Static + Dynamic + LLM)

#### 2. Configuration

![Configuration Screenshot](./screenshots/web-ui-configuration.png)

1. **Plugin Selection**:
   - ✅ AST Analysis (recommended)
   - ✅ Static Analysis (recommended)
   - ☐ Dynamic Analysis (for runtime checks)
   - ☐ LLM Analysis (requires AI provider)

2. **Rule Sets**:
   - Select from available rule sets
   - Customize severity levels
   - Enable/disable specific rules

3. **AI Provider Setup** (if using LLM):
   ```javascript
   // Example configuration
   {
     "provider": "openai",
     "model": "gpt-4",
     "apiKey": "your-api-key-here"
   }
   ```

#### 3. Running Analysis

![Analysis Progress Screenshot](./screenshots/web-ui-analysis-progress.png)

1. **Click "Start Analysis"**
2. **Monitor Progress**:
   - File discovery progress
   - Plugin execution status
   - Real-time issue detection
   - Estimated completion time

3. **View Live Updates**:
   - Issues found counter
   - Current file being analyzed
   - Plugin-specific progress

#### 4. Viewing Results

![Results Dashboard Screenshot](./screenshots/web-ui-results-dashboard.png)

**Dashboard Overview**:

- Quality Score visualization
- Issue distribution chart
- Execution time metrics
- Plugin performance summary

**Detailed Results**:

- Issue list with filtering
- File-by-file breakdown
- Code snippets with highlights
- Recommendation prioritization

#### 5. Exporting Results

![Export Options Screenshot](./screenshots/web-ui-export-options.png)

1. **Export Formats**:
   - JSON (programmatic use)
   - PDF (reports)
   - HTML (standalone)
   - CSV (spreadsheet analysis)

2. **Export Options**:
   - Full report
   - Summary only
   - Issues only
   - Recommendations only

### Configuration Options

#### Analysis Settings

```javascript
// Web UI Configuration
{
  "analysis": {
    "enableParallelExecution": true,
    "maxWorkers": 4,
    "timeoutMs": 300000,
    "includePatterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "excludePatterns": ["node_modules/**", "dist/**", "build/**"]
  },
  "ui": {
    "theme": "dark",
    "autoSave": true,
    "realTimeUpdates": true,
    "showProgress": true
  }
}
```

#### AI Provider Configuration

```javascript
// OpenAI Configuration
{
  "aiProvider": {
    "type": "openai",
    "apiKey": "sk-...",
    "model": "gpt-4",
    "temperature": 0.3,
    "maxTokens": 2000
  }
}

// Azure OpenAI Configuration
{
  "aiProvider": {
    "type": "azure-openai",
    "apiKey": "your-azure-key",
    "endpoint": "https://your-resource.openai.azure.com",
    "deploymentName": "gpt-4"
  }
}
```

### Expected Output

#### Dashboard Metrics

- **Quality Score**: 87/100
- **Total Issues**: 23 (2 errors, 15 warnings, 6 info)
- **Files Analyzed**: 45/45
- **Execution Time**: 12.45s
- **Security Score**: 85/100

#### Issue Details

Each issue includes:

- **Severity Level** (Error/Warning/Info)
- **Rule ID** and description
- **File Location** with line numbers
- **Code Snippet** with syntax highlighting
- **Suggested Fix** (if available)
- **References** to documentation

### Cleanup

```bash
# Stop development server
Ctrl+C

# Clean build artifacts
pnpm --filter @code-check/web-app clean

# Remove node_modules
rm -rf node_modules packages/*/node_modules
```

---

## VS Code Extension Usage

The VS Code extension provides integrated code analysis directly within your editor.

### Installation

#### From VS Code Marketplace

1. **Open VS Code**
2. **Go to Extensions** (Ctrl+Shift+X)
3. **Search for "Code Check"**
4. **Click Install**

#### From VSIX File

```bash
# Build the extension
cd packages/vscode-extension
pnpm build

# Package the extension
pnpm package

# Install locally
code --install-extension code-check-0.0.0.vsix
```

#### Development Installation

```bash
# Clone repository
git clone https://github.com/your-org/code-check.git
cd code-check

# Install dependencies
pnpm install

# Build extension
pnpm --filter @code-check/vscode-extension build

# Open in VS Code for development
code packages/vscode-extension
```

### Setup and Configuration

#### 1. Initial Setup

![VS Code Extension Setup](./screenshots/vscode-extension-setup.png)

1. **Install the extension**
2. **Reload VS Code** when prompted
3. **Open a project** containing code to analyze
4. **Configure settings** via Command Palette

#### 2. Extension Settings

Access via File > Preferences > Settings > Extensions > Code Check

```json
{
  "codeCheck.enable": true,
  "codeCheck.autoAnalyze": true,
  "codeCheck.analyzeOnSave": true,
  "codeCheck.showInlineErrors": true,
  "codeCheck.enabledPlugins": ["AST", "Static"],
  "codeCheck.rulesets": ["typescript-recommended"],
  "codeCheck.severityThreshold": "warning",
  "codeCheck.maxWorkers": 4,
  "codeCheck.aiProvider": {
    "type": "openai",
    "model": "gpt-4"
  }
}
```

### Step-by-Step Usage

#### 1. Running Analysis

![VS Code Analysis Commands](./screenshots/vscode-analysis-commands.png)

**Command Palette** (Ctrl+Shift+P):

- `Code Check: Analyze Current File`
- `Code Check: Analyze Workspace`
- `Code Check: Analyze Selection`
- `Code Check: Clear All Issues`

**Context Menu**:

- Right-click in editor > "Code Check: Analyze File"
- Right-click in Explorer > "Code Check: Analyze Folder"

#### 2. Viewing Results

![VS Code Results Panel](./screenshots/vscode-results-panel.png)

**Problems Panel**:

- View all issues in Problems tab
- Filter by severity (Error/Warning/Info)
- Group by file or rule
- Navigate to issue location

**Inline Diagnostics**:

- Red squiggles for errors
- Yellow squiggles for warnings
- Blue squiggles for info
- Hover for detailed information

#### 3. Issue Management

![VS Code Issue Management](./screenshots/vscode-issue-management.png)

**Quick Actions**:

- **Quick Fix** (Ctrl+.) - Apply suggested fixes
- **Ignore Issue** - Add to ignore list
- **Disable Rule** - Disable specific rule
- **View Rule Documentation** - Open rule details

**Bulk Actions**:

- Fix all issues in file
- Ignore all issues of type
- Disable rule workspace-wide

### Configuration Examples

#### Basic Configuration

```json
{
  "codeCheck.enable": true,
  "codeCheck.autoAnalyze": true,
  "codeCheck.enabledPlugins": ["AST", "Static"],
  "codeCheck.rulesets": ["typescript-recommended"]
}
```

#### Advanced Configuration

```json
{
  "codeCheck.enable": true,
  "codeCheck.autoAnalyze": true,
  "codeCheck.analyzeOnSave": true,
  "codeCheck.showInlineErrors": true,
  "codeCheck.enabledPlugins": ["AST", "Static", "Dynamic", "LLM"],
  "codeCheck.rulesets": [
    "typescript-recommended",
    "security-recommended",
    "performance-recommended"
  ],
  "codeCheck.severityThreshold": "warning",
  "codeCheck.maxWorkers": 8,
  "codeCheck.aiProvider": {
    "type": "openai",
    "apiKey": "${env:OPENAI_API_KEY}",
    "model": "gpt-4",
    "temperature": 0.3
  },
  "codeCheck.includePatterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "codeCheck.excludePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Expected Output

#### Problems Panel

```
PROBLEMS
├── Errors (2)
│   ├── Missing return type annotation (src/utils/helpers.ts:15:23)
│   └── Potential null pointer (src/auth/login.ts:32:10)
├── Warnings (15)
│   ├── Unused import 'React' (src/components/Header.tsx:1:8)
│   ├── Function complexity too high (src/services/api.ts:45:1)
│   └── ...
└── Info (6)
    ├── Consider using const assertion (src/config/constants.ts:5:14)
    └── ...
```

#### Inline Diagnostics

```typescript
// Example with inline diagnostics
import React from 'react'; // ⚠️ 'React' is declared but never used

function processData(data: any) {
  // ❌ Missing return type annotation
  if (data) {
    return data.value; // ⚠️ Potential null pointer access
  }
}
```

#### Output Panel

```
Code Check Analysis Output:

[14:30:25] Starting analysis for workspace...
[14:30:25] Discovered 45 files for analysis
[14:30:26] AST Analysis: 45 files processed
[14:30:27] Static Analysis: 45 files processed
[14:30:28] Analysis complete: 23 issues found
[14:30:28] Quality Score: 87/100
```

### Cleanup

```bash
# Disable extension
# Via VS Code UI: Extensions > Code Check > Disable

# Uninstall extension
code --uninstall-extension code-check

# Remove extension files
rm -rf ~/.vscode/extensions/code-check*
```

---

## Library Integration Usage

Use Code Check as a library in your Node.js applications for programmatic analysis.

### Installation

```bash
# Install core engine
npm install @code-check/core-engine

# Install shared utilities
npm install @code-check/shared

# Install specific AI providers (optional)
npm install @code-check/ai-providers
```

### Basic Usage

#### Simple Analysis

```javascript
import { CodeCheckEngine } from '@code-check/core-engine';

const engine = new CodeCheckEngine({
  projectPath: '/path/to/your/project',
  enabledPlugins: ['AST', 'Static'],
  outputFormat: 'json',
});

// Initialize and run analysis
await engine.initialize();
const result = await engine.analyze();

console.log('Analysis Results:', result);
await engine.shutdown();
```

#### With Configuration

```javascript
import { CodeCheckEngine } from '@code-check/core-engine';
import { AIProviderFactory } from '@code-check/shared';

// Create AI provider
const aiProvider = AIProviderFactory.create('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

// Configure engine
const engine = new CodeCheckEngine({
  projectPath: './src',
  enabledPlugins: ['AST', 'Static', 'Dynamic', 'LLM'],
  rulesets: ['typescript-recommended', 'security-recommended'],
  enableParallelExecution: true,
  maxWorkers: 8,
  aiProvider,
  includePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: ['**/*.test.ts', 'node_modules/**'],
});

await engine.initialize();
const result = await engine.analyze();
await engine.shutdown();
```

### Advanced Usage Examples

#### 1. Custom Plugin Development

```javascript
import { BasePlugin } from '@code-check/core-engine';

class CustomSecurityPlugin extends BasePlugin {
  constructor() {
    super('CustomSecurity', 'Custom Security Analysis');
  }

  async initialize() {
    // Plugin initialization logic
    console.log('Custom Security Plugin initialized');
  }

  async analyze(files) {
    const issues = [];

    for (const file of files) {
      // Custom analysis logic
      const fileIssues = await this.analyzeFile(file);
      issues.push(...fileIssues);
    }

    return issues;
  }

  async analyzeFile(file) {
    // File-specific analysis
    const content = await fs.readFile(file, 'utf-8');
    const issues = [];

    // Check for hardcoded secrets
    if (content.includes('password') || content.includes('api_key')) {
      issues.push({
        rule: 'hardcoded-secrets',
        severity: 'error',
        message: 'Potential hardcoded secret detected',
        file: file,
        line: 1,
        column: 1,
      });
    }

    return issues;
  }
}

// Register and use custom plugin
const engine = new CodeCheckEngine({
  projectPath: './src',
  customPlugins: [new CustomSecurityPlugin()],
});
```

#### 2. Event-Driven Analysis

```javascript
import { CodeCheckEngine } from '@code-check/core-engine';

const engine = new CodeCheckEngine({
  projectPath: './src',
  enabledPlugins: ['AST', 'Static', 'LLM'],
});

// Set up event listeners
engine.on('analysis.started', (event) => {
  console.log('Analysis started:', event.analysisId);
});

engine.on('analysis.progress', (event) => {
  console.log(`Progress: ${event.stage} - ${event.progress}%`);
});

engine.on('plugin.completed', (event) => {
  console.log(
    `Plugin ${event.pluginName} completed: ${event.issuesFound} issues`
  );
});

engine.on('analysis.completed', (event) => {
  console.log('Analysis completed:', event.summary);
});

engine.on('analysis.error', (event) => {
  console.error('Analysis error:', event.error);
});

await engine.initialize();
const result = await engine.analyze();
await engine.shutdown();
```

#### 3. Batch Analysis

```javascript
import { CodeCheckEngine } from '@code-check/core-engine';
import { BatchAnalyzer } from '@code-check/shared';

const batchAnalyzer = new BatchAnalyzer({
  maxConcurrent: 4,
  timeout: 300000,
});

const projects = [
  '/path/to/project1',
  '/path/to/project2',
  '/path/to/project3',
];

const results = await batchAnalyzer.analyzeProjects(projects, {
  enabledPlugins: ['AST', 'Static'],
  rulesets: ['typescript-recommended'],
});

for (const result of results) {
  console.log(`Project: ${result.projectPath}`);
  console.log(`Quality Score: ${result.qualityScore}`);
  console.log(`Issues: ${result.totalIssues}`);
}
```

#### 4. Integration with CI/CD

```javascript
import { CodeCheckEngine } from '@code-check/core-engine';
import { CIReporter } from '@code-check/shared';

const engine = new CodeCheckEngine({
  projectPath: process.cwd(),
  enabledPlugins: ['AST', 'Static', 'Dynamic'],
  rulesets: ['typescript-recommended', 'security-recommended'],
  severityThreshold: 'warning',
});

await engine.initialize();
const result = await engine.analyze();

// Generate CI-specific reports
const reporter = new CIReporter(result);

// GitHub Actions
if (process.env.GITHUB_ACTIONS) {
  await reporter.generateGitHubReport();
}

// Jenkins
if (process.env.JENKINS_URL) {
  await reporter.generateJenkinsReport();
}

// Generic JUnit XML
await reporter.generateJUnitReport('./test-results.xml');

// Exit with appropriate code
process.exit(result.success ? 0 : 1);
```

### Configuration Options

#### Engine Configuration

```javascript
const config = {
  // Required
  projectPath: '/path/to/project',

  // Optional
  enabledPlugins: ['AST', 'Static', 'Dynamic', 'LLM'],
  rulesets: ['typescript-recommended', 'security-recommended'],
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts'],

  // Performance
  enableParallelExecution: true,
  maxWorkers: 8,
  timeout: 300000,

  // Output
  outputFormat: 'json',
  outputPath: './analysis-report.json',

  // AI Provider
  aiProvider: aiProviderInstance,

  // Severity
  severityThreshold: 'warning',
  failOnThresholdExceeded: true,

  // Custom plugins
  customPlugins: [customPlugin1, customPlugin2],
};
```

#### AI Provider Configuration

```javascript
// OpenAI
const openaiProvider = AIProviderFactory.create('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.3,
  maxTokens: 2000,
});

// Azure OpenAI
const azureProvider = AIProviderFactory.create('azure-openai', {
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  deploymentName: 'gpt-4',
  apiVersion: '2023-05-15',
});

// Anthropic Claude
const claudeProvider = AIProviderFactory.create('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229',
});
```

### Expected Output

#### Analysis Result Object

```javascript
{
  success: true,
  analysisId: 'analysis-1705747800000-abc123def',
  summary: {
    totalFiles: 45,
    analyzedFiles: 45,
    totalIssues: 23,
    issuesByLevel: {
      error: 2,
      warning: 15,
      info: 6
    },
    executionTime: 12450,
    status: 'success'
  },
  schema: {
    version: '1.0.0',
    timestamp: '2024-01-20T10:30:00.000Z',
    configuration: { /* ... */ },
    metrics: {
      quality: {
        codeQualityScore: 87,
        maintainabilityIndex: 85,
        technicalDebt: 17
      },
      security: {
        vulnerabilityCount: 1,
        riskLevel: 'medium',
        securityScore: 85
      }
    },
    issues: [
      {
        id: 'issue-1',
        rule: 'missing-return-type',
        severity: 'error',
        message: 'Missing return type annotation',
        file: 'src/utils/helpers.ts',
        line: 15,
        column: 23,
        source: 'AST',
        fixable: true,
        suggestions: [
          {
            description: 'Add return type annotation',
            fix: 'function processData(data: any): string {'
          }
        ]
      }
    ],
    files: [
      {
        path: 'src/utils/helpers.ts',
        size: 1024,
        language: 'typescript',
        issues: 3,
        metrics: {
          complexity: 5,
          maintainability: 85
        }
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Add TypeScript return type annotations',
        description: 'Adding return type annotations improves code readability and type safety',
        priority: 'high',
        impact: 'medium',
        effort: 'low',
        category: 'type-safety'
      }
    ]
  },
  errors: [],
  warnings: []
}
```

### Error Handling

```javascript
import { CodeCheckEngine, AnalysisError } from '@code-check/core-engine';

try {
  const engine = new CodeCheckEngine({
    projectPath: './src',
    enabledPlugins: ['AST', 'Static'],
  });

  await engine.initialize();
  const result = await engine.analyze();

  if (!result.success) {
    console.error('Analysis failed:', result.errors);
    process.exit(1);
  }

  console.log('Analysis completed successfully');
} catch (error) {
  if (error instanceof AnalysisError) {
    console.error('Analysis error:', error.message);
    console.error('Error details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }

  process.exit(1);
} finally {
  await engine.shutdown();
}
```

### Cleanup

```javascript
// Always clean up resources
try {
  const result = await engine.analyze();
} finally {
  await engine.shutdown();
}

// Or use automatic cleanup
await engine.withCleanup(async () => {
  return await engine.analyze();
});
```

---

## Configuration Reference

### Shared Configuration Format

Code Check uses a unified configuration format across all interfaces:

```javascript
// code-check.config.js
module.exports = {
  // Project settings
  projectPath: './src',
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts'],

  // Analysis settings
  enabledPlugins: ['AST', 'Static', 'Dynamic', 'LLM'],
  rulesets: ['typescript-recommended', 'security-recommended'],
  severityThreshold: 'warning',

  // Performance settings
  enableParallelExecution: true,
  maxWorkers: 8,
  timeout: 300000,

  // Output settings
  outputFormat: 'json',
  outputPath: './reports/analysis-report.json',

  // AI provider settings
  aiProvider: {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 2000,
  },

  // Custom rules
  customRules: {
    'custom-security-rule': {
      severity: 'error',
      enabled: true,
      options: {
        checkHardcodedSecrets: true,
      },
    },
  },
};
```

### Cross-Reference to Package Scripts

All interfaces can reference common package scripts for consistency:

```json
{
  "scripts": {
    "analyze": "code-check audit ./src",
    "analyze:verbose": "code-check audit ./src --verbose",
    "analyze:json": "code-check audit ./src --output json --output-file report.json",
    "analyze:ci": "code-check audit ./src --severity-threshold error",
    "web-ui": "pnpm --filter @code-check/web-app dev",
    "build:all": "pnpm build",
    "test:analysis": "pnpm test && pnpm analyze"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Installation Problems

```bash
# Clear npm cache
npm cache clean --force

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

#### 2. Configuration Issues

```bash
# Validate configuration
code-check config --validate

# Show current configuration
code-check config --show

# Reset to defaults
code-check config --reset
```

#### 3. Performance Issues

```bash
# Reduce parallel workers
code-check audit ./src --max-workers 2

# Exclude large directories
code-check audit ./src --exclude "node_modules/**" --exclude "dist/**"

# Use specific plugins only
code-check audit ./src --plugins AST
```

#### 4. AI Provider Issues

```bash
# Test AI provider connection
code-check test-ai --provider openai

# Use alternative provider
code-check audit ./src --ai-provider anthropic

# Disable AI analysis
code-check audit ./src --plugins AST,Static
```

### Getting Help

- **Documentation**: https://docs.code-check.dev
- **GitHub Issues**: https://github.com/your-org/code-check/issues
- **Community**: https://discord.gg/code-check
- **Support**: support@code-check.dev

---

_Last Updated: January 2024_
_Version: 1.0.0_
