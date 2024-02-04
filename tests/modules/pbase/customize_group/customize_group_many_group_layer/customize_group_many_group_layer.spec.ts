import { test } from "@fixtures/theme";
import { snapshotDir, waitSelector } from "@utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { AddLayersToGroupInfo, BaseProductInfor, customOptionProductSF, GroupInfo, Layer, PricingInfo } from "@types";
import { expect } from "@core/fixtures";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";

test.describe("Verify camp nhiều customize group", () => {
  let printbasePage: PrintBasePage;
  let campaignId;
  let productSF: SFProduct;
  let countIconSyncGroup;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    test.setTimeout(conf.suiteConf.timeout);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
  });

  const createNewCampaign = async (prodInfo: Array<BaseProductInfor>): Promise<void> => {
    await printbasePage.navigateToMenu("Catalog");
    await printbasePage.addBaseProducts(prodInfo);
    await printbasePage.clickOnBtnWithLabel("Create new campaign");
    await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
  };

  const createAndAddLayerToGroup = async (
    printbasePage,
    layerList: Array<Layer>,
    createGroupLayer: Array<GroupInfo>,
    addLayersToGroup: Array<AddLayersToGroupInfo>,
  ) => {
    await printbasePage.createGroupLayers(createGroupLayer);
    await printbasePage.addNewLayers(layerList);
    await printbasePage.addLayersToGroup(addLayersToGroup);
    //add layer image
    for (let i = 0; i < layerList.length; i++) {
      if (layerList[i].layer_type !== "Image") continue;
      await printbasePage.addNewLayers([layerList[i]]);
    }
  };

  const snapshootLayersAndTemplate = async (conf, snapshotFixture) => {
    const listBase = conf.caseConf.product_info[0].base_product.split(",");
    for (let i = 0; i < listBase.length; i++) {
      await printbasePage.page.click(printbasePage.getXpathBaseImgThumbnail(i));
      await printbasePage.waitUntilElementInvisible(printbasePage.xpathIconLoading);
      await printbasePage.page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathImageInEditor,
        snapshotName: `template-${listBase[i].trim().replaceAll(" ", "-")}-${conf.caseConf.pictures.dashboard}`,
      });
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.getXpathListLayer(conf.caseConf.type_base),
        snapshotName: `layers-${listBase[i].trim().replaceAll(" ", "-")}-${conf.caseConf.pictures.dashboard}`,
      });
    }
  };

  const launchCamp = async (pricingInfo: PricingInfo) => {
    await printbasePage.inputPricingInfo(pricingInfo);
    campaignId = printbasePage.getCampaignIdInPricingPage();
    await printbasePage.clickOnBtnWithLabel("Launch");
    const isAvailable = await printbasePage.checkCampaignStatus(
      campaignId,
      ["available", "available with basic images"],
      30 * 60 * 1000,
    );
    expect(isAvailable).toBeTruthy();
  };

  const openCampSF = async (conf, context) => {
    await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
    const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
    productSF = new SFProduct(SFPage, conf.suiteConf.domain);
    await productSF.waitForImagesMockupLoaded();
  };

  const inputDataCustomOptionSF = async (dataCustomOptionInfo: Array<customOptionProductSF>) => {
    for (let i = 0; i < dataCustomOptionInfo.length; i++) {
      await productSF.inputCustomOptionSF(dataCustomOptionInfo[i]);
    }
  };

  const previewImageSF = async () => {
    await productSF.clickOnBtnPreviewSF();
    await productSF.limitTimeWaitAttributeChange(productSF.xpathImageActive);
  };

  test(`@SB_PRB_DCGP_01 Tạo campaign với customize group chứa nhiều group layer với nhiều base 2D`, async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre condition: Vào "Catalog"
    > Vào tab "Apparel"
    > Select các base 2D "Unisex Hoodie, Ladies T-shirt, Premium Unisex T-shirt,
    Unisex T-shirt, Unisex Tank, Crewneck Sweatshirt, V-neck T-shirt"
    > Click vào btn "Create new campaign`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(conf.caseConf.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await createNewCampaign(conf.caseConf.product_info);
    });

    await test.step(`Tại base Unisex Hoodie, Add các layer cho base product
    và add layer vào các group layer tương ứng`, async () => {
      await printbasePage.createLayerAndAddLayerToGroup(
        conf.caseConf.layers,
        conf.caseConf.groups,
        conf.caseConf.add_layers_to_group,
      );
      const countGroupLayers = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayers).toEqual(conf.caseConf.add_layers_to_group.length);
    });

    await test.step(`Lần lượt click sang các base prodiuct còn lại
    > Verify hiển thị layer và group layer trên template và list layer`, async () => {
      await snapshootLayersAndTemplate(conf, snapshotFixture);
    });

    await test.step(`Click vào btn "Customize layer"
      > Tạo các custom option với Type = Text field > Click vào btn "Save" `, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.custom_options);
      const countCustomOption = await printbasePage.page.locator(printbasePage.getXpathItemCustomOption("")).count();
      await expect(countCustomOption).toEqual(conf.caseConf.custom_options.length);
    });

    await test.step(`Click vào btn "Customize group" > Verify hiển thị group trong customize group detail
    > Select default group = Group 5 > Click vào btn "Save"
    Back lại màn hình list custom option> Mở custom group detail vừa tạo`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group);
      await printbasePage.page.click(
        printbasePage.getXpathNameLabelInCOList(conf.caseConf.customize_group.label_group),
      );
      await expect(await printbasePage.page.locator(printbasePage.xpathBtnWithLabel("Save", 1))).toBeDisabled();
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.page.waitForLoadState("networkidle");
      await launchCamp(conf.caseConf.pricing_info);
    });

    await test.step(`View campaign ngoài SF > Verify hiển thị group default ngoài SF`, async () => {
      await openCampSF(conf, context);
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: `default-value-${conf.caseConf.pictures.storefront}`,
      });
    });

    await test.step(`Select lần lượt các group > Input các custom option tương ứng
    > Click vào btn "Preview your design"`, async () => {
      const dataCustomOptionInfo = conf.caseConf.custom_option_info;
      await inputDataCustomOptionSF(dataCustomOptionInfo);
      await previewImageSF();
      await snapshotFixture.verify({
        page: productSF.page,
        selector: productSF.xpathPopupLivePreview(),
        snapshotName: `preview-img-${conf.caseConf.pictures.storefront}`,
      });
    });
  });

  test(`@SB_PRB_DCGP_02 Tạo campaign với customize group chứa nhiều group layer với nhiều base 3D`, async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre condition: Vào "Catalog" > Vào tab "Apparel"
      > Select các base 3D "Quilt, Landscape Poster, Portrait Poster, Landscape Canvas"
      > Click vào btn "Create new campaign"`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(conf.caseConf.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await createNewCampaign(conf.caseConf.product_info);
    });

    await test.step(`Tại base Quilt, Add các layer cho base product và add layer vào các group layer tương ứng
      Add  1 layer image cho base product`, async () => {
      await printbasePage.createLayerAndAddLayerToGroup(
        conf.caseConf.layers,
        conf.caseConf.groups,
        conf.caseConf.add_layers_to_group,
      );
      const countGroupLayer = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayer).toEqual(conf.caseConf.add_layers_to_group.length);
    });

    await test.step(`Lần lượt click icon sync ở các group
        Click sang các base > Verify hiển thị group layer ở list group và trên template`, async () => {
      countIconSyncGroup = await printbasePage.page.locator(printbasePage.xpathIconSyncGroupLayer).count();
      for (let i = 0; i < countIconSyncGroup; i++) {
        await printbasePage.page.click(`(${printbasePage.xpathIconSyncGroupLayer})[${i + 1}]`);
      }
      await snapshootLayersAndTemplate(conf, snapshotFixture);
    });

    await test.step(`Tại base Quilt, click vào icon sync ở Layer image
        Click sang các base khác verify hiển thị layer image`, async () => {
      await printbasePage.page.click(printbasePage.getXpathBaseImgThumbnail());
      await printbasePage.page.click(printbasePage.xpathIconSyncLayerImage);
      await snapshootLayersAndTemplate(conf, snapshotFixture);
    });

    await test.step(`Click vào btn "Customize layer"
      > Tạo các custom option với Type = Text field > Click vào btn "Save" `, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.custom_options);
      const countCustomOption = await printbasePage.page.locator(printbasePage.getXpathItemCustomOption("")).count();
      await expect(countCustomOption).toEqual(conf.caseConf.custom_options.length);
    });

    await test.step(`Click vào btn "Customize group" > Verify hiển thị group trong customize group detail
      > Select default group = Group 5 > Click vào btn "Save"`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group);
      await printbasePage.page.click(printbasePage.xpathCustomOptionName(conf.caseConf.customize_group.label_group));
      await expect(await printbasePage.page.locator(printbasePage.xpathBtnWithLabel("Save", 1))).toBeDisabled();
    });

    await test.step(`Click vào btn "Continue"
      > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.page.waitForLoadState("networkidle");
      await launchCamp(conf.caseConf.pricing_info);
    });

    await test.step(`View campaign ngoài SF > Verify hiển thị group default ngoài SF`, async () => {
      await openCampSF(conf, context);
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: `default-value-${conf.caseConf.pictures.storefront}`,
      });
    });

    await test.step(`Select lần lượt các group > Input các custom option tương ứng
      > Click vào btn "Preview your design"`, async () => {
      const dataCustomOptionInfo = conf.caseConf.custom_option_info;
      await inputDataCustomOptionSF(dataCustomOptionInfo);
      await previewImageSF();
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathPopupLivePreview(),
        snapshotName: `preview-img-${conf.caseConf.pictures.storefront}`,
      });
    });
  });

  test(`@SB_PRB_DCGP_14 Tạo nhiều customize group trong trường hợp: nhiều group layer có chung Text layer nhưng
  trong các customize group khác nhau`, async ({ conf, snapshotFixture }) => {
    await test.step(`Pre condition: Vào "Catalog"
    > Vào tab "Apparel"
    > Select các base 2D "Unisex Hoodie, Ladies T-shirt, Premium Unisex T-shirt,
    Unisex T-shirt, Unisex Tank, Crewneck Sweatshirt, V-neck T-shirt"
    > Click vào btn "Create new campaign`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(conf.caseConf.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await createNewCampaign(conf.caseConf.product_info);
      await printbasePage.clickBtnExpand();
      await printbasePage.removeLiveChat();
    });

    await test.step(`Tại base Unisex Hoodie, Add các layer cho base product
    > Add layer vào các group tương ứng (Group 1: Text layer 1, Group 2: Text layer 1,2`, async () => {
      await printbasePage.createLayerAndAddLayerToGroup(
        conf.caseConf.layer_1,
        conf.caseConf.group_1,
        conf.caseConf.add_layers_to_group_1,
      );
      const countGroupLayers = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayers).toEqual(conf.caseConf.add_layers_to_group_1.length);
    });

    await test.step(`Click vào btn Customize group > Input label "1", default group = "Group 1"> Click btn Save`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group_1);
      await expect(
        await printbasePage.page.locator(
          printbasePage.getXpathNameLabelInCOList(conf.caseConf.customize_group_1.label_group),
        ),
      ).toBeVisible();
    });

    await test.step(`Add tiếp các layer cho base product > Add layer vào các group tương ứng
    (Group 3: Text layer 1,2,3, Group 4: Text layer 1,2,3,4)`, async () => {
      await printbasePage.createLayerAndAddLayerToGroup(
        conf.caseConf.layer_2,
        conf.caseConf.group_2,
        conf.caseConf.add_layers_to_group_2,
      );
      const countGroupLayers = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayers).toEqual(conf.caseConf.group_2.length + conf.caseConf.group_1.length);
    });

    await test.step(`Click vào btn Customize group > Input label "2", default group = "Group 3"> Click btn Save`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group_2);
      await expect(
        await printbasePage.page.locator(
          printbasePage.getXpathNameLabelInCOList(conf.caseConf.customize_group_2.label_group),
        ),
      ).toBeVisible();
    });

    await test.step(`Add tiếp các layer cho base product > Add layer vào các group tương ứng
    (Group 5: Text layer 5, Group 6: Text layer 6)`, async () => {
      for (let i = 0; i < conf.caseConf.group_3.length; i++) {
        await createAndAddLayerToGroup(
          printbasePage,
          [conf.caseConf.layer_3[i]],
          [conf.caseConf.group_3[i]],
          [conf.caseConf.add_layers_to_group_3[i]],
        );
      }
      const countGroupLayers = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayers).toEqual(
        conf.caseConf.group_1.length + conf.caseConf.group_2.length + conf.caseConf.group_3.length,
      );
    });

    await test.step(`Click vào btn Customize group > Input label "3", default group = "Group 5"> Click btn Save`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group_3);
      await expect(
        await printbasePage.page.locator(
          printbasePage.getXpathNameLabelInCOList(conf.caseConf.customize_group_3.label_group),
        ),
      ).toBeVisible();
    });

    await test.step(`Lần lượt click vào btn "Customize layer" > Add custom option Text layer
    > Back lại màn list custom option > Verify hiển thị customize group và custom option ở list custom option`, async () => {
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.custom_options);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathListLabelInCO,
        snapshotName: `list-custom-option-${conf.caseConf.pictures.dashboard}`,
      });
    });

    await test.step(`Drag/ Drop customize group "1" lên trên option Text 1 và Text 2`, async () => {
      const labelGroup1 = conf.caseConf.customize_group_1.label_group;
      await printbasePage.page.locator(printbasePage.getXpathCustomOptionList(labelGroup1)).scrollIntoViewIfNeeded();
      await waitSelector(printbasePage.page, await printbasePage.xpathListActionOfLabel(labelGroup1, "Drag"));
      await printbasePage.dragAndDrop({
        from: {
          selector: await printbasePage.xpathListActionOfLabel(labelGroup1, "Drag"),
        },
        to: {
          selector: await printbasePage.xpathListActionOfLabel("Text 2", "Drag"),
        },
      });

      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathListLabelInCO,
        snapshotName: `drag-group-1-list-custom-option-${conf.caseConf.pictures.dashboard}`,
      });
    });

    await test.step(`Drag/ Drop option Text 3 và Text 4 xuống bên dưới customize group "1"`, async () => {
      const labelGroup1 = conf.caseConf.customize_group_1.label_group;
      await printbasePage.dragAndDrop({
        from: {
          selector: await printbasePage.xpathListActionOfLabel("Text 3", "Drag"),
        },
        to: {
          selector: await printbasePage.xpathListActionOfLabel(labelGroup1, "Drag"),
        },
      });
      await printbasePage.dragAndDrop({
        from: {
          selector: await printbasePage.xpathListActionOfLabel("Text 4", "Drag"),
        },
        to: {
          selector: await printbasePage.xpathListActionOfLabel(labelGroup1, "Drag"),
        },
      });
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathListLabelInCO,
        snapshotName: `drag-text-3-4-list-custom-option-${conf.caseConf.pictures.dashboard}`,
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`@${caseData.case_id} - ${caseData.description}`, async ({ context, snapshotFixture }) => {
      const pictures = caseData.pictures;
      const layers = caseData.layers;
      const groups = caseData.groups;
      const addLayersToGroup = caseData.add_layers_to_group;
      const picture = caseData.picture;
      await test.step("Tại màn hình editor campaign > Add layer và tạo group cho base product > Add layer vào group", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(caseData.pricing_info.title);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await createNewCampaign(caseData.product_info);
        if (caseData.case_id === "SB_PRB_DCG_26" || caseData.case_id === "SB_PRB_DCG_31") {
          for (let i = 0; i < groups.length; i++) {
            await printbasePage.createGroupLayer(groups[i].current_group, groups[i].new_group);
            for (let j = 0; j < 2 * (i + 1); j++) {
              await printbasePage.addNewLayer(layers[j]);
            }
            await printbasePage.addLayerToGroup(addLayersToGroup[i].layer_name, addLayersToGroup[i].group_name);
          }
        } else {
          await printbasePage.addNewLayers(layers);
          await printbasePage.createGroupLayers(groups);
          await printbasePage.addLayersToGroup(addLayersToGroup);
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

      await test.step("Click vào btn Customize layer > Tạo các custom option tương ứng", async () => {
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(caseData.custom_options);
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

      await test.step("Click vào Add more base > Add thêm base Landscape Puzzle > Verify hiển thị các layer và các custom option trên base Landscape Puzzle", async () => {
        await printbasePage.page.click(printbasePage.xpathAddMoreBase);
        await printbasePage.addBaseProducts(caseData.add_more_base);
        await printbasePage.clickOnBtnWithLabel("Update campaign");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        const countGroupLayers = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
        await expect(countGroupLayers).toEqual(groups.length);
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

      await test.step("Tại base Landscape Puzzle, mở customize group detail Number of Cat > Verify hiển thị customize group detail", async () => {
        await printbasePage.page.click(printbasePage.xpathCustomOptionName(caseData.customize_group.label_group));
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
      });

      await test.step("Click vào btn Continue > Input title > Click vào btn Launch > Verify launch campaign thành công", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        const campaignId = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputPricingInfo(caseData.pricing_info);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Open campaign detail > Verify hiển thị mockup", async () => {
        const result = await printbasePage.waitDisplayMockupDetailCampaign(caseData.pricing_info.title);
        expect(result).toBeTruthy();
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
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
          await snapshotFixture.verify({
            page: productSF.page,
            selector: `${productSF.getXpathMainImageOnSF(caseData.pricing_info.title)}`,
            snapshotName: `${caseData.case_id}-${picture.image_instant_preview}-${i + 1}.png`,
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
            snapshotName: `${caseData.case_id}-${picture.image_preview}-${i + 1}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          await productSF.page.click(productSF.xpathClosePreview);
        }
      });
    });
  }
});
