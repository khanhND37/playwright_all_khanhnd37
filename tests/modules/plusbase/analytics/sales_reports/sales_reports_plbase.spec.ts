import { test } from "@core/fixtures";
import { expect } from "@playwright/test";
import { OrderAPI } from "@pages/api/order";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { DataAnalytics } from "@types";

let salesReports: AnalyticsPage;
let initData: DataAnalytics;
let dataAnalytics: DataAnalytics;
let dataAnalytics2: DataAnalytics;
let orderAPI: OrderAPI;
let sumProfit: string;
let noSales: number;
let yesSales: number;
let localeFormat;
let timeZoneShop;
let today;
let yesterday;
let filterDate: { fromDate: string; toDate: string };
let actProfit;
let anaProfit;
let anaProfit1;
let anaProfit2;

test.beforeEach(async ({ dashboard, conf, authRequest }) => {
  test.setTimeout(conf.suiteConf.time_out_tc);
  salesReports = new AnalyticsPage(dashboard, conf.suiteConf.domain);
  orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
  localeFormat = conf.suiteConf.locale_format;
  timeZoneShop = conf.suiteConf.time_zone;
  today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
  yesterday = await salesReports.formatDate(await salesReports.getDateXDaysAgo(1));
  initData = conf.suiteConf.data_analytics;
});

