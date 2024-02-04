import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { BuyerInfoApi, CheckoutInfo, DataSetting, Product } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@utils/checkout";

function getDiscountManual(dataSetting: DataSetting) {
  if (dataSetting?.discount?.title && dataSetting?.discount?.type === "manual") {
    return dataSetting?.discount?.title;
  }
  return "";
}

test.describe("Update cơ chế Payment", () => {
  let checkoutPage: SFCheckout;
  let homePage: SFHome;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let customerInfo: BuyerInfoApi;
  let dashboardAPI: DashboardAPI;
  let orderAPI: OrderAPI;
  let productsCheckout: Product[];
  let domain: string;

  const config = loadData(__dirname, "DATA_DRIVEN_CHECKOUT_EMBEDDED");
  const numRetries = config.suiteConf.number_retry;
  const accDashboardPayment = config.suiteConf.acc_dashboard_payment;

  config.caseConf.data.forEach(caseData => {
    test(`@${caseData.case_id} ${caseData.case_name}`, async ({ conf, page, authRequest, dashboard }) => {
      domain = conf.suiteConf.domain;
      dashboardAPI = new DashboardAPI(domain, authRequest);
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      checkoutPage = new SFCheckout(page, domain);
      orderPage = new OrdersPage(dashboard, domain);
      homePage = new SFHome(page, domain);
      orderAPI = new OrderAPI(domain, authRequest);
      customerInfo = {
        emailBuyer: caseData.email,
        shippingAddress: caseData.shipping_address,
      };
      productsCheckout = caseData.products;
      let checkoutInfoBefore: CheckoutInfo;
      let orderName: string;
      let orderId = 0;

      await test.step("Reset data to before data change", async () => {
        const dataResetSetting: DataSetting = caseData.data_reset_setting;
        await dashboardAPI.changeDataSetting(dataResetSetting);
      });

      await test.step(`\n- Chọn payment method ${caseData.payment_method}\n- Click Complete order / Place your order`, async () => {
        // create cart by api
        await checkoutAPI.addProductThenSelectShippingMethod(
          productsCheckout,
          customerInfo.emailBuyer,
          customerInfo.shippingAddress,
          "",
          !!caseData.data_setting.boost_upsell,
          getDiscountManual(caseData.data_setting),
        );

        // select global market
        await homePage.gotoHomePage();
        await homePage.selectStorefrontCurrencyV2(customerInfo.shippingAddress.country, "inside");

        // open checkout page
        await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
        await expect(checkoutPage.page.locator(`(${checkoutPage.xpathShippingMethodName})[1]`)).toBeVisible();

        // select payment method and click button complete order
        const paymentMethodType = caseData.payment_method == PaymentMethod.SEPA ? "sepa_debit" : undefined;
        await checkoutAPI.chargeAuthorizedIgnoreCreateOrder(conf.suiteConf.card_info, customerInfo, paymentMethodType);

        // save data before click complete order
        checkoutInfoBefore = await checkoutAPI.getCheckoutInfoWithGlobalMarket(numRetries);
      });

      await test.step(`Tại Dashboard thay đổi thông tin`, async () => {
        const dataSetting: DataSetting = caseData.data_setting;
        await dashboardAPI.changeDataSetting(dataSetting);
      });

      await test.step(`Call API tạo order`, async () => {
        await orderAPI.callApiCreateOrderByConsumer(checkoutAPI.checkoutToken, conf.suiteConf.shop_id);

        //wait until order be created and get order_id and order name
        const checkoutInfoAfter = await checkoutAPI.getCheckoutInfoUtilExistOrder(numRetries);
        orderId = checkoutInfoAfter.order?.id;
        expect(orderId).toBeTruthy();
        orderName = checkoutInfoAfter.order?.name;
      });

      await test.step(`Kiểm tra order tại Order list`, async () => {
        expect(!!orderName && orderName.length > 0).toBeTruthy();
        await orderPage.gotoOrderPage(conf.suiteConf.platform);
        await orderPage.searchOrder(orderName);
        const expectTotalAmt = await orderPage.getTotalOrderInOrderList(orderName);
        expect(isEqual(checkoutInfoBefore.totals.total_price, Number(expectTotalAmt), 0.01)).toBe(true);
      });

      await test.step(`Kiểm tra order details`, async () => {
        await orderPage.clickOrderByName(orderName);

        //cause sometimes order captures slower than usual
        const orderStatus = await orderPage.reloadUntilOrdCapture("", numRetries);

        switch (caseData.payment_method) {
          case PaymentMethod.SEPA:
          case PaymentMethod.SOFORT:
            expect(orderStatus).toEqual("Payment in process");
            break;
          default:
            expect(orderStatus).toEqual("Paid");
        }
        const orderInfo = await orderPage.getOrderSummaryShopBaseInOrderDetail();

        expect(isEqual(orderInfo.total, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
        expect(isEqual(orderInfo.subtotal, checkoutInfoBefore.totals.subtotal_price, 0.01)).toBe(true);
        expect(isEqual(orderInfo.shipping_fee, checkoutInfoBefore.totals.shipping_fee, 0.01)).toBe(true);
        let totalDiscounts = checkoutInfoBefore.totals.total_discounts;
        if (checkoutInfoBefore.info.discount_type === "free_shipping") {
          totalDiscounts = checkoutInfoBefore.totals.shipping_fee;
        }
        expect(isEqual(orderInfo.discount, totalDiscounts, 0.01)).toBe(true);
        expect(isEqual(orderInfo.tax_amount, checkoutInfoBefore.totals.total_tax, 0.01)).toBe(true);
        if (!["sepa direct debit", "sofort"].includes(caseData.payment_method.toLowerCase())) {
          expect(isEqual(orderInfo.paid_by_customer, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
        }
      });

      await test.step(`Tại Dashboard ${checkoutAPI.getNameDashboardPortal(
        caseData.payment_method,
      )}: Tìm kiếm order bằng transaction ID`, async () => {
        const listTransactionID = await orderAPI.getListTransactionId(orderId);
        if (listTransactionID && listTransactionID.length) {
          if (caseData.payment_method === "card") {
            accDashboardPayment.stripe["gatewayCode"] = checkoutAPI.gatewayCode;
            accDashboardPayment.stripe["connectedAcc"] = checkoutAPI.connectedAccount;
          }
          const totalOrderDBStripe = await orderAPI.getTotalOrderInfoInDashboardPayment(
            accDashboardPayment,
            listTransactionID,
            checkoutInfoBefore.info?.extra_data?.global_market?.rate,
            caseData.payment_method,
          );
          expect(isEqual(totalOrderDBStripe.total, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
        }
      });
      await test.step("Reset data to after data change", async () => {
        const dataResetSetting: DataSetting = caseData.data_reset_setting;
        await dashboardAPI.changeDataSetting(dataResetSetting);
      });
    });
  });
});
