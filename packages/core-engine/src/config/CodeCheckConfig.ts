import { ConfigurationOverride, SeverityLevel } from '../rules/types';

export interface CodeCheckConfig {
  // Rule configuration
  extends?: string[];
  rules?: {
    [ruleId: string]: {
      severity?: SeverityLevel;
      enabled?: boolean;
      configuration?: Record<string, any>;
    };
  };
  ruleSets?: {
    [ruleSetName: string]: {
      enabled?: boolean;
      configuration?: Record<string, any>;
    };
  };

  // Analysis configuration
  include?: string[];
  exclude?: string[];

  // Framework detection
  framework?: 'react' | 'vue' | 'angular' | 'node' | 'auto';

  // Severity configuration
  severity?: {
    defaultLevel?: SeverityLevel;
    thresholds?: {
      error?: { max: number; fail: boolean };
      warning?: { max: number; fail: boolean };
      info?: { max: number; fail: boolean };
    };
  };

  // Output configuration
  output?: {
    format?: 'json' | 'text' | 'html' | 'junit';
    file?: string;
    verbose?: boolean;
  };

  // Plugin configuration
  plugins?: string[];

  // Performance configuration
  performance?: {
    maxConcurrency?: number;
    timeout?: number;
    memoryLimit?: string;
  };

  // Cache configuration
  cache?: {
    enabled?: boolean;
    directory?: string;
    strategy?: 'aggressive' | 'conservative';
  };
}

export const defaultConfig: CodeCheckConfig = {
  extends: ['recommended'],
  include: [
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
  ],
  exclude: ['node_modules/**', 'dist/**', 'build/**', '*.min.js', '*.d.ts'],
  framework: 'auto',
  severity: {
    defaultLevel: 'info',
    thresholds: {
      error: { max: 0, fail: true },
      warning: { max: 10, fail: false },
      info: { max: 50, fail: false },
    },
  },
  output: {
    format: 'text',
    verbose: false,
  },
  plugins: [],
  performance: {
    maxConcurrency: 4,
    timeout: 60000, // 60 seconds
    memoryLimit: '512MB',
  },
  cache: {
    enabled: true,
    directory: '.codecheck-cache',
    strategy: 'conservative',
  },
  rules: {
    // Security rules - high priority
    'sql-injection': { severity: 'error', enabled: true },
    'xss-prevention': { severity: 'error', enabled: true },
    'csrf-protection': { severity: 'error', enabled: true },
    'hardcoded-secrets': { severity: 'error', enabled: true },
    'insecure-deserialization': { severity: 'error', enabled: true },
    'weak-cryptography': { severity: 'error', enabled: true },
    'eval-usage': { severity: 'error', enabled: true },

    // Security rules - medium priority
    'insecure-randomness': { severity: 'warning', enabled: true },
    'path-traversal': { severity: 'warning', enabled: true },
    'insecure-http': { severity: 'warning', enabled: true },
    'insecure-headers': { severity: 'warning', enabled: true },
    'regex-dos': { severity: 'warning', enabled: true },

    // Code quality rules
    'cyclomatic-complexity': {
      severity: 'warning',
      enabled: true,
      configuration: { maxComplexity: 10 },
    },
    'function-length': {
      severity: 'warning',
      enabled: true,
      configuration: { maxLines: 50 },
    },
    'parameter-count': {
      severity: 'warning',
      enabled: true,
      configuration: { maxParameters: 5 },
    },
    'nested-depth': {
      severity: 'warning',
      enabled: true,
      configuration: { maxDepth: 4 },
    },
    'duplicate-code': { severity: 'warning', enabled: true },
    'magic-numbers': { severity: 'warning', enabled: true },
    'dead-code': { severity: 'warning', enabled: true },
    'error-handling': { severity: 'warning', enabled: true },
    'no-var': { severity: 'warning', enabled: true },

    // Performance rules (framework-specific severity)
    'react-avoid-anonymous-functions': { severity: 'warning', enabled: true },
    'react-memo-expensive-components': { severity: 'info', enabled: true },
    'react-use-callback-dependencies': { severity: 'warning', enabled: true },
    'react-avoid-object-inline-props': { severity: 'warning', enabled: true },
    'react-key-prop-optimization': { severity: 'warning', enabled: true },
    'vue-v-for-key-required': { severity: 'warning', enabled: true },
    'avoid-memory-leaks': { severity: 'warning', enabled: true },

    // Design patterns - mostly informational
    'singleton-pattern': { severity: 'info', enabled: true },
    'factory-pattern': { severity: 'info', enabled: true },
    'observer-pattern': { severity: 'info', enabled: true },
    'mvc-pattern': { severity: 'warning', enabled: true },

    // Reusability rules
    'dry-principle': { severity: 'warning', enabled: true },
    'parameterize-hardcoded-values': { severity: 'warning', enabled: true },
    'shared-constants': { severity: 'warning', enabled: true },

    // Style and formatting - informational by default
    'line-length': {
      severity: 'info',
      enabled: true,
      configuration: { maxLength: 120 },
    },
    'consistent-naming': { severity: 'info', enabled: true },
    'variable-naming': { severity: 'info', enabled: true },
    'function-naming': { severity: 'info', enabled: true },
    'prefer-const': { severity: 'info', enabled: true },
  },
  ruleSets: {
    'security-recommended': { enabled: true },
    'code-quality-essential': { enabled: true },
    'performance-recommended': { enabled: true },
    'design-patterns': { enabled: false }, // Optional by default
    'reusability-patterns': { enabled: true },
  },
};

