import { test } from "@core/fixtures";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { General } from "@pages/dashboard/general";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { chromium, expect, Page } from "@playwright/test";
import type { Card, DataAnalytics, ShippingAddress } from "@types";
import { HivePBase } from "@pages/hive/hivePBase";
import { loadData } from "@core/conf/conf";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { AccountPage } from "@pages/dashboard/accounts";
import {
  AbandonedInfo,
  OrderConversionFunnel,
} from "tests/modules/dashboard/analytics/general_analytics/general_analytics";
import { SFApps } from "@pages/storefront/apps";
import { MultipleSF } from "@pages/storefront/multiple_storefronts";
import { OcgLogger } from "@core/logger";
import { getTokenWithCredentials, TokenType } from "@core/utils/token";
import { Guerilla } from "@helper/guerilla_mail";

const logger = OcgLogger.get();

test.use({ actionTimeout: 120000 });

const goToPage = async (page: Page, domain: string, referrerLink: string) => {
  await page.goto(`https://${domain}/products/va-hg117${referrerLink}`);
  await checkout.waitForEventCompleted(domain, "view_content");
};

const checkoutProduct = async (
  page: Page,
  shippingInfo: ShippingAddress,
  cardInfo: Card,
  checkout: SFCheckout,
  homepage: SFHome,
  domain: string,
) => {
  const prePurchaseCheckout = "//button[contains(@class, 'pre-purchase')]";
  await page
    .locator(
      "//div[@id='addToCartForm' or @class='product__form']//button[descendant::span[normalize-space()='Add to cart']]",
    )
    .click();
  await checkout.waitForEventCompleted(domain, "add_to_cart");
  await page.waitForSelector(`//h1[normalize-space()='Cart'] | ${prePurchaseCheckout} | //button[@name='checkout']`);
  if (await page.locator(prePurchaseCheckout).isVisible()) {
    await page.click(prePurchaseCheckout);
  } else {
    await homepage.gotoCheckout();
  }
  await checkout.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
  await checkout.enterShippingAddress(shippingInfo);
  await checkout.continueToPaymentMethod();
  await checkout.page.locator("//*[text()='Place your order' or text()='Complete order']").scrollIntoViewIfNeeded();
  await checkout.page.waitForSelector('(//*[contains(@class,"payment")])[last()]');
  await checkout.completeOrderWithCardInfo(cardInfo);
  await checkout.waitAbit(1000);
  while (await checkout.genLoc('//a[text()="Please click here to try again"]').isVisible()) {
    await checkout.page.reload();
    await checkout.page.waitForLoadState("networkidle");
    await checkout.page.waitForSelector(checkout.xpathZipCode);
    await checkout.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
    await checkout.enterShippingAddress(shippingInfo);
    await checkout.continueToPaymentMethod();
    await checkout.page.locator("//*[text()='Place your order' or text()='Complete order']").scrollIntoViewIfNeeded();
    await checkout.page.waitForSelector('(//*[contains(@class,"payment")])[last()]');
    await checkout.completeOrderWithCardInfo(cardInfo);
    await checkout.waitAbit(1000);
  }
  await checkout.page.waitForSelector(checkout.xpathThankYou);
};

