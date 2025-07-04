import {
  Plugin,
  PluginMetadata,
  CodeIssue,
  SecurityVulnerability,
} from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface NpmAuditConfig {
  auditLevel?: 'low' | 'moderate' | 'high' | 'critical';
  productionOnly?: boolean;
  registry?: string;
  timeout?: number;
  skipUnusedDependencies?: boolean;
}

export interface NpmAuditVulnerability {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  overview: string;
  recommendation: string;
  url: string;
  cwe?: string;
  cvss?: {
    score: number;
    vectorString: string;
  };
  range: string;
  versions: string[];
  via: string[] | NpmAuditVulnerability[];
  effects: string[];
  fixAvailable:
    | boolean
    | { name: string; version: string; isSemVerMajor: boolean };
}

export interface NpmAuditReport {
  auditReportVersion: number;
  vulnerabilities: Record<string, NpmAuditVulnerability>;
  metadata: {
    vulnerabilities: {
      total: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
    };
    dependencies: {
      prod: number;
      dev: number;
      optional: number;
      peer: number;
      peerOptional: number;
      total: number;
    };
  };
}

export class NpmAuditPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    name: 'NPM Audit',
    version: '1.0.0',
    description: 'Security vulnerability scanner for NPM dependencies',
    author: 'Code Check Team',
    dependencies: ['npm'],
  };

  private config: NpmAuditConfig & {
    auditLevel: 'low' | 'moderate' | 'high' | 'critical';
    productionOnly: boolean;
    timeout: number;
    skipUnusedDependencies: boolean;
  };

  constructor(config: NpmAuditConfig = {}) {
    this.config = {
      auditLevel: 'low',
      productionOnly: false,
      timeout: 30000,
      skipUnusedDependencies: false,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // Verify npm is available
    try {
      await execAsync('npm --version');
    } catch (error) {
      throw new Error('npm is not available. Please install Node.js and npm.');
    }
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const packageJsonFiles = this.findPackageJsonFiles(files);

    for (const packageJsonFile of packageJsonFiles) {
      try {
        const projectDir = path.dirname(packageJsonFile);
        const auditResults = await this.runNpmAudit(projectDir);
        const vulnerabilityIssues = this.mapVulnerabilities(
          auditResults,
          packageJsonFile
        );
        issues.push(...vulnerabilityIssues);
      } catch (error) {
        issues.push({
          id: `npm-audit-error-${packageJsonFile}`,
          severity: 'error',
          message: `Failed to run npm audit: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'npm-audit-error',
          location: {
            file: packageJsonFile,
            line: 1,
            column: 1,
          },
          fixable: false,
        });
      }
    }

    return issues;
  }

  private findPackageJsonFiles(files: string[]): string[] {
    const packageJsonFiles: string[] = [];

    for (const file of files) {
      if (path.basename(file) === 'package.json' && fs.existsSync(file)) {
        packageJsonFiles.push(file);
      }
    }

    // If no package.json files were explicitly provided, look for them in the directories
    if (packageJsonFiles.length === 0) {
      const directories = new Set<string>();
      files.forEach((file) => {
        directories.add(path.dirname(file));
      });

      for (const dir of directories) {
        const packageJsonPath = path.join(dir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          packageJsonFiles.push(packageJsonPath);
        }
      }
    }

    return packageJsonFiles;
  }

  private async runNpmAudit(projectDir: string): Promise<NpmAuditReport> {
    const auditCommand = this.buildAuditCommand();
    const options = {
      cwd: projectDir,
      timeout: this.config.timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    };

    try {
      const { stdout } = await execAsync(auditCommand, options);
      return JSON.parse(stdout) as NpmAuditReport;
    } catch (error: any) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout) as NpmAuditReport;
        } catch {
          throw new Error(`Failed to parse npm audit output: ${error.message}`);
        }
      }
      throw new Error(`npm audit failed: ${error.message}`);
    }
  }

  private buildAuditCommand(): string {
    let command = 'npm audit --json';

    if (this.config.productionOnly) {
      command += ' --production';
    }

    if (this.config.registry) {
      command += ` --registry=${this.config.registry}`;
    }

    return command;
  }

  private mapVulnerabilities(
    auditReport: NpmAuditReport,
    packageJsonFile: string
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    for (const [packageName, vulnerability] of Object.entries(
      auditReport.vulnerabilities
    )) {
      if (this.shouldSkipVulnerability(vulnerability)) {
        continue;
      }

      const issue: CodeIssue = {
        id: `npm-audit-${packageName}-${vulnerability.severity}`,
        severity: this.mapSeverity(vulnerability.severity),
        message: `${vulnerability.title} in ${packageName}. ${vulnerability.overview}`,
        rule: 'npm-audit-vulnerability',
        location: {
          file: packageJsonFile,
          line: this.findDependencyLine(packageJsonFile, packageName),
          column: 1,
        },
        fixable: vulnerability.fixAvailable !== false,
        suggestions: [
          vulnerability.recommendation,
          ...(vulnerability.fixAvailable &&
          typeof vulnerability.fixAvailable === 'object'
            ? [
                `Update to ${vulnerability.fixAvailable.name}@${vulnerability.fixAvailable.version}`,
              ]
            : []),
        ],
      };

      issues.push(issue);
    }

    return issues;
  }

  private shouldSkipVulnerability(
    vulnerability: NpmAuditVulnerability
  ): boolean {
    const severityLevels = ['low', 'moderate', 'high', 'critical'];
    const configLevel = severityLevels.indexOf(this.config.auditLevel);
    const vulnLevel = severityLevels.indexOf(vulnerability.severity);

    return vulnLevel < configLevel;
  }

  private mapSeverity(npmSeverity: string): 'error' | 'warning' | 'info' {
    switch (npmSeverity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'moderate':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  }

  private findDependencyLine(
    packageJsonFile: string,
    packageName: string
  ): number {
    try {
      const content = fs.readFileSync(packageJsonFile, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`"${packageName}"`)) {
          return i + 1;
        }
      }
    } catch {
      // If we can't read the file or find the dependency, return line 1
    }

    return 1;
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for npm audit
  }

  public static createFactory(config?: NpmAuditConfig) {
    return () => new NpmAuditPlugin(config);
  }
}
