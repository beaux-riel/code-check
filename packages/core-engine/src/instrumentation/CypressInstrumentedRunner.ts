import {
  TestInstrumentationEngine,
  TestInstrumentationConfig,
  TestMetrics,
} from './TestInstrumentationEngine';
import * as fs from 'fs';
import * as path from 'path';

export interface CypressRunnerConfig extends TestInstrumentationConfig {
  cypressConfigOverrides?: {
    baseUrl?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    defaultCommandTimeout?: number;
    requestTimeout?: number;
    responseTimeout?: number;
    pageLoadTimeout?: number;
    video?: boolean;
    screenshotOnRunFailure?: boolean;
    trashAssetsBeforeRuns?: boolean;
  };
  performanceThresholds?: {
    loadTime?: number;
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  securitySettings?: {
    trackNetworkRequests?: boolean;
    scanForVulnerabilities?: boolean;
    detectMaliciousScripts?: boolean;
    monitorDataExfiltration?: boolean;
  };
}

export interface CypressTestMetrics extends TestMetrics {
  browser?: {
    name: string;
    version: string;
    path: string;
  };
  performance?: {
    timing: {
      testSetupTime: number;
      testExecutionTime: number;
      testTeardownTime: number;
      totalTime: number;
    };
    webVitals?: WebVitalsMetrics[];
    networkRequests?: NetworkRequest[];
    resourceTimings?: ResourceTiming[];
  };
  security?: {
    vulnerabilities: any[];
    suspiciousActivities: any[];
    networkAnalysis: NetworkSecurityAnalysis;
    contentSecurityPolicy?: CSPViolation[];
  };
  accessibility?: AccessibilityReport;
  screenshots?: ScreenshotData[];
  videos?: VideoData[];
}

export interface WebVitalsMetrics {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface NetworkRequest {
  timestamp: number;
  method: string;
  url: string;
  status: number;
  duration: number;
  size: {
    request: number;
    response: number;
  };
  headers: {
    request: Record<string, string>;
    response: Record<string, string>;
  };
  type: string;
  cached: boolean;
}

export interface ResourceTiming {
  name: string;
  startTime: number;
  duration: number;
  size: number;
  type: string;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface NetworkSecurityAnalysis {
  insecureRequests: NetworkRequest[];
  mixedContent: NetworkRequest[];
  suspiciousHeaders: Array<{
    url: string;
    header: string;
    value: string;
    reason: string;
  }>;
  largeResponses: NetworkRequest[];
  slowRequests: NetworkRequest[];
}

export interface CSPViolation {
  blockedURI: string;
  disposition: string;
  documentURI: string;
  effectiveDirective: string;
  originalPolicy: string;
  sourceFile: string;
  statusCode: number;
  violatedDirective: string;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: AccessibilityCheck[];
  incomplete: AccessibilityCheck[];
  summary: {
    total: number;
    violations: number;
    passes: number;
    incomplete: number;
  };
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

export interface AccessibilityCheck {
  id: string;
  description: string;
  help: string;
  nodes: Array<{
    target: string[];
    html: string;
  }>;
}

export interface ScreenshotData {
  name: string;
  path: string;
  timestamp: number;
  testName: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface VideoData {
  name: string;
  path: string;
  timestamp: number;
  duration: number;
  size: number;
  specs: string[];
}

export class CypressInstrumentedRunner extends TestInstrumentationEngine {
  private cypressConfig: any;
  private performanceThresholds: Required<
    CypressRunnerConfig['performanceThresholds']
  >;
  private securitySettings: Required<CypressRunnerConfig['securitySettings']>;

  constructor(config: CypressRunnerConfig) {
    super(config);

    this.performanceThresholds = {
      loadTime: 3000,
      domContentLoaded: 2000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      ...config.performanceThresholds,
    };

    this.securitySettings = {
      trackNetworkRequests: true,
      scanForVulnerabilities: true,
      detectMaliciousScripts: true,
      monitorDataExfiltration: true,
      ...config.securitySettings,
    };

    this.generateInstrumentedCypressConfig(config);
  }

