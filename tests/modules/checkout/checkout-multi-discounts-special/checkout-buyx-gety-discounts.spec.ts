import { expect, test } from "@fixtures/website_builder";
import { SFProduct } from "@pages/storefront/product";
import { ShippingAddress } from "@types";
import { SFCartv3 } from "@pages/storefront/cart";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";

let domain: string;
let productPage: SFProduct;
let cartPage: SFCartv3;
let checkoutPage: SFCheckout;
let shippingAddress: ShippingAddress, i: number;

test.describe("Verify SF checkout with multiple discount", async () => {
  test.beforeEach(async ({ conf, page }) => {
    domain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    checkoutPage = new SFCheckout(page, domain);
  });

  const casesID = "SB_DRIVEN_BUY_X_GET_Y";
  const conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({ case_id: caseID, case_name: caseName, products_checkout: productCheckout, discount_code: discountCodes }) => {
      test(`@${caseID} ${caseName}`, async ({}) => {
        await test.step(`Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Nhập đủ discount code`, async () => {
          await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
          await checkoutPage.applyDiscountCode(discountCodes[0]);

          // verify apply discount successful
        });

        await test.step(`Tại Block nhập discount > Nhập discount`, async () => {
          await checkoutPage.applyDiscountCode(discountCodes[1]);

          // verify error message
          expect("").toEqual("");
        });

        await test.step(`Vào cart page > Tăng quantity của product
        Quay lại checkout page > Nhập discount`, async () => {
          await productPage.gotoCart();
          switch (caseID) {
            case "SB_DC_MD_SB_32":
            case "SB_DC_MD_SB_34":
              await cartPage.changeQuantityProductInCartPage(productCheckout[0], "plus", 3);
              await cartPage.changeQuantityProductInCartPage(productCheckout[1], "plus", 3);
              await cartPage.changeQuantityProductInCartPage(productCheckout[2], "plus", 5);
              break;
            case "SB_DC_MD_SB_33":
            case "SB_DC_MD_SB_31":
              for (i = 0; i < productCheckout.length; i++) {
                await cartPage.changeQuantityProductInCartPage(productCheckout[i], "plus", 5);
              }
              break;
          }
          await cartPage.checkout();
          for (i = 0; i < discountCodes.length; i++) {
            await checkoutPage.applyDiscountCode(discountCodes[i]);

            // verify discount code
          }
        });
      });
    },
  );
});
