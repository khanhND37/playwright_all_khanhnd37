import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { CheckoutMobile } from "@pages/mobile/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import type { Product, ShippingAddress } from "@types";

test.describe("Remove item checkout plusbase", () => {
  let checkout: SFCheckout;
  let checkoutMobile: CheckoutMobile;
  let shippingAddress: ShippingAddress;
  let productCheckout: Array<Product>;
  let checkoutAPI: CheckoutAPI;
  let domain: string;

  test.beforeEach(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    productCheckout = conf.suiteConf.products_checkout;
  });

  test(`@SB_CHE_SC_RIP_09 [plb_remove_item_checkout] [Desktop] Kiểm tra UI checkout PlusBase chỉ có NHIỀU sản phẩm Dropship và POD không được hỗ trợ ship`, async ({
    page,
    authRequest,
    conf,
  }) => {
    await test.step(`Pre conditions`, async () => {
      checkout = new SFCheckout(page, domain);
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    });

    await test.step(`- Thực hiện tạo checkout với các sản phẩm checkout ship đến Germany- Kiểm tra hiển thị trang checkout Trên Desktop`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      await checkout.enterShippingAddress(shippingAddress);
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeVisible();
    });

    await test.step(`Thay đổi country thành US`, async () => {
      await checkout.selectCountry("United States");
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeHidden();
    });

    await test.step(`Thay đổi country thành Germany`, async () => {
      await checkout.selectCountry("Germany");
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeVisible();
      for (const item of conf.caseConf.data_after_remove.item_not_ship) {
        await expect(checkout.getXpathItemNotShip(item)).toBeVisible();
      }
    });

    await test.step(`Click "Remove all items"`, async () => {
      await checkout.genLoc(checkout.xpathRemoveItem).click();
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeHidden();
      await expect(
        checkout.getLocatorProdNameInOrderSummary(conf.caseConf.data_after_remove.item_not_ship),
      ).toBeHidden();
    });

    await test.step(`Thực hiện nhập đầy đủ thông tin shipping, cart number > complete order`, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.completeOrderWithMethod();
      await expect(checkout.thankyouPageLoc).toBeVisible({ timeout: 10000 });
    });
  });

  test(`@SB_CHE_SC_RIP_10 [plb_remove_item_checkout] [Mobile] Kiểm tra UI checkout PlusBase chỉ có NHIỀU sản phẩm Dropship và POD không được hỗ trợ ship`, async ({
    conf,
    pageMobile,
    authRequest,
  }) => {
    await test.step(`Pre conditions`, async () => {
      checkout = new SFCheckout(pageMobile, domain);
      checkoutAPI = new CheckoutAPI(domain, authRequest, pageMobile);
      checkoutMobile = new CheckoutMobile(pageMobile, domain);
    });

    await test.step(`- Thực hiện tạo checkout với các sản phẩm checkout ship đến Germany- Kiểm tra hiển thị trang checkout Trên Desktop`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      await checkoutMobile.enterShippingAddressOnMobile(shippingAddress);
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeVisible();
    });

    await test.step(`Thay đổi country thành US`, async () => {
      await checkoutMobile.selectCountryOnMobile("United States");
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeHidden();
    });

    await test.step(`Thay đổi country thành Germany`, async () => {
      await checkoutMobile.selectCountryOnMobile("Germany");
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeVisible();
      for (const item of conf.caseConf.data_after_remove.item_not_ship) {
        await expect(checkout.getXpathItemNotShip(item)).toBeVisible();
      }
    });

    await test.step(`Click "Remove all items"`, async () => {
      await checkout.genLoc(checkout.xpathRemoveItem).click();
      await expect(checkout.genLoc(checkout.xpathAlertRemoveItem)).toBeHidden();
      await expect(
        checkout.getLocatorProdNameInOrderSummary(conf.caseConf.data_after_remove.item_not_ship),
      ).toBeHidden();
    });

    await test.step(`Thực hiện nhập đầy đủ thông tin shipping, cart number > complete order`, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.completeOrderWithMethod();
      await expect(checkout.thankyouPageLoc).toBeVisible({ timeout: 10000 });
    });
  });
});
