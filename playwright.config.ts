import { defineConfig, devices } from "@playwright/test";

// Browser tests of the account app against the in-browser mock server (demo
// build, R3.3/R3.4). Each test runs in a fresh browser context, so the demo
// data starts from scratch and never touches a real browser profile.
// With E2E_REMOTE=1 (R3.6, CI job «e2e-backend») only the real-backend tests run:
// the app on Vite's proxy to Django with the isolated fictional preview database.
const DEMO_URL = "http://127.0.0.1:4312";
const REMOTE_URL = "http://127.0.0.1:4313";
const CI = !!process.env.CI;
const REMOTE = process.env.E2E_REMOTE === "1";
const PYTHON = process.env.E2E_PYTHON ?? "python";
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: DEMO_URL };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 60_000,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    acceptDownloads: true,
  },
  projects: REMOTE ? [
    // Sign-in, saving, hidden fields and private notes against the real server.
    { name: "remote-desktop", testMatch: /remote\.spec\.ts/, use: { ...desktop, baseURL: REMOTE_URL } },
  ] : [
    // The feature checklist (docs/implementation-plan.md) at desktop and phone widths.
    { name: "features-desktop", testMatch: /features\.spec\.ts/, use: desktop },
    { name: "features-mobile", testMatch: /features\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: DEMO_URL } },
    // Roles, hidden fields, connection drops, conflicts and retries through the sheet store.
    { name: "demo-desktop", testMatch: /demo\.spec\.ts/, use: desktop },
  ],
  expect: { timeout: 10_000 },
  webServer: REMOTE ? [
    { command: `${PYTHON} backend/manage.py runserver 127.0.0.1:8000 --noreload --settings=config.preview_settings`, url: "http://127.0.0.1:8000/api/v1/auth/csrf", reuseExistingServer: !CI, timeout: 120_000 },
    { command: "npx vite --mode remote --port 4313 --strictPort --host 127.0.0.1", url: REMOTE_URL, reuseExistingServer: !CI, timeout: 120_000 },
  ] : [
    { command: "npx vite --mode demo --port 4312 --strictPort --host 127.0.0.1", url: DEMO_URL, reuseExistingServer: !CI, timeout: 120_000 },
  ],
});
