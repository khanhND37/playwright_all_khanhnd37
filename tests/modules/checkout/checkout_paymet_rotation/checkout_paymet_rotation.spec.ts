import { expect, test } from "@fixtures/theme";
import { PaymentGatewayCode, PaymentProviders } from "@pages/api/payment_providers";
import { SFCheckout } from "@pages/storefront/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { SettingPaymentAPI } from "@pages/api/setting_payment";

test.describe("Checkout payment rotation", () => {
  let paymentProviderAPI: PaymentProviders;
  let settingPaymentAPI: SettingPaymentAPI;
  let checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout;

  test.beforeEach(async ({ conf, page, authRequest }) => {
    paymentProviderAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);
    settingPaymentAPI = new SettingPaymentAPI(conf.suiteConf.domain, authRequest);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    checkout = new SFCheckout(page, conf.suiteConf.domain);
  });

  test.afterEach(async ({ conf }) => {
    // Deactivate cổng thanh toán Stripe về ban đầu
    if (conf.caseConf.account_name[0].includes("Stripe")) {
      for (const data of conf.caseConf.account_name) {
        const accountId = await paymentProviderAPI.getPaymentMethodId(data);

        await paymentProviderAPI.changePaymentMethodStatus(accountId, PaymentGatewayCode.Stripe, false);
      }
    }
  });

  test(`Check "Payment rotation" setting with "Sequentially" mode works correctly with Paypal method @SB_CHE_PR_1`, async ({
    conf,
    context,
  }) => {
    await test.step(`Activate 2 account Paypal. Checkout thanh toán 2 lần và verify rotation method`, async () => {
      // Paypal setup sẵn ở shop nên skip step activate cổng
      const methodId = [];
      for (const data of conf.caseConf.account_name) {
        const accountId = await paymentProviderAPI.getPaymentMethodId(data);
        methodId.push(accountId);
      }
      // Thêm vòng for lần lượt checkout nhiều lần để get payment id
      const listPayment = [];
      for (let i = 0; i < methodId.length; i++) {
        await checkoutAPI.addProductToCartThenCheckout(conf.caseConf.product);
        await checkoutAPI.openCheckoutPageByToken();
        await checkout.enterShippingAddress(conf.suiteConf.shipping_address);
        await checkout.selectPaymentMethod(conf.caseConf.payment_method);
        await checkout.completeOrderViaPayPal();
        const paymentMethodId = (await checkoutAPI.getCheckoutInfo()).info.payment_method_id;
        listPayment.push(paymentMethodId);
        await context.clearCookies();
      }
      // Verify list payment id được rotation map với các method id của shop
      expect(methodId.sort()).toEqual(listPayment.sort());
    });
  });

  test(`Check "Paymet rotation" setting with "Sequentially" mode works correctly via multiple third-party provider @SB_CHE_PR_2`, async ({
    conf,
  }) => {
    await test.step(`Active 2 acc Stripe. Checkout thanh toán 2 lần và verify rotation method`, async () => {
      const methodId = [];
      for (const data of conf.caseConf.account_name) {
        const accountId = await paymentProviderAPI.getPaymentMethodId(data);
        await paymentProviderAPI.changePaymentMethodStatus(accountId, PaymentGatewayCode.Stripe, true);
        methodId.push(accountId);
      }
      const listPayment = [];
      for (let i = 0; i < methodId.length; i++) {
        await checkoutAPI.addProductToCartThenCheckout(conf.caseConf.products_checkout);
        await checkoutAPI.openCheckoutPageByToken();
        await checkout.enterShippingAddress(conf.suiteConf.shipping_address);
        await checkout.completeOrderWithMethod();
        const paymentMethodId = (await checkoutAPI.getCheckoutInfo()).info.payment_method_id;
        listPayment.push(paymentMethodId);
      }
      // Verify list payment method id được rotation map với các method id của shop
      expect(methodId.sort()).toEqual(listPayment.sort());
    });
  });

  test(`Check current account is restricted during checking out (third party) @SB_CHE_PR_5`, async ({ conf }) => {
    const accountId = await paymentProviderAPI.getPaymentMethodId(conf.caseConf.account_name[0]);
    await test.step(`Active cổng Stripe với restricted key`, async () => {
      await paymentProviderAPI.changePaymentMethodStatus(accountId, PaymentGatewayCode.Stripe, true);
      expect((await settingPaymentAPI.getListMethodID(conf.suiteConf.shop_id)).includes(accountId));
    });

    await test.step(`Vào trang Checkout -> Nhập thông tin shipping -> Nhập card -> Nhấn place your order`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.suiteConf.shipping_address);
      // Input thông tin card thanh toán
      await checkout.enterCardNumber(conf.suiteConf.card_info.number);
      await checkout.enterCardHolderName(conf.suiteConf.card_info.holder_name);
      await checkout.enterExpireDate(conf.suiteConf.card_info.expire_date);
      await checkout.enterCVV(conf.suiteConf.card_info.cvv);
      await checkout.clickCompleteOrder();
      // Verify hiển thị message error
      const data = await checkout.isErrorMsgVisible(conf.caseConf.message, 4000);
      expect(data).toBe(true);
    });
  });

  test(`Check current account is deactivated during checking out (third party) @SB_CHE_PR_15`, async ({ conf }) => {
    await test.step(`
     - Vào trang Checkout -> Nhập thông tin shipping -> Nhập card
     - Deactivate payment của cổng thanh toán Stripe
     - Nhấn place your order`, async () => {
      const accountId = await paymentProviderAPI.getPaymentMethodId(conf.caseConf.account_name[0]);
      await paymentProviderAPI.changePaymentMethodStatus(accountId, PaymentGatewayCode.Stripe, true);
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.suiteConf.shipping_address);
      // Input thông tin card thanh toán
      await checkout.enterCardNumber(conf.suiteConf.card_info.number);
      await checkout.enterCardHolderName(conf.suiteConf.card_info.holder_name);
      await checkout.enterExpireDate(conf.suiteConf.card_info.expire_date);
      await checkout.enterCVV(conf.suiteConf.card_info.cvv);
      // Deactivate payment của cổng thanh toán Stripe
      await paymentProviderAPI.changePaymentMethodStatus(accountId, PaymentGatewayCode.Stripe, false);
      // Click complete order and verify hiển thị message error
      await checkout.clickCompleteOrder();
      expect(await checkout.isErrorMsgVisible(conf.caseConf.message, 4000)).toBe(true);
    });
  });
});