export class CodeCheckConfigManager {
  private config: CodeCheckConfig;

  constructor(userConfig?: Partial<CodeCheckConfig>) {
    this.config = this.mergeConfigs(defaultConfig, userConfig);
  }

  private mergeConfigs(
    base: CodeCheckConfig,
    override?: Partial<CodeCheckConfig>
  ): CodeCheckConfig {
    if (!override) return { ...base };

    return {
      ...base,
      ...override,
      rules: { ...base.rules, ...override.rules },
      ruleSets: { ...base.ruleSets, ...override.ruleSets },
      severity: { ...base.severity, ...override.severity },
      output: { ...base.output, ...override.output },
      performance: { ...base.performance, ...override.performance },
      cache: { ...base.cache, ...override.cache },
    };
  }

  public getConfig(): CodeCheckConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<CodeCheckConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
  }

  public getRuleConfiguration(ruleId: string): any {
    return this.config.rules?.[ruleId];
  }

  public setRuleConfiguration(
    ruleId: string,
    config: {
      severity?: SeverityLevel;
      enabled?: boolean;
      configuration?: Record<string, any>;
    }
  ): void {
    if (!this.config.rules) {
      this.config.rules = {};
    }
    this.config.rules[ruleId] = { ...this.config.rules[ruleId], ...config };
  }

  public enableRule(ruleId: string): void {
    this.setRuleConfiguration(ruleId, { enabled: true });
  }

  public disableRule(ruleId: string): void {
    this.setRuleConfiguration(ruleId, { enabled: false });
  }

  public setRuleSeverity(ruleId: string, severity: SeverityLevel): void {
    this.setRuleConfiguration(ruleId, { severity });
  }

  public enableRuleSet(ruleSetName: string): void {
    if (!this.config.ruleSets) {
      this.config.ruleSets = {};
    }
    this.config.ruleSets[ruleSetName] = {
      ...this.config.ruleSets[ruleSetName],
      enabled: true,
    };
  }

  public disableRuleSet(ruleSetName: string): void {
    if (!this.config.ruleSets) {
      this.config.ruleSets = {};
    }
    this.config.ruleSets[ruleSetName] = {
      ...this.config.ruleSets[ruleSetName],
      enabled: false,
    };
  }

  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public loadConfigFromFile(configContent: string): void {
    try {
      const userConfig = JSON.parse(configContent);
      this.config = this.mergeConfigs(defaultConfig, userConfig);
    } catch (error) {
      throw new Error(
        `Failed to parse configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public toConfigurationOverride(): ConfigurationOverride {
    return {
      rules: this.config.rules,
      ruleSets: this.config.ruleSets,
    };
  }
}
