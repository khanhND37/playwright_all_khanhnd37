import { expect } from "@core/fixtures";
import { Page } from "@playwright/test";
import { test } from "@fixtures/theme";
import { snapshotDir } from "@utils/theme";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import { ProductAPI } from "@pages/api/product";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import type { Dev } from "./camp_personalize_live_preview";
import { getSnapshotNameWithEnvAndCaseCode } from "@utils/env";

test.describe("Live preview campaigns", () => {
  let printbasePage: PrintBasePage;
  let productAPI: ProductAPI;
  let campaignSF: SFProduct;
  let themeSetting: SettingThemeAPI;
  let urlCatalog: string;
  let suiteConf: Dev;

  const openPageInStorefront = async (title: string, context, printbasePage: PrintBasePage): Promise<Page> => {
    await printbasePage.openCampSFFromCampDetail(title);
    const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
    const urlSFPage = SFPage.url();
    await SFPage.goto(`${urlSFPage}`);
    await SFPage.waitForLoadState("networkidle");
    return SFPage;
  };
  test.beforeEach(async ({ dashboard, conf, authRequest, theme }, testInfo) => {
    suiteConf = conf.suiteConf as Dev;
    urlCatalog = suiteConf.url_catalog;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productAPI = new ProductAPI(suiteConf.domain, authRequest);
    const personalize = JSON.parse(JSON.stringify(suiteConf.personalize));
    await productAPI.setPersonalizationPreview(personalize, String(suiteConf.shop_id));
    themeSetting = new SettingThemeAPI(theme);
    await themeSetting.publishTheme(suiteConf.theme_default);
    printbasePage = new PrintBasePage(dashboard, suiteConf.domain);
    test.setTimeout(suiteConf.time_out);
  });

  // Launch all campaign
  test(`@SB_PRB_LP_389 theme_v3 - Check preview campaign personalize với file psd không live preview được`, async ({
    snapshotFixture,
    context,
    cConf,
  }) => {
    const campaignsInfos = cConf.data_test;
    await test.step("Pre-condition: create campaign", async () => {
      for (let i = 0; i < campaignsInfos.length; i++) {
        await printbasePage.goto(urlCatalog);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
        const campaignId = await printbasePage.launchCamp(campaignsInfos[i]);
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
        expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
      }
    });

    // Move code len
    const stepInfo = cConf.data_test;
    for (let i = 0; i < stepInfo.length; i++) {
      const title = stepInfo[i].pricing_info.title;
      const stepTitle = stepInfo[i].title;
      const customOptionInfo = stepInfo[i].custom_option_info;
      await test.step("Pre-condition: set personalize preview", async () => {
        if (stepInfo[i].personalization_preview) {
          const personalizationPreview = JSON.parse(JSON.stringify(stepInfo[i].personalization_preview));
          await productAPI.setPersonalizationPreview(personalizationPreview, String(suiteConf.shop_id));
        }
      });

      await test.step("verify image storefront", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(title);
        const SFPage = await openPageInStorefront(title, context, printbasePage);
        campaignSF = new SFProduct(SFPage, suiteConf.domain);
        await campaignSF.inputCustomAllOptionSF(customOptionInfo);
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathLivePreviewV3.product.galleryImage);
        await campaignSF.page.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathLivePreviewV3.product.galleryImage,
          snapshotName: getSnapshotNameWithEnvAndCaseCode(`${i}-live-preview.png`, "SB_PRB_LP_389"),
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step(`${stepTitle}`, async () => {
        if (stepInfo[i].button_preview) {
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
          await campaignSF.page.waitForTimeout(1000);

          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: getSnapshotNameWithEnvAndCaseCode(`${i}-_preview.png`, "SB_PRB_LP_389"),
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        } else {
          await expect(campaignSF.page.locator(campaignSF.xpathBtnWithLabel("Preview your design"))).toBeHidden();
        }
        await campaignSF.page.close();

        //delete campaigns at Saturday on every week, to be clean data
        const date = new Date();
        const day = date.getDay();
        if (day === 6) {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.deleteAllCampaign(suiteConf.password);
        }
      });
    }
  });
});
