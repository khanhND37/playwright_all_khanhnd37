import { expect, test } from "@core/fixtures";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { loadData } from "@core/conf/conf";
import { General } from "@pages/dashboard/general";
import type { DataAnalytics, DPAnalyticsSalesReport, PriceProduct } from "@types";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { HttpMethods } from "@core/services";
import { HivePage } from "@pages/hive/core";
import { readFileCSV } from "@helper/file";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { TokenType, getTokenWithCredentials } from "@core/utils/token";

const verifyDataAnalytics = async (
  dataAnalyticsAfter: DataAnalytics,
  dataAnalyticsBefore: DataAnalytics,
  dataUpdate,
  amountChange: PriceProduct,
) => {
  expect(dataAnalyticsAfter.summary.total_sales).toEqual(
    dataAnalyticsBefore.summary.total_sales + amountChange.summary,
  );
  expect(dataAnalyticsAfter.summary.total_orders).toEqual(
    dataAnalyticsBefore.summary.total_orders + dataUpdate.total_orders_update,
  );

  expect(dataAnalyticsAfter.summary.view_content).toEqual(
    dataAnalyticsBefore.summary.view_content + dataUpdate.view_content_update,
  );

  expect(dataAnalyticsAfter.summary.session_convert).toEqual(
    dataAnalyticsBefore.summary.session_convert + dataUpdate.session_convert_update,
  );

  expect(dataAnalyticsAfter.summary.cr_rate).toEqual(
    Math.round((dataAnalyticsAfter.summary.session_convert / dataAnalyticsAfter.summary.view_content) * 100 * 100) /
      100,
  );
};

const verifyDataAnalyticsShopStaff = async (
  dataAnalyticsBeforeShop1: DataAnalytics,
  dataAnalyticsBeforeShop2: DataAnalytics,
) => {
  expect(dataAnalyticsBeforeShop1.summary.total_sales).toEqual(dataAnalyticsBeforeShop2.summary.total_sales);
  expect(dataAnalyticsBeforeShop1.summary.total_orders).toEqual(dataAnalyticsBeforeShop2.summary.total_orders);

  expect(dataAnalyticsBeforeShop1.summary.view_content).toEqual(dataAnalyticsBeforeShop2.summary.view_content);

  expect(dataAnalyticsBeforeShop1.summary.session_convert).toEqual(dataAnalyticsBeforeShop2.summary.session_convert);

  expect(dataAnalyticsBeforeShop1.summary.cr_rate).toEqual(dataAnalyticsBeforeShop2.summary.cr_rate);
};
const verifyDataSalesReport = async (
  dataSalesReportAfter: DPAnalyticsSalesReport,
  dataSalesReportBefore: DPAnalyticsSalesReport,
  amountChange: number,
  valueString,
) => {
  for (const a in dataSalesReportAfter) {
    const object = dataSalesReportAfter[a];
    for (const key in object) {
      if (typeof object[key] === "string") {
        expect(dataSalesReportAfter[a][key]).toEqual(valueString[key]);
      }
      if (typeof object[key] === "number") {
        if (key === "contribute") {
          if (dataSalesReportAfter[a]["orders_summary"] > 0) {
            expect(dataSalesReportAfter[a]["contribute"]).toEqual(
              Math.round((dataSalesReportAfter[a]["orders"] / dataSalesReportAfter[a]["orders_summary"]) * 100 * 100) /
                100,
            );
          } else {
            expect(dataSalesReportAfter[a]["contribute"]).toEqual(0);
          }
        } else if (key === "conversion_rate" && dataSalesReportAfter[a]["views"] !== 0) {
          expect(dataSalesReportAfter[a]["conversion_rate"]).toEqual(
            Math.round((dataSalesReportAfter[a]["orders"] / dataSalesReportAfter[a]["views"]) * 100 * 100) / 100,
          );
        } else if (key === "sales") {
          expect(dataSalesReportAfter[a][key]).toEqual(dataSalesReportBefore[a][key] + amountChange);
        }
      }
    }
  }
};

const verifyOptionInDataSalesReport = async (
  dataSalesReportAfter: DPAnalyticsSalesReport,
  checkOption = "Product with sales" || "Product without sale" || "All products",
) => {
  for (const a in dataSalesReportAfter) {
    const object = dataSalesReportAfter[a];
    for (const key in object) {
      if (typeof object[key] === "number") {
        if (key === "orders" && checkOption === "Product with sales") {
          expect(dataSalesReportAfter[a]["orders"]).toBeGreaterThan(0);
        } else if (key === "orders" && checkOption === "Product without sale") {
          expect(dataSalesReportAfter[a]["orders"]).toEqual(0);
        } else if (key === "orders" && checkOption === "All products") {
          expect(dataSalesReportAfter[a]["orders"]).toBeGreaterThanOrEqual(0);
        }
      }
    }
  }
};

