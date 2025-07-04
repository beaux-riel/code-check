# Testing Strategy and Guidelines

This document outlines the comprehensive testing strategy for the Code Check monorepo, including unit tests, integration tests, and end-to-end tests.

## Testing Overview

Our testing strategy ensures **90%+ code coverage** across all packages with multiple layers of testing:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between modules and APIs
- **E2E Tests**: Test complete user workflows in real browser environments
- **VS Code Extension Tests**: Test extension functionality within VS Code

## Testing Stack

### Core Testing Tools

- **Jest**: Unit and integration testing framework
- **Playwright**: End-to-end browser testing
- **@vscode/test-electron**: VS Code extension testing
- **@testing-library/react**: React component testing utilities
- **Vitest**: Fast unit testing (used in some packages)

### Coverage Tools

- **Jest Coverage**: Built-in coverage reporting
- **c8**: Alternative coverage tool for Vitest
- **Custom Coverage Scripts**: Aggregate coverage across packages

## Project Structure

```
code-check/
├── tests/                          # Root-level test configuration
│   ├── jest.config.js              # Global Jest configuration
│   └── setup.ts                    # Global test setup
├── packages/
│   ├── core-engine/
│   │   ├── src/__tests__/           # Unit tests
│   │   └── jest.config.js           # Package-specific Jest config
│   ├── web-app/
│   │   ├── src/__tests__/
│   │   │   ├── unit/                # Unit tests
│   │   │   └── integration/         # Integration tests
│   │   ├── tests/e2e/               # E2E tests
│   │   ├── jest.config.js
│   │   └── playwright.config.ts
│   ├── vscode-extension/
│   │   └── src/test/                # VS Code extension tests
│   └── api-backend/
│       └── src/__tests__/           # API tests
└── scripts/
    └── check-coverage.js            # Coverage validation
```

## Running Tests

### All Tests

```bash
# Run all tests across packages
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### By Type

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Coverage check (validates 90% threshold)
npm run coverage:check
```

### Individual Packages

```bash
# Core engine tests
cd packages/core-engine && npm test

# Web app tests (includes React components)
cd packages/web-app && npm test

# VS Code extension tests
cd packages/vscode-extension && npm test
```

## Writing Tests

### Unit Tests

Unit tests should test individual functions, classes, or components in isolation.

**Example - Testing a utility function:**

```typescript
// src/utils/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseCode } from './parser';

describe('parseCode', () => {
  it('should parse JavaScript code correctly', () => {
    const code = 'const x = 1;';
    const result = parseCode(code, 'javascript');

    expect(result.success).toBe(true);
    expect(result.ast).toBeDefined();
  });

  it('should handle syntax errors gracefully', () => {
    const invalidCode = 'const x = ;';
    const result = parseCode(invalidCode, 'javascript');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

**Example - Testing React components:**

```typescript
// src/components/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button text correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Integration tests verify that different parts of the system work together correctly.

**Example - API Integration Test:**

```typescript
// src/__tests__/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve a project', async () => {
    // Create project
    const createResponse = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        path: '/test/path',
      })
      .expect(201);

    const projectId = createResponse.body.id;

    // Retrieve project
    const getResponse = await request(app)
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(getResponse.body.name).toBe('Test Project');
  });
});
```

### E2E Tests

End-to-end tests use Playwright to test complete user workflows in real browsers.

**Example - E2E Test:**

```typescript
// tests/e2e/project-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Management Workflow', () => {
  test('user can create and analyze a project', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Create new project
    await page.click('[data-testid="new-project-btn"]');
    await page.fill('[data-testid="project-name"]', 'E2E Test Project');
    await page.fill('[data-testid="project-path"]', '/test/project');
    await page.click('[data-testid="create-project-btn"]');

    // Verify project appears in list
    await expect(page.locator('[data-testid="project-card"]')).toContainText(
      'E2E Test Project'
    );

    // Start analysis
    await page.click('[data-testid="start-analysis-btn"]');
    await expect(page.locator('[data-testid="analysis-status"]')).toContainText(
      'Running'
    );
  });
});
```

### VS Code Extension Tests

VS Code extension tests run within the VS Code environment using the test runner.

**Example - Extension Test:**

