import { cloneDeep, renameKey } from "@core/utils/object";
import { SBPage } from "@pages/page";
import { APIRequestContext, expect, Page } from "@playwright/test";
import type {
  AnalyticsDashboard,
  ConversionSummary,
  DataAnalytics,
  DataUtmSalesReport,
  DayChanges,
  DPAnalyticsSalesReport,
  DPTotalSummary,
  GetProductAPIResponse,
  LiveView,
  ReportData,
  ReportUTMData,
  UTM,
} from "@types";
import { OrdersPage } from "./orders";
import { OrderConversionFunnel } from "tests/modules/dashboard/analytics/general_analytics/general_analytics";
import { AccessTokenHeaderName } from "@core/constant";
import { waitForImageLoaded } from "@core/utils/theme";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

// Class for Analytics page
export class AnalyticsPage extends SBPage {
  request: APIRequestContext;

  constructor(page: Page, domain: string, request?: APIRequestContext) {
    super(page, domain);
    this.request = request;
  }

  xpathReportByFilter = "//p[normalize-space()='Report by']//following-sibling::div[@class='s-select']//select";
  xpathAddColumnUTM = "//p[normalize-space()='Add column']//following-sibling::div[@class='s-select']//select";
  xpathColumnOption = `${this.xpathAddColumnUTM}//option[not(@selected)]//following-sibling::option`;
  xpathForWaiting = "//thead//th//span[normalize-space()='Orders']";
  xpathTitleSalesReportDP =
    "//h4[text()='Sales reports']//parent::div//following-sibling::div" + "//div[@class='sales-data']//tbody//td[1]";
  xpathReportWithNoData = "//div[contains(@class, 'sales-report')]//div[contains(@class, 'traffic-no-data')]";
  xpthDataUTMReport =
    "//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div[@class='page-sales-report section m-t']";
  xpathNoDataUTMReport =
    "//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div[@class='page-sales-report section m-t']//div[@class='text-center traffic-no-data']";
  xpathAnalytic = "//li[@class='sb-relative menu li-analytics li-disable']";
  xpathFirstOrder =
    '//div[contains(@class,"sb-tab-panel") and not(@style="display: none;")]//div[contains(@class,"sb-table__body-wrapper")]//tbody/tr[1]';
  xpathPaidFirstOrder =
    '//div[contains(@class,"sb-tab-panel") and not(@style="display: none;")]//tr[1]/td[normalize-space()="paid"]';
  xpathProductTitleCol = '//th[normalize-space()="Product title"]';
  xpathSelectReportBy = '//p[text()="Report by"]/following-sibling::div[@class="s-select"]/select';
  xpathTotalSalesHome =
    '(//div[@class="overview-content no-sale"])[1] | (//div[contains(@class,"overview-content")]/div)[1]';
  xpathTotalOrdersHome =
    '(//div[@class="overview-content no-sale"])[2] | (//div[contains(@class,"overview-content")]/div)[3]';
  xpathConversionTime =
    '//p[normalize-space()="Conversion funnel"]//following-sibling::div//span[@class="period-time"]';
  xpathTotalSales =
    '//div[descendant::h4[text()="Total sales"] and contains(@class,"justify-content-space-between")]/following-sibling::div/h2';
  xpathTotalOrders = '//div[descendant::h4[text()="Total orders"]]/following-sibling::div/h2';
  xpathTrafficSoureFirst = "//table//tr[@class='first tr-traffic-source']//th[1]";
  xpathHeaderTable = "//table/thead/tr[1]/th";
  xpathTotalSalesOrGrossProfit = "(//table/thead/tr[@class='summary']/th)[last()]";
  xpathNetSalesExcludeShipping = "(//table/thead/tr[@class='summary']/th)[last()-1]";
  locatorFirstSalesOrGrossProfit = this.page.locator("(//table/tbody/tr[1]/td/div)[last()]");
  xpathNoDataForReports = '//p[.="There were no traffic in this date range."]';
  locatorProductTitleInSalesReports = this.page.locator('//td[contains(@class,"product-title")]//p[@title]/span');
  xpathSearchOption = '//select[child::option[@value="product_title"]]';
  xpathStepFunnel =
    '//div[contains(text(),"Track conversions by each checkout step to another")]/following-sibling::span/button';
  xpathRemoveCountry = '//div[contains(@class,"tag-list-items")]//a[@role="button"]';
  xpathExport = '//button[normalize-space()="Export"]';

  xpathIndexProduct(index: number) {
    return `(//tbody//tr[contains(@class, 'traffic-source')])[${index}]`;
  }

  xpathIndexColumnProd(xpathItemOS) {
    return `(${xpathItemOS}//td)`;
  }

  xpathGetSummaryInUTMReport(summary: string) {
    return `//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div[@class="page-sales-report section m-t"]//tbody//tr//td[@class="text-left"]//span[normalize-space()='${summary}']`;
  }

  xpathLabelFilter = "//div[@class='row m-t-sm'][descendant::*[text()='Report by']]//div[@class='s-select']//select";

  // go to Live view page
  async gotoLiveview() {
    await this.page.goto(`https://${this.domain}/admin/live-view`);
    await this.page.waitForLoadState("load");
  }

  // go to Analytics page
  async gotoAnalytics() {
    await this.page.goto(`https://${this.domain}/admin/analytics/`);
    await this.page.waitForLoadState("load");
  }

  // go to Setting Acc
  async gotoSettingAcc(idStaff: string) {
    await this.page.goto(`https://${this.domain}/admin/settings/account/${idStaff}`);
    await this.page.waitForLoadState("load");
  }

