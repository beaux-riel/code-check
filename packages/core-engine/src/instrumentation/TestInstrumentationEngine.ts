import { EventEmitter } from 'events';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import inspector from 'inspector';

export interface TestInstrumentationConfig {
  projectPath: string;
  outputPath?: string;
  enableCoverage?: boolean;
  enablePerformanceProfiling?: boolean;
  enableSecurityProbes?: boolean;
  enableMemoryTracking?: boolean;
  jestConfig?: JestInstrumentationConfig;
  cypressConfig?: CypressInstrumentationConfig;
  dataCollectionEndpoint?: string;
}

export interface JestInstrumentationConfig {
  configFile?: string;
  collectCoverageFrom?: string[];
  coverageThreshold?: {
    global?: {
      branches?: number;
      functions?: number;
      lines?: number;
      statements?: number;
    };
  };
  maxWorkers?: number;
  timeout?: number;
}

export interface CypressInstrumentationConfig {
  configFile?: string;
  browser?: string;
  headless?: boolean;
  video?: boolean;
  screenshots?: boolean;
  baseUrl?: string;
}

export interface TestMetrics {
  testRun: {
    id: string;
    timestamp: string;
    duration: number;
    framework: 'jest' | 'cypress';
    status: 'passed' | 'failed' | 'skipped';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
  };
  coverage?: CoverageReport;
  performance?: PerformanceReport;
  security?: SecurityReport;
  memory?: MemoryReport;
  errors?: ErrorReport[];
}

export interface CoverageReport {
  global: {
    statements: { pct: number; covered: number; total: number };
    branches: { pct: number; covered: number; total: number };
    functions: { pct: number; covered: number; total: number };
    lines: { pct: number; covered: number; total: number };
  };
  files: Record<
    string,
    {
      statements: { pct: number; covered: number; total: number };
      branches: { pct: number; covered: number; total: number };
      functions: { pct: number; covered: number; total: number };
      lines: { pct: number; covered: number; total: number };
    }
  >;
}

export interface PerformanceReport {
  timing: {
    testSetupTime: number;
    testExecutionTime: number;
    testTeardownTime: number;
    totalTime: number;
  };
  profiling?: {
    cpuProfile?: any;
    heapSnapshot?: any;
    samples: PerformanceSample[];
  };
  nodeInspectorData?: any;
}

export interface PerformanceSample {
  timestamp: number;
  cpuUsage: NodeJS.CpuUsage;
  memoryUsage: NodeJS.MemoryUsage;
  eventLoopDelay?: number;
}

export interface SecurityReport {
  vulnerabilities: SecurityVulnerability[];
  suspiciousActivities: SuspiciousActivity[];
  apiCalls: APICall[];
  fileSystemAccess: FileSystemAccess[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  location: {
    file: string;
    line?: number;
    function?: string;
  };
  suggestion?: string;
}

export interface SuspiciousActivity {
  id: string;
  timestamp: number;
  type: 'network' | 'filesystem' | 'process' | 'environment';
  description: string;
  details: any;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface APICall {
  timestamp: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: any;
  };
  duration: number;
}

export interface FileSystemAccess {
  timestamp: number;
  operation: 'read' | 'write' | 'delete' | 'create';
  path: string;
  size?: number;
  permissions?: string;
}

export interface MemoryReport {
  initial: NodeJS.MemoryUsage;
  peak: NodeJS.MemoryUsage;
  final: NodeJS.MemoryUsage;
  leaks: MemoryLeak[];
  gcStats: GCStats[];
}

export interface MemoryLeak {
  id: string;
  type: 'object' | 'closure' | 'dom' | 'listener';
  size: number;
  stackTrace: string[];
  description: string;
}

export interface GCStats {
  timestamp: number;
  type: string;
  duration: number;
  before: NodeJS.MemoryUsage;
  after: NodeJS.MemoryUsage;
}

export interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'assertion' | 'runtime' | 'timeout' | 'security';
  message: string;
  stack: string;
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  testFile?: string;
  testName?: string;
}

