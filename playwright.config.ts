import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Executa testes sequencialmente para evitar conflitos no banco
  fullyParallel: false,

  // Falha se test.only estiver no CI
  forbidOnly: !!process.env.CI,

  // Retries no CI
  retries: process.env.CI ? 2 : 0,

  // Um worker para evitar conflitos de dados
  workers: 1,

  // Reporter
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Configurações globais
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Trace em caso de falha
    trace: 'on-first-retry',

    // Screenshot em caso de falha
    screenshot: 'only-on-failure',

    // Video em caso de falha
    video: 'on-first-retry',

    // Timeout de ações
    actionTimeout: 15000,
  },

  // Projetos (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Servidor de desenvolvimento
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Timeout global
  timeout: 60000,

  // Timeout para expects
  expect: {
    timeout: 10000,
  },
});