const verifyDataAnalytics = async (
  dataAnalyticsAfter: DataAnalytics,
  dataAnalyticsBefore: DataAnalytics,
  dataUpdate,
  amountChange: number,
) => {
  const actualTotalProfit = dataAnalyticsAfter.summary.total_profit;
  const expectTotalProfit = dataAnalyticsBefore.summary.total_profit + amountChange;
  const aop = Math.round((actualTotalProfit / dataAnalyticsAfter.summary.total_orders) * 100) / 100;
  const aoi =
    Math.round((dataAnalyticsAfter.summary.total_items / dataAnalyticsAfter.summary.total_orders) * 100) / 100;

  logger.info(`-----> Profit of actual = ${actualTotalProfit}`);
  logger.info(`-----> Profit of expect = ${expectTotalProfit}`);
  logger.info(`Do lech Profit = ${expectTotalProfit - actualTotalProfit}`);
  expect(expectTotalProfit - actualTotalProfit >= -0.05 && expectTotalProfit - actualTotalProfit <= 0.05).toEqual(true);
  expect(
    aop - dataAnalyticsAfter.summary.total_aop >= -0.05 && aop - dataAnalyticsAfter.summary.total_aop <= 0.05,
  ).toEqual(true);
  expect(
    aoi - dataAnalyticsAfter.summary.total_aoi >= -0.05 && aoi - dataAnalyticsAfter.summary.total_aoi <= 0.05,
  ).toEqual(true);
  expect(dataAnalyticsAfter.summary.total_orders).toEqual(
    dataAnalyticsBefore.summary.total_orders + dataUpdate.total_orders_update,
  );
  expect(dataAnalyticsAfter.summary.view_content).toEqual(
    dataAnalyticsBefore.summary.view_content + dataUpdate.view_content_update,
  );
  expect(dataAnalyticsAfter.summary.session_convert).toEqual(
    dataAnalyticsBefore.summary.session_convert + dataUpdate.session_converted_update,
  );
};

let cardInfo;
let shippingInfo;
let homepage: SFHome;
let checkout: SFCheckout;
let generalAnalytics: AnalyticsPage;
let initData: DataAnalytics;
let amountChange: number;
let amountChangeNew: number;
let dataAnalyticsBefore: DataAnalytics;
let dataAnalyticsAfter: DataAnalytics;
let orders: OrdersPage;
let timeZoneShop;
let today;
let purchaseStatus;
let storeFront;
let sfList;
let orderInit: OrderConversionFunnel;
let orderRecoveryBefore: OrderConversionFunnel;
let orderRecoveryAfter: OrderConversionFunnel;
let upsell: SFApps;

test.beforeEach(async ({ conf, dashboard, page }) => {
  test.setTimeout(conf.suiteConf.time_out_tc);
  cardInfo = conf.suiteConf.card_info;
  shippingInfo = conf.suiteConf.customer_info;
  homepage = new SFHome(page, conf.suiteConf.domain);
  generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
  initData = conf.suiteConf.data_analytics;
  orders = new OrdersPage(dashboard, conf.suiteConf.domain);
  timeZoneShop = conf.suiteConf.time_zone;
  today = new Date().toLocaleDateString(conf.suiteConf.locale_format, { timeZone: timeZoneShop });
  storeFront = new MultipleSF(dashboard);
  sfList = conf.suiteConf.domain_sf;
  orderInit = conf.caseConf.data_abandoned;
});

test.describe("Verify feature show analytics in timezone", async () => {
  test(`Verify feature show analytics in timezone @SB_ANA_SB_ANA_REFACTOR_PBASE_3`, async ({
    conf,
    dashboard,
    page,
    authRequest,
  }) => {
    const shopbaseGeneral = new General(dashboard, conf.suiteConf.domain);
    const domain = conf.suiteConf.domain;
    const username = conf.suiteConf.username;
    const password = conf.suiteConf.password;
    const userId = conf.suiteConf.user_id;
    const tokenType = TokenType.ShopToken;
    await test.step(`Checkout product in Storefront`, async () => {
      checkout = new SFCheckout(page, conf.suiteConf.domain);
      await goToPage(page, conf.suiteConf.domain, "");
      await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage, conf.suiteConf.domain);
      const orderId = await checkout.getOrderIdBySDK();
      await orders.goToOrderByOrderId(orderId, "pbase");
      await orders.waitForProfitCalculated();
      await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
      await shopbaseGeneral.chooseTimezone(conf.caseConf.data[2].time_zone);
      await shopbaseGeneral.saveChanged();
    });
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const timeZoneData = conf.caseConf.data[i];
      await test.step(`Change timezone in General`, async () => {
        await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
        await shopbaseGeneral.chooseTimezone(timeZoneData.time_zone);
        await shopbaseGeneral.saveChanged();
        await shopbaseGeneral.page.waitForSelector(shopbaseGeneral.xpathToastMessage);
        await shopbaseGeneral.page.waitForSelector(shopbaseGeneral.xpathToastMessage, { state: "hidden" });
      });

      await test.step(`Verify charts time in Analytics dashboard`, async () => {
        await shopbaseGeneral.page.waitForTimeout(3000);
        const timezoneOffset = await generalAnalytics.convertDayTime(timeZoneData.time_zone);
        const today = new Date().toLocaleDateString("fr-CA", { timeZone: timeZoneData.time_zone });
        await shopbaseGeneral.navigateToMenu("Analytics");
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
          "total_profit",
          today,
          shopToken.access_token,
        );
        expect(timezoneOffset).toEqual(getTimezoneOnAna);
      });
    }
  });
});

