import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { SettingThemeAPI } from "@pages/api/themes_setting";

test.describe(`[Sbase] Checkout khi ẩn cardholder name one page`, () => {
  test.beforeEach(async ({ dashboard, conf, theme }) => {
    const domain = conf.suiteConf.domain;
    const paymentSetPage = new PaymentProviderPage(dashboard, domain);
    await paymentSetPage.goto(`admin/settings/payments`);
    await paymentSetPage.settingHideCardholderName(conf.caseConf.payment_method, true);
    const settingTheme = new SettingThemeAPI(theme);
    await settingTheme.editCheckoutLayout("one-page");
  });
  test(`[Shopbase] Buyer checkout 1 page qua stripe khi Merchant setting hide cardhoder name @SB_SC_571`, async ({
    page,
    conf,
    request,
    token,
  }) => {
    let checkout: SFCheckout;

    const shippingAddress = conf.suiteConf.shipping_address;
    const productInfo = conf.suiteConf.product;
    const cardInfo = conf.caseConf.card_info;
    const countryCode = shippingAddress.country_code;
    const paymentMethod = conf.suiteConf.payment_method;
    const secretKey = conf.suiteConf.secret_key;
    const { domain, email } = conf.suiteConf as never;

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    let orderId: number;
    let actualTotalOrder: string;

    await test.step(`- Buyer checkout đến bước payment method:  + Payment method: Stripe`, async () => {
      const checkoutAPI = new CheckoutAPI(domain, request, page);

      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.openCheckoutPageByToken();

      checkout = new SFCheckout(page, domain);
      await checkout.selectPaymentMethod(paymentMethod);
      await expect(checkout.stripeCardNameLoc).toBeHidden();
    });

    await test.step(`Buyer checkout thành công`, async () => {
      await checkout.completeOrderWithMethod(paymentMethod, cardInfo);
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });

    await test.step(`Merchant view order detail trong dashboard`, async () => {
      orderId = await checkout.getOrderIdBySDK();
      const orderPage = await checkout.openOrderByAPI(orderId, accessToken);

      let orderStatus = await orderPage.getOrderStatus();
      actualTotalOrder = await orderPage.getTotalOrder();
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus);
      expect(orderStatus).toEqual("Paid");
    });

    await test.step(`Kiểm tra hiển thị order trên dashboard của stripe`, async () => {
      const orderApi = new OrderAPI(domain, request);
      await orderApi.getTransactionId(orderId, accessToken);
      const orderAmt = await (await orderApi.getOrdInfoInStripe({ key: secretKey })).ordAmount;
      expect((orderAmt / 100).toFixed(2)).toEqual(removeCurrencySymbol(actualTotalOrder));
    });
  });
});

test.describe(`[Sbase] Checkout khi hiện cardholder name với 3-step checkout`, () => {
  test.beforeEach(async ({ dashboard, conf, theme }) => {
    const domain = conf.suiteConf.domain;
    const paymentSetPage = new PaymentProviderPage(dashboard, domain);
    await paymentSetPage.goto(`admin/settings/payments`);
    await paymentSetPage.settingHideCardholderName(conf.caseConf.payment_method, false);
    const settingTheme = new SettingThemeAPI(theme);
    await settingTheme.editCheckoutLayout("multi-step");
  });
  test(`[Shopbase] Buyer checkout 3 page qua stripe khi Merchant setting hiển thị cardhoder name @SB_SC_574`, async ({
    page,
    conf,
    request,
    token,
  }) => {
    let checkout: SFCheckout;

    const shippingAddress = conf.suiteConf.shipping_address;
    const productInfo = conf.suiteConf.product;
    const countryCode = shippingAddress.country_code;
    const paymentMethod = conf.suiteConf.payment_method;
    const secretKey = conf.suiteConf.secret_key;
    const { domain, email } = conf.suiteConf as never;

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    let orderId: number;
    let actualTotalOrder: string;

    await test.step(`- Buyer checkout đến bước payment method:  + Payment method: Stripe`, async () => {
      const checkoutAPI = new CheckoutAPI(domain, request, page);

      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.openCheckoutPageByToken();

      checkout = new SFCheckout(page, domain);
      await checkout.selectPaymentMethod(paymentMethod);
      await expect(checkout.stripeCardNameLoc).toBeVisible();
    });

    await test.step(`Buyer checkout thành công`, async () => {
      await checkout.completeOrderWithMethod(paymentMethod);
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });

    await test.step(`Merchant view order detail trong dashboard`, async () => {
      orderId = await checkout.getOrderIdBySDK();
      const orderPage = await checkout.openOrderByAPI(orderId, accessToken);

      let orderStatus = await orderPage.getOrderStatus();
      actualTotalOrder = await orderPage.getTotalOrder();
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus);
      expect(orderStatus).toEqual("Paid");
    });

    await test.step(`Kiểm tra hiển thị order trên dashboard của stripe`, async () => {
      const orderApi = new OrderAPI(domain, request);
      await orderApi.getTransactionId(orderId, accessToken);
      const orderAmt = await (await orderApi.getOrdInfoInStripe({ key: secretKey })).ordAmount;
      expect((orderAmt / 100).toFixed(2)).toEqual(removeCurrencySymbol(actualTotalOrder));
    });
  });
});
