import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFHome } from "@sf_pages/homepage";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";
import { snapshotDir } from "@utils/theme";
import { Apps } from "@pages/dashboard/apps";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Setup nhiều customize group for print base no CO", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, page, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const productInfo = caseData.product_info;
      const layerList = caseData.layers;
      const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const personalize = new Personalize(dashboard, conf.suiteConf.domain);
      const appPage = new Apps(dashboard, conf.suiteConf.domain);
      const productSF = new SFProduct(page, conf.suiteConf.domain);
      const customOptionInfo = caseData.custom_option_info;
      const pricingInfor = caseData.pricing_info;
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const picture = caseData.picture;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const group = caseData.group;
      const customize = caseData.customize_group;
      const removeGroup = caseData.remove_group;

      await test.step("Pre-condition: Vào catalog > Add base product", async () => {
        await printbasePage.navigateToMenu("Apps");
        await appPage.openApp("Print Hub");
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(pricingInfor.title);
        await printbasePage.deleteAllCampaign(pricingInfor.title);
        await printbasePage.navigateToMenu("Catalog");
        for (let i = 0; i < productInfo.length; i++) {
          await printbasePage.addBaseProduct(productInfo[i]);
        }
        await printbasePage.clickOnBtnWithLabel("Create new campaign");
      });

      await test.step("1. Add layer cho base product", async () => {
        await printbasePage.removeLiveChat();
        for (let i = 0; i < layerList.length; i++) {
          await printbasePage.addNewLayer(layerList[i]);
        }
        await printbasePage.clickBtnExpand();
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

        if (caseData.case_id === "SB_PRH_CGPH_38" && i === 1) {
          await dashboard.click(personalize.xpathCustomOptionName(customize[0].label_group));
          await dashboard.click(personalize.xpathAddOptionGroup);
          await printbasePage.clickOnBtnWithLabel("Save", 1);
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalize.xpathCustomizeGroupDetail,
            snapshotName: picture.picture_dashboard,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        } else {
          await test.step("Tạo customize group", async () => {
            await printbasePage.setupCustomizeGroupForPB(customize[i]);
            await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
          });
          if (caseData.case_id === "SB_PRH_CGPH_39") {
            await dashboard.click(printbasePage.xpathCustomOptionName(customize[i].label_group));
            await printbasePage.removeGroup(removeGroup);
            await printbasePage.clickOnBtnWithLabel("Save", 1);
            await snapshotFixture.verify({
              page: dashboard,
              selector: personalize.xpathCustomizeGroupDetail,
              snapshotName: picture.picture_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
          }
        }
      }

      await test.step("Click btn Continue > Input title Campaign no CO customize group droplist", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.inputPricingInfo(pricingInfor);
        const campaignId = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Verify hiển thị customize group", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfor.title);
        if (caseData.case_id === "SB_PRH_CGPH_38" || caseData.case_id === "SB_PRH_CGPH_39") {
          await productSF.waitForImagesMockupLoaded();
          await snapshotFixture.verify({
            page: page,
            selector: personalize.xpathRadioSF,
            snapshotName: picture.picture_sf,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        } else {
          for (let i = 0; i < customOptionInfo.length; i++) {
            await productSF.inputCustomOptionSF(customOptionInfo[i]);
          }
          await productSF.clickOnBtnPreviewSF();
          await productSF.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
          await snapshotFixture.verify({
            page: page,
            selector: printbasePage.xpathPopupLivePreview(1),
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
