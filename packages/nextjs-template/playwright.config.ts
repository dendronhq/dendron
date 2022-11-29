import path from "path";
import { PlaywrightTestConfig, devices } from "@playwright/test";

const testDir = path.join(__dirname, "e2e");

const config: PlaywrightTestConfig = {
  testDir,
  globalSetup: require.resolve(path.join(testDir, "global-setup")),
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit the number of workers on CI, use default locally
  workers: process.env.CI ? 3 : undefined,
  use: {
    baseURL: "http://localhost",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "audit",
      testDir: "./audit",
    },
  ],
};
export default config;
