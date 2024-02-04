import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import type { OrderAfterCheckoutInfo } from "@types";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { isEqual } from "@utils/checkout";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import type { DataAnalytics } from "@types";

let plbTemplateShopDomain, shopId: string;
let shopDomain: string;
let plbDashboardPage, plbTemplateDashboardPage: DashboardPage;
let ordersPage: OrdersPage;
let dashboardAPI: DashboardAPI;
let plbOrderApi: PlusbaseOrderAPI;
let analyticsPage: AnalyticsPage;
let initData: DataAnalytics;
let dataAnalytics: DataAnalytics;
let infoOrder: OrderAfterCheckoutInfo;
let plbToken: string;
let totalProfit: number;
let timeOut: number;
let today: string;

test.beforeAll(async ({ conf, browser, authRequest }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  shopId = conf.suiteConf.shop_id;
  shopDomain = conf.suiteConf.domain;
  initData = conf.suiteConf.data_analytics;
  timeOut = conf.suiteConf.time_out_api_calling;
  plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
  ordersPage = new OrdersPage(page, shopDomain);
  dashboardAPI = new DashboardAPI(shopDomain, authRequest);
  plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
  plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);

  plbToken = await plbTemplateDashboardPage.getAccessToken({
    shopId: conf.suiteConf.plb_template["shop_id"],
    userId: conf.suiteConf.plb_template["user_id"],
    baseURL: conf.suiteConf["api"],
    username: conf.suiteConf.plb_template["username"],
    password: conf.suiteConf.plb_template["password"],
  });
});

test.beforeEach(async ({ page, conf, authRequest }) => {
  test.setTimeout(conf.suiteConf.time_out);
  analyticsPage = new AnalyticsPage(page, shopDomain);
  today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
  dataAnalytics = await analyticsPage.getDataAnalyticsAPIDashboard(
    authRequest,
    shopId,
    today,
    initData,
    "total_profit",
  );
  totalProfit = dataAnalytics.summary.total_profit;

  await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: conf.caseConf.tax_include });
  const checkout = new SFCheckout(page, conf.suiteConf.domain);
  infoOrder = await checkout.createStripeOrderMultiProduct(
    conf.suiteConf.customer_info,
    conf.caseConf.discount,
    conf.caseConf.products,
    conf.suiteConf.card_info,
  );
  await checkout.addProductPostPurchase(null);
});

test.describe(`Verify total profits ở page Analytics sau khi refund order @TS_SB_PLB_ROPLB_49`, () => {
  test(`Verify total profits ở page Analytics sau khi refund order @TC_SB_PLB_ROPLB_49`, async ({
    page,
    conf,
    authRequest,
    multipleStore,
  }) => {
    let profitOrder, profitRefund, profitExpect;

    await test.step(`Vào dashboard shop template PlusBase > vào order detail > Approve order`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      const totalOrderActual = Number(removeCurrencySymbol(await ordersPage.getTotalOrder()));
      expect(totalOrderActual).toEqual(infoOrder.totalSF);
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await ordersPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await ordersPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);

      profitOrder = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      const dataAnalyticsAfter = await analyticsPage.validateDataChanges(
        dataAnalytics,
        initData,
        authRequest,
        shopId,
        today,
        timeOut,
        "total_profit",
        true,
      );
      const totalProfitAfter = dataAnalyticsAfter.summary.total_profit;
      expect(isEqual(totalProfitAfter, totalProfit + profitOrder, 0.01)).toEqual(true);
      totalProfit = totalProfitAfter;
      dataAnalytics = dataAnalyticsAfter;
    });

    await test.step(`Click button "Refund order" > chọn "Cancel/refund combo line items" >
      nhập thông tin refund partially > click "Refund"`, async () => {
      await ordersPage.clickElementWithLabel("button", "Refund order");
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_COMBO);

      // thực hiện nhập quantity & amount refund -> tính profit sau refund
      const { profitAfterRefund } = await ordersPage.inputRefundItems(conf.caseConf.refunds, plbOrderApi, infoOrder);
      profitExpect = profitAfterRefund;
      await ordersPage.clickElementWithLabel("span", "Refund");
      await page.waitForLoadState("load");
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
    });

    await test.step(`Vào shop PlusBase > Verify order detail sau khi refund`, async () => {
      const plbPage = await multipleStore.getDashboardPage(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plbDashboardPage = new DashboardPage(plbPage, conf.suiteConf.domain);
      ordersPage = new OrdersPage(plbDashboardPage.page, conf.suiteConf.domain);
      await ordersPage.goToOrderByOrderId(infoOrder.orderId);

      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual - profitExpect >= -0.01 && profitActual - profitExpect <= 0.01).toEqual(true);
      profitRefund = profitOrder - profitExpect;
    });

    await test.step(`Verify analytic sau khi refund`, async () => {
      await expect(async () => {
        const dataAnalyticsAfterRefund = await analyticsPage.validateDataChanges(
          dataAnalytics,
          initData,
          authRequest,
          shopId,
          today,
          timeOut,
          "total_profit",
          true,
        );
        const totalProfitAfterRefund = dataAnalyticsAfterRefund.summary.total_profit;
        expect(isEqual(totalProfitAfterRefund, totalProfit - profitRefund, 0.01)).toEqual(true);
      }).toPass({
        intervals: [60_000],
        timeout: 181_000,
      });
    });
  });
});
