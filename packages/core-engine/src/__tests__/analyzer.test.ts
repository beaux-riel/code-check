import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalyzer } from '../analyzer/CodeAnalyzer';
import { AnalysisConfig } from '../types/AnalysisConfig';

// Mock file system
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

const mockFs = fs as any;

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;
  let config: AnalysisConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      rootPath: '/test/project',
      includePatterns: ['**/*.ts', '**/*.js'],
      excludePatterns: ['node_modules/**', 'dist/**'],
      rules: ['no-console', 'prefer-const'],
      severity: 'warning',
      maxIssues: 100,
    };

    analyzer = new CodeAnalyzer(config);
  });

  describe('File Discovery', () => {
    it('should find TypeScript and JavaScript files', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['src', 'tests', 'node_modules']);
      mockFs.statSync.mockImplementation((filePath: string) => ({
        isDirectory: () => !filePath.includes('.'),
        isFile: () => filePath.includes('.'),
      }));

      const files = await analyzer.discoverFiles();

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
    });

    it('should exclude specified patterns', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['src', 'node_modules', 'dist']);
      mockFs.statSync.mockImplementation((filePath: string) => ({
        isDirectory: () => !filePath.includes('.'),
        isFile: () => filePath.includes('.'),
      }));

      const files = await analyzer.discoverFiles();

      // Should not include node_modules or dist directories
      const pathStrings = files.map((f) => f.path);
      expect(pathStrings.some((p) => p.includes('node_modules'))).toBe(false);
      expect(pathStrings.some((p) => p.includes('dist'))).toBe(false);
    });

    it('should handle non-existent directory', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(analyzer.discoverFiles()).rejects.toThrow(
        'Root path does not exist'
      );
    });
  });

  describe('Code Analysis', () => {
    it('should analyze JavaScript code', async () => {
      const code = `
        console.log('Hello, World!');
        var x = 5;
        x = 10;
      `;

      mockFs.readFileSync.mockReturnValue(code);

      const result = await analyzer.analyzeFile({
        path: '/test/project/src/test.js',
        name: 'test.js',
        extension: '.js',
        size: code.length,
      });

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('should analyze TypeScript code', async () => {
      const code = `
        interface User {
          name: string;
          age: number;
        }
        
        const user: User = {
          name: 'John',
          age: 30
        };
        
        console.log(user);
      `;

      mockFs.readFileSync.mockReturnValue(code);

      const result = await analyzer.analyzeFile({
        path: '/test/project/src/user.ts',
        name: 'user.ts',
        extension: '.ts',
        size: code.length,
      });

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.metrics.linesOfCode).toBeGreaterThan(0);
      expect(result.metrics.complexity).toBeGreaterThanOrEqual(1);
    });

    it('should detect console.log usage', async () => {
      const code = `
        function greet(name) {
          console.log('Hello, ' + name);
          return 'Hello, ' + name;
        }
      `;

      mockFs.readFileSync.mockReturnValue(code);

      const result = await analyzer.analyzeFile({
        path: '/test/project/src/greet.js',
        name: 'greet.js',
        extension: '.js',
        size: code.length,
      });

      const consoleIssues = result.issues.filter(
        (issue) => issue.rule === 'no-console'
      );

      expect(consoleIssues.length).toBeGreaterThan(0);
    });

    it('should calculate complexity metrics', async () => {
      const complexCode = `
        function complexFunction(x, y, z) {
          if (x > 0) {
            if (y > 0) {
              for (let i = 0; i < z; i++) {
                if (i % 2 === 0) {
                  console.log(i);
                } else {
                  console.log('odd');
                }
              }
            } else {
              return y * -1;
            }
          } else {
            switch (x) {
              case -1:
                return 'negative one';
              case -2:
                return 'negative two';
              default:
                return 'other negative';
            }
          }
          return x + y + z;
        }
      `;

      mockFs.readFileSync.mockReturnValue(complexCode);

      const result = await analyzer.analyzeFile({
        path: '/test/project/src/complex.js',
        name: 'complex.js',
        extension: '.js',
        size: complexCode.length,
      });

      expect(result.metrics.complexity).toBeGreaterThan(5);
      expect(result.metrics.linesOfCode).toBeGreaterThan(20);
    });
  });

  describe('Batch Analysis', () => {
    it('should analyze multiple files', async () => {
      const files = [
        {
          path: '/test/project/src/file1.js',
          name: 'file1.js',
          extension: '.js',
          size: 100,
        },
        {
          path: '/test/project/src/file2.ts',
          name: 'file2.ts',
          extension: '.ts',
          size: 200,
        },
      ];

      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.includes('file1.js')) {
          return 'console.log("File 1");';
        }
        if (filePath.includes('file2.ts')) {
          return 'const message: string = "File 2"; console.log(message);';
        }
        return '';
      });

      const results = await analyzer.analyzeFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].filePath).toBe('/test/project/src/file1.js');
      expect(results[1].filePath).toBe('/test/project/src/file2.ts');
    });

    it('should handle file read errors gracefully', async () => {
      const files = [
        {
          path: '/test/project/src/missing.js',
          name: 'missing.js',
          extension: '.js',
          size: 0,
        },
      ];

      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const results = await analyzer.analyzeFiles(files);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should respect severity configuration', async () => {
      const strictConfig = {
        ...config,
        severity: 'error' as const,
      };

      const strictAnalyzer = new CodeAnalyzer(strictConfig);

      expect(strictAnalyzer.getConfig().severity).toBe('error');
    });

    it('should respect max issues limit', async () => {
      const limitedConfig = {
        ...config,
        maxIssues: 5,
      };

      const limitedAnalyzer = new CodeAnalyzer(limitedConfig);

      expect(limitedAnalyzer.getConfig().maxIssues).toBe(5);
    });

    it('should validate configuration', () => {
      const invalidConfig = {
        ...config,
        rootPath: '',
        includePatterns: [],
      };

      expect(() => new CodeAnalyzer(invalidConfig)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();

      const code = 'const x = 1; console.log(x);';
      mockFs.readFileSync.mockReturnValue(code);

      await analyzer.analyzeFile({
        path: '/test/project/src/perf.js',
        name: 'perf.js',
        extension: '.js',
        size: code.length,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large files efficiently', async () => {
      const largeCode = 'console.log("line");'.repeat(1000);
      mockFs.readFileSync.mockReturnValue(largeCode);

      const startTime = Date.now();

      const result = await analyzer.analyzeFile({
        path: '/test/project/src/large.js',
        name: 'large.js',
        extension: '.js',
        size: largeCode.length,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metrics.linesOfCode).toBe(1000);
    });
  });
});
