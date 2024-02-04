import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";

test.describe("Checkout API", () => {
  test(`@TC_API_001 Checkout API Stripe/Spay without PPC`, async ({ conf, authRequest }) => {
    const { domain } = conf.suiteConf as never;
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const productsCheckout = conf.caseConf.products_checkout;

    await test.step(`Add product to cart then checkout`, async () => {
      const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
      });
      expect(checkoutInfos).not.toBeUndefined();
    });
  });
});
