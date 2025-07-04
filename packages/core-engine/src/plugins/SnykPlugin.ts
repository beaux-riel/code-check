import {
  Plugin,
  PluginMetadata,
  CodeIssue,
  SecurityVulnerability,
} from '../types/index.js';
import https from 'https';
import path from 'path';
import fs from 'fs';

export interface SnykConfig {
  apiToken: string;
  orgId?: string;
  baseUrl?: string;
  timeout?: number;
  includeDevDependencies?: boolean;
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SnykVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore?: number;
  cwe?: string[];
  cve?: string[];
  packageName: string;
  packageVersion: string;
  introducedThrough: string[];
  isUpgradable: boolean;
  isPatchable: boolean;
  upgradePath: string[];
  patchedVersions?: string;
  publicationTime?: string;
  disclosureTime?: string;
  exploitMaturity?:
    | 'mature'
    | 'proof-of-concept'
    | 'no-known-exploit'
    | 'no-data';
  malicious?: boolean;
}

export interface SnykTestResult {
  ok: boolean;
  vulnerabilities: SnykVulnerability[];
  dependencyCount: number;
  org: {
    name: string;
    id: string;
  };
  policy: string;
  isPrivate: boolean;
  licensesPolicy?: any;
  packageManager: string;
  ignoreSettings?: any;
  summary: string;
  filesystemPolicy?: boolean;
  filtered?: {
    ignore: SnykVulnerability[];
    patch: SnykVulnerability[];
  };
  uniqueCount?: number;
  projectName: string;
  displayTargetFile?: string;
  path: string;
}

export class SnykPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    name: 'Snyk',
    version: '1.0.0',
    description:
      'Snyk API integration for comprehensive vulnerability and license scanning',
    author: 'Code Check Team',
    dependencies: [],
  };

  private config: SnykConfig & {
    baseUrl: string;
    timeout: number;
    includeDevDependencies: boolean;
    severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  };

  constructor(config: SnykConfig) {
    if (!config.apiToken) {
      throw new Error('Snyk API token is required');
    }

    this.config = {
      baseUrl: 'https://snyk.io/api/v1',
      timeout: 60000,
      includeDevDependencies: true,
      severityThreshold: 'low',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // Verify API token is valid
    try {
      await this.makeRequest('/user/me', 'GET');
    } catch (error) {
      throw new Error(
        `Failed to authenticate with Snyk API: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const packageJsonFiles = this.findPackageJsonFiles(files);

    for (const packageJsonFile of packageJsonFiles) {
      try {
        const projectDir = path.dirname(packageJsonFile);
        const snykResults = await this.scanProject(projectDir, packageJsonFile);
        const vulnerabilityIssues = this.mapVulnerabilities(
          snykResults,
          packageJsonFile
        );
        issues.push(...vulnerabilityIssues);
      } catch (error) {
        issues.push({
          id: `snyk-error-${packageJsonFile}`,
          severity: 'error',
          message: `Failed to scan with Snyk: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'snyk-scan-error',
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

  private async scanProject(
    projectDir: string,
    packageJsonFile: string
  ): Promise<SnykTestResult> {
    const packageJsonContent = fs.readFileSync(packageJsonFile, 'utf8');
    const packageLockPath = path.join(projectDir, 'package-lock.json');
    const yarnLockPath = path.join(projectDir, 'yarn.lock');

    let lockFileContent = '';
    let packageManager = 'npm';

    if (fs.existsSync(packageLockPath)) {
      lockFileContent = fs.readFileSync(packageLockPath, 'utf8');
      packageManager = 'npm';
    } else if (fs.existsSync(yarnLockPath)) {
      lockFileContent = fs.readFileSync(yarnLockPath, 'utf8');
      packageManager = 'yarn';
    }

    const requestBody = {
      files: {
        target: {
          contents: packageJsonContent,
        },
      },
      packageManager,
    };

    if (lockFileContent) {
      (requestBody.files as any).additional = [
        {
          contents: lockFileContent,
        },
      ];
    }

    const endpoint = this.config.orgId
      ? `/orgs/${this.config.orgId}/test/npm`
      : '/test/npm';

    return this.makeRequest(endpoint, 'POST', requestBody);
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.config.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `token ${this.config.apiToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'code-check-snyk-plugin/1.0.0',
        },
        timeout: this.config.timeout,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);

            if (
              res.statusCode &&
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              resolve(jsonData);
            } else {
              reject(
                new Error(
                  `HTTP ${res.statusCode}: ${jsonData.message || 'Unknown error'}`
                )
              );
            }
          } catch (error) {
            reject(
              new Error(
                `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  private mapVulnerabilities(
    snykResult: SnykTestResult,
    packageJsonFile: string
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    for (const vulnerability of snykResult.vulnerabilities) {
      if (this.shouldSkipVulnerability(vulnerability)) {
        continue;
      }

      const issue: CodeIssue = {
        id: `snyk-${vulnerability.id}`,
        severity: this.mapSeverity(vulnerability.severity),
        message: `${vulnerability.title} in ${vulnerability.packageName}@${vulnerability.packageVersion}. ${vulnerability.description}`,
        rule: 'snyk-vulnerability',
        location: {
          file: packageJsonFile,
          line: this.findDependencyLine(
            packageJsonFile,
            vulnerability.packageName
          ),
          column: 1,
        },
        fixable: vulnerability.isUpgradable || vulnerability.isPatchable,
        suggestions: this.generateSuggestions(vulnerability),
      };

      issues.push(issue);
    }

    return issues;
  }

  private shouldSkipVulnerability(vulnerability: SnykVulnerability): boolean {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const configLevel = severityLevels.indexOf(this.config.severityThreshold);
    const vulnLevel = severityLevels.indexOf(vulnerability.severity);

    return vulnLevel < configLevel;
  }

  private mapSeverity(snykSeverity: string): 'error' | 'warning' | 'info' {
    switch (snykSeverity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  }

  private generateSuggestions(vulnerability: SnykVulnerability): string[] {
    const suggestions: string[] = [];

    if (vulnerability.isUpgradable && vulnerability.upgradePath.length > 0) {
      const upgradePath = vulnerability.upgradePath
        .filter((p) => typeof p === 'string')
        .join(' -> ');
      suggestions.push(`Upgrade path: ${upgradePath}`);
    }

    if (vulnerability.isPatchable) {
      suggestions.push('This vulnerability can be patched using Snyk');
    }

    if (vulnerability.patchedVersions) {
      suggestions.push(`Patched in versions: ${vulnerability.patchedVersions}`);
    }

    if (vulnerability.malicious) {
      suggestions.push(
        'This package is malicious and should be removed immediately'
      );
    }

    return suggestions;
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
    // No cleanup needed for Snyk API
  }

  public static createFactory(config: SnykConfig) {
    return () => new SnykPlugin(config);
  }
}
