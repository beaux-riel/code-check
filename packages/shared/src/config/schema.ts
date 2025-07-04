import { z } from 'zod';

// Base configuration schema
export const BaseConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+/, 'Version must be in semver format'),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean().optional(),
});

// Code analysis configuration
export const CodeAnalysisConfigSchema = z.object({
  include: z.array(z.string()).default(['src/**/*.ts', 'src/**/*.tsx']),
  exclude: z
    .array(z.string())
    .default(['node_modules/**', 'dist/**', '*.test.ts']),
  rules: z
    .record(
      z.string(),
      z.union([
        z.boolean(),
        z.string(),
        z.array(z.unknown()),
        z.record(z.unknown()),
      ])
    )
    .optional(),
  maxIssues: z.number().min(0).default(1000),
  severity: z.enum(['error', 'warning', 'info']).default('warning'),
  fixable: z.boolean().default(false),
});

// Logging configuration
export const LoggingConfigSchema = z.object({
  level: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  format: z.enum(['json', 'text', 'pretty']).default('text'),
  outputs: z.array(z.enum(['console', 'file'])).default(['console']),
  file: z
    .object({
      path: z.string().optional(),
      maxSize: z
        .number()
        .min(0)
        .default(10 * 1024 * 1024), // 10MB
      maxFiles: z.number().min(1).default(5),
    })
    .optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Plugin configuration
export const PluginConfigSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  priority: z.number().default(0),
  options: z.record(z.string(), z.unknown()).optional(),
});

// Complete application configuration
export const AppConfigSchema = BaseConfigSchema.extend({
  analysis: CodeAnalysisConfigSchema.optional(),
  logging: LoggingConfigSchema.optional(),
  plugins: z.array(PluginConfigSchema).default([]),
  cache: z
    .object({
      enabled: z.boolean().default(true),
      directory: z.string().optional(),
      ttl: z.number().min(0).default(3600), // 1 hour
    })
    .optional(),
  performance: z
    .object({
      maxConcurrency: z.number().min(1).default(4),
      timeout: z.number().min(0).default(30000), // 30 seconds
      memoryLimit: z.number().min(0).optional(),
    })
    .optional(),
});

// Type definitions
export type BaseConfig = {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  debug?: boolean;
};

export type CodeAnalysisConfig = {
  include: string[];
  exclude: string[];
  rules?: Record<
    string,
    boolean | string | unknown[] | Record<string, unknown>
  >;
  maxIssues: number;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
};

export type LoggingConfig = {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  format: 'json' | 'text' | 'pretty';
  outputs: ('console' | 'file')[];
  file?: {
    path?: string;
    maxSize: number;
    maxFiles: number;
  };
  context?: Record<string, unknown>;
};

export type PluginConfig = {
  name: string;
  enabled: boolean;
  priority: number;
  options?: Record<string, unknown>;
};

export type AppConfig = BaseConfig & {
  analysis?: CodeAnalysisConfig;
  logging?: LoggingConfig;
  plugins: PluginConfig[];
  cache?: {
    enabled: boolean;
    directory?: string;
    ttl: number;
  };
  performance?: {
    maxConcurrency: number;
    timeout: number;
    memoryLimit?: number;
  };
};

// Configuration validation utilities
export function validateConfig<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }
  return result.data;
}

export function validateAppConfig(data: unknown): any {
  return validateConfig(AppConfigSchema, data);
}

export function validatePartialConfig<T extends Record<string, any>>(
  schema: z.ZodObject<any>,
  data: unknown
): Partial<T> {
  const partialSchema = schema.partial();
  return validateConfig(partialSchema, data) as Partial<T>;
}

// Default configurations
export const DEFAULT_CONFIG: AppConfig = {
  name: 'code-check',
  version: '1.0.0',
  environment: 'development',
  plugins: [],
  analysis: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    exclude: ['node_modules/**', 'dist/**', '*.test.ts'],
    maxIssues: 1000,
    severity: 'warning',
    fixable: false,
  },
  logging: {
    level: 'info',
    format: 'text',
    outputs: ['console'],
    file: {
      maxSize: 10 * 1024 * 1024,
      maxFiles: 5,
    },
  },
};

// Configuration merging utility
export function mergeConfigs(
  base: AppConfig,
  override: Partial<AppConfig>
): AppConfig {
  return {
    ...base,
    ...override,
    analysis: override.analysis
      ? { ...base.analysis, ...override.analysis }
      : base.analysis,
    logging: override.logging
      ? { ...base.logging, ...override.logging }
      : base.logging,
    plugins: override.plugins ?? base.plugins,
    cache: override.cache ? { ...base.cache, ...override.cache } : base.cache,
    performance: override.performance
      ? { ...base.performance, ...override.performance }
      : base.performance,
  };
}
