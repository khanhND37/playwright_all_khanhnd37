import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { AppstoreHomePage } from "@pages/app_store/homepage";
import { Apps } from "@pages/dashboard/apps";

let dashboardPage: DashboardPage;
let homePage: AppstoreHomePage;
let appPage: Apps;

test.describe("Third app: install , uninstall, migrate ", async () => {
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
  });

  test(`@SB_NEWECOM_OMA_36 Verify Install thành công app 3rd party`, async ({ dashboard, page, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    homePage = new AppstoreHomePage(page, conf.suiteConf.url);
    const appName = conf.caseConf.app_name;

    await test.step(`Click [Visit Shopbase App Store] `, async () => {
      await homePage.goToAppStore(conf.caseConf.collection_name);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.signInAndChooseShop(conf.suiteConf.username, conf.suiteConf.password, conf.suiteConf.shop_name);
      await homePage.page.waitForSelector(homePage.xpathUserName);
      expect(homePage.page.url()).toContain(conf.suiteConf.url);
      await expect(page.locator(homePage.xpathUserName)).toContainText(conf.caseConf.user_name, { timeout: 10000 });
    });

    await test.step(`Đăng nhập vào app > search app > Click install `, async () => {
      await homePage.searchApp(appName);
      await homePage.goToAppDetail(appName);
      await homePage.clickBtnInstallApp(page, appName);
      await page.waitForSelector(".icon-in-app-notification");
      await homePage.clickOnBtnWithLabel("Install app");
      await dashboardPage.navigateToMenu("Apps");
      await dashboard.reload();
      await expect(await dashboardPage.isTextVisible(appName)).toBeTruthy();
    });
  });

  test(`@SB_NEWECOM_OMA_37 Verify Uninstall thành công app 3rd party`, async ({ conf, dashboard }) => {
    appPage = new Apps(dashboard, conf.suiteConf.domain);
    const appName = conf.caseConf.app_name;
    const reason = conf.caseConf.reason;
    const description = conf.caseConf.description;

    await test.step(`Click button Uninstall của app`, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await appPage.clickUninstallApp(appName);
      await expect(appPage.genLoc(appPage.xpathConfirmPopup)).toBeVisible();
    });

    await test.step(`Select reason for uninstalling > Input Describr your experience > Click button Cancel`, async () => {
      await appPage.uninstallApp(reason, description);
      await appPage.clickOnBtnWithLabel("Cancel");
    });

    await test.step(`Click button Uninstall của app`, async () => {
      await appPage.clickUninstallApp(appName);
      await expect(appPage.genLoc(appPage.xpathConfirmPopup)).toBeVisible();
    });

    await test.step(`Select reason for uninstalling > Input Describe your experience > Click button Uninstalll`, async () => {
      await appPage.uninstallApp(reason, description);
      await appPage.clickOnBtnWithLabel("Uninstall");
      await appPage.page.reload();
      await expect(appPage.genLoc(appPage.xpathAppName(appName))).not.toBeVisible();
    });
  });
});
