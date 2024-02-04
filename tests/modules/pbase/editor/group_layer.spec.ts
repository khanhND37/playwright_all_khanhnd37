import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";

test.describe("Verify group layer printbase", () => {
  let printbase: PrintBasePage;
  let productInfo;
  let group;
  let campaignId: number;
  let pricingInfo;
  let picture;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    await printbase.navigateToMenu("Catalog");
    productInfo = conf.caseConf.product_info;
    group = conf.caseConf.group;
    pricingInfo = conf.caseConf.pricing_info;
    picture = conf.caseConf.picture;
  });
  const createGroupLayerForCampaign = async (category, baseProduct, layers, groupData) => {
    await printbase.addProductFromCatalog(category, baseProduct);
    await printbase.clickLinkProductEditorCampaign();
    await printbase.addNewLayers(layers);
    await printbase.createGroupLayer(groupData.current_group, groupData.group_name, groupData.side);
    await printbase.addLayerToGroup(groupData.layer_name, groupData.group_name);
    await printbase.clickSyncGroup(groupData.group_name);
  };

  test("Verify tạo thành công group layer @SB_PRB_GLP_2", async ({ dashboard, conf, snapshotFixture }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Add layer > Click button Add new Group > Drag layer vào group", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(conf.caseConf.layers);
      for (let i = 0; i < group.length; i++) {
        await printbase.createGroupLayer(group[i].current_group, group[i].new_group, group[i].side);
        await printbase.addLayerToGroup(group[i].layer_name, group[i].new_group);
      }
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.group_editor}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Click button Preview > Verify show group layer", async () => {
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${conf.caseConf.picture.preview_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });
  });

  test("Verify show layer when drag layer và group @SB_PRB_GLP_3", async ({ dashboard, conf, snapshotFixture }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Add layer > Click button Add new Group > Drag layer vào group", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(conf.caseConf.layers);
      for (let i = 0; i < group.length; i++) {
        await printbase.createGroupLayer(group[i].current_group, group[i].new_group, group[i].side);
      }
      await printbase.addLayerToGroup(conf.caseConf.layer_name, conf.caseConf.group_name);
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.drag.layer_to_group),
        },
        to: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.drag.drag_out_site_group),
        },
      });
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.drag_to_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Drag layer ra khỏi group > Verify show group layer", async () => {
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.drag.drag_out_site_group),
        },
        to: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.drag.text_layer),
        },
      });
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.drag_layer_outside}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step(`Drag group xuống Back side > Verify show group layer`, async () => {
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconEyeOfGroup(conf.caseConf.drag.drag_group),
        },
        to: {
          selector: printbase.xpathListLayerSide(conf.caseConf.drag.side_name),
        },
      });
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.drag_to_back}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_ACTION_GROUP_LAYER");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, conf, snapshotFixture }) => {
      const productData = caseData.product_info;
      const groupData = caseData.group;
      await test.step(`Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer> Thực hiện action '${groupData.action}' với Group 1`, async () => {
        await createGroupLayerForCampaign(productData.category, productData.base_product, caseData.layers, groupData);
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(caseData.message));
        await printbase.clickActionsGroup(groupData.group_name, groupData.action);
        await printbase.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture.action_group}`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      });

      await test.step("Click sang base Classic V-neck T-shirt > Verify show group layer", async () => {
        await dashboard.click(printbase.xpathBaseProductOnEditor(productData.product_other));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture.base_2D}`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      });

      await test.step("Add thêm base 3D> Verify show group layer", async () => {
        await printbase.addOrRemoveProduct(productData.category_add, productData.product_add);
        await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productData.product_add));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture.base_3D}`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      });
    });
  }

  test("Delete layer trong và ngoài Group @SB_PRB_GLP_10", async ({ dashboard, conf, snapshotFixture }) => {
    const layerDelete = conf.caseConf.delete_layer_in;
    const layerOutDelete = conf.caseConf.delete_layer_out;
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer > Delete layer trong group", async () => {
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, group);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await printbase.deleteLayerOnEditor(layerDelete);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.delete_layer_in_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Click sang base 3D > Verify show group layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(conf.caseConf.product_info.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      //wait để show layer
      await printbase.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.base_2D}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Chọn base 2D> Delete layer ngoài group > Chọn base 3D > Verify show layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.deleteLayerOnEditor(layerOutDelete);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      //wait để show layer
      await printbase.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.delete_layer_out_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });
  });

  test("Verify auto sync Group với các loại base @SB_PRB_GLP_12", async ({ dashboard, conf, snapshotFixture }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer > Click button Auto Sync> Chọn base 2D khác", async () => {
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, group);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D_other));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.auto_sync_group_with_2D}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Click sang base 3D > Click button Auto sync > Verify show auto sync group layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await dashboard.click(printbase.xpathGroupLayerName(group.group_name));
      await dashboard.click(printbase.xpathActionBarOnEditor(conf.caseConf.action_bar));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.auto_sync_group_with_3D}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Chọn base 2D> Click button Sync Auto > Thực hiện edit layer trong group", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.editLayerDetail(conf.caseConf.layer_edit);
      await printbase.removeLiveChat();
      await printbase.page.waitForTimeout(3000);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.edit_layer_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    const loadConfigData = conf.caseConf.DATA_DRIVEN_AUTO_SYNC_GROUP.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        await dashboard.click(printbase.xpathBaseProductOnEditor(caseData.base_product));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await printbase.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture_name}`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      });
    }
  });

  test("Sync group trùng tên với group đã có sẵn ở base khác @SB_PRB_GLP_14", async ({
    dashboard,
    snapshotFixture,
    conf,
  }) => {
    const layerMore = conf.caseConf.layers_more;
    const groupMore = conf.caseConf.group_more;
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Chọn base 3D> Tạo group layer", async () => {
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, group);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.addNewLayers(layerMore);
      await printbase.createGroupLayer(groupMore.current_group, groupMore.group_name);
      await printbase.addLayerToGroup(groupMore.layer_name, groupMore.group_name);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.create_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Sync group > Chọn base 2D > Verify show group layer", async () => {
      await printbase.clickSyncGroup(group.group_name);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.sync_group_same}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Click Preview > Verify render mockup preview", async () => {
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${conf.caseConf.picture.preview_group}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });
  });

  test(" Verify Hide/ Show group layer on editor @SB_PRB_GLP_15", async ({
    dashboard,
    snapshotFixture,
    conf,
    context,
  }) => {
    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await printbase.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(pricingInfo.title);
      await printbase.deleteAllCampaign(conf.suiteConf.password);
    });
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Click Hide Group 1 > Verify show Group 1 on editor", async () => {
      await printbase.navigateToMenu("Catalog");
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(conf.caseConf.layers);
      for (let i = 0; i < group.length; i++) {
        await printbase.createGroupLayer(group[i].current_group, group[i].group_name, group[i].side);
        await printbase.addLayerToGroup(group[i].layer_name, group[i].group_name);
      }
      await printbase.clickHideOrShowGroup(productInfo.group_name);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.hide_group,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Click Preview > Verify Show Group 1", async () => {
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: picture.preview_hide_group,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Duplicate Group 1> Verify show group", async () => {
      await printbase.clickActionsGroup(productInfo.group_name, productInfo.action);

      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${conf.caseConf.picture.preview_duplicate_group_hide}`,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Click Show Group1 > Sync Group1 > Verify show Group1", async () => {
      await printbase.clickHideOrShowGroup(productInfo.group_name);
      await printbase.clickSyncGroup(productInfo.group_name);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.preview_show_group,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });
    await test.step("Chọn sang base 3D> Verify show group", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await dashboard.click(printbase.xpathBtnEdit);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.waitUntilElementVisible(printbase.xpathBtnUpdateMockups);
      await dashboard.click(printbase.xpathGroupLayerName(productInfo.group_name));
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.show_group_sync,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step(`Click btn Continue > Input title > Click btn Launch campagin > Verify launch campaign thành công`, async () => {
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.page.waitForLoadState("networkidle");
      await printbase.inputPricingInfo(pricingInfo);
      campaignId = printbase.getCampaignIdInPricingPage();
      await printbase.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbase.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify campaign detail", async () => {
      const result = await printbase.waitDisplayMockupDetailCampaign(pricingInfo.title);
      expect(result).toBeTruthy();
      await printbase.closeOnboardingPopup();
      await dashboard.click(printbase.xpathTitleOrganization);
      await snapshotFixture.verify({
        page: printbase.page,
        selector: printbase.xpathSectionImageInDetail,
        snapshotName: picture.image_list,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Verify info of campaign on SF", async () => {
      // open campaign sf
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
      const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
      await campaignSF.waitForImagesMockupLoaded();
      await campaignSF.waitForImagesDescriptionLoaded();

      // compare mockup
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(pricingInfo.title)}`,
          snapshotName: `${conf.caseConf.env}-image-mockup-sf-${i + 1}.png`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      }
    });
  });

  test("Verify show group layer with actions bar @SB_PRB_GLP_17", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await printbase.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(pricingInfo.title);
      await printbase.deleteAllCampaign(conf.suiteConf.password);
    });

    await printbase.navigateToMenu("Catalog");
    await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, group);
    await dashboard.click(printbase.xpathGroupLayerName(group.group_name));
    const loadConfigData = conf.caseConf.DATA_DRIVEN_ACTION_BAR.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        await dashboard.click(printbase.xpathActionBarOnEditor(caseData.action_bar));
        await printbase.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture_name}`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      });
    }

    await test.step("Add pricing and description info > click button [Launch] > Verify status's campaign", async () => {
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathLoadImgInPriceAndDescription);
      await printbase.waitUntilElementVisible(printbase.xpathPricingPage);
      campaignId = printbase.getCampaignIdInPricingPage();
      await printbase.inputPricingInfo(pricingInfo);
      await printbase.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbase.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify campaign detail", async () => {
      const result = await printbase.waitDisplayMockupDetailCampaign(pricingInfo.title);
      expect(result).toBeTruthy();
      await printbase.closeOnboardingPopup();
      await dashboard.click(printbase.xpathTitleOrganization);
      await snapshotFixture.verify({
        page: printbase.page,
        selector: printbase.xpathSectionImageInDetail,
        snapshotName: conf.caseConf.image_list,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Verify info of campaign on SF", async () => {
      // open campaign sf
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
      const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
      await campaignSF.waitForImagesMockupLoaded();
      await campaignSF.waitForImagesDescriptionLoaded();

      // compare mockup
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(pricingInfo.title)}`,
          snapshotName: `SB-PRB-GLP-17-${conf.caseConf.env}-image-mockup-sf-${i + 1}.png`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      }
    });
  });

  test("Verify show infor layer on editor with campaign draft @SB_PRB_GLP_53", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Precondition: Search Campaign > Delete campaign", async () => {
      await printbase.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(productInfo.title);
      await printbase.deleteAllCampaign(conf.suiteConf.password);
    });

    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer", async () => {
      await printbase.navigateToMenu("Catalog");
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, group);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: picture.show_group_layer,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Switch sang base product khác > Verify hiển thị group layer", async () => {
      const baseProduct = conf.caseConf.base_product;
      const listBaseProduct = baseProduct.split(",").map(item => item.trim());
      for (let i = 0; i < listBaseProduct.length; i++) {
        await dashboard.click(printbase.xpathBaseProductOnEditor(listBaseProduct[i]));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathMockupPreviewOnEditor,
          snapshotName: `${picture.switch_base}-${i + 1}.png`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      }
    });

    await test.step("Click Continue > Input Title > Click Save draft > Back về màn Campaigns > Click on campaign name vừa tạo > Verify hiển thị group layer on editor", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.inputPricingInfo(productInfo);
      await printbase.clickOnBtnWithLabel("Save draft");
      await printbase.navigateToMenu("Campaigns");
      await printbase.openEditCamp(productInfo.title);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: picture.show_group_layer,
        snapshotOptions: conf.suiteConf.snapshot_options,
      });
    });

    await test.step("Switch sang base product khác > Verify hiển thị group layer của campaign save draft", async () => {
      const baseProduct = conf.caseConf.base_product;
      const listBaseProduct = baseProduct.split(",").map(item => item.trim());
      for (let i = 0; i < listBaseProduct.length; i++) {
        await dashboard.click(printbase.xpathBaseProductOnEditor(listBaseProduct[i]));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathMockupPreviewOnEditor,
          snapshotName: `${picture.switch_base}-${i + 1}.png`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      }
    });
  });
});
