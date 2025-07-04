import type { CodeCheckConfig } from '@code-check/core-engine';

export default {
  projectPath: '.',
  enabledPlugins: ['FileDiscoveryPlugin', 'ASTAnalysisPlugin'],
  outputFormat: 'all',
  concurrency: 4,
  excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
  includePatterns: ['**/*.{js,ts,jsx,tsx}'],
  severity: 'error',
  failureThreshold: 70,
  reportConfig: {
    outputPath: './codecheck-reports',
    includeDetails: true,
    includeMetrics: true,
    includeSummary: true,
  },
} as CodeCheckConfig;
