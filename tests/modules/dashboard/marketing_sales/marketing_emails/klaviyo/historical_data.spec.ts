import { expect, test } from "@core/fixtures";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";

test.describe(`Verify section Sync historical data `, async () => {
  test(`@SB_MAR_SALES_ME_KLV_IMP_TRK_20`, async ({ dashboard, conf, request }) => {
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Verify UI for section Sync historical data`, async () => {
      await expect(
        dashboard.locator("//div[contains(@class, 'section')]//h4[contains(text(), 'Sync historical data')]"),
      ).toBeVisible();
      await expect(
        dashboard.locator(`//div[contains(@class, 'section')]//p[contains(text(), '${conf.suiteConf.text}')]`),
      ).toBeVisible();
      await expect(
        dashboard.locator("//div[contains(@class, 'section')]//button[contains(text(), 'Sync data')]"),
      ).toBeEnabled();
    });

    await test.step("Verify historical data sync successfully when clicking Sync data button", async () => {
      await mktnSales.clickSyncDataKlaviyo();
      await expect(mktnSales.syncHistoricalDataKlaviyo(conf.suiteConf.shop_id, request));
    });
  });
});
