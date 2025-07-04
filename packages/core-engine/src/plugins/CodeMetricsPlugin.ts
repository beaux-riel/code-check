import { Plugin, PluginMetadata, QualityMetrics } from '../types/index.js';
import { CodeIssue } from '@code-check/shared/types';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

export interface CodeMetricsConfig {
  complexityThreshold?: {
    cyclomatic: number;
    cognitive: number;
  };
  maintainabilityThreshold?: number;
  duplicateThreshold?: number;
  fileSizeThreshold?: number; // in lines
  enabledMetrics?: {
    complexity: boolean;
    maintainability: boolean;
    duplication: boolean;
    size: boolean;
    dependencies: boolean;
  };
}

export interface FileMetrics {
  file: string;
  linesOfCode: number;
  physicalLines: number;
  commentLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  dependencies: string[];
  exports: string[];
  functions: FunctionMetrics[];
  classes: ClassMetrics[];
  duplicatedBlocks: DuplicatedBlock[];
}

export interface FunctionMetrics {
  name: string;
  startLine: number;
  endLine: number;
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  parameters: number;
  dependencies: string[];
}

export interface ClassMetrics {
  name: string;
  startLine: number;
  endLine: number;
  linesOfCode: number;
  methods: number;
  properties: number;
  dependencies: string[];
}

export interface DuplicatedBlock {
  startLine: number;
  endLine: number;
  hash: string;
  duplicatedFiles: Array<{
    file: string;
    startLine: number;
    endLine: number;
  }>;
}

