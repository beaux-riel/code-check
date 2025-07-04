export interface InstrumentationConfig {
  projectPath: string;
  outputPath: string;
  enableCoverage: boolean;
  enableProfiling: boolean;
  enableSecurity: boolean;
  jest?: JestConfig;
  cypress?: CypressConfig;
}

export interface JestConfig {
  configFile?: string;
  testMatch?: string[];
  coverageThreshold?: {
    global?: {
      branches?: number;
      functions?: number;
      lines?: number;
      statements?: number;
    };
  };
  collectCoverageFrom?: string[];
}

export interface CypressConfig {
  configFile?: string;
  baseUrl?: string;
  specPattern?: string;
  supportFile?: string;
}

export interface CoverageData {
  type: 'jest' | 'cypress';
  timestamp: number;
  summary: {
    lines: CoverageMetric;
    statements: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
  };
  files: CoverageFileData[];
}

export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface CoverageFileData {
  path: string;
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  uncoveredLines: number[];
}

export interface PerformanceMetrics {
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

export interface SecurityVulnerability {
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

export interface RuntimeAnalysisResult {
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

export interface DynamicAnalysisConfig {
  enabled: boolean;
  instrumentation: InstrumentationConfig;
  reporting: {
    generateReports: boolean;
    outputFormats: ('json' | 'html' | 'xml')[];
    includeSourceMaps: boolean;
  };
  thresholds: {
    coverage?: {
      lines?: number;
      statements?: number;
      functions?: number;
      branches?: number;
    };
    performance?: {
      maxTestDuration?: number;
      maxMemoryUsage?: number;
      maxEventLoopLag?: number;
    };
    security?: {
      allowedSeverities?: ('low' | 'moderate' | 'high' | 'critical')[];
      maxVulnerabilities?: number;
    };
  };
}

export interface WebSocketMessage {
  type: 'coverage' | 'performance' | 'security' | 'status';
  payload: any;
  timestamp: number;
}
