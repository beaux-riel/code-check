import { Plugin, CodeIssue } from '../types/index';
import { IAIProvider } from '@code-check/shared';
import fs from 'fs';

export interface LLMAnalysisResult {
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    rule: string;
    line?: number;
    column?: number;
    suggestions?: string[];
  }>;
  reasoning: string;
  confidence: number;
}

export class LLMReasoningPlugin implements Plugin {
  metadata = {
    name: 'LLM Reasoning',
    version: '1.0.0',
    description:
      'Uses Large Language Model for intelligent code analysis and reasoning.',
  };

  private aiProvider: IAIProvider;

  constructor(aiProvider: IAIProvider) {
    this.aiProvider = aiProvider;
  }

  async initialize() {
    console.log('Initializing LLM Reasoning Plugin');
  }

  async analyze(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const llmResult = await this.analyzeWithLLM(content, file);

        // Convert LLM results to CodeIssue format
        for (const issue of llmResult.issues) {
          issues.push({
            id: `llm-${Date.now()}-${Math.random()}`,
            severity: issue.severity,
            message: issue.message,
            rule: issue.rule,
            location: {
              file,
              line: issue.line || 1,
              column: issue.column || 1,
            },
            fixable: false,
            suggestions: issue.suggestions || [],
          });
        }
      } catch (error) {
        console.error(`Error analyzing file ${file} with LLM:`, error);
        issues.push({
          id: `llm-error-${Date.now()}`,
          severity: 'error',
          message: `Failed to analyze with LLM: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'llm-analysis-error',
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
    console.log('Cleaning up LLM Reasoning Plugin');
  }

  private async analyzeWithLLM(
    content: string,
    filename: string
  ): Promise<LLMAnalysisResult> {
    const prompt = `
Please analyze the following code for potential issues, bugs, security vulnerabilities, and best practice violations.

File: ${filename}

Code:
\`\`\`
${content}
\`\`\`

Please provide your analysis in the following JSON format:
{
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "Description of the issue",
      "rule": "rule-name",
      "line": 1,
      "column": 1,
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "reasoning": "Your reasoning process",
  "confidence": 0.95
}

Focus on:
1. Security vulnerabilities
2. Performance issues
3. Code quality and maintainability
4. Best practices
5. Potential bugs
6. Type safety issues
7. Error handling
8. Code complexity
`;

    try {
      const response = await this.aiProvider.sendRequest(prompt);

      // Try to parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          issues: parsed.issues || [],
          reasoning: parsed.reasoning || '',
          confidence: parsed.confidence || 0.8,
        };
      }

      // Fallback if JSON parsing fails
      return {
        issues: [
          {
            severity: 'info' as const,
            message:
              'LLM analysis completed but could not parse structured response',
            rule: 'llm-parse-error',
            suggestions: ['Review the raw LLM output for insights'],
          },
        ],
        reasoning: response,
        confidence: 0.5,
      };
    } catch (error) {
      throw new Error(
        `LLM analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