  private generateInstrumentedCypressConfig(config: CypressRunnerConfig): void {
    // Load existing Cypress config or create a new one
    const existingConfig = this.loadExistingCypressConfig(config.projectPath);

    this.cypressConfig = {
      ...existingConfig,
      // Override with instrumentation settings
      video: config.cypressConfig?.video !== false,
      screenshotOnRunFailure: config.cypressConfig?.screenshots !== false,
      videosFolder: path.join(config.outputPath!, 'videos'),
      screenshotsFolder: path.join(config.outputPath!, 'screenshots'),

      // Performance and debugging
      trashAssetsBeforeRuns: true,
      watchForFileChanges: false,

      // Custom commands and plugins
      setupNodeEvents: this.createSetupNodeEvents(),
      supportFile: this.createSupportFile(),

      // Timeouts for instrumentation
      defaultCommandTimeout: 10000,
      requestTimeout: 10000,
      responseTimeout: 10000,
      pageLoadTimeout: 30000,

      // Apply overrides
      ...config.cypressConfigOverrides,

      // Environment variables for instrumentation
      env: {
        ...existingConfig.env,
        ...config.cypressConfigOverrides?.env,
        INSTRUMENTATION_ENABLED: true,
        PERFORMANCE_TRACKING: config.enablePerformanceProfiling,
        SECURITY_SCANNING: config.enableSecurityProbes,
        OUTPUT_PATH: config.outputPath,
      },
    };

    // Save the instrumented config
    const configPath = path.join(
      config.outputPath!,
      'cypress.instrumented.config.js'
    );
    this.saveCypressConfig(configPath);
  }

  private loadExistingCypressConfig(projectPath: string): any {
    const possibleConfigs = [
      'cypress.config.js',
      'cypress.config.ts',
      'cypress.config.json',
    ];

    for (const configFile of possibleConfigs) {
      const configPath = path.join(projectPath, configFile);
      if (fs.existsSync(configPath)) {
        if (configFile.endsWith('.json')) {
          return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } else {
          // For .js/.ts files, we'll use a basic config
          return {};
        }
      }
    }

    return {};
  }

  private createSetupNodeEvents(): string {
    const setupPath = path.join(
      this.config.outputPath!,
      'cypress-node-events.js'
    );

    const setupContent = `
const fs = require('fs');
const path = require('path');

module.exports = (on, config) => {
  // Performance monitoring task
  on('task', {
    recordPerformanceMetrics(metrics) {
      const metricsPath = path.join('${this.config.outputPath}', 'performance-metrics.json');
      const existingMetrics = fs.existsSync(metricsPath) 
        ? JSON.parse(fs.readFileSync(metricsPath, 'utf8')) 
        : [];
      
      existingMetrics.push({
        timestamp: Date.now(),
        ...metrics
      });
      
      fs.writeFileSync(metricsPath, JSON.stringify(existingMetrics, null, 2));
      return null;
    },

    recordNetworkActivity(networkData) {
      const networkPath = path.join('${this.config.outputPath}', 'network-activity.json');
      const existingData = fs.existsSync(networkPath) 
        ? JSON.parse(fs.readFileSync(networkPath, 'utf8')) 
        : [];
      
      existingData.push({
        timestamp: Date.now(),
        ...networkData
      });
      
      fs.writeFileSync(networkPath, JSON.stringify(existingData, null, 2));
      return null;
    },

    recordSecurityEvent(eventData) {
      const securityPath = path.join('${this.config.outputPath}', 'security-events.json');
      const existingEvents = fs.existsSync(securityPath) 
        ? JSON.parse(fs.readFileSync(securityPath, 'utf8')) 
        : [];
      
      existingEvents.push({
        timestamp: Date.now(),
        ...eventData
      });
      
      fs.writeFileSync(securityPath, JSON.stringify(existingEvents, null, 2));
      return null;
    },

    recordAccessibilityResults(a11yResults) {
      const a11yPath = path.join('${this.config.outputPath}', 'accessibility-results.json');
      const existingResults = fs.existsSync(a11yPath) 
        ? JSON.parse(fs.readFileSync(a11yPath, 'utf8')) 
        : [];
      
      existingResults.push({
        timestamp: Date.now(),
        ...a11yResults
      });
      
      fs.writeFileSync(a11yPath, JSON.stringify(existingResults, null, 2));
      return null;
    }
  });

  // Browser launch options for instrumentation
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome') {
      launchOptions.args.push('--enable-precise-memory-info');
      launchOptions.args.push('--enable-performance-manager-debug-mode');
      launchOptions.args.push('--enable-logging');
      launchOptions.args.push('--log-level=0');
    }
    
    return launchOptions;
  });

  // Test failure handling
  on('after:screenshot', (details) => {
    const screenshotData = {
      name: details.name,
      path: details.path,
      timestamp: Date.now(),
      testName: details.testName || 'unknown',
      size: fs.statSync(details.path).size,
      dimensions: details.dimensions
    };
    
    const screenshotsPath = path.join('${this.config.outputPath}', 'screenshot-metadata.json');
    const existingScreenshots = fs.existsSync(screenshotsPath) 
      ? JSON.parse(fs.readFileSync(screenshotsPath, 'utf8')) 
      : [];
    
    existingScreenshots.push(screenshotData);
    fs.writeFileSync(screenshotsPath, JSON.stringify(existingScreenshots, null, 2));
  });

  return config;
};
`;

    fs.writeFileSync(setupPath, setupContent);
    return setupPath;
  }

