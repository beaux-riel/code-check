import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import ProjectList from '../pages/ProjectList';
import ProjectDetail from '../pages/ProjectDetail';
import ProjectSettings from '../pages/ProjectSettings';
import { apiService } from '../services/api';

// Mock the API service
jest.mock('../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock the WebSocket hook
jest.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    subscribe: jest.fn(() => jest.fn()),
    unsubscribe: jest.fn(),
    send: jest.fn(),
    isConnected: true,
    error: null,
  }),
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ projectId: 'test-project-id' }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ChakraProvider>{children}</ChakraProvider>
  </BrowserRouter>
);

describe('Project Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProjectList', () => {
    it('displays empty state when no projects exist', async () => {
      mockApiService.getProjects.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ProjectList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Create your first project to get started with code analysis'
          )
        ).toBeInTheDocument();
      });
    });

    it('displays projects list when projects exist', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          description: 'A test project',
          language: 'typescript',
          lastRun: new Date().toISOString(),
          status: 'completed' as const,
          runsCount: 5,
          issuesCount: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'project-2',
          name: 'Test Project 2',
          description: 'Another test project',
          language: 'javascript',
          lastRun: new Date().toISOString(),
          status: 'pending' as const,
          runsCount: 2,
          issuesCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockApiService.getProjects.mockResolvedValue(mockProjects);

      render(
        <TestWrapper>
          <ProjectList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    it('allows creating a new project', async () => {
      mockApiService.getProjects.mockResolvedValue([]);
      const newProject = {
        id: 'new-project',
        name: 'New Test Project',
        description: 'A newly created project',
        language: 'typescript',
        lastRun: new Date().toISOString(),
        status: 'pending' as const,
        runsCount: 0,
        issuesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockApiService.createProject.mockResolvedValue(newProject);

      render(
        <TestWrapper>
          <ProjectList />
        </TestWrapper>
      );

      // Open create project modal
      const createButton = await screen.findByText('New Project');
      fireEvent.click(createButton);

      // Fill in project details
      const nameInput = screen.getByPlaceholderText('Enter project name');
      const descriptionInput = screen.getByPlaceholderText(
        'Enter project description'
      );

      fireEvent.change(nameInput, { target: { value: 'New Test Project' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'A newly created project' },
      });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.createProject).toHaveBeenCalledWith({
          name: 'New Test Project',
          description: 'A newly created project',
          language: 'javascript',
          lastRun: expect.any(String),
          status: 'pending',
          runsCount: 0,
          issuesCount: 0,
        });
      });
    });

    it('navigates to project detail when view button is clicked', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          description: 'A test project',
          language: 'typescript',
          lastRun: new Date().toISOString(),
          status: 'completed' as const,
          runsCount: 5,
          issuesCount: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockApiService.getProjects.mockResolvedValue(mockProjects);

      render(
        <TestWrapper>
          <ProjectList />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewButton = screen.getByLabelText('View project');
        fireEvent.click(viewButton);
        expect(mockNavigate).toHaveBeenCalledWith('/projects/project-1');
      });
    });

    it('navigates to project settings when settings button is clicked', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          description: 'A test project',
          language: 'typescript',
          lastRun: new Date().toISOString(),
          status: 'completed' as const,
          runsCount: 5,
          issuesCount: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockApiService.getProjects.mockResolvedValue(mockProjects);

      render(
        <TestWrapper>
          <ProjectList />
        </TestWrapper>
      );

      await waitFor(() => {
        const settingsButton = screen.getByLabelText('Project settings');
        fireEvent.click(settingsButton);
        expect(mockNavigate).toHaveBeenCalledWith(
          '/projects/project-1/settings'
        );
      });
    });
  });

  describe('ProjectDetail', () => {
    const mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'A test project',
      language: 'typescript',
      lastRun: new Date().toISOString(),
      status: 'completed' as const,
      runsCount: 5,
      issuesCount: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockRuns = [
      {
        id: 'run-1',
        projectId: 'test-project-id',
        projectName: 'Test Project',
        status: 'completed' as const,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 30000,
        issues: [],
        metrics: {
          totalFiles: 50,
          processedFiles: 50,
          totalIssues: 10,
          errors: 2,
          warnings: 6,
          info: 2,
          codeQualityScore: 85,
          performanceScore: 90,
          securityScore: 95,
        },
        logs: [],
      },
    ];

    it('displays project information and runs', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);
      mockApiService.getRuns.mockResolvedValue(mockRuns);

      render(
        <TestWrapper>
          <ProjectDetail />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('A test project')).toBeInTheDocument();
        expect(screen.getByText('Language: typescript')).toBeInTheDocument();
        expect(screen.getByText('Total Runs: 5')).toBeInTheDocument();
      });
    });

    it('allows starting a new run', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);
      mockApiService.getRuns.mockResolvedValue(mockRuns);
      const newRun = {
        ...mockRuns[0],
        id: 'new-run',
        status: 'pending' as const,
      };
      mockApiService.startRun.mockResolvedValue(newRun);

      render(
        <TestWrapper>
          <ProjectDetail />
        </TestWrapper>
      );

      await waitFor(() => {
        const startRunButton = screen.getByText('Start New Run');
        fireEvent.click(startRunButton);
      });

      await waitFor(() => {
        expect(mockApiService.startRun).toHaveBeenCalledWith('test-project-id');
      });
    });

    it('allows editing project details', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);
      mockApiService.getRuns.mockResolvedValue(mockRuns);
      const updatedProject = {
        ...mockProject,
        name: 'Updated Project Name',
        description: 'Updated description',
      };
      mockApiService.updateProject.mockResolvedValue(updatedProject);

      render(
        <TestWrapper>
          <ProjectDetail />
        </TestWrapper>
      );

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Update project details in the modal
      const nameInput = screen.getByDisplayValue('Test Project');
      fireEvent.change(nameInput, {
        target: { value: 'Updated Project Name' },
      });

      const updateButton = screen.getByText('Update Project');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockApiService.updateProject).toHaveBeenCalledWith(
          'test-project-id',
          {
            name: 'Updated Project Name',
            description: 'A test project',
          }
        );
      });
    });

    it('navigates to project settings', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);
      mockApiService.getRuns.mockResolvedValue(mockRuns);

      render(
        <TestWrapper>
          <ProjectDetail />
        </TestWrapper>
      );

      await waitFor(() => {
        const settingsButton = screen.getByText('Settings');
        fireEvent.click(settingsButton);
        expect(mockNavigate).toHaveBeenCalledWith(
          '/projects/test-project-id/settings'
        );
      });
    });

    it('displays empty state when no runs exist', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);
      mockApiService.getRuns.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ProjectDetail />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No runs found')).toBeInTheDocument();
        expect(
          screen.getByText('Start your first analysis run to see results here')
        ).toBeInTheDocument();
      });
    });
  });

  describe('ProjectSettings', () => {
    const mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'A test project',
      language: 'typescript',
      lastRun: new Date().toISOString(),
      status: 'completed' as const,
      runsCount: 5,
      issuesCount: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('displays project settings form', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);

      render(
        <TestWrapper>
          <ProjectSettings />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Project Settings')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A test project')).toBeInTheDocument();
      });
    });

    it('allows updating project settings', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);
      const updatedProject = {
        ...mockProject,
        name: 'Updated Settings Name',
      };
      mockApiService.updateProject.mockResolvedValue(updatedProject);

      render(
        <TestWrapper>
          <ProjectSettings />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test Project');
        fireEvent.change(nameInput, {
          target: { value: 'Updated Settings Name' },
        });

        const saveButton = screen.getByText('Save Settings');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockApiService.updateProject).toHaveBeenCalledWith(
          'test-project-id',
          {
            name: 'Updated Settings Name',
            description: 'A test project',
            language: 'typescript',
          }
        );
      });
    });

    it('allows resetting settings', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);

      render(
        <TestWrapper>
          <ProjectSettings />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test Project');
        fireEvent.change(nameInput, { target: { value: 'Modified Name' } });

        const resetButton = screen.getByText('Reset Changes');
        fireEvent.click(resetButton);

        expect(nameInput).toHaveValue('Test Project');
      });
    });

    it('navigates back to project detail', async () => {
      mockApiService.getProject.mockResolvedValue(mockProject);

      render(
        <TestWrapper>
          <ProjectSettings />
        </TestWrapper>
      );

      await waitFor(() => {
        const backButton = screen.getByText('Back to Project');
        fireEvent.click(backButton);
        expect(mockNavigate).toHaveBeenCalledWith('/projects/test-project-id');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when project loading fails', async () => {
      mockApiService.getProject.mockRejectedValue(
        new Error('Project not found')
      );
      mockApiService.getRuns.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ProjectDetail />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading project')).toBeInTheDocument();
        expect(screen.getByText('Project not found')).toBeInTheDocument();
      });
    });

    it('displays error when projects list loading fails', async () => {
      mockApiService.getProjects.mockRejectedValue(
        new Error('API server unavailable')
      );

      render(
        <TestWrapper>
          <ProjectList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Cannot connect to API server!')
        ).toBeInTheDocument();
        expect(screen.getByText('API server unavailable')).toBeInTheDocument();
      });
    });
  });
});
