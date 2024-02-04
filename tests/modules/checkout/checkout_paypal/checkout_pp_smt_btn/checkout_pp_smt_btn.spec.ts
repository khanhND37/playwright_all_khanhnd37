import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";

import { loadData } from "@core/conf/conf";
import { buildOrderTimelineMsg } from "@utils/checkout";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe(`Kiểm tra order detail trong dashboard khi checkout với paypal smart button,
  Setting checkout 3 pages`, () => {
  let themeSetting: SettingThemeAPI;

  test.beforeAll(async ({ theme }) => {
    themeSetting = new SettingThemeAPI(theme);
  });

  const caseName = "TC_CHE_PP_SMB_01";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(({ product_name: productName, product_ppc_name: ppcItem, case_id: caseID }) => {
    // eslint-disable-next-line max-len
    test(`Kiểm tra order detal trong dashboard khi checkout với paypal standard for case @${caseID}`, async ({
      page,
      conf,
      request,
      dashboard,
    }) => {
      // prepair data for
      const domain = conf.suiteConf.domain;
      const homepage = new SFHome(page, domain);
      let checkout: SFCheckout;
      let productPage: SFProduct;
      let orderPage: OrdersPage;
      let orderId: number;
      let totalOrderSF: string;
      let customerEmail: string;

      let isPostPurchase = false;
      let itemPostPurchaseValue = "0";

      const paypalAccount = conf.suiteConf.paypal_account;
      const customerInfo = conf.suiteConf.customer_info;
      const shippingMethod = conf.suiteConf.shipping_method;
      const paymentMethod = conf.suiteConf.payment_method;
      test.setTimeout(300000);

      await test.step("Lên storefront của shop", async () => {
        await themeSetting.editCheckoutLayout("multi-step");
        await homepage.gotoHomePage();
      });

      await test.step("Checkout sản phẩm", async () => {
        productPage = await homepage.searchThenViewProduct(productName);
        await productPage.addProductToCart();
        await productPage.navigateToCheckoutPage();
      });

      await test.step("Nhập thông tin customer information", async () => {
        checkout = new SFCheckout(page, domain, "", request);
        await checkout.enterShippingAddress(customerInfo);
      });

      await test.step("Chọn shipping method", async () => {
        await checkout.selectShippingMethod(shippingMethod);
        await checkout.continueToPaymentMethod();
      });

      await test.step("Chọn payment method và complete order", async () => {
        await checkout.selectPaymentMethod(paymentMethod);
        await checkout.completeOrderViaPPSmartButton(paypalAccount);
      });

      await test.step("Tại popup ppc, chọn item post purchase và commplete order", async () => {
        itemPostPurchaseValue = await checkout.addProductPostPurchase(ppcItem);
        if (itemPostPurchaseValue != null) {
          isPostPurchase = true;
          await checkout.completePaymentForPostPurchaseItem(paymentMethod);
        }
      });

      await test.step("Kiểm tra thank you page: order id, total order, customer name, customer email", async () => {
        totalOrderSF = await checkout.getTotalOnOrderSummary();
        customerEmail = await checkout.getCustomerEmail();
        orderId = await checkout.getOrderIdBySDK();
      });

      await test.step("Mở order detail bằng API và kiểm tra order detail", async () => {
        const reloadTime = conf.suiteConf.reload_time;
        orderPage = new OrdersPage(dashboard, domain);
        await orderPage.goToOrderByOrderId(orderId);
        let orderStatus = await orderPage.getOrderStatus();

        //cause sometimes order captures slower than usual
        orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
        expect(orderStatus).toEqual("Paid");

        const actualTotalOrder = await orderPage.getTotalOrder();
        expect(actualTotalOrder).toEqual(totalOrderSF);

        const actualPaidByCustomer = await orderPage.getPaidByCustomer();
        expect(actualPaidByCustomer).toEqual(totalOrderSF);

        const orderTimelineSendingEmail = buildOrderTimelineMsg(
          customerInfo.first_name,
          customerInfo.last_name,
          customerEmail,
        ).timelineSendEmail;
        const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
          customerInfo.first_name,
          customerInfo.last_name,
          customerEmail,
        ).timelinePlaceOrd;
        const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(
          totalOrderSF,
          paymentMethod,
          itemPostPurchaseValue,
        );
        const orderTimeLinePaymentProcessedItemPPC = orderPage.buildOrderTimelinePPCMsgByGW(
          paymentMethod,
          itemPostPurchaseValue,
        );
        const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

        await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
        if (ppcItem != null) {
          await expect(await orderPage.orderTimeLines(orderTimeLinePaymentProcessedItemPPC)).toBeVisible();
          await expect(
            await orderPage.orderTimeLines(orderTimelineTransID, isPostPurchase, paymentMethod),
          ).toBeVisible();
        }
      });
    });
  });
});

