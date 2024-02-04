import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SettingsDigital } from "@pages/digital_product/settings";

test.describe(`Verify setting for shop Creator`, async () => {
  test(`Verify các sestion trong setting @TC_SB_DP_DB_PAK_3`, async ({ dashboard, conf }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const settingsDigital = new SettingsDigital(dashboard, conf.suiteConf.domain);

    await test.step(`Click vào Settings menu`, async () => {
      await dashboardPage.navigateToMenu("Settings");
    });

    await test.step(`Click vào session General`, async () => {
      await dashboardPage.navigateToSectionInSettingPage("General");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "general");
      await settingsDigital.backToSettingsPage();
    });

    await test.step(`Click vào session Payment Providers`, async () => {
      await dashboardPage.navigateToSectionInSettingPage("Payment providers");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "payments");
      await settingsDigital.backToSettingsPage();
    });

    await test.step(`Click vào session Checkout`, async () => {
      await dashboardPage.navigateToSectionInSettingPage("Checkout");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "checkout");
      await settingsDigital.backToSettingsPage();
    });

    await test.step(`Click vào session Account`, async () => {
      await dashboardPage.navigateToSectionInSettingPage("Account");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "account");
      await settingsDigital.backToSettingsPage();
    });

    await test.step(`Click vào session Notifications`, async () => {
      await dashboardPage.navigateToSectionInSettingPage("Notifications");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "notifications");
      await settingsDigital.backToSettingsPage();
    });

    await test.step(`Click vào session Billing`, async () => {
      await dashboardPage.navigateToSectionInSettingPage("Billing");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "billing");
    });

    await test.step(`Thực hiện mở 1 session không tồn tại bằng url ở trình duyệt`, async () => {
      await dashboard.goto(conf.caseConf.session_not_exist);
      await dashboard.waitForLoadState("load");
      await expect(dashboard.locator(`//span[contains(text(),'be reached')]`)).toBeVisible();
    });
  });
});