test.describe("Verify feature show analytics in timezone", async () => {
  test(`Verify feature show analytics in timezone @SB_ANA_ANA_SB_CREATOR_3`, async ({
    dashboard,
    page,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const email = conf.suiteConf.customer_info.email;
    const handleProduct = conf.suiteConf.handle;
    const localeFormat = conf.suiteConf.locale_format;

    const generalSBCreator = new General(dashboard, domain);
    const checkout = new CheckoutForm(page, domain);
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);

    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const timeZoneData = conf.caseConf.data[i];
      await test.step(`Change timezone in General`, async () => {
        await generalSBCreator.openGeneralDashboard();
        await generalSBCreator.chooseTimezone(timeZoneData.time_zone);
        await generalSBCreator.saveChanged();
      });

      await test.step(`Checkout product in Storefront`, async () => {
        await page.goto(`https://${domain}/`);
        await page.goto(`https://${domain}/products/${handleProduct}`);
        await checkout.enterEmail(email);
        await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
      });

      await test.step(`Verify charts time in Analytics dashboard`, async () => {
        const timezoneOffset = await analyticsSBCreator.convertDayTime(timeZoneData.time_zone);
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
        const getTimezoneOnAna = await analyticsSBCreator.getTimezone(
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

test.describe("Verify filter days at dashboard Analytics ShopBase Creator", async () => {
  test(`Verify analytics with filter date @SB_ANA_ANA_SB_CREATOR_4`, async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    let dataFrom2Days: DataAnalytics;
    let dataFrom1Days: DataAnalytics;
    let objDashboard;
    const domain = conf.suiteConf.domain;
    const analyticsDashboard = conf.caseConf.data_init_dashboards;
    const dayChanges = conf.caseConf.day_changes;
    const initData: DataAnalytics = conf.suiteConf.data_analytics;

    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const generalSBCreator = new General(dashboard, domain);

    await generalSBCreator.openGeneralDashboard();
    await generalSBCreator.chooseTimezone(conf.caseConf.time_zone);

    await test.step(`Get data from 2 days ago`, async () => {
      const twoDaysAgo = await analyticsSBCreator.formatDate(await analyticsSBCreator.getDateXDaysAgo(2));
      dataFrom2Days = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        twoDaysAgo,
        initData,
        "total_sales",
      );
    });

    await test.step(`Get data from 1 day ago`, async () => {
      const oneDayAgo = await analyticsSBCreator.formatDate(await analyticsSBCreator.getDateXDaysAgo(1));
      dataFrom1Days = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        oneDayAgo,
        initData,
        "total_sales",
      );
    });

    await test.step(`Filter with data with 2 days along ago`, async () => {
      await analyticsSBCreator.gotoAnalytics();
      await analyticsSBCreator.filterDateOnAna(dayChanges);
      objDashboard = await analyticsSBCreator.getDataFromDashboard("sales", analyticsDashboard);
    });

    await test.step(`Verify analytics with filter on dashboard`, async () => {
      let totalSalesAPI =
        Math.round((dataFrom2Days.summary.total_sales + dataFrom1Days.summary.total_sales) * 100) / 100;
      let totalOrderAPI = dataFrom2Days.summary.total_orders + dataFrom1Days.summary.total_orders;
      let viewContentAPI = dataFrom2Days.summary.view_content + dataFrom1Days.summary.view_content;
      let sessionConvertedAPI = dataFrom2Days.summary.session_convert + dataFrom1Days.summary.session_convert;
      let conversionRateAPI = Math.round((sessionConvertedAPI / viewContentAPI) * 100 * 100) / 100;

      !totalSalesAPI ? (totalSalesAPI = 0) : totalSalesAPI;
      !totalOrderAPI ? (totalOrderAPI = 0) : totalOrderAPI;
      !viewContentAPI ? (viewContentAPI = 0) : viewContentAPI;
      !sessionConvertedAPI ? (sessionConvertedAPI = 0) : sessionConvertedAPI;
      !conversionRateAPI ? (conversionRateAPI = 0) : conversionRateAPI;

      expect(totalSalesAPI).toEqual(objDashboard.sales);
      expect(totalOrderAPI).toEqual(objDashboard.total_orders);
      expect(conversionRateAPI).toEqual(objDashboard.conversion_rate);
    });
  });
});

test.describe("Kiểm tra tính năng filter shop trong dashboard Analytics trong ShopBase Creator", async () => {
  test(`@SB_ANA_ANA_SB_CREATOR_5 Kiểm tra tính năng filter shop trong dashboard Analytics trong
ShopBase Creator`, async ({ dashboard, page, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const domain2 = conf.caseConf.second_shop_domain;

    const analyticsSBCreatorShop1 = new AnalyticsPage(dashboard, domain);
    const analyticsSBCreatorShop2 = new AnalyticsPage(dashboard, domain);

    const email = conf.suiteConf.customer_info.email;
    const handleProduct1 = conf.suiteConf.handle;
    const handleProduct2 = conf.caseConf.second_shop_handle;
    const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
    let rawPriceProduct1: PriceProduct = prePriceProduct;
    let rawPriceProduct2: PriceProduct = prePriceProduct;

    const initData: DataAnalytics = conf.caseConf.data_analytics;

    let dataAnalyticsAfterShop1;
    let dataAnalyticsAfterShop2;

    const timeZoneShop = conf.suiteConf.time_zone;
    const localeFormat = conf.suiteConf.locale_format;

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    const checkout = new CheckoutForm(page, domain);
    //

    let dataAnalyticsBeforeShop1;
    let dataAnalyticsBeforeShop2;

    await test.step("Get data analytics before checkout success ", async () => {
      dataAnalyticsBeforeShop1 = await analyticsSBCreatorShop1.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );

      dataAnalyticsBeforeShop2 = await analyticsSBCreatorShop2.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.caseConf.second_shop_id,
        today,
        initData,
        "total_sales",
      );
    });

    await test.step(`Checkout với product "Super test Digital producton ShopBase"`, async () => {
      await page.goto(`https://${domain}/products/${handleProduct1}`);
      await checkout.enterEmail(email);
      await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);

      rawPriceProduct1 = await checkout.getPriceItemType(
        prePriceProduct,
        conf.suiteConf.product_online_store,
        conf.suiteConf.product_upsell,
      );
      // check Analytics on dashboard Shop 1
      dataAnalyticsAfterShop1 = await analyticsSBCreatorShop1.validateDataChanges(
        dataAnalyticsBeforeShop1,
        initData,
        authRequest,
        conf.suiteConf.shop_id,
        today,
        conf.suiteConf.time_out_api_calling,
        "total_sales",
      );

      await verifyDataAnalytics(
        dataAnalyticsAfterShop1,
        dataAnalyticsBeforeShop1,
        conf.caseConf.data_updated,
        rawPriceProduct1,
      );
    });

    await test.step(`Checkout với product "Another super test Digital product on ShopBase"`, async () => {
      await page.goto(`https://${domain2}/products/${handleProduct2}`);
      await checkout.enterEmail(email);
      await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
      rawPriceProduct2 = await checkout.getPriceItemType(
        prePriceProduct,
        conf.suiteConf.product_online_store,
        conf.suiteConf.product_upsell,
      );
      //Check Analytics on dashboard Shop 2
      dataAnalyticsAfterShop2 = await analyticsSBCreatorShop2.validateDataChanges(
        dataAnalyticsBeforeShop2,
        initData,
        authRequest,
        conf.caseConf.second_shop_id,
        today,
        conf.suiteConf.time_out_api_calling,
        "total_sales",
      );

      await verifyDataAnalytics(
        dataAnalyticsAfterShop2,
        dataAnalyticsBeforeShop2,
        conf.caseConf.data_updated,
        rawPriceProduct2,
      );
    });

    await test.step(`So sanh analytics khi filter 2 shop`, async () => {
      const twoShopID = `${conf.suiteConf.shop_id},${conf.caseConf.second_shop_id}`;
      const totalDataSalesReport = await analyticsSBCreatorShop2.getDataAnalyticsAPIDashboard(
        authRequest,
        twoShopID,
        today,
        initData,
        "total_sales",
      );
      const sum = await analyticsSBCreatorShop1.sumOfTwoDPSalesReport(dataAnalyticsAfterShop1, dataAnalyticsAfterShop2);
      const bool = await analyticsSBCreatorShop1.validateDPSalesReportEqualTotal(sum, totalDataSalesReport);
      expect(bool).toEqual(true);
    });
  });
});
test.describe("Verify data Analytics show on chart", async () => {
  let conf;
  let domain;
  let handleProduct;
  let timeZoneShop;
  let shopID;
  let timeOutAPICalling;
  let email;
  let localeFormat;
  test.beforeEach(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    handleProduct = conf.suiteConf.handle;
    timeZoneShop = conf.suiteConf.time_zone;
    shopID = conf.suiteConf.shop_id;
    timeOutAPICalling = conf.suiteConf.time_out_api_calling;
    email = conf.suiteConf.customer_info.email;
    localeFormat = conf.suiteConf.locale_format;
  });
  test("Verify data Analytics count up @SB_ANA_ANA_SB_CREATOR_9", async ({ dashboard, page, conf, authRequest }) => {
    const initData: DataAnalytics = conf.caseConf.data_analytics;
    const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
    let rawPriceProduct: PriceProduct = prePriceProduct;

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });

    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const checkout = new CheckoutForm(page, domain);

    let dataAnalyticsBefore;
    await test.step(`Checkout product in Storefront`, async () => {
      dataAnalyticsBefore = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await page.goto(`https://${domain}/products/${handleProduct}`);
      await checkout.enterEmail(email);
      await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
      rawPriceProduct = await checkout.getPriceItemType(
        prePriceProduct,
        conf.suiteConf.product_online_store,
        conf.suiteConf.product_upsell,
      );
    });

    await test.step(`Check Analytics on dashboard ShopBase Creator`, async () => {
      const dataAnalyticsAfter = await analyticsSBCreator.validateDataChanges(
        dataAnalyticsBefore,
        initData,
        authRequest,
        conf.suiteConf.shop_id,
        today,
        conf.suiteConf.time_out_api_calling,
        "total_sales",
      );

      await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, rawPriceProduct);
    });
  });

  conf = loadData(__dirname, "CASE_REFUND");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Verify data Analytics when order refund @${dataSetting.case_id}`, async ({
      dashboard,
      page,
      conf,
      authRequest,
      hiveSBase,
    }) => {
      const RefundAmount = dataSetting.RefundAmount;
      let dataAnalyticsBefore;
      let dataAnalyticsAfterCheckOutSuccess;

      const initData: DataAnalytics = dataSetting.data_analytics;
      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });

      const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
      const dpOrder = new OrderPage(dashboard, domain);
      const checkout = new CheckoutForm(page, domain);
      const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
      let rawPriceProduct: PriceProduct = prePriceProduct;

      await test.step(`Checkout product in Storefront`, async () => {
        dataAnalyticsBefore = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        await page.goto(`https://${domain}/products/${handleProduct}`);
        await checkout.enterEmail(email);
        await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
      });

      await test.step(`Get data Analytics before`, async () => {
        dataAnalyticsAfterCheckOutSuccess = await analyticsSBCreator.validateDataChanges(
          dataAnalyticsBefore,
          initData,
          authRequest,
          conf.suiteConf.shop_id,
          today,
          conf.suiteConf.time_out_api_calling,
          "total_sales",
        );
        await verifyDataAnalytics(
          dataAnalyticsAfterCheckOutSuccess,
          dataAnalyticsBefore,
          dataSetting.data_updated_after_checkout_success,
          rawPriceProduct,
        );
      });

      await test.step(`Partially refund with latest order`, async () => {
        await dpOrder.navigateToMenu("Orders");
        await dpOrder.waitUtilSkeletonDisappear();
        await dpOrder.openNewestOrder();
        await dpOrder.waitUtilSkeletonDisappear();
        const orderID = await dpOrder.getOrderIdInOrderDetail();
        const hivePage = new HivePage(hiveSBase, conf.suiteConf.hive_domain);
        await hivePage.goToOrderDetail(orderID);
        await hivePage.refundOrder(RefundAmount);
        const amountChange = parseFloat(RefundAmount) * -1;
        rawPriceProduct.summary = amountChange;
      });

      await test.step(`Verify Analytics when refund order`, async () => {
        const dataAnalyticsAfterRefund = await analyticsSBCreator.validateDataChanges(
          dataAnalyticsAfterCheckOutSuccess,
          initData,
          authRequest,
          conf.suiteConf.shop_id,
          today,
          conf.suiteConf.time_out_api_calling,
          "total_sales",
          false,
        );
        await verifyDataAnalytics(
          dataAnalyticsAfterRefund,
          dataAnalyticsAfterCheckOutSuccess,
          dataSetting.data_updated,
          rawPriceProduct,
        );
      });
    });
  }
  test(`Verify Analytics charts with unfinished checkout @SB_ANA_ANA_SB_CREATOR_13`, async ({
    dashboard,
    page,
    conf,
    authRequest,
  }) => {
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const checkout = new CheckoutForm(page, domain);
    const initData: DataAnalytics = conf.suiteConf.data_analytics;
    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });

    const dataAnalyticsBefore = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
      authRequest,
      conf.suiteConf.shop_id,
      today,
      initData,
      "total_sales",
    );

    await test.step(`Unfinished checkout with product`, async () => {
      await page.goto(`https://${domain}/`);
      await page.goto(`https://${domain}/products/${handleProduct}`);
      await page.waitForSelector(checkout.stripCardNumber);
      await page.close();
    });

    await test.step(`Verify Analytics on dashboard`, async () => {
      const dataAnalyticsAfter = await analyticsSBCreator.validateDataChanges(
        dataAnalyticsBefore,
        initData,
        authRequest,
        conf.suiteConf.shop_id,
        today,
        conf.suiteConf.time_out_api_calling,
        "total_sales",
      );

      expect(dataAnalyticsAfter.summary.view_content).toEqual(dataAnalyticsBefore.summary.view_content + 1);
      expect(dataAnalyticsAfter.summary.total_sales).toEqual(dataAnalyticsBefore.summary.total_sales);
      expect(dataAnalyticsAfter.summary.total_orders).toEqual(dataAnalyticsBefore.summary.total_orders);
      expect(dataAnalyticsAfter.summary.conversion_rate).toEqual(dataAnalyticsBefore.summary.conversion_rate);
    });
  });

  test(`Verify Sales report with view product and unfinished checkout @SB_ANA_ANA_SB_CREATOR_18`, async ({
    dashboard,
    page,
    authRequest,
  }) => {
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const checkout = new CheckoutForm(page, domain);
    const productDpAPI = new ProductAPI(domain, authRequest);

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    const dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
    const dpProductDetail = await productDpAPI.getProduct(dpProductID);

    const valueString = {};
    valueString["title"] = dpProductDetail.data.products[0].product.title;
    valueString["shop_name"] = dashboard.url().split("/")[2];
    valueString["pricing_type"] = dpProductDetail.data.products[0].product.variant_offers[0].name;
    valueString["pr_type"] = dpProductDetail.data.products[0].product.product_type;
    valueString["member_type"] = "return";

    let amountChanged;
    const dataSalesReportBefore = await analyticsSBCreator.getDataSalesReportDP(
      authRequest,
      shopID,
      today,
      dpProductID,
      dpProductDetail,
    );

    await test.step(`Unfinished checkout with product`, async () => {
      await page.goto(`https://${domain}/`);
      await page.goto(`https://${domain}/products/${handleProduct}`);
      await page.waitForSelector(checkout.stripCardNumber);
      await new Promise(t => setTimeout(t, 5000));
      await page.close();
    });

    await test.step(`Verify Sales report on dashboard ShopBase Creator`, async () => {
      const dataSalesReportAfter = await analyticsSBCreator.validateDPSalesReportChanged(
        authRequest,
        dataSalesReportBefore,
        shopID,
        today,
        dpProductID,
        dpProductDetail,
        timeOutAPICalling,
      );

      await verifyDataSalesReport(dataSalesReportAfter, dataSalesReportBefore, amountChanged, valueString);
    });
  });

  test(`Verify Sales report with view product and finished checkout @SB_ANA_ANA_SB_CREATOR_19`, async ({
    dashboard,
    page,
    conf,
    authRequest,
  }) => {
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const productDpAPI = new ProductAPI(domain, authRequest);
    const checkout = new CheckoutForm(page, domain);
    const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
    let rawPriceProduct: PriceProduct = prePriceProduct;

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    let dpProductID;
    let dpProductDetail;
    let valueString = {};
    let dataSalesReportBefore;

    await test.step(`finished checkout with product`, async () => {
      dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
      dpProductDetail = await productDpAPI.getProduct(dpProductID);

      valueString = {};
      valueString["title"] = dpProductDetail.data.products[0].product.title;
      valueString["shop_name"] = dashboard.url().split("/")[2];
      valueString["pricing_type"] = dpProductDetail.data.products[0].product.variant_offers[0].name;
      valueString["pr_type"] = dpProductDetail.data.products[0].product.product_type;
      valueString["member_type"] = "return";

      dataSalesReportBefore = await analyticsSBCreator.getDataSalesReportDP(
        authRequest,
        shopID,
        today,
        dpProductID,
        dpProductDetail,
      );

      await page.goto(`https://${domain}/`);
      await page.goto(`https://${domain}/products/${handleProduct}`);
      await checkout.enterEmail(email);
      await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
      rawPriceProduct = await checkout.getPriceItemType(
        prePriceProduct,
        conf.suiteConf.product_online_store,
        conf.suiteConf.product_upsell,
      );
    });

    await test.step(`Verify Sales report on dashboard ShopBase Creator`, async () => {
      const dataSalesReportAfter = await analyticsSBCreator.validateDPSalesReportChanged(
        authRequest,
        dataSalesReportBefore,
        shopID,
        today,
        dpProductID,
        dpProductDetail,
        timeOutAPICalling,
      );

      await verifyDataSalesReport(dataSalesReportAfter, dataSalesReportBefore, rawPriceProduct.summary, valueString);
    });
  });

  conf = loadData(__dirname, "CASE_OPTION_SALERP");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({ page, dashboard, authRequest }) => {
      const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
      const productDpAPI = new ProductAPI(domain, authRequest);
      const checkout = new CheckoutForm(page, domain);

      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
      let dpProductID;
      let dpProductDetail;

      let valueString = {};

      let dataSalesReportBefore;
      await test.step(`Checkout product in Storefront`, async () => {
        dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
        dpProductDetail = await productDpAPI.getProduct(dpProductID);

        valueString = {};
        valueString["title"] = dpProductDetail.data.products[0].product.title;
        valueString["shop_name"] = dashboard.url().split("/")[2];
        valueString["pricing_type"] = dpProductDetail.data.products[0].product.variant_offers[0].name;
        valueString["pr_type"] = dpProductDetail.data.products[0].product.product_type;
        valueString["member_type"] = "return";

        dataSalesReportBefore = await analyticsSBCreator.getDataSalesReportDP(
          authRequest,
          shopID,
          today,
          dpProductID,
          dpProductDetail,
        );

        await page.goto(`https://${domain}/products/${handleProduct}`);
        await checkout.enterEmail(email);
        await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
      });

      await test.step(`Check Sales report trong dashboard ShopBase Creator`, async () => {
        const dataSalesReportAfter = await analyticsSBCreator.validateDPSalesReportChanged(
          authRequest,
          dataSalesReportBefore,
          shopID,
          today,
          dpProductID,
          dpProductDetail,
          timeOutAPICalling,
          dataSetting.option_data,
        );
        await verifyOptionInDataSalesReport(dataSalesReportAfter, dataSetting.option_data);
      });
    });
  }

  test(`@SB_ANA_ANA_SB_CREATOR_25 Kiểm tra Export sales report đối với trường hợp sales report có value < 2000`, async ({
    page,
    conf,
    dashboard,
    authRequest,
  }) => {
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const productDpAPI = new ProductAPI(domain, authRequest);
    const checkout = new CheckoutForm(page, domain);
    const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
    let rawPriceProduct: PriceProduct = prePriceProduct;

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    let dpProductID;
    let dpProductDetail;

    let valueString = {};

    let dataSalesReportBefore;
    await test.step(`Checkout product in Storefront`, async () => {
      dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
      dpProductDetail = await productDpAPI.getProduct(dpProductID);

      valueString = {};
      valueString["title"] = dpProductDetail.data.products[0].product.title;
      valueString["shop_name"] = dashboard.url().split("/")[2];
      valueString["pricing_type"] = dpProductDetail.data.products[0].product.variant_offers[0].name;
      valueString["pr_type"] = dpProductDetail.data.products[0].product.product_type;
      valueString["member_type"] = "return";

      dataSalesReportBefore = await analyticsSBCreator.getDataSalesReportDP(
        authRequest,
        shopID,
        today,
        dpProductID,
        dpProductDetail,
      );
      await page.goto(`https://${domain}/products/${handleProduct}`);
      await checkout.enterEmail(email);
      await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
      rawPriceProduct = await checkout.getPriceItemType(
        prePriceProduct,
        conf.suiteConf.product_online_store,
        conf.suiteConf.product_upsell,
      );
    });

    await test.step(`Kiểm tra Export data trong sales report với lượng records < 2000`, async () => {
      const dataSalesReportAfter = await analyticsSBCreator.validateDPSalesReportChanged(
        authRequest,
        dataSalesReportBefore,
        shopID,
        today,
        dpProductID,
        dpProductDetail,
        timeOutAPICalling,
      );

      await verifyDataSalesReport(dataSalesReportAfter, dataSalesReportBefore, rawPriceProduct.summary, valueString);
      await analyticsSBCreator.gotoAnalytics();
      const fileSaleRP = await analyticsSBCreator.downloadFileExportAnalytics();
      const readFeedFile = await readFileCSV(fileSaleRP, "\t");

      const map: Map<number, string[]> = new Map();

      let count = 1;
      for (const arr of readFeedFile) {
        for (const a of arr) {
          const data = a.split(",").reverse();
          for (let i = 0; i < 6; i++) {
            if (map.has(count)) {
              map.get(count)?.push(data[i]);
            } else {
              map.set(count, [data[i]]);
            }
          }
        }
        count++;
      }

      const aggregate: number[] = [];
      map.forEach(values => {
        if (!aggregate.length) {
          for (const value of values) {
            aggregate.push(Number(value));
          }
        } else {
          let i = 0;
          for (const value of values) {
            aggregate[i] += Number(value);
            i++;
          }
        }
      });
      aggregate[3] = Math.round((aggregate[4] / aggregate[5]) * 100 * 100) / 100;
      const dataSaleRPFileCSV = [aggregate[1], ...aggregate.splice(3)];

      // verify file csv
      for (const a in dataSalesReportAfter) {
        const object = dataSalesReportAfter[a];
        for (const key in object) {
          if (typeof object[key] === "number" && dataSalesReportAfter[a]["total_summary"]["view_content"] !== 0) {
            if (key === "total_summary") {
              expect(dataSalesReportAfter[a]["total_summary"]["net_sales"]).toEqual(dataSaleRPFileCSV[0]);
              expect(dataSalesReportAfter[a]["total_summary"]["total_orders"]).toEqual(dataSaleRPFileCSV[2]);
              expect(dataSalesReportAfter[a]["total_summary"]["view_content"]).toEqual(dataSaleRPFileCSV[3]);
            } else if (key === "conversion_rate" && dataSalesReportAfter[a]["total_summary"]["view_content"] !== 0) {
              expect(dataSalesReportAfter[a]["conversion_rate"]).toEqual(dataSaleRPFileCSV[1]);
            }
          }
        }
      }
    });
  });
});

