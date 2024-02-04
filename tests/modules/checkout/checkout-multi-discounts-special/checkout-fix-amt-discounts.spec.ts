import { expect, test } from "@fixtures/website_builder";
import { OrderAfterCheckoutInfo, ShippingAddress } from "@types";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";

let domain: string;
let checkoutPage: SFCheckout;
let shippingAddress: ShippingAddress, i: number;
let orderSummaryInfo: OrderAfterCheckoutInfo;

test.describe("Verify SF checkout with multiple discount", async () => {
  test.beforeEach(async ({ conf, page }) => {
    domain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    checkoutPage = new SFCheckout(page, domain);
  });

  const casesID = "SB_DRIVEN_FIX_AMT";
  const conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      products_checkout: productCheckout,
      discount_code: discountCodes,
      expect_discount_amount: expectDiscountAmount,
    }) => {
      test(`@${caseID} ${caseName}`, async ({}) => {
        await test.step(`Pre conditions`, async () => {
          //
        });

        await test.step(`Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Checkout đến United states
        - Nhập đủ discount code`, async () => {
          await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
          for (i = 1; i < discountCodes.length; i++) {
            await checkoutPage.applyDiscountCode(discountCodes[i]);
            // verify discount code
          }
          orderSummaryInfo = await checkoutPage.getOrderSummaryInfo();
          expect(orderSummaryInfo.discountValue).toEqual(expectDiscountAmount);
        });
      });
    },
  );
});
