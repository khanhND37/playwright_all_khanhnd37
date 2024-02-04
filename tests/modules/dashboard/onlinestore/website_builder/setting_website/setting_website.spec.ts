import { WebBuilder } from "@pages/dashboard/web_builder";
import { test, expect } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { SFHome } from "@sf_pages/homepage";
import { Campaign } from "@sf_pages/campaign";
import { OrdersPage } from "@pages/dashboard/orders";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import { Personalize } from "@pages/dashboard/personalize";
import { ProductPage } from "@pages/dashboard/products";
import { PreferencesPage } from "@pages/dashboard/preference";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Setting website builder", () => {
  let webBuilder: WebBuilder;
  let blocks: Blocks;
  let onlineStorePage: OnlineStorePage;
  let preferencesPage: PreferencesPage;
  let snapshotName;
  let personalizePage: Personalize;
  let homPageSF: SFHome;
  let checkoutSF: SFCheckout;
  let campaignSF: Campaign;
  let ordersPage: OrdersPage;
  let productPage: ProductPage;
  let snapshotOptions: object;
  test.beforeEach(async ({ dashboard, conf, theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    preferencesPage = new PreferencesPage(dashboard, conf.suiteConf.domain);
    homPageSF = new SFHome(dashboard, conf.suiteConf.domain);
    snapshotOptions = {
      maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
      threshold: conf.suiteConf.param_threshold,
      maxDiffPixels: conf.suiteConf.max_diff_pixels,
    };
    await test.step("Set data for page & go to page", async () => {
      //Go to web front by page ID
      if (conf.caseConf.website_builder) {
        await theme.publish(conf.suiteConf.theme_criadora);
        await dashboard.evaluate(pageId => {
          // eslint-disable-next-line
          return (window as any).router.push(`/builder/site/${pageId}`);
        }, conf.suiteConf.theme_criadora);
        await dashboard.waitForResponse(
          response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
        );
        //wait icon loading hidden
        await blocks.waitForElementVisibleThenInvisible(blocks.xpathPreviewSpinner);
      } else {
        await theme.publish(conf.suiteConf.theme_inside);
      }
    });
  });

  test("Kiểm tra trường hợp lưu data khi click button save và reload lại  @SB_WEB_BUILDER_STI_WEB_5", async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step("Fill thông tin cho các options trong General->Click button Save trên web builder", async () => {
      await webBuilder.clickIconWebsiteSetting();
      await webBuilder.clickCategorySetting("General");
      await webBuilder.editGeneralSetting(conf.caseConf.setting_general);
      await webBuilder.clickOnBtnWithLabel("Save");
      await webBuilder.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebarGeneral,
        snapshotName: conf.caseConf.image,
        snapshotOptions: snapshotOptions,
      });
    });

    await test.step("Reload lại page", async () => {
      await webBuilder.page.reload();
      await webBuilder.page.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      //wait icon loading hidden
      await blocks.waitForElementVisibleThenInvisible(blocks.xpathPreviewSpinner);
      await webBuilder.clickIconWebsiteSetting();
      await webBuilder.clickCategorySetting("General");
      await webBuilder.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebarGeneral,
        snapshotName: conf.caseConf.image,
        snapshotOptions: snapshotOptions,
      });
    });
  });

  test("Kiểm tra trường hợp giữ data trong preference khi switch theme từ v2 sang v3, từ v3 xuống v2  @SB_WEB_BUILDER_STI_WEB_6", async ({
    conf,
    theme,
    dashboard,
    snapshotFixture,
  }) => {
    const reference = conf.caseConf.setting_reference;
    await test.step("- Fill thông tin cho các options trong Preference", async () => {
      await onlineStorePage.goto(conf.suiteConf.url_reference);
      await preferencesPage.editInfoOnPreferencesPage(conf.caseConf.setting_reference);
      await onlineStorePage.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: onlineStorePage.page,
        selector: onlineStorePage.xpathFavicon,
        snapshotName: conf.caseConf.picture.preference_1,
        snapshotOptions: snapshotOptions,
      });
      expect(await preferencesPage.getInfoOnPreferencesPage(reference)).toEqual(reference);
    });

    await test.step("- Switch theme sang theme V3 (web builder)", async () => {
      await theme.publish(conf.suiteConf.theme_criadora);
      await dashboard.evaluate(pageId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/builder/site/${pageId}`);
      }, conf.suiteConf.theme_criadora);
      await dashboard.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      //wait icon loading hidden
      await blocks.waitForElementVisibleThenInvisible(blocks.xpathPreviewSpinner);
    });

    await test.step("- Kiểm tra thông tin trong Website setting>General", async () => {
      await webBuilder.clickIconWebsiteSetting();
      await webBuilder.clickCategorySetting("General");
      await webBuilder.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebarGeneral,
        snapshotName: conf.caseConf.picture.general,
        snapshotOptions: snapshotOptions,
      });
    });

    await test.step("Switch theme sang theme V2 (Inside, Roller)", async () => {
      await theme.publish(conf.suiteConf.theme_inside);
    });

    await test.step("Kiểm tra thông tin trong Online Store > Preference", async () => {
      await onlineStorePage.goto(conf.suiteConf.url_reference);
      await onlineStorePage.page.waitForSelector(onlineStorePage.xpathHeader);
      expect(await preferencesPage.getInfoOnPreferencesPage(reference)).toEqual(reference);
      await onlineStorePage.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: onlineStorePage.page,
        selector: onlineStorePage.xpathFavicon,
        snapshotName: conf.caseConf.picture.preference_2,
        snapshotOptions: snapshotOptions,
      });
    });
  });

  test("Kiểm tra trường hợp data được update trong web setting ảnh hưởng đến storefront  @SB_WEB_BUILDER_STI_WEB_13", async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update thông tin trong webstite builder", async () => {
      await webBuilder.clickIconWebsiteSetting();
      await webBuilder.clickCategorySetting("General");
      await webBuilder.editGeneralSetting(conf.caseConf.setting_general);
      await webBuilder.clickOnBtnWithLabel("Save");
      await webBuilder.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebarGeneral,
        snapshotName: conf.caseConf.picture.general,
        snapshotOptions: snapshotOptions,
      });
    });

    await test.step("Kiểm tra thông tin update", async () => {
      await homPageSF.gotoHomePage();
      const metaDescription = await homPageSF.page.locator(homPageSF.xpathMetaDescription).getAttribute("content");
      expect(metaDescription).toEqual(conf.caseConf.setting_general.description);
      await expect(homPageSF.page.locator(homPageSF.xpathTitleWebsite)).toContainText(
        conf.caseConf.setting_general.title,
      );
      expect(conf.caseConf.setting_general.additional_scripts_body).toContain(
        await homPageSF.page.locator(conf.caseConf.custom_code_body).textContent(),
      );
      const scriptHeader = await homPageSF.page
        .locator(conf.caseConf.script_display_head.element)
        .getAttribute("content");
      expect(scriptHeader).toEqual(conf.caseConf.script_display_head.content);
    });
  });

  test("Kiểm tra switch theme v2 (inside, roller) sang web builder v3  @SB_WEB_BUILDER_STI_WEB_11", async ({
    conf,
    theme,
    dashboard,
    snapshotFixture,
  }) => {
    const reference = conf.caseConf.setting_reference;
    await onlineStorePage.goto(conf.suiteConf.url_reference);
    await preferencesPage.editInfoOnPreferencesPage(reference);
    await test.step("- Chuyển theme từ inside, roller sang web builder", async () => {
      await theme.publish(conf.suiteConf.theme_criadora);
      await onlineStorePage.page.reload();
      await onlineStorePage.goto("admin/themes");
      //check an navigation
      await onlineStorePage.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: onlineStorePage.page,
        selector: onlineStorePage.xpathMenuOnlineStore,
        snapshotName: conf.caseConf.picture.sidebar,
        snapshotOptions: snapshotOptions,
      });
      //check Favicon Title,Meta,description,Additional scripts,... được move sang web builder
      await dashboard.evaluate(pageId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/builder/site/${pageId}`);
      }, conf.suiteConf.theme_criadora);
      await dashboard.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      //wait icon loading hidden
      await blocks.waitForElementVisibleThenInvisible(blocks.xpathPreviewSpinner);
      await webBuilder.clickIconWebsiteSetting();
      await webBuilder.clickCategorySetting("General");
      await webBuilder.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebarGeneral,
        snapshotName: conf.caseConf.picture.general,
        snapshotOptions: snapshotOptions,
      });
    });
  });

  test(" Kiểm tra trường hợp đang sử dụng website builder sau đó switch sang theme cũ (inside, roller) v3  @SB_WEB_BUILDER_STI_WEB_12", async ({
    conf,
    theme,
    snapshotFixture,
  }) => {
    const general = conf.caseConf.setting_general;
    await webBuilder.clickIconWebsiteSetting();
    await webBuilder.clickCategorySetting("General");
    await webBuilder.editGeneralSetting(general);
    await webBuilder.clickOnBtnWithLabel("Save");
    await test.step("Chuyển từ web builder sang inside, rolelr", async () => {
      await theme.publish(conf.suiteConf.theme_inside);
      await onlineStorePage.page.reload();
      await onlineStorePage.goto("admin/themes");
      //check an navigation
      await onlineStorePage.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: onlineStorePage.page,
        selector: onlineStorePage.xpathMenuOnlineStore,
        snapshotName: conf.caseConf.picture.sidebar,
        snapshotOptions: snapshotOptions,
      });

      await onlineStorePage.goto(conf.suiteConf.url_reference);
      await onlineStorePage.page.waitForSelector(onlineStorePage.xpathHeader);
      expect(await preferencesPage.getInfoOnPreferencesPage(general)).toEqual(general);
      await onlineStorePage.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: onlineStorePage.page,
        selector: onlineStorePage.xpathFavicon,
        snapshotName: conf.caseConf.picture.favicon,
        snapshotOptions: snapshotOptions,
      });
    });
  });

  test("Kiểm tra giao diện và chức năng sau khi move POD-related setting sang Personalize trong setting  @SB_WEB_BUILDER_STI_WEB_10", async ({
    conf,
    page,
    authRequest,
    dashboard,
    snapshotFixture,
  }) => {
    let orderName;
    await test.step("Kiểm tra giao diện POD related setting sau khi move vào trong Setting> Personalize", async () => {
      await webBuilder.goto(conf.suiteConf.personalize);
      await webBuilder.page.waitForSelector(webBuilder.xpathTitlePageSettingWithLabel("Personalize"));
      //check an navigation
      await webBuilder.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathContainerPageSetting,
        snapshotName: conf.caseConf.picture.personalize,
        snapshotOptions: snapshotOptions,
      });
    });

    await test.step("Kiểm tra chức năng của POD related setting sau khi move sang Setting > Personalize", async () => {
      personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
      productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      const productInfo = conf.caseConf.product_all_info;
      const imagePreview = conf.caseConf.image_preview;
      const layerList = conf.caseConf.layers;
      const customOptions = conf.caseConf.custom_option_info;
      const customOptionShowSF = conf.caseConf.custom_option_data_SF;
      const conditionalLogicInfo = conf.caseConf.conditional_logic_info;
      campaignSF = new Campaign(page, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
      snapshotName = conf.caseConf.picture;
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      const shippingInfo = conf.suiteConf.shipping_info;
      const cardInfo = conf.suiteConf.card_info;
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

      await campaignSF.gotoHomePageThenAddCustomOptionToCart(
        homPageSF,
        productInfo.title,
        customOptionShowSF.list_custom,
      );
      await checkoutSF.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
      orderName = checkoutSF.getOrderName();
      await productPage.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ordersPage.xpathBlockFulfill,
        snapshotName: snapshotName.print_file_block_generate_file,
        snapshotOptions: snapshotOptions,
      });

      await personalizePage.page.click(personalizePage.xpathLinkTextPrintFile("Generate print file"));
      await personalizePage.generatePrintFileOnOrderDetail("No, only generate for this ordered", true);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ordersPage.xpathBlockFulfill,
        snapshotName: snapshotName.print_file_block_generated_file,
        snapshotOptions: snapshotOptions,
      });
    });
  });
});
