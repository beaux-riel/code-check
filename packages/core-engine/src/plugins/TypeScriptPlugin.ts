import {
  Plugin,
  PluginMetadata,
  CodeIssue,
  CodeLocation,
  CodeRange,
} from '../types/index.js';
import * as ts from 'typescript';
import path from 'path';

export class TypeScriptPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    name: 'TypeScript',
    version: '1.0.0',
    description: 'TypeScript compiler diagnostics for static type checking',
    author: 'Code Check Team',
    dependencies: ['typescript'],
  };

  private configFilePath: string;
  private parsedCommandLine: ts.ParsedCommandLine;

  constructor(configFile: string) {
    this.configFilePath = configFile;
    this.parsedCommandLine = this.loadConfig(configFile);
  }

  private loadConfig(configFile: string): ts.ParsedCommandLine {
    const host: ts.ParseConfigHost = ts.sys;
    const config = ts.readConfigFile(configFile, host.readFile);

    if (config.error) {
      throw new Error(
        `Failed to read config file: ${config.error.messageText}`
      );
    }

    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      host,
      path.dirname(configFile)
    );

    if (parsed.errors.length > 0) {
      throw new Error(
        `Failed to parse TypeScript config: ${parsed.errors.map((e) => e.messageText).join(', ')}`
      );
    }

    return parsed;
  }

  async initialize(): Promise<void> {
    console.log('Initializing TypeScript Plugin');
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const program = ts.createProgram(files, this.parsedCommandLine.options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    return this.mapDiagnostics(diagnostics);
  }

  private mapDiagnostics(diagnostics: readonly ts.Diagnostic[]): CodeIssue[] {
    return diagnostics.map((diagnostic) => {
      const location: CodeLocation = {
        file: diagnostic.file?.fileName || 'unknown',
        line: diagnostic.start
          ? ts.getLineAndCharacterOfPosition(diagnostic.file!, diagnostic.start)
              .line + 1
          : 0,
        column: diagnostic.start
          ? ts.getLineAndCharacterOfPosition(diagnostic.file!, diagnostic.start)
              .character + 1
          : 0,
      };

      const issue: CodeIssue = {
        id: `ts-${diagnostic.code}`,
        severity:
          diagnostic.category === ts.DiagnosticCategory.Error
            ? 'error'
            : 'warning',
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ', '),
        rule: `TS${diagnostic.code}`,
        location,
        fixable: false,
      };

      return issue;
    });
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up TypeScript Plugin');
  }

  public static createFactory(configFile: string) {
    return () => new TypeScriptPlugin(configFile);
  }
}
