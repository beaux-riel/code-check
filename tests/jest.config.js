module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
    '../packages/*/src/**/__tests__/**/*.test.ts',
    '../packages/*/tests/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../packages/*/src/**/*.ts',
    '../packages/*/src/**/*.tsx',
    '!../packages/*/src/**/*.d.ts',
    '!../packages/*/src/**/*.stories.ts',
    '!../packages/*/src/**/*.stories.tsx',
    '!../packages/*/node_modules/**',
    '!../packages/*/dist/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'cobertura', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000,
  moduleNameMapping: {
    '^@code-check/(.*)$': '<rootDir>/../packages/$1/src'
  },
  projects: [
    {
      displayName: 'core-engine',
      testMatch: ['<rootDir>/../packages/core-engine/**/*.test.ts']
    },
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/../packages/shared/**/*.test.ts']
    },
    {
      displayName: 'api-backend',
      testMatch: ['<rootDir>/../packages/api-backend/**/*.test.ts']
    },
    {
      displayName: 'cli',
      testMatch: ['<rootDir>/../packages/cli/**/*.test.ts']
    }
  ]
};
