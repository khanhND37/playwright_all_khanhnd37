import { ProductPage } from "@pages/dashboard/products";
import { Personalize } from "@pages/dashboard/personalize";
import { SFHome } from "@sf_pages/homepage";
import { Campaign } from "@sf_pages/campaign";
import { expect, test } from "@core/fixtures";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { SFCheckout } from "@sf_pages/checkout";
import type { Card, ShippingAddress } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";

let maxDiffPixelRatio;
let threshold;
let maxDiffPixels;
let snapshotName;
let productPage: ProductPage;
let personalizePage: Personalize;
let homPageSF: SFHome;
let checkoutSF: SFCheckout;
let campaignSF: Campaign;
let ordersPage: OrdersPage;
let shippingInfo, cardInfo;
let newPage;

const checkoutProductSF = async (
  homPageSF: SFHome,
  checkoutSF: SFCheckout,
  shippingInfo: ShippingAddress,
  cardInfo: Card,
): Promise<string> => {
  await homPageSF.gotoCheckout();
  //wait cho page checkout ổn định
  await homPageSF.page.waitForTimeout(5000);
  await checkoutSF.enterShippingAddress(shippingInfo);
  await checkoutSF.continueToPaymentMethod();
  await checkoutSF.completeOrderWithCardInfo(cardInfo);
  return await checkoutSF.getOrderName();
};

