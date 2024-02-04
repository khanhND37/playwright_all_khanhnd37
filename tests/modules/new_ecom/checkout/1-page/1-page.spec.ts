import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { BuyerInfoApi, OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import type { Dev, SbCheChenNe1Page } from "./1-page";
import { isEqual } from "@core/utils/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { EmailScheduleData } from "../email-schdules";
import { getProxyPage } from "@core/utils/proxy_page";

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
  let scheduleData: EmailScheduleData;
  let isSchedule: boolean;

  const casesID = "SB_CHE_CHEN_NE_1PAGE";
  const conf = loadData(__dirname, casesID);

  const suiteConf = conf.suiteConf as Dev;
  const caseConf = conf.caseConf as SbCheChenNe1Page[];

  caseConf.forEach(({ case_id: caseId, case_name: caseName, payment_method: paymentMethod }) => {
    test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard, scheduler }) => {
      domain = suiteConf.domain;
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      mailBox = new MailBox(page, domain);
      checkoutPage = new SFCheckout(page, domain);
      orderPage = new OrdersPage(dashboard, domain);
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

      const rawDataJson = await scheduler.getData();
      if (rawDataJson) {
        scheduleData = rawDataJson as EmailScheduleData;
        isSchedule = true;
        customerInfo = {
          emailBuyer: null,
          shippingAddress: null,
        };
      } else {
        scheduleData = {
          emailBuyer: "",
          orderSummaryInfo: null,
        };
      }

      productCheckout = suiteConf.products_checkout;

      await test.step(`Tạo checkout thành công`, async () => {
        if (isSchedule) {
          return;
        }

        customerInfo = await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.waitForCheckoutPageCompleteRender();

        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
        const expectTotalOrder = await checkoutPage.calculateTotalOrder(orderSummaryBeforeCompleteOrd);
        expect(isEqual(expectTotalOrder, orderSummaryBeforeCompleteOrd.totalPrice, 0.01)).toBe(true);

        await checkoutPage.completeOrderWithMethod(paymentMethod);

        // Expected: - Thanh toán thành công, hiển thị trang thankyou
        await checkoutPage.waitForPageRedirectFromPaymentPage();

        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
        expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
      });

      await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
        if (isSchedule) {
          orderSummaryInfo = scheduleData.orderSummaryInfo;
          customerInfo.emailBuyer = scheduleData.emailBuyer;
        }
        // Clear schedule data
        if (isSchedule) {
          await scheduler.clear();
        }
        mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
        try {
          const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
          await mailBox.openMailDetailWithAPI(customerInfo.emailBuyer, emailTitle);
        } catch {
          scheduleData.emailBuyer = customerInfo.emailBuyer;
          scheduleData.orderSummaryInfo = orderSummaryInfo;
          await scheduler.setData(scheduleData);
          await scheduler.schedule({ mode: "later", minutes: 3 });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        }
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
