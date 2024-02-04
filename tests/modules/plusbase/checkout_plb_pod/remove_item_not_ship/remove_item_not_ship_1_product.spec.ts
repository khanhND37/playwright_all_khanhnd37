import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import type { Product, ShippingAddress } from "@types";
import { CheckoutMobile } from "@pages/mobile/checkout";

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

  test(`@SB_CHE_SC_RIP_05 [plb_remove_item_checkout] [Desktop] Kiểm tra UI checkout PlusBase chỉ có MỘT sản phẩm POD không được hỗ trợ ship`, async ({
    page,
    authRequest,
  }) => {
    await test.step(`Pre conditions`, async () => {
      checkout = new SFCheckout(page, domain);
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    });

    await test.step(`- Thực hiện tạo checkout với sản phẩm ship đến Germany- Kiểm tra hiển thị trang checkout Trên Desktop`, async () => {
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
      await expect(checkout.getXpathItemNotShip(productCheckout[0].name)).toBeVisible();
    });

    await test.step(`Click "Remove all items"`, async () => {
      await checkout.genLoc(checkout.xpathRemoveItem).click();
      await expect(checkout.genLoc(checkout.xpathAlertCartEmpty)).toBeVisible();
    });
  });

  test(`@SB_CHE_SC_RIP_06 [plb_remove_item_checkout] [Mobile] Kiểm tra UI checkout PlusBase chỉ có MỘT sản phẩm POD không được hỗ trợ ship`, async ({
    pageMobile,
    authRequest,
  }) => {
    await test.step(`Pre conditions`, async () => {
      checkout = new SFCheckout(pageMobile, domain);
      checkoutAPI = new CheckoutAPI(domain, authRequest, pageMobile);
      checkoutMobile = new CheckoutMobile(pageMobile, domain);
    });

    await test.step(`- Thực hiện tạo checkout với sản phẩm ship đến Germany - Kiểm tra hiển thị trang checkout Trên Desktop`, async () => {
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
      await expect(checkout.getXpathItemNotShip(productCheckout[0].name)).toBeVisible();
    });

    await test.step(`Click "Remove all items"`, async () => {
      await checkout.genLoc(checkout.xpathRemoveItem).click();
      await expect(checkout.genLoc(checkout.xpathAlertCartEmpty)).toBeVisible();
    });
  });
});
