import { test, expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("Verify customization service's block", () => {
  test(`@SB_WEB_BUILDER_BCRE_BCS_02 Verify block customization service không insert được từ insert panel`, async ({
    dashboard,
    conf,
  }) => {
    test.slow();
    await test.step(`Login vào shop creator, vào web builder, click vào button insert`, async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.navigateToMenu("Online Store");

      // Click web builder
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();

      // Click page selector
      await dashboardPage.page.locator('button[name="Insert"]').click();

      const insertableBlocks = await dashboardPage.page
        .locator("//div[contains(@class, 'w-builder__insert-basic-preview')]")
        .all();

      let exist = false;
      for (const block of insertableBlocks) {
        const blockName = await block.textContent();
        if (blockName.trim() === "Customization Service") {
          exist = true;
        }
      }

      expect(exist).toEqual(false);
    });
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_02 Verify block service question không insert được từ insert panel`, async ({
    dashboard,
    conf,
  }) => {
    test.slow();
    await test.step(`Login vào shop creator, vào web builder, click vào button insert`, async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.navigateToMenu("Online Store");

      // Click web builder
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();

      // Click page selector
      await dashboardPage.page.locator('button[name="Insert"]').click();

      const insertableBlocks = await dashboardPage.page
        .locator("//div[contains(@class, 'w-builder__insert-basic-preview')]")
        .all();

      let exist = false;
      for (const block of insertableBlocks) {
        const blockName = await block.textContent();
        if (blockName.trim() === "Service Question") {
          exist = true;
        }
      }

      expect(exist).toEqual(false);
    });
  });

  test(`@SB_WEB_BUILDER_BCRE_BCS_04 Verify block customization service không xoá được`, async ({ dashboard, conf }) => {
    await test.step(`Login vào shop creator, vào web builder, click vào block customization service`, async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.navigateToMenu("Online Store");

      // Click web builder, open customization service page
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
      await dashboardPage.page.locator('button[name="Pages"]').click();

      await dashboard.goto(`${dashboardPage.page.url().toString()}?page=my_customization_service`);
      await dashboardPage.page.locator("#v-progressbar").waitFor({ state: "detached" });

      // Click block customization service
      await dashboardPage.page
        .frameLocator("#preview")
        .locator('//section[@component="customization-service"]')
        .first()
        .click();

      // Verify button delete not appear on quick setting bar
      const buttonDeleteQuickSetting = dashboardPage.page.getByRole("button").filter({ hasText: "Delete ⌫ / Delete" });
      await expect(buttonDeleteQuickSetting).not.toBeVisible();

      // Verify button delete not appear on sidebar
      const buttonDeleteLoc = dashboardPage.page.getByRole("button", { name: "Delete block" });
      await expect(buttonDeleteLoc).not.toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_04 Verify block service question không xoá được`, async ({ dashboard, conf }) => {
    await test.step(`
  Login vào shop creator, vào web builder, click vào block service question
  `, async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.navigateToMenu("Online Store");

      // Click web builder, open customization service page
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
      await dashboardPage.page.locator('button[name="Pages"]').click();

      await dashboard.goto(`${dashboardPage.page.url().toString()}?page=my_customization_service`);
      await dashboardPage.page.locator("#v-progressbar").waitFor({ state: "detached" });

      // Click block customization service
      await dashboardPage.page
        .frameLocator("#preview")
        .locator('//section[@component="product-question"]')
        .first()
        .click();

      // Verify button delete not appear on quick setting bar
      const buttonDeleteQuickSetting = dashboardPage.page.getByRole("button").filter({ hasText: "Delete ⌫ / Delete" });
      await expect(buttonDeleteQuickSetting).not.toBeVisible();

      // Verify button delete not appear on sidebar
      const buttonDeleteLoc = dashboardPage.page.getByRole("button", { name: "Delete block" });
      await expect(buttonDeleteLoc).not.toBeVisible();
    });
  });
});
