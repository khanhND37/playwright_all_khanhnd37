import { test } from "@core/fixtures";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { General } from "@pages/dashboard/general";
import { SFApps } from "@pages/storefront/apps";
import { SFCheckout } from "@pages/storefront/checkout";
import { chromium, expect, Page } from "@playwright/test";
import type { DataAnalytics, PriceProduct, ShippingAddress } from "@types";
import { AbandonedInfo, OrderConversionFunnel } from "./general_analytics";
import { OcgLogger } from "@core/logger";
import { MultipleSF } from "@pages/storefront/multiple_storefronts";
import { AccountPage } from "@pages/dashboard/accounts";
import { getTokenWithCredentials, TokenType } from "@core/utils/token";
import { Guerilla } from "@helper/guerilla_mail";

let generalAnalytics: AnalyticsPage;
let account: AccountPage;
let checkout: SFCheckout;
let upsell: SFApps;
let shopbaseGeneral: General;
let initData: DataAnalytics;
let prePriceProduct: PriceProduct;
let rawPriceProduct: PriceProduct;
let dataAnalyticsBefore: DataAnalytics;
let dataAnalyticsAfter: DataAnalytics;
let dataAnalyticsShop1: DataAnalytics;
let dataAnalyticsShop2: DataAnalytics;
let amountChange;
let cardInfo;
let shippingInfo: ShippingAddress;
let localeFormat;
let timeZoneShop;
let today;
let twoDaysAgo;
let oneDayAgo;
let objDashboard;
let analyticsDashboard;
let urlCheckout: string;
let scheduleData: AbandonedInfo;
let sfList;
let storeFront;
let orderInit: OrderConversionFunnel;
let orderRecoveryBefore: OrderConversionFunnel;
let orderRecoveryAfter: OrderConversionFunnel;
let verifyDataAnalytics;
const logger = OcgLogger.get();

const goToPage = async (page: Page, domain: string, referrerLink: string) => {
  await page.goto(`https://${domain}/products/dt-hg152${referrerLink}`);
  await page.waitForLoadState("networkidle");
};

test.beforeEach(async ({ conf, dashboard, page }) => {
  test.setTimeout(conf.suiteConf.time_out_tc);
  generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
  upsell = new SFApps(page, conf.suiteConf.domain);
  shopbaseGeneral = new General(dashboard, conf.suiteConf.domain);
  storeFront = new MultipleSF(dashboard);
  cardInfo = conf.suiteConf.card_info;
  shippingInfo = conf.suiteConf.customer_info;
  localeFormat = conf.suiteConf.locale_format;
  initData = conf.suiteConf.data_analytics;
  prePriceProduct = conf.suiteConf.price_product;
  rawPriceProduct = prePriceProduct;
  timeZoneShop = conf.suiteConf.time_zone;
  today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
  analyticsDashboard = conf.suiteConf.data_init_dashboards;
  sfList = conf.suiteConf.domain_sf;
  orderInit = conf.caseConf.data_abandoned;
  verifyDataAnalytics = async (
    dataAnalyticsAfter: DataAnalytics,
    dataAnalyticsBefore: DataAnalytics,
    dataUpdate,
    amountChange: PriceProduct,
  ) => {
    for (const key in dataAnalyticsAfter) {
      let averageFee = 0;
      if (amountChange.totalProductCheckout > 0) {
        if (amountChange.taxes) {
          averageFee =
            Math.round(((amountChange.shipping + amountChange.taxes) / amountChange.totalProductCheckout) * 100) / 100;
        } else {
          averageFee = Math.round((amountChange.shipping / amountChange.totalProductCheckout) * 100) / 100;
        }
      }
      const actualTotalSales = dataAnalyticsAfter[key].total_sales;
      let expectTotalSales;
      expectTotalSales = Math.round((dataAnalyticsBefore[key].total_sales + amountChange[key]) * 100) / 100;
      const salesSummary = Math.round((dataAnalyticsBefore.summary.total_sales + amountChange.summary) * 100) / 100;
      const itemsSummary =
        Math.round((dataAnalyticsBefore.summary.total_items + dataUpdate.total_items_update) * 100) / 100;
      if (key !== "summary") {
        expectTotalSales =
          Math.round((dataAnalyticsBefore[key].total_sales + amountChange[key] + averageFee) * 100) / 100;
      }
      const aov = Math.round((salesSummary / dataAnalyticsAfter.summary.total_orders) * 100) / 100;
      const aoi = Math.round((itemsSummary / dataAnalyticsAfter.summary.total_orders) * 100) / 100;

      logger.info(`EXPECT Total sales = ${expectTotalSales}`);
      logger.info(`ACTUAL Total sales = ${actualTotalSales}`);
      logger.info(`Key = ${key}`);

      expect(actualTotalSales).toBeCloseTo(expectTotalSales, 1);
      expect(dataAnalyticsAfter.summary.total_aov).toBeCloseTo(aov, 1);
      expect(dataAnalyticsAfter.summary.total_aoi).toBeCloseTo(aoi, 1);
      expect(dataAnalyticsAfter[key].total_orders).toEqual(
        dataAnalyticsBefore[key].total_orders + dataUpdate.total_orders_update,
      );
      expect(dataAnalyticsAfter[key].view_content).toEqual(
        dataAnalyticsBefore[key].view_content + dataUpdate.view_content_update,
      );
      expect(dataAnalyticsAfter[key].session_convert).toEqual(
        dataAnalyticsBefore[key].session_convert + dataUpdate.session_converted_update,
      );
    }
    expect(dataAnalyticsAfter.summary.first_time).toEqual(
      dataAnalyticsBefore.summary.first_time + dataUpdate.first_time_update,
    );
  };
});

