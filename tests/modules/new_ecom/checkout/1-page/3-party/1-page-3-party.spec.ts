import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { BuyerInfoApi, OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("SB_CHE_CHEN_NE_1PAGE Checkout new ecom without setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let paymentSettingAPI: PaymentProviders;
  let mailBox: MailBox;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let customerInfo: BuyerInfoApi;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_CHEN_NE_1PAGE";
  const conf = loadData(__filename, casesID);

  const suiteConf = conf.suiteConf;
  const caseConf = conf.caseConf;

  caseConf.forEach(({ case_id: caseId, case_name: caseName, payment_method: paymentMethod }) => {
    test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
      domain = suiteConf.domain;
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      checkoutPage = new SFCheckout(page, domain);
      orderPage = new OrdersPage(dashboard, domain);
      mailBox = new MailBox(page, domain);
      paymentSettingAPI = new PaymentProviders(domain, authRequest);

      // Add payment method
      await paymentSettingAPI.removeAllPaymentMethod();
      await paymentSettingAPI.createAPaymentMethod(paymentMethod);
      await paymentSettingAPI.activePaypalWithSpecificMethod(paymentMethod);

      productCheckout = suiteConf.products_checkout;

      await test.step(`Tạo checkout thành công`, async () => {
        customerInfo = await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();

        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();

        await checkoutPage.completeOrderWithMethod(paymentMethod);

        // Expected: - Thanh toán thành công, hiển thị trang thankyou
        await expect(checkoutPage.thankyouPageLoc).toBeVisible();

        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
        expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
      });

      await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
        const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
        await mailBox.openMailDetailWithAPI(customerInfo.emailBuyer, emailTitle);
        // verify total order
        const actualTotalOrder = await mailBox.getTotalOrder();
        expect(removeCurrencySymbol(actualTotalOrder)).toBe(orderSummaryInfo.totalSF.toFixed(2));
      });

      await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
      });
    });
  });
});
