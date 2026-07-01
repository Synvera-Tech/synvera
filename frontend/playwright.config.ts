import { defineConfig } from "@playwright/test";

// E2E validation of the Procedure Page. Self-contained: Playwright boots the Go API and the
// Next dev server (both reuse an already-running instance if present) so `npm run e2e` works
// from a cold checkout. The API runs on an isolated port (default 8090) so it never collides
// with a developer's own :8080 backend, and the frontend proxies /api/* to it.
//
// Run: `npm run e2e`. The API falls back to the embedded file catalog when DATABASE_URL is unset.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const API_PORT = process.env.E2E_API_PORT || "8090";
const API_URL = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    viewport: { width: 1300, height: 1700 },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [
    {
      // Playwright treats the server as ready when the URL returns 200–399; /api/health is the
      // dedicated 200 health route.
      command: `cd ../backend && PORT=${API_PORT} go run cmd/api/main.go`,
      url: `${API_URL}/api/health`,
      reuseExistingServer: true,
      timeout: 90_000,
    },
    {
      command: "npm run dev",
      env: { NEXT_PUBLIC_API_URL: API_URL },
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
