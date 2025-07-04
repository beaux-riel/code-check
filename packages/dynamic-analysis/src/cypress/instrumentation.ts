import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  CoverageData,
  PerformanceMetrics,
  CypressConfig,
  InstrumentationConfig,
} from '../types';

export class CypressInstrumentation {
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
      await this.setupCypressConfiguration();
      const cypressArgs = this.buildCypressArgs();
      const exitCode = await this.executeCypress(cypressArgs);

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
      console.error('Cypress instrumentation failed:', error);
      throw error;
    }
  }

  private async setupCypressConfiguration(): Promise<void> {
    // Create/update cypress.config.js to enable code coverage
    const cypressConfigPath = path.join(
      this.config.projectPath,
      'cypress.config.js'
    );

    if (!fs.existsSync(cypressConfigPath)) {
      console.log('Creating Cypress configuration for code coverage...');
      const configContent = this.generateCypressConfig();
      fs.writeFileSync(cypressConfigPath, configContent);
    } else {
      console.log('Using existing Cypress configuration');
    }

    // Ensure coverage plugin is installed
    await this.ensureCoveragePlugin();
  }

  private generateCypressConfig(): string {
    const baseUrl = this.config.cypress?.baseUrl || 'http://localhost:3000';
    const specPattern =
      this.config.cypress?.specPattern || 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}';

    return `const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: '${baseUrl}',
    specPattern: '${specPattern}',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      // Code coverage plugin
      require('@cypress/code-coverage/task')(on, config);
      
      // Performance monitoring
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        performance(data) {
          const perfFile = path.join('${this.config.outputPath}', 'cypress-performance.json');
          fs.writeFileSync(perfFile, JSON.stringify(data, null, 2));
          return null;
        }
      });

      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },
});
`;
  }

  private async ensureCoveragePlugin(): Promise<void> {
    const packageJsonPath = path.join(this.config.projectPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasCoveragePlugin =
        packageJson.devDependencies?.['@cypress/code-coverage'] ||
        packageJson.dependencies?.['@cypress/code-coverage'];

      if (!hasCoveragePlugin) {
        console.warn(
          'Warning: @cypress/code-coverage plugin not found in package.json'
        );
        console.warn(
          'Please install it with: npm install --save-dev @cypress/code-coverage'
        );
      }
    }
  }

  private buildCypressArgs(): string[] {
    const args = ['run'];

    if (this.config.cypress?.configFile) {
      args.push('--config-file', this.config.cypress.configFile);
    }

    if (this.config.cypress?.specPattern) {
      args.push('--spec', this.config.cypress.specPattern);
    }

    // Enable headless mode for CI/performance testing
    args.push('--headless');

    // Disable video recording for performance
    args.push('--config', 'video=false');

    // Set browser for consistent performance testing
    args.push('--browser', 'chrome');

    return args;
  }

  private async executeCypress(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const cypressBin = this.findCypressBinary();
      console.log(`Executing Cypress: ${cypressBin} ${args.join(' ')}`);

      this.process = spawn(cypressBin, args, {
        cwd: this.config.projectPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          CYPRESS_COVERAGE: this.config.enableCoverage ? 'true' : 'false',
          ...(this.config.enableProfiling && {
            CYPRESS_RECORD_KEY: undefined, // Disable cloud recording for performance
            CYPRESS_CACHE_FOLDER: path.join(
              this.config.outputPath,
              '.cypress-cache'
            ),
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

  private findCypressBinary(): string {
    // Try to find cypress binary in node_modules
    const localCypress = path.join(
      this.config.projectPath,
      'node_modules',
      '.bin',
      'cypress'
    );
    if (fs.existsSync(localCypress)) {
      return localCypress;
    }

    // Fallback to global cypress
    return 'cypress';
  }

  private async parseCoverageData(): Promise<CoverageData | undefined> {
    // Cypress code coverage typically outputs to coverage/lcov.info and .nyc_output
    const nycOutputDir = path.join(this.config.projectPath, '.nyc_output');
    const coverageDir = path.join(this.config.projectPath, 'coverage');
    const cypressCoverageFile = path.join(coverageDir, 'coverage-final.json');

    // Check for coverage files in different possible locations
    let coverageFile = cypressCoverageFile;
    if (!fs.existsSync(coverageFile)) {
      const altCoverageFile = path.join(nycOutputDir, 'out.json');
      if (fs.existsSync(altCoverageFile)) {
        coverageFile = altCoverageFile;
      } else {
        console.warn('No Cypress coverage file found');
        return undefined;
      }
    }

    try {
      const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return this.transformCoverageData(coverageData);
    } catch (error) {
      console.error('Failed to parse Cypress coverage data:', error);
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

    // Handle both Istanbul format and NYC format
    const coverageEntries = rawCoverage.coverage
      ? Object.entries(rawCoverage.coverage)
      : Object.entries(rawCoverage);

    for (const [filePath, fileData] of coverageEntries) {
      const data = fileData as any;

      // Skip non-source files (node_modules, etc.)
      if (this.shouldSkipFile(filePath)) {
        continue;
      }

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
      type: 'cypress',
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

  private shouldSkipFile(filePath: string): boolean {
    const skipPatterns = [
      'node_modules',
      'cypress/',
      '.cypress/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '__tests__/',
      '.test.',
      '.spec.',
      '.cy.',
    ];

    return skipPatterns.some((pattern) => filePath.includes(pattern));
  }

  private calculateLineCoverage(statementMap: any, statements: any): any {
    if (!statementMap || !statements) {
      return { total: 0, covered: 0, skipped: 0, pct: 0 };
    }

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
    if (!statements) {
      return { total: 0, covered: 0, skipped: 0, pct: 0 };
    }

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
    if (!functions) {
      return { total: 0, covered: 0, skipped: 0, pct: 0 };
    }

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
    if (!branches) {
      return { total: 0, covered: 0, skipped: 0, pct: 0 };
    }

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
    if (!statementMap || !statements) {
      return [];
    }

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
