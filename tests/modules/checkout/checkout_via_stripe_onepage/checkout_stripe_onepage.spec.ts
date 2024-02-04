import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { CheckoutAPI } from "@pages/api/checkout";

import { buildOrderTimelineMsg, isEqual, parseMoneyCurrency } from "@utils/checkout";

test.describe("Kiểm tra checkout thành công với cổng stripe, checkout one page", () => {
  test(`Kiểm tra checkout thành công với cổng stripe, checkout one page @TC_SB_CHE_STR_19`, async ({
    page,
    conf,
    token,
    request,
  }) => {
    // prepair data for

    const domain = conf.suiteConf.domain;
    let checkout: SFCheckout;

    const itemPostPurchaseValue = "0";

    let orderPage: OrdersPage;
    let orderId: number;
    let totalOrderSF: string;
    let customerEmail: string;

    const paymentMethod = conf.caseConf.payment_method;
    const productInfo = conf.caseConf.product;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const numberRetry = conf.suiteConf.number_retry;

    const cardInfo = conf.suiteConf.card_info;
    const gatewayName = conf.suiteConf.gateway_info.gateway_name;
    const endingCardNo = conf.suiteConf.gateway_info.ending_card_no;

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    await test.step(`
    Lên storefront của shop
    Checkout sản phẩm: Shirt
    Nhập các thông tin trong trang:
     + Customer information
     + Shipping
     + Chọn Payment method
    Nhập card checkout
    Click Place order
    `, async () => {
      const countryCode = shippingAddress.country_code;

      const checkoutAPI = new CheckoutAPI(domain, request, page);

      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.openCheckoutPageByToken();

      checkout = new SFCheckout(page, domain);
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderWithCardInfo(cardInfo);
    });

    await test.step(`
    Tại Thankyou page
    - Lấy ra thông tin order name
    Tại Dashboard > Order
    - Search order theo order name
    - Vào Order detail của order vừa tạo
    - Kiểm tra order order detail`, async () => {
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      customerEmail = await checkout.getCustomerEmail();
      orderId = await checkout.getOrderIdBySDK();
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);

      //cause sometimes order captures slower than usual
      const orderStatus = await orderPage.reloadUntilOrdCapture("", numberRetry);
      expect(orderStatus).toEqual("Paid");

      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(isEqual(parseMoneyCurrency(actualTotalOrder), parseMoneyCurrency(totalOrderSF), 0.01)).toEqual(true);

      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(isEqual(parseMoneyCurrency(actualPaidByCustomer), parseMoneyCurrency(totalOrderSF), 0.01)).toEqual(true);

      totalOrderSF = actualPaidByCustomer;

      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        customerEmail,
      ).timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        customerEmail,
      ).timelinePlaceOrd;
      const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(
        totalOrderSF,
        paymentMethod,
        itemPostPurchaseValue,
        gatewayName,
        endingCardNo,
      );
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

      await expect(
        await orderPage.waitOrderTimeLineVisible(orderTimelineSendingEmail, false, "", numberRetry),
      ).toBeVisible();
      await expect(
        await orderPage.waitOrderTimeLineVisible(orderTimelineCustomerPlaceOrder, false, "", numberRetry),
      ).toBeVisible();
      await expect(
        await orderPage.waitOrderTimeLineVisible(orderTimelinePaymentProcessed, false, "", numberRetry),
      ).toBeVisible();
      await expect(
        await orderPage.waitOrderTimeLineVisible(orderTimelineTransID, false, "", numberRetry),
      ).toBeVisible();
    });
  });
});