  private createSupportFile(): string {
    const supportPath = path.join(
      this.config.outputPath!,
      'cypress-support.js'
    );

    const supportContent = `
import 'cypress-axe';

// Performance monitoring
Cypress.Commands.add('measurePerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    
    const metrics = {
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstPaint: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null
    };

    // Get paint metrics if available
    if ('getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });
    }

    // Get LCP if available
    if ('PerformanceObserver' in win && 'largest-contentful-paint' in win.PerformanceObserver.supportedEntryTypes) {
      const observer = new win.PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.largestContentfulPaint = entries[entries.length - 1].startTime;
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    cy.task('recordPerformanceMetrics', {
      url: win.location.href,
      metrics,
      resources: resources.map(resource => ({
        name: resource.name,
        startTime: resource.startTime,
        duration: resource.duration,
        size: resource.transferSize || 0,
        type: resource.initiatorType
      }))
    });
  });
});

// Network monitoring
Cypress.Commands.add('interceptNetworkRequests', () => {
  cy.intercept({ resourceType: /xhr|fetch/ }, (req) => {
    const startTime = Date.now();
    
    req.continue((res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      cy.task('recordNetworkActivity', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        headers: {
          request: req.headers,
          response: res.headers
        },
        size: {
          request: JSON.stringify(req.body || {}).length,
          response: JSON.stringify(res.body || {}).length
        }
      });
    });
  });
});

// Security monitoring
Cypress.Commands.add('scanForSecurityIssues', () => {
  cy.window().then((win) => {
    const securityIssues = [];
    
    // Check for mixed content
    if (win.location.protocol === 'https:') {
      const resources = win.performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.startsWith('http:')) {
          securityIssues.push({
            type: 'mixed-content',
            url: resource.name,
            severity: 'medium'
          });
        }
      });
    }
    
    // Check for inline scripts (basic detection)
    const scripts = win.document.querySelectorAll('script:not([src])');
    if (scripts.length > 0) {
      securityIssues.push({
        type: 'inline-scripts',
        count: scripts.length,
        severity: 'low'
      });
    }
    
    // Check for missing security headers
    cy.request(win.location.href).then((response) => {
      const headers = response.headers;
      const missingHeaders = [];
      
      if (!headers['content-security-policy']) {
        missingHeaders.push('content-security-policy');
      }
      if (!headers['x-frame-options']) {
        missingHeaders.push('x-frame-options');
      }
      if (!headers['x-content-type-options']) {
        missingHeaders.push('x-content-type-options');
      }
      
      if (missingHeaders.length > 0) {
        securityIssues.push({
          type: 'missing-security-headers',
          headers: missingHeaders,
          severity: 'medium'
        });
      }
      
      if (securityIssues.length > 0) {
        cy.task('recordSecurityEvent', {
          url: win.location.href,
          issues: securityIssues
        });
      }
    });
  });
});

// Accessibility testing
Cypress.Commands.add('checkAccessibility', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    if (violations.length > 0) {
      cy.task('recordAccessibilityResults', {
        url: Cypress.config('baseUrl') || window.location.href,
        violations: violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary
          }))
        }))
      });
    }
  });
});

// Enhanced error handling and reporting
Cypress.on('fail', (error, runnable) => {
  const errorData = {
    testTitle: runnable.title,
    testFile: runnable.file,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    timestamp: Date.now()
  };
  
  cy.task('recordSecurityEvent', {
    type: 'test-failure',
    ...errorData
  });
  
  throw error;
});

// Setup hooks for instrumentation
beforeEach(() => {
  if (Cypress.env('PERFORMANCE_TRACKING')) {
    cy.interceptNetworkRequests();
  }
});

afterEach(() => {
  if (Cypress.env('PERFORMANCE_TRACKING')) {
    cy.measurePerformance();
  }
  
  if (Cypress.env('SECURITY_SCANNING')) {
    cy.scanForSecurityIssues();
  }
});
`;

    fs.writeFileSync(supportPath, supportContent);
    return supportPath;
  }

