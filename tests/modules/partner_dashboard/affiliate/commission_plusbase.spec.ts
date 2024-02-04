import { expect, test } from "@core/fixtures";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { SBPage } from "@pages/page";
import { SFCheckout } from "@pages/storefront/checkout";
import { Page } from "@playwright/test";
import type { AffiliateCommission, DataRefPrintBaseOrPlusBase, DataSummary } from "@types";
import { ProductAPI } from "@pages/api/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { PartnerDashboardAPI } from "@pages/api/partner_dashboard_api";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("Verify commission plusbase affiliate", async () => {
  let catalogPage: DropshipCatalogPage;
  let sbPage: SBPage;
  let SODetailPage: Page;
  let accessToken: string;
  let summaryDataBefore: DataSummary;
  let dataRefBefore: DataRefPrintBaseOrPlusBase;
  let productIds: Array<string>;
  let dashboardPage: DashboardPage;
  let orderPage: OrdersPage;
  let commissionApi: PartnerDashboardAPI;
  let data: AffiliateCommission;
  test.beforeEach(async ({ dashboard, conf, context, token, authUserAffiliateRequest, authRequest }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.caseConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    // xóa tất cả product của shop trước khi bắt đầu test
    const productAPI = new ProductAPI(conf.caseConf.domain, authRequest);
    await productAPI.deleteAllProduct(conf.caseConf.domain, accessToken);

    // convert thời gian cycle hiện tại từ 00:00:00 UTC ngày 1 của tháng hiện tại  23:59:59 UTC ngày cuối cùng của tháng
    const date = new Date();
    const firstDay = Date.UTC(date.getFullYear(), date.getMonth(), 1, 0, 0, 0) / 1000;
    const lastDay = Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59) / 1000;
    data = {
      userId: conf.suiteConf.data_api.user_id,
      page: conf.suiteConf.data_api.page,
      limit: conf.suiteConf.data_api.limit,
      email: conf.suiteConf.data_api.email,
      isSearch: conf.suiteConf.data_api.is_search,
      platform: conf.suiteConf.data_api.platform,
      startDate: firstDay,
      endDate: lastDay,
      refId: conf.suiteConf.data_api.ref_id,
    };

    catalogPage = new DropshipCatalogPage(dashboard, conf.caseConf.domain);
    sbPage = new SBPage(dashboard, conf.caseConf.domain);
    commissionApi = new PartnerDashboardAPI(conf.suiteConf.api, authUserAffiliateRequest);
    summaryDataBefore = await commissionApi.getSummaryCommissionByApi(data);
    dataRefBefore = await commissionApi.getCommissionDetailPlusBaseByApi(data);

    productIds = [];
    // import product plusbase
    for (let i = 0; i < conf.caseConf.products_import.length; i++) {
      const products = conf.caseConf.products_import[i];
      catalogPage.goToCatalogPage(conf.caseConf.domain);
      await catalogPage.searchProductcatalog(products.old_title);
      SODetailPage = await sbPage.clickElementAndNavigateNewTab(
        context,
        await catalogPage.productSearchResult(products.old_title),
      );
      await SODetailPage.waitForSelector("//div[contains(@class,'sb-title-ellipsis')]");
      catalogPage = new DropshipCatalogPage(SODetailPage, conf.caseConf.domain);
      await catalogPage.clickBtnImportToStore();
      await catalogPage.editProductTitleInImportList(products.old_title, products.new_title);
      await catalogPage.clickTabPricing(products.old_title);
      await catalogPage.editSellingPriceInImportList(products.old_title, products.selling_price);
      await catalogPage.clickBtnEditProduct(products.old_title);
      const productDetail = await sbPage.clickElementAndNavigateNewTab(context, await catalogPage.editProductLocator());
      const productPage = new ProductPage(productDetail, conf.caseConf.domain);
      const productTitle = await productPage.getProductName();
      expect(productTitle).toEqual(products.new_title);
      const productId = await productPage.getProductIDByURL();
      productIds.push(productId);
      await productPage.selectProductOnlineStore();
      await productPage.page.close();
      orderPage = new OrdersPage(SODetailPage, conf.caseConf.domain);
      dashboardPage = new DashboardPage(SODetailPage, conf.caseConf.domain);
    }
  });

  test(`[Plusbase] Verify luồng tính commision @SB_PN_PNAF_64`, async ({ page, conf }) => {
    test.slow();
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm đã chuẩn bị ở pre-condition`, async () => {
      await page.goto(`https://${conf.caseConf.domain}`);
      const checkout = new SFCheckout(page, conf.caseConf.domain);
      const infoOrder = await checkout.createStripeOrderMultiProduct(
        conf.suiteConf.customer_info,
        "",
        conf.suiteConf.product_info,
        conf.suiteConf.card_info,
      );
      await dashboardPage.navigateToMenu("Orders");
      await orderPage.gotoOrderDetail(infoOrder.orderName);
      await catalogPage.waitUntilElementInvisible(orderPage.xpathDetailLoading);
      await orderPage.waitForProfitCalculated();
      expect(await orderPage.getFulfillmentStatusOrder()).toBe("Unfulfilled");
    });

    await test.step(`Kiểm tra số liệu commisson của promoter A thông qua api`, async () => {
      const summaryDataAfter = await commissionApi.getSummaryCommissionByApi(data);
      const dataRefAfter = await commissionApi.getCommissionDetailPlusBaseByApi(data);
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
