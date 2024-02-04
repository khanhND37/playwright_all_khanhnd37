import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { loadData } from "@core/conf/conf";
import { Page } from "@playwright/test";
import { SFHome } from "@pages/storefront/homepage";
import { dragAndDropElement } from "@core/utils/theme";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import type { FixtureThemeApi, ShopTheme, ThemeFixed } from "@types";
import { DashboardAPI } from "@pages/api/dashboard";

let shopTheme: ShopTheme;

/**
 * createMenu : click Add menu, create Menu and menuItem
 * updateMenuItem : edit menuItem
 * createMenuItem : create menuItem on the menu
 */
const addOrUpdateMenu = async (
  page: DashboardPage,
  menu: string,
  action: "createMenu" | "updateMenuItem" | "createMenuItem",
  menuItem: { name: string; link: string; data: string; order: number },
) => {
  const label = action === "createMenu" ? "+ Add menu" : menu;
  await page.clickElementWithLabel("a", label);
  await page.waitUntilElementVisible(".page-menu-form");
  await page.inputTextBoxWithLabel("Title", menu);
  if (menuItem.order) {
    await page.genLoc(`(//button[contains(.,'Edit')])[${menuItem.order}]`).click();
  } else {
    await page.clickOnBtnWithLabel("Add menu item");
  }
  await page.waitUntilElementVisible(".s-modal-content");
  //input name to menu item
  if (menuItem.name) {
    await page.inputTextBoxWithLabel("Name", menuItem.name);
  }
  //input link to menu item
  if (menuItem.link) {
    if (action === "updateMenuItem") {
      await page.genLoc("label[for='editMenuItemLink']+div  a").click();
    }
    await page.inputTextBoxWithLabel("Link", menuItem.link);
    await page.clickElementWithLabel("span", menuItem.link, 2);
  }
  //input data to link menu item
  if (menuItem.data) {
    await page.page
      .locator("//div[contains(@class,'s-taginput-container') and contains(@class,'is-focusable')]//input")
      .fill(menuItem.data);
    await page.clickElementWithLabel("div", menuItem.data);
  }
  await page.clickElementWithLabel("span", "Add");
  await expect(
    page.page.locator(`//div[@class='page-menu-form__menu-item' and contains(.,"${menuItem.name}")]`),
  ).toBeVisible();
  await page.clickElementWithLabel("span", "Save menu");
  await expect(page.page.locator(".is-loading")).toBeHidden();
  await expect(page.page.locator(`//h1[contains(.,"${menu}")]`)).toBeVisible();
};

/**
 * verify menu on storefront
 */
const verifyMenuOnSF = async (page: SFHome, expectData: Array<Record<string, string>>) => {
  for (const exp of expectData) {
    if (exp.name) {
      await page.clickElementWithLabel("a", exp.name);
      if (exp.title) {
        if (exp.title === "Homepage") {
          await expect(page.page.locator("section[type='slideshow']")).toBeVisible();
        } else {
          await expect(page.page.locator(`//h1[contains(.,'${exp.title}')]`)).toBeVisible();
        }
      }
    }
  }
};

const updateMenuToTheme = async (theme: FixtureThemeApi, data: Record<string, ThemeFixed>) => {
  if (!shopTheme) {
    const res = await theme.getPublishedTheme();
    shopTheme = await theme.single(res.id);
  }
  shopTheme = await theme.updateSection({
    shopThemeId: shopTheme.id,
    settingsData: shopTheme.settings_data,
    updateSection: data,
  });
};

const deleteMenu = async (page: DashboardPage, menu: string) => {
  const arrayLocator = page.page.locator(`//a[contains(.,'${menu}')]`);
  const numberMenu = await arrayLocator.count();
  if (numberMenu > 0) {
    for (let i = 0; i < numberMenu; i++) {
      await arrayLocator.nth(i).click();
      await page.waitUntilElementVisible(`//h1[contains(.,'${menu}')]`);
      await page.page.waitForSelector("//button[contains(.,'Delete menu')]");
      await page.clickElementWithLabel("span", "Delete menu");
      await page.waitUntilElementVisible("//h2[contains(.,'Delete this menu')]");
      await page.genLoc(".s-modal-footer__footer-actions button:nth-child(2)").click();
      await page.waitUntilElementInvisible(`//h1[contains(.,'${menu}')]`);
    }
  }
};

