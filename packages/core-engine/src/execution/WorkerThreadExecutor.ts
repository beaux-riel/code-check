import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { Plugin, CodeIssue } from '../types/index';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

export interface WorkerTask {
  id: string;
  pluginName: string;
  files: string[];
  options?: Record<string, any>;
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  issues: CodeIssue[];
  error?: string;
  duration: number;
}

export interface WorkerPoolOptions {
  maxWorkers?: number;
  taskTimeout?: number;
  retryAttempts?: number;
}

export class WorkerThreadExecutor {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: WorkerTask;
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private runningTasks: Map<
    string,
    {
      worker: Worker;
      timeout: NodeJS.Timeout;
      resolve: (result: WorkerResult) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  private readonly maxWorkers: number;
  private readonly taskTimeout: number;
  private readonly retryAttempts: number;

  constructor(options: WorkerPoolOptions = {}) {
    this.maxWorkers = options.maxWorkers || Math.max(1, os.cpus().length - 1);
    this.taskTimeout = options.taskTimeout || 30000; // 30 seconds
    this.retryAttempts = options.retryAttempts || 2;
  }

  public async initialize(): Promise<void> {
    console.log(`Initializing worker pool with ${this.maxWorkers} workers`);

    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  public async executeTask(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  public async executeTasks(tasks: WorkerTask[]): Promise<WorkerResult[]> {
    const promises = tasks.map((task) => this.executeTask(task));
    return Promise.all(promises);
  }

  public async executeTasksParallel(
    tasks: WorkerTask[]
  ): Promise<WorkerResult[]> {
    const results: WorkerResult[] = [];
    const chunks = this.chunkArray(tasks, this.maxWorkers);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((task) => this.executeTask(task))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down worker pool');

    // Clear task queue
    this.taskQueue.length = 0;

    // Cancel running tasks
    for (const [taskId, taskInfo] of this.runningTasks) {
      clearTimeout(taskInfo.timeout);
      taskInfo.reject(new Error('Worker pool shutdown'));
    }
    this.runningTasks.clear();

    // Terminate all workers
    const terminationPromises = this.workers.map((worker) =>
      worker.terminate()
    );

    await Promise.all(terminationPromises);

    this.workers.length = 0;
    this.availableWorkers.length = 0;
  }

  public getStatus() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      runningTasks: this.runningTasks.size,
      queuedTasks: this.taskQueue.length,
    };
  }

  private createWorker(): Worker {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workerScript = path.join(__dirname, 'worker.js');
    const worker = new Worker(workerScript);

    worker.on('message', (result: WorkerResult) => {
      this.handleWorkerResult(worker, result);
    });

    worker.on('error', (error) => {
      this.handleWorkerError(worker, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        this.handleWorkerExit(worker);
      }
    });

    return worker;
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const { task, resolve, reject } = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;

      this.executeTaskOnWorker(worker, task, resolve, reject);
    }
  }

  private executeTaskOnWorker(
    worker: Worker,
    task: WorkerTask,
    resolve: (result: WorkerResult) => void,
    reject: (error: Error) => void
  ): void {
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(task.id, worker);
    }, this.taskTimeout);

    this.runningTasks.set(task.id, {
      worker,
      timeout,
      resolve,
      reject,
    });

    worker.postMessage(task);
  }

  private handleWorkerResult(worker: Worker, result: WorkerResult): void {
    const taskInfo = this.runningTasks.get(result.taskId);
    if (!taskInfo) return;

    clearTimeout(taskInfo.timeout);
    this.runningTasks.delete(result.taskId);
    this.availableWorkers.push(worker);

    taskInfo.resolve(result);
    this.processQueue();
  }

  private handleWorkerError(worker: Worker, error: Error): void {
    // Find the task running on this worker
    for (const [taskId, taskInfo] of this.runningTasks) {
      if (taskInfo.worker === worker) {
        clearTimeout(taskInfo.timeout);
        this.runningTasks.delete(taskId);
        taskInfo.reject(error);
        break;
      }
    }

    // Replace the failed worker
    this.replaceWorker(worker);
    this.processQueue();
  }

  private handleWorkerExit(worker: Worker): void {
    this.replaceWorker(worker);
    this.processQueue();
  }

  private handleTaskTimeout(taskId: string, worker: Worker): void {
    const taskInfo = this.runningTasks.get(taskId);
    if (!taskInfo) return;

    this.runningTasks.delete(taskId);
    taskInfo.reject(new Error(`Task ${taskId} timed out`));

    // Terminate and replace the worker
    worker.terminate();
    this.replaceWorker(worker);
    this.processQueue();
  }

  private replaceWorker(oldWorker: Worker): void {
    const index = this.workers.indexOf(oldWorker);
    if (index !== -1) {
      this.workers[index] = this.createWorker();
    }

    const availableIndex = this.availableWorkers.indexOf(oldWorker);
    if (availableIndex !== -1) {
      this.availableWorkers[availableIndex] = this.workers[index];
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Worker script content that will be executed in worker threads
export const workerScript = `
const { parentPort } = require('worker_threads');

parentPort.on('message', async (task) => {
  const startTime = Date.now();
  
  try {
    // This is a simplified worker implementation
    // In a real implementation, you would dynamically load and execute plugins
    const result = {
      taskId: task.id,
      success: true,
      issues: [],
      duration: Date.now() - startTime
    };
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage({
      taskId: task.id,
      success: false,
      issues: [],
      error: error.message,
      duration: Date.now() - startTime
    });
  }
});
`;