  private saveCypressConfig(configPath: string): void {
    const configContent = `
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: ${JSON.stringify(this.cypressConfig, null, 4)}
});
`;
    fs.writeFileSync(configPath, configContent);
  }

  public async runInstrumentedTests(
    specFiles?: string[]
  ): Promise<CypressTestMetrics> {
    console.log('🚀 Starting instrumented Cypress test run...');

    // Update Cypress config file reference
    this.config.cypressConfig = {
      ...this.config.cypressConfig,
      configFile: path.join(
        this.config.outputPath!,
        'cypress.instrumented.config.js'
      ),
    };

    const baseMetrics = await this.runCypressWithInstrumentation(specFiles);

    // Load additional Cypress-specific data
    const enhancedMetrics = await this.enhanceWithCypressMetrics(baseMetrics);

    return enhancedMetrics;
  }

  private async enhanceWithCypressMetrics(
    baseMetrics: TestMetrics
  ): Promise<CypressTestMetrics> {
    const cypressMetrics: CypressTestMetrics = {
      ...baseMetrics,
      browser: await this.getBrowserInfo(),
      performance: await this.loadPerformanceMetrics(),
      security: await this.loadSecurityMetrics(),
      accessibility: await this.loadAccessibilityResults(),
      screenshots: await this.loadScreenshotData(),
      videos: await this.loadVideoData(),
    };

    return cypressMetrics;
  }

  private async getBrowserInfo(): Promise<any> {
    // This would typically be extracted from Cypress run results
    return {
      name: 'chrome',
      version: '120.0.0',
      path: '/usr/bin/google-chrome',
    };
  }

  private async loadPerformanceMetrics(): Promise<any> {
    const metricsPath = path.join(
      this.config.outputPath!,
      'performance-metrics.json'
    );

    if (!fs.existsSync(metricsPath)) {
      return undefined;
    }

    const rawMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));

    return {
      timing: this.calculateTimingMetrics(rawMetrics),
      webVitals: this.processWebVitals(rawMetrics),
      networkRequests: await this.loadNetworkData(),
      resourceTimings: this.processResourceTimings(rawMetrics),
    };
  }

  private calculateTimingMetrics(rawMetrics: any[]): any {
    if (rawMetrics.length === 0) {
      return {
        testSetupTime: 0,
        testExecutionTime: 0,
        testTeardownTime: 0,
        totalTime: 0,
      };
    }

    const totalLoadTime = rawMetrics.reduce((sum, metric) => {
      return sum + (metric.metrics?.loadComplete || 0);
    }, 0);

    return {
      testSetupTime: 100, // Estimated
      testExecutionTime: totalLoadTime,
      testTeardownTime: 50, // Estimated
      totalTime: totalLoadTime + 150,
    };
  }

  private processWebVitals(rawMetrics: any[]): WebVitalsMetrics[] {
    const webVitals: WebVitalsMetrics[] = [];

    rawMetrics.forEach((metric) => {
      if (metric.metrics) {
        if (metric.metrics.firstContentfulPaint) {
          webVitals.push({
            name: 'FCP',
            value: metric.metrics.firstContentfulPaint,
            delta: 0,
            id: `fcp-${Date.now()}`,
            rating:
              metric.metrics.firstContentfulPaint <
              this.performanceThresholds.firstContentfulPaint
                ? 'good'
                : 'poor',
          });
        }

        if (metric.metrics.largestContentfulPaint) {
          webVitals.push({
            name: 'LCP',
            value: metric.metrics.largestContentfulPaint,
            delta: 0,
            id: `lcp-${Date.now()}`,
            rating:
              metric.metrics.largestContentfulPaint <
              this.performanceThresholds.largestContentfulPaint
                ? 'good'
                : 'poor',
          });
        }
      }
    });

    return webVitals;
  }

