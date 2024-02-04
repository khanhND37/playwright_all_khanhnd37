import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { SFCheckout } from "@pages/storefront/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { OrdersPage } from "@pages/dashboard/orders";

test.describe("Checkout with paypal pro", () => {
  let orderId: number;
  let totalSF: string;
  let accessToken: string;
  let accountId: number;
  let checkout: SFCheckout;
  let dashboard: PaymentProviders;
  let settingTheme: SettingThemeAPI;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;

  test.beforeEach(async ({ conf, page, authRequest, theme, token }) => {
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    dashboard = new PaymentProviders(conf.suiteConf.domain, authRequest);
    checkout = new SFCheckout(page, conf.suiteConf.domain);
    orderPage = new OrdersPage(page, conf.suiteConf.domain);
    settingTheme = new SettingThemeAPI(theme);

    await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
    await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
    await checkoutAPI.openCheckoutPageByToken();
    accountId = await dashboard.getPaymentMethodId(conf.suiteConf.account_name);

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
  });

  test("Kiểm tra checkout qua paypal pro thành công với layout 1 page và secure payment on @TC_SB_CHE_PPP_9", async ({
    conf,
  }) => {
    // Setting themes one page and activate payment method
    // eslint-disable-next-line max-len
    await dashboard.activateSecurePaymentPayPalPro(accountId, conf.suiteConf.paypal_manager);

    await test.step("Buyer checkout with paypal pro payment", async () => {
      await checkout.completeOrderWithMethod("paypal-pro", conf.suiteConf.card_info);
      const isShowPPC = await checkout.isPostPurchaseDisplayed(5000);
      expect(isShowPPC).toBeFalsy();
      totalSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Merchant view order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.reloadUntilOrdCapture();
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(conf.suiteConf.gateway_info.gateway_name);
      const orderTimelinePaymentProcessed = orderPage.generateOrderTimelineMsgByGw(
        conf.suiteConf.gateway_info.gateway_name,
        totalSF,
        conf.suiteConf.account_name,
        conf.suiteConf.gateway_info.ending_card_no,
      );
      expect(actualPaymentStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalSF);
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
    });
  });

  test("Kiểm tra checkout qua paypal pro thành công với layout 1 page và secure payment off @TC_SB_CHE_PPP_28", async ({
    conf,
  }) => {
    // Setting themes one page and deactivate payment method
    await settingTheme.editCheckoutLayout("one-page");
    await dashboard.deactivateSecurePayment(accountId, conf.suiteConf.paypal_manager);

    await test.step("Buyer checkout with paypal pro payment", async () => {
      await checkout.completeOrderWithMethod("paypal-pro", conf.suiteConf.card_info);
      await checkout.btnClosePPCPopup.click();
      totalSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Merchant view order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
      //cause sometimes order captures slower than usual
      const actualPaymentStatus = await orderPage.reloadUntilOrdCapture();
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(conf.suiteConf.gateway_info.gateway_name);
      const orderTimelinePaymentProcessed = orderPage.generateOrderTimelineMsgByGw(
        conf.suiteConf.gateway_info.gateway_name,
        totalSF,
        conf.suiteConf.account_name,
        conf.suiteConf.gateway_info.ending_card_no,
      );
      expect(actualPaymentStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalSF);
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
    });
  });

  test("Kiểm tra checkout qua paypal pro thành công với layout 3 page và secure payment on @TC_SB_CHE_PPP_8", async ({
    conf,
  }) => {
    // Setting themes 3 page and activate payment method
    await settingTheme.editCheckoutLayout("multi-step");
    // eslint-disable-next-line max-len
    await dashboard.activateSecurePaymentPayPalPro(accountId, conf.suiteConf.paypal_manager);

    await test.step("Buyer checkout with paypal pro payment", async () => {
      await checkout.completeOrderWithMethod("paypal-pro", conf.suiteConf.card_info);
      const isShowPPC = await checkout.isPostPurchaseDisplayed(5000);
      expect(isShowPPC).toBeFalsy();
      totalSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Merchant view order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.reloadUntilOrdCapture();
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(conf.suiteConf.gateway_info.gateway_name);
      const orderTimelinePaymentProcessed = orderPage.generateOrderTimelineMsgByGw(
        conf.suiteConf.gateway_info.gateway_name,
        totalSF,
        conf.suiteConf.account_name,
        conf.suiteConf.gateway_info.ending_card_no,
      );
      expect(actualPaymentStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalSF);
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
    });
  });

  test("Kiểm tra checkout qua paypal pro thành công với layout 3 page và secure payment off @TC_SB_CHE_PPP_29", async ({
    conf,
  }) => {
    // Setting themes 3 page and deactivate payment method
    await settingTheme.editCheckoutLayout("multi-step");
    await dashboard.deactivateSecurePayment(accountId, conf.suiteConf.paypal_manager);

    await test.step("Buyer checkout with paypal pro payment", async () => {
      await checkout.completeOrderWithMethod("paypal-pro", conf.suiteConf.card_info);
      await checkout.btnClosePPCPopup.click();
      totalSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Merchant view order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
      //cause sometimes order captures slower than usual
      const actualPaymentStatus = await orderPage.reloadUntilOrdCapture();
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(conf.suiteConf.gateway_info.gateway_name);
      const orderTimelinePaymentProcessed = orderPage.generateOrderTimelineMsgByGw(
        conf.suiteConf.gateway_info.gateway_name,
        totalSF,
        conf.suiteConf.account_name,
        conf.suiteConf.gateway_info.ending_card_no,
      );
      expect(actualPaymentStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalSF);
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
    });
  });

  test(`Checkout with adding item from post-purchase to order
  via paypal pro successfully and 3ds @SB_CHE_PPP_12`, async ({ conf }) => {
    await dashboard.updatePaypalProWith3ds(conf.suiteConf.shop_id, conf.suiteConf.account_name, true);

    await test.step(`- Trên SF->Add product to cart->Checkout
    - Tại màn checkout nhập thông tin checkout- Tại màn confirm password PP Pro, nhập password`, async () => {
      await settingTheme.editCheckoutLayout("multi-step");
      await checkoutAPI.addProductToCartThenCheckout(conf.caseConf.product_info);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod("paypal-pro", conf.suiteConf.card_info);
    });

    await test.step(`Check PPC không hiển thị khi 3Ds đưuọc enable`, async () => {
      const isShowPPC = await checkout.isPostPurchaseDisplayed(5000);
      expect(isShowPPC).toBeFalsy();
    });

    await test.step(`Verify order in Dashboard`, async () => {
      const totalOrderSF = await checkout.getTotalOnOrderSummary();
      const orderId = await checkout.getOrderIdBySDK();
      const orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      //cause sometimes order captures slower than usual
      const actualPaymentStatus = await orderPage.reloadUntilOrdCapture();
      // Verify order detail
      const actualTotalOrder = await orderPage.getTotalOrder();
      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(actualPaymentStatus).toEqual("Paid");
      expect(actualTotalOrder).toEqual(totalOrderSF);
      expect(actualPaidByCustomer).toEqual(totalOrderSF);
    });
  });
});
