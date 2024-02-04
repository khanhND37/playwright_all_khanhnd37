import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import type { OrderAfterCheckoutInfo } from "@types";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@utils/checkout";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import type { DataAnalytics } from "@types";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";

let plbTemplateShopDomain, shopDomain, plbToken, shopId: string;
let plbTemplateDashboardPage: DashboardPage;
let ordersPage: OrdersPage;
let dashboardAPI: DashboardAPI;
let analyticsPage: AnalyticsPage;
let dataAnalytics: DataAnalytics;
let initData: DataAnalytics;
let infoOrder: OrderAfterCheckoutInfo;
let profitOrder, totalProfit, totalGrossProfit: number;
let today: string;
let timeOut: number;
let taxDesciption: boolean;
let plusbaseOrderAPI: PlusbaseOrderAPI;

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
  plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);

  plbToken = await plbTemplateDashboardPage.getAccessToken({
    shopId: conf.suiteConf.plb_template["shop_id"],
    userId: conf.suiteConf.plb_template["user_id"],
    baseURL: conf.suiteConf["api"],
    username: conf.suiteConf.plb_template["username"],
    password: conf.suiteConf.plb_template["password"],
  });

  plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, authRequest);
});

test.beforeEach(async ({ page, conf, authRequest, dashboard }) => {
  test.setTimeout(conf.suiteConf.time_out);

  analyticsPage = new AnalyticsPage(dashboard, shopDomain);
  // go to analytics store merchant
  await analyticsPage.gotoAnalytics();
  today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
  dataAnalytics = await analyticsPage.getDataAnalyticsAPIDashboard(
    authRequest,
    shopId,
    today,
    initData,
    "total_profit",
  );
  totalProfit = dataAnalytics.summary.total_profit;

  const dataSalesReports = await analyticsPage.getDataSalesReportsPlb(authRequest, shopId, today);
  totalGrossProfit = dataSalesReports.product.total_profit;

  taxDesciption = conf.caseConf.tax_include;
  await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: taxDesciption });
  const checkout = new SFCheckout(page, conf.suiteConf.domain);
  infoOrder = await checkout.createStripeOrderMultiProduct(
    conf.suiteConf.customer_info,
    conf.caseConf.discount,
    conf.caseConf.products,
    conf.suiteConf.card_info,
  );
  await checkout.addProductPostPurchase(null);
});

