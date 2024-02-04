import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();
test.describe("Create thành công campaign", () => {
  let printbasePage: PrintBasePage;

  test.beforeEach(({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
  });

  test("@SB_PRB_LCP_SMT_01 Create thành công campaign", async ({ conf }) => {
    const campaignInfo = conf.caseConf.camp_infos;
    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignInfo.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
    });

    await test.step("Create camp success", async () => {
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
      const campaignId = await printbasePage.launchCamp(campaignInfo);
      logger.info(`Campaign ID: ${campaignId}`);
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
      expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
    });
  });
});
