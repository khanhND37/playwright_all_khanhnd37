import { test } from "@fixtures/theme";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { expect } from "@core/fixtures";
import { APIRequestContext, Page } from "@playwright/test";
import { SFCheckout } from "@sf_pages/checkout";
import type { Card, Config, ReportData, ReportUTMData, SecssionDetail, ShippingAddress } from "@types";
import { ProductValue } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { ProductPage } from "@pages/dashboard/products";
import { GoogleAnalytic } from "@pages/thirdparty/google";
import { loadData } from "@core/conf/conf";

let handleProduct;
let analyticsPage: AnalyticsPage;

test.describe("Allow merchant to view sales and conversion funnel by traffic source", () => {
  const goToPage = async (domain: string, checkoutPage: SFCheckout, handleProduct: string, linkUTM: string) => {
    await checkoutPage.page.goto(handleProduct + linkUTM);
    checkoutPage.page.reload();
    await checkoutPage.waitForEventCompleted(domain, "view_page");
  };

  const verifyReportByUTM = async (
    analyticsPage: AnalyticsPage,
    reportData: ReportUTMData,
    authRequest: APIRequestContext,
    shopID: number,
    reportType: string[],
    value: string[],
    priceProduct: number,
    shippingFee: number,
    reportDataExp: ReportUTMData,
  ) => {
    let reportDataAR;
    do {
      // wait vài giây cho hệ thống sync data trong DB
      await analyticsPage.waitAbit(3000);
      reportDataAR = await analyticsPage.getReportByUTMParam(authRequest, shopID, reportType, value);
    } while (
      reportDataAR.total_sales.toFixed(2) == reportData.total_sales.toFixed(2) ||
      reportDataAR.reached_checkout == reportData.reached_checkout
    );
    expect(reportDataAR.add_to_cart).toEqual(reportData.add_to_cart + reportDataExp.add_to_cart);
    expect(reportDataAR.aoi_rate).toEqual(reportDataAR.total_items / reportDataAR.total_orders);
    expect(reportDataAR.aov_rate.toFixed(2)).toEqual((reportDataAR.total_sales / reportDataAR.total_orders).toFixed(2));
    expect(reportDataAR.cr_rate.toFixed(2)).toEqual(
      ((reportDataAR.total_orders / reportDataAR.view_content) * 100).toFixed(2),
    );
    expect(reportDataAR.reached_checkout).toEqual(reportData.reached_checkout + reportDataExp.reached_checkout);
    expect(reportDataAR.total_items).toEqual(reportData.total_items + reportDataExp.total_items);
    expect(reportDataAR.total_orders).toEqual(reportData.total_orders + reportDataExp.total_orders);
    expect(reportDataAR.total_sales.toFixed(2)).toEqual(
      (reportData.total_sales + priceProduct + shippingFee).toFixed(2),
    );
    expect(reportDataAR.view_content).toEqual(reportData.view_content + reportDataExp.view_content);
  };

  const openViewSecssionOrder = async (ordersPage: OrdersPage, orderID: string) => {
    await ordersPage.goto(`/admin/orders/${orderID}`);
    await ordersPage.page.waitForLoadState("networkidle");
    await ordersPage.openViewFullSecssion();
  };

  const verifyViewSessionOrder = async (orderPage: OrdersPage, session: SecssionDetail) => {
    const page = orderPage.page;
    await expect(page.locator(orderPage.xpathOrderSourceIdentifier)).toHaveText(session.source_identifier);
    await expect(page.locator(`(${orderPage.xpathOrderReferringSite})[1]`)).toHaveText(session.referring_site);
    for (const text of session.first_page_visited) {
      expect((await page.textContent(orderPage.xpathFirstPageVisited)).trim()).toEqual(expect.stringContaining(text));
    }
    await expect(page.locator(orderPage.xpathOrderUtmSource)).toHaveText(session.utm_source);
    await expect(page.locator(orderPage.xpathOrderUtmMedium)).toHaveText(session.utm_medium);
    await expect(page.locator(orderPage.xpathOrderUtmCampaign)).toHaveText(session.utm_campaign);
    await expect(page.locator(orderPage.xpathOrderUtmTerm)).toHaveText(session.utm_term);
    await expect(page.locator(orderPage.xpathOrderUtmContent)).toHaveText(session.utm_content);
  };

  const addSecondaryDimension = async (dashboard: Page, analyticsPage: AnalyticsPage) => {
    await analyticsPage.gotoTrafficSources();
    //Analytics phải sau 1p mới call data nên em phải chờ 1p
    await dashboard.waitForTimeout(60000);
    await dashboard.reload();
    await dashboard.waitForSelector("//header[@class='title-bar-container']//h2");
    await analyticsPage.selectFilterReport("Report by", "source_medium");
    await analyticsPage.selectSecondaryDimension("Add column", "utm_campaign");
  };

  const verifyPageTrafficSourceFilter = async (analyticsPage: AnalyticsPage) => {
    const dashboard = analyticsPage.page;
    const xpathLabelFilter = analyticsPage.xpathLabelFilter;
    await expect(dashboard.locator(xpathLabelFilter + "//option[@value='utm_source']")).toHaveText("UTM Source");
    await expect(dashboard.locator(xpathLabelFilter + "//option[@value='utm_medium']")).toHaveText("UTM Medium");
    await expect(dashboard.locator(xpathLabelFilter + "//option[@value='source_medium']")).toHaveText(
      "Source / Medium",
    );
    await expect(dashboard.locator(xpathLabelFilter + "//option[@value='utm_campaign']")).toHaveText("UTM Campaign");
    await expect(dashboard.locator(xpathLabelFilter + "//option[@value='utm_term']")).toHaveText("UTM Term");
    await expect(dashboard.locator(xpathLabelFilter + "//option[@value='utm_content']")).toHaveText("UTM Content");
  };

  test.beforeEach(({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.setTimeout(conf.suiteConf.timeout);
    test.setTimeout(conf.suiteConf.timeout);
    analyticsPage = new AnalyticsPage(dashboard, conf.suiteConf.domain);
  });

  test("@SB_ANA_TS_1 Kiểm tra hiển thị màn Traffic sources - report by Channel", async ({ dashboard }) => {
    await test.step("Kiểm tra hiển thị màn Traffic sources - report by Channel", async () => {
      await analyticsPage.gotoTrafficSources();
      await expect(dashboard.locator("//header[@class='title-bar-container']//h2")).toHaveText("Traffic sources");
      await expect(dashboard.locator("//button[descendant::span[normalize-space()='Export']]")).toBeVisible();
      expect(dashboard.locator("//div[@class='row m-t-sm']").screenshot()).toMatchSnapshot("traffic-source-filter.png");
      expect(dashboard.locator("//table[@class='table table-layout-fixed']").screenshot()).toMatchSnapshot(
        "traffic-source-column.png",
      );
    });
  });

  const confTrafficDirect = loadData(__dirname, "TRAFFIC DIRECT");
  for (let i = 0; i < confTrafficDirect.caseConf.data.length; i++) {
    const trafficDirect = confTrafficDirect.caseConf.data[i];
    test(`@${trafficDirect.case_id} ${trafficDirect.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { reportType, cardInfo, shippingInfo, today } = getTrafficSourceParams(dashboard, conf);
      const linkUTM = trafficDirect.linkUTM;

      let reportData: ReportData;
      let domain;
      if (trafficDirect.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficDirect.product);
      });

      await test.step("Get số lượng truy cập tại theo Chanel ở màn Report Traffic source", async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByChannel(
          requestObj,
          conf.suiteConf.shop_id,
          "N/A",
          today,
          reportType,
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, domain);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        const reportDataAR = await analyticsPage.validateReportByChannel(
          reportData,
          requestObj,
          conf.suiteConf.shop_id,
          "N/A",
          today,
          reportType,
        );
        expect(reportDataAR.channel).toEqual("direct");
        expect(reportDataAR.referrer).toEqual("N/A");
        expect(reportDataAR.view_page).toEqual(reportData.view_page + parseInt(trafficDirect.view_page));
      });
    });
  }

  test("@SB_ANA_TS_3 Kiểm tra hiển thị số lượng truy cập theo Search", async ({
    page,
    conf,
    dashboard,
    authRequestWithExchangeToken,
  }) => {
    const { reportType, today } = getTrafficSourceParams(dashboard, conf);
    let reportData;

    await test.step("Precondition: Get Google data traffic source before testing", async () => {
      await analyticsPage.gotoTrafficSources();
      const requestObj = await authRequestWithExchangeToken.changeToken();
      reportData = await analyticsPage.getReportByChannel(
        requestObj,
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
      const requestObj = await authRequestWithExchangeToken.changeToken();
      const reportDataAR = await analyticsPage.validateReportByChannel(
        reportData,
        requestObj,
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

  const confTrafficGoogle = loadData(__dirname, "TRAFFIC GOOGLE");
  for (let i = 0; i < confTrafficGoogle.caseConf.data.length; i++) {
    const trafficGoogle = confTrafficGoogle.caseConf.data[i];
    test(`@${trafficGoogle.case_id} ${trafficGoogle.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { reportType, cardInfo, shippingInfo, today } = getTrafficSourceParams(dashboard, conf);
      const linkUTM = trafficGoogle.linkUTM;
      let reportData: ReportData;
      let domain;
      if (trafficGoogle.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficGoogle.product);
      });

      await test.step("Get số lượng truy cập tại theo Chanel ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByChannel(
          requestObj,
          conf.suiteConf.shop_id,
          "Google",
          today,
          reportType,
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, domain);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        const reportDataAR = await analyticsPage.validateReportByChannel(
          reportData,
          requestObj,
          conf.suiteConf.shop_id,
          "Google",
          today,
          reportType,
        );
        expect(reportDataAR.channel).toEqual("search");
        expect(reportDataAR.referrer).toEqual("Google");
        expect(reportDataAR.view_page).toEqual(reportData.view_page + parseInt(trafficGoogle.view_page));
      });
    });
  }

  const confTrafficBing = loadData(__dirname, "TRAFFIC BING");
  for (let i = 0; i < confTrafficBing.caseConf.data.length; i++) {
    const trafficBing = confTrafficBing.caseConf.data[i];
    test(`@${trafficBing.case_id} ${trafficBing.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { reportType, cardInfo, shippingInfo, today } = getTrafficSourceParams(dashboard, conf);
      let domain;
      if (trafficBing.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const linkUTM = trafficBing.linkUTM;
      let reportData: ReportData;
      const checkout = new SFCheckout(page, domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficBing.product);
      });

      await test.step("Get số lượng truy cập tại theo Chanel ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByChannel(
          requestObj,
          conf.suiteConf.shop_id,
          "Bing",
          today,
          reportType,
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, domain);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        do {
          await analyticsPage.page.goto(`https://${conf.suiteConf.domain}/admin/orders`);
          await analyticsPage.page.waitForSelector(analyticsPage.xpathFirstOrder);
        } while (await analyticsPage.page.isHidden(analyticsPage.xpathPaidFirstOrder));
        await analyticsPage.gotoTrafficSources();
        const requestObj = await authRequestWithExchangeToken.changeToken();
        const reportDataAR = await analyticsPage.validateReportByChannel(
          reportData,
          requestObj,
          conf.suiteConf.shop_id,
          "Bing",
          today,
          reportType,
        );
        expect(reportDataAR.channel).toEqual("search");
        expect(reportDataAR.referrer).toEqual("Bing");
        expect(reportDataAR.view_page).toEqual(reportData.view_page + trafficBing.view_page);
      });
    });
  }

  const confTrafficSocial = loadData(__dirname, "TRAFFIC SOCIAL");
  for (let i = 0; i < confTrafficSocial.caseConf.data.length; i++) {
    const trafficSocial = confTrafficSocial.caseConf.data[i];
    test(`@${trafficSocial.case_id} ${trafficSocial.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { reportType, cardInfo, shippingInfo, today } = getTrafficSourceParams(dashboard, conf);
      let reportData: ReportData;
      const linkUTM = trafficSocial.linkUTM;
      let domain;
      if (trafficSocial.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficSocial.product);
      });

      await test.step("Get số lượng truy cập tại theo Chanel ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByChannel(
          requestObj,
          conf.suiteConf.shop_id,
          "Facebook",
          today,
          reportType,
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, domain);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        const reportDataAR = await analyticsPage.validateReportByChannel(
          reportData,
          requestObj,
          conf.suiteConf.shop_id,
          "Facebook",
          today,
          reportType,
        );
        expect(reportDataAR.channel).toEqual("social");
        expect(reportDataAR.referrer).toEqual("Facebook");
        expect(reportDataAR.view_page).toEqual(reportData.view_page + parseInt(trafficSocial.view_page));
      });
    });
  }

  const confTrafficDclidGoogle = loadData(__dirname, "TRAFFIC DCLID GOOGLE");
  for (let i = 0; i < confTrafficDclidGoogle.caseConf.data.length; i++) {
    const trafficDclidGoogle = confTrafficDclidGoogle.caseConf.data[i];
    test(`@${trafficDclidGoogle.case_id} ${trafficDclidGoogle.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { reportType, cardInfo, shippingInfo, today } = getTrafficSourceParams(dashboard, conf);
      let reportData: ReportData;
      const linkUTM = trafficDclidGoogle.linkUTM;
      let domain;
      if (trafficDclidGoogle.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficDclidGoogle.product);
      });

      await test.step("Get số lượng truy cập tại theo Chanel ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByChannel(
          requestObj,
          conf.suiteConf.shop_id,
          "Google",
          today,
          reportType,
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, domain);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        const reportDataAR = await analyticsPage.validateReportByChannel(
          reportData,
          requestObj,
          conf.suiteConf.shop_id,
          "Google",
          today,
          reportType,
        );
        expect(reportDataAR.channel).toEqual("search");
        expect(reportDataAR.referrer).toEqual("Google");
        expect(reportDataAR.view_page).toEqual(reportData.view_page + parseInt(trafficDclidGoogle.view_page));
      });
    });
  }

  test("@SB_ANA_TS_10 Kiểm tra hiển thị màn Traffic sources - report by UTM params ", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const analyticsPage = new AnalyticsPage(dashboard, conf.suiteConf.domain);

    await test.step("Kiểm tra hiển thị màn Traffic sources - report by UTM params", async () => {
      await analyticsPage.gotoTrafficSources();
      await analyticsPage.selectFilterReport("Report by", "source_medium");
      await expect(dashboard.locator("//header[@class='title-bar-container']//h2")).toHaveText("Traffic sources");
      await expect(dashboard.locator("//button[descendant::span[normalize-space()='Export']]")).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='row m-t-sm']",
        snapshotName: "traffic-source-report-UTM-filter.png",
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//table[@class='table table-layout-fixed']//tr[@class='first tr-traffic-source']",
        snapshotName: "traffic-source-report-UTM-column.png",
      });
    });
  });

  const confTrafficFilter = loadData(__dirname, "TRAFFIC FILTER");
  for (let i = 0; i < confTrafficFilter.caseConf.data.length; i++) {
    const trafficTrafficFilter = confTrafficFilter.caseConf.data[i];
    test(`@${trafficTrafficFilter.case_id} ${trafficTrafficFilter.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { cardInfo, shippingInfo } = getTrafficSourceParams(dashboard, conf);
      let reportData;
      const linkUTM = trafficTrafficFilter.linkUTM;
      let domain;
      if (trafficTrafficFilter.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);
      const ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficTrafficFilter.product);
      });

      let priceProduct, shippingFee, tip: number;
      const shopID = conf.suiteConf.shop_id;
      const reportDataExp = trafficTrafficFilter.reportDataExp;
      let orderId;

      await test.step("Get số lượng truy cập tại theo UTM param ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        await analyticsPage.waitForElementVisibleThenInvisible(analyticsPage.xpathTableLoad);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByUTMParam(
          requestObj,
          conf.suiteConf.shop_id,
          ["source_medium"],
          ["source / medium"],
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, domain);
        await checkout.page.waitForTimeout(2000);
        orderId = (await checkout.getOrderIdBySDK()).toString();
        [priceProduct, shippingFee, tip] = await checkout.getOrderSummary(true, true, true);
      });

      await test.step("Click vào droplist Report by", async () => {
        await analyticsPage.gotoTrafficSources();
        //Analytics phải sau 1p mới call data nên em phải chờ 1p
        await dashboard.waitForTimeout(60000);
        await dashboard.reload();
        await dashboard.waitForSelector("//header[@class='title-bar-container']//h2");
        await verifyPageTrafficSourceFilter(analyticsPage);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = Source/Medium", async () => {
        await dashboard.reload();
        await dashboard.waitForSelector("//header[@class='title-bar-container']//h2");
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("Source / Medium");
        await analyticsPage.waitForElementVisibleThenInvisible(analyticsPage.xpathTableLoad);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["source_medium"],
          ["source / medium"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = UTM source", async () => {
        await analyticsPage.selectFilterReport("Report by", "utm_source");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("UTM Source");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["utm_source"],
          ["source"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = UTM medium", async () => {
        await analyticsPage.selectFilterReport("Report by", "utm_medium");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("UTM Medium");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["utm_medium"],
          ["medium"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = UTM campaign", async () => {
        await analyticsPage.selectFilterReport("Report by", "utm_campaign");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("UTM Campaign");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["utm_campaign"],
          ["name"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = UTM term", async () => {
        await analyticsPage.selectFilterReport("Report by", "utm_term");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("UTM Term");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["utm_term"],
          ["term"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = UTM content", async () => {
        await analyticsPage.selectFilterReport("Report by", "utm_content");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("UTM Content");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["utm_content"],
          ["content"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Đi đến màn orders, kiểm tra hiển thị View full session ", async () => {
        await openViewSecssionOrder(ordersPage, orderId);
        await verifyViewSessionOrder(ordersPage, trafficTrafficFilter.data_session_detail);
      });
    });
  }

  test("@SB_ANA_TS_13 Kiểm tra khi add thêm một cột secondary dimension và chọn Report by ", async ({
    conf,
    dashboard,
  }) => {
    const analyticsPage = new AnalyticsPage(dashboard, conf.suiteConf.domain);

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

  const confTrafficSearch = loadData(__dirname, "TRAFFIC SEARCH");
  for (let i = 0; i < confTrafficSearch.caseConf.data.length; i++) {
    const trafficTrafficSearch = confTrafficSearch.caseConf.data[i];
    test(`@${trafficTrafficSearch.case_id} ${trafficTrafficSearch.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { cardInfo, shippingInfo } = getTrafficSourceParams(dashboard, conf);
      let reportData;
      const linkUTM = trafficTrafficSearch.linkUTM;
      let domain;
      if (trafficTrafficSearch.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficTrafficSearch.product);
      });

      let priceProduct, shippingFee, tip: number;
      const shopID = conf.suiteConf.shop_id;
      const reportDataExp = trafficTrafficSearch.reportDataExp;

      await test.step("Precondition: Get số lượng truy cập tại theo UTM param ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByUTMParam(
          requestObj,
          conf.suiteConf.shop_id,
          ["source_medium"],
          ["source / medium"],
        );
      });

      await test.step("Precondition: Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
        [priceProduct, shippingFee, tip] = await checkout.getOrderSummary(true, true, true);
      });

      await test.step("Click vào droplist Report by", async () => {
        await analyticsPage.gotoTrafficSources();
        //Analytics phải sau 1p mới call data nên em phải chờ 1p
        await dashboard.waitForTimeout(60000);
        await dashboard.reload();
        await dashboard.waitForLoadState("networkidle");
        await dashboard.waitForSelector("//header[@class='title-bar-container']//h2");
        await verifyPageTrafficSourceFilter(analyticsPage);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources khi filter Report by = UTM source", async () => {
        await analyticsPage.selectFilterReport("Report by", "utm_source");
        await expect(dashboard.locator(analyticsPage.xpathTrafficSoureFirst)).toHaveText("UTM Source");
        await analyticsPage.searchTrafficSources(trafficTrafficSearch.data_session_detail.utm_source);
        await analyticsPage.waitResponseWithUrl("analytics/report.json");
        await analyticsPage.waitForElementVisibleThenInvisible(analyticsPage.xpathTableLoad);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["utm_source"],
          ["source"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });
    });
  }

  const confTrafficUtm = loadData(__dirname, "TRAFFIC UTM");
  for (let i = 0; i < confTrafficUtm.caseConf.data.length; i++) {
    const trafficTrafficUtm = confTrafficUtm.caseConf.data[i];
    test(`@${trafficTrafficUtm.case_id} ${trafficTrafficUtm.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { cardInfo, shippingInfo } = getTrafficSourceParams(dashboard, conf);
      let reportData;
      const linkUTM = trafficTrafficUtm.linkUTM;
      let domain;
      if (trafficTrafficUtm.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      const ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);

      let priceProduct, shippingFee, tip: number;

      const shopID = conf.suiteConf.shop_id;
      const secssionDetail = trafficTrafficUtm.data_session_detail;
      const reportDataExp = trafficTrafficUtm.reportDataExp;
      let orderId;

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficTrafficUtm.product);
      });

      await test.step("Get số lượng truy cập tại theo UTM param ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        await analyticsPage.selectSecondaryDimension("Add column", "utm_campaign");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByUTMParam(
          requestObj,
          conf.suiteConf.shop_id,
          ["source_medium", "utm_campaign"],
          ["not_set / medium_15", "not_set"],
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
        orderId = (await checkout.getOrderIdBySDK()).toString();
        [priceProduct, shippingFee, tip] = await checkout.getOrderSummary(true, true, true);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        await addSecondaryDimension(dashboard, analyticsPage);
        await analyticsPage.waitResponseWithUrl("analytics/report.json");
        await analyticsPage.waitForElementVisibleThenInvisible(analyticsPage.xpathTableLoad);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["source_medium", "utm_campaign"],
          ["not_set / medium_15", "not_set"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Đi đến màn orders, kiểm tra hiển thị View full session ", async () => {
        // utm param thuong can cho 1 khoang thoi gian moi co du lieu
        await dashboard.waitForTimeout(30000);
        await openViewSecssionOrder(ordersPage, orderId);
        await verifyViewSessionOrder(ordersPage, secssionDetail);
      });
    });
  }

  const confTrafficNoneUtm = loadData(__dirname, "TRAFFIC NONE UTM");
  for (let i = 0; i < confTrafficNoneUtm.caseConf.data.length; i++) {
    const trafficTrafficNoneUtm = confTrafficNoneUtm.caseConf.data[i];
    test(`@${trafficTrafficNoneUtm.case_id} ${trafficTrafficNoneUtm.description}`, async ({
      page,
      conf,
      dashboard,
      authRequestWithExchangeToken,
    }) => {
      const { cardInfo, shippingInfo } = getTrafficSourceParams(dashboard, conf);
      const ordersPage = new OrdersPage(page, conf.suiteConf.domain);
      let priceProduct, shippingFee, tip: number;
      let reportData;
      let domain;
      const linkUTM = trafficTrafficNoneUtm.linkUTM;
      if (trafficTrafficNoneUtm.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      const shopID = conf.suiteConf.shop_id;
      const secssionDetail = trafficTrafficNoneUtm.data_session_detail;
      const reportDataExp = trafficTrafficNoneUtm.reportDataExp;
      let orderID;

      await test.step("Precondition: Recreate product", async () => {
        handleProduct = await recreateProduct(dashboard, conf, trafficTrafficNoneUtm.product);
      });

      await test.step("Get số lượng truy cập tại theo UTM param ở màn Report Traffic source", async () => {
        await analyticsPage.gotoTrafficSources();
        await analyticsPage.selectFilterReport("Report by", "source_medium");
        await analyticsPage.selectSecondaryDimension("Add column", "utm_campaign");
        const requestObj = await authRequestWithExchangeToken.changeToken();
        reportData = await analyticsPage.getReportByUTMParam(
          requestObj,
          conf.suiteConf.shop_id,
          ["source_medium", "utm_campaign"],
          ["direct / none", "not_set"],
        );
      });

      await test.step("Mở link UTM ở trình duyệt Chrome và checkout product thành công", async () => {
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
        orderID = (await checkout.getOrderIdBySDK()).toString();
        [priceProduct, shippingFee, tip] = await checkout.getOrderSummary(true, true, true);
      });

      await test.step("Kiểm tra hiển thị màn Traffic sources", async () => {
        await addSecondaryDimension(dashboard, analyticsPage);
        await analyticsPage.waitResponseWithUrl("analytics/report.json");
        await analyticsPage.waitForElementVisibleThenInvisible(analyticsPage.xpathTableLoad);
        const requestObj = await authRequestWithExchangeToken.changeToken();
        await verifyReportByUTM(
          analyticsPage,
          reportData,
          requestObj,
          shopID,
          ["source_medium", "utm_campaign"],
          ["direct / none", "not_set"],
          priceProduct,
          shippingFee + tip,
          reportDataExp,
        );
      });

      await test.step("Đi đến màn orders, kiểm tra hiển thị View full session ", async () => {
        await openViewSecssionOrder(ordersPage, orderID);
        await verifyViewSessionOrder(ordersPage, secssionDetail);
      });
    });
  }
});

const getTrafficSourceParams = (
  dashboard: Page,
  conf: Config,
): {
  reportType: string;
  cardInfo: Card;
  shippingInfo: ShippingAddress;
  today: string;
} => {
  return {
    reportType: conf.suiteConf.report_type,
    cardInfo: conf.suiteConf.card_info,
    shippingInfo: conf.suiteConf.customer_info,
    today: new Date().toLocaleDateString("fr-CA", { timeZone: "Asia/Bangkok" }),
  };
};

const recreateProduct = async (dashboard: Page, conf: Config, productInfo: ProductValue): Promise<string> => {
  const product = new ProductPage(dashboard, conf.suiteConf.domain);
  await product.navigateToMenu("Products");
  await product.searchProduct(productInfo.title);
  await product.waitForElementVisibleThenInvisible(product.xpathProductDetailLoading);
  await product.page.waitForSelector(
    "(//div[@class = 'product-name'] | //table[@id='all-products']//td[@class='no-product'] " +
      "| //p[normalize-space() = 'Could not find any products matching'])[1]",
  );
  const isProductVisible = await dashboard
    .locator(`(//*[normalize-space() = '${productInfo.title}'])[1]`)
    .isVisible({ timeout: 10000 });
  if (!isProductVisible) {
    await product.addNewProductWithData(productInfo);
    await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
  }
  await product.gotoProductDetail(productInfo.title);
  return dashboard.locator("//div[@class='google__url']").textContent();
};
