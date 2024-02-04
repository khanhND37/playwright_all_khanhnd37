import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";

test.beforeAll(async ({ authRequest, conf }) => {
  // update quantity trong inventory cho Yonex = 3
  const res = await authRequest.put(
    `https://${conf.suiteConf.domain}/admin/variants/${conf.suiteConf.variant_id}.json`,
    {
      data: {
        variant: {
          inventory_quantity: 3,
        },
      },
    },
  );
  expect(res.status()).toBe(200);
});
test("Kiểm tra UI trang checkout khi item trong cart out of stock @TC_SB_CHE_CHEN_56", async ({
  page,
  conf,
  authRequest,
}) => {
  const { domain, product, variant_id, customer_info } = conf.suiteConf;
  let checkout: SFCheckout;

  await test.step("Trên sf, add prouct Yonex với quantity = 3 vào giỏ hàng và đến trang checkout", async () => {
    const homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    await homepage.gotoHomePage();
    await checkout.addProductToCartThenInputShippingAddress(product, customer_info);
  });

  await test.step("Vào dashboard, update quantity của product Yonex = 2 ", async () => {
    // eslint-disable-next-line camelcase
    const res = await authRequest.put(`https://${domain}/admin/variants/${variant_id}.json`, {
      data: {
        variant: {
          inventory_quantity: 2,
        },
      },
    });
    expect(res.status()).toBe(200);
  });

  await test.step("Back về trang checkout > Reload page ", async () => {
    await page.reload();
    const description = await checkout.getTextContent(".oss-header__heading");
    expect(description).toContain("Out of stock");
    expect(description).toContain("Some items are no longer available.");
    expect(description).toContain("Your cart has been updated.");

    const productQty = await checkout.getTextContent(".checkout-product__quantity");
    expect(productQty).toContain("3"); // product quantity in cart
    expect(productQty).toContain("2"); // product quantity in inventory
  });

  await test.step("countiue checkout và kiểm tra số lượng product của Yonex trong order sumary", async () => {
    checkout.clickOnBtnWithLabel("Continue");
    const productQty = Number(await checkout.getTextContent(".checkout-product-thumbnail__quantity"));
    expect(productQty).toEqual(2);
  });
});
