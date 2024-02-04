import { expect } from "@core/fixtures";
import { AppsAPI } from "@pages/api/apps";
import { SFCheckout } from "@pages/storefront/checkout";
import type { DataAnalytics, Order, OrderAfterCheckoutInfo, OrderSummary, PlbProductVariant } from "@types";
import { isEqual } from "@core/utils/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { test } from "@fixtures/odoo";
import { request } from "@playwright/test";
import { loadData } from "@core/conf/conf";
import { OdooService } from "@services/odoo";
import { calculateDiscount, calculateProfit, calculateTax } from "@core/utils/order";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { SFHome } from "@sf_pages/homepage";

test.describe("Analytics auto upsell PLB", () => {
  let analyticsPage: AnalyticsPage;
  let dataAnalyticsBefore: DataAnalytics;
  let dataAnalyticsAfter: DataAnalytics;
  let today: string;
  let shopDomain: string;
  let initData: DataAnalytics;
  let timeOut: number;
  let shopId: string;
  let sfCheckoutPage: SFCheckout;
  let orderAfterCheckoutInfo: OrderAfterCheckoutInfo;
  let orderSummary: OrderSummary;
  let orderInfo: Order;
  let profitItemUpsell: number;
  let shippingCostItemUpsell: number;
  let plusbaseOrderAPI: PlusbaseOrderAPI;
  let homePage: SFHome;

  test.beforeAll(async ({ conf, browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const dashboardTplPage = new DashboardPage(page, conf.suiteConf.plb_template_upsell.domain);
    const tplToken = await dashboardTplPage.getAccessToken({
      shopId: conf.suiteConf.plb_template_upsell.shop_id,
      userId: conf.suiteConf.plb_template_upsell.user_id,
      baseURL: conf.suiteConf.api,
      username: conf.suiteConf.plb_template_upsell.username,
      password: conf.suiteConf.plb_template_upsell.password,
    });

    // Deactive all offer > Active offers use run automation on shop template setting auto upsell
    const context = await request.newContext();
    const appsAPI = new AppsAPI(conf.suiteConf.plb_template_upsell.domain, context);
    const offerList = await appsAPI.getListOfferAutoUpSell(tplToken);
    const offerListId = offerList.map(offer => offer.id);
    await appsAPI.actionForOfferAutoUpSell(offerListId, "activated", "false", tplToken);
    await appsAPI.actionForOfferAutoUpSell(conf.suiteConf.offer_id, "activated", "true", tplToken);

    shopDomain = conf.suiteConf.domain;
    initData = conf.suiteConf.data_analytics;
    timeOut = conf.suiteConf.time_out_api_calling;
    shopId = conf.suiteConf.shop_id;
  });

  const caseName = "SB_AUP_ANALYTICS";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      description: description,
      product_target: productTarget,
      products_recommended: productRecommend,
      discount: discount,
      offer_discount: offerDiscount,
      tax_infor: taxInfor,
      offer_discount_shipping: offerDiscountShipping,
    }) => {
      test(`@${caseId} ${description}`, async ({ page, conf, authRequest, odoo }) => {
        test.setTimeout(conf.suiteConf.time_out_tc);
        const shippingAddress = conf.suiteConf.shipping_address;
        let plbVariantInfo: PlbProductVariant;

        await test.step("Prepare data: Get shipping cost, product cost, price of item auto upsell; data analytics before checkout", async () => {
          const odooService = OdooService(odoo);

          // Update shipping type then get ship cost item auto upsell
          const shipInforProductUpsell = await odooService.updateThenGetShippingDatas(
            conf.suiteConf.product_upsell_id,
            conf.suiteConf.shipping_type,
            shippingAddress.country_code,
          );
          shippingCostItemUpsell = shipInforProductUpsell.get(conf.suiteConf.shipping_method).first_item_fee;
          // Get plusbase variant information
          plbVariantInfo = await odooService.getVariantInforById(conf.suiteConf.variant_id);

          // Get data analytics before checkout
          analyticsPage = new AnalyticsPage(page, shopDomain, authRequest);
          today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
          dataAnalyticsBefore = await analyticsPage.getDataAnalyticsAPIDashboard(
            authRequest,
            shopId,
            today,
            initData,
            "total_profit",
          );
        });

        await test.step("Mở storefront > Add product vào cart > Thực hiện checkout", async () => {
          homePage = new SFHome(page, shopDomain);
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
          sfCheckoutPage = new SFCheckout(page, shopDomain);
          orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
            productTarget.name,
            productTarget.quantity,
            shippingAddress,
            discount.code,
          );
          expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
        });

        await test.step("Add product post purchase to cart", async () => {
          await sfCheckoutPage.addProductPostPurchase(productRecommend);
          await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
          expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
          orderSummary = await sfCheckoutPage.getOrderSummaryInfo();
        });

        await test.step("Vào dashboard > Order > Verify order profit", async () => {
          const dashboardPage = new DashboardPage(page, shopDomain);
          const adminToken = await dashboardPage.getAccessToken({
            shopId: conf.suiteConf.shop_id,
            userId: conf.suiteConf.user_id,
            baseURL: conf.suiteConf.api,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          });
          await dashboardPage.loginWithToken(adminToken);
          await dashboardPage.navigateToMenu("Orders");
          const ordersPage = new OrdersPage(page, shopDomain);
          await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);
          await ordersPage.waitForProfitCalculated();
          plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, authRequest);
          orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

          // Verify order profit
          let taxInclude = 0;
          if (orderInfo.is_tax_include) {
            taxInclude = orderInfo.tax_amount;
          }
          ordersPage.calculateProfitPlusbase(
            orderSummary.totalPrice,
            orderSummary.subTotal,
            Math.abs(orderInfo.discount),
            orderInfo.base_cost,
            orderInfo.shipping_cost,
            orderInfo.shipping_fee,
            taxInclude,
            orderSummary.tippingVal,
          );

          expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
          expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
          expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
        });

        await test.step("Vào Analytics > Verify total profit", async () => {
          // Calculate profit line item auto upsell
          let shippingFeeItemUpsell = 0;
          let discountItemUpsell = 0;
          let discountShipItemUpsell = 0;

          if (offerDiscountShipping) {
            discountShipItemUpsell = calculateDiscount(offerDiscountShipping, shippingCostItemUpsell);
          }

          if (discount.type !== "freeship") {
            shippingFeeItemUpsell = shippingCostItemUpsell - discountShipItemUpsell;
          }

          if (offerDiscount) {
            discountItemUpsell = calculateDiscount(offerDiscount, plbVariantInfo.x_plusbase_selling_price);
          }

          const taxItemUpsell = calculateTax(taxInfor, plbVariantInfo.x_plusbase_selling_price - discountItemUpsell);

          profitItemUpsell = calculateProfit(
            plbVariantInfo.x_plusbase_selling_price +
              taxItemUpsell.tax_exclude +
              shippingFeeItemUpsell -
              discountItemUpsell,
            plbVariantInfo.x_plusbase_selling_price,
            discountItemUpsell,
            plbVariantInfo.x_plusbase_base_cost,
            shippingCostItemUpsell,
            shippingFeeItemUpsell,
            taxItemUpsell.tax_include,
          ).profit;

          // Get data analytics afer checkout
          dataAnalyticsAfter = await analyticsPage.validateDataChanges(
            dataAnalyticsBefore,
            initData,
            authRequest,
            shopId,
            today,
            timeOut,
            "total_profit",
            true,
          );

          // Chấp nhận lệch 0.02 do làm tròn. Thread: https://ocgwp.slack.com/archives/C015T3WFWNN/p1679488878563639
          expect(
            isEqual(
              dataAnalyticsAfter.summary.total_profit,
              dataAnalyticsBefore.summary.total_profit + orderInfo.profit,
              0.02,
            ),
          ).toEqual(true);
          expect(
            isEqual(
              dataAnalyticsAfter.auto_upsell.total_profit,
              dataAnalyticsBefore.auto_upsell.total_profit + profitItemUpsell,
              0.02,
            ),
          ).toEqual(true);
        });
      });
    },
  );
});
