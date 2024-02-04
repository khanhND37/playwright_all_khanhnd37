import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { PaymentMethod, SFCheckout } from "@sf_pages/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { getProxyPage } from "@utils/proxy_page";

test.describe("Checkout thành công với Paypal", () => {
  const caseName = "TC_PAYPAL_NEWECOM";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      shipping_address: shippingAddress,
      description: description,
      email: buyerEmail,
      payment_method_info: paymentMethodInfo,
      product_ppc: productPPCInfo,
    }) => {
      test(`@${caseID} ${description}`, async ({ page, authRequest, conf }) => {
        const domain = conf.suiteConf.domain;
        const timeout = conf.suiteConf.timeout;
        const productCheckout = conf.suiteConf.products_checkout;
        const cardShieldDomainExpect = conf.suiteConf.card_shield_domain;
        const paymentMethod = paymentMethodInfo.payment_type;

        let checkout = new SFCheckout(page, domain);
        let checkoutAPI = new CheckoutAPI(domain, authRequest, page);

        const proxyPage = await getProxyPage();
        if (paymentMethod === PaymentMethod.PAYPALBNPL) {
          checkoutAPI = new CheckoutAPI(domain, authRequest, proxyPage);
        }

        const paymentSettingAPI = new PaymentProviders(domain, authRequest);
        await paymentSettingAPI.activePaypalWithSpecificMethod(paymentMethod);

        await test.step(`Tại SF:- Add product to cart > Checkout- Fill info`, async () => {
          // Set timeout for test
          test.setTimeout(timeout);

          // Thêm 1 sản phẩm vào Cart và mở trang Checkout, nhập thông tin customer
          await checkoutAPI.addProductThenSelectShippingMethod(productCheckout, buyerEmail, shippingAddress);
          checkout = await checkoutAPI.openCheckoutPageByToken();
          const checkoutURL = checkout.page.url();
          expect(checkoutURL).toContain(domain);
        });

        await test.step(`- Dùng dev tool > Search API: [payment-methods.json] > Tìm tới path result[]- Verify field domain`, async () => {
          const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain("PayPal");
          expect(cardShieldDomain).toContain(cardShieldDomainExpect);
        });

        await test.step(`- Search element tại payment method`, async () => {
          await checkout.footerLoc.scrollIntoViewIfNeeded();
          const hasPaymentMethodListIframe = await checkout.hasPaymentMethodListIframe();
          expect(hasPaymentMethodListIframe).toBe(true);
        });

        await test.step(`- Click button Paypal- Login Paypal account > Click [Pay now] button`, async () => {
          await checkout.completeOrderWithMethod(paymentMethod, undefined, undefined, true);

          if (!productPPCInfo) {
            const thankYouPageURL = checkout.page.url();
            expect(thankYouPageURL).toContain(domain);
          }
        });

        if (productPPCInfo) {
          await test.step(`- Add PPC- Login Paypal account > Click [Pay now] button`, async () => {
            await checkout.addProductPostPurchase(productPPCInfo.name);
            await checkout.completePaymentForPostPurchaseItem(paymentMethod);

            const thankYouPageURL = checkout.page.url();
            expect(thankYouPageURL).toContain(domain);
          });
        }
      });
    },
  );
});

test.describe("Checkout thất bại với Paypal", () => {
  let shippingAddress;
  let buyerEmail;
  let paymentMethodInfo;
  let cardShieldDomainExpect;
  let domain;
  let productCheckout;
  let paymentMethod;
  let checkout;
  let checkoutAPI;
  let paymentSettingAPI;
  let timeout;

  test.beforeEach(async ({ page, authRequest, conf }) => {
    domain = conf.suiteConf.domain;
    timeout = conf.suiteConf.timeout;
    productCheckout = conf.suiteConf.products_checkout;
    cardShieldDomainExpect = conf.suiteConf.card_shield_domain;

    shippingAddress = conf.caseConf.shipping_address;
    buyerEmail = conf.caseConf.email;
    paymentMethodInfo = conf.caseConf.payment_method_info;
    paymentMethod = paymentMethodInfo.payment_type;

    checkout = new SFCheckout(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    paymentSettingAPI = new PaymentProviders(domain, authRequest);

    await paymentSettingAPI.activePaypalWithSpecificMethod(paymentMethod);
  });

  test(`@SB_SB_SF_HD_PS_69 - [SF theme New-ecom] Checkout với fail cổng Paypal có apply proxy domain`, async ({}) => {
    await test.step(`Tại SF:- Add product to cart > Checkout- Fill info`, async () => {
      // Set timeout for test
      test.setTimeout(timeout);

      // Thêm 1 sản phẩm vào Cart và mở trang Checkout, nhập thông tin customer
      await checkoutAPI.addProductThenSelectShippingMethod(productCheckout, buyerEmail, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();
      const checkoutURL = checkout.page.url();
      expect(checkoutURL).toContain(domain);
    });

    await test.step(`- Dùng dev tool > Search API: [payment-methods.json] > Tìm tới path result[]- Verify field domain`, async () => {
      const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain("PayPal");
      expect(cardShieldDomain).toContain(cardShieldDomainExpect);
    });

    await test.step(`- Search element tại payment method`, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      const hasPaymentMethodListIframe = await checkout.hasPaymentMethodListIframe();
      expect(hasPaymentMethodListIframe).toBe(true);
    });

    await test.step(`- Click button Paypal- Login Paypal account > Click [Pay now] button`, async () => {
      await checkout.completeOrderFailViaPayPal();

      expect(await checkout.isTextVisible(`Provided shipping address is invalid`)).toBeTruthy();

      const checkoutPageURL = checkout.page.url();
      expect(checkoutPageURL).toContain(domain);
    });
  });
});
