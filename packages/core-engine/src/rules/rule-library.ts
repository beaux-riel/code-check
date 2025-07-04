import { RuleSetMetadata, RuleMetadata, ConfigurationOverride } from './types';
import { securityRules } from './security';
import { performanceRules } from './performance';
import { designPatternRules } from './design-patterns';
import { codeQualityRules } from './code-quality';
import { reusabilityRules } from './reusability';

export class RuleLibrary {
  private ruleSets: Map<string, RuleSetMetadata> = new Map();
  private rules: Map<string, RuleMetadata> = new Map();
  private configuration: ConfigurationOverride = {};

  constructor() {
    this.initializeDefaultRuleSets();
  }

  private initializeDefaultRuleSets(): void {
    // Security Rule Set
    const securityRuleSet: RuleSetMetadata = {
      name: 'security-recommended',
      version: '1.0.0',
      description: 'OWASP-based security rules for identifying vulnerabilities',
      category: 'security',
      rules: securityRules,
    };
    this.registerRuleSet(securityRuleSet);

    // Performance Rule Set for React
    const reactPerformanceRuleSet: RuleSetMetadata = {
      name: 'react-performance',
      version: '1.0.0',
      description: 'Performance optimization rules for React applications',
      category: 'performance',
      framework: 'react',
      rules: performanceRules.filter(
        (rule) => !rule.framework || rule.framework === 'react'
      ),
    };
    this.registerRuleSet(reactPerformanceRuleSet);

    // Performance Rule Set for Vue
    const vuePerformanceRuleSet: RuleSetMetadata = {
      name: 'vue-performance',
      version: '1.0.0',
      description: 'Performance optimization rules for Vue applications',
      category: 'performance',
      framework: 'vue',
      rules: performanceRules.filter(
        (rule) => !rule.framework || rule.framework === 'vue'
      ),
    };
    this.registerRuleSet(vuePerformanceRuleSet);

    // General Performance Rule Set
    const generalPerformanceRuleSet: RuleSetMetadata = {
      name: 'performance-recommended',
      version: '1.0.0',
      description: 'General performance optimization rules',
      category: 'performance',
      rules: performanceRules.filter((rule) => !rule.framework),
    };
    this.registerRuleSet(generalPerformanceRuleSet);

    // Design Patterns Rule Set
    const designPatternsRuleSet: RuleSetMetadata = {
      name: 'design-patterns',
      version: '1.0.0',
      description: 'Common design pattern implementation guidelines',
      category: 'design-patterns',
      rules: designPatternRules,
    };
    this.registerRuleSet(designPatternsRuleSet);

    // Code Quality Rule Set
    const codeQualityRuleSet: RuleSetMetadata = {
      name: 'code-quality-essential',
      version: '1.0.0',
      description: 'Essential code quality and maintainability rules',
      category: 'code-quality',
      rules: codeQualityRules,
    };
    this.registerRuleSet(codeQualityRuleSet);

    // Reusability Rule Set
    const reusabilityRuleSet: RuleSetMetadata = {
      name: 'reusability-patterns',
      version: '1.0.0',
      description: 'Rules for improving code reusability and modularity',
      category: 'reusability',
      rules: reusabilityRules,
    };
    this.registerRuleSet(reusabilityRuleSet);

    // Combined Rule Sets
    const strictRuleSet: RuleSetMetadata = {
      name: 'strict',
      version: '1.0.0',
      description: 'Strict rule set with high standards for code quality',
      category: 'combined',
      extends: [
        'security-recommended',
        'code-quality-essential',
        'design-patterns',
      ],
      rules: [],
    };
    this.registerRuleSet(strictRuleSet);

    const recommendedRuleSet: RuleSetMetadata = {
      name: 'recommended',
      version: '1.0.0',
      description: 'Recommended rule set for most projects',
      category: 'combined',
      extends: ['security-recommended', 'code-quality-essential'],
      rules: [],
    };
    this.registerRuleSet(recommendedRuleSet);
  }

  public registerRuleSet(ruleSet: RuleSetMetadata): void {
    this.ruleSets.set(ruleSet.name, ruleSet);

    // Register all rules in the rule set
    for (const rule of ruleSet.rules) {
      this.registerRule(rule);
    }
  }

  public registerRule(rule: RuleMetadata): void {
    this.rules.set(rule.id, rule);
  }

  public getRuleSet(name: string): RuleSetMetadata | undefined {
    return this.ruleSets.get(name);
  }

  public getAllRuleSets(): RuleSetMetadata[] {
    return Array.from(this.ruleSets.values());
  }

  public getRule(id: string): RuleMetadata | undefined {
    const rule = this.rules.get(id);
    if (!rule) return undefined;

    // Apply configuration overrides
    const override = this.configuration.rules?.[id];
    if (override) {
      return {
        ...rule,
        severity:
          override.severity === 'off'
            ? 'info'
            : override.severity || rule.severity,
        enabled:
          override.enabled !== undefined ? override.enabled : rule.enabled,
        configuration: { ...rule.configuration, ...override.configuration },
      };
    }

    return rule;
  }