const deleteSubMenu = async (page: DashboardPage, domain: string, menu: string, submenu: string) => {
  await page.clickElementWithLabel("a", menu);
  await page.waitUntilElementVisible(`//h1[contains(.,'${menu}')]`);
  await page.genLoc(`//div[contains(.,'${submenu}')]/following-sibling::ul/li[2]/button`).click();
  await page.waitUntilElementVisible("//h2[contains(.,'Remove menu item')]");
  await page.clickOnBtnWithLabel("OK");
  await page.clickOnBtnWithLabel("Save menu");
};
/**
 * drag,drop commute menuItem for submenu
 * @param page
 * @param submenuOrder
 */
const dragAndDropSubMenuItem = async (page: Page, submenuOrder: number) => {
  const selector = `(//div[@class='tree-node-inner'])[${submenuOrder}]`;
  const locatorFrom = await page.waitForSelector(selector);
  const box = await locatorFrom.boundingBox();
  const _x = box.x + box.width / 2 + box.height * 2;
  const _y = box.y + box.height / 2;
  await dragAndDropElement(page, selector, { x: _x, y: _y });
};

const gotoNavigation = async (page: Page, domain: string) => {
  await page.goto(`https://${domain}/admin/menus`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("//h1[contains(.,'Navigation')]");
};

const verifyLockPageOnSF = async (page: Page, isStatus: boolean, titlePage: string) => {
  if (isStatus) {
    await expect(page.locator("//h2[contains(.,'404 Page Not Found')]")).toBeVisible();
  } else {
    await expect(page.locator(`//h1[contains(.,'${titlePage}')]`)).toBeVisible();
  }
};

test.describe("Verify navigation", async () => {
  let dashboardPage: DashboardPage;
  let dashboardAPI: DashboardAPI;

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest);
  });

  const confCreate = loadData(__dirname, "CREATE");
  confCreate.caseConf.data.forEach(({ case_id: id, description: description, data: data }) => {
    test(`@${id} - ${description}`, async ({ theme, conf, dashboard }) => {
      const dataMenu = data.menu.name;
      const dataSubmenus = data.menu.submenu;
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);

      await test.step("Delete data", async () => {
        await gotoNavigation(dashboard, conf.suiteConf.domain);
        await deleteMenu(dashboardPage, dataMenu);
      });

      await test.step("Create a new menu", async () => {
        await gotoNavigation(dashboard, conf.suiteConf.domain);
        for (const dataSubmenu of dataSubmenus) {
          await addOrUpdateMenu(dashboardPage, dataMenu, dataSubmenu.status, {
            name: dataSubmenu.name,
            link: dataSubmenu.link,
            data: dataSubmenu.data,
            order: dataSubmenu.order,
          });
          await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
        }
      });

      await test.step("Update menu on store font", async () => {
        await updateMenuToTheme(theme, data.data_header);
      });

      await test.step("Verify menu on store font", async () => {
        const dataExp = data.expect;
        await dashboard.goto(`https://${conf.suiteConf.domain}`);
        const sf = new SFHome(dashboard, conf.suiteConf.domain);
        await verifyMenuOnSF(sf, dataExp);
      });
    });
  });

  const confUpdate = loadData(__dirname, "UPDATE");
  confUpdate.caseConf.data.forEach(({ case_id: id, description: description, data: data }) => {
    test(`@${id} - ${description}`, async ({ conf, dashboard, authRequest }) => {
      const collectionAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);
      const dataMenu = data.menu.name;
      const dataSubmenus = data.menu.submenu;

      await test.step("Pre-condition: Create collections", async () => {
        const list = await collectionAPI.getAll();
        if (list.collections.length > 0) {
          for (const collection of list.collections) {
            await collectionAPI.delete(collection.id);
          }
        }
        for (const collectionData of confUpdate.caseConf.pre_data) {
          await collectionAPI.create(collectionData);
        }
      });

      await test.step("Update menu", async () => {
        await gotoNavigation(dashboard, conf.suiteConf.domain);
        for (const dataSubmenu of dataSubmenus) {
          await addOrUpdateMenu(dashboardPage, dataMenu, dataSubmenu.status, {
            name: dataSubmenu.name,
            link: dataSubmenu.link,
            data: dataSubmenu.data,
            order: dataSubmenu.order,
          });
          await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
        }
      });
      await test.step("Verify menu on store font", async () => {
        const sf = new SFHome(dashboard, conf.suiteConf.domain);
        const dataExp = data.expect;
        await sf.goto();
        await dashboard.waitForLoadState("networkidle");
        await verifyMenuOnSF(sf, dataExp);
      });
    });
  });

  test("@SB_OLS_NVG_131 - Check add the new collection to menu, verify on storefont", async ({
    conf,
    cConf,
    dashboard,
    authRequest,
    theme,
  }) => {
    const preData = cConf.data.pre_data;
    const testData = cConf.data.test_data;
    const dataSubmenus = preData.menu.submenu;
    const col = new CollectionAPI(conf.suiteConf.domain, authRequest);

    await test.step("Create collection by api", async () => {
      const list = await col.getAll();
      if (list.collections.length > 0) {
        for (const collection of list.collections) {
          await col.delete(collection.id);
        }
      }
      await col.create(JSON.stringify(preData));
    });

    await test.step("Clear menu data", async () => {
      const menusInfo = await dashboardAPI.getAllMenus();
      for (const menu of menusInfo) {
        if (menu.title !== "Main menu") {
          await dashboardAPI.deleteMenuByAPI(menu.id);
        }
      }
    });

    await test.step("Create test menu", async () => {
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      for (const dataSubmenu of dataSubmenus) {
        await addOrUpdateMenu(dashboardPage, preData.menu.name, dataSubmenu.status, {
          name: dataSubmenu.name,
          link: dataSubmenu.link,
          data: dataSubmenu.data,
          order: dataSubmenu.order,
        });
        await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
      }
      const shopTheme = await theme.single(conf.suiteConf.theme_id);
      const menuName = preData.menu.name as string;
      shopTheme.settings_data.fixed.header.settings.main = menuName.toLowerCase();
      await theme.update(conf.suiteConf.theme_id, shopTheme.settings_data);
    });

    await test.step("Update menu", async () => {
      await addOrUpdateMenu(dashboardPage, testData.menu.name, testData.menu.submenu.status, {
        name: testData.menu.submenu.name,
        link: testData.menu.submenu.link,
        data: testData.menu.submenu.data,
        order: testData.menu.submenu.order,
      });
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
    });

    await test.step("Verify menu on store font", async () => {
      const sf = new SFHome(dashboard, conf.suiteConf.domain);
      await sf.goto();
      await sf.page.waitForLoadState("networkidle");
      await verifyMenuOnSF(sf, testData.expect);
    });
  });

  test("@SB_OLS_NVG_6 - Check user delete item menu", async ({ conf, dashboard, theme }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const data = conf.caseConf.data;
    const dataSubmenu = data.menu.submenu;
    await test.step("Create menu test", async () => {
      const menusInfo = await dashboardAPI.getAllMenus();
      for (const menu of menusInfo) {
        if (menu.title !== "Main menu") {
          await dashboardAPI.deleteMenuByAPI(menu.id);
        }
      }
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      await addOrUpdateMenu(dashboardPage, data.menu.name, data.menu.submenu.status, {
        name: dataSubmenu.name,
        link: dataSubmenu.link,
        data: dataSubmenu.data,
        order: dataSubmenu.order,
      });
      const shopTheme = await theme.single(conf.suiteConf.theme_id);
      const menuName = data.menu.name as string;
      shopTheme.settings_data.fixed.header.settings.main = menuName.toLowerCase();
      await theme.update(conf.suiteConf.theme_id, shopTheme.settings_data);
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
    });

    await test.step("Update menu", async () => {
      await deleteSubMenu(dashboardPage, conf.suiteConf.domain, data.menu.name, data.menu.submenu.name);
    });

    await test.step("Verify menu on store font", async () => {
      const sf = new SFHome(dashboard, conf.suiteConf.domain);
      await sf.goto();
      await expect(dashboard.locator(`//li/a[contains(.,'${data.menu.submenu.name}')]`)).toBeHidden();
    });
  });

  test("@SB_OLS_NVG_10 - Check user delete menu", async ({ conf, dashboard, theme }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const data = conf.caseConf.data;
    const dataMenu = data.menu;
    const dataSubmenu = data.menu.submenu;

    await test.step("Create menu test", async () => {
      const menusInfo = await dashboardAPI.getAllMenus();
      for (const menu of menusInfo) {
        if (menu.title !== "Main menu") {
          await dashboardAPI.deleteMenuByAPI(menu.id);
        }
      }
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      await addOrUpdateMenu(dashboardPage, data.menu.name, data.menu.submenu.status, {
        name: dataSubmenu.name,
        link: dataSubmenu.link,
        data: dataSubmenu.data,
        order: dataSubmenu.order,
      });
      const shopTheme = await theme.single(conf.suiteConf.theme_id);
      const menuName = data.menu.name as string;
      shopTheme.settings_data.fixed.header.settings.main = menuName.toLowerCase();
      await theme.update(conf.suiteConf.theme_id, shopTheme.settings_data);
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
    });

    await test.step("Update menu", async () => {
      await deleteMenu(dashboardPage, dataMenu.name);
    });
    await test.step("Verify menu on store font", async () => {
      const sf = new SFHome(dashboard, conf.suiteConf.domain);
      await sf.goto();
      await expect(dashboard.locator(".site-nav>li")).toBeHidden();
    });
  });

  test("@SB_OLS_NVG_14 - Check drag and drop sub menu", async ({ theme, conf, dashboard }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const data = conf.caseConf.data;
    const createData = data.create_menu;

    await test.step("Create test menu", async () => {
      const menusInfo = await dashboardAPI.getAllMenus();
      for (const menu of menusInfo) {
        if (menu.title !== "Main menu") {
          await dashboardAPI.deleteMenuByAPI(menu.id);
        }
      }
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      for (const dataSubmenu of createData.submenu) {
        await addOrUpdateMenu(dashboardPage, createData.name, dataSubmenu.status, {
          name: dataSubmenu.name,
          link: dataSubmenu.link,
          data: dataSubmenu.data,
          order: dataSubmenu.order,
        });
        await dashboard.goto(`https://${conf.suiteConf.domain}/admin/menus`);
      }
    });

    await test.step("Update menu on store font", async () => {
      await updateMenuToTheme(theme, data.data_header);
    });

    await test.step("Drag and drop submenu", async () => {
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      await dashboardPage.clickElementWithLabel("a", data.menu.name);
      await dashboardPage.waitUntilElementVisible(`//h1[contains(.,"${data.menu.name}")]`);
      await dragAndDropSubMenuItem(dashboard, 3);
      await dragAndDropSubMenuItem(dashboard, 2);
      await dashboardPage.clickElementWithLabel("span", "Save menu");
      await expect(dashboard.locator(`//h1[contains(.,"${data.menu.name}")]`)).toBeVisible();
    });

    await test.step("Verify menu on store front", async () => {
      const sf = new SFHome(dashboard, conf.suiteConf.domain);
      await sf.goto();
      await dashboard.locator(data.expect[0].selector[0]).click();
      await dashboard.waitForURL(/pages/);
      await expect(dashboard.locator(`//h1[contains(.,'${data.expect[0].title}')]`)).toBeVisible();
      await dashboard.locator(data.expect[1].selector[0]).hover();
      await dashboard.locator(data.expect[1].selector[1]).click();
      await dashboard.waitForURL(/contact-us/);
      await expect(dashboard.locator(`//h1[contains(.,'${data.expect[1].title}')]`)).toBeVisible();
      await dashboard.locator(data.expect[2].selector[0]).hover();
      await dashboard.locator(data.expect[2].selector[1]).hover();
      await dashboard.locator(data.expect[2].selector[2]).click();
      await expect(dashboard.locator(`//h1[contains(.,'${data.expect[2].title}')]`)).toBeVisible();
    });
  });

  test("@SB_OLS_NVG_9 - Check user delete Main menu is disable", async ({ conf, dashboard }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    await test.step("Clear menu", async () => {
      const menusInfo = await dashboardAPI.getAllMenus();
      for (const menu of menusInfo) {
        if (menu.title !== "Main menu") {
          await dashboardAPI.deleteMenuByAPI(menu.id);
        }
      }
    });

    await test.step("Check user delete Main menu", async () => {
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      await dashboardPage.clickElementWithLabel("a", "Main menu");
      await dashboard.getByRole("heading", { name: "Menu items" }).waitFor();
      await expect(dashboard.locator(`//button[contains(.,'Delete menu')]`)).toBeHidden();
    });
  });

  const Pages = {
    "All products page": "Products",
    "All collections page": "Collection list",
    "Search page": "Search",
  };

  test("@SB_OLS_NVG_125 - Page locks_Select Page locks ", async ({ conf, dashboard, context, theme }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const saveBtn = dashboard.locator(".type--right").getByRole("button", { name: "Save" });

    await test.step("Pre-condition: set page locks default for test", async () => {
      await dashboardAPI.setPageLocks([]);
    });

    await test.step("Goto Page Locks screen", async () => {
      await gotoNavigation(dashboard, conf.suiteConf.domain);
      await dashboardPage.clickElementWithLabel("a", "Page locks");
      await dashboardPage.waitUntilElementVisible("//h1[contains(.,'Page locks')]");
    });

    await test.step("Check page lock first ", async () => {
      for (let i = 0; i < Object.keys(Pages).length; i++) {
        let currentTab = dashboard;
        const Page = Object.keys(Pages)[i];
        const titlePage = Object.values(Pages)[i];
        await dashboard
          .locator(`(//span[contains(.,'${Page}')]/preceding::span[@class='s-check'])[${i + 1}]`)
          .setChecked(true);
        if (await saveBtn.isEnabled()) {
          await saveBtn.click();
        }
        await dashboardPage.waitUntilElementInvisible(".save-setting-content button:nth-child(2)");
        const isStatus = await dashboard.isChecked(
          `(//span[contains(.,'${Page}')]/preceding::span[@class='s-check'])[${i + 1}]`,
        );
        await expect(async () => {
          const bootstrap = await theme.getBootstrap(conf.suiteConf.theme_id);
          expect(bootstrap.navigation).toMatchObject(conf.caseConf.first_lock[i]);
        }).toPass({ timeout: 30_000, intervals: [2_000] });
        const [SF] = await Promise.all([
          context.waitForEvent("page"),
          dashboard.locator(`//span[contains(.,'${Page}')]/a`).click({ delay: 3000 }),
        ]);
        currentTab = SF;
        await currentTab.waitForLoadState("networkidle");
        await verifyLockPageOnSF(currentTab, isStatus, titlePage);
        await currentTab.close();
      }
    });

    await test.step("Check page lock second", async () => {
      for (let i = 0; i < Object.keys(Pages).length; i++) {
        let currentTab = dashboard;
        const Page = Object.keys(Pages)[i];
        const titlePage = Object.values(Pages)[i];
        await dashboard
          .locator(`(//span[contains(.,'${Page}')]/preceding::span[@class='s-check'])[${i + 1}]`)
          .setChecked(false);
        await saveBtn.click();
        await dashboardPage.waitUntilElementInvisible(".save-setting-content button:nth-child(2)");
        const isStatus = await dashboard
          .locator(`(//span[contains(.,'${Page}')]/preceding::span[@class='s-check'])[${i + 1}]`)
          .isChecked();
        await expect(dashboard.locator(".save-setting-fixed")).toHaveAttribute("style", "display: none;");
        await expect(dashboard.locator(".s-toast")).toHaveText("Page locks was updated");
        await dashboard.locator(".s-toast").waitFor({ state: "hidden" });
        await expect(async () => {
          const bootstrap = await theme.getBootstrap(conf.suiteConf.theme_id);
          expect(bootstrap.navigation).toMatchObject(conf.caseConf.second_lock[i]);
        }).toPass({ timeout: 30_000, intervals: [2_000] });
        const [SF] = await Promise.all([
          context.waitForEvent("page"),
          dashboard.locator(`//span[contains(.,'${Page}')]/a`).click({ delay: 5000 }),
        ]);
        currentTab = SF;
        await verifyLockPageOnSF(currentTab, isStatus, titlePage);
        await currentTab.close();
      }
    });
  });
});
