import { LogLevel } from '../types/index.js';

// Base error class
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly logLevel: LogLevel;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Configuration errors
export class ConfigurationError extends BaseError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 400;
  readonly logLevel: LogLevel = 'error';

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Configuration error: ${message}`, context);
  }
}

export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 422;
  readonly logLevel: LogLevel = 'error';

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Validation error: ${message}`, context);
  }
}

// File system errors
export class FileSystemError extends BaseError {
  readonly code = 'FILE_SYSTEM_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(message: string, context?: Record<string, unknown>) {
    super(`File system error: ${message}`, context);
  }
}

export class FileNotFoundError extends BaseError {
  readonly code = 'FILE_NOT_FOUND';
  readonly statusCode = 404;
  readonly logLevel: LogLevel = 'error';

  constructor(filePath: string, context?: Record<string, unknown>) {
    super(`File not found: ${filePath}`, { ...context, filePath });
  }
}

export class DirectoryNotFoundError extends BaseError {
  readonly code = 'DIRECTORY_NOT_FOUND';
  readonly statusCode = 404;
  readonly logLevel: LogLevel = 'error';

  constructor(dirPath: string, context?: Record<string, unknown>) {
    super(`Directory not found: ${dirPath}`, { ...context, dirPath });
  }
}

export class PermissionError extends BaseError {
  readonly code = 'PERMISSION_ERROR';
  readonly statusCode = 403;
  readonly logLevel: LogLevel = 'error';

  constructor(
    path: string,
    operation: string,
    context?: Record<string, unknown>
  ) {
    super(`Permission denied: cannot ${operation} ${path}`, {
      ...context,
      path,
      operation,
    });
  }
}

// Analysis errors
export class AnalysisError extends BaseError {
  readonly code = 'ANALYSIS_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Analysis error: ${message}`, context);
  }
}

export class ParseError extends BaseError {
  readonly code = 'PARSE_ERROR';
  readonly statusCode = 422;
  readonly logLevel: LogLevel = 'error';

  constructor(
    file: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`Parse error in ${file}: ${message}`, { ...context, file });
  }
}

export class RuleError extends BaseError {
  readonly code = 'RULE_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(
    ruleName: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`Rule error in ${ruleName}: ${message}`, { ...context, ruleName });
  }
}

// Plugin errors
export class PluginError extends BaseError {
  readonly code = 'PLUGIN_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(
    pluginName: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`Plugin error in ${pluginName}: ${message}`, {
      ...context,
      pluginName,
    });
  }
}

export class PluginInitializationError extends BaseError {
  readonly code = 'PLUGIN_INITIALIZATION_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(
    pluginName: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`Plugin ${pluginName} failed to initialize: ${message}`, {
      ...context,
      pluginName,
    });
  }
}

export class PluginLoadError extends BaseError {
  readonly code = 'PLUGIN_LOAD_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(
    pluginName: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`Plugin ${pluginName} failed to load: ${message}`, {
      ...context,
      pluginName,
    });
  }
}

// Performance errors
export class TimeoutError extends BaseError {
  readonly code = 'TIMEOUT_ERROR';
  readonly statusCode = 408;
  readonly logLevel: LogLevel = 'warn';

  constructor(
    operation: string,
    timeout: number,
    context?: Record<string, unknown>
  ) {
    super(`Operation timed out: ${operation} (${timeout}ms)`, {
      ...context,
      operation,
      timeout,
    });
  }
}

export class MemoryLimitError extends BaseError {
  readonly code = 'MEMORY_LIMIT_ERROR';
  readonly statusCode = 507;
  readonly logLevel: LogLevel = 'error';

  constructor(
    limit: number,
    current: number,
    context?: Record<string, unknown>
  ) {
    super(`Memory limit exceeded: ${current}MB > ${limit}MB`, {
      ...context,
      limit,
      current,
    });
  }
}

// Network errors
export class NetworkError extends BaseError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Network error: ${message}`, context);
  }
}

export class ConnectionError extends BaseError {
  readonly code = 'CONNECTION_ERROR';
  readonly statusCode = 503;
  readonly logLevel: LogLevel = 'error';

  constructor(host: string, port?: number, context?: Record<string, unknown>) {
    const address = port ? `${host}:${port}` : host;
    super(`Connection failed: ${address}`, { ...context, host, port });
  }
}

// Cache errors
export class CacheError extends BaseError {
  readonly code = 'CACHE_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'warn';

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Cache error: ${message}`, context);
  }
}

// Aggregation error for multiple errors
export class AggregateError extends BaseError {
  readonly code = 'AGGREGATE_ERROR';
  readonly statusCode = 500;
  readonly logLevel: LogLevel = 'error';
  public readonly errors: Error[];

  constructor(
    errors: Error[],
    message?: string,
    context?: Record<string, unknown>
  ) {
    const defaultMessage = `Multiple errors occurred (${errors.length} errors)`;
    super(message || defaultMessage, context);
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors.map((error) =>
        error instanceof BaseError
          ? error.toJSON()
          : {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
      ),
    };
  }
}

// Error utilities
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function isErrorOfType<T extends BaseError>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T
): error is T {
  return error instanceof ErrorClass;
}

export function formatError(error: unknown): string {
  if (isBaseError(error)) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function getErrorDetails(error: unknown): {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
} {
  if (isBaseError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      context: error.context,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: 'Unknown',
    message: String(error),
  };
}
