# Code Check Monorepo

A Turborepo-powered monorepo for the Code Check project with pnpm workspaces.

## Structure

```
├── packages/
│   ├── core-engine/          # Core analysis engine
│   ├── web-app/              # React web application
│   ├── cli/                  # Command-line interface
│   ├── vscode-extension/     # VS Code extension
│   ├── shared/               # Shared utilities
│   ├── eslint-config/        # Shared ESLint configuration
│   └── typescript-config/    # Shared TypeScript configuration
├── .github/workflows/        # CI/CD workflows
└── turbo.json               # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8.15.6+

### Installation

```bash
# Install dependencies
pnpm install

# Install Husky hooks
pnpm run prepare
```

### Development

```bash
# Start development for all packages
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Package Scripts

Each package can be run individually:

```bash
# Run specific package command
pnpm --filter @code-check/web-app dev
pnpm --filter @code-check/cli build
```

## Tooling

- **Build System**: Turborepo for task running and caching
- **Package Manager**: pnpm with workspaces
- **Linting**: ESLint with shared configurations
- **Formatting**: Prettier
- **Git Hooks**: Husky with lint-staged
- **CI/CD**: GitHub Actions workflows
- **TypeScript**: Shared TypeScript configurations

## Packages

### Core Engine (`@code-check/core-engine`)

Core analysis engine with TypeScript support.

### Web App (`@code-check/web-app`)

React-based web application built with Vite.

### CLI (`@code-check/cli`)

Command-line interface built with Commander.js.

### VS Code Extension (`@code-check/vscode-extension`)

VS Code extension for code analysis.

### Shared (`@code-check/shared`)

Shared utilities and types used across packages.

## Contributing

1. Install dependencies: `pnpm install`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Commit (pre-commit hooks will run automatically)
