import { test } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ShippingAddress } from "@types";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { cloneDeep } from "@core/utils/object";
import { DashboardAPI } from "@pages/api/dashboard";

let shopDomain: string;
let productHandle: string;
let productName: string;

let homepage: SFHome;
let productPage: SFProduct;
let checkout: SFCheckout;
let shippingInfo: ShippingAddress;
let analyticsPage: AnalyticsPage;
let dashboardAPI: DashboardAPI;

test.describe("Non fulfillment traffic from", async () => {
  test.beforeEach(async ({ conf, page, authRequest, dashboard }) => {
    shopDomain = conf.suiteConf.domain;
    productHandle = conf.caseConf.product_handle;
    productName = conf.caseConf.product_name;
    shippingInfo = conf.caseConf.shipping_address;

    homepage = new SFHome(page, shopDomain);
    productPage = new SFProduct(page, shopDomain);
    checkout = new SFCheckout(page, conf.suiteConf.domain);
    analyticsPage = new AnalyticsPage(page, shopDomain, authRequest);
    dashboardAPI = new DashboardAPI(shopDomain, authRequest, dashboard);
  });

  test(`@SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_24 [PLB/PB] Verify data thay đổi khi user apply filter Traffic form, trường hợp địa chỉ IP của buyer thuộc country support ship, checkout đến country không support ship`, async ({
    conf,
    authRequest,
  }) => {
    const dataAnalytics = cloneDeep(conf.suiteConf.data_analytics);
    await test.step(`Checkout order `, async () => {
      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingInfo);
    });

    await test.step(`Vào Analytics > Select filter traffic form = All locations > Verify data hiển thị tại Online store conversion rate`, async () => {
      const today = new Date().toLocaleDateString("fr-CA");
      await analyticsPage.getDataAnaCrAPI(
        authRequest,
        today,
        `${conf.suiteConf.shop_id}`,
        "total_profit",
        dataAnalytics,
        today,
        false,
      );
    });

    await test.step(`Vào Conversion Analytics > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, false);
    });

    await test.step(`Vào Sales report > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, false);
    });

    await test.step(`Vào Analytics > Thực hiện thay đổi filter = Available shipping locations > Verify data hiển thị tại Online store conversion rate`, async () => {
      const today = new Date().toLocaleDateString("fr-CA");
      await analyticsPage.getDataAnaCrAPI(
        authRequest,
        today,
        `${conf.suiteConf.shop_id}`,
        "total_profit",
        dataAnalytics,
        today,
        true,
      );
    });

    await test.step(`Vào Conversion Analytics > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, true);
    });

    await test.step(`Vào Sales report > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, true);
    });
  });

  test(`@SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_23 [PLB/PB] Verify data thay đổi khi user apply filter Traffic form, trường hợp địa chỉ IP của buyer thuộc country không support ship, checkout đến country support ship`, async ({
    conf,
    authRequest,
  }) => {
    const dataAnalytics = cloneDeep(conf.suiteConf.data_analytics);
    await test.step(`Checkout order `, async () => {
      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingInfo);
    });

    await test.step(`Vào Analytics > Select filter traffic form = All locations > Verify data hiển thị tại Online store conversion rate`, async () => {
      const today = new Date().toLocaleDateString("fr-CA");
      await analyticsPage.getDataAnaCrAPI(
        authRequest,
        today,
        `${conf.suiteConf.shop_id}`,
        "total_profit",
        dataAnalytics,
        today,
        false,
      );
    });

    await test.step(`Vào Conversion Analytics > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, false);
    });

    await test.step(`Vào Sales report > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, false);
    });

    await test.step(`Vào Analytics > Thực hiện thay đổi filter = Available shipping locations > Verify data hiển thị tại Online store conversion rate`, async () => {
      const today = new Date().toLocaleDateString("fr-CA");
      await analyticsPage.getDataAnaCrAPI(
        authRequest,
        today,
        `${conf.suiteConf.shop_id}`,
        "total_profit",
        dataAnalytics,
        today,
        true,
      );
    });

    await test.step(`Vào Conversion Analytics > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, true);
    });

    await test.step(`Vào Sales report > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, true);
    });
  });

  test(`@SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_22 [PLB/PB] Verify data thay đổi khi user apply filter Traffic form, trường hợp địa chỉ IP của buyer thuộc country không support ship, checkout đến country không support ship`, async ({
    authRequest,
    conf,
  }) => {
    const dataAnalytics = cloneDeep(conf.suiteConf.data_analytics);
    await test.step(`Checkout order `, async () => {
      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingInfo);
    });

    await test.step(`Vào Analytics > Select filter traffic form = All locations > Verify data hiển thị tại Online store conversion rate`, async () => {
      const today = new Date().toLocaleDateString("fr-CA");
      await analyticsPage.getDataAnaCrAPI(
        authRequest,
        today,
        `${conf.suiteConf.shop_id}`,
        "total_profit",
        dataAnalytics,
        today,
        false,
      );
    });

    await test.step(`Vào Conversion Analytics > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, false);
    });

    await test.step(`Vào Sales report > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, false);
    });

    await test.step(`Vào Analytics > Thực hiện thay đổi filter = Available shipping locations > Verify data hiển thị tại Online store conversion rate`, async () => {
      const today = new Date().toLocaleDateString("fr-CA");
      await analyticsPage.getDataAnaCrAPI(
        authRequest,
        today,
        `${conf.suiteConf.shop_id}`,
        "total_profit",
        dataAnalytics,
        today,
        true,
      );
    });

    await test.step(`Vào Conversion Analytics > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, true);
    });

    await test.step(`Vào Sales report > Verify data hiển thị`, async () => {
      await dashboardAPI.getDataConversionAnalytics(conf.suiteConf.data_filter_info, conf.suiteConf.init_data, true);
    });
  });
});
