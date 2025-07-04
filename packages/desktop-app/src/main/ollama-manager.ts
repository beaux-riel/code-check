import { spawn, ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { app } from 'electron';
import log from 'electron-log';
import kill from 'tree-kill';

export interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

export class OllamaManager {
  private ollamaProcess: ChildProcess | null = null;
  private isRunning: boolean = false;
  private models: OllamaModel[] = [];

  constructor() {
    this.isRunning = false;
    this.models = [];
  }

  async initialize(): Promise<void> {
    try {
      // Check if Ollama is already installed
      const isInstalled = await this.checkOllamaInstalled();

      if (!isInstalled) {
        log.info('Ollama not found, attempting to install...');
        const installed = await this.installOllama();
        if (!installed) {
          log.error('Failed to install Ollama');
          return;
        }
      }

      // Start Ollama service
      await this.start();

      // Load available models
      await this.loadModels();
    } catch (error) {
      log.error('Failed to initialize Ollama:', error);
    }
  }

  async start(): Promise<boolean> {
    try {
      if (this.isRunning) {
        return true;
      }

      const ollamaPath = this.getOllamaPath();
      if (!fs.existsSync(ollamaPath)) {
        log.error('Ollama executable not found:', ollamaPath);
        return false;
      }

      // Start Ollama serve
      this.ollamaProcess = spawn(ollamaPath, ['serve'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      this.ollamaProcess.stdout?.on('data', (data) => {
        log.info('Ollama stdout:', data.toString());
      });

      this.ollamaProcess.stderr?.on('data', (data) => {
        log.info('Ollama stderr:', data.toString());
      });

      this.ollamaProcess.on('exit', (code, signal) => {
        log.info(
          `Ollama process exited with code ${code} and signal ${signal}`
        );
        this.isRunning = false;
        this.ollamaProcess = null;
      });

      this.ollamaProcess.on('error', (error) => {
        log.error('Ollama process error:', error);
        this.isRunning = false;
        this.ollamaProcess = null;
      });

      // Wait for Ollama to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check if Ollama is responding
      const isHealthy = await this.checkHealth();
      if (isHealthy) {
        this.isRunning = true;
        log.info('Ollama started successfully');
        return true;
      } else {
        log.error('Ollama failed health check');
        await this.stop();
        return false;
      }
    } catch (error) {
      log.error('Failed to start Ollama:', error);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.ollamaProcess) {
      return new Promise((resolve) => {
        const pid = this.ollamaProcess!.pid;
        if (pid) {
          kill(pid, 'SIGTERM', (err) => {
            if (err) {
              log.error('Error killing Ollama process:', err);
            } else {
              log.info('Ollama process killed successfully');
            }
            this.ollamaProcess = null;
            this.isRunning = false;
            resolve();
          });
        } else {
          this.ollamaProcess = null;
          this.isRunning = false;
          resolve();
        }
      });
    }
  }

  async installModel(modelName: string): Promise<boolean> {
    try {
      if (!this.isRunning) {
        log.error('Ollama is not running');
        return false;
      }

      const ollamaPath = this.getOllamaPath();

      return new Promise((resolve) => {
        const pullProcess = spawn(ollamaPath, ['pull', modelName], {
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        pullProcess.stdout?.on('data', (data) => {
          log.info('Ollama pull stdout:', data.toString());
        });

        pullProcess.stderr?.on('data', (data) => {
          log.info('Ollama pull stderr:', data.toString());
        });

        pullProcess.on('exit', async (code) => {
          if (code === 0) {
            log.info(`Successfully installed model: ${modelName}`);
            await this.loadModels(); // Refresh model list
            resolve(true);
          } else {
            log.error(
              `Failed to install model: ${modelName}, exit code: ${code}`
            );
            resolve(false);
          }
        });

        pullProcess.on('error', (error) => {
          log.error('Ollama pull error:', error);
          resolve(false);
        });
      });
    } catch (error) {
      log.error('Error installing model:', error);
      return false;
    }
  }

  async removeModel(modelName: string): Promise<boolean> {
    try {
      if (!this.isRunning) {
        log.error('Ollama is not running');
        return false;
      }

      const ollamaPath = this.getOllamaPath();

      return new Promise((resolve) => {
        const removeProcess = spawn(ollamaPath, ['rm', modelName], {
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        removeProcess.on('exit', async (code) => {
          if (code === 0) {
            log.info(`Successfully removed model: ${modelName}`);
            await this.loadModels(); // Refresh model list
            resolve(true);
          } else {
            log.error(
              `Failed to remove model: ${modelName}, exit code: ${code}`
            );
            resolve(false);
          }
        });

        removeProcess.on('error', (error) => {
          log.error('Ollama rm error:', error);
          resolve(false);
        });
      });
    } catch (error) {
      log.error('Error removing model:', error);
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    await this.loadModels();
    return this.models;
  }

  getStatus(): { running: boolean; models: OllamaModel[] } {
    return {
      running: this.isRunning,
      models: this.models,
    };
  }

  private async checkOllamaInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('ollama --version', (error) => {
        resolve(!error);
      });
    });
  }

  private async installOllama(): Promise<boolean> {
    return new Promise((resolve) => {
      const platform = process.platform;
      let installCommand: string;

      if (platform === 'darwin') {
        // macOS
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
      } else if (platform === 'linux') {
        // Linux
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
      } else if (platform === 'win32') {
        // Windows - download and run installer
        log.info('Please install Ollama manually from https://ollama.ai/');
        resolve(false);
        return;
      } else {
        log.error('Unsupported platform for Ollama installation');
        resolve(false);
        return;
      }

      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          log.error('Error installing Ollama:', error);
          resolve(false);
        } else {
          log.info('Ollama installed successfully');
          resolve(true);
        }
      });
    });
  }

  private getOllamaPath(): string {
    // Return the system Ollama path
    return 'ollama';
  }

  private async checkHealth(): Promise<boolean> {
    try {
      const fetch = (await import('node-fetch')).default;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:11434/api/tags', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async loadModels(): Promise<void> {
    try {
      if (!this.isRunning) {
        return;
      }

      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:11434/api/tags');

      if (response.ok) {
        const data = (await response.json()) as { models: OllamaModel[] };
        this.models = data.models || [];
      }
    } catch (error) {
      log.error('Error loading models:', error);
      this.models = [];
    }
  }
}
