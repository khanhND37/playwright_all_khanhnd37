import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Checkout via Stripe successfully", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let domain: string;

  test(`@SB_STD_03 Checkout via Stripe successfully UI flow and auto capture order`, async ({
    conf,
    page,
    request,
    dashboard,
  }) => {
    domain = conf.suiteConf.domain;

    const productPPC = conf.suiteConf.product_ppc_name;
    const productInfo = conf.suiteConf.products_checkout;
    let orderSummaryInfo;

    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);

    await test.step(`Tạo checkout thành công`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productInfo);
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();

      const orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod();

      // Add PPC:
      const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
      expect(isShowPPC).toBeTruthy();
      const ppcValue = await checkoutPage.addProductPostPurchase(productPPC);
      await checkoutPage.completePaymentForPostPurchaseItem();

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue));
    });

    await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      // verify order amount
      const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
      expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

      const orderStatus = await orderPage.reloadUntilOrdCapture();
      const paidByCustomer = parseFloat(removeCurrencySymbol(await orderPage.getPaidByCustomer()));

      expect(orderStatus).toEqual("Paid");
      expect(isEqual(paidByCustomer, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });
  });
});
