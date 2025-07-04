import { CodeCheckConfig } from '@code-check/core-engine';

export default {
  // Basic project settings
  projectPath: '.',
  outputPath: './.code-check',

  // File patterns
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: ['node_modules/**', 'dist/**', '*.test.ts'],

  // Plugin configuration
  plugins: {
    fileDiscovery: {
      enabled: true,
      extensions: ['.ts', '.tsx'],
      excludePatterns: ['*.test.*', '*.spec.*'],
    },

    static: {
      enabled: true,
      eslint: {
        configPath: '.eslintrc.js',
        rules: {
          'prefer-const': 'error',
          'no-unused-vars': 'warn',
          '@typescript-eslint/no-explicit-any': 'warn',
        },
      },
      typescript: {
        configPath: './tsconfig.json',
        strictMode: true,
      },
    },

    codeMetrics: {
      enabled: true,
      thresholds: {
        cyclomaticComplexity: 8,
        cognitiveComplexity: 12,
        maintainabilityIndex: 75,
      },
    },

    ast: {
      enabled: true,
      analyzePatterns: true,
      detectAntiPatterns: true,
    },

    llm: {
      enabled: true,
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 2000,
      temperature: 0.1,
    },
  },

  // Rule configuration
  rules: {
    'code-quality/cyclomatic-complexity': ['error', { max: 8 }],
    'code-quality/function-length': ['warn', { max: 30 }],
    'code-quality/nested-depth': ['warn', { max: 3 }],
    'security/no-hardcoded-secrets': 'error',
    'performance/avoid-synchronous-fs': 'warn',
    'maintainability/max-parameters': ['warn', { max: 4 }],
  },

  // Output configuration
  output: {
    formats: ['html', 'json'],
    htmlReport: {
      template: 'default',
      includeSourceCode: true,
      includeMetrics: true,
    },
    jsonReport: {
      pretty: true,
      includeRawData: false,
    },
  },
} as CodeCheckConfig;
