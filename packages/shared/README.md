# @code-check/shared

A comprehensive shared utilities package providing common TypeScript types, configuration schemas, error classes, logging utilities, and helper functions for the code-check monorepo.

## Features

### 🎯 TypeScript Types

- **Result types** for error handling with `Result<T, E>`
- **Code analysis types** including `CodeIssue`, `CodeAnalysisReport`, `CodeLocation`
- **Configuration types** with full type safety
- **Logging types** for structured logging
- **Plugin system types** for extensible architecture
- **Utility types** like `DeepReadonly`, `DeepPartial`, `Optional`

### 🔧 Configuration Schema

Zod-based configuration validation with:

- **Base configuration** (name, version, environment)
- **Analysis configuration** (file patterns, rules, limits)
- **Logging configuration** (levels, formats, outputs)
- **Plugin configuration** (enabled plugins and their options)
- **Performance configuration** (concurrency, timeouts, memory limits)

### 🚨 Error Classes

Comprehensive error hierarchy with:

- **BaseError** - Abstract base class with structured error information
- **ConfigurationError** - Configuration validation errors
- **FileSystemError** - File and directory operation errors
- **AnalysisError** - Code analysis and parsing errors
- **PluginError** - Plugin loading and execution errors
- **NetworkError** - Network and connection errors
- **Performance errors** - Timeout and memory limit errors

### 📝 Logging System

Full-featured logging with:

- **Multiple log levels** (trace, debug, info, warn, error, fatal)
- **Multiple formatters** (JSON, text, pretty)
- **Multiple outputs** (console, file with rotation)
- **Structured context** for rich logging data
- **Performance logging** with duration tracking
- **Error logging** with automatic error details

### 🛠 Helper Functions

Extensive collection of utilities:

- **Result handling** (`success`, `failure`, `tryAsync`, `trySync`)
- **String manipulation** (`camelCase`, `kebabCase`, `snakeCase`, `truncate`)
- **Array operations** (`unique`, `groupBy`, `chunk`, `partition`)
- **Object utilities** (`pick`, `omit`, `deepClone`, `deepMerge`)
- **Type guards** (`isString`, `isNumber`, `isObject`, `isDefined`)
- **Path utilities** (`normalizePath`, `joinPaths`, `getExtension`)
- **Date utilities** (`formatDate`, `addDays`, `addHours`)
- **Performance utilities** (`debounce`, `throttle`, `measure`)
- **Validation utilities** (`isValidEmail`, `isValidUrl`, `isValidSemver`)

## Installation

This package is part of the code-check monorepo and uses workspace protocol for internal dependencies.

```bash
pnpm add @code-check/shared
```

## Usage Examples

### Configuration Management

```typescript
import {
  validateAppConfig,
  DEFAULT_CONFIG,
  mergeConfigs,
} from '@code-check/shared';

// Validate configuration
const config = validateAppConfig({
  name: 'my-app',
  version: '1.0.0',
  environment: 'production',
  logging: {
    level: 'error',
    format: 'json',
    outputs: ['console', 'file'],
    file: {
      path: '/var/log/app.log',
    },
  },
});

// Merge with defaults
const finalConfig = mergeConfigs(DEFAULT_CONFIG, userConfig);
```

### Error Handling

```typescript
import {
  BaseError,
  FileNotFoundError,
  tryAsync,
  isSuccess,
} from '@code-check/shared';

// Custom errors
throw new FileNotFoundError('/path/to/file', { operation: 'read' });

// Result-based error handling
const result = await tryAsync(() => readFile('config.json'));
if (isSuccess(result)) {
  console.log('File contents:', result.data);
} else {
  console.error('Failed to read file:', result.error.message);
}
```

### Logging

```typescript
import { createLogger, setDefaultLogger, log } from '@code-check/shared';

// Create and configure logger
const logger = createLogger({
  level: 'info',
  format: 'pretty',
  outputs: ['console'],
});

setDefaultLogger(logger);

// Use logging
await log.info('Application started', { version: '1.0.0' });
await log.error('Database connection failed', { host: 'localhost' }, error);

// Performance logging
const result = await log.logDuration(
  () => analyzeCode(files),
  'Code analysis',
  { fileCount: files.length }
);
```

### Helper Utilities

```typescript
import {
  unique,
  groupBy,
  pick,
  formatDate,
  isValidEmail,
  generateId,
} from '@code-check/shared';

// Array operations
const uniqueItems = unique([1, 2, 2, 3, 3]);
const grouped = groupBy(users, (user) => user.role);

// Object operations
const subset = pick(user, ['name', 'email']);

// Validation
const isValid = isValidEmail('user@example.com');

// ID generation
const taskId = generateId('task');
```

### Type System

```typescript
import type {
  Result,
  CodeIssue,
  LogLevel,
  AppConfig,
} from '@code-check/shared';

// Result types for error handling
function parseFile(path: string): Result<ParsedFile, ParseError> {
  // Implementation
}

// Code analysis types
const issue: CodeIssue = {
  id: generateId('issue'),
  severity: 'error',
  message: 'Unused variable',
  location: { file: 'src/app.ts', line: 10, column: 5 },
  fixable: true,
};
```

## API Reference

### Types

- `Result<T, E>` - Success/failure result type
- `CodeIssue` - Represents a code analysis issue
- `CodeAnalysisReport` - Complete analysis results
- `LogLevel` - Log severity levels
- `AppConfig` - Application configuration structure

### Configuration

- `validateAppConfig(data)` - Validate application configuration
- `mergeConfigs(base, override)` - Merge configuration objects
- `DEFAULT_CONFIG` - Default configuration values

### Error Classes

- `BaseError` - Base error class with context
- `ConfigurationError` - Configuration validation errors
- `FileNotFoundError` - File not found errors
- `AnalysisError` - Code analysis errors
- `PluginError` - Plugin system errors

### Logging

- `createLogger(config)` - Create new logger instance
- `setDefaultLogger(logger)` - Set global default logger
- `log.*` - Convenience logging functions

### Helpers

- **Result utilities**: `success`, `failure`, `tryAsync`, `trySync`
- **String utilities**: `camelCase`, `kebabCase`, `snakeCase`
- **Array utilities**: `unique`, `groupBy`, `chunk`
- **Object utilities**: `pick`, `omit`, `deepClone`
- **Type guards**: `isString`, `isNumber`, `isObject`
- **Validation**: `isValidEmail`, `isValidUrl`, `isValidSemver`

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

## Workspace Integration

This package is designed to be consumed by other packages in the monorepo:

```json
{
  "dependencies": {
    "@code-check/shared": "workspace:*"
  }
}
```

All utilities are fully typed and tree-shakeable for optimal bundle sizes.
