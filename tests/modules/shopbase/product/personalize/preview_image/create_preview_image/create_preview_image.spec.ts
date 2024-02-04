import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { ProductPage } from "@pages/dashboard/products";
import { Personalize } from "@pages/dashboard/personalize";
import { prepareFile } from "@helper/file";
import { loadData } from "@core/conf/conf";

test.describe("Create preview image for Sbase", () => {
  let productPage: ProductPage;
  let personalizePage: Personalize;
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

  test("[Create preview]Check Upload mockup preview cho preview image @SB_PRO_SBP_1540", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imageInvalid = conf.caseConf.image_invalid;
    const imageMore20MB = conf.caseConf.image_more_20MB;
    const imagePreview = conf.caseConf.image_preview;
    const imageReplace = conf.caseConf.image_replace;
    snapshotName = conf.caseConf.snapshot_name;
    await productPage.addNewProductWithData(productInfo);
    if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    }

    await test.step("Click vào btn Create Preview image", async () => {
      await personalizePage.clickOnBtnWithLabel("Create Preview image");
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await personalizePage.waitUntilElementVisible(personalizePage.xpathImageEmptyPreviewPage);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_default,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button Upload your preview images > Upload image khác format: .PNG, .JPG, .JPEG", async () => {
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Preview image"),
        `./data/shopbase/${imageInvalid.image_upload}`,
      );
      await personalizePage.isToastMsgVisible(imageInvalid.message_error);
      if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      }
    });

    await test.step("Click button Upload your preview images > Upload image > 20MB", async () => {
      await prepareFile(imageMore20MB.s3_path, imageMore20MB.file_path);
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Preview image"),
        imageMore20MB.file_path,
      );
      await personalizePage.isToastMsgVisible(imageMore20MB.message_error);
      if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      }
    });

    await test.step(
      "Click button Upload your preview images > Upload image đúng " + "format: .PNG, .JPG, .JPEG và <= 20MB",
      async () => {
        await dashboard.setInputFiles(
          personalizePage.xpathBtnUploadMockup("Upload your Preview image"),
          `./data/shopbase/${imagePreview}`,
        );
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
        if (await dashboard.locator(personalizePage.xpathProgressUploadImage).isVisible({ timeout: 5000 })) {
          await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click vào icon Replace image", async () => {
      const [fileChooser] = await Promise.all([
        dashboard.waitForEvent("filechooser"),
        dashboard.locator("//div[@id= 'editor-content']//span[@data-label='Replace Preview image']//i").click(),
      ]);
      await fileChooser.setFiles(`./data/shopbase/${imageReplace}`, { timeout: 150000 });
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
      await dashboard.click(personalizePage.xpathImageEditor);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_replace_mockup,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click icon Delete mockup", async () => {
      await personalizePage.clickOnIconDeleteMockup();
      await personalizePage.waitUntilElementVisible(personalizePage.xpathImageEmptyPreviewPage);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_delete_mockup,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  const conf = loadData(__dirname, "ADD_NEW_LAYER");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const addLayer = conf.caseConf.data[i];

    test(`${addLayer.description} @${addLayer.case_id}`, async ({ dashboard, snapshotFixture }) => {
      const productInfo = addLayer.product_all_info;
      const imagePreview = addLayer.image_preview;
      const addLayerType = addLayer.add_layer;
      const layer = addLayer.layer;
      snapshotName = addLayer.snapshot_name;

      await test.step("Click vào btn Create Preview image> Click button Upload your preview images -> Upload mockup preview", async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      if (addLayerType === "Image") {
        await test.step("Click vào Add image > upload file khác các định dạng .jpg, .jpeg, .png", async () => {
          await dashboard
            .locator(personalizePage.xpathInputLayerImage)
            .setInputFiles(`./data/shopbase/${layer.image_invalid}`);
          await expect(
            await dashboard.locator(personalizePage.xpathLayer(layer.image_invalid.replace(".psd", ""))).isVisible(),
          ).toBe(false);
        });
      }

      await test.step(`Click vào btn Add ${addLayerType.layer_type.toLowerCase()}`, async () => {
        await personalizePage.addLayer(addLayerType);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_add_text,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click vào layer name", async () => {
        await dashboard.locator(personalizePage.xpathLayer(layer.layer_name)).click({ timeout: 3000 });
        await dashboard.waitForSelector("//div[@class='row flex editor__toolbar']");
        await dashboard.waitForSelector(personalizePage.xpathPreviewPage);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_layer_data,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Edit layer name", async () => {
        await personalizePage.editLayerName(layer.layer_name, layer.layer_name_edit);
        await dashboard.locator(personalizePage.xpathIconBack).click();
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_layer_edit_name,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Edit các value trong màn hình layer detail", async () => {
        await personalizePage.addLayer(layer);
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_layer_edit_data,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click vào btn Reset all", async () => {
        await personalizePage.clickOnBtnWithLabel("Reset all");
        await dashboard.locator(personalizePage.xpathLayerName(layer.layer_name)).scrollIntoViewIfNeeded();
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_reset_all,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  const conf2 = loadData(__dirname, "ADD_MULTI_LAYER");
  for (let i = 0; i < conf2.caseConf.data.length; i++) {
    const addMultiLayer = conf2.caseConf.data[i];

    test(`${addMultiLayer.description} @${addMultiLayer.case_id}`, async ({ dashboard, snapshotFixture }) => {
      const productInfo = addMultiLayer.product_all_info;
      const imagePreview = addMultiLayer.image_preview;
      const layerList = addMultiLayer.layers;
      snapshotName = addMultiLayer.snapshot_name;

      await test.step("Click vào btn Create Preview image> Click button Upload your preview images -> Upload mockup preview", async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click vào btn add các layer cho preview image", async () => {
        for (let i = 0; i < layerList.length; i++) {
          await productPage.addLayer(layerList[i]);
          await expect(await dashboard.locator(personalizePage.xpathLayer(layerList[i].layer_name))).toBeVisible();
        }
      });

      await test.step("Back lại màn hình list layer", async () => {
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.preview_image_layer_list,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("[Create preview image] Check các action đối với layer @SB_PRO_SBP_1547", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const layerDelete = conf.caseConf.layer_delete;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step(
      "Click vào btn Create Preview image> Click button Upload your preview images -> " +
        "Upload mockup preview > Add 4 layer text và 3 layer image cho mockup preview",
      async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);
        for (let i = 0; i < layerList.length; i++) {
          await productPage.addLayer(layerList[i]);
        }
      },
    );

    await test.step("Hover chuột vào biểu tượng con mắt bên cạnh layer", async () => {
      await dashboard.locator(personalizePage.xpathIconEyeLayer(layerList[0].layer_name)).hover();
      await expect(await dashboard.locator(personalizePage.xpathToolTipOfLayer(layerList[0].layer_name))).toHaveText(
        conf.caseConf.tooltip_eye_layer,
      );
    });

    await test.step("Click vào biểu tượng con mắt bên cạnh layer để ẩn layer đó", async () => {
      await dashboard.locator(personalizePage.xpathIconEyeLayer(layerList[0].layer_name)).click();
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_hide_layer,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click lại vào vào icon con mắt bên cạnh layer để hiện layer đó", async () => {
      await dashboard.locator(personalizePage.xpathIconEyeLayer(layerList[0].layer_name)).click();
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_show_layer,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Check drag/drop giữa các layer", async () => {
      await dashboard.locator(personalizePage.xpathCustomOption).click();
      await personalizePage.dragAndDrop({
        from: {
          selector: personalizePage.xpathIconDragOfLayer(layerList[1].layer_name),
        },
        to: {
          selector: personalizePage.xpathIconDragOfLayer(layerList[3].layer_name),
        },
      });
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_drag_drop_layer,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Delete layer ", async () => {
      for (let i = 0; i < layerDelete.length; i++) {
        await personalizePage.deleteLayerOnEditor(layerDelete[i]);
      }
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.preview_image_delete_layer,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
