import { defineConfig, devices } from "@playwright/test";

// Browser smoke tests for the current UI (release R0). Each test runs in a
// fresh browser context, so mock and local databases start from scratch and
// never touch a real browser profile.
const MOCK_URL = "http://127.0.0.1:4310";
// E2E_LOCAL_URL points the local-mode tests at a deployed build instead of a
// dev server, e.g. a Caddy test on http://127.0.0.1:8088 or staging.
const LOCAL_URL = process.env.E2E_LOCAL_URL ?? "http://127.0.0.1:4311";
const CI = !!process.env.CI;
// Screenshot tests (release R3.1) run only in the pinned Playwright container
// (CI job "visual"), where fonts and rendering never change between runs.
const VISUAL = !!process.env.E2E_VISUAL;
// Fixed browser locale and time zone, so dates render the same everywhere.
const visualUse = {
  baseURL: MOCK_URL, locale: "es-ES", timezoneId: "Europe/Madrid",
  // Draw text the same way on every run: one raster thread, no sub-pixel
  // glyph positioning or hinting differences between runs.
  launchOptions: { args: ["--num-raster-threads=1", "--disable-font-subpixel-positioning", "--font-render-hinting=none", "--disable-lcd-text", "--force-color-profile=srgb"] },
};

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
  projects: [
    { name: "mock-desktop", testMatch: /mock\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: MOCK_URL } },
    { name: "mock-mobile", testMatch: /mock\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: MOCK_URL } },
    { name: "local-desktop", testMatch: /local\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: LOCAL_URL } },
    ...(VISUAL ? [
      { name: "visual-desktop", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, ...visualUse } },
      // Phone layout at normal pixel density: the same layout, a seventh of the image size.
      { name: "visual-mobile", testMatch: /visual\.spec\.ts/, use: { ...devices["Pixel 7"], deviceScaleFactor: 1, ...visualUse } },
    ] : []),
  ],
  // Screenshot references are lossless WebP: a quarter smaller than PNG.
  expect: { timeout: 10_000, toHaveScreenshot: { type: "webp" } },
  webServer: [
    { command: "npx vite --mode mock --port 4310 --strictPort --host 127.0.0.1", url: MOCK_URL, reuseExistingServer: !CI, timeout: 120_000 },
    // No --mode: VITE_STORAGE_MODE is unset, so the app uses local storage.
    ...(process.env.E2E_LOCAL_URL ? [] : [
      { command: "npx vite --port 4311 --strictPort --host 127.0.0.1", url: LOCAL_URL, reuseExistingServer: !CI, timeout: 120_000 },
    ]),
  ],
});
