import { expect, test } from "@fixtures/theme";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { ProductPage } from "@pages/dashboard/products";
import { Campaign } from "@sf_pages/campaign";
import { Personalize } from "@pages/dashboard/personalize";
import { SFHome } from "@sf_pages/homepage";
import { SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import { SbPrintFileScheduleData } from "../personalize/print_file/create_printfile/create_printfile";
import { OcgLogger } from "@core/logger";
import { Layer } from "@types";
import { PrintBasePage } from "@pages/dashboard/printbase";

const logger = OcgLogger.get();

let productPage: ProductPage;
let campaignSF: Campaign;
let personalizePage: Personalize;
let homPageSF: SFHome;
let orderName: string;
let ordersPage: OrdersPage;
let checkout: SFCheckout;
let printBasePage: PrintBasePage;
let productInfo;
let imagePreview, imagePrintfile;
let effect;
let typeCurve, typeNone;
let layers: Layer;
let listLayers;
let envRun, customOption, customOptionSF, shippingInfo, cardInfo;

test.describe("Live preview campaigns", () => {
  const caseName = "PRODUCT_HAS_EFFECT";
  const conf = loadData(__dirname, caseName);
  const casePrintFile = "PRINT_FILE_HAS_EFFECT";
  const confPrintFile = loadData(__dirname, casePrintFile);
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    await preferences.activatePrintFile(conf.suiteConf.shop_id, true);
    await productPage.navigateToMenu("Products");
    await productPage.deleteProduct(conf.suiteConf.password);
    await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    test.setTimeout(conf.suiteConf.time_out);
  });

  conf.caseConf.data.forEach(testCase => {
    test(`${testCase.case_name} @${testCase.case_id}`, async ({ context, snapshotFixture, dashboard }) => {
      const productInfo = testCase.product_all_info;
      const imagePreview = testCase.image_preview;
      const layerList = testCase.layers;
      const customOptions = testCase.custom_option_info;
      const customOptionShowSF = testCase.custom_option_data_SF;
      const conditionalLogicInfo = testCase.conditional_logic_info;
      const envRun = process.env.ENV;
      await test.step(
        "- Tại Left menu, click Products > Click btn Add product > Input title, image prod -> thực hiện tạo product thành công" +
          "- Tạo preview với CO effect stroke:" +
          " + tại product detail, click button 'Create Preview Image'" +
          "-> Upload image bất kỳ" +
          "-> click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Curve và input data" +
          "-> tại Custom options -> click button + -> input data ở drawer" +
          "-> click button Save",
        async () => {
          await personalizePage.addProductAndAddConditionLogicCO(
            productInfo,
            imagePreview,
            layerList,
            customOptions,
            conditionalLogicInfo,
          );
          await personalizePage.clickOnBtnWithLabel("Cancel");
          await personalizePage.page.reload();
          await dashboard.waitForLoadState("networkidle");
          await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
          await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
        },
      );

      await test.step("Đi đến trang SF > input CO > click btn 'Preview your design' -> verify image preview", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        await campaignSF.waitResponseWithUrl("/assets/landing.css", 90000);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
        await campaignSF.inputCustomAllOptionSF(customOptionShowSF);
        await campaignSF.clickOnBtnPreviewSF();
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathPopupLivePreview(),
          snapshotName: `${testCase.case_id}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
    });
  });

  confPrintFile.caseConf.data.forEach(testCase => {
    test(`${testCase.case_name} @${testCase.case_id}`, async ({
      context,
      dashboard,
      page,
      snapshotFixture,
      scheduler,
    }) => {
      let scheduleData: SbPrintFileScheduleData;
      const rawDataJson = await scheduler.getData();
      if (rawDataJson) {
        scheduleData = rawDataJson as SbPrintFileScheduleData;
      } else {
        logger.info("Init default object");
        scheduleData = {
          orderName: "",
          is_print_file: false,
        };

        logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
      }
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      const productInfo = testCase.product_all_info;
      const imagePreview = testCase.image_preview;
      const layerList = testCase.layers;
      const customOptions = testCase.custom_option_info;
      const customOptionShowSF = testCase.custom_option_data_SF;
      const shippingInfo = conf.suiteConf.customer_info;
      const cardInfo = conf.suiteConf.card_info;
      const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
      const buttonClickOpenEditor = testCase.button_click_open_editor;
      const envRun = process.env.ENV;
      if (!scheduleData.orderName) {
        await test.step(
          "- Tại Left menu, click Products > Click btn Add product > Input title, image prod (chọn file image bất kỳ) -> Click btn Save -> thực hiện tạo product thành công" +
            "- Tạo preview với CO effect stroke:" +
            "+ tại product detail, click button 'Create Print file'" +
            "-> Upload image bất kỳ" +
            "-> click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Curve và input data" +
            "-> tại Custom options -> click button + -> input data ở drawer" +
            "-> click button Save -> click btn Create",
          async () => {
            await personalizePage.addProductAndAddConditionLogicCO(
              productInfo,
              imagePreview,
              layerList,
              customOptions,
              conditionalLogicInfo,
              buttonClickOpenEditor,
            );
            await personalizePage.clickOnBtnWithLabel("Cancel");
            await personalizePage.page.reload();
            await expect(dashboard.locator(productPage.xpathTitleProductDetail)).toHaveText(productInfo.title);
          },
        );

        await test.step("Đi đến trang SF, search product > input CO -> click btn Add to cart > thực hiện check out product", async () => {
          campaignSF = new Campaign(page, conf.suiteConf.domain);
          homPageSF = new SFHome(page, conf.suiteConf.domain);
          const checkout = new SFCheckout(page, conf.suiteConf.domain);
          await campaignSF.gotoHomePageThenAddCustomOptionToCart(
            homPageSF,
            productInfo.title,
            customOptionShowSF,
            false,
          );
          await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
          orderName = await checkout.getOrderName();
          scheduleData.orderName = orderName;
          expect(await checkout.isThankyouPage()).toBeTruthy();
        });
      }

      if (buttonClickOpenEditor === "Create Preview image") {
        await test.step(
          "Vào màn order detail > Click Add print file > Tạo print file >> Vào màn order detail vừa tạo , print file được render tự động " +
            "-> click ... -> chọn 'Preview' print file > verify ảnh print file",
          async () => {
            await productPage.navigateToMenu("Orders");
            await ordersPage.searchOrder(scheduleData.orderName);
            await ordersPage.goToOrderDetailSBase(scheduleData.orderName);
            if (!scheduleData.is_print_file) {
              await ordersPage.page.click(personalizePage.xpathLinkTextPrintFile("Add print file"));
              await productPage.uploadImagePreviewOrPrintfile(testCase.image_print_file);
              await productPage.clickOnBtnWithLabel("Save");
              await personalizePage.generatePrintFileOnOrderDetail("", true);
              await personalizePage.clickOnBtnWithLabel("Cancel");
              scheduleData.is_print_file = true;
            }
            const statusIconActionPrintFile = await dashboard
              .locator(ordersPage.xpathIconActionPrintFile())
              .isVisible();
            if (statusIconActionPrintFile) {
              await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
              const [newPage] = await Promise.all([
                context.waitForEvent("page"),
                await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
              ]);
              //wait for the image to finish loading at new page
              //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
              await newPage.waitForTimeout(6000);
              await snapshotFixture.verify({
                page: newPage,
                snapshotName: `${testCase.case_id}_${envRun}.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.param_threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
              });
            } else {
              await scheduler.setData(scheduleData);
              await scheduler.schedule({ mode: "later", minutes: 5 });
              // eslint-disable-next-line playwright/no-skipped-test
              test.skip();
              return;
            }
            await scheduler.clear();
          },
        );
      } else {
        await test.step(
          "Vào màn order detail vừa tạo , print file được render tự động " +
            "-> click ... -> chọn 'Preview' print file > verify ảnh print file",
          async () => {
            await productPage.navigateToMenu("Orders");
            await ordersPage.searchOrder(scheduleData.orderName);
            await ordersPage.genSelectOrderLoc(scheduleData.orderName).click();
            await ordersPage.selectActionToOrder("Generate print file");
            await personalizePage.generatePrintFileOnOrderDetail("", true);
            await productPage.navigateToMenu("Orders");
            await ordersPage.searchOrder(scheduleData.orderName);
            await ordersPage.goToOrderDetailSBase(scheduleData.orderName);
            const statusGenerate = await ordersPage.getStatusGeneratePrintFile();
            if (statusGenerate.trim() === "Print file has been generated") {
              await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
              const [newPage] = await Promise.all([
                context.waitForEvent("page"),
                await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
              ]);
              //wait for the image to finish loading at new page
              //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
              await newPage.waitForTimeout(6000);
              await snapshotFixture.verify({
                page: newPage,
                snapshotName: `${testCase.case_id}_${envRun}.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.param_threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
              });
            } else {
              await scheduler.setData(scheduleData);
              await scheduler.schedule({ mode: "later", minutes: 5 });
              // eslint-disable-next-line playwright/no-skipped-test
              test.skip();
              return;
            }
            await scheduler.clear();
          },
        );
      }
    });
  });

  test("[Shopbase]Check product có preview có customize group layer text có hiệu ứng @TC_SB_PRB_LPSE_62", async ({
    conf,
    context,
    snapshotFixture,
    dashboard,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imageMockup = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const createGroupLayer = conf.caseConf.groups_info;
    const addLayersToGroup = conf.caseConf.layers_group_info;
    const customOptions = conf.caseConf.custom_option_info;
    const customizeGroup = conf.caseConf.customize_group;
    const customOptionSF = conf.caseConf.custom_option_data_SF;
    const envRun = process.env.ENV;
    await test.step(
      "- Tại Left menu, click Products > Click btn Add product > Input data product -> click btn Save" +
        " - tại product detail, click button 'Create Preview Image'" +
        "-> Upload image bất kỳ",
      async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imageMockup);
        await expect(dashboard.locator(productPage.xpathImageUploadEditor)).toBeVisible();
      },
    );

    await test.step(
      "- Tạo preview với các CO" +
        "-> click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Stroke và input data" +
        "-> click button 'Add text' -> tại 'Text layer 2'-> input data, tại EFFECTS -> click + tại Curve và input data" +
        "- Click icon button 'Add group layer' -> add 2 group layer với tên: 'Group 1', 'Group 2'" +
        "-> add 'Text layer 1' vào 'Group 1', add 'Text layer 2' vào 'Group 2'" +
        "-> tại Custom options -> click button + -> input data ở drawer tương ứng cho từng CO" +
        "-> click btn 'Customize group' -> input data ở drawer" +
        "-> click button Save" +
        "- Tạo preview với các CO: Text field, Text area > Tạo Group cho các CO > Tạo customize group",
      async () => {
        await personalizePage.addLayers(layerList);
        for (const group of createGroupLayer) {
          await personalizePage.createGroupLayer(group.current_group, group.new_group);
        }
        await personalizePage.addLayersToGroup(addLayersToGroup);
        await personalizePage.clickBtnExpand();
        await personalizePage.clickOnBtnWithLabel("Customize layer");
        await personalizePage.addListCustomOptionOnEditor(customOptions);
        await personalizePage.setupCustomizeGroup(customizeGroup);
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await dashboard.waitForLoadState("networkidle");
        await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
        await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
      },
    );

    await test.step(
      "Đi đến trang SF " +
        "-> tại field 'Please select the option' -> click dropdown -> chọn custom option -> input text" +
        "-> click btn 'Preview your design' -> verify image preview",
      async () => {
        const [SFPage] = await Promise.all([
          context.waitForEvent("page"),
          personalizePage.clickOnTextLinkWithLabel("View"),
        ]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        for (const customOption of customOptionSF) {
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
          await campaignSF.selectGroup(customOption.name_group);
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await campaignSF.inputCustomAllOptionSF(customOption.custom_info);
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: `${customOption.picture}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
          });
          await campaignSF.closePreview("Inside");
        }
      },
    );
  });

  test(`@SB_PRB_LPSE_69 [Shopbase]Check duplicate product có effect`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const productInfo = conf.caseConf.product_all_info;
    const imageMockup = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layers;
    const createGroupLayer = conf.caseConf.groups_info;
    const addLayersToGroup = conf.caseConf.layers_group_info;
    const customOptions = conf.caseConf.custom_option_info;
    const customizeGroup = conf.caseConf.customize_group;
    const customOptionSF = conf.caseConf.custom_option_data_SF;
    const shippingInfo = conf.suiteConf.customer_info;
    const cardInfo = conf.suiteConf.card_info;
    const envRun = process.env.ENV;
    const customOptionPrintFileSF = conf.caseConf.custom_option_printfile_sf;

    await test.step(
      "- Tại Left menu, click Products > Click btn Add product > Input data product -> click btn Save" +
        "- tại product detail, click button 'Create Preview Image'" +
        "-> Upload image bất kỳ",
      async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imageMockup);
        await expect(dashboard.locator(productPage.xpathImageUploadEditor)).toBeVisible();
      },
    );

    await test.step(
      "- Tạo preview với các CO" +
        "-> click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Stroke và input data" +
        "-> click button 'Add text' -> tại 'Text layer 2'-> input data, tại EFFECTS -> click + tại Curve và input data" +
        "- Click icon button 'Add group layer' -> add 2 group layer với tên: 'Group 1', 'Group 2'" +
        "-> add 'Text layer 1' vào 'Group 1' , add 'Text layer 2' vào 'Group 2'" +
        "-> tại Custom options -> click button + -> input data ở drawer tương ứng cho từng CO" +
        "-> click btn 'Customize group' -> input data ở drawer" +
        "-> click button Save" +
        "- Tạo preview với các CO: Text field, Text area > Tạo Group cho các CO > Tạo customize group",
      async () => {
        //setting customize group with customize option
        await personalizePage.addLayers(layerList);
        for (const group of createGroupLayer) {
          await personalizePage.createGroupLayer(group.current_group, group.new_group);
        }
        await personalizePage.addLayersToGroup(addLayersToGroup);
        await personalizePage.clickBtnExpand();
        await personalizePage.clickOnBtnWithLabel("Customize layer");
        await personalizePage.addListCustomOptionOnEditor(customOptions);
        await personalizePage.setupCustomizeGroup(customizeGroup);
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await dashboard.waitForLoadState("networkidle");
        await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
        await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
      },
    );

    await test.step("Tại product detail -> click btn Duplicate", async () => {
      await personalizePage.clickOnBtnWithLabel("Duplicate");
      await personalizePage.duplicateProduct(true);
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(productPage.xpathTitleProductDetail)).toHaveText("Copy of " + productInfo.title);
    });

    await test.step(
      "Đi đến trang SF -> tại field 'Please select the option'" +
        "-> click dropdown -> chọn custom option -> input text -> click btn 'Preview your design' -> verify image preview",
      async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        for (const customOption of customOptionSF) {
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
          await campaignSF.selectGroup(customOption.name_group);
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await campaignSF.inputCustomAllOptionSF(customOption.custom_info);
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: `${customOption.picture}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
          });
          await campaignSF.closePreview("Inside");
        }
      },
    );

    await test.step(
      "Vào lại dashboard chọn và click product -> tại product detail" +
        "-> click btn 'Create Print file'-> Upload image bất kỳ" +
        "-> click button Save -> click btn Create",
      async () => {
        await personalizePage.goToProductList();
        await personalizePage.chooseProduct(productInfo.title);
        await personalizePage.clickOnBtnWithLabel("Create Print file");
        await productPage.uploadImagePreviewOrPrintfile(conf.caseConf.image_print_file);
        await productPage.clickOnBtnWithLabel("Save");
        await personalizePage.generatePrintFileOnOrderDetail("", true);
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await dashboard.waitForLoadState("networkidle");
        await expect(dashboard.locator(productPage.xpathImagePrint)).toBeVisible();
        await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
      },
    );

    await test.step("Tại product detail -> click btn Duplicate", async () => {
      await personalizePage.clickOnBtnWithLabel("Duplicate");
      await personalizePage.duplicateProduct(true, "");
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(productPage.xpathTitleProductDetail)).toHaveText("Copy of " + productInfo.title);
    });

    await test.step("Đi đến trang SF, search product > input CO -> click btn Add to cart > thực hiện check out product", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
      for (const customOption of customOptionPrintFileSF) {
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
        await campaignSF.selectGroup(customOption.name_group);
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
        await campaignSF.inputCustomAllOptionSF(customOption.custom_info);
      }
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
      orderName = await checkout.getOrderName();
      expect(await checkout.isThankyouPage()).toBeTruthy();
    });

    await test.step(
      "Vào màn order detail vừa tạo , print file được render tự động" +
        "-> click ... -> chọn 'Preview' print file > verify ảnh print file",
      async () => {
        await productPage.navigateToMenu("Orders");
        await ordersPage.searchOrder(orderName);
        await ordersPage.goToOrderDetailSBase(orderName);
        await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
        await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
        ]);
        //wait for the image to finish loading at new page
        //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
        await newPage.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: newPage,
          snapshotName: `SB_PRB_LPSE_69_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      },
    );
  });
});

