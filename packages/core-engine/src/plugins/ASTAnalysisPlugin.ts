import { Plugin } from '../types/index';
import { CodeIssue, CodeLocation } from '@code-check/shared/types';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import fs from 'fs';

export class ASTAnalysisPlugin implements Plugin {
  metadata = {
    name: 'AST Analysis',
    version: '1.0.0',
    description: 'Performs static code analysis using AST parsing.',
  };

  async initialize() {
    console.log('Initializing AST Analysis Plugin');
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const ast = parser.parse(content, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
        });

        traverse(ast, {
          FunctionDeclaration(path) {
            // Example rule: Functions without return types
            if (path.node.returnType === null) {
              issues.push({
                id: `ast-${Date.now()}`,
                severity: 'warning',
                message: 'Function missing return type annotation',
                rule: 'missing-return-type',
                location: {
                  file,
                  line: path.node.loc?.start.line || 1,
                  column: path.node.loc?.start.column || 1,
                },
                fixable: false,
                suggestions: ['Add explicit return type annotation'],
              });
            }
          },
          VariableDeclarator(path) {
            // Example rule: Variables without type annotations
            if (t.isIdentifier(path.node.id) && !path.node.id.typeAnnotation) {
              issues.push({
                id: `ast-${Date.now()}`,
                severity: 'info',
                message: 'Variable missing type annotation',
                rule: 'missing-type-annotation',
                location: {
                  file,
                  line: path.node.loc?.start.line || 1,
                  column: path.node.loc?.start.column || 1,
                },
                fixable: false,
                suggestions: ['Add explicit type annotation'],
              });
            }
          },
        });
      } catch (error) {
        console.error(`Error analyzing file ${file}:`, error);
        issues.push({
          id: `ast-error-${Date.now()}`,
          severity: 'error',
          message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'parse-error',
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
    console.log('Cleaning up AST Analysis Plugin');
  }
}