test.describe("Verify search engine in sales report", async () => {
  test(`Verify search engine @SB_ANA_ANA_SB_CREATOR_28`, async ({ dashboard, conf }) => {
    const domain = conf.suiteConf.domain;

    const analyticsSBCreator = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    await dashboard.goto(`https://${domain}/admin/analytics/`);

    await test.step("Search value match with case value", async () => {
      const dataValidate = conf.caseConf.successful;
      for (let i = 0; i < dataValidate.length; i++) {
        await analyticsSBCreator.searchWithValue(dataValidate[i].value_search, dataValidate[i].report_by);
        const title = await analyticsSBCreator.getTextContent(analyticsSBCreator.xpathTitleSalesReportDP);
        expect(title).toEqual(dataValidate[i].value_search);
      }
    });

    await test.step("Search value unmatch with case value", async () => {
      const dataValidate = conf.caseConf.unsuccessful;
      for (let i = 0; i < dataValidate.length; i++) {
        await analyticsSBCreator.searchWithValue(dataValidate[i].value_search, dataValidate[i].report_by);
        const validate = await analyticsSBCreator.isElementExisted(analyticsSBCreator.xpathReportWithNoData);
        expect(validate).toBeTruthy();
      }
    });
  });
});

test.describe("Verify data on Traffic by channel", async () => {
  const conf = loadData(__dirname, "TRAFFIC_BY_CHANNELS");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`${dataSetting.description} @${dataSetting.case_id}`, async ({ browser, conf, authRequest }) => {
      test.setTimeout(conf.suiteConf.time_out_tc);
      const timeZoneShop = conf.suiteConf.time_zone;
      const domain = conf.suiteConf.domain;
      const handleProduct = conf.suiteConf.handle;
      const email = conf.suiteConf.customer_info.email;
      const checkoutCase = dataSetting.data;
      const shopId = conf.suiteConf.shop_id;
      const timeOut = conf.suiteConf.time_out_api_calling;
      const reportType = dataSetting.report_type;
      const localeFormat = conf.suiteConf.locale_format;

      const productDpAPI = new ProductAPI(domain, authRequest);

      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
      const dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
      const dpProductDetail = await productDpAPI.getProduct(dpProductID);
      let amountChanged = dpProductDetail.data.products[0].product.variant_offers[0].price;

      for (const obj in checkoutCase) {
        const objData = checkoutCase[obj];
        for (const key in objData) {
          const context = await browser.newContext();
          const page = await context.newPage();
          const analyticsSBCreator = new AnalyticsPage(page, domain);
          const referLink = objData[key]["refer_link"];

          const dataTrafficChannelsBefore = await analyticsSBCreator.getReportByChannel(
            authRequest,
            shopId,
            objData[key]["referrer"],
            today,
            reportType,
          );

          await test.step("Checkout product", async () => {
            await new Promise(t => setTimeout(t, 3000));
            const checkout = new CheckoutForm(page, domain);
            switch (obj) {
              case "unfinished_checkout":
                await page.goto(`https://${domain}/${referLink}`);
                await page.goto(`https://${domain}/products/${handleProduct}`);
                await new Promise(t => setTimeout(t, 5000));
                amountChanged = 0;
                await page.close();
                break;

              case "finished_checkout":
                await page.goto(`https://${domain}/${referLink}`);
                await page.goto(`https://${domain}/products/${handleProduct}`);
                await checkout.enterEmail(email);
                await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
                await page.close();
                break;
            }
          });

          await test.step(`Verify data on Traffic by Channel`, async () => {
            const dataTrafficChannelsAfter = await analyticsSBCreator.validateDPTrafficSourceReportChanged(
              authRequest,
              shopId,
              objData[key]["referrer"],
              today,
              reportType,
              dataTrafficChannelsBefore,
              timeOut,
            );

            expect(dataTrafficChannelsAfter.channel).toEqual(objData[key]["channel"]);
            expect(dataTrafficChannelsAfter.referrer).toEqual(objData[key]["referrer"]);
            expect(dataTrafficChannelsAfter.view_page).toEqual(
              dataTrafficChannelsBefore.view_page + objData[key]["data_updated"]["view_page_update"],
            );
            expect(dataTrafficChannelsAfter.orders).toEqual(
              dataTrafficChannelsBefore.orders + objData[key]["data_updated"]["total_orders_update"],
            );
            expect(dataTrafficChannelsAfter.sales).toEqual(
              Math.round((dataTrafficChannelsBefore.sales + amountChanged) * 100) / 100,
            );
            if (dataTrafficChannelsAfter.view_page === 0) {
              expect(dataTrafficChannelsAfter.conversion_rate).toEqual(0);
            } else {
              expect(dataTrafficChannelsAfter.conversion_rate).toEqual(
                Math.round((dataTrafficChannelsAfter.orders / dataTrafficChannelsAfter.view_page) * 100 * 100) / 100,
              );
            }
          });
        }
      }
    });
  }
});

