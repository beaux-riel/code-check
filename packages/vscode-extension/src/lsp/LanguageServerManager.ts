import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { ConfigurationManager } from '../config/ConfigurationManager';

export class LanguageServerManager {
  private serverProcess: ChildProcess | null = null;
  private isRunning = false;

  constructor(
    private context: vscode.ExtensionContext,
    private configManager: ConfigurationManager
  ) {}

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Language server is already running');
      return;
    }

    try {
      // Check if the CLI is available
      const cliPath = this.findCliPath();
      if (!cliPath) {
        console.log('Code Check CLI not found, language server disabled');
        return;
      }

      console.log('Starting Code Check Language Server...');

      // Start the language server process
      this.serverProcess = spawn(cliPath, ['--lsp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CODE_CHECK_LSP_MODE: 'true',
        },
      });

      if (!this.serverProcess.pid) {
        throw new Error('Failed to start language server process');
      }

      // Handle process events
      this.serverProcess.on('exit', (code) => {
        console.log(`Language server exited with code ${code}`);
        this.isRunning = false;
        this.serverProcess = null;
      });

      this.serverProcess.on('error', (error) => {
        console.error('Language server error:', error);
        this.isRunning = false;
        this.serverProcess = null;
      });

      // Setup communication with the language server
      this.setupCommunication();

      this.isRunning = true;
      console.log('Code Check Language Server started successfully');
    } catch (error) {
      console.error('Failed to start language server:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning || !this.serverProcess) {
      return;
    }

    console.log('Stopping Code Check Language Server...');

    try {
      // Send shutdown request
      this.sendShutdownRequest();

      // Wait a moment for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force kill if still running
      if (this.serverProcess && !this.serverProcess.killed) {
        this.serverProcess.kill('SIGTERM');

        // Force kill after 5 seconds if still not terminated
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
          }
        }, 5000);
      }

      this.isRunning = false;
      this.serverProcess = null;
      console.log('Code Check Language Server stopped');
    } catch (error) {
      console.error('Error stopping language server:', error);
    }
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  public isLanguageServerRunning(): boolean {
    return this.isRunning;
  }

  private findCliPath(): string | null {
    // Try to find the CLI in common locations
    const possiblePaths = [
      'code-check', // Global install
      './node_modules/.bin/code-check', // Local install
      '../cli/dist/bin.js', // Development
      process.env.CODE_CHECK_CLI_PATH, // Environment variable
    ].filter(Boolean);

    for (const path of possiblePaths) {
      try {
        // Test if the CLI exists and is executable
        const testProcess = spawn(path!, ['--version'], { stdio: 'ignore' });
        if (testProcess.pid) {
          testProcess.kill();
          return path!;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    return null;
  }

  private setupCommunication(): void {
    if (!this.serverProcess) {
      return;
    }

    // Handle stdout (LSP messages)
    this.serverProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      this.handleLspMessage(message);
    });

    // Handle stderr (error messages)
    this.serverProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      console.error('Language server stderr:', error);
    });
  }

  private handleLspMessage(message: string): void {
    try {
      // Parse LSP messages (JSON-RPC format)
      const lines = message.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith('Content-Length:')) {
          continue; // Skip headers
        }

        if (line.trim() === '') {
          continue; // Skip empty lines
        }

        try {
          const jsonMessage = JSON.parse(line);
          this.processLspMessage(jsonMessage);
        } catch (parseError) {
          // Might be a partial message or non-JSON output
          console.debug('Non-JSON message from language server:', line);
        }
      }
    } catch (error) {
      console.error('Error handling LSP message:', error);
    }
  }

  private processLspMessage(message: any): void {
    // Handle different types of LSP messages
    if (message.method) {
      switch (message.method) {
        case 'textDocument/publishDiagnostics':
          this.handleDiagnostics(message.params);
          break;
        case 'window/logMessage':
          console.log('LSP Log:', message.params.message);
          break;
        case 'window/showMessage':
          vscode.window.showInformationMessage(message.params.message);
          break;
        default:
          console.debug('Unhandled LSP method:', message.method);
      }
    }
  }

  private handleDiagnostics(params: any): void {
    // Convert LSP diagnostics to VS Code diagnostics
    try {
      const uri = vscode.Uri.parse(params.uri);
      const diagnostics: vscode.Diagnostic[] = params.diagnostics.map(
        (diag: any) => {
          const range = new vscode.Range(
            diag.range.start.line,
            diag.range.start.character,
            diag.range.end.line,
            diag.range.end.character
          );

          const severity = this.convertLspSeverity(diag.severity);
          const diagnostic = new vscode.Diagnostic(
            range,
            diag.message,
            severity
          );
          diagnostic.source = 'Code Check LSP';
          diagnostic.code = diag.code;

          return diagnostic;
        }
      );

      // Apply diagnostics through the diagnostics manager
      vscode.commands.executeCommand(
        'code-check.setLspDiagnostics',
        uri,
        diagnostics
      );
    } catch (error) {
      console.error('Error handling LSP diagnostics:', error);
    }
  }

  private convertLspSeverity(severity: number): vscode.DiagnosticSeverity {
    switch (severity) {
      case 1:
        return vscode.DiagnosticSeverity.Error;
      case 2:
        return vscode.DiagnosticSeverity.Warning;
      case 3:
        return vscode.DiagnosticSeverity.Information;
      case 4:
        return vscode.DiagnosticSeverity.Hint;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  private sendShutdownRequest(): void {
    if (!this.serverProcess || !this.serverProcess.stdin) {
      return;
    }

    const shutdownRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'shutdown',
      params: {},
    };

    const message = JSON.stringify(shutdownRequest);
    const contentLength = Buffer.byteLength(message, 'utf8');
    const header = `Content-Length: ${contentLength}\r\n\r\n`;

    try {
      this.serverProcess.stdin.write(header + message);
    } catch (error) {
      console.error('Error sending shutdown request:', error);
    }
  }

  public dispose(): void {
    this.stop();
  }
}
