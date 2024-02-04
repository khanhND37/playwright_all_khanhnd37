import { test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
test.describe("Staff permission với order page @TS_SB_DASHBOARD_01", async () => {
  test.beforeEach(async ({ page, conf }) => {
    const accountPage = new DashboardPage(page, conf.suiteConf.domain);
    await accountPage.login({
      email: conf.caseConf["username"],
      password: conf.caseConf["password"],
    });
    await accountPage.navigateToMenu("Orders");
  });
  test("Kiểm tra staff có quyền view order page @TC_SB_ORD_ODU_214", async ({ page }) => {
    /***** Assertion for display order name ******/
    await page.locator(`//div[contains(text(),'Orders')]`).isVisible();
  });
  test("Kiểm tra staff không có quyền view order page @TC_SB_ORD_ODU_215", async ({ page }) => {
    /***** Assertion for display order name ******/
    await page.locator(`//*[normalize-space()='You don’t have permission to view this page']`).isVisible();
  });
});
