import { expect, test } from "@core/fixtures";
import { CheckoutMobile } from "@pages/mobile/checkout";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Checkout qua mobile với 2 loại cổng: Stripe, PayPal với themeV2", () => {
  let checkoutPage: CheckoutMobile;
  test.beforeEach(async ({ pageMobile, conf }) => {
    const { product, customer_info } = conf.suiteConf as never;
    const domain = conf.suiteConf.domain;

    const homePage = new SFHome(pageMobile, domain);
    checkoutPage = new CheckoutMobile(pageMobile, domain);

    await homePage.gotoHomePage();
    await checkoutPage.addProductToCartThenInputShippingAddressOnMobile(product, customer_info);
  });
  test(`Kiểm tra checkout với Stripe thành công trên mobile @TC_SB_CHE_CHEN_19`, async ({ conf }) => {
    await test.step("Thanh toán qua cổng Stripe", async () => {
      await checkoutPage.completeOrderWithCardInfo(conf.caseConf.card_info);

      expect(await checkoutPage.getTextContent(".os-header__title")).toBe("Thank you!");
    });
  });

  test(`Kiểm tra checkout với Paypal thành công trên mobile @TC_SB_CHE_CHEN_20`, async ({ conf }) => {
    await test.step("Thanh toán qua cổng PayPal", async () => {
      await checkoutPage.selectPaymentMethod("PayPal");
      await checkoutPage.completeOrderViaPayPalOnMobile(conf.caseConf.paypal_account);
      expect(await checkoutPage.getTextContent(".os-header__title")).toBe("Thank you!");
    });
  });
});
