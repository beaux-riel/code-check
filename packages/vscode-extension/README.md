# Code Check VSCode Extension

Integrate Code Check analysis directly into your VSCode workflow with real-time feedback, inline diagnostics, and comprehensive code quality insights.

## 🚀 Quick Start

### Installation

#### From VSCode Marketplace (Coming Soon)

1. Open VSCode
2. Go to Extensions (Ctrl/Cmd + Shift + X)
3. Search for "Code Check"
4. Click Install

#### Development Installation

```bash
# From monorepo root
pnpm install
pnpm build

# Package the extension
cd packages/vscode-extension
pnpm package

# Install the generated .vsix file
code --install-extension code-check-*.vsix
```

### Initial Setup

1. Open your project in VSCode
2. Open Command Palette (Ctrl/Cmd + Shift + P)
3. Run `Code Check: Initialize Project`
4. Configure analysis settings

## 📁 Extension Structure

```
packages/vscode-extension/
├── src/
│   ├── extension.ts        # Main extension entry point
│   ├── commands/           # Command implementations
│   ├── providers/          # Language providers
│   ├── webview/            # Webview panels
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── resources/              # Icons and assets
├── syntaxes/               # Syntax highlighting
├── package.json            # Extension manifest
└── README.md
```

## 🎯 Core Features

### Real-time Analysis

- **Live Diagnostics**: Issues highlighted as you type
- **Background Analysis**: Continuous quality monitoring
- **Smart Suggestions**: AI-powered code improvements
- **Performance Insights**: Runtime performance indicators

### Integrated Workflow

- **Command Palette**: Quick access to all features
- **Status Bar**: Real-time analysis status
- **Problem Panel**: Centralized issue management
- **File Explorer**: Project-wide quality overview

### Rich UI Components

- **Analysis Dashboard**: Comprehensive project insights
- **Coverage Visualization**: Interactive coverage maps
- **Metrics Charts**: Visual quality trends
- **Issue Explorer**: Detailed problem breakdown

## 🎮 Commands

### Analysis Commands

| Command                       | Description               | Shortcut               |
| ----------------------------- | ------------------------- | ---------------------- |
| `Code Check: Analyze Project` | Run full project analysis | `Ctrl/Cmd + Shift + A` |
| `Code Check: Analyze File`    | Analyze current file      | `Ctrl/Cmd + Alt + A`   |
| `Code Check: Quick Fix`       | Apply suggested fixes     | `Ctrl/Cmd + .`         |
| `Code Check: Show Dashboard`  | Open analysis dashboard   | `Ctrl/Cmd + Shift + D` |

### Configuration Commands

| Command                            | Description                  |
| ---------------------------------- | ---------------------------- |
| `Code Check: Initialize Project`   | Set up Code Check in project |
| `Code Check: Configure Settings`   | Open extension settings      |
| `Code Check: Select Rule Set`      | Choose analysis rules        |
| `Code Check: Update Configuration` | Modify analysis config       |

### View Commands

| Command                        | Description                   |
| ------------------------------ | ----------------------------- |
| `Code Check: Show Coverage`    | Display coverage report       |
| `Code Check: Show Performance` | View performance metrics      |
| `Code Check: Show Security`    | Security vulnerability report |
| `Code Check: Show History`     | Analysis history timeline     |

## ⚙️ Configuration

### Extension Settings

Access via File → Preferences → Settings → Extensions → Code Check

```json
{
  "codeCheck.enabled": true,
  "codeCheck.autoAnalyze": true,
  "codeCheck.analysisOnSave": true,
  "codeCheck.showInlineErrors": true,
  "codeCheck.serverUrl": "http://localhost:8080",
  "codeCheck.maxWorkers": 4,
  "codeCheck.timeout": 30000,
  "codeCheck.enableLLMAnalysis": true,
  "codeCheck.aiProvider": "openai",
  "codeCheck.rulesets": ["typescript-recommended", "security-recommended"],
  "codeCheck.include": ["src/**/*"],
  "codeCheck.exclude": ["node_modules/**", "dist/**"],
  "codeCheck.diagnostics": {
    "enableInlineErrors": true,
    "enableInlineWarnings": true,
    "enableInlineInfo": false
  },
  "codeCheck.ui": {
    "showStatusBar": true,
    "showProgressIndicator": true,
    "enableAnimations": true,
    "theme": "auto"
  }
}
```

### Project Configuration

Create `.vscode/settings.json` in your project:

```json
{
  "codeCheck.projectPath": ".",
  "codeCheck.outputPath": "./.code-check",
  "codeCheck.enabledPlugins": ["AST", "LLM", "Security"],
  "codeCheck.customRules": "./custom-rules.json",
  "codeCheck.thresholds": {
    "error": 0,
    "warning": 10,
    "info": 50
  }
}
```

