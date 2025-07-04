import {
  TestInstrumentationEngine,
  TestInstrumentationConfig,
  TestMetrics,
} from './TestInstrumentationEngine';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface JestRunnerConfig extends TestInstrumentationConfig {
  jestConfigOverrides?: {
    setupFilesAfterEnv?: string[];
    moduleNameMapping?: Record<string, string>;
    transform?: Record<string, string>;
    testEnvironment?: string;
    globalSetup?: string;
    globalTeardown?: string;
  };
  instrumentationHooks?: {
    beforeEach?: string;
    afterEach?: string;
    beforeAll?: string;
    afterAll?: string;
  };
}

export class JestInstrumentedRunner extends TestInstrumentationEngine {
  private jestConfig: any;
  private originalJestConfig?: any;

  constructor(config: JestRunnerConfig) {
    super(config);
    this.generateInstrumentedJestConfig(config);
  }

  private generateInstrumentedJestConfig(config: JestRunnerConfig): void {
    // Load existing Jest config or create a new one
    const existingConfig = this.loadExistingJestConfig(config.projectPath);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.jestConfig = {
      ...existingConfig,
      // Override with instrumentation settings
      setupFilesAfterEnv: [
        ...(existingConfig.setupFilesAfterEnv || []),
        path.join(__dirname, 'jest-setup-instrumentation.js'),
      ],
      reporters: [
        'default',
        [
          'jest-junit',
          {
            outputDirectory: path.join(config.outputPath!, 'junit'),
            outputName: 'junit.xml',
          },
        ],
        [
          path.join(__dirname, 'JestInstrumentationReporter.js'),
          {
            outputDir: config.outputPath!,
          },
        ],
      ],
      collectCoverage: config.enableCoverage !== false,
      coverageDirectory: path.join(config.outputPath!, 'coverage'),
      coverageReporters: ['json', 'lcov', 'text', 'html', 'cobertura'],
      collectCoverageFrom: [
        'src/**/*.{ts,js,tsx,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.{ts,js}',
        '!src/**/*.spec.{ts,js}',
        ...(config.jestConfig?.collectCoverageFrom || []),
      ],
      // Performance monitoring
      maxWorkers: config.jestConfig?.maxWorkers || 1, // Single worker for better instrumentation
      testTimeout: config.jestConfig?.timeout || 30000,
      // Custom test environment for instrumentation
      testEnvironment: this.createInstrumentedTestEnvironment(),
      globalSetup: this.createGlobalSetup(),
      globalTeardown: this.createGlobalTeardown(),
      // Apply overrides
      ...config.jestConfigOverrides,
    };

    // Save the instrumented config
    const configPath = path.join(
      config.outputPath!,
      'jest.instrumented.config.js'
    );
    this.saveJestConfig(configPath);
  }

  private loadExistingJestConfig(projectPath: string): any {
    const possibleConfigs = [
      'jest.config.js',
      'jest.config.ts',
      'jest.config.json',
      'package.json',
    ];

    for (const configFile of possibleConfigs) {
      const configPath = path.join(projectPath, configFile);
      if (fs.existsSync(configPath)) {
        if (configFile === 'package.json') {
          const packageJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          return packageJson.jest || {};
        } else if (configFile.endsWith('.json')) {
          return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } else {
          // For .js/.ts files, we'll use a basic config
          return {};
        }
      }
    }

    return {};
  }

