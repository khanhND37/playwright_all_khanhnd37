import { test } from "@fixtures/theme";
import { snapshotDir } from "@utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { expect } from "@core/fixtures";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { Apps } from "@pages/dashboard/apps";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";
import { loadData } from "@core/conf/conf";

test.describe("Verify camp nhiều customize group", () => {
  let printbasePage: PrintBasePage;
  let appPage: Apps;
  let productSF: SFProduct;
  let countIconSyncGroup;
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    test.setTimeout(conf.suiteConf.timeout);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appPage = new Apps(dashboard, conf.suiteConf.domain);
    await printbasePage.navigateToMenu("Apps");
    await appPage.openApp("Print Hub");
    await printbasePage.navigateToMenu("Campaigns");
  });

  const snapshootLayersAndTemplate = async (snapshotFixture: SnapshotFixture, strBases: string, pictures, typeBase) => {
    const listBase = strBases.split(",");
    for (let i = 0; i < listBase.length; i++) {
      await printbasePage.page.click(printbasePage.getXpathBaseImgThumbnail(i));
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathImageInEditor,
        snapshotName: `template-${listBase[i].trim().replaceAll(" ", "-")}-${pictures}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.getXpathListLayer(typeBase),
        snapshotName: `layers-${listBase[i].trim().replaceAll(" ", "-")}-${pictures}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    }
  };

  test("@SB_PRH_CGPH_27 Tạo campaign với customize group chứa nhiều group layer với nhiều base 2D", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Vào "Catalog" > "Apparel > Select các base 2D > Click vào button "Create New Campaign"`, async () => {
      await printbasePage.searchWithKeyword(conf.caseConf.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProducts(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.removeLiveChat();
    });

    await test.step("Tại base Unisex Hoodie, Add các layer cho base product và add layer vào các group layer tương ứng", async () => {
      await printbasePage.createLayerAndAddLayerToGroup(
        conf.caseConf.layers,
        conf.caseConf.groups,
        conf.caseConf.add_layers_to_group,
      );
      const countGroupLayer = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayer).toEqual(conf.caseConf.add_layers_to_group.length);
    });

    await test.step("Lần lượt click sang các base product còn lại > Verify hiển thị layer và group layer trên template và list layer", async () => {
      await snapshootLayersAndTemplate(
        snapshotFixture,
        conf.caseConf.product_info[0].base_product,
        conf.caseConf.pictures.dashboard,
        "2D",
      );
    });

    await test.step(`Click vào btn "Customize layer" > Tạo các custom option với Type = Text field > Click vào btn "Save"`, async () => {
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
      await printbasePage.page.click(printbasePage.getXpathCustomOptionList(conf.caseConf.customize_group.label_group));
      await expect(await printbasePage.page.locator(printbasePage.xpathBtnWithLabel("Save", 1))).toBeDisabled();
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      const campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("View campaign ngoài SF > Verify hiển thị group default ngoài SF", async () => {
      await printbasePage.searchWithKeyword(conf.caseConf.pricing_info.title);
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForImagesMockupLoaded();
      await productSF.waitForImagesDescriptionLoaded();
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: `default-value-${conf.caseConf.pictures.storefront}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Select lần lượt các group > Input các custom option tương ứng > Click vào btn "Preview your design"`, async () => {
      const dataCustomOptionInfo = conf.caseConf.custom_option_info;
      await productSF.inputCustomAllOptionSF(dataCustomOptionInfo);
      await productSF.clickOnBtnPreviewSF();
      await productSF.limitTimeWaitAttributeChange(productSF.xpathImageActive);
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathPopupLivePreview(),
        snapshotName: `default-value-${conf.caseConf.pictures.preview}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test("@SB_PRH_CGPH_28 Tạo campaign với customize group chứa nhiều group layer với nhiều base 3D", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Vào "Catalog" > Vào tab "Apparel" > Select các base 3D "Quilt, Landscape Poster, Portrait Poster, Landscape Canvas"
  > Click vào btn "Create new campaign"`, async () => {
      await printbasePage.searchWithKeyword(conf.caseConf.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProducts(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.removeLiveChat();
    });

    await test.step("Tại base Quilt, Add các layer cho base product và add layer vào các group layer tương ứng > Add 1 layer image cho base product", async () => {
      await printbasePage.createLayerAndAddLayerToGroup(
        conf.caseConf.layers,
        conf.caseConf.groups,
        conf.caseConf.add_layers_to_group,
      );
      const countGroupLayer = await printbasePage.page.locator(printbasePage.xpathGroupLayer).count();
      await expect(countGroupLayer).toEqual(conf.caseConf.add_layers_to_group.length);
    });

    await test.step("Lần lượt click icon sync ở các group và layer image > Click sang các base > Verify hiển thị group layer ở list layer và template", async () => {
      countIconSyncGroup = await printbasePage.page.locator(printbasePage.xpathIconSyncGroupLayer).count();
      for (let i = 0; i < countIconSyncGroup; i++) {
        await printbasePage.page.click(`(${printbasePage.xpathIconSyncGroupLayer})[${i + 1}]`);
      }
      await printbasePage.page.click(printbasePage.xpathIconSyncLayerImage);
      await snapshootLayersAndTemplate(
        snapshotFixture,
        conf.caseConf.product_info[0].base_product,
        conf.caseConf.pictures.dashboard,
        "3D",
      );
    });

    await test.step(`Click vào btn "Customize layer" > Tạo các custom option với Type = Text field > Click vào btn "Save" `, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.custom_options);
      const countCustomOption = await printbasePage.page.locator(printbasePage.getXpathItemCustomOption("")).count();
      await expect(countCustomOption).toEqual(conf.caseConf.custom_options.length);
    });

    await test.step(`Click vào btn "Customize group" > Verify hiển thị group trong customize group detail
  > Select default group = Group 5 > Click vào btn "Save"`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group);
      await printbasePage.page.click(printbasePage.getXpathCustomOptionList(conf.caseConf.customize_group.label_group));
      await expect(await printbasePage.page.locator(printbasePage.xpathBtnWithLabel("Save", 1))).toBeDisabled();
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      const campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("View campaign ngoài SF > Verify hiển thị group default ngoài SF", async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForCLipartImagesLoaded();
      await productSF.waitForImagesDescriptionLoaded();
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: `default-value-${conf.caseConf.pictures.storefront}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Select lần lượt các group > Input các custom option tương ứng > Click vào btn "Preview your design"`, async () => {
      const dataCustomOptionInfo = conf.caseConf.custom_option_info;
      await productSF.inputCustomAllOptionSF(dataCustomOptionInfo);
      await productSF.clickOnBtnPreviewSF();
      await productSF.limitTimeWaitAttributeChange(productSF.xpathImageActive);
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathPopupLivePreview(),
        snapshotName: `default-value-${conf.caseConf.pictures.preview}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_PRH_CGPH_29 Duplicate campaign chứa customize group với nhiều group layer`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_info;

    await test.step(`Pre-condition: Vào "Campaigns" > Search campaign "Support create custom group 3D" > Click vào icon Duplicate campaign`, async () => {
      await printbasePage.searchWithKeyword(conf.caseConf.campaign_origin);
      await printbasePage.page.click(printbasePage.xpathIconDuplicate(conf.caseConf.campaign_origin));
      await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxKeepArtwork, true);
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await printbasePage.removeLiveChat();
    });

    await test.step(`Click vào icon Expand > Mở màn hình customize group detail > Verify hiển thị các thông tin trong customize group detail`, async () => {
      await printbasePage.page.click(printbasePage.xpathIconExpand);
      await printbasePage.page.click(printbasePage.getXpathCustomOptionList(conf.caseConf.label_group));
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathCustomizeGroupContainer,
        snapshotName: `default-value-${conf.caseConf.pictures.dashboard}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Lần lượt click vào các base product còn lại, verify hiển thị customize group detail`, async () => {
      const baseProduct = conf.caseConf.base_products;
      const base = baseProduct.split(",");
      for (let i = 0; i < base.length; i++) {
        await printbasePage.page.click(printbasePage.xpathBaseProductOnEditor(base[i]));
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.page.click(printbasePage.getXpathCustomOptionList(conf.caseConf.label_group));
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathCustomizeGroupContainer,
          snapshotName: `${base[i].trim().replaceAll(" ", "-")}-${conf.caseConf.pictures.dashboard}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step(`Add thêm base "Portrait Canvas" > Verify hiển thị layer và customize group detail`, async () => {
      await printbasePage.page.locator(printbasePage.xpathAddMoreBase).click();
      await printbasePage.addBaseProducts(productInfo);
      await printbasePage.clickOnBtnWithLabel("Update campaign");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathCustomizeGroupContainer,
        snapshotName: `customize-add-more-${conf.caseConf.pictures.dashboard}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.getXpathListLayer("3D"),
        snapshotName: `layer-add-more-${conf.caseConf.pictures.dashboard}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      const campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`View campaign ngoài SF > Verify hiển thị group default ngoài SF`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForCLipartImagesLoaded();
      await productSF.waitForImagesDescriptionLoaded();
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: `default-value-${conf.caseConf.pictures.storefront}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Select lần lượt các group > Input các custom option tương ứng > Click vào btn "Preview your design"`, async () => {
      const dataCustomOptionInfo = conf.caseConf.custom_option_info;
      await productSF.inputCustomAllOptionSF(dataCustomOptionInfo);
      await productSF.clickOnBtnPreviewSF();
      await productSF.limitTimeWaitAttributeChange(productSF.xpathImageActive);
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
      await snapshotFixture.verify({
        page: productSF.page,
        selector: printbasePage.xpathPopupLivePreview(),
        snapshotName: `preview-image-${conf.caseConf.pictures.preview}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
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
      await test.step("Tại màn hình editor campaign > Add layer và tạo group cho base product > Add layer vào group", async () => {
        await printbasePage.searchWithKeyword(caseData.pricing_info.title);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.addBaseProducts(caseData.product_info);
        await printbasePage.clickOnBtnWithLabel("Create new campaign");
        await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
        if (
          caseData.case_id === "SB_PRH_CGPH_41" ||
          caseData.case_id === "SB_PRH_CGPH_40" ||
          caseData.case_id === "SB_PRH_CGPH_43"
        ) {
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
        if (caseData.case_id === "SB_PRH_CGPH_43") {
          await printbasePage.addListConditionLogic(caseData.conditional_logic_info);
        }
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

      if (
        caseData.case_id === "SB_PRH_CGPH_40" ||
        caseData.case_id === "SB_PRH_CGPH_41" ||
        caseData.case_id === "SB_PRH_CGPH_42"
      ) {
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
      }

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

      await test.step("View campaign ngoài SF > Verify hiển thị default mockup", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await productSF.waitUntilElementVisible(productSF.xpathProductMockupSlide);
        const countImageMockup = await productSF.waitForImagesMockupLoaded();
        for (let i = 0; i <= countImageMockup; i++) {
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
          await snapshotFixture.verify({
            page: productSF.page,
            selector: `${productSF.getXpathMainImageOnSF(caseData.pricing_info.title)}`,
            snapshotName: `${caseData.case_id}-image-mockup-sf-${i + 1}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          await productSF.page.click(productSF.xpathBtnNextImagePreview);
        }
      });

      await test.step("Lần lượt chọn từng Group > Sau đó Input custom option tương ứng > Verify hiển thị ảnh instant preview và live preview", async () => {
        const customOptionSF = caseData.custom_options_sf;
        for (let i = 0; i < customOptionSF.length; i++) {
          await productSF.inputCustomAllOptionSF(customOptionSF[i]);
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
          await snapshotFixture.verify({
            page: productSF.page,
            selector: `${productSF.getXpathMainImageOnSF(caseData.pricing_info.title)}`,
            snapshotName: `${caseData.case_id}-image-instant-preview-sf-${i + 1}.png`,
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
            snapshotName: `${caseData.case_id}-image-preview-sf-${i + 1}.png`,
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
