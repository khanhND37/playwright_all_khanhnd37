import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { BuyerInfoApi, CheckoutInfo, DataSetting, FixtureToken, Product } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@utils/checkout";
import { HivePBase } from "@pages/hive/hivePBase";

const getTokenShopTemplate = async (token: FixtureToken, configShopTemplate) => {
  const response = {};
  const mapDomainToken = {};
  for (const [key, value] of Object.entries(configShopTemplate)) {
    if (mapDomainToken[value["domain"]]) {
      response[key] = mapDomainToken[value["domain"]];
      continue;
    }
    const shopToken = await token.getWithCredentials({
      domain: value["domain"],
      username: value["username"],
      password: value["password"],
    });
    response[key] = { token: shopToken.access_token, domain: value["domain"] };
    mapDomainToken[value["domain"]] = { token: shopToken.access_token, domain: value["domain"] };
  }
  return response;
};

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
  let hivePbase: HivePBase;
  let tokenShopTemplate;

  const config = loadData(__dirname, "DATA_DRIVEN_CHECKOUT_HOSTED");
  const numRetries = config.suiteConf.number_retry;
  const accDashboardPayment = config.suiteConf.acc_dashboard_payment;
  config.caseConf.data.forEach(caseData => {
    test(`@${caseData.case_id} ${caseData.case_name}`, async ({ conf, page, authRequest, dashboard, token }) => {
      domain = conf.suiteConf.domain;
      dashboardAPI = new DashboardAPI(domain, authRequest);
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      checkoutPage = new SFCheckout(page, domain);
      orderPage = new OrdersPage(dashboard, domain);
      homePage = new SFHome(page, domain);
      orderAPI = new OrderAPI(domain, authRequest);
      hivePbase = new HivePBase(page, conf.suiteConf.hive_info.domain);
      customerInfo = {
        emailBuyer: caseData.email,
        shippingAddress: caseData.shipping_address,
      };
      productsCheckout = caseData.products;

      tokenShopTemplate = await getTokenShopTemplate(token, conf.suiteConf.shop_template);
      let checkoutInfoBefore: CheckoutInfo;
      let orderName: string;
      let orderId = 0;

      await test.step("Reset data to before data change", async () => {
        const dataResetSetting: DataSetting = caseData.data_reset_setting;
        await dashboardAPI.changeDataSetting(dataResetSetting, tokenShopTemplate);
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
        await checkoutPage.selectPaymentMethod(caseData.payment_method);
        await checkoutPage.clickBtnCompleteOrder();

        // verify click complete order success
        expect(await checkoutPage.isRedirectToSandboxPayment(caseData.payment_method)).toBe(true);

        // save data before click complete order
        checkoutInfoBefore = await checkoutAPI.getCheckoutInfoWithGlobalMarket(numRetries);
      });

      await test.step(`Khi đang đợi confirm payment tại sandbox ${caseData.payment_method},tại Dashboard thay đổi thông tin`, async () => {
        const dataSetting: DataSetting = caseData.data_setting;
        await dashboardAPI.changeDataSetting(dataSetting, tokenShopTemplate);
      });
      await test.step(` Tại sandbox ${caseData.payment_method}: Confirm payment`, async () => {
        await checkoutPage.completeRedirectPage(caseData.payment_method, caseData.login_redirect_page, true);
        const checkoutInfoAfter = await checkoutAPI.getCheckoutInfoWithGlobalMarket(numRetries);
        orderName = await checkoutPage.getOrderName();
        // global market
        expect(checkoutInfoBefore.info.extra_data?.global_market).toStrictEqual(
          checkoutInfoAfter.info.extra_data?.global_market,
        );

        // summary order
        expect(isEqual(checkoutInfoAfter.totals.subtotal_price, checkoutInfoBefore.totals.subtotal_price, 0.01)).toBe(
          true,
        );
        expect(isEqual(checkoutInfoAfter.totals.total_price, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
        expect(isEqual(checkoutInfoAfter.totals.total_shipping, checkoutInfoBefore.totals.total_shipping, 0.01)).toBe(
          true,
        );
        expect(isEqual(checkoutInfoAfter.totals.total_discounts, checkoutInfoBefore.totals.total_discounts, 0.01)).toBe(
          true,
        );
      });

      await test.step(`Kiểm tra order tại Order list`, async () => {
        expect(!!orderName && orderName.length > 0).toBe(true);
        await orderPage.gotoOrderPage(conf.suiteConf.platform);
        await orderPage.searchOrder(orderName);
        const expectTotalAmt = await orderPage.getTotalOrderInOrderList(orderName);
        expect(isEqual(checkoutInfoBefore.totals.total_price, Number(expectTotalAmt), 0.01)).toBe(true);
      });

      await test.step(`Kiểm tra order details`, async () => {
        await orderPage.clickOrderByName(orderName);
        //cause sometimes order captures slower than usual
        orderId = orderPage.getOrderIdInOrderDetail();

        await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_info.username, conf.suiteConf.hive_info.password);
        await hivePbase.goToOrderDetail(orderId);
        await hivePbase.approveOrderUntilSuccess();

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

      await test.step("Tại Dashboard Stripe: Tìm kiếm order bằng transaction ID", async () => {
        const listTransactionID = await orderAPI.getListTransactionId(orderId);
        if (listTransactionID && listTransactionID.length) {
          const totalOrderDBStripe = await orderAPI.getTotalOrderInfoInDashboardPayment(
            accDashboardPayment,
            listTransactionID,
            checkoutInfoBefore.info?.extra_data?.global_market?.rate,
            caseData.payment_method,
          );
          expect(isEqual(totalOrderDBStripe.total, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
          expect(totalOrderDBStripe.payment_method.toLowerCase()).toEqual(caseData.payment_method.toLowerCase());
        }
      });
      await test.step("Reset data to after data change", async () => {
        const dataSetting: DataSetting = caseData.data_reset_setting;
        await dashboardAPI.changeDataSetting(dataSetting, tokenShopTemplate);
      });
    });
  });
});
