import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { BuyerInfoApi, OrderAfterCheckoutInfo, OrderSummary } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";

test.describe("Checkout new ecom SPay", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let mailBox: MailBox;
  let domain: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let customerInfo: BuyerInfoApi;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_SPAY_NE_1PAGE";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      payment_method: paymentMethod,
      products_checkout: productCheckout,
      product_ppc_name: productPPC,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        mailBox = new MailBox(page, domain);

        await test.step(`
          - Lên storefront của shop
          - Checkout sản phẩm: Shirt
          - Nhập các thông tin trong trang:
            + Customer information
            + Shipping
            + Chọn Payment method
            + Nhập card checkout
          - Click Place order`, async () => {
          customerInfo = await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
          await checkoutAPI.openCheckoutPageByToken();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          await checkoutPage.completeOrderWithMethod(paymentMethod);

          const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
          expect(isShowPPC).toBeTruthy();
        });

        await test.step(`
          - Tại popup PPC
          - Add product PPC vào store
          - Tại paypal dashboard > Click Pay now`, async () => {
          // Add PPC:
          let ppcValue = await checkoutPage.addProductPostPurchase(productPPC);
          if (!ppcValue) {
            // for case don't add PPC
            ppcValue = "0";
          }

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue));
        });

        await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
          const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
          await mailBox.openMailDetailWithAPI(customerInfo.emailBuyer, emailTitle);
          // verify total order
          const actualTotalOrder = parseFloat(removeCurrencySymbol(await mailBox.getTotalOrder()));
          expect(isEqual(actualTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });

        await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });
      });
    },
  );

  test(`@SB_NEWECOM_CO_11 Kiểm tra order detail khi checkout thành công với cổng Spay, checkout 1 page`, async ({
    page,
    conf,
    authRequest,
    dashboard,
  }) => {
    const productCheckout = conf.caseConf.products_checkout;
    const paymentMethod = conf.caseConf.payment_method;
    const domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);

    await test.step(`
      - Lên storefront của shop
      - Checkout sản phẩm: Shirt
      - Nhập các thông tin trong trang:
        + Customer information
        + Shipping
        + Chọn Payment method
        + Nhập card checkout
      - Click Place order`, async () => {
      customerInfo = await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod(paymentMethod);

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
    });

    // Không check mail tại đây do đã được handle trong case khác
    // await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
    // const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
    // await mailBox.openMailDetailWithAPI(customerInfo.emailBuyer, emailTitle);
    //   // verify total order
    //   const actualTotalOrder = parseFloat(removeCurrencySymbol(await mailBox.getTotalOrder()));
    //   expect(isEqual(actualTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    // });

    await test.step(`
      Tại Thankyou page
      - Lấy ra thông tin order name
      Tại Dashboard > Order
      - Search order theo order name
      - Vào Order detail của order vừa tạo
      - Kiểm tra order order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture();
      // verify order amount
      const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
      expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });
  });
});
