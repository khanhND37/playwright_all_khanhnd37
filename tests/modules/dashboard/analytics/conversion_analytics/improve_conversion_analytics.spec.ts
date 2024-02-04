import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { expect, Page } from "@playwright/test";
import { DashboardAPI } from "@pages/api/dashboard";

const goToSFHomePage = async (page: Page, domain: string) => {
  await page.goto(`https://${domain}`);
  await page.waitForLoadState("networkidle");
};

const goToCollection = async (page: Page, domain: string) => {
  await page.goto(`https://${domain}/collections/all`);
  await page.waitForLoadState("networkidle");
};

test.describe("Conversion Analytics", () => {
  let email: string;
  let domain: string;
  let prodName: string;
  let customerInfo;

  let homepage: SFHome;
  let checkout: SFCheckout;
  let productPage: SFProduct;
  let dashboardAPI: DashboardAPI;
  let conversionReportsBefore: object;
  let timeOut: number;

  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    email = conf.suiteConf.email;
    domain = conf.suiteConf.domain;
    prodName = conf.caseConf.products_checkout;
    customerInfo = conf.suiteConf.customer_info;
    timeOut = conf.suiteConf.time_out_tc;
    dashboardAPI = new DashboardAPI(domain, authRequest, dashboard);

    conversionReportsBefore = await dashboardAPI.getDataConversionAnalytics(
      conf.suiteConf.data_filter_info,
      conf.caseConf.init_data,
    );
  });
  test(`@SB_SB_DP_IMP_CRP_UCA_02 [Roller][Shopbase] Kiểm tra logic call action và analytics ghi nhận đủ các step khi thực hiện 1 session bình thường`, async ({
    page,
    conf,
  }) => {
    homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    productPage = new SFProduct(page, domain);
    test.setTimeout(timeOut);

    await test.step(`
      - Vào Storefront của store
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([goToSFHomePage(page, domain), homepage.waitForEventCompleted(domain, "view_page")]);
    });

    await test.step(`
      - Click vào view collection
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([goToCollection(page, domain), homepage.waitForEventCompleted(domain, "view_page")]);
    });

    await test.step(`
      - Click vào một sản phẩm bất kỳ
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([
        homepage.searchThenViewProduct(prodName),
        homepage.waitForEventCompleted(domain, "view_content"),
      ]);
    });

    await test.step(`
      - Click buton Add to cart
      - Đợi cart page hiện ra
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([productPage.addToCart(), productPage.waitForEventCompleted(domain, "add_to_cart")]);
    });

    await test.step(`
      - Click button checkout
      - Đợi checkout page hiện ra
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([
        productPage.navigateToCheckoutPage(),
        checkout.waitForEventCompleted(domain, "reached_checkout"),
      ]);
    });

    await test.step(`
      - Fill email
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([
        checkout.inputEmail(email),
        checkout.waitForEventCompleted(domain, "fill_shipping_info"),
        checkout.waitForEventCompleted(domain, "do_checkout"),
      ]);
    });

    await test.step(`
      - Điền đủ thông tin shipping info
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([
        checkout.enterShippingAddress(customerInfo),
        checkout.waitForEventCompleted(domain, "complete_shipping_info"),
      ]);
    });

    await test.step(`
      - Chọn payment method credit card
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await checkout.selectPaymentMethod(PaymentMethod.PAYPAL);
      await Promise.all([
        checkout.selectPaymentMethod(PaymentMethod.STRIPE),
        checkout.waitForEventCompleted(domain, "fill_payment_info"),
      ]);
    });

    await test.step(`
      - Nhập đủ thông tin card
      - Click Place your order
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([
        checkout.completeOrderWithCardInfo(conf.suiteConf.card_info),
        checkout.waitForEventCompleted(domain, "place_order"),
      ]);
    });

    await test.step(`
      - Đợi hiển thị thankyou page
      - Devtool > Tìm đến api action.json
      - Vào phần Payload`, async () => {
      await Promise.all([
        checkout.page.waitForSelector(checkout.xpathThankYou),
        checkout.waitForEventCompleted(domain, "purchase"),
      ]);
    });

    await test.step(`
      - Vào dashboard
      - Vào Conversion analytcis page
      - Kiểm tra filter funnel bảng conversion rate theo cả 11 steps
      - Hover vào các cột`, async () => {
      const conversionReportsAfter = await dashboardAPI.validateDataConversionAnalytics(
        conversionReportsBefore,
        conf.suiteConf.data_filter_info,
      );

      expect(conversionReportsAfter["view_all"]).toEqual(conversionReportsBefore["view_all"] + 1);
      expect(conversionReportsAfter["view_collect"]).toEqual(conversionReportsBefore["view_collect"] + 1);
      expect(conversionReportsAfter["view_product"]).toEqual(conversionReportsBefore["view_product"] + 1);
      expect(conversionReportsAfter["add_to_cart"]).toEqual(conversionReportsBefore["add_to_cart"] + 1);
      expect(conversionReportsAfter["reached_checkout"]).toEqual(conversionReportsBefore["reached_checkout"] + 1);
      expect(conversionReportsAfter["do_checkout"]).toEqual(conversionReportsBefore["do_checkout"] + 1);
      expect(conversionReportsAfter["fill_shipping_info"]).toEqual(conversionReportsBefore["fill_shipping_info"] + 1);
      expect(conversionReportsAfter["complete_shipping_info"]).toEqual(
        conversionReportsBefore["complete_shipping_info"] + 1,
      );
      expect(conversionReportsAfter["fill_payment_info"]).toEqual(conversionReportsBefore["fill_payment_info"] + 1);
      expect(conversionReportsAfter["place_order"]).toEqual(conversionReportsBefore["place_order"] + 1);
      expect(conversionReportsAfter["purchase"]).toEqual(conversionReportsBefore["purchase"] + 1);
    });
  });
});
