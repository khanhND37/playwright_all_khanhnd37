import { loadData } from "@core/conf/conf";
import { test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { OrdersPage } from "@pages/dashboard/orders";
import { SBPage } from "@pages/page";
import { SFApps } from "@pages/storefront/apps";
import { SFCheckout } from "@pages/storefront/checkout";
import { expect, Page } from "@playwright/test";
import type { DataAnalytics, PriceProduct } from "@types";

let dataAnalyticsBefore: DataAnalytics;
let dataAnalyticsAfter: DataAnalytics;
let generalAnalytics: AnalyticsPage;
let initData: DataAnalytics;

const goToPage = async (page: Page, domain: string, prodHandle: string, paramRefer: string, paramUTM: string) => {
  await page.goto(`https://${domain}/products/${prodHandle}${paramUTM}${paramRefer}`);
  await page.waitForLoadState("networkidle");
};

const verifyUTMSalesReport = async (
  dataUtmSalesReportAfter: Array<object>,
  dataUtmSalesReportBefore: Array<object>,
  utmAnalytics: AnalyticsPage,
  dataUpdated,
  prodId: number[],
  identifier: string,
  netSalesChange: number[],
) => {
  if (dataUtmSalesReportBefore[0]["product_id"] == 0) {
    for (let i = 0; i < dataUtmSalesReportAfter.length; i++) {
      expect
        .soft(dataUtmSalesReportAfter[i]["net_sales"])
        .toEqual(Math.round((dataUtmSalesReportBefore[0]["net_sales"] + netSalesChange[i]) * 100) / 100);
      expect
        .soft(dataUtmSalesReportAfter[i]["view_content"])
        .toEqual(dataUtmSalesReportBefore[0]["view_content"] + dataUpdated.view_content_update);
      expect
        .soft(dataUtmSalesReportAfter[i]["add_to_cart"])
        .toEqual(dataUtmSalesReportBefore[0]["add_to_cart"] + dataUpdated.add_to_cart_update);
      expect
        .soft(dataUtmSalesReportAfter[i]["reached_checkout"])
        .toEqual(dataUtmSalesReportBefore[0]["reached_checkout"] + dataUpdated.reached_checkout_update);
      expect
        .soft(dataUtmSalesReportAfter[i]["total_items"])
        .toEqual(dataUtmSalesReportBefore[0]["total_items"] + dataUpdated.total_items_update);
      expect
        .soft(dataUtmSalesReportAfter[i]["total_orders"])
        .toEqual(dataUtmSalesReportBefore[0]["total_orders"] + dataUpdated.total_orders_update);
      expect.soft(dataUtmSalesReportAfter[i]["source_medium"]).toEqual(dataUpdated.source_medium);
      expect.soft(dataUtmSalesReportAfter[i]["utm_source"]).toEqual(dataUpdated.utm_source);
      expect.soft(dataUtmSalesReportAfter[i]["utm_medium"]).toEqual(dataUpdated.utm_medium);
      expect.soft(dataUtmSalesReportAfter[i]["utm_campaign"]).toEqual(dataUpdated.utm_campaign);
      expect.soft(dataUtmSalesReportAfter[i]["utm_term"]).toEqual(dataUpdated.utm_term);
      expect.soft(dataUtmSalesReportAfter[i]["utm_content"]).toEqual(dataUpdated.utm_content);
    }
  } else {
    for (let i = 0; i < prodId.length; i++) {
      const index = await utmAnalytics.indexData(
        dataUtmSalesReportBefore,
        dataUtmSalesReportAfter,
        identifier,
        prodId[i],
      );
      expect
        .soft(dataUtmSalesReportAfter[index.indexAfter]["net_sales"])
        .toEqual(
          Math.round((dataUtmSalesReportBefore[index.indexBefore]["net_sales"] + netSalesChange[i]) * 100) / 100,
        );
      expect
        .soft(dataUtmSalesReportAfter[index.indexAfter]["view_content"])
        .toEqual(dataUtmSalesReportBefore[index.indexBefore]["view_content"] + dataUpdated.view_content_update);
      expect
        .soft(dataUtmSalesReportAfter[index.indexAfter]["add_to_cart"])
        .toEqual(dataUtmSalesReportBefore[index.indexBefore]["add_to_cart"] + dataUpdated.add_to_cart_update);
      expect
        .soft(dataUtmSalesReportAfter[index.indexAfter]["reached_checkout"])
        .toEqual(dataUtmSalesReportBefore[index.indexBefore]["reached_checkout"] + dataUpdated.reached_checkout_update);
      expect
        .soft(dataUtmSalesReportAfter[index.indexAfter]["total_items"])
        .toEqual(dataUtmSalesReportBefore[index.indexBefore]["total_items"] + dataUpdated.total_items_update);
      expect
        .soft(dataUtmSalesReportAfter[index.indexAfter]["total_orders"])
        .toEqual(dataUtmSalesReportBefore[index.indexBefore]["total_orders"] + dataUpdated.total_orders_update);
      expect.soft(dataUtmSalesReportAfter[index.indexAfter]["source_medium"]).toEqual(dataUpdated.source_medium);
      expect.soft(dataUtmSalesReportAfter[index.indexAfter]["utm_source"]).toEqual(dataUpdated.utm_source);
      expect.soft(dataUtmSalesReportAfter[index.indexAfter]["utm_medium"]).toEqual(dataUpdated.utm_medium);
      expect.soft(dataUtmSalesReportAfter[index.indexAfter]["utm_campaign"]).toEqual(dataUpdated.utm_campaign);
      expect.soft(dataUtmSalesReportAfter[index.indexAfter]["utm_term"]).toEqual(dataUpdated.utm_term);
      expect.soft(dataUtmSalesReportAfter[index.indexAfter]["utm_content"]).toEqual(dataUpdated.utm_content);
    }
  }
};

let timeZoneData;
let cardInfo;
let shippingInfo;
let upsell;
let paramApi;
let domain;
let shopId;
let timeOutAPI;
let validateFieldChanged;
let arrDataChange: number[];
let productId: number;
let upsellId: number;
let today;
let dataUtmSalesReportBefore = [
  {
    add_to_cart: 0,
    aoi_rate: 0,
    aov_rate: 0,
    cr_rate: 0,
    net_sales: 0,
    product_id: 0,
    product_title: "",
    reached_checkout: 0,
    source_medium: "",
    total_items: 0,
    total_orders: 0,
    utm_campaign: "",
    utm_content: "",
    utm_source: "",
    utm_term: "",
    view_content: 0,
  },
];
let utmAnalytics: AnalyticsPage;
let checkout: SFCheckout;
let productAPI: ProductAPI;
let addUpsell: SFApps;

test.describe("Verify flow utm in sales report", () => {
  test.beforeEach(async ({ dashboard, page, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    timeZoneData = conf.suiteConf.time_zone;
    cardInfo = conf.suiteConf.card_info;
    shippingInfo = conf.suiteConf.customer_info;
    upsell = conf.suiteConf.product_upsell;
    paramApi = conf.suiteConf.param;
    domain = conf.suiteConf.domain;
    shopId = conf.suiteConf.shop_id;
    timeOutAPI = conf.suiteConf.time_out_api_calling;
    validateFieldChanged = conf.suiteConf.validate_property;
    initData = conf.suiteConf.data_analytics;
    utmAnalytics = new AnalyticsPage(dashboard, domain);
    generalAnalytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    checkout = new SFCheckout(page, domain);
    productAPI = new ProductAPI(domain, authRequest);
    addUpsell = new SFApps(page, domain);
    today = new Date().toLocaleDateString(conf.suiteConf.locale, { timeZone: timeZoneData });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const utmSalesReport = conf.caseConf.data[i];

    test(`${utmSalesReport.description} @${utmSalesReport.case_id}`, async ({ page, conf, authRequest }) => {
      const identifier = utmSalesReport.case_data.identifier;
      const linkRefer = utmSalesReport.case_data.referrer_link;
      const linkUTM = utmSalesReport.case_data.param_utm;
      const prodHandle = utmSalesReport.case_data.product_handle;
      const upsellHandle = utmSalesReport.case_data.upsell_handle;
      const dataUpdate = utmSalesReport.data_updated;
      const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
      let rawPriceProduct: PriceProduct = prePriceProduct;

      await test.step("Checkout product in Storefront", async () => {
        await goToPage(page, domain, prodHandle, linkRefer, linkUTM);
        await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
        productId = await productAPI.getProductIdByHandle(prodHandle);
        upsellId = await productAPI.getProductIdByHandle(upsellHandle);
        dataAnalyticsBefore = await generalAnalytics.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_sales",
        );
        dataUtmSalesReportBefore = await utmAnalytics.getDataUTMReport(authRequest, shopId, today, paramApi);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, addUpsell, upsell);
        rawPriceProduct = await checkout.getPriceItemType(
          prePriceProduct,
          conf.suiteConf.product_online_store,
          conf.suiteConf.product_upsell,
        );
        arrDataChange = [rawPriceProduct.sbase, rawPriceProduct.upsell];
        await expect.soft(checkout.thankyouPageLoc).toBeVisible();
      });

      await test.step("Verify data UTM sales report changes", async () => {
        const arrProdId: number[] = [productId, upsellId];
        do {
          await utmAnalytics.page.goto(`https://${domain}/admin/orders`);
          await utmAnalytics.page.waitForSelector(utmAnalytics.xpathFirstOrder);
        } while (await utmAnalytics.page.isHidden(utmAnalytics.xpathPaidFirstOrder));
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
        await utmAnalytics.gotoSalesReport();
        await utmAnalytics.page.waitForSelector(utmAnalytics.xpathProductTitleCol);
        await utmAnalytics.page.selectOption(utmAnalytics.xpathSelectReportBy, "utm_source");
        await utmAnalytics.page.waitForSelector(utmAnalytics.xpathProductTitleCol);
        // wait 9s cho hệ thống sync data trong DB
        await utmAnalytics.waitAbit(9000);
        const dataUtmSalesReportAfter = await utmAnalytics.validateDataUTMReportChange(
          dataUtmSalesReportBefore,
          authRequest,
          shopId,
          today,
          paramApi,
          identifier,
          timeOutAPI,
          validateFieldChanged,
          productId,
        );
        await verifyUTMSalesReport(
          dataUtmSalesReportAfter,
          dataUtmSalesReportBefore,
          utmAnalytics,
          dataUpdate,
          arrProdId,
          identifier,
          arrDataChange,
        );
      });
    });
  }

  test("Verify add column in dashboard sales report @SB_ANA_SC_ANA_UTM_14", async ({ dashboard, page, conf }) => {
    const prodHandle = conf.caseConf.product_handle;
    const linkRefer = conf.caseConf.referrer_link;
    const productOnlineStore = conf.caseConf.product_online_store;
    const productUpsell = conf.caseConf.product_upsell;
    let linkUTM = conf.caseConf.param_utm;
    const sbPage = new SBPage(dashboard, domain);
    const linkUTMSplit: string[] = await linkUTM.split("&");
    for (const i in linkUTMSplit) {
      const ts = String(Date.now());
      linkUTMSplit[i] = linkUTMSplit[i] + "_" + ts;
    }
    linkUTM = linkUTMSplit.join("&");
    const utmParam: string[] = [];
    for (const i in linkUTMSplit) {
      const a = linkUTMSplit[i].split("=")[1];
      utmParam.push(a);
    }

    await test.step("Checkout product in Storefront", async () => {
      await goToPage(page, domain, prodHandle, linkRefer, linkUTM);
      await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, addUpsell, upsell);
      await expect.soft(checkout.thankyouPageLoc).toBeVisible();
    });

    await test.step("Verify add column with filter is not UTM", async () => {
      await utmAnalytics.gotoSalesReport();
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await dashboard.locator(utmAnalytics.xpathReportByFilter).selectOption("total_sales");
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await dashboard.locator(utmAnalytics.xpathAddColumnUTM).click();
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      expect.soft(await dashboard.locator(utmAnalytics.xpathColumnOption).count()).toEqual(0);
    });

    await test.step("Verify add column with filter is UTM", async () => {
      await utmAnalytics.gotoSalesReport();
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await dashboard.locator(utmAnalytics.xpathReportByFilter).selectOption("utm_source");
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await dashboard.locator(utmAnalytics.xpathAddColumnUTM).click();
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      expect.soft(await dashboard.locator(utmAnalytics.xpathColumnOption).count()).toEqual(5);
    });

    await test.step("Verify data after add column on dashboard", async () => {
      await utmAnalytics.gotoSalesReport();
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await dashboard.locator(utmAnalytics.xpathReportByFilter).selectOption("utm_source");
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await dashboard.locator(utmAnalytics.xpathAddColumnUTM).selectOption("utm_medium");
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      await utmAnalytics.changeSortSalesReport("UTM Source");
      await dashboard.waitForSelector(utmAnalytics.xpathForWaiting);
      const indexUTMVerified = await utmAnalytics.getIndexUTMDashboard(productOnlineStore, productUpsell, utmParam[0]);
      const arr = [productOnlineStore, utmParam[0], utmParam[1]];
      const xpathItemOS = utmAnalytics.xpathIndexProduct(indexUTMVerified.indexProdOS);

      for (let i = 0; i < arr.length; i++) {
        const xpathVerify = utmAnalytics.xpathIndexColumnProd(xpathItemOS);
        const fieldVerify = await sbPage.getTextContent(`${xpathVerify}[${i + 1}]`);
        expect.soft(fieldVerify).toEqual(arr[i]);
      }
    });
  });

  test("Verify data after refund order in sales report @SB_ANA_SC_ANA_UTM_23", async ({
    dashboard,
    page,
    conf,
    authRequest,
  }) => {
    const identifier = conf.caseConf.case_data.identifier;
    const linkRefer = conf.caseConf.case_data.referrer_link;
    const linkUTM = conf.caseConf.case_data.param_utm;
    const prodHandle = conf.caseConf.case_data.product_handle;
    const upsellHandle = conf.caseConf.case_data.upsell_handle;
    const dataUpdate = conf.caseConf.data_updated;
    const prePriceProduct: PriceProduct = conf.suiteConf.price_product;
    const partiallyRefundAmount = conf.caseConf.refund_amount;
    let rawPriceProduct: PriceProduct;
    const order = new OrdersPage(dashboard, conf.suiteConf.domain);
    const productId: number = await productAPI.getProductIdByHandle(prodHandle);
    const upsellId: number = await productAPI.getProductIdByHandle(upsellHandle);

    await test.step("Checkout product in Storefront", async () => {
      await goToPage(page, domain, prodHandle, linkRefer, linkUTM);
      await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, addUpsell, upsell);
      rawPriceProduct = await checkout.getPriceItemType(
        prePriceProduct,
        conf.suiteConf.product_online_store,
        conf.suiteConf.product_upsell,
      );
      arrDataChange = [rawPriceProduct.sbase, rawPriceProduct.upsell];
      await expect.soft(checkout.thankyouPageLoc).toBeVisible();
    });

    await test.step("Get data Sales report before", async () => {
      do {
        await utmAnalytics.page.goto(`https://${domain}/admin/orders`);
        await utmAnalytics.page.waitForSelector(utmAnalytics.xpathFirstOrder);
      } while (await utmAnalytics.page.isHidden(utmAnalytics.xpathPaidFirstOrder));
      await utmAnalytics.gotoSalesReport();
      await utmAnalytics.page.waitForSelector(utmAnalytics.xpathProductTitleCol);
      await utmAnalytics.page.selectOption(utmAnalytics.xpathSelectReportBy, "utm_source");
      await utmAnalytics.page.waitForSelector(utmAnalytics.xpathProductTitleCol);
      // wait 9s cho hệ thống sync data trong DB
      await utmAnalytics.waitAbit(9000);
      dataUtmSalesReportBefore = await utmAnalytics.getDataUTMReport(authRequest, shopId, today, paramApi);
      expect.soft(dataUtmSalesReportBefore).toBeTruthy();
    });

    await test.step("Partially refund order", async () => {
      await utmAnalytics.refundOrder("partially", partiallyRefundAmount, conf.caseConf.reason);
      const tmp = Math.round((parseInt(partiallyRefundAmount) / rawPriceProduct.totalProductCheckout) * 100) / 100;
      for (let i = 0; i < rawPriceProduct.totalProductCheckout; i++) {
        arrDataChange[i] = -tmp;
      }
      await utmAnalytics.page.waitForSelector('//button[normalize-space()="Refund item"]');
      do {
        await utmAnalytics.page.reload();
        await utmAnalytics.page.waitForSelector('//button[normalize-space()="Refund item"]');
      } while (await utmAnalytics.page.isHidden('//div[contains(text(),"refunded $5.00 USD on the visa ending")]'));
      expect.soft(await order.getPaymentStatus()).toEqual("Partially refunded");
    });

    await test.step("Verified data UTM sales report after refund order", async () => {
      const arrProdId: number[] = [productId, upsellId];
      await utmAnalytics.gotoSalesReport();
      await utmAnalytics.page.waitForSelector(utmAnalytics.xpathProductTitleCol);
      await utmAnalytics.page.selectOption(utmAnalytics.xpathSelectReportBy, "utm_source");
      await utmAnalytics.page.waitForSelector(utmAnalytics.xpathProductTitleCol);
      // wait 9s cho hệ thống sync data trong DB
      await utmAnalytics.waitAbit(9000);
      const dataUtmSalesReportAfter = await utmAnalytics.validateDataUTMReportChange(
        dataUtmSalesReportBefore,
        authRequest,
        shopId,
        today,
        paramApi,
        identifier,
        timeOutAPI,
        validateFieldChanged,
        productId,
      );

      await verifyUTMSalesReport(
        dataUtmSalesReportAfter,
        dataUtmSalesReportBefore,
        utmAnalytics,
        dataUpdate,
        arrProdId,
        identifier,
        arrDataChange,
      );
    });
  });
});
