import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";

test.describe("Crop image SF with campaigns CO Image", async () => {
  let printbasePage: PrintBasePage;
  let productInfo;
  let campaignId;
  let productPageSF: SFProduct;

  test.beforeEach(async ({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const campaignSF = conf.caseConf.data[i];
    test(`@${campaignSF.case_id} ${campaignSF.description}`, async ({ dashboard, conf, context, snapshotFixture }) => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      productInfo = campaignSF.product_info;
      const customName = campaignSF.custom_option_info.custom_name;
      const customValue = campaignSF.custom_option_info.value;
      const countZoomIn = campaignSF.count_zoom_in;
      const countZoomOut = campaignSF.count_zoom_out;

      await test.step("Launch camp -> View camp in SF", async () => {
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.addBaseProducts(campaignSF.product_info);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.clickOnBtnWithLabel("Create new campaign");

        if (campaignSF.case_id === "SB_PRB_CI_2") {
          await printbasePage.addNewLayer(campaignSF.layers_add[0]);
        } else {
          await printbasePage.addNewLayers(campaignSF.layers_add);
        }
        if (campaignSF.case_id === "SB_PRB_CI_1") {
          await printbasePage.clickSyncLayer(campaignSF.layer_sync);
        }
        if (campaignSF.case_id === "SB_PRB_CI_2") {
          await dashboard.click(printbasePage.xpathBaseProductOnEditor(productInfo[1].base_product));
          await printbasePage.addNewLayer(campaignSF.layers_add[1]);
        }

        await printbasePage.removeLiveChat();
        await printbasePage.clickBtnExpand();
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOption(campaignSF.custom_options);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.inputFieldWithLabel("", "Campaign name", campaignSF.camp_title, 1);
        campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        await printbasePage.waitUntilElementInvisible(printbasePage.xpathIconLoading);
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
        await printbasePage.openCampaignDetail(campaignSF.camp_title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        productPageSF = new SFProduct(SFPage, conf.suiteConf.domain);
      });

      await test.step("Click bên ngoài button Choose file -> upload file dúng định dạng", async () => {
        await productPageSF.inputCoImageSF(customName, customValue);
        await expect(productPageSF.genLoc(productPageSF.xpathPopoverCrop)).toBeVisible();
      });

      await test.step("Click icon dấu +/-", async () => {
        for (let i = 1; i <= countZoomIn; i++) {
          await productPageSF.clickBtnZoomInOrOut(1);
        }
        await productPageSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: productPageSF.page,
          selector: productPageSF.xpathPopoverCrop,
          snapshotName: campaignSF.picture.name_image_zoom_in,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });

        for (let i = 1; i <= countZoomOut; i++) {
          await productPageSF.clickBtnZoomInOrOut(2);
        }
        await productPageSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: productPageSF.page,
          selector: productPageSF.xpathPopoverCrop,
          snapshotName: campaignSF.picture.name_image_zoom_out,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Click button Crop", async () => {
        await productPageSF.page.locator(productPageSF.xpathBtnCrop).click();
        await productPageSF.waitForElementVisibleThenInvisible(productPageSF.xpathProcessImage);
        await productPageSF.limitTimeWaitAttributeChange(productPageSF.xpathImageActive);
        await productPageSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: productPageSF.page,
          selector: productPageSF.xpathImageActive,
          snapshotName: campaignSF.picture.name_image_crop_success,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Click button Close", async () => {
        await productPageSF.inputCoImageSF(customName, customValue);
        await expect(productPageSF.genLoc(productPageSF.xpathPopoverCrop)).toBeVisible();
        await productPageSF.closePopoverCrop(campaignSF.themes_setting);
        await productPageSF.page.waitForSelector(productPageSF.xpathBoxChooseFile);
        await productPageSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: productPageSF.page,
          selector: productPageSF.xpathBoxChooseFile,
          snapshotName: campaignSF.picture.name_image_choose_file,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("After: Delete all campaign", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      });
    });
  }
});
