import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import App from '../../App';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
  </ChakraProvider>
);

// Mock API calls
global.fetch = jest.fn();

const mockProjects = [
  {
    id: '1',
    name: 'Test Project 1',
    path: '/path/to/project1',
    lastAnalyzed: '2024-01-01T00:00:00Z',
    status: 'completed',
    metrics: {
      filesCount: 100,
      linesOfCode: 5000,
      issues: 10,
    },
  },
  {
    id: '2',
    name: 'Test Project 2',
    path: '/path/to/project2',
    lastAnalyzed: '2024-01-02T00:00:00Z',
    status: 'running',
    metrics: {
      filesCount: 150,
      linesOfCode: 7500,
      issues: 5,
    },
  },
];

describe('Project Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('displays project list on initial load', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });

  it('allows user to view project details', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click on project to view details
    await user.click(screen.getByText('Test Project 1'));

    await waitFor(() => {
      expect(screen.getByText('5000')).toBeInTheDocument(); // Lines of code
      expect(screen.getByText('100')).toBeInTheDocument(); // Files count
    });
  });

  it('shows project status correctly', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should handle error gracefully and show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('supports project search/filtering', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });

    // Find search input and filter projects
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Project 1');

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
    });
  });

  it('allows starting new analysis', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: any) => {
        if (url.includes('/api/projects') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: '3', status: 'started' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
    );

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click start analysis button
    const startButton = screen.getByText(/start analysis/i);
    await user.click(startButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('displays real-time updates via WebSocket', async () => {
    // Mock WebSocket for real-time updates
    const mockWebSocket = {
      onopen: null as any,
      onmessage: null as any,
      onclose: null as any,
      onerror: null as any,
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    };

    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Simulate WebSocket message with project update
    const updateMessage = {
      type: 'projectUpdate',
      data: {
        id: '1',
        status: 'running',
        progress: 50,
      },
    };

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({
        data: JSON.stringify(updateMessage),
      } as MessageEvent);
    }

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });
});