test.describe("Verify feature show analytics in timezone", async () => {
  test("Verify feature show analytics in timezone @SB_ANA_SB_ANA_REFACTOR_3", async ({ conf, page, authRequest }) => {
    let timezoneOffset;
    checkout = new SFCheckout(page, conf.suiteConf.domain);
    await test.step("Checkout product in Storefront", async () => {
      dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await goToPage(page, conf.suiteConf.domain, "");
      await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, upsell, conf.suiteConf.product_upsell);
      do {
        await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
      } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.page.waitForLoadState("networkidle");
      await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
      do {
        // wait vài giây cho hệ thống sync data trong DB
        await generalAnalytics.waitAbit(3000);
        dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
      } while (
        dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
        dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales
      );
      await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
      await shopbaseGeneral.chooseTimezone(conf.caseConf.data[2].time_zone);
      await shopbaseGeneral.saveChanged();
    });

    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const timeZoneData = conf.caseConf.data[i];
      await test.step("Change timezone in General", async () => {
        await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
        await shopbaseGeneral.chooseTimezone(timeZoneData.time_zone);
        await shopbaseGeneral.saveChanged();
        timezoneOffset = await generalAnalytics.convertDayTime(timeZoneData.time_zone);
      });

      await test.step("Verify charts time in Analytics dashboard", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneData.time_zone });
        const domain = conf.suiteConf.domain;
        const username = conf.suiteConf.username;
        const password = conf.suiteConf.password;
        const userId = conf.suiteConf.user_id;
        const tokenType = TokenType.ShopToken;
        const shopToken = await getTokenWithCredentials(conf.suiteConf.api, {
          domain,
          username,
          password,
          userId,
          tokenType,
        });
        const getTimezoneOnAna = await generalAnalytics.getTimezone(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          "total_sales",
          today,
          shopToken.access_token,
        );
        expect(timezoneOffset).toEqual(getTimezoneOnAna);
      });
    }
  });
});

