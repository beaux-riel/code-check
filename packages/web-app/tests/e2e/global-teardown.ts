import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Perform any global cleanup tasks here
  // For example, cleanup test data, stop test servers, etc.

  console.log('Global teardown completed');
}

export default globalTeardown;
