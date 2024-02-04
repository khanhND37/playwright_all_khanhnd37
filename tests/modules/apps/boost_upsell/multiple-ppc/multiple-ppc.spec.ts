import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import type { Product } from "@types";
import { SFCheckout } from "@pages/storefront/checkout";
import { Page } from "@playwright/test";

let checkoutApi: CheckoutAPI;
let productCheckout: Product;
let domain: string;
let sFCheckout: SFCheckout;
let page: Page;

test.describe("Check NE - Post purchase upsell @SB_NEWECOM_PPC", () => {
  test.beforeAll(async ({ conf, authRequest, browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    domain = conf.suiteConf.domain;

    checkoutApi = new CheckoutAPI(domain, authRequest, page);
    productCheckout = conf.suiteConf.product_checkout;
  });
  test(`@SB_NEWECOM_PPC_22 [SB] Verify UI popup post-purchase upsell khi offer được set nhiều item recommened`, async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      await checkoutApi.addProductToCartThenCheckout([productCheckout]);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
    });
    await test.step(`Verify setting style popup post-purchase upsell hiển thị`, async () => {
      await sFCheckout.waitUntilElementVisible(sFCheckout.xpathPPCBLock);
      await snapshotFixture.verify({
        page: page,
        selector: sFCheckout.xpathPPCBLock,
        snapshotName: `${conf.caseConf.screen_shot}_${process.env.ENV}.png`,
        snapshotOptions: { maxDiffPixelRatio: 0.02 },
      });
      expect(await sFCheckout.genLoc(sFCheckout.xpathPPCHeading).textContent()).toContain(
        conf.suiteConf.shipping_address.last_name,
      );
    });
  });

  test(`@SB_NEWECOM_PPC_23 [SB] Verify UI popup post-purchase upsell hiển thị  khi product target thỏa mãn nhiều offer`, async ({
    conf,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      await checkoutApi.addProductToCartThenCheckout([productCheckout]);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
    });
    await test.step(`Click tắt hiển thị upsell `, async () => {
      await sFCheckout.waitUntilElementVisible(sFCheckout.xpathPPCBLock);
      expect(await sFCheckout.genLoc(sFCheckout.xpathPPCHeading).textContent()).toContain(
        conf.suiteConf.shipping_address.last_name,
      );
      await sFCheckout.btnNextPPCPopupV3Loc.click();

      // Wait for hid ppc block after click "no thanks"
      await sFCheckout.page.waitForTimeout(500);
      expect(await sFCheckout.genLoc(sFCheckout.xpathPPCBLock).isVisible()).toBeTruthy();
      expect(await sFCheckout.genLoc(sFCheckout.xpathPPCHeading).textContent()).toContain(
        conf.suiteConf.shipping_address.last_name,
      );
    });
    await test.step(`Click tắt hiển thị popup upsell lần 2`, async () => {
      await sFCheckout.btnNextPPCPopupV3Loc.click();

      // Wait for hid ppc block after click "no thanks"
      await sFCheckout.page.waitForTimeout(500);
      expect(await sFCheckout.genLoc(sFCheckout.xpathPPCBLock).isVisible()).toBeFalsy();
    });
  });
});
