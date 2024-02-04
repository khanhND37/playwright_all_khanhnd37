import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";
import { snapshotDir } from "@utils/theme";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Setup nhiều customize group for print base no CO", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture, context }) => {
      test.setTimeout(conf.suiteConf.time_out);
      const productInfo = caseData.product_info;
      const layerList = caseData.layers;
      const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const personalize = new Personalize(dashboard, conf.suiteConf.domain);
      const customOptionInfo = caseData.custom_option_info;
      const pricingInfor = caseData.pricing_info;
      const picture = caseData.picture;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const group = caseData.group;
      const customize = caseData.customize_group;
      const removeGroup = caseData.remove_group;
      const listGroup = caseData.list_group;

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(pricingInfor.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      for (let i = 0; i < productInfo.length; i++) {
        await printbasePage.addBaseProduct(productInfo[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Create new campaign");

      await test.step("Add layer cho base product", async () => {
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        for (let i = 0; i < layerList.length; i++) {
          await printbasePage.addNewLayer(layerList[i]);
        }
        await printbasePage.clickBtnExpand();
        await printbasePage.removeLiveChat();
      });

      for (let i = 0; i < group.length; i++) {
        await test.step("Tạo group layer > Add layer vào group", async () => {
          const groupData = group[i];
          for (let j = 0; j < groupData.length; j++) {
            await printbasePage.createGroupLayer(groupData[j].current_group, groupData[j].new_group);
            await printbasePage.addLayerToGroup(groupData[j].layer_name, groupData[j].new_group);
          }
          await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Customize group", 1))).toBeEnabled();
        });

        if (caseData.case_id === "SB_PRB_DCGP_12" && i === 1) {
          await dashboard.click(printbasePage.xpathCustomOptionName(customize[0].label_group));
          await dashboard.click(personalize.xpathAddOptionGroup);
          await printbasePage.clickOnBtnWithLabel("Save", 1);
          const groups = listGroup.split(",").map(item => item.trim());
          for (let i = 0; i < groups.length; i++) {
            await expect(
              personalize.page.locator(personalize.getXpathGroupInCustomizeGroupDetail(groups[i])),
            ).toBeVisible();
          }
        } else {
          await test.step("Tạo customize group", async () => {
            await printbasePage.setupCustomizeGroupForPB(customize[i]);
            await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
          });
          if (caseData.case_id === "SB_PRB_DCGP_13") {
            await dashboard.click(printbasePage.xpathCustomOptionName(customize[i].label_group));
            await printbasePage.removeGroup(removeGroup);
            await printbasePage.clickOnBtnWithLabel("Save", 1);
            const groups = listGroup.split(",").map(item => item.trim());
            for (let i = 0; i < groups.length; i++) {
              await expect(
                personalize.page.locator(personalize.getXpathGroupInCustomizeGroupDetail(groups[i])),
              ).toBeVisible();
            }
          }
        }
      }

      await test.step("Click btn Continue > Input title Campaign no CO customize group droplist", async () => {
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
        if (caseData.case_id === "SB_PRB_DCGP_12" || caseData.case_id === "SB_PRB_DCGP_13") {
          //đợi load ảnh preview
          await productSF.page.waitForTimeout(10000);
          const listGroups = listGroup.split(",").map(item => item.trim());
          for (let i = 0; i < listGroups.length; i++) {
            await expect(productSF.page.locator(productSF.getValueRadioOnSF(listGroups[i]))).toBeVisible();
          }
        } else {
          for (let i = 0; i < customOptionInfo.length; i++) {
            await productSF.inputCustomOptionSF(customOptionInfo[i]);
          }
          await productSF.clickOnBtnPreviewSF();
          await productSF.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
          await productSF.page.waitForTimeout(5000);
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
        }
      });
    });
  }
});
