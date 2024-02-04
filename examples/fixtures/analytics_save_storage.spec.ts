import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { AnalyticsPage } from "@pages/dashboard/analytics";

let localStorage;

/**
 * Code name: `SB_SUITE_SHARE_STATE_01`
 * Description: Test suite này demo case share states giữa các tests với nhau.
 * Mặc định, mỗi test sẽ có các biến môi trường, state (local state, cookie khác nhau).
 * Do đó, để các test share được states thì cần lưu state lại vào đâu đó (file hoặc biến môi trường).
 * Trong suite này ta sẽ lưu browser state vào biến `localStorage`.
 * Test cases:
      - Before All
        - Login to the dashboard of the store mailchimp-sb.onshopbase.com
        - Browser stores cookie and local storage internally

      - Test case `SB_SUITE_SHARE_STATE_01`:
      - Before/Setup
        - read config
        - open browser with cookies, local storage
      - Steps
        - Prepare browser go get page object
        - Go to live view page mailchimp-sb.onshopbase.com/admin/live-view
        - Wait for the page to load
        - Verify if the item Visitors right now shows up
      - After/Teardown
        - close browser

      - Test case `SB_TC_SHARE_STATE_01`:
      - Before/Setup
        - read config
        - open browser with cookies, local storage
      - Steps
        - Prepare browser go get page object
        - Go to analytics page mailchimp-sb.onshopbase.com/admin/analytics
        - Wait for the page to load
        - Verify if the item Visitors right now shows up
      - After/Teardown
        - close browser

* External links: https://docs.ocg.to/books/qa-training/page/3-ocg-autopilot-examples/11043#bkmrk-share-states
*/
test.describe("Share state between tests @DB_ANAL @TS_SB_SHARE_STATE_01", async () => {
  test.beforeAll(async ({ browser, conf }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    const accountPage = new DashboardPage(p, conf.suiteConf.domain);
    await accountPage.login({
      email: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    await expect(p.locator("(//span[normalize-space()='Home'])[1]")).toBeVisible();
    // save local storage to a variable or file
    localStorage = await context.storageState();
    await p.close();
  });

  test("visit live view @daily @TC_SB_SHARE_STATE_01", async ({ browser, conf }) => {
    let page;
    await test.step("prepare browser", async () => {
      const ctx = await browser.newContext({ storageState: localStorage });
      page = await ctx.newPage();
    });
    await test.step("go to live view", async () => {
      const analytics = new AnalyticsPage(page, conf.suiteConf.domain);
      await analytics.gotoLiveview();
    });
    await test.step("verify if the item is visible", async () => {
      await expect(page.locator("(//p[normalize-space()='Visitors right now'])[1]")).toBeVisible();
    });
    await page.close();
  });

  test("visit analytics page @TC_SB_SHARE_STATE_02", async ({ browser, conf }) => {
    let page;
    await test.step("prepare browser", async () => {
      const ctx = await browser.newContext({ storageState: localStorage });
      page = await ctx.newPage();
    });
    await test.step("go to analytics page", async () => {
      const analytics = new AnalyticsPage(page, conf.suiteConf.domain);
      await analytics.gotoAnalytics();
    });
    await test.step("verify if the item is visible", async () => {
      await expect(page.locator("(//h4[normalize-space()='Total sales'])[1]")).toBeVisible();
    });
    await page.close();
  });
});
