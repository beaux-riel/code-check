export interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  lastRun: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  runsCount: number;
  issuesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RunDetail {
  id: string;
  projectId: string;
  projectName: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  startTime: string;
  endTime?: string;
  duration?: number;
  issues: Issue[];
  metrics: RunMetrics;
  logs: LogEntry[];
}

export interface Issue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  column: number;
  rule: string;
  category: string;
  fixable: boolean;
}

export interface RunMetrics {
  totalFiles: number;
  processedFiles: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  codeQualityScore: number;
  performanceScore: number;
  securityScore: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  enabled: boolean;
  fixable: boolean;
  configuration: Record<string, any>;
}

export interface RuleCategory {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
}

export interface WebSocketMessage {
  type:
    | 'run_started'
    | 'run_progress'
    | 'run_completed'
    | 'run_failed'
    | 'issue_found'
    | 'log_entry';
  data: any;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  issues: number;
  errors: number;
  warnings: number;
  score: number;
}
