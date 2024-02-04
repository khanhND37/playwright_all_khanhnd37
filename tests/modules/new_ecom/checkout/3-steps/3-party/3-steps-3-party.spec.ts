import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("SB_CHE_CHEN_NE_3STEPS Checkout new ecom without setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let paymentSettingAPI: PaymentProviders;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;
  let timeout;

  const casesID = "SB_CHE_CHEN_NE_3STEPS";
  const conf = loadData(__dirname, casesID);
  // eslint-disable-next-line prefer-const
  timeout = conf.suiteConf.timeout;

  conf.caseConf.forEach(
    ({ case_id: caseId, case_name: caseName, payment_method: paymentMethod, is_3Ds: is3Ds, card_info: cardInfo }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        paymentSettingAPI = new PaymentProviders(domain, authRequest);

        // Add payment method
        await paymentSettingAPI.removeAllPaymentMethod();
        await paymentSettingAPI.createAPaymentMethod(paymentMethod);
        await paymentSettingAPI.activePaypalWithSpecificMethod(paymentMethod);

        productCheckout = conf.suiteConf.products_checkout;

        await test.step(`Tạo checkout thành công`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();
          // Wait for lazy load
          await checkoutPage.footerLoc.scrollIntoViewIfNeeded();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          if (!is3Ds) {
            await checkoutPage.completeOrderWithMethod(paymentMethod);
          } else {
            // Checkout with 3Ds card
            await checkoutPage.completeOrderWithMethod(paymentMethod, cardInfo);
            await checkoutPage.clickBtnConfirm3Ds();
          }

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: timeout });

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
          expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
        });

        // Không check mail tại đây do đã được handle trong case khác
        // await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
        //   mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
        //   await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName, 5);
        //   // verify total order
        //   const actualTotalOrder = await mailBox.getTotalOrder();
        //   expect(removeCurrencySymbol(actualTotalOrder)).toBe(orderSummaryInfo.totalSF.toString());
        // });

        await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });
      });
    },
  );
});