test.describe("Verify filter days at dashboard Analytics", async () => {
  test("Verify analytics with filter date @SB_ANA_SB_ANA_REFACTOR_4", async ({ conf, authRequest }) => {
    const dayChanges = conf.caseConf.day_changes;
    let dataFrom2Days: DataAnalytics;
    let dataFrom1Day: DataAnalytics;

    await test.step("Precondition", async () => {
      await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
      await shopbaseGeneral.chooseTimezone(conf.caseConf.time_zone);
      await shopbaseGeneral.saveChanged();
    });

    await test.step("Get data from 2 days ago", async () => {
      twoDaysAgo = await generalAnalytics.formatDate(await generalAnalytics.getDateXDaysAgo(2));
      dataFrom2Days = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        twoDaysAgo,
        initData,
        "total_sales",
      );
      logger.info(`---> Data 2 days ago = ${JSON.stringify(dataFrom2Days)}`);
    });

    await test.step("Get data from 1 day ago", async () => {
      oneDayAgo = await generalAnalytics.formatDate(await generalAnalytics.getDateXDaysAgo(1));
      dataFrom1Day = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        oneDayAgo,
        initData,
        "total_sales",
      );
      logger.info(`---> Data 1 day ago = ${JSON.stringify(dataFrom1Day)}`);
    });

    await test.step("Filter with data with 2 days along ago", async () => {
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.filterDateOnAna(dayChanges);
      await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
      await generalAnalytics.page.waitForTimeout(3000);
      objDashboard = await generalAnalytics.getDataFromDashboard("sales", analyticsDashboard);
    });

    await test.step("Verify analytics with filter on dashboard", async () => {
      let totalSalesAPI =
        Math.round((dataFrom2Days.summary.total_sales + dataFrom1Day.summary.total_sales) * 100) / 100;
      let totalOrderAPI = dataFrom2Days.summary.total_orders + dataFrom1Day.summary.total_orders;
      const purchaseAPI = dataFrom2Days.summary.session_convert + dataFrom1Day.summary.session_convert;
      const viewProductAPI = dataFrom2Days.summary.view_content + dataFrom1Day.summary.view_content;
      logger.info(`---> purchaseAPI = ${purchaseAPI} && viewProductAPI = ${viewProductAPI}`);
      let conversionRateAPI = Math.round((purchaseAPI / viewProductAPI) * 100 * 100) / 100;

      !totalSalesAPI ? (totalSalesAPI = 0) : totalSalesAPI;
      !totalOrderAPI ? (totalOrderAPI = 0) : totalOrderAPI;
      !conversionRateAPI ? (conversionRateAPI = 0) : conversionRateAPI;

      expect(totalSalesAPI).toBeCloseTo(objDashboard.sales, 0.01);
      expect(totalOrderAPI).toEqual(objDashboard.total_orders);
      expect(conversionRateAPI).toEqual(objDashboard.conversion_rate);
    });
  });
});

