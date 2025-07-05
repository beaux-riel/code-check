import { CodeCheckConfig } from './packages/core-engine/src/config/CodeCheckConfig';

/**
 * Code Check Configuration
 *
 * This file allows you to customize the behavior of Code Check analysis.
 * You can override rule severities, enable/disable specific rules or rule sets,
 * and configure various analysis options.
 */
const config: CodeCheckConfig = {
  // Extend from predefined rule sets
  extends: ['recommended'],

  // Framework configuration (auto-detected by default)
  framework: 'auto', // 'react' | 'vue' | 'angular' | 'node' | 'auto'

  // File patterns to include/exclude
  include: [
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    'packages/*/lib/**/*.{js,jsx,ts,tsx}',
    '*.{js,jsx,ts,tsx}',
  ],
  exclude: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '*.min.js',
    '*.d.ts',
    'coverage/**',
    '**/*.test.{js,jsx,ts,tsx}', // Uncomment to exclude test files
    '**/*.spec.{js,jsx,ts,tsx}', // Uncomment to exclude spec files
  ],

  // Severity configuration
  severity: {
    defaultLevel: 'info',
    thresholds: {
      error: { max: 0, fail: true }, // Fail build on any errors
      warning: { max: 10, fail: false }, // Allow up to 10 warnings
      info: { max: 50, fail: false }, // Allow up to 50 info messages
    },
  },

  // Output configuration
  output: {
    format: 'text', // 'json' | 'text' | 'html' | 'junit'
    verbose: false,
    // file: 'code-check-report.json' // Uncomment to save to file
  },

  // Performance settings
  performance: {
    maxConcurrency: 4,
    timeout: 60000, // 60 seconds
    memoryLimit: '512MB',
  },

  // Cache configuration
  cache: {
    enabled: true,
    directory: '.codecheck-cache',
    strategy: 'conservative', // 'aggressive' | 'conservative'
  },

  // Rule set configuration
  ruleSets: {
    'security-recommended': { enabled: true },
    'code-quality-essential': { enabled: true },
    'performance-recommended': { enabled: true },
    'design-patterns': { enabled: false }, // Enable for design pattern guidance
    'reusability-patterns': { enabled: true },
    'react-performance': { enabled: true }, // Auto-enabled for React projects
    'vue-performance': { enabled: true }, // Auto-enabled for Vue projects
  },

  // Individual rule configuration
  rules: {
    // Security rules - customize severity levels
    'sql-injection': { severity: 'error', enabled: true },
    'xss-prevention': { severity: 'error', enabled: true },
    'hardcoded-secrets': { severity: 'error', enabled: true },
    'insecure-randomness': { severity: 'warning', enabled: true },

    // Code quality rules - adjust thresholds
    'cyclomatic-complexity': {
      severity: 'warning',
      enabled: true,
      configuration: { maxComplexity: 10 },
    },
    'function-length': {
      severity: 'warning',
      enabled: true,
      configuration: { maxLines: 50 },
    },
    'parameter-count': {
      severity: 'warning',
      enabled: true,
      configuration: { maxParameters: 5 },
    },
    'nested-depth': {
      severity: 'warning',
      enabled: true,
      configuration: { maxDepth: 4 },
    },
    'line-length': {
      severity: 'info',
      enabled: true,
      configuration: { maxLength: 120 },
    },

    // Performance rules
    'react-avoid-anonymous-functions': { severity: 'warning', enabled: true },
    'react-memo-expensive-components': { severity: 'info', enabled: true },
    'vue-v-for-key-required': { severity: 'warning', enabled: true },
    'avoid-memory-leaks': { severity: 'warning', enabled: true },

    // Design patterns (adjust based on your team's preferences)
    'singleton-pattern': { severity: 'info', enabled: false }, // Disable if not using
    'mvc-pattern': { severity: 'warning', enabled: true },
    'dependency-injection': { severity: 'info', enabled: true },

    // Reusability rules
    'dry-principle': { severity: 'warning', enabled: true },
    'parameterize-hardcoded-values': { severity: 'warning', enabled: true },
    'shared-constants': { severity: 'warning', enabled: true },

    // Style and naming rules
    'consistent-naming': { severity: 'info', enabled: true },
    'variable-naming': { severity: 'info', enabled: true },
    'function-naming': { severity: 'info', enabled: true },
    'prefer-const': { severity: 'info', enabled: true },
    'no-var': { severity: 'warning', enabled: true },

    // Add custom rule configurations here...
  },
};

export default config;

/**
 * Example configurations for different project types:
 *
 * // For a strict enterprise project:
 * extends: ['strict'],
 * severity: {
 *   thresholds: {
 *     error: { max: 0, fail: true },
 *     warning: { max: 0, fail: true },
 *     info: { max: 20, fail: false }
 *   }
 * }
 *
 * // For a React performance-focused project:
 * extends: ['recommended', 'react-performance'],
 * rules: {
 *   'react-avoid-anonymous-functions': { severity: 'error' },
 *   'react-memo-expensive-components': { severity: 'warning' }
 * }
 *
 * // For a security-critical application:
 * extends: ['security-recommended'],
 * rules: {
 *   'insecure-randomness': { severity: 'error' },
 *   'insecure-http': { severity: 'error' },
 *   'eval-usage': { severity: 'error' }
 * }
 */
