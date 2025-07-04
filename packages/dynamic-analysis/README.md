# Dynamic Analysis Package

Real-time test instrumentation and runtime analysis for Jest and Cypress with coverage, performance profiling, and security monitoring.

## 🚀 Quick Start

### Installation

```bash
# From monorepo root
pnpm install

# Or install as dependency
npm install @code-check/dynamic-analysis
```

### Basic Usage

```typescript
import {
  DynamicAnalysisEngine,
  JestInstrumentation,
} from '@code-check/dynamic-analysis';

const engine = new DynamicAnalysisEngine({
  enabled: true,
  instrumentation: {
    projectPath: './my-project',
    outputPath: './.analysis',
    enableCoverage: true,
    enableProfiling: true,
    enableSecurity: true,
  },
});

const results = await engine.runAnalysis();
console.log(results);
```

## 📁 Package Structure

```
packages/dynamic-analysis/
├── src/
│   ├── jest/               # Jest instrumentation
│   ├── cypress/            # Cypress instrumentation
│   ├── profiling/          # Performance profiling
│   ├── security/           # Security probes
│   ├── collector/          # Runtime data collection
│   ├── engine/             # Main analysis engine
│   └── types/              # TypeScript definitions
├── dist/                   # Built output
└── package.json
```

## 🎯 Core Features

- **Jest Instrumentation**: Enhanced test coverage and performance monitoring
- **Cypress Integration**: E2E test coverage with runtime analysis
- **Performance Profiling**: Memory, CPU, and execution time monitoring
- **Security Probes**: Runtime vulnerability detection
- **Real-time Data Collection**: WebSocket-based live updates
- **Comprehensive Reporting**: Multiple output formats

## 🧪 Jest Instrumentation

### Setup and Configuration

```typescript
import { JestInstrumentation } from '@code-check/dynamic-analysis';

const jestConfig = {
  projectPath: './my-project',
  outputPath: './.analysis',
  enableCoverage: true,
  enableProfiling: true,
  enableSecurity: false,
  jest: {
    configFile: './jest.config.js',
    testMatch: ['**/__tests__/**/*.test.ts'],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
};

const instrumentation = new JestInstrumentation(jestConfig);
```

### Running Tests with Analysis

```typescript
const results = await instrumentation.runTests();

console.log('Exit Code:', results.exitCode);
console.log('Coverage:', results.coverage?.summary);
console.log('Performance:', results.performance);
```

### Coverage Data Structure

```typescript
interface CoverageData {
  type: 'jest';
  timestamp: number;
  summary: {
    lines: CoverageMetric;
    statements: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
  };
  files: CoverageFileData[];
}

interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}
```

### Enhanced Jest Configuration

The instrumentation automatically enhances your Jest setup:

```javascript
// Auto-generated or enhanced jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: './.analysis/coverage',
  coverageReporters: ['json', 'lcov', 'cobertura', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  // Performance profiling when enabled
  maxWorkers: 1, // For accurate profiling
  testTimeout: 30000,
};
```

## 🌐 Cypress Instrumentation

### Setup and Configuration

```typescript
import { CypressInstrumentation } from '@code-check/dynamic-analysis';

const cypressConfig = {
  projectPath: './my-project',
  outputPath: './.analysis',
  enableCoverage: true,
  enableProfiling: true,
  enableSecurity: false,
  cypress: {
    configFile: './cypress.config.js',
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.js',
  },
};

const instrumentation = new CypressInstrumentation(cypressConfig);
```

### Auto-Generated Cypress Configuration

```javascript
// Auto-generated cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      // Code coverage plugin
      require('@cypress/code-coverage/task')(on, config);

      // Performance monitoring
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        performance(data) {
          const perfFile = path.join('./.analysis', 'cypress-performance.json');
          fs.writeFileSync(perfFile, JSON.stringify(data, null, 2));
          return null;
        },
      });

      return config;
    },
  },
});
```

### Required Dependencies

For Cypress coverage to work, install:

```bash
npm install --save-dev @cypress/code-coverage babel-plugin-istanbul istanbul-lib-coverage
```

### Coverage Support File

```javascript
// cypress/support/e2e.js
import '@cypress/code-coverage/support';

// Custom commands for performance tracking
Cypress.Commands.add('startPerformanceTracking', () => {
  cy.window().then((win) => {
    win.performance.mark('test-start');
  });
});

Cypress.Commands.add('endPerformanceTracking', (testName) => {
  cy.window().then((win) => {
    win.performance.mark('test-end');
    win.performance.measure('test-duration', 'test-start', 'test-end');

    const measure = win.performance.getEntriesByName('test-duration')[0];
    cy.task('performance', {
      testName,
      duration: measure.duration,
      timestamp: Date.now(),
    });
  });
});
```

