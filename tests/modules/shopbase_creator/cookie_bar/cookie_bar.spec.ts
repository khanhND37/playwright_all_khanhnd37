import { test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { WebsiteSetting } from "@pages/dashboard/website_setting";
import { XpathNavigationButtons } from "@constants/web_builder";
import { Browser, BrowserContext, chromium, expect, Page } from "@playwright/test";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SFHome } from "@sf_pages/homepage";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

test.describe("Verify cookie bar", () => {
  let suiteConf,
    webBuilder: WebBuilder,
    stylingSetting: WebPageStyle,
    webSetting: WebsiteSetting,
    xpathBlock: Blocks,
    sfPage: Page,
    themeId: number,
    themes: ThemeEcom,
    accessToken: string,
    response;

  test.beforeEach(async ({ dashboard, theme, conf, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    suiteConf = conf.suiteConf;
    response = await theme.applyTemplate(suiteConf.template_id);
    themeId = response.id;
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: suiteConf.domain,
      username: suiteConf.username,
      password: suiteConf.password,
    });
    accessToken = shopToken;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    webSetting = new WebsiteSetting(dashboard, suiteConf.domain);
    xpathBlock = new Blocks(dashboard, suiteConf.domain);
    stylingSetting = new WebPageStyle(dashboard, suiteConf.domain);

    await theme.publish(response.id);
    await themes.deleteAllThemesUnPublish(accessToken);
    await webBuilder.openWebBuilder({ type: "site", id: themeId });
    await webBuilder.loadingScreen.waitFor({ state: "hidden" });

    await dashboard.locator(XpathNavigationButtons["website"]).click();
    await webSetting.clickSettingCategory(suiteConf.cookie_title);
  });

  test(`@SB_NEWECOM_CB_25 Check UI + data default của setting cookie banner trong web builder`, async ({
    page,
    conf,
  }) => {
    await test.step(`Click Cookies banner setting`, async () => {
      await expect(webBuilder.settingListTitle).toBeVisible();
      await expect(webBuilder.settingListTitle).toHaveText(suiteConf.cookie_title);
      const toggleValue = await webBuilder.getToggleValue("enable_cookie_bar");
      expect(toggleValue).toEqual("false");
    });

    await test.step(`Hover vào icon chú thích cạnh text "Enable cookies banner"`, async () => {
      await webBuilder.hoverInfoIconByLabel("enable_cookie_bar");
      const actualTooltip = await webBuilder.genLoc(webBuilder.xpathVisibleTooltip);
      await expect(actualTooltip).toHaveText(conf.caseConf.expect_tooltip);
    });

    await test.step(`Check show cookies banner ngoài SF`, async () => {
      await page.goto(`https://${suiteConf.domain}`);
      await expect(page.locator(webBuilder.xpathCookieBar)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_CB_26 Check click button back trong cookies banner setting`, async ({}) => {
    await test.step(`Click Cookies banner setting`, async () => {
      await expect(webBuilder.settingListTitle).toBeVisible();
      await expect(webBuilder.settingListTitle).toHaveText(suiteConf.cookie_title);
      const toggleValue = await webBuilder.getToggleValue("enable_cookie_bar");
      expect(toggleValue).toEqual("false");
    });

    await test.step(`Click button back trên thanh bar`, async () => {
      await webBuilder.backBtn.click();
      await expect(webBuilder.webSettingTitle).toBeVisible();
      await expect(webBuilder.webSettingTitle).toHaveText(suiteConf.web_setting_title);
    });

    await test.step(`Click lại vào cookies banner setting`, async () => {
      await webSetting.clickSettingCategory(suiteConf.cookie_title);
      await expect(webBuilder.settingListTitle).toBeVisible();
      await expect(webBuilder.settingListTitle).toHaveText(suiteConf.cookie_title);
      const toggleValue = await webBuilder.getToggleValue("enable_cookie_bar");
      expect(toggleValue).toEqual("false");
    });
  });

  test(`@SB_NEWECOM_CB_27 Check Enable cookies banner = ON với data default`, async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    let newBrowser: Browser, newContext: BrowserContext;
    await test.step(`Setting Enable cookies banner = ON`, async () => {
      await context.clearCookies();
      await webBuilder.switchToggle("enable_cookie_bar", true);
      await dashboard.waitForSelector(webBuilder.xpathInputHelpText);
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: conf.caseConf.screenshot_sidebar,
      });
      await webBuilder.frameLocator.locator(webBuilder.xpathCookieBar).waitFor();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: webBuilder.xpathCookieBar,
        iframe: webBuilder.iframe,
        snapshotName: conf.caseConf.screenshot_preview,
      });
    });

    await test.step(`Click vào link Learn more trên sidebar`, async () => {
      const redirectPage = await verifyRedirectUrl({
        page: dashboard,
        context: context,
        selector: webBuilder.xpathInputHelpTextLearnMore,
        redirectUrl: `https://${suiteConf.domain}/pages/${conf.caseConf.redirect_path}`,
      });

      await redirectPage.close();
    });

    await test.step(`Hover vào icon chú thích cạnh text "Action"`, async () => {
      await webBuilder.hoverInfoIconByLabel("link");
      const actualTooltip = await webBuilder.genLoc(webBuilder.xpathVisibleTooltip);
      await expect(actualTooltip).toHaveText(conf.caseConf.action_tooltip);
    });

    await test.step(`Click vào link Learn more about cookie banner trên sidebar`, async () => {
      const redirectPage = await verifyRedirectUrl({
        page: dashboard,
        context: context,
        selector: `${webBuilder.xpathInputHelpTextLearnMore}[contains(text(),'cookie banner')]`,
        redirectUrl: `https://${suiteConf.domain}/pages/${conf.caseConf.redirect_path}`,
      });
      await redirectPage.close();
    });

    await test.step(`Hover vào icon chú thích cạnh text "Page"`, async () => {
      await webBuilder.hoverInfoIconByLabel("link", 2);
      const actualTooltip = await webBuilder.genLoc(webBuilder.xpathVisibleTooltip);
      await expect(actualTooltip).toHaveText(conf.caseConf.page_tooltip);
    });

    await test.step(`Click vào learn more/button Accept All/Accept Only Essential trên preview`, async () => {
      const expectedSrc = await dashboard.locator(webBuilder.iframe).getAttribute("src");
      await webBuilder.frameLocator
        .locator(webBuilder.xpathCookieBar)
        .locator("//span")
        .locator("//div")
        .filter({ hasText: "Learn more" })
        .click();
      await expect(
        webBuilder.frameLocator
          .locator(webBuilder.xpathCookieBar)
          .getByRole("button")
          .filter({ hasText: "Accept Essential" })
          .getAttribute("disabled"),
      ).toBeTruthy();
      await expect(
        webBuilder.frameLocator
          .locator(webBuilder.xpathCookieBar)
          .getByRole("button")
          .filter({ hasText: "Accept All" })
          .getAttribute("disabled"),
      ).toBeTruthy();
      const actualSrc = await dashboard.locator(webBuilder.iframe).getAttribute("src");
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathCookieBar)).toBeVisible();
      expect(actualSrc).toEqual(expectedSrc);
    });

    await test.step(`Save và check shop ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(webBuilder.iconPreview).first().click(),
      ]);
      sfPage = newTab;
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
      await snapshotFixture.verify({
        page: sfPage,
        selector: webBuilder.xpathCookieBar,
        snapshotName: conf.caseConf.screenshot_storefront,
      });
    });

    await test.step(`Click vào link Learn more`, async () => {
      const redirectPage = await verifyRedirectUrl({
        page: sfPage,
        context: context,
        selector: `${webBuilder.xpathCookieBar}//span//a`,
        redirectUrl: `https://${suiteConf.domain}/policies/${conf.caseConf.redirect_path}`,
      });
      await redirectPage.close();
    });

    await test.step(`ĐIều hướng tới các page khác trong shop (Checkout page, Product page,...)`, async () => {
      const pagePaths = ["/products/men-s-hollow-summer-sandals", "/collections/all", "/"];
      for (const pagePath of pagePaths) {
        await sfPage.goto(`https://${suiteConf.domain}${pagePath}`);
        await sfPage.waitForURL(`https://${suiteConf.domain}${pagePath}`);
        await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
      }
    });

    await test.step(`Reload lại page`, async () => {
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
      await sfPage.reload();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
    });

    await test.step(`Ngoài SF, Click vào button Accept Only Essential`, async () => {
      await sfPage
        .locator(webBuilder.xpathCookieBar)
        .getByRole("button")
        .filter({ hasText: "Accept Essential" })
        .click();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
    });

    await test.step(`Reload lại page`, async () => {
      await sfPage.reload();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
      await sfPage.close();
    });

    await test.step(`Close browser > Open lại browser`, async () => {
      newBrowser = await chromium.launch({});
      newContext = await newBrowser.newContext();
      sfPage = await newBrowser.newPage();
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
      await newContext.clearCookies();
    });

    await test.step(`Click vào button Accept All`, async () => {
      await sfPage.reload();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
      await sfPage.locator(webBuilder.xpathCookieBar).getByRole("button").filter({ hasText: "Accept All" }).click();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
    });

    await test.step(`Reload lại page`, async () => {
      await sfPage.reload();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
    });

    await test.step(`Close browser > Open lại browser`, async () => {
      await newBrowser.close();
      newBrowser = await chromium.launch({});
      newContext = await newBrowser.newContext();
      sfPage = await newBrowser.newPage();
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
      await newContext.clearCookies();
      await sfPage.reload();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
    });

    await test.step(`Click vào button x`, async () => {
      await sfPage.locator(webBuilder.xpathCookieBar).locator(webBuilder.xpathIconClose).click();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
    });

    await test.step(`Reload lại page`, async () => {
      await sfPage.reload();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
      await newBrowser.close();
    });
  });

  test(`@SB_NEWECOM_CB_28 Check Enable cookies banner = ON + Privacy policy URL = page khác page privacy`, async ({
    dashboard,
    context,
    conf,
  }) => {
    const caseCf = conf.caseConf;
    await test.step(`- Setting:
+ Enable cookies banner = ON
+ Page = page khác privacy (product 1)`, async () => {
      await webBuilder.switchToggle("enable_cookie_bar", true);
      await webBuilder.selectPageLink(
        webBuilder.xpathCookiePageLink,
        caseCf.product_page.page,
        caseCf.product_page.option,
      );
    });

    await test.step(`Save và check shop ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(webBuilder.iconPreview).first().click(),
      ]);
      sfPage = newTab;
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
    });

    await test.step(`Click vào link Learn`, async () => {
      const redirectPage = await verifyRedirectUrl({
        page: sfPage,
        context: context,
        selector: `${webBuilder.xpathCookieBar}//span//a`,
        redirectUrl: `https://${suiteConf.domain}/products/${caseCf.product_page.path}`,
      });
      await redirectPage.close();
      await sfPage.close();
      await webBuilder.selectPageLink(
        webBuilder.xpathCookiePageLink,
        caseCf.privacy_page.page,
        caseCf.privacy_page.option,
      );
      await webBuilder.clickSaveButton();
    });
  });

  test(`@SB_NEWECOM_CB_29 Check change ngôn ngữ trong cookies banner`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Setting: Enable cookies banner = ON`, async () => {
      await webBuilder.switchToggle("enable_cookie_bar", true);
    });

    await test.step(`Save và check shop ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(webBuilder.iconPreview).first().click(),
      ]);
      sfPage = newTab;
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await sfPage.waitForLoadState("load");
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
    });

    await test.step(`Change ngôn ngữ của shop sang French`, async () => {
      webBuilder = new WebBuilder(sfPage, suiteConf.domain);
      await sfPage.locator(webBuilder.xpathCookieBar).locator(webBuilder.xpathIconClose).click();
      await webBuilder.changeLanguageSf(conf.caseConf.french);
      await sfPage.reload();
      await sfPage.waitForSelector(webBuilder.xpathCookieBar);
      await snapshotFixture.verify({
        page: sfPage,
        selector: webBuilder.xpathCookieBar,
        snapshotName: conf.caseConf.screenshot_storefront,
      });
    });
  });

  test(`@SB_NEWECOM_CB_30 Check user đã confirm > Merchant OFF Cookies bar rồi ON lại > User vào lại shop`, async ({
    dashboard,
    context,
  }) => {
    await test.step(`Setting: Enable cookies banner = ON`, async () => {
      await webBuilder.switchToggle("enable_cookie_bar", true);
    });

    await test.step(`Save và check shop ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(webBuilder.iconPreview).first().click(),
      ]);
      sfPage = newTab;
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await sfPage.waitForLoadState("load");
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
    });

    await test.step(`Click vào button Accept Only Essential`, async () => {
      await sfPage
        .locator(webBuilder.xpathCookieBar)
        .getByRole("button")
        .filter({ hasText: "Accept Essential" })
        .click();
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
      await sfPage.close();
    });

    await test.step(`Vào web builder, click vào icon setting trên thanh bar, setting Enable cookies banner = OFF`, async () => {
      await webBuilder.switchToggle("enable_cookie_bar", false);
      await webBuilder.clickSaveButton();
      const toggleValue = await webBuilder.getToggleValue("enable_cookie_bar");
      expect(toggleValue).toEqual("false");
    });

    await test.step(`Save và check shop ngoài SF`, async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(webBuilder.iconPreview).first().click(),
      ]);
      sfPage = newTab;
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await sfPage.waitForLoadState("load");
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeHidden();
      const cookie = await sfPage.context().cookies();
      expect(cookie.length).toBeGreaterThan(0);
    });
  });

  test(`@SB_NEWECOM_CB_32 Check cookies banner dưới mobile`, async ({ snapshotFixture, pageMobile, conf }) => {
    await test.step(`Open shop với màn hình < 800px`, async () => {
      await webBuilder.switchToggle("enable_cookie_bar", true);
      await webBuilder.clickSaveButton();
    });

    await test.step(`Open shop trên mobile`, async () => {
      const homePage = new SFHome(pageMobile, conf.suiteConf.domain);
      await homePage.gotoHomePage();
      await pageMobile.waitForLoadState("networkidle");
      await pageMobile.locator(webBuilder.xpathCookieBar).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: pageMobile,
        selector: webBuilder.xpathCookieBar,
        snapshotName: conf.caseConf.screenshot_mobile,
      });
    });
  });

  test(`@SB_NEWECOM_CB_33 Check cookies banner khi thay đổi website style của button`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const settingsButton = conf.caseConf;
    await test.step(`Website setting > Button setting> Thay đổi setting của button primary + secondary trong setting website style`, async () => {
      await dashboard.locator(XpathNavigationButtons["styling"]).click();
      await stylingSetting.clickStylingType(conf.caseConf.button_title);
    });

    await test.step(`Vào lại setting cookie bar, check hiển thị cookie bar trên preview`, async () => {
      await stylingSetting.setBackgroundStyle(settingsButton.primary.background);
      await stylingSetting.setBorderStyle(settingsButton.primary.border);
      await stylingSetting.setShadowStyle(settingsButton.primary.shadow);
      await stylingSetting.selectDropdownStyleValue("Font", settingsButton.primary.font);
      await stylingSetting.setShape(settingsButton.primary.shape);
      await stylingSetting.selectDropdownStyleValue("Size", settingsButton.primary.size);
      await dashboard.locator(XpathNavigationButtons["website"]).click();
      await webSetting.clickSettingCategory(suiteConf.cookie_title);
      await webBuilder.switchToggle("enable_cookie_bar", true);
      await webBuilder.clickSaveButton();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: webBuilder.xpathCookieBar,
        iframe: webBuilder.iframe,
        snapshotName: conf.caseConf.screenshot_preview,
      });
    });

    await test.step(`Save và check shop ngoài SF`, async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(webBuilder.iconPreview).first().click(),
      ]);
      sfPage = newTab;
      await sfPage.goto(`https://${suiteConf.domain}/`);
      await sfPage.waitForLoadState("load");
      await expect(sfPage.locator(webBuilder.xpathCookieBar)).toBeVisible();
      await snapshotFixture.verify({
        page: sfPage,
        selector: webBuilder.xpathCookieBar,
        snapshotName: conf.caseConf.screenshot_setting,
      });
    });
  });
});
