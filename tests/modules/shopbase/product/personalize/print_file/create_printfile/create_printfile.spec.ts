import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { Personalize } from "@pages/dashboard/personalize";
import { loadData } from "@core/conf/conf";
import { Campaign } from "@sf_pages/campaign";
import { SFHome } from "@sf_pages/homepage";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@sf_pages/checkout";
import { SFProduct } from "@sf_pages/product";

let productPage: ProductPage;
let personalizePage: Personalize;
let campaignSF: Campaign;
let homPageSF: SFHome;
let ordersPage: OrdersPage;
let productPageSF: SFProduct;
let checkoutSF: SFCheckout;
let maxDiffPixelRatio;
let threshold;
let maxDiffPixels;
let snapshotName;
let shippingInfo;
let cardInfo;
let orderName: string;
let SFPage;
let newPage;

test.describe("Create print file", async () => {
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

  test("[Create print file] Check Upload mockup cho print file @SB_PRO_SBP_1592", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imageInvalid = conf.caseConf.image_invalid;
    // const imageMore60MB = conf.caseConf.image_more_60MB;
    const imagePreview = conf.caseConf.image_preview;
    snapshotName = conf.caseConf.snapshot_name;
    const imageReplace = conf.caseConf.image_replace;
    await productPage.addNewProductWithData(productInfo);
    await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);

    await test.step(
      "Click vào btn Create Print file > Upload mockup print file > " + "Upload image khác format: .PNG, .JPG, .JPEG",
      async () => {
        await personalizePage.clickOnBtnWithLabel("Create Print file");
        await dashboard.setInputFiles(
          personalizePage.xpathBtnUploadMockup("Upload your Print template"),
          `./data/shopbase/${imageInvalid.image_upload}`,
        );
        await personalizePage.isToastMsgVisible(imageInvalid.message_error);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      },
    );

    // await test.step(`Upload image > 60MB`, async () => {
    //   await prepareFile(imageMore60MB.s3_path, imageMore60MB.file_path);
    //   await dashboard.setInputFiles(
    //     personalizePage.xpathBtnUploadMockup("Upload your Print template"),
    //     imageMore60MB.file_path,
    //   );
    //   await personalizePage.isToastMsgVisible(imageMore60MB.message_error);
    //   await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
    // });

    await test.step(`Upload image đúng format: .PNG, .JPG, .JPEG và <= 60MB`, async () => {
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Print template"),
        `./data/shopbase/${imagePreview}`,
      );
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      if (await dashboard.locator(personalizePage.xpathProgressUploadImage).isVisible({ timeout: 5000 })) {
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
      }
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.print_file_image,
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
        snapshotName: snapshotName.print_file_delete_mockup,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click vào icon Replace image", async () => {
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Print template"),
        `./data/shopbase/${imagePreview}`,
      );
      const [fileChooser] = await Promise.all([
        dashboard.waitForEvent("filechooser"),
        dashboard.locator(personalizePage.xpathActionImageWithLabel("Replace")).click(),
      ]);
      await fileChooser.setFiles(`./data/shopbase/${imageReplace}`);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
      await dashboard.click(personalizePage.xpathImageEditor);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.print_file_replace_mockup,
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
      const layerList = addLayer.layers;
      const layerDelete = addLayer.layer_delete;
      snapshotName = addLayer.snapshot_name;

      await test.step("Click vào btn Create Print file > Upload mockup print file", async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
          productInfo,
          imagePreview,
          "Create Print file",
        );
        await personalizePage.waitBtnEnable("Next, create Preview");
        await dashboard.locator(personalizePage.xpathHeaderEditor).click();
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.print_file,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      if (addLayer.case_id !== "SB_PRO_SBP_1597") {
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
            snapshotName: snapshotName.print_file_add_text,
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
            snapshotName: snapshotName.print_file_layer_data,
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
            snapshotName: snapshotName.print_file_layer_edit_name,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });

        await test.step("Edit các value trong màn hình layer detail", async () => {
          await personalizePage.addLayer(layer);
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalizePage.xpathPreviewPage,
            snapshotName: snapshotName.print_file_layer_edit_data,
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
            snapshotName: snapshotName.print_file_reset_all,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
          await dashboard.locator(personalizePage.xpathIconBack).click();
        });
      }

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
          snapshotName: snapshotName.print_file_layer_list,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      if (addLayer.case_id === "SB_PRO_SBP_1597") {
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
            snapshotName: snapshotName.print_file_drag_drop_layer,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });

        await test.step("Delete layer ", async () => {
          await dashboard.waitForTimeout(3000);
          await personalizePage.deleteLayers(layerDelete);
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalizePage.xpathPreviewPage,
            snapshotName: snapshotName.print_file_delete_layer,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });
      }
    });
  }
});

