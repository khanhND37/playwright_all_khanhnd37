import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { OcgLogger } from "@core/logger";
import { DashboardAPI } from "@pages/api/dashboard";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFProduct } from "@pages/storefront/product";
import { GoogleAnalytic } from "@pages/thirdparty/google";
import { APIRequestContext } from "@playwright/test";
import type { CalculateProfitInfos, Card, ReportData, ReportUTMData, SecssionDetail, ShippingAddress } from "@types";

const logger = OcgLogger.get();
test.describe("Allow merchant to view sales and conversion funnel by traffic source", () => {
  let analyticsPage: AnalyticsPage;
  let reportType;
  let cardInfo: Card;
  let shippingInfo: ShippingAddress;
  let today;
  let domain;
  let checkoutPage: SFCheckout;
  let ordersPage: OrdersPage;
  let checkout;
  let orderId;
  let verifyReportByUTM;
  let dashboardAPI: DashboardAPI;
  let caculateProfitInfos: CalculateProfitInfos;
  let reportUTMData: ReportUTMData;
  let reportUTMLast: ReportUTMData;
  let reportData: ReportData;

  const goToPage = async (domain: string, checkoutPage: SFCheckout, handleProduct: string, linkUTM: string) => {
    await checkoutPage.page.goto(handleProduct + linkUTM);
    await checkoutPage.waitForEventCompleted(domain, "view_page");
  };

  const openViewSecssionOrder = async (ordersPage: OrdersPage, orderID: string) => {
    await ordersPage.goto(`/admin/pod/orders/${orderID}`);
    await ordersPage.page.waitForLoadState("networkidle");
    await ordersPage.openViewFullSecssion();
  };

  const verifyViewSessionOrder = async (orderPage: OrdersPage, session: SecssionDetail) => {
    const page = orderPage.page;
    await expect(page.locator(orderPage.xpathOrderSourceIdentifier)).toHaveText(session.source_identifier);
    await expect(page.locator(`(${orderPage.xpathOrderReferringSite})[1]`)).toHaveText(session.referring_site);
    await expect(
      page.locator("//div[child::p[normalize-space()='First page visited']]//following-sibling::div//a"),
    ).toContainText(session.first_page_visited);
    await expect(page.locator(orderPage.xpathOrderUtmSource)).toHaveText(session.utm_source);
    await expect(page.locator(orderPage.xpathOrderUtmMedium)).toHaveText(session.utm_medium);
    await expect(page.locator(orderPage.xpathOrderUtmCampaign)).toHaveText(session.utm_campaign);
    await expect(page.locator(orderPage.xpathOrderUtmTerm)).toHaveText(session.utm_term);
    await expect(page.locator(orderPage.xpathOrderUtmContent)).toHaveText(session.utm_content);
  };

  const addSecondaryDimension = async (analyticsPage: AnalyticsPage) => {
    await analyticsPage.gotoTrafficSources();
    //Analytics phải sau 1p mới call data
    await analyticsPage.page.waitForTimeout(60000);
    await analyticsPage.page.reload();
    await analyticsPage.page.waitForSelector("//header[@class='title-bar-container']//h2");
    await analyticsPage.selectFilterReport("Report by", "source_medium");
    await analyticsPage.selectSecondaryDimension("Add column", "utm_campaign");
  };

  const verifyPageTrafficSourceFilter = async (analyticsPage: AnalyticsPage) => {
    const anaPage = analyticsPage.page;
    const xpathLabelFilter = analyticsPage.xpathLabelFilter;
    await expect(anaPage.locator(xpathLabelFilter + "//option[@value='utm_source']")).toHaveText("UTM Source");
    await expect(anaPage.locator(xpathLabelFilter + "//option[@value='utm_medium']")).toHaveText("UTM Medium");
    await expect(anaPage.locator(xpathLabelFilter + "//option[@value='source_medium']")).toHaveText("Source / Medium");
    await expect(anaPage.locator(xpathLabelFilter + "//option[@value='utm_campaign']")).toHaveText("UTM Campaign");
    await expect(anaPage.locator(xpathLabelFilter + "//option[@value='utm_term']")).toHaveText("UTM Term");
    await expect(anaPage.locator(xpathLabelFilter + "//option[@value='utm_content']")).toHaveText("UTM Content");
  };

  test.beforeEach(({ conf, dashboard, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.setTimeout(conf.suiteConf.timeout);
    test.setTimeout(conf.suiteConf.timeout);
    analyticsPage = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    reportType = conf.suiteConf.report_type;
    cardInfo = conf.suiteConf.card_info;
    shippingInfo = conf.suiteConf.customer_info;
    today = new Date().toLocaleDateString("fr-CA", { timeZone: "Asia/Bangkok" });
    checkoutPage = new SFCheckout(page, domain);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);

    checkout = async (domainSF: string) => {
      const sfCart = new SFProduct(page, domainSF);
      await sfCart.addToCart();
      await checkoutPage.waitForEventCompleted(domainSF, "add_to_cart");
      await checkoutPage.waitForElementVisibleThenInvisible("//button[contains(@class,'btn-loading')]");
      await checkoutPage.page.click(
        "//button[@name='checkout'] | //span[normalize-space()='Checkout' or normalize-space()='CHECKOUT']",
      );
      await checkoutPage.waitForEventCompleted(domainSF, "reached_checkout");
      await checkoutPage.waitForEventCompleted(domainSF, "initiate_checkout");
      await checkoutPage.page.waitForSelector(checkoutPage.xpathZipCode);
      await checkoutPage.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
      await checkoutPage.enterShippingAddress(shippingInfo);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithCardInfo(cardInfo);
      await checkoutPage.waitAbit(1000);
      while (await checkoutPage.genLoc('//a[text()="Please click here to try again"]').isVisible()) {
        await checkoutPage.page.reload();
        await checkoutPage.page.waitForLoadState("networkidle");
        await checkoutPage.page.waitForSelector(checkoutPage.xpathZipCode);
        await checkoutPage.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
        await checkoutPage.enterShippingAddress(shippingInfo);
        await checkoutPage.continueToPaymentMethod();
        await checkoutPage.completeOrderWithCardInfo(cardInfo);
        await checkoutPage.waitAbit(1000);
      }
      await checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou);
    };

    verifyReportByUTM = async (
      analyticsPage: AnalyticsPage,
      reportData: ReportUTMData,
      authRequest: APIRequestContext,
      shopID: number,
      reportType: string[],
      value: string[],
      caculateProfitInfos: CalculateProfitInfos,
      reportDataExp: ReportUTMData,
    ) => {
      let report: ReportUTMData;
      const rounding = function (number: number) {
        return Math.round(number * 100) / 100;
      };
      do {
        // wait vài giây cho hệ thống sync data trong DB
        await analyticsPage.waitAbit(3000);
        report = await analyticsPage.getReportByUTMParam(authRequest, shopID, reportType, value, "total_profit");
      } while (
        report.total_profit.toFixed(2) == reportData.total_profit.toFixed(2) ||
        report.reached_checkout == reportData.reached_checkout
      );
      logger.info(`-----> Report data after = ${JSON.stringify(report)}`);
      const profit =
        caculateProfitInfos.sub_total -
        caculateProfitInfos.base_cost -
        caculateProfitInfos.payment_fee -
        caculateProfitInfos.processing_fee +
        rounding(caculateProfitInfos.tip);
      expect(report.add_to_cart).toEqual(reportData.add_to_cart + reportDataExp.add_to_cart);
      expect(report.aoi_rate).toEqual(report.total_items / report.total_orders);
      expect(report.aov_rate.toFixed(2)).toEqual(
        (Math.floor((report.total_profit / report.total_orders) * 100) / 100).toFixed(2),
      );
      expect(rounding(report.cr_rate)).toEqual(rounding((report.total_orders / report.view_content) * 100));
      expect(report.reached_checkout).toEqual(reportData.reached_checkout + reportDataExp.reached_checkout);
      expect(report.total_items).toEqual(reportData.total_items + reportDataExp.total_items);
      expect(report.total_orders).toEqual(reportData.total_orders + reportDataExp.total_orders);
      expect(rounding(report.total_profit)).toBeCloseTo(rounding(reportData.total_profit + profit), 1);
      expect(report.view_content).toEqual(reportData.view_content + reportDataExp.view_content);
    };
  });

  const confTraffic = loadData(__dirname, "TRAFFIC_CHANNEL");
  for (const data of confTraffic.caseConf.data) {
    test(`@${data.case_id} ${data.description}`, async ({ conf, authRequestWithExchangeToken }) => {
      if (data.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }

      await test.step("Get số lượng truy cập tại theo Chanel ở màn Report Traffic source", async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByChannel(
          requestObj,
          conf.suiteConf.shop_id,
          data.referrer,
          today,
          reportType,
        );
        logger.info(`-----> Data traffic source channel = ${JSON.stringify(reportData)}`);
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + conf.suiteConf.product_handle;
        await goToPage(domain, checkoutPage, productLink, data.linkUTM);
        // wait for event hiển thi
        await checkoutPage.page.waitForTimeout(1000);
        await checkout(domain);
        orderId = (await checkoutPage.getOrderIdBySDK()).toString();
        await ordersPage.goToOrderByOrderId(orderId, "pbase");
        await ordersPage.waitForProfitCalculated();
        logger.info(`Order ID = ${orderId}`);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        // wait for event hiển thi
        await checkoutPage.page.waitForTimeout(1000);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        const reportDataAR = await analyticsPage.validateReportByChannel(
          reportData,
          requestObj,
          conf.suiteConf.shop_id,
          data.referrer,
          today,
          reportType,
        );
        logger.info(`-----> Data channel after = ${JSON.stringify(reportDataAR)}`);
        expect(reportDataAR.channel).toEqual(data.channel);
        expect(reportDataAR.referrer).toEqual(data.referrer);
        expect(reportDataAR.view_page).toEqual(reportData.view_page + data.view_change);
      });
    });
  }

  const confUTM = loadData(__dirname, "TRAFFIC_UTM");
  for (const data of confUTM.caseConf.data) {
    test(`@${data.case_id} ${data.description}`, async ({ conf, authRequestWithExchangeToken }) => {
      if (data.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const productLink = "https://" + domain + "/products/" + conf.suiteConf.product_handle;
      await test.step("Get số lượng truy cập tại theo UTM param ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        await verifyPageTrafficSourceFilter(analyticsPage);
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        // co add column
        if (data.add_column) {
          await analyticsPage.selectSecondaryDimension("Add column", `${data.column_name}`);
          reportUTMData = await analyticsPage.getReportByUTMParam(
            requestObj,
            conf.suiteConf.shop_id,
            ["source_medium", `${data.column_name}`],
            [`${data.utm_source_data} / ${data.utm_medium_data}`, `${data.utm_campaign_data}`],
            "total_profit",
          );
        } else {
          // ko add column
          reportUTMData = await analyticsPage.getReportByUTMParam(
            requestObj,
            conf.suiteConf.shop_id,
            ["source_medium"],
            [`${data.utm_source_data} / ${data.utm_medium_data}`],
            "total_profit",
          );
        }
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        await goToPage(domain, checkoutPage, productLink, data.linkUTM);
        await checkout(domain);
        orderId = (await checkoutPage.getOrderIdBySDK()).toString();
        await ordersPage.goToOrderByOrderId(orderId, "pbase");
        await ordersPage.waitForProfitCalculated();
        logger.info(`Order ID = ${orderId}`);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        dashboardAPI = new DashboardAPI(conf.suiteConf.domain, requestObj);
        caculateProfitInfos = await dashboardAPI.getInfoCalculateProfitByAPI(orderId);
        logger.info(`-----> Gia tri order = ${JSON.stringify(caculateProfitInfos)}`);
        await analyticsPage.gotoTrafficSources();
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        do {
          // co add column
          if (data.add_column) {
            await analyticsPage.selectSecondaryDimension("Add column", `${data.column_name}`);
            reportUTMLast = await analyticsPage.getReportByUTMParam(
              requestObj,
              conf.suiteConf.shop_id,
              ["source_medium", `${data.column_name}`],
              [`${data.utm_source_data} / ${data.utm_medium_data}`, `${data.utm_campaign_data}`],
              "total_profit",
            );
            await analyticsPage.waitAbit(1500);
          } else {
            // ko add column
            reportUTMLast = await analyticsPage.getReportByUTMParam(
              requestObj,
              conf.suiteConf.shop_id,
              ["source_medium"],
              [`${data.utm_source_data} / ${data.utm_medium_data}`],
              "total_profit",
            );
            await analyticsPage.waitAbit(1500);
          }
        } while (
          reportUTMData.add_to_cart == reportUTMLast.add_to_cart ||
          reportUTMData.reached_checkout == reportUTMLast.reached_checkout ||
          reportUTMData.total_orders == reportUTMLast.total_orders ||
          reportUTMData.total_profit == reportUTMLast.total_profit
        );
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        await analyticsPage.gotoTrafficSources();
        for (const report of data.field_report) {
          await analyticsPage.selectFilterReport("Report by", report.field);
          await expect(analyticsPage.page.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText(report.label);
          const requestObj = await authRequestWithExchangeToken.changeToken();
          logger.info(`-----> Report data = ${JSON.stringify(reportUTMData)}`);
          // co add column
          if (data.add_column) {
            await analyticsPage.selectSecondaryDimension("Add column", `${data.column_name}`);
            await addSecondaryDimension(analyticsPage);
            await analyticsPage.waitResponseWithUrl("analytics/report.json");
            await analyticsPage.waitForElementVisibleThenInvisible(analyticsPage.xpathTableLoad);
            await verifyReportByUTM(
              analyticsPage,
              reportUTMData,
              requestObj,
              conf.suiteConf.shop_id,
              ["source_medium", `${data.column_name}`],
              [`${data.utm_source_data} / ${data.utm_medium_data}`, `${data.utm_campaign_data}`],
              caculateProfitInfos,
              data.report_data_exp,
            );
          } else {
            // ko add column
            await verifyReportByUTM(
              analyticsPage,
              reportUTMData,
              requestObj,
              conf.suiteConf.shop_id,
              ["source_medium"],
              [`${data.utm_source_data} / ${data.utm_medium_data}`],
              caculateProfitInfos,
              data.report_data_exp,
            );
          }
        }
      });

      await test.step("Đi đến màn orders, kiểm tra hiển thị View full session ", async () => {
        // utm param thuong can cho 1 khoang thoi gian moi co du lieu
        await ordersPage.page.waitForTimeout(30000);
        await openViewSecssionOrder(ordersPage, orderId);
        await verifyViewSessionOrder(ordersPage, data.data_session_detail);
      });
    });
  }

  test("@SB_ANA_TS_83 Kiểm tra khi add thêm một cột secondary dimension", async ({ dashboard }) => {
    await test.step("Đi đến màn Traffic sources", async () => {
      await analyticsPage.gotoTrafficSources();
      await analyticsPage.selectFilterReport("Report by", "source_medium");
      await analyticsPage.selectSecondaryDimension("Add column", "utm_campaign");
    });

    await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
      const xpathLabelAddColumn =
        "//div[contains(@class,'m-r-sm')][descendant::*[text()='Add column']]//div[@class='s-select']//select";
      await expect(dashboard.locator(xpathLabelAddColumn + "//option[@value='utm_medium']")).toHaveText("UTM Medium");
      await expect(dashboard.locator(xpathLabelAddColumn + "//option[@value='utm_source']")).toHaveText("UTM Source");
      await expect(dashboard.locator(xpathLabelAddColumn + "//option[@value='utm_campaign']")).toHaveText(
        "UTM Campaign",
      );
      await expect(dashboard.locator(xpathLabelAddColumn + "//option[@value='utm_term']")).toHaveText("UTM Term");
      await expect(dashboard.locator(xpathLabelAddColumn + "//option[@value='utm_content']")).toHaveText("UTM Content");
      await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("Source / Medium");
      await expect(dashboard.locator("//table//tr[@class='first tr-traffic-source']//th[2]")).toHaveText(
        "UTM Campaign",
      );
    });
  });

  test("@SB_ANA_TS_91 Kiểm tra hiển thị số lượng truy cập theo Search", async ({ page, conf, authRequest }) => {
    await test.step("Precondition: Get Google data traffic source before testing", async () => {
      await analyticsPage.gotoTrafficSources();
      reportData = await analyticsPage.getReportByChannel(
        authRequest,
        conf.suiteConf.shop_id,
        "Google",
        today,
        reportType,
      );
    });

    await test.step("Connect domain at Google Tag Assistant", async () => {
      const ggAna = new GoogleAnalytic(page, "");
      const popUpPageTitle = await ggAna.connectDomainTagAssistant(conf.suiteConf.domain);
      expect(popUpPageTitle).toEqual(conf.suiteConf.shop_name);
    });

    await test.step("Wait 60s and verify data", async () => {
      const reportDataAR = await analyticsPage.validateReportByChannel(
        reportData,
        authRequest,
        conf.suiteConf.shop_id,
        "Google",
        today,
        reportType,
      );
      expect(reportDataAR.channel).toEqual("search");
      expect(reportDataAR.referrer).toEqual("Google");
      expect(reportDataAR.view_page).toEqual(reportData.view_page + 1);
    });
  });
});