test.describe(`Verify Analytics shop PlusBase checkout POD và Dropship @TS_SB_PLB_PODPL_POPLA`, () => {
  test(`@TC_SB_PLB_PODPL_POPLA_1 Verify Total Profits ở page Analytics sau khi cancel all order có cả line POD và Dropship, có discount free ship, tax exclude`, async ({
    authRequest,
  }) => {
    await test.step(`Vào dashboard shop template PlusBase > vào order detail > verify profit of order`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.clickShowCalculation();

      const discountValue = Number(removeCurrencySymbol((await ordersPage.getDiscountVal()).replace("-", "")));
      const baseCost = Number(removeCurrencySymbol(await ordersPage.getBaseCost(plusbaseOrderAPI)));
      const shippingCost = Number(removeCurrencySymbol(await ordersPage.getShippingCost()));
      const shippingFee = Number(removeCurrencySymbol(await ordersPage.getShippingFee()));
      const tip = Number(removeCurrencySymbol(await ordersPage.getTip()));
      let taxInclude = 0;
      if (taxDesciption) {
        taxInclude = Number(removeCurrencySymbol(await ordersPage.getTax()));
      }
      ordersPage.calculateProfitPlusbase(
        infoOrder.totalSF,
        infoOrder.subTotal,
        discountValue,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        tip,
      );
      const profitExpect = ordersPage.profit;
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(isEqual(profitExpect, profitActual, 0.01)).toEqual(true);
      profitOrder = profitActual;
    });

    await test.step(`Trong Analytics shop PlusBase > verify Total profits`, async () => {
      //reload analytics after checkout
      await analyticsPage.page.reload();
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

    await test.step(`Click button "More actions" > chọn "Approve order" > chọn "Cancel order" > chọn "Cancel/refund combo line items" > click "Cancel"`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await ordersPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_COMBO);
      await ordersPage.clickButton("Cancel");
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
      await expect(async () => {
        await ordersPage.page.reload({ waitUntil: "networkidle" });
        const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
        expect(isEqual(profitActual, 0, 0.01)).toEqual(true);
      }).toPass({ timeout: 30_000 });
    });

    await test.step(`Trong Analytics shop PlusBase > verify Total profits sau khi cancel`, async () => {
      //reload analytics after cancel
      await analyticsPage.page.reload();
      await expect(async () => {
        const dataAnalyticsAfterCancel = await analyticsPage.validateDataChanges(
          dataAnalytics,
          initData,
          authRequest,
          shopId,
          today,
          timeOut,
          "total_profit",
          true,
        );
        const totalProfitAfterRefund = dataAnalyticsAfterCancel.summary.total_profit;
        expect(isEqual(totalProfitAfterRefund, totalProfit - profitOrder, 0.01)).toEqual(true);
      }).toPass();
    });
  });

  test(`@TC_SB_PLB_PODPL_POPLA_3 Verify Gross profit ở page Sale reports sau khi cancel all order có cả line POD và Dropship, có discount Fixed amount, tax include`, async ({
    authRequest,
  }) => {
    await test.step(`Vào dashboard shop template PlusBase > vào order detail > verify profit of order`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.clickShowCalculation();

      const discountValue = Number(removeCurrencySymbol((await ordersPage.getDiscountVal()).replace("-", "")));
      const baseCost = Number(removeCurrencySymbol(await ordersPage.getBaseCost(plusbaseOrderAPI)));
      const shippingCost = Number(removeCurrencySymbol(await ordersPage.getShippingCost()));
      const shippingFee = Number(removeCurrencySymbol(await ordersPage.getShippingFee()));
      const tip = Number(removeCurrencySymbol(await ordersPage.getTip()));
      let taxInclude = 0;
      if (taxDesciption) {
        taxInclude = Number(removeCurrencySymbol(await ordersPage.getTax()));
      }
      ordersPage.calculateProfitPlusbase(
        infoOrder.totalSF,
        infoOrder.subTotal,
        discountValue,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        tip,
      );
      const profitExpect = ordersPage.profit;
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(isEqual(profitExpect, profitActual, 0.01)).toEqual(true);
      profitOrder = profitActual;
    });

    await test.step(`Trong Analytics shop PlusBase > verify Gross profit`, async () => {
      let totalGrossProfitAfter;
      await expect(async () => {
        const dataSalesReportsAfter = await analyticsPage.getDataSalesReportsPlb(authRequest, shopId, today);
        totalGrossProfitAfter = dataSalesReportsAfter.product.total_profit;
        expect(isEqual(totalGrossProfitAfter, totalGrossProfit + profitOrder, 0.01)).toEqual(true);
      }).toPass();
      totalGrossProfit = totalGrossProfitAfter;
    });

    await test.step(`Click button "More actions" > chọn "Approve order" > chọn "Cancel order" > chọn "Cancel/Refund unit line items" > click "Cancel"`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await ordersPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_UNIT);
      await ordersPage.clickButton("Cancel");
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
      await expect(async () => {
        await ordersPage.page.reload({ waitUntil: "networkidle" });
        const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
        expect(isEqual(profitActual, 0, 0.01)).toEqual(true);
      }).toPass({ timeout: 30_000 });
    });

    await test.step(`Verify Gross profit sau khi Cancel`, async () => {
      await expect(async () => {
        {
          const dataSalesReportsAfterCancel = await analyticsPage.getDataSalesReportsPlb(authRequest, shopId, today);
          expect(
            isEqual(dataSalesReportsAfterCancel.product.total_profit, totalGrossProfit - profitOrder, 0.01),
          ).toEqual(true);
        }
      }).toPass();
    });
  });
});
