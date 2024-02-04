import type { APIRequestContext, Page } from "@playwright/test";
import { devices, request, test as base } from "@playwright/test";
import { extractCodeName } from "@core/utils/string";
import { ConfigImpl } from "@core/conf/conf";
import { OcgLogger } from "@core/logger";
import { DatabaseType } from "@core/database";
import { AccountPage } from "@pages/dashboard/accounts";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";

import type {
  AuthRequestWithExchangeFixture,
  CaseConf,
  Config,
  CronMode,
  FixtureApi,
  FixtureApiOptions,
  FixtureApiResponse,
  FixtureIdDomainCredentials,
  FixtureScheduler,
  FixtureToken,
  MultipleStore,
  TestApiCase,
  TestConfig,
  THCaseData as THCaseDataType,
} from "@types";
import { ToolFixture } from "@types";
import { getShopToken, getToken, getTokenWithCredentials, getUserToken } from "@utils/token";
import { sanitizeRequestOptions, sanitizeResponse } from "@utils/service";
import { generateCrontab, TestHubManager } from "@utils/testhub";
import { SlackHelper } from "@utils/slack";
import { AccessTokenHeaderName, DefaultUserAgent, UserAgentHeaderName } from "@core/constant";
import { HivePBase } from "@pages/hive/hivePBase";
import { CrossPanda } from "@pages/crosspanda/cross_panda";
import { chromium, firefox, webkit } from "playwright-extra";
// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { BrowserContextOptions } from "playwright-core";

const stlPlugin = stealthPlugin();

// Add the plugin to playwright
// chromium.use(stealth);
chromium.use(stlPlugin);
firefox.use(stlPlugin);
webkit.use(stlPlugin);

const logger = OcgLogger.get();

/**
 * Sanitize test config
 * @param config
 */
const sanitizeTestConfig = (config: Config): TestConfig => {
  const isCaseConfEmpty = Object.keys(config.caseConf).length === 0;

  // Case conf empty when case using data driven
  if (isCaseConfEmpty && config.suiteConf.is_merge_case_data) {
    const suiteConf = config.suiteConf.cases;
    let currentCaseData;

    for (const suitConfKey in suiteConf) {
      if (suiteConf[suitConfKey].data) {
        const caseConfigs = suiteConf[suitConfKey].data;

        for (const caseConfig of caseConfigs) {
          if (caseConfig.case_id === config.caseName) {
            currentCaseData = caseConfig;
            break;
          }
        }
      }

      if (currentCaseData) {
        // already found case conf
        break;
      }
    }

    if (!currentCaseData) {
      throw Error(`Cannot get config for case ${config.caseName}`);
    }

    return Object.assign({}, config.suiteConf || {}, currentCaseData || {}) as TestConfig;
  }

  return Object.assign({}, config.suiteConf || {}, config.caseConf || {}) as TestConfig;
};

// Prevent chrome being detected as a bot https://intoli.com/blog/making-chrome-headless-undetectable/
const createPage = async browser => {
  const page = await browser.newPage({
    setBypassCSP: true,
  });

  await page.addInitScript(`
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;

    window.console.debug = () => {
      return null;
    };

    // We can mock this in as much depth as we need for the test.
    window.chrome = {
      runtime: {},
    };

    if (!window.Notification) {
      window.Notification = {
        permission: "denied",
      };
    }

    // Pass the Permissions Test.
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.__proto__.query = parameters =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          })
        : originalQuery(parameters);

    // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
    const oldCall = Function.prototype.call;

    function call() {
      return oldCall.apply(this, arguments);
    }
    Function.prototype.call = call;

    const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
    const oldToString = Function.prototype.toString;

    function functionToString() {
      if (this === window.navigator.permissions.query) {
        return "function query() { [native code] }";
      }
      if (this === functionToString) {
        return nativeToStringFunctionString;
      }
      return oldCall.call(oldToString, this);
    }
    Function.prototype.toString = functionToString;

    // Overwrite the "plugins" property to use a custom getter.
    Object.defineProperty(navigator, "plugins", {
      get: () => {
        const ChromiumPDFPlugin = {};
        ChromiumPDFPlugin.__proto__ = Plugin.prototype;
        const plugins = {
          0: ChromiumPDFPlugin,
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chromium PDF Plugin",
          __proto__: PluginArray.prototype,
        };
        return plugins;
      },
    });

    const elementDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");

    // redefine the property with a patched descriptor
    Object.defineProperty(HTMLDivElement.prototype, "offsetHeight", {
      ...elementDescriptor,
      get: function () {
        if (this.id === "modernizr") {
          return 1;
        }
        // @ts-ignore
        return elementDescriptor.get.apply(this);
      },
    });

    // Overwrite the languages property to use a custom getter.
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
      get: function () {
        return window;
      },
    });`);
  return page;
};

