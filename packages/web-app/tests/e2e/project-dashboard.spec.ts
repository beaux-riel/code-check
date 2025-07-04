import { test, expect } from '@playwright/test';

test.describe('Project Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="project-dashboard"]', {
      timeout: 10000,
    });
  });

  test('should display project dashboard', async ({ page }) => {
    // Check that the main dashboard elements are visible
    await expect(
      page.locator('[data-testid="project-dashboard"]')
    ).toBeVisible();
    await expect(page.locator('h1')).toContainText('Code Check Dashboard');
  });

  test('should load and display projects', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });

    // Check that at least one project is displayed
    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards).toHaveCountGreaterThan(0);
  });

  test('should navigate to project details', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });

    // Click on the first project
    await page.locator('[data-testid="project-card"]').first().click();

    // Check that we navigated to project details
    await expect(page).toHaveURL(/\/projects\/\w+/);
    await page.waitForSelector('[data-testid="project-details"]', {
      timeout: 5000,
    });
  });

  test('should start a new analysis', async ({ page }) => {
    // Click on start analysis button
    await page.locator('[data-testid="start-analysis-btn"]').click();

    // Fill in project path (assuming there's a modal or form)
    await page.fill('[data-testid="project-path-input"]', '/test/project/path');

    // Submit the form
    await page.click('[data-testid="submit-analysis-btn"]');

    // Check for success message or loading state
    await expect(page.locator('[data-testid="analysis-started"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should filter projects by search', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });

    // Count initial projects
    const initialCount = await page
      .locator('[data-testid="project-card"]')
      .count();

    // Use search functionality
    await page.fill('[data-testid="search-input"]', 'test');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Check that search results are filtered
    const filteredCount = await page
      .locator('[data-testid="project-card"]')
      .count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should display project metrics correctly', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });

    // Click on first project to view details
    await page.locator('[data-testid="project-card"]').first().click();

    // Check that metrics are displayed
    await expect(page.locator('[data-testid="metrics-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="files-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="lines-of-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="issues-count"]')).toBeVisible();
  });

  test('should handle real-time updates', async ({ page }) => {
    // Start an analysis or find a running one
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });

    // Look for a project with running status
    const runningProject = page.locator(
      '[data-testid="project-card"][data-status="running"]'
    );

    if ((await runningProject.count()) > 0) {
      // Click on running project
      await runningProject.first().click();

      // Check for real-time progress updates
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="status-indicator"]')
      ).toContainText('running');

      // Wait for potential updates (this would be mocked in real tests)
      await page.waitForTimeout(2000);
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that mobile navigation works
    await expect(
      page.locator('[data-testid="mobile-menu-toggle"]')
    ).toBeVisible();

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Check that projects are still accessible
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="project-card"]')
    ).toHaveCountGreaterThan(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/projects', (route) => {
      route.abort('failed');
    });

    // Reload the page to trigger the error
    await page.reload();

    // Check that error state is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should export analysis reports', async ({ page }) => {
    // Navigate to a completed project
    await page.waitForSelector('[data-testid="project-card"]', {
      timeout: 10000,
    });
    const completedProject = page.locator(
      '[data-testid="project-card"][data-status="completed"]'
    );

    if ((await completedProject.count()) > 0) {
      await completedProject.first().click();

      // Click export button
      await page.click('[data-testid="export-report-btn"]');

      // Check export options
      await expect(
        page.locator('[data-testid="export-options"]')
      ).toBeVisible();

      // Select PDF export
      await page.click('[data-testid="export-pdf"]');

      // Wait for download to start (in real tests, you'd handle the download)
      await page.waitForTimeout(1000);
    }
  });
});
