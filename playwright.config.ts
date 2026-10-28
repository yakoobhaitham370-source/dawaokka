import { defineConfig } from '@playwright/test';
import { browserOptions } from './tests/tooling/browser-options';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/staff.spec.ts', // Separate isolated mock-server configuration.
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    ...browserOptions,
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone-320', use: { viewport: { width: 320, height: 900 } } },
    { name: 'phone-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173/demo',
    reuseExistingServer: true,
  },
});
