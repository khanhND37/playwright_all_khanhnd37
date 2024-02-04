import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import { SFProduct } from "@sf_pages/product";
import { Layer } from "@types";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Create thành công campaign", () => {
  let printBasePage: PrintBasePage;
  let dashboardPage;
  let personalizePage: Personalize;
  let snapshotOptions;
  let effect;
  let typeCurve, typeNone;
  let layers: Layer;
  let picture;
  let baseProducts;
  let pricingInfo;
  let customOption;
  let campaignId;
  let campaignSF;
  let customOptionSF;

  test.beforeEach(({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    snapshotOptions = conf.suiteConf.snapshot_options;
    layers = conf.caseConf.layers;
    effect = conf.caseConf.effect;
    typeCurve = conf.caseConf.type_curve;
    typeNone = conf.caseConf.type_none;
    picture = conf.caseConf.picture;
    baseProducts = conf.caseConf.campaign_info.base_products;
    pricingInfo = conf.caseConf.campaign_info.pricing_info;
    customOption = conf.caseConf.custom_option_info;
    customOptionSF = conf.caseConf.custom_option_data_SF;
  });

  const addBaseForCampaign = async baseProducts => {
    await dashboardPage.navigateToMenu("Catalog");
    await printBasePage.addBaseProducts(baseProducts);
    await printBasePage.clickOnBtnWithLabel("Create new campaign");
    await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
    await printBasePage.waitUntilElementVisible(printBasePage.xpathImageEditor);
  };

  const launchCampaign = async (pricingInfo, campaignId) => {
    await printBasePage.clickOnBtnWithLabel("Continue");
    await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathLoadImgInPriceAndDescription);
    await printBasePage.waitUntilElementVisible(printBasePage.xpathPricingPage);
    campaignId = printBasePage.getCampaignIdInPricingPage();
    await printBasePage.inputPricingInfo(pricingInfo);
    await printBasePage.clickOnBtnWithLabel("Launch");
    const isAvailable = await printBasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
    expect(isAvailable).toBeTruthy();
    await printBasePage.navigateToMenu("Campaigns");
    await printBasePage.searchWithKeyword(pricingInfo.title);
    await printBasePage.openCampaignDetail(pricingInfo.title);
    await printBasePage.waitUntilElementVisible(printBasePage.xpathTitleProductDetail);
  };

  test("@SB_PRB_PPB_101 Verify hiển thị layer trên editor sau khi delete effect curve", async ({
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(
      "Select Product bases > Click button [Create new campaign] > Click btn Add text layer 1 > tại Shape, chọn Curve" +
        "Verify hiển thị giá trị default trong curve box của layer text",
      async () => {
        await addBaseForCampaign(baseProducts);
        await printBasePage.addNewLayer(layers[0]);
        await dashboard.click(printBasePage.xpathLayerNameAtListLayer(layers[0].layer_value));
        await printBasePage.chooseEffects(effect, typeCurve);
        await printBasePage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: printBasePage.xpathEffectExpand(effect),
          snapshotName: picture.default_value,
          snapshotOptions,
        });
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.text_editor,
          snapshotOptions,
        });
        await dashboard.click(printBasePage.xpathIconBack);
      },
    );

    await test.step("tại list layer, Click btn Add text layer 2 > tại Shape, chọn Curver > input value cho shape Curve -> kiểm tra hiển thị text layer", async () => {
      await printBasePage.addNewLayer(layers[1]);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.input_value,
        snapshotOptions,
      });
    });

    await test.step("Click text layer 1 -> tại shape, chọn None -> kiểm tra hiển thị Text layer 1", async () => {
      await dashboard.click(printBasePage.xpathLayerNameAtListLayer(layers[0].layer_name));
      await printBasePage.chooseEffects(effect, typeNone);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.none_curve,
        snapshotOptions,
      });
    });

    await test.step("Click button Preview > Verify ảnh Preview", async () => {
      await dashboard.click(printBasePage.xpathBtnPreview);
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printBasePage.xpathMockupPreviewOnEditor,
        snapshotName: picture.picture_preview,
        snapshotOptions,
      });
    });
  });

  test("@SB_PRB_PPB_104 Verify hiển thị text khi sd Custom text overflow và alignment", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printBasePage.searchWithKeyword(pricingInfo.title);
      await printBasePage.deleteAllCampaign(conf.suiteConf.password);
    });

    await test.step("Select Product bases > Click button [Create new campaign] > Add layer text 1> kiểm tra hiển thị default tại text overflow", async () => {
      await addBaseForCampaign(baseProducts);
      await printBasePage.addNewLayer(layers[0]);
      await dashboard.click(printBasePage.xpathLayerNameAtListLayer(layers[0].layer_name));
      await printBasePage.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printBasePage.xpathPartTextOverflow,
        snapshotName: picture.default_scale,
        snapshotOptions,
      });
      await dashboard.click(printBasePage.xpathIconBack);
    });

    await test.step("Add layer text 2 -> Click layer name 2 > Chọn button Shrink + resize text box (hoặc text input)", async () => {
      await printBasePage.addNewLayer(layers[1]);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.editor_shrink,
        snapshotOptions,
      });
    });

    await test.step(
      "Add layer text 3 -> Click layer name 3 > Chọn button Scale của phần Custom text alignment + resize text box (hoặc text input)" +
        "-> Tại Text layer 3 > Chọn button căn trên / giữa / dưới",
      async () => {
        await printBasePage.addNewLayer(layers[2]);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.editor_scale,
          snapshotOptions,
        });
      },
    );

    await test.step("Click button Preview > Verify ảnh Preview", async () => {
      await dashboard.click(printBasePage.xpathBtnPreview);
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printBasePage.xpathMockupPreviewOnEditor,
        snapshotName: picture.picture_preview,
        snapshotOptions,
      });
    });

    await test.step("Tạo CO cho layer > Click btn Continue > Input title > Click button [Launch] > Verify status's campaign", async () => {
      await printBasePage.clickBtnExpand();
      await printBasePage.clickOnBtnWithLabel("Customize layer");
      await printBasePage.addCustomOptions(customOption);
      await launchCampaign(pricingInfo, campaignId);
    });

    await test.step("View campaign on SF > Verify thông tin campaign", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
      await campaignSF.waitForImagesMockupLoaded();
      await campaignSF.waitForImagesDescriptionLoaded();

      // compare title campaign
      const productTitleSF = await campaignSF.getProductTitle();
      expect(productTitleSF.toLowerCase()).toEqual(pricingInfo.title.toLowerCase());
      await campaignSF.page.waitForTimeout(10000);
      // compare mockup
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(pricingInfo.title)}`,
          snapshotName: `${picture.mockup_sf}-${i + 1}.png`,
          snapshotOptions,
        });
      }
    });

    await test.step("Input value on các CO> Click button Preview your design > Verify mockup live preview", async () => {
      await campaignSF.inputCustomAllOptionSF(customOptionSF);
      await campaignSF.clickOnBtnPreviewSF();
      await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: campaignSF.xpathPopupLivePreview(),
        snapshotName: picture.live_preview_sf,
        snapshotOptions,
      });
    });
  });

  test("@SB_PRB_PPB_119 Verify Layer có hiệu ứng Curve với Style effect cho cùng  1 layer text khi tạo campaign có chứa Customize group", async ({
    snapshotFixture,
    dashboard,
    conf,
    context,
  }) => {
    const listLayers = conf.caseConf.list_layer;

    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printBasePage.searchWithKeyword(pricingInfo.title);
      await printBasePage.deleteAllCampaign(conf.suiteConf.password);
    });

    await test.step(
      "Add base product > Click Create new campaign > Add 5 layer text -> Add 2 layer Image -> Add 2 Group > Add Layer vào Group" +
        "-> Tạo Customize Group group trên",
      async () => {
        await addBaseForCampaign(baseProducts);
        // wait for gen data tren editor
        await dashboard.waitForTimeout(6000);
        await printBasePage.removeLiveChat();
        await printBasePage.addNewLayers(listLayers);
        const group = conf.caseConf.groups;
        for (let j = 0; j < group.length; j++) {
          await printBasePage.createGroupLayer(group[j].current_group, group[j].new_group);
          await printBasePage.addLayerToGroup(group[j].layer_name, group[j].new_group);
        }
        await personalizePage.clickBtnExpand();
        const customize = conf.caseConf.customize_group;
        for (let i = 0; i < customize.length; i++) {
          await printBasePage.setupCustomizeGroupForPB(customize[i]);
        }
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.editor_preview,
          snapshotOptions,
        });
      },
    );

    await test.step("Tạo CO cho layer > Click btn Continue > Input title > Click button [Launch] > Verify status's campaign", async () => {
      await printBasePage.clickOnBtnWithLabel("Customize layer");
      await printBasePage.addCustomOptions(customOption);
      await launchCampaign(pricingInfo, campaignId);
    });

    await test.step("View campaign on SF > Verify thông tin campaign", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
      await campaignSF.waitForImagesMockupLoaded();
      await campaignSF.waitForImagesDescriptionLoaded();

      // compare title campaign
      const productTitleSF = await campaignSF.getProductTitle();
      expect(productTitleSF.toLowerCase()).toEqual(pricingInfo.title.toLowerCase());
      await campaignSF.page.waitForTimeout(10000);
      // compare mockup
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(pricingInfo.title)}`,
          snapshotName: `${picture.mockup_sf}-${i + 1}.png`,
          snapshotOptions,
        });
      }
    });

    await test.step("Input value on các CO > Click button Preview your design > Verify mockup live preview", async () => {
      const customOptionInfoSf = conf.caseConf.custom_option_info_sf;
      for (let i = 0; i < customOptionInfoSf.length; i++) {
        await campaignSF.inputCustomOptionSF(customOptionInfoSf[i]);
      }
      await campaignSF.clickOnBtnPreviewSF();
      await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: campaignSF.xpathPopupLivePreview(),
        snapshotName: picture.live_preview_sf,
        snapshotOptions,
      });
    });
  });

  test("@SB_PRB_PPB_118 Verify Layer có hiệu ứng Curve với Style effect cho cùng  1 layer text khi Switch qua lại giữa các base product trong editor", async ({
    snapshotFixture,
    dashboard,
    conf,
    context,
  }) => {
    const layerList = conf.caseConf.layers;
    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printBasePage.searchWithKeyword(pricingInfo.title);
      await printBasePage.deleteAllCampaign(conf.suiteConf.password);
    });

    await test.step("Add base product > Click Create new campaign > Click btn 'Add text' > Add 3 layer text", async () => {
      await addBaseForCampaign(baseProducts);
      await printBasePage.addNewLayers(layerList);
      await printBasePage.removeLiveChat();
      await snapshotFixture.verify({
        page: printBasePage.page,
        snapshotName: picture.editor_show_text,
        snapshotOptions,
      });
    });

    await test.step("Click button Preview > Verify ảnh Preview", async () => {
      await dashboard.click(printBasePage.xpathBtnPreview);
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.preview_show_text_2D,
        snapshotOptions,
      });
    });

    await test.step("Click sync 3 layer > Click sang base product 3D > Verify show layer text", async () => {
      const layerSync = conf.caseConf.sync_layer;
      await printBasePage.clickSyncLayer(layerSync);
      await dashboard.click(printBasePage.xpathBaseProductOnEditor(conf.caseConf.base_product_3d));
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printBasePage.xpathMockupPreviewOnEditor,
        snapshotName: picture.preview_show_text_3D,
        snapshotOptions,
      });
    });

    await test.step("Tạo CO cho layer > Click btn Continue > Input title > Click button [Launch] > Verify status's campaign", async () => {
      await printBasePage.clickBtnExpand();
      await printBasePage.clickOnBtnWithLabel("Customize layer");
      await printBasePage.addCustomOptions(customOption);
      await launchCampaign(pricingInfo, campaignId);
    });

    await test.step("View campaign on SF > Verify thông tin campaign", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
      await campaignSF.waitForImagesMockupLoaded();
      await campaignSF.waitForImagesDescriptionLoaded();

      // compare title campaign
      const productTitleSF = await campaignSF.getProductTitle();
      expect(productTitleSF.toLowerCase()).toEqual(pricingInfo.title.toLowerCase());
      await campaignSF.page.waitForTimeout(10000);
      // compare mockup
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(pricingInfo.title)}`,
          snapshotName: `${picture.mockup_sf}-${i + 1}.png`,
          snapshotOptions,
        });
      }
    });

    await test.step("Input value on các CO > Click button Preview your design > Verify mockup live preview", async () => {
      await campaignSF.inputCustomAllOptionSF(customOptionSF);
      await campaignSF.clickOnBtnPreviewSF();
      await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: campaignSF.xpathPopupLivePreview(),
        snapshotName: picture.live_preview_sf,
        snapshotOptions,
      });
    });
  });
});
