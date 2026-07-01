import { defineConfig } from "@playwright/test";

// E2E validation of the Procedure Page. The frontend proxies /api/* to the Go API
// (NEXT_PUBLIC_API_URL), so the backend must be reachable when these run.
// Run: `npm run e2e` (starts `npm run dev` if nothing is already on :3000).
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 1300, height: 1700 },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
