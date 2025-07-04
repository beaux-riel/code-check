import { LogLevel, LogEntry, LogContext } from '../types/index.js';
import { LoggingConfig } from '../config/schema.js';
import { BaseError } from '../errors/index.js';

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  trace: COLORS.gray,
  debug: COLORS.blue,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
  fatal: COLORS.magenta,
};

// Formatters
export interface LogFormatter {
  format(entry: LogEntry): string;
}

export class JsonFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}

export class TextFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? ` Error: ${entry.error.message}` : '';

    return `${timestamp} [${level}] ${entry.message}${context}${error}`;
  }
}

export class PrettyFormatter implements LogFormatter {
  private useColors: boolean;

  constructor(useColors = true) {
    this.useColors = useColors;
  }

  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const level = entry.level.toUpperCase();
    const levelColor = this.useColors ? LEVEL_COLORS[entry.level] : '';
    const reset = this.useColors ? COLORS.reset : '';
    const dim = this.useColors ? COLORS.dim : '';

    let output = `${dim}${timestamp}${reset} ${levelColor}${level}${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `${dim} ${JSON.stringify(entry.context, null, 2)}${reset}`;
    }

    if (entry.error) {
      output += `\n${COLORS.red}Error: ${entry.error.message}${reset}`;
      if (entry.error.stack) {
        output += `\n${COLORS.gray}${entry.error.stack}${reset}`;
      }
    }

    return output;
  }
}

// Log outputs
export interface LogOutput {
  write(formattedEntry: string): Promise<void>;
}

export class ConsoleOutput implements LogOutput {
  async write(formattedEntry: string): Promise<void> {
    console.log(formattedEntry);
  }
}

export class FileOutput implements LogOutput {
  private filePath: string;
  private maxSize: number;
  private maxFiles: number;
  private currentSize = 0;

  constructor(
    filePath: string,
    maxSize: number = 10 * 1024 * 1024,
    maxFiles: number = 5
  ) {
    this.filePath = filePath;
    this.maxSize = maxSize;
    this.maxFiles = maxFiles;
  }

  async write(formattedEntry: string): Promise<void> {
    if (typeof window !== 'undefined') {
      console.error('FileOutput is not supported in browser environments');
      return;
    }

    const { promises: fs } = await import('fs');
    const path = await import('path');

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });

      // Check if rotation is needed
      try {
        const stats = await fs.stat(this.filePath);
        if (stats.size > this.maxSize) {
          await this.rotateFile();
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }

      // Write the entry
      await fs.appendFile(this.filePath, formattedEntry + '\n');
      this.currentSize += formattedEntry.length + 1;
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateFile(): Promise<void> {
    if (typeof window !== 'undefined') {
      return;
    }

    const { promises: fs } = await import('fs');
    const path = await import('path');

    try {
      const dir = path.dirname(this.filePath);
      const ext = path.extname(this.filePath);
      const base = path.basename(this.filePath, ext);

      // Rotate existing files
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(dir, `${base}.${i}${ext}`);
        const newFile = path.join(dir, `${base}.${i + 1}${ext}`);

        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
          // File doesn't exist, which is fine
        }
      }

      // Move current file to .1
      const rotatedFile = path.join(dir, `${base}.1${ext}`);
      await fs.rename(this.filePath, rotatedFile);

      this.currentSize = 0;
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }
}

// Main Logger class
export class Logger {
  private config: LoggingConfig;
  private formatter: LogFormatter;
  private outputs: LogOutput[];
  private globalContext: LogContext;

  constructor(config: LoggingConfig) {
    this.config = config;
    this.globalContext = (config.context as LogContext) || {};

    // Initialize formatter
    switch (config.format) {
      case 'json':
        this.formatter = new JsonFormatter();
        break;
      case 'pretty':
        this.formatter = new PrettyFormatter();
        break;
      default:
        this.formatter = new TextFormatter();
    }

    // Initialize outputs
    this.outputs = config.outputs.map((outputType) => {
      switch (outputType) {
        case 'console':
          return new ConsoleOutput();
        case 'file':
          if (!config.file?.path) {
            throw new Error('File output requires a file path');
          }
          return new FileOutput(
            config.file.path,
            config.file.maxSize,
            config.file.maxFiles
          );
        default:
          throw new Error(`Unknown output type: ${outputType}`);
      }
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private async logEntry(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedEntry = this.formatter.format(entry);

    await Promise.all(
      this.outputs.map((output) => output.write(formattedEntry))
    );
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.globalContext, ...context },
      error,
    };
  }

  // Public logging methods
  async trace(message: string, context?: LogContext): Promise<void> {
    await this.logEntry(this.createLogEntry('trace', message, context));
  }

  async debug(message: string, context?: LogContext): Promise<void> {
    await this.logEntry(this.createLogEntry('debug', message, context));
  }

  async info(message: string, context?: LogContext): Promise<void> {
    await this.logEntry(this.createLogEntry('info', message, context));
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    await this.logEntry(this.createLogEntry('warn', message, context));
  }

  async error(
    message: string,
    context?: LogContext,
    error?: Error
  ): Promise<void> {
    await this.logEntry(this.createLogEntry('error', message, context, error));
  }

  async fatal(
    message: string,
    context?: LogContext,
    error?: Error
  ): Promise<void> {
    await this.logEntry(this.createLogEntry('fatal', message, context, error));
  }

  // Convenience methods
  async logError(error: Error, context?: LogContext): Promise<void> {
    if (error instanceof BaseError) {
      await this.logEntry(
        this.createLogEntry(
          error.logLevel,
          error.message,
          {
            ...context,
            ...error.context,
            code: error.code,
            statusCode: error.statusCode,
          },
          error
        )
      );
    } else {
      await this.error(error.message, context, error);
    }
  }

  async logResult<T>(
    result: T,
    operation: string,
    context?: LogContext
  ): Promise<T> {
    await this.info(`${operation} completed successfully`, context);
    return result;
  }

  async logDuration<T>(
    fn: () => Promise<T>,
    operation: string,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    await this.debug(`Starting ${operation}`, context);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      await this.info(`${operation} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.error(
        `${operation} failed`,
        { ...context, duration },
        error as Error
      );
      throw error;
    }
  }

  // Configuration methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  addGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  removeGlobalContext(key: string): void {
    delete this.globalContext[key];
  }

  clearGlobalContext(): void {
    this.globalContext = {};
  }

  // Child logger with additional context
  child(context: LogContext): Logger {
    const childConfig = {
      ...this.config,
      context: { ...this.globalContext, ...context },
    };
    return new Logger(childConfig);
  }
}

