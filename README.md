# Code Check v1.0.0 - AI-Powered Code Analysis Platform 🚀

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/code-check)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

A comprehensive, AI-powered code analysis platform that combines static analysis, dynamic testing instrumentation, and intelligent recommendations to help you maintain high-quality, secure, and performant codebases.

## ✨ Key Features

- **🔍 Multi-layered Analysis**: Static analysis, dynamic testing, and AI-powered insights
- **🖥️ Multiple Interfaces**: CLI, Web Dashboard, VS Code Extension, and Desktop App
- **🧩 Extensible Architecture**: Plugin system for custom rules and integrations
- **🤖 AI Integration**: Support for OpenAI, Anthropic, Ollama, and custom providers
- **📊 Comprehensive Reporting**: HTML, JSON, and Markdown reports with actionable insights
- **⚡ High Performance**: Built with TypeScript, optimized for large codebases
- **🔧 Easy Configuration**: Simple setup with sensible defaults

## 🚀 Quick Start

### 1️⃣ CLI Tool (Recommended - 5 minutes)

```bash
# Install globally
npm install -g @code-check/cli

# Audit your codebase
code-check audit /path/to/your/project

# Or use directly with npx (no installation)
npx @code-check/cli audit .

# With custom configuration
code-check audit . --config ./codecheck.config.js
```

**First Run Example:**

```bash
# Navigate to your project
cd my-awesome-project

# Run analysis
code-check audit .

# View results
open ./.code-check/AUDIT_RESULTS.html  # macOS
# or
start ./.code-check/AUDIT_RESULTS.html  # Windows
```

### 2️⃣ Desktop Application (Offline-Ready)

**Download & Install:**