## ⚡ Performance Profiling

### Performance Profiler

```typescript
import { PerformanceProfiler } from '@code-check/dynamic-analysis';

const profiler = new PerformanceProfiler({
  enableCpuProfiling: true,
  enableMemoryProfiling: true,
  enableEventLoopMonitoring: true,
  samplingInterval: 100, // ms
  maxProfileDuration: 300000, // 5 minutes
});

await profiler.start();
// Run your tests...
const metrics = await profiler.stop();

console.log('Memory Usage:', metrics.memoryUsage);
console.log('CPU Usage:', metrics.cpuUsage);
console.log('Event Loop Lag:', metrics.eventLoopLag);
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  timestamp: number;
  testDuration: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  eventLoopLag: number;
  gcMetrics?: {
    minorGcCount: number;
    majorGcCount: number;
    incrementalGcCount: number;
    totalGcTime: number;
  };
}
```

### Node.js Inspector Integration

Enable Node.js debugging for advanced profiling:

```bash
# Run Jest with inspector
node --inspect=9229 --max-old-space-size=4096 ./node_modules/.bin/jest

# Connect Chrome DevTools
# Open chrome://inspect in Chrome browser
```

## 🔒 Security Probes

### Security Probe Configuration

```typescript
import { SecurityProbe } from '@code-check/dynamic-analysis';

const securityProbe = new SecurityProbe({
  enableDependencyScanning: true,
  enableCodeAnalysis: true,
  enableRuntimeMonitoring: true,
  severityThreshold: 'medium',
  excludePatterns: ['test/**', '**/*.test.*'],
});

const vulnerabilities = await securityProbe.scan('./src');
```

### Vulnerability Detection

```typescript
interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  path: string;
  line?: number;
  column?: number;
  type: 'dependency' | 'code' | 'configuration';
  recommendation: string;
  cve?: string;
  cvss?: number;
}
```

### Runtime Security Monitoring

```typescript
// Monitor for security issues during test execution
securityProbe.on('vulnerability.detected', (vuln) => {
  console.warn(`Security issue: ${vuln.title} in ${vuln.path}`);
});

securityProbe.on('dependency.vulnerable', (dep) => {
  console.error(`Vulnerable dependency: ${dep.name}@${dep.version}`);
});
```

## 📊 Runtime Data Collection

### WebSocket Data Streaming

```typescript
import { RuntimeDataCollector } from '@code-check/dynamic-analysis';

const collector = new RuntimeDataCollector({
  enableWebSocket: true,
  websocketPort: 8080,
  enableFileOutput: true,
  outputDirectory: './.analysis/runtime',
});

// Start collecting data
await collector.start();

// Stream data to connected clients
collector.on('data.coverage', (coverageData) => {
  collector.broadcast('coverage', coverageData);
});

collector.on('data.performance', (perfData) => {
  collector.broadcast('performance', perfData);
});

collector.on('data.security', (securityData) => {
  collector.broadcast('security', securityData);
});
```

### WebSocket Client Example

```javascript
// Frontend client
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'coverage':
      updateCoverageUI(message.payload);
      break;
    case 'performance':
      updatePerformanceCharts(message.payload);
      break;
    case 'security':
      updateSecurityAlerts(message.payload);
      break;
  }
};
```

## 🎛️ Dynamic Analysis Engine

### Complete Analysis Workflow

```typescript
import { DynamicAnalysisEngine } from '@code-check/dynamic-analysis';

const engine = new DynamicAnalysisEngine({
  enabled: true,
  instrumentation: {
    projectPath: './my-project',
    outputPath: './.analysis',
    enableCoverage: true,
    enableProfiling: true,
    enableSecurity: true,
    jest: {
      configFile: './jest.config.js',
      coverageThreshold: {
        global: { branches: 80, functions: 80, lines: 80, statements: 80 },
      },
    },
    cypress: {
      baseUrl: 'http://localhost:3000',
      specPattern: 'cypress/e2e/**/*.cy.ts',
    },
  },
  reporting: {
    generateReports: true,
    outputFormats: ['json', 'html'],
    includeSourceMaps: true,
  },
  thresholds: {
    coverage: { lines: 80, statements: 80, functions: 80, branches: 70 },
    performance: { maxTestDuration: 30000, maxMemoryUsage: 512 * 1024 * 1024 },
    security: { allowedSeverities: ['low', 'moderate'], maxVulnerabilities: 5 },
  },
});

// Run complete analysis
const results = await engine.runAnalysis();

console.log('Analysis Results:');
console.log('- Coverage:', results.coverage?.summary);
console.log('- Performance:', results.performance);
console.log('- Security:', results.security);
console.log('- Duration:', results.duration);
```

