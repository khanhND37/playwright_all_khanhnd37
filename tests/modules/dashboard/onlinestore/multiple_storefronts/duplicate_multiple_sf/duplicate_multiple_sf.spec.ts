import { test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { expect } from "@playwright/test";
import { MultipleSF } from "@sf_pages/multiple_storefronts";

let dashboardPage: DashboardPage, multipleSF: MultipleSF, settingData, expectData, storefrontName;

test.describe("Verify duplicate multiple storefronts", () => {
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

  test(`@SB_NEWECOM_MSF_MSFL_64 SF list_Duplicate SF có status = active + có connect domain có publish domain connect`, async ({
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(`Search storefront`, async () => {
      await dashboard.getByPlaceholder("Search by name or domain").fill(settingData.store_name);
      await dashboard.keyboard.press("Enter");
      await dashboard.waitForResponse(
        response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
      );
    });

    await test.step(`Click Action > Chọn Duplicate SF có connect domain +  có publish domain connect + status active`, async () => {
      await multipleSF.actionWithStorefront(settingData.store_name, "Duplicate");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);
      await expect(dashboard.locator(multipleSF.xpathPopupBody)).toHaveValue(`${settingData.store_name} (1)`);
    });

    await test.step(`Nhập rename không hợp lệ ( > 64 ký tự hoặc SF đã tồn tại, < 4 ký tự)`, async () => {
      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(settingData.name_invalid);
      await dashboard.getByRole("button", { name: "Confirm", exact: true }).click();
      await expect(dashboard.locator(multipleSF.xpathErrorMessage)).toHaveText(
        "Your store name must be at least 4 characters",
      );
    });

    await test.step(`Nhập rename hợp lê (<= 64 ký tự, tên SF không bị trùng, >= 4 ký tự)`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(storefrontName);
      await dashboard.getByRole("button", { name: "Confirm", exact: true }).click();

      // Clear data search
      await dashboard.getByPlaceholder("Search by name or domain").clear();
      await dashboard.waitForResponse(
        response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
      );

      // Verrify storefront mới được duplicate
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(storefrontName);
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}` + `${multipleSF.btnCustomize}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}` + `${multipleSF.btnMoreAction}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));

      const publicDomain = await dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}//p/a`).textContent();
      await expect(publicDomain).toContain(storefrontName);
      const storefrontID = await dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}//p[2]`).textContent();
      await expect(storefrontID).not.toContain(expectData.store_id);
    });

    await test.step(`Chờ 40s`, async () => {
      await dashboard.waitForTimeout(40000); // Theo spec, 40s sau khi duplicate sf thì mới enable button
    });

    await test.step(`Click View details của SF vừa duplicate`, async () => {
      await multipleSF.actionWithStorefront(storefrontName, "Settings");
      await expect(dashboard.locator(multipleSF.xpathSidebarMenu)).toBeVisible();
    });

    await test.step(`Click vào tab design`, async () => {
      await expect(dashboard.locator(`#page-header`)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageDesign,
        snapshotName: expectData.snapshot_design,
      });
    });

    await test.step(`Click vào tab General`, async () => {
      await multipleSF.actionWithSidebar("General");
      await expect(dashboard.locator(`.add-customer-heading`)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageGeneral,
        snapshotName: expectData.snapshot_general,
      });
    });

    await test.step(`Click vào Tab Preferences:`, async () => {
      await multipleSF.actionWithSidebar("Preferences");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Preferences"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPagePreferences,
        snapshotName: expectData.snapshot_preferences,
      });
    });

    await test.step(`Click vào Tab Navigation`, async () => {
      await multipleSF.actionWithSidebar("Navigation");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Navigation"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageNavigation,
        snapshotName: expectData.snapshot_navigation,
      });
    });

    await test.step(`Click vào tab Pages`, async () => {
      await multipleSF.actionWithSidebar("Pages");
      await expect(dashboard.locator(`#page-header`)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPages,
        snapshotName: expectData.snapshot_pages,
      });
    });

    await test.step(`Click vào tab Blog posts`, async () => {
      await multipleSF.actionWithSidebar("Blog posts");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Manage blog posts"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageBlogs,
        snapshotName: expectData.snapshot_blogs,
      });
    });

    await test.step(`Click vào tab Domains`, async () => {
      await multipleSF.actionWithSidebar("Domains");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Domains"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageDomains,
        snapshotName: expectData.snapshot_domains,
      });
    });

    await test.step(`Click vào tab Abandon Checkout`, async () => {
      await multipleSF.actionWithSidebar("Abandoned Checkouts Recovery");
      await expect(dashboard.locator(multipleSF.xpathHeaderCheckout)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageCheckout,
        snapshotName: expectData.snapshot_checkout,
      });
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_65 SF list_Duplicate SF có status = active + có connect domain nhưng ko publish domain connect`, async ({
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(`Search storefront`, async () => {
      await dashboard.getByPlaceholder("Search by name or domain").fill(settingData.store_name);
      await dashboard.keyboard.press("Enter");
      await dashboard.waitForResponse(
        response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
      );
    });

    await test.step(`Click Action > Chọn Duplicate SF có connect domain +  có publish domain connect + status active`, async () => {
      await multipleSF.actionWithStorefront(settingData.store_name, "Duplicate");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);
      await expect(dashboard.locator(multipleSF.xpathPopupBody)).toHaveValue(`${settingData.store_name} (1)`);
    });

    await test.step(`Nhập rename hợp lê (<= 64 ký tự, tên SF không bị trùng, >= 4 ký tự)`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(storefrontName);
      await dashboard.getByRole("button", { name: "Confirm", exact: true }).click();

      // Clear data search
      await dashboard.getByPlaceholder("Search by name or domain").clear();
      await dashboard.waitForResponse(
        response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
      );

      // Verrify storefront mới được duplicate
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(storefrontName);
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}` + `${multipleSF.btnCustomize}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}` + `${multipleSF.btnMoreAction}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));

      const publicDomain = await dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}//p/a`).textContent();
      await expect(publicDomain).toContain(storefrontName);
      const storefrontID = await dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}//p[2]`).textContent();
      await expect(storefrontID).not.toContain(expectData.store_id);
    });

    await test.step(`Chờ 40s`, async () => {
      await dashboard.waitForTimeout(40000); // Theo spec, 40s sau khi duplicate thì mới enable button
    });

    await test.step(`Click View details của SF vừa duplicate`, async () => {
      await multipleSF.actionWithStorefront(storefrontName, "Settings");
      await expect(dashboard.locator(multipleSF.xpathSidebarMenu)).toBeVisible();
    });

    await test.step(`Click View details của SF vừa duplicate`, async () => {
      await multipleSF.actionWithStorefront(storefrontName, "Settings");
      await expect(dashboard.locator(multipleSF.xpathSidebarMenu)).toBeVisible();
    });

    await test.step(`Click vào tab design`, async () => {
      await expect(dashboard.locator(`#page-header`)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageDesign,
        snapshotName: expectData.snapshot_design,
      });
    });

    await test.step(`Click vào tab General`, async () => {
      await multipleSF.actionWithSidebar("General");
      await expect(dashboard.locator(`.add-customer-heading`)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageGeneral,
        snapshotName: expectData.snapshot_general,
      });
    });

    await test.step(`Click vào Tab Preferences:`, async () => {
      await multipleSF.actionWithSidebar("Preferences");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Preferences"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPagePreferences,
        snapshotName: expectData.snapshot_preferences,
      });
    });

    await test.step(`Click vào Tab Navigation`, async () => {
      await multipleSF.actionWithSidebar("Navigation");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Filter"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageNavigation,
        snapshotName: expectData.snapshot_navigation,
      });
    });

    await test.step(`Click vào tab Pages`, async () => {
      await multipleSF.actionWithSidebar("Pages");
      await expect(dashboard.locator(`#page-header`)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPages,
        snapshotName: expectData.snapshot_pages,
      });
    });

    await test.step(`Click vào tab Blog posts`, async () => {
      await multipleSF.actionWithSidebar("Blog posts");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Manage blog posts"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageBlogs,
        snapshotName: expectData.snapshot_blogs,
      });
    });

    await test.step(`Click vào tab Domains`, async () => {
      await multipleSF.actionWithSidebar("Domains");
      await expect(dashboard.locator(multipleSF.getXpathHeader("Domains"))).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageDomains,
        snapshotName: expectData.snapshot_domains,
      });
    });

    await test.step(`Click vào tab Abandon Checkout`, async () => {
      await multipleSF.actionWithSidebar("Abandoned Checkouts Recovery");
      await expect(dashboard.locator(multipleSF.xpathHeaderCheckout)).toBeVisible();
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathPageCheckout,
        snapshotName: expectData.snapshot_checkout,
      });
    });
  });
});