## 🎨 User Interface

### Status Bar Integration

The extension adds a status bar item showing:

- Current analysis status
- Issue count by severity
- Quick action buttons
- Progress indicator during analysis

```
[Code Check] ✓ 0 errors, 3 warnings | Analyzing... 45%
```

### Problem Panel Integration

Issues appear in VSCode's Problems panel with:

- File location and line number
- Issue severity and category
- Detailed description
- Quick fix suggestions
- Rule documentation links

### Inline Diagnostics

Code issues are highlighted directly in the editor:

- **Red squiggles**: Errors
- **Yellow squiggles**: Warnings
- **Blue squiggles**: Information
- **Hover tooltips**: Detailed explanations

### Dashboard Webview

Comprehensive analysis dashboard featuring:

- Project quality overview
- Coverage visualization
- Performance metrics
- Security insights
- Trend analysis

## 🔧 Language Support

### Supported Languages

- **JavaScript/TypeScript**: Full AST analysis, type checking
- **React/JSX**: Component analysis, best practices
- **Vue.js**: Template and script analysis
- **Python**: Syntax and style checking
- **Java**: Code quality and security analysis
- **C#**: .NET specific rules and patterns
- **Go**: Idiomatic Go analysis

### Language Features

- **Syntax Highlighting**: Enhanced highlighting for code issues
- **IntelliSense**: Smart completions with quality suggestions
- **Code Actions**: Quick fixes and refactoring
- **Hover Information**: Detailed metrics and explanations
- **Signature Help**: Parameter hints with quality tips

## 📊 Dashboard Features

### Overview Tab

- Quality score trending
- Issue distribution charts
- File health heatmap
- Recent analysis history

### Coverage Tab

- Line-by-line coverage visualization
- Branch coverage analysis
- Function coverage details
- Coverage trend over time

### Performance Tab

- Execution time analysis
- Memory usage patterns
- Performance bottlenecks
- Optimization suggestions

### Security Tab

- Vulnerability assessment
- Dependency security status
- Security score breakdown
- Remediation recommendations

## 🛠️ Development Features

### Live Analysis

```typescript
// Extension automatically analyzes as you type
const analysisProvider = new LiveAnalysisProvider();
analysisProvider.onDidChange((diagnostics) => {
  // Update inline diagnostics
  updateDiagnostics(diagnostics);
});
```

### Code Actions

```typescript
// Register quick fix providers
vscode.languages.registerCodeActionsProvider('typescript', {
  provideCodeActions(document, range, context) {
    const actions = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source === 'code-check') {
        actions.push({
          title: `Fix: ${diagnostic.message}`,
          kind: vscode.CodeActionKind.QuickFix,
          command: 'codeCheck.applyFix',
          arguments: [document.uri, diagnostic],
        });
      }
    }

    return actions;
  },
});
```

### Custom Webview

```typescript
// Create analysis dashboard
class AnalysisDashboard {
  private panel: vscode.WebviewPanel;

  constructor(context: vscode.ExtensionContext) {
    this.panel = vscode.window.createWebviewPanel(
      'codeCheckDashboard',
      'Code Check Dashboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
      }
    );

    this.panel.webview.html = this.getHtmlContent();
  }

  private getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code Check Dashboard</title>
          <style>/* Dashboard styles */</style>
        </head>
        <body>
          <div id="dashboard"></div>
          <script>/* Dashboard JavaScript */</script>
        </body>
      </html>
    `;
  }
}
```

## 🔌 Integration Features

### Git Integration

- **Diff Analysis**: Analyze only changed files
- **Commit Hooks**: Pre-commit quality checks
- **Branch Comparison**: Quality changes between branches
- **PR Integration**: Automated quality reports

### CI/CD Integration

- **GitHub Actions**: Export analysis results
- **Jenkins**: Pipeline integration
- **Azure DevOps**: Build task integration
- **GitLab CI**: Quality gate integration

### External Tools

- **ESLint**: Enhanced rule integration
- **Prettier**: Code formatting coordination
- **TypeScript**: Compiler integration
- **Jest**: Test coverage visualization

## 🎯 Workflow Examples

### Daily Development

1. Open project in VSCode
2. Extension auto-initializes and starts background analysis
3. Code with real-time feedback and suggestions
4. Use quick fixes for immediate improvements
5. Review dashboard for comprehensive insights

### Code Review

1. Switch to review branch
2. Run `Code Check: Analyze Project`
3. Compare quality metrics with main branch
4. Address critical issues before merge
5. Export analysis report for team review

### Refactoring Session

1. Open `Code Check: Show Dashboard`
2. Identify high-complexity files
3. Use performance insights to guide optimization
4. Apply suggested refactoring actions
5. Verify improvements with re-analysis

## 🧪 Testing Features

### Test Coverage Integration

```json
{
  "codeCheck.testing": {
    "enableCoverageVisualization": true,
    "coverageThreshold": 80,
    "showUncoveredLines": true,
    "highlightCriticalPaths": true
  }
}
```

### Jest Integration

- **Test Result Overlay**: Pass/fail indicators in editor
- **Coverage Gutters**: Line coverage visualization
- **Test Performance**: Execution time analysis
- **Snapshot Analysis**: Snapshot quality metrics

### Cypress Integration

- **E2E Coverage**: End-to-end test coverage
- **Page Performance**: Runtime performance metrics
- **Visual Testing**: Screenshot comparison
- **Accessibility**: A11y compliance checking

## 🔒 Security Features

### Vulnerability Detection

- **Real-time Scanning**: Continuous security monitoring
- **Dependency Analysis**: Package vulnerability detection
- **Code Pattern Analysis**: Insecure coding patterns
- **Compliance Checking**: Security standard validation

### Privacy & Security

- **Local Analysis**: No code sent to external servers by default
- **Encrypted Communication**: Secure API communication
- **Audit Logging**: Security event tracking
- **Permission Management**: Granular access controls

## 🎨 Customization

### Themes

Support for VSCode themes with custom Code Check colors:

```json
{
  "workbench.colorCustomizations": {
    "codeCheck.errorHighlight": "#ff6b6b",
    "codeCheck.warningHighlight": "#feca57",
    "codeCheck.infoHighlight": "#48cae4",
    "codeCheck.successHighlight": "#51cf66"
  }
}
```

### Custom Rules

```typescript
// Define custom analysis rules
interface CustomRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  pattern: RegExp;
  message: string;
  quickFix?: string;
}

