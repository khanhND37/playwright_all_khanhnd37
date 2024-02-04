import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { Personalize } from "@pages/dashboard/personalize";
import { SFHome } from "@sf_pages/homepage";
import { SFProduct } from "@sf_pages/product";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { Campaign } from "@sf_pages/campaign";

test.describe("Conditional logic preview preview image for Sbase", () => {
  let productPage: ProductPage;
  let personalizePage: Personalize;
  let homPageSF: SFHome;
  let productPageSF: SFProduct;
  let campaignSF: Campaign;
  let maxDiffPixelRatio;
  let threshold;
  let maxDiffPixels;
  let snapshotName;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await productPage.navigateToMenu("Products");
    await productPage.deleteProduct(conf.suiteConf.password);
    if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    }
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const conditionalLogicPreview = conf.caseConf.data[i];
    test(`${conditionalLogicPreview.description} @${conditionalLogicPreview.case_id}`, async ({
      dashboard,
      snapshotFixture,
    }) => {
      const productInfo = conditionalLogicPreview.product_all_info;
      const imagePreview = conditionalLogicPreview.image_preview;
      const layerList = conditionalLogicPreview.layers;
      const customOptions = conditionalLogicPreview.custom_option_info;
      const conditionalLogicInfo = conditionalLogicPreview.conditional_logic_info;
      const conditionShow = conditionalLogicPreview.conditional_logic_show;
      snapshotName = conditionalLogicPreview.snapshot_name;
      await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
      await personalizePage.addLayers(layerList);
      await dashboard.click(productPage.xpathIconExpand);
      await personalizePage.clickOnBtnWithLabel("Customize layer", 1);
      await personalizePage.addListCustomOptionOnEditor(customOptions);

      await test.step("Chọn condition > Select option value > Chọn Then show > Click button Back", async () => {
        await personalizePage.addListConditionLogic(conditionalLogicInfo);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_condition_logic,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click vào btn Save", async () => {
        await personalizePage.clickOnBtnWithLabel("Save");
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await dashboard.waitForSelector(personalizePage.xpathSectionCustomOption);
        await dashboard.locator(personalizePage.xpathSectionCustomOption).scrollIntoViewIfNeeded({ timeout: 5000 });
        await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Preview Images"));
        await waitForImageLoaded(dashboard, personalizePage.xpathPreviewImageWithLabel("Preview Images"));
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathSectionCustomOption,
          snapshotName: snapshotName.preview_image_block_custom_option,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("View product vừa tạo ngoài SF", async () => {
        homPageSF = new SFHome(dashboard, conf.suiteConf.domain);
        productPageSF = new SFProduct(dashboard, conf.suiteConf.domain);
        await homPageSF.searchThenViewProduct(productInfo.title);
        await dashboard.waitForSelector(personalizePage.xpathImgeProduct, { timeout: 5000 });
        await dashboard.waitForSelector(personalizePage.xpathImageCarousel);
        await productPageSF.waitForElementVisibleThenInvisible(productPageSF.xpathIconLoadImage);
        await expect(await personalizePage.verifyConditionLogicSF(conditionShow)).toBe(true);
      });
    });
  }

  test("[Conditional logic preview] Add conditional logic không thành công khi không add value @SB_PRO_SBP_1572", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const conditionalLogicBlankValue = conf.caseConf.conditional_logic_blank_value;
    const conditionalLogicBlankThenShow = conf.caseConf.conditional_logic_blank_then_show;
    snapshotName = conf.caseConf.snapshot_name;
    await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
    await personalizePage.addLayers(layerList);
    await dashboard.click(productPage.xpathIconExpand);
    await personalizePage.clickOnBtnWithLabel("Customize layer", 1);
    await personalizePage.addListCustomOptionOnEditor(customOptions);

    await test.step("Equal chọn : Is equal to > Select an option value : Không select values > Then show:  Image, Text, Area", async () => {
      await personalizePage.addListConditionLogic(conditionalLogicBlankValue);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.condition_logic_blank_value,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button back ", async () => {
      await dashboard.click(personalizePage.xpathIconBack);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.list_condition_logic_blank_value,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(
      "Click vào icon add conditional logic của Custom option Picture choice > " +
        "Equal chọn : Is equal to > Select an option value : IMG 2 > Then show: Không select custom option",
      async () => {
        await personalizePage.clickIconAddConditionLogic(conditionalLogicBlankThenShow[0]);
        await personalizePage.clickOnBtnWithLabel("Delete");
        await personalizePage.clickOnBtnWithLabel("Delete", 2);
        await personalizePage.addListConditionLogic(conditionalLogicBlankThenShow);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.condition_logic_blank_then_show,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click button back ", async () => {
      await dashboard.click(personalizePage.xpathIconBack);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.list_condition_logic_blank_then_show,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Conditional logic preview] Check change value của CO khi nó đang được gán conditional logic (Droplist/ Radio) @SB_PRO_SBP_1579", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
    const customOptionEdit = conf.caseConf.custom_option_edit;
    const conditionalLogicEdit = conf.caseConf.conditional_logic_edit;
    snapshotName = conf.caseConf.snapshot_name;
    await personalizePage.addProductAndAddConditionLogicCO(
      productInfo,
      imagePreview,
      layerList,
      customOptions,
      conditionalLogicInfo,
    );

    await test.step("Tại list custom option -> Click open custom option > Edit lại tất cả value > Verify các message hiển thị", async () => {
      await dashboard.locator(personalizePage.xpathCustomOptionName(customOptionEdit.custom_name)).click();
      await personalizePage.addCustomOptionOnEditor(customOptionEdit);
      await dashboard
        .locator(personalizePage.getXpathWithLabel("Add more value"))
        .scrollIntoViewIfNeeded({ timeout: 5000 });
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.custom_option_edit_value,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click back về màn Custom option list", async () => {
      await dashboard.click(personalizePage.xpathIconBack);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.list_custom_option_edit_value,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Đi đến màn Config conditional logic", async () => {
      await personalizePage.clickIconAddConditionLogic(conditionalLogicEdit);
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.condition_logic_edit_value,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(
      "Config Option 1 như sau: \n" +
        "+ is equal to : value 3 \n" +
        "OR is equal to: value 4 \n" +
        "Then show: option value",
      async () => {
        await personalizePage.addConditionalLogic(conditionalLogicEdit);
        await dashboard.click(personalizePage.xpathIconBack);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.list_custom_option_readd_value,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click vào btn Save", async () => {
      await personalizePage.clickOnBtnWithLabel("Save");
      await expect(await personalizePage.isToastMsgVisible("Save successfully")).toBeTruthy();
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
    });

    await test.step("Tại custom option -> delete tất cả các value", async () => {
      await dashboard.locator(personalizePage.xpathCustomOptionName(customOptionEdit.custom_name)).click();
      await personalizePage.deleteValueOfCustomOption(customOptionEdit.value);
      await dashboard.locator(personalizePage.getXpathWithLabel("Add more value")).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.custom_option_delete_value,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(
    "[Conditional logic preview] Check conditional logic của product với Custom option (CO) " +
      "loại picture choice (PC) và chọn clipart folder khi edit image @SB_PRO_SBP_1580",
    async ({ dashboard, conf, context, page }) => {
      const productInfo = conf.caseConf.product_all_info;
      const imagePreview = conf.caseConf.image_preview;
      const layerList = conf.caseConf.layers;
      const customOptions = conf.caseConf.custom_option_info;
      const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
      const clipartFolder = conf.caseConf.clipart_folder;
      const actionInfo = conf.caseConf.action_info;
      snapshotName = conf.caseConf.snapshot_name;
      let SFPage;
      let productClipart: ProductPage;
      let personalizePageSF: Personalize;
      await personalizePage.addProductAndAddConditionLogicCO(
        productInfo,
        imagePreview,
        layerList,
        customOptions,
        conditionalLogicInfo,
      );

      await test.step("View product ngoài SF > Click vào custom option", async () => {
        await personalizePage.clickOnBtnWithLabel("Cancel");
        [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
        personalizePageSF = new Personalize(SFPage, conf.suiteConf.domain);
        await SFPage.waitForSelector(personalizePageSF.xpathCOSF);
        await expect(await personalizePageSF.verifyImageVisibleOnSF(clipartFolder.images)).toBe(true);
        await SFPage.close();
      });

      for (let i = 0; i < actionInfo.length; i++) {
        let imageExp;
        if (actionInfo[i].action_name === "edit image") {
          imageExp = actionInfo[i].image_name_edit;
        } else {
          imageExp = actionInfo[i].image_name;
        }
        await test.step(`Vào app PrintHub > Chọn Library > Clipart > Mở màn hình clipart folder > thực hiện ${actionInfo.action_name} > Click button Save change`, async () => {
          await page.goto(`https://${conf.suiteConf.domain}/admin/apps/print-hub/clipart`);
          productClipart = new ProductPage(page, conf.suiteConf.domain);
          await productClipart.openClipartFolderDetail(actionInfo[i].folder_name);
          switch (actionInfo[i].action_name) {
            case "add image":
              await productClipart.addMoreClipart(actionInfo[i].image_name);
              break;
            case "edit image":
              await dashboard.waitForTimeout(3000);
              await productClipart.editClipartImageName(actionInfo[i].image_name, actionInfo[i].image_name_edit);
              break;
            case "delete image":
              await dashboard.waitForTimeout(3000);
              await productClipart.deleteImageInClipartFolder(actionInfo[i].image_name);
              break;
          }
          await expect(await page.locator(productClipart.xpathBtnWithLabel("Save changes"))).toBeEnabled();
          await productClipart.clickOnBtnWithLabel("Save changes");
        });

        await test.step("Vào lại màn All product -> Open product detail >  Click icon Edit conditional logic của Picture choice > Verify list image", async () => {
          await personalizePage.gotoProductDetail(productInfo.title);
          await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Preview Images"));
          await dashboard.locator(personalizePage.xpathIconActionPreviewImageWithLabel("Preview Images", 2)).click();
          await dashboard.click(personalizePage.xpathIconExpand);
          await personalizePage.clickIconAddConditionLogic(conditionalLogicInfo[0]);

          await expect(await personalizePage.verifySelectOption(personalizePage.xpathSelectOption, imageExp)).toBe(
            actionInfo[i].expected_result,
          );
        });

        await test.step("View product ngoài SF > Click vào custom option", async () => {
          await personalizePage.clickOnBtnWithLabel("Cancel");
          await dashboard.waitForTimeout(1000);
          if (await dashboard.locator(personalizePage.xpathBtnWithLabel("Leave page")).isVisible()) {
            await dashboard.click(personalizePage.xpathBtnWithLabel("Leave page"));
          }
          [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
          personalizePageSF = new Personalize(SFPage, conf.suiteConf.domain);
          await SFPage.waitForSelector(personalizePageSF.xpathCOSF);
          await expect(await personalizePageSF.verifyImageVisibleOnSF(imageExp)).toBe(actionInfo[i].expected_result);
          await SFPage.close();
        });
      }
    },
  );

  test("[Conditional logic preview] Check duplicate product có conditional logic @SB_PRO_SBP_1589", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
    snapshotName = conf.caseConf.snapshot_name;
    const productDuplicate = conf.caseConf.product_duplicate;
    await personalizePage.addProductAndAddConditionLogicCO(
      productInfo,
      imagePreview,
      layerList,
      customOptions,
      conditionalLogicInfo,
    );
    await personalizePage.clickOnBtnWithLabel("Cancel");

    await test.step("Vào màn all product -> search product > Click open product detail > Click button Duplicate -> Tại popup click button Duplicate", async () => {
      await personalizePage.gotoProductDetail(productInfo.title);
      await personalizePage.clickOnBtnWithLabel("Duplicate");
      await personalizePage.duplicateProduct(true, productDuplicate);
      await expect(await dashboard.locator(personalizePage.xpathTitleProductDetail)).toHaveText(productDuplicate);
    });

    await test.step("Verify product đã duplicate", async () => {
      await dashboard.locator(personalizePage.xpathSectionCustomOption).scrollIntoViewIfNeeded({ timeout: 5000 });
      await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Preview Images"), {
        timeout: 10000,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathSectionCustomOption,
        snapshotName: snapshotName.preview_image_block_custom_option_duplicate,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button Edit Preview Images > Check custom option, conditional logic", async () => {
      await dashboard.locator(personalizePage.xpathIconActionPreviewImageWithLabel("Preview Images", 2)).click();
      await dashboard.click(personalizePage.xpathIconExpand);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.custom_option_duplicate,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await personalizePage.clickIconAddConditionLogic(conditionalLogicInfo[0]);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.condition_logic_duplicate,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Conditional logic preview] Check product có nhiều option với conditional logic @SB_PRO_SBP_1590", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
    const customOptionShowSF = conf.caseConf.custom_option_data_SF;
    snapshotName = conf.caseConf.snapshot_name;
    await personalizePage.addProductAndAddConditionLogicCO(
      productInfo,
      imagePreview,
      layerList,
      customOptions,
      conditionalLogicInfo,
    );
    await personalizePage.clickOnBtnWithLabel("Cancel");

    await test.step("View product ngoài SF", async () => {
      campaignSF = new Campaign(dashboard, conf.suiteConf.domain);
      homPageSF = new SFHome(dashboard, conf.suiteConf.domain);
      productPageSF = new SFProduct(dashboard, conf.suiteConf.domain);
      await homPageSF.searchThenViewProduct(productInfo.title);
      await dashboard.waitForSelector(personalizePage.xpathImgeProduct, { timeout: 5000 });
      await dashboard.waitForSelector(personalizePage.xpathImageCarousel);
      await productPageSF.waitForElementVisibleThenInvisible(productPageSF.xpathIconLoadImage);
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathCOSF,
        snapshotName: snapshotName.custom_option_sf,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Chọn custom option, verify giá trị hiển thị", async () => {
      for (let i = 0; i < customOptionShowSF.length; i++) {
        for (let j = 0; j < customOptionShowSF[i].list_custom.length; j++) {
          await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF[i].list_custom[j]);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathCOSF,
          snapshotName: `${i}_${snapshotName.input_custom_option_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      }
    });
  });
});
