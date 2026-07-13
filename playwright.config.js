import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, 'backend');

// Playwright démarre le backend sur ce port — les specs API doivent utiliser la même URL.
process.env.QA_API_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'node server.js',
      cwd: backendDir,
      env: {
        NODE_ENV: 'development',
        PORT: '3000',
        JWT_SECRET: 'hkids-test-jwt-secret-with-32-characters-minimum'
      },
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    {
      command: 'npm run build --prefix frontend && npm run preview --prefix frontend -- --host localhost --port 4173',
      env: {
        VITE_API_URL: 'http://localhost:3000'
      },
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 180000
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
