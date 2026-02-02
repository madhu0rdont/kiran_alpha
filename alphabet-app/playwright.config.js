import { defineConfig } from '@playwright/test';
import path from 'path';
import os from 'os';

const TEST_DB_PATH = path.join(os.tmpdir(), 'alphabet-e2e.db');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
  },
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  webServer: [
    {
      command: `TEST_DB_PATH=${TEST_DB_PATH} PORT=3002 node index.js`,
      cwd: './server',
      port: 3002,
      reuseExistingServer: false,
    },
    {
      command: 'VITE_API_URL=http://localhost:3002 npx vite --port 5174',
      cwd: './client',
      port: 5174,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