  // Go to Conversion Analytics page
  async goToConversionAnalytics() {
    await this.page.goto(`https://${this.domain}/admin/conversion-analytic/`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * select Full permissions for acc staff
   * @returns
   */
  async selectFullpermissions() {
    if (
      await this.page
        .locator("//span[contains(text(),'full permissions')]//preceding-sibling::span[@class='s-check']")
        .isChecked()
    ) {
      return;
    } else {
      await this.page.check("//span[contains(text(),'full permissions')]//preceding-sibling::span[@class='s-check']");
      await this.page.click("//span[normalize-space()='Save changes']");
      await this.page
        .locator("//div[normalize-space()='Changes saved']//parent::div[@class='s-notices is-bottom']")
        .isVisible();
    }
  }

  /**
   * uncheck Full permissions for acc staff and uncheck permissions ana
   * @returns
   */
  async UncheckPermissionsAna() {
    if (
      await this.page
        .locator("//span[contains(text(),'full permissions')]//preceding-sibling::span[@class='s-check']")
        .isChecked()
    ) {
      await this.page.uncheck("//span[contains(text(),'full permissions')]//preceding-sibling::span[@class='s-check']");
      await this.page.uncheck("//span[normalize-space()='Analytics']//preceding-sibling::span[@class='s-check']");
      await this.page.click("//span[normalize-space()='Save changes']");
      await this.page
        .locator("//div[normalize-space()='Changes saved']//parent::div[@class='s-notices is-bottom']")
        .isVisible();
    } else {
      await this.page.check("//span[contains(text(),'full permissions')]//preceding-sibling::span[@class='s-check']");
      await this.page.uncheck("//span[contains(text(),'full permissions')]//preceding-sibling::span[@class='s-check']");
      await this.page.uncheck("//span[normalize-space()='Analytics']//preceding-sibling::span[@class='s-check']");
      await this.page.click("//span[normalize-space()='Save changes']");
      await this.page
        .locator("//div[normalize-space()='Changes saved']//parent::div[@class='s-notices is-bottom']")
        .isVisible();
    }
  }

  // Go to Traffic Source page
  async gotoTrafficSources() {
    await this.page.goto(`https://${this.domain}/admin/traffic-sources/`);
    await this.page.waitForLoadState("networkidle");
  }

  async searchTrafficSources(search: string) {
    return this.genLoc("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']").fill(search);
  }

  /**
   * Go to sales report dashboard
   */
  async gotoSalesReport() {
    await this.page.goto(`https://${this.domain}/admin/sales-reports/`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Function download file csv analytics
   * @param nameFile File CSV includes: Sales reports, traffic by channels, traffic by Campaigns
   * @returns
   */
  async downloadFileExportAnalytics(nameFile = "Sales reports"): Promise<string> {
    await this.page.click(`//h4[normalize-space()='${nameFile}']//following-sibling::button`);
    const download = await this.page.waitForEvent("download");
    return download.path();
  }

  /**
   *
   * @param value Value in Report by
   */
  async selectOptionReportByInUTMRp(value: string): Promise<void> {
    await this.genLoc(
      "//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div//p[normalize-space()='Report by']//following-sibling::div//select",
    ).selectOption(value);
    await this.page.waitForSelector(this.xpthDataUTMReport);
  }

  /**
   *
   * @param valueOptionSearch value option to search
   * @param search Content want to search
   * @param valueAddColumn value option to add column
   */
  async searchInTrafficByCampaings(search: string, valueAddColumn?: string, valueOptionSearch?: string): Promise<void> {
    await this.genLoc(
      "//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div//select[@class='border-radius-right']",
    ).selectOption(valueOptionSearch);
    await this.genLoc(
      "//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div//p[normalize-space()='Add column']",
    ).selectOption(valueAddColumn);
    await this.genLoc(
      "//h4[normalize-space()='Traffic by campaigns']//parent::div//following-sibling::div//input[@placeholder='Search']",
    ).fill(search);
    await this.page.waitForSelector(this.xpthDataUTMReport, { state: "hidden" });
    await this.page.waitForSelector(this.xpthDataUTMReport, { state: "visible" });
  }

  /**
   *  Get report data by channel on Analytics page
   * @param authRequest
   * @param shopID
   * @param referrerName
   */
  async getReportByChannel(
    authRequest: APIRequestContext,
    shopID: string,
    referrerName: string,
    inputDate,
    reportType: string,
  ): Promise<ReportData> {
    const resReport = await authRequest.post(`https://${this.domain}/admin/analytics/report.json?shop_ids=${shopID}`, {
      data: {
        report_type: reportType,
        from_time: inputDate,
        to_time: inputDate,
        filters: [
          {
            field: "referrer",
            operator: "contains",
            value: referrerName,
          },
        ],
      },
    });
    if (resReport.ok()) {
      const resReportBody = await resReport.json();
      for (let i = 0; i < resReportBody.data.length; i++) {
        if (resReportBody.data[i].referrer === referrerName) {
          return {
            channel: resReportBody.data[i].channel,
            referrer: resReportBody.data[i].referrer,
            view_page: resReportBody.data[i].view_page,
            contribution: resReportBody.data[i].contribution,
            conversion_rate: resReportBody.data[i].cr_rate,
            orders: resReportBody.data[i].total_orders,
            sales: resReportBody.data[i].net_sales,
          };
        }
      }
      return {
        channel: "",
        referrer: "",
        view_page: 0,
        contribution: 0,
        conversion_rate: 0,
        orders: 0,
        sales: 0,
      };
    }
    return Promise.reject(`Error: ${resReport.status}`);
  }

  /** select report type for filter
   * @param label
   * @param value
   **/
  async selectFilterReport(label: string, value: string) {
    await this.genLoc(
      `//div[@class='row m-t-sm'][descendant::*[text()='${label}']]//div[@class='s-select']//select`,
    ).selectOption(value);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   *  Get report data by UTM param on Analytics page
   * @param authRequest
   * @param shopID
   * @param reportTypes
   * @param value
   */
  async getReportByUTMParam(
    authRequest: APIRequestContext,
    shopID: number,
    reportTypes: string[],
    value: string[],
    aovField = "total_sales",
  ): Promise<ReportUTMData> {
    const todayDate = new Date().toISOString().slice(0, 10);
    const resReportData = await authRequest.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopID}`,
      {
        data: {
          report_type: "utm_campaign",
          from_time: todayDate,
          to_time: todayDate,
          group_by: reportTypes,
          aov_field: aovField,
        },
      },
    );
    if (resReportData.status() === 200) {
      const resReportBody = await resReportData.json();
      // console.log("----> Data response = ", resReportBody.data);
      const reportData = resReportBody.data.find(item => {
        let findReportValue = true;
        for (let i = 0; i < reportTypes.length; i++) {
          if (item[reportTypes[i]] !== value[i]) {
            findReportValue = false;
          }
        }
        return findReportValue;
      });
      if (reportData) {
        return reportData;
      }
      return {
        add_to_cart: 0,
        aoi_rate: 0,
        aov_rate: 0,
        cr_rate: 0,
        reached_checkout: 0,
        source_medium: "",
        total_items: 0,
        total_orders: 0,
        total_sales: 0,
        total_profit: 0,
        utm_campaign: "",
        view_content: 0,
        utm_source: "",
        utm_medium: "",
        utm_term: "",
        utm_content: "",
      };
    }
    return Promise.reject(`Error: ${resReportData.status}`);
  }

  /**
   * select second dimension for filter
   * @param label
   * @param value
   */
  async selectSecondaryDimension(label: string, value: string) {
    await this.genLoc(
      `//div[contains(@class,'m-r-sm s-mb16')][descendant::*[text()='${label}']]//div[@class='s-select']//select`,
    ).selectOption(value);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Open analytic by api in dashboard screen
   * @param accessToken
   * @returns page
   */
  async openAnalyticsByAPI(accessToken?: string) {
    await this.page.goto(`https://${this.domain}/admin/analytics/?x_key=${accessToken}`);
    await this.page.waitForResponse(response => response.status() === 200);
    return new OrdersPage(this.page, this.domain);
  }

  /**
   * Get auto upsell info in analytics page:
   * contain:
   * - total profit auto upsell item
   * - total order have item auto upsell
   * - total average order item: = total item auto upsell / total order have item auto upsell
   * - total average order profit: = total profit auto upsell item / total order have item auto upsell
   * @param shopId
   * @param dateFilter : filter analytics by time
   * @returns
   */
  async getAutoUpsellInfo(shopId: number, dateFilter: string, accessToken?: string) {
    const res = await this.request.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      params: {
        access_token: accessToken,
      },
      data: {
        report_type: "shop_cr",
        from_time: dateFilter,
        to_time: dateFilter,
        aov_field: "total_profit",
        shop_ids: [shopId],
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const autoUpsellInfo = resBody.data.auto_upsell;
    if (autoUpsellInfo == null) {
      return {
        total_aoi: 0,
        total_profit: 0,
        total_orders: 0,
        total_aop: 0,
      };
    }
    return {
      total_aoi: autoUpsellInfo.total_aoi,
      total_profit: autoUpsellInfo.total_profit,
      total_orders: autoUpsellInfo.total_orders,
      total_aop: autoUpsellInfo.total_aop,
    };
  }

  /**
   * Convert date time now into timezone
   * @param tz: iana timezone format
   */
  async convertDayTime(tz: string): Promise<number> {
    const dateTime = new Date(new Date().toLocaleString("fr-CA", { timeZone: tz }).slice(0, 10));
    return dateTime.getTimezoneOffset() / 60;
  }

  /**
   * Get timezone from analytics
   * @param shopId: shop's id
   * @param fromDay: date time from now
   * @param platform: using platform (SB, PB, PLB)
   */
  async getTimezone(
    authRequest: APIRequestContext,
    shopId,
    fromDay: string,
    platform: "total_profit" | "total_sales",
    toDay?: string,
    token?: string,
  ): Promise<number> {
    let responseBody;
    let response;
    const toTime = toDay ? toDay : fromDay;
    if (token) {
      response = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
        data: {
          aov_field: platform,
          from_time: fromDay,
          to_time: toTime,
          shop_ids: [shopId],
          report_type: "shop_source",
        },
        headers: { [AccessTokenHeaderName]: token },
      });
    } else {
      response = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
        data: {
          aov_field: platform,
          from_time: fromDay,
          to_time: toTime,
          shop_ids: [shopId],
          report_type: "shop_source",
        },
      });
    }
    if (response.status() == 200) {
      responseBody = await response.json();
      if (responseBody.data.sales.length > 0) {
        // console.log("-----> API response = ", JSON.stringify(responseBody));
        const displayTime = new Date(responseBody.data.sales[responseBody.data.sales.length - 1].display_time);
        return displayTime.getTimezoneOffset() / 60;
      }
      await new Promise(t => setTimeout(t, 10000));
    } else {
      return Promise.reject(`Error: ${response.status()}`);
    }
  }

  /**
   * Function minus time
   * @param numOfDays: the number of days were be minus
   * @param date: get date time now
   */
  async getDateXDaysAgo(numOfDays: number, date = new Date()) {
    const daysAgo = new Date(date.getTime());
    daysAgo.setDate(date.getDate() - numOfDays);
    daysAgo.setHours(0, 0, 0, 0);
    return daysAgo.toString();
  }

  /**
   * Function convert date from timestamp to ISO date
   * @param date: date timestamp format
   */
  async formatDate(date: string) {
    const d = new Date(date),
      year = d.getFullYear();
    let month = "" + (d.getMonth() + 1),
      day = "" + d.getDate();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  /**
   * Get response for events view content, add to cart, reached checkout, session conveted and aoi, aov and total items
   * @param fromDay: the day is inputed for payload datetime range
   * @param shopId: shop's id
   * @param platform: this is defined that platform using sales or profits (ShopBase or PrintBase/PlusBase)
   * @param obj: the object struct defined data analytics
   */
  async getDataAnaCrAPI(
    authRequest: APIRequestContext,
    fromDay: string,
    shopId: string,
    platform: string,
    obj: DataAnalytics,
    toDay?: string,
    isCheckTraffic?: boolean,
  ) {
    const toTime = toDay ? toDay : fromDay;
    let dataWithTrafficForm = {};
    if (isCheckTraffic !== undefined) {
      dataWithTrafficForm = {
        aov_field: platform,
        from_time: fromDay,
        to_time: toTime,
        report_type: "shop_cr",
        exclude_traffic_non_shipping: isCheckTraffic,
      };
    } else {
      dataWithTrafficForm = {
        aov_field: platform,
        from_time: fromDay,
        to_time: toTime,
        report_type: "shop_cr",
      };
    }

    const apiCr = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: dataWithTrafficForm,
    });
    if (apiCr.ok()) {
      const rawResponseCR = await apiCr.json();
      const summary: DataAnalytics["summary"] = obj.summary;
      const sbase: DataAnalytics["sbase"] = obj.sbase;
      const upsell: DataAnalytics["upsell"] = obj.upsell;
      const plusBaseMoq: DataAnalytics["plus_base_moq"] = obj.plus_base_moq;
      let autoUpsell: DataAnalytics["auto_upsell"] = obj.auto_upsell;
      if (rawResponseCR.summary) {
        for (const a in summary) {
          summary[a] = rawResponseCR.summary[a];
          if (!rawResponseCR.summary[a]) {
            summary[a] = 0;
          }
        }
      }
      if (rawResponseCR.data.sbase) {
        for (const b in sbase) {
          sbase[b] = rawResponseCR.data.sbase[b];
          if (!rawResponseCR.data.sbase[b]) {
            sbase[b] = 0;
          }
        }
      }
      if (rawResponseCR.data.usell) {
        for (const c in upsell) {
          upsell[c] = rawResponseCR.data.usell[c];
          if (!rawResponseCR.data.usell[c]) {
            upsell[c] = 0;
          }
        }
      }
      if (rawResponseCR.data.auto_upsell) {
        for (const d in autoUpsell) {
          autoUpsell[d] = rawResponseCR.data.auto_upsell[d];
          if (!rawResponseCR.data.auto_upsell[d]) {
            autoUpsell[d] = 0;
          }
        }
      }
      if (rawResponseCR.data.plus_base_moq) {
        for (const e in plusBaseMoq) {
          plusBaseMoq[e] = rawResponseCR.data.plus_base_moq[e];
          if (!rawResponseCR.data.plus_base_moq[e]) {
            plusBaseMoq[e] = 0;
          }
        }
      }

      autoUpsell = cloneDeep(obj.auto_upsell);
      return { summary, sbase, upsell, autoUpsell, plusBaseMoq };
    }
    return Promise.reject(`Error: ${apiCr.status()}`);
  }