### Analysis Results

```typescript
interface RuntimeAnalysisResult {
  timestamp: number;
  duration: number;
  coverage?: CoverageData;
  performance?: PerformanceMetrics;
  security?: {
    vulnerabilities: SecurityVulnerability[];
    totalCount: number;
    severityBreakdown: Record<string, number>;
  };
  metadata: {
    projectPath: string;
    testType: 'jest' | 'cypress' | 'mixed';
    instrumentationEnabled: string[];
  };
}
```

## 🔧 Integration with Core Engine

### Feeding Data Back to Analysis Engine

```typescript
import { CodeCheckEngine } from '@code-check/core-engine';
import { DynamicAnalysisEngine } from '@code-check/dynamic-analysis';

// Create dynamic analysis engine
const dynamicEngine = new DynamicAnalysisEngine(config);

// Create main analysis engine
const coreEngine = new CodeCheckEngine({
  projectPath: './my-project',
  // ... other config
});

// Run dynamic analysis first
const dynamicResults = await dynamicEngine.runAnalysis();

// Feed results into core engine
coreEngine.addRuntimeData(dynamicResults);

// Run complete analysis
const completeResults = await coreEngine.analyze();
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Dynamic Analysis
on: [push, pull_request]

jobs:
  dynamic-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run Jest with instrumentation
        run: |
          node -e "
          const { JestInstrumentation } = require('@code-check/dynamic-analysis');
          const instrumentation = new JestInstrumentation({
            projectPath: '.',
            outputPath: './analysis',
            enableCoverage: true,
            enableProfiling: true
          });
          instrumentation.runTests().then(console.log);
          "

      - name: Run Cypress with instrumentation
        run: |
          npm start &
          sleep 10
          node -e "
          const { CypressInstrumentation } = require('@code-check/dynamic-analysis');
          const instrumentation = new CypressInstrumentation({
            projectPath: '.',
            outputPath: './analysis',
            enableCoverage: true,
            cypress: { baseUrl: 'http://localhost:3000' }
          });
          instrumentation.runTests().then(console.log);
          "

      - name: Upload analysis results
        uses: actions/upload-artifact@v3
        with:
          name: dynamic-analysis-results
          path: ./analysis/
```

## 🐛 Troubleshooting

### Common Issues

**Coverage not working with Jest:**

```bash
# Make sure babel-plugin-istanbul is configured
npm install --save-dev babel-plugin-istanbul

# Update babel.config.js
{
  "env": {
    "test": {
      "plugins": ["istanbul"]
    }
  }
}
```

**Cypress coverage issues:**

```bash
# Install required packages
npm install --save-dev @cypress/code-coverage nyc istanbul-lib-coverage

# Add to cypress/support/e2e.js
import '@cypress/code-coverage/support';
```

**Performance profiling memory issues:**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or use the CLI flag
node --max-old-space-size=4096 your-script.js
```

### Debug Mode

```typescript
const engine = new DynamicAnalysisEngine({
  // ... config
  debug: true, // Enable debug logging
  verbose: true, // Verbose output
});
```

## 📚 Advanced Configuration

### Custom Instrumentation

```typescript
// Create custom instrumentation
class CustomInstrumentation {
  async runTests() {
    // Your custom test execution logic
    return {
      coverage: await this.collectCoverage(),
      performance: await this.measurePerformance(),
      exitCode: 0,
    };
  }
}

// Use with dynamic analysis engine
const engine = new DynamicAnalysisEngine({
  customInstrumentation: new CustomInstrumentation(),
});
```

### Real-time Monitoring Dashboard

```typescript
// Server-side monitoring
const collector = new RuntimeDataCollector({
  enableWebSocket: true,
  websocketPort: 8080,
});

// Client-side dashboard
const dashboard = new DashboardClient('ws://localhost:8080');
dashboard.on('update', (data) => {
  updateRealTimeCharts(data);
});
```

## 🤝 Contributing

1. Follow the established patterns for instrumentation
2. Add tests for new features
3. Update type definitions
4. Document configuration options

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
