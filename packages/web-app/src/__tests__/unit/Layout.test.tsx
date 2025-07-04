import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../components/Layout';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </ChakraProvider>
);

describe('Layout Component', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays the navigation menu', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for common navigation elements
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const testContent = 'This is test content for the layout';

    render(
      <TestWrapper>
        <Layout>
          <div data-testid="child-content">{testContent}</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByTestId('child-content')).toHaveTextContent(testContent);
  });

  it('has proper accessibility structure', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for main content area
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('handles responsive navigation', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestWrapper>
    );

    // Test responsive behavior would require additional setup
    // This is a placeholder for more comprehensive responsive tests
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
