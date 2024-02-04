import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { AccountPage } from "@pages/dashboard/accounts";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { CreateShopScheduleData } from "./create_shop";

test.describe("Verify create shop", () => {
  let accountPage: AccountPage,
    data,
    env,
    domain: string,
    shopName: string,
    theme: ThemeEcom,
    scheduleData,
    isSchedule: boolean;

  test.beforeEach(async ({ conf, account }) => {
    data = conf.caseConf.data;
    env = process.env.ENV;

    accountPage = new AccountPage(account, conf.suiteConf.accounts_domain);
    await accountPage.genLoc(accountPage.xpathAddNewShopBtn).waitFor({ state: "visible" });
  });

  test(`@SB_OBCT_UOS_15 Check tạo shop PrintBase`, async ({ conf, scheduler }) => {
    const pb = conf.suiteConf.pb;

    const rawDataJson = (await scheduler.getData()) as CreateShopScheduleData;
    if (rawDataJson) {
      scheduleData = rawDataJson;
      isSchedule = true;
    } else {
      scheduleData = {
        shopName: "",
      };
    }

    if (!isSchedule) {
      const timeStamp = Date.now();
      shopName = `${data.shop_name}-${env}-${timeStamp}`;
      domain = env === "dev" ? `${shopName}.myshopbase.net` : `${shopName}.onshopbase.com`;
      await accountPage.addNewShop(shopName);

      await test.step("Nhập thông tin tại màn Add your contact", async () => {
        await accountPage.addYourContact(data.store_country, data.location, data.contact);
        await accountPage.page.waitForLoadState("domcontentloaded");
        expect(await accountPage.isTextVisible(data.question)).toBe(true);
      });

      await test.step(`Chọn type Print On Demand`, async () => {
        await accountPage.clickElementWithLabel("li", data.business_type);
        await accountPage.clickOnBtnWithLabel("I want a PrintBase store");
      });
      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      scheduleData = {
        shopName: shopName,
      };
      await scheduler.setData(scheduleData);

      await scheduler.schedule({ mode: "later", minutes: 2 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    } else {
      await accountPage.selectShopByName(rawDataJson.shopName);
      await scheduler.clear();
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(rawDataJson.shopName);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitDashboardActive();

      await test.step(`Mở list Campains trong dashboard`, async () => {
        await dashboard.navigateToMenu("Campaigns");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadingProduct);
        await expect(dashboard.genLoc(dashboard.xpathProductResult)).toBeHidden();
      });

      await test.step(`Mở Online store > Design`, async () => {
        await dashboard.navigateToMenu("Online Store");
        await expect(dashboard.genLoc(dashboard.xpathThemePublic)).toHaveText(pb.theme_public);
      });

      await test.step(`Mở Online store > Pages`, async () => {
        await dashboard.navigateToMenu("Pages");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadPages);
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(pb.pages.length);
        for (const item of pb.pages) {
          expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });

      await test.step(`Mở Online store > Navigation`, async () => {
        //Add theme v2 > public theme v2 to check menu in navigation
        theme = await new ThemeEcom(accountPage.page, domain);
        await theme.addAndPublicThemeV2(dashboard, domain);

        await dashboard.navigateToMenu("Navigation");
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(pb.menus.length);
        for (const item of pb.menus) {
          await expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });
    }
  });

  test(`@SB_OBCT_UOS_16 Check tạo shop PlusBase`, async ({ conf, scheduler }) => {
    const plb = conf.suiteConf.plb;
    const rawDataJson = (await scheduler.getData()) as CreateShopScheduleData;
    if (rawDataJson) {
      scheduleData = rawDataJson;
      isSchedule = true;
    } else {
      scheduleData = {
        shopName: "",
      };
    }

    if (!isSchedule) {
      const timeStamp = Date.now();
      shopName = `${data.shop_name}-${env}-${timeStamp}`;
      domain = env === "dev" ? `${shopName}.myshopbase.net` : `${shopName}.onshopbase.com`;
      await accountPage.addNewShop(shopName);

      await test.step("Nhập thông tin tại màn Add your contact", async () => {
        await accountPage.addYourContact(data.store_country, data.location, data.contact);
        await accountPage.page.waitForLoadState("domcontentloaded");
        expect(await accountPage.isTextVisible(data.question)).toBe(true);
      });

      await test.step(`Chọn type General Dropshipping`, async () => {
        await accountPage.clickElementWithLabel("li", data.business_type);
        await accountPage.clickOnBtnWithLabel("I want a PlusBase store");
      });
      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      scheduleData = {
        shopName: shopName,
      };
      await scheduler.setData(scheduleData);

      await scheduler.schedule({ mode: "later", minutes: 2 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    } else {
      await accountPage.selectShopByName(rawDataJson.shopName);
      await scheduler.clear();
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(rawDataJson.shopName);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitDashboardActive();

      await test.step(`Mở list Products trong dashboard`, async () => {
        await dashboard.navigateToMenu("Dropship products");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadingProduct);
        if (plb.products) {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeVisible();
        } else {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeHidden();
        }
      });

      await test.step(`Mở Online store > Design`, async () => {
        await dashboard.navigateToMenu("Online Store");
        await expect(dashboard.genLoc(dashboard.xpathThemePublic)).toHaveText(plb.theme_public);
      });

      await test.step(`Mở Online store > Pages`, async () => {
        await dashboard.navigateToMenu("Pages");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadPages);
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(plb.pages.length);
        for (const item of plb.pages) {
          expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });

      await test.step(`Mở Online store > Navigation`, async () => {
        //Add theme v2 > public theme v2 to check menu in navigation
        theme = await new ThemeEcom(accountPage.page, domain);
        await theme.addAndPublicThemeV2(dashboard, domain);

        await dashboard.navigateToMenu("Navigation");
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(plb.menus.length);
        for (const item of plb.menus) {
          await expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });
    }
  });

  test(`@SB_OBCT_UOS_17 Check tạo shop General Dropship`, async ({ conf, scheduler }) => {
    const sb = conf.suiteConf.sb;

    const rawDataJson = (await scheduler.getData()) as CreateShopScheduleData;
    if (rawDataJson) {
      scheduleData = rawDataJson;
      isSchedule = true;
    } else {
      scheduleData = {
        shopName: "",
      };
    }

    if (!isSchedule) {
      const timeStamp = Date.now();
      shopName = `${data.shop_name}-${env}-${timeStamp}`;
      domain = env === "dev" ? `${shopName}.myshopbase.net` : `${shopName}.onshopbase.com`;
      await accountPage.addNewShop(shopName);

      await test.step("Nhập thông tin tại màn Add your contact", async () => {
        await accountPage.addYourContact(data.store_country, data.location, data.contact);
        await accountPage.page.waitForLoadState("domcontentloaded");
        expect(await accountPage.isTextVisible(data.question)).toBe(true);
      });

      await test.step(`Chọn type General Dropshipping`, async () => {
        await accountPage.clickElementWithLabel("li", data.business_type);
        await accountPage.clickOnBtnWithLabel("I want a ShopBase store");
        await accountPage.genLoc(accountPage.xpathSurveyImport).waitFor({ state: "visible" });
        await accountPage.genLoc(accountPage.xpathButtonNoImport).click();
      });
      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      scheduleData = {
        shopName: shopName,
      };
      await scheduler.setData(scheduleData);

      await scheduler.schedule({ mode: "later", minutes: 2 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    } else {
      await accountPage.selectShopByName(rawDataJson.shopName);
      await scheduler.clear();

      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(rawDataJson.shopName);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitDashboardActive();

      await test.step(`Mở list Products trong dashboard`, async () => {
        await dashboard.navigateToMenu("Products");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadingProduct);
        if (sb.products) {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeVisible();
        } else {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeHidden();
        }
      });

      await test.step(`Mở Online store > Design`, async () => {
        await dashboard.navigateToMenu("Online Store");
        await expect(dashboard.genLoc(dashboard.xpathThemePublic)).toHaveText(sb.theme_public);
      });

      await test.step(`Mở Online store > Pages`, async () => {
        await dashboard.navigateToMenu("Pages");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadPages);
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(sb.pages.length);
        for (const item of sb.pages) {
          expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });

      await test.step(`Mở Online store > Navigation`, async () => {
        if (sb.public_v2) {
          //Add theme v2 > public theme v2 to check menu in navigation
          theme = await new ThemeEcom(accountPage.page, domain);
          await theme.addAndPublicThemeV2(dashboard, domain);
        }

        await dashboard.navigateToMenu("Navigation");
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(sb.menus.length);
        for (const item of sb.menus) {
          await expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });
    }
  });

  test(`@SB_OBCT_UOS_18 Check tạo shop Niche Dropshipping`, async ({ conf, scheduler }) => {
    const niche = conf.suiteConf.niche;
    const rawDataJson = (await scheduler.getData()) as CreateShopScheduleData;
    if (rawDataJson) {
      scheduleData = rawDataJson;
      isSchedule = true;
    } else {
      scheduleData = {
        shopName: "",
      };
    }

    if (!isSchedule) {
      const timeStamp = Date.now();
      shopName = `${data.shop_name}-${env}-${timeStamp}`;
      domain = env === "dev" ? `${shopName}.myshopbase.net` : `${shopName}.onshopbase.com`;
      await accountPage.addNewShop(shopName);

      await test.step("Nhập thông tin tại màn Add your contact", async () => {
        await accountPage.addYourContact(data.store_country, data.location, data.contact);
        await accountPage.page.waitForLoadState("domcontentloaded");
        expect(await accountPage.isTextVisible(data.question)).toBe(true);
      });

      await test.step(`Chọn type Niche Dropshipping`, async () => {
        await accountPage.clickElementWithLabel("li", data.business_type);
        await accountPage.clickOnBtnWithLabel("I want a ShopBase store");
        await accountPage.genLoc(accountPage.xpathSurveyImport).waitFor({ state: "visible" });
        await accountPage.genLoc(accountPage.xpathButtonNoImport).click();
      });
      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      scheduleData = {
        shopName: shopName,
      };
      await scheduler.setData(scheduleData);

      await scheduler.schedule({ mode: "later", minutes: 2 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    } else {
      await accountPage.selectShopByName(rawDataJson.shopName);
      await scheduler.clear();

      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(rawDataJson.shopName);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitDashboardActive();

      await test.step(`Mở list Products trong dashboard`, async () => {
        await dashboard.navigateToMenu("Products");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadingProduct);
        if (niche.products) {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeVisible();
        } else {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeHidden();
        }
      });

      await test.step(`Mở Online store > Design`, async () => {
        await dashboard.navigateToMenu("Online Store");
        await expect(dashboard.genLoc(dashboard.xpathThemePublic)).toHaveText(niche.theme_public);
      });

      await test.step(`Mở Online store > Pages`, async () => {
        await dashboard.navigateToMenu("Pages");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadPages);
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(niche.pages.length);
        for (const item of niche.pages) {
          expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });

      await test.step(`Mở Online store > Navigation`, async () => {
        if (niche.public_v2) {
          //Add theme v2 > public theme v2 to check menu in navigation
          theme = await new ThemeEcom(accountPage.page, domain);
          await theme.addAndPublicThemeV2(dashboard, domain);
        }

        await dashboard.navigateToMenu("Navigation");
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(niche.menus.length);
        for (const item of niche.menus) {
          await expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });
    }
  });

  test(`@SB_OBCT_UOS_19 Check tạo shop Other`, async ({ conf, scheduler }) => {
    const other = conf.suiteConf.other;
    const rawDataJson = (await scheduler.getData()) as CreateShopScheduleData;
    if (rawDataJson) {
      scheduleData = rawDataJson;
      isSchedule = true;
    } else {
      scheduleData = {
        shopName: "",
      };
    }

    if (!isSchedule) {
      const timeStamp = Date.now();
      shopName = `${data.shop_name}-${env}-${timeStamp}`;
      domain = env === "dev" ? `${shopName}.myshopbase.net` : `${shopName}.onshopbase.com`;
      await accountPage.addNewShop(shopName);

      await test.step("Nhập thông tin tại màn Add your contact", async () => {
        await accountPage.addYourContact(data.store_country, data.location, data.contact);
        await accountPage.page.waitForLoadState("domcontentloaded");
        expect(await accountPage.isTextVisible(data.question)).toBe(true);
      });

      await test.step(`Chọn type Other`, async () => {
        await accountPage.clickElementWithLabel("li", data.business_type);
        await accountPage.genLoc(accountPage.xpathSurveyImport).waitFor({ state: "visible" });
        await accountPage.genLoc(accountPage.xpathButtonNoImport).click();
      });
      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      scheduleData = {
        shopName: shopName,
      };
      await scheduler.setData(scheduleData);

      await scheduler.schedule({ mode: "later", minutes: 2 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    } else {
      await accountPage.selectShopByName(rawDataJson.shopName);
      await scheduler.clear();

      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(rawDataJson.shopName);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitDashboardActive();

      await test.step(`Mở list Products trong dashboard`, async () => {
        await dashboard.navigateToMenu("Products");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadingProduct);
        if (other.products) {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeVisible();
        } else {
          await expect(dashboard.genLoc(dashboard.xpathProductPlus)).toBeHidden();
        }
      });

      await test.step(`Mở Online store > Design`, async () => {
        await dashboard.navigateToMenu("Online Store");
        await expect(dashboard.genLoc(dashboard.xpathThemePublic)).toHaveText(other.theme_public);
      });

      await test.step(`Mở Online store > Pages`, async () => {
        await dashboard.navigateToMenu("Pages");
        await dashboard.waitForElementVisibleThenInvisible(dashboard.xpathLoadPages);
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(other.pages.length);
        for (const item of other.pages) {
          expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });

      await test.step(`Mở Online store > Navigation`, async () => {
        if (other.public_v2) {
          //Add theme v2 > public theme v2 to check menu in navigation
          theme = await new ThemeEcom(accountPage.page, domain);
          await theme.addAndPublicThemeV2(dashboard, domain);
        }

        await dashboard.navigateToMenu("Navigation");
        await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(other.menus.length);
        for (const item of other.menus) {
          await expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
        }
      });
    }
  });

  test(`@SB_OBCT_UOS_20 Check tạo shop khi import từ 1 shop trong cùng account`, async ({ conf }) => {
    const other = conf.suiteConf.clone;

    const timeStamp = Date.now();
    shopName = `${data.shop_name}-${env}-${timeStamp}`;
    domain = env === "dev" ? `${shopName}.myshopbase.net` : `${shopName}.onshopbase.com`;
    await accountPage.addNewShop(shopName);
    await test.step("Nhập thông tin tại màn Add your contact", async () => {
      await accountPage.addYourContact(data.store_country, data.location, data.contact);
      await accountPage.page.waitForLoadState("domcontentloaded");
      expect(await accountPage.isTextVisible(data.question)).toBe(true);
    });

    await test.step(`Chọn type Other`, async () => {
      await accountPage.clickElementWithLabel("li", data.business_type);
      await accountPage.selectShopToImport(other.shop_clone);
      await accountPage.clickOnBtnWithLabel("Import");
    });
    //verify shop sau khi tạo
    await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
    await accountPage.page.waitForLoadState("networkidle");
    await accountPage.page.waitForSelector(accountPage.xpathNotify);
    const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
    expect(shopDomain).toContain(shopName);
    const dashboard = new DashboardPage(accountPage.page, shopDomain);
    await dashboard.waitDashboardActive();

    await test.step(`Mở list Products trong dashboard`, async () => {
      await dashboard.navigateToMenu("Products");
      await expect(dashboard.genLoc("div.product-name")).toHaveCount(other.product.length);
    });

    await test.step(`Mở Online store > Design`, async () => {
      await dashboard.navigateToMenu("Online Store");
      await expect(dashboard.genLoc("div.page-designs__current>>nth=0")).toHaveText(other.theme_public);
      await expect(dashboard.genLoc("div.page-designs__current>>nth=1")).toHaveText(other.theme_unpublic);
    });

    await test.step(`Mở Online store > Pages`, async () => {
      await dashboard.navigateToMenu("Pages");
      await dashboard.reloadUntilElementExisted(dashboard.xpathPages);
      await expect(dashboard.genLoc(dashboard.xpathPages)).toHaveCount(other.pages.length);
      for (const item of other.pages) {
        await expect(dashboard.genLoc(dashboard.xpathPages)).toHaveText(item);
      }
    });

    await test.step(`Mở Online store > Navigation`, async () => {
      await dashboard.navigateToMenu("Navigation");
      await expect(dashboard.genLoc(dashboard.xpathMenus)).toHaveCount(other.menus.length);
      for (const item of other.menus) {
        await expect(await dashboard.isParentTextVisible(item, dashboard.xpathMenus)).toBe(true);
      }
    });
  });
});
