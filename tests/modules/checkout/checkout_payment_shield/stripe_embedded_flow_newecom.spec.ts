import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { PaymentMethod, SFCheckout } from "@sf_pages/checkout";
import { SFHome } from "@sf_pages/homepage";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentGatewayCode, PaymentProviders } from "@pages/api/payment_providers";

test.describe("Checkout với Stripe embedded", () => {
  const caseName = "TC_STRIPE_NEWECOM_EMBEDDED";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      email: buyerEmail,
      description: description,
      payment_method_info: paymentMethodInfo,
      product_ppc_name: productPPC,
      currency: currency,
    }) => {
      test(`@${caseID} ${description}`, async ({ page, authRequest, conf }) => {
        const domain = conf.suiteConf.domain;
        const paymentMethod = paymentMethodInfo.payment_type;
        const timeout = conf.suiteConf.timeout;
        const shippingAddress = conf.suiteConf.shipping_address;
        const cardShieldDomainExpect = conf.suiteConf.card_shield_domain;
        const productCheckout = conf.suiteConf.products_checkout;
        const stripePaymentMethodId = conf.suiteConf.stripe_payment_method_id;

        let checkout = new SFCheckout(page, domain);
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

        await test.step(`- Click [Complete your order]`, async () => {
          await checkout.completeOrderWithPaymentShield(paymentMethod);

          // Add PPC:
          const isShowPPC = await checkout.isPostPurchaseDisplayed();
          expect(isShowPPC).toBeTruthy();
          const ppcValue = await checkout.addProductPostPurchase(productPPC);
          if (ppcValue) {
            await checkout.completePaymentForPostPurchaseItem(paymentMethod);
          }

          const thankYouPageURL = checkout.page.url();
          expect(thankYouPageURL).toContain(domain);
        });
      });
    },
  );
});
