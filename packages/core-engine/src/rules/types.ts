export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  fixable: boolean;
  tags: string[];
  configuration?: Record<string, any>;
  framework?: 'react' | 'vue' | 'angular' | 'node' | 'generic';
  languages?: string[];
  references?: string[];
  examples?: {
    bad?: string;
    good?: string;
  };
}

export interface RuleSetMetadata {
  name: string;
  version: string;
  description: string;
  category: string;
  framework?: string;
  rules: RuleMetadata[];
  extends?: string[];
  configuration?: Record<string, any>;
}

export interface ConfigurationOverride {
  rules?: {
    [ruleId: string]: {
      severity?: 'error' | 'warning' | 'info' | 'off';
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
}

export type SeverityLevel = 'error' | 'warning' | 'info' | 'off';
export type RuleCategory =
  | 'design-patterns'
  | 'security'
  | 'performance'
  | 'code-quality'
  | 'reusability';
