import { test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { Apps } from "@pages/dashboard/apps";
import { loadData } from "@core/conf/conf";

test.describe("Verify group layer printhub", () => {
  let printbase: PrintBasePage;
  let appPage: Apps;
  let picture;
  let snapshotOptions;
  let productInfo;
  let drag;
  let layerAdd;
  let groupAdd;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appPage = new Apps(dashboard, conf.suiteConf.domain);
    await printbase.navigateToMenu("Apps");
    await appPage.openApp("Print Hub");
    await printbase.navigateToMenu("Catalog");
    picture = conf.caseConf.picture;
    productInfo = conf.caseConf.product_info;
    drag = conf.caseConf.drag;
    layerAdd = conf.caseConf.layers;
    groupAdd = conf.caseConf.group;
  });

  const createGroupLayerForCampaign = async (category, baseProduct, layers, groupData) => {
    await printbase.addProductFromCatalog(category, baseProduct);
    await printbase.addNewLayers(layers);
    await printbase.createGroupLayer(groupData.current_group, groupData.group_name, groupData.side);
    await printbase.addLayerToGroup(groupData.layer_name, groupData.group_name);
    await printbase.clickSyncGroup(groupData.group_name);
  };

  test("Verify tạo thành công group layer @SB_PRH_GLPH_2", async ({ dashboard, snapshotFixture }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Add layer > Click button Add new Group > Drag layer vào group", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(layerAdd);
      for (let i = 0; i < groupAdd.length; i++) {
        await printbase.createGroupLayer(groupAdd[i].current_group, groupAdd[i].new_group, groupAdd[i].side);
        await printbase.addLayerToGroup(groupAdd[i].layer_name, groupAdd[i].new_group);
      }
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.group_editor}`,
        snapshotOptions,
      });
    });

    await test.step("Click button Preview > Verify show group layer", async () => {
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_group}`,
        snapshotOptions,
      });
    });
  });

  test("Verify show layer when drag layer và group @SB_PRH_GLPH_3", async ({ dashboard, conf, snapshotFixture }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Add layer > Click button Add new Group > Drag layer vào group", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(layerAdd);
      for (let i = 0; i < groupAdd.length; i++) {
        await printbase.createGroupLayer(groupAdd[i].current_group, groupAdd[i].new_group, groupAdd[i].side);
      }
      await printbase.addLayerToGroup(conf.caseConf.layer_name, conf.caseConf.group_name);
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(drag.layer_to_group),
        },
        to: {
          selector: printbase.xpathIconDragOfLayer(drag.drag_out_site_group),
        },
      });
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.drag_to_group}`,
        snapshotOptions,
      });
    });

    await test.step(`Drag layer ra khỏi group > Verify show group layer`, async () => {
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(drag.drag_out_site_group),
        },
        to: {
          selector: printbase.xpathIconDragOfLayer(drag.text_layer),
        },
      });
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.drag_layer_outside}`,
        snapshotOptions,
      });
    });

    await test.step(`Drag group xuống Back side > Verify show group layer`, async () => {
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconEyeOfGroup(drag.drag_group),
        },
        to: {
          selector: printbase.xpathListLayerSide(drag.side_name),
        },
      });
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.drag_to_back}`,
        snapshotOptions,
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_ACTION_GROUP_LAYER");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
      const productData = caseData.product_info;
      const groupData = caseData.group;
      const picture = caseData.picture;
      await test.step(`Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer> Thực hiện action '${groupData.action}' với Group 1`, async () => {
        await createGroupLayerForCampaign(productData.category, productData.base_product, caseData.layers, groupData);
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(groupData.message));
        await printbase.clickActionsGroup(groupData.group_name, groupData.action);
        await printbase.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${picture.action_group}`,
          snapshotOptions,
        });
      });

      await test.step("Click sang base Classic V-neck T-shirt > Verify show group layer", async () => {
        await dashboard.click(printbase.xpathBaseProductOnEditor(productData.product_other));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${picture.base_2D}`,
          snapshotOptions,
        });
      });

      await test.step("Add thêm base 3D> Verify show group layer", async () => {
        await printbase.addOrRemoveProduct(productData.category_add, productData.product_add);
        await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productData.product_add));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${picture.base_3D}`,
          snapshotOptions,
        });
      });
    });
  }
  test("Delete layer trong và ngoài Group @SB_PRH_GLPH_7", async ({ dashboard, conf, snapshotFixture }) => {
    const layerDelete = conf.caseConf.delete_layer_in;
    const layerOutDelete = conf.caseConf.delete_layer_out;
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer > Delete layer trong group", async () => {
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, groupAdd);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await printbase.deleteLayerOnEditor(layerDelete);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.delete_layer_in_group}`,
        snapshotOptions,
      });
    });

    await test.step("Click sang base 3D > Verify show group layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.base_2D}`,
        snapshotOptions,
      });
    });

    await test.step("Chọn base 2D> Delete layer ngoài group > Chọn base 3D > Verify show layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.deleteLayerOnEditor(layerOutDelete);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.delete_layer_out_group}`,
        snapshotOptions,
      });
    });
  });

  test("Verify auto sync Group với các loại base @SB_PRH_GLPH_8", async ({ dashboard, conf, snapshotFixture }) => {
    const layerEdit = conf.caseConf.layer_edit;
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Sync Group layer > Click button Auto Sync> Chọn base 2D khác", async () => {
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, groupAdd);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D_other));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.auto_sync_group_with_2D}`,
        snapshotOptions,
      });
    });

    await test.step("Click sang base 3D > Click button Auto sync > Verify show auto sync group layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await dashboard.click(printbase.xpathGroupLayerName(groupAdd.group_name));
      await dashboard.click(printbase.xpathActionBarOnEditor(conf.caseConf.action_bar));
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.auto_sync_group_with_3D}`,
        snapshotOptions,
      });
    });

    await test.step("Chọn base 2D> Click button Sync Auto > Thực hiện edit layer trong group", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.editLayerDetail(layerEdit);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.edit_layer_group}`,
        snapshotOptions,
      });
    });

    const loadConfigData = conf.caseConf.DATA_DRIVEN_AUTO_SYNC_GROUP.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        await dashboard.click(printbase.xpathBaseProductOnEditor(caseData.base_product));
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture_name}`,
          snapshotOptions,
        });
      });
    }
  });

  test("Sync group trùng tên với group đã có sẵn ở base khác @SB_PRH_GLPH_9", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Chọn base 3D> Tạo group layer", async () => {
      const layerMore = conf.caseConf.layers_more;
      const groupMore = conf.caseConf.group_more;
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(layerAdd);
      await printbase.createGroupLayer(groupAdd.current_group, groupAdd.group_name, groupAdd.side);
      await printbase.addLayerToGroup(groupAdd.layer_name, groupAdd.group_name);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_3D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.addNewLayers(layerMore);
      await printbase.createGroupLayer(groupMore.current_group, groupMore.group_name);
      await printbase.addLayerToGroup(groupMore.layer_name, groupMore.group_name);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.create_group}`,
        snapshotOptions,
      });
    });

    await test.step("Sync group > Chọn base 2D > Verify show group layer", async () => {
      await printbase.clickSyncGroup(groupAdd.group_name);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_2D));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.sync_group_same}`,
        snapshotOptions,
      });
    });

    await test.step("Click Preview > Verify render mockup preview", async () => {
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_group}`,
        snapshotOptions,
      });
    });
  });

  test(" Verify Hide/ Show group layer on editor @SB_PRH_GLPH_10", async ({ dashboard, conf, snapshotFixture }) => {
    await test.step("Chọn base product > Click button [Create new campaign] > Tạo group layer > Click Hide Group 1 > Verify show Group 1 on editor", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
      await printbase.addNewLayers(layerAdd);
      for (let i = 0; i < groupAdd.length; i++) {
        await printbase.createGroupLayer(groupAdd[i].current_group, groupAdd[i].group_name, groupAdd[i].side);
        await printbase.addLayerToGroup(groupAdd[i].layer_name, groupAdd[i].group_name);
      }
      await printbase.clickHideOrShowGroup(productInfo.group_name);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.hide_group}`,
        snapshotOptions,
      });
    });

    await test.step("Click Preview > Verify Show Group 1", async () => {
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_hide_group}`,
        snapshotOptions,
      });
    });

    await test.step("Duplicate Group 1> Verify show group", async () => {
      await printbase.clickActionsGroup(productInfo.group_name, productInfo.action);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.preview_duplicate_group_hide}`,
        snapshotOptions,
      });
    });

    await test.step("Click Show Group1 > Sync Group1 > Verify show Group1", async () => {
      await printbase.clickHideOrShowGroup(productInfo.group_name);
      await printbase.clickSyncGroup(productInfo.group_name);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.preview_show_group}`,
        snapshotOptions,
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
        snapshotName: `${picture.show_group_sync}`,
        snapshotOptions,
      });
    });
  });

  test("Verify show group layer with actions bar @SB_PRH_GLPH_11", async ({ dashboard, conf, snapshotFixture }) => {
    await printbase.addProductFromCatalog(productInfo.category, productInfo.base_product);
    await printbase.addNewLayers(layerAdd);
    await printbase.createGroupLayer(groupAdd.current_group, groupAdd.group_name, groupAdd.side);
    await printbase.addLayerToGroup(groupAdd.layer_name, groupAdd.group_name);
    await dashboard.click(printbase.xpathGroupLayerName(groupAdd.group_name));
    const loadConfigData = conf.caseConf.DATA_DRIVEN_ACTION_BAR.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        await dashboard.click(printbase.xpathActionBarOnEditor(caseData.action_bar));
        await printbase.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture_name}`,
          snapshotOptions,
        });
      });
    }
  });

  test("Verify show infor layer on editor with campaign draft @SB_PRH_GLPH_12", async ({
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
      await createGroupLayerForCampaign(productInfo.category, productInfo.base_product, conf.caseConf.layers, groupAdd);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${conf.caseConf.picture.show_group_layer}`,
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
          snapshotName: `${conf.caseConf.picture.switch_base}-${i + 1}.png`,
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
      await printbase.openCampaignDetail(productInfo.title);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${conf.caseConf.picture.show_group_layer}`,
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
          snapshotName: `${conf.caseConf.picture.switch_base}-${i + 1}.png`,
          snapshotOptions: conf.suiteConf.snapshot_options,
        });
      }
    });
  });
});
