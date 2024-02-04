/* eslint-disable camelcase */
import { test } from "@fixtures/theme";
import { snapshotDir } from "@utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { expect } from "@core/fixtures";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/api/product";

test.describe("Verify camp nhiều customize group", () => {
  let printbasePage: PrintBasePage;
  let productSF: SFProduct;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    test.setTimeout(conf.suiteConf.timeout);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`@${caseData.case_id} - ${caseData.description}`, async ({ context, snapshotFixture, conf, authRequest }) => {
      const pictures = caseData.pictures;
      const layers = caseData.layers;
      const groups = caseData.groups;
      const addLayersToGroup = caseData.add_layers_to_group;
      const conditionalLogicInfor = caseData.conditional_logic_info;
      productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      const personalize = JSON.parse(JSON.stringify(caseData.personalize));

      await test.step("Tại màn hình editor campaign > Add layer và tạo group cho base product > Add layer vào group", async () => {
        await productAPI.setPersonalizationPreview(personalize, String(conf.suiteConf.shop_id));
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(caseData.pricing_info.title);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.addBaseProducts(caseData.product_info);
        await printbasePage.clickOnBtnWithLabel("Create new campaign");
        await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
        for (let i = 0; i < groups.length; i++) {
          await printbasePage.createGroupLayer(groups[i].current_group, groups[i].new_group);
          for (let j = 0; j < 2 * (i + 1); j++) {
            await printbasePage.addNewLayer(layers[j]);
          }
          await printbasePage.addLayerToGroup(addLayersToGroup[i].layer_name, addLayersToGroup[i].group_name);
        }
        const countGroupLayers = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
        await expect(countGroupLayers).toEqual(groups.length);
      });

      await test.step("Click vào icon Expand > Click vào btn Customize group > Tạo customize group", async () => {
        await printbasePage.clickBtnExpand();
        await printbasePage.removeLiveChat();
        await printbasePage.setupCustomizeGroupForPB(caseData.customize_group);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathCustomizeGroupContainer,
          snapshotName: pictures.customize_group_detail,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await printbasePage.page.click(printbasePage.xpathIconBack);
      });

      await test.step("Click vào btn Customize layer > Tạo các custom option tương ứng và conditional logic", async () => {
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(caseData.custom_options);
        await printbasePage.addListConditionLogic(conditionalLogicInfor);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathListCustomOptionEditor,
          snapshotName: pictures.list_custom_option,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Click vào btn Continue > Input title > Click vào btn Launch > Verify launch campaign thành công", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.inputPricingInfo(caseData.pricing_info);
        const campaignId = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Open campaign detail > Verify hiển thị mockup", async () => {
        const result = await printbasePage.waitDisplayMockupDetailCampaign(caseData.pricing_info.title);
        expect(result).toBeTruthy();
        await printbasePage.closeOnboardingPopup();
        await printbasePage.page.click(printbasePage.xpathTitleOrganization);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathSectionImageInDetail,
          snapshotName: pictures.campaign_detail,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("View campaign ngoài SF > Lần lượt chọn từng Group > Sau đó Input custom option tương ứng > Verify hiển thị ảnh instant preview và live preview", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await productSF.waitUntilElementVisible(productSF.xpathProductMockupSlide);
        const customOptionSF = caseData.custom_options_sf;
        for (let i = 0; i < customOptionSF.length; i++) {
          await productSF.inputCustomAllOptionSF(customOptionSF[i]);
          if (caseData.personalize.mode === "instant") {
            await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoadImage);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: `${productSF.getXpathMainImageOnSF(caseData.pricing_info.title)}`,
              snapshotName: `${caseData.case_id}-${pictures.image_instant_preview}-${i + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          } else if (caseData.personalize.mode === "button") {
            await productSF.clickOnBtnPreviewSF();
            await productSF.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: printbasePage.xpathPopupLivePreview(),
              snapshotName: `${caseData.case_id}-${pictures.image_preview}-${i + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await productSF.page.click(productSF.xpathClosePreview);
          } else {
            await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoadImage);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: `${productSF.getXpathMainImageOnSF(caseData.pricing_info.title)}`,
              snapshotName: `${caseData.case_id}-${pictures.image_instant_preview}-${i + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await productSF.clickOnBtnPreviewSF();
            await productSF.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: printbasePage.xpathPopupLivePreview(),
              snapshotName: `${caseData.case_id}-${pictures.image_preview}-${i + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await productSF.page.click(productSF.xpathClosePreview);
          }
        }
      });
    });
  }
});
