// Base types
export type Primitive = string | number | boolean | null | undefined;

export type JsonValue = Primitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

// Result types for error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Configuration types
export interface BaseConfigInterface {
  readonly name: string;
  readonly version: string;
  readonly environment: 'development' | 'production' | 'test';
  readonly debug?: boolean;
}

// Code analysis types
export interface CodeLocation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

export interface CodeRange {
  readonly start: CodeLocation;
  readonly end: CodeLocation;
}

export interface CodeIssue {
  readonly id: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly rule?: string;
  readonly location: CodeLocation;
  readonly range?: CodeRange;
  readonly fixable?: boolean;
  readonly suggestions?: string[];
}

export interface CodeAnalysisReport {
  readonly files: string[];
  readonly issues: CodeIssue[];
  readonly summary: {
    readonly totalFiles: number;
    readonly totalIssues: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
  };
  readonly metadata: {
    readonly timestamp: string;
    readonly duration: number;
    readonly version: string;
  };
}

// File system types
export interface FileInfo {
  readonly path: string;
  readonly size: number;
  readonly modified: Date;
  readonly isDirectory: boolean;
  readonly exists: boolean;
}

// Logging types
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  [key: string]: JsonValue;
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: LogContext;
  readonly error?: Error;
}

// Plugin types
export interface PluginMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author?: string;
  readonly dependencies?: string[];
}

export interface Plugin {
  readonly metadata: PluginMetadata;
  initialize(): Promise<void>;
  analyze(files: string[]): Promise<CodeIssue[]>;
  cleanup?(): Promise<void>;
}

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Event types
export interface BaseEvent {
  readonly type: string;
  readonly timestamp: string;
  readonly source: string;
}

export interface AnalysisStartedEvent extends BaseEvent {
  readonly type: 'analysis.started';
  readonly files: string[];
}

export interface AnalysisCompletedEvent extends BaseEvent {
  readonly type: 'analysis.completed';
  readonly report: CodeAnalysisReport;
}

export interface AnalysisErrorEvent extends BaseEvent {
  readonly type: 'analysis.error';
  readonly error: Error;
}

export type AnalysisEvent =
  | AnalysisStartedEvent
  | AnalysisCompletedEvent
  | AnalysisErrorEvent;
