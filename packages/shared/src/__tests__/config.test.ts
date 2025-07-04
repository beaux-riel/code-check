import { describe, it, expect } from 'vitest';
import {
  AppConfigSchema,
  validateAppConfig,
  mergeConfigs,
  DEFAULT_CONFIG,
  BaseConfigSchema,
  LoggingConfigSchema,
} from '../config/schema.js';

describe('Configuration schema validation', () => {
  it('should validate a complete valid config', () => {
    const validConfig = {
      name: 'test-app',
      version: '1.0.0',
      environment: 'development' as const,
      debug: true,
      analysis: {
        include: ['src/**/*.ts'],
        exclude: ['node_modules/**'],
        maxIssues: 100,
        severity: 'error' as const,
        fixable: true,
      },
      logging: {
        level: 'info' as const,
        format: 'json' as const,
        outputs: ['console' as const],
      },
      plugins: [
        {
          name: 'test-plugin',
          enabled: true,
          priority: 1,
          options: { setting: 'value' },
        },
      ],
    };

    expect(() => validateAppConfig(validConfig)).not.toThrow();
    const result = validateAppConfig(validConfig);
    expect(result.name).toBe('test-app');
    expect(result.version).toBe('1.0.0');
  });

  it('should reject invalid config', () => {
    const invalidConfig = {
      name: '', // Invalid: empty name
      version: 'invalid-version', // Invalid: not semver
      environment: 'invalid', // Invalid: not allowed environment
    };

    expect(() => validateAppConfig(invalidConfig)).toThrow();
  });

  it('should apply defaults for optional fields', () => {
    const minimalConfig = {
      name: 'test-app',
      version: '1.0.0',
      environment: 'production' as const,
    };

    const result = validateAppConfig(minimalConfig);
    expect(result.plugins).toEqual([]);
    // analysis and logging are optional, so they're undefined when not provided
    expect(result.analysis).toBeUndefined();
    expect(result.logging).toBeUndefined();
  });

  it('should validate base config', () => {
    const baseConfig = {
      name: 'test',
      version: '1.0.0',
      environment: 'test' as const,
      debug: false,
    };

    expect(() => BaseConfigSchema.parse(baseConfig)).not.toThrow();
  });

  it('should validate logging config', () => {
    const loggingConfig = {
      level: 'debug' as const,
      format: 'pretty' as const,
      outputs: ['console' as const, 'file' as const],
      file: {
        path: '/tmp/app.log',
        maxSize: 1024 * 1024,
        maxFiles: 3,
      },
    };

    expect(() => LoggingConfigSchema.parse(loggingConfig)).not.toThrow();
  });
});

describe('Configuration merging', () => {
  it('should merge configs correctly', () => {
    const base = DEFAULT_CONFIG;
    const override = {
      debug: true,
      logging: {
        level: 'debug' as const,
        format: 'pretty' as const,
      },
      analysis: {
        maxIssues: 500,
      },
    };

    const merged = mergeConfigs(base, override);

    expect(merged.debug).toBe(true);
    expect(merged.logging?.level).toBe('debug');
    expect(merged.logging?.format).toBe('pretty');
    expect(merged.logging?.outputs).toEqual(['console']); // Should keep base value
    expect(merged.analysis?.maxIssues).toBe(500);
    expect(merged.analysis?.severity).toBe('warning'); // Should keep base value
  });

  it('should handle undefined overrides', () => {
    const base = DEFAULT_CONFIG;
    const override = {
      logging: undefined,
      analysis: undefined,
    };

    const merged = mergeConfigs(base, override);
    expect(merged.logging).toBe(base.logging);
    expect(merged.analysis).toBe(base.analysis);
  });
});