test.describe("Verify filter days at dashboard Analytics", async () => {
  test(`Verify analytics with filter date @SB_ANA_SB_ANA_REFACTOR_PBASE_4`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    let dataFrom2Days;
    let dataFrom1Days;
    let objDashboard;
    const dayChanges = conf.caseConf.day_changes;
    const analyticsDashboard = conf.caseConf.data_init_dashboards;
    const shopbaseGeneral = new General(dashboard, conf.suiteConf.domain);

    await test.step(`Get data from 2 days ago`, async () => {
      await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
      await shopbaseGeneral.chooseTimezone(conf.caseConf.time_zone);
      await shopbaseGeneral.saveChanged();
      const twoDaysAgo = await generalAnalytics.formatDate(await generalAnalytics.getDateXDaysAgo(2));
      dataFrom2Days = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        twoDaysAgo,
        initData,
        "total_profit",
      );
    });

    await test.step(`Get data from 1 day ago`, async () => {
      const oneDayAgo = await generalAnalytics.formatDate(await generalAnalytics.getDateXDaysAgo(1));
      dataFrom1Days = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        oneDayAgo,
        initData,
        "total_profit",
      );
    });

    await test.step(`Filter with data with 2 days along ago`, async () => {
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.filterDateOnAna(dayChanges);
      objDashboard = await generalAnalytics.getDataFromDashboard("profits", analyticsDashboard);
    });

    await test.step(`Verify analytics with filter on dashboard`, async () => {
      let totalProfitsAPI =
        Math.round((dataFrom2Days.summary.total_profit + dataFrom1Days.summary.total_profit) * 100) / 100;
      let totalOrderAPI = dataFrom2Days.summary.total_orders + dataFrom1Days.summary.total_orders;
      let viewContentAPI = dataFrom2Days.summary.view_content + dataFrom1Days.summary.view_content;
      let sessionConvertedAPI = dataFrom2Days.summary.session_convert + dataFrom1Days.summary.session_convert;
      let conversionRateAPI = Math.round((sessionConvertedAPI / viewContentAPI) * 100 * 100) / 100;

      !totalProfitsAPI ? (totalProfitsAPI = 0) : totalProfitsAPI;
      !totalOrderAPI ? (totalOrderAPI = 0) : totalOrderAPI;
      !viewContentAPI ? (viewContentAPI = 0) : viewContentAPI;
      !sessionConvertedAPI ? (sessionConvertedAPI = 0) : sessionConvertedAPI;
      !conversionRateAPI ? (conversionRateAPI = 0) : conversionRateAPI;

      expect([
        Math.round((totalProfitsAPI + 0.01) * 100) / 100,
        totalProfitsAPI,
        Math.round((totalProfitsAPI - 0.01) * 100) / 100,
      ]).toContainEqual(objDashboard.profits);
      expect(totalOrderAPI).toEqual(objDashboard.total_orders);
      expect(conversionRateAPI).toEqual(objDashboard.conversion_rate);
    });
  });
});

