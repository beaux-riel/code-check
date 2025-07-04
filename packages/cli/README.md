# Code Check CLI

A powerful command-line interface for automated code analysis, testing, and quality assessment.

## 🚀 Quick Start

### Installation

#### Global Installation (Recommended)

```bash
# From monorepo root
pnpm build
npm install -g ./packages/cli

# Or using pnpm
pnpm install -g ./packages/cli
```

#### Local Development

```bash
# From monorepo root
pnpm install
pnpm build

# Run from package directory
cd packages/cli
pnpm start -- --help
```

### Basic Usage

```bash
# Analyze current directory
code-check analyze

# Analyze specific directory
code-check analyze /path/to/project

# Generate detailed report
code-check analyze --output ./reports --format html,json

# Run with coverage
code-check analyze --coverage --tests
```

## 📋 Commands

### `analyze` - Main Analysis Command

Performs comprehensive code analysis on a project.

```bash
code-check analyze [directory] [options]
```

**Arguments:**

- `directory` - Project directory to analyze (default: current directory)

**Options:**

- `-o, --output <path>` - Output directory for reports (default: `./.code-check`)
- `-f, --format <formats>` - Report formats: `json`, `html`, `markdown` (default: `json,html`)
- `-c, --config <file>` - Configuration file path
- `--coverage` - Enable test coverage analysis
- `--tests` - Run tests during analysis
- `--security` - Enable security vulnerability scanning
- `--performance` - Enable performance profiling
- `--exclude <patterns>` - Exclude file patterns
- `--include <patterns>` - Include only specific patterns
- `--threshold <number>` - Quality threshold (0-100)
- `--fail-on-error` - Exit with error code on quality issues
- `--watch` - Watch for file changes and re-analyze

**Examples:**

```bash
# Basic analysis
code-check analyze

# Full analysis with all features
code-check analyze --coverage --tests --security --performance

# Custom output and formats
code-check analyze --output ./quality-reports --format html,json,markdown

# Analysis with quality gate
code-check analyze --threshold 80 --fail-on-error

# Watch mode for development
code-check analyze --watch
```

### `init` - Initialize Configuration

Creates a configuration file for your project.

```bash
code-check init [options]
```

**Options:**

- `-t, --template <name>` - Configuration template: `javascript`, `typescript`, `react`, `node`
- `-f, --force` - Overwrite existing configuration
- `--interactive` - Interactive configuration setup

**Examples:**

```bash
# Interactive setup
code-check init --interactive

# TypeScript project template
code-check init --template typescript

# Force overwrite existing config
code-check init --force
```

### `serve` - Development Server

Starts a local development server with real-time analysis.

```bash
code-check serve [options]
```

**Options:**

- `-p, --port <number>` - Server port (default: 8080)
- `-h, --host <address>` - Host address (default: localhost)
- `--open` - Open browser automatically
- `--cors` - Enable CORS

**Examples:**

```bash
# Start server on default port
code-check serve

# Custom port and auto-open browser
code-check serve --port 3001 --open

# Enable CORS for external access
code-check serve --cors --host 0.0.0.0
```

### `test` - Run Tests with Analysis

Executes tests with integrated coverage and performance analysis.

```bash
code-check test [options]
```

**Options:**

- `--jest` - Run Jest tests
- `--cypress` - Run Cypress tests
- `--coverage` - Generate coverage reports
- `--performance` - Profile test performance
- `--config <file>` - Test configuration file

**Examples:**

```bash
# Run all tests with coverage
code-check test --coverage

# Jest tests only
code-check test --jest --performance

# Cypress E2E tests
code-check test --cypress
```

### `report` - Generate Reports

Generate reports from existing analysis data.

```bash
code-check report [options]
```

**Options:**

- `-i, --input <path>` - Input data directory
- `-o, --output <path>` - Output directory
- `-f, --format <formats>` - Report formats
- `--template <name>` - Report template

### `validate` - Validate Configuration

Validates your code-check configuration file.

```bash
code-check validate [config-file]
```

## ⚙️ Configuration

### Configuration File

Create a `code-check.config.js` or `code-check.config.json` file:

