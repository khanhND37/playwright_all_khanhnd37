import { expect, test } from "@core/fixtures";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { CheckoutAPI } from "@pages/api/checkout";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { CheckoutMobile } from "@pages/mobile/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { Product } from "@types";

let themePage: ThemeDashboard;
let domain: string;
let textSuccess: string;
let productCheckout1, productCheckout2, productCheckout3, productCheckout4: Array<Product>;
let checkout: SFCheckout;
let highRiskMessage: Array<string>;
let checkoutMobile: CheckoutMobile;

test.beforeEach(async ({ conf, dashboard }) => {
  test.setTimeout(conf.suiteConf.time_out);
  domain = conf.suiteConf.domain;
  textSuccess = conf.suiteConf.text_success;
  highRiskMessage = conf.suiteConf.high_risk_message;
  productCheckout1 = conf.suiteConf.product_checkout_1;
  productCheckout2 = conf.suiteConf.product_checkout_2;
  productCheckout3 = conf.suiteConf.product_checkout_3;
  productCheckout4 = conf.suiteConf.product_checkout_4;
  themePage = new ThemeDashboard(dashboard, domain);
});

test.describe(`High-risk messages in order status page`, async () => {
  test(`[Theme V3] Verify message for high-risk product trên trang order status page @TC_SB_CHE_SC_HR_PL_3`, async ({
    page,
    conf,
    authRequest,
  }) => {
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const shippingAddress = conf.suiteConf.shipping_address;
    const customerInfo = conf.suiteConf.customer_info;
    checkout = new SFCheckout(page, domain, "");

    // publish theme v3
    await themePage.publishTheme(1);
    expect(await themePage.isTextVisible(textSuccess)).toBeTruthy();

    await test.step(`Checkout 1 product có variant SKU được set High-risk messages`, async () => {
      await checkout.goto();
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout1, customerInfo.email, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod("Stripe");
      await checkout.addProductPostPurchase(null);
      expect(await checkout.getMessageHighRisk()).toEqual(highRiskMessage[0]);
    });

    await test.step(`Checkout 1 product không có variant SKU được config High-risk messages`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout2, customerInfo.email, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod("Stripe");
      await checkout.addProductPostPurchase(null);
      expect(await checkout.isTextVisible(highRiskMessage[0])).toBeFalsy();
    });

    await test.step(`Checkout nhiều product trong đó có >=2 product có variant SKU trong High-risk messages`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout3, customerInfo.email, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod("Stripe");
      await checkout.addProductPostPurchase(null);
      for (let i = 0; i < productCheckout3.length; i++) {
        expect(await checkout.getMessageHighRisk(i + 1)).toEqual(highRiskMessage[i]);
      }
    });

    await test.step(`Checkout 1 product có variant SKU config high risk message, 1 variant không config high risk message`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout4, customerInfo.email, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod("Stripe");
      await checkout.addProductPostPurchase(null);
      expect(await checkout.getMessageHighRisk(1)).toEqual(highRiskMessage[0]);
      expect(await checkout.isTextVisible(highRiskMessage[1], 2)).toBeFalsy();
    });
  });

  test(`[Theme V3] Verify message for high-risk product trên trang order status page trên mobile @TC_SB_CHE_SC_HR_PL_4`, async ({
    pageMobile,
    conf,
  }) => {
    const homePage = new SFHome(pageMobile, domain);
    const shippingAddressMobile = conf.suiteConf.shipping_address_mobile;
    checkoutMobile = new CheckoutMobile(pageMobile, domain);

    await test.step(`Checkout 1 product có variant SKU config high risk message, 1 variant không config high risk message`, async () => {
      await homePage.gotoProduct(conf.caseConf.product_handle);
      await checkoutMobile.page.locator(checkoutMobile.xpathAddToCartOnMobile).click();
      await checkoutMobile.clickElementWithLabel("span", "CHECKOUT");
      await checkoutMobile.page.waitForLoadState("networkidle");
      await checkoutMobile.enterShippingAddressOnMobile(shippingAddressMobile);
      await scrollUntilElementIsVisible({
        page: checkoutMobile.page,
        scrollEle: checkoutMobile.page.locator(checkoutMobile.xpathItemListOrderSumary),
        viewEle: checkoutMobile.page.locator(checkoutMobile.xpathItemListOrderSumary),
      });
      await checkoutMobile.completeOrderWithCardInfo(conf.suiteConf.card_info, "mobile");
      await checkoutMobile.addProductPostPurchase(null);
    });

    await test.step(`Verify message hiển thị ở order status page trên moblie`, async () => {
      expect(await checkoutMobile.getMessageHighRisk()).toEqual(highRiskMessage[1]);
    });
  });

  test(`[Theme V2] Verify update message for high-risk product trên trang order status
   page @TC_SB_CHE_SC_HR_PL_2`, async ({ conf, page }) => {
    const customerInfo = conf.suiteConf.customer_info;
    const cardInfo = conf.suiteConf.card_info;
    checkout = new SFCheckout(page, domain, "");

    // publish theme v2
    await themePage.publishTheme(1);
    expect(await themePage.isTextVisible(textSuccess)).toBeTruthy();

    await test.step(`Verify hiển thị messages high-risk khi check out 1 product có variant SKU trong
    +" High-risk messages page`, async () => {
      await checkout.goto();
      await checkout.addProductToCartThenInputShippingAddress(productCheckout1, customerInfo);
      await checkout.completeOrderWithCardInfo(cardInfo);
      await checkout.addProductPostPurchase(null);
      await checkout.page.reload();
      await expect(checkout.genLoc(checkout.xpathThankYou)).toBeVisible();
      expect(await checkout.getMessageHighRisk()).toEqual(highRiskMessage[0]);
    });

    await test.step(`Verify không hiển thị messages high-risk khi check out 1 product không có variant SKU
    + "trong High-risk messages page`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(productCheckout2, customerInfo);
      await checkout.completeOrderWithCardInfo(cardInfo);
      await checkout.addProductPostPurchase(null);
      await checkout.page.reload();
      await expect(checkout.genLoc(checkout.xpathThankYou)).toBeVisible();
      expect(await checkout.isTextVisible(highRiskMessage[0])).toBeFalsy();
    });

    await test.step(`Verify hiển thị messages high-risk khi check out nhiều product trong đó có >=2 product
    + "có variant SKU trong High-risk messages page`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(productCheckout3, customerInfo);
      await checkout.completeOrderWithCardInfo(cardInfo);
      await checkout.addProductPostPurchase(null);
      await checkout.page.reload();
      await expect(checkout.genLoc(checkout.xpathThankYou)).toBeVisible();
      for (let i = 0; i < productCheckout3.length; i++) {
        expect(await checkout.getMessageHighRisk(i + 1)).toEqual(highRiskMessage[i]);
      }
    });

    await test.step(`Checkout 1 product có variant SKU config high risk message, 1 variant không config high risk message`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(productCheckout4, customerInfo);
      await checkout.completeOrderWithCardInfo(cardInfo);
      await checkout.addProductPostPurchase(null);
      await checkout.page.reload();
      await expect(checkout.genLoc(checkout.xpathThankYou)).toBeVisible();
      expect(await checkout.getMessageHighRisk()).toEqual(highRiskMessage[0]);
      expect(await checkout.isTextVisible(highRiskMessage[1], 2)).toBeFalsy();
    });
  });
});
