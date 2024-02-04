import { OcgLogger } from "@core/logger";
import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { rndString } from "@utils/string";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { DefaultUserAgent } from "@core/constant";

const runningObj = Object.create({});
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
const prepareEnvConf = function () {
  const templateFile = "./.env.template";
  const realFile = "./.env";
  const logger = OcgLogger.get();
  if (!fs.existsSync(realFile)) {
    if (fs.existsSync(templateFile)) {
      fs.copyFile(templateFile, realFile, err => {
        if (err) throw err;
        logger.info("Copy config file successfully (.env.template to .env)");
      });
    } else {
      throw new Error("Cannot find template env config. Please ask Project's Maintainers for help");
    }
  }
};

// Check if OCG_PROXY_URL is set
//  - If it starts with http:// sock5:// … --> use as normal proxy
//  - If it starts with burp:// or burps:// we want to use burp
//     --> WE MUST ALSO SET `ignoreHTTPSErrors: true` to disable ssl cert check
//     - burp:// -> burp http proxy, burps:// burp https proxy (eg behind ngrok, nginx)
//  - Default OCG_PROXY_URL is null/empty string/undefined
let disableSSLCheck = false;
const ocgProxySetting = process.env.OCG_PROXY_URL;

const ocgProxy = {
  server: ocgProxySetting ? ocgProxySetting : "",
};

if (ocgProxySetting) {
  if (ocgProxySetting.startsWith("burp://")) {
    disableSSLCheck = true;
    ocgProxy.server = ocgProxySetting.replace("burp://", "http://");
  } else if (ocgProxySetting.startsWith("burps://")) {
    disableSSLCheck = true;
    ocgProxy.server = ocgProxySetting.replace("burps://", "https://");
  }
}

let loadedFrom = "";
const runningId = rndString(20);

if (process.env.CI_ENV) {
  loadedFrom = "ci";
  process.env.ENV = process.env.CI_ENV;
} else {
  loadedFrom = "local";
  // only load dotenv if
  prepareEnvConf();
  dotenv.config();
}
// eslint-disable-next-line no-console
console.log(
  `env - ${loadedFrom}: ${process.env.ENV}, proxy setting: ${ocgProxy.server}, disable ssl: ${disableSSLCheck}`,
);

runningObj.env = process.env.ENV;

let { outputDir, reportDir } = {
  outputDir: "/tmp/autopilot/output",
  reportDir: "/tmp/autopilot/reports",
};
if (process.env.RESULT_OUTPUT) {
  outputDir = `${process.env.RESULT_OUTPUT}_${runningId}`;
}
runningObj.outputDir = outputDir;

if (process.env.REPORT_OUTPUT) {
  reportDir = `${process.env.REPORT_OUTPUT}_${runningId}`;
}
runningObj.reportDir = reportDir;
/**
 * See https://playwright.dev/docs/test-configuration.
 */
let config: PlaywrightTestConfig;

const localConfig: PlaywrightTestConfig = {
  /* Maximum time one test can run for. */
  timeout: 150 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 60000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 3 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [[`html`, { open: "never", outputFolder: reportDir }], ["./src/core/reporters/ocg/index.ts"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 60000,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on",
    headless: false,
    ignoreHTTPSErrors: disableSSLCheck,
    proxy: ocgProxySetting ? ocgProxy : undefined,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1920,
          height: 1080,
        },
        userAgent: DefaultUserAgent,
      },
    },
  ],
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: outputDir,
  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

const localConfigViewPortNull: PlaywrightTestConfig = {
  /* Maximum time one test can run for. */
  timeout: 150 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 60000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 3 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [[`html`, { open: "never", outputFolder: reportDir }], ["./src/core/reporters/ocg/index.ts"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 60000,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on",
    headless: false,
    ignoreHTTPSErrors: disableSSLCheck,
    proxy: ocgProxySetting ? ocgProxy : undefined,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        viewport: null,
        launchOptions: {
          args: ["--start-maximized"],
        },
        userAgent: DefaultUserAgent,
      },
    },
  ],
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: outputDir,
  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

const devConfig: PlaywrightTestConfig = {
  timeout: 300 * 1000 * 2,
  expect: {
    timeout: 15 * 1000 * 2,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: [["./src/core/reporters/ocg/index.ts"]],
  use: {
    actionTimeout: 30 * 1000 * 2,
    trace: "on",
    headless: true,
    ignoreHTTPSErrors: disableSSLCheck,
    proxy: ocgProxySetting ? ocgProxy : undefined,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1920,
          height: 1080,
        },
        userAgent: DefaultUserAgent,
      },
    },
  ],
  outputDir: outputDir,
};

const prodtestConfig: PlaywrightTestConfig = {
  timeout: 150 * 1000 * 2,
  expect: {
    timeout: 15 * 1000 * 2,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: [["./src/core/reporters/ocg/index.ts"]],
  use: {
    actionTimeout: 25 * 1000 * 2,
    trace: "on",
    headless: true,
    ignoreHTTPSErrors: disableSSLCheck,
    proxy: ocgProxySetting ? ocgProxy : undefined,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1920,
          height: 1080,
        },
        userAgent: DefaultUserAgent,
      },
    },
  ],
};

const prodConfig: PlaywrightTestConfig = {
  timeout: 150 * 1000 * 2,
  expect: {
    timeout: 15 * 1000 * 2,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: [["./src/core/reporters/ocg/index.ts"]],
  use: {
    actionTimeout: 55 * 1000 * 2,
    trace: "on",
    headless: true,
    ignoreHTTPSErrors: disableSSLCheck,
    proxy: ocgProxySetting ? ocgProxy : undefined,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1920,
          height: 1080,
        },
        userAgent: DefaultUserAgent,
      },
    },
  ],
  outputDir: outputDir,
};

switch (process.env.ENV) {
  case "dev":
  case "development":
    config = devConfig;
    runningObj.conf = "dev";
    break;
  case "prodtest":
    config = prodtestConfig;
    runningObj.conf = "prodtest";
    break;
  case "prod":
  case "production":
    config = prodConfig;
    runningObj.conf = "prod";
    break;
  default:
    if (process.env.VIEWPORT_NULL) {
      config = localConfigViewPortNull;
    } else {
      config = localConfig;
    }
    break;
}

if (process.env.CI_ENV) {
  config.use.headless = true;
}

// eslint-disable-next-line no-console
console.log(`Running test with the following params: ${JSON.stringify(runningObj)}`);

export default config;
