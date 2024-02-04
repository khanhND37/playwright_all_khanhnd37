import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";

test.describe("Setup nhiều customize group for print base CO", () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, page, snapshotFixture, context }) => {
      test.setTimeout(conf.suiteConf.time_out);
      const productInfo = caseData.product_info;
      const layerList = caseData.layers;
      const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const customOptionInfo = caseData.custom_option_info;
      const pricingInfor = caseData.pricing_info;
      const picture = caseData.picture;
      const threshold = conf.suiteConf.threshold;
      const customOptions = caseData.custom_options;
      const group = caseData.group;
      const customize = caseData.customize_group;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const conditionalLogicInfo = caseData.conditional_logic_info;

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(pricingInfor.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProducts(productInfo);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");

      await test.step("Add layer cho base product", async () => {
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.addNewLayers(layerList);
      });

      await test.step("Tạo custom option cho base product", async () => {
        await printbasePage.clickBtnExpand();
        await printbasePage.clickOnBtnWithLabel("Customize layer", 1);
        await printbasePage.addCustomOptions(customOptions);
      });

      for (let i = 0; i < group.length; i++) {
        await test.step("Tạo group layer > Add layer vào group", async () => {
          const groupData = group[i];
          for (let j = 0; j < groupData.length; j++) {
            if (
              caseData.case_id === "SB_PRB_CG_245" ||
              caseData.case_id === "SB_PRB_CG_246" ||
              caseData.case_id === "SB_PRB_CG_280" ||
              caseData.case_id === "SB_PRB_CG_281" ||
              caseData.case_id === "SB_PRB_CG_282" ||
              caseData.case_id === "SB_PRB_CG_283" ||
              caseData.case_id === "SB_PRB_CG_284" ||
              caseData.case_id === "SB_PRB_CG_285"
            ) {
              await printbasePage.createGroupLayer(
                groupData[j].current_group,
                groupData[j].new_group,
                groupData[j].side,
              );
            } else {
              await printbasePage.createGroupLayer(groupData[j].current_group, groupData[j].new_group);
            }
            await printbasePage.addLayerToGroup(groupData[j].layer_name, groupData[j].new_group);
          }
          await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Customize group", 1))).toBeEnabled();
        });

        await test.step("Tạo customize group", async () => {
          await printbasePage.setupCustomizeGroupForPB(customize[i]);
          await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
        });
      }

      if (
        caseData.case_id === "SB_PRB_CG_280" ||
        caseData.case_id === "SB_PRB_CG_281" ||
        caseData.case_id === "SB_PRB_CG_282" ||
        caseData.case_id === "SB_PRB_CG_283" ||
        caseData.case_id === "SB_PRB_CG_284" ||
        caseData.case_id === "SB_PRB_CG_285"
      ) {
        await test.step("Add conditional logic", async () => {
          for (let i = 0; i < conditionalLogicInfo.length; i++) {
            await printbasePage.clickIconAddConditionLogic(conditionalLogicInfo[i]);
            await printbasePage.addConditionalLogic(conditionalLogicInfo[i]);
            await dashboard.click(printbasePage.xpathIconBack);
          }
        });
      }

      await test.step("Click btn Continue > Input title", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        const campaignId = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputPricingInfo(pricingInfor);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Verify hiển thị customize group", async () => {
        await printbasePage.openCampaignDetail(pricingInfor.title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.viewProductOnSf()]);
        const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await productSF.waitForImagesMockupLoaded();
        for (let i = 0; i < customOptionInfo.length; i++) {
          await productSF.inputCustomOptionSF(customOptionInfo[i]);
        }
        await productSF.clickOnBtnPreviewSF();
        await productSF.page.waitForTimeout(6000);
        await snapshotFixture.verify({
          page: productSF.page,
          selector: productSF.xpathPopupLivePreview(1),
          snapshotName: picture,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        if (
          caseData.case_id === "SB_PRB_CG_245" ||
          caseData.case_id === "SB_PRB_CG_246" ||
          caseData.case_id === "SB_PRB_CG_280" ||
          caseData.case_id === "SB_PRB_CG_281" ||
          caseData.case_id === "SB_PRB_CG_282" ||
          caseData.case_id === "SB_PRB_CG_283" ||
          caseData.case_id === "SB_PRB_CG_284" ||
          caseData.case_id === "SB_PRB_CG_285"
        ) {
          await page.click(printbasePage.xpathBtnNextPagePopupPreview);
          await productSF.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
          await snapshotFixture.verify({
            page: page,
            selector: productSF.xpathPopupLivePreview(2),
            snapshotName: caseData.picture_back,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        }
      });
    });
  }
});
