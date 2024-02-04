import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { PaymentGatewayCode, PaymentProviders } from "@pages/api/payment_providers";

test.describe("Checkout với Stripe hosted thành công", () => {
  const caseName = "TC_STRIPE_NEWECOM_HOSTED";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      email: buyerEmail,
      product_ppc: productPPCInfo,
      description: description,
      payment_method_info: paymentMethodInfo,
      shipping_address: shippingAddress,
      currency: currency,
    }) => {
      test(`@${caseID} ${description}`, async ({ page, authRequest, conf }) => {
        const domain = conf.suiteConf.domain;
        const productCheckout = conf.suiteConf.products_checkout;
        const paymentMethod = paymentMethodInfo.payment_type;
        const timeout = conf.suiteConf.timeout;
        const cardShieldDomainExpect = conf.suiteConf.card_shield_domain;
        const stripePaymentMethodId = conf.suiteConf.stripe_payment_method_id;

        let checkout = new SFCheckout(page, domain);
        const homePage = new SFHome(page, domain);
        const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        const paymentProviderAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);

        // Shop này dùng để test chung với PayPal smart button
        // nên cần có step này để chắc chắn Stripe đã được bật trở lại
        await paymentProviderAPI.changePaymentMethodStatus(stripePaymentMethodId, PaymentGatewayCode.Stripe, true);

        // Vì Klarna hơi khác so với các payment method khác nên cần bypass 1 số case
        const bypassStepVsKlarna = paymentMethod === PaymentMethod.KLARNA;

        await test.step(`Tại SF:- Add product to cart > Checkout- Fill info`, async () => {
          // Set timeout for test
          test.setTimeout(timeout);

          // Thêm 1 sản phẩm vào Cart và mở trang Checkout, nhập thông tin customer
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyNE(currency, shippingAddress.country_name);

          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, buyerEmail, shippingAddress);
          checkout = await checkoutAPI.openCheckoutPageByToken();

          const checkoutURL = checkout.page.url();
          expect(checkoutURL).toContain(domain);
        });

        await test.step(`- Dùng dev tool > Search API: [payment-methods.json] > Tìm tới path result[]- Verify field domain`, async () => {
          const pm = paymentMethod == PaymentMethod.STRIPE ? "Credit Card" : paymentMethod;
          const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain(pm, shippingAddress.country_code);
          expect(cardShieldDomain).toContain(cardShieldDomainExpect);
        });

        await test.step(`- Search element tại payment method`, async () => {
          await checkout.footerLoc.scrollIntoViewIfNeeded();
          const hasPaymentMethodListIframe = await checkout.hasPaymentMethodListIframe();
          expect(hasPaymentMethodListIframe).toBe(true);
        });

        await test.step(`- Click [Complete your order] > Chuyển sang trang hosted > Kéo xuống source code check trường "return_url"`, async () => {
          await checkout.completeOrderWithPaymentShield(paymentMethod);

          if (!bypassStepVsKlarna) {
            await checkout.page.waitForLoadState("networkidle");
            const hasPaymentShieldStripeHosted = await checkout.hasPaymentShieldStripeHosted(cardShieldDomainExpect);
            expect(hasPaymentShieldStripeHosted).toBe(true);
          }
        });

        await test.step(`- Click [AUTHORIZE TEST PAYMENT] - Verify domain Thankyou page`, async () => {
          if (!bypassStepVsKlarna) {
            await checkout.completeOrderOnStripePage(true);
            await expect(checkout.thankyouPageLoc).toBeVisible();
            const thankYouPageURL = checkout.page.url();
            expect(thankYouPageURL).toContain(domain);
          }
        });

        if (productPPCInfo) {
          await test.step(`- Add PPC > Chuyển sang trang hosted > Kéo xuống source code check trường "return_url"`, async () => {
            await checkout.addProductPostPurchase(productPPCInfo.name);
            if (bypassStepVsKlarna) {
              await checkout.completePaymentForPostPurchaseItem(paymentMethod);
            } else {
              const hasPaymentShieldStripeHosted = await checkout.hasPaymentShieldStripeHosted(cardShieldDomainExpect);
              expect(hasPaymentShieldStripeHosted).toBe(true);
            }
          });

          await test.step(`- Click [AUTHORIZE TEST PAYMENT] - Verify domain Thankyou page`, async () => {
            if (!bypassStepVsKlarna) {
              await checkout.completeOrderOnStripePage(true);
            }
            await expect(checkout.thankyouPageLoc).toBeVisible();

            // expect(await checkout.isThankyouPage()).toBe(true);

            const thankYouPageURL = checkout.page.url();
            expect(thankYouPageURL).toContain(domain);
          });
        }
      });
    },
  );
});