```typescript
// src/test/suite/commands.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Commands', () => {
  test('should register all commands', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes('code-check.startAudit'));
    assert.ok(commands.includes('code-check.showMetrics'));
  });

  test('should execute audit command', async () => {
    await vscode.commands.executeCommand('code-check.startAudit');
    // Verify audit started (check status bar, notifications, etc.)
  });
});
```

## Test Configuration

### Jest Configuration

The root Jest configuration (`tests/jest.config.js`) provides shared settings:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: ['packages/*/src/**/*.ts', '!packages/*/src/**/*.d.ts'],
};
```

### Playwright Configuration

Playwright is configured for comprehensive browser testing:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Coverage Requirements

### Coverage Thresholds

All packages must maintain **90%** coverage across:

- **Lines**: 90%
- **Functions**: 90%
- **Branches**: 90%
- **Statements**: 90%

### Coverage Validation

```bash
# Check coverage across all packages
npm run coverage:check

# Generate detailed coverage report
node scripts/check-coverage.js report
```

Coverage gates are enforced in CI/CD and will fail builds that don't meet the threshold.

## Mocking Guidelines

### External Dependencies

Mock external dependencies to ensure tests are isolated and deterministic:

```typescript
// Mock file system
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock API calls
global.fetch = vi.fn();
```

### Time and Dates

Mock time-dependent code for consistent tests:

```typescript
// Mock Date
vi.setSystemTime(new Date('2024-01-01'));

// Mock timers
vi.useFakeTimers();
```

### VS Code APIs

Mock VS Code APIs for extension testing:

```typescript
// Mock VS Code workspace
const mockWorkspace = {
  getConfiguration: vi.fn(),
  onDidChangeConfiguration: vi.fn(),
};
```

## Test Data Management

### Test Fixtures

Create reusable test data in fixture files:

```typescript
// tests/fixtures/projects.ts
export const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  path: '/test/path',
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockAnalysisResult = {
  projectId: 'test-project-1',
  filesAnalyzed: 100,
  issuesFound: 25,
  metrics: {
    /* ... */
  },
};
```

### Database Testing

For integration tests that require database access:

```typescript
// tests/helpers/database.ts
export async function setupTestDatabase() {
  // Create temporary test database
  // Seed with test data
}

export async function cleanupTestDatabase() {
  // Clean up test data
  // Drop test database
}
```

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the behavior being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** - each test should be able to run in isolation

### Test Performance

1. **Mock heavy operations** like file I/O and network requests
2. **Use `beforeEach` and `afterEach`** for consistent test setup/cleanup
3. **Avoid testing implementation details** - focus on behavior
4. **Use parallel test execution** where possible

### Test Maintainability

1. **Keep tests simple** and focused on single behaviors
2. **Use helper functions** for common test setup
3. **Avoid deep mocking** - prefer dependency injection
4. **Update tests when requirements change**

## Debugging Tests

### Running Individual Tests

```bash
# Run specific test file
npm test -- --testNamePattern="CodeAnalyzer"

# Run tests in watch mode with debugging
npm run test:watch -- --verbose
```

### VS Code Debugging

Configure VS Code for test debugging:

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Playwright Debugging

```bash
# Run Playwright in headed mode
npx playwright test --headed

# Debug specific test
npx playwright test --debug project-workflow.spec.ts
```

## Continuous Integration

### GitHub Actions

Tests run automatically on every pull request:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run coverage:check
```

### Coverage Reporting

Coverage reports are generated and uploaded to coverage services:

- **Codecov**: For coverage tracking and PR comments
- **HTML Reports**: Available in the `coverage/` directory

## Troubleshooting

### Common Issues

**Tests failing due to timing issues:**

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument();
});
```

**VS Code extension tests not finding commands:**

```typescript
// Ensure extension is activated
const extension = vscode.extensions.getExtension('code-check.vscode');
await extension?.activate();
```

**Playwright tests timing out:**

```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### Getting Help

1. Check the test output for specific error messages
2. Review the relevant documentation for the testing tool
3. Look at existing tests for similar patterns
4. Ask in team chat or create an issue

## Future Improvements

- **Visual regression testing** with Playwright
- **Performance testing** for core analysis engine
- **Accessibility testing** for web components
- **Stress testing** for concurrent analysis operations
- **Property-based testing** for complex algorithms

---

For more information, see the individual package README files and the main project documentation.