export class TestInstrumentationEngine extends EventEmitter {
  private config: TestInstrumentationConfig;
  private currentTestRun?: string;
  private performanceObserver?: PerformanceObserver;
  private inspectorSession?: inspector.Session;
  private metrics: TestMetrics[] = [];
  private securityProbes: Map<string, Function> = new Map();
  private performanceSamples: PerformanceSample[] = [];
  private memoryTracker?: NodeJS.Timer;

  constructor(config: TestInstrumentationConfig) {
    super();
    this.config = {
      enableCoverage: true,
      enablePerformanceProfiling: true,
      enableSecurityProbes: true,
      enableMemoryTracking: true,
      outputPath: path.join(
        config.projectPath,
        '.code-check',
        'test-instrumentation'
      ),
      ...config,
    };

    this.initializeInstrumentation();
  }

  private initializeInstrumentation(): void {
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputPath!)) {
      fs.mkdirSync(this.config.outputPath!, { recursive: true });
    }

    // Initialize performance monitoring
    if (this.config.enablePerformanceProfiling) {
      this.initializePerformanceMonitoring();
    }

    // Initialize security probes
    if (this.config.enableSecurityProbes) {
      this.initializeSecurityProbes();
    }
  }

  private initializePerformanceMonitoring(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.emit('performance.entry', {
          name: entry.name,
          type: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
        });
      });
    });

    this.performanceObserver.observe({
      entryTypes: ['measure', 'mark', 'function', 'gc'],
    });
  }

  private initializeSecurityProbes(): void {
    // Hook into require to monitor module loading
    this.installRequireHook();

    // Hook into network calls
    this.installNetworkHooks();

    // Hook into file system operations
    this.installFileSystemHooks();

    // Hook into process operations
    this.installProcessHooks();
  }

  private installRequireHook(): void {
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    Module.prototype.require = function (id: string) {
      // Monitor for suspicious module loads
      if (
        id.includes('child_process') ||
        id.includes('crypto') ||
        id.includes('fs')
      ) {
        // Log security-sensitive module access
        const caller = new Error().stack?.split('\n')[2] || 'unknown';
        // Emit security event
      }

      return originalRequire.apply(this, arguments);
    };
  }

  private installNetworkHooks(): void {
    const https = require('https');
    const http = require('http');

    // Hook HTTP requests
    const originalHttpRequest = http.request;
    http.request = (...args: any[]) => {
      const req = originalHttpRequest.apply(http, args);
      this.instrumentRequest(req, 'http');
      return req;
    };

    // Hook HTTPS requests
    const originalHttpsRequest = https.request;
    https.request = (...args: any[]) => {
      const req = originalHttpsRequest.apply(https, args);
      this.instrumentRequest(req, 'https');
      return req;
    };
  }

  private instrumentRequest(req: any, protocol: string): void {
    const startTime = Date.now();

    req.on('response', (res: any) => {
      const duration = Date.now() - startTime;

      this.emit('security.api_call', {
        timestamp: startTime,
        method: req.method,
        url: `${protocol}://${req.getHeader('host')}${req.path}`,
        headers: req.getHeaders(),
        response: {
          status: res.statusCode,
          headers: res.headers,
        },
        duration,
      });
    });
  }

  private installFileSystemHooks(): void {
    const fs = require('fs');
    const originalReadFile = fs.readFile;
    const originalWriteFile = fs.writeFile;
    const originalUnlink = fs.unlink;

    fs.readFile = (...args: any[]) => {
      this.emit('security.file_access', {
        timestamp: Date.now(),
        operation: 'read',
        path: args[0],
      });
      return originalReadFile.apply(fs, args);
    };

    fs.writeFile = (...args: any[]) => {
      this.emit('security.file_access', {
        timestamp: Date.now(),
        operation: 'write',
        path: args[0],
      });
      return originalWriteFile.apply(fs, args);
    };
  }

  private installProcessHooks(): void {
    const originalSpawn = require('child_process').spawn;

    require('child_process').spawn = (...args: any[]) => {
      this.emit('security.process_spawn', {
        timestamp: Date.now(),
        command: args[0],
        arguments: args[1],
        options: args[2],
      });
      return originalSpawn.apply(require('child_process'), args);
    };
  }

  public async runJestWithInstrumentation(
    testFiles?: string[]
  ): Promise<TestMetrics> {
    const testRunId = this.generateTestRunId();
    this.currentTestRun = testRunId;

    try {
      performance.mark('jest-start');

      // Start performance profiling if enabled
      let cpuProfile: any;
      if (this.config.enablePerformanceProfiling) {
        cpuProfile = await this.startCPUProfiling();
      }

      // Start memory tracking
      if (this.config.enableMemoryTracking) {
        this.startMemoryTracking();
      }

      // Run Jest with instrumentation
      const jestResult = await this.executeJestWithInstrumentation(testFiles);

      performance.mark('jest-end');
      performance.measure('jest-execution', 'jest-start', 'jest-end');

      // Stop profiling
      if (cpuProfile) {
        await this.stopCPUProfiling();
      }

      if (this.memoryTracker) {
        clearInterval(this.memoryTracker);
      }

      // Collect and process metrics
      const metrics = await this.collectTestMetrics(
        testRunId,
        'jest',
        jestResult
      );

      // Send data to engine
      await this.sendDataToEngine(metrics);

      return metrics;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async runCypressWithInstrumentation(
    specFiles?: string[]
  ): Promise<TestMetrics> {
    const testRunId = this.generateTestRunId();
    this.currentTestRun = testRunId;

    try {
      performance.mark('cypress-start');

      // Start performance profiling if enabled
      let cpuProfile: any;
      if (this.config.enablePerformanceProfiling) {
        cpuProfile = await this.startCPUProfiling();
      }

      // Start memory tracking
      if (this.config.enableMemoryTracking) {
        this.startMemoryTracking();
      }

      // Run Cypress with instrumentation
      const cypressResult =
        await this.executeCypressWithInstrumentation(specFiles);

      performance.mark('cypress-end');
      performance.measure('cypress-execution', 'cypress-start', 'cypress-end');

      // Stop profiling
      if (cpuProfile) {
        await this.stopCPUProfiling();
      }

      if (this.memoryTracker) {
        clearInterval(this.memoryTracker);
      }

      // Collect and process metrics
      const metrics = await this.collectTestMetrics(
        testRunId,
        'cypress',
        cypressResult
      );

      // Send data to engine
      await this.sendDataToEngine(metrics);

      return metrics;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async executeJestWithInstrumentation(
    testFiles?: string[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const jestArgs = this.buildJestArgs(testFiles);
      const jestProcess = spawn('npx', ['jest', ...jestArgs], {
        cwd: this.config.projectPath,
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_OPTIONS: '--enable-source-maps --max-old-space-size=4096',
          JEST_WORKER_ID: '1', // Force single worker for instrumentation
        },
      });

      let stdout = '';
      let stderr = '';

      jestProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
        this.emit('jest.output', data.toString());
      });

      jestProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
        this.emit('jest.error', data.toString());
      });

      jestProcess.on('close', (code) => {
        const result = {
          exitCode: code,
          stdout,
          stderr,
          success: code === 0,
        };

        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Jest failed with exit code ${code}: ${stderr}`));
        }
      });
    });
  }

  private async executeCypressWithInstrumentation(
    specFiles?: string[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const cypressArgs = this.buildCypressArgs(specFiles);
      const cypressProcess = spawn('npx', ['cypress', 'run', ...cypressArgs], {
        cwd: this.config.projectPath,
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_OPTIONS: '--enable-source-maps --max-old-space-size=4096',
        },
      });

      let stdout = '';
      let stderr = '';

      cypressProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
        this.emit('cypress.output', data.toString());
      });

      cypressProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
        this.emit('cypress.error', data.toString());
      });

      cypressProcess.on('close', (code) => {
        const result = {
          exitCode: code,
          stdout,
          stderr,
          success: code === 0,
        };

        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Cypress failed with exit code ${code}: ${stderr}`));
        }
      });
    });
  }

  private buildJestArgs(testFiles?: string[]): string[] {
    const args: string[] = [];

    if (this.config.jestConfig?.configFile) {
      args.push('--config', this.config.jestConfig.configFile);
    }

    if (this.config.enableCoverage) {
      args.push('--coverage');
      args.push(
        '--coverageDirectory',
        path.join(this.config.outputPath!, 'coverage')
      );
      args.push('--coverageReporters', 'json', 'lcov', 'text', 'html');
    }

    if (this.config.jestConfig?.maxWorkers) {
      args.push('--maxWorkers', this.config.jestConfig.maxWorkers.toString());
    }

    if (this.config.jestConfig?.timeout) {
      args.push('--testTimeout', this.config.jestConfig.timeout.toString());
    }

    args.push('--verbose');
    args.push('--json');

    if (testFiles && testFiles.length > 0) {
      args.push(...testFiles);
    }

    return args;
  }

  private buildCypressArgs(specFiles?: string[]): string[] {
    const args: string[] = [];

    if (this.config.cypressConfig?.configFile) {
      args.push('--config-file', this.config.cypressConfig.configFile);
    }

    if (this.config.cypressConfig?.browser) {
      args.push('--browser', this.config.cypressConfig.browser);
    }

    if (this.config.cypressConfig?.headless !== false) {
      args.push('--headless');
    }

    if (this.config.cypressConfig?.video !== false) {
      args.push('--record', 'false'); // Disable cloud recording by default
    }

    args.push('--reporter', 'json');
    args.push(
      '--reporter-options',
      `output=${path.join(this.config.outputPath!, 'cypress-results.json')}`
    );

    if (specFiles && specFiles.length > 0) {
      args.push('--spec', specFiles.join(','));
    }

    return args;
  }

  private async startCPUProfiling(): Promise<any> {
    if (!this.inspectorSession) {
      this.inspectorSession = new inspector.Session();
      this.inspectorSession.connect();
    }

    return new Promise((resolve, reject) => {
      this.inspectorSession!.post('Profiler.enable', () => {
        this.inspectorSession!.post('Profiler.start', (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
    });
  }

  private async stopCPUProfiling(): Promise<any> {
    if (!this.inspectorSession) return null;

    return new Promise((resolve, reject) => {
      this.inspectorSession!.post('Profiler.stop', (err, result) => {
        if (err) {
          reject(err);
        } else {
          // Save CPU profile
          const profilePath = path.join(
            this.config.outputPath!,
            `cpu-profile-${this.currentTestRun}.json`
          );
          fs.writeFileSync(
            profilePath,
            JSON.stringify(result.profile, null, 2)
          );
          resolve(result.profile);
        }
      });
    });
  }

  private startMemoryTracking(): void {
    const initialMemory = process.memoryUsage();
    this.performanceSamples = [
      {
        timestamp: Date.now(),
        cpuUsage: process.cpuUsage(),
        memoryUsage: initialMemory,
      },
    ];

    this.memoryTracker = setInterval(() => {
      this.performanceSamples.push({
        timestamp: Date.now(),
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
      });
    }, 1000); // Sample every second
  }

  private async collectTestMetrics(
    testRunId: string,
    framework: 'jest' | 'cypress',
    testResult: any
  ): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      testRun: {
        id: testRunId,
        timestamp: new Date().toISOString(),
        duration: this.getTestDuration(),
        framework,
        status: testResult.success ? 'passed' : 'failed',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
      },
    };

    // Collect coverage if enabled
    if (this.config.enableCoverage) {
      metrics.coverage = await this.collectCoverageData();
    }

    // Collect performance data if enabled
    if (this.config.enablePerformanceProfiling) {
      metrics.performance = await this.collectPerformanceData();
    }

    // Collect security data if enabled
    if (this.config.enableSecurityProbes) {
      metrics.security = await this.collectSecurityData();
    }

    // Collect memory data if enabled
    if (this.config.enableMemoryTracking) {
      metrics.memory = await this.collectMemoryData();
    }

    // Parse test results
    await this.parseTestResults(metrics, testResult, framework);

    // Save metrics to file
    const metricsPath = path.join(
      this.config.outputPath!,
      `metrics-${testRunId}.json`
    );
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

    this.metrics.push(metrics);
    this.emit('metrics.collected', metrics);

    return metrics;
  }

  private getTestDuration(): number {
    const measures = performance.getEntriesByType('measure');
    const testMeasure = measures.find(
      (m) =>
        m.name.includes('jest-execution') ||
        m.name.includes('cypress-execution')
    );
    return testMeasure ? testMeasure.duration : 0;
  }

  private async collectCoverageData(): Promise<CoverageReport | undefined> {
    const coveragePath = path.join(
      this.config.outputPath!,
      'coverage',
      'coverage-final.json'
    );

    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return this.processCoverageData(coverage);
    }

    return undefined;
  }

  private processCoverageData(rawCoverage: any): CoverageReport {
    // Process Istanbul coverage format
    const files: Record<string, any> = {};
    let globalStats = { statements: 0, branches: 0, functions: 0, lines: 0 };
    let globalTotal = { statements: 0, branches: 0, functions: 0, lines: 0 };

    for (const [filePath, fileCoverage] of Object.entries(rawCoverage)) {
      const fileStats = this.calculateFileCoverage(fileCoverage as any);
      files[filePath] = fileStats;

      // Aggregate global stats
      globalStats.statements += fileStats.statements.covered;
      globalStats.branches += fileStats.branches.covered;
      globalStats.functions += fileStats.functions.covered;
      globalStats.lines += fileStats.lines.covered;

      globalTotal.statements += fileStats.statements.total;
      globalTotal.branches += fileStats.branches.total;
      globalTotal.functions += fileStats.functions.total;
      globalTotal.lines += fileStats.lines.total;
    }

    return {
      global: {
        statements: {
          pct: (globalStats.statements / globalTotal.statements) * 100,
          covered: globalStats.statements,
          total: globalTotal.statements,
        },
        branches: {
          pct: (globalStats.branches / globalTotal.branches) * 100,
          covered: globalStats.branches,
          total: globalTotal.branches,
        },
        functions: {
          pct: (globalStats.functions / globalTotal.functions) * 100,
          covered: globalStats.functions,
          total: globalTotal.functions,
        },
        lines: {
          pct: (globalStats.lines / globalTotal.lines) * 100,
          covered: globalStats.lines,
          total: globalTotal.lines,
        },
      },
      files,
    };
  }

  private calculateFileCoverage(fileCoverage: any): any {
    const statements = Object.keys(fileCoverage.s || {});
    const branches = Object.keys(fileCoverage.b || {});
    const functions = Object.keys(fileCoverage.f || {});
    const lines = Object.keys(fileCoverage.l || {});

    const coveredStatements = statements.filter(
      (s) => fileCoverage.s[s] > 0
    ).length;
    const coveredBranches = branches.filter((b) =>
      fileCoverage.b[b].some((count: number) => count > 0)
    ).length;
    const coveredFunctions = functions.filter(
      (f) => fileCoverage.f[f] > 0
    ).length;
    const coveredLines = lines.filter((l) => fileCoverage.l[l] > 0).length;

    return {
      statements: {
        pct: (coveredStatements / statements.length) * 100,
        covered: coveredStatements,
        total: statements.length,
      },
      branches: {
        pct: (coveredBranches / branches.length) * 100,
        covered: coveredBranches,
        total: branches.length,
      },
      functions: {
        pct: (coveredFunctions / functions.length) * 100,
        covered: coveredFunctions,
        total: functions.length,
      },
      lines: {
        pct: (coveredLines / lines.length) * 100,
        covered: coveredLines,
        total: lines.length,
      },
    };
  }

  private async collectPerformanceData(): Promise<PerformanceReport> {
    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    const setupTime =
      marks.find((m) => m.name.includes('setup'))?.duration || 0;
    const teardownTime =
      marks.find((m) => m.name.includes('teardown'))?.duration || 0;
    const executionTime =
      measures.find((m) => m.name.includes('execution'))?.duration || 0;

    return {
      timing: {
        testSetupTime: setupTime,
        testExecutionTime: executionTime,
        testTeardownTime: teardownTime,
        totalTime: setupTime + executionTime + teardownTime,
      },
      samples: this.performanceSamples,
    };
  }

  private async collectSecurityData(): Promise<SecurityReport> {
    // Collect security events from our probes
    return {
      vulnerabilities: [],
      suspiciousActivities: [],
      apiCalls: [],
      fileSystemAccess: [],
    };
  }

  private async collectMemoryData(): Promise<MemoryReport> {
    const samples = this.performanceSamples;
    const initial = samples[0]?.memoryUsage || process.memoryUsage();
    const final =
      samples[samples.length - 1]?.memoryUsage || process.memoryUsage();

    const peak = samples.reduce((max, sample) => {
      return sample.memoryUsage.heapUsed > max.heapUsed
        ? sample.memoryUsage
        : max;
    }, initial);

    return {
      initial,
      peak,
      final,
      leaks: [], // Would require more sophisticated analysis
      gcStats: [], // Would require GC hooks
    };
  }

  private async parseTestResults(
    metrics: TestMetrics,
    testResult: any,
    framework: 'jest' | 'cypress'
  ): Promise<void> {
    if (framework === 'jest') {
      // Parse Jest JSON output
      try {
        const jestOutput = JSON.parse(testResult.stdout);
        metrics.testRun.totalTests = jestOutput.numTotalTests || 0;
        metrics.testRun.passedTests = jestOutput.numPassedTests || 0;
        metrics.testRun.failedTests = jestOutput.numFailedTests || 0;
        metrics.testRun.skippedTests = jestOutput.numPendingTests || 0;
      } catch (error) {
        // Fallback parsing from stdout
        this.parseJestTextOutput(metrics, testResult.stdout);
      }
    } else if (framework === 'cypress') {
      // Parse Cypress JSON output
      const resultsPath = path.join(
        this.config.outputPath!,
        'cypress-results.json'
      );
      if (fs.existsSync(resultsPath)) {
        const cypressResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        this.parseCypressResults(metrics, cypressResults);
      }
    }
  }

  private parseJestTextOutput(metrics: TestMetrics, output: string): void {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) failed, (\d+) passed, (\d+) total/);
        if (match) {
          metrics.testRun.failedTests = parseInt(match[1]);
          metrics.testRun.passedTests = parseInt(match[2]);
          metrics.testRun.totalTests = parseInt(match[3]);
        }
      }
    }
  }

  private parseCypressResults(metrics: TestMetrics, results: any): void {
    if (results.stats) {
      metrics.testRun.totalTests = results.stats.tests || 0;
      metrics.testRun.passedTests = results.stats.passes || 0;
      metrics.testRun.failedTests = results.stats.failures || 0;
      metrics.testRun.skippedTests = results.stats.pending || 0;
    }
  }

  private async sendDataToEngine(metrics: TestMetrics): Promise<void> {
    if (this.config.dataCollectionEndpoint) {
      try {
        const response = await fetch(this.config.dataCollectionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metrics),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to send data to engine: ${response.statusText}`
          );
        }

        this.emit('data.sent', {
          metrics,
          endpoint: this.config.dataCollectionEndpoint,
        });
      } catch (error) {
        this.emit('data.send_error', error);
        // Save to local file as fallback
        const fallbackPath = path.join(
          this.config.outputPath!,
          `unsent-metrics-${Date.now()}.json`
        );
        fs.writeFileSync(fallbackPath, JSON.stringify(metrics, null, 2));
      }
    }
  }

  private generateTestRunId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getMetrics(): TestMetrics[] {
    return [...this.metrics];
  }

  public async cleanup(): Promise<void> {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.inspectorSession) {
      this.inspectorSession.disconnect();
    }

    if (this.memoryTracker) {
      clearInterval(this.memoryTracker);
    }
  }
}
