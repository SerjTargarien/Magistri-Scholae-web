import { defineConfig, devices } from "@playwright/test";

// Browser smoke tests for the current UI (release R0). Each test runs in a
// fresh browser context, so mock and local databases start from scratch and
// never touch a real browser profile.
const MOCK_URL = "http://127.0.0.1:4310";
const LOCAL_URL = "http://127.0.0.1:4311";
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    acceptDownloads: true,
  },
  projects: [
    { name: "mock-desktop", testMatch: /mock\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: MOCK_URL } },
    { name: "mock-mobile", testMatch: /mock\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: MOCK_URL } },
    { name: "local-desktop", testMatch: /local\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: LOCAL_URL } },
  ],
  webServer: [
    { command: "npx vite --mode mock --port 4310 --strictPort --host 127.0.0.1", url: MOCK_URL, reuseExistingServer: !CI, timeout: 120_000 },
    // No --mode: VITE_STORAGE_MODE is unset, so the app uses local storage.
    { command: "npx vite --port 4311 --strictPort --host 127.0.0.1", url: LOCAL_URL, reuseExistingServer: !CI, timeout: 120_000 },
  ],
});
