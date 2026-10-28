import { defineConfig } from '@playwright/test';
import { browserOptions } from './browser-options';

export default defineConfig({
  testDir: '.',
  testMatch: 'browser-smoke.spec.ts',
  outputDir: '../../test-results/smoke',
  workers: 1,
  timeout: 15000,
  reporter: 'line',
  use: { ...browserOptions, headless: true },
});
