import { expect, test } from "@core/fixtures";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";

test.describe(`Verify UI channel Klaviyo on admin dashboard`, async () => {
  test(`Verify UI channel Klaviyo in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_2`, async ({ dashboard, conf }) => {
    /**
     * @Step
     */
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Verify UI Klaviyo dashboard`, async () => {
      // Verify Title = Klaviyo
      await expect(dashboard.locator(`//h3[normalize-space()='${conf.caseConf.title}']`)).toBeVisible();
      // Verify subtitle in Klaviyo channel
      await expect(dashboard.locator(`//p[contains(text(),'${conf.caseConf.subtitle}')]`)).toBeVisible();
      // Verify header Klaviyo Tracking
      await expect(dashboard.locator(`//*[normalize-space()='${conf.caseConf.header}']`)).toBeVisible();
      // Verify Klaviyo Tracking description
      await expect(dashboard.locator(`//p[contains(text(),"${conf.caseConf.description}")]`)).toBeVisible();
      // Verify label Public API Key
      await expect(dashboard.locator(`//p[contains(text(),'Public API Key')]`)).toBeVisible();
      // Verify input field Public API Key
      const xpathPublicApiKey = `//input[contains(@placeholder, 'Enter your Klaviyo public API key')]`;
      await expect(dashboard.locator(xpathPublicApiKey)).toBeVisible();
      // Verify label Private API Key
      await expect(dashboard.locator(`//p[contains(text(),'Private API Key')]`)).toBeVisible();
      // Verify input field Private API Key
      const xpathPrivateApiKey = `//input[contains(@placeholder, 'Enter your Klaviyo private API key')]`;
      await expect(dashboard.locator(xpathPrivateApiKey)).toBeVisible();
      // Verify header Klaviyo Tutorials
      await expect(dashboard.locator(`//*[normalize-space()='${conf.caseConf.header2}']`)).toBeVisible();
      // Verify Klaviyo Tutorials description
      await expect(dashboard.locator(`//p[contains(text(),"${conf.caseConf.description2}")]`)).toBeVisible();
    });
  });

  test(`Verify Primary API Key is optional @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_3`, async ({ dashboard, conf }) => {
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
    /**
     * @Step
     */
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Change Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, `TEST`);
    });
    await test.step(`Delete Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, ``);
    });
  });

  test(`Verify cannot save Primary API Key in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_4`, async ({ dashboard, conf }) => {
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
    /**
     * @Step
     */
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, ``);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Click Save changes button and verify that save public and private API keys failed`, async () => {
      await mktnSales.clickSaveChangesButton();
      await expect(dashboard.locator(`//div[contains(text(),'Fail')]`)).toBeVisible();
    });
  });

  test(`Verify can be saved Primary API Key in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_5`, async ({ dashboard, conf }) => {
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
    /**
     * @Step
     */
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Click Save changes button and verify that save public and private API keys failed`, async () => {
      await mktnSales.clickSaveChangesButton();
      await expect(dashboard.locator(`//div[contains(text(),'Success')]`)).toBeVisible();
    });
  });

  test(`Verify tracking_account in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_6`, async ({ dashboard, conf, request }) => {
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
    /**
     * @Step
     */
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Click Save changes button and verify that save public and private API keys failed`, async () => {
      await mktnSales.clickSaveChangesButton();
      await expect(dashboard.locator(`//div[contains(text(),'Success')]`)).toBeVisible();
    });
    await test.step(`Verify Klaviyo api key in tracking_account parameter`, async () => {
      await mktnSales.isTrackingAccountConfigured(conf.suiteConf.public_api_key, ``, request);
    });
  });
});