  private async loadNetworkData(): Promise<NetworkRequest[]> {
    const networkPath = path.join(
      this.config.outputPath!,
      'network-activity.json'
    );

    if (!fs.existsSync(networkPath)) {
      return [];
    }

    const rawData = JSON.parse(fs.readFileSync(networkPath, 'utf8'));

    return rawData.map((request: any) => ({
      timestamp: request.timestamp,
      method: request.method,
      url: request.url,
      status: request.status,
      duration: request.duration,
      size: request.size,
      headers: request.headers,
      type: 'fetch',
      cached: false,
    }));
  }

  private processResourceTimings(rawMetrics: any[]): ResourceTiming[] {
    const resources: ResourceTiming[] = [];

    rawMetrics.forEach((metric) => {
      if (metric.resources) {
        metric.resources.forEach((resource: any) => {
          resources.push({
            name: resource.name,
            startTime: resource.startTime,
            duration: resource.duration,
            size: resource.size,
            type: resource.type,
            transferSize: resource.size,
            encodedBodySize: resource.size,
            decodedBodySize: resource.size,
          });
        });
      }
    });

    return resources;
  }

  private async loadSecurityMetrics(): Promise<any> {
    const securityPath = path.join(
      this.config.outputPath!,
      'security-events.json'
    );

    if (!fs.existsSync(securityPath)) {
      return {
        vulnerabilities: [],
        suspiciousActivities: [],
        networkAnalysis: this.analyzeNetworkSecurity([]),
        contentSecurityPolicy: [],
      };
    }

    const securityEvents = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
    const networkRequests = await this.loadNetworkData();

    return {
      vulnerabilities: this.extractVulnerabilities(securityEvents),
      suspiciousActivities: this.extractSuspiciousActivities(securityEvents),
      networkAnalysis: this.analyzeNetworkSecurity(networkRequests),
      contentSecurityPolicy: this.extractCSPViolations(securityEvents),
    };
  }

  private extractVulnerabilities(securityEvents: any[]): any[] {
    return securityEvents
      .filter((event) => event.issues)
      .flatMap((event) => event.issues)
      .filter(
        (issue) => issue.severity === 'high' || issue.severity === 'critical'
      );
  }

  private extractSuspiciousActivities(securityEvents: any[]): any[] {
    return securityEvents
      .filter((event) => event.type === 'suspicious-activity')
      .map((event) => ({
        id: `activity-${event.timestamp}`,
        timestamp: event.timestamp,
        type: 'network',
        description:
          event.description || 'Suspicious network activity detected',
        details: event,
        riskLevel: event.severity || 'medium',
      }));
  }

  private analyzeNetworkSecurity(
    networkRequests: NetworkRequest[]
  ): NetworkSecurityAnalysis {
    const insecureRequests = networkRequests.filter(
      (req) =>
        req.url.startsWith('http:') && !req.url.startsWith('http://localhost')
    );

    const mixedContent = networkRequests.filter(
      (req) =>
        req.url.startsWith('http:') && window.location?.protocol === 'https:'
    );

    const largeResponses = networkRequests.filter(
      (req) => req.size.response > 1024 * 1024 // > 1MB
    );

    const slowRequests = networkRequests.filter(
      (req) => req.duration > 5000 // > 5 seconds
    );

    return {
      insecureRequests,
      mixedContent,
      suspiciousHeaders: [],
      largeResponses,
      slowRequests,
    };
  }

  private extractCSPViolations(securityEvents: any[]): CSPViolation[] {
    return securityEvents
      .filter((event) => event.type === 'csp-violation')
      .map((event) => event.violation);
  }