  private createInstrumentedTestEnvironment(): string {
    const envPath = path.join(
      this.config.outputPath!,
      'InstrumentedTestEnvironment.js'
    );

    const envContent = `
const { TestEnvironment } = require('jest-environment-node');
const { performance } = require('perf_hooks');

class InstrumentedTestEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.testPath = context.testPath;
    this.startTime = null;
  }

  async setup() {
    await super.setup();
    
    // Add instrumentation globals
    this.global.__INSTRUMENTATION__ = {
      testPath: this.testPath,
      startTime: null,
      endTime: null,
      performance: performance,
      securityEvents: [],
      memorySnapshots: [],
      apiCalls: []
    };

    // Hook into console methods for logging
    this.instrumentConsole();
    
    // Hook into network requests
    this.instrumentNetwork();
    
    // Memory tracking
    this.startMemoryTracking();
  }

  async teardown() {
    this.stopMemoryTracking();
    await super.teardown();
  }

  instrumentConsole() {
    const originalConsole = { ...this.global.console };
    
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      this.global.console[method] = (...args) => {
        // Log to instrumentation
        this.global.__INSTRUMENTATION__.logs = this.global.__INSTRUMENTATION__.logs || [];
        this.global.__INSTRUMENTATION__.logs.push({
          timestamp: Date.now(),
          level: method,
          message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
        });
        
        // Call original
        originalConsole[method](...args);
      };
    });
  }

  instrumentNetwork() {
    // Mock fetch for instrumentation
    this.global.fetch = async (url, options = {}) => {
      const startTime = Date.now();
      
      try {
        // In a real implementation, you'd call the actual fetch
        const response = {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({}),
          text: async () => 'mock response'
        };
        
        this.global.__INSTRUMENTATION__.apiCalls.push({
          timestamp: startTime,
          url,
          method: options.method || 'GET',
          duration: Date.now() - startTime,
          status: response.status
        });
        
        return response;
      } catch (error) {
        this.global.__INSTRUMENTATION__.apiCalls.push({
          timestamp: startTime,
          url,
          method: options.method || 'GET',
          duration: Date.now() - startTime,
          error: error.message
        });
        throw error;
      }
    };
  }

  startMemoryTracking() {
    this.memoryInterval = setInterval(() => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        this.global.__INSTRUMENTATION__.memorySnapshots.push({
          timestamp: Date.now(),
          memory: process.memoryUsage()
        });
      }
    }, 1000);
  }

  stopMemoryTracking() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
  }

  runScript(script) {
    // Mark test start
    this.global.__INSTRUMENTATION__.startTime = Date.now();
    performance.mark('test-start');
    
    const result = super.runScript(script);
    
    // Mark test end
    this.global.__INSTRUMENTATION__.endTime = Date.now();
    performance.mark('test-end');
    performance.measure('test-execution', 'test-start', 'test-end');
    
    return result;
  }
}

module.exports = InstrumentedTestEnvironment;
`;

    fs.writeFileSync(envPath, envContent);
    return envPath;
  }

  private createGlobalSetup(): string {
    const setupPath = path.join(
      this.config.outputPath!,
      'jest-global-setup.js'
    );

    const setupContent = `
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🔧 Starting Jest with instrumentation...');
  
  // Initialize instrumentation output directory
  const outputDir = '${this.config.outputPath}';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create instrumentation session
  global.__JEST_INSTRUMENTATION_SESSION__ = {
    id: 'jest-' + Date.now(),
    startTime: Date.now(),
    outputDir: outputDir,
    tests: [],
    coverage: null,
    performance: {
      marks: [],
      measures: []
    }
  };
  
  console.log('📊 Instrumentation session started:', global.__JEST_INSTRUMENTATION_SESSION__.id);
};
`;

    fs.writeFileSync(setupPath, setupContent);
    return setupPath;
  }

  private createGlobalTeardown(): string {
    const teardownPath = path.join(
      this.config.outputPath!,
      'jest-global-teardown.js'
    );

    const teardownContent = `
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🏁 Jest instrumentation teardown...');
  
  if (global.__JEST_INSTRUMENTATION_SESSION__) {
    const session = global.__JEST_INSTRUMENTATION_SESSION__;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // Save session data
    const sessionPath = path.join(session.outputDir, 'session-data.json');
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    
    console.log('💾 Session data saved to:', sessionPath);
    console.log('⏱️  Total test execution time:', session.duration + 'ms');
  }
};
`;

    fs.writeFileSync(teardownPath, teardownContent);
    return teardownPath;
  }

  private saveJestConfig(configPath: string): void {
    const configContent = `
module.exports = ${JSON.stringify(this.jestConfig, null, 2)};
`;
    fs.writeFileSync(configPath, configContent);
  }

  public async runInstrumentedTests(
    testFiles?: string[]
  ): Promise<TestMetrics> {
    console.log('🚀 Starting instrumented Jest test run...');

    // Update Jest config file reference
    this.config.jestConfig = {
      ...this.config.jestConfig,
      configFile: path.join(
        this.config.outputPath!,
        'jest.instrumented.config.js'
      ),
    };

    return await this.runJestWithInstrumentation(testFiles);
  }