test.describe("Checkout với Stripe hosted không thành công", () => {
  test(`@SB_SB_SF_HD_PS_68 - [SF theme New-ecom] Checkout fail khi sử dụng proxy domain với cổng stripe EU`, async ({
    page,
    conf,
    authRequest,
  }) => {
    let checkout;
    const domain = conf.suiteConf.domain;
    const productCheckout = conf.suiteConf.products_checkout;
    const paymentMethod = conf.caseConf.payment_method_info.payment_type;
    const timeout = conf.suiteConf.timeout;
    const shippingAddress = conf.caseConf.shipping_address;
    const cardShieldDomainExpect = conf.suiteConf.card_shield_domain;
    const buyerEmail = conf.caseConf.email;
    const stripePaymentMethodId = conf.suiteConf.stripe_payment_method_id;
    const currency = conf.caseConf.currency;

    const homePage = new SFHome(page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const paymentProviderAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);

    // Shop này dùng để test chung với PayPal smart button
    // nên cần có step này để chắc chắn Stripe đã được bật trở lại
    await paymentProviderAPI.changePaymentMethodStatus(stripePaymentMethodId, PaymentGatewayCode.Stripe, true);

    await test.step(`Tại SF:- Add product to cart > Checkout- Fill info`, async () => {
      // Set timeout for test
      test.setTimeout(timeout);

      // Thêm 1 sản phẩm vào Cart và mở trang Checkout, nhập thông tin customer
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyNE(currency, shippingAddress.country_name);

      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, buyerEmail, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      const checkoutURL = checkout.page.url();
      expect(checkoutURL).toContain(domain);
    });

    await test.step(`- Dùng dev tool > Search API: [payment-methods.json] > Tìm tới path result[]- Verify field domain`, async () => {
      const pm = paymentMethod == PaymentMethod.STRIPE ? "Credit Card" : paymentMethod;
      const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain(pm, shippingAddress.country_code);
      expect(cardShieldDomain).toContain(cardShieldDomainExpect);
    });

    await test.step(`- Search element tại payment method`, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      const hasPaymentMethodListIframe = await checkout.hasPaymentMethodListIframe();
      expect(hasPaymentMethodListIframe).toBe(true);
    });

    await test.step(`- Click [Complete your order] > Chuyển sang trang hosted > Kéo xuống source code check trường "return_url"`, async () => {
      await checkout.completeOrderWithPaymentShield(paymentMethod);

      const hasPaymentShieldStripeHosted = await checkout.hasPaymentShieldStripeHosted(cardShieldDomainExpect);
      expect(hasPaymentShieldStripeHosted).toBe(true);
    });

    await test.step(`- Click [FAIL TEST PAYMENT] - Verify domain Thankyou page`, async () => {
      await checkout.checkoutFailOrderOnStripePage(true);
      await checkout.footerLoc.scrollIntoViewIfNeeded();

      const isErrorMsgVisible = await checkout.isTextVisible(
        "The customer did not approve the PaymentIntent. Provide a new payment method to attempt to fulfill this PaymentIntent again.",
      );
      expect(isErrorMsgVisible).toBeTruthy();

      const checkoutURL = checkout.page.url();
      expect(checkoutURL).toContain(domain);
    });
  });
});