  private async loadAccessibilityResults(): Promise<AccessibilityReport> {
    const a11yPath = path.join(
      this.config.outputPath!,
      'accessibility-results.json'
    );

    if (!fs.existsSync(a11yPath)) {
      return {
        violations: [],
        passes: [],
        incomplete: [],
        summary: {
          total: 0,
          violations: 0,
          passes: 0,
          incomplete: 0,
        },
      };
    }

    const a11yData = JSON.parse(fs.readFileSync(a11yPath, 'utf8'));
    const violations = a11yData.flatMap(
      (result: any) => result.violations || []
    );

    return {
      violations,
      passes: [],
      incomplete: [],
      summary: {
        total: violations.length,
        violations: violations.length,
        passes: 0,
        incomplete: 0,
      },
    };
  }

  private async loadScreenshotData(): Promise<ScreenshotData[]> {
    const screenshotsPath = path.join(
      this.config.outputPath!,
      'screenshot-metadata.json'
    );

    if (!fs.existsSync(screenshotsPath)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(screenshotsPath, 'utf8'));
  }

  private async loadVideoData(): Promise<VideoData[]> {
    const videosDir = path.join(this.config.outputPath!, 'videos');

    if (!fs.existsSync(videosDir)) {
      return [];
    }

    const videoFiles = fs
      .readdirSync(videosDir)
      .filter((file) => file.endsWith('.mp4'));

    return videoFiles.map((file) => {
      const filePath = path.join(videosDir, file);
      const stats = fs.statSync(filePath);

      return {
        name: file,
        path: filePath,
        timestamp: stats.mtime.getTime(),
        duration: 0, // Would need video analysis to get actual duration
        size: stats.size,
        specs: [file.replace('.mp4', '')],
      };
    });
  }

