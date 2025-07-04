import * as vscode from 'vscode';

export interface CodeCheckConfig {
  apiEndpoint: string;
  enableInlineDiagnostics: boolean;
  enableCodeLens: boolean;
  diagnosticsLevel: 'error' | 'warning' | 'info';
  autoRunOnSave: boolean;
  maxConcurrentAudits: number;
  excludePatterns: string[];
  enableTelemetry: boolean;
  enableLanguageServer: boolean;
}

export class ConfigurationManager {
  private config: CodeCheckConfig;

  constructor() {
    this.config = this.loadConfig();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codeCheck')) {
        this.refresh();
      }
    });
  }

  public getConfig(): CodeCheckConfig {
    return { ...this.config };
  }

  public refresh(): void {
    this.config = this.loadConfig();
  }

  private loadConfig(): CodeCheckConfig {
    const config = vscode.workspace.getConfiguration('codeCheck');

    return {
      apiEndpoint: config.get<string>('apiEndpoint', 'http://localhost:3000'),
      enableInlineDiagnostics: config.get<boolean>(
        'enableInlineDiagnostics',
        true
      ),
      enableCodeLens: config.get<boolean>('enableCodeLens', true),
      diagnosticsLevel: config.get<'error' | 'warning' | 'info'>(
        'diagnosticsLevel',
        'warning'
      ),
      autoRunOnSave: config.get<boolean>('autoRunOnSave', false),
      maxConcurrentAudits: config.get<number>('maxConcurrentAudits', 3),
      excludePatterns: config.get<string[]>('excludePatterns', [
        'node_modules/**',
        'dist/**',
        'build/**',
        '*.min.js',
      ]),
      enableTelemetry: config.get<boolean>('enableTelemetry', true),
      enableLanguageServer: config.get<boolean>('enableLanguageServer', false),
    };
  }

  public async updateConfig(
    key: keyof CodeCheckConfig,
    value: any
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeCheck');
    await config.update(key, value, vscode.ConfigurationTarget.Workspace);
    this.refresh();
  }

  public getWorkspaceConfig<T>(section: string, defaultValue: T): T {
    return vscode.workspace.getConfiguration().get<T>(section, defaultValue);
  }
}
