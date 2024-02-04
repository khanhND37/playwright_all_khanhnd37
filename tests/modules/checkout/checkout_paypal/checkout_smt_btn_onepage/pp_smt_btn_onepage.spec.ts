import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { buildOrderTimelineMsg } from "@utils/checkout";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Kiểm tra order detail trong dashboard khi checkout với paypal smart button", () => {
  // eslint-disable-next-line max-len
  test("@TC_SB_CHE_PP_18 - Kiểm tra order detail trong dashboard và transaction tương ứng trên Paypal khi checkout với paypal via smart button, setting checkout 1 page", async ({
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
    const itemPostPurchaseValue = "0";

    const paypalAccount = conf.suiteConf.paypal_account;
    const customerInfo = conf.suiteConf.customer_info;
    const productName = conf.suiteConf.product_name;
    const paymentMethod = conf.suiteConf.payment_method;
    test.setTimeout(400000);

    await test.step("Lên storefront của shop", async () => {
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
      await checkout.footerLoc.scrollIntoViewIfNeeded();
    });

    await test.step("Chọn payment method và complete order", async () => {
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPPSmartButton(paypalAccount);
    });

    await test.step("Kiểm tra thank you page: order id, total order, customer name, customer email", async () => {
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      customerEmail = await checkout.getCustomerEmail();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Mở order detail bằng API và kiểm tra order detail", async () => {
      orderPage = new OrdersPage(dashboard, domain);
      await orderPage.goToOrderByOrderId(orderId);
      let orderStatus = await orderPage.getOrderStatus();
      const reloadTime = conf.caseConf.reload_time ?? 10;

      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");

      const actualTotalOrder = await orderPage.getTotalOrder();
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
      const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(
        totalOrderSF,
        paymentMethod,
        itemPostPurchaseValue,
      );
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });
  });
});

test.describe(`One page checkout: Checkout paypal smart button: credit card`, () => {
  test(`@SB_CHE_PP_19 - Buyer checkout với paypal credit card, setting checkout one page`, async ({
    page,
    conf,
    request,
    dashboard,
    authRequestWithExchangeToken,
  }) => {
    const domain = conf.suiteConf.domain;

    const homepage = new SFHome(page, domain);
    let checkout: SFCheckout;
    let productPage: SFProduct;
    let orderPage: OrdersPage;
    let orderId: number;
    let totalOrderSF: string;
    let customerEmail: string;
    let orderName: string;

    const customerInfo = conf.suiteConf.customer_info;
    const paymentMethod = conf.suiteConf.payment_method;
    const productName = conf.suiteConf.product_name;
    const paypalAccount = conf.suiteConf.paypal_account;
    const retry = conf.suiteConf.retry;
    test.setTimeout(400000);

    await test.step(`- Lên storefront của shop- Checkout sản phẩm: Shirt- Nhập các thông tin trong trang:
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
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrdViaPPCreditCard();
      await page.waitForSelector(`//h2[normalize-space()='Thank you!']`);
    });

    await test.step(`Tại Thankyou page:
                      - Lấy ra thông tin order name
                     Tại Dashboard > Order
                      - Search order theo order name
                      - Vào Order detail của order vừa tạo
                      - Kiểm tra order order detail`, async () => {
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      customerEmail = await checkout.getCustomerEmail();
      orderId = await checkout.getOrderIdBySDK();
      orderName = await checkout.getOrderName();

      orderPage = new OrdersPage(dashboard, domain);
      await orderPage.goToOrderByOrderId(orderId);

      const actualTotalOrder = await orderPage.getTotalOrder();
      let orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, retry);
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
      await orderPage.page.reload();
      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });

    await test.step(`Vào Paypal sandbox dashboard > Activities > All transaction >
                      Search theo transaction order vừa tạo`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      const orderApi = new OrderAPI(domain, requestObj);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (await orderApi.getOrdInfoInPaypal({ id: paypalAccount.id, secretKey: paypalAccount.secret_key }))
        .total_amount;
      orderAmt = +orderAmt;
      expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
    });

    await test.step(`Buyer kiểm tra mail`, async () => {
      const mailBox = await checkout.openMailBox(customerEmail);
      await mailBox.openOrderConfirmationNotification(orderName);
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF.split(" ")[0]);
    });
  });
});