```javascript
module.exports = {
  // Project settings
  projectPath: '.',
  outputPath: './.code-check',

  // Analysis settings
  analysis: {
    enableCoverage: true,
    enableSecurity: true,
    enablePerformance: true,
    timeout: 300000, // 5 minutes
  },

  // File patterns
  include: ['src/**/*', 'lib/**/*'],
  exclude: ['node_modules/**', 'dist/**', '**/*.test.*', '**/*.spec.*'],

  // Quality thresholds
  thresholds: {
    coverage: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
    performance: {
      maxTestDuration: 30000,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    },
    security: {
      allowedSeverities: ['low', 'moderate'],
      maxVulnerabilities: 5,
    },
  },

  // Report settings
  reports: {
    formats: ['html', 'json'],
    includeDetails: true,
    includeMetrics: true,
  },

  // Test settings
  testing: {
    jest: {
      configFile: './jest.config.js',
      coverage: true,
    },
    cypress: {
      configFile: './cypress.config.js',
      baseUrl: 'http://localhost:3000',
    },
  },
};
```

### Environment Variables

```bash
# API Configuration
CODE_CHECK_API_URL=http://localhost:8080
CODE_CHECK_WS_URL=ws://localhost:8080

# Output Configuration
CODE_CHECK_OUTPUT_DIR=./.code-check
CODE_CHECK_LOG_LEVEL=info

# Performance
CODE_CHECK_MAX_WORKERS=4
CODE_CHECK_TIMEOUT=300000

# Features
CODE_CHECK_ENABLE_COVERAGE=true
CODE_CHECK_ENABLE_SECURITY=true
CODE_CHECK_ENABLE_PERFORMANCE=true
```

## 📊 Output Formats

### JSON Report

```json
{
  "summary": {
    "filesAnalyzed": 150,
    "issuesFound": 23,
    "coveragePercent": 85.5,
    "qualityScore": 88
  },
  "coverage": { ... },
  "security": { ... },
  "performance": { ... }
}
```

### HTML Report

Interactive HTML dashboard with:

- Overview dashboard
- File-by-file analysis
- Coverage visualization
- Performance charts
- Security vulnerability details

### Markdown Report

```markdown
# Code Analysis Report

## Summary

- **Files Analyzed**: 150
- **Issues Found**: 23
- **Coverage**: 85.5%
- **Quality Score**: 88/100

## Details

...
```

## 🔧 Advanced Usage

### CI/CD Integration

#### GitHub Actions

```yaml
name: Code Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run code analysis
        run: |
          npx code-check analyze \
            --coverage \
            --security \
            --threshold 80 \
            --fail-on-error \
            --format json,html

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: quality-reports
          path: .code-check/
```

#### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Code Quality') {
            steps {
                sh 'npm ci'
                sh 'code-check analyze --threshold 80 --fail-on-error'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.code-check',
                        reportFiles: 'index.html',
                        reportName: 'Code Quality Report'
                    ])
                }
            }
        }
    }
}
```

### Custom Scripts

```bash
#!/bin/bash
# quality-check.sh

echo "Running comprehensive code quality check..."

# Run analysis with full coverage
code-check analyze \
  --coverage \
  --tests \
  --security \
  --performance \
  --threshold 85 \
  --format html,json,markdown \
  --output ./quality-reports

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Quality check passed!"
  echo "Reports available in: ./quality-reports"
else
  echo "❌ Quality check failed!"
  exit 1
fi
```

## 🐛 Troubleshooting

### Common Issues

**Command not found:**

```bash
# Make sure CLI is installed globally
npm list -g @code-check/cli

# Or use npx
npx @code-check/cli analyze
```

**Permission errors:**

```bash
# Fix permissions
sudo chown -R $(whoami) ~/.npm
```

**Memory issues with large projects:**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
code-check analyze
```

**Slow analysis:**

```bash
# Exclude unnecessary files
code-check analyze --exclude "node_modules/**,dist/**,coverage/**"

# Use specific patterns
code-check analyze --include "src/**/*.{js,ts,jsx,tsx}"
```

### Debug Mode

```bash
# Enable verbose logging
CODE_CHECK_LOG_LEVEL=debug code-check analyze

# Or use debug flag
code-check analyze --debug
```

## 📈 Performance Tips

1. **Use specific include patterns** instead of analyzing everything
2. **Exclude build artifacts** and dependencies
3. **Run tests separately** if analysis is slow
4. **Use incremental analysis** in CI with caching
5. **Adjust worker count** based on available CPU cores

## 🤝 Contributing

1. Follow CLI best practices
2. Add tests for new commands
3. Update help text and documentation
4. Test on different platforms

## 📚 Additional Resources

- [CLI Design Guidelines](https://clig.dev/)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Node.js CLI Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)
