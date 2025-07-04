import * as vscode from 'vscode';
import axios from 'axios';
import { CodeAnalysisReport, CodeIssue } from '@code-check/shared/types';
import { ConfigurationManager } from '../config/ConfigurationManager';

export class ApiClient {
  private apiUrl: string;

  constructor(private configManager: ConfigurationManager) {
    this.apiUrl = this.configManager.getConfig().apiEndpoint;
  }

  public async analyzeFile(
    filePath: string,
    content: string
  ): Promise<{ issues: CodeIssue[] } | null> {
    try {
      const response = await axios.post(`${this.apiUrl}/analyze`, {
        filePath,
        content,
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      return null;
    }
  }

  public async getMetrics(): Promise<CodeAnalysisReport | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return null;
    }
  }
}
