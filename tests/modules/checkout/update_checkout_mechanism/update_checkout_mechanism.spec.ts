import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import type { DataSetting, OrderAfterCheckoutInfo, OrderSummary } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";

test.describe("SB_CHE_CHEN_NE_1PAGE Checkout new ecom without setting PPC", () => {
  let domain: string;
  let paypalAccount;
  let dataDefaultSetting: DataSetting;

  let orderSummaryBeforeCompleteOrd: OrderSummary;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  // let productCheckout: Product[];
  let dashboardAPI: DashboardAPI;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let orderApi: OrderAPI;

  const casesID = "CO_EMBEDDED_PAYPAL";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      data_setting: dataSetting,
      payment_method: paymentMethod,
      case_description: caseDescription,
      products_checkout: productCheckout,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ conf, page, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        dashboardAPI = new DashboardAPI(domain, authRequest);
        orderApi = new OrderAPI(domain, authRequest);

        dataDefaultSetting = conf.suiteConf.data_default_setting;
        paypalAccount = conf.suiteConf.paypal_account;

        await test.step(`Before Each: Change data setting to default`, async () => {
          await dashboardAPI.changeDataSetting(dataDefaultSetting);
        });

        await test.step(`
          - Chọn payment method Paypal
          - Click Complete order / Place your order `, async () => {
          // Add product to cart and select shipping method
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          // Get data before complete order
          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();

          // Complete order and pending payment in Paypal dasboard
          await checkoutPage.selectPaymentMethod(paymentMethod);
          await checkoutPage.clickBtnCompleteOrder();
          await checkoutPage.logInPayPalToPay();
          await checkoutPage.byPassAcceptCookiePaypal();
        });

        await test.step(`
          - Khi đang đợi confirm payment tại sandbox Paypal, tại Dashboard:   
            + Discount: Đổi discount thành percentage 20%  
            + Settings > Taxes:         
              Đổi tax rate = 20%        
              Uncheck checkbox tax include`, async () => {
          await dashboardAPI.changeDataSetting(dataSetting);
        });

        await test.step(`- Tại sandbox Paypal: Confirm payment  `, async () => {
          await checkoutPage.page.click(checkoutPage.xpathSubmitBtnOnPaypal);
          await expect(checkoutPage.page.locator(checkoutPage.xpathSubmitBtnOnPaypal)).toBeHidden();
          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

          expect(isEqual(orderSummaryBeforeCompleteOrd.subTotal, orderSummaryInfo.subTotal, 0.01)).toBe(true);
          expect(isEqual(orderSummaryBeforeCompleteOrd.totalPrice, orderSummaryInfo.totalSF, 0.01)).toBe(true);
          expect(
            isEqual(Number(orderSummaryBeforeCompleteOrd.discountValue), Number(orderSummaryInfo.discountValue), 0.01),
          ).toBe(true);
          expect(isEqual(Number(orderSummaryBeforeCompleteOrd.taxes), Number(orderSummaryInfo.taxValue), 0.01)).toBe(
            true,
          );
          expect(
            isEqual(Number(orderSummaryBeforeCompleteOrd.shippingValue), Number(orderSummaryInfo.shippingSF), 0.01),
          ).toBe(true);
        });

        await test.step(`Kiểm tra order tại Order list`, async () => {
          await orderPage.gotoOrderPage("shopbase");
          await orderPage.searchOrder(orderSummaryInfo.orderName);
          const expectTotalAmt = await orderPage.getTotalOrderInOrderList(orderSummaryInfo.orderName);
          expect(isEqual(orderSummaryInfo.totalSF, Number(expectTotalAmt), 0.01)).toBe(true);
        });

        await test.step(`Kiểm tra order details`, async () => {
          await orderPage.clickOrderByName(orderSummaryInfo.orderName);
          await orderPage.page.waitForSelector(orderPage.orderStatus);
          const orderInfo = await orderPage.getOrderSummaryShopBaseInOrderDetail();

          expect(isEqual(orderInfo.total, orderSummaryInfo.totalSF, 0.01)).toBe(true);
          expect(isEqual(orderInfo.subtotal, orderSummaryInfo.subTotal, 0.01)).toBe(true);
          expect(isEqual(orderInfo.discount, Number(orderSummaryInfo.discountValue), 0.01)).toBe(true);
          expect(isEqual(orderInfo.tax_amount, Number(orderSummaryInfo.taxValue), 0.01)).toBe(true);
          expect(isEqual(orderInfo.shipping_fee, Number(orderSummaryInfo.shippingSF), 0.01)).toBe(true);
        });

        await test.step(`Click More actions > View order status page`, async () => {
          const actOrderInfo = await orderPage.viewOrderStatusAndGetCheckoutInfo();

          expect(isEqual(actOrderInfo.totalSF, orderSummaryInfo.totalSF, 0.01)).toBe(true);
          expect(isEqual(actOrderInfo.subTotal, orderSummaryInfo.subTotal, 0.01)).toBe(true);
          expect(isEqual(Number(actOrderInfo.discountValue), Number(orderSummaryInfo.discountValue), 0.01)).toBe(true);
          expect(isEqual(actOrderInfo.taxValue, Number(orderSummaryInfo.taxValue), 0.01)).toBe(true);
          expect(isEqual(Number(actOrderInfo.shippingSF), Number(orderSummaryInfo.shippingSF), 0.01)).toBe(true);
        });

        await test.step(`Tại Dashboard Paypal: Tìm kiếm order bằng transaction ID`, async () => {
          await orderApi.getTransactionId(orderSummaryInfo.orderId);
          let orderAmt = (
            await orderApi.getOrdInfoInPaypal({ id: paypalAccount.id, secretKey: paypalAccount.secret_key })
          ).total_amount;
          orderAmt = Number(orderAmt);
          expect(isEqual(orderAmt, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });
      });
    },
  );
});
