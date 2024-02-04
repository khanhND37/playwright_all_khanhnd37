/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { getProxyPage } from "@core/utils/proxy_page";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("SB_CHE_CHEN_NE_3STEPS Checkout new ecom without setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let paymentSettingAPI: PaymentProviders;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;
  let customerInfo;
  let mailBox: MailBox;

  const casesID = "SB_CHE_CHEN_NE_3STEPS";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({ case_id: caseId, case_name: caseName, payment_method: paymentMethod, is_3Ds: is3Ds, card_info: cardInfo }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        mailBox = new MailBox(page, domain);
        paymentSettingAPI = new PaymentProviders(domain, authRequest);

        // Use proxy page for dev env when using paypal BNPL
        if (paymentMethod === PaymentMethod.PAYPALBNPL && process.env.ENV === "dev") {
          const proxyPage = await getProxyPage();
          checkoutAPI = new CheckoutAPI(domain, authRequest, proxyPage);
        }

        // Add payment method
        await paymentSettingAPI.removeAllPaymentMethod();
        await paymentSettingAPI.createAPaymentMethod(paymentMethod);
        await paymentSettingAPI.activePaypalWithSpecificMethod(paymentMethod);

        productCheckout = conf.suiteConf.products_checkout;

        await test.step(`Tạo checkout thành công`, async () => {
          customerInfo = await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          if (!is3Ds) {
            await checkoutPage.completeOrderWithMethod(paymentMethod);
          } else {
            // Checkout with 3Ds card
            await checkoutPage.completeOrderWithMethod(paymentMethod, cardInfo);
            await checkoutPage.clickBtnConfirm3Ds();
          }

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await checkoutPage.waitForPageRedirectFromPaymentPage();

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
          expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
        });

        // Không check mail tại đây do đã được handle trong case khác
        // await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
        //   const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
        //   await mailBox.openMailDetailWithAPI(customerInfo.emailBuyer, emailTitle);
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
