import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { Personalize } from "@pages/dashboard/personalize";
import { loadData } from "@core/conf/conf";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { Campaign } from "@sf_pages/campaign";
import { SFHome } from "@sf_pages/homepage";
import { SFProduct } from "@sf_pages/product";

test.describe("Setup custom option preview image for Sbase", () => {
  let productPage: ProductPage;
  let personalizePage: Personalize;
  let campaignSF: Campaign;
  let homPageSF: SFHome;
  let productPageSF: SFProduct;
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
    const previewCustomOption = conf.caseConf.data[i];
    test(`${previewCustomOption.description} @${previewCustomOption.case_id}`, async ({
      dashboard,
      snapshotFixture,
    }) => {
      const productInfo = previewCustomOption.product_all_info;
      const imagePreview = previewCustomOption.image_preview;
      const layerList = previewCustomOption.layers;
      const customOptions = previewCustomOption.custom_option_info;
      const customOptionShowSF = previewCustomOption.custom_option_data_SF;
      const customOptionType = previewCustomOption.custom_option_type;
      snapshotName = previewCustomOption.snapshot_name;
      await test.step("Pre condition: Add product and upload mockup", async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
      });

      await test.step("Click vào btn để add layer cho preview image", async () => {
        for (let i = 0; i < layerList.length; i++) {
          await personalizePage.addLayer(layerList[i]);
          await expect(await dashboard.locator(personalizePage.xpathLayer(layerList[i].layer_name))).toBeVisible();
        }
      });

      await test.step("Click vào btn Customize layer", async () => {
        await dashboard.click(productPage.xpathIconExpand);
        await productPage.clickOnBtnWithLabel("Customize layer", 1);
        await dashboard.waitForSelector(personalizePage.xpathContainerCustomOption);
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_add_custom_option,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      if (customOptionType === "Text field" || customOptionType === "Text area") {
        await test.step(
          "Nhập giá trị 123@ vào trường Default value," +
            " Tại trường Allow the following character tick chọn Characters",
          async () => {
            await productPage.addCustomOptionOnEditor(previewCustomOption.custom_option_error_characters);
            await expect(
              await dashboard.locator(personalizePage.xpathMessageError("Default value (prefill on storefront)")),
            ).toHaveText(previewCustomOption.custom_option_error_characters.error_message);
          },
        );

        await test.step(
          "Nhập giá trị abc vào trường Default value," + " Tại trường Allow the following character tick chọn Numbers",
          async () => {
            await productPage.addCustomOptionOnEditor(previewCustomOption.custom_option_error_numbers);
            await expect(
              await dashboard.locator(personalizePage.xpathMessageError("Default value (prefill on storefront)")),
            ).toHaveText(previewCustomOption.custom_option_error_numbers.error_message);
          },
        );

        await test.step(
          "Nhập giá trị 123a vào trường Default value," +
            " Tại trường Allow the following character tick chọn Special Characters",
          async () => {
            await productPage.addCustomOptionOnEditor(previewCustomOption.custom_option_error_emoji);
            await expect(
              await dashboard.locator(personalizePage.xpathMessageError("Default value (prefill on storefront)")),
            ).toHaveText(previewCustomOption.custom_option_error_emoji.error_message);
          },
        );
      }

      await test.step("Input các giá trị vào trong màn custom option detail", async () => {
        for (let i = 0; i < customOptions.length; i++) {
          await productPage.addCustomOptionOnEditor(customOptions[i]);
        }
        if (customOptionType === "Picture choice group") {
          await personalizePage.clickElementWithLabel("a", customOptions[0].custom_name);
        }
        await personalizePage.waitBtnEnable("Save");
        await dashboard.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_custom_option_data,
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
        if (await personalizePage.checkButtonVisible("Leave page")) {
          await personalizePage.clickOnBtnWithLabel("Leave page");
        }
        await dashboard.waitForSelector(personalizePage.xpathSectionCustomOption);
        await dashboard.locator(personalizePage.xpathSectionCustomOption).scrollIntoViewIfNeeded({ timeout: 3000 });
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

      await test.step("View product ngoài SF", async () => {
        campaignSF = new Campaign(dashboard, conf.suiteConf.domain);
        homPageSF = new SFHome(dashboard, conf.suiteConf.domain);
        productPageSF = new SFProduct(dashboard, conf.suiteConf.domain);
        await homPageSF.searchThenViewProduct(productInfo.title);
        await dashboard.waitForSelector(personalizePage.xpathImgeProduct, { timeout: 5000 });
        await dashboard.waitForSelector(personalizePage.xpathImageCarousel);
        await productPageSF.waitForElementVisibleThenInvisible(productPageSF.xpathIconLoadImage);
        await waitForImageLoaded(dashboard, personalizePage.getXpathMainImageOnSF(productInfo.title));
        await productPageSF.waitForImagesMockupLoaded();
        await productPageSF.waitForImagesDescriptionLoaded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathAllCustomOptionSF,
          snapshotName: snapshotName.custom_option_sf,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Nhập value vào custom option > click button Preview your design", async () => {
        for (let i = 0; i < customOptionShowSF.list_custom.length; i++) {
          await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF.list_custom[i]);
        }
        await productPageSF.clickOnBtnWithLabel("Preview your design");
        await dashboard.waitForTimeout(5000);
        await productPageSF.waitForElementVisibleThenInvisible(productPageSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPopupLivePreview(),
          snapshotName: snapshotName.preview_image_sf,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("[Create preview image] Check các button khi tạo preview image @SB_PRO_SBP_1561", async ({
    dashboard,
    conf,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layer = conf.caseConf.layer;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const customOptionBlankTargetLayer = conf.caseConf.custom_option_blank_target_layer;
    await personalizePage.addNewProductWithData(productInfo);
    await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);

    await test.step("Không upload mockup image", async () => {
      await personalizePage.clickOnBtnWithLabel("Create Preview image");
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Print file"))).toBeEnabled();
    });

    await test.step("Upload mockup thành công, không add layer cho preview image", async () => {
      await personalizePage.page.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Preview image"),
        `./data/shopbase/${imagePreview}`,
      );
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Print file"))).toBeEnabled();
    });

    await test.step("Click button Add text -> Bỏ trống field Text", async () => {
      await personalizePage.clickOnBtnWithLabel("Add text");
      await dashboard.locator(personalizePage.xpathLayer(layer.layer_name)).click({ timeout: 3000 });
      await dashboard.waitForTimeout(2000);
      await personalizePage.inputFieldWithLabel("", "Add your text", "");
      await dashboard.waitForTimeout(4000);
      await dashboard.locator(personalizePage.xpathIconBack).click();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(
        await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Print file")),
      ).toBeDisabled();
    });

    await test.step(" Click button Add text -> add layer thành công ->  không add custom option", async () => {
      await dashboard.locator(personalizePage.xpathLayer(layer.layer_name)).click({ timeout: 3000 });
      await personalizePage.inputFieldWithLabel("", "Add your text", layer.layer_value);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Print file"))).toBeEnabled();
    });

    await test.step("Click icon Add custom option -> bỏ trống field Target Layers", async () => {
      await dashboard.click(productPage.xpathIconExpand);
      await productPage.clickOnBtnWithLabel("Customize layer", 1);
      await productPage.addCustomOptionOnEditor(customOptionBlankTargetLayer);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(
        await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Print file")),
      ).toBeDisabled();
    });

    await test.step("Click button Add text -> add layer thành công > Click icon Add custom option -> add custom option thành công", async () => {
      await productPage.clickOnBtnWithLabel("Cancel", 3);
      await productPage.addCustomOptionOnEditor(customOptionInfo);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeEnabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Print file"))).toBeEnabled();
    });
  });

  test("[Create preview image] Check btn Cancel trong màn hình preview khi product đã có preview @SB_PRO_SBP_1565", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layer = conf.caseConf.layer;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const validateButtonCancel = conf.caseConf.validate_button_cancel;
    await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
    await personalizePage.addLayer(layer);
    await dashboard.click(productPage.xpathIconExpand);
    await productPage.clickOnBtnWithLabel("Customize layer", 1);
    await productPage.addCustomOptionOnEditor(customOptionInfo);
    await personalizePage.clickOnBtnWithLabel("Save");
    await personalizePage.clickOnBtnWithLabel("Cancel");

    for (let i = 0; i < validateButtonCancel.length; i++) {
      await test.step("Tại block Preview Images -> Click icon Edit > Click vào btn Cancel", async () => {
        await personalizePage.gotoProductDetail(productInfo.title);
        // await dashboard.locator(personalizePage.xpathPreviewImageWithLabel("Preview Images")).hover();
        await dashboard.locator(personalizePage.xpathIconActionPreviewImageWithLabel("Preview Images", 2)).click();
        if (validateButtonCancel[i].layer) {
          await personalizePage.addLayer(validateButtonCancel[i].layer);
        }
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPopupCancelOnEditor,
          snapshotName: validateButtonCancel[i].snapshot_name.preview_image_cancel_popup,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click btn cancel trên popup", async () => {
        await personalizePage.clickOnBtnWithLabel("Cancel", 2);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathLoadSpinner);
        await personalizePage.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: validateButtonCancel[i].snapshot_name.preview_image_page,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click btn Leave page trên popup", async () => {
        await personalizePage.clickOnBtnWithLabel("Cancel", 1);
        await personalizePage.clickOnBtnWithLabel("Leave page");
        await expect(
          await dashboard.locator(personalizePage.xpathPreviewImageWithLabel("Preview Images")),
        ).toBeVisible();
      });
    }
  });
});
