import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  CoverageData,
  PerformanceMetrics,
  JestConfig,
  InstrumentationConfig,
} from '../types';

export class JestInstrumentation {
  private config: InstrumentationConfig;
  private process?: ChildProcess;
  private startTime: number = 0;

  constructor(config: InstrumentationConfig) {
    this.config = config;
  }

  public async runTests(): Promise<{
    coverage?: CoverageData;
    performance?: PerformanceMetrics;
    exitCode: number;
  }> {
    this.startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpuUsage = process.cpuUsage();

    try {
      const jestArgs = this.buildJestArgs();
      const exitCode = await this.executeJest(jestArgs);

      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const endCpuUsage = process.cpuUsage(startCpuUsage);

      const results: any = {
        exitCode,
      };

      if (this.config.enableCoverage) {
        results.coverage = await this.parseCoverageData();
      }

      if (this.config.enableProfiling) {
        results.performance = this.calculatePerformanceMetrics(
          endTime - this.startTime,
          startMemory,
          endMemory,
          endCpuUsage
        );
      }

      return results;
    } catch (error) {
      console.error('Jest instrumentation failed:', error);
      throw error;
    }
  }

  private buildJestArgs(): string[] {
    const args = ['--no-cache', '--detectOpenHandles'];

    if (this.config.enableCoverage) {
      args.push('--coverage');
      args.push(
        '--coverageDirectory',
        path.join(this.config.outputPath, 'coverage')
      );
      args.push('--coverageReporters', 'json', 'lcov', 'cobertura', 'html');
    }

    if (this.config.jest?.configFile) {
      args.push('--config', this.config.jest.configFile);
    }

    if (this.config.jest?.testMatch) {
      this.config.jest.testMatch.forEach((pattern) => {
        args.push('--testMatch', pattern);
      });
    }

    if (this.config.enableProfiling) {
      args.push('--maxWorkers=1'); // Single worker for accurate profiling
    }

    return args;
  }

  private async executeJest(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const jestBin = this.findJestBinary();
      console.log(`Executing Jest: ${jestBin} ${args.join(' ')}`);

      this.process = spawn(jestBin, args, {
        cwd: this.config.projectPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          ...(this.config.enableProfiling && {
            NODE_OPTIONS: '--inspect=9229 --max-old-space-size=4096',
          }),
        },
      });

      this.process.on('close', (code) => {
        resolve(code || 0);
      });

      this.process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private findJestBinary(): string {
    // Try to find jest binary in node_modules
    const localJest = path.join(
      this.config.projectPath,
      'node_modules',
      '.bin',
      'jest'
    );
    if (fs.existsSync(localJest)) {
      return localJest;
    }

    // Fallback to global jest
    return 'jest';
  }

  private async parseCoverageData(): Promise<CoverageData | undefined> {
    const coverageFile = path.join(
      this.config.outputPath,
      'coverage',
      'coverage-final.json'
    );

    if (!fs.existsSync(coverageFile)) {
      console.warn('Coverage file not found:', coverageFile);
      return undefined;
    }

    try {
      const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return this.transformCoverageData(coverageData);
    } catch (error) {
      console.error('Failed to parse coverage data:', error);
      return undefined;
    }
  }

