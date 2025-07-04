import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Launch browser and create context for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Wait for the application to be ready
  let retries = 0;
  const maxRetries = 10;

  while (retries < maxRetries) {
    try {
      await page.goto(baseURL!);
      // Check if the app has loaded by looking for a specific element
      await page.waitForSelector('[data-testid="app-loaded"]', {
        timeout: 5000,
      });
      break;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error(
          `Application failed to start after ${maxRetries} attempts`
        );
      }
      await page.waitForTimeout(2000);
    }
  }

  // Perform any global setup tasks here
  // For example, create test data, authenticate users, etc.

  await browser.close();
}

export default globalSetup;