const customRules: CustomRule[] = [
  {
    id: 'no-console-log',
    name: 'No Console Logging',
    description: 'Avoid console.log in production code',
    severity: 'warning',
    pattern: /console\.log\(/g,
    message: 'Remove console.log statement',
    quickFix: '// console.log(',
  },
];
```

## 📱 Mobile Development

### React Native Support

- **Metro bundler integration**: Build-time analysis
- **Device performance**: Runtime performance on devices
- **Platform-specific rules**: iOS/Android specific checks
- **Flipper integration**: Debug panel integration

### Hybrid App Support

- **Cordova/PhoneGap**: Cross-platform analysis
- **Ionic**: Framework-specific patterns
- **Electron**: Desktop app optimization
- **PWA**: Progressive web app compliance

## 🐛 Troubleshooting

### Common Issues

**Extension not activating:**

```bash
# Check VSCode logs
Help → Toggle Developer Tools → Console

# Reload extension
Ctrl/Cmd + Shift + P → "Developer: Reload Window"
```

**Analysis not working:**

```json
// Check settings.json
{
  "codeCheck.enabled": true,
  "codeCheck.serverUrl": "http://localhost:8080"
}
```

**Performance issues:**

```json
// Optimize settings
{
  "codeCheck.maxWorkers": 2,
  "codeCheck.timeout": 15000,
  "codeCheck.exclude": ["node_modules/**", "dist/**", "build/**"]
}
```

### Debug Mode

Enable debug logging:

```json
{
  "codeCheck.debug": true,
  "codeCheck.logLevel": "debug"
}
```

View logs: `Output → Code Check`

## 🚀 Performance Optimization

### Best Practices

1. **Exclude large directories**: node_modules, dist, build
2. **Use specific file patterns**: Only analyze relevant files
3. **Adjust worker count**: Match your CPU cores
4. **Enable incremental analysis**: Only analyze changed files
5. **Configure appropriate timeouts**: Balance speed vs thoroughness

### Memory Management

```json
{
  "codeCheck.memoryLimit": "1GB",
  "codeCheck.gcInterval": 30000,
  "codeCheck.cacheSize": 100
}
```

## 🤝 Contributing

### Development Setup

```bash
# Clone and setup
git clone <repository>
cd packages/vscode-extension
pnpm install

# Start development
pnpm watch

# Test extension
F5 (opens Extension Development Host)
```

### Extension Guidelines

1. Follow VSCode extension best practices
2. Maintain backward compatibility
3. Add comprehensive tests
4. Update documentation
5. Test on multiple platforms

## 📦 Packaging & Distribution

### Local Packaging

```bash
# Install vsce
npm install -g vsce

# Package extension
cd packages/vscode-extension
vsce package

# Install locally
code --install-extension code-check-*.vsix
```

### Marketplace Publishing

```bash
# Create publisher account at https://marketplace.visualstudio.com
# Get Personal Access Token

# Login
vsce login <publisher-name>

# Publish
vsce publish
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Additional Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