test.describe("Verify data Analytics show on chart", async () => {
  test("Verify data Analytics count up @SB_ANA_SB_ANA_REFACTOR_9", async ({ page, conf, authRequest }) => {
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step("Get data analytic before checkout", async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
      });

      await test.step("Checkout product in Storefront", async () => {
        await goToPage(page, storefront, "");
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        await checkout.checkoutProductWithUsellNoVerify(
          shippingInfo,
          cardInfo,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
        do {
          await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
        } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
      });

      await test.step("Check Analytics on dashboard ShopBase", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items ||
          dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
          dataAnalyticsAfter.upsell.total_sales == dataAnalyticsBefore.upsell.total_sales ||
          dataAnalyticsAfter.upsell.view_content == dataAnalyticsBefore.upsell.view_content ||
          dataAnalyticsAfter.sbase.total_sales == dataAnalyticsBefore.sbase.total_sales ||
          dataAnalyticsAfter.sbase.view_content == dataAnalyticsBefore.sbase.view_content
        );
        logger.info(`---> Data before = ${JSON.stringify(dataAnalyticsBefore)}`);
        logger.info(`---> Data after = ${JSON.stringify(dataAnalyticsAfter)}`);
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, rawPriceProduct);
      });
    }
  });

  test("Verify data Analytics when partially refund order @SB_ANA_SB_ANA_REFACTOR_10", async ({
    page,
    conf,
    authRequest,
  }) => {
    const partiallyRefundAmount = "5";
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step("Checkout product in Storefront", async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        await goToPage(page, storefront, "");
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        await checkout.checkoutProductWithUsellNoVerify(
          shippingInfo,
          cardInfo,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
        do {
          await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
        } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
      });

      await test.step("Get data Analytics before", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items ||
          dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
          dataAnalyticsAfter.upsell.total_sales == dataAnalyticsBefore.upsell.total_sales
        );
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
      });

      await test.step("Partially refund with latest order", async () => {
        await generalAnalytics.refundOrder("partially", partiallyRefundAmount, conf.caseConf.reason);
        const feeOfEachLineItem =
          Math.round(
            ((rawPriceProduct.shipping + rawPriceProduct.taxes) / rawPriceProduct.totalProductCheckout) * 100,
          ) / 100 ?? Math.round((rawPriceProduct.shipping / rawPriceProduct.totalProductCheckout) * 100) / 100;
        amountChange = parseFloat(partiallyRefundAmount) * -1;
        rawPriceProduct.sbase = ((rawPriceProduct.sbase + feeOfEachLineItem) / rawPriceProduct.summary) * amountChange;
        rawPriceProduct.upsell =
          ((rawPriceProduct.upsell + feeOfEachLineItem) / rawPriceProduct.summary) * amountChange;
        rawPriceProduct.summary = amountChange;
        rawPriceProduct.totalProductCheckout = 0;
      });

      await test.step("Verify Analytics when refund order", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.upsell.total_sales == dataAnalyticsBefore.upsell.total_sales
        );
        logger.info(`---> Data before = ${JSON.stringify(dataAnalyticsBefore)}`);
        logger.info(`---> Data after = ${JSON.stringify(dataAnalyticsAfter)}`);
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, rawPriceProduct);
      });
    }
  });

  test("Verify data Analytics when fully refund order @SB_ANA_SB_ANA_REFACTOR_11", async ({
    page,
    conf,
    authRequest,
  }) => {
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step("Checkout product in Storefront", async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        await goToPage(page, storefront, "");
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        await checkout.checkoutProductWithUsellNoVerify(
          shippingInfo,
          cardInfo,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
        logger.info("-----");
        logger.info(`rawPriceProduct = ${JSON.stringify(rawPriceProduct)}`);
        do {
          await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
        } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
      });

      await test.step("Get data Analytics before", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items ||
          dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
          dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content
        );
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        logger.info("-----");
        logger.info(`dataAnalyticsBefore = ${JSON.stringify(dataAnalyticsBefore)}`);
        logger.info("-----");
      });

      await test.step("Fully refund with latest order", async () => {
        await generalAnalytics.refundOrder("fully", amountChange, conf.caseConf.reason);
        rawPriceProduct.summary = rawPriceProduct.summary * -1;
        rawPriceProduct.sbase =
          (rawPriceProduct.sbase +
            (rawPriceProduct.shipping + rawPriceProduct.taxes) / rawPriceProduct.totalProductCheckout) *
          -1;
        rawPriceProduct.upsell =
          (rawPriceProduct.upsell +
            (rawPriceProduct.shipping + rawPriceProduct.taxes) / rawPriceProduct.totalProductCheckout) *
          -1;
        rawPriceProduct.totalProductCheckout = 0;
      });

      await test.step("Verify Analytics when fully refund order", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales);
        logger.info(`dataAnalyticsAfter = ${JSON.stringify(dataAnalyticsAfter)}`);
        logger.info("-----");
        logger.info(`Raw price = ${JSON.stringify(rawPriceProduct)}`);
        logger.info("-----");
        const updated = conf.caseConf.data_updated;
        for (const key in dataAnalyticsAfter) {
          const actualSales = dataAnalyticsAfter[key].total_sales;
          const expectSales = Math.round((dataAnalyticsBefore[key].total_sales + rawPriceProduct[key]) * 100) / 100;
          const items = Math.round((dataAnalyticsBefore.summary.total_items + updated.total_items_update) * 100) / 100;
          const salesSummary = dataAnalyticsBefore.summary.total_sales + rawPriceProduct.summary;
          const aov = Math.round((salesSummary / dataAnalyticsAfter.summary.total_orders) * 100) / 100;
          const aoi = Math.round((items / dataAnalyticsAfter.summary.total_orders) * 100) / 100;
          logger.info(`Actual = ${actualSales}`);
          logger.info("-----");
          logger.info(`Expect = ${expectSales}`);
          logger.info("-----");
          expect(actualSales).toBeCloseTo(expectSales, 1);
          expect(aov).toBeCloseTo(dataAnalyticsAfter.summary.total_aov, 1);
          expect(aoi).toBeCloseTo(dataAnalyticsAfter.summary.total_aoi, 1);
          expect(dataAnalyticsAfter[key].total_orders).toEqual(
            dataAnalyticsBefore[key].total_orders + updated.total_orders_update,
          );
          expect(dataAnalyticsAfter[key].view_content).toEqual(
            dataAnalyticsBefore[key].view_content + updated.view_content_update,
          );
          expect(dataAnalyticsAfter[key].session_convert).toEqual(
            dataAnalyticsBefore[key].session_convert + updated.session_converted_update,
          );
        }
      });
    }
  });

  test("Verify data Analytics when edit order @SB_ANA_SB_ANA_REFACTOR_12", async ({ page, conf, authRequest }) => {
    const productQuantity = conf.caseConf.quantities;
    let editOrder: { checkoutLink: string; amountCollect: number };
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step("Checkout product in Storefront", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        await goToPage(page, storefront, "");
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        await checkout.checkoutProductWithUsellNoVerify(
          shippingInfo,
          cardInfo,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
        logger.info(`rawPriceProduct before edit order = ${JSON.stringify(rawPriceProduct)}`);
      });

      await test.step("Get data Analytics before", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items ||
          dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
          dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
          dataAnalyticsAfter.upsell.total_sales == dataAnalyticsBefore.upsell.total_sales ||
          dataAnalyticsAfter.upsell.total_items == dataAnalyticsBefore.upsell.total_items ||
          dataAnalyticsAfter.upsell.reached_checkout == dataAnalyticsBefore.upsell.reached_checkout ||
          dataAnalyticsAfter.upsell.add_to_cart == dataAnalyticsBefore.upsell.add_to_cart ||
          dataAnalyticsAfter.upsell.view_content == dataAnalyticsBefore.upsell.view_content
        );
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        logger.info(`dataAnalyticsBefore = ${JSON.stringify(dataAnalyticsBefore)}`);
      });

      await test.step("Edit order in order detail", async () => {
        editOrder = await generalAnalytics.editOrder(productQuantity);
        rawPriceProduct.summary = editOrder.amountCollect + rawPriceProduct.taxes ?? editOrder.amountCollect;
        rawPriceProduct.sbase = editOrder.amountCollect + rawPriceProduct.taxes ?? editOrder.amountCollect;
        rawPriceProduct.upsell = 0;
        rawPriceProduct.totalProductCheckout = 0;
      });

      await test.step("Checkout with new update in order", async () => {
        await checkout.page.goto(editOrder.checkoutLink);
        await checkout.page.waitForSelector('//span[text()="Amount to pay"]', { timeout: 120000 });
        await checkout.completeOrderWithCardInfo(cardInfo);
      });

      await test.step("Verify Analytics when edit order", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items
        );
        logger.info(`dataAnalyticsAfter = ${JSON.stringify(dataAnalyticsAfter)}`);
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, rawPriceProduct);
      });
    }
  });

  test("Verify customer analytics with case unique email @SB_ANA_SB_ANA_REFACTOR_24", async ({
    page,
    conf,
    authRequest,
  }) => {
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );

      await test.step("Checkout product in Storefront", async () => {
        shippingInfo.email = await generalAnalytics.setUniqueEmail(shippingInfo.email);
        await goToPage(page, storefront, "");
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        await checkout.checkoutProductWithUsellNoVerify(
          shippingInfo,
          cardInfo,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
      });

      await test.step("Check Analytics on dashboard ShopBase", async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        logger.info(`dataAnalyticsBefore = ${JSON.stringify(dataAnalyticsBefore)}`);
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(3000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
          dataAnalyticsAfter.summary.first_time == dataAnalyticsBefore.summary.first_time ||
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items ||
          dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
          dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
          dataAnalyticsAfter.upsell.view_content == dataAnalyticsBefore.upsell.view_content ||
          dataAnalyticsAfter.upsell.add_to_cart == dataAnalyticsBefore.upsell.add_to_cart ||
          dataAnalyticsAfter.upsell.total_sales == dataAnalyticsBefore.upsell.total_sales
        );
        logger.info(`dataAnalyticsAfter = ${JSON.stringify(dataAnalyticsAfter)}`);
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, rawPriceProduct);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_29 Check hiển thị total sales và total orders tại page Home`, async () => {
    await test.step(`Go to dashboard shopbase`, async () => {
      let totalSales = await generalAnalytics.getTextContent(generalAnalytics.xpathTotalSalesHome);
      let totalOrders = await generalAnalytics.getTextContent(generalAnalytics.xpathTotalOrdersHome);
      totalSales == "No sales yet" ? (totalSales = "$0.00") : totalSales;
      totalOrders == "No orders yet" ? (totalOrders = "0") : totalOrders;
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
      expect(await generalAnalytics.getTextContent(generalAnalytics.xpathTotalSales)).toEqual(totalSales);
      expect(await generalAnalytics.getTextContent(generalAnalytics.xpathTotalOrders)).toEqual(totalOrders);
    });
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_5 Kiểm tra filter shop trong Analytics in ShopBase`, async ({
    page,
    conf,
    authRequest,
  }) => {
    checkout = new SFCheckout(page, conf.suiteConf.domain);
    await test.step(`Checkout với product of shop 1`, async () => {
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.page.waitForLoadState("networkidle");
      await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
      dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );

      await goToPage(page, conf.suiteConf.domain, "");
      await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, upsell, conf.suiteConf.product_upsell);
      do {
        await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
      } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.page.waitForLoadState("networkidle");
      await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
      do {
        // wait vài giây cho hệ thống sync data trong DB
        await generalAnalytics.waitAbit(3000);
        dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
      } while (
        dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
        dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
        dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content
      );
    });

    await test.step(`Get analytics data of shop 2`, async () => {
      dataAnalyticsShop2 = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.caseConf.shop_id_2,
        today,
        initData,
        "total_sales",
      );
    });

    await test.step(`At Analytics page, filter shop 1 and shop 2 in shop list`, async () => {
      dataAnalyticsShop1 = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await generalAnalytics.filterShops(conf.caseConf.domain_2);
      await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
      objDashboard = await generalAnalytics.getDataFromDashboard("sales", analyticsDashboard);

      let totalSalesAPI =
        Math.round((dataAnalyticsShop1.summary.total_sales + dataAnalyticsShop2.summary.total_sales) * 100) / 100;
      let totalOrderAPI = dataAnalyticsShop1.summary.total_orders + dataAnalyticsShop2.summary.total_orders;
      const purchaseAPI = dataAnalyticsShop1.summary.session_convert + dataAnalyticsShop2.summary.session_convert;
      const viewProductAPI = dataAnalyticsShop1.summary.view_content + dataAnalyticsShop2.summary.view_content;
      let conversionRateAPI = Math.round((purchaseAPI / viewProductAPI) * 100 * 100) / 100;

      if (!totalSalesAPI) {
        totalSalesAPI = 0;
      }
      if (!totalOrderAPI) {
        totalOrderAPI = 0;
      }
      if (!conversionRateAPI) {
        conversionRateAPI = 0;
      }

      expect(totalSalesAPI).toBeCloseTo(objDashboard.sales, 0.01);
      expect(totalOrderAPI).toEqual(objDashboard.total_orders);
      expect(conversionRateAPI).toEqual(objDashboard.conversion_rate);
    });
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_27 Kiểm tra copy link reached checkout sang một session mới`, async ({
    conf,
    authRequest,
  }) => {
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      const browser = await chromium.launch({});
      const page = await browser.newPage({});
      checkout = new SFCheckout(page, storefront);
      await test.step(`Make abandoned checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        await goToPage(page, storefront, "");
        await checkout.page.reload();
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        await checkout.makeAbandonedCheckout(
          shippingInfo,
          conf.suiteConf.card_info,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        urlCheckout = checkout.page.url();
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
          dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
          dataAnalyticsAfter.upsell.view_content == dataAnalyticsBefore.upsell.view_content ||
          dataAnalyticsAfter.sbase.view_content == dataAnalyticsBefore.sbase.view_content
        );
        expect(dataAnalyticsAfter.summary.total_sales).toBe(dataAnalyticsBefore.summary.total_sales);
        expect(dataAnalyticsAfter.summary.total_orders).toBe(dataAnalyticsBefore.summary.total_orders);
        expect(dataAnalyticsBefore.summary.view_content + 1).toBe(dataAnalyticsAfter.summary.view_content);
        expect(dataAnalyticsBefore.summary.add_to_cart + 1).toBe(dataAnalyticsAfter.summary.add_to_cart);
        expect(dataAnalyticsBefore.summary.reached_checkout + 1).toBe(dataAnalyticsAfter.summary.reached_checkout);
        expect(dataAnalyticsBefore.summary.session_convert).toBe(dataAnalyticsAfter.summary.session_convert);
        await checkout.page.close();
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
      });

      await test.step(`Open link Checkout trong session mới, Checkout thành công`, async () => {
        const browser = await chromium.launch({});
        const page = await browser.newPage({});
        await page.goto(urlCheckout);
        const checkout = new SFCheckout(page, storefront);
        await checkout.completeOrderWithCardInfo(conf.suiteConf.card_info);
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
        do {
          await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
        } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
        await generalAnalytics.gotoAnalytics();
        await checkout.page.close();
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
        } while (
          dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
          dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
          dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items ||
          dataAnalyticsAfter.upsell.total_sales == dataAnalyticsBefore.upsell.total_sales ||
          dataAnalyticsAfter.sbase.total_sales == dataAnalyticsBefore.sbase.total_sales
        );
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, rawPriceProduct);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_16 Kiểm tra chart Abandoned checkout khi Buyer click link trong mail remind abandoned và recover order`, async ({
    page,
    conf,
    authRequest,
    scheduler,
    dashboard,
  }) => {
    let i = 0;
    generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    await test.step(`Make abandoned checkout`, async () => {
      shippingInfo = conf.caseConf.customer_info;
      await storeFront.verifyExistMultiSF(sfList);
      const rawDataJson = await scheduler.getData();
      if (rawDataJson) {
        scheduleData = rawDataJson as AbandonedInfo;
        const afterHour = Math.floor((new Date().getTime() - scheduleData.time) / 3600000);
        if (afterHour > 1) {
          await scheduler.clear();
          scheduleData = {
            url: "no abandoned checkout",
            time: 0,
          };
        }
      } else {
        scheduleData = {
          url: "no abandoned checkout",
          time: 0,
        };
      }
      if (scheduleData.url == "no abandoned checkout") {
        for (const storefront of sfList) {
          if (i > 0) {
            const browser = await chromium.launch({});
            page = await browser.newPage({});
            dashboard = await browser.newPage({});
          }
          account = new AccountPage(dashboard, conf.suiteConf.domain);
          upsell = new SFApps(page, storefront);
          if (i > 0) {
            await account.login({
              email: conf.suiteConf.username,
              password: conf.suiteConf.password,
              redirectToAdmin: true,
            });
            generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
            await generalAnalytics.page.waitForSelector(generalAnalytics.xpathTotalOrdersHome, { timeout: 120000 });
          }
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForLoadState("networkidle");
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
          dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
          checkout = new SFCheckout(page, storefront);
          await goToPage(page, storefront, "");
          await checkout.page.reload();
          await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
          await checkout.makeAbandonedCheckout(
            shippingInfo[i],
            conf.suiteConf.card_info,
            upsell,
            conf.suiteConf.product_upsell,
          );
          if (i == 1) {
            scheduleData.url = checkout.page.url();
            scheduleData.time = new Date().getTime();
            await scheduler.setData(scheduleData);
            await scheduler.schedule({ mode: "later", minutes: 21 });
          }
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForLoadState("networkidle");
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
          do {
            // wait vài giây cho hệ thống sync data trong DB
            await generalAnalytics.waitAbit(2000);
            dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
              authRequest,
              conf.suiteConf.shop_id,
              today,
              initData,
              "total_sales",
            );
          } while (
            dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
            dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
            dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content
          );
          expect(dataAnalyticsAfter.summary.total_sales).toBe(dataAnalyticsBefore.summary.total_sales);
          expect(dataAnalyticsAfter.summary.total_orders).toBe(dataAnalyticsBefore.summary.total_orders);
          expect(dataAnalyticsBefore.summary.view_content + 1).toBe(dataAnalyticsAfter.summary.view_content);
          expect(dataAnalyticsBefore.summary.add_to_cart + 1).toBe(dataAnalyticsAfter.summary.add_to_cart);
          expect(dataAnalyticsBefore.summary.reached_checkout + 1).toBe(dataAnalyticsAfter.summary.reached_checkout);
          expect(dataAnalyticsBefore.summary.session_convert).toBe(dataAnalyticsAfter.summary.session_convert);
          await checkout.page.close();
          if (i == 1) {
            logger.info("Complete make abandoned checkout");
            return;
          } else {
            await dashboard.close();
          }
          i++;
        }
      }
    });

    const afterMinutes = Math.floor((new Date().getTime() - scheduleData.time) / 60000);
    if (scheduleData.url != "no abandoned checkout" && afterMinutes > 20) {
      let checkoutUrl;
      if (i == 0) {
        // Check mail qua Guerilla
        const mail = new Guerilla(page);
        await mail.accessMail(conf.caseConf.mail);
        const mailCount = await mail.page.locator(mail.mailInbox).count();
        if (mailCount == 0) {
          await scheduler.schedule({ mode: "later", minutes: 2 });
          return;
        }
        await mail.readMailWithContent(conf.caseConf.complete_purchase, conf.suiteConf.shop_name, "");
        const [newPage] = await Promise.all([
          mail.page.waitForEvent("popup", { timeout: 120000 }),
          mail.page.click(mail.completePurchaseLink),
        ]);
        checkoutUrl = newPage.url();
        await newPage.close();
      }
      for (const storefront of sfList) {
        await test.step(`Hoàn thành abandoned checkout sau khi hệ thống gửi abandoned qua sms/email`, async () => {
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForLoadState("networkidle");
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
          dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_sales",
          );
          logger.info(`-----> Data Before = ${JSON.stringify(dataAnalyticsBefore)}`);
          if (i == 0) {
            orderRecoveryBefore = await generalAnalytics.getQuantityOfOrderRecoveryByEmail(
              authRequest,
              today,
              today,
              conf.suiteConf.shop_id,
              "total_sales",
              orderInit,
            );
          } else {
            orderRecoveryBefore = await generalAnalytics.getQuantityOfOrderRecoveryByOther(
              authRequest,
              today,
              today,
              conf.suiteConf.shop_id,
              "total_sales",
              orderInit,
            );
          }
          if (i == 1) {
            checkoutUrl = scheduleData.url;
          }
          const checkoutNew = new SFCheckout(page, storefront);
          await checkoutNew.goto(checkoutUrl);
          await checkoutNew.page.waitForLoadState("domcontentloaded");
          await checkoutNew.completeOrderWithCardInfo(conf.suiteConf.card_info);
          await expect(checkoutNew.page.locator(checkoutNew.xpathPayment)).toBeHidden({ timeout: 120000 });
          if (await checkoutNew.page.locator(checkoutNew.xpathClosePPCPopUp).isVisible()) {
            await checkoutNew.closePostPurchase();
          }
          expect(checkoutNew.thankyouPageLoc).toBeTruthy();
          if (i == 1) {
            await scheduler.clear();
          }
          rawPriceProduct = await checkoutNew.getPriceItemType(
            prePriceProduct,
            conf.suiteConf.product_online_store,
            conf.suiteConf.product_upsell,
          );
          logger.info(`-----> Price of Product = ${JSON.stringify(rawPriceProduct)}`);
        });

        await test.step(`Check Analytics trong dashboard ShopBase`, async () => {
          do {
            await generalAnalytics.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
            await generalAnalytics.page.waitForSelector(generalAnalytics.xpathFirstOrder);
          } while (await generalAnalytics.page.isHidden(generalAnalytics.xpathPaidFirstOrder));
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForLoadState("networkidle");
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
          do {
            // wait vài giây cho hệ thống sync data trong DB
            await generalAnalytics.waitAbit(2000);
            dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
              authRequest,
              conf.suiteConf.shop_id,
              today,
              initData,
              "total_sales",
            );
          } while (
            dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
            dataAnalyticsAfter.summary.total_sales == dataAnalyticsBefore.summary.total_sales ||
            dataAnalyticsAfter.summary.total_items == dataAnalyticsBefore.summary.total_items
          );
          await verifyDataAnalytics(
            dataAnalyticsAfter,
            dataAnalyticsBefore,
            conf.caseConf.data_updated,
            rawPriceProduct,
          );
          do {
            // wait vài giây cho hệ thống sync data trong DB
            await generalAnalytics.waitAbit(2000);
            if (i == 0) {
              orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByEmail(
                authRequest,
                today,
                today,
                conf.suiteConf.shop_id,
                "total_sales",
                orderInit,
              );
            } else {
              orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByOther(
                authRequest,
                today,
                today,
                conf.suiteConf.shop_id,
                "total_sales",
                orderInit,
              );
            }
          } while (orderRecoveryAfter.order_recovery == orderRecoveryBefore.order_recovery);
          expect(orderRecoveryBefore.order_recovery + 1).toBe(orderRecoveryAfter.order_recovery);
          if (i == 0) {
            do {
              // wait vài giây cho hệ thống sync data trong DB
              await generalAnalytics.waitAbit(1000);
              if (i == 0) {
                orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByEmail(
                  authRequest,
                  today,
                  today,
                  conf.suiteConf.shop_id,
                  "total_sales",
                  orderInit,
                );
              } else {
                orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByOther(
                  authRequest,
                  today,
                  today,
                  conf.suiteConf.shop_id,
                  "total_sales",
                  orderInit,
                );
              }
            } while (orderRecoveryAfter.event_click == orderRecoveryBefore.event_click);
            expect(orderRecoveryBefore.event_click + 1).toBe(orderRecoveryAfter.event_click);
          }
        });
        i++;
      }
    }
  });
});