  public getAllRules(): RuleMetadata[] {
    return Array.from(this.rules.keys())
      .map((id) => this.getRule(id)!)
      .filter(Boolean);
  }

  public getEnabledRules(): RuleMetadata[] {
    return this.getAllRules().filter((rule) => {
      const config = this.configuration.rules?.[rule.id];
      const effectiveSeverity = config?.severity || rule.severity;
      return rule.enabled && effectiveSeverity !== 'off';
    });
  }

  public getRulesByCategory(category: string): RuleMetadata[] {
    return this.getAllRules().filter((rule) => rule.category === category);
  }

  public getRulesByFramework(framework: string): RuleMetadata[] {
    return this.getAllRules().filter(
      (rule) => !rule.framework || rule.framework === framework
    );
  }

  public getRulesByTag(tag: string): RuleMetadata[] {
    return this.getAllRules().filter((rule) => rule.tags.includes(tag));
  }

  public getRulesBySeverity(
    severity: 'error' | 'warning' | 'info'
  ): RuleMetadata[] {
    return this.getAllRules().filter((rule) => rule.severity === severity);
  }

  public getFixableRules(): RuleMetadata[] {
    return this.getAllRules().filter((rule) => rule.fixable);
  }

  public updateConfiguration(config: ConfigurationOverride): void {
    this.configuration = { ...this.configuration, ...config };
  }

  public getConfiguration(): ConfigurationOverride {
    return { ...this.configuration };
  }

  public enableRule(ruleId: string): void {
    if (!this.configuration.rules) {
      this.configuration.rules = {};
    }
    this.configuration.rules[ruleId] = {
      ...this.configuration.rules[ruleId],
      enabled: true,
    };
  }

  public disableRule(ruleId: string): void {
    if (!this.configuration.rules) {
      this.configuration.rules = {};
    }
    this.configuration.rules[ruleId] = {
      ...this.configuration.rules[ruleId],
      enabled: false,
    };
  }

  public updateRuleSeverity(
    ruleId: string,
    severity: 'error' | 'warning' | 'info' | 'off'
  ): void {
    if (!this.configuration.rules) {
      this.configuration.rules = {};
    }
    this.configuration.rules[ruleId] = {
      ...this.configuration.rules[ruleId],
      severity,
    };
  }

  public updateRuleConfiguration(
    ruleId: string,
    configuration: Record<string, any>
  ): void {
    if (!this.configuration.rules) {
      this.configuration.rules = {};
    }
    this.configuration.rules[ruleId] = {
      ...this.configuration.rules[ruleId],
      configuration: {
        ...this.configuration.rules[ruleId]?.configuration,
        ...configuration,
      },
    };
  }

  public enableRuleSet(ruleSetName: string): void {
    if (!this.configuration.ruleSets) {
      this.configuration.ruleSets = {};
    }
    this.configuration.ruleSets[ruleSetName] = {
      ...this.configuration.ruleSets[ruleSetName],
      enabled: true,
    };
  }

  public disableRuleSet(ruleSetName: string): void {
    if (!this.configuration.ruleSets) {
      this.configuration.ruleSets = {};
    }
    this.configuration.ruleSets[ruleSetName] = {
      ...this.configuration.ruleSets[ruleSetName],
      enabled: false,
    };
  }

  public getResolvedRules(ruleSetNames?: string[]): RuleMetadata[] {
    if (!ruleSetNames || ruleSetNames.length === 0) {
      return this.getEnabledRules();
    }

    const resolvedRules = new Map<string, RuleMetadata>();

    for (const ruleSetName of ruleSetNames) {
      const ruleSet = this.getRuleSet(ruleSetName);
      if (!ruleSet) continue;

      // Check if rule set is enabled
      const ruleSetConfig = this.configuration.ruleSets?.[ruleSetName];
      if (ruleSetConfig?.enabled === false) continue;

      // Process extended rule sets first
      if (ruleSet.extends) {
        const extendedRules = this.getResolvedRules(ruleSet.extends);
        for (const rule of extendedRules) {
          resolvedRules.set(rule.id, rule);
        }
      }

      // Add rules from current rule set
      for (const ruleMetadata of ruleSet.rules) {
        const rule = this.getRule(ruleMetadata.id);
        if (rule && rule.enabled) {
          resolvedRules.set(rule.id, rule);
        }
      }
    }

    return Array.from(resolvedRules.values());
  }

  public exportConfiguration(): string {
    const config = {
      extends: ['recommended'],
      rules: this.configuration.rules || {},
      ruleSets: this.configuration.ruleSets || {},
    };

    return JSON.stringify(config, null, 2);
  }

  public importConfiguration(configString: string): void {
    try {
      const config = JSON.parse(configString);
      this.updateConfiguration(config);
    } catch (error) {
      throw new Error(
        `Failed to parse configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const ruleLibrary = new RuleLibrary();
