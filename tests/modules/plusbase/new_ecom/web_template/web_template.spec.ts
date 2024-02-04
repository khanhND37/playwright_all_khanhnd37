import { expect, test } from "@fixtures/website_builder";
import { AccountPage } from "@pages/dashboard/accounts";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { TemplateStorePage } from "@sf_pages/template_store";
import type { TestInfo } from "@playwright/test";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { SFHome } from "@pages/storefront/homepage";

let templateStore: TemplateStorePage;
let dashboardPage: DashboardPage;
let accountPage: AccountPage;
let themePage: ThemeEcom;
let webBuilder: WebBuilder;
let otherPage: OtherPage;
let snapshotOptions;
let templateName: string;

const scrName = (testInfo: TestInfo, fileName: string): string => {
  return `${process.env.ENV}-${testInfo.title.split(" ")[0].substring(1)}-${fileName}`;
};

test.describe("Verify template store", () => {
  const trustBadge =
    "(//div[@id='wb-main']//section[contains(@class,'section relative wb-builder__section--container')])[1]";
  test.beforeAll(async ({ conf }) => {
    snapshotOptions = conf.suiteConf.snapshot_options;
  });

  test.afterEach(async ({ page, conf, token }) => {
    await page.goto(`https://${conf.suiteConf.shop.domain}/admin`);
    dashboardPage = new DashboardPage(page, conf.suiteConf.shop.domain);

    // clean themes
    themePage = new ThemeEcom(page, conf.suiteConf.shop.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.shop.domain,
      username: conf.suiteConf.shop.email,
      password: conf.suiteConf.shop.password,
    });
    await themePage.deleteAllThemesUnPublish(shopToken);

    // clean pages
    otherPage = new OtherPage(page, conf.suiteConf.shop.domain);
    otherPage.setAccessToken(shopToken);
    await otherPage.deleteAllPages();
  });

  test(`@SB_NEWECOM_TS_59 [PLB]Verify user add theme template từ website template, user đã login, chọn shop có sẵn có ít hơn 20 theme`, async ({
    page,
    conf,
    snapshotFixture,
    token,
  }, testInfo) => {
    await test.step(`Search theme template > Click theme template > Click Add Template`, async () => {
      dashboardPage = new DashboardPage(page, conf.suiteConf.shop.domain);
      await dashboardPage.login({
        email: conf.suiteConf.shop.email,
        password: conf.suiteConf.shop.password,
      });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathInAppNoti);
      await page.goto(conf.suiteConf.store_link);
      templateStore = new TemplateStorePage(page);
      templateName = await templateStore.getTemplateNameByIndex(1);
      await templateStore.applyTemplateByIndex(1);
      await templateStore.page.waitForSelector(templateStore.xpathPopupAddTemplate);
      const addTemplatePopup = await templateStore.page.locator(templateStore.xpathPopupAddTemplate).count();
      expect(addTemplatePopup).toEqual(1);
    });

    await test.step(`Select shop `, async () => {
      await templateStore.addStore(conf.suiteConf.shop.domain);
      themePage = new ThemeEcom(page);
      const addedTheme = (await themePage.getListThemeUnpublished())[0];
      expect(addedTheme.name).toEqual(templateName);
      expect(addedTheme.justAdded).toBe(true);
      const alert = await themePage.page.locator(themePage.messageCopyTheme).innerText();
      expect(alert).toContain(`${templateName} was added to your store`);
    });

    await test.step(`Close alert`, async () => {
      await themePage.closeSbAlert();
      expect(await themePage.page.locator(themePage.messageCopyTheme).count()).toEqual(0);
    });

    await test.step(`Verify theme vừa được add`, async () => {
      await themePage.page.locator(themePage.getXpathCustomizeTheme(templateName, 1, false)).click();

      await themePage.page.waitForURL(new RegExp(".*/builder/.*"));
      webBuilder = new WebBuilder(themePage.page);
      await webBuilder.waitForElementVisibleThenInvisible(".w-builder__loading-screen");
      await webBuilder.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithIframe({
        page: page,
        iframe: webBuilder.iframe,
        selector: "html",
        snapshotName: scrName(testInfo, conf.suiteConf.screenshot.preview_wb),
        snapshotOptions,
      });
    });

    await test.step(`Public theme vừa add > Verify theme ở storefront`, async () => {
      themePage = new ThemeEcom(page, conf.suiteConf.shop.domain);
      // Do template trên dev chứa nhiều page rác nên cần clean trước khi verify list pages
      const { access_token: shopToken } = await token.getWithCredentials({
        domain: conf.suiteConf.shop.domain,
        username: conf.suiteConf.shop.email,
        password: conf.suiteConf.shop.password,
      });
      if (process.env.ENV === "dev") {
        otherPage = new OtherPage(page, conf.suiteConf.shop.domain);
        otherPage.setAccessToken(shopToken);
        await otherPage.deleteAllPages();
      }
      await webBuilder.clickOnBtnWithLabel("Exit");
      await webBuilder.page.waitForLoadState("networkidle");
      await themePage.publishTheme(templateName);
      const sfPage = await themePage.clickViewStore();
      const sfHome = new SFHome(sfPage, conf.suiteConf.shop.domain);
      await sfHome.page.reload();
      await sfHome.page.waitForResponse(/theme.css/, { timeout: 30_000 });
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage,
        selector: trustBadge,
        snapshotName: scrName(testInfo, conf.suiteConf.screenshot.published_sf),
      });
    });

    await test.step(`Click Online stores > Pages > Verify list page`, async () => {
      otherPage = new OtherPage(themePage.page, conf.suiteConf.shop.domain);
      await otherPage.goToUrlPath();
      const listPages = await otherPage.getAllPagesDisplayed();
      const listExpectedPages = conf.suiteConf.pages;

      let valid = true;
      listExpectedPages.forEach(addedPage => {
        valid &&= !!listPages.find(
          page =>
            page.title === addedPage.title &&
            page.handle === `/pages/${addedPage.handle}${addedPage.duplicated ? "-1" : ""}`,
        );
      });
      expect(valid).toEqual(true);
    });
  });

  test(`@SB_NEWECOM_TS_60 [PLB] Verify user add theme template từ website template, user đã login, chọn shop có sẵn đã có 20 theme`, async ({
    page,
    conf,
  }) => {
    await test.step(`Search theme template > Click theme template > Click Add Template`, async () => {
      dashboardPage = new DashboardPage(page, conf.suiteConf.shop_limit.domain);
      await dashboardPage.login({
        email: conf.suiteConf.shop_limit.email,
        password: conf.suiteConf.shop_limit.password,
      });
      await dashboardPage.page.waitForLoadState("networkidle");
      await page.goto(conf.suiteConf.store_link);
      templateStore = new TemplateStorePage(page);
      await templateStore.applyTemplateByIndex(1);
      await templateStore.page.waitForSelector(templateStore.xpathPopupAddTemplate);
      const addTemplatePopup = await templateStore.page.locator(templateStore.xpathPopupAddTemplate).count();
      expect(addTemplatePopup).toEqual(1);
    });

    await test.step(`Select shop `, async () => {
      await templateStore.addStore(conf.suiteConf.shop_limit.domain);
      //API add template fail sẽ trả status code = 400, fix theo comment của dev https://trello.com/c/ZnRgK6UA
      const response = await page.waitForResponse(
        response =>
          response.url().includes(`https://${conf.suiteConf.shop_limit.domain}/admin/themes/builder/theme/add.json`) &&
          response.status() === 400,
      );
      expect((await response.body()).toString()).toContain(
        "Your online store has a maximum of 20 themes. Remove unused themes to add more.",
      );
    });

    await test.step(`Click Online store > Design`, async () => {
      await templateStore.page.goto(`https://${conf.suiteConf.shop_limit.domain}/admin`);
      themePage = new ThemeEcom(page);
      await dashboardPage.navigateToSubMenu("Online Store", "Design");
      await dashboardPage.page.waitForLoadState("load");

      const alert = await themePage.page.locator(themePage.messageCopyTheme).innerText();
      expect(alert).toContain("Template limit reached");
    });

    await test.step(`Click Browse theme > Hover vào theme bất kì`, async () => {
      await themePage.clickBtnByName("Browse templates");
      await themePage.page.waitForSelector(themePage.templateItem);
      const applyBtn = themePage.page
        .locator(themePage.templateItem)
        .first()
        .locator("button", { hasText: "Apply" })
        .first();
      await expect(applyBtn).toHaveAttribute("disabled", "disabled");
    });

    await test.step(`Click Online stores > Pages > Verify list page`, async () => {
      otherPage = new OtherPage(themePage.page, conf.suiteConf.shop_limit.domain);
      await otherPage.goToUrlPath();
      const listPages = await otherPage.getAllPagesDisplayed();
      expect(listPages.length).toEqual(conf.suiteConf.total_page);
    });
  });

  test(`@SB_NEWECOM_TS_63 [PLB] Verify user add theme template từ website template, user đã login ngoài website template, chọn shop có sẵn có ít hơn 20 theme`, async ({
    page,
    conf,
    snapshotFixture,
    token,
  }, testInfo) => {
    await test.step(`Search theme template > Click theme template > Click Add Template`, async () => {
      dashboardPage = new DashboardPage(page, conf.suiteConf.shop.domain);
      await dashboardPage.login({
        email: conf.suiteConf.shop.email,
        password: conf.suiteConf.shop.password,
      });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathInAppNoti);
      await dashboardPage.page.waitForLoadState("networkidle");
      await page.goto(conf.suiteConf.store_link);
      templateStore = new TemplateStorePage(page);
      await templateStore.clickOnTextLinkWithLabel("Login");

      await templateStore.page.waitForLoadState("networkidle");
      templateName = await templateStore.getTemplateNameByIndex(1);
      await templateStore.applyTemplateByIndex(1);
      await templateStore.page.waitForSelector(templateStore.xpathPopupAddTemplate);
      const addTemplatePopup = await templateStore.page.locator(templateStore.xpathPopupAddTemplate).count();
      expect(addTemplatePopup).toEqual(1);
    });

    await test.step(`Click Choose a Store > Search store > Select store > Click Add to my store`, async () => {
      await templateStore.addStore(conf.suiteConf.shop.domain);
      themePage = new ThemeEcom(templateStore.page, conf.suiteConf.shop.domain);
      const addedTheme = (await themePage.getListThemeUnpublished())[0];
      expect(addedTheme.name).toEqual(templateName);
      expect(addedTheme.justAdded).toBe(true);
      const alert = await themePage.page.locator(themePage.messageCopyTheme).innerText();
      expect(alert).toContain(`${templateName} was added to your store`);
    });

    await test.step(`Verify theme vừa được add`, async () => {
      await themePage.page.locator(themePage.getXpathCustomizeTheme(templateName, 1, false)).click();
      await themePage.page.waitForURL(new RegExp(".*/builder/.*"));
      webBuilder = new WebBuilder(themePage.page);
      await webBuilder.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithIframe({
        page: page,
        iframe: webBuilder.iframe,
        selector: "html",
        snapshotName: scrName(testInfo, conf.suiteConf.screenshot.preview_wb),
        snapshotOptions,
      });
    });

    await test.step(`Public theme vừa add > Verify theme ở storefront`, async () => {
      const { access_token: shopToken } = await token.getWithCredentials({
        domain: conf.suiteConf.shop.domain,
        username: conf.suiteConf.shop.email,
        password: conf.suiteConf.shop.password,
      });
      // Do template trên dev chứa nhiều page rác nên cần clean trước khi verify list pages
      if (process.env.ENV === "dev") {
        otherPage = new OtherPage(page, conf.suiteConf.shop.domain);
        otherPage.setAccessToken(shopToken);
        await otherPage.deleteAllPages();
      }
      await webBuilder.clickOnBtnWithLabel("Exit");
      await themePage.publishTheme(templateName);
      const sfPage = await themePage.clickViewStore();
      const sfHome = new SFHome(sfPage, conf.suiteConf.shop.domain);
      await sfHome.page.reload();
      await sfHome.page.waitForResponse(/theme.css/, { timeout: 30_000 });
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage,
        selector: trustBadge,
        snapshotName: scrName(testInfo, conf.suiteConf.screenshot.published_sf),
      });
    });

    await test.step(`Click Online stores > Pages > Verify list page`, async () => {
      otherPage = new OtherPage(themePage.page, conf.suiteConf.shop.domain);
      await otherPage.navigateToSubMenu("Online Store", "Pages");
      const listPages = await otherPage.getAllPagesDisplayed();
      const listExpectedPages = conf.suiteConf.pages;

      let valid = true;
      listExpectedPages.forEach(addedPage => {
        valid &&= !!listPages.find(
          page =>
            page.title === addedPage.title &&
            page.handle === `/pages/${addedPage.handle}${addedPage.duplicated ? "-1" : ""}`,
        );
      });
      expect(valid).toEqual(true);
    });
  });

  test(`@SB_NEWECOM_TS_66 [PLB] Verify user add theme template từ website template khi đã có tài khoản, chưa login, chọn shop có sẵn có ít hơn 20 theme`, async ({
    page,
    conf,
    snapshotFixture,
    token,
  }, testInfo) => {
    await test.step(`Search theme template > Click theme template > Click Add Template`, async () => {
      await page.goto(conf.suiteConf.store_link);
      templateStore = new TemplateStorePage(page);
      templateName = await templateStore.getTemplateNameByIndex(1);
      await templateStore.applyTemplateByIndex(1);
      await templateStore.page.waitForLoadState("networkidle");
      expect(templateStore.page.url()).toContain("/sign-in");
    });

    await test.step(`Fill account > click Login`, async () => {
      accountPage = new AccountPage(page, conf.suiteConf.shop.domain);
      await accountPage.login({
        email: conf.suiteConf.shop.email,
        password: conf.suiteConf.shop.password,
        redirectToAdmin: false,
      });
      await templateStore.page.waitForLoadState("networkidle");
      const addTemplatePopup = await templateStore.page.locator(templateStore.xpathPopupAddTemplate).count();
      expect(addTemplatePopup).toEqual(1);
    });

    await test.step(`Select shop `, async () => {
      await templateStore.addStore(conf.suiteConf.shop.domain);
      themePage = new ThemeEcom(page);
      const addedTheme = (await themePage.getListThemeUnpublished())[0];
      expect(addedTheme.name).toEqual(templateName);
      expect(addedTheme.justAdded).toBe(true);

      const alert = await themePage.page.locator(themePage.messageCopyTheme).innerText();
      expect(alert).toContain(`${templateName} was added to your store`);
    });

    await test.step(`Close alert`, async () => {
      await themePage.closeSbAlert();
      expect(await themePage.page.locator(themePage.messageCopyTheme).count()).toEqual(0);
    });

    await test.step(`Verify theme vừa được add`, async () => {
      await themePage.page.locator(themePage.getXpathCustomizeTheme(templateName, 1, false)).click();
      await themePage.page.waitForURL(new RegExp(".*/builder/.*"));
      webBuilder = new WebBuilder(themePage.page);
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await webBuilder.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithIframe({
        page: page,
        iframe: webBuilder.iframe,
        selector: "html",
        snapshotName: scrName(testInfo, conf.suiteConf.screenshot.preview_wb),
        snapshotOptions,
      });
    });

    await test.step(`Public theme vừa add > Verify theme ở storefront`, async () => {
      // Do template trên dev chứa nhiều page rác nên cần clean trước khi verify list pages
      const { access_token: shopToken } = await token.getWithCredentials({
        domain: conf.suiteConf.shop.domain,
        username: conf.suiteConf.shop.email,
        password: conf.suiteConf.shop.password,
      });
      if (process.env.ENV === "dev") {
        otherPage = new OtherPage(page, conf.suiteConf.shop.domain);
        otherPage.setAccessToken(shopToken);
        await otherPage.deleteAllPages();
      }
      await webBuilder.clickOnBtnWithLabel("Exit");
      await themePage.publishTheme(templateName);
      const sfPage = await themePage.clickViewStore();
      const sfHome = new SFHome(sfPage, conf.suiteConf.shop.domain);
      await sfHome.page.reload();
      await sfHome.page.waitForResponse(/theme.css/, { timeout: 30_000 });

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage,
        selector: trustBadge,
        snapshotName: scrName(testInfo, conf.suiteConf.screenshot.published_sf),
      });
    });

    await test.step(`Click Online stores > Pages > Verify list page`, async () => {
      otherPage = new OtherPage(themePage.page, conf.suiteConf.shop.domain);
      await otherPage.goToUrlPath();
      const listPages = await otherPage.getAllPagesDisplayed();
      const listExpectedPages = conf.suiteConf.pages;

      let valid = true;
      listExpectedPages.forEach(addedPage => {
        valid &&= !!listPages.find(
          page =>
            page.title === addedPage.title &&
            page.handle === `/pages/${addedPage.handle}${addedPage.duplicated ? "-1" : ""}`,
        );
      });
      expect(valid).toEqual(true);
    });
  });

  test(`@SB_NEWECOM_TS_67 [PLB] Verify user add theme template từ website template khi đã có tài khoản, chưa login, chọn shop đã có 20 theme`, async ({
    page,
    conf,
  }) => {
    await test.step(`Search Template > Click Template> Click Add Template`, async () => {
      await page.goto(conf.suiteConf.store_link);
      templateStore = new TemplateStorePage(page);

      await templateStore.applyTemplateByIndex(1);
      await templateStore.page.waitForLoadState("networkidle");
      expect(templateStore.page.url()).toContain("/sign-in");
    });

    await test.step(`Fill account > click Login`, async () => {
      accountPage = new AccountPage(page, conf.suiteConf.shop_limit.domain);
      await accountPage.login({
        email: conf.suiteConf.shop_limit.email,
        password: conf.suiteConf.shop_limit.password,
        redirectToAdmin: false,
      });
      await templateStore.page.waitForLoadState("networkidle");
      const addTemplatePopup = await templateStore.page.locator(templateStore.xpathPopupAddTemplate).count();
      expect(addTemplatePopup).toEqual(1);
    });

    await test.step(`Select shop `, async () => {
      await templateStore.addStore(conf.suiteConf.shop_limit.domain);
      //API add template fail sẽ trả status code = 400, fix theo comment của dev https://trello.com/c/ZnRgK6UA
      const response = await page.waitForResponse(
        response =>
          response.url().includes(`https://${conf.suiteConf.shop_limit.domain}/admin/themes/builder/theme/add.json`) &&
          response.status() === 400,
      );
      expect((await response.body()).toString()).toContain(
        "Your online store has a maximum of 20 themes. Remove unused themes to add more.",
      );
    });

    await test.step(`Click Online store > Design`, async () => {
      await templateStore.page.goto(`https://${conf.suiteConf.shop_limit.domain}/admin`);
      themePage = new ThemeEcom(page);
      dashboardPage = new DashboardPage(page, conf.suiteConf.shop_limit.domain);
      await dashboardPage.page.waitForURL(new RegExp(".*/admin/.*"));
      await dashboardPage.navigateToSubMenu("Online Store", "Design");
      await dashboardPage.page.waitForLoadState("load");

      const alert = await themePage.page.locator(themePage.messageCopyTheme).innerText();
      expect(alert).toContain("Template limit reached");
    });

    await test.step(`Click Browse theme > Hover vào theme bất kì`, async () => {
      await themePage.clickBtnByName("Browse templates");
      await themePage.page.waitForSelector(themePage.templateItem);
      const applyBtn = themePage.page
        .locator(themePage.templateItem)
        .first()
        .locator("button", { hasText: "Apply" })
        .first();
      await expect(applyBtn).toHaveAttribute("disabled", "disabled");
    });

    await test.step(`Click Online stores > Pages > Verify list page`, async () => {
      otherPage = new OtherPage(themePage.page, conf.suiteConf.shop_limit.domain);
      await otherPage.goToUrlPath();
      const listPages = await otherPage.getAllPagesDisplayed();
      expect(listPages.length).toEqual(conf.suiteConf.total_page);
    });
  });
});
