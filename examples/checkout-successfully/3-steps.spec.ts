import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { BuyerInfoApi, OrderAfterCheckoutInfo, OrderSummary } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { isEqual } from "@core/utils/checkout";

test.describe("SB_CHE_CHEN_NE_3STEPS Checkout via Stripe successfully", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let mailBox: MailBox;
  let domain: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let customerInfo: BuyerInfoApi;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  test(`@SB_CHE_CHEN_NE_3STEPS_1 Checkout via Stripe successfully with 3 steps checkout`, async ({
    conf,
    page,
    authRequest,
    dashboard,
  }) => {
    domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);

    await test.step(`Tạo checkout thành công`, async () => {
      customerInfo = await checkoutAPI.addProductThenSelectShippingMethod(conf.suiteConf.products_checkout);
      await checkoutAPI.openCheckoutPageByToken();

      orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod("Stripe");

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      expect(await checkoutPage.isThankyouPage()).toBe(true);

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
      expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
    });

    await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
      mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
      await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
      // verify total order
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(removeCurrencySymbol(actualTotalOrder)).toBe(orderSummaryInfo.totalSF.toString());
    });

    await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      // verify order amount
      const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
      expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

      const paidByCustomer = parseFloat(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Paid");
      expect(isEqual(paidByCustomer, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });
  });
});