test.describe("Verify sale report", async () => {
  test(`@SB_ANA_SALE__27 On PLB, verify Report by Product kèm các điều kiện khác`, async ({ conf, authRequest }) => {
    await test.step(`Filter Sales reports với: Report by Product, Has sales: both, Today`, async () => {
      await salesReports.gotoSalesReport();
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "product");
      await salesReports.filterWithHasSales("both");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, today, today);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, Today`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, Today`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: both, Yesterday`, async () => {
      await salesReports.filterDateOnAna(conf.suiteConf.yesterday);
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "product");
      await salesReports.filterWithHasSales("both");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        yesterday,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, yesterday, yesterday);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, Yesterday`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, Yesterday`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: both, Last month`, async () => {
      await salesReports.filterDateRange("Last month");
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "product");
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, Last month`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, Last month`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: both, Month to date`, async () => {
      await salesReports.filterDateRange("Month to date");
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "product");
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, Month to date`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, Month to date`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: both, 15 days in last month`, async () => {
      await salesReports.filterDateFromTo("1", "15");
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "product");
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, 15 days in last month`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, 15 days in last month`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: both, Last 90 days`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterDateRange("Last 90 days");
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "product");
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, Last 90 days`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, Last 90 days`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: both, Last 7 days, 2 stores`, async () => {
      await salesReports.filterWithHasSales("both");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterShops(conf.suiteConf.domain_store_2);
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterDateRange("Last 7 days");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      dataAnalytics2 = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content + dataAnalytics2.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = (dataAnalytics.summary.total_profit + dataAnalytics2.summary.total_profit).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: yes, Last 7 days, 2 stores`, async () => {
      await salesReports.filterWithHasSales("yes");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Report by Product, Has sales: no, Last 7 days, 2 stores`, async () => {
      await salesReports.filterWithHasSales("no");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search product title`, async () => {
      await salesReports.filterWithHasSales("both");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content + dataAnalytics2.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await salesReports.page
          .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
          .pressSequentially(conf.suiteConf.product_title);
        await salesReports.page.waitForTimeout(2000);
        await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
        await expect(
          salesReports.locatorProductTitleInSalesReports.filter({ hasNotText: conf.suiteConf.product_title }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Click Export`, async () => {
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await salesReports.page.click('//button[normalize-space()="Export"]');
        await expect(salesReports.page.locator(salesReports.xpathToastMessage)).toContainText(
          conf.suiteConf.export_msg,
        );
      }
    });
    // Tach thanh case rieng de check
    // await test.step(`Truy cập mail, check file export từ Sales reports`, async () => {
    //   mailinator = await getMailinatorInstanceWithProxy(page);
    //   await mailinator.accessMail(conf.suiteConf.staff_name);
    //   while (!(await mailinator.checkMailVisible("Export Report Data"))) {
    //     await mailinator.page.reload();
    //     await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
    //   }
    //   await mailinator.readMail("Export Report Data");
    //   const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
    //   const feedFileData = await readFileCSV(feedFile, "\t");
    //   expect(feedFileData[0][0]).toContain(
    //     (await salesReports.locatorProductTitleInSalesReports.first().textContent()).trim(),
    //   );
    // });
  });

  test(`@SB_ANA_SALE__28 On PLB, verify Report by Gross Profit kèm các điều kiện khác`, async ({
    authRequest,
    conf,
  }) => {
    await test.step(`Filter Sales reports với: Current store, Today, Report by Gross Profit`, async () => {
      await salesReports.gotoSalesReport();
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "gross_profit");
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, today, today);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Gross Profit`, async () => {
      await salesReports.filterDateOnAna(conf.suiteConf.yesterday);
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        yesterday,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, yesterday, yesterday);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Gross Profit`, async () => {
      await salesReports.filterDateRange("Last month");
      filterDate = await salesReports.getDateInFilter();
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Gross Profit`, async () => {
      await salesReports.filterDateRange("Month to date");
      filterDate = await salesReports.getDateInFilter();
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, date 1 đến 15 tháng trước, Report by Gross Profit`, async () => {
      await salesReports.filterDateFromTo("1", "15");
      filterDate = await salesReports.getDateInFilter();
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Gross Profit`, async () => {
      await salesReports.filterDateRange("Last 90 days");
      filterDate = await salesReports.getDateInFilter();
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 90 days, Report by Gross Profit`, async () => {
      await salesReports.filterShops(conf.suiteConf.domain_store_2);
      await salesReports.filterDateRange("Last 90 days");
      filterDate = await salesReports.getDateInFilter();
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      dataAnalytics2 = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = (dataAnalytics.summary.total_profit + dataAnalytics2.summary.total_profit).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Click Export`, async () => {
      await salesReports.filterDateRange("Month to date");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page.click('//button[normalize-space()="Export"]');
      await expect(salesReports.page.locator(salesReports.xpathToastMessage)).toContainText(conf.suiteConf.export_msg);
    });

    // Tach thanh case rieng de check
    // await test.step(`Truy cập mail, check file export từ Sales reports`, async () => {
    //   mailinator = await getMailinatorInstanceWithProxy(page);
    //   await mailinator.accessMail(conf.suiteConf.staff_name);
    //   while (!(await mailinator.checkMailVisible("Export Report Data"))) {
    //     await mailinator.page.reload();
    //     await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
    //   }
    //   await mailinator.readMail("Export Report Data");
    //   const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
    //   const feedFileData = await readFileCSV(feedFile, "\t");
    //   expect(feedFileData[0][0]).toContain(
    //     parseFloat((await salesReports.locatorFirstSalesOrGrossProfit.textContent()).trim().slice(1)).toString(),
    //   );
    // });
  });

  test(`@SB_ANA_SALE__29 On PLB, verify Report by Variant Option kèm các điều kiện khác`, async ({
    authRequest,
    conf,
  }) => {
    const variantOption = conf.caseConf.variant_option;
    await test.step(`Filter Sales reports với: Current store, Today, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.gotoSalesReport();
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "variant");
      await salesReports.filterWithHasSales("both");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, today, today);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Today, Report by Variant Option, Product has sales:yes, Variant option:Contains`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Today, Report by Variant Option, Product has sales:no, Variant option: null`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.filterDateOnAna(conf.suiteConf.yesterday);
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        yesterday,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, yesterday, yesterday);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
        await salesReports.filterVariantOption("not_contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Variant Option, Product has sales:yes, Variant option:yes`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Variant Option, Product has sales:no, Variant option: null`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("no");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.filterDateRange("Last month");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
        await salesReports.filterVariantOption("not_contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Variant Option, Product has sales:yes, Variant option:yes`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Variant Option, Product has sales:no, Variant option: null`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("no");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.filterDateRange("Month to date");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
        await salesReports.filterVariantOption("not_contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Variant Option, Product has sales:yes, Variant option:yes`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Variant Option, Product has sales:no, Variant option: null`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, 15 days in pre-month, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.filterDateFromTo("1", "15");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
        await salesReports.filterVariantOption("not_contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, 15 days in pre-month, Report by Variant Option, Product has sales:yes, Variant option:yes`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, 15 days in pre-month, Report by Variant Option, Product has sales:no, Variant option: null`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.filterDateRange("Last 90 days");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        //tren dev data team dev fix nen khong dung
        if (process.env.ENV === "dev") {
          return;
        }
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
        await salesReports.filterVariantOption("not_contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Variant Option, Product has sales:yes, Variant option:yes`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Variant Option, Product has sales:no, Variant option:null`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 7 days, Report by Variant Option, Product has sales: both, Variant option: null`, async () => {
      await salesReports.filterShops(conf.suiteConf.domain_store_2);
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterDateRange("Last 7 days");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      dataAnalytics2 = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.add_to_cart == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = (dataAnalytics.summary.total_profit + dataAnalytics2.summary.total_profit).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 7 days, Report by Variant Option, Product has sales:yes, Variant option:yes`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.add_to_cart == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        await salesReports.filterVariantOption("contains", variantOption);
        await expect(
          (await salesReports.genLocatorDataWithColumn("Variant option")).filter({ hasNotText: variantOption }),
        ).toHaveCount(0);
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 7 days, Report by Variant Option, Product has sales:no, Variant option: null`, async () => {
      await salesReports.filterVariantOption("clear");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("no");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      if (dataAnalytics.summary.add_to_cart == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search product title`, async () => {
      await salesReports.filterWithHasSales("both");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.product_title);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      await expect(
        await salesReports.locatorProductTitleInSalesReports.filter({ hasNotText: conf.suiteConf.product_title }),
      ).toHaveCount(0);
    });

    await test.step(`Click Export`, async () => {
      await salesReports.page.click('//button[normalize-space()="Export"]');
      await expect(salesReports.page.locator(salesReports.xpathToastMessage)).toContainText(conf.suiteConf.export_msg);
    });
    // Tach thanh case rieng de check
    // await test.step(`Truy cập mail, check file export từ Sales reports`, async () => {
    //   mailinator = await getMailinatorInstanceWithProxy(page);
    //   await mailinator.accessMail(conf.suiteConf.staff_name);
    //   while (!(await mailinator.checkMailVisible("Export Report Data"))) {
    //     await mailinator.page.reload();
    //     await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
    //   }
    //   await mailinator.readMail("Export Report Data");
    //   const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
    //   const feedFileData = await readFileCSV(feedFile, "\t");
    //   expect(feedFileData[0][0]).toContain(
    //     (await salesReports.locatorProductTitleInSalesReports.first().textContent()).trim(),
    //   );
    // });
  });

  test(`@SB_ANA_SALE__32 On PLB, verify Report by Source / Medium kèm các điều kiện khác`, async ({
    authRequest,
    conf,
  }) => {
    await test.step(`Filter Sales reports với: Current store, Today, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.gotoSalesReport();
      await salesReports.page.selectOption(salesReports.xpathReportByFilter, "source_medium");
      await salesReports.filterWithHasSales("both");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, today, today);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Today, Report by Source / Medium, Product has sales: yes`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Today, Report by Source / Medium, Product has sales: no`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.filterDateOnAna(conf.suiteConf.yesterday);
      await salesReports.filterWithHasSales("both");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        yesterday,
        initData,
        "total_profit",
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, yesterday, yesterday);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Source / Medium, Product has sales: yes`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Yesterday, Report by Source / Medium, Product has sales: no`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.filterDateRange("Last month");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Source / Medium, Product has sales: yes`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last month, Report by Source / Medium, Product has sales: no`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.filterDateRange("Month to date");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Source / Medium, Product has sales: yes`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Month to date, Report by Source / Medium, Product has sales: no`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, 15 days in pre-month, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.filterDateFromTo("1", "15");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, 15 days in pre-month, Report by Source / Medium, Product has sales: yes`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, 15 days in pre-month, Report by Source / Medium, Product has sales: no`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.filterDateRange("Last 90 days");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        //tren dev data team dev fix nen khong dung
        if (process.env.ENV === "dev") {
          return;
        }
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = dataAnalytics.summary.total_profit.toLocaleString("en-US", { style: "currency", currency: "USD" });
        anaProfit1 = (dataAnalytics.summary.total_profit + 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        anaProfit2 = (dataAnalytics.summary.total_profit - 0.01).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit, anaProfit1, anaProfit2]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Source / Medium, Product has sales: yes`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: Current store, Last 90 days, Report by Source / Medium, Product has sales: no`, async () => {
      //tren dev data team dev fix nen khong dung
      if (process.env.ENV === "dev") {
        return;
      }
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 7 days, Report by Source / Medium, Product has sales: both`, async () => {
      await salesReports.filterShops(conf.suiteConf.domain_store_2);
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterDateRange("Last 7 days");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.filterWithHasSales("both");
      filterDate = await salesReports.getDateInFilter();
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      dataAnalytics = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      dataAnalytics2 = await salesReports.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_profit",
        filterDate.toDate,
      );
      if (dataAnalytics.summary.view_content == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        sumProfit = await orderAPI.getPLBOrdersListWithDate(authRequest, filterDate.fromDate, filterDate.toDate);
        actProfit = (await salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit).textContent()).trim();
        anaProfit = (dataAnalytics.summary.total_profit + dataAnalytics2.summary.total_profit).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
        noSales = await salesReports.countHasSales("no");
        yesSales = await salesReports.countHasSales("yes");
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 7 days, Report by Source / Medium, Product has sales: yes`, async () => {
      await salesReports.filterWithHasSales("yes");
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      if (dataAnalytics.summary.view_content == 0 || yesSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        expect([sumProfit, anaProfit]).toContainEqual(actProfit);
      }
    });

    await test.step(`Change filter Sales reports với: 2 stores, Last 7 days, Report by Source / Medium, Product has sales: no`, async () => {
      await salesReports.filterWithHasSales("no");
      if (dataAnalytics.summary.view_content == 0 || noSales == 0) {
        await expect(salesReports.page.locator(salesReports.xpathNoDataForReports)).toBeVisible();
      } else {
        await expect(salesReports.page.locator(salesReports.xpathTotalSalesOrGrossProfit)).toHaveText("$0.00");
      }
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search theo product title`, async () => {
      await salesReports.filterWithHasSales("both");
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.product_title);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.header_list);
      await expect(
        salesReports.locatorProductTitleInSalesReports.filter({ hasNotText: conf.suiteConf.product_title }),
      ).toHaveCount(0);
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search theo UTM source`, async () => {
      await salesReports.page.selectOption(salesReports.xpathAddColumnUTM, "utm_source");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page.selectOption(salesReports.xpathSearchOption, "utm_source");
      await salesReports.page.locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']").clear();
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.utm_source);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.add_utm_source);
      await expect(
        (await salesReports.genLocatorDataWithColumn("UTM Source")).filter({ hasNotText: conf.suiteConf.utm_source }),
      ).toHaveCount(0);
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search theo UTM Medium`, async () => {
      await salesReports.page.selectOption(salesReports.xpathAddColumnUTM, "utm_medium");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page.selectOption(salesReports.xpathSearchOption, "utm_medium");
      await salesReports.page.locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']").clear();
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.utm_medium);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.add_utm_medium);
      await expect(
        (await salesReports.genLocatorDataWithColumn("UTM Medium")).filter({ hasNotText: conf.suiteConf.utm_medium }),
      ).toHaveCount(0);
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search theo UTM Campaign`, async () => {
      await salesReports.page.selectOption(salesReports.xpathAddColumnUTM, "utm_campaign");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page.selectOption(salesReports.xpathSearchOption, "utm_campaign");
      await salesReports.page.locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']").clear();
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.utm_campaign);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.add_utm_campaign);
      await expect(
        (
          await salesReports.genLocatorDataWithColumn("UTM Campaign")
        ).filter({ hasNotText: conf.suiteConf.utm_campaign }),
      ).toHaveCount(0);
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search theo UTM Term`, async () => {
      await salesReports.page.selectOption(salesReports.xpathAddColumnUTM, "utm_term");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page.selectOption(salesReports.xpathSearchOption, "utm_term");
      await salesReports.page.locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']").clear();
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.utm_term);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.add_utm_term);
      await expect(
        (await salesReports.genLocatorDataWithColumn("UTM Term")).filter({ hasNotText: conf.suiteConf.utm_term }),
      ).toHaveCount(0);
    });

    await test.step(`Change filter Sales reports với các điều kiện rồi search theo UTM Content`, async () => {
      await salesReports.page.selectOption(salesReports.xpathAddColumnUTM, "utm_content");
      await salesReports.page.waitForSelector(`(${salesReports.xpathHeaderTable})[last()]`);
      await salesReports.page.selectOption(salesReports.xpathSearchOption, "utm_content");
      await salesReports.page.locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']").clear();
      await salesReports.page
        .locator("//div[contains(@class,'traffic-search')]//input[@placeholder='Search']")
        .pressSequentially(conf.suiteConf.utm_content);
      await salesReports.page.waitForTimeout(2000);
      await expect(salesReports.page.locator(salesReports.xpathHeaderTable)).toHaveText(conf.caseConf.add_utm_content);
      await expect(
        (await salesReports.genLocatorDataWithColumn("UTM Content")).filter({ hasNotText: conf.suiteConf.utm_content }),
      ).toHaveCount(0);
    });

    await test.step(`Click Export`, async () => {
      await salesReports.page.click('//button[normalize-space()="Export"]');
      await expect(salesReports.page.locator(salesReports.xpathToastMessage)).toContainText(conf.suiteConf.export_msg);
    });

    // Tach thanh case rieng de check
    // await test.step(`Truy cập mail, check file export từ Sales reports`, async () => {
    //   mailinator = await getMailinatorInstanceWithProxy(page);
    //   await mailinator.accessMail(conf.suiteConf.staff_name);
    //   while (!(await mailinator.checkMailVisible("Export Report Data"))) {
    //     await mailinator.page.reload();
    //     await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
    //   }
    //   await mailinator.readMail("Export Report Data");
    //   const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
    //   const feedFileData = await readFileCSV(feedFile, "\t");
    //   expect(feedFileData[0][0]).toContain(
    //     (await salesReports.locatorProductTitleInSalesReports.first().textContent()).trim(),
    //   );
    // });
  });
});