export class CodeMetricsPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    name: 'Code Metrics',
    version: '1.0.0',
    description:
      'Calculates code quality metrics including complexity, maintainability, and duplication',
    author: 'Code Check Team',
    dependencies: ['@babel/parser', '@babel/traverse', '@babel/types'],
  };

  private config: Required<CodeMetricsConfig>;
  private fileHashes: Map<string, string[]> = new Map();

  constructor(config: CodeMetricsConfig = {}) {
    this.config = {
      complexityThreshold: {
        cyclomatic: 10,
        cognitive: 15,
      },
      maintainabilityThreshold: 20,
      duplicateThreshold: 6, // minimum lines for duplication detection
      fileSizeThreshold: 300,
      enabledMetrics: {
        complexity: true,
        maintainability: true,
        duplication: true,
        size: true,
        dependencies: true,
      },
      ...config,
    };
  }

  async initialize(): Promise<void> {
    this.fileHashes.clear();
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const fileMetrics: FileMetrics[] = [];

    // Filter files to only include JavaScript/TypeScript files
    const validFiles = files.filter((file) => {
      const ext = path.extname(file);
      return (
        ['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext) &&
        fs.existsSync(file)
      );
    });

    // Calculate metrics for each file
    for (const file of validFiles) {
      try {
        const metrics = await this.calculateFileMetrics(file);
        fileMetrics.push(metrics);

        const fileIssues = this.generateIssuesFromMetrics(metrics);
        issues.push(...fileIssues);
      } catch (error) {
        issues.push({
          id: `metrics-error-${file}`,
          severity: 'warning',
          message: `Failed to calculate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'metrics-calculation-error',
          location: {
            file,
            line: 1,
            column: 1,
          },
          fixable: false,
        });
      }
    }

    // Detect cross-file duplications
    if (this.config.enabledMetrics.duplication) {
      const duplicationIssues = this.detectCrossFileDuplications(fileMetrics);
      issues.push(...duplicationIssues);
    }

    return issues;
  }

  private async calculateFileMetrics(filePath: string): Promise<FileMetrics> {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Parse the file
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
    });

    const metrics: FileMetrics = {
      file: filePath,
      linesOfCode: 0,
      physicalLines: lines.length,
      commentLines: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maintainabilityIndex: 0,
      dependencies: [],
      exports: [],
      functions: [],
      classes: [],
      duplicatedBlocks: [],
    };

    // Calculate basic line metrics
    this.calculateLineMetrics(lines, metrics);

    // Traverse AST to calculate complexity and other metrics
    this.traverseAST(ast, metrics);

    // Calculate maintainability index
    metrics.maintainabilityIndex = this.calculateMaintainabilityIndex(metrics);

    // Detect duplications within the file
    if (this.config.enabledMetrics.duplication) {
      this.detectInFileDuplications(lines, metrics);
    }

    return metrics;
  }

  private calculateLineMetrics(lines: string[], metrics: FileMetrics): void {
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.length === 0) continue;

      // Check for comments
      if (inBlockComment) {
        metrics.commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('//')) {
        metrics.commentLines++;
        continue;
      }

      if (trimmed.startsWith('/*')) {
        metrics.commentLines++;
        if (!trimmed.includes('*/')) {
          inBlockComment = true;
        }
        continue;
      }

      metrics.linesOfCode++;
    }
  }

  private traverseAST(ast: t.File, metrics: FileMetrics): void {
    traverse(ast, {
      ImportDeclaration: (path) => {
        if (this.config.enabledMetrics.dependencies) {
          metrics.dependencies.push(path.node.source.value);
        }
      },

      ExportNamedDeclaration: (path) => {
        if (this.config.enabledMetrics.dependencies && path.node.specifiers) {
          path.node.specifiers.forEach((spec) => {
            if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
              metrics.exports.push(spec.exported.name);
            }
          });
        }
      },

      FunctionDeclaration: (path) => {
        if (this.config.enabledMetrics.complexity) {
          const functionMetrics = this.calculateFunctionMetrics(path);
          metrics.functions.push(functionMetrics);
          metrics.cyclomaticComplexity += functionMetrics.cyclomaticComplexity;
          metrics.cognitiveComplexity += functionMetrics.cognitiveComplexity;
        }
      },

      ClassDeclaration: (path) => {
        if (this.config.enabledMetrics.complexity) {
          const classMetrics = this.calculateClassMetrics(path);
          metrics.classes.push(classMetrics);
        }
      },

      // Complexity-contributing nodes
      IfStatement: () => {
        if (this.config.enabledMetrics.complexity) {
          metrics.cyclomaticComplexity++;
          metrics.cognitiveComplexity++;
        }
      },

      WhileStatement: () => {
        if (this.config.enabledMetrics.complexity) {
          metrics.cyclomaticComplexity++;
          metrics.cognitiveComplexity++;
        }
      },

      ForStatement: () => {
        if (this.config.enabledMetrics.complexity) {
          metrics.cyclomaticComplexity++;
          metrics.cognitiveComplexity++;
        }
      },

      SwitchCase: () => {
        if (this.config.enabledMetrics.complexity) {
          metrics.cyclomaticComplexity++;
        }
      },

      ConditionalExpression: () => {
        if (this.config.enabledMetrics.complexity) {
          metrics.cyclomaticComplexity++;
          metrics.cognitiveComplexity++;
        }
      },

      LogicalExpression: (path) => {
        if (
          this.config.enabledMetrics.complexity &&
          (path.node.operator === '&&' || path.node.operator === '||')
        ) {
          metrics.cognitiveComplexity++;
        }
      },
    });
  }

  private calculateFunctionMetrics(path: any): FunctionMetrics {
    const node = path.node;
    const functionName = node.id?.name || 'anonymous';

    let cyclomaticComplexity = 1; // Base complexity
    let cognitiveComplexity = 0;
    let dependencies: string[] = [];

    // Count complexity within function
    path.traverse({
      IfStatement: () => {
        cyclomaticComplexity++;
        cognitiveComplexity++;
      },
      WhileStatement: () => {
        cyclomaticComplexity++;
        cognitiveComplexity++;
      },
      ForStatement: () => {
        cyclomaticComplexity++;
        cognitiveComplexity++;
      },
      SwitchCase: () => {
        cyclomaticComplexity++;
      },
      ConditionalExpression: () => {
        cyclomaticComplexity++;
        cognitiveComplexity++;
      },
      CallExpression: (callPath: any) => {
        if (t.isIdentifier(callPath.node.callee)) {
          dependencies.push(callPath.node.callee.name);
        }
      },
    });

    return {
      name: functionName,
      startLine: node.loc?.start.line || 0,
      endLine: node.loc?.end.line || 0,
      linesOfCode: (node.loc?.end.line || 0) - (node.loc?.start.line || 0) + 1,
      cyclomaticComplexity,
      cognitiveComplexity,
      parameters: node.params?.length || 0,
      dependencies: Array.from(new Set(dependencies)),
    };
  }

  private calculateClassMetrics(path: any): ClassMetrics {
    const node = path.node;
    const className = node.id?.name || 'anonymous';

    let methods = 0;
    let properties = 0;
    let dependencies: string[] = [];

    path.traverse({
      ClassMethod: () => {
        methods++;
      },
      ClassProperty: () => {
        properties++;
      },
      CallExpression: (callPath: any) => {
        if (t.isIdentifier(callPath.node.callee)) {
          dependencies.push(callPath.node.callee.name);
        }
      },
    });

    return {
      name: className,
      startLine: node.loc?.start.line || 0,
      endLine: node.loc?.end.line || 0,
      linesOfCode: (node.loc?.end.line || 0) - (node.loc?.start.line || 0) + 1,
      methods,
      properties,
      dependencies: Array.from(new Set(dependencies)),
    };
  }

  private calculateMaintainabilityIndex(metrics: FileMetrics): number {
    // Simplified maintainability index calculation
    // Based on Halstead metrics and complexity
    const volume = Math.log2(metrics.linesOfCode + 1) * metrics.linesOfCode;
    const complexity = Math.max(1, metrics.cyclomaticComplexity);
    const linesOfCode = Math.max(1, metrics.linesOfCode);

    // Maintainability Index = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
    const maintainabilityIndex =
      171 -
      5.2 * Math.log(volume) -
      0.23 * complexity -
      16.2 * Math.log(linesOfCode);

    return Math.max(0, Math.min(100, maintainabilityIndex));
  }

  private detectInFileDuplications(
    lines: string[],
    metrics: FileMetrics
  ): void {
    const blockSize = this.config.duplicateThreshold;
    const blocks = new Map<string, number[]>();

    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines
        .slice(i, i + blockSize)
        .join('\n')
        .trim();
      if (block.length === 0) continue;

      const hash = this.hashString(block);
      if (!blocks.has(hash)) {
        blocks.set(hash, []);
      }
      blocks.get(hash)!.push(i);
    }

    for (const [hash, positions] of blocks) {
      if (positions.length > 1) {
        metrics.duplicatedBlocks.push({
          startLine: positions[0] + 1,
          endLine: positions[0] + blockSize,
          hash,
          duplicatedFiles: positions.slice(1).map((pos) => ({
            file: metrics.file,
            startLine: pos + 1,
            endLine: pos + blockSize,
          })),
        });
      }
    }
  }

  private detectCrossFileDuplications(fileMetrics: FileMetrics[]): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const globalBlocks = new Map<
      string,
      Array<{ file: string; startLine: number; endLine: number }>
    >();

    // Collect all blocks from all files
    for (const metrics of fileMetrics) {
      const content = fs.readFileSync(metrics.file, 'utf8');
      const lines = content.split('\n');
      const blockSize = this.config.duplicateThreshold;

      for (let i = 0; i <= lines.length - blockSize; i++) {
        const block = lines
          .slice(i, i + blockSize)
          .join('\n')
          .trim();
        if (block.length === 0) continue;

        const hash = this.hashString(block);
        if (!globalBlocks.has(hash)) {
          globalBlocks.set(hash, []);
        }
        globalBlocks.get(hash)!.push({
          file: metrics.file,
          startLine: i + 1,
          endLine: i + blockSize,
        });
      }
    }

    // Find cross-file duplications
    for (const [hash, locations] of globalBlocks) {
      if (locations.length > 1) {
        const uniqueFiles = new Set(locations.map((loc) => loc.file));
        if (uniqueFiles.size > 1) {
          for (const location of locations) {
            issues.push({
              id: `duplication-${hash}-${location.file}-${location.startLine}`,
              severity: 'warning',
              message: `Duplicated code block found in ${uniqueFiles.size} files (${this.config.duplicateThreshold} lines)`,
              rule: 'code-duplication',
              location: {
                file: location.file,
                line: location.startLine,
                column: 1,
              },
              range: {
                start: {
                  file: location.file,
                  line: location.startLine,
                  column: 1,
                },
                end: {
                  file: location.file,
                  line: location.endLine,
                  column: 1,
                },
              },
              fixable: false,
              suggestions: [
                'Consider extracting this code into a shared function or module',
              ],
            });
          }
        }
      }
    }

    return issues;
  }

  private generateIssuesFromMetrics(metrics: FileMetrics): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Cyclomatic complexity issues
    if (
      this.config.enabledMetrics.complexity &&
      metrics.cyclomaticComplexity > this.config.complexityThreshold.cyclomatic
    ) {
      issues.push({
        id: `complexity-cyclomatic-${metrics.file}`,
        severity: 'warning',
        message: `High cyclomatic complexity: ${metrics.cyclomaticComplexity} (threshold: ${this.config.complexityThreshold.cyclomatic})`,
        rule: 'high-cyclomatic-complexity',
        location: {
          file: metrics.file,
          line: 1,
          column: 1,
        },
        fixable: false,
        suggestions: [
          'Consider breaking down complex functions',
          'Extract nested logic into separate functions',
        ],
      });
    }

    // Cognitive complexity issues
    if (
      this.config.enabledMetrics.complexity &&
      metrics.cognitiveComplexity > this.config.complexityThreshold.cognitive
    ) {
      issues.push({
        id: `complexity-cognitive-${metrics.file}`,
        severity: 'warning',
        message: `High cognitive complexity: ${metrics.cognitiveComplexity} (threshold: ${this.config.complexityThreshold.cognitive})`,
        rule: 'high-cognitive-complexity',
        location: {
          file: metrics.file,
          line: 1,
          column: 1,
        },
        fixable: false,
        suggestions: [
          'Simplify conditional logic',
          'Reduce nesting levels',
          'Use early returns',
        ],
      });
    }

    // Maintainability issues
    if (
      this.config.enabledMetrics.maintainability &&
      metrics.maintainabilityIndex < this.config.maintainabilityThreshold
    ) {
      issues.push({
        id: `maintainability-${metrics.file}`,
        severity: 'warning',
        message: `Low maintainability index: ${metrics.maintainabilityIndex.toFixed(1)} (threshold: ${this.config.maintainabilityThreshold})`,
        rule: 'low-maintainability',
        location: {
          file: metrics.file,
          line: 1,
          column: 1,
        },
        fixable: false,
        suggestions: [
          'Reduce complexity',
          'Improve code documentation',
          'Refactor large functions',
        ],
      });
    }

    // File size issues
    if (
      this.config.enabledMetrics.size &&
      metrics.linesOfCode > this.config.fileSizeThreshold
    ) {
      issues.push({
        id: `file-size-${metrics.file}`,
        severity: 'info',
        message: `Large file: ${metrics.linesOfCode} lines (threshold: ${this.config.fileSizeThreshold})`,
        rule: 'large-file',
        location: {
          file: metrics.file,
          line: 1,
          column: 1,
        },
        fixable: false,
        suggestions: [
          'Consider splitting into smaller modules',
          'Extract related functionality',
        ],
      });
    }

    // Function-specific issues
    for (const func of metrics.functions) {
      if (
        func.cyclomaticComplexity > this.config.complexityThreshold.cyclomatic
      ) {
        issues.push({
          id: `function-complexity-${metrics.file}-${func.name}-${func.startLine}`,
          severity: 'warning',
          message: `Function '${func.name}' has high complexity: ${func.cyclomaticComplexity}`,
          rule: 'high-function-complexity',
          location: {
            file: metrics.file,
            line: func.startLine,
            column: 1,
          },
          range: {
            start: {
              file: metrics.file,
              line: func.startLine,
              column: 1,
            },
            end: {
              file: metrics.file,
              line: func.endLine,
              column: 1,
            },
          },
          fixable: false,
          suggestions: [
            'Break down this function into smaller functions',
            'Reduce conditional nesting',
          ],
        });
      }
    }

    return issues;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  async cleanup(): Promise<void> {
    this.fileHashes.clear();
  }

  public static createFactory(config?: CodeMetricsConfig) {
    return () => new CodeMetricsPlugin(config);
  }
}