test.describe("Add print file", async () => {
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
    await productPage.navigateToMenu("Products");
  });

  test("[Generate print file] Merchant thực hiện generate print file ở order detail khi set generate print file là OFF Manually generate @SB_PRO_SBP_1681", async ({
    dashboard,
    page,
    conf,
    authRequest,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const imagePrintFile = conf.caseConf.image_print_file;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const customOptionShowSF = conf.caseConf.custom_option_data_SF;
    homPageSF = new SFHome(page, conf.suiteConf.domain);
    campaignSF = new Campaign(page, conf.suiteConf.domain);
    checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
    snapshotName = conf.caseConf.snapshot_name;
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    const imageInvalid = conf.caseConf.image_invalid;
    const imageReplace = conf.caseConf.image_replace;
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    await preferences.activatePrintFile(conf.suiteConf.shop_id, false);
    await personalizePage.addProductAndAddConditionLogicCO(productInfo, imagePreview, layerList, customOptions);
    await personalizePage.clickOnBtnWithLabel("Cancel");
    // wait for product sau khi tao sync trong db
    await personalizePage.page.waitForTimeout(30000);
    await campaignSF.gotoHomePageThenAddCustomOptionToCart(
      homPageSF,
      productInfo.title,
      customOptionShowSF.list_custom,
    );
    const orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);

    await test.step("Vào màn hình detail order vừa tạo > Check line item màn order detail", async () => {
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForPaymentStatusIsPaid();
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

    await test.step("Click link Add print file", async () => {
      await dashboard.click(personalizePage.xpathLinkTextPrintFile("Add print file"));
      await dashboard.waitForSelector(personalizePage.xpathImageEmptyPreviewPage);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: snapshotName.add_print_file_page,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(
      "Click vào btn Create Print file > Upload mockup print file > " + "Upload image khác format: .PNG, .JPG, .JPEG",
      async () => {
        await dashboard.setInputFiles(
          personalizePage.xpathBtnUploadMockup("Upload your Print template"),
          `./data/shopbase/${imageInvalid.image_upload}`,
        );
        await personalizePage.isToastMsgVisible(imageInvalid.message_error);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      },
    );

    await test.step(`Upload image đúng format: .PNG, .JPG, .JPEG và <= 60MB`, async () => {
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Print template"),
        `./data/shopbase/${imagePrintFile}`,
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
        `./data/shopbase/${imagePrintFile}`,
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

    await test.step("After : Delete product", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      }
    });
  });

  const conf = loadData(__dirname, "DATA DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const customOption = conf.caseConf.data[i];

    test(`${customOption.description} @${customOption.case_id}`, async ({
      dashboard,
      page,
      authRequest,
      snapshotFixture,
    }) => {
      const productInfo = customOption.product_all_info;
      const imagePreview = customOption.image_preview;
      const imagePrintFile = customOption.image_print_file;
      const layerList = customOption.layers;
      const customOptions = customOption.custom_option_info;
      const customOptionShowSF = customOption.custom_option_data_SF;
      homPageSF = new SFHome(page, conf.suiteConf.domain);
      campaignSF = new Campaign(page, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
      snapshotName = customOption.snapshot_name;
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
      await preferences.activatePrintFile(conf.suiteConf.shop_id, false);
      await personalizePage.addProductAndAddConditionLogicCO(productInfo, imagePreview, layerList, customOptions);
      await personalizePage.clickOnBtnWithLabel("Cancel");
      // wait for product sau khi tao sync trong db
      await personalizePage.page.waitForTimeout(30000);
      await campaignSF.gotoHomePageThenAddCustomOptionToCart(
        homPageSF,
        productInfo.title,
        customOptionShowSF.list_custom,
      );
      const orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await dashboard.click(personalizePage.xpathLinkTextPrintFile("Add print file"));
      await dashboard.waitForTimeout(10000);
      if (
        (await dashboard
          .locator(personalizePage.xpathBtnUploadMockup("Upload your Print template"))
          .isVisible({ timeout: 5000 })) === false
      ) {
        await dashboard.waitForTimeout(2000);
        await personalizePage.goto("/admin");
        await personalizePage.navigateToMenu("Orders");
        await ordersPage.searchOrder(orderName);
        await ordersPage.goToOrderDetailSBase(orderName);
        await dashboard.waitForTimeout(5000);
        await dashboard.click(personalizePage.xpathLinkTextPrintFile("Add print file"));
      }
      await dashboard.waitForSelector(personalizePage.xpathImageEmptyPreviewPage);
      await dashboard.setInputFiles(
        personalizePage.xpathBtnUploadMockup("Upload your Print template"),
        `./data/shopbase/${imagePrintFile}`,
      );
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);

      await test.step("Click icon open Custom option> Check custom option detail", async () => {
        await dashboard.click(productPage.xpathIconExpand);
        await dashboard
          .locator(personalizePage.xpathCustomOptionName(customOptions[0].custom_name))
          .click({ timeout: 3000 });
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathProgressUploadImage);
        await dashboard.waitForSelector(personalizePage.xpathPreviewPage);
        //wait for mockup image loaded
        await dashboard.waitForTimeout(5000);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: snapshotName.custom_option_detail,
          sizeCheck: true,
        });
      });

      await test.step("Click button Save > Chọn Yes, generate file for all unfulfilled items > Click button Create", async () => {
        await productPage.waitBtnEnable("Save");
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickRadioButtonWithLabel("No, only generate for this ordered");
        await personalizePage.clickOnBtnWithLabel("Create");
        await personalizePage.clickOnBtnWithLabel("Cancel");
        if (await dashboard.locator(personalizePage.xpathBtnWithLabel("Leave page")).isVisible({ timeout: 5000 })) {
          await personalizePage.clickOnBtnWithLabel("Leave page");
        }
        await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
        if (customOptions[0].type === "Image") {
          await expect(await dashboard.locator(ordersPage.xpathValueCustomOptionImage)).toContainText(
            customOptionShowSF.value,
          );
          await expect(await ordersPage.getStatusGeneratePrintFile()).toContain(customOptionShowSF.status_gen_file);
        } else {
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

      await test.step("After : Delete product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.deleteProduct(conf.suiteConf.password);
        if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
      });
    });
  }

  test("[Generate print file] Merchant thực hiện generate print file ở order detail khi set generate print file là OFF Manually generate @SB_PRO_SBP_1735", async ({
    dashboard,
    page,
    authRequest,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const customOptionShowSF = conf.caseConf.custom_option_data_SF;
    const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
    let orderName = "";
    homPageSF = new SFHome(page, conf.suiteConf.domain);
    campaignSF = new Campaign(page, conf.suiteConf.domain);
    checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
    snapshotName = conf.caseConf.snapshot_name;
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    await preferences.activatePrintFile(conf.suiteConf.shop_id, conf.caseConf.is_disable_generate_print_file);
    await personalizePage.addProductAndAddConditionLogicCO(
      productInfo,
      imagePreview,
      layerList,
      customOptions,
      conditionalLogicInfo,
      "Create Print file",
    );
    await personalizePage.clickOnBtnWithLabel("Cancel");
    // wait for product sau khi tao sync trong db
    await personalizePage.page.waitForTimeout(30000);

    await test.step(
      "Add custom option on SF > Nhập value vào các field custom option > Add product vào cart > " +
        " Buyer checkout thành công với product đã tạo print file",
      async () => {
        await campaignSF.gotoHomePageThenAddCustomOptionToCart(
          homPageSF,
          productInfo.title,
          customOptionShowSF.list_custom,
        );
        orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
      },
    );

    await test.step("Tại dashboard -> Đi đi màn Order list /admin/orders > Open oder detail mới tạo", async () => {
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForPaymentStatusIsPaid();
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

    await test.step("Thực hiện Generate print file", async () => {
      await dashboard.click(personalizePage.xpathLinkTextPrintFile("Generate print file"));
      await personalizePage.generatePrintFileOnOrderDetail("No, only generate for this ordered", true);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ordersPage.xpathBlockFulfill,
        snapshotName: snapshotName.print_file_block_generated_file,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("After : Delete product", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      }
    });
  });

  test("[Generate print file] Merchant thực hiện generate print file ở order detail khi set generate print file là OFF Manually generate @SB_PRO_SBP_1736", async ({
    dashboard,
    page,
    authRequest,
    conf,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imagePreview = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_option_info;
    const customOptionShowSF = conf.caseConf.custom_option_data_SF;
    const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
    let orderName = "";
    homPageSF = new SFHome(page, conf.suiteConf.domain);
    campaignSF = new Campaign(page, conf.suiteConf.domain);
    checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
    snapshotName = conf.caseConf.snapshot_name;
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    await preferences.activatePrintFile(conf.suiteConf.shop_id, conf.caseConf.is_disable_generate_print_file);
    await personalizePage.addProductAndAddConditionLogicCO(
      productInfo,
      imagePreview,
      layerList,
      customOptions,
      conditionalLogicInfo,
      "Create Print file",
    );
    await personalizePage.clickOnBtnWithLabel("Cancel");
    // wait for product sau khi tao sync trong db
    await personalizePage.page.waitForTimeout(30000);

    await test.step(
      "Add custom option on SF > Nhập value vào các field custom option > Add product vào cart > " +
        " Buyer checkout thành công với product đã tạo print file",
      async () => {
        await campaignSF.gotoHomePageThenAddCustomOptionToCart(
          homPageSF,
          productInfo.title,
          customOptionShowSF.list_custom,
        );
        orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
      },
    );

    await test.step("Merchant tick chọn order ở màn hình order list với action Generate print file", async () => {
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.genSelectOrderLoc(orderName).click();
      await ordersPage.selectActionToOrder("Generate print file");
      await personalizePage.generatePrintFileOnOrderDetail("", true);
      expect(await personalizePage.isToastMsgVisible(conf.caseConf.message_generate_print_file)).toBeTruthy();
    });

    await test.step("Merchant view order detail", async () => {
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForPaymentStatusIsPaid();
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ordersPage.xpathBlockFulfill,
        snapshotName: snapshotName.print_file_block_generated_file,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("After : Delete product", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      }
    });
  });

  const conf2 = loadData(__dirname, "DATA_DRIVEN_2");
  for (let i = 0; i < conf2.caseConf.data.length; i++) {
    const genPrintFile = conf2.caseConf.data[i];
    test(`${genPrintFile.description} @${genPrintFile.case_id}`, async ({
      dashboard,
      page,
      authRequest,
      conf,
      context,
      snapshotFixture,
    }) => {
      let orderName = "";
      const listOrderName = [];
      homPageSF = new SFHome(page, conf.suiteConf.domain);
      campaignSF = new Campaign(page, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
      snapshotName = genPrintFile.snapshot_name;
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
      const productList = genPrintFile.products;
      const productCheckout = genPrintFile.product_checkout;
      const imagePrintFile = genPrintFile.image_print_file;
      const createPrintFileInfo = genPrintFile.create_print_file_info;
      const statusGeneratePrintFile = genPrintFile.status_generate_print_file;
      await preferences.activatePrintFile(conf.suiteConf.shop_id, false);

      await test.step("Pre : Delete product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.deleteProduct(conf.suiteConf.password);
        if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
      });

      await test.step("Add product có custom option và generate print file", async () => {
        for (let i = 0; i < productList.length; i++) {
          await productPage.navigateToMenu("Products");
          await personalizePage.addProductAndAddConditionLogicCO(
            productList[i].product_all_info,
            productList[i].image_preview,
            productList[i].layers,
            productList[i].custom_option_info,
            productList[i].conditional_logic_info,
            productList[i].button_open_editor,
          );
          if (
            productList[i].button_open_editor !== "Create custom option only" &&
            productList[i].button_open_editor !== ""
          ) {
            await personalizePage.clickOnBtnWithLabel("Cancel");
          }
          // wait for product sau khi tao sync trong db
          await personalizePage.page.waitForTimeout(30000);
        }
        // wait for product sau khi tao sync trong db
        await personalizePage.page.waitForTimeout(30000);
      });

      await test.step("Tại màn SF, search và đi đến product detail > checkout product thành công", async () => {
        if (
          genPrintFile.case_id === "" + "SB_PRO_SBP_1741" ||
          genPrintFile.case_id === "SB_PRO_SBP_1743" ||
          genPrintFile.case_id === "SB_PRO_SBP_1747" ||
          genPrintFile.case_id === "SB_PRO_SBP_1749" ||
          genPrintFile.case_id === "SB_PRO_SBP_1751"
        ) {
          for (let i = productCheckout.length; i > 0; i--) {
            for (let j = 0; j < i; j++) {
              await campaignSF.gotoHomePageThenAddCustomOptionToCart(
                homPageSF,
                productCheckout[j].product_name,
                productCheckout[j].custom_option_data_SF.list_custom,
              );
            }
            orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
            listOrderName.push(orderName);
          }
        } else {
          for (let i = 0; i < productCheckout.length; i++) {
            await campaignSF.gotoHomePageThenAddCustomOptionToCart(
              homPageSF,
              productCheckout[i].product_name,
              productCheckout[i].custom_option_data_SF.list_custom,
            );
          }
          orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
          listOrderName.push(orderName);
        }
      });

      await test.step(
        "Tại product, đi đến màn Order : /admin/orders > Open oder vừa mới checkout thành công > " +
          "Check product trong order detail",
        async () => {
          await productPage.navigateToMenu("Orders");
          await ordersPage.searchOrder(listOrderName[0]);
          await ordersPage.goToOrderDetailSBase(listOrderName[0]);
          await ordersPage.waitForPaymentStatusIsPaid();
          if (statusGeneratePrintFile) {
            if (
              genPrintFile.case_id === "SB_PRO_SBP_1744" ||
              genPrintFile.case_id === "SB_PRO_SBP_1745" ||
              genPrintFile.case_id === "SB_PRO_SBP_1746" ||
              genPrintFile.case_id === "SB_PRO_SBP_1747" ||
              genPrintFile.case_id === "SB_PRO_SBP_1748" ||
              genPrintFile.case_id === "SB_PRO_SBP_1749" ||
              genPrintFile.case_id === "SB_PRO_SBP_1750" ||
              genPrintFile.case_id === "SB_PRO_SBP_1751"
            ) {
              await ordersPage.waitForStatusGeneratePrintFile(statusGeneratePrintFile, listOrderName[0]);
            } else {
              await ordersPage.waitForStatusGeneratePrintFile(statusGeneratePrintFile, listOrderName[0], 2);
            }
          }
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
        },
      );

      await test.step("Create print file", async () => {
        if (
          genPrintFile.case_id === "SB_PRO_SBP_1742" ||
          genPrintFile.case_id === "SB_PRO_SBP_1743" ||
          genPrintFile.case_id === "SB_PRO_SBP_1744" ||
          genPrintFile.case_id === "SB_PRO_SBP_1745" ||
          genPrintFile.case_id === "SB_PRO_SBP_1748" ||
          genPrintFile.case_id === "SB_PRO_SBP_1749" ||
          genPrintFile.case_id === "SB_PRO_SBP_1750" ||
          genPrintFile.case_id === "SB_PRO_SBP_1751"
        ) {
          await productPage.navigateToMenu("Products");
          await productPage.gotoProductDetail(productList[0].product_all_info.title);
          await personalizePage.clickOnBtnWithLabel("Create Print file");
        } else {
          await productPage.navigateToMenu("Orders");
          await ordersPage.searchOrder(listOrderName[0]);
          await ordersPage.goToOrderDetailSBase(listOrderName[0]);
          await dashboard.click(personalizePage.xpathLinkTextPrintFile("Add print file"));
          await dashboard.waitForSelector(personalizePage.xpathImageEmptyPreviewPage);
        }
        await personalizePage.uploadThenGeneratePrintFileOnOrderDetail(
          "Upload your Print template",
          imagePrintFile,
          createPrintFileInfo.layers,
          productList[0].custom_option_info[0].custom_name,
          createPrintFileInfo.custom_option_info,
          genPrintFile.select_option,
        );

        if (
          genPrintFile.case_id === "SB_PRO_SBP_1742" ||
          genPrintFile.case_id === "SB_PRO_SBP_1743" ||
          genPrintFile.case_id === "SB_PRO_SBP_1744" ||
          genPrintFile.case_id === "SB_PRO_SBP_1745" ||
          genPrintFile.case_id === "SB_PRO_SBP_1748" ||
          genPrintFile.case_id === "SB_PRO_SBP_1749" ||
          genPrintFile.case_id === "SB_PRO_SBP_1750" ||
          genPrintFile.case_id === "SB_PRO_SBP_1751"
        ) {
          await productPage.navigateToMenu("Orders");
          await ordersPage.searchOrder(listOrderName[0]);
          await dashboard.locator(ordersPage.xpathOrderName(listOrderName[0])).click();
          await dashboard.waitForTimeout(3000);
          const checkLinkText = await dashboard
            .locator(personalizePage.xpathLinkTextPrintFile("Generate print file"))
            .isVisible({ timeout: 5000 });
          if (checkLinkText === true) {
            await dashboard.click(personalizePage.xpathLinkTextPrintFile("Generate print file"));
            await personalizePage.clickRadioButtonWithLabel(genPrintFile.section_name);
            await personalizePage.clickOnBtnWithLabel("Generate");
          }
        }
        if (genPrintFile.case_id !== "SB_PRO_SBP_1750" && genPrintFile.case_id !== "SB_PRO_SBP_1751") {
          await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", listOrderName[0], 1, 15);
        } else {
          await ordersPage.waitForStatusGeneratePrintFile("", listOrderName[0], 1, 15);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: ordersPage.xpathBlockFulfill,
          snapshotName: snapshotName.print_file_block_generated_file,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      if (
        genPrintFile.case_id !== "SB_PRO_SBP_1744" &&
        genPrintFile.case_id !== "SB_PRO_SBP_1745" &&
        genPrintFile.case_id !== "SB_PRO_SBP_1750" &&
        genPrintFile.case_id !== "SB_PRO_SBP_1751"
      ) {
        await test.step("Click icon Action bên canh text Print file has been generated -> Click button Preview", async () => {
          await dashboard.locator(ordersPage.xpathIconActionPrintFile(1)).click();
          [newPage] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
          ]);
          await newPage.waitForLoadState("domcontentloaded");
          await waitForImageLoaded(newPage, "//img");
          //wait for the image to finish loading at new page
          //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
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

        if (
          genPrintFile.case_id === "SB_PRO_SBP_1741" ||
          genPrintFile.case_id === "SB_PRO_SBP_1743" ||
          genPrintFile.case_id === "SB_PRO_SBP_1747" ||
          genPrintFile.case_id === "SB_PRO_SBP_1749"
        ) {
          await test.step(
            "Tại product, đi đến màn Order : /admin/orders > Open oder 2 > " + "Check product trong order detail",
            async () => {
              await productPage.navigateToMenu("Orders");
              await ordersPage.searchOrder(listOrderName[1]);
              await ordersPage.goToOrderDetailSBase(listOrderName[1]);
              await ordersPage.waitForPaymentStatusIsPaid();
              await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", listOrderName[1], 1);
              await snapshotFixture.verify({
                page: dashboard,
                selector: ordersPage.xpathBlockFulfill,
                snapshotName: snapshotName.print_file_block_generate_file_all_order,
                snapshotOptions: {
                  maxDiffPixelRatio: maxDiffPixelRatio,
                  threshold: threshold,
                  maxDiffPixels: maxDiffPixels,
                },
              });
            },
          );
        }
      }

      await test.step("After : Delete product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.deleteProduct(conf.suiteConf.password);
        if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
      });
    });
  }
});

test.describe("Add print file", async () => {
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

  const confGen = loadData(__dirname, "DATA_DRIVEN_GENERATE_PRINT_FILE");
  for (let i = 0; i < confGen.caseConf.data.length; i++) {
    const genPrintFile = confGen.caseConf.data[i];
    test(`${genPrintFile.description} @${genPrintFile.case_id}`, async ({
      dashboard,
      page,
      authRequest,
      conf,
      context,
      snapshotFixture,
    }) => {
      let orderName = "";
      homPageSF = new SFHome(page, conf.suiteConf.domain);
      campaignSF = new Campaign(page, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
      snapshotName = genPrintFile.snapshot_name;
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
      const productList = genPrintFile.products;
      const productCheckout = genPrintFile.product_checkout;
      const imagePrintFile = genPrintFile.image_print_file;
      const createPrintFileInfo = genPrintFile.create_print_file_info;
      const statusGeneratePrintFile = genPrintFile.status_generate_print_file;
      const indexStatus: number = genPrintFile.index_status;

      await test.step("Pre condition: Setting activate print file", async () => {
        for (let i = 0; i < productList.length; i++) {
          await productPage.navigateToMenu("Products");
          await productPage.searchProduct(productList[i].product_all_info.title);
          await productPage.deleteProduct(conf.suiteConf.password);
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
        await preferences.activatePrintFile(conf.suiteConf.shop_id, false);
      });

      await test.step("Add product có custom option và generate print file", async () => {
        for (let i = 0; i < productList.length; i++) {
          await productPage.navigateToMenu("Products");
          await personalizePage.addProductAndAddConditionLogicCO(
            productList[i].product_all_info,
            productList[i].image_preview,
            productList[i].layers,
            productList[i].custom_option_info,
            productList[i].conditional_logic_info,
            productList[i].button_open_editor,
          );
          if (
            productList[i].button_open_editor !== "Create custom option only" &&
            productList[i].button_open_editor !== ""
          ) {
            await personalizePage.clickOnBtnWithLabel("Cancel");
          }
          await expect(await dashboard.locator(personalizePage.xpathTitleProductDetail)).toHaveText(
            productList[i].product_all_info.title,
          );
        }
        // wait for product sau khi tao sync trong db
        await personalizePage.page.waitForTimeout(30000);
      });

      await test.step("Tại màn SF, search và đi đến product detail > checkout product thành công", async () => {
        for (let i = 0; i < productCheckout.length; i++) {
          await campaignSF.gotoHomePageThenAddCustomOptionToCart(
            homPageSF,
            productCheckout[i].product_name,
            productCheckout[i].custom_option_data_SF.list_custom,
          );
        }
        orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
        await expect(checkoutSF.page.locator(checkoutSF.xpathThankYou)).toBeVisible();
      });

      await test.step(
        "Tại product, đi đến màn Order : /admin/orders > Open oder vừa mới checkout thành công > " +
          "Check product trong order detail",
        async () => {
          await productPage.navigateToMenu("Orders");
          await ordersPage.searchOrder(orderName);
          await ordersPage.goToOrderDetailSBase(orderName);
          await ordersPage.waitForPaymentStatusIsPaid();
          await ordersPage.waitForStatusGeneratePrintFile(statusGeneratePrintFile, orderName, indexStatus, 15);
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
        },
      );

      await test.step(
        "- Tại product màn order detail\n" +
          '- Click button "Add print file" của line item \n' +
          "- Click button Upload your Print template -> Upload image \n" +
          "- Click button Add image -> Upload Image&nbsp;target\n" +
          "- Chọn Target Layers\n" +
          "- Click button Save\n" +
          '- Chọn "No, only generate for this ordered"\n' +
          "- Click button Create",
        async () => {
          await productPage.navigateToMenu("Orders");
          await ordersPage.waitForElementVisibleThenInvisible(ordersPage.xpathDetailLoading);
          await ordersPage.page.waitForSelector(ordersPage.getXpathLineItemOrder());
          await ordersPage.searchOrder(orderName);
          await ordersPage.goToOrderDetailSBase(orderName);
          await ordersPage.waitForPaymentStatusIsPaid();
          await dashboard.click(personalizePage.xpathLinkTextPrintFile("Add print file"));
          await dashboard.waitForSelector(personalizePage.xpathImageEmptyPreviewPage);
          await personalizePage.uploadThenGeneratePrintFileOnOrderDetail(
            "Upload your Print template",
            imagePrintFile,
            createPrintFileInfo.layers,
            productList[0].custom_option_info[0].custom_name,
            createPrintFileInfo.custom_option_info,
            genPrintFile.select_option,
          );

          await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 15);
          const statusGenerate = await ordersPage.getStatusGeneratePrintFile();
          if (statusGenerate.trim() === "Print file has been generated") {
            await snapshotFixture.verify({
              page: dashboard,
              selector: ordersPage.xpathBlockFulfill,
              snapshotName: snapshotName.print_file_block_generated_file,
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
          }
        },
      );

      await test.step("Click icon Action bên canh text Print file has been generated -> Click button Preview", async () => {
        await dashboard.locator(ordersPage.xpathIconActionPrintFile(1)).click();
        [newPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
        ]);
        await newPage.waitForLoadState("domcontentloaded");
        // wait for image print file gen thanh cong
        await newPage.waitForTimeout(5000);
        await waitForImageLoaded(newPage, "//img");
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

      await test.step("After : Delete product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.deleteProduct(conf.suiteConf.password);
        if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
      });
    });
  }

  const confGenPrintProduct = loadData(__dirname, "DATA_DRIVEN_GENERATE_PRINT_FILE_PRODUCT_DETAIL");
  for (let i = 0; i < confGenPrintProduct.caseConf.data.length; i++) {
    const genPrintFile = confGenPrintProduct.caseConf.data[i];
    test(`${genPrintFile.description} @${genPrintFile.case_id}`, async ({
      dashboard,
      page,
      authRequest,
      conf,
      context,
      snapshotFixture,
    }) => {
      let orderName = "";
      homPageSF = new SFHome(page, conf.suiteConf.domain);
      campaignSF = new Campaign(page, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
      snapshotName = genPrintFile.snapshot_name;
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
      const productList = genPrintFile.products;
      const productCheckout = genPrintFile.product_checkout;
      const imagePrintFile = genPrintFile.image_print_file;
      const createPrintFileInfo = genPrintFile.create_print_file_info;
      const statusGeneratePrintFile = genPrintFile.status_generate_print_file;
      const indexStatus: number = genPrintFile.index_status;

      await test.step("Pre condition: Setting activate print file", async () => {
        for (let i = 0; i < productList.length; i++) {
          await productPage.navigateToMenu("Products");
          await productPage.searchProduct(productList[i].product_all_info.title);
          await productPage.deleteProduct(conf.suiteConf.password);
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
        await preferences.activatePrintFile(conf.suiteConf.shop_id, false);
      });

      await test.step("Add product có custom option và generate print file", async () => {
        for (let i = 0; i < productList.length; i++) {
          await productPage.navigateToMenu("Products");
          await personalizePage.addProductAndAddConditionLogicCO(
            productList[i].product_all_info,
            productList[i].image_preview,
            productList[i].layers,
            productList[i].custom_option_info,
            productList[i].conditional_logic_info,
            productList[i].button_open_editor,
          );
          if (
            productList[i].button_open_editor !== "Create custom option only" &&
            productList[i].button_open_editor !== ""
          ) {
            await personalizePage.clickOnBtnWithLabel("Cancel");
          }
          await expect(await dashboard.locator(personalizePage.xpathTitleProductDetail)).toHaveText(
            productList[i].product_all_info.title,
          );
        }
        // wait for product sau khi tao sync trong db
        await personalizePage.page.waitForTimeout(30000);
      });

      await test.step("Tại màn SF, search và đi đến product detail > checkout product thành công", async () => {
        for (let i = 0; i < productCheckout.length; i++) {
          await campaignSF.gotoHomePageThenAddCustomOptionToCart(
            homPageSF,
            productCheckout[i].product_name,
            productCheckout[i].custom_option_data_SF.list_custom,
          );
        }
        orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
        await expect(checkoutSF.page.locator(checkoutSF.xpathThankYou)).toBeVisible();
      });

      await test.step(
        "Tại product, đi đến màn Order : /admin/orders > Open oder vừa mới checkout thành công > " +
          "Check product trong order detail",
        async () => {
          await productPage.navigateToMenu("Orders");
          await ordersPage.searchOrder(orderName);
          await ordersPage.goToOrderDetailSBase(orderName);
          await ordersPage.waitForPaymentStatusIsPaid();
          await ordersPage.waitForStatusGeneratePrintFile(statusGeneratePrintFile, orderName, indexStatus, 15);
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
        },
      );

      await test.step(
        "- Đi đến màn product detail của Product 1\n" +
          '- Click button "Create Print File"\n' +
          "- Click button Upload your Print template -> Upload image \n" +
          "- Click button Add image -> Upload Image&nbsp;target\n" +
          '- Nhập Chọn "Target Layers"\n' +
          "- CLick button Save\n" +
          '- Chọn "No, only generate for the ordered items from now"\n' +
          "- Click button Create\n" +
          "- Click button Save changes",
        async () => {
          await productPage.navigateToMenu("Products");
          await productPage.gotoProductDetail(productList[0].product_all_info.title);
          await personalizePage.clickOnBtnWithLabel("Create Print file");
          await dashboard.waitForSelector(personalizePage.xpathImageEmptyPreviewPage);
          await personalizePage.uploadThenGeneratePrintFileOnOrderDetail(
            "Upload your Print template",
            imagePrintFile,
            createPrintFileInfo.layers,
            productList[0].custom_option_info[0].custom_name,
            createPrintFileInfo.custom_option_info,
            genPrintFile.select_option,
          );
        },
      );

      await test.step(
        "- Tại product, đi đến màn Order : /admin/orders\n" +
          "- Open oder vừa mới checkout thành công\n" +
          "- Check product 1 trong order detail\n" +
          '- Click button "Generate print file"\n' +
          '- Click chon "No, only generate for this ordered"\n' +
          "- Click button Genrerate",
        async () => {
          await productPage.navigateToMenu("Orders");
          await ordersPage.searchOrder(orderName);
          await ordersPage.goToOrderDetailSBase(orderName);
          await ordersPage.waitForPaymentStatusIsPaid();
          const checkLinkText = await dashboard
            .locator(personalizePage.xpathLinkTextPrintFile("Generate print file"))
            .isVisible({ timeout: 5000 });
          if (checkLinkText === true) {
            await dashboard.click(personalizePage.xpathLinkTextPrintFile("Generate print file"));
            await personalizePage.clickRadioButtonWithLabel(genPrintFile.section_name);
            await personalizePage.clickOnBtnWithLabel("Generate");
          }

          if (genPrintFile.case_id !== "SB_PRO_SBP_1750") {
            await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 15);
          }
          await snapshotFixture.verify({
            page: dashboard,
            selector: ordersPage.xpathBlockFulfill,
            snapshotName: snapshotName.print_file_block_generated_file,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      await test.step("Click icon Action bên canh text Print file has been generated -> Click button Preview", async () => {
        if (genPrintFile.case_id != "SB_PRO_SBP_1750") {
          await dashboard.locator(ordersPage.xpathIconActionPrintFile(1)).click();
          [newPage] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
          ]);
          await newPage.waitForLoadState("domcontentloaded");
          // wait for image print file gen thanh cong
          await newPage.waitForTimeout(5000);
          await waitForImageLoaded(newPage, "//img");
          await snapshotFixture.verify({
            page: newPage,
            snapshotName: snapshotName.print_file_preview,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        }
      });

      await test.step("After : Delete product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.deleteProduct(conf.suiteConf.password);
        if (await dashboard.locator(productPage.xpathToastMessage).isVisible({ timeout: 5000 })) {
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        }
      });
    });
  }
});