  async getDataAnaCus(
    authRequest: APIRequestContext,
    fromDay: string,
    shopId: string,
    platform: string,
    toDay?: string,
  ) {
    const toTime = toDay ? toDay : fromDay;
    const apiCustomer = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: {
        aov_field: platform,
        from_time: fromDay,
        to_time: toTime,
        report_type: "customer",
      },
    });

    if (apiCustomer.ok()) {
      return await apiCustomer.json();
    }
    return Promise.reject(`Error: ${apiCustomer.status}`);
  }

  /**
   * Get base data Analytics from API
   * @param shopId: shop's id
   * @param fromDay: date time in API payload
   * @param platform: this is defined that platform using sales or profits (ShopBase or PrintBase/PlusBase)
   */
  async getDataAnalyticsAPIDashboard(
    authRequest: APIRequestContext,
    shopId: string,
    fromDay: string,
    initData: DataAnalytics,
    platform: "total_profit" | "total_sales",
    toDay?: string,
  ) {
    const obj = cloneDeep(initData);
    const toTime = toDay ? toDay : fromDay;
    let dataCrAPI = await this.getDataAnaCrAPI(authRequest, fromDay, shopId, platform, obj, toTime);
    const dataCusAPI = await this.getDataAnaCus(authRequest, fromDay, shopId, platform, toTime);
    dataCrAPI = renameKey(dataCrAPI, "autoUpsell", "auto_upsell");
    dataCrAPI = renameKey(dataCrAPI, "plusBaseMoq", "plus_base_moq");
    if (dataCrAPI.summary != null) {
      if (platform === "total_sales") {
        for (const key in obj) {
          obj[key].total_sales = dataCrAPI[key].total_sales;
          if (obj[key].total_aov) {
            obj[key].total_aov = dataCrAPI[key].total_aov;
          }
        }
      } else if (platform === "total_profit") {
        for (const key in initData) {
          obj[key].total_profit = dataCrAPI[key].total_profit;
          if (obj[key].total_aop) {
            obj[key].total_aop = dataCrAPI[key].total_aop;
          }
        }
      }

      for (const key in obj) {
        if (obj[key].total_orders) {
          obj[key].total_orders = dataCrAPI[key].total_orders;
        }
        if (obj[key].view_content) {
          obj[key].view_content = dataCrAPI[key].view_content;
        }
        if (obj[key].session_convert) {
          obj[key].session_convert = dataCrAPI[key].session_convert;
        }
        if (obj[key].conversion_rate) {
          obj[key].cr_rate = dataCrAPI[key].cr_rate;
        }
        if (obj[key].total_items) {
          obj[key].total_items = dataCrAPI[key].total_items;
        }
        if (obj[key].total_aoi) {
          obj[key].total_aoi = dataCrAPI[key].total_aoi;
        }
        if (obj[key].view_page) {
          obj[key].view_page = dataCrAPI[key].view_page;
        }
      }
      obj.summary.first_time = dataCusAPI.summary.customer.first_time;
    }
    return obj;
  }

  /**
   * Function get data live view
   * @param inputDay // day need format YYYY/MM/DD
   * @param initData // data want to validate includes: visitors_right_now, total_sessions, total_sales, total_orders
   * @returns
   */
  async getDataLiveViewAPIDashboard(inputDay: string, initData: LiveView) {
    try {
      const response1 = await this.page.waitForResponse(
        response =>
          response.url().includes("/admin/analytics/live-view.json?report_type=location") && response.status() === 200,
      );
      const jsonResponse = await response1.json();
      // console.log("Res 1 = ", jsonResponse);

      const response2 = await this.page.waitForResponse(
        response =>
          response.url().includes(`/admin/analytics/live-view.json?report_type=summary&from_time=${inputDay}`) &&
          response.status() === 200,
      );
      const jsonResponse2 = await response2.json();
      // console.log("Res 2 = ", jsonResponse2);

      const obj = { ...initData };
      for (const key in obj) {
        if (key === "visitors_right_now" && !obj[key]) {
          obj[key] = jsonResponse.summary.total_sessions;
        }
        if (key === "total_sessions" && !obj[key]) {
          obj[key] = jsonResponse2.summary.total_sessions;
        }
        if (key === "total_sales" && !obj[key]) {
          obj[key] = jsonResponse2.summary.total_sales;
        }
        if (key === "total_orders" && !obj[key]) {
          obj[key] = jsonResponse2.summary.order_distinct_count;
        }
        if (key === "refunded" && !obj[key]) {
          obj[key] = jsonResponse2.summary.refunded;
        }
      }
      return obj;
    } catch (e) {
      throw e.message;
    }
  }

  /**
   * Function to validate data live view and return data after update
   * @param inputDay // day need format YYYY/MM/DD
   * @param initData // data want to validate includes: visitors_right_now, total_sessions, total_sales, total_orders
   * @param timeout // Time maximum to validate data
   * @param liveViewAnalyticsBefore data before to compare changed
   * @returns
   */
  async validateDataLiveView(
    inputDay: string,
    initData: LiveView,
    timeout: number,
    liveViewAnalyticsBefore: LiveView,
  ): Promise<LiveView> {
    let timer;
    let isStop = false;
    return Promise.race([
      new Promise<LiveView>(resolve => {
        const checkDataLiveView = async () => {
          let liveViewAnalyticsAfter;
          while (!isStop) {
            liveViewAnalyticsAfter = await this.getDataLiveViewAPIDashboard(inputDay, initData);
            for (const key in liveViewAnalyticsBefore) {
              if (key in liveViewAnalyticsAfter) {
                if (liveViewAnalyticsBefore[key] !== liveViewAnalyticsAfter[key]) {
                  isStop = true;
                  resolve(liveViewAnalyticsAfter);
                  return;
                }
              }
            }
          }
          resolve(liveViewAnalyticsAfter);
        };
        checkDataLiveView();
      }),
      new Promise<LiveView>(
        resolve =>
          (timer = setTimeout(() => {
            isStop = true;
            resolve(initData);
          }, timeout)),
      ),
    ]).finally(() => clearTimeout(timer));
  }

  /**
   * Get data analytics from dashboard
   * @param platform: this is defined that platform using sales or profits (ShopBase or PrintBase/PlusBase)
   */
  async getDataFromDashboard(platform: string, initData: AnalyticsDashboard): Promise<AnalyticsDashboard> {
    const objDashboard = cloneDeep(initData);
    objDashboard[platform] = parseFloat(
      (
        await this.page
          .locator(
            `//h4[normalize-space()='Total ${platform}']` +
              `//ancestor::div[contains(@class, 'justify-content-space-between')]` +
              `//following-sibling::div[@class='line-chart']//h2`,
          )
          .textContent()
      )
        .trim()
        .split("$")[1]
        .replace(",", ""),
    );
    objDashboard.conversion_rate = parseFloat(
      (
        await this.getTextContent(
          "//h4[normalize-space()='Online store conversion rate']" +
            "//ancestor::div//div[contains(@class, 'justify-content-space-between')]//h2",
        )
      )
        .trim()
        .split("%")[0]
        .replace(",", "."),
    );
    objDashboard.total_orders = parseInt(
      await this.getTextContent(
        "//h4[normalize-space()='Total orders']" +
          "//parent::div[contains(@class, 'align-items-center')]//following-sibling::div[@class='line-chart']//h2",
      ),
    );
    return objDashboard;
  }

  /**
   * Dashboard filter analytics
   * last() - number: The day from now back to the number days. The number start with 0
   * The scope of this case is checking successful filter logic so it only need the short date range and prevent timeout
   */
  async filterDateOnAna(dayChanges: DayChanges) {
    await this.page.locator('//div[contains(@class,"calendar-btn")]').click();
    await this.page.locator("(//span[normalize-space()='From']//following-sibling::input)[1]").click();
    await this.page.locator("//button[contains(@class, 'icon-arrow-left')]").click();
    await this.page
      .locator(`(//td[contains(@class,'today')]//preceding::td)[last()- ${dayChanges.before_number_day}]`)
      .click();
    await this.page
      .locator(`(//td[contains(@class,'today')]//preceding::td)[last() - ${dayChanges.before_the_day}]`)
      .click();
  }

  /**
   * Refund order with no verified
   * @param refundType: fully refund or partially
   * @param amountRefund: refund order amount
   * @param reason: Reason for refund
   */
  async refundOrder(refundType: "fully" | "partially", amountRefund: string, reason: string) {
    const xpath = "//div[@class='unfulfilled-card__item']//div[@class='s-input-group__append']//span";
    await this.goto(`admin/orders`);
    await this.page.click("(//tbody//tr[contains(@class, 'order-expanded')]//td[contains(@class, 'column')]//a)[1]");
    await this.page.waitForSelector('//button[normalize-space()="Print order"]', { timeout: 90000 });
    while (await this.page.locator('//button[normalize-space()="Refund item"]').isHidden()) {
      await this.page.reload();
      await this.page.waitForSelector('//button[normalize-space()="Print order"]', { timeout: 90000 });
    }
    await this.clickOnBtnWithLabel("Refund item");
    await this.page.waitForSelector(xpath);
    if (refundType == "partially") {
      await this.page
        .locator(
          "//h3[normalize-space()='Refund amount']" +
            "//ancestor::div[contains(@class,'refund-form-section')]" +
            "//following-sibling::div//input[@type='number']",
        )
        .fill(amountRefund);
    } else {
      const lineItems = await this.page.locator(xpath).count();
      for (let i = 1; i < lineItems + 1; i++) {
        const numberOfItems = (await this.page.textContent(`(${xpath})[${i}]`)).trim().split(" ")[1];
        await this.page.locator(`(//div[@class='unfulfilled-card__item']//input)[${i}]`).fill(numberOfItems);
      }
      const xpathRefundShipping = "//div[contains(@class,'refund-shipping-section')]//p[@class='type--bold']";
      if (await this.page.isVisible(xpathRefundShipping)) {
        const shippingFee = (await this.page.textContent(xpathRefundShipping))
          .trim()
          .split("(")[1]
          .split(")")[0]
          .replace("$", "");
        await this.inputFieldWithLabel("", "Refund amount", shippingFee, 1);
      }
    }
    await this.inputFieldWithLabel("", "Reason for refund", reason, 1);
    await this.page.click("//div[contains(@class,'refund-confirm-section')]//button", { delay: 1500 });
  }

  /**
   * Edit order with no verify
   * @param productQuantity: product's quantities that adjusted for edited order
   */
  async editOrder(productQuantity: string) {
    const xpathAmountField = "//div[normalize-space()='Amount to collect']//following-sibling::div";
    const xpathQuantityInput = "//div[normalize-space()='Quantity']//following-sibling::div//input";
    const addedLabel = "//div[@class='sb-block-item__content']//span[normalize-space()='Added']";
    const linkForPay = '//div[contains(text(),"Checkout link for payment")]/following-sibling::div/a';
    const adjustBtn = "//button[normalize-space()='Adjust quantity' or child::*[normalize-space()='Adjust quantity']]";
    await this.goto(`admin/orders`);
    await this.page.click("(//tbody//a)[1]");
    await this.clickOnBtnWithLabel("More actions");
    await this.page.click("//span[normalize-space()='Edit order']//parent::span[@class='s-dropdown-item']");
    await this.page.waitForSelector("(//span[normalize-space()='Adjust quantity']//parent::button)[1]");
    await waitForImageLoaded(this.page, '((//div[@role="tablist"])[1]//div[@role="tabpanel"])[1]');
    const lineItems = await this.page.locator("//span[normalize-space()='Adjust quantity']//parent::button").count();
    for (let index = 1; index < lineItems + 1; index++) {
      await this.page.click(`(${adjustBtn})[${index}]`);
      await this.page.locator(xpathQuantityInput).fill(productQuantity);
      await this.clickOnBtnWithLabel("Confirm");
      await this.page.waitForSelector(`(${addedLabel})[${index}]`);
    }
    const amountCollect = parseFloat((await this.page.textContent(xpathAmountField)).split("$")[1]);
    await this.clickOnBtnWithLabel("Send invoice");
    await this.page.waitForSelector(this.xpathToastMessage);
    await this.page.waitForSelector(this.xpathToastMessage, { state: "hidden" });
    while (await this.page.isHidden('//div[contains(text(),"edit this order")]/following-sibling::span')) {
      await this.goto(`admin/orders`);
      await this.page.click("(//tbody//a)[1]");
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(2000);
    }
    await this.page.click('//div[contains(text(),"edit this order")]/following-sibling::span');
    const checkoutLink: string = await this.page.locator(linkForPay).getAttribute("href", { timeout: 60000 });
    return { checkoutLink, amountCollect };
  }

  /**
   * Get data from analytics Sales report
   * @param shopId: shop's id
   * @param inputDay: date time in API payload
   */
  async getDataSalesReportDP(
    authRequest: APIRequestContext,
    shopId: string,
    inputDay: string,
    dpProductId?: number,
    dpProductDetail?: GetProductAPIResponse,
    optionData = "Product with sales",
  ): Promise<DPAnalyticsSalesReport> {
    const objReport: DPAnalyticsSalesReport = {
      product: {
        title: "",
        shop_name: "",
        views: 0,
        orders: 0,
        conversion_rate: 0,
        net_quantity: 0,
        sales: 0,
        contribute: 0,
        orders_summary: 0,
        total_summary: {
          total_orders: 0,
          net_sales: 0,
          view_content: 0,
        },
      },

      prod_type: {
        pr_type: "",
        views: 0,
        orders: 0,
        conversion_rate: 0,
        net_quantity: 0,
        sales: 0,
        contribute: 0,
        orders_summary: 0,
        total_summary: {
          total_orders: 0,
          net_sales: 0,
          view_content: 0,
        },
      },

      pricing_type: {
        pricing_type: "",
        views: 0,
        orders: 0,
        conversion_rate: 0,
        net_quantity: 0,
        sales: 0,
        contribute: 0,
        orders_summary: 0,
        total_summary: {
          total_orders: 0,
          net_sales: 0,
          view_content: 0,
        },
      },

      mem_type: {
        member_type: "",
        views: 0,
        orders: 0,
        conversion_rate: 0,
        net_quantity: 0,
        sales: 0,
        contribute: 0,
        orders_summary: 0,
        total_summary: {
          total_orders: 0,
          net_sales: 0,
          view_content: 0,
        },
      },
    };
    let responseProducts;
    let responseProdType;
    let responsePricingType;
    let responseMemberType;

    if (optionData === "Product without sales") {
      responseProducts = await authRequest.post(
        `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
        {
          data: {
            report_type: "product",
            from_time: inputDay,
            to_time: inputDay,
            group_by: ["product_id"],
            aov_field: "net_sales",
            having: [{ field: "total_orders", operator: "less_or_equal", value: "0", value_type: "hll" }],
          },
        },
      );
      await new Promise(t => setTimeout(t, 5000));

      responseProdType = await authRequest.post(
        `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
        {
          data: {
            report_type: "product_type",
            from_time: inputDay,
            to_time: inputDay,
            group_by: ["product_type"],
            aov_field: "net_sales",
            having: [{ field: "total_orders", operator: "less_or_equal", value: "0", value_type: "hll" }],
          },
        },
      );
      await new Promise(t => setTimeout(t, 5000));

      responsePricingType = await authRequest.post(
        `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
        {
          data: {
            report_type: "pricing_type",
            from_time: inputDay,
            to_time: inputDay,
            group_by: ["pricing_type"],
            aov_field: "net_sales",
            having: [{ field: "total_orders", operator: "less_or_equal", value: "0", value_type: "hll" }],
          },
        },
      );
      await new Promise(t => setTimeout(t, 5000));

      responseMemberType = await authRequest.post(
        `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
        {
          data: {
            report_type: "member_type",
            from_time: inputDay,
            to_time: inputDay,
            group_by: ["member_type"],
            order_by: ["member_type desc"],
            aov_field: "net_sales",
            having: [{ field: "total_orders", operator: "less_or_equal", value: "0", value_type: "hll" }],
          },
        },
      );
      await new Promise(t => setTimeout(t, 5000));
    }

    responseProducts = await authRequest.post(`https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`, {
      data: {
        report_type: "product",
        from_time: inputDay,
        to_time: inputDay,
        group_by: ["product_id"],
        aov_field: "net_sales",
      },
    });
    await new Promise(t => setTimeout(t, 5000));

    responseProdType = await authRequest.post(`https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`, {
      data: {
        report_type: "product_type",
        from_time: inputDay,
        to_time: inputDay,
        group_by: ["product_type"],
        aov_field: "net_sales",
      },
    });
    await new Promise(t => setTimeout(t, 5000));

    responsePricingType = await authRequest.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
      {
        data: {
          report_type: "pricing_type",
          from_time: inputDay,
          to_time: inputDay,
          group_by: ["pricing_type"],
          aov_field: "net_sales",
        },
      },
    );
    await new Promise(t => setTimeout(t, 5000));

    responseMemberType = await authRequest.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
      {
        data: {
          report_type: "member_type",
          from_time: inputDay,
          to_time: inputDay,
          group_by: ["member_type"],
          order_by: ["member_type desc"],
          aov_field: "net_sales",
        },
      },
    );
    await new Promise(t => setTimeout(t, 5000));

    if (responseProducts.ok()) {
      const responseBody = await responseProducts.json();
      if (responseBody.data.length > 0) {
        const dataReportProduct = responseBody.data.find(
          (data: { product_id: number }) => data.product_id === dpProductId,
        );

        objReport.product.title = dataReportProduct["product_title"];
        objReport.product.shop_name = dataReportProduct["domain"];
        objReport.product.views = dataReportProduct["view_content"];
        objReport.product.orders = dataReportProduct["total_orders"];
        objReport.product.conversion_rate = dataReportProduct["cr_rate"];
        objReport.product.net_quantity = dataReportProduct["total_items"];
        objReport.product.sales = dataReportProduct["net_sales"];
        objReport.product.contribute = dataReportProduct["contribution_rate"];
        objReport.product.orders_summary = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.total_orders = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.net_sales = responseBody["summary"]["net_sales"];
        objReport.product.total_summary.view_content = responseBody["summary"]["view_content"];
      } else {
        return objReport;
      }
    } else {
      return Promise.reject(`Error: ${responseProducts.statusText}`);
    }

    if (responseProdType.ok()) {
      const responseBody = await responseProdType.json();
      if (responseBody.data.length > 0) {
        const dataReportProductType = responseBody.data.find(
          (data: { product_type: string }) =>
            data.product_type === dpProductDetail.data.products[0].product.product_type,
        );
        objReport.prod_type.pr_type = dataReportProductType["product_type"];
        objReport.prod_type.views = dataReportProductType["view_content"];
        objReport.prod_type.orders = dataReportProductType["total_orders"];
        objReport.prod_type.conversion_rate = dataReportProductType["cr_rate"];
        objReport.prod_type.net_quantity = dataReportProductType["total_items"];
        objReport.prod_type.sales = dataReportProductType["net_sales"];
        objReport.prod_type.contribute = dataReportProductType["contribution_rate"];
        objReport.prod_type.orders_summary = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.total_orders = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.net_sales = responseBody["summary"]["net_sales"];
        objReport.product.total_summary.view_content = responseBody["summary"]["view_content"];
      } else {
        return objReport;
      }
    } else {
      return Promise.reject(`Error: ${responseProdType.statusText}`);
    }

    if (responsePricingType.ok()) {
      const responseBody = await responsePricingType.json();
      if (responseBody.data.length > 0) {
        const dataReportPricingType = responseBody.data.find(
          (data: { pricing_type: string }) =>
            data.pricing_type === dpProductDetail.data.products[0].product.variant_offers[0].name,
        );

        objReport.pricing_type.pricing_type = dataReportPricingType["pricing_type"];
        objReport.pricing_type.views = dataReportPricingType["view_content"];
        objReport.pricing_type.orders = dataReportPricingType["total_orders"];
        objReport.pricing_type.conversion_rate = dataReportPricingType["cr_rate"];
        objReport.pricing_type.net_quantity = dataReportPricingType["total_items"];
        objReport.pricing_type.sales = dataReportPricingType["net_sales"];
        objReport.pricing_type.contribute = dataReportPricingType["contribution_rate"];
        objReport.pricing_type.orders_summary = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.total_orders = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.net_sales = responseBody["summary"]["net_sales"];
        objReport.product.total_summary.view_content = responseBody["summary"]["view_content"];
      } else {
        return objReport;
      }
    } else {
      return Promise.reject(`Error: ${responsePricingType.statusText}`);
    }

    if (responseMemberType.ok()) {
      const responseBody = await responseMemberType.json();
      objReport.mem_type.member_type = "return";
      if (responseBody.data.length) {
        const dataReportMemberType = responseBody.data.find(
          (data: { member_type: string }) => data.member_type === "return",
        );

        objReport.mem_type.views = dataReportMemberType["view_content"];
        objReport.mem_type.orders = dataReportMemberType["total_orders"];
        objReport.mem_type.conversion_rate = dataReportMemberType["cr_rate"];
        objReport.mem_type.net_quantity = dataReportMemberType["total_items"];
        objReport.mem_type.sales = dataReportMemberType["net_sales"];
        objReport.mem_type.contribute = dataReportMemberType["contribution_rate"];
        objReport.mem_type.orders_summary = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.total_orders = responseBody["summary"]["total_orders"];
        objReport.product.total_summary.net_sales = responseBody["summary"]["net_sales"];
        objReport.product.total_summary.view_content = responseBody["summary"]["view_content"];
      } else {
        return objReport;
      }
    } else {
      return Promise.reject(`Error: ${responseMemberType.statusText}`);
    }
    return objReport;
  }

  /**
   * Get data from analytics Sales report shop PlusBase
   * @param authRequest
   * @param shopId: shop's id
   * @param inputDay: date time in API payload
   */
  async getDataSalesReportsPlb(
    authRequest: APIRequestContext,
    shopId: string,
    inputDay: string,
  ): Promise<{ product: { total_profit: number; title: string } }> {
    const objReportBy = {
      product: {
        title: "",
        total_profit: 0,
      },
    };
    const responseProducts = await authRequest.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
      {
        data: {
          report_type: "product",
          from_time: inputDay,
          to_time: inputDay,
          group_by: ["product_id"],
          aov_field: "total_profit",
        },
      },
    );

    if (responseProducts.ok()) {
      const responseBody = await responseProducts.json();
      if (responseBody.summary !== null) {
        objReportBy.product.title = responseBody.summary.product_title;
        objReportBy.product.total_profit = responseBody.summary.total_profit;
      }
    }

    return objReportBy;
  }

  async searchWithValue(value: string, filterBy: string) {
    const sbPage = new SBPage(this.page, this.domain);
    await this.page.selectOption(
      "//h4[normalize-space()='Sales reports']//parent::div//following-sibling::div//p[normalize-space()='Report by']" +
        "//following-sibling::div[@class='s-select']//select",
      filterBy,
    );
    await sbPage.inputFieldWithLabel("", "Search", value, 1);
  }

  /**
   * Get data Traffic by campaigns from API
   */
  async getDataTrafficByCamp(
    authRequest: APIRequestContext,
    shopId: string,
    inputDay: string,
    filterBy: string,
    utmSource: string,
  ): Promise<UTM> {
    const objTrafficCampaigns = {
      source: "",
      medium: "",
      campaigns: "",
      term: "",
      content: "",
      views: 0,
      session_converted: 0,
      orders: 0,
      sales: 0,
      net_quantity: 0,
    };

    const response = await authRequest.post(`https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`, {
      data: {
        report_type: "utm_campaign",
        from_time: inputDay,
        to_time: inputDay,
        group_by: [`${filterBy}`],
        aov_field: "total_sales",
      },
    });

    if (response.ok()) {
      const requestBody = await response.json();
      for (let i = 0; i < requestBody.data.length; i++) {
        if (requestBody.data[i].utm_source == utmSource) {
          objTrafficCampaigns.source = requestBody.data[i].utm_source;
          objTrafficCampaigns.medium = requestBody.data[i].utm_medium;
          objTrafficCampaigns.campaigns = requestBody.data[i].utm_campaign;
          objTrafficCampaigns.term = requestBody.data[i].utm_term;
          objTrafficCampaigns.content = requestBody.data[i].utm_content;
          objTrafficCampaigns.views = requestBody.data[i].view_content;
          objTrafficCampaigns.orders = requestBody.data[i].orders;
          objTrafficCampaigns.session_converted = requestBody.data[i].session_converted;
          objTrafficCampaigns.net_quantity = requestBody.data[i].net_quantity;
          objTrafficCampaigns.sales = requestBody.data[i].sales;
        }
      }
    }
    return objTrafficCampaigns;
  }

  async getVisitorDashboard(): Promise<string> {
    await this.page.reload();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1500);
    return await this.page.textContent(
      "//p[normalize-space()='Visitors right now']" +
        "//parent::div[contains(@class,'text-content')]//following-sibling::div",
    );
  }

  /**
   * Get data session, total sales and total orders in dashboard live view
   * @param input: field input for getting data
   */

  async getLiveViewData(input: "sessions" | "sales" | "orders"): Promise<string> {
    await this.page.reload();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1500);
    const totalSales = await this.page.textContent(`//div[normalize-space()='Total ${input}']//following-sibling::div`);
    return totalSales.trim().replace("$", "");
  }

  /**
   * Gen unique email for brand new customer
   * @param email: email from config
   */
  async setUniqueEmail(email: string) {
    const emailPart = email.trim().split("@");
    const ts = String(Date.now());
    return `${emailPart[0]}+${ts}@${emailPart[1]}`;
  }

  /**
   * Validate data analytics changed after convert order, which means they need the changed data for calculate data
   * changed correctting or not
   * @param dataAnalyticsBefore: the data analytics before updated (total sales/profits, conversion, orders, items,...)
   * @param initData
   * @param authRequest
   * @param shopId: shop's id
   * @param today: date for calling API, which is set following shop's timezone
   * @param timeOut: waiting time for the next API calling (which prevent spam calling)
   * @param platform: this is defined that platform using sales or profits (ShopBase or PrintBase/PlusBase)
   * @param hasCheckout
   */
  async validateDataChanges(
    dataAnalyticsBefore,
    initData: DataAnalytics,
    authRequest: APIRequestContext,
    shopId: string,
    today: string,
    timeOut: number,
    platform: "total_profit" | "total_sales",
    hasCheckout?: boolean,
  ): Promise<DataAnalytics> {
    let dataChanges: DataAnalytics;

    for (let i = 0; i < 7; i++) {
      dataChanges = await this.getDataAnalyticsAPIDashboard(authRequest, shopId, today, initData, platform);
      // dataChanges = renameKey(dataChanges, "conversion_rate", "cr_rate");

      const validateCase1 =
        dataAnalyticsBefore["summary"][platform] !== dataChanges["summary"][platform] &&
        dataAnalyticsBefore["summary"]["view_content"] <= dataChanges["summary"]["view_content"];

      const validateCase2 =
        dataAnalyticsBefore["summary"][platform] == dataChanges["summary"][platform] &&
        dataAnalyticsBefore["summary"]["view_content"] < dataChanges["summary"]["view_content"];

      const validateCase3 =
        dataAnalyticsBefore["summary"][platform] !== dataChanges["summary"][platform] &&
        dataAnalyticsBefore["summary"]["view_content"] == dataChanges["summary"]["view_content"];
      if (validateCase1) {
        return dataChanges;
      }
      if (hasCheckout == false && (validateCase2 || validateCase3)) {
        return dataChanges;
      }

      await new Promise(t => setTimeout(t, timeOut));
    }
    return Promise.reject("Timeout rollup data in database for updating API");
  }

  async getTotalSummary(authRequest: APIRequestContext, shopId: string, inputDay: string): Promise<DPTotalSummary> {
    const res: DPTotalSummary = {
      total_summary: {
        total_orders: 0,
        net_sales: 0,
        view_content: 0,
      },
    };
    const responseProducts = await authRequest.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
      {
        data: {
          report_type: "product",
          from_time: inputDay,
          to_time: inputDay,
          group_by: ["product_id"],
          aov_field: "net_sales",
        },
      },
    );
    await new Promise(t => setTimeout(t, 5000));
    const jsonRes = await responseProducts.json();
    res.total_summary.total_orders = jsonRes["summary"]["total_orders"];
    res.total_summary.net_sales = jsonRes["summary"]["net_sales"];
    res.total_summary.view_content = jsonRes["summary"]["view_content"];
    return res;
  }

  /**
   * Function check data sale report with between total shop and sum of two shops
   * @param dataSalesReport Data total of two shop
   * @param totalSalesReport Data call api with two shopID
   * @returns
   */
  async validateDPSalesReportEqualTotal(
    dataSalesReport: DataAnalytics,
    totalSalesReport: DataAnalytics,
  ): Promise<boolean> {
    const validateTotalOrders = dataSalesReport.summary.total_orders === totalSalesReport.summary.total_orders;
    const validateTotalSales = dataSalesReport.summary.total_sales === totalSalesReport.summary.total_sales;
    const validateViewContent = dataSalesReport.summary.view_content === totalSalesReport.summary.view_content;

    if (validateTotalOrders == true && validateTotalSales == true && validateViewContent == true) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Function return sum data of 2 shop
   * @param dataSalesReport1 data shop 1
   * @param dataSalesReport2 data shop 2
   * @returns
   */
  async sumOfTwoDPSalesReport(
    dataSalesReport1: DataAnalytics,
    dataSalesReport2: DataAnalytics,
  ): Promise<DataAnalytics> {
    const result: DataAnalytics = dataSalesReport1;

    result.summary.total_orders = dataSalesReport1.summary.total_orders + dataSalesReport2.summary.total_orders;
    result.summary.total_sales = dataSalesReport1.summary.total_sales + dataSalesReport2.summary.total_sales;
    result.summary.view_content = dataSalesReport1.summary.view_content + dataSalesReport2.summary.view_content;

    return result;
  }

  /**
   * Function return data sale report after checkout success
   * @param authRequest
   * @param dataSalesReportBefore
   * @param shopId
   * @param inputDay
   * @param dpProductId
   * @param dpProductDetail
   * @param timeOut
   * @returns
   */
  async validateDPSalesReportChanged(
    authRequest: APIRequestContext,
    dataSalesReportBefore: DPAnalyticsSalesReport,
    shopId: string,
    inputDay: string,
    dpProductId: number,
    dpProductDetail: GetProductAPIResponse,
    timeOut: number,
    optionData?: string,
  ): Promise<DPAnalyticsSalesReport> {
    let dataChanges: DPAnalyticsSalesReport;
    for (let i = 0; i < 7; i++) {
      dataChanges = await this.getDataSalesReportDP(authRequest, shopId, inputDay, dpProductId, dpProductDetail);

      const validateCase1 =
        dataSalesReportBefore["product"]["sales"] !== dataChanges["product"]["sales"] &&
        dataSalesReportBefore["product"]["views"] <= dataChanges["product"]["views"];

      const validateCase2 =
        dataSalesReportBefore["product"]["sales"] == dataChanges["product"]["sales"] &&
        dataSalesReportBefore["product"]["views"] < dataChanges["product"]["views"];

      if (validateCase1 || validateCase2) {
        return dataChanges;
      }
      if (optionData === "Product without sales") {
        return dataChanges;
      }
      await new Promise(t => setTimeout(t, timeOut));
    }
    return Promise.reject("Timeout rollup data in database for updating API");
  }

  /**
   * Get data UTM report by api
   * @param authRequest,
   * @param shopId: Shop id
   * @param inputDate: date time get following timezone shop
   * @param groupBy: param utm which is used for query data
   */
  async getDataUTMReport(
    authRequest: APIRequestContext,
    shopId: string,
    inputDate: string,
    groupBy: string[],
    reportType = "product_utm",
  ): Promise<DataUtmSalesReport[]> {
    const defaultData = [
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
    const resUTMReportData = await authRequest.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`,
      {
        data: {
          report_type: reportType,
          from_time: inputDate,
          to_time: inputDate,
          group_by: groupBy,
          aov_field: "net_sales",
          shopIds: shopId,
          is_fetch_single: false,
        },
      },
    );

    if (resUTMReportData.ok()) {
      const rawDataUTMRportData = await resUTMReportData.json();
      if (rawDataUTMRportData.data.length > 0) {
        return rawDataUTMRportData.data;
      } else {
        return defaultData;
      }
    } else {
      return defaultData;
    }
  }

  /**
   * Find index of the array object which has product_id and source that want to verify
   * @param firstData: first array object
   * @param secondData: second array object
   * @param productId: product id which is required for looking for index
   * @param identifier: source which required for looking for index
   */
  async indexData(firstData: Array<object>, secondData: Array<object>, identifier: string, productId?: number) {
    const index = { indexBefore: 0, indexAfter: 0 };
    if (productId) {
      if (
        firstData.findIndex(source => {
          return source["product_id"] === productId && source["utm_source"] === identifier;
        }) > -1
      ) {
        index.indexBefore = firstData.findIndex(source => {
          return source["product_id"] === productId && source["utm_source"] === identifier;
        });
      }
      if (
        secondData.findIndex(source => {
          return source["product_id"] === productId && source["utm_source"] === identifier;
        }) > -1
      ) {
        index.indexAfter = secondData.findIndex(source => {
          return source["product_id"] === productId && source["utm_source"] === identifier;
        });
      }
    } else {
      if (firstData.findIndex(source => source["utm_source"] === identifier) > -1) {
        index.indexBefore = firstData.findIndex(source => source["utm_source"] === identifier);
      }
      if (secondData.findIndex(source => source["utm_source"] === identifier) > -1) {
        index.indexAfter = secondData.findIndex(source => source["utm_source"] === identifier);
      }
    }
    return index;
  }

  /**
   * Validate data analytics changed after convert order, which means they need the changed data for calculate data
   * changed correctting or not. It's used for analytics report
   * @param dataUtmSalesReportBefore: the data analytics before updated (total sales/profits, conversion, orders,
   * items,...)
   * @param authRequest
   * @param shopId: shop's id
   * @param today: date time get following timezone shop
   * @param paramApi: param utm which is used for query data
   * @param productId: product id
   * @param identifier: source of product
   * @param timeOut: the gap between 2 times call api
   * @param dataValidate: property which need to validate data changed (suggest use total_sales or total_profit)
   */
  async validateDataUTMReportChange(
    dataUtmSalesReportBefore: Array<object>,
    authRequest: APIRequestContext,
    shopId: string,
    today: string,
    paramApi,
    identifier: string,
    timeOut: number,
    dataValidate: string,
    productId?: number,
  ) {
    let dataChanges;
    for (let i = 0; i < 7; i++) {
      dataChanges = await this.getDataUTMReport(authRequest, shopId, today, paramApi);

      //Find index of the data validate with identifier
      const index = await this.indexData(dataUtmSalesReportBefore, dataChanges, identifier, productId);

      //Check dataBefore and dataAfter are defined because case new data update, the index is equal -1
      if (index.indexBefore !== -1 && index.indexAfter !== -1) {
        if (dataUtmSalesReportBefore[index.indexBefore][dataValidate] !== dataChanges[index.indexAfter][dataValidate]) {
          break;
        }
      }
      //Check if either dataBefore or dataAfter is undefined because each of them or both of them are equal -1
      else {
        //Check if dataAfter is defined
        if (dataChanges[index.indexAfter][dataValidate]) {
          break;
        }
      }
      await new Promise(t => setTimeout(t, timeOut));
    }
    return dataChanges;
  }

  /**
   * Validate data Traffic source report in Digital product
   * @param authRequest: request api
   * @param shopID: shop's id
   * @param channelName: channel in analytics
   * @param inputday: the day for call api
   * @param reportType: report type in api
   * @param dataTrafficChannelsBefore: data traffic source before for compare data changed
   * @param timeOut: the time gap between 2 times call api
   */
  async validateDPTrafficSourceReportChanged(
    authRequest: APIRequestContext,
    shopID: string,
    channelName: string,
    inputday: string,
    reportType: string,
    dataTrafficChannelsBefore: ReportData,
    timeOut: number,
  ): Promise<ReportData> {
    let dataChanges: ReportData;
    for (let i = 0; i < 7; i++) {
      dataChanges = await this.getReportByChannel(authRequest, shopID, channelName, inputday, reportType);

      const validateCase1 =
        dataTrafficChannelsBefore["sales"] !== dataChanges["sales"] &&
        dataTrafficChannelsBefore["view_page"] <= dataChanges["view_page"];

      const validateCase2 =
        dataTrafficChannelsBefore["sales"] == dataChanges["sales"] &&
        dataTrafficChannelsBefore["view_page"] < dataChanges["view_page"];

      if (validateCase1 || validateCase2) {
        return dataChanges;
      }

      await new Promise(t => setTimeout(t, timeOut));
    }
    if (dataTrafficChannelsBefore.sales === dataChanges.sales) {
      return Promise.reject("Timeout rollup data in database for updating API");
    }
  }

  /**
   * This function is detect lineitem in table sales report using product name and utm param
   * @param productOnlineStore: product online store name
   * @param productUpsell: product upsell name
   * @param utmSource: param which attend with link landing page
   */
  async getIndexUTMDashboard(productOnlineStore: string, productUpsell: string, utmSource: string) {
    await new Promise(t => setTimeout(t, 5000));
    const xpathProductOS =
      `//span[normalize-space()='${productOnlineStore}']` +
      `//ancestor::td[contains(@class, 'product-title')]//following-sibling::td` +
      `//span[normalize-space()='${utmSource}']//ancestor::tr[contains(@class, 'traffic-source')]` +
      `//preceding-sibling::tr`;
    const xpathProductUpsell =
      `//span[normalize-space()='${productUpsell}']` +
      `//ancestor::td[contains(@class, 'product-title')]//following-sibling::td` +
      `//span[normalize-space()='${utmSource}']//ancestor::tr[contains(@class, 'traffic-source')]` +
      `//preceding-sibling::tr`;

    const indexProdOS = (await this.page.locator(xpathProductOS).count()) + 1;
    const indexProdUS = (await this.page.locator(xpathProductUpsell).count()) + 1;

    return { indexProdOS, indexProdUS };
  }

  /**
   * Change sort filed in dashboard sales report
   * @param sortField: this field on dashboard that need to sort
   */
  async changeSortSalesReport(sortField: string) {
    await this.page
      .locator(`//thead//th//span[normalize-space()='${sortField}']`)
      .click({ button: "left", clickCount: 2, delay: 8000 });
  }

  /**
   * Fuction validate data traffic source report change
   * @param dataBefore: data before actions on storefront
   * @param authRequest: api authentication
   * @param shopID: shop's id
   * @param referrerName: referrer value
   * @param inputDay: input date for api
   * @param reportType: type of report
   * @param i
   */
  async validateReportByChannel(
    dataBefore: ReportData,
    authRequest: APIRequestContext,
    shopID: string,
    referrerName: string,
    inputDay: string,
    reportType: string,
    i = 0,
  ): Promise<ReportData> {
    if (i >= 10) {
      return Promise.reject("Timeout rollup data in database for updating API");
    }
    logger.info(`-----> Data before = ${JSON.stringify(dataBefore)}`);
    const dataChanges = await this.getReportByChannel(authRequest, shopID, referrerName, inputDay, reportType);
    logger.info(`-----> Data after = ${JSON.stringify(dataChanges)}`);
    const validateCase1 = dataBefore["sales"] !== dataChanges["sales"] && dataBefore["views"] <= dataChanges["views"];

    const validateCase2 =
      dataBefore["sales"] == dataChanges["sales"] && dataBefore["view_page"] < dataChanges["view_page"];

    if (validateCase1 || validateCase2) {
      return dataChanges;
    }

    await new Promise(t => setTimeout(t, 19000));

    return this.validateReportByChannel(dataBefore, authRequest, shopID, referrerName, inputDay, reportType, i + 1);
  }

  /**
   * Function get conversion of analytics by API
   * @param authRequest api authentication
   * @param fromDate input date for api
   * @param toDate input date for api
   * @param shopId shop's id
   * @param platform "sales"|"profits"
   * @param obj type of conversion
   * @returns type of conversion
   */
  async getConversionAnaAPI(
    authRequest: APIRequestContext,
    fromDate: string,
    toDate: string,
    shopId,
    platform: string,
    obj: ConversionSummary,
  ) {
    const apiCr = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: {
        aov_field: platform,
        from_time: fromDate,
        to_time: toDate,
        report_type: "conversion_analytic_funnel",
        funnel_steps: ["view_all", "view_collect", "view_product", "add_to_cart", "reached_checkout", "purchase"],
        group_by: ["display_time"],
        interval: "day",
      },
    });
    if (apiCr.ok()) {
      const rawResponseCR = await apiCr.json();
      if (rawResponseCR.summary != null) {
        obj = rawResponseCR.summary;
      }
    }
    return obj;
  }

  /**
   * Filter shops in a list
   * @param shopDomains domain of shops
   */
  async filterShops(shopDomains: string[]) {
    await this.page.click('//button[normalize-space()="Current store"]', { timeout: 30000 });
    for (const shopDomain of shopDomains) {
      await this.page.click(`//label[@title="${shopDomain}"]`, { timeout: 30000 });
      await this.page.waitForTimeout(2000);
    }
    await this.page.click("//h2");
  }

  /**
   * Function get info of order recovery by email
   * @param authRequest api authentication
   * @param fromDate input date for api
   * @param toDate input date for api
   * @param shopId shop's id
   * @param platform "sales"|"profits"
   * @param obj type of data
   * @returns data of order recovery by email
   */
  async getQuantityOfOrderRecoveryByEmail(
    authRequest: APIRequestContext,
    fromDate: string,
    toDate: string,
    shopId,
    platform: "total_profit" | "total_sales",
    initData: OrderConversionFunnel,
  ): Promise<OrderConversionFunnel> {
    let obj = cloneDeep(initData);
    const apiACr = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: {
        aov_field: platform,
        from_time: fromDate,
        to_time: toDate,
        report_type: "shop_acr",
      },
    });
    if (apiACr.ok()) {
      const rawResponseACR = await apiACr.json();
      if (rawResponseACR.data.email != null) {
        obj = rawResponseACR.data.email;
      }
    }
    return obj;
  }

  /**
   * Function get info of order recovery by other
   * @param authRequest api authentication
   * @param fromDate input date for api
   * @param toDate input date for api
   * @param shopId shop's id
   * @param platform "sales"|"profits"
   * @param obj type of data
   * @returns data of order recovery by other
   */
  async getQuantityOfOrderRecoveryByOther(
    authRequest: APIRequestContext,
    fromDate: string,
    toDate: string,
    shopId,
    platform: "total_profit" | "total_sales",
    initData: OrderConversionFunnel,
  ): Promise<OrderConversionFunnel> {
    let obj = cloneDeep(initData);
    const apiACr = await authRequest.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: {
        aov_field: platform,
        from_time: fromDate,
        to_time: toDate,
        report_type: "shop_acr",
      },
    });
    if (apiACr.ok()) {
      const rawResponseACR = await apiACr.json();
      if (rawResponseACR.data.other != null) {
        obj = rawResponseACR.data.other;
      }
    }
    return obj;
  }

  /**
   * Filter has sales in Sales Reports
   * @param value of has sales
   */
  async filterWithHasSales(value: "both" | "yes" | "no") {
    await this.page.click('//button[contains(@class,"report-campain")]', { timeout: 60000 });
    await this.page.click(`//input[@value="${value}"]/following-sibling::span[1]`, { timeout: 60000 });
    await this.page.waitForSelector("//table/thead/tr/th[1]", { timeout: 90000 });
    await this.page.click('//button[contains(@class,"report-campain")]', { timeout: 60000 });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Return quantity of data no has sales
   * @returns quantity of data no has sales
   */
  async countHasSales(data: "yes" | "no") {
    const index = await this.getIndexOfColumn("Orders");
    if (data == "no") {
      return await this.page.locator(`//tr/td[${index}]/div[normalize-space()="0"]`).count();
    } else if (data == "yes") {
      return await this.page.locator(`//tr/td[${index}]/div[not(normalize-space()="0")]`).count();
    }
  }

  /**
   * Filter date range with the options in the page
   * @param dateRange : the options to filter date range
   */
  async filterDateRange(dateRange: string) {
    await this.page.locator('//div[contains(@class,"calendar-btn")]').click();
    await this.page.locator("(//span[normalize-space()='From']//following-sibling::input)[1]").click();
    await this.page.click(`//div[@class="s-picker-panel__sidebar"]/button[normalize-space()="${dateRange}"]`);
    await this.page.waitForSelector('//*[contains(@class,"s-picker-panel s-date-range-picker")]', { state: "hidden" });
    await this.page.waitForSelector(this.xpathHeaderTable, { timeout: 60000 });
  }

  /**
   * Get from date and to date in date range
   * @returns From date and to date in date range
   */
  async getDateInFilter() {
    await this.page.locator('//div[contains(@class,"calendar-btn")]').click();
    const fromDate = await (
      await (
        await this.page.locator('(//span[normalize-space()="From"]/following-sibling::input)[1]').elementHandle()
      ).getProperty("value")
    ).jsonValue();
    const toDate = await (
      await (
        await this.page.locator('(//span[normalize-space()="to"]/following-sibling::input)[1]').elementHandle()
      ).getProperty("value")
    ).jsonValue();
    await this.page.locator('//div[contains(@class,"calendar-btn")]').click();
    return { fromDate, toDate };
  }

  /**
   * Filter date from custom date to custom date
   * @param fromDate the start date for filter
   * @param toDate the end date for filter
   */
  async filterDateFromTo(fromDate: string, toDate: string) {
    await this.page.locator('//div[contains(@class,"calendar-btn")]').click();
    await this.page.locator("(//span[normalize-space()='From']//following-sibling::input)[1]").click();
    await this.page.locator("//button[contains(@class, 'icon-arrow-left')]").click();
    await this.page.click(
      `(//div[@class="s-picker-panel__content s-date-range-picker__content is-left"]//td[@class="available"])[${fromDate}]`,
    );
    await this.page.click(
      `(//div[@class="s-picker-panel__content s-date-range-picker__content is-left"]//td[@class="available"])[${toDate}]`,
    );
  }

  /**
   * Filter data with variant option
   * @param type - type of variont option
   * @param value - value for filter
   */
  async filterVariantOption(type: "contains" | "not_contains" | "clear", value = "") {
    await this.page.click('//button[normalize-space()="Variant option"]');
    if (type == "clear") {
      await this.page.click('//a[normalize-space()="Clear"]');
    } else {
      await this.page.click(`//input[@value="${type}"]/following-sibling::span[last()]`);
      await this.page.getByPlaceholder("Search variant option").pressSequentially(value, { delay: 10 });
      await this.page.waitForTimeout(1000);
    }
    await this.page.click('//button[normalize-space()="Variant option"]');
  }

  /**
   * Filter data with variant option
   * @param type - type of variont option
   * @param value - value for filter
   */
  async filterProductType(type: "contains" | "not_contains" | "clear", value = "") {
    await this.page.click('//button[normalize-space()="Product Type"]');
    if (type == "clear") {
      await this.page.click('//a[normalize-space()="Clear"]');
    } else {
      await this.page.click(`//input[@value="${type}"]/following-sibling::span[last()]`);
      await this.page.getByPlaceholder("Search the product type").pressSequentially(value, { delay: 10 });
      await this.page.waitForTimeout(1000);
    }
    await this.page.click('//button[normalize-space()="Product Type"]');
  }

  /**
   * Return locator follow name of column in Sales reports
   * @param columnName the name of the column
   * @returns locator follow name of column
   */
  async genLocatorDataWithColumn(columnName: string) {
    const index = await this.getIndexOfColumn(columnName);
    return this.page.locator(`//div[@class="sales-data"]//tbody/tr/td[${index}]/div`);
  }

  /**
   * Choose group by field in conversion analytics
   * @param value of group by filed
   */
  async chooseGroupBy(value: "hour" | "day" | "week" | "month") {
    await this.page.selectOption('//p[normalize-space()="Group by:"]//following-sibling::div//select', value);
    await this.page.waitForSelector(`(${this.xpathHeaderTable})[last()]`);
  }

  /**
   * Select countries
   * @param countries list of country to select
   */
  async selectCountries(countries: string[]) {
    await this.page.click('//button[normalize-space()="Select countries"]');
    for (const country of countries) {
      await this.page.locator('//input[@placeholder="Search for countries"]').pressSequentially(country, { delay: 20 });
      await this.page.click(
        `//div[contains(@class,"s-autocomplete control")]//span[contains(@class,"dropdown-item") and normalize-space()="${country}"]`,
      );
    }
  }

  /**
   * Choose option for funnel
   * @param from start option for funnel
   * @param to end option for funnel
   */
  async chooseFunnel(from: string, to: string) {
    const funnelSelect = '//p[normalize-space()="Funnel"]//following-sibling::div/div[@class="s-select"]';
    await this.page.selectOption(`(${funnelSelect})[1]//select`, from);
    await this.page.selectOption(`(${funnelSelect})[2]//select`, to);
  }

  /**
   * Select barchart funnel
   * @param option of the barchart funnel
   */
  async selectBarchartFunnel(option: string) {
    await this.page.click(this.xpathStepFunnel);
    await this.page.click(`//label[normalize-space()="${option}"]`);
    await this.page.waitForSelector(`(${this.xpathHeaderTable})[last()]`);
    await this.page.click(this.xpathStepFunnel);
  }

  /**
   * Return locator follow name of column in Conversion analytics
   * @param columnName the name of the column
   * @returns locator follow name of column
   */
  async genLocatorValueWithColumn(columnName: string, at: "header" | "body", row = 1) {
    const index = (await this.getIndexOfColumn(columnName)) + (await this.getIndexOfColumn(columnName)) - 2;
    if (at == "header") {
      return this.page.locator(`//div[@class="sales-data"]//thead/tr/th[${index}]/p`);
    } else {
      return this.page.locator(`(//div[@class="sales-data"]//tbody/tr/td[${index}]/span)[${row}]`);
    }
  }

  /**
   * Remove filter all countries in conversion analytics
   */
  async clearFilterCountries() {
    const countriesQuantity = await this.page.locator(this.xpathRemoveCountry).count();
    for (let i = countriesQuantity; i > 0; i--) {
      await this.page.click(`(${this.xpathRemoveCountry})[${i}]`);
    }
  }

  /**
   * Get page view by API
   * @param authRequest
   * @returns the quantity of view page
   */
  async getPageViewByAPI(authRequest: APIRequestContext): Promise<number> {
    let pageView = 0;
    const apiPageView = await authRequest.post(
      `https://${this.domain}/admin/analytics/live-view.json?report_type=page_view`,
      {
        data: {
          since: -30,
        },
      },
    );
    if (apiPageView.ok()) {
      const rawResponse = await apiPageView.json();
      if (rawResponse.summary != null) {
        pageView = rawResponse.summary.view_page;
      }
    }
    return pageView;
  }

  /**
   * Get customer behavior data
   * @param authRequest
   * @param initData
   * @returns customer behavior data
   */
  async getCustomerBehaviorByAPI(
    authRequest: APIRequestContext,
    initData = { view_product: 0, add_to_cart: 0, reached_checkout: 0, order_distinct_count: 0 },
  ) {
    let behavior = cloneDeep(initData);
    const api = await authRequest.post(
      `https://${this.domain}/admin/analytics/live-view.json?report_type=conversion_rate`,
      {
        data: {
          since: -10,
        },
      },
    );
    if (api.ok()) {
      const rawResponse = await api.json();
      if (rawResponse.summary != null) {
        behavior = rawResponse.summary;
      }
    }
    return behavior;
  }
}
