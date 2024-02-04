import { expect } from "@core/fixtures";
import { Page } from "@playwright/test";
import { test } from "@fixtures/theme";
import { snapshotDir } from "@utils/theme";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import { ProductAPI } from "@pages/api/product";
import { loadData } from "@core/conf/conf";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import type { Dev, Datum, CustomOptionInfo } from "./camp_personalize_live_preview";

test.describe("Live preview campaigns", () => {
  const caseName = "CAMP_PERSONALIZE";
  const suitConfLoad = loadData(__dirname, caseName);
  let printbasePage: PrintBasePage;
  let productAPI: ProductAPI;
  let campaignSF: SFProduct;
  let themeSetting: SettingThemeAPI;
  let urlCatalog: string;
  let suiteConf: Dev;
  let imagesOption: CustomOptionInfo;
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

  suitConfLoad.caseConf.data.forEach((testCase: Datum) => {
    test(`${testCase.title} @${testCase.case_id}`, async ({ context, conf, authRequest, snapshotFixture }) => {
      const stepInfo = testCase.data_test;
      const themesSetting = testCase.themes_setting_id;

      await test.step(`Create camp preview ${testCase.case_id}`, async () => {
        const campaignsInfos = testCase.data_test;
        for (let i = 0; i < campaignsInfos.length; i++) {
          await printbasePage.goto(urlCatalog);
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
          await printbasePage.launchCamp(campaignsInfos[i]);
          expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
          await printbasePage.getStatusOfFirstCampaign(authRequest, conf.suiteConf.domain);
        }
      });

      for (let i = 0; i < stepInfo.length; i++) {
        const title = stepInfo[i].pricing_info.title;
        const stepTitle = stepInfo[i].title;
        const customOptionInfo = stepInfo[i].custom_option_info;
        if (stepInfo[i].personalization_preview) {
          const personalizationPreview = JSON.parse(JSON.stringify(stepInfo[i].personalization_preview));
          await productAPI.setPersonalizationPreview(personalizationPreview, String(suiteConf.shop_id));
        }

        await test.step("verify image storefront", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(title);
          const SFPage = await openPageInStorefront(title, context, printbasePage);
          campaignSF = new SFProduct(SFPage, suiteConf.domain);
          await campaignSF.inputCustomAllOptionSF(customOptionInfo);
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await campaignSF.page.waitForTimeout(1000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathImageActive,
            snapshotName: `${testCase.case_id}_${i}_live_preview.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        switch (testCase.case_id) {
          case "SB_PRB_LP_37":
            await test.step("Click bên ngoài button Choose file -> upload file dúng định dạng", async () => {
              imagesOption = stepInfo[i].custom_option_info.find(image => {
                return image.type === "Image";
              });
              await campaignSF.inputCoImageSF(imagesOption.custom_name, imagesOption.value);
              await expect(campaignSF.genLoc(campaignSF.xpathPopoverCrop)).toBeVisible();
            });

            await test.step("Click icon dấu +/-", async () => {
              for (let j = 1; j <= stepInfo[i].count_zoom_in; j++) {
                await campaignSF.page.click(campaignSF.xpathZoomIn);
              }
              await campaignSF.page.waitForTimeout(1000);

              await snapshotFixture.verify({
                page: campaignSF.page,
                selector: campaignSF.xpathPopoverCrop,
                snapshotName: `${testCase.case_id}_view_image_zoom.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                  threshold: defaultSnapshotOptions.threshold,
                  maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
                },
              });
            });

            await test.step("Click button Crop", async () => {
              await campaignSF.page.locator(campaignSF.xpathBtnCrop).click();
              await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathProcessImage);
              await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
              await campaignSF.page.waitForTimeout(1000);

              await snapshotFixture.verify({
                page: campaignSF.page,
                selector: campaignSF.xpathImageActive,
                snapshotName: `${testCase.case_id}_view_image_crop.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                  threshold: defaultSnapshotOptions.threshold,
                  maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
                },
              });
            });

            await test.step("Click button Close", async () => {
              await campaignSF.inputCoImageSF(imagesOption.custom_name, imagesOption.value);
              await campaignSF.clickOnBtnWithLabel("Close");
              await campaignSF.page.waitForSelector(campaignSF.xpathBoxChooseFile);
              await snapshotFixture.verify({
                page: campaignSF.page,
                selector: campaignSF.xpathBoxChooseFile,
                snapshotName: `${testCase.case_id}_ui_choose_file.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                  threshold: defaultSnapshotOptions.threshold,
                  maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
                },
              });
            });
            break;
          case "SB_PRB_LP_38":
            for (let j = 0; j <= themesSetting.length; j++) {
              await test.step("Click vào ảnh instant preview", async () => {
                await campaignSF.page.waitForTimeout(1000);
                await campaignSF.page.locator(campaignSF.xpathImageActive).click();
                await campaignSF.page.waitForSelector(campaignSF.xpathBtnCloseImageThumbnail);
                await campaignSF.page.waitForTimeout(1000);
                const indexImage = await campaignSF.page.locator(campaignSF.xpathImageThumbnail).count();
                await snapshotFixture.verify({
                  page: campaignSF.page,
                  selector: `${campaignSF.xpathImageThumbnail}[${indexImage}]`,
                  snapshotName: `SB_PRB_LP_38_${i}_${j}_instant_preview_zoom.png`,
                  snapshotOptions: {
                    maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                    threshold: defaultSnapshotOptions.threshold,
                    maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
                  },
                });
                await campaignSF.page.locator(campaignSF.xpathBtnCloseImageThumbnail).click();
              });

              await test.step("Click vào btn Preview your design", async () => {
                await campaignSF.clickOnBtnPreviewSF();
                await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
                await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
                await campaignSF.page.waitForTimeout(1000);

                await snapshotFixture.verify({
                  page: campaignSF.page,
                  selector: campaignSF.xpathPopupLivePreview(),
                  snapshotName: `SB_PRB_LP_38_${i}_${j}_preview_design.png`,
                  snapshotOptions: {
                    maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                    threshold: defaultSnapshotOptions.threshold,
                    maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
                  },
                });
              });
              if (j < themesSetting.length) {
                await campaignSF.closePopoverCrop(suiteConf.theme_default.toString());
                await themeSetting.publishTheme(themesSetting[j]);
                await campaignSF.page.reload();
                await campaignSF.inputCustomAllOptionSF(customOptionInfo);
                await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
              }
            }
            break;
          default:
            await test.step(`${stepTitle}`, async () => {
              if (stepInfo[i].button_preview) {
                await campaignSF.clickOnBtnPreviewSF();
                await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
                await campaignSF.page.waitForTimeout(1000);

                await snapshotFixture.verify({
                  page: campaignSF.page,
                  selector: campaignSF.xpathPopupLivePreview(),
                  snapshotName: `${testCase.case_id}_${i}_preview.png`,
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
            });
        }
      }
      //delete after verify, to clean data
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.deleteAllCampaign(suiteConf.password);
    });
  });
});
