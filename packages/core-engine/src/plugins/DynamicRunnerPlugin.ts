import { Plugin, CodeIssue } from '../types/index';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class DynamicRunnerPlugin implements Plugin {
  metadata = {
    name: 'Dynamic Runner',
    version: '1.0.0',
    description:
      'Executes code to gain runtime insights and detect dynamic issues.',
  };

  async initialize() {
    console.log('Initializing Dynamic Runner Plugin');
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    for (const file of files) {
      try {
        // Skip non-executable files
        if (!this.isExecutable(file)) {
          continue;
        }

        const result = await this.executeFile(file);

        // Analyze runtime behavior
        if (result.stderr) {
          issues.push({
            id: `dynamic-${Date.now()}`,
            severity: 'error',
            message: `Runtime error detected: ${result.stderr}`,
            rule: 'runtime-error',
            location: {
              file,
              line: 1,
              column: 1,
            },
            fixable: false,
            suggestions: ['Check runtime error and fix the underlying issue'],
          });
        }

        // Check for performance issues (example: execution time)
        if (result.executionTime > 5000) {
          // 5 seconds
          issues.push({
            id: `dynamic-perf-${Date.now()}`,
            severity: 'warning',
            message: `Slow execution detected: ${result.executionTime}ms`,
            rule: 'performance-issue',
            location: {
              file,
              line: 1,
              column: 1,
            },
            fixable: false,
            suggestions: ['Consider optimizing code for better performance'],
          });
        }
      } catch (error) {
        console.error(`Error running dynamic analysis on ${file}:`, error);
        issues.push({
          id: `dynamic-error-${Date.now()}`,
          severity: 'error',
          message: `Failed to execute file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'execution-error',
          location: {
            file,
            line: 1,
            column: 1,
          },
          fixable: false,
        });
      }
    }

    return issues;
  }

  async cleanup() {
    console.log('Cleaning up Dynamic Runner Plugin');
  }

  private isExecutable(file: string): boolean {
    // Simple check for executable files
    const extension = path.extname(file);
    return ['.js', '.ts', '.py', '.sh'].includes(extension);
  }

  private async executeFile(
    file: string
  ): Promise<{ stdout: string; stderr: string; executionTime: number }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const extension = path.extname(file);

      let command: string;
      let args: string[];

      switch (extension) {
        case '.js':
          command = 'node';
          args = [file];
          break;
        case '.ts':
          command = 'npx';
          args = ['ts-node', file];
          break;
        case '.py':
          command = 'python';
          args = [file];
          break;
        case '.sh':
          command = 'bash';
          args = [file];
          break;
        default:
          reject(new Error(`Unsupported file extension: ${extension}`));
          return;
      }

      const process = spawn(command, args, {
        timeout: 10000, // 10 second timeout
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        resolve({ stdout, stderr, executionTime });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}
