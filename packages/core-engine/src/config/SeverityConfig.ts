export interface SeverityLevel {
  name: 'error' | 'warning' | 'info';
  weight: number;
  color: string;
  icon: string;
  description: string;
}

export interface SeverityThreshold {
  level: 'error' | 'warning' | 'info';
  maxCount: number;
  failOnExceed: boolean;
}

export interface SeverityConfig {
  levels: SeverityLevel[];
  thresholds: SeverityThreshold[];
  defaultLevel: 'error' | 'warning' | 'info';
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  condition: {
    ruleId?: string;
    category?: string;
    tag?: string;
    count?: number;
    percentage?: number;
  };
  action: {
    escalateTo: 'error' | 'warning' | 'info';
    notify?: boolean;
    block?: boolean;
  };
}

export class SeverityConfigManager {
  private config: SeverityConfig;

  constructor(config?: Partial<SeverityConfig>) {
    this.config = {
      levels: [
        {
          name: 'error',
          weight: 100,
          color: '#ff4444',
          icon: '❌',
          description: 'Critical issues that must be fixed',
        },
        {
          name: 'warning',
          weight: 50,
          color: '#ffaa44',
          icon: '⚠️',
          description: 'Important issues that should be addressed',
        },
        {
          name: 'info',
          weight: 10,
          color: '#4444ff',
          icon: 'ℹ️',
          description: 'Informational messages and suggestions',
        },
      ],
      thresholds: [
        {
          level: 'error',
          maxCount: 0,
          failOnExceed: true,
        },
        {
          level: 'warning',
          maxCount: 10,
          failOnExceed: false,
        },
        {
          level: 'info',
          maxCount: 50,
          failOnExceed: false,
        },
      ],
      defaultLevel: 'info',
      escalationRules: [],
      ...config,
    };
  }

  public getLevel(
    name: 'error' | 'warning' | 'info'
  ): SeverityLevel | undefined {
    return this.config.levels.find((level) => level.name === name);
  }

  public getAllLevels(): SeverityLevel[] {
    return this.config.levels;
  }

  public getThreshold(
    level: 'error' | 'warning' | 'info'
  ): SeverityThreshold | undefined {
    return this.config.thresholds.find(
      (threshold) => threshold.level === level
    );
  }

  public getAllThresholds(): SeverityThreshold[] {
    return this.config.thresholds;
  }

  public getDefaultLevel(): 'error' | 'warning' | 'info' {
    return this.config.defaultLevel;
  }

  public setDefaultLevel(level: 'error' | 'warning' | 'info'): void {
    this.config.defaultLevel = level;
  }

  public updateThreshold(
    level: 'error' | 'warning' | 'info',
    maxCount: number,
    failOnExceed: boolean
  ): void {
    const threshold = this.getThreshold(level);
    if (threshold) {
      threshold.maxCount = maxCount;
      threshold.failOnExceed = failOnExceed;
    } else {
      this.config.thresholds.push({
        level,
        maxCount,
        failOnExceed,
      });
    }
  }

  public addEscalationRule(rule: EscalationRule): void {
    this.config.escalationRules.push(rule);
  }

  public removeEscalationRule(ruleId: string): void {
    this.config.escalationRules = this.config.escalationRules.filter(
      (rule) => rule.id !== ruleId
    );
  }

  public getEscalationRules(): EscalationRule[] {
    return this.config.escalationRules;
  }

  public checkThresholds(issueCounts: {
    error: number;
    warning: number;
    info: number;
  }): {
    exceeded: boolean;
    violations: Array<{
      level: 'error' | 'warning' | 'info';
      count: number;
      maxCount: number;
      failOnExceed: boolean;
    }>;
  } {
    const violations: Array<{
      level: 'error' | 'warning' | 'info';
      count: number;
      maxCount: number;
      failOnExceed: boolean;
    }> = [];

    let exceeded = false;

    for (const threshold of this.config.thresholds) {
      const count = issueCounts[threshold.level];
      if (count > threshold.maxCount) {
        violations.push({
          level: threshold.level,
          count,
          maxCount: threshold.maxCount,
          failOnExceed: threshold.failOnExceed,
        });

        if (threshold.failOnExceed) {
          exceeded = true;
        }
      }
    }

    return { exceeded, violations };
  }

  public calculateSeverityScore(issueCounts: {
    error: number;
    warning: number;
    info: number;
  }): number {
    let score = 0;

    for (const level of this.config.levels) {
      const count = issueCounts[level.name];
      score += count * level.weight;
    }

    return score;
  }

  public getSeverityDistribution(issueCounts: {
    error: number;
    warning: number;
    info: number;
  }): Array<{
    level: 'error' | 'warning' | 'info';
    count: number;
    percentage: number;
    color: string;
    icon: string;
  }> {
    const total = issueCounts.error + issueCounts.warning + issueCounts.info;

    if (total === 0) {
      return [];
    }

    return this.config.levels.map((level) => ({
      level: level.name,
      count: issueCounts[level.name],
      percentage: Math.round((issueCounts[level.name] / total) * 100),
      color: level.color,
      icon: level.icon,
    }));
  }

  public getConfig(): SeverityConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<SeverityConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
