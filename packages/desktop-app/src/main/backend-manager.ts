import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import getPort from 'get-port';
import log from 'electron-log';
import kill from 'tree-kill';

export class BackendManager {
  private backendProcess: ChildProcess | null = null;
  private port: number | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.port = null;
    this.isRunning = false;
  }

  async start(): Promise<boolean> {
    try {
      // Get an available port
      this.port = await getPort({ port: getPort.makeRange(3001, 3999) });

      // Path to the backend executable
      const backendPath = this.getBackendPath();

      if (!fs.existsSync(backendPath)) {
        log.error('Backend executable not found:', backendPath);
        return false;
      }

      // Set environment variables
      const env = {
        ...process.env,
        PORT: this.port.toString(),
        NODE_ENV: 'production',
        DATABASE_URL: this.getDatabasePath(),
      };

      // Start the backend process
      this.backendProcess = spawn('node', [backendPath], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      // Handle process output
      this.backendProcess.stdout?.on('data', (data) => {
        log.info('Backend stdout:', data.toString());
      });

      this.backendProcess.stderr?.on('data', (data) => {
        log.error('Backend stderr:', data.toString());
      });

      // Handle process exit
      this.backendProcess.on('exit', (code, signal) => {
        log.info(
          `Backend process exited with code ${code} and signal ${signal}`
        );
        this.isRunning = false;
        this.backendProcess = null;
      });

      this.backendProcess.on('error', (error) => {
        log.error('Backend process error:', error);
        this.isRunning = false;
        this.backendProcess = null;
      });

      // Wait a bit for the server to start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test if the server is responding
      const isHealthy = await this.checkHealth();
      if (isHealthy) {
        this.isRunning = true;
        log.info(`Backend started successfully on port ${this.port}`);
        return true;
      } else {
        log.error('Backend failed health check');
        await this.stop();
        return false;
      }
    } catch (error) {
      log.error('Failed to start backend:', error);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.backendProcess) {
      return new Promise((resolve) => {
        const pid = this.backendProcess!.pid;
        if (pid) {
          kill(pid, 'SIGTERM', (err) => {
            if (err) {
              log.error('Error killing backend process:', err);
            } else {
              log.info('Backend process killed successfully');
            }
            this.backendProcess = null;
            this.isRunning = false;
            resolve();
          });
        } else {
          this.backendProcess = null;
          this.isRunning = false;
          resolve();
        }
      });
    }
  }

  getStatus(): { running: boolean; port: number | null } {
    return {
      running: this.isRunning,
      port: this.port,
    };
  }

  private getBackendPath(): string {
    if (app.isPackaged) {
      // In packaged app, backend is in resources/backend
      return path.join(process.resourcesPath, 'backend', 'index.js');
    } else {
      // In development, use the built backend
      return path.join(__dirname, '../../../api-backend/dist/index.js');
    }
  }

  private getDatabasePath(): string {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.db');
    return `file:${dbPath}`;
  }

  private async checkHealth(): Promise<boolean> {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:${this.port}/api/health`, {
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
