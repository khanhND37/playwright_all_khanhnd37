import { test } from "@core/fixtures";
import { OrderAPI } from "@pages/api/order";
import { ProductAPI } from "@pages/api/product";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { General } from "@pages/dashboard/general";
import { SFApps } from "@pages/storefront/apps";
import { SFCheckout } from "@pages/storefront/checkout";
import { chromium, expect, Page } from "@playwright/test";
import type { DataAnalytics } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { AccountPage } from "@pages/dashboard/accounts";
import type {
  AbandonedInfo,
  OrderConversionFunnel,
} from "tests/modules/dashboard/analytics/general_analytics/general_analytics";
import { MultipleSF } from "@pages/storefront/multiple_storefronts";
import { getTokenWithCredentials, TokenType } from "@core/utils/token";
import { OcgLogger } from "@core/logger";
import { Guerilla } from "@helper/guerilla_mail";

const logger = OcgLogger.get();

const goToPage = async (page: Page, domain: string, productHandle: string, referrerLink: string) => {
  await page.goto(`https://${domain}/products/${productHandle}${referrerLink}`);
  await page.waitForLoadState("networkidle");
};

const verifyDataAnalytics = async (
  dataAnalyticsAfter: DataAnalytics,
  dataAnalyticsBefore: DataAnalytics,
  dataUpdate,
  amountChange,
) => {
  for (const key in dataAnalyticsAfter) {
    const expectTotalProfit = dataAnalyticsAfter[key].total_profit;
    let actualTotalProfit;
    actualTotalProfit = Math.round((dataAnalyticsBefore[key].total_profit + amountChange[key].profit) * 100) / 100;
    const profitSummary =
      Math.round((dataAnalyticsBefore.summary.total_profit + amountChange.summary.profit) * 100) / 100;
    const itemsSummary =
      Math.round((dataAnalyticsBefore.summary.total_items + dataUpdate.total_items_update) * 100) / 100;
    if (key !== "summary") {
      actualTotalProfit = Math.round((dataAnalyticsBefore[key].total_profit + amountChange[key].profit) * 100) / 100;
    }
    const aop = Math.round((profitSummary / dataAnalyticsAfter.summary.total_orders) * 100) / 100;
    const aoi = Math.round((itemsSummary / dataAnalyticsAfter.summary.total_orders) * 100) / 100;

    expect(
      Math.round((expectTotalProfit - actualTotalProfit) * 100) / 100 >= -0.05 &&
        Math.round((expectTotalProfit - actualTotalProfit) * 100) / 100 <= 0.05,
    ).toEqual(true);
    expect(
      Math.round((aop - dataAnalyticsAfter.summary.total_aop) * 100) / 100 >= -0.05 &&
        Math.round((aop - dataAnalyticsAfter.summary.total_aop) * 100) / 100 <= 0.05,
    ).toEqual(true);
    expect(
      Math.round((aoi - dataAnalyticsAfter.summary.total_aoi) * 100) / 100 >= -0.05 &&
        Math.round((aoi - dataAnalyticsAfter.summary.total_aoi) * 100) / 100 <= 0.05,
    ).toEqual(true);
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
};

test.describe("Verify feature show analytics in timezone", async () => {
  test(`Verify feature show analytics in timezone @SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_3`, async ({
    conf,
    dashboard,
    page,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    let dataAnalyticsBefore: DataAnalytics;
    let dataAnalyticsAfter: DataAnalytics;
    const cardInfo = conf.suiteConf.card_info;
    const shippingInfo = conf.suiteConf.customer_info;
    const generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    const timeZoneShop = conf.suiteConf.time_zone;
    const today = new Date().toLocaleDateString("fr-CA", { timeZone: timeZoneShop });
    const initData: DataAnalytics = conf.suiteConf.data_analytics;
    const shopbaseGeneral = new General(dashboard, conf.suiteConf.domain);

    await test.step(`Checkout product in Storefront`, async () => {
      dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_profit",
      );
      const upsell = new SFApps(page, conf.suiteConf.domain);
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      await goToPage(page, conf.suiteConf.domain, conf.suiteConf.product_handle, "");
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, upsell, conf.suiteConf.product_upsell);
      if (await checkout.page.locator(checkout.xpathClosePPCPopUp).isVisible()) {
        await checkout.closePostPurchase();
      }
      expect(checkout.thankyouPageLoc).toBeTruthy();
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
      } while (
        dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
        dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
        dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
        dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit
      );
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
      });

      await test.step(`Verify charts time in Analytics dashboard`, async () => {
        await generalAnalytics.gotoAnalytics();
        await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 60000 });
        const timezoneOffset = await generalAnalytics.convertDayTime(timeZoneData.time_zone);
        const today = new Date().toLocaleDateString("fr-CA", { timeZone: timeZoneData.time_zone });
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
  test(`Verify analytics with filter date @SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_4`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    let dataFrom2Days;
    let dataFrom1Days;
    let objDashboard;
    const dayChanges = conf.caseConf.day_changes;
    const initData: DataAnalytics = conf.suiteConf.data_analytics;
    const analyticsDashboard = conf.caseConf.data_init_dashboards;
    const generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    const shopbaseGeneral = new General(dashboard, conf.suiteConf.domain);

    await test.step(`Precondition`, async () => {
      await shopbaseGeneral.page.goto(`https://${conf.suiteConf.domain}/admin/settings/general`);
      await shopbaseGeneral.chooseTimezone(conf.caseConf.time_zone);
      await shopbaseGeneral.saveChanged();
    });

    await test.step(`Get data from 2 days ago`, async () => {
      const twoDaysAgo = await generalAnalytics.formatDate(await generalAnalytics.getDateXDaysAgo(2));
      dataFrom2Days = await generalAnalytics.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        twoDaysAgo,
        initData,
        "total_profit",
      );
      expect(dataFrom2Days).toBeTruthy();
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
      expect(dataFrom1Days).toBeTruthy();
    });

    await test.step(`Filter with data with 2 days along ago`, async () => {
      await generalAnalytics.gotoAnalytics();
      await generalAnalytics.filterDateOnAna(dayChanges);
      objDashboard = await generalAnalytics.getDataFromDashboard("profits", analyticsDashboard);
      expect(objDashboard).toBeTruthy();
    });

    await test.step(`Verify analytics with filter on dashboard`, async () => {
      let totalProfitAPI =
        Math.round((dataFrom2Days.summary.total_profit + dataFrom1Days.summary.total_profit) * 100) / 100;
      let totalOrderAPI = dataFrom2Days.summary.total_orders + dataFrom1Days.summary.total_orders;
      let viewContentAPI = dataFrom2Days.summary.view_content + dataFrom1Days.summary.view_content;
      let sessionConvertedAPI = dataFrom2Days.summary.session_convert + dataFrom1Days.summary.session_convert;
      let conversionRateAPI = Math.round((sessionConvertedAPI / viewContentAPI) * 100 * 100) / 100;

      !totalProfitAPI ? (totalProfitAPI = 0) : totalProfitAPI;
      !totalOrderAPI ? (totalOrderAPI = 0) : totalOrderAPI;
      !viewContentAPI ? (viewContentAPI = 0) : viewContentAPI;
      !sessionConvertedAPI ? (sessionConvertedAPI = 0) : sessionConvertedAPI;
      !conversionRateAPI ? (conversionRateAPI = 0) : conversionRateAPI;

      expect(
        Math.round((totalProfitAPI - objDashboard.profits) * 100) / 100 >= -0.01 &&
          Math.round((totalProfitAPI - objDashboard.profits) * 100) / 100 <= 0.01,
      ).toEqual(true);
      expect(totalOrderAPI).toEqual(objDashboard.total_orders);
      expect(conversionRateAPI).toEqual(objDashboard.conversion_rate);
    });
  });
});