test.describe("Live preview Enhance custom text effect for products", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    await preferences.activatePrintFile(conf.suiteConf.shop_id, false);
    await productPage.navigateToMenu("Products");
    await productPage.deleteProduct(conf.suiteConf.password);
    await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    customOption = conf.caseConf.custom_option_info;
    customOptionSF = conf.caseConf.custom_option_data_SF;
    shippingInfo = conf.suiteConf.customer_info;
    cardInfo = conf.suiteConf.card_info;
    productInfo = conf.caseConf.product_all_info;
    imagePreview = conf.caseConf.image_preview;
    imagePrintfile = conf.caseConf.image_print_file;
    envRun = process.env.ENV;
    test.setTimeout(conf.suiteConf.time_out);
  });
  test("@SB_PRB_PRB_PRO_SBP_64 Verify hiển thị layer trên editor sau khi delete effect curver", async ({
    snapshotFixture,
    dashboard,
    conf,
  }) => {
    layers = conf.caseConf.layers;
    effect = conf.caseConf.effect;
    typeCurve = conf.caseConf.type_curve;
    typeNone = conf.caseConf.type_none;
    const defaultValueEnvidence = conf.caseConf.default_value_envidence.replace("envRun", envRun);
    const defaultApplyEnvidence = conf.caseConf.default_apply_envidence.replace("envRun", envRun);
    const inputValueEnvidence = conf.caseConf.input_value_envidence.replace("envRun", envRun);
    const noneCurveEnvidence = conf.caseConf.none_curve_envidence.replace("envRun", envRun);
    const printfileEnvidence = conf.caseConf.printfile_envidence.replace("envRun", envRun);

    await test.step(
      "Add new product -> Click button Create Preview image -> Upload Image" +
        " -> Click btn Add text layer 1 > tại Shape, chọn Curver" +
        "Verify hiển thị giá trị default trong curver box của layer text",
      async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
          productInfo,
          imagePreview,
          "Create Preview image",
        );
        await productPage.addLayer(layers[0]);
        await dashboard.click(productPage.xpathLayerNameAtListLayer(layers[0].layer_value));
        await productPage.chooseEffects(effect, typeCurve);
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathEffectExpand(effect),
          snapshotName: defaultValueEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathImageUploadEditor,
          snapshotName: defaultApplyEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await dashboard.click(printBasePage.xpathIconBack);
      },
    );

    await test.step("tại list layer, Click btn Add text layer 2 > tại Shape, chọn Curver > input value cho shape Curve -> kiểm tra hiển thị text layer", async () => {
      await productPage.addLayer(layers[1]);
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathImageUploadEditor,
        snapshotName: inputValueEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step("Click text layer 1 -> tại shape, chọn None -> kiểm tra hiển thị Text layer 1", async () => {
      await dashboard.click(productPage.xpathLayerNameAtListLayer(layers[0].layer_name));
      await productPage.chooseEffects(effect, typeNone);
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathImageUploadEditor,
        snapshotName: noneCurveEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step("CLick button Update Print file> Upload ảnh print file> Verify render layer text trên ảnh Prrint file", async () => {
      await productPage.clickOnBtnWithLabel("Next, create Print file");
      await productPage.uploadImagePreviewOrPrintfile(imagePrintfile);
      await dashboard.waitForSelector(productPage.xpathImageUploadEditor, { state: "visible" });
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathImageUploadEditor,
        snapshotName: printfileEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });

  test("@SB_PRB_PRB_PRO_SBP_67 Verify hiển thị text khi sd Custom text overflow và alignment", async ({
    snapshotFixture,
    dashboard,
    conf,
    context,
  }) => {
    layers = conf.caseConf.layers;
    const defaultScaleEnvidence = conf.caseConf.default_scale_envidence.replace("envRun", envRun);
    const editorShrinkEnvidence = conf.caseConf.editor_shrink_envidence.replace("envRun", envRun);
    const editorScaleEnvidence = conf.caseConf.editor_scale_envidence.replace("envRun", envRun);
    const editorPrintfileEnvidence = conf.caseConf.editor_printfile_envidence.replace("envRun", envRun);
    const storefrontEnvidence = conf.caseConf.store_front_envidence.replace("envRun", envRun);
    const printfileEnvidence = conf.caseConf.printfile_envidence.replace("envRun", envRun);

    await test.step("Add new product> Click button Create Preview image >Upload Image > Add layer text 1 -> kiểm tra hiển thị default tại text overflow", async () => {
      await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
        productInfo,
        imagePreview,
        "Create Preview image",
      );
      await productPage.addLayer(layers[0]);
      await dashboard.click(productPage.xpathLayerNameAtListLayer(layers[0].layer_name));
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathPartTextOverflow,
        snapshotName: defaultScaleEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
      await dashboard.click(printBasePage.xpathIconBack);
    });

    await test.step("Add layer text 2 -> Click layer name 2 > Chọn button Shrink + resize text box (hoặc text input)", async () => {
      await productPage.addLayer(layers[1]);
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathImageUploadEditor,
        snapshotName: editorShrinkEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(
      "Add layer text 3 -> Click layer name 3 > Chọn button Scale của phần Custom text alignment + resize text box (hoặc text input)" +
        "-> Tại Text layer 3 > Chọn button căn trên / giữa / dưới",
      async () => {
        await productPage.addLayer(layers[2]);
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathImageUploadEditor,
          snapshotName: editorScaleEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      },
    );

    await test.step("CLick button Next , Create Print file> Upload ảnh print file> Verify render layer text trên ảnh Print file", async () => {
      await productPage.clickOnBtnWithLabel("Next, create Print file");
      await productPage.uploadImagePreviewOrPrintfile(imagePrintfile);
      await dashboard.waitForSelector(productPage.xpathImageUploadEditor, { state: "visible" });
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathImageUploadEditor,
        snapshotName: editorPrintfileEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step("Tạo CO loại text filed cho 2 layer > Click button Save", async () => {
      await personalizePage.clickBtnExpand();
      await personalizePage.clickOnBtnWithLabel("Customize layer");
      await personalizePage.addListCustomOptionOnEditor(customOption);
      await personalizePage.clickOnBtnWithLabel("Save");
      await personalizePage.clickOnBtnWithLabel("Cancel");
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
      await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
    });

    await test.step("Click view producton SF > Input value on các CO> Click button Preview your design > Verify mockup live preview", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
      await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
      await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
      await campaignSF.inputCustomAllOptionSF(customOptionSF);
      await campaignSF.clickOnBtnPreviewSF();
      await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: campaignSF.xpathPopupLivePreview(),
        snapshotName: storefrontEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
      await campaignSF.closePreview("Inside");
    });

    await test.step("Select variant> Add to cart > Checkout thành công> Open orrder detail > Verify render printfile", async () => {
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
      orderName = await checkout.getOrderName();
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile(
        "Print file has been generated",
        orderName,
        1,
        5,
        "only_order_items",
      );
      await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
      ]);
      //wait for the image to finish loading at new page
      //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
      await newPage.waitForTimeout(5000);
      await snapshotFixture.verify({
        page: newPage,
        snapshotName: printfileEnvidence,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });

  test(
    "@SB_PRB_PRB_PRO_SBP_81 Verify Layer có hiệu ứng Curve với Style effect cho cùng 1 layer text khi" +
      " Switch qua lại giữa màn preview image và print file trong editor",
    async ({ snapshotFixture, dashboard, conf, context }) => {
      listLayers = conf.caseConf.list_layer;
      const editorPreviewEnvidence = conf.caseConf.editor_preview_envidence.replace("envRun", envRun);
      const storefrontEnvidence = conf.caseConf.storefront_envidence.replace("envRun", envRun);
      const printfileEnvidence = conf.caseConf.printfile_envidence.replace("envRun", envRun);

      await test.step("Add new product> Click button Create Preview image >Upload Image -> click btn 'Add text' >Add 5 layer text", async () => {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
          productInfo,
          imagePreview,
          "Create Preview image",
        );
        await productPage.addLayers(listLayers);
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathImageUploadEditor,
          snapshotName: editorPreviewEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });

      await test.step("CLick button Next , Create Print file> Upload ảnh print file> Verify render layer text trên ảnh Print file", async () => {
        await productPage.clickOnBtnWithLabel("Next, create Print file");
        await productPage.uploadImagePreviewOrPrintfile(imagePreview);
        await dashboard.waitForSelector(productPage.xpathImageUploadEditor, { state: "visible" });
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathImageUploadEditor,
          snapshotName: editorPreviewEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });

      await test.step("Tạo CO loại text filed cho 5 layers > Click button Save", async () => {
        await personalizePage.clickBtnExpand();
        await personalizePage.clickOnBtnWithLabel("Customize layer");
        await personalizePage.addListCustomOptionOnEditor(customOption);
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await dashboard.waitForLoadState("networkidle");
        await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
        await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
      });

      await test.step("Click view producton SF > Input value on các CO> Click button Preview your design > Verify mockup live preview", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
        ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
        await campaignSF.inputCustomAllOptionSF(customOptionSF);
        await campaignSF.clickOnBtnPreviewSF();
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathPopupLivePreview(),
          snapshotName: storefrontEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await campaignSF.closePreview("Inside");
      });

      await test.step("Select variant> Add to cart > Checkout thành công> Open orrder detail > Verify render printfile", async () => {
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
        orderName = await checkout.getOrderName();
        await productPage.navigateToMenu("Orders");
        await ordersPage.searchOrder(orderName);
        await ordersPage.goToOrderDetailSBase(orderName);
        await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
        await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
        ]);
        //wait for the image to finish loading at new page
        //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
        await newPage.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: newPage,
          snapshotName: printfileEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
    },
  );

  test(
    "@SB_PRB_PRB_PRO_SBP_83 Verify Layer có hiệu ứng Curve với Style effect cho cùng 1 layer text" +
      " khi tạo campaign có chứa Customize group",
    async ({ snapshotFixture, dashboard, conf, context }) => {
      listLayers = conf.caseConf.list_layer;
      const createGroupLayer = conf.caseConf.groups_info;
      const addLayersToGroup = conf.caseConf.layers_group_info;
      const infoCustomizeGroup = conf.caseConf.customize_group;
      const editorPreviewEnvidence = conf.caseConf.editor_preview_envidence.replace("envRun", envRun);
      const editorPrintfileEnvidence = conf.caseConf.editor_printfile_envidence.replace("envRun", envRun);
      const printfileEnvidence = conf.caseConf.printfile_envidence.replace("envRun", envRun);

      await test.step(
        "Add new product> Click button Create Preview image >Upload Image" +
          "-> Add 6 layer text -> Add 3 layer Image -> Add 6 Group > Add Layer vào Group" +
          "-> Tạo 3 Customize Group cho 6 group trên",
        async () => {
          await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
            productInfo,
            imagePreview,
            "Create Preview image",
          );
          await productPage.addLayers(listLayers);
          for (const group of createGroupLayer) {
            await personalizePage.createGroupLayer(group.current_group, group.new_group);
          }
          await personalizePage.addLayersToGroup(addLayersToGroup);
          await personalizePage.clickBtnExpand();
          for (let i = 0; i < infoCustomizeGroup.length; i++) {
            await personalizePage.setupCustomizeGroup(infoCustomizeGroup[i]);
          }
          await snapshotFixture.verify({
            page: productPage.page,
            selector: productPage.xpathImageUploadEditor,
            snapshotName: editorPreviewEnvidence,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
          });
          await personalizePage.clickOnBtnWithLabel("Save");
        },
      );

      await test.step("CLick button Next , Create Print file> Upload ảnh print file> Verify render layer text trên ảnh Print file", async () => {
        await productPage.clickOnBtnWithLabel("Next, create Print file");
        await productPage.uploadImagePreviewOrPrintfile(imagePreview);
        await dashboard.waitForSelector(productPage.xpathImageUploadEditor, { state: "visible" });
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathImageUploadEditor,
          snapshotName: editorPrintfileEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });

      await test.step("Tạo CO loại text filed cho layer > Click button Save", async () => {
        await personalizePage.clickOnBtnWithLabel("Customize layer");
        await personalizePage.addListCustomOptionOnEditor(customOption);
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await dashboard.waitForLoadState("networkidle");
        await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
        await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
      });

      await test.step("Click view producton SF > Input value on các CO> Click button Preview your design > Verify mockup live preview", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
        ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.limitTimeWaitAttributeChange(campaignSF.getXpathThumbnailWithIndex("2"));
        for (const inputCustomGroup of customOptionSF) {
          const storefrontEnvidence = conf.caseConf.storefront_envidence
            .replace("envRun", envRun)
            .replace("groupId", inputCustomGroup.envidence_sf_id);
          await campaignSF.selectGroup(inputCustomGroup.group_name);
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await campaignSF.inputCustomAllOptionSF(inputCustomGroup.data_input_co);
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: storefrontEnvidence,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
          });
          await campaignSF.closePreview("Inside");
        }
      });

      await test.step("Select variant> Add to cart > Checkout thành công> Open orrder detail > Verify render printfile", async () => {
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
        orderName = await checkout.getOrderName();
        await productPage.navigateToMenu("Orders");
        await ordersPage.searchOrder(orderName);
        await ordersPage.goToOrderDetailSBase(orderName);
        await ordersPage.waitForStatusGeneratePrintFile(
          "Print file has been generated",
          orderName,
          1,
          5,
          "only_order_items",
        );
        await dashboard.locator(ordersPage.xpathIconActionPrintFile()).click();
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(personalizePage.getXpathWithLabel("Preview")),
        ]);
        //wait for the image to finish loading at new page
        //https://ocgwp.slack.com/archives/C0S2ESHN2/p1685871948728089?thread_ts=1685790183.041599&cid=C0S2ESHN2
        await newPage.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: newPage,
          snapshotName: printfileEnvidence,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
    },
  );
});
