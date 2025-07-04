import { Plugin } from '../types/index';
import { CodeIssue } from '@code-check/shared/types';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { minimatch } from 'minimatch';

export interface FileDiscoveryConfig {
  includedFiles?: string[];
  excludedFiles?: string[];
  maxFileSize?: number; // in bytes
  followSymlinks?: boolean;
  respectGitignore?: boolean;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
  extension: string;
  language: string;
  encoding: string;
}

export class FileDiscoveryPlugin implements Plugin {
  metadata = {
    name: 'FileDiscovery',
    version: '1.0.0',
    description:
      'Discovers and analyzes files in the project with filtering and metadata collection.',
  };

  private config: FileDiscoveryConfig;
  private gitignorePatterns: string[] = [];

  constructor(config: FileDiscoveryConfig = {}) {
    this.config = {
      includedFiles: [
        '**/*.ts',
        '**/*.js',
        '**/*.tsx',
        '**/*.jsx',
        '**/*.json',
        '**/*.md',
      ],
      excludedFiles: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      followSymlinks: false,
      respectGitignore: true,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log('Initializing File Discovery Plugin');
    if (this.config.respectGitignore) {
      await this.loadGitignorePatterns();
    }
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Analyze discovered files for potential issues
    for (const file of files) {
      try {
        const stats = fs.statSync(file);

        // Check for large files
        if (stats.size > this.config.maxFileSize!) {
          issues.push({
            id: `large-file-${path.basename(file)}`,
            severity: 'warning',
            message: `File is very large (${(stats.size / 1024 / 1024).toFixed(2)}MB)`,
            location: {
              file,
              line: 1,
              column: 1,
            },
            rule: 'file-size-warning',
          });
        }

        // Check for potential binary files that shouldn't be in source control
        const ext = path.extname(file).toLowerCase();
        const binaryExtensions = [
          '.exe',
          '.dll',
          '.so',
          '.dylib',
          '.bin',
          '.zip',
          '.tar',
          '.gz',
        ];
        if (binaryExtensions.includes(ext)) {
          issues.push({
            id: `binary-file-${path.basename(file)}`,
            severity: 'info',
            message: 'Binary file detected in source code',
            location: {
              file,
              line: 1,
              column: 1,
            },
            rule: 'binary-file-detection',
          });
        }
      } catch (error) {
        issues.push({
          id: `file-access-error-${path.basename(file)}`,
          severity: 'error',
          message: `Cannot access file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          location: {
            file,
            line: 1,
            column: 1,
          },
          rule: 'file-access-error',
        });
      }
    }

    return issues;
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up File Discovery Plugin');
  }

  /**
   * Main file discovery method with advanced filtering
   */
  public async discoverFiles(directory: string): Promise<string[]> {
    try {
      if (!fs.existsSync(directory)) {
        throw new Error(`Directory does not exist: ${directory}`);
      }

      const stats = fs.statSync(directory);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${directory}`);
      }

      let allFiles: string[] = [];

      // Use glob for pattern matching
      for (const pattern of this.config.includedFiles!) {
        const globOptions = {
          cwd: directory,
          absolute: true,
          follow: this.config.followSymlinks,
          ignore: this.config.excludedFiles,
        };

        const files = await glob(pattern, globOptions);
        allFiles.push(...files);
      }

      // Remove duplicates
      allFiles = [...new Set(allFiles)];

      // Apply gitignore patterns if enabled
      if (this.config.respectGitignore && this.gitignorePatterns.length > 0) {
        allFiles = this.filterByGitignore(allFiles, directory);
      }

      // Filter by file size
      allFiles = await this.filterBySize(allFiles);

      return allFiles.sort();
    } catch (error) {
      console.error('Error during file discovery:', error);
      throw error;
    }
  }

  /**
   * Get detailed file information
   */
  public async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
      extension: ext,
      language: this.detectLanguage(ext),
      encoding: await this.detectEncoding(filePath),
    };
  }

  /**
   * Get file statistics for the discovered files
   */
  public async getFileStatistics(files: string[]): Promise<{
    totalFiles: number;
    totalSize: number;
    languageDistribution: Record<string, number>;
    extensionDistribution: Record<string, number>;
    averageFileSize: number;
    largestFile: { path: string; size: number } | null;
  }> {
    let totalSize = 0;
    const languageDistribution: Record<string, number> = {};
    const extensionDistribution: Record<string, number> = {};
    let largestFile: { path: string; size: number } | null = null;

    for (const file of files) {
      try {
        const info = await this.getFileInfo(file);
        totalSize += info.size;

        // Track language distribution
        languageDistribution[info.language] =
          (languageDistribution[info.language] || 0) + 1;

        // Track extension distribution
        extensionDistribution[info.extension] =
          (extensionDistribution[info.extension] || 0) + 1;

        // Track largest file
        if (!largestFile || info.size > largestFile.size) {
          largestFile = { path: file, size: info.size };
        }
      } catch (error) {
        console.warn(`Could not get info for file ${file}:`, error);
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
      languageDistribution,
      extensionDistribution,
      averageFileSize: files.length > 0 ? totalSize / files.length : 0,
      largestFile,
    };
  }

  private async loadGitignorePatterns(): Promise<void> {
    // This is a simplified implementation
    // In a real scenario, you'd want to parse .gitignore files properly
    const commonGitignorePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
    ];

    this.gitignorePatterns = commonGitignorePatterns;
  }

  private filterByGitignore(files: string[], baseDir: string): string[] {
    return files.filter((file) => {
      const relativePath = path.relative(baseDir, file);
      return !this.gitignorePatterns.some((pattern) =>
        minimatch(relativePath, pattern)
      );
    });
  }

  private async filterBySize(files: string[]): Promise<string[]> {
    const filteredFiles: string[] = [];

    for (const file of files) {
      try {
        const stats = fs.statSync(file);
        if (stats.size <= this.config.maxFileSize!) {
          filteredFiles.push(file);
        }
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
    }

    return filteredFiles;
  }

  private detectLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.txt': 'Text',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.ps1': 'PowerShell',
    };

    return languageMap[extension] || 'Unknown';
  }

  private async detectEncoding(filePath: string): Promise<string> {
    // Simplified encoding detection
    // In a real implementation, you might use a library like 'chardet'
    try {
      const buffer = fs.readFileSync(filePath);

      // Check for BOM
      if (
        buffer.length >= 3 &&
        buffer[0] === 0xef &&
        buffer[1] === 0xbb &&
        buffer[2] === 0xbf
      ) {
        return 'utf-8-bom';
      }

      // Simple ASCII/UTF-8 detection
      const str = buffer.toString('utf8');
      if (str.includes('�')) {
        return 'binary';
      }

      return 'utf-8';
    } catch (error) {
      return 'unknown';
    }
  }
}
