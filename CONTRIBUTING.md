# Contributing to Code Check

We welcome contributions to Code Check! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 8.15.6 or higher
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/code-check.git
   cd code-check
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Install git hooks:

   ```bash
   pnpm run prepare
   ```

5. Build the project:

   ```bash
   pnpm build
   ```

6. Run tests to ensure everything is working:
   ```bash
   pnpm test
   ```

### Project Structure

```
code-check/
├── packages/
│   ├── core-engine/      # Core analysis engine
│   ├── cli/              # Command-line interface
│   ├── web-app/          # React web application
│   ├── desktop-app/      # Electron desktop application
│   ├── api-backend/      # REST API backend
│   ├── vscode-extension/ # VS Code extension
│   ├── shared/           # Shared utilities and types
│   └── dynamic-analysis/ # Dynamic analysis components
├── docs/                 # Documentation
├── examples/             # Example projects and configurations
└── scripts/              # Build and development scripts
```

## Development Workflow

### Branch Naming

Use the following naming conventions for branches:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or improvements

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(core): add AI-powered code analysis
fix(cli): resolve configuration loading issue
docs: update getting started guide
test(shared): add unit tests for utility functions
```

### Working with Packages

This is a monorepo managed with Turborepo and pnpm workspaces. Here are common commands:

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build

# Run specific package command
pnpm --filter @code-check/core-engine build
pnpm --filter @code-check/web-app dev

# Run tests for all packages
pnpm test

# Run tests for specific package
pnpm --filter @code-check/cli test
```

### Adding New Packages

1. Create the package directory under `packages/`
2. Add a `package.json` with appropriate name and dependencies
3. Update `pnpm-workspace.yaml` if needed
4. Add the package to `turbo.json` for task configuration

## Submitting Changes

### Pull Request Process

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with clear messages

3. Ensure all tests pass:

   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

4. Update documentation if needed

5. Push to your fork and create a pull request

6. Fill out the pull request template completely

### Pull Request Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Changes are covered by tests
- [ ] Breaking changes are documented
- [ ] Performance impact is considered

### Review Process

1. Pull requests require at least one review from a maintainer
2. All CI checks must pass
3. Address any feedback from reviewers
4. Maintainer will merge when approved

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Prettier for code formatting
- Prefer explicit types over `any`
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Follow React best practices
- Use TypeScript interfaces for props
- Write component tests

### Node.js/Backend

- Use async/await instead of callbacks
- Handle errors properly
- Follow REST API conventions
- Validate input data

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint**: Linting rules
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks
- **lint-staged**: Pre-commit checks

Run quality checks:

```bash
pnpm lint      # Run ESLint
pnpm format    # Format with Prettier
pnpm typecheck # TypeScript checking
```

## Testing

### Test Types

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete user workflows

### Testing Guidelines

- Write tests for new features and bug fixes
- Aim for good test coverage (80%+)
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something when condition is met', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Documentation

### Types of Documentation

1. **API Documentation**: Generated with TypeDoc
2. **User Guides**: Markdown files in `/docs/guides/`
3. **Code Comments**: Inline documentation
4. **README Files**: Package-specific documentation

### Documentation Guidelines

- Keep documentation up-to-date with code changes
- Use clear, concise language
- Include code examples
- Document complex algorithms and business logic
- Update API documentation for public interfaces

### Building Documentation

```bash
# Generate API documentation
pnpm docs:api

# Build all documentation
pnpm docs:build

# Serve documentation locally
pnpm docs:dev
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Environment**: OS, Node.js version, package versions
2. **Steps to Reproduce**: Clear, numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Code Examples**: Minimal reproduction case
6. **Screenshots**: If applicable

Use the bug report template when creating issues.

### Security Issues

For security vulnerabilities, please email security@code-check.dev instead of creating a public issue.

## Feature Requests

### Before Requesting

1. Check existing issues and discussions
2. Consider if the feature fits the project scope
3. Think about backwards compatibility
4. Consider implementation complexity

### Feature Request Process

1. Create an issue using the feature request template
2. Provide clear use cases and benefits
3. Discuss implementation approaches
4. Wait for maintainer feedback before implementing

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Steps

1. Update version numbers in all packages
2. Update CHANGELOG.md
3. Create release commit
4. Tag the release
5. Push to GitHub
6. GitHub Actions handles publishing

### Changelog

Keep the CHANGELOG.md updated with:

- New features
- Bug fixes
- Breaking changes
- Deprecations
- Security updates

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat (link in README)
- **Email**: security@code-check.dev for security issues

### Getting Help

1. Check the documentation first
2. Search existing issues
3. Ask in GitHub Discussions
4. Create a new issue if needed

## Recognition

Contributors are recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to Code Check!
