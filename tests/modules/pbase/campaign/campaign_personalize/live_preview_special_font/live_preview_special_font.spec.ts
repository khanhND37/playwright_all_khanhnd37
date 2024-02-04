import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir } from "@utils/theme";
import type { CampaignSpecialFont, Dev, LivePreviewSpecialFont, SbPrbLp11 } from "./live_preview_special_font";
import { defaultSnapshotOptions } from "@constants/visual_compare";

test.describe("Tạo campaign personalize và check Live preview campaigns với các font đặc biệt", () => {
  let suiteConf: Dev;
  let suiteConfEnv: LivePreviewSpecialFont;
  let printbasePage: PrintBasePage;
  let campaignSpecialFont: CampaignSpecialFont[];
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    suiteConfEnv = conf.suiteConf as LivePreviewSpecialFont;
    suiteConf = conf.suiteConf as Dev;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbasePage = new PrintBasePage(dashboard, suiteConf.domain);
    test.setTimeout(suiteConfEnv.time_out);
  });

  test("create camp @SB_PRB_LP_11", async ({}) => {
    //Tạo campaign
    campaignSpecialFont = suiteConfEnv.campaign_special_font;
    for (let i = 0; i < campaignSpecialFont.length; i++) {
      const campaignInfo = campaignSpecialFont[i];
      // Pre conditions tạo campaign
      await printbasePage.goto(suiteConfEnv.url_catalog);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
      await printbasePage.launchCamp(campaignInfo);
      expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
    }
  });

  test(`[Live Preview CO text field] Check font custom option khác font layer với các font đặc biệt @SB_PRB_LP_11`, async ({
    page,
    cConf,
    snapshotFixture,
  }) => {
    await test.step(`Thực hiện tạo campaign và check live preview với các một số font đặc biệt`, async () => {
      const campaignSF = new SFProduct(page, suiteConf.domain);
      const homePage = new SFHome(page, suiteConf.domain);
      const caseConf = cConf as SbPrbLp11;
      const valueInputSF = caseConf.value_input_sf;
      for (let i = 0; i < valueInputSF.length; i++) {
        const campaignInfoSF = valueInputSF[i];
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(campaignInfoSF.campaign_name);
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await campaignSF.page.hover(campaignSF.xpathNameProduct);
        await snapshotFixture.verifyWithAutoRetry({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(campaignInfoSF.campaign_name)}`,
          snapshotName: `${campaignInfoSF.pictures.picture_mockup}.png`,
          sizeCheck: true,
        });
        for (let i = 0; i < campaignInfoSF.custom_option_info.length; i++) {
          await campaignSF.inputCustomOptionSF(campaignInfoSF.custom_option_info[i], true);
        }
        await campaignSF.clickOnBtnPreviewSF();
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await campaignSF.page.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathPopupLivePreview(),
          snapshotName: `${campaignInfoSF.pictures.picture_preview}-${i + 1}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }

      // clean data test
      await printbasePage.goto("/admin/pod/campaigns");
      for (let i = 0; i < valueInputSF.length; i++) {
        await printbasePage.searchWithKeyword(valueInputSF[i].campaign_name);
        await printbasePage.deleteAllCampaign();
      }
    });
  });
});
