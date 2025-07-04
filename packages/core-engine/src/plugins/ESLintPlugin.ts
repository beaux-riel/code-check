import {
  Plugin,
  PluginMetadata,
  CodeIssue,
  CodeLocation,
  CodeRange,
} from '../types/index.js';
import { ESLint } from 'eslint';
import path from 'path';
import fs from 'fs';

export interface ESLintPluginConfig {
  configFile?: string;
  extensions?: string[];
  ignorePath?: string;
  rules?: Record<string, any>;
  baseConfig?: ESLint.ConfigData;
  useEslintrc?: boolean;
  fix?: boolean;
  fixTypes?: Array<'problem' | 'suggestion' | 'layout'>;
  cache?: boolean;
  cacheLocation?: string;
  cacheStrategy?: 'metadata' | 'content';
}

export class ESLintPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    name: 'ESLint',
    version: '1.0.0',
    description:
      'Static analysis using ESLint for JavaScript/TypeScript code quality and style issues',
    author: 'Code Check Team',
    dependencies: ['eslint'],
  };

  private eslint: ESLint | null = null;
  private config: ESLintPluginConfig;

  constructor(config: ESLintPluginConfig = {}) {
    this.config = {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
      useEslintrc: true,
      fix: false,
      cache: true,
      cacheStrategy: 'metadata',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      const eslintConfig: ESLint.Options = {
        useEslintrc: this.config.useEslintrc,
        fix: this.config.fix,
        cache: this.config.cache,
        cacheLocation: this.config.cacheLocation,
        cacheStrategy: this.config.cacheStrategy,
      };

      if (this.config.configFile) {
        eslintConfig.overrideConfigFile = this.config.configFile;
      }

      if (this.config.ignorePath) {
        eslintConfig.ignorePath = this.config.ignorePath;
      }

      if (this.config.baseConfig) {
        eslintConfig.overrideConfig = this.config.baseConfig;
      }

      if (this.config.fixTypes) {
        eslintConfig.fixTypes = this.config.fixTypes;
      }

      this.eslint = new ESLint(eslintConfig);
    } catch (error) {
      throw new Error(
        `Failed to initialize ESLint: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    if (!this.eslint) {
      throw new Error('ESLint plugin not initialized');
    }

    const issues: CodeIssue[] = [];
    const validFiles = this.filterValidFiles(files);

    if (validFiles.length === 0) {
      return issues;
    }

    try {
      const results = await this.eslint.lintFiles(validFiles);

      for (const result of results) {
        const fileIssues = this.mapESLintResults(result);
        issues.push(...fileIssues);
      }

      return issues;
    } catch (error) {
      throw new Error(
        `ESLint analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private filterValidFiles(files: string[]): string[] {
    const extensions = this.config.extensions || [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.mjs',
    ];
    return files.filter((file) => {
      const ext = path.extname(file);
      return extensions.includes(ext) && fs.existsSync(file);
    });
  }

  private mapESLintResults(result: ESLint.LintResult): CodeIssue[] {
    const issues: CodeIssue[] = [];

    for (const message of result.messages) {
      const location: CodeLocation = {
        file: result.filePath,
        line: message.line,
        column: message.column,
      };

      const range: CodeRange | undefined =
        message.endLine && message.endColumn
          ? {
              start: location,
              end: {
                file: result.filePath,
                line: message.endLine,
                column: message.endColumn,
              },
            }
          : undefined;

      const issue: CodeIssue = {
        id: `eslint-${result.filePath}-${message.line}-${message.column}-${message.ruleId || 'unknown'}`,
        severity: this.mapSeverity(message.severity),
        message: message.message,
        rule: message.ruleId || 'unknown',
        location,
        range,
        fixable: message.fix !== undefined,
        suggestions: message.suggestions?.map((s: any) => s.desc) || [],
      };

      issues.push(issue);
    }

    // Handle fatal errors
    if (result.fatalErrorCount > 0) {
      const fatalIssue: CodeIssue = {
        id: `eslint-fatal-${result.filePath}`,
        severity: 'error',
        message: `ESLint encountered ${result.fatalErrorCount} fatal error(s) in this file`,
        rule: 'fatal-error',
        location: {
          file: result.filePath,
          line: 1,
          column: 1,
        },
        fixable: false,
      };
      issues.push(fatalIssue);
    }

    return issues;
  }

  private mapSeverity(eslintSeverity: number): 'error' | 'warning' | 'info' {
    switch (eslintSeverity) {
      case 2:
        return 'error';
      case 1:
        return 'warning';
      case 0:
        return 'info';
      default:
        return 'warning';
    }
  }

  async cleanup(): Promise<void> {
    this.eslint = null;
  }

  public async getFormatterOutput(format: string = 'stylish'): Promise<string> {
    if (!this.eslint) {
      throw new Error('ESLint plugin not initialized');
    }

    try {
      const formatter = await this.eslint.loadFormatter(format);
      return formatter.format([]);
    } catch (error) {
      throw new Error(
        `Failed to load ESLint formatter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async getAvailableRules(): Promise<Record<string, any>> {
    if (!this.eslint) {
      throw new Error('ESLint plugin not initialized');
    }

    try {
      const config = await this.eslint.calculateConfigForFile('dummy.js');
      return config.rules || {};
    } catch (error) {
      throw new Error(
        `Failed to get ESLint rules: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public static createFactory(config?: ESLintPluginConfig) {
    return () => new ESLintPlugin(config);
  }
}
