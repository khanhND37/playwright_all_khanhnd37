/* eslint-disable playwright/no-wait-for-timeout */
import { expect, test } from "@core/fixtures";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { CommissionPb } from "@pages/dashboard/commission-pb";
import type { AffiliateCommission, DataRefPrintBaseOrPlusBase, DataSummary } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { PartnerDashboardAPI } from "@pages/api/partner_dashboard_api";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("Verify commission printbase affiliate", async () => {
  let catalogPage: DropshipCatalogPage;
  let summaryDataBefore: DataSummary;
  let dataRefBefore: DataRefPrintBaseOrPlusBase;
  let dashboardPage: DashboardPage;
  let orderPage: OrdersPage;
  let commissionApi: PartnerDashboardAPI;
  let data: AffiliateCommission;
  let commissionPb: CommissionPb;
  const env = process.env.ENV;

  test.beforeEach(async ({ dashboard, conf, authUserAffiliateRequest }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    let startDate: number;
    let endDate: number;
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    if (currentDay >= 1 && currentDay <= 15) {
      // Thời gian 00:00:00 ngày 01 tháng này
      startDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0) / 1000;
      // Thời gian 23:59:59 ngày 15 tháng này
      endDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 15, 23, 59, 59) / 1000;
    } else {
      // Ngày cuối cùng của tháng
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      // Thời gian 00:00:00 ngày 16 tháng này
      startDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 16, 0, 0, 0) / 1000;
      // Thời gian 23:59:59 ngày cuối cùng tháng này
      endDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), lastDayOfMonth, 23, 59, 59) / 1000;
    }
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
    dashboardPage = new DashboardPage(dashboard, conf.caseConf.domain);
    commissionApi = new PartnerDashboardAPI(conf.suiteConf.api, authUserAffiliateRequest);
    summaryDataBefore = await commissionApi.getSummaryCommissionByApi(data);
    dataRefBefore = await commissionApi.getCommissionDetailPrintBaseByApi(data);
  });

  test(`[Printbase] Verify luồng tính commision @SB_PN_PNAF_31`, async ({ conf, context }) => {
    test.slow();
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm đã chuẩn bị ở pre-condition`, async () => {
      const page = await context.newPage();
      commissionPb = new CommissionPb(page, conf.caseConf.domain);
      const cardInfo = conf.suiteConf.card_info;
      const customerInfo = conf.suiteConf.customer_info;
      for (const product of conf.suiteConf.product_info) {
        //Add product to cart
        await page.goto(`https://${conf.caseConf.domain}/products/${product.handle}`);
        await page.waitForTimeout(2 * 1000);
        for (const op of product.option) {
          await page.locator(commissionPb.xpathCP.productPage.variantOption(op)).click();
        }
        await page.locator(commissionPb.xpathCP.productPage.quantity).fill(product.quantity);
        await page.waitForTimeout(2 * 1000);
        await page.locator(commissionPb.xpathCP.productPage.buynowBtn).click();
        await page.waitForTimeout(5 * 1000);
        await expect(page.locator(commissionPb.xpathCP.checkoutPage.shippingInfo)).toBeVisible();
        await expect(page.locator(commissionPb.xpathCP.checkoutPage.productImage)).toBeVisible();

        //checkout product
        await commissionPb.checkout(customerInfo, cardInfo);
        try {
          await expect(page.locator(commissionPb.xpathCP.thankyouPage.confirmOrder)).toBeVisible({ timeout: 15000 });
        } catch (error) {
          page.reload();
          await expect(page.locator(commissionPb.xpathCP.checkoutPage.shippingInfo)).toBeVisible();
          await expect(page.locator(commissionPb.xpathCP.checkoutPage.productImage)).toBeVisible();
          await commissionPb.checkout(customerInfo, cardInfo);

          await expect(page.locator(commissionPb.xpathCP.thankyouPage.confirmOrder)).toBeVisible();
        }

        const infoOrder = await commissionPb.getOrderInfoAfterCheckout();

        //Check order information in dashboard
        await dashboardPage.navigateToMenu("Orders");
        catalogPage = new DropshipCatalogPage(dashboardPage.page, conf.caseConf.domain);
        orderPage = new OrdersPage(dashboardPage.page, conf.caseConf.domain);
        await orderPage.gotoOrderDetail(infoOrder.orderName);
        await catalogPage.waitUntilElementInvisible(orderPage.xpathDetailLoading);
        await orderPage.waitForProfitCalculated();
        expect(await orderPage.getFulfillmentStatusOrder()).toBe("Unfulfilled");
      }
    });

    await test.step(`Kiểm tra số liệu commisson của promoter A thông qua api`, async () => {
      const summaryDataAfter = await commissionApi.getSummaryCommissionByApi(data);
      const dataRefAfter = await commissionApi.getCommissionDetailPrintBaseByApi(data);
      expect(summaryDataAfter).toEqual(
        expect.objectContaining({
          totalQualifiedItems: summaryDataBefore.totalQualifiedItems + 10,
          totalHoldItem: summaryDataBefore.totalHoldItem,
        }),
      );
      expect(dataRefAfter).toEqual(
        expect.objectContaining({
          qualifiedItemsGB: dataRefBefore.qualifiedItemsGB + 5,
          holdItemsGB: dataRefBefore.holdItemsGB,
          cashbackGB: 0,
          qualifiedItemsSB: dataRefBefore.qualifiedItemsSB + 5,
          holdItemsSB: dataRefBefore.holdItemsSB,
          cashbackSB: 0,
          totalCashback: 0,
        }),
      );
    });
  });
});
