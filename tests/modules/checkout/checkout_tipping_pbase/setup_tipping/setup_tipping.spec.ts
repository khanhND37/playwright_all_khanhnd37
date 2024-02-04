import { test } from "@fixtures/theme";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Set up tipping và kiểm tra block tipping hiển thị tại trang Store front", async () => {
  let customerInfo, product, tippingInfo;
  let domain: string;
  let dashboardAPI: DashboardAPI;
  let homepage: SFHome, checkout: SFCheckout;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.suiteConf.customer_info;
    product = conf.suiteConf.product.name;
  });

  test.beforeEach(async ({ conf, authRequest, page }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    homepage = new SFHome(page, domain);
    tippingInfo = conf.caseConf.tipping_info;
    dashboardAPI.setupTipping(tippingInfo);

    await homepage.gotoHomePage();
    await checkout.addProductToCartThenInputShippingAddress(product, customerInfo);
    await checkout.continueToPaymentMethod();
  });

  test("Kiểm tra setting tipping khi merchant setup tipping @TC_PB_TIP_1", async ({}) => {
    await test.step("Kiểm tra tipping hiển thị tại trang Checkout", async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });
  });

  test("Kiểm tra setting tipping khi merchant setup tipping @TC_PB_TIP_2", async ({}) => {
    await test.step("Kiểm tra tipping hiển thị tại trang Checkout", async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });
  });
});
