import {
  Project,
  RunDetail,
  Rule,
  RuleCategory,
  Issue,
  RunMetrics,
  LogEntry,
} from '../types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Frontend App',
    description: 'React TypeScript application with modern best practices',
    language: 'typescript',
    lastRun: '2024-01-15T10:30:00Z',
    status: 'completed',
    runsCount: 25,
    issuesCount: 12,
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Backend API',
    description: 'Node.js Express REST API with TypeScript',
    language: 'typescript',
    lastRun: '2024-01-15T09:15:00Z',
    status: 'running',
    runsCount: 42,
    issuesCount: 8,
    createdAt: '2023-12-15T14:20:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    name: 'Data Processing',
    description: 'Python data processing and analysis scripts',
    language: 'python',
    lastRun: '2024-01-14T16:45:00Z',
    status: 'failed',
    runsCount: 18,
    issuesCount: 23,
    createdAt: '2024-01-05T11:30:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
  },
];

export const mockIssues: Issue[] = [
  {
    id: '1',
    type: 'error',
    severity: 'high',
    message: 'Potential null pointer dereference',
    file: 'src/components/UserProfile.tsx',
    line: 45,
    column: 12,
    rule: 'no-null-pointer',
    category: 'Reliability',
    fixable: false,
  },
  {
    id: '2',
    type: 'warning',
    severity: 'medium',
    message: 'Unused variable "userData"',
    file: 'src/utils/helpers.ts',
    line: 23,
    column: 7,
    rule: 'no-unused-vars',
    category: 'Code Quality',
    fixable: true,
  },
  {
    id: '3',
    type: 'info',
    severity: 'low',
    message: 'Consider using const instead of let',
    file: 'src/hooks/useAuth.ts',
    line: 18,
    column: 3,
    rule: 'prefer-const',
    category: 'Best Practices',
    fixable: true,
  },
];

export const mockMetrics: RunMetrics = {
  totalFiles: 156,
  processedFiles: 156,
  totalIssues: 12,
  errors: 3,
  warnings: 6,
  info: 3,
  codeQualityScore: 85,
  performanceScore: 92,
  securityScore: 78,
};

export const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:25:00Z',
    level: 'info',
    message: 'Starting code analysis for Frontend App',
    source: 'analyzer',
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:15Z',
    level: 'info',
    message: 'Processing TypeScript files...',
    source: 'typescript-analyzer',
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:27:30Z',
    level: 'warn',
    message: 'Found deprecated API usage in src/components/UserProfile.tsx',
    source: 'deprecation-checker',
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:30:00Z',
    level: 'info',
    message: 'Analysis completed successfully',
    source: 'analyzer',
  },
];

export const mockRunDetail: RunDetail = {
  id: 'run-123',
  projectId: '1',
  projectName: 'Frontend App',
  status: 'completed',
  startTime: '2024-01-15T10:25:00Z',
  endTime: '2024-01-15T10:30:00Z',
  duration: 300000, // 5 minutes in milliseconds
  issues: mockIssues,
  metrics: mockMetrics,
  logs: mockLogs,
};

export const mockRules: Rule[] = [
  {
    id: 'no-null-pointer',
    name: 'No Null Pointer Dereference',
    description: 'Prevents potential null pointer dereference errors',
    category: 'reliability',
    severity: 'high',
    enabled: true,
    fixable: false,
    configuration: {
      strictMode: true,
      ignoreOptionalChaining: false,
    },
  },
  {
    id: 'no-unused-vars',
    name: 'No Unused Variables',
    description: 'Disallow unused variables to keep code clean',
    category: 'code-quality',
    severity: 'medium',
    enabled: true,
    fixable: true,
    configuration: {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: false,
    },
  },
  {
    id: 'prefer-const',
    name: 'Prefer Const',
    description:
      'Prefer const over let for variables that are never reassigned',
    category: 'best-practices',
    severity: 'low',
    enabled: true,
    fixable: true,
    configuration: {
      destructuring: 'any',
      ignoreReadBeforeAssign: false,
    },
  },
];

export const mockRuleCategories: RuleCategory[] = [
  {
    id: 'reliability',
    name: 'Reliability',
    description: 'Rules that help prevent bugs and runtime errors',
    rules: mockRules.filter((rule) => rule.category === 'reliability'),
  },
  {
    id: 'code-quality',
    name: 'Code Quality',
    description: 'Rules that improve code maintainability and readability',
    rules: mockRules.filter((rule) => rule.category === 'code-quality'),
  },
  {
    id: 'best-practices',
    name: 'Best Practices',
    description: 'Rules that enforce coding best practices',
    rules: mockRules.filter((rule) => rule.category === 'best-practices'),
  },
];

// Helper function to simulate API delays
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions that can be used as fallbacks
export const mockApiService = {
  async getProjects(): Promise<Project[]> {
    await delay(500);
    return mockProjects;
  },

  async getProject(id: string): Promise<Project> {
    await delay(300);
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');
    return project;
  },

  async getRun(projectId: string, runId: string): Promise<RunDetail> {
    await delay(400);
    return { ...mockRunDetail, projectId, id: runId };
  },

  async getRules(): Promise<RuleCategory[]> {
    await delay(600);
    return mockRuleCategories;
  },

  async exportRunResults(
    projectId: string,
    runId: string,
    format: string
  ): Promise<Blob> {
    await delay(1000);
    const data = JSON.stringify(mockRunDetail, null, 2);
    return new Blob([data], { type: 'application/json' });
  },
};
