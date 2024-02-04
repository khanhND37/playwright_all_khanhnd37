import { expect, test } from "@core/fixtures";
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
    product = conf.suiteConf.product;
  });

  test.beforeEach(async ({ conf, authRequest, page }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    tippingInfo = conf.caseConf.tipping_info;
    const resBody = await dashboardAPI.setupTipping(tippingInfo);
    expect(resBody.tip.enabled).toEqual(tippingInfo.is_enable);
    expect(resBody.tip.percentages).toEqual(tippingInfo.percentages);

    await homepage.gotoHomePage();
    await checkout.addProductToCartThenInputShippingAddress(product, customerInfo);
    await checkout.continueToPaymentMethod();
  });

  test("Kiểm tra tip hiển thị tại trang Checkout khi merchant setup tipping option @TC_SB_PLB_TIP_1", async ({}) => {
    await test.step("Kiểm tra tipping hiển thị tại trang Checkout", async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });
  });

  test("Kiểm tra tip hiển thị trang Checkout khi merchant không setup tipping option @TC_SB_PLB_TIP_2", async ({}) => {
    await test.step("Kiểm tra tipping hiển thị tại trang Checkout", async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });
  });
});
