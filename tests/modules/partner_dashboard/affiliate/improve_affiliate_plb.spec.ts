import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import type { AffiliateCommission, DataSummary, OrderAfterCheckoutInfo } from "@types";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { PartnerDashboardAPI } from "@pages/api/partner_dashboard_api";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("Verify commission plusbase affiliate", async () => {
  let summaryDataBefore: DataSummary;
  let partnerDashboardAPI: PartnerDashboardAPI;
  let data: AffiliateCommission;
  let infoOrder: OrderAfterCheckoutInfo;

  test.beforeEach(async ({ conf, authUserAffiliateRequest }) => {
    // filter today
    const date = new Date();
    const startDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0) / 1000;
    const endDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59) / 1000;
    data = {
      userId: conf.suiteConf.data_api.user_id,
      page: conf.suiteConf.data_api.page,
      limit: conf.suiteConf.data_api.limit,
      email: conf.suiteConf.data_api.email,
      isSearch: conf.suiteConf.data_api.is_search,
      platform: conf.suiteConf.data_api.platform,
      startDate: startDate,
      endDate: endDate,
      refId: conf.suiteConf.data_api.ref_id,
    };

    partnerDashboardAPI = new PartnerDashboardAPI(conf.suiteConf.api, authUserAffiliateRequest);
    summaryDataBefore = await partnerDashboardAPI.getSummaryCommissionByApi(data);
  });

  test(`@SB_PN_PNAF_86 [Plusbase] Verify số lượng Qualified items trong group Star base`, async ({
    page,
    conf,
    dashboard,
    multipleStore,
  }) => {
    test.setTimeout(conf.suiteConf.time_out);
    const orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.plb_template.domain);

    await test.step(`Mở Storefront của shop thuộc user referee > checkout`, async () => {
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      infoOrder = await checkout.createStripeOrderMultiProduct(
        conf.suiteConf.customer_info,
        "",
        conf.caseConf.product_info,
        conf.suiteConf.card_info,
      );
      await orderPage.goToOrderByOrderId(infoOrder.orderId);
      await orderPage.waitForProfitCalculated();
      expect(await orderPage.getFulfillmentStatusOrder()).toBe("Unfulfilled");
    });

    await test.step(`Sign in user promoter > Vào partner dashboard > Kiểm tra số liệu commisson của promoter`, async () => {
      await expect(async () => {
        const dataAfter = await partnerDashboardAPI.getSummaryCommissionByApi(data);
        expect(dataAfter.totalQualifiedItems).toEqual(summaryDataBefore.totalQualifiedItems + conf.caseConf.quantity);
      }).toPass();
    });

    await test.step(`Vào dashboard shop template > Vào order detail > cancel order`, async () => {
      const ordersPage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.plb_template.domain);
      await ordersPage.goToOrderStoreTemplateByOrderId(infoOrder.orderId);
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.inputQuantityRefund(1, conf.caseConf.quantities_cancel);
      await ordersPage.clickButton("Cancel");

      //Wait order cancel successfully
      await orderPage.page.waitForTimeout(10000);
      await expect(async () => {
        expect(await ordersPage.isTextVisible(`Removed item`)).toBeTruthy();
      }).toPass();
    });

    await test.step(`Kiểm tra số liệu commisson của promoter sau khi thực hiện cancel 1 phần order`, async () => {
      await expect(async () => {
        const dataAfter = await partnerDashboardAPI.getSummaryCommissionByApi(data);
        expect(dataAfter.totalQualifiedItems).toEqual(
          summaryDataBefore.totalQualifiedItems + conf.caseConf.quantity - Number(conf.caseConf.quantities_cancel),
        );
      }).toPass();
    });
  });
});
