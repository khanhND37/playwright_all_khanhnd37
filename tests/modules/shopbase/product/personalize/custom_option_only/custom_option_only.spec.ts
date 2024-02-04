import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { ProductPage } from "@pages/dashboard/products";
import { snapshotDir } from "@utils/theme";
import { Campaign } from "@sf_pages/campaign";
import { SFHome } from "@sf_pages/homepage";
import { Personalize } from "@pages/dashboard/personalize";
import { prepareFile } from "@helper/file";
import { SFProduct } from "@sf_pages/product";
import { getTokenWithCredentials, TokenType } from "@utils/token";

/**
 * Config shop :
 * clipart folder : test (image1.jepg, image2.png,  image2.png)
 * clipart group : test (folder : test)
 */
test.describe("Custom option only for Sbase", () => {
  let campaignSF: Campaign;
  let homPageSF: SFHome;

  const verifyMessageError = async (personalize: Personalize, dashboard, label, message): Promise<void> => {
    if (message) {
      await expect(dashboard.locator(personalize.xpathMessageError(label))).toHaveText(message);
    }
  };

  const verifyCustomOptionData = async (customOptionData, customOption): Promise<boolean> => {
    for (let i = 0; i < Object.keys(customOptionData).length; i++) {
      for (const key in customOption) {
        switch (key) {
          case "allowed_characters":
            if (JSON.stringify(customOptionData.validations[key]) !== JSON.stringify(customOption[key])) {
              return false;
            }
            break;
          case "values":
          case "p_o_d_data":
            delete customOptionData.p_o_d_data.clipart_id;
            if (JSON.stringify(customOptionData[key]) !== JSON.stringify(customOption[key])) {
              return false;
            }
            break;
          case "clipart_type":
            if (customOptionData.p_o_d_data[key] !== customOption[key]) {
              return false;
            }
            break;
          default:
            if (customOptionData[key] !== customOption[key]) {
              return false;
            }
            break;
        }
      }
    }
    return true;
  };

  const addCustomOption = async (productPage: ProductPage, messageSuccess, customOption): Promise<void> => {
    await productPage.addNewCustomOptionWithData(customOption);
    await productPage.clickOnBtnWithLabel("Save changes");
    await productPage.isToastMsgVisible(messageSuccess);
    await productPage.waitForToastMessageHide(messageSuccess);
  };

  test.beforeEach(async ({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const customOption = conf.caseConf.data[i];

    test(`${customOption.description} @${customOption.case_id}`, async ({
      dashboard,
      conf,
      authRequest,
      context,
      snapshotFixture,
    }) => {
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      const personalize = new Personalize(dashboard, conf.suiteConf.domain);
      const productInfo = customOption.product_all_info;
      const customOptionDataBlankSF = customOption.custom_option_blank_field_SF;
      const customOptionInvalidSF = customOption.custom_option_invalid_SF;
      const customOptionDataSF = customOption.custom_option_data_SF;
      const customOptionType = customOption.custom_option_blank_field.type;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;

      await test.step("Pre condition: Vào màn hình All products tạo mới products", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.deleteProduct(conf.suiteConf.password);
        if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
        await productPage.addNewProductWithData(productInfo);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      });

      await test.step(
        "Click vào btn Create custom option only" + " sau đó verify màn hình custom option detail",
        async () => {
          await productPage.clickBtnCustomOptionOnly();
          //select custom option type
          await dashboard.locator(personalize.xpathType).scrollIntoViewIfNeeded();
          await dashboard.selectOption(personalize.xpathType, { label: customOptionType });
          const defaultData = customOption.custom_option_blank_field.default_data;
          await dashboard.waitForSelector(personalize.xpathValidate);
          await expect(dashboard.locator(personalize.xpathDataCO())).toBeVisible();
          expect(
            await dashboard
              .frameLocator(personalize.xpathIframeCO())
              .locator(productPage.xpathLocatorIframe)
              .textContent(),
          ).toContain(defaultData.label_display);
          if (customOptionType === "Image") {
            expect(
              await dashboard
                .frameLocator(personalize.xpathIframeCO(2))
                .locator(productPage.xpathLocatorIframe)
                .textContent(),
            ).toContain(defaultData.help_text_optional);
            expect(await dashboard.locator(personalize.xpathInputMinSize).inputValue()).toContain(defaultData.min_size);
          }
          if (customOptionType === "Radio buttons" || customOptionType === "Droplist") {
            await snapshotFixture.verify({
              page: dashboard,
              selector: personalize.xpathBlockValue,
              snapshotName: customOption.snapshot_name[0].replaceAll("_", "-"),
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
          }
          if (customOptionType === "Droplist") {
            expect(await dashboard.locator(personalize.xpathInputPlaceholder).inputValue()).toContain(
              defaultData.placeholder,
            );
          }
          if (customOptionType === "Picture choice") {
            await snapshotFixture.verify({
              page: dashboard,
              selector: personalize.xpathBlockPictureChoice(),
              snapshotName: customOption.snapshot_name[1].replaceAll("_", "-"),
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
          }
        },
      );

      await test.step("Không input giá trị vào các trường, sau đó click btn Save changes", async () => {
        await productPage.addNewCustomOptionWithData(customOption.custom_option_blank_field);
        await productPage.clickOnBtnWithLabel("Save changes");
        const messageError = customOption.custom_option_blank_field.messageError;
        await verifyMessageError(personalize, dashboard, "Name", messageError.name);
        if (customOptionType === "Text field" || customOptionType === "Text area") {
          await verifyMessageError(
            personalize,
            dashboard,
            "Allow the following characters",
            messageError.allow_following_characters,
          );
        }
        if (customOptionType === "Radio" || customOptionType === "Checkbox") {
          await expect(dashboard.locator(personalize.xpathMessageErrorValue)).toHaveText(messageError.value);
        }
        await dashboard.locator(personalize.xpathIconDeleteCO).click();
      });

      if (customOptionType === "Text field" || customOptionType === "Text area") {
        await test.step(
          "Nhập giá trị 123@ vào trường Default value," +
            " Tại trường Allow the following character tick chọn Characters",
          async () => {
            await productPage.clickBtnCustomOptionOnly();
            await productPage.addNewCustomOptionWithData(customOption.custom_option_error_characters);
            await productPage.clickOnBtnWithLabel("Save changes");
            await verifyMessageError(
              personalize,
              dashboard,
              "Default value (prefill on storefront)",
              customOption.custom_option_error_characters.error_message,
            );
            await productPage.deleteCustomOption(customOption.custom_option_error_characters);
          },
        );

        await test.step(
          "Nhập giá trị abc vào trường Default value," + " Tại trường Allow the following character tick chọn Numbers",
          async () => {
            await productPage.clickBtnCustomOptionOnly();
            await productPage.addNewCustomOptionWithData(customOption.custom_option_error_numbers);
            await productPage.clickOnBtnWithLabel("Save changes");
            await verifyMessageError(
              personalize,
              dashboard,
              "Default value (prefill on storefront)",
              customOption.custom_option_error_numbers.error_message,
            );
            await productPage.deleteCustomOption(customOption.custom_option_error_numbers);
          },
        );

        await test.step(
          "Nhập giá trị 123a vào trường Default value," + " Tại trường Allow the following character tick chọn Emoji",
          async () => {
            await productPage.clickBtnCustomOptionOnly();
            await productPage.addNewCustomOptionWithData(customOption.custom_option_error_emoji);
            await productPage.clickOnBtnWithLabel("Save changes");
            await verifyMessageError(
              personalize,
              dashboard,
              "Default value (prefill on storefront)",
              customOption.custom_option_error_emoji.error_message,
            );
            await productPage.deleteCustomOption(customOption.custom_option_error_emoji);
          },
        );
      }

      await test.step(
        "Input các giá trị vào trong màn custom option detail," + " sau đó click vào btn Save changes",
        async () => {
          await productPage.clickBtnCustomOptionOnly();
          await productPage.addNewCustomOptionWithData(customOption.custom_option_info);
          await productPage.clickOnBtnWithLabel("Save changes");
          if (await productPage.checkLocatorVisible(productPage.xpathToastMessage)) {
            await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
          }
          await dashboard.waitForSelector(personalize.xpathTitleProduct);
          const customOptionData = await productPage.getCustomOptionData(
            authRequest,
            productInfo,
            customOption.custom_option_info,
          );
          expect(await verifyCustomOptionData(customOptionData, customOption.custom_option_data)).toBe(true);
        },
      );

      await test.step("Click vào icon mũi tên đi lên cạnh custom option name", async () => {
        await dashboard.locator(personalize.xpathCollapseCO()).scrollIntoViewIfNeeded();
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalize.xpathCollapseCO(),
          snapshotName: customOption.snapshot_name[2].replaceAll("_", "-"),
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        const checkToastMsg = await productPage.checkLocatorVisible(productPage.xpathToastMessage);
        if (checkToastMsg === true) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
        await productPage.closeCustomOption(customOption.custom_option_info);
        await dashboard.locator(personalize.xpathDataCO()).scrollIntoViewIfNeeded();
        await dashboard.waitForSelector(personalize.xpathDataCO(), { timeout: 5000 });
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: personalize.xpathDataCO(),
          snapshotName: customOption.snapshot_name[3].replaceAll("_", "-"),
          sizeCheck: true,
        });
      });

      await test.step("Click vào btn Create Preview image/Print file", async () => {
        await productPage.clickOnBtnWithLabel("Create Preview image");
        await dashboard.waitForSelector(personalize.xpathPreviewPage, { timeout: 3000 });
        await dashboard.waitForSelector(personalize.xpathImageEmptyPreviewPage);
        await dashboard.locator(personalize.xpathIconPreview).click();
        //cho hien tin anh Preview xong moi screenshot
        await dashboard.waitForSelector(personalize.xpathBlockPictureChoice());
        await dashboard.waitForSelector(personalize.xpathContainerCustomOption);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalize.xpathPreviewPage,
          snapshotName: customOption.snapshot_name[4].replaceAll("_", "-"),
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        // Exit Preview image page
        await dashboard.locator(personalize.xpathIconExitPreview).click();
        if (await personalize.checkButtonVisible("Leave page")) {
          await personalize.clickOnBtnWithLabel("Leave page");
        }
        await productPage.clickOnBtnWithLabel("Create Print file");
        await dashboard.locator(personalize.xpathIconPreview).click();
        //cho hien tin anh Preview xong moi screenshot
        await dashboard.waitForSelector(personalize.xpathPreviewPage, { timeout: 3000 });
        await dashboard.waitForSelector(personalize.xpathImageEmptyPreviewPage);
        await dashboard.waitForSelector(personalize.xpathBlockPictureChoice());
        await dashboard.waitForSelector(personalize.xpathContainerCustomOption);
        await productPage.waitForElementVisibleThenInvisible(personalize.xpathIconLoading);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalize.xpathPreviewPage,
          snapshotName: customOption.snapshot_name[5].replaceAll("_", "-"),
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await productPage.clickOnBtnWithLabel("Cancel");
      });

      if (customOptionType === "Picture choice") {
        await test.step("Click vào link ext Go to clipart library", async () => {
          // Exit Print file page
          if (await personalize.checkButtonVisible("Leave page")) {
            await personalize.clickOnBtnWithLabel("Leave page");
          }
          await productPage.closeCustomOption(customOption.custom_option_info);
          const [newTab] = await Promise.all([
            context.waitForEvent("page"),
            dashboard.locator(personalize.xpathGoToCLipart).click(),
          ]);
          const urlClipartPage = `https://${conf.suiteConf.domain}/admin/apps/print-hub/clipart`;
          expect(newTab.url()).toContain(urlClipartPage);
        });
      }

      await test.step("View product ngoài SF", async () => {
        campaignSF = new Campaign(dashboard, conf.suiteConf.domain);
        homPageSF = new SFHome(dashboard, conf.suiteConf.domain);
        const productSF = new SFProduct(dashboard, conf.suiteConf.domain);
        await homPageSF.searchThenViewProduct(productInfo.title);
        await dashboard.waitForSelector(campaignSF.xpathAllCustomOption);
        await campaignSF.waitForImagesMockupLoaded();
        await dashboard.waitForSelector(personalize.xpathImgeProduct);
        await dashboard.waitForSelector(personalize.xpathProductSF);
        await snapshotFixture.verify({
          page: dashboard,
          selector: productSF.xpathAllCustomOption,
          snapshotName: customOption.snapshot_name[6].replaceAll("_", "-"),
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      if (customOptionType != "Radio buttons" && customOptionType != "Droplist" && customOptionType != "Checkbox") {
        await test.step("Tại màn SF, để trống field", async () => {
          for (let i = 0; i < customOptionDataBlankSF.list_custom.length; i++) {
            await campaignSF.inputCustomOptionOnCampSF(customOptionDataBlankSF.list_custom[i]);
            await campaignSF.page
              .locator(
                "(//div[@data-form='product']/child::div[2]/descendant::button[contains(@class, 'add-cart') or normalize-space()='Add to cart']" +
                  " | //section//*[contains(@class, 'add-cart')]| //span[normalize-space()='Add to cart'])[1]",
              )
              .click();
            await expect(dashboard.locator(personalize.xpathErrorImageCO)).toHaveText(customOptionDataBlankSF.message);
          }
        });
      }

      if (customOptionType === "Image") {
        await test.step("Tại màn SF, Nhập ảnh dung lượng >20MB", async () => {
          for (let i = 0; i < customOptionInvalidSF.list_custom.length; i++) {
            const mediaCaseS3 = customOptionInvalidSF.upload_file_s3;
            await prepareFile(mediaCaseS3.s3_path, mediaCaseS3.file_path);
            await campaignSF.inputCustomOptionOnCampSF(customOptionInvalidSF.list_custom[i], mediaCaseS3.file_path);
            await expect(dashboard.locator(personalize.xpathErrorImageCO)).toHaveText(customOptionInvalidSF.message);
          }
        });
      }

      await test.step("Nhập giá trị vào field", async () => {
        for (let i = 0; i < customOptionDataSF.list_custom.length; i++) {
          await campaignSF.inputCustomOptionOnCampSF(customOptionDataSF.list_custom[i]);
        }
        await campaignSF.addToCart();
        await campaignSF.waitForEventCompleted(conf.suiteConf.domain, "add_to_cart");
        await campaignSF.waitForElementVisibleThenInvisible("//button[contains(@class,'btn-loading')]");
        await campaignSF.gotoCart();
        await expect(dashboard.locator(personalize.xpathCustomOptionValue(productInfo.title))).toContainText(
          customOptionDataSF.value,
        );
        if (customOptionDataSF.type === "Picture choice group") {
          await expect(dashboard.locator(personalize.xpathCustomOptionValue(productInfo.title, 2))).toContainText(
            customOptionDataSF.value_picture,
          );
        }
      });
    });
  }

  test("Tạo product có tất cả các loại custom option @SB_PRO_SBP_1521", async ({
    dashboard,
    conf,
    authRequest,
    snapshotFixture,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const personalize = new Personalize(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_all_info;
    const customOptionDataSF = conf.caseConf.custom_option_data_SF;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const messageAddProductSuccess = conf.suiteConf.message_add_product_success;
    const imageName = conf.caseConf.image_snapshot;

    await test.step(`Vào màn hình All products tạo mới products`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.addNewProductWithData(productInfo);
    });

    await test.step("Tạo custom option với Text field", async () => {
      await productPage.clickBtnCustomOptionOnly();
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_text_field);
    });

    await test.step("Click vào btn Add another option > Tạo custom option với Text area", async () => {
      await productPage.clickOnBtnWithLabel("Add another option");
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_text_area);
    });

    await test.step("Click vào btn Add another option > Tạo custom option với Image", async () => {
      await productPage.clickOnBtnWithLabel("Add another option");
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_image);
    });

    await test.step("Click vào btn Add another option > Tạo custom option với Picture choice", async () => {
      await productPage.clickOnBtnWithLabel("Add another option");
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_picture_choice);
    });

    await test.step("Click vào btn Add another option > Tạo custom option với Radio", async () => {
      await productPage.clickOnBtnWithLabel("Add another option");
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_radio_button);
    });

    await test.step("Click vào btn Add another option > Tạo custom option với Droplist", async () => {
      await productPage.clickOnBtnWithLabel("Add another option");
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_droplist);
    });

    await test.step("Click vào btn Add another option > Tạo custom option với Checkbox", async () => {
      await productPage.clickOnBtnWithLabel("Add another option");
      await addCustomOption(productPage, messageAddProductSuccess, conf.caseConf.custom_option_checkbox);
    });

    await test.step("Verify list custom option trong dashboard", async () => {
      const customOptionValue = conf.caseConf.custom_option_data;
      await productPage.removeBlockTitleDescription();
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalize.xpathCustomOptionList(),
        snapshotName: imageName.image_list_CO.replaceAll("_", "-"),
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      const productID = await productPage.getProductIDByURL();
      const domain = conf.suiteConf.domain;
      const username = conf.suiteConf.username;
      const password = conf.suiteConf.password;
      const userId = conf.suiteConf.user_id;
      const tokenType = TokenType.ShopToken;
      const shopToken = await getTokenWithCredentials(conf.suiteConf.api, {
        domain,
        username,
        password,
        userId,
        tokenType,
      });
      for (let i = 0; i < customOptionValue.length; i++) {
        const customOptionDataAR = await productPage.getCustomOptionInfoByAPI(
          authRequest,
          customOptionValue[i],
          productID,
          shopToken.access_token,
        );
        expect(JSON.stringify(customOptionDataAR)).toEqual(JSON.stringify(customOptionValue[i]));
      }
    });

    await test.step("Click vào btn Create Preview image/Print file", async () => {
      await productPage.clickOnBtnWithLabel("Create Preview image");
      await dashboard.locator(personalize.xpathIconPreview).click();
      await dashboard.locator(personalize.xpathIconBackListCO).click();
      //cho hien tin anh Preview xong moi screenshot
      await dashboard.waitForSelector(personalize.xpathPreviewPage, { timeout: 3000 });
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalize.xpathPreviewPage,
        snapshotName: imageName.image_list_CO_preview_image.replaceAll("_", "-"),
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      // Exit Preview image page
      await dashboard.locator(personalize.xpathIconExitPreview).click();
      if (await personalize.checkButtonVisible("Leave page")) {
        await personalize.clickOnBtnWithLabel("Leave page");
      }
      await productPage.clickOnBtnWithLabel("Create Print file");
      await dashboard.locator(personalize.xpathIconPreview).click();
      await dashboard.locator(personalize.xpathIconBackListCO).click();
      //cho hien tin anh Preview xong moi screenshot
      await dashboard.waitForSelector(personalize.xpathPreviewPage, { timeout: 3000 });
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalize.xpathPreviewPage,
        snapshotName: imageName.image_list_CO_print_file.replaceAll("_", "-"),
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
      const productSF = new SFProduct(dashboard, conf.suiteConf.domain);
      await homPageSF.searchThenViewProduct(productInfo.title);
      await dashboard.waitForSelector("//div[contains(@class,'product-custom-option')]", { timeout: 5000 });
      await dashboard.waitForSelector(personalize.xpathImgeProduct, { timeout: 5000 });
      await dashboard.waitForSelector(personalize.xpathImageCarousel);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productSF.xpathAllCustomOption,
        snapshotName: imageName.custom_option_sf.replaceAll("_", "-"),
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Nhập giá trị vào field", async () => {
      for (let i = 0; i < customOptionDataSF.list_custom.length; i++) {
        await campaignSF.inputCustomOptionOnCampSF(customOptionDataSF.list_custom[i]);
      }
      await campaignSF.addToCart();
      await campaignSF.gotoCart();
      for (let i = 0; i < customOptionDataSF.list_custom.length; i++) {
        await expect(dashboard.locator(personalize.xpathCustomOptionValue(productInfo.title, i + 1))).toContainText(
          customOptionDataSF.value[i],
        );
      }
    });
  });
});