- 🍎 **macOS**: [Download CodeCheck.dmg](https://github.com/your-org/code-check/releases/latest)
- 🪟 **Windows**: [Download CodeCheck-Setup.exe](https://github.com/your-org/code-check/releases/latest)
- 🐧 **Linux**: [Download CodeCheck.AppImage](https://github.com/your-org/code-check/releases/latest)

**Features:**

- Offline-capable with local AI models (Ollama integration)
- Visual project management and analysis dashboard
- Real-time analysis progress tracking
- Built-in report viewer and export tools

### 3️⃣ VS Code Extension

1. **Install from Marketplace:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search "Code Check"
   - Click Install

2. **Or install manually:**

   ```bash
   code --install-extension code-check.vscode-extension
   ```

3. **Use in VS Code:**
   - Open Command Palette (Ctrl+Shift+P)
   - Type "Code Check: Analyze Current Project"
   - View results in the Problems panel

### 4️⃣ Web Dashboard (Team Collaboration)

```bash
# Clone and setup (one-time)
git clone https://github.com/your-org/code-check.git
cd code-check
pnpm install
pnpm build

# Start web dashboard
pnpm dev

# Access at http://localhost:3000
```

### 5️⃣ Programmatic Usage (Library)

```bash
# Install core packages
npm install @code-check/core-engine @code-check/shared
```

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';
import { OpenAIProvider } from '@code-check/shared';

const engine = new CodeCheckEngine({
  projectPath: '/path/to/your/project',
  aiProvider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  }),
  enabledPlugins: ['AST', 'Static', 'Dynamic', 'LLM'],
  outputFormat: 'json',
});

const results = await engine.analyze();
console.log('Analysis complete:', results.summary);
```

## 📁 Project Structure

```
code-check/
├── packages/                    # Monorepo packages
│   ├── core-engine/            # 🧠 Core analysis engine
│   ├── cli/                    # 💻 Command-line interface
│   ├── web-app/                # 🌐 React web dashboard
│   ├── desktop-app/            # 🖥️ Electron desktop application
│   ├── vscode-extension/       # 🔌 VS Code extension
│   ├── api-backend/            # 🛠️ REST API server
│   ├── shared/                 # 📦 Shared utilities and types
│   ├── dynamic-analysis/       # 🔄 Dynamic testing instrumentation
│   ├── eslint-config/          # 📏 Shared ESLint configuration
│   └── typescript-config/      # 📐 Shared TypeScript configuration
├── docs/                       # 📚 Documentation
│   ├── guides/                 # 📖 User guides
│   ├── api/                    # 🔧 API documentation
│   └── examples/               # 💡 Sample projects
├── .github/workflows/          # ⚙️ CI/CD workflows
└── turbo.json                  # 🏗️ Turborepo configuration
```

## 📋 Detailed Setup Guide

### Prerequisites

- **Node.js**: 18.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm**: 8.15.6 or higher ([Install Guide](https://pnpm.io/installation))
- **Git**: For version control ([Download](https://git-scm.com/))

### Option 1: End User Installation

If you just want to use Code Check to analyze your projects:

```bash
# Global CLI installation
npm install -g @code-check/cli

# Verify installation
code-check --version

# Quick project analysis
code-check audit /path/to/your/project
```

### Option 2: Development Setup

If you want to contribute to Code Check or customize it:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/code-check.git
cd code-check

# 2. Install dependencies
pnpm install

# 3. Install git hooks
pnpm run prepare

# 4. Build all packages
pnpm build

# 5. Verify everything works
pnpm test
```

### Option 3: Web Dashboard Setup

For team collaboration with the web interface:

```bash
# 1. Setup the project (if not done already)
git clone https://github.com/your-org/code-check.git
cd code-check
pnpm install
pnpm build

# 2. Start the API backend
cd packages/api-backend
npm start &

# 3. Start the web dashboard
cd ../web-app
npm start

# 4. Access at http://localhost:3000
```

### Option 4: Desktop App Development

For desktop application development:

```bash
# 1. Setup the project
git clone https://github.com/your-org/code-check.git
cd code-check
pnpm install
pnpm build

# 2. Start desktop app in development mode
pnpm desktop:dev

# 3. Build for distribution
pnpm desktop:dist
```

## ⚙️ Configuration

### Basic Configuration

Create a `codecheck.config.ts` in your project root:

```typescript
import { CodeCheckConfig } from '@code-check/core-engine';

export default {
  // Project settings
  projectPath: '.',
  outputPath: './.code-check',

  // Analysis configuration
  analysis: {
    includeFiles: ['**/*.{ts,tsx,js,jsx}'],
    excludeFiles: ['node_modules/**', 'dist/**', 'build/**'],
    enabledPlugins: ['static', 'dynamic', 'ai'],
  },

  // AI Provider configuration
  ai: {
    provider: 'openai', // 'openai' | 'anthropic' | 'ollama'
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY, // Use environment variables
  },

  // Rule severity levels
  rules: {
    'code-quality': 'error',
    security: 'error',
    performance: 'warn',
    maintainability: 'warn',
  },

  // Output configuration
  output: {
    formats: ['html', 'json', 'markdown'],
    includeMetrics: true,
    includeSuggestions: true,
  },
} as CodeCheckConfig;
```

### Environment Variables

Create a `.env` file for sensitive configuration:

```bash
# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Custom AI Endpoint (optional)
CUSTOM_AI_ENDPOINT=https://your-custom-ai-endpoint.com

# Database URL (for web dashboard)
DATABASE_URL=postgresql://username:password@localhost:5432/codecheck

# API Configuration
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## 🔧 Development Commands

### Monorepo Commands

```bash
# Start all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm typecheck

# Clean all build artifacts
pnpm clean
```

### Package-Specific Commands

```bash
# CLI development
pnpm --filter @code-check/cli dev
pnpm --filter @code-check/cli build
pnpm --filter @code-check/cli test

# Web app development
pnpm --filter @code-check/web-app dev
pnpm --filter @code-check/web-app build
pnpm --filter @code-check/web-app test

# Core engine development
pnpm --filter @code-check/core-engine dev
pnpm --filter @code-check/core-engine build
pnpm --filter @code-check/core-engine test
```

### Testing Commands

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# End-to-end tests
pnpm test:e2e

# Test coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## 📦 Available Packages

### Core Packages

| Package                   | Description            | Version | Status    |
| ------------------------- | ---------------------- | ------- | --------- |
| `@code-check/core-engine` | Core analysis engine   | 1.0.0   | ✅ Stable |
| `@code-check/cli`         | Command-line interface | 1.0.0   | ✅ Stable |
| `@code-check/shared`      | Shared utilities       | 1.0.0   | ✅ Stable |

### Interface Packages

| Package                        | Description          | Version | Status    |
| ------------------------------ | -------------------- | ------- | --------- |
| `@code-check/web-app`          | React web dashboard  | 1.0.0   | ✅ Stable |
| `@code-check/desktop-app`      | Electron desktop app | 1.0.0   | ✅ Stable |
| `@code-check/vscode-extension` | VS Code extension    | 1.0.0   | ✅ Stable |
| `@code-check/api-backend`      | REST API server      | 1.0.0   | ✅ Stable |

### Analysis Packages

| Package                        | Description             | Version | Status    |
| ------------------------------ | ----------------------- | ------- | --------- |
| `@code-check/dynamic-analysis` | Testing instrumentation | 1.0.0   | ✅ Stable |

### Configuration Packages

| Package                         | Description              | Version | Status    |
| ------------------------------- | ------------------------ | ------- | --------- |
| `@code-check/eslint-config`     | Shared ESLint config     | 1.0.0   | ✅ Stable |
| `@code-check/typescript-config` | Shared TypeScript config | 1.0.0   | ✅ Stable |

## 🎯 Use Cases

### Individual Developers

- **Quick Code Review**: Analyze changes before committing
- **Learning Tool**: Understand code quality patterns
- **Refactoring Assistance**: Identify improvement opportunities

### Development Teams

- **Code Quality Gates**: Enforce standards in CI/CD
- **Technical Debt Tracking**: Monitor code health over time
- **Onboarding**: Help new team members understand codebase

### Organizations

- **Multi-Project Analysis**: Analyze across repositories
- **Compliance Checking**: Ensure security and quality standards
- **Architecture Reviews**: Identify architectural issues

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Code Check Analysis

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  code-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @code-check/cli
      - run: code-check ci .
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### GitLab CI

```yaml
code_check:
  stage: test
  image: node:18
  before_script:
    - npm install -g @code-check/cli
  script:
    - code-check ci .
  artifacts:
    reports:
      junit: .code-check/results.xml
    paths:
      - .code-check/
```

## 📚 Documentation

- **[Getting Started Guide](./docs/guides/getting-started.md)** - Complete setup and first analysis
- **[Configuration Guide](./docs/guides/configuration.md)** - Detailed configuration options
- **[Plugin Development Guide](./docs/guides/plugin-development.md)** - Creating custom plugins
- **[API Reference](./docs/api/README.md)** - Complete API documentation
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](./CHANGELOG.md)** - Version history and changes

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Quick Contribution Setup

```bash
# 1. Fork and clone
git clone https://github.com/your-username/code-check.git
cd code-check

# 2. Install dependencies
pnpm install

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes
# ...

# 5. Run tests and linting
pnpm test
pnpm lint

# 6. Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature-name

# 7. Create a pull request
```

## 🆘 Support & Community

- **[GitHub Issues](https://github.com/your-org/code-check/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/your-org/code-check/discussions)** - Community discussions
- **[Discord Community](https://discord.gg/code-check)** - Real-time chat and support
- **[Documentation](https://code-check.dev/docs)** - Comprehensive guides and references

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Powered by [Turborepo](https://turbo.build/)
- UI components from [Chakra UI](https://chakra-ui.com/)
- AI integration with [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/)

---

**Made with ❤️ for the developer community**