  public async generateComprehensiveReport(): Promise<void> {
    console.log('📊 Generating comprehensive Cypress report...');

    const reportData = {
      summary: await this.generateTestSummary(),
      performance: await this.generatePerformanceReport(),
      security: await this.generateSecurityReport(),
      accessibility: await this.generateAccessibilityReport(),
      recommendations: await this.generateRecommendations(),
    };

    const reportPath = path.join(
      this.config.outputPath!,
      'comprehensive-report.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(reportData);

    console.log('✅ Comprehensive report generated at:', reportPath);
  }

  private async generateTestSummary(): Promise<any> {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return {};

    const latestMetrics = metrics[metrics.length - 1];

    return {
      totalTests: latestMetrics.testRun.totalTests,
      passedTests: latestMetrics.testRun.passedTests,
      failedTests: latestMetrics.testRun.failedTests,
      duration: latestMetrics.testRun.duration,
      framework: latestMetrics.testRun.framework,
    };
  }

  private async generatePerformanceReport(): Promise<any> {
    const performanceData = await this.loadPerformanceMetrics();

    if (!performanceData) {
      return { message: 'No performance data available' };
    }

    return {
      summary: {
        averageLoadTime: this.calculateAverageLoadTime(performanceData),
        slowestRequests: this.getSlowRequests(
          performanceData.networkRequests || []
        ),
        performanceScore: this.calculatePerformanceScore(performanceData),
      },
      details: performanceData,
    };
  }

  private calculateAverageLoadTime(performanceData: any): number {
    if (!performanceData.timing) return 0;
    return (
      performanceData.timing.testExecutionTime /
      Math.max(1, this.getMetrics().length)
    );
  }

  private getSlowRequests(networkRequests: NetworkRequest[]): NetworkRequest[] {
    return networkRequests
      .filter((req) => req.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  private calculatePerformanceScore(performanceData: any): number {
    let score = 100;

    // Deduct points for slow Web Vitals
    if (performanceData.webVitals) {
      performanceData.webVitals.forEach((vital: WebVitalsMetrics) => {
        if (vital.rating === 'poor') score -= 20;
        else if (vital.rating === 'needs-improvement') score -= 10;
      });
    }

    // Deduct points for slow network requests
    if (performanceData.networkRequests) {
      const slowRequests = performanceData.networkRequests.filter(
        (req: NetworkRequest) => req.duration > 2000
      );
      score -= slowRequests.length * 5;
    }

    return Math.max(0, score);
  }

  private async generateSecurityReport(): Promise<any> {
    const securityData = await this.loadSecurityMetrics();

    return {
      summary: {
        vulnerabilityCount: securityData.vulnerabilities.length,
        suspiciousActivityCount: securityData.suspiciousActivities.length,
        insecureRequestCount:
          securityData.networkAnalysis.insecureRequests.length,
        riskLevel: this.calculateSecurityRisk(securityData),
      },
      details: securityData,
    };
  }

  private calculateSecurityRisk(
    securityData: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    const vulnerabilities = securityData.vulnerabilities.length;
    const insecureRequests =
      securityData.networkAnalysis.insecureRequests.length;

    if (vulnerabilities > 5 || insecureRequests > 10) return 'critical';
    if (vulnerabilities > 2 || insecureRequests > 5) return 'high';
    if (vulnerabilities > 0 || insecureRequests > 0) return 'medium';
    return 'low';
  }

  private async generateAccessibilityReport(): Promise<any> {
    const a11yData = await this.loadAccessibilityResults();

    return {
      summary: a11yData.summary,
      criticalViolations: a11yData.violations.filter(
        (v) => v.impact === 'critical'
      ),
      recommendations: this.generateA11yRecommendations(a11yData),
    };
  }

  private generateA11yRecommendations(a11yData: AccessibilityReport): string[] {
    const recommendations = [];

    if (a11yData.violations.length > 0) {
      recommendations.push(
        'Address accessibility violations found during testing'
      );

      const criticalCount = a11yData.violations.filter(
        (v) => v.impact === 'critical'
      ).length;
      if (criticalCount > 0) {
        recommendations.push(
          `Fix ${criticalCount} critical accessibility issues immediately`
        );
      }
    }

    return recommendations;
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations = [];
    const performanceData = await this.loadPerformanceMetrics();
    const securityData = await this.loadSecurityMetrics();

    // Performance recommendations
    if (performanceData) {
      const slowRequests =
        performanceData.networkRequests?.filter(
          (req: NetworkRequest) => req.duration > 2000
        ) || [];
      if (slowRequests.length > 0) {
        recommendations.push(
          `Optimize ${slowRequests.length} slow network requests`
        );
      }
    }

    // Security recommendations
    if (securityData.vulnerabilities.length > 0) {
      recommendations.push(
        `Address ${securityData.vulnerabilities.length} security vulnerabilities`
      );
    }

    if (securityData.networkAnalysis.insecureRequests.length > 0) {
      recommendations.push('Migrate insecure HTTP requests to HTTPS');
    }

    return recommendations;
  }

  private async generateHTMLReport(reportData: any): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cypress Instrumentation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; border-radius: 3px; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
    </style>
</head>
<body>
    <h1>Cypress Instrumentation Report</h1>
    <p>Generated on: ${new Date().toISOString()}</p>
    
    <div class="section">
        <h2>Test Summary</h2>
        <div class="metric">Total Tests: ${reportData.summary.totalTests || 0}</div>
        <div class="metric">Passed: ${reportData.summary.passedTests || 0}</div>
        <div class="metric">Failed: ${reportData.summary.failedTests || 0}</div>
        <div class="metric">Duration: ${reportData.summary.duration || 0}ms</div>
    </div>
    
    <div class="section">
        <h2>Performance</h2>
        <div class="metric">Score: ${reportData.performance.summary?.performanceScore || 'N/A'}</div>
        <div class="metric">Avg Load Time: ${reportData.performance.summary?.averageLoadTime || 'N/A'}ms</div>
    </div>
    
    <div class="section">
        <h2>Security</h2>
        <div class="metric">Risk Level: <span class="${reportData.security.summary?.riskLevel || 'low'}">${reportData.security.summary?.riskLevel || 'Low'}</span></div>
        <div class="metric">Vulnerabilities: ${reportData.security.summary?.vulnerabilityCount || 0}</div>
        <div class="metric">Insecure Requests: ${reportData.security.summary?.insecureRequestCount || 0}</div>
    </div>
    
    <div class="section">
        <h2>Accessibility</h2>
        <div class="metric">Total Violations: ${reportData.accessibility.summary?.violations || 0}</div>
        <div class="metric">Critical Issues: ${reportData.accessibility.criticalViolations?.length || 0}</div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
`;

    const htmlPath = path.join(this.config.outputPath!, 'report.html');
    fs.writeFileSync(htmlPath, htmlContent);
  }
}