test.describe("Setup custom option print file", async () => {
  const conf2 = loadData(__dirname, "SETUP_CUSTOM_OPTION");
  for (let i = 0; i < conf2.caseConf.data.length; i++) {
    const printFileCustomOption = conf2.caseConf.data[i];

    test.beforeEach(async ({ conf, dashboard }, testInfo) => {
      testInfo.snapshotSuffix = "";
      testInfo.snapshotDir = snapshotDir(__filename);
      test.setTimeout(conf.suiteConf.timeout);
      maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      threshold = conf.suiteConf.threshold;
      maxDiffPixels = conf.suiteConf.max_diff_pixels;
      shippingInfo = conf.suiteConf.customer_info;
      cardInfo = conf.suiteConf.card_info;
      personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
      productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    });

    test(`${printFileCustomOption.description} @${printFileCustomOption.case_id}`, async ({
      dashboard,
      context,
      conf,
      snapshotFixture,
    }) => {
      const productInfo = printFileCustomOption.product_all_info;
      const imagePreview = printFileCustomOption.image_preview;
      const layerList = printFileCustomOption.layers;
      const customOptions = printFileCustomOption.custom_option_info;
      const customOptionShowSF = printFileCustomOption.custom_option_data_SF;
      const customOptionType = printFileCustomOption.custom_option_type;
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      snapshotName = printFileCustomOption.snapshot_name;
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      }
      await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview, "Create Print file");

      await test.step("Click vào add layer text cho print file", async () => {
        for (let i = 0; i < layerList.length; i++) {
          await personalizePage.addLayer(layerList[i]);
          await expect(await dashboard.locator(personalizePage.xpathLayer(layerList[i].layer_name))).toBeVisible();
        }
      });

      await test.step("Click vào btn Customize layer", async () => {
        await dashboard.click(productPage.xpathIconExpand);
        await productPage.clickOnBtnWithLabel("Customize layer", 1);
        await dashboard.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.print_file_add_custom_option,
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
            await productPage.addCustomOptionOnEditor(printFileCustomOption.custom_option_error_characters);
            await expect(personalizePage.defaultValueFieldMsg).toHaveText(
              printFileCustomOption.custom_option_error_characters.error_message,
            );
          },
        );

        await test.step(
          "Nhập giá trị abc vào trường Default value," + " Tại trường Allow the following character tick chọn Numbers",
          async () => {
            await productPage.addCustomOptionOnEditor(printFileCustomOption.custom_option_error_numbers);
            await expect(personalizePage.defaultValueFieldMsg).toHaveText(
              printFileCustomOption.custom_option_error_numbers.error_message,
            );
          },
        );

        await test.step(
          "Nhập giá trị 123a vào trường Default value," +
            " Tại trường Allow the following character tick chọn Special Characters",
          async () => {
            await productPage.addCustomOptionOnEditor(printFileCustomOption.custom_option_error_emoji);
            await expect(personalizePage.defaultValueFieldMsg).toHaveText(
              printFileCustomOption.custom_option_error_emoji.error_message,
            );
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
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.print_file_custom_option_data,
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
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProductDetailLoading);
        await dashboard.waitForSelector(personalizePage.xpathSectionCustomOption);
        await dashboard.locator(personalizePage.xpathSectionCustomOption).scrollIntoViewIfNeeded({ timeout: 3000 });
        await personalizePage.waitXpathPreviewImageWithLabel("Print Files");
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProductDetailLoading);
        await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Print Files"));
        await personalizePage.removeBlockTitleDescription();
        await waitForImageLoaded(dashboard, personalizePage.xpathPreviewImageWithLabel("Print Files"));
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalizePage.xpathSectionCustomOption,
          snapshotName: snapshotName.print_file_block_custom_option,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step(
        "View product ngoài SF > Input custom option > Add product vào cart > " +
          "Buyer checkout thành công với product đã tạo print file",
        async () => {
          [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
          campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
          homPageSF = new SFHome(SFPage, conf.suiteConf.domain);
          const checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
          await SFPage.waitForSelector(personalizePage.xpathCOSF);
          for (let i = 0; i < customOptionShowSF.list_custom.length; i++) {
            await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF.list_custom[i]);
          }
          await campaignSF.clickOnBtnWithLabel("Add to cart");
          await homPageSF.gotoCheckout();
          await checkout.enterShippingAddress(shippingInfo);
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithCardInfo(cardInfo);
          orderName = await checkout.getOrderName();
        },
      );

      await test.step("Tại dashboard -> Đi đi màn Order list /admin/orders > Open oder detail mới tạo", async () => {
        await productPage.navigateToMenu("Orders");
        await ordersPage.searchOrder(orderName);
        await ordersPage.goToOrderDetailSBase(orderName);
        await dashboard.waitForSelector(personalizePage.getXpathImageProductInOrderDetail(productInfo.title));
        const checkLinkText = await dashboard
          .locator(personalizePage.xpathLinkTextPrintFile("Generate print file"))
          .isVisible();
        if (checkLinkText === true) {
          await dashboard.click(personalizePage.xpathLinkTextPrintFile("Generate print file"));
          await personalizePage.clickRadioButtonWithLabel("No, only generate for this ordered");
          await personalizePage.clickOnBtnWithLabel("Generate");
          await dashboard.waitForSelector(personalizePage.getXpathImageProductInOrderDetail(productInfo.title));
          await dashboard.reload();
        }
        await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
        await waitForImageLoaded(dashboard, personalizePage.getXpathImageProductInOrderDetail(productInfo.title));
        if (customOptionType !== "Image") {
          await snapshotFixture.verify({
            page: dashboard,
            selector: ordersPage.xpathBlockFulfill,
            snapshotName: snapshotName.print_file_block_generate_file,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        }
      });

      await test.step("Click icon Action bên canh text Print file has been generated -> Click button Preview", async () => {
        await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 20);
        await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
        [newPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
        ]);
        await newPage.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: newPage,
          snapshotName: snapshotName.print_file_preview,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("[Create print file] Setup full các loại custom option cho print file @SB_PRO_SBP_1609", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const customOptionShowSF = conf.caseConf.custom_option_data_SF;
    const customOptionType = conf.caseConf.custom_option_type;
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    snapshotName = conf.caseConf.snapshot_name;

    await personalizePage.navigateToMenu("Products");
    await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview, "Create Print file");

    await test.step("Click vào add layer text cho print file", async () => {
      for (let i = 0; i < layerList.length; i++) {
        await personalizePage.addLayer(layerList[i]);
        await expect(await dashboard.locator(personalizePage.xpathLayer(layerList[i].layer_name))).toBeVisible();
      }
    });

    await test.step("Click vào btn Customize layer", async () => {
      await dashboard.click(productPage.xpathIconExpand);
      await productPage.clickOnBtnWithLabel("Customize layer", 1);
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.print_file_add_custom_option,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Input các giá trị vào trong màn custom option detail", async () => {
      for (let i = 0; i < customOptions.length; i++) {
        await productPage.addCustomOptionOnEditor(customOptions[i]);
      }
      if (customOptionType === "Picture choice group") {
        await personalizePage.clickElementWithLabel("a", customOptions[0].custom_name);
      }
      await personalizePage.waitBtnEnable("Save");
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.print_file_custom_option_data,
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
      await dashboard.locator(personalizePage.xpathSectionCustomOption).scrollIntoViewIfNeeded({ timeout: 3000 });
      await personalizePage.waitXpathPreviewImageWithLabel("Print Files");
      await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Print Files"), {
        timeout: 5000,
      });
      await dashboard.waitForTimeout(6000);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: personalizePage.xpathSectionCustomOption,
        snapshotName: snapshotName.print_file_block_custom_option,
        sizeCheck: true,
      });
    });

    await test.step(
      "View product ngoài SF > Input custom option > Add product vào cart > " +
        "Buyer checkout thành công với product đã tạo print file",
      async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        homPageSF = new SFHome(SFPage, conf.suiteConf.domain);
        const checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        for (let i = 0; i < customOptionShowSF.list_custom.length; i++) {
          await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF.list_custom[i]);
        }
        await SFPage.locator(campaignSF.getXpathWithLabel("Description")).scrollIntoViewIfNeeded();
        await campaignSF.clickOnBtnWithLabel("Add to cart");
        await homPageSF.gotoCheckout();
        await checkout.enterShippingAddress(shippingInfo);
        await checkout.continueToPaymentMethod();
        await checkout.completeOrderWithCardInfo(cardInfo);
        orderName = await checkout.getOrderName();
      },
    );

    await test.step("Verify generate print file thành công và có thể preview được", async () => {
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 25);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ordersPage.xpathBlockFulfill,
        snapshotName: snapshotName.print_file_block_generate_file,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click icon Action bên canh text Print file has been generated -> Click button Preview", async () => {
      await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
      [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
      ]);
      await newPage.waitForTimeout(5000);
      await snapshotFixture.verify({
        page: newPage,
        snapshotName: snapshotName.print_file_preview,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Create print file] Check các button khi tạo print file @SB_PRO_SBP_1612", async ({ dashboard, conf }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layer = conf.caseConf.layer;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const customOptionBlankTargetLayer = conf.caseConf.custom_option_blank_target_layer;
    await personalizePage.navigateToMenu("Products");
    await personalizePage.addNewProductWithData(productInfo);
    await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);

    await test.step("Không upload mockup print file", async () => {
      await personalizePage.clickOnBtnWithLabel("Create Print file");
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Preview"))).toBeEnabled();
    });

    await test.step("Upload mockup thành công, không add layer cho preview image", async () => {
      await personalizePage.page.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Print template"),
        `./data/shopbase/${imagePreview}`,
      );
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Preview"))).toBeEnabled();
    });

    await test.step("Click button Add text -> Bỏ trống field Text", async () => {
      await personalizePage.clickOnBtnWithLabel("Add text");
      await dashboard.locator(personalizePage.xpathLayer(layer.layer_name)).click({ timeout: 3000 });
      await dashboard.waitForTimeout(2000);
      await personalizePage.inputFieldWithLabel("", "Add your text", "");
      await dashboard.waitForTimeout(4000);
      await dashboard.locator(personalizePage.xpathIconBack).click();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Preview"))).toBeDisabled();
    });

    await test.step(" Click button Add text -> add layer thành công ->  không add custom option", async () => {
      await dashboard.locator(personalizePage.xpathLayer(layer.layer_name)).click({ timeout: 3000 });
      await personalizePage.inputFieldWithLabel("", "Add your text", layer.layer_value);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Preview"))).toBeEnabled();
    });

    await test.step("Click icon Add custom option -> bỏ trống field Target Layers", async () => {
      await dashboard.click(productPage.xpathIconExpand);
      await productPage.clickOnBtnWithLabel("Customize layer", 1);
      await productPage.addCustomOptionOnEditor(customOptionBlankTargetLayer);
      if (await productPage.checkButtonVisible("Cancel", 3)) {
        await productPage.clickOnBtnWithLabel("Cancel", 3);
      }
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeDisabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Preview"))).toBeDisabled();
    });

    await test.step("Click button Add text -> add layer thành công > Click icon Add custom option -> add custom option thành công", async () => {
      // await dashboard
      //   .locator(personalizePage.xpathCustomOptionName(customOptionInfo.custom_name))
      //   .click({ timeout: 3000 });
      await productPage.addCustomOptionOnEditor(customOptionInfo);
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Save"))).toBeEnabled();
      await expect(await dashboard.locator(personalizePage.xpathBtnWithLabel("Next, create Preview"))).toBeEnabled();
    });
  });

  test("Tạo product có cả preview và print file @SB_PRO_SBP_1618", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const imagePrintFile = conf.caseConf.image_print_file;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const customOptionShowSF = conf.caseConf.custom_option_data_SF;
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    snapshotName = conf.caseConf.snapshot_name;

    await personalizePage.navigateToMenu("Products");
    await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview);

    await test.step("Click vào btn để add layer cho preview image", async () => {
      for (let i = 0; i < layerList.length; i++) {
        await personalizePage.addLayer(layerList[i]);
        await expect(await dashboard.locator(personalizePage.xpathLayer(layerList[i].layer_name))).toBeVisible();
      }
    });

    await test.step("Click vào btn Customize layer", async () => {
      await dashboard.click(productPage.xpathIconExpand);
      await productPage.clickOnBtnWithLabel("Customize layer", 1);
      for (let i = 0; i < customOptions.length; i++) {
        await productPage.addCustomOptionOnEditor(customOptions[i]);
      }
      await personalizePage.waitBtnEnable("Save");
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

    await test.step("Click vào Next step: Create Print file > Upload mockup print file", async () => {
      await personalizePage.clickOnBtnWithLabel("Next, create Print file");
      await dashboard.waitForSelector(personalizePage.xpathHeaderEditor);
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Print template"),
        `./data/shopbase/${imagePrintFile}`,
      );
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      if (
        await dashboard
          .locator("(//div[@class='editor__container']//span[@class='extend-progress'])[1]")
          .isVisible({ timeout: 5000 })
      ) {
        await personalizePage.waitForElementVisibleThenInvisible(
          "(//div[@class='editor__container']//span[@class='extend-progress'])[1]",
        );
      }
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.print_file_image,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click vào btn Save >  Verify list custom option trong màn hình product detail", async () => {
      await personalizePage.clickOnBtnWithLabel("Save");
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await personalizePage.clickOnBtnWithLabel("Cancel");
      await dashboard.waitForSelector(personalizePage.xpathSectionCustomOption);
      await dashboard.locator(personalizePage.xpathSectionCustomOption).scrollIntoViewIfNeeded({ timeout: 3000 });
      await personalizePage.waitXpathPreviewImageWithLabel("Preview Images");
      await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Preview Images"));
      await waitForImageLoaded(dashboard, personalizePage.xpathPreviewImageWithLabel("Preview Images"));
      await personalizePage.waitXpathPreviewImageWithLabel("Print Files");
      await dashboard.waitForSelector(personalizePage.xpathPreviewImageWithLabel("Print Files"));
      await waitForImageLoaded(dashboard, personalizePage.xpathPreviewImageWithLabel("Print Files"));
      await personalizePage.removeBlockTitleDescription();
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathSectionCustomOption,
        snapshotName: snapshotName.block_custom_option_product_detail,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
        sizeCheck: true,
      });
    });

    await test.step("View product ngoài SF >Nhập giá trị vào các custom option > click button Preview your design", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      homPageSF = new SFHome(SFPage, conf.suiteConf.domain);
      productPageSF = new SFProduct(SFPage, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(SFPage, conf.suiteConf.domain);
      await SFPage.waitForSelector(personalizePage.xpathCOSF);
      for (let i = 0; i < customOptionShowSF.list_custom.length; i++) {
        await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF.list_custom[i]);
      }
      await SFPage.locator(campaignSF.getXpathWithLabel("Add to cart")).scrollIntoViewIfNeeded();
      await productPageSF.clickOnBtnWithLabel("Preview your design");
      await SFPage.waitForTimeout(10000);
      await campaignSF.waitForElementVisibleThenInvisible(productPageSF.xpathIconLoadImage);
      await snapshotFixture.verify({
        page: SFPage,
        selector: productPageSF.xpathPopupLivePreview(),
        snapshotName: snapshotName.preview_image_sf,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await SFPage.click(productPageSF.xpathBtbClose);
    });

    await test.step("View product ngoài SF >Nhập giá trị vào các custom option > click button Preview your design", async () => {
      await SFPage.locator(campaignSF.getXpathWithLabel("Description")).scrollIntoViewIfNeeded();
      await campaignSF.clickOnBtnWithLabel("Add to cart");
      await homPageSF.gotoCheckout();
      await checkoutSF.enterShippingAddress(shippingInfo);
      await checkoutSF.continueToPaymentMethod();
      await checkoutSF.completeOrderWithCardInfo(cardInfo);
      orderName = await checkoutSF.getOrderName();
    });

    await test.step("Verify generate print file thành công và có thể preview được", async () => {
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 15);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ordersPage.xpathBlockFulfill,
        snapshotName: snapshotName.print_file_block_generate_file,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click icon Action bên canh text Print file has been generated -> Click button Preview", async () => {
      await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
      [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
      ]);
      await newPage.waitForTimeout(5000);
      await snapshotFixture.verify({
        page: newPage,
        snapshotName: snapshotName.print_file_preview,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
