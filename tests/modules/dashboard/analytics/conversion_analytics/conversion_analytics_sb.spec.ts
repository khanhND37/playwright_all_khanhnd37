import { expect, test } from "@core/fixtures";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { DataAnalytics } from "@types";

let conversionPage: AnalyticsPage;
let dataAnalytics: DataAnalytics;
let dataAnalytics2: DataAnalytics;
let initData: DataAnalytics;
let localeFormat;
let timeZoneShop;
let today;
let filterDate: { fromDate: string; toDate: string };
let verifyDataInConversionTable;

test.describe("Verify conversion analytics on SB", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    conversionPage = new AnalyticsPage(dashboard, conf.suiteConf.domain);
    localeFormat = conf.suiteConf.locale_format;
    timeZoneShop = conf.suiteConf.time_zone;
    today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    initData = conf.suiteConf.data_analytics;
    dataAnalytics2 = conf.suiteConf.data_analytics;
    verifyDataInConversionTable = async () => {
      await expect(conversionPage.page.locator(conversionPage.xpathHeaderTable)).toHaveText(conf.suiteConf.header_list);
      if (dataAnalytics.summary.view_page + dataAnalytics2.summary.view_page == 0) {
        await expect(conversionPage.page.locator(conversionPage.xpathNoDataForReports)).toBeVisible();
      } else {
        expect(dataAnalytics.summary.view_page + dataAnalytics2.summary.view_page).toBe(
          parseInt(
            (await (await conversionPage.genLocatorValueWithColumn("View all (VA)", "header")).textContent())
              .trim()
              .replace(/[$,]+/g, ""),
          ),
        );
        expect(dataAnalytics.summary.view_content + dataAnalytics2.summary.view_content).toBe(
          parseInt(
            (await (await conversionPage.genLocatorValueWithColumn("View product (VP)", "header")).textContent())
              .trim()
              .replace(/[$,]+/g, ""),
          ),
        );
        expect(dataAnalytics.summary.add_to_cart + dataAnalytics2.summary.add_to_cart).toBe(
          parseInt(
            (await (await conversionPage.genLocatorValueWithColumn("Add to cart (AC)", "header")).textContent())
              .trim()
              .replace(/[$,]+/g, ""),
          ),
        );
        expect(dataAnalytics.summary.total_orders + dataAnalytics2.summary.total_orders).toBe(
          parseInt(
            (await (await conversionPage.genLocatorValueWithColumn("Purchase (PU)", "header")).textContent())
              .trim()
              .replace(/[$,]+/g, ""),
          ),
        );
      }
    };
  });

  test(`@SB_ANA_CONVER_01 On SB, verify Conversion Analytics theo Hour cùng các điều kiện khác`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Vào Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (không có data), Today`, async () => {
      await conversionPage.goToConversionAnalytics();
      await conversionPage.chooseGroupBy("hour");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.selectCountries(conf.suiteConf.country_no_data);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await expect(conversionPage.page.locator(conversionPage.xpathHeaderTable)).toHaveText(conf.suiteConf.header_list);
      await expect(conversionPage.page.locator(conversionPage.xpathNoDataForReports)).toBeVisible();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Today`, async () => {
      await conversionPage.selectCountries(conf.suiteConf.country_with_data);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.page.waitForTimeout(1500);
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Yesterday`, async () => {
      await conversionPage.filterDateRange("Yesterday");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Last month`, async () => {
      await conversionPage.filterDateRange("Last month");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), 15 days in pre-month`, async () => {
      await conversionPage.filterDateFromTo("1", "15");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Last 90 days`, async () => {
      await conversionPage.filterDateRange("Last 90 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Month to date`, async () => {
      await conversionPage.filterDateRange("Month to date");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Last 7 days`, async () => {
      await conversionPage.filterDateRange("Last 7 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Hour, Select countries (có data), Last 7 days, 2 stores`, async () => {
      await conversionPage.filterShops(conf.suiteConf.domain_store_2);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForTimeout(1500);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      dataAnalytics2 = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, click button Export`, async () => {
      await conversionPage.page.click('//button[normalize-space()="Export"]');
      await expect(conversionPage.page.locator(conversionPage.xpathToastMessage)).toContainText(
        conf.suiteConf.export_msg,
      );
      // TACH PHAN CHECK MAIL SANG CASE KHAC
      // mailinator = await getMailinatorInstanceWithProxy(page);
      // await mailinator.accessMail(conf.suiteConf.staff_name);
      // while (!(await mailinator.checkMailVisible("Export Report Data"))) {
      //   await mailinator.page.reload();
      //   await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
      // }
      // await mailinator.readMail("Export Report Data");
      // const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
      // const feedFileData = await readFileCSV(feedFile, "\t");
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View all (VA)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View product (VP)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Add to cart (AC)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Purchase (PU)", "body")).textContent()).trim(),
      // );
    });
  });

  test(`@SB_ANA_CONVER_02 On SB, verify Conversion Analytics theo Day cùng các điều kiện khác`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Vào Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (không có data), Today`, async () => {
      await conversionPage.goToConversionAnalytics();
      await conversionPage.chooseGroupBy("day");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.selectCountries(conf.suiteConf.country_no_data);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await expect(conversionPage.page.locator(conversionPage.xpathHeaderTable)).toHaveText(conf.suiteConf.header_list);
      await expect(conversionPage.page.locator(conversionPage.xpathNoDataForReports)).toBeVisible();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Today`, async () => {
      await conversionPage.selectCountries(conf.suiteConf.country_with_data);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.page.waitForTimeout(1500);
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Yesterday`, async () => {
      await conversionPage.filterDateRange("Yesterday");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Last month`, async () => {
      await conversionPage.filterDateRange("Last month");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), 15 days in pre-month`, async () => {
      await conversionPage.filterDateFromTo("1", "15");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Last 90 days`, async () => {
      await conversionPage.filterDateRange("Last 90 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Month to date`, async () => {
      await conversionPage.filterDateRange("Month to date");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Last 7 days`, async () => {
      await conversionPage.filterDateRange("Last 7 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Day, Select countries (có data), Last 7 days, 2 stores`, async () => {
      await conversionPage.filterShops(conf.suiteConf.domain_store_2);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForTimeout(1500);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      dataAnalytics2 = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, click button Export`, async () => {
      await conversionPage.page.click('//button[normalize-space()="Export"]');
      await expect(conversionPage.page.locator(conversionPage.xpathToastMessage)).toContainText(
        conf.suiteConf.export_msg,
      );
      // TACH PHAN CHECK MAIL SANG CASE KHAC
      // mailinator = await getMailinatorInstanceWithProxy(page);
      // await mailinator.accessMail(conf.suiteConf.staff_name);
      // while (!(await mailinator.checkMailVisible("Export Report Data"))) {
      //   await mailinator.page.reload();
      //   await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
      // }
      // await mailinator.readMail("Export Report Data");
      // const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
      // const feedFileData = await readFileCSV(feedFile, "\t");
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View all (VA)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View product (VP)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Add to cart (AC)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Purchase (PU)", "body")).textContent()).trim(),
      // );
    });
  });

  test(`@SB_ANA_CONVER_03 On SB, verify Conversion Analytics theo Week cùng các điều kiện khác`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Vào Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (không có data), Today`, async () => {
      await conversionPage.goToConversionAnalytics();
      await conversionPage.chooseGroupBy("week");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.selectCountries(conf.suiteConf.country_no_data);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await expect(conversionPage.page.locator(conversionPage.xpathHeaderTable)).toHaveText(conf.suiteConf.header_list);
      await expect(conversionPage.page.locator(conversionPage.xpathNoDataForReports)).toBeVisible();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Today`, async () => {
      await conversionPage.selectCountries(conf.suiteConf.country_with_data);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.page.waitForTimeout(1500);
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Yesterday`, async () => {
      await conversionPage.filterDateRange("Yesterday");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Last month`, async () => {
      await conversionPage.filterDateRange("Last month");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), 15 days in pre-month`, async () => {
      await conversionPage.filterDateFromTo("1", "15");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Last 90 days`, async () => {
      await conversionPage.filterDateRange("Last 90 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Month to date`, async () => {
      await conversionPage.filterDateRange("Month to date");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Last 7 days`, async () => {
      await conversionPage.filterDateRange("Last 7 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Week, Select countries (có data), Last 7 days, 2 stores`, async () => {
      await conversionPage.filterShops(conf.suiteConf.domain_store_2);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForTimeout(1500);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      dataAnalytics2 = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, click button Export`, async () => {
      await conversionPage.page.click('//button[normalize-space()="Export"]');
      await expect(conversionPage.page.locator(conversionPage.xpathToastMessage)).toContainText(
        conf.suiteConf.export_msg,
      );
      // TACH PHAN CHECK MAIL SANG CASE KHAC
      // mailinator = await getMailinatorInstanceWithProxy(page);
      // await mailinator.accessMail(conf.suiteConf.staff_name);
      // while (!(await mailinator.checkMailVisible("Export Report Data"))) {
      //   await mailinator.page.reload();
      //   await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
      // }
      // await mailinator.readMail("Export Report Data");
      // const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
      // const feedFileData = await readFileCSV(feedFile, "\t");
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View all (VA)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View product (VP)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Add to cart (AC)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Purchase (PU)", "body")).textContent()).trim(),
      // );
    });
  });

  test(`@SB_ANA_CONVER_04 On SB, verify Conversion Analytics theo Month cùng các điều kiện khác`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Vào Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (không có data), Today`, async () => {
      await conversionPage.goToConversionAnalytics();
      await conversionPage.chooseGroupBy("month");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.selectCountries(conf.suiteConf.country_no_data);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await expect(conversionPage.page.locator(conversionPage.xpathHeaderTable)).toHaveText(conf.suiteConf.header_list);
      await expect(conversionPage.page.locator(conversionPage.xpathNoDataForReports)).toBeVisible();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Today`, async () => {
      await conversionPage.selectCountries(conf.suiteConf.country_with_data);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.page.waitForTimeout(1500);
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        today,
        initData,
        "total_sales",
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Yesterday`, async () => {
      await conversionPage.filterDateRange("Yesterday");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Last month`, async () => {
      await conversionPage.filterDateRange("Last month");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), 15 days in pre-month`, async () => {
      await conversionPage.filterDateFromTo("1", "15");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Last 90 days`, async () => {
      await conversionPage.filterDateRange("Last 90 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Month to date`, async () => {
      await conversionPage.filterDateRange("Month to date");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Last 7 days`, async () => {
      await conversionPage.filterDateRange("Last 7 days");
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, filter: Group by Month, Select countries (có data), Last 7 days, 2 stores`, async () => {
      await conversionPage.filterShops(conf.suiteConf.domain_store_2);
      await conversionPage.page.waitForSelector(`(${conversionPage.xpathHeaderTable})[last()]`);
      await conversionPage.chooseFunnel(conf.suiteConf.start_option, conf.suiteConf.end_option);
      await conversionPage.selectBarchartFunnel(conf.suiteConf.barchart_option);
      await conversionPage.page.waitForTimeout(1500);
      filterDate = await conversionPage.getDateInFilter();
      dataAnalytics = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      dataAnalytics2 = await conversionPage.getDataAnalyticsAPIDashboard(
        authRequest,
        conf.suiteConf.shop_id_store_2,
        filterDate.fromDate,
        initData,
        "total_sales",
        filterDate.toDate,
      );
      await verifyDataInConversionTable();
    });

    await test.step(`Ở Dashboard, Analytics > Conversion analytics, click button Export`, async () => {
      await conversionPage.page.click('//button[normalize-space()="Export"]');
      await expect(conversionPage.page.locator(conversionPage.xpathToastMessage)).toContainText(
        conf.suiteConf.export_msg,
      );
      // TACH PHAN CHECK MAIL SANG CASE KHAC
      // mailinator = await getMailinatorInstanceWithProxy(page);
      // await mailinator.accessMail(conf.suiteConf.staff_name);
      // while (!(await mailinator.checkMailVisible("Export Report Data"))) {
      //   await mailinator.page.reload();
      //   await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
      // }
      // await mailinator.readMail("Export Report Data");
      // const feedFile = await mailinator.downloadFile("(//h3/following-sibling::ul//a)[1]");
      // const feedFileData = await readFileCSV(feedFile, "\t");
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View all (VA)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("View product (VP)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Add to cart (AC)", "body")).textContent()).trim(),
      // );
      // expect(feedFileData[0][0]).toContain(
      //   (await (await conversionPage.genLocatorValueWithColumn("Purchase (PU)", "body")).textContent()).trim(),
      // );
    });
  });
});
