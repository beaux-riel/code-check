import { RuleMetadata, RuleSetMetadata } from '../rules/types';
import { ruleLibrary } from '../rules/rule-library';

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  enabled: boolean;
  fixable: boolean;
  tags: string[];
  configuration?: Record<string, any>;
}

export interface RuleSet {
  name: string;
  version: string;
  rules: Rule[];
  extends?: string[];
}

// Convert RuleMetadata to legacy Rule interface
function convertRule(ruleMetadata: RuleMetadata): Rule {
  return {
    id: ruleMetadata.id,
    name: ruleMetadata.name,
    description: ruleMetadata.description,
    severity: ruleMetadata.severity,
    category: ruleMetadata.category,
    enabled: ruleMetadata.enabled,
    fixable: ruleMetadata.fixable,
    tags: ruleMetadata.tags,
    configuration: ruleMetadata.configuration,
  };
}

// Convert RuleSetMetadata to legacy RuleSet interface
function convertRuleSet(ruleSetMetadata: RuleSetMetadata): RuleSet {
  return {
    name: ruleSetMetadata.name,
    version: ruleSetMetadata.version,
    rules: ruleSetMetadata.rules.map(convertRule),
    extends: ruleSetMetadata.extends,
  };
}

export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();
  private ruleSets: Map<string, RuleSet> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.loadFromRuleLibrary();
  }

  private loadFromRuleLibrary(): void {
    // Load all rules from the new rule library
    const allRules = ruleLibrary.getAllRules();
    for (const rule of allRules) {
      this.registerRule(convertRule(rule));
    }

    // Load all rule sets from the new rule library
    const allRuleSets = ruleLibrary.getAllRuleSets();
    for (const ruleSet of allRuleSets) {
      this.registerRuleSet(convertRuleSet(ruleSet));
    }
  }

  public registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  public registerRuleSet(ruleSet: RuleSet): void {
    this.ruleSets.set(ruleSet.name, ruleSet);

    // Register all rules in the ruleset
    for (const rule of ruleSet.rules) {
      this.registerRule(rule);
    }

    // Handle extends property
    if (ruleSet.extends) {
      for (const extendedSetName of ruleSet.extends) {
        const extendedSet = this.ruleSets.get(extendedSetName);
        if (extendedSet) {
          for (const rule of extendedSet.rules) {
            // Don't override existing rules
            if (!this.rules.has(rule.id)) {
              this.registerRule(rule);
            }
          }
        }
      }
    }
  }

  public getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  public getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  public getEnabledRules(): Rule[] {
    return this.getAllRules().filter((rule) => rule.enabled);
  }

  public getRulesByCategory(category: string): Rule[] {
    return this.getAllRules().filter((rule) => rule.category === category);
  }

  public getRulesByTag(tag: string): Rule[] {
    return this.getAllRules().filter((rule) => rule.tags.includes(tag));
  }

  public getRulesBySeverity(severity: 'error' | 'warning' | 'info'): Rule[] {
    return this.getAllRules().filter((rule) => rule.severity === severity);
  }

  public enableRule(id: string): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableRule(id: string): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = false;
    }
  }

  public updateRuleConfiguration(
    id: string,
    configuration: Record<string, any>
  ): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.configuration = { ...rule.configuration, ...configuration };
    }
  }

  public updateRuleSeverity(
    id: string,
    severity: 'error' | 'warning' | 'info'
  ): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.severity = severity;
    }
  }

  public getRuleSet(name: string): RuleSet | undefined {
    return this.ruleSets.get(name);
  }

  public getAllRuleSets(): RuleSet[] {
    return Array.from(this.ruleSets.values());
  }

  // New methods to access the modern rule library
  public getRuleLibrary() {
    return ruleLibrary;
  }

  public getResolvedRules(ruleSetNames?: string[]): Rule[] {
    const resolvedRules = ruleLibrary.getResolvedRules(ruleSetNames);
    return resolvedRules.map(convertRule);
  }

  public updateConfiguration(config: any): void {
    ruleLibrary.updateConfiguration(config);
    // Reload rules from the rule library to reflect changes
    this.loadFromRuleLibrary();
  }

  private initializeDefaultRules(): void {
    const defaultRules: Rule[] = [
      {
        id: 'missing-return-type',
        name: 'Missing Return Type',
        description: 'Functions should have explicit return type annotations',
        severity: 'warning',
        category: 'TypeScript',
        enabled: true,
        fixable: true,
        tags: ['typescript', 'types', 'best-practice'],
      },
      {
        id: 'missing-type-annotation',
        name: 'Missing Type Annotation',
        description: 'Variables should have explicit type annotations',
        severity: 'info',
        category: 'TypeScript',
        enabled: true,
        fixable: true,
        tags: ['typescript', 'types', 'best-practice'],
      },
      {
        id: 'runtime-error',
        name: 'Runtime Error',
        description: 'Code produces runtime errors when executed',
        severity: 'error',
        category: 'Runtime',
        enabled: true,
        fixable: false,
        tags: ['runtime', 'error', 'execution'],
      },
      {
        id: 'performance-issue',
        name: 'Performance Issue',
        description: 'Code has performance issues',
        severity: 'warning',
        category: 'Performance',
        enabled: true,
        fixable: false,
        tags: ['performance', 'optimization'],
      },
      {
        id: 'security-vulnerability',
        name: 'Security Vulnerability',
        description: 'Code contains potential security vulnerabilities',
        severity: 'error',
        category: 'Security',
        enabled: true,
        fixable: false,
        tags: ['security', 'vulnerability'],
      },
      {
        id: 'code-complexity',
        name: 'Code Complexity',
        description: 'Code is too complex and should be refactored',
        severity: 'warning',
        category: 'Quality',
        enabled: true,
        fixable: false,
        tags: ['complexity', 'maintainability', 'refactoring'],
      },
    ];

    for (const rule of defaultRules) {
      this.registerRule(rule);
    }

    // Register default rule sets
    this.registerRuleSet({
      name: 'typescript-recommended',
      version: '1.0.0',
      rules: [
        this.getRule('missing-return-type')!,
        this.getRule('missing-type-annotation')!,
      ],
    });

    this.registerRuleSet({
      name: 'security-recommended',
      version: '1.0.0',
      rules: [this.getRule('security-vulnerability')!],
    });

    this.registerRuleSet({
      name: 'performance-recommended',
      version: '1.0.0',
      rules: [this.getRule('performance-issue')!],
    });
  }
}