  public async runTestsWithProfiling(
    testFiles?: string[]
  ): Promise<TestMetrics & { profiles: any }> {
    console.log('🔬 Starting profiled Jest test run...');

    const metrics = await this.runInstrumentedTests(testFiles);

    // Load additional profiling data
    const profiles = await this.loadProfilingData();

    return {
      ...metrics,
      profiles,
    };
  }

  private async loadProfilingData(): Promise<any> {
    const profilesDir = this.config.outputPath!;
    const profiles: any = {};

    // Load CPU profiles
    const cpuProfiles = fs
      .readdirSync(profilesDir)
      .filter(
        (file) => file.startsWith('cpu-profile-') && file.endsWith('.json')
      );

    for (const profile of cpuProfiles) {
      const profilePath = path.join(profilesDir, profile);
      profiles[profile] = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    }

    // Load session data
    const sessionPath = path.join(profilesDir, 'session-data.json');
    if (fs.existsSync(sessionPath)) {
      profiles.session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    }

    return profiles;
  }

  public generateCoverageReport(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');

      const reportProcess = spawn(
        'npx',
        ['jest', '--coverage', '--coverageReporters=html'],
        {
          cwd: this.config.projectPath,
          stdio: 'inherit',
        }
      );

      reportProcess.on('close', (code) => {
        if (code === 0) {
          console.log('📈 Coverage report generated successfully');
          resolve();
        } else {
          reject(
            new Error(`Coverage report generation failed with code ${code}`)
          );
        }
      });
    });
  }

  public async analyzeCoverageData(): Promise<any> {
    const coveragePath = path.join(
      this.config.outputPath!,
      'coverage',
      'coverage-final.json'
    );

    if (!fs.existsSync(coveragePath)) {
      throw new Error(
        'Coverage data not found. Run tests with coverage first.'
      );
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

    const analysis = {
      summary: this.calculateCoverageSummary(coverage),
      fileAnalysis: this.analyzeFilesCoverage(coverage),
      recommendations: this.generateCoverageRecommendations(coverage),
    };

    // Save analysis
    const analysisPath = path.join(
      this.config.outputPath!,
      'coverage-analysis.json'
    );
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));

    return analysis;
  }

  private calculateCoverageSummary(coverage: any): any {
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    for (const fileCoverage of Object.values(coverage)) {
      const file = fileCoverage as any;

      // Statements
      const statements = Object.values(file.s || {});
      totalStatements += statements.length;
      coveredStatements += statements.filter(
        (count) => (count as number) > 0
      ).length;

      // Branches
      const branches = Object.values(file.b || {});
      totalBranches += branches.length;
      coveredBranches += branches.filter((branch) =>
        (branch as number[]).some((count) => count > 0)
      ).length;

      // Functions
      const functions = Object.values(file.f || {});
      totalFunctions += functions.length;
      coveredFunctions += functions.filter(
        (count) => (count as number) > 0
      ).length;

      // Lines
      const lines = Object.values(file.l || {});
      totalLines += lines.length;
      coveredLines += lines.filter((count) => (count as number) > 0).length;
    }

    return {
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        percentage:
          totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        percentage:
          totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        percentage:
          totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      },
      lines: {
        total: totalLines,
        covered: coveredLines,
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      },
    };
  }

  private analyzeFilesCoverage(coverage: any): any {
    const files = [];

    for (const [filePath, fileCoverage] of Object.entries(coverage)) {
      const file = fileCoverage as any;

      const statements = Object.values(file.s || {});
      const branches = Object.values(file.b || {});
      const functions = Object.values(file.f || {});
      const lines = Object.values(file.l || {});

      const coveredStatements = statements.filter(
        (count) => (count as number) > 0
      ).length;
      const coveredBranches = branches.filter((branch) =>
        (branch as number[]).some((count) => count > 0)
      ).length;
      const coveredFunctions = functions.filter(
        (count) => (count as number) > 0
      ).length;
      const coveredLines = lines.filter(
        (count) => (count as number) > 0
      ).length;

      files.push({
        path: filePath,
        coverage: {
          statements:
            statements.length > 0
              ? (coveredStatements / statements.length) * 100
              : 0,
          branches:
            branches.length > 0 ? (coveredBranches / branches.length) * 100 : 0,
          functions:
            functions.length > 0
              ? (coveredFunctions / functions.length) * 100
              : 0,
          lines: lines.length > 0 ? (coveredLines / lines.length) * 100 : 0,
        },
        uncoveredLines: this.findUncoveredLines(file),
        riskLevel: this.calculateFileRiskLevel(filePath, {
          statements:
            statements.length > 0
              ? (coveredStatements / statements.length) * 100
              : 0,
          branches:
            branches.length > 0 ? (coveredBranches / branches.length) * 100 : 0,
          functions:
            functions.length > 0
              ? (coveredFunctions / functions.length) * 100
              : 0,
          lines: lines.length > 0 ? (coveredLines / lines.length) * 100 : 0,
        }),
      });
    }

    return files.sort((a, b) => {
      const avgA =
        (a.coverage.statements +
          a.coverage.branches +
          a.coverage.functions +
          a.coverage.lines) /
        4;
      const avgB =
        (b.coverage.statements +
          b.coverage.branches +
          b.coverage.functions +
          b.coverage.lines) /
        4;
      return avgA - avgB; // Sort by lowest coverage first
    });
  }

  private findUncoveredLines(fileCoverage: any): number[] {
    const uncoveredLines: number[] = [];

    for (const [lineNum, count] of Object.entries(fileCoverage.l || {})) {
      if ((count as number) === 0) {
        uncoveredLines.push(parseInt(lineNum));
      }
    }

    return uncoveredLines.sort((a, b) => a - b);
  }

  private calculateFileRiskLevel(
    filePath: string,
    coverage: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    const avgCoverage =
      (coverage.statements +
        coverage.branches +
        coverage.functions +
        coverage.lines) /
      4;

    // Higher risk for core files
    const isCoreFile =
      filePath.includes('/src/') && !filePath.includes('/test/');
    const isUtilFile = filePath.includes('util') || filePath.includes('helper');

    if (avgCoverage < 30) return 'critical';
    if (avgCoverage < 50) return 'high';
    if (avgCoverage < 70) return isCoreFile ? 'high' : 'medium';
    if (avgCoverage < 90) return isCoreFile && !isUtilFile ? 'medium' : 'low';
    return 'low';
  }

  private generateCoverageRecommendations(coverage: any): any[] {
    const recommendations = [];
    const fileAnalysis = this.analyzeFilesCoverage(coverage);
    const summary = this.calculateCoverageSummary(coverage);

    // Global recommendations
    if (summary.statements.percentage < 80) {
      recommendations.push({
        type: 'global',
        priority: 'high',
        title: 'Improve Overall Statement Coverage',
        description: `Current statement coverage is ${summary.statements.percentage.toFixed(1)}%. Aim for at least 80%.`,
        actionItems: [
          'Add tests for untested functions',
          'Focus on high-risk files first',
          'Consider property-based testing for complex logic',
        ],
      });
    }

    if (summary.branches.percentage < 70) {
      recommendations.push({
        type: 'global',
        priority: 'high',
        title: 'Improve Branch Coverage',
        description: `Current branch coverage is ${summary.branches.percentage.toFixed(1)}%. Test all conditional paths.`,
        actionItems: [
          'Add tests for edge cases',
          'Test both true and false conditions',
          'Test error handling paths',
        ],
      });
    }

    // File-specific recommendations
    const criticalFiles = fileAnalysis
      .filter((f) => f.riskLevel === 'critical')
      .slice(0, 5);
    for (const file of criticalFiles) {
      recommendations.push({
        type: 'file',
        priority: 'critical',
        title: `Critical Coverage Gap: ${path.basename(file.path)}`,
        description: `This file has very low test coverage and should be prioritized.`,
        file: file.path,
        uncoveredLines: file.uncoveredLines.slice(0, 10), // Show first 10 uncovered lines
        actionItems: [
          'Write unit tests for main functions',
          'Add integration tests if applicable',
          'Consider refactoring if the file is too complex to test',
        ],
      });
    }

    return recommendations;
  }
}
