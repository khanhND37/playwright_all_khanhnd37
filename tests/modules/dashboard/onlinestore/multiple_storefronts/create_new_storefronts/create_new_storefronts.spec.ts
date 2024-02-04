import { test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { expect } from "@playwright/test";
import { HiveBalance } from "@pages/hive/hive_balance";
import { MultipleSF } from "@sf_pages/multiple_storefronts";
import { scrollUntilElementIsVisible } from "@utils/scroll";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

let dashboardPage: DashboardPage, multipleSF: MultipleSF, settingData, expectData, storefrontName;

test.describe("Verify create new storefronts", () => {
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
  test(`@SB_NEWECOM_MSF_MSFL_51 Add new SF_Check add new 1 SF thành công khi apply template v3 + không change color + font ở Shop SB`, async ({
    dashboard,
    conf,
    snapshotFixture,
    theme,
    hiveSBase,
  }) => {
    await test.step(`Nhập data: Name = Hợp lệ (< 64 ký tự, name chưa tồn tại, >= 4 ký tự)->Click button Confirm`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await multipleSF.createNewStorefront(storefrontName);
      await expect(dashboard.locator(multipleSF.xpathPopupChooseTemplate)).toBeVisible();
    });

    await test.step(`Chọn template = FunkFoot > Apply`, async () => {
      await multipleSF.applyTemplate(settingData.template_name);
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(storefrontName);

      const publicDomain = await dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}//p/a`).textContent();
      await expect(publicDomain).toContain(storefrontName);
      // Cmt code do PM yêu cầu tạm thời ẩn đi
      // await expect(
      //   dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//span`),
      // ).toHaveText(expectData.status_creating);

      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}` + `${multipleSF.btnCustomize}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}` + `${multipleSF.btnMoreAction}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));
    });

    await test.step(`Click vào button Customize`, async () => {
      await dashboard.waitForTimeout(40000); // Theo spec, 40s sau khi tạo sf thì mới enable button
      await dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}` + `${multipleSF.btnCustomize}`).click();
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(multipleSF.spinner).waitFor({ state: "visible" });
      await dashboard.locator(multipleSF.spinner).waitFor({ state: "hidden" });

      const storeId = await theme.getStoreId();
      await expect(dashboard.url()).toContain(`${storeId}/builder/site`);
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        screenshotOptions: { fullPage: true },
        snapshotName: expectData.snapshot_applied_template,
      });
    });

    await test.step(`Go to Hive -> Clean shop -> check storefront đã được clean`, async () => {
      const getStoreId = await theme.getStoreId();
      const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
      await hiveBalance.cleanShop(conf.suiteConf.hive_domain, getStoreId.toString());

      // // Multiple storefronts phase 2 mới xử lý close storefront
      //   await dashboardPage.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
      //   await expect(
      //     dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      //   ).not.toHaveText(storefrontName);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_52 Add new SF_Check add new 1 SF thành công khi apply template v3 + có change color + font ở Shop SB`, async ({
    dashboard,
    conf,
    theme,
    snapshotFixture,
    hiveSBase,
  }) => {
    await test.step(`Nhập data: Name = Hợp lệ (< 64 ký tự, name chưa tồn tại, >= 4 ký tự -> Click button Confirm`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await multipleSF.createNewStorefront(storefrontName);
      await expect(dashboard.locator(multipleSF.xpathPopupChooseTemplate)).toBeVisible();
    });

    await test.step(`Hover template = Petshop >  Click button preview -> Change font + color template > Click button Apply`, async () => {
      const themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await multipleSF.previewTemplate(settingData.template_name);
      await themes.changeColor(settingData.change.color);
      await themes.changeFont(settingData.change.font);
      await dashboard.locator(multipleSF.btnApplyPreview).click();
      await expect(dashboard.locator(multipleSF.xpathPopupChooseTemplate)).toBeHidden();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(storefrontName);
    });

    await test.step(`Click change layout = Grid SF`, async () => {
      await dashboard.locator(multipleSF.btnLayoutGrid).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(storefrontName);

      const publicDomain = await dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}//p/a`).textContent();
      await expect(publicDomain).toContain(storefrontName);
      // Cmt code do PM yêu cầu tạm thời ẩn đi
      // await expect(
      //   dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//span`),
      // ).toHaveText(expectData.status_creating);
    });

    await test.step(`Hover vào ảnh thumbnail SF đang create`, async () => {
      await dashboard.locator(multipleSF.getXpathStorefrontList(1) + multipleSF.xpathThumbnailGrid).hover();
      await expect(dashboard.locator(multipleSF.getXpathStorefrontList(1) + multipleSF.xpathThumbnailGrid)).toHaveText(
        "Customize",
      );
    });

    await test.step(`Chờ 40s`, async () => {
      await dashboard.waitForTimeout(40000); // Theo spec, 40s sau khi tạo sf thì mới enable button
    });

    await test.step(`Hover vào ảnh thumbnail SF vừa tạo > Click button Customize`, async () => {
      await dashboard.locator(multipleSF.getXpathStorefrontList(1) + multipleSF.xpathThumbnailGrid).click();
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(multipleSF.spinner).waitFor({ state: "visible" });
      await dashboard.locator(multipleSF.spinner).waitFor({ state: "hidden" });

      const storeId = await theme.getStoreId();
      await expect(dashboard.url()).toContain(`${storeId}/builder/site`);
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        screenshotOptions: { fullPage: true },
        snapshotName: expectData.snapshot_applied_template,
      });
    });

    await test.step(`Go to Hive -> Clean shop -> check storefront đã được clean`, async () => {
      const getStoreId = await theme.getStoreId();
      const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
      await hiveBalance.cleanShop(conf.suiteConf.hive_domain, getStoreId.toString());

      // // Multiple storefronts phase 2 mới xử lý close storefront
      // await dashboardPage.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
      // await expect(
      //   dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      // ).not.toHaveText(storefrontName);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_53 Add new SF_Check add new 1 SF thành công khi add theme cũ`, async ({
    dashboard,
    conf,
    theme,
    hiveSBase,
  }) => {
    await test.step(`Nhập data:- Name = Hợp lệ (< 64 ký tự, name chưa tồn tại, >= 4 ký tự) - Click button Confirm`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await expect(dashboard.locator(multipleSF.xpathPopupChooseTemplate)).toBeVisible();
    });

    await test.step(`Scroll đến cuối màn popup chọn template`, async () => {
      await scrollUntilElementIsVisible({
        page: dashboard,
        viewEle: dashboard.getByRole("button", { name: "Add legacy templates" }),
      });
      await expect(dashboard.getByRole("button", { name: "Add legacy templates" })).toBeVisible();
    });

    await test.step(`Click button add legacy template`, async () => {
      await dashboard.getByRole("button", { name: "Add legacy templates" }).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);
    });

    await test.step(`Chọn template của theme cũ bất kỳ > Click button Add `, async () => {
      await dashboard.locator(multipleSF.xpathOldTemplateName(settingData.template_name)).click();
      await dashboard.locator(multipleSF.btnAddTheme).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(storefrontName);

      const publicDomain = await dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}//p/a`).textContent();
      await expect(publicDomain).toContain(storefrontName);
      // Cmt code do PM yêu cầu tạm thời ẩn đi
      // await expect(
      //   dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//span`),
      // ).toHaveText(expectData.status_creating);

      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}` + `${multipleSF.btnCustomize}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}` + `${multipleSF.btnMoreAction}`),
      ).toHaveAttribute("class", new RegExp("is-disabled"));
    });

    await test.step(`Chờ 40s > Click button Customize`, async () => {
      await dashboard.waitForTimeout(40000); // Theo spec, 40s sau khi tạo sf thì mới enable button
      await dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}` + `${multipleSF.btnCustomize}`).click();
      const storeId = await theme.getStoreId();
      await expect(dashboard.url()).toContain(`${storeId}/theme-editor-next`);
    });

    await test.step(`Go to Hive -> Clean shop -> check storefront đã được clean`, async () => {
      const getStoreId = await theme.getStoreId();
      const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
      await hiveBalance.cleanShop(conf.suiteConf.hive_domain, getStoreId.toString());

      // // Multiple storefronts phase 2 mới xử lý close storefront
      //   await dashboardPage.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
      //   await expect(
      //     dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      //   ).not.toHaveText(storefrontName);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_58 Add new SF_Check add new 1 SF không thành công`, async ({ dashboard }) => {
    await test.step(`Click button Create new storefront`, async () => {
      await dashboard.getByRole("button", { name: settingData.button_create }).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(settingData.button_create);
    });

    await test.step(`Để trống các field, click button Confirm`, async () => {
      await dashboard.getByRole("button", { name: "Confirm" }).click();
      await expect(dashboard.locator(multipleSF.xpathErrorMessage)).toHaveText("Please input name");
    });

    await test.step(`Nhập tên < 4 kí tự, click button Confirm`, async () => {
      await dashboard.getByPlaceholder("Ex: WonderPlay").clear();
      await dashboard.getByPlaceholder("Ex: WonderPlay").fill(settingData.name_less_4_character);
      await dashboard.getByRole("button", { name: "Confirm" }).click();
      await expect(dashboard.locator(multipleSF.xpathErrorMessage)).toHaveText(
        "Your store name must be at least 4 characters",
      );
    });

    await test.step(`Nhập data ko hợp lệ -> click button Confirm`, async () => {
      for (const dataName of settingData.storefront_name) {
        await dashboard.getByPlaceholder("Ex: WonderPlay").clear();
        await dashboard.getByPlaceholder("Ex: WonderPlay").fill(dataName.name);
        await dashboard.getByRole("button", { name: "Confirm" }).click();
        await expect(dashboard.locator(multipleSF.xpathToast)).toHaveText(dataName.message);
      }
    });

    await test.step(`Nhập data hợp lệ -> Click back`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await dashboard.getByPlaceholder("Ex: WonderPlay").clear();
      await dashboard.getByPlaceholder("Ex: WonderPlay").fill(storefrontName);
      await dashboard.getByRole("button", { name: "Back" }).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).not.toHaveText(storefrontName);
    });

    await test.step(`Nhập data hợp lệ -> Click icon close`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await dashboard.getByRole("button", { name: settingData.button_create }).click();
      await dashboard.getByPlaceholder("Ex: WonderPlay").fill(storefrontName);
      await dashboard.locator(multipleSF.xpathIconClose).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).not.toHaveText(storefrontName);
    });

    await test.step(`Nhập data hợp lệ -> Click ra bên ngoài`, async () => {
      storefrontName = multipleSF.generateNameStorefront();
      await dashboard.getByRole("button", { name: settingData.button_create }).click();
      await dashboard.getByPlaceholder("Ex: WonderPlay").fill(storefrontName);
      await dashboard.locator(multipleSF.xpathOverlay).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`),
      ).not.toHaveText(storefrontName);
    });
  });
});
