import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { CampaignInfo } from "../campaign_personalize/campaign_personalize_editor/campaign_personalize_editor";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { SFCheckout } from "@sf_pages/checkout";
import { removeCurrencySymbol } from "@utils/string";
import { OrdersPage } from "@pages/dashboard/orders";

test.describe("Verify edit campaign setting", () => {
  let printbasePage: PrintBasePage;
  let campaignSF;
  let campaignId: number;
  let campaignsInfos: CampaignInfo;
  let snapshotName;
  let newCampaignId: number;
  let checkoutSF: SFCheckout;
  let orderId;
  let orderPage: OrdersPage;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
  });

  test("Verify edit campaign setting thành công with more action @PB_PRB_Up_80", async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    campaignsInfos = conf.caseConf.campaign_info;
    const customOptionEdit = conf.caseConf.custom_options_edit;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step("Precondition: Create again campaign", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.page.waitForLoadState("networkidle", { timeout: 90000 });
      if (await printbasePage.page.locator("//div[contains(@class, 'loading-table')]").isVisible()) {
        await printbasePage.page.waitForSelector("//div[contains(@class, 'loading-table')]", {
          state: "hidden",
          timeout: 90000,
        });
      }
      campaignId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 16 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Search campaign > mở campaign detail >Click button Edit personalization > Verify display default screen editor", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await expect(dashboard.locator(printbasePage.xpathBtnPreview)).toBeVisible();
    });

    await test.step("Delete base Product > Add more base > Add thêm layer", async () => {
      const baseEdit = conf.caseConf.product_base_edit;
      await printbasePage.deleteBaseProduct(baseEdit.product_delete);
      await printbasePage.addOrRemoveProduct(baseEdit.category, baseEdit.product_add);
      const layerDelete = conf.caseConf.layer_delete;
      await printbasePage.deleteLayerOnEditor(layerDelete);
      await printbasePage.addNewLayers(conf.caseConf.layers);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: snapshotName.verify_editor_after_edit,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Edit custom option> click button save change> Click button Continue > Verify status of campaign", async () => {
      await printbasePage.editCustomOption(customOptionEdit);
      newCampaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await expect(dashboard.locator(printbasePage.xpathBtnWithLabel("Editing..."))).toBeDisabled();
    });

    await test.step("Click Campaign list > Verify status of campaign", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 16 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Click button view campaign ngoài SF > Verify thông tin của custom option", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.page.waitForSelector(printbasePage.xpathProductPropertyOnSF);

      await snapshotFixture.verify({
        page: SFPage,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: snapshotName.verify_options_on_sf,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Verify mockup của campaign on SF", async () => {
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(campaignsInfos.pricing_info.title)}`,
          snapshotName: `$image-mockup-sf-${i + 1}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });
  });

  test("Verify edit thành công campaign thường khi add/remove base product @SB_PRB_PPB_194", async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    campaignsInfos = conf.caseConf.campaign_info;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step(`Pre-condition: Thực hiện tạo campaign data test: Vào Catalog > Click chọn base > Click btn "Create new campaign"> Add layer > Click Continue > Input Title >Launch campaign thành công`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      const campainId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campainId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Click campaign name vừa mới tạo thành công > Click button Edit campaign > Hover and click button + > Select base product > Click btn Update", async () => {
      await printbasePage.openEditorCampaign(campaignsInfos.pricing_info.title);
      await printbasePage.page.click(printbasePage.xpathBtnAddBaseProduct);
      await printbasePage.addBaseProducts(conf.caseConf.add_base_product);
      await printbasePage.clickOnBtnWithLabel("Update campaign");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: printbasePage.page,
        snapshotName: snapshotName.snapshot_editor_add_base,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Hover vào base product > Click button X trên image base", async () => {
      await printbasePage.page.hover(printbasePage.xpathBaseProductOnEditor(conf.caseConf.remove_base_product));
      await printbasePage.page.click(printbasePage.xpathIconRemoveBase(conf.caseConf.remove_base_product));
      await printbasePage.clickOnBtnWithLabel("Delete");
      await snapshotFixture.verify({
        page: printbasePage.page,
        snapshotName: snapshotName.snapshot_editor_remove_base,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click btn Save change > Click btn Continue > Verify edit campaign thành công", async () => {
      await printbasePage.clickOnBtnWithLabel("Save change");
      newCampaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 16 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify campaign detail", async () => {
      const result = await printbasePage.waitDisplayMockupDetailCampaign(campaignsInfos.pricing_info.title);
      expect(result).toBeTruthy();
      await dashboard.click(printbasePage.xpathTitleOrganization);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathSectionImageInDetail,
        snapshotName: snapshotName.snapshot_list_image,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click button View > Verify Campaign on SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i <= countImageMockup; i++) {
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(campaignsInfos.pricing_info.title)}`,
          snapshotName: `${snapshotName.mockup_sf}-${i + 1}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
      }
    });
  });

  test("Verify edit thành công campaign thường khi add/edit/delete layer @SB_PRB_PPB_195", async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    campaignsInfos = conf.caseConf.campaign_info;
    snapshotName = conf.caseConf.snapshot_name;
    const addLayer = conf.caseConf.add_layer;
    const addGroupLayer = conf.caseConf.add_group_layer;
    const addLayerToGroup = conf.caseConf.add_layer_to_group;

    await test.step(`Pre-condition: Thực hiện tạo campaign data test: Vào Catalog > Click chọn base > Click btn "Create new campaign"> Add layer > Click Continue > Input Title >Launch campaign thành công`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      const campainId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campainId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Click campaign name vừa mới tạo thành công > Click button Edit campaign > Delete group 2", async () => {
      await printbasePage.openEditorCampaign(campaignsInfos.pricing_info.title);
      await printbasePage.clickActionsGroup(campaignsInfos.layers_group_infos[1].group_name, "Delete");
      await printbasePage.removeLiveChat();
      await snapshotFixture.verify({
        page: printbasePage.page,
        snapshotName: snapshotName.snapshot_editor_delete_group,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Add thêm layer, Add thêm Group 3", async () => {
      await printbasePage.addNewLayers(addLayer);
      await printbasePage.createGroupLayers(addGroupLayer);
      await printbasePage.addLayersToGroup(addLayerToGroup);
      await snapshotFixture.verify({
        page: printbasePage.page,
        snapshotName: snapshotName.snapshot_editor_add_group,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Verify checkbox [Use the Custom Art Service for this campaign] on Custom option", async () => {
      await printbasePage.clickBtnExpand();
      await expect(await printbasePage.page.locator(printbasePage.xpathCheckboxCustomArtInput)).toBeDisabled();
    });

    await test.step("Click btn Save change > Click btn Continue > Verify edit campaign thành công", async () => {
      await printbasePage.clickOnBtnWithLabel("Save change");
      newCampaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 16 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify campaign detail", async () => {
      const result = await printbasePage.waitDisplayMockupDetailCampaign(campaignsInfos.pricing_info.title);
      expect(result).toBeTruthy();
      await dashboard.click(printbasePage.xpathTitleOrganization);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathSectionImageInDetail,
        snapshotName: snapshotName.snapshot_list_image,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click button View > Verify Campaign on SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i <= countImageMockup; i++) {
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(campaignsInfos.pricing_info.title)}`,
          snapshotName: `${snapshotName.mockup_sf}-${i + 1}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
      }
    });
  });

  test("Verify edit thành công campaign khi add/edit/delete CO @SB_PRB_PPB_196", async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    campaignsInfos = conf.caseConf.campaign_info;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step(`Pre-condition: Thực hiện tạo campaign data test: Vào Catalog > Click chọn base > Click btn "Create new campaign"> Add layer > Click Continue > Input Title >Launch campaign thành công`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      const campainId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campainId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Click campaign name vừa mới tạo thành công > Click button Edit campaign > Xóa custom option Text field", async () => {
      await printbasePage.openEditorCampaign(campaignsInfos.pricing_info.title);
      await printbasePage.clickBtnExpand();
      await printbasePage.deleteCustomOptionInList(campaignsInfos.custom_options[0].label);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathCustomOption,
        snapshotName: snapshotName.snapshot_editor_delete_co,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Add thêm custom option", async () => {
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.add_custom_options);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathCustomOption,
        snapshotName: snapshotName.snapshot_editor_add_co,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click btn Save change > Click btn Continue > Verify edit campaign thành công", async () => {
      await printbasePage.clickOnBtnWithLabel("Save change");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      newCampaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 16 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify campaign detail", async () => {
      const result = await printbasePage.waitDisplayMockupDetailCampaign(campaignsInfos.pricing_info.title);
      expect(result).toBeTruthy();
      await dashboard.click(printbasePage.xpathTitleOrganization);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathSectionImageInDetail,
        snapshotName: snapshotName.snapshot_list_image,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click button View > Verify Campaign on SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(SFPage, conf.suiteConf.domain);
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      await campaignSF.inputCustomAllOptionSF(conf.caseConf.custom_option_info);
      await campaignSF.clickOnBtnWithLabel("Preview your design");
      await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: campaignSF.xpathPopupLivePreview(1),
        snapshotName: snapshotName.snapshot_preview,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("View campaign ngoài SF > Order campaign > Check profit", async () => {
      await campaignSF.page.click(campaignSF.xpathClosePreview);
      await campaignSF.selectVariant(conf.caseConf.variant_name);
      await checkoutSF.checkoutProductWithUsellNoVerify(conf.suiteConf.customer_info, conf.suiteConf.card_info);
      orderId = await checkoutSF.getOrderIdBySDK();
      await printbasePage.goToOrderDetails(orderId, "printbase");
      //verify profit
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();
      const actProfit = Number(removeCurrencySymbol(await orderPage.getProfit())).toFixed(2);
      expect(actProfit).toEqual(conf.caseConf.profit);
    });
  });

  test("Verify fulfilment order với campaign Duplicate và được edit campaign @SB_PRB_PPB_201", async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    campaignsInfos = conf.caseConf.campaign_info;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step(`Pre-condition: Thực hiện tạo campaign data test: Vào Catalog > Click chọn base > Click btn "Create new campaign"> Add layer > Click Continue > Input Title >Launch campaign thành công`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      const campainId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campainId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Duplicate campaign vừa tạo", async () => {
      await printbasePage.duplicateCampaign(campaignsInfos.pricing_info.title, true);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      const campaignID = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_infor);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignID, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Click campaign name vừa mới tạo thành công > Click button Edit campaign > Xóa custom option Text field", async () => {
      await printbasePage.openEditorCampaign(conf.caseConf.pricing_infor.title);
      await printbasePage.clickBtnExpand();
      await printbasePage.deleteCustomOptionInList(campaignsInfos.custom_options[0].label);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathCustomOption,
        snapshotName: snapshotName.snapshot_editor_delete_co,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Add thêm custom option", async () => {
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.add_custom_options);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathCustomOption,
        snapshotName: snapshotName.snapshot_editor_add_co,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click btn Save change > Click btn Continue > Verify edit campaign thành công", async () => {
      await printbasePage.clickOnBtnWithLabel("Save change");
      newCampaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("View campaign ngoài SF > Order campaign > Check profit", async () => {
      const result = await printbasePage.waitDisplayMockupDetailCampaign(conf.caseConf.pricing_infor.title);
      expect(result).toBeTruthy();
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      await campaignSF.inputCustomAllOptionSF(conf.caseConf.custom_option_info);
      await campaignSF.selectVariant(conf.caseConf.variant_name);
      checkoutSF = new SFCheckout(SFPage, conf.suiteConf.domain);
      await checkoutSF.checkoutProductWithUsellNoVerify(conf.suiteConf.customer_info, conf.suiteConf.card_info);
      orderId = await checkoutSF.getOrderIdBySDK();
      await printbasePage.goToOrderDetails(orderId, "printbase");
      //verify profit
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();
      const actProfit = Number(removeCurrencySymbol(await orderPage.getProfit())).toFixed(2);
      expect(actProfit).toEqual(conf.caseConf.profit);
    });
  });

  test("Verify auto trim artwork khi add image layer có transparent quanh viền @SB_PRB_EDT_179", async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    campaignsInfos = conf.caseConf.campaign_info;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step(`Vào Catalog > Click chọn base > Click btn "Create new campaign"> Add layer image > Upload artwork có transparent viền cho các base`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProducts(campaignsInfos.product_infos);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.removeLiveChat();
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.addNewLayers(campaignsInfos.layers);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathImageInEditor,
        snapshotName: snapshotName.snapshot_template_editor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click btn Preview", async () => {
      await printbasePage.page.click(printbasePage.xpathBtnPreview);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: printbasePage.page,
        snapshotName: snapshotName.snapshot_preview_editor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click Continue > Launch camp > View camp ngoài SF", async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(campaignsInfos.pricing_info);
      const campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
      const result = await printbasePage.waitDisplayMockupDetailCampaign(campaignsInfos.pricing_info.title);
      expect(result).toBeTruthy();
      await printbasePage.page.click(printbasePage.xpathTitleOrganization);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i <= countImageMockup; i++) {
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(campaignsInfos.pricing_info.title)}`,
          snapshotName: `${snapshotName.mockup_sf}-${i + 1}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
      }
    });
  });
});
