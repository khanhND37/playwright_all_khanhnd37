//Stripe 1 và Stripe 2 phải bật hết các payment method EU và thêm 1 payment method Payoneer

import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import type { Product } from "@types";
import { loadData } from "@core/conf/conf";
import { SFHome } from "@pages/storefront/homepage";
import { ThankYouPage } from "@pages/storefront/thankYou";

test.describe("SB_ROTATION_PAYMENT Checkout rotation payment method", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let domain: string;
  let productCheckout: Product[];
  let homePage: SFHome;
  let thankyouPage: ThankYouPage;
  let stripe1: number, stripe2: number;
  let paymentMethodId: number;
  let xpathStripe: string, xpath3Party: string;
  let paymentMethod3Party: string;
  let paymentMethodOnThankyoupage: string;
  let paymentMethodIdKlarna: number, paymentMethodIdAfterpay: number;

  const casesID = "SB_ROTATION_PAYMENT";
  const conf = loadData(__filename, casesID);
  const suiteConf = conf.suiteConf;
  const caseConf = conf.caseConf;

  test.beforeEach(async ({ authRequest, page }) => {
    domain = suiteConf.domain;
    homePage = new SFHome(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    thankyouPage = new ThankYouPage(page, domain);
    productCheckout = suiteConf.products_checkout;
    paymentMethod3Party = suiteConf.payment_method_3_party;
    stripe1 = suiteConf.stripe_id_1;
    stripe2 = suiteConf.stripe_id_2;
  });

  caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      country: country,
      payment_method: paymentMethod,
      payment_code: paymentCode,
      email: email,
      shipping_address: shippingAddress,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page }) => {
        await test.step(`Pre-condition`, async () => {
          //setting global market EU
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyNE(country.currency, shippingAddress.country_name);
          xpathStripe = checkoutPage.xpathPaymentLoc(PaymentMethod.STRIPE);
          xpath3Party = checkoutPage.xpathPaymentLoc(PaymentMethod.PAYONEER);
        });

        await test.step(`Mở màn checkout product, chọn lần lượt các country checkout`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, email, shippingAddress);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();
          await checkoutAPI.getPaymentMethodInfo(paymentCode);
          paymentMethodId = checkoutAPI.checkoutPaymentMethodId;

          //in case the payment method is stripe 2
          if (paymentMethodId == stripe2) {
            await checkoutPage.completeOrderWithMethod(paymentMethod);
            await page.waitForSelector(checkoutPage.xpathThankYou);
            await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, email, shippingAddress);
            checkoutPage = await checkoutAPI.openCheckoutPageByToken();
            await checkoutAPI.getPaymentMethodInfo(paymentCode);
            paymentMethodId = checkoutAPI.checkoutPaymentMethodId;
          }

          //verify payment method of Stripe 1 and 3party method
          expect(paymentMethodId).toEqual(stripe1);

          await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
          expect(await checkoutPage.isElementExisted(xpathStripe)).toBe(true);
          expect(await checkoutPage.isElementExisted(xpath3Party)).toBe(true);
        });

        await test.step(`Input các thông tin checkout và hoàn thành các step checkout với của Stripe 1`, async () => {
          await checkoutPage.completeOrderWithMethod(paymentMethod);
          await page.waitForSelector(checkoutPage.xpathThankYou);
          paymentMethodOnThankyoupage = await thankyouPage.getPaymentMethodOnThnkPage();
          expect(paymentMethodOnThankyoupage).toEqual(paymentMethod);
        });

        await test.step(`Mở màn checkout product lần 2, chọn lần lượt các country checkout`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, email, shippingAddress);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();
          await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
          await checkoutAPI.getPaymentMethodInfo(paymentCode);
          paymentMethodId = checkoutAPI.checkoutPaymentMethodId;

          //verify payment method of Stripe 2 and 3party method
          expect(paymentMethodId).toEqual(stripe2);
          expect(await checkoutPage.isElementExisted(xpathStripe)).toBe(true);
          expect(await checkoutPage.isElementExisted(xpath3Party)).toBe(true);
        });

        await test.step(`Input các thông tin checkout và hoàn thành các step checkout với cổng 3party`, async () => {
          await checkoutPage.completeOrderWithMethod(paymentMethod3Party);
          await page.waitForSelector(checkoutPage.xpathThankYou);
          paymentMethodOnThankyoupage = await thankyouPage.getPaymentMethodOnThnkPage();
          expect(paymentMethodOnThankyoupage).toEqual(paymentMethod3Party);
        });

        await test.step(`Mở màn checkout product lần 3, chọn country checkout`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, email, shippingAddress);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();
          await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
          await checkoutAPI.getPaymentMethodInfo(paymentCode);
          paymentMethodId = checkoutAPI.checkoutPaymentMethodId;

          //verify payment method of Stripe 2 and 3party method
          expect(paymentMethodId).toEqual(stripe2);
          expect(await checkoutPage.isElementExisted(xpathStripe)).toBe(true);
          expect(await checkoutPage.isElementExisted(xpath3Party)).toBe(true);
        });
      });
    },
  );

  test(`@SB_CHE_UPP_10 Kiểm tra rotation payment method Klarna, Afterpay`, async ({ page, conf }) => {
    const country = conf.caseConf.country;
    const paymentCode = conf.caseConf.payment_code;
    const xpathKlarna = checkoutPage.xpathPaymentLoc(PaymentMethod.KLARNA);
    const xpathAfterpay = checkoutPage.xpathPaymentLoc(PaymentMethod.AFTERPAY);
    await test.step(`Pre-condition`, async () => {
      //setting global market EU
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyNE(country.currency, country.country_name);
    });

    await test.step(`Mở màn checkout product, chọn lần lượt các country checkout`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(
        productCheckout,
        conf.caseConf.email,
        conf.caseConf.shipping_address,
      );
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutAPI.getPaymentMethodInfo(paymentCode.klarna_code);
      paymentMethodIdKlarna = checkoutAPI.checkoutPaymentMethodId;
      await checkoutAPI.getPaymentMethodInfo(paymentCode.afterpay_code);
      paymentMethodIdAfterpay = checkoutAPI.checkoutPaymentMethodId;

      //in case the payment method Klarna is stripe 2
      if (paymentMethodIdKlarna == stripe2) {
        await checkoutPage.completeOrderWithMethod(PaymentMethod.KLARNA);
        await page.waitForSelector(checkoutPage.xpathThankYou);
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(
          productCheckout,
          conf.caseConf.email,
          conf.caseConf.shipping_address,
        );
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();
        await checkoutAPI.getPaymentMethodInfo(paymentCode.klarna_code);
        paymentMethodIdKlarna = checkoutAPI.checkoutPaymentMethodId;
      }

      //payment method Klarna & After of Stripe 1 display
      //if someone edit/remove payment method in shop run auto, please check stripe_id in Payment provider page
      expect(paymentMethodIdKlarna).toEqual(stripe1);
      expect(paymentMethodIdAfterpay).toEqual(stripe1);

      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      expect(await checkoutPage.isElementExisted(xpathKlarna)).toBe(true);
      expect(await checkoutPage.isElementExisted(xpathAfterpay)).toBe(true);
    });

    await test.step(`Input các thông tin checkout và hoàn thành các step checkout`, async () => {
      await checkoutPage.completeOrderWithMethod(PaymentMethod.KLARNA);
      await page.waitForSelector(checkoutPage.xpathThankYou);
      paymentMethodOnThankyoupage = await thankyouPage.getPaymentMethodOnThnkPage();
      expect(paymentMethodOnThankyoupage).toEqual(PaymentMethod.KLARNA);
    });

    await test.step(`Mở màn checkout product lần 2, chọn lần lượt các country checkout`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(
        productCheckout,
        conf.caseConf.email,
        conf.caseConf.shipping_address,
      );
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutAPI.getPaymentMethodInfo(paymentCode.klarna_code);
      paymentMethodIdKlarna = checkoutAPI.checkoutPaymentMethodId;
      await checkoutAPI.getPaymentMethodInfo(paymentCode.afterpay_code);
      paymentMethodIdAfterpay = checkoutAPI.checkoutPaymentMethodId;

      //payment method Klarna & After of Stripe 1 display
      expect(paymentMethodIdKlarna).toEqual(stripe2);
      expect(paymentMethodIdAfterpay).toEqual(stripe1);

      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      expect(await checkoutPage.isElementExisted(xpathKlarna)).toBe(true);
      expect(await checkoutPage.isElementExisted(xpathAfterpay)).toBe(true);
    });
  });
});