test.describe(`Verify dashboard Traffic by campaigns`, async () => {
  let conf;
  conf = loadData(__dirname, "TRAFFIC_BY_CAMPAIGNS");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const trafficCamp = conf.caseConf.data[i];

    test(`${trafficCamp.description} @${trafficCamp.case_id}`, async ({ browser, conf, authRequest }) => {
      test.setTimeout(conf.suiteConf.time_out_tc);
      const timeZoneShop = conf.suiteConf.time_zone;
      const email = conf.suiteConf.customer_info.email;
      const domain = conf.suiteConf.domain;
      const shopId = conf.suiteConf.shop_id;
      const paramApi = conf.suiteConf.param;
      const handleProduct = conf.suiteConf.handle;
      const checkoutCase = trafficCamp.case_data;
      const timeOut = conf.suiteConf.time_out_api_calling;
      const localeFormat = conf.suiteConf.locale_format;

      const productDpAPI = new ProductAPI(domain, authRequest);

      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
      const dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
      const dpProductDetail = await productDpAPI.getProduct(dpProductID);
      let amountChanged = dpProductDetail.data.products[0].product.variant_offers[0].price;
      let validateFieldChanged: string;

      for (const obj in checkoutCase) {
        const objData = checkoutCase[obj];
        for (const key in objData) {
          const context = await browser.newContext();
          const page = await context.newPage();
          const analyticsSBCreator = new AnalyticsPage(page, domain);
          const referLink = objData[key]["refer_link"];
          const identifier = objData[key]["source"];

          const dataTrafficByCampBefore = await analyticsSBCreator.getDataUTMReport(
            authRequest,
            shopId,
            today,
            paramApi,
            "utm_campaign",
          );

          await test.step(`Checkout product`, async () => {
            await new Promise(t => setTimeout(t, 3000));
            const checkout = new CheckoutForm(page, domain);
            switch (obj) {
              case "unfinished_checkout":
                validateFieldChanged = "view_content";
                await page.goto(`https://${domain}/${referLink}`);
                await page.waitForRequest(
                  request =>
                    request.url().includes("api/actions.json") &&
                    request.method() === HttpMethods.Post &&
                    request.postData().includes("events"),
                );
                await page.goto(`https://${domain}/products/${handleProduct}`);
                amountChanged = 0;
                await new Promise(t => setTimeout(t, 5000));
                await page.close();
                break;

              case "finished_checkout":
                validateFieldChanged = "net_sales";
                await page.goto(`https://${domain}/${referLink}`);
                await page.goto(`https://${domain}/products/${handleProduct}`);
                await checkout.enterEmail(email);
                await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
                await page.close();
                break;
            }
          });

          await test.step(`Verify data on Traffic by campaigns`, async () => {
            const dataTrafficByCampAfter = await analyticsSBCreator.validateDataUTMReportChange(
              dataTrafficByCampBefore,
              authRequest,
              shopId,
              today,
              paramApi,
              identifier,
              timeOut,
              validateFieldChanged,
            );

            const index = await analyticsSBCreator.indexData(
              dataTrafficByCampBefore,
              dataTrafficByCampAfter,
              identifier,
            );

            if (dataTrafficByCampBefore[0]["utm_source"] === "") {
              expect(dataTrafficByCampAfter[index.indexAfter]["view_content"]).toEqual(
                dataTrafficByCampBefore[0]["view_content"] + objData[key]["data_updated"]["view_content_update"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["total_orders"]).toEqual(
                dataTrafficByCampBefore[0]["total_orders"] + objData[key]["data_updated"]["total_orders_update"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["session_converted"]).toEqual(
                dataTrafficByCampBefore[0]["session_converted"] +
                  objData[key]["data_updated"]["session_converted_update"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["net_quantity"]).toEqual(
                dataTrafficByCampBefore[0]["net_quantity"] + objData[key]["data_updated"]["net_quantity"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["net_sales"]).toEqual(
                Number(dataTrafficByCampBefore[0]["net_sales"]) + amountChanged,
              );
            } else {
              expect(dataTrafficByCampAfter[index.indexAfter]["view_content"]).toEqual(
                dataTrafficByCampBefore[index.indexBefore]["view_content"] +
                  objData[key]["data_updated"]["view_content_update"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["total_orders"]).toEqual(
                dataTrafficByCampBefore[index.indexBefore]["total_orders"] +
                  objData[key]["data_updated"]["total_orders_update"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["total_items"]).toEqual(
                dataTrafficByCampBefore[index.indexBefore]["total_items"] +
                  objData[key]["data_updated"]["total_items_update"],
              );
              expect(dataTrafficByCampAfter[index.indexAfter]["net_sales"]).toEqual(
                Number(dataTrafficByCampBefore[index.indexBefore]["net_sales"]) + amountChanged,
              );
            }

            expect(dataTrafficByCampAfter[index.indexAfter]["utm_source"]).toEqual(objData[key]["source"]);
            expect(dataTrafficByCampAfter[index.indexAfter]["utm_medium"]).toEqual(objData[key]["medium"]);
            expect(dataTrafficByCampAfter[index.indexAfter]["utm_campaign"]).toEqual(objData[key]["campaigns"]);
            expect(dataTrafficByCampAfter[index.indexAfter]["utm_term"]).toEqual(objData[key]["term"]);
            expect(dataTrafficByCampAfter[index.indexAfter]["utm_content"]).toEqual(objData[key]["content"]);
          });
        }
      }
    });
  }
  test(`@SB_ANA_ANA_SB_CREATOR_34 Kiểm tra hiển thị khi chọn filter set column trong phần traffic by campaigns`, async ({
    conf,
    authRequest,
    browser,
    dashboard,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const timeZoneShop = conf.suiteConf.time_zone;
    const domain = conf.suiteConf.domain;
    const shopId = conf.suiteConf.shop_id;
    const paramApi = conf.suiteConf.param;
    const handleProduct = conf.suiteConf.handle;
    const checkoutCase = conf.caseConf.case_data;
    const timeOut = conf.suiteConf.time_out_api_calling;
    const localeFormat = conf.suiteConf.locale_format;

    const productDpAPI = new ProductAPI(domain, authRequest);
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    const dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
    const dpProductDetail = await productDpAPI.getProduct(dpProductID);
    let amountChanged = dpProductDetail.data.products[0].product.variant_offers[0].price;
    let validateFieldChanged: string;

    for (const obj in checkoutCase) {
      const objData = checkoutCase[obj];
      for (const key in objData) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const analyticsSBCreator = new AnalyticsPage(page, domain);
        const referLink = objData[key]["refer_link"];
        const identifier = objData[key]["source"];

        const dataTrafficByCampBefore = await analyticsSBCreator.getDataUTMReport(
          authRequest,
          shopId,
          today,
          paramApi,
          "utm_campaign",
        );

        await test.step(`Checkout product`, async () => {
          switch (obj) {
            case "unfinished_checkout":
              validateFieldChanged = "view_content";
              await page.goto(`https://${domain}/${referLink}`);
              await page.waitForRequest(
                request =>
                  request.url().includes("api/actions.json") &&
                  request.method() === HttpMethods.Post &&
                  request.postData().includes("events"),
              );
              await page.goto(`https://${domain}/products/${handleProduct}`);
              amountChanged = 0;
              await page.waitForLoadState("networkidle");
              await page.close();
              break;
          }
        });

        await test.step(`Verify data on Traffic by campaigns`, async () => {
          const dataTrafficByCampAfter = await analyticsSBCreator.validateDataUTMReportChange(
            dataTrafficByCampBefore,
            authRequest,
            shopId,
            today,
            paramApi,
            identifier,
            timeOut,
            validateFieldChanged,
          );

          const index = await analyticsSBCreator.indexData(dataTrafficByCampBefore, dataTrafficByCampAfter, identifier);

          if (dataTrafficByCampBefore[0]["utm_source"] === "") {
            expect(dataTrafficByCampAfter[index.indexAfter]["view_content"]).toEqual(
              dataTrafficByCampBefore[0]["view_content"] + objData[key]["data_updated"]["view_content_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["total_orders"]).toEqual(
              dataTrafficByCampBefore[0]["total_orders"] + objData[key]["data_updated"]["total_orders_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["session_converted"]).toEqual(
              dataTrafficByCampBefore[0]["session_converted"] +
                objData[key]["data_updated"]["session_converted_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["net_quantity"]).toEqual(
              dataTrafficByCampBefore[0]["net_quantity"] + objData[key]["data_updated"]["net_quantity"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["net_sales"]).toEqual(
              Number(dataTrafficByCampBefore[0]["net_sales"]) + amountChanged,
            );
          } else {
            expect(dataTrafficByCampAfter[index.indexAfter]["view_content"]).toEqual(
              dataTrafficByCampBefore[index.indexBefore]["view_content"] +
                objData[key]["data_updated"]["view_content_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["total_orders"]).toEqual(
              dataTrafficByCampBefore[index.indexBefore]["total_orders"] +
                objData[key]["data_updated"]["total_orders_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["total_items"]).toEqual(
              dataTrafficByCampBefore[index.indexBefore]["total_items"] +
                objData[key]["data_updated"]["total_items_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["net_sales"]).toEqual(
              Number(dataTrafficByCampBefore[index.indexBefore]["net_sales"]) + amountChanged,
            );
          }

          expect(dataTrafficByCampAfter[index.indexAfter]["utm_source"]).toEqual(objData[key]["source"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_medium"]).toEqual(objData[key]["medium"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_campaign"]).toEqual(objData[key]["campaigns"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_term"]).toEqual(objData[key]["term"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_content"]).toEqual(objData[key]["content"]);
        });
      }
    }
    await test.step(`Kiểm tra default set column hiển thị khi mở dashboard analytics`, async () => {
      await analyticsSBCreator.gotoAnalytics();
      await analyticsSBCreator.page.waitForSelector(analyticsSBCreator.xpthDataUTMReport);
      await expect(
        await analyticsSBCreator.genLoc(
          analyticsSBCreator.xpathGetSummaryInUTMReport(conf.caseConf.case_data.unfinished_checkout[0].source),
        ),
      ).toBeVisible();
    });
    await test.step(`Kiểm tra change set column từ default sang Source/Medium`, async () => {
      await analyticsSBCreator.selectOptionReportByInUTMRp("Source / Medium");
      await expect(
        await analyticsSBCreator.genLoc(analyticsSBCreator.xpathGetSummaryInUTMReport("Facebook / referral")),
      ).toBeVisible();
    });
  });

  test(`@SB_ANA_ANA_SB_CREATOR_35 Kiểm tra chức năng search trong phần traffic by campaigns`, async ({
    conf,
    authRequest,
    browser,
    dashboard,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const timeZoneShop = conf.suiteConf.time_zone;
    const domain = conf.suiteConf.domain;
    const shopId = conf.suiteConf.shop_id;
    const paramApi = conf.suiteConf.param;
    const handleProduct = conf.suiteConf.handle;
    const checkoutCase = conf.caseConf.case_data;
    const timeOut = conf.suiteConf.time_out_api_calling;
    const localeFormat = conf.suiteConf.locale_format;
    const searchCase = conf.caseConf.case_search;

    const productDpAPI = new ProductAPI(domain, authRequest);
    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);

    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    const dpProductID = await productDpAPI.getDpProductIDByHandle(handleProduct);
    const dpProductDetail = await productDpAPI.getProduct(dpProductID);
    let amountChanged = dpProductDetail.data.products[0].product.variant_offers[0].price;
    let validateFieldChanged: string;

    for (const obj in checkoutCase) {
      const objData = checkoutCase[obj];
      for (const key in objData) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const analyticsSBCreator = new AnalyticsPage(page, domain);
        const referLink = objData[key]["refer_link"];
        const identifier = objData[key]["source"];

        const dataTrafficByCampBefore = await analyticsSBCreator.getDataUTMReport(
          authRequest,
          shopId,
          today,
          paramApi,
          "utm_campaign",
        );

        await test.step(`Checkout product`, async () => {
          switch (obj) {
            case "unfinished_checkout":
              validateFieldChanged = "view_content";
              await page.goto(`https://${domain}/${referLink}`);
              await page.waitForRequest(
                request =>
                  request.url().includes("api/actions.json") &&
                  request.method() === HttpMethods.Post &&
                  request.postData().includes("events"),
              );
              await page.goto(`https://${domain}/products/${handleProduct}`);
              amountChanged = 0;
              await page.waitForLoadState("networkidle");
              await page.close();
              break;
          }
        });

        await test.step(`Verify data on Traffic by campaigns`, async () => {
          const dataTrafficByCampAfter = await analyticsSBCreator.validateDataUTMReportChange(
            dataTrafficByCampBefore,
            authRequest,
            shopId,
            today,
            paramApi,
            identifier,
            timeOut,
            validateFieldChanged,
          );

          const index = await analyticsSBCreator.indexData(dataTrafficByCampBefore, dataTrafficByCampAfter, identifier);

          if (dataTrafficByCampBefore[0]["utm_source"] === "") {
            expect(dataTrafficByCampAfter[index.indexAfter]["view_content"]).toEqual(
              dataTrafficByCampBefore[0]["view_content"] + objData[key]["data_updated"]["view_content_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["total_orders"]).toEqual(
              dataTrafficByCampBefore[0]["total_orders"] + objData[key]["data_updated"]["total_orders_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["session_converted"]).toEqual(
              dataTrafficByCampBefore[0]["session_converted"] +
                objData[key]["data_updated"]["session_converted_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["net_quantity"]).toEqual(
              dataTrafficByCampBefore[0]["net_quantity"] + objData[key]["data_updated"]["net_quantity"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["net_sales"]).toEqual(
              Number(dataTrafficByCampBefore[0]["net_sales"]) + amountChanged,
            );
          } else {
            expect(dataTrafficByCampAfter[index.indexAfter]["view_content"]).toEqual(
              dataTrafficByCampBefore[index.indexBefore]["view_content"] +
                objData[key]["data_updated"]["view_content_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["total_orders"]).toEqual(
              dataTrafficByCampBefore[index.indexBefore]["total_orders"] +
                objData[key]["data_updated"]["total_orders_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["total_items"]).toEqual(
              dataTrafficByCampBefore[index.indexBefore]["total_items"] +
                objData[key]["data_updated"]["total_items_update"],
            );
            expect(dataTrafficByCampAfter[index.indexAfter]["net_sales"]).toEqual(
              Number(dataTrafficByCampBefore[index.indexBefore]["net_sales"]) + amountChanged,
            );
          }

          expect(dataTrafficByCampAfter[index.indexAfter]["utm_source"]).toEqual(objData[key]["source"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_medium"]).toEqual(objData[key]["medium"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_campaign"]).toEqual(objData[key]["campaigns"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_term"]).toEqual(objData[key]["term"]);
          expect(dataTrafficByCampAfter[index.indexAfter]["utm_content"]).toEqual(objData[key]["content"]);
        });
      }
    }
    await test.step(`Kiểm tra chức năng search trong Traffic by campaigns`, async () => {
      await analyticsSBCreator.gotoAnalytics();
      await analyticsSBCreator.page.waitForSelector(analyticsSBCreator.xpthDataUTMReport);
      for (let i = 0; i < searchCase.length; i++) {
        if (searchCase.case === "1") {
          await analyticsSBCreator.searchInTrafficByCampaings(searchCase[i].content);
          await expect(await analyticsSBCreator.genLoc(analyticsSBCreator.xpathNoDataUTMReport)).toBeVisible();
        } else if (searchCase.case === "2") {
          await analyticsSBCreator.searchInTrafficByCampaings(searchCase.content);
          await expect(
            await analyticsSBCreator.genLoc(analyticsSBCreator.xpathGetSummaryInUTMReport(searchCase[i].content)),
          ).toBeVisible();
        } else if (searchCase.case === "3") {
          await analyticsSBCreator.searchInTrafficByCampaings(searchCase[i].content, "UTM Source", "UTM Medium");
          await expect(await analyticsSBCreator.genLoc(analyticsSBCreator.xpathNoDataUTMReport)).toBeVisible();
        } else if (searchCase.case === "4") {
          await analyticsSBCreator.searchInTrafficByCampaings(searchCase[i].content, "UTM Source", "UTM Medium");
          await expect(
            await analyticsSBCreator.genLoc(analyticsSBCreator.xpathGetSummaryInUTMReport("facebook network")),
          ).toBeVisible();
        }
      }
    });
  });
  test(`@SB_ANA_ANA_SB_CREATOR_36 Kiểm tra Export traffic by campaigns đối với trường hợp traffic by campaigns có value < 2000`, async ({
    conf,
    dashboard,
    authRequest,
    browser,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const timeZoneShop = conf.suiteConf.time_zone;
    const domain = conf.suiteConf.domain;
    const shopId = conf.suiteConf.shop_id;
    const paramApi = conf.suiteConf.param;
    const handleProduct = conf.suiteConf.handle;
    const checkoutCase = conf.caseConf.case_data;
    const timeOut = conf.suiteConf.time_out_api_calling;
    const localeFormat = conf.suiteConf.locale_format;
    const email = conf.suiteConf.customer_info.email;

    const analyticsSBCreator = new AnalyticsPage(dashboard, domain);
    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });

    let validateFieldChanged: string;
    let dataUTMRepotAfter;

    for (const obj in checkoutCase) {
      const objData = checkoutCase[obj];
      for (const key in objData) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const analyticsSBCreator = new AnalyticsPage(page, domain);
        const referLink = objData[key]["refer_link"];
        const identifier = objData[key]["source"];

        const dataTrafficByCampBefore = await analyticsSBCreator.getDataUTMReport(
          authRequest,
          shopId,
          today,
          paramApi,
          "utm_campaign",
        );

        await test.step(`Checkout product`, async () => {
          const checkout = new CheckoutForm(page, domain);
          switch (obj) {
            case "finished_checkout":
              validateFieldChanged = "net_sales";
              await page.goto(`https://${domain}/${referLink}`);
              await page.goto(`https://${domain}/products/${handleProduct}`);
              await checkout.enterEmail(email);
              await checkout.completeOrderWithCardInfo(checkout.defaultCardInfo);
              await page.close();
              break;
          }
        });
        await test.step(`Verify data on Traffic by campaigns`, async () => {
          await analyticsSBCreator.validateDataUTMReportChange(
            dataTrafficByCampBefore,
            authRequest,
            shopId,
            today,
            paramApi,
            identifier,
            timeOut,
            validateFieldChanged,
          );
        });
      }
    }
    await test.step(`Kiểm tra Export data trong traffic by campaigns với lượng records < 2000`, async () => {
      await analyticsSBCreator.gotoAnalytics();
      const fileSaleRP = await analyticsSBCreator.downloadFileExportAnalytics("Traffic by campaigns");
      const readFeedFile = await readFileCSV(fileSaleRP, "\t");

      const map: Map<number, string[]> = new Map();

      let count = 1;
      for (const arr of readFeedFile) {
        for (const a of arr) {
          const data = a.split(",").reverse();
          for (let i = 0; i < 6; i++) {
            if (map.has(count)) {
              map.get(count)?.push(data[i]);
            } else {
              map.set(count, [data[i]]);
            }
          }
        }
        count++;
      }

      // verify file csv
      for (const a in dataUTMRepotAfter) {
        const object = dataUTMRepotAfter[a];
        map.forEach(element => {
          if (object.utm_source === element[5]) {
            expect(object.view_content).toEqual(parseFloat(element[4]));
            expect(object.total_orders).toEqual(parseFloat(element[3]));
            expect(object.cr_rate).toEqual(parseFloat(element[2]));
            expect(object.total_items).toEqual(parseFloat(element[1]));
            expect(object.net_sales).toEqual(parseFloat(element[0]));
          }
        });
      }
    });
  });

  conf = loadData(__dirname, "ADD_STAFF_FULL_PERMISSIONS");
  let dataAnalyticsBeforeShop1;
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const addStaff = conf.caseConf.data[i];
    test(`Add staff @${addStaff.case_id}`, async ({ conf, dashboard, authRequest }) => {
      test.setTimeout(conf.suiteConf.time_out_tc);
      const domain = conf.suiteConf.domain;
      const timeZoneShop = conf.suiteConf.time_zone;
      const localeFormat = conf.suiteConf.locale_format;

      const initData: DataAnalytics = addStaff.data_analytics;

      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });

      const analyticsSBCreator = new AnalyticsPage(dashboard, domain);

      dataAnalyticsBeforeShop1 = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await test.step(`Add Account Staff cho shop - Click button Add Staff account - Add email: ducdao@beeketing.net - Assign full quyền cho account staff - Click button send invitation`, async () => {
        await analyticsSBCreator.gotoSettingAcc(addStaff.id_staff);
        await analyticsSBCreator.selectFullpermissions();
      });
    });
  }
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const addStaff = conf.caseConf.data[i];
    test(`verify analytics @${addStaff.case_id}`, async ({ conf, dashboard, token, authRequest }) => {
      test.setTimeout(conf.suiteConf.time_out_tc);
      const timeZoneShop = conf.suiteConf.time_zone;
      const localeFormat = conf.suiteConf.locale_format;

      const initData: DataAnalytics = addStaff.data_analytics;

      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
      const dashboardPageSecond = new DashboardPage(dashboard, addStaff.domain);
      const shopToken = await token.getWithCredentials({
        domain: addStaff.domain,
        username: addStaff.username,
        password: addStaff.password,
      });
      const accessToken = shopToken.access_token;
      await dashboardPageSecond.loginWithToken(accessToken);

      const analyticsSBCreator = new AnalyticsPage(dashboard, addStaff.domain);

      await test.step(`Kiểm tra Permission dashboard Analytics trong acc Staff`, async () => {
        const dataAnalyticsBeforeshop2 = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
          authRequest,
          "10388554",
          today,
          initData,
          "total_sales",
        );
        await verifyDataAnalyticsShopStaff(dataAnalyticsBeforeShop1, dataAnalyticsBeforeshop2);
      });
    });
  }

  conf = loadData(__dirname, "ADD_STAFF_NO_PERMISSIONS_ANA");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const addStaff = conf.caseConf.data[i];
    test(`Add staff @${addStaff.case_id}`, async ({ conf, dashboard, authRequest }) => {
      test.setTimeout(conf.suiteConf.time_out_tc);
      const domain = conf.suiteConf.domain;
      const timeZoneShop = conf.suiteConf.time_zone;
      const localeFormat = conf.suiteConf.locale_format;

      const initData: DataAnalytics = addStaff.data_analytics;

      const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });

      const analyticsSBCreator = new AnalyticsPage(dashboard, domain);

      dataAnalyticsBeforeShop1 = await analyticsSBCreator.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await test.step(`Add Account Staff cho shop - Click button Add Staff account - Add email: ducdao@beeketing.net - Assign full quyền cho account staff - Click button send invitation`, async () => {
        await analyticsSBCreator.gotoSettingAcc(addStaff.id_staff);
        await analyticsSBCreator.UncheckPermissionsAna();
      });
    });
  }
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const addStaff = conf.caseConf.data[i];
    test(`verify analytics @${addStaff.case_id}`, async ({ conf, dashboard, token }) => {
      test.setTimeout(conf.suiteConf.time_out_tc);
      const dashboardPageSecond = new DashboardPage(dashboard, addStaff.domain);
      const shopToken = await token.getWithCredentials({
        domain: addStaff.domain,
        username: addStaff.username,
        password: addStaff.password,
      });
      const accessToken = shopToken.access_token;
      await dashboardPageSecond.loginWithToken(accessToken);

      const analyticsSBCreator = new AnalyticsPage(dashboard, addStaff.domain);

      await test.step(`Kiểm tra Permission dashboard Analytics trong acc Staff`, async () => {
        await expect(await analyticsSBCreator.genLoc(analyticsSBCreator.xpathAnalytic)).toBeVisible();
      });
    });
  }
});
