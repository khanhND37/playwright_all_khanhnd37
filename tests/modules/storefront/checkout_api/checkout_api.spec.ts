import { test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
test.describe("checkout api @TC_API_001", () => {
  test("create a new order by API @TC_API_001", async ({ conf, request }) => {
    // eslint-disable-next-line camelcase
    const { domain, email, products, shipping_address, card_info } = conf.suiteConf as never;

    const countryCode = conf.suiteConf.shipping_address.country_code;

    const checkoutAPI = new CheckoutAPI(domain, request);

    await checkoutAPI.addProductToCartThenCheckout(products);
    await checkoutAPI.updateCustomerInformation(email, shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    await checkoutAPI.authorizedThenCreateStripeOrder(card_info);
  });
});
