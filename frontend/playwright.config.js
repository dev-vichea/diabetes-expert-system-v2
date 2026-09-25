import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    actionTimeout: 15000,
    launchOptions: existsSync(systemChrome) ? { executablePath: systemChrome } : {},
    trace: 'off', video: 'off', screenshot: 'off',
  },
  webServer: [
    {
      command: `${process.env.E2E_PYTHON || '../backend/.venv/bin/python'} ../backend/tests/e2e_server.py`,
      url: 'http://127.0.0.1:5002/api/health', timeout: 60000,
      env: { DYLD_FALLBACK_LIBRARY_PATH: process.env.DYLD_FALLBACK_LIBRARY_PATH || '/opt/homebrew/lib' },
    },
    {
      command: 'npm run dev -- --port 5174 --strictPort',
      url: 'http://localhost:5174', timeout: 60000,
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:5002/api', VITE_GOOGLE_CLIENT_ID: '' },
    },
  ],
})