test.describe("Verify data Analytics show on chart", async () => {
  test("Verify data Analytics count up @SB_ANA_SB_ANA_REFACTOR_PBASE_9", async ({ page, conf, authRequest }) => {
    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step(`get data analytic before checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });

      await test.step(`Checkout product in Storefront`, async () => {
        await goToPage(page, storefront, "");
        await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage, storefront);
        const orderId = await checkout.getOrderIdBySDK();
        await orders.goToOrderByOrderId(orderId, "pbase");
        await orders.waitForProfitCalculated();
        amountChange = parseFloat((await orders.getProfit()).split("$")[1]);
      });

      await test.step(`Check Analytics on dashboard ShopBase`, async () => {
        do {
          await generalAnalytics.waitAbit(3000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_profit",
          );
        } while (dataAnalyticsBefore.summary.total_profit == dataAnalyticsAfter.summary.total_profit);
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, amountChange);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_PBASE_10 Kiểm tra các chart Total profits, Conversion rate, Total orders đối với trường hợp refund order For Buyer trong PrintBase`, async ({
    page,
    conf,
    authRequest,
    hivePBase,
    dashboard,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }

    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
      await test.step(`get data analytic before checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });

      await test.step(`Checkout với product "Super test Product on ShopBase" `, async () => {
        await goToPage(page, storefront, "");
        await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage, storefront);
        const orderId = await checkout.getOrderIdBySDK();
        await orders.goToOrderByOrderId(orderId, "pbase");
        await orders.waitForProfitCalculated();
        amountChange = parseFloat((await orders.getProfit()).split("$")[1]);
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
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert);
      });

      await test.step(`Refund for Buyer trên hive pbase`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
        const infoCheckout = await checkout.getOrderInfoAfterCheckout();
        const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
        await hivePbase.goToOrderDetail(infoCheckout.orderId, "pbase-order");
        do {
          purchaseStatus = (await hivePBase.textContent('//h6[contains(text(),"Purchase status")]')).trim();
          await hivePBase.reload();
          await hivePBase.waitForLoadState("networkidle");
        } while (purchaseStatus != "Purchase status: unpaid");
        await hivePbase.approveOrderInHive();
        await hivePBase.waitForSelector(hivePbase.successAlert);
        await hivePbase.inputInformationOfOrderToRefundPbase(
          conf.caseConf.product_field_refund,
          infoCheckout.orderId,
          conf.caseConf.product_refund,
        );
        await hivePBase.waitForSelector(hivePbase.refunedAlert);
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(3000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit);
        await orders.goToOrderByOrderId(infoCheckout.orderId, "pbase");
        amountChange = parseFloat(conf.caseConf.product_field_refund.buyer.refund_selling_price) * -1;
        dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });
      await test.step(`Check Analytics trong dashboard PrintBase`, async () => {
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, amountChange);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_PBASE_11 Kiểm tra các chart Total profits, Conversion rate, Total orders đối với trường hợp refund order For Seller trong PrintBase`, async ({
    page,
    conf,
    authRequest,
    hivePBase,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    const refundSeller = conf.caseConf.product_field_refund.seller;

    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step(`get data analytic before checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });

      await test.step(`Checkout với product "Super test Product on ShopBase" `, async () => {
        await goToPage(page, storefront, "");
        await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage, storefront);
        const orderId = await checkout.getOrderIdBySDK();
        await orders.goToOrderByOrderId(orderId, "pbase");
        await orders.waitForProfitCalculated();
        amountChange = parseFloat((await orders.getProfit()).split("$")[1]);
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
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert);
      });

      await test.step(`Refund for Seller trên hive pbase`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
        const infoCheckout = await checkout.getOrderInfoAfterCheckout();
        const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
        await hivePbase.goToOrderDetail(infoCheckout.orderId, "pbase-order");
        if (await hivePbase.page.isVisible('//button[normalize-space()="Calculate"]')) {
          await hivePBase.click('//button[normalize-space()="Calculate"]');
        }
        await hivePBase.waitForTimeout(1000);
        do {
          purchaseStatus = (await hivePBase.textContent('//h6[contains(text(),"Purchase status")]')).trim();
          await hivePBase.reload();
          await hivePBase.waitForLoadState("networkidle");
        } while (purchaseStatus != "Purchase status: unpaid");
        do {
          await hivePbase.approveOrderInHive();
          await hivePbase.page.waitForTimeout(900);
        } while (await hivePbase.page.isHidden(hivePbase.successAlert));
        await hivePbase.inputInformationOfOrderToRefundPbase(
          conf.caseConf.product_field_refund,
          infoCheckout.orderId,
          conf.caseConf.product_refund,
        );
        while (await hivePbase.page.isHidden(hivePbase.refunedAlert)) {
          await hivePbase.page
            .locator("//div[child::label[text()='Refund processing fee']]//following-sibling::div//input")
            .fill(conf.caseConf.product_field_refund.seller.refund_processing_fee);
          await hivePbase.page.waitForTimeout(800);
          await hivePbase.genLoc("//button[@class='btn btn-danger']").click();
          await hivePbase.page.waitForTimeout(1000);
        }
        await hivePBase.waitForSelector(hivePbase.refunedAlert);
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(3000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit);
        await orders.goToOrderByOrderId(infoCheckout.orderId, "pbase");
        amountChange =
          +refundSeller.refund_base_cost + +refundSeller.refund_processing_fee + +refundSeller.refund_payment_fee;
      });

      await test.step(`Check Analytics trong dashboard PrintBase`, async () => {
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, amountChange);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_PBASE_12 Kiểm tra các chart Total profits, Conversion rate, Total orders đối với trường hợp partially refund order For Seller và Buyer trong PrintBase`, async ({
    page,
    conf,
    authRequest,
    hivePBase,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }

    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step(`get data analytic before checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });

      await test.step(`Checkout với product "Super test Product on ShopBase" `, async () => {
        await goToPage(checkout.page, storefront, "");
        await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage, storefront);
        const orderId = await checkout.getOrderIdBySDK();

        await orders.goToOrderByOrderId(orderId, "pbase");
        await orders.waitForProfitCalculated();
        amountChange = parseFloat((await orders.getProfit()).split("$")[1]);
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForLoadState("networkidle");
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        do {
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(1000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_profit",
          );
        } while (
          dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert ||
          dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit
        );
      });

      await test.step(`Refund for Buyer trên hive pbase`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
        logger.info(`-----> Data before refund = ${JSON.stringify(dataAnalyticsBefore.summary)}`);
        const infoCheckout = await checkout.getOrderInfoAfterCheckout();
        const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
        await hivePbase.goToOrderDetail(infoCheckout.orderId, "pbase-order");
        if (await hivePbase.page.isVisible('//button[normalize-space()="Calculate"]')) {
          await hivePBase.click('//button[normalize-space()="Calculate"]');
        }
        await hivePBase.waitForTimeout(1000);
        do {
          purchaseStatus = (await hivePBase.textContent('//h6[contains(text(),"Purchase status")]')).trim();
          await hivePBase.reload();
          await hivePBase.waitForLoadState("networkidle");
        } while (purchaseStatus != "Purchase status: unpaid");
        await hivePbase.approveOrderInHive();
        await hivePBase.waitForSelector(hivePbase.successAlert);
        await hivePbase.inputInformationOfOrderToRefundPbase(
          conf.caseConf.product_field_refund,
          infoCheckout.orderId,
          conf.caseConf.product_refund,
        );
        while (await hivePbase.page.isHidden(hivePbase.refunedAlert)) {
          await hivePbase.page
            .locator("//div[child::label[text()='Refund processing fee']]//following-sibling::div//input")
            .fill(conf.caseConf.product_field_refund.seller.refund_processing_fee);
          await hivePbase.page.waitForTimeout(800);
          await hivePbase.genLoc("//button[@class='btn btn-danger']").click();
          await hivePbase.page.waitForTimeout(1000);
        }
        await hivePBase.waitForSelector(hivePbase.refunedAlert);
        do {
          await orders.goToOrderByOrderId(infoCheckout.orderId, "pbase");
          amountChangeNew = parseFloat((await orders.getProfit()).split("$")[1]) - amountChange;
        } while (amountChangeNew >= amountChange);
        logger.info(`-----> Gia tri thay doi = ${amountChangeNew}`);
        do {
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForLoadState("networkidle");
          // await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
          // wait vài giây cho hệ thống sync data trong DB
          await generalAnalytics.waitAbit(2000);
          dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit);
        await generalAnalytics.waitAbit(5000);
        logger.info(`-----> Data after = ${JSON.stringify(dataAnalyticsAfter.summary)}`);
        dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
        logger.info(`-----> Data after = ${JSON.stringify(dataAnalyticsAfter.summary)}`);
      });

      await test.step(`Check Analytics trong dashboard PrintBase`, async () => {
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, amountChangeNew);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_PBASE_13 Kiểm tra các chart Total profits, Conversion rate, Total orders đối với trường hợp fully refund order For Seller và Buyer trong PrintBase`, async ({
    page,
    conf,
    authRequest,
    hivePBase,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }

    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      checkout = new SFCheckout(page, storefront);
      await test.step(`get data analytic before checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });

      await test.step(`Checkout với product "Super test Product on ShopBase" `, async () => {
        await goToPage(page, storefront, "");
        await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage, storefront);
        const orderId = await checkout.getOrderIdBySDK();
        await orders.goToOrderByOrderId(orderId, "pbase");
        await orders.waitForProfitCalculated();
        amountChange = parseFloat((await orders.getProfit()).split("$")[1]);
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
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert);
      });

      await test.step(`Refund for Buyer trên hive pbase`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
        logger.info(`-----> Data before refund = ${JSON.stringify(dataAnalyticsBefore.summary)}`);
        const infoCheckout = await checkout.getOrderInfoAfterCheckout();
        const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
        await hivePbase.goToOrderDetail(infoCheckout.orderId, "pbase-order");
        if (await hivePbase.page.isVisible('//button[normalize-space()="Calculate"]')) {
          await hivePBase.click('//button[normalize-space()="Calculate"]');
        }
        await hivePBase.waitForTimeout(1000);
        do {
          purchaseStatus = (await hivePBase.textContent('//h6[contains(text(),"Purchase status")]')).trim();
          await hivePBase.reload();
          await hivePBase.waitForLoadState("networkidle");
        } while (purchaseStatus != "Purchase status: unpaid");
        do {
          await hivePbase.approveOrderInHive();
          await hivePbase.page.waitForTimeout(900);
        } while (await hivePbase.page.isHidden(hivePbase.successAlert));
        await hivePbase.inputInformationOfOrderToRefundPbase(
          conf.caseConf.product_field_refund,
          infoCheckout.orderId,
          conf.caseConf.product_refund,
        );
        while (await hivePbase.page.isHidden(hivePbase.refunedAlert)) {
          await hivePbase.page
            .locator("//div[child::label[text()='Refund processing fee']]//following-sibling::div//input")
            .fill(conf.caseConf.product_field_refund.seller.refund_processing_fee);
          await hivePbase.page.waitForTimeout(800);
          await hivePbase.genLoc("//button[@class='btn btn-danger']").click();
          await hivePbase.page.waitForTimeout(1000);
        }
        await hivePBase.waitForSelector(hivePbase.refunedAlert);
        do {
          await orders.goToOrderByOrderId(infoCheckout.orderId, "pbase");
          amountChangeNew = parseFloat((await orders.getProfit()).split("$")[1]) - amountChange;
        } while (amountChangeNew >= amountChange);
        logger.info(`-----> Gia tri thay doi = ${amountChangeNew}`);
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
            "total_profit",
          );
        } while (dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit);
        await generalAnalytics.waitAbit(5000);
        logger.info(`-----> Data after = ${JSON.stringify(dataAnalyticsAfter.summary)}`);
        dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
        logger.info(`-----> Data after = ${JSON.stringify(dataAnalyticsAfter.summary)}`);
      });

      await test.step(`Check Analytics trong dashboard PrintBase`, async () => {
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, amountChangeNew);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_REFACTOR_PBASE_16 Kiểm tra chart Abandoned checkout khi Buyer nhập thông tin trong trang checkout và close browser`, async ({
    page,
    dashboard,
    conf,
    scheduler,
    authRequest,
  }) => {
    let scheduleData: AbandonedInfo;
    let account: AccountPage;
    upsell = new SFApps(page, conf.suiteConf.domain);
    let i = 0;
    shippingInfo = conf.caseConf.customer_info;
    generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);

    await test.step(`Make abandoned checkout`, async () => {
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
            "total_profit",
          );
          checkout = new SFCheckout(page, storefront);
          await goToPage(page, storefront, "");
          await checkout.page.reload();
          await checkout.waitResponseWithUrl("/assets/theme.css", 60000);
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
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 160000 });
          do {
            // wait vài giây cho hệ thống sync data trong DB
            await generalAnalytics.page.waitForTimeout(2000);
            dataAnalyticsAfter = await generalAnalytics.getDataAnalyticsAPIDashboard(
              authRequest,
              conf.suiteConf.shop_id,
              today,
              initData,
              "total_profit",
            );
          } while (
            dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
            dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
            dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content
          );
          expect(dataAnalyticsAfter.summary.total_profit).toBe(dataAnalyticsBefore.summary.total_profit);
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
            "total_profit",
          );
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
        await test.step(`Finish abandoned checkout after received abandoned sms/email`, async () => {
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForLoadState("networkidle");
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
          dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
            authRequest,
            conf.suiteConf.shop_id,
            today,
            initData,
            "total_profit",
          );
          if (i == 0) {
            orderRecoveryBefore = await generalAnalytics.getQuantityOfOrderRecoveryByEmail(
              authRequest,
              today,
              today,
              conf.suiteConf.shop_id,
              "total_profit",
              orderInit,
            );
          } else {
            orderRecoveryBefore = await generalAnalytics.getQuantityOfOrderRecoveryByOther(
              authRequest,
              today,
              today,
              conf.suiteConf.shop_id,
              "total_profit",
              orderInit,
            );
          }
          logger.info(`Data Analytics Before = ${dataAnalyticsBefore.summary.total_profit}`);
          if (i == 1) {
            checkoutUrl = scheduleData.url;
          }
          const checkoutNew = new SFCheckout(page, storefront);
          await checkoutNew.goto(checkoutUrl);
          await checkoutNew.page.waitForLoadState("domcontentloaded");
          await checkoutNew.page.waitForSelector(checkoutNew.xpathZipCode);
          try {
            await checkoutNew.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
          } catch {
            await checkoutNew.page.waitForSelector(checkoutNew.appliedCoupon);
          }
          await checkoutNew.enterShippingAddress(shippingInfo[i]);
          await checkoutNew.continueToPaymentMethod();
          await checkoutNew.completeOrderWithMethod("Stripe");
          await expect(checkoutNew.page.locator(checkoutNew.xpathPayment)).toBeHidden({ timeout: 120000 });
          if (await checkoutNew.page.locator(checkoutNew.xpathClosePPCPopUp).isVisible()) {
            await checkoutNew.closePostPurchase();
          }
          expect(checkoutNew.thankyouPageLoc).toBeTruthy();
          if (i == 1) {
            await scheduler.clear();
          }
          const orderId = await checkoutNew.getOrderIdBySDK();
          await orders.goToOrderByOrderId(orderId, "pbase");
          await orders.waitForProfitCalculated();
          amountChange = parseFloat((await orders.getProfit()).split("$")[1]);
          logger.info(`Gia tri them = ${amountChange}`);
        });

        await test.step(`Check Analytics trong dashboard PrintBase`, async () => {
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
              "total_profit",
            );
          } while (dataAnalyticsAfter.summary.session_convert == dataAnalyticsBefore.summary.session_convert);
          logger.info(`Data Analytics After = ${dataAnalyticsAfter.summary.total_profit}`);
          await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, amountChange);
          do {
            // wait vài giây cho hệ thống sync data trong DB
            await generalAnalytics.waitAbit(2000);
            if (i == 0) {
              orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByEmail(
                authRequest,
                today,
                today,
                conf.suiteConf.shop_id,
                "total_profit",
                orderInit,
              );
            } else {
              orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByOther(
                authRequest,
                today,
                today,
                conf.suiteConf.shop_id,
                "total_profit",
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
                  "total_profit",
                  orderInit,
                );
              } else {
                orderRecoveryAfter = await generalAnalytics.getQuantityOfOrderRecoveryByOther(
                  authRequest,
                  today,
                  today,
                  conf.suiteConf.shop_id,
                  "total_profit",
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

test.describe("Verify permission in Analytics of staff", async () => {
  let account: AccountSetting;
  let mail: Guerilla;
  let newAccount: AccountPage;
  const logOut = "//a[@href='/admin/logout' and not(ancestor::header)]";
  const logInTitle = "//div[@class='unite-ui-login__title']";
  const xpathStaffAccount = "//a[contains(@href,'/admin/settings/account/') and @class='staff-link']";
  const caseID = "PER_ACC";
  const conf = loadData(__dirname, caseID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      staff: staff,
      staff_name: staffName,
      username: username,
      password: password,
      unpermissions: unPermissions,
      menu_unpermissions: menuUnpermissions,
      acc_name: accName,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ dashboard, page, conf }) => {
        await test.step(`Truy cập Account section trong Settings, add staff account`, async () => {
          account = new AccountSetting(dashboard, conf.suiteConf.domain);
          await account.goToAccountSetting();
          //delete all staff account if previous time run failed
          if ((await dashboard.locator(xpathStaffAccount).count()) > 0) {
            await account.deleteAllStaffAccount(conf.suiteConf.password);
            expect(await dashboard.locator(xpathStaffAccount).count()).toEqual(0);
          }
          if (caseID == "SB_ANA_SB_ANA_REFACTOR_PBASE_19") {
            await account.addStaffAccountFullPermissions(staff);
          } else if (caseID == "SB_ANA_SB_ANA_REFACTOR_PBASE_20") {
            await account.addStaffAccountNotFullPermissions(staff, unPermissions);
            await account.goToAccountSetting();
            await account.addStaffAccountFullPermissions("quanle1+3@beeketing.net");
          }
          // Check mail qua Guerilla
          mail = new Guerilla(page);
          await mail.accessMail(staffName);
          await mail.readMailWithContent(conf.suiteConf.shop_name, conf.suiteConf.invite_content, "");
          await mail.page.click(mail.createStaffAccLink);
        });
        await test.step(`Đăng nhập dashboard bằng staff account, và thử truy cập các quyền`, async () => {
          await dashboard.click(`//p[text()="${conf.suiteConf.domain}"]`);
          await dashboard.click(logOut);
          await dashboard.waitForSelector(logInTitle);
          newAccount = new AccountPage(dashboard, conf.suiteConf.domain);
          await newAccount.login({ email: username, password: password });
          await newAccount.page.waitForSelector(`//*[.="${accName}"]`, { timeout: 120000 });
          await newAccount.waitAbit(2000);
          await newAccount.goto(`/admin/`);
          await newAccount.page.waitForSelector(newAccount.xpathNotify, { timeout: 150000 });
          if (caseID == "SB_ANA_SB_ANA_REFACTOR_PBASE_19") {
            for (let i = 1; i < (await dashboard.locator("//li/a[@class='text-decoration-none']").count()) + 1; i++) {
              expect(
                await dashboard.locator(`(//li/a[@class="text-decoration-none"])[${i}]`).getAttribute("href"),
              ).not.toContain("/admin/no_access");
            }
          } else if (caseID == "SB_ANA_SB_ANA_REFACTOR_PBASE_20") {
            for (let i = 0; i < menuUnpermissions.length; i++) {
              expect(
                await dashboard
                  .locator(`//span[normalize-space()="${menuUnpermissions[i]}"]/../../parent::a`)
                  .getAttribute("href"),
              ).toContain("/admin/no_access");
            }
            await mail.accessMail("quanocg");
            await mail.readMailWithContent(conf.suiteConf.shop_name, conf.suiteConf.invite_content, "");
            await mail.page.click(mail.createStaffAccLink);
          }
        });
      });
    },
  );
});
