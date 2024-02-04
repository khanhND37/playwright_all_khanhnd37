import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import path from "path";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { readFileCSV } from "@helper/file";
import { APIRequestContext, Page } from "@playwright/test";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { DashboardPage } from "@pages/dashboard/dashboard";

//TODO change to __dirname, workding dir
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appRoot = require("app-root-path");

interface VerifyDataRefreshRequest {
  product: ProductPage;
  authRequest: APIRequestContext;
  feedName: string;
  domain: string;
  totalRefresh: number;
  timePerDay: number;
  offsetHour: number;
}

interface VerifyLimitPackage {
  page: Page;
  authRequest: APIRequestContext;
  cfPlan: ConfirmPlanPage;
  product: ProductPage;
  feedName: string;
  domain: string;
  packageName: string;
  totalRefresh: number;
  timePerDay: number;
  offsetHour: number;
}

test.describe.serial("Allow sellers to refresh feeds", async () => {
  test.beforeAll(async ({ conf, browser }) => {
    const { domain, userId, shopId, username, password } = conf.suiteConf as never;
    const context = await browser.newContext();
    const page = await context.newPage();
    test.setTimeout(conf.suiteConf.timeout);
    const dashboardPage = new DashboardPage(page, domain);
    const product = new ProductPage(page, conf.suiteConf.domain);
    await dashboardPage.login({
      userId: userId,
      shopId: shopId,
      email: username,
      password: password,
    });

    await product.goToProductList();
    await product.deleteProduct(conf.suiteConf.password);
    await product.goToProductList();
    const pathFile = path.join(appRoot + "/assets/product_feed/product_auto.csv");
    await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
    await page.reload();
  });

  test.beforeEach(({ conf }, testInfo) => {
    testInfo.setTimeout(conf.suiteConf.timeout);
  });

  const verifyDataRefresh = async (reqData: VerifyDataRefreshRequest) => {
    const { product, authRequest, feedName, domain, totalRefresh, timePerDay, offsetHour } = reqData;
    const [expTotalRefresh, expTimePerDay, expOffsetHour] = await product.getTotalRefresh(
      authRequest,
      feedName,
      domain,
    );
    expect([expTotalRefresh, expTimePerDay, expOffsetHour]).toEqual([totalRefresh, timePerDay, offsetHour]);
  };

  const verifyLimitPackage = async (reqLimit: VerifyLimitPackage) => {
    const { page, authRequest, cfPlan, product, feedName, domain, packageName, totalRefresh, timePerDay, offsetHour } =
      reqLimit;

    await cfPlan.gotoPickAPlan();
    if (packageName === "Fullfillment Only") {
      await cfPlan.choosePlanShopBaseFulfillment();
    } else {
      await cfPlan.choosePlan(packageName);
    }
    await product.goToProductFeedList();
    await page.waitForLoadState("load");
    await verifyDataRefresh({ product, authRequest, feedName, domain, totalRefresh, timePerDay, offsetHour });
  };

  const clickRefreshButton = async function (page) {
    await page.waitForSelector(`//strong[normalize-space()='Product feed URL']`);
    const xpathBtn = "//button[child::span[normalize-space()='Refresh now']]";
    const count = await page.locator(`//button[@disabled][child::span[normalize-space()='Refresh now']]`).count();
    if (count != 1) {
      await page.click(xpathBtn);
      await page.waitForLoadState("networkidle");
    }
  };

  test(`Verify button Refresh now in Edit Product Feed page @SB_SET_SC_GMC_RF_3`, async ({
    dashboard,
    conf,
    hiveSBase,
  }) => {
    await test.step("Reset quota refresh feed file on View shop page", async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      const shopId = conf.suiteConf.shop_id;
      await hiveSB.goToShopDetail(shopId);
      await hiveSB.resetQuotaRefreshFeed();
    });

    await test.step("Verify button Refresh now in Edit Product Feed page", async () => {
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      const feedName = conf.suiteConf.feedName;
      await product.goToProductFeedList();
      await product.goToProductFeedDetail(feedName);
      await expect(dashboard.locator("//button[child::span[normalize-space()='Refresh now']]")).toBeVisible();
    });
  });

  // eslint-disable-next-line max-len
  test(`Check update product on Feed file when click button Refresh now in Edit Product Feed page @SB_SET_SC_GMC_RF_4`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const totalRefreshExp = conf.caseConf.totalRefresh;

    await test.step("Edit product on Dashboard", async () => {
      const productTitle = conf.caseConf.product_title;
      const productTitleEdit = conf.caseConf.product_title_edit;
      const productPriceEdit = conf.caseConf.price_edit;
      const sku = conf.caseConf.sku;
      await product.goToProductList();
      await dashboard.waitForNavigation();
      await product.editProduct(productTitle, productTitleEdit, productPriceEdit, sku);
    });

    await test.step("Click button Refresh now", async () => {
      const feedName = conf.suiteConf.feedName;
      const domain = conf.suiteConf.domain;
      await product.goToProductFeedList();
      await product.goToProductFeedDetail(feedName);
      await clickRefreshButton(dashboard);
      await dashboard.reload();
      await dashboard.waitForSelector("//button[@disabled='disabled']//span[normalize-space()='Refresh now']");
      const [totalRefresh] = await product.getTotalRefresh(authRequest, feedName, domain);
      expect(totalRefresh).toEqual(totalRefreshExp);
    });

    await test.step("Verify update product on Feed file when click button Refresh now", async () => {
      const feedName = conf.suiteConf.feedName;
      await product.goToProductFeedList();
      await product.goToProductFeedDetail(feedName);
      await dashboard.waitForSelector(`//strong[normalize-space()='Product feed URL']`);
      const feedFile = await product.downloadFile("//div[child::div[contains(text(),'URL')]]//a");
      await dashboard.waitForLoadState("load");
      const readFeedFile = await readFileCSV(feedFile, "\t");
      let checkDataExitsOnCSV = false;
      for (let i = 0; i < readFeedFile.length; i++) {
        checkDataExitsOnCSV = readFeedFile[i].some(
          dataFeed => dataFeed.replace("\n", "").trim() == conf.caseConf.product_title_edit.trim(),
        );
      }
      await expect(checkDataExitsOnCSV).toEqual(true);
    });
  });

  // eslint-disable-next-line max-len
  test(`Check when changing from package with less refresh to package with more refresh @SB_SET_SC_GMC_RF_14`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const cfPlan = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const domain = conf.suiteConf.domain;

    await test.step("Check when changing from package with less refresh to package with more refresh", async () => {
      await verifyLimitPackage({
        page: dashboard,
        authRequest: authRequest,
        cfPlan: cfPlan,
        product: product,
        feedName: feedName,
        domain: domain,
        packageName: "Basic Base",
        totalRefresh: 1,
        timePerDay: 3,
        offsetHour: 0,
      });
    });
  });

  // eslint-disable-next-line max-len
  test(`Check when changing from a plan with more refreshes to a plan with less refresh @SB_SET_SC_GMC_RF_13`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const cfPlan = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const domain = conf.suiteConf.domain;

    await test.step("Check when changing from a plan with more refreshes to a plan with less refresh", async () => {
      await verifyLimitPackage({
        page: dashboard,
        authRequest: authRequest,
        cfPlan: cfPlan,
        product: product,
        feedName: feedName,
        domain: domain,
        packageName: "Pro Base",
        totalRefresh: 1,
        timePerDay: 4,
        offsetHour: 0,
      });
    });
  });

  test(`Verify button Reset quota refresh feed file on View shop page  @SB_SET_SC_GMC_RF_17`, async ({
    hiveSBase,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step("Verify button Reset quota refresh feed file on View shop page", async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      const shopId = conf.suiteConf.shop_id;
      await hiveSB.goToShopDetail(shopId);
      await hiveSB.resetQuotaRefreshFeed();
    });
  });

  // eslint-disable-next-line max-len
  test(`Verify button Refresh now after reset quota refresh feed file on View shop page @SB_SET_SC_GMC_RF_19`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    await test.step("Verify button Refresh now after reset quota refresh feed file on View shop page", async () => {
      const feedName = conf.suiteConf.feedName;
      const domain = conf.suiteConf.domain;
      const [totalRefresh] = await product.getTotalRefresh(authRequest, feedName, domain);
      expect(totalRefresh).toEqual(0);
    });
  });

  // eslint-disable-next-line max-len
  test(`Verify limit refresh of packages Basic Base, Standard Base, Pro Base, Fulfillment Only  @SB_SET_SC_GMC_RF_PACKAGE`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const cfPlan = new ConfirmPlanPage(dashboard, conf.caseConf.domain);
    const product = new ProductPage(dashboard, conf.caseConf.domain);
    const feedName = conf.suiteConf.feedName;
    const domain = conf.caseConf.domain;

    await test.step("Verify limit refresh of packages Standard Base", async () => {
      await verifyLimitPackage({
        page: dashboard,
        authRequest: authRequest,
        cfPlan: cfPlan,
        product: product,
        feedName: feedName,
        domain: domain,
        packageName: "Standard Base",
        totalRefresh: 0,
        timePerDay: 1,
        offsetHour: 3,
      });
    });

    await test.step("Verify limit refresh of packages Pro Base", async () => {
      await verifyLimitPackage({
        page: dashboard,
        authRequest: authRequest,
        cfPlan: cfPlan,
        product: product,
        feedName: feedName,
        domain: domain,
        packageName: "Pro Base",
        totalRefresh: 0,
        timePerDay: 3,
        offsetHour: 1,
      });
    });

    await test.step("Verify limit refresh of packages Basic Base", async () => {
      await verifyLimitPackage({
        page: dashboard,
        authRequest: authRequest,
        cfPlan: cfPlan,
        product: product,
        feedName: feedName,
        domain: domain,
        packageName: "Basic Base",
        totalRefresh: 0,
        timePerDay: 1,
        offsetHour: 6,
      });
    });

    await test.step("Verify limit refresh of packages Fulfillment Only", async () => {
      await verifyLimitPackage({
        page: dashboard,
        authRequest: authRequest,
        cfPlan: cfPlan,
        product: product,
        feedName: feedName,
        domain: domain,
        packageName: "Fullfillment Only",
        totalRefresh: 0,
        timePerDay: 0,
        offsetHour: 0,
      });
    });
  });

  test(`Verify limit refresh of packages PrintBase @TC_SB_SET_SC_GMC_RF_21`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.caseConf.domain);
    const feedName = conf.suiteConf.feedName;
    const domain = conf.caseConf.domain;

    await test.step("Verify limit refresh of packages PrintBase", async () => {
      await product.goToProductFeedList();
      await verifyDataRefresh({
        product: product,
        authRequest: authRequest,
        feedName: feedName,
        domain: domain,
        totalRefresh: 0,
        timePerDay: 1,
        offsetHour: 3,
      });
    });

    test(`Verify limit refresh of packages PlusBase @SB_SET_SC_GMC_RF_22`, async ({ conf, dashboard, authRequest }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const product = new ProductPage(dashboard, conf.caseConf.domain);
      const feedName = conf.suiteConf.feedName;
      const domain = conf.caseConf.domain;

      await test.step("Verify limit refresh of packages PlusBase", async () => {
        await product.goToProductFeedList();
        await verifyDataRefresh({
          product: product,
          authRequest: authRequest,
          feedName: feedName,
          domain: domain,
          totalRefresh: 0,
          timePerDay: 1,
          offsetHour: 3,
        });
      });
    });
  });
});
