# Project Structure

This project follows a hybrid monorepo structure with packages for modularity and a traditional src/ structure for quick access to core components.

## Directory Layout

```
code-check/
├── src/                     # Main source code (mirrors packages for convenience)
│   ├── analysis/           # Core analysis engine (links to packages/core-engine)
│   ├── ui/                 # React frontend (links to packages/web-app)
│   ├── extension/          # VS Code extension (links to packages/vscode-extension)
│   ├── server/             # Local server implementation
│   └── utils/              # Shared utilities (links to packages/shared)
├── packages/               # Monorepo packages
│   ├── core-engine/        # Analysis engine package
│   ├── cli/                # CLI tool package
│   ├── web-app/            # React web application
│   ├── vscode-extension/   # VS Code extension
│   ├── shared/             # Shared utilities and types
│   ├── eslint-config/      # ESLint configuration
│   └── typescript-config/  # TypeScript configuration
├── tests/                  # Integration tests
├── docs/                   # Documentation
├── package.json            # Root package.json
├── tsconfig.json           # Root TypeScript config
├── .eslintrc.js            # ESLint configuration
└── README.md              # Project README
```

## Package Architecture

### Core Packages

- **core-engine**: Analysis engine with plugins and pipeline
- **cli**: Command-line interface
- **web-app**: Browser-based UI
- **vscode-extension**: VS Code integration
- **shared**: Common utilities, types, and configurations

### Configuration Packages

- **eslint-config**: Shared ESLint rules
- **typescript-config**: Shared TypeScript configurations

## Development Workflow

1. Use `pnpm` for dependency management
2. Packages are independently buildable and testable
3. Shared configurations ensure consistency
4. Integration tests in root `tests/` directory
5. Documentation in `docs/` directory

## Output Structure

The analysis engine generates reports in the following structure:

```
.code-check/
├── analysis-results/
│   ├── AUDIT_RESULTS.md    # Main markdown report
│   ├── report.html         # HTML dashboard
│   ├── report.json         # Raw JSON data
│   └── assets/             # Supporting files
├── coverage/               # Test coverage reports
├── performance/            # Performance profiling data
└── logs/                   # Analysis logs
```
