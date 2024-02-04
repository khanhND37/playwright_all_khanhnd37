import { test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { ProductAPI } from "@pages/api/product";

test.describe("Checkout API", () => {
  test(`@TC_API_001 Create a checkout link with specified products`, async ({ conf, authRequest, page }) => {
    const { domain } = conf.suiteConf as never;
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const productsCheckout = conf.caseConf.products_checkout;

    await test.step(`Add product to cart then open checkout link`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productsCheckout);
      const checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.waitAbit(100000);
    });
  });

  test(`@TC_API_002 Create a checkout link with any product`, async ({ conf, authRequest, page }) => {
    const { domain } = conf.suiteConf as never;
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const productApi = new ProductAPI(domain, authRequest);
    const productsCheckout = conf.caseConf.products_checkout;
    productsCheckout[0].variant_id = await productApi.getThe1stVarriantId();

    await test.step(`Add product to cart then open checkout link`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productsCheckout);
      const checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.waitAbit(100000);
    });
  });
});