// Default logger instance
let defaultLogger: Logger | null = null;

export function createLogger(config: LoggingConfig): Logger {
  return new Logger(config);
}

export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}

export function getDefaultLogger(): Logger {
  if (!defaultLogger) {
    throw new Error('Default logger not set. Call setDefaultLogger first.');
  }
  return defaultLogger;
}

// Convenience functions that use the default logger
export const log = {
  trace: (message: string, context?: LogContext) =>
    getDefaultLogger().trace(message, context),
  debug: (message: string, context?: LogContext) =>
    getDefaultLogger().debug(message, context),
  info: (message: string, context?: LogContext) =>
    getDefaultLogger().info(message, context),
  warn: (message: string, context?: LogContext) =>
    getDefaultLogger().warn(message, context),
  error: (message: string, context?: LogContext, error?: Error) =>
    getDefaultLogger().error(message, context, error),
  fatal: (message: string, context?: LogContext, error?: Error) =>
    getDefaultLogger().fatal(message, context, error),
  logError: (error: Error, context?: LogContext) =>
    getDefaultLogger().logError(error, context),
  logResult: <T>(result: T, operation: string, context?: LogContext) =>
    getDefaultLogger().logResult(result, operation, context),
  logDuration: <T>(
    fn: () => Promise<T>,
    operation: string,
    context?: LogContext
  ) => getDefaultLogger().logDuration(fn, operation, context),
};