test.describe(`3 Step checkout: Checkout paypal smart button: credit card`, () => {
  test(`@SB_CHE_PP_15 - Buyer checkout với paypal credit card, setting checkout 3 page`, async ({
    page,
    conf,
    token,
    request,
    authRequestWithExchangeToken,
  }) => {
    const domain = conf.suiteConf.domain;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    const homepage = new SFHome(page, domain);
    let checkout: SFCheckout;
    let productPage: SFProduct;
    let orderPage: OrdersPage;
    let orderId: number;
    let totalOrderSF: string;
    let customerEmail: string;
    let orderName: string;
    let mailBox: MailBox;

    const customerInfo = conf.suiteConf.customer_info;
    const shippingMethod = conf.suiteConf.shipping_method;
    const paymentMethod = conf.suiteConf.payment_method;
    const paypalAccount = conf.suiteConf.paypal_account;
    const productName = conf.caseConf.product_name;
    test.setTimeout(400000);

    await test.step(`
      - Lên storefront của shop
      - Checkout sản phẩm: Shirt
      - Nhập các thông tin trong trang:
        + Customer information
        + Shipping
        + Chọn Payment method
      - Click button 'Debit or credit card'
        + Nhập thông tin card
        + Click button 'Pay now'`, async () => {
      await homepage.gotoHomePage();

      productPage = await homepage.searchThenViewProduct(productName);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();

      checkout = new SFCheckout(page, domain, "", request);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.selectShippingMethod(shippingMethod);
      await checkout.continueToPaymentMethod();
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrdViaPPCreditCard();
      await page.waitForSelector(`//h2[normalize-space()='Thank you!']`);
    });

    await test.step(`
      Tại Thankyou page:
      - Lấy ra thông tin order name
      Tại Dashboard > Order
      - Search order theo order name
      - Vào Order detail của order vừa tạo
      - Kiểm tra order order detail`, async () => {
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      customerEmail = await checkout.getCustomerEmail();
      orderId = await checkout.getOrderIdBySDK();
      orderName = await checkout.getOrderName();
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);

      const actualTotalOrder = await orderPage.getTotalOrder();
      let orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus);
      expect(orderStatus).toEqual("Paid");
      expect(actualTotalOrder).toEqual(totalOrderSF);

      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(actualPaidByCustomer).toEqual(totalOrderSF);

      // temporarily skip check timeline on dev env
      // need to check again when dev env is stable
      if (process.env.ENV == "dev") {
        return;
      }

      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        customerEmail,
      ).timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        customerEmail,
      ).timelinePlaceOrd;
      const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(totalOrderSF, paymentMethod);
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });

    await test.step(`
      Vào Paypal sandbox dashboard > Activities > All transaction >
      Search theo transaction order vừa tạo`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      const orderApi = new OrderAPI(domain, requestObj);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (await orderApi.getOrdInfoInPaypal({ id: paypalAccount.id, secretKey: paypalAccount.secret_key }))
        .total_amount;
      orderAmt = Number(orderAmt.toFixed(2));
      expect(orderAmt).toEqual(removeCurrencySymbol(totalOrderSF));
    });

    await test.step(`Buyer kiểm tra mail`, async () => {
      mailBox = new MailBox(page, domain);
      const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
      await mailBox.openMailDetailWithAPI(customerEmail, emailTitle);
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF.split(" ")[0]);
    });
  });
});
