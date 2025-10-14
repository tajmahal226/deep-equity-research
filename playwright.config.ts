import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const HOST = process.env.HOST ?? "127.0.0.1";
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node .next/standalone/server.js",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT,
      HOSTNAME: HOST,
    },
  },
});
