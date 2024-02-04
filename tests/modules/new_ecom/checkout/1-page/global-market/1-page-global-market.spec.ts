import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { SFHome } from "@pages/storefront/homepage";
import { ThankYouPage } from "@pages/storefront/thankYou";

test.describe("SB_CHE_CHEN_NE_GLB_MARKET Checkout new ecom with Global Market", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let paymentSettingAPI: PaymentProviders;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;
  let homePage: SFHome;
  let thankyouPage: ThankYouPage;
  let retry: number;

  const casesID = "SB_CHE_CHEN_NE_GLB_MARKET";
  const conf = loadData(__dirname, casesID);
  const suiteConf = conf.suiteConf;
  const caseConf = conf.caseConf;

  caseConf.forEach(({ case_id: caseId, case_name: caseName, payment_method: paymentMethod }) => {
    test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
      domain = suiteConf.domain;
      retry = conf.suiteConf.retry;
      homePage = new SFHome(page, domain);
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      checkoutPage = new SFCheckout(page, domain);
      thankyouPage = new ThankYouPage(page, domain);
      orderPage = new OrdersPage(dashboard, domain);
      paymentSettingAPI = new PaymentProviders(domain, authRequest);

      productCheckout = suiteConf.products_checkout;

      // Add payment method
      await paymentSettingAPI.removeAllPaymentMethod();
      await paymentSettingAPI.createAPaymentMethod(paymentMethod);

      await test.step(`Pre-condition`, async () => {
        //setting global market EU
        await homePage.gotoHomePage();
        const currency = conf.suiteConf.currency;
        await homePage.selectStorefrontCurrencyNE(currency);
      });

      await test.step(`Tạo checkout thành công`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
        await checkoutAPI.openCheckoutPageByToken();

        // Expected: Trên checkout page đã convert hết curency sang EUR
        await expect(checkoutPage.isTextVisible("€")).toBeTruthy();
        await checkoutPage.waitForCheckoutPageCompleteRender();

        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
        await checkoutPage.completeOrderWithMethod(paymentMethod);

        // Expected: - Thanh toán thành công, hiển thị trang thankyou
        await page.waitForSelector(checkoutPage.xpathThankYou);

        // Expected: - Currency trên thankyou page: EUR
        await expect(thankyouPage.isTextVisible("€")).toBeTruthy();
        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        expect(isEqual(orderSummaryInfo.subTotal, orderSummaryBeforeCompleteOrd.subTotal, 0.01)).toBe(true);
        expect(isEqual(orderSummaryInfo.totalSF, orderSummaryBeforeCompleteOrd.totalPrice, 0.01)).toBe(true);
      });

      // Tam thoi bo qua check mail confirm phan nay
      // await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
      //   mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
      //   await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
      //   // verify total order
      //   const actualTotalOrder = await mailBox.getTotalOrder();
      //   expect(Number(removeCurrencySymbol(actualTotalOrder))).toBe(orderSummaryInfo.totalSF);
      // });

      await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order status
        await orderPage.reloadUntilOrdCapture("", retry);
        const statusOrd = await orderPage.getOrderStatus();
        expect(statusOrd).toBe("Paid");
        // Click button 'Switch currency'
        await orderPage.switchCurrency();
        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
      });
    });
  });
});
