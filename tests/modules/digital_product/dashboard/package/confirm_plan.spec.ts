import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe(`Choose package for shop Creator`, async () => {
  test(`Upgrade / Downgrade khi shop đang có 1 package @TC_SB_DP_DB_PAK_6`, async ({ dashboard, conf }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);

    await test.step(`Click vào Setting menu > click chọn session Account`, async () => {
      await dashboardPage.navigateToMenu("Settings");
      await dashboardPage.navigateToSectionInSettingPage("Account");
      await expect(dashboard).toHaveURL(conf.caseConf.url_session + "account");
    });

    await test.step(`Thực hiện confirm plan:
    - Mở trang Choose package
    - Click vào button Choose this plan của 1 package
    - Click button Confirm plan`, async () => {
      await dashboard
        .locator(`//div[child::div[text()='Account overview']]//a[normalize-space()='Compare plans']`)
        .click();
      await dashboard.locator(`(//span[normalize-space()='Choose this plan'])[1]`).click();
      const packageName = (
        await dashboard.innerText(
          `((//span[normalize-space()='Package:'])//parent::div)//span[contains(@class,'text-right')]`,
        )
      )
        .split("-", 1)
        .toString();
      await dashboard.locator(`//span[normalize-space()='Confirm changes']`).click();
      await expect(dashboard.locator(`//div[@class='s-notices is-bottom']`)).toHaveText(conf.caseConf.toast_message);
      await expect(dashboard.locator(`//p[text()='Current plan']//following-sibling::p`)).toContainText(packageName);
    });
  });
});
