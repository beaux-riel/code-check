import { z } from 'zod';
import { CodeCheckEngineConfig } from '@code-check/core-engine';

// Request validation schemas
export const createAuditSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
  projectName: z.string().optional(),
  projectDescription: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
  includedFiles: z.array(z.string()).optional(),
  excludedFiles: z.array(z.string()).optional(),
  includePatterns: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
  enabledPlugins: z.array(z.string()).optional(),
  rulesets: z.array(z.string()).optional(),
  maxWorkers: z.number().min(1).optional(),
  concurrency: z.number().min(1).optional(),
  enableParallelExecution: z.boolean().optional(),
  outputFormat: z.enum(['json', 'xml', 'html', 'markdown', 'all']).optional(),
  generateReports: z.boolean().optional(),
  maxFileSize: z.number().optional(),
  timeout: z.number().min(1000).optional(),
  bail: z.boolean().optional(),
  cache: z.boolean().optional(),
});

export const updateAuditSchema = z.object({
  status: z
    .enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .optional(),
});

export const queryAuditsSchema = z.object({
  projectId: z.string().optional(),
  status: z
    .enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z
    .enum(['startedAt', 'completedAt', 'duration', 'totalIssues'])
    .default('startedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types derived from schemas
export type CreateAuditRequest = z.infer<typeof createAuditSchema>;
export type UpdateAuditRequest = z.infer<typeof updateAuditSchema>;
export type QueryAuditsRequest = z.infer<typeof queryAuditsSchema>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuditSummary {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  totalFiles: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface AuditDetails extends AuditSummary {
  enabledPlugins: string[];
  rulesets: string[];
  configuration?: any;
  errorMessage?: string;
  issues: IssueDetails[];
  files: FileDetails[];
}

export interface IssueDetails {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  rule?: string;
  category?: string;
  filePath: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fixable: boolean;
  suggestions: string[];
  codeSnippet?: string;
  cwe?: string;
  cvss?: number;
}

export interface FileDetails {
  id: string;
  filePath: string;
  fileSize: number;
  language?: string;
  linesOfCode: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  complexityScore?: number;
  maintainabilityIndex?: number;
  processedAt: string;
}

export interface ProjectDetails {
  id: string;
  name: string;
  path: string;
  description?: string;
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
  auditCount: number;
  lastAuditAt?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  timestamp: string;
  data: any;
}

export interface AuditProgressMessage extends WebSocketMessage {
  type: 'audit.progress';
  data: {
    auditId: string;
    stage: string;
    progress: number; // 0-100
    message?: string;
    filesProcessed: number;
    totalFiles: number;
  };
}

export interface AuditStatusMessage extends WebSocketMessage {
  type: 'audit.status';
  data: {
    auditId: string;
    status: string;
    message?: string;
  };
}

export interface AuditCompletedMessage extends WebSocketMessage {
  type: 'audit.completed';
  data: AuditSummary;
}

export interface AuditErrorMessage extends WebSocketMessage {
  type: 'audit.error';
  data: {
    auditId: string;
    error: string;
    stage?: string;
  };
}

export type AuditWebSocketMessage =
  | AuditProgressMessage
  | AuditStatusMessage
  | AuditCompletedMessage
  | AuditErrorMessage;

// Engine configuration mapping
export interface EngineConfigOptions
  extends Omit<CodeCheckEngineConfig, 'projectPath'> {
  projectPath?: string;
}

// Error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}
