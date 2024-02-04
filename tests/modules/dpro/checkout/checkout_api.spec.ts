import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";

test.describe(" API Checkout SB Creator @TS_CR_MB", () => {
  test.beforeEach(async ({ conf, token }) => {
    await token.getWithCredentials({
      domain: conf.caseConf.domain,
      username: conf.caseConf.username,
      password: conf.caseConf.password,
    });
  });

  test(`[API] Verify api creat an empty cart @SB_DP_DPSF_CDP_10`, async ({ conf, request }) => {
    const { domain } = conf.caseConf as never;

    await test.step(`Check gọi api creat an empty cart`, async () => {
      const checkoutAPI = new CheckoutAPI(domain, request);
      const dataCart = await checkoutAPI.createCart();
      expect(dataCart).not.toBeNull();
      expect(dataCart.token).toBeDefined();
      expect(dataCart.checkout_token).toBeDefined();
    });
  });

  test(`[API] - PUT Verify gọi api "Add to cart" @SB_DP_DPSF_CDP_11`, async ({ conf, request }) => {
    const caseName = "SB_DP_DPSF_CDP_11";
    const dataAddProduct = loadData(__dirname, caseName);
    const { domain } = conf.caseConf as never;
    const checkoutAPI = new CheckoutAPI(domain, request);

    for (let i = 0; i < dataAddProduct.caseConf.data.length; i++) {
      const caseData = conf.caseConf.data[i];
      await test.step(`Gọi API "Add to cart" với data: ${caseData.case}`, async () => {
        const dataCart = await checkoutAPI.addProductCreatorToCart(caseData.cart_info);

        if (dataCart.status === 200) {
          expect(dataCart.cart).toEqual(
            expect.objectContaining({
              properties: caseData.cart_info.cartItem.properties,
              qty: caseData.cart_info.cartItem.qty,
              variant_id: caseData.cart_info.cartItem.variant_id,
            }),
          );
        } else {
          expect(await `${dataCart.messages}`).toEqual(caseData.response.message);
        }
      });
    }
  });

  test(`[API] Verify gọi api "Cart" thành công @SB_DP_DPSF_CDP_13`, async ({ authRequest, conf, request }) => {
    const { domain } = conf.caseConf as never;
    const checkoutAPI = new CheckoutAPI(domain, request);
    const caseData = conf.caseConf.data;
    const data = await checkoutAPI.addProductCreatorToCart(caseData.cart_info);
    await test.step(`PUT - gọi API add product vào cart`, async () => {
      expect(data.cart).toEqual(
        expect.objectContaining({
          properties: caseData.cart_info.cartItem.properties,
          qty: caseData.cart_info.cartItem.qty,
          variant_id: caseData.cart_info.cartItem.variant_id,
        }),
      );
    });
    await test.step(`GET - gọi api lấy thông tin cart`, async () => {
      const response = await authRequest.get(
        `https://${conf.caseConf.domain}/api/checkout/next/cart.json?cart_token=${data.cart_token}`,
        {},
      );
      expect(response.status()).toEqual(caseData.response.status);
    });
  });
});