test.describe("Verify data Analytics show on chart", async () => {
  test("Verify data Analytics count up @SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_9", async ({
    dashboard,
    page,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const cardInfo = conf.suiteConf.card_info;
    const shippingInfo = conf.suiteConf.customer_info;
    const initData: DataAnalytics = conf.suiteConf.data_analytics;
    const timeZoneShop = conf.suiteConf.time_zone;
    const prodHandle = conf.suiteConf.product_handle;
    const upsellHandle = conf.suiteConf.upsell_handle;
    const generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    const upsell = new SFApps(page, conf.suiteConf.domain);
    const checkout = new SFCheckout(page, conf.suiteConf.domain);
    const orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const storeFront = new MultipleSF(dashboard);
    const today = new Date().toLocaleDateString("fr-CA", { timeZone: timeZoneShop });
    let lineItemRaw;
    let dataAnalyticsBefore;
    const sfList = conf.suiteConf.domain_sf;

    await storeFront.verifyExistMultiSF(sfList);
    for (const storefront of sfList) {
      await test.step(`get data before checkout`, async () => {
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );
      });

      await test.step(`Checkout product in Storefront`, async () => {
        await goToPage(page, storefront, conf.suiteConf.product_handle, "");
        await checkout.checkoutProductWithUsellNoVerify(
          shippingInfo,
          cardInfo,
          upsell,
          conf.suiteConf.product_upsell,
          storefront,
        );
        expect(checkout.thankyouPageLoc).toBeTruthy();
        const orderId = await checkout.getOrderIdBySDK();
        const orders = new OrdersPage(dashboard, conf.suiteConf.domain);
        await dashboard.goto(`https://${conf.suiteConf.domain}/admin/orders/${orderId}`);
        await orders.waitForProfitCalculated();

        const productId: number = await productAPI.getProductIdByHandle(prodHandle);
        const upsellId: number = await productAPI.getProductIdByHandle(upsellHandle);

        const profitLineItem = {
          summary: { id: 0, profit: 0 },
          sbase: { id: productId, profit: 0 },
          upsell: { id: upsellId, profit: 0 },
        };
        lineItemRaw = await orderAPI.getLineItemProfitPlbWithProdID(orderId, profitLineItem);
        lineItemRaw.summary.profit = lineItemRaw.sbase.profit + lineItemRaw.upsell.profit;
      });

      await test.step(`Check Analytics on dashboard ShopBase`, async () => {
        let dataAnalyticsAfter: DataAnalytics;
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
        } while (
          dataAnalyticsAfter.summary.reached_checkout == dataAnalyticsBefore.summary.reached_checkout ||
          dataAnalyticsAfter.summary.add_to_cart == dataAnalyticsBefore.summary.add_to_cart ||
          dataAnalyticsAfter.summary.view_content == dataAnalyticsBefore.summary.view_content ||
          dataAnalyticsAfter.summary.total_profit == dataAnalyticsBefore.summary.total_profit
        );
        await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, lineItemRaw);
      });
    }
  });

  test(`@SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_14 Kiểm tra chart Abadoned checkout khi buyer click nhiều lần vào link recover abandoned trong cùng một session`, async ({
    dashboard,
    page,
    conf,
    authRequest,
    scheduler,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    let scheduleData: AbandonedInfo;
    let dataAnalyticsBefore: DataAnalytics;
    let dataAnalyticsAfter: DataAnalytics;
    let lineItemRaw;
    let orderRecoveryBefore: OrderConversionFunnel;
    let orderRecoveryAfter: OrderConversionFunnel;
    let generalAnalytics: AnalyticsPage;

    const localeFormat = conf.suiteConf.locale_format;
    const timeZoneShop = conf.suiteConf.time_zone;
    const initData = conf.suiteConf.data_analytics;
    const shippingInfo = conf.caseConf.customer_info;
    const prodHandle = conf.suiteConf.product_handle;
    const upsellHandle = conf.suiteConf.upsell_handle;
    const orderInit = conf.caseConf.data_abandoned;

    let upsell: SFApps;
    let account: AccountPage;
    let checkout: SFCheckout;
    const orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    const storeFront = new MultipleSF(dashboard);
    const sfList = conf.suiteConf.domain_sf;
    generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    let i = 0;
    let newPage: Page;

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
          await goToPage(page, storefront, conf.suiteConf.product_handle, "");
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
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 160000 });
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

    const mail = new Guerilla(page);
    const afterMinutes = Math.floor((new Date().getTime() - scheduleData.time) / 60000);
    if (scheduleData.url != "no abandoned checkout" && afterMinutes > 20) {
      let checkoutUrl;
      if (i == 0) {
        // Check mail qua Guerilla
        await mail.accessMail(conf.caseConf.mail);
        await mail.readMailWithContent(conf.caseConf.complete_purchase, conf.suiteConf.shop_name, "");
        [newPage] = await Promise.all([
          mail.page.waitForEvent("popup", { timeout: 120000 }),
          mail.page.click(mail.completePurchaseLink),
        ]);
        checkoutUrl = newPage.url();
      }
      for (const storefront of sfList) {
        await test.step(`Finish abandoned checkout after received abandoned sms/email, then click again abandoned link`, async () => {
          await generalAnalytics.gotoAnalytics();
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
          if (i == 1) {
            checkoutUrl = scheduleData.url;
          }
          const checkoutNew = new SFCheckout(newPage, storefront);
          await checkoutNew.goto(checkoutUrl);
          await checkoutNew.page.waitForLoadState("domcontentloaded");
          await checkoutNew.page.waitForSelector(checkoutNew.xpathZipCode);
          await checkoutNew.enterShippingAddress(shippingInfo[i]);
          await checkoutNew.continueToPaymentMethod();
          await checkoutNew.completeOrderWithMethod("Stripe");
          await checkoutNew.page.waitForSelector(checkoutNew.xpathZipCode, { state: "hidden" });
          if (await checkoutNew.page.locator(checkoutNew.xpathClosePPCPopUp).isVisible()) {
            await checkoutNew.closePostPurchase();
          }
          await expect(checkoutNew.thankyouPageLoc).toBeVisible();
          if (i == 1) {
            await scheduler.clear();
          }
          const orderId = await checkoutNew.getOrderIdBySDK();
          const orders = new OrdersPage(dashboard, conf.suiteConf.domain);
          await dashboard.goto(`https://${conf.suiteConf.domain}/admin/orders/${orderId}`);
          await orders.waitForProfitCalculated();

          const productId: number = await productAPI.getProductIdByHandle(prodHandle);
          const upsellId: number = await productAPI.getProductIdByHandle(upsellHandle);

          const profitLineItem = {
            summary: { id: 0, profit: 0 },
            sbase: { id: productId, profit: 0 },
            upsell: { id: upsellId, profit: 0 },
          };
          lineItemRaw = await orderAPI.getLineItemProfitPlbWithProdID(orderId, profitLineItem);
          lineItemRaw.summary.profit = lineItemRaw.sbase.profit + lineItemRaw.upsell.profit;
          if (i == 0) {
            const [newPage2] = await Promise.all([
              mail.page.waitForEvent("popup", { timeout: 120000 }),
              mail.page.click(mail.completePurchaseLink),
            ]);
            await expect(newPage2.locator('//h2[text()="Log in to view all order details"]')).toBeVisible({
              timeout: 60000,
            });
            await newPage2.close();
          }
        });

        await test.step(`Check Analytics trong dashboard`, async () => {
          await generalAnalytics.gotoAnalytics();
          await generalAnalytics.page.waitForSelector(generalAnalytics.xpathConversionTime, { timeout: 160000 });
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
          await verifyDataAnalytics(dataAnalyticsAfter, dataAnalyticsBefore, conf.caseConf.data_updated, lineItemRaw);
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
        test.setTimeout(conf.suiteConf.time_out_tc);
        await test.step(`Truy cập Account section trong Settings, add staff account`, async () => {
          account = new AccountSetting(dashboard, conf.suiteConf.domain);
          await account.goToAccountSetting();
          //delete all staff account if previous time run failed
          if ((await dashboard.locator(xpathStaffAccount).count()) > 0) {
            await account.deleteAllStaffAccount(conf.suiteConf.password);
            expect(await dashboard.locator(xpathStaffAccount).count()).toEqual(0);
          }
          if (caseID == "SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_15") {
            await account.addStaffAccountFullPermissions(staff);
          } else if (caseID == "SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_16") {
            await account.addStaffAccountNotFullPermissions(staff, unPermissions);
            await account.goToAccountSetting();
            await account.addStaffAccountFullPermissions("quanle1+3@beeketing.net");
          }
          // Check mail qua Guerilla
          mail = new Guerilla(page);
          await mail.accessMail(staffName);
          await mail.readMailWithContent(conf.suiteConf.shop_name, conf.suiteConf.invite_content, "");
          await mail.page.click(mail.createStaffAccLink);
          await dashboard.click(`//p[text()="${conf.suiteConf.domain}"]`);
          await dashboard.click(logOut);
          await dashboard.waitForSelector(logInTitle);
        });
        await test.step(`Đăng nhập dashboard bằng staff account, và thử truy cập các quyền`, async () => {
          newAccount = new AccountPage(dashboard, conf.suiteConf.domain);
          await newAccount.login({ email: username, password: password });
          await newAccount.page.waitForSelector(`//*[.="${accName}"]`, { timeout: 120000 });
          await newAccount.waitAbit(2000);
          await newAccount.goto(`/admin/`);
          await newAccount.page.waitForSelector(newAccount.xpathNotify, { timeout: 150000 });
          if (caseID == "SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_15") {
            for (let i = 1; i < (await dashboard.locator("//li/a[@class='text-decoration-none']").count()) + 1; i++) {
              expect(
                await dashboard.locator(`(//li/a[@class="text-decoration-none"])[${i}]`).getAttribute("href"),
              ).not.toContain("/admin/no_access");
            }
          } else if (caseID == "SB_ANA_SB_ANA_SB_ANA_REFACTOR_PLBASE_16") {
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
