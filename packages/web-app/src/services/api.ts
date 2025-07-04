import { Project, RunDetail, Rule, RuleCategory } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Runs
  async getRuns(projectId: string): Promise<RunDetail[]> {
    return this.request<RunDetail[]>(`/projects/${projectId}/runs`);
  }

  async getRun(projectId: string, runId: string): Promise<RunDetail> {
    return this.request<RunDetail>(`/projects/${projectId}/runs/${runId}`);
  }

  async startRun(projectId: string): Promise<RunDetail> {
    return this.request<RunDetail>(`/projects/${projectId}/runs`, {
      method: 'POST',
    });
  }

  async stopRun(projectId: string, runId: string): Promise<void> {
    return this.request<void>(`/projects/${projectId}/runs/${runId}/stop`, {
      method: 'POST',
    });
  }

  // Rules
  async getRules(): Promise<RuleCategory[]> {
    return this.request<RuleCategory[]>('/rules');
  }

  async updateRule(ruleId: string, rule: Partial<Rule>): Promise<Rule> {
    return this.request<Rule>(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  // Export
  async exportRunResults(
    projectId: string,
    runId: string,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<Blob> {
    const url = `${API_BASE_URL}/projects/${projectId}/runs/${runId}/export?format=${format}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Export failed: ${response.status} ${response.statusText}`
      );
    }

    return response.blob();
  }

  async downloadFile(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