export const test = base.extend<{
  dashboard: Page;
  crossPanda: Page;
  hiveSBase: Page;
  hiveSecurity: Page;
  account: Page;
  selectShop: Page;
  conf: Config;
  cConf: CaseConf;
  ggPage: Page;
  authRequest: APIRequestContext;
  authUserAffiliateRequest: APIRequestContext;
  api: FixtureApi;
  token: FixtureToken;
  scheduler: FixtureScheduler;
  pageMobile: Page;
  hivePBase: Page;
  snapshotFixture: SnapshotFixture;
  toolFixture: ToolFixture;
  multipleStore: MultipleStore;
  authRequestWithExchangeToken: AuthRequestWithExchangeFixture;
}>({
  // all conf
  conf: [
    async ({}, use, testInfo) => {
      const codeNames = extractCodeName(testInfo.title);
      if (codeNames.length !== 1) {
        throw new Error(
          "Invalid code name." +
            "Please attach code name to your test with the format @TC_<codename> OR @TS_<codename> OR @SB_<codename> OR @PB_<codename>",
        );
      }
      const conf = new ConfigImpl(testInfo.file, codeNames[0]);
      conf.loadConfigFromFile();
      await use(conf);
    },
    { scope: "test" },
  ],
  // case conf
  cConf: [
    async ({ conf }, use) => {
      await use(conf.caseConf);
    },
    { scope: "test" },
  ],
  // google account fixture
  ggPage: [
    async ({ conf }, use) => {
      const ggEmail = conf.suiteConf.google_credentials.email;
      const ggPassword = conf.suiteConf.google_credentials.password;

      const browser = await chromium.launch({});
      const page = await createPage(browser);
      await page.goto(`https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin`);
      await page.fill('input[type="email"]', ggEmail);
      await page.locator("#identifierNext >> button").click();
      await page.fill('#password >> input[type="password"]', ggPassword);
      await page.locator("button >> nth=1").click();

      await page.waitForSelector(`input[aria-label="Search Google Account"]`, { timeout: 10000 });

      await use(page);
    },
    { scope: "test" },
  ],

  dashboard: [
    async ({ context, token, conf }, use) => {
      const page = await context.newPage();
      let shop;
      let authed = false;
      const config = sanitizeTestConfig(conf);
      try {
        shop = await token.get({
          userId: config.user_id,
          shopId: config.shop_id,
          domain: config.shop_name,
          username: config.username,
          password: config.password,
        });
        if (shop !== undefined && shop.access_token !== undefined && shop.access_token !== "") {
          await page.route("**/admin/**", (route, request) => {
            const headers = request.headers();
            if (headers["x-shopbase-access-token"] && headers["x-shopbase-access-token"] === "default_token") {
              Object.assign(headers, { "x-shopbase-access-token": `${shop.access_token}` });
            }

            route.continue({
              headers: headers,
            });
          });
          await page.goto(`https://${config["domain"]}/admin?x_key=${shop.access_token}`);
          await page.waitForSelector(".nav-sidebar");
        }
        authed = true;
      } catch (e) {
        const db = new DashboardPage(page, config["domain"]);
        await db.login({
          userId: config.user_id,
          shopId: config.shop_id,
          email: config.username,
          password: config.password,
        });

        authed = true;
      }

      if (!authed) {
        throw new Error(`Cannot authenticate to ${config["domain"]}`);
      }
      await use(page);
    },
    { scope: "test" },
  ],
  crossPanda: [
    async ({ context, conf }, use) => {
      const page = await context.newPage();
      const crossPanda = new CrossPanda(page, conf.suiteConf.crosspanda_domain);
      await crossPanda.loginToCrossPanda({
        account: conf.suiteConf.crosspanda_username,
        password: conf.suiteConf.crosspanda_password,
      });
      await use(page);
    },
    { scope: "test" },
  ],
  hiveSBase: [
    async ({ context, conf }, use) => {
      const page = await context.newPage();
      const hive = new HiveSBaseOld(page, conf.suiteConf.hive_domain);
      await hive.loginToHiveShopBase({
        account: conf.suiteConf.hive_username,
        password: conf.suiteConf.hive_password,
      });
      await use(page);
    },
    { scope: "test" },
  ],
  hiveSecurity: [
    async ({ context, conf }, use) => {
      let hiveUsername = conf.suiteConf.hive_username;
      let hivePassword = conf.suiteConf.hive_password;

      if (conf.caseConf.hive_username) {
        hiveUsername = conf.caseConf.hive_username;
      }

      if (conf.caseConf.hive_password) {
        hivePassword = conf.caseConf.hive_password;
      }

      // logger.info(`Login hive using username: ${hiveUsername} and pwd ${hivePassword}}`);

      const page = await context.newPage();
      const hive = new HiveSBaseOld(page, conf.suiteConf.hive_domain);
      await hive.loginToHiveShopBase({
        account: hiveUsername,
        password: hivePassword,
      });
      await use(page);
    },
    { scope: "test" },
  ],
  hivePBase: [
    async ({ context, conf }, use) => {
      const page = await context.newPage();
      const hive = new HivePBase(page, conf.suiteConf.hive_pb_domain);
      await hive.loginToHivePBase({
        account: conf.suiteConf.hive_pb_username,
        password: conf.suiteConf.hive_pb_password,
      });
      await use(page);
    },
    { scope: "test" },
  ],
  account: [
    async ({ context, conf }, use) => {
      const page = await context.newPage();
      const config = sanitizeTestConfig(conf);
      const db = new AccountPage(page, config["accounts_domain"]);
      await db.login({
        email: config.username,
        password: config.password,
      });

      await use(page);
    },
    { scope: "test" },
  ],
  selectShop: [
    async ({ context, conf }, use) => {
      const page = await context.newPage();
      const config = sanitizeTestConfig(conf);
      const db = new AccountPage(page, config["domain"]);
      await db.signInSecurity(config.username, config.password, true);
      await use(page);
    },
    { scope: "test" },
  ],
  authRequest: [
    async ({ conf, token: fixtureToken }, use) => {
      // get token
      const config = sanitizeTestConfig(conf);
      const shop = await fixtureToken.get({
        userId: config.user_id,
        shopId: config.shop_id,
        domain: config.shop_name,
        username: config.username,
        password: config.password,
      });
      const context = await request.newContext({
        extraHTTPHeaders: {
          [AccessTokenHeaderName]: shop.access_token,
          [UserAgentHeaderName]: DefaultUserAgent,
        },
      });
      use(context);
    },
    { scope: "test" },
  ],
  authUserAffiliateRequest: [
    async ({ conf, token: fixtureToken }, use) => {
      // get token
      const config = sanitizeTestConfig(conf);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const castedConfig = config as any;
      const token = await fixtureToken.getUserToken({
        username: castedConfig.promoter.username,
        password: castedConfig.promoter.password,
      });
      const context = await request.newContext({
        extraHTTPHeaders: {
          [AccessTokenHeaderName]: token.access_token,
          [UserAgentHeaderName]: DefaultUserAgent,
        },
      });
      use(context);
    },
    { scope: "test" },
  ],
  api: [
    async ({ request, token, conf }, use) => {
      const apiContext: FixtureApi = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async request<T = any>(testApiCase: TestApiCase, options?: FixtureApiOptions): Promise<FixtureApiResponse<T>> {
          try {
            let accessToken: string;
            // adding auth header
            if (options && options.autoAuth) {
              const config = sanitizeTestConfig(conf);
              let optionsParam: FixtureIdDomainCredentials = {
                userId: config.user_id,
                shopId: config.shop_id,
                domain: config.shop_name,
                username: config.username,
                password: config.password,
              };
              if (options.conf) {
                optionsParam = options.conf;
              }

              const shop = await token.get(optionsParam);
              accessToken = shop.access_token;
            }

            let requestOptions = sanitizeRequestOptions(testApiCase);
            const expectResponseStatus = testApiCase.response?.status;
            if (apiContext.middleware.request.list) {
              apiContext.middleware.request.list.forEach(fn => {
                requestOptions = fn(requestOptions);
              });
            }
            // headers is always be created so just need to add the header
            if (accessToken) {
              requestOptions.headers[AccessTokenHeaderName] = accessToken;
              requestOptions.headers[UserAgentHeaderName] = DefaultUserAgent;
            }

            const response = await (options?.context || request).fetch(requestOptions.url, requestOptions);
            if (expectResponseStatus && response.status() !== expectResponseStatus) {
              return Promise.reject(`Request invalid status code: ${response.status()}`);
            }

            return {
              ok: response.ok(),
              status: response.status(),
              data: await sanitizeResponse<T>(response, apiContext.middleware.response.list, testApiCase.type),
            };
          } catch (e) {
            logger.error("Error when request", e);
            return Promise.reject(`Error when request, detail: ${e}`);
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async all<T = any>(
          testApiCases: Array<TestApiCase>,
          options?: FixtureApiOptions,
        ): Promise<Array<FixtureApiResponse<T>>> {
          try {
            let accessToken: string;
            // adding auth header
            if (options && options.autoAuth) {
              const config = sanitizeTestConfig(conf);
              const shop = await token.get({
                userId: config.user_id,
                shopId: config.shop_id,
                domain: config.shop_name,
                username: config.username,
                password: config.password,
              });
              accessToken = shop.access_token;
            }

            const requestOptionsList = [];
            testApiCases.forEach(testApiCase => {
              let requestOptions = sanitizeRequestOptions(testApiCase);
              if (apiContext.middleware.request.list) {
                apiContext.middleware.request.list.forEach(fn => {
                  requestOptions = fn(requestOptions);
                });
                requestOptionsList.push(requestOptions);
              }
              // headers is always be created so just need to add the header
              if (accessToken) {
                requestOptions.headers[AccessTokenHeaderName] = accessToken;
                requestOptions.headers[UserAgentHeaderName] = DefaultUserAgent;
              }
            });

            if (options?.parallel) {
              const promises = [];
              requestOptionsList.map(async (requestOptions, index) => {
                const testApiCase = testApiCases[index];
                const expectStatus = testApiCase.response.status;
                const response = await (options?.context || request).fetch(requestOptions.url, requestOptions);
                if (expectStatus && response.status() !== expectStatus) {
                  return { status: response.status(), data: {} };
                }

                return {
                  ok: response.ok(),
                  status: response.status(),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  data: await sanitizeResponse<any>(response, apiContext.middleware.response.list, testApiCase.type),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as FixtureApiResponse<any>;
              });

              return Promise.all(promises);
            }

            const responseList = [];
            let index = 0;
            for (const requestOptions of requestOptionsList) {
              const response = await (options?.context || request).fetch(requestOptions.url, requestOptions);
              const testApiCase = testApiCases[index];
              const expectStatus = testApiCase.response.status;
              if (expectStatus && response.status() !== expectStatus) {
                responseList.push({
                  status: response.status(),
                  data: response.text(),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as FixtureApiResponse<any>);
              }

              responseList.push({
                ok: response.ok(),
                status: response.status(),
                data: await sanitizeResponse(response, apiContext.middleware.response.list, testApiCase.type),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as FixtureApiResponse<any>);
              index++;
            }

            return responseList;
          } catch (e) {
            logger.error("Error when request api", e);
          }
        },
        middleware: {
          request: {
            list: [],
            use(fn) {
              apiContext.middleware.request.list.push(fn);
            },
          },
          response: {
            list: [],
            use(fn) {
              apiContext.middleware.response.list.push(fn);
            },
          },
        },
      };

      await use(apiContext);
    },
    { scope: "test" },
  ],
  token: [
    async ({ conf }, use) => {
      const context = {
        getUserToken: async ({ username, password }) => {
          return getUserToken(conf.suiteConf.api, { username, password });
        },
        getShopToken: async ({ userId, shopId, token, domain }) => {
          try {
            if (userId > 0 && shopId > 0) {
              const token = await getToken(userId, shopId);
              return {
                id: shopId,
                // eslint-disable-next-line camelcase
                access_token: token,
              };
            }
          } catch (e) {
            logger.debug("Error when get token by user_id and shop_id", e);
          }

          return getShopToken(conf.suiteConf.api, { userId, token, domain });
        },
        getWithCredentials: async ({ domain, username, password }) => {
          return getTokenWithCredentials(conf.suiteConf.api, {
            domain,
            username,
            password,
          });
        },
        get: async ({ userId, shopId, domain, username, password }) => {
          try {
            if (userId > 0 && shopId > 0) {
              const token = await getToken(userId, shopId);
              return {
                id: shopId,
                // eslint-disable-next-line camelcase
                access_token: token,
              };
            }
          } catch (e) {
            logger.debug("Error when get token by user_id and shop_id", e);
          }

          return getTokenWithCredentials(conf.suiteConf.api, {
            domain,
            username,
            password,
          });
        },
      };

      await use(context);
    },
    { scope: "test" },
  ],
  pageMobile: [
    async ({ conf, browser }, use) => {
      let configDevice: BrowserContextOptions;
      const config = sanitizeTestConfig(conf);

      if (typeof config.device === "object") {
        configDevice = config.device;
      } else {
        configDevice = {
          ...devices[config.device || "iPhone 12 Pro Max"],
          permissions: ["geolocation"],
          geolocation: { latitude: 21.027764, longitude: 105.83416 },
          colorScheme: "dark",
          locale: "vi-VN",
        };
      }

      const contextMobile = await browser.newContext(configDevice);
      const pageMobile = await contextMobile.newPage();
      await use(pageMobile);
      await contextMobile.close();
    },
    { scope: "test" },
  ],
  scheduler: [
    async ({ conf }, use, testInfo) => {
      const { title } = testInfo;

      const testBranch = process.env.BRANCH || "master";
      const testEnv = process.env.CI_ENV ? process.env.CI_ENV : process.env.ENV;
      const caseCode = extractCodeName(title)[0];

      const testHubManager = new TestHubManager(process.env.TESTHUB_CONN_TYPE as DatabaseType);
      await testHubManager.init();

      // if (process.env.ENV !== "local") {
      // If db = sqlite ~> find test case in db
      // -- if not found ~> insert tmp case
      let testCaseId = await testHubManager.findCaseIdByCode(caseCode);
      if (!testCaseId) {
        if (testHubManager.getDatabaseType() !== "sqlite") {
          throw new Error("Missing test case in database");
        }

        const testCase = await testHubManager.insertCase({
          code: caseCode,
          name: `Local test case for @${caseCode}`,
          need_automation: true,
          is_automated: false,
        });

        testCaseId = testCase.getDataValue("id");
      }
      // }

      const context = {
        setData: async (data: Record<string, unknown>) => {
          const payload: THCaseDataType = {
            case_code: caseCode,
            data: JSON.stringify(data),
            env: testEnv,
            branch: testBranch,
            case_id: testCaseId,
          };

          logger.info(`Scheduler set data payload: ${JSON.stringify(payload)}`);

          // find case data first
          const caseData = await testHubManager.findCaseData(testCaseId, testBranch, testEnv);
          if (caseData) {
            // if exist ~> update
            payload.id = caseData.id;
            const updateResult = await testHubManager.updateCaseData(payload);
            logger.info(`Got result ${JSON.stringify(updateResult)} when update. id: ${payload.id}`);
          } else {
            // if case data not exist ~> insert
            await testHubManager.insertCaseData(payload);
          }
        },
        /* Returns null if not found */
        getData: async () => {
          const caseData = await testHubManager.findCaseData(testCaseId, testBranch, testEnv);
          if (caseData) {
            logger.info(`Found case data w data: ${JSON.stringify(caseData)}`);
            const data = caseData.data;
            return JSON.parse(data);
          }

          logger.info(`Not found case data w case_id (${testCaseId}), branch (${testBranch}), env (${testEnv})`);
          return null;
        },
        // Create th_case_jobs and th_job
        schedule: async ({ minutes, mode }: { minutes: number; mode: CronMode }): Promise<boolean> => {
          process.env.IS_SCHEDULING_JOB = "true";
          const email = conf.suiteConf.email_scheduler;
          if (!email) {
            throw new Error("Missing scheduler email in SuiteConf");
          }

          let slackId = null;
          if (process.env.ENV !== "local") {
            const slackHelper = new SlackHelper();
            const slackUser = await slackHelper.getUserByEmail(email);
            if (!slackUser) {
              throw new Error("Error when get slack user by scheduler email");
            }

            const { id } = slackUser;
            slackId = id;
          }

          // Check if th_job exists
          const existedJob = await testHubManager.findJob(caseCode, testBranch, testEnv);
          if (existedJob) {
            if (mode === "every") {
              const crontab = existedJob.crontab;
              // eslint-disable-next-line no-console
              console.log(`Scheduled job already existed with crontab: ${crontab}, skip scheduling...`);
              return;
            }

            // Update job
            const newCrontab = generateCrontab({ minutes, mode });
            const id = existedJob.id;
            const updateResult = await testHubManager.updateJobCronTab(newCrontab, id);
            logger.info(`Update crontab id (${id}), crontab (${newCrontab}), result (${updateResult})`);
            return;
          }

          // Create th_job
          const insertedJobId = await testHubManager.insertJob({
            name: testHubManager.getJobName(caseCode),
            crontab: generateCrontab({ minutes, mode }),
            enabled: true,
            mode: "multiple-time", // must be multiple-time because autopilot helper only scan multiple-time job
            env: testEnv,
            branch: testBranch,
            created_by_slack_id: slackId,
            created_by_email: email,
          });

          logger.info(`Insert job result with id (${insertedJobId})`);

          if (insertedJobId) {
            // Create th_case_jobs
            if (testCaseId) {
              const insertResult = await testHubManager.insertCaseJobs({
                case_id: testCaseId,
                job_id: insertedJobId,
              });
              logger.info(`Insert casejob success w result (${insertResult})`);
            }
          }
          return;
        },
        clear: async () => {
          const results: boolean[] = [];

          const isDeletedData = await testHubManager.removeCaseData(testCaseId, testBranch, testEnv);
          logger.info(
            `Remove case data id (${testCaseId}), branch (${testBranch}), env (${testEnv}); result: ${isDeletedData}`,
          );
          results.push(isDeletedData);

          let jobId;
          const existedJob = await testHubManager.findJob(caseCode, testBranch, testEnv);
          logger.info(`Clean data: found existedJob: ${JSON.stringify(existedJob)}`);
          if (existedJob) {
            jobId = existedJob.id;
          }

          logger.info(`Clean data: testCaseId: ${testCaseId}, jobId: ${jobId}`);
          if (testCaseId && jobId) {
            const deletedCaseJobs = await testHubManager.removeCaseJobs({
              case_id: testCaseId,
              job_id: jobId,
            });
            results.push(deletedCaseJobs);
            logger.info(`Remove case job result: ${deletedCaseJobs}`);

            const deletedJob = await testHubManager.removeJob(jobId);
            logger.info(`Remove job result: ${deletedJob}`);
            results.push(deletedJob);
          }

          return results.every(result => !!result);
        },
      };

      await use(context);
    },
    { scope: "test" },
  ],
  snapshotFixture: [
    async ({ conf }, use) => {
      // create FixtureVerifyScreenshots
      const snapshotFixture = new SnapshotFixture(process.env.ENV == "local" ? false : true, process.env.ENV);
      const isGenSnapshotsJob = process.env.IS_GEN_SNAPSHOTS_JOB == "true" ? true : false;

      if (isGenSnapshotsJob) {
        snapshotFixture.removeFolderSnapshot(conf.directory, `${conf.fileName}.spec.ts`);
      } else {
        // check and download all snapshots from s3
        try {
          await snapshotFixture.checkDownloadAllSnapshotsFromS3(conf.directory, `${conf.fileName}.spec.ts`);
        } catch (err) {
          throw new Error(`Error when download all snapshots from S3: ${err}`);
        }
      }

      await use(snapshotFixture);

      // Check upload file
      // Only allow Generate snapshots jobs to upload snapshots to S3.
      if (isGenSnapshotsJob) {
        try {
          await snapshotFixture.uploadFolderSnapshotsToS3(conf.directory, `${conf.fileName}.spec.ts`);
        } catch (err) {
          throw new Error(`Error when upload snapshots to S3: ${err}`);
        }
      }
    },
    { scope: "test" },
  ],
  toolFixture: [
    async ({}, use) => {
      const testHubManager = new TestHubManager(process.env.TESTHUB_CONN_TYPE as DatabaseType);
      await testHubManager.init();

      const context = {
        updateAutomated: async () => {
          const envs = ["dev", "prodtest", "prod"];
          for (const env of envs) {
            const updateResult = await testHubManager.updateCaseAutomated(env);
            logger.info(`Update automated for ${env} got result ${updateResult}`);
          }
        },
      };

      await use(context);
    },
    { scope: "test" },
  ],
  authRequestWithExchangeToken: [
    async ({ conf, token: fixtureToken }, use) => {
      const context = {
        changeToken: async () => {
          // Call token fixture ~> gen new token
          // get token
          const config = sanitizeTestConfig(conf);
          const shop = await fixtureToken.get({
            userId: config.user_id,
            shopId: config.shop_id,
            domain: config.shop_name,
            username: config.username,
            password: config.password,
          });

          // Create new context with new Token
          // Assign to APIRequest context obj
          return request.newContext({
            extraHTTPHeaders: {
              [AccessTokenHeaderName]: shop.access_token,
              [UserAgentHeaderName]: DefaultUserAgent,
            },
          });
        },
      };

      await use(context);
    },
    { scope: "test" },
  ],
  multipleStore: [
    async ({ context: browserContext, token }, use) => {
      const page = await browserContext.newPage();

      const context = {
        getDashboardPage: async (
          username: string,
          password: string,
          shopDomain: string,
          shopId: number,
          userId: number,
        ): Promise<Page> => {
          let shop;
          let authed = false;
          try {
            shop = await token.get({
              userId: userId,
              shopId: shopId,
              domain: shopDomain,
              username: username,
              password: password,
            });

            if (shop !== undefined && shop.access_token !== undefined && shop.access_token !== "") {
              await page.route("**/admin/**", (route, request) => {
                const headers = request.headers();
                if (headers["x-shopbase-access-token"] && headers["x-shopbase-access-token"] === "default_token") {
                  Object.assign(headers, { "x-shopbase-access-token": `${shop.access_token}` });
                }

                route.continue({
                  headers: headers,
                });
              });
              await page.goto(`https://${shopDomain}/admin?x_key=${shop.access_token}`);
              await page.waitForSelector(".nav-sidebar");
            }
            authed = true;
          } catch (e) {
            const db = new DashboardPage(page, shopDomain);
            await db.login({
              userId: userId,
              shopId: shopId,
              email: username,
              password: password,
            });

            authed = true;
          }

          if (!authed) {
            throw new Error(`Cannot authenticate to ${shopDomain}`);
          }

          return page;
        },

        getAuthRequest: async (
          username: string,
          password: string,
          shopDomain: string,
          shopId: number,
          userId: number,
        ): Promise<APIRequestContext> => {
          const shop = await token.get({
            userId: userId,
            shopId: shopId,
            domain: shopDomain,
            username: username,
            password: password,
          });
          return request.newContext({
            extraHTTPHeaders: {
              [AccessTokenHeaderName]: shop.access_token,
              [UserAgentHeaderName]: DefaultUserAgent,
            },
          });
        },
      };

      await use(context);
    },
    { scope: "test" },
  ],
});

export { expect, request } from "@playwright/test";
