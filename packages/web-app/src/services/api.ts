import { Project, RunDetail, Rule, RuleCategory } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.text();
          if (errorData) {
            // Check if it's HTML (error page) or JSON
            if (errorData.trim().startsWith('<')) {
              errorMessage +=
                ' (Server returned HTML instead of JSON - check if API server is running)';
            } else {
              errorMessage += ` - ${errorData}`;
            }
          }
        } catch {
          // Ignore error when reading response body
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonResponse = await response.json();
        // Handle wrapped API responses with { success: true, data: ... } format
        if (
          jsonResponse &&
          typeof jsonResponse === 'object' &&
          'success' in jsonResponse
        ) {
          if (jsonResponse.success && 'data' in jsonResponse) {
            return jsonResponse.data;
          } else {
            throw new Error(jsonResponse.error || 'API request failed');
          }
        }
        // Return direct response if not wrapped
        return jsonResponse;
      } else {
        throw new Error(
          'Server returned non-JSON response. Check if API server is running on port 3001.'
        );
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Cannot connect to API server. Please ensure the backend is running on http://localhost:3001'
        );
      }
      throw error;
    }
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      await this.request<{ status: string }>('/health');
      return true;
    } catch {
      return false;
    }
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
