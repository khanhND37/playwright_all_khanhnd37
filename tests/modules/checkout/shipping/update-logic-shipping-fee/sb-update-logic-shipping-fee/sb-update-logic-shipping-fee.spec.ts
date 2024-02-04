import { expect, test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Update logic shipping fee SB", () => {
  let checkoutAPI: CheckoutAPI;
  let checkoutPage: SFCheckout;

  test.beforeEach(async ({ conf, request, page }) => {
    const product = conf.suiteConf.product;
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, request, page);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    await checkoutAPI.addProductToCartThenCheckout(product);
    await checkoutAPI.openCheckoutPageByToken();
  });

  test(`@SB_SET_SP_24 Kiểm tra update logic shipping fee theo country và state/ province trên Shopbase`, async ({
    conf,
  }) => {
    const expMes = conf.caseConf.error_message;
    const shippingMethodVn = conf.suiteConf.shipping_method_vn;
    const shippingMethodUs = conf.suiteConf.shipping_method_us;

    await test.step(`Chọn country không có state/ province`, async () => {
      await checkoutPage.page.waitForLoadState("networkidle");
      await checkoutPage.selectCountry("Vietnam");
      await checkoutPage.selectShippingMethod(shippingMethodVn);
      const shippingFee = await checkoutPage.getShippingFeeOnOrderSummary();
      const shippingRate = await checkoutPage.getShippingFeeByRateName(shippingMethodVn);
      expect(shippingFee).toEqual(shippingRate);
    });

    await test.step(`Chọn country có state/ province`, async () => {
      await checkoutPage.selectCountry("United States");
      const mes = await checkoutPage.getMessageShipping();
      const shippingFee = await checkoutPage.getShippingFeeOnOrderSummary();
      //get total order khi chưa chọn State/Province
      const total = await checkoutPage.genLoc(`//td[@class='order-summary__emphasis']`).textContent();
      const orderSummary = await checkoutPage.genLoc(`//div/span[@class='order-summary__emphasis']`).textContent();
      expect(mes).toEqual(expMes);
      expect(shippingFee).toEqual("Calculated at next step");
      expect(total).toEqual(orderSummary);
    });

    await test.step(`Chọn state`, async () => {
      await checkoutPage.selectStateOrProvince("New York");
      await checkoutPage.page.waitForResponse(
        response =>
          response.url().includes("shipping-methods.json?country_code=US&province_code=NY") &&
          response.status() === 200,
      );
      await checkoutPage.selectShippingMethod(shippingMethodUs);
      const shippingFee = await checkoutPage.getShippingFeeOnOrderSummary();
      const shippingRate = await checkoutPage.getShippingFeeByRateName(shippingMethodUs);
      expect(shippingFee).toEqual(shippingRate);
    });
  });
});
