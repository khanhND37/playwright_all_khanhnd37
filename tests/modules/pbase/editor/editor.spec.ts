import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify editor printbase", () => {
  let printbase: PrintBasePage;
  let dashboardPage;
  let picture;
  let maxDiffPixelRatio;
  let threshold;
  let maxDiffPixels;
  let productInfo;
  let layerImage;
  let layerText;
  let layerDelete;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.navigateToMenu("Catalog");
    picture = conf.caseConf.picture;
    productInfo = conf.caseConf.product_info;
    layerImage = conf.caseConf.layer_image;
    layerText = conf.caseConf.layer_text;
    layerDelete = conf.caseConf.delete_layer_name;
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
  });

  test("[Pbase] Verify show editor khi add more product @SB_PRB_EDT_75", async ({ dashboard, conf }) => {
    const productInfo = conf.caseConf.product_info;
    await test.step("Click icon + > Select 1 base product > Click button Update Campaign", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.addOrRemoveProduct(productInfo.category, productInfo.base_add1);
      await expect(dashboard.locator(printbase.xpathTitleBaseProductOnEditor(productInfo.base_add1))).toBeVisible();
    });

    await test.step(`Click icon dấu + > Add more base product > Click button Update Campaign`, async () => {
      await printbase.addOrRemoveProduct(productInfo.category, productInfo.base_add_more);
      await expect(dashboard.locator(printbase.xpathTitleBaseProductOnEditor(productInfo.base_default))).toBeVisible();
      expect(await printbase.countBaseProductOnEditor()).toEqual(productInfo.number_add_more);
    });
  });

  test("[Pbase] Verify show product when delete/remove base product  @SB_PRB_EDT_78", async ({ dashboard }) => {
    await test.step("Click button + > Add base product > Click button Create new campaign", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.addOrRemoveProduct(productInfo.category, productInfo.add_product);
      await expect(
        dashboard.locator(printbase.xpathTitleBaseProductOnEditor(productInfo.product_delete)),
      ).toBeVisible();
      expect(await printbase.countBaseProductOnEditor()).toEqual(productInfo.number_add1);
    });

    await test.step("Hover on base product > Click icon X > Click button Delete", async () => {
      await printbase.deleteBaseProduct(productInfo.product_delete);
      await expect(dashboard.locator(printbase.xpathTitleBaseProductOnEditor(productInfo.product_name))).toBeVisible();
      expect(await printbase.countBaseProductOnEditor()).toEqual(productInfo.product_after_deleted);
    });

    await test.step("Click icon + > Remove base product", async () => {
      await printbase.addOrRemoveProduct(productInfo.category, productInfo.product_remove);
      expect(await printbase.countBaseProductOnEditor()).toEqual(productInfo.product_after_remove);
    });

    await test.step("Click icon + > Verify remove final product", async () => {
      await dashboard.click(printbase.xpathBtnAddBaseProduct);
      await expect(dashboard.locator(printbase.xpathBtnWithLabel(productInfo.button_label))).toBeDisabled();
    });
  });

  test("[Pbase] Verify add thành công layer @SB_PRB_EDT_82", async ({ dashboard, conf, snapshotFixture }) => {
    await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
    const layerPsdLoading = conf.caseConf.layer_psd_loading;
    await test.step("Click button Add text > Verify infor default of layer", async () => {
      await printbase.addNewLayer(layerText);
      await printbase.openLayerDetail(layerText);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.text}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click icon Back > Click button Add image > Chọn image", async () => {
      await dashboard.click(printbase.xpathIconBack);
      await printbase.addNewLayer(layerImage);
      await printbase.openLayerDetail(layerImage);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.image}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click icon Back > Click button Add image > Chọn 1 image loại psd", async () => {
      await dashboard.click(printbase.xpathIconBack);
      const layerPsd = conf.caseConf.layer_psd;
      await printbase.addNewLayer(layerPsd);
      await printbase.openLayerDetail(layerPsd);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.psd}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click icon Back > Click btuton Add image > Select file psd > Chọn file psd processing", async () => {
      await dashboard.click(printbase.xpathIconBack);
      await printbase.uploadAndSelectArtwork(
        layerPsdLoading.front_or_back,
        layerPsdLoading.layer_type,
        layerPsdLoading.image_name,
      );
      await expect(dashboard.locator(printbase.xpathMessageOfLayerPsd)).toBeVisible();
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_EDIT_LAYER");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
      const productData = caseData.product_info;
      const picture = caseData.picture;
      await test.step("Tại Front side, Add layer > bỏ trống field required bất kì", async () => {
        await printbase.addProductFromCatalog(productData.category, productData.product_name);
        await printbase.addNewLayer(productData);
        await printbase.editLayerDetail(productData);
        await expect(dashboard.locator(printbase.xpathMessageRequiredForLayer(productData.layer_name))).toBeVisible();
      });

      await test.step("Open layer detail > Thực hiện edit thông tin các field với các data", async () => {
        const layerText = caseData.layer_text;
        await printbase.editLayerDetail(layerText);
        await printbase.waitUntilElementVisible(printbase.xpathIconDragOfLayer(layerText.layer_name));
        await printbase.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${picture.picture_editor}-${caseData.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click button Preview > Verify ảnh Preview", async () => {
        await dashboard.click(printbase.xpathBtnPreview);
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${picture.picture_preview}-${caseData.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  const confVariant = loadData(__dirname, "DATA_DRIVEN_VARIANT_EDITOR");
  for (let i = 0; i < confVariant.caseConf.data.length; i++) {
    const caseData = confVariant.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
      const productInfo = caseData.product_info;
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      const variantEditor = caseData.variant;
      const picture = caseData.picture_name;
      await test.step("Verify hiển thị default variant (color, size)", async () => {
        await printbase.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathVariantEditor,
          snapshotName: `${picture.default_variant}-${caseData.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Select variant for base product", async () => {
        await printbase.selectVariantForBase(variantEditor);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathVariantEditor,
          snapshotName: `${picture.selected_variant}-${caseData.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("[Pbase] Verify show ảnh preview khi hover color and select base @SB_PRB_EDT_81", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
    await test.step("Click button Add text > Click button Preview> Hover color> Verify mockup Preview", async () => {
      await printbase.addNewLayer(layerText);
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await dashboard.hover(printbase.xpathColorOnEditor(conf.caseConf.color));
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_with_color}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Select base khác >Verify mockup preview", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(conf.caseConf.base_product));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_with_base}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify show layer with actions bar @SB_PRB_EDT_92", async ({ dashboard, conf, snapshotFixture }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
    await printbase.removeLiveChat();
    await printbase.addNewLayer(layerText);
    await printbase.openLayerDetail(layerText);
    const loadConfigData = conf.caseConf.DATA_DRIVEN_ACTION_BAR.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        await dashboard.click(printbase.xpathActionBarOnEditor(caseData.action_bar));
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture_name}-${caseData.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    }

    await test.step("Click button [Reset all] > Verify show layer", async () => {
      await printbase.clickOnBtnWithLabel("Reset all");
      await dashboard.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${productInfo.image_reset_all}-${productInfo.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify show layer when delete layer @SB_PRB_EDT_93", async ({ dashboard, conf, snapshotFixture }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const layerAdd = conf.caseConf.layers_add;
    const layerDelete = conf.caseConf.delete_layer_name;
    await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
    await printbase.removeLiveChat();
    await test.step("Add1 layer text >Add thêm base product > add 1 layer text ,1 layer image> Delete layer", async () => {
      await printbase.addNewLayer(layerText);
      await printbase.addOrRemoveProduct(productInfo.category, productInfo.add_product);
      await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productInfo.add_product));
      await printbase.addNewLayers(layerAdd);
      await printbase.deleteLayerOnEditor(layerDelete);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.delete_layer}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Chọn base product khác  > verify show layer của base", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_name));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.base_delete_layer}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Delete layer từ action bar > Verify show layer", async () => {
      await printbase.openLayerDetail(layerText);
      await dashboard.click(printbase.xpathActionBarOnEditor(conf.caseConf.action_bar));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.delete_on_action_bar}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify hiển thị mockup sau khi setup mockup @SB_PRB_EDT_104", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Chọn base products > Click button [Create new campaign] > Verify list mockup default", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathListMockupEditor,
        snapshotName: `${picture.mockup_default}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click on link text [Update mockup] > đổi vị trí mockup> Untick mockup > Click button Save", async () => {
      const drag = conf.caseConf.drag;
      await dashboard.click(printbase.xpathBtnUpdateMockups);
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathMockupPosition(drag.index_from),
        },
        to: {
          selector: printbase.xpathMockupPosition(drag.index_to),
        },
      });

      await dashboard.click(printbase.xpathMockupPosition(drag.index_unselect));
      await printbase.clickOnBtnWithLabel("Save");
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await printbase.closePopupSelectMockup();
      await printbase.waitUntilElementVisible(printbase.xpathListMockupEditor);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathListMockupEditor,
        snapshotName: `${picture.mockup_select}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click on link text [Update mockup] > Update lại mockup như default > Click button Save", async () => {
      const dragDefault = conf.caseConf.drag_default;
      const dragDefaultLast = conf.caseConf.drag_default_last;
      await dashboard.click(printbase.xpathBtnUpdateMockups);
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathMockupPosition(dragDefault.index_from),
        },
        to: {
          selector: printbase.xpathMockupPosition(dragDefault.index_to),
        },
      });
      await printbase.selectMockupEditor(dragDefault.index_select);
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathMockupPosition(dragDefaultLast.index_from),
        },
        to: {
          selector: printbase.xpathMockupPosition(dragDefaultLast.index_to),
        },
      });
      await printbase.clickOnBtnWithLabel("Save");
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await printbase.closePopupSelectMockup();
      await printbase.waitUntilElementVisible(printbase.xpathListMockupEditor);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathListMockupEditor,
        snapshotName: `${picture.mockup_default}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify hiển thị lỗi khi setup mockup khi bỏ chọn tới mokup reqquired @SB_PRB_EDT_105", async ({
    dashboard,
    conf,
  }) => {
    const mockupIndex = conf.caseConf.mockup_index;
    await test.step("Click vào link text [Update mockup]> Bỏ chọn mockup đên mockup back /front cuối cùng", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await dashboard.click(printbase.xpathBtnUpdateMockups);
      await printbase.selectMockupEditor(mockupIndex.index_side_required);
      await expect(
        dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_side_required)),
      ).toBeVisible();
    });

    await test.step("Close popup Select mockup > Add thêm base [Short Socks] > Click link text [Update mockup]> Bỏ chọn mockup mockup cuối cùng", async () => {
      await printbase.closePopupSelectMockup();
      await printbase.addOrRemoveProduct(productInfo.category, productInfo.base_add_more);

      await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productInfo.base_add_more));
      await dashboard.click(printbase.xpathBtnUpdateMockups);
      await printbase.selectMockupEditor(mockupIndex.index_select);
      await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_required))).toBeVisible();
    });
  });

  test("[Pbase] Verify thứ tự các layer khi thực hiện action drag @SB_PRB_EDT_106", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const layerAdd = conf.caseConf.layers_add;
    await test.step("Chọn base [AOP Hoodie] > Click button [Create new campaign] > Add layer (layer text, layer image) cho Front side", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      for (let i = 0; i < layerAdd.length; i++) {
        await printbase.addNewLayer(layerAdd[i]);
      }
      await printbase.waitUntilElementVisible(printbase.xpathIconDragOfLayer(conf.caseConf.layer_text));
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.add_layer}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Drag Layer text lên vị trí layer Image > Click button Preview > Verify show Layer", async () => {
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.layer_text),
        },
        to: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.layer_image),
        },
      });
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.drag_layer}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Drag layer text xuống Back side > Verify show Layer", async () => {
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.layer_text),
        },
        to: {
          selector: printbase.xpathListLayerSide(conf.caseConf.side_name),
        },
      });
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.drag_layer_side}-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify thông tin Pricing page @SB_PRB_EDT_110", async ({ dashboard, conf, snapshotFixture }) => {
    const variantEditor = conf.caseConf.variant_editor;
    const pricingInfor = conf.caseConf.pricing_info;
    await test.step("Chọn [Apparel] tab> Chọn base product > Click button [Create new campaign]> Click button Continue", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.closeOnboardingPopup();
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathPricingPage,
        snapshotName: `${picture.pricing_defautl}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click Back lại màn Editor> Add layer text > Select variant> Click button Continue > Click Set individual price", async () => {
      await printbase.clickOnBreadcrumb();
      await printbase.addNewLayer(layerImage);
      await printbase.selectVariantForBase(variantEditor);
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.waitUntilElementVisible(printbase.xpathSetIndividualPrice(variantEditor.base_product));
      await printbase.clickSetIndividualPriceInPricing(variantEditor.base_product);
      await expect(dashboard.locator(printbase.xpathAlertOnPricingTab)).toBeHidden();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathListPricing,
        snapshotName: `${picture.pricing_varriant}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Verify show data when input thông tin các field on tab pricing", async () => {
      await printbase.inputPricingInfo(pricingInfor);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathPricingPage,
        snapshotName: `${picture.pricing_edit}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Để trống field title > click button Launch", async () => {
      await printbase.clearInPutData(printbase.xpathInputTitleOnPricingPage);
      await printbase.clickOnBtnWithLabel("Launch");
      await printbase.checkMsgAfterCreated({ message: conf.caseConf.message_title });
    });
  });

  test("[Pbase] Verify chức năng select product main image @SB_PRB_EDT_114", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const variantEditor = conf.caseConf.variant_editor;
    await test.step("Chọn [Apparel] tab> Chọn base product> Click button [Create new campaign]> Add image> Sync layer> Select variant >Click btn Continue > Verify show block Select product main image", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.addNewLayer(layerImage);
      await printbase.clickSyncLayer(layerImage.layer_name);
      await printbase.selectVariantForBase(variantEditor);
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.removeLiveChat();
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathSelectProductMainImageOnPricingPage,
        snapshotName: `${picture.product_main_defautl}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Select color khác > Verify hiển thị Image Preview", async () => {
      await dashboard.click(printbase.xpathColorOnPricingPage(conf.caseConf.index_color));
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathSelectProductMainImageOnPricingPage,
        snapshotName: `${picture.color_main}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Select base khác > Select main color > Verify hiển thị preview và color", async () => {
      await printbase.genLoc(printbase.xpathSelectProductMain).selectOption({
        label: variantEditor.base_product,
      });
      await dashboard.click(printbase.xpathColorOnPricingPage(conf.caseConf.index_color_other));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathSelectProductMainImageOnPricingPage,
        snapshotName: `${picture.select_product_main}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify show layer when sync layer @SB_PRB_EDT_118", async ({ dashboard, conf, snapshotFixture }) => {
    const layerAdd = conf.caseConf.layers_add;
    const layerSync = conf.caseConf.layer_sync;
    await test.step("Chọn [Apparel] tab> Chọn base product > Click button [Create new campaign] >Add layer> Click button sync cho layer > Chọn sang base thứ hai > check show layer", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.clickLinkProductEditorCampaign();
      await printbase.addNewLayers(layerAdd);
      await printbase.clickSyncLayer(layerSync);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(conf.caseConf.message));
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_second));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: `${picture.sync_layer}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Chọn base đầu tiên > Drag giữa 2 layer > Edit layer image> Preview >Chọn sang base thứ 2 ,check show layer", async () => {
      const layerEdit = conf.caseConf.layer_edit;
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_first));
      await printbase.dragAndDrop({
        from: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.layer_text),
        },
        to: {
          selector: printbase.xpathIconDragOfLayer(conf.caseConf.layer_image),
        },
      });
      await printbase.editLayerDetail(layerEdit);
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.layer_sync_base_first}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_second));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.layer_sync_base_second}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Delete layer text > chọn button On this product > Chọn base đầu tiên > Verify show layer", async () => {
      await printbase.deleteLayerOnEditor(layerDelete);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_first));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.layer_sync_base_first}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase] Verify chức năng link giữa các product @SB_PRB_EDT_122", async ({ dashboard, snapshotFixture }) => {
    await test.step("Chọn tab All over Print > Chọn base product> Verify icon Link base", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.waitUntilElementVisible(printbase.xpathBaseProductOnEditor(productInfo.base_2D_second));
      await printbase.clickLinkProductEditorCampaign();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathLeftMenuEditor,
        snapshotName: `${picture.icon_link}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Chọn base V-neck T-shirt, Add layer image > Chọn base Classic Unisex Tank> Click Preview > Verify sync layer", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_2D_first));
      await printbase.addNewLayer(layerImage);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_2D_second));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_with_link}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Tắt icon Link, thực hiện add new layer + edit layer cũ > chọn base V-neck T-shirt", async () => {
      await printbase.clickIconLinkOnEditor(productInfo.base_2D_second);
      await printbase.addNewLayer(layerText);
      await printbase.editLayerDetail(layerImage);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_2D_first));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.off_link}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button + ,Chọn tab Apparel > Chọn base product > Verify chức năng link layer", async () => {
      await printbase.addOrRemoveProduct(productInfo.category_add, productInfo.product_add);
      await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productInfo.product_add));
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathLeftMenuEditor,
        snapshotName: `${picture.link_product_add}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase]Verify chức năng re-link @SB_PRB_EDT_124", async ({ dashboard, snapshotFixture }) => {
    await test.step("Chọn tab Apparel > Chọn base product>Tắt icon link all base > Add layer text> Verify layer on các base còn lại", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.clickLinkProductEditorCampaign();
      await printbase.clickIconLinkOnEditor(productInfo.product_name);
      await printbase.addNewLayer(layerText);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_2D_second));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.layer_link_off}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Bật icon Link all base > Add layer image> Chọn base khác > Verify sync layer", async () => {
      await printbase.clickIconLinkOnEditor(productInfo.product_name);
      await printbase.addNewLayer(layerImage);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.base_2D_second));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.layer_link_on}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button + ,Chọn tab Apparel > Chọn base product > Verify chức năng link layer", async () => {
      await printbase.addOrRemoveProduct(productInfo.category_add, productInfo.product_add);
      await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productInfo.product_add));
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathLeftMenuEditor,
        snapshotName: `${picture.link_product_add}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Pbase]Verify chức năng auto sync layer @SB_PRB_EDT_120", async ({ dashboard, conf, snapshotFixture }) => {
    const layerEdit = conf.caseConf.layer_edit;
    const layerEditBaseAdd = conf.caseConf.layer_edit_base_add;
    await test.step("Add 1 base product> Add layer > Verify show button auto sync", async () => {
      await printbase.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbase.addNewLayer(layerImage);
      await expect(dashboard.locator(printbase.xpathActionBarOnEditor(conf.caseConf.action_name))).toBeHidden();
    });

    await test.step("Click button + ,Add base product> Click btn Update campaign > Chọn base product first > Sync layer >Verify button Auto sync", async () => {
      await printbase.addOrRemoveProduct(productInfo.category_add, productInfo.product_add);
      await printbase.waitUntilElementVisible(printbase.xpathTitleBaseProductOnEditor(productInfo.product_add));
      await printbase.clickLinkProductEditorCampaign();
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_name));
      await printbase.clickSyncLayer(layerImage.layer_name);
      await printbase.openLayerDetail(layerImage);
      await expect(dashboard.locator(printbase.xpathActionBarOnEditor(conf.caseConf.action_name))).toBeVisible();
    });

    await test.step("Click button Auto sync > Chọn sang base thứ 2 > Edit layer > Click button Auto sync > Click button Preview", async () => {
      await dashboard.click(printbase.xpathActionBarOnEditor(conf.caseConf.action_name));
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_add));
      await printbase.editLayerDetail(layerEditBaseAdd);
      await printbase.openLayerDetail(layerEditBaseAdd);
      await dashboard.click(printbase.xpathActionBarOnEditor(conf.caseConf.action_name));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.edit_layer}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Verify show layer auto sync on base khác", async () => {
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_name));
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.preview_auto_sync}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Tắt auto sync > Edit layer> Chọn base khác > Verify show layer", async () => {
      await dashboard.click(printbase.xpathBtnEdit);
      await printbase.openLayerDetail(layerImage);
      await dashboard.click(printbase.xpathActionBarOnEditor(conf.caseConf.action_name));
      await dashboard.click(printbase.xpathIconBack);
      await printbase.editLayerDetail(layerEdit);
      await dashboard.click(printbase.xpathBaseProductOnEditor(productInfo.product_add));
      await dashboard.click(printbase.xpathBtnPreview);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathMockupPreviewOnEditor,
        snapshotName: `${picture.edit_layer}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