  private transformCoverageData(rawCoverage: any): CoverageData {
    const files: any[] = [];
    let totalLines = 0,
      coveredLines = 0;
    let totalStatements = 0,
      coveredStatements = 0;
    let totalFunctions = 0,
      coveredFunctions = 0;
    let totalBranches = 0,
      coveredBranches = 0;

    for (const [filePath, fileData] of Object.entries(rawCoverage)) {
      const data = fileData as any;

      const linesCoverage = this.calculateLineCoverage(
        data.statementMap,
        data.s
      );
      const functionsCoverage = this.calculateFunctionCoverage(
        data.fnMap,
        data.f
      );
      const branchesCoverage = this.calculateBranchCoverage(
        data.branchMap,
        data.b
      );
      const statementsCoverage = this.calculateStatementCoverage(
        data.statementMap,
        data.s
      );

      files.push({
        path: filePath,
        lines: linesCoverage,
        statements: statementsCoverage,
        functions: functionsCoverage,
        branches: branchesCoverage,
        uncoveredLines: this.getUncoveredLines(data.statementMap, data.s),
      });

      totalLines += linesCoverage.total;
      coveredLines += linesCoverage.covered;
      totalStatements += statementsCoverage.total;
      coveredStatements += statementsCoverage.covered;
      totalFunctions += functionsCoverage.total;
      coveredFunctions += functionsCoverage.covered;
      totalBranches += branchesCoverage.total;
      coveredBranches += branchesCoverage.covered;
    }

    return {
      type: 'jest',
      timestamp: Date.now(),
      summary: {
        lines: {
          total: totalLines,
          covered: coveredLines,
          skipped: 0,
          pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
        },
        statements: {
          total: totalStatements,
          covered: coveredStatements,
          skipped: 0,
          pct:
            totalStatements > 0
              ? (coveredStatements / totalStatements) * 100
              : 0,
        },
        functions: {
          total: totalFunctions,
          covered: coveredFunctions,
          skipped: 0,
          pct:
            totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
        },
        branches: {
          total: totalBranches,
          covered: coveredBranches,
          skipped: 0,
          pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
        },
      },
      files,
    };
  }

  private calculateLineCoverage(statementMap: any, statements: any): any {
    const lines = new Set<number>();
    const coveredLines = new Set<number>();

    for (const [stmtId, coverage] of Object.entries(statements)) {
      const stmt = statementMap[stmtId];
      if (stmt && stmt.start && stmt.start.line) {
        lines.add(stmt.start.line);
        if ((coverage as number) > 0) {
          coveredLines.add(stmt.start.line);
        }
      }
    }

    return {
      total: lines.size,
      covered: coveredLines.size,
      skipped: 0,
      pct: lines.size > 0 ? (coveredLines.size / lines.size) * 100 : 0,
    };
  }

  private calculateStatementCoverage(statementMap: any, statements: any): any {
    const total = Object.keys(statements).length;
    const covered = Object.values(statements).filter(
      (count) => (count as number) > 0
    ).length;

    return {
      total,
      covered,
      skipped: 0,
      pct: total > 0 ? (covered / total) * 100 : 0,
    };
  }

  private calculateFunctionCoverage(functionMap: any, functions: any): any {
    const total = Object.keys(functions).length;
    const covered = Object.values(functions).filter(
      (count) => (count as number) > 0
    ).length;

    return {
      total,
      covered,
      skipped: 0,
      pct: total > 0 ? (covered / total) * 100 : 0,
    };
  }

  private calculateBranchCoverage(branchMap: any, branches: any): any {
    let total = 0;
    let covered = 0;

    for (const branchId in branches) {
      const branchCoverage = branches[branchId];
      if (Array.isArray(branchCoverage)) {
        total += branchCoverage.length;
        covered += branchCoverage.filter((count) => count > 0).length;
      }
    }

    return {
      total,
      covered,
      skipped: 0,
      pct: total > 0 ? (covered / total) * 100 : 0,
    };
  }

  private getUncoveredLines(statementMap: any, statements: any): number[] {
    const uncoveredLines: number[] = [];

    for (const [stmtId, coverage] of Object.entries(statements)) {
      const stmt = statementMap[stmtId];
      if (stmt && stmt.start && stmt.start.line && (coverage as number) === 0) {
        uncoveredLines.push(stmt.start.line);
      }
    }

    return [...new Set(uncoveredLines)].sort((a, b) => a - b);
  }

  private calculatePerformanceMetrics(
    duration: number,
    startMemory: NodeJS.MemoryUsage,
    endMemory: NodeJS.MemoryUsage,
    cpuUsage: NodeJS.CpuUsage
  ): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      testDuration: duration,
      memoryUsage: {
        heapUsed: endMemory.heapUsed,
        heapTotal: endMemory.heapTotal,
        external: endMemory.external,
        rss: endMemory.rss,
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoopLag: 0, // Would need additional instrumentation
    };
  }

  public stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = undefined;
    }
  }
}
