import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { expect } from "@playwright/test";
import { MultipleSF } from "@sf_pages/multiple_storefronts";

let multipleSF: MultipleSF, dashboardPage: DashboardPage, settingData, expectData;

test.describe("Verify turn on/off multiple storefronts", () => {
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    multipleSF = new MultipleSF(dashboard);
    settingData = conf.caseConf.data;
    expectData = conf.caseConf.expect;

    await test.step(`Pre-condition: Đi đến màn quản lý storefronts`, async () => {
      await dashboardPage.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_44 Check enable multiple SF`, async ({ dashboard, snapshotFixture, context }) => {
    await test.step(`Pre-condition: Check button turn on/off multiple storefront`, async () => {
      const countSubMenu = await dashboard.locator(multipleSF.xpathSubMenuOnlineStore).count();
      // 3 là số lượng submenu của Online store của store có nhiều storefronts
      if (countSubMenu == 3) {
        await dashboard.getByRole("button", { name: "Disable multiple storefronts", exact: true }).click();
        await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
      }
    });

    await test.step(`Click button Enable multiple storefronts`, async () => {
      await dashboard.getByRole("button", { name: "Enable multiple storefronts" }).click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPopup,
        snapshotName: expectData.snapshot_popup_confirm,
      });
    });

    await test.step(`Click button Cancel`, async () => {
      await dashboard.getByRole("button", { name: "Cancel" }).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeHidden();
      await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
    });

    await test.step(`Click button Enable multiple storefronts`, async () => {
      await dashboard.getByRole("button", { name: "Enable multiple storefronts" }).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading);
    });

    await test.step(`Click button X`, async () => {
      await dashboard.locator(multipleSF.xpathIconClose).click();
      await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
    });

    await test.step(`Click button Enable multiple storefronts`, async () => {
      await dashboard.getByRole("button", { name: "Enable multiple storefronts" }).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading);
    });

    await test.step(`Click link here trong popup`, async () => {
      const currentTab = await verifyRedirectUrl({
        page: dashboard,
        selector: multipleSF.linkDocument,
        context,
        redirectUrl: expectData.url_link_document,
      });
      await currentTab.close();
    });

    await test.step(`Click button Create more storefronts > Click button Confirm`, async () => {
      await dashboard.getByRole("button", { name: "Enable", exact: true }).click();
      await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeHidden();
      await expect(dashboard.getByRole("button", { name: "Disable multiple storefronts" })).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathMenuOnlineStore,
        snapshotName: expectData.snapshot_menu,
      });
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_45 Check disable multi SF và enable lại SF`, async ({
    dashboard,
    snapshotFixture,
    page,
  }) => {
    await test.step(`Pre-condition: Check button turn on/off multiple storefront`, async () => {
      await dashboard.locator(multipleSF.menuOnlineStore).click();
      const countSubMenu = await dashboard.locator(multipleSF.xpathSubMenuOnlineStore).count();
      // 3 là số lượng submenu của Online store của store có nhiều storefronts
      if (countSubMenu > 3) {
        await dashboard.getByRole("button", { name: "Enable multiple storefronts" }).click();
        await dashboard.getByRole("button", { name: "Enable", exact: true }).click();
        await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeHidden();
      }
    });

    await test.step(`Click button Disable multiple storefronts`, async () => {
      await dashboard.getByRole("button", { name: "Disable multiple storefronts" }).click();
      await multipleSF.clickOnBtnWithLabel("Confirm");
      await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathMenuOnlineStore,
        snapshotName: expectData.snapshot_menu,
      });
    });

    await test.step(`Reload lại DB`, async () => {
      await dashboard.reload();
      await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
    });

    await test.step(`Open domain SF A là theme v2 ngoài SF`, async () => {
      await page.goto(`https://${settingData.domain_theme_v2}`);
      await snapshotFixture.verify({
        page: page,
        screenshotOptions: { fullPage: true },
        snapshotName: expectData.snapshot_theme_v2,
      });
    });

    await test.step(`Open domain SF B là theme v3 ngoài SF`, async () => {
      await page.goto(`https://${settingData.domain_theme_v3}`);
      await snapshotFixture.verify({
        page: page,
        screenshotOptions: { fullPage: true },
        snapshotName: expectData.snapshot_theme_v3,
      });
      await page.close();
    });

    await test.step(`Vào lại DB, click vào lại button Enable multiple storefronts`, async () => {
      await dashboard.getByRole("button", { name: "Enable multiple storefronts" }).click();
      await dashboard.getByRole("button", { name: "Enable", exact: true }).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//span`).nth(1),
      ).toHaveText(expectData.status);
    });
    await expect(
      dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//span`),
    ).toHaveText(expectData.status);
  });

  test(`@SB_NEWECOM_MSF_MSFL_66 SF detail_Check data default của màn SF detail của SF`, async ({
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Check button turn on/off multiple storefront`, async () => {
      await dashboard.locator(multipleSF.menuOnlineStore).click();
      const countSubMenu = await dashboard.locator(multipleSF.xpathSubMenuOnlineStore).count();
      // 3 là số lượng submenu của Online store của store có nhiều storefronts
      if (countSubMenu > 3) {
        await dashboard.getByRole("button", { name: "Enable multiple storefronts" }).click();
        await dashboard.getByRole("button", { name: "Enable", exact: true }).click();
        await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeHidden();
      }
    });

    await test.step(`Click View detail ở SF A (theme v2)`, async () => {
      const dataThemeV2 = settingData.theme_v2;
      await multipleSF.actionWithStorefront(dataThemeV2.shop_name, dataThemeV2.action);
      await expect(dashboard.locator(multipleSF.xpathStorefrontTitle)).toHaveText(expectData.shop_name_v2);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathSidebarStorefront,
        snapshotName: expectData.snapshot_theme_v2,
      });
      await dashboard.goBack();
    });

    await test.step(`Click View detail ở SF B (theme v3)`, async () => {
      const dataThemeV3 = settingData.theme_v3;
      await multipleSF.actionWithStorefront(dataThemeV3.shop_name, dataThemeV3.action);
      await expect(dashboard.locator(multipleSF.xpathStorefrontTitle)).toHaveText(expectData.shop_name_v3);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathSidebarStorefront,
        snapshotName: expectData.snapshot_theme_v3,
      });
    });
  });
});
