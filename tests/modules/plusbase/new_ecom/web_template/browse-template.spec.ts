import { expect, test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { TemplateStorePage } from "@sf_pages/template_store";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { SFHome } from "@pages/storefront/homepage";

let templateStore: TemplateStorePage;
let dashboardPage: DashboardPage;
let themePage: ThemeEcom;
let otherPage: OtherPage;
let titlePageTemplate: string;
let shopDomain: string;
let snapshotOptions;
let templateName: string;

test.describe("Verify template store", () => {
  const trustBadge =
    "(//div[@id='wb-main']//section[contains(@class,'section relative wb-builder__section--container')])[1]";
  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    titlePageTemplate = conf.caseConf.title_page_template;
    shopDomain = conf.suiteConf.domain;
    snapshotOptions = conf.suiteConf.snapshot_options;
  });

  test.afterEach(async ({ page, conf, token }) => {
    await page.goto(`https://${shopDomain}/admin`);
    dashboardPage = new DashboardPage(page, shopDomain);

    // clean themes
    themePage = new ThemeEcom(page, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    await themePage.deleteAllThemesUnPublish(shopToken);
  });

  test(`@SB_NEWECOM_TS_62 [PLB] Verify user add theme template trong màn manage theme`, async ({
    conf,
    snapshotFixture,
    token,
    page,
  }) => {
    await test.step(`Click Browse templates `, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Design");
      await dashboardPage.clickElementWithLabel("span", "Browse templates");
      await dashboardPage.page.waitForLoadState("networkidle");
      templateStore = new TemplateStorePage(dashboardPage.page);
      const headerTitle = await templateStore.getTextContent(templateStore.xpathTitleWebsiteTemplate);
      expect(headerTitle).toEqual(titlePageTemplate);
    });

    await test.step(`Hover vào template > Click Apply `, async () => {
      templateName = await templateStore.getTemplateNameByIndex(1);
      await templateStore.applyTemplateByIndex(1);
      await expect(templateStore.page.locator(templateStore.xpathPopupReplaceFooter)).toBeVisible();
    });

    await test.step(`Click Apply`, async () => {
      await templateStore.page.locator(templateStore.xpathApplyBtnOnReplaceFooterModal).click();
      await templateStore.page.waitForLoadState("networkidle");
      dashboardPage = new DashboardPage(templateStore.page, shopDomain);
      expect(dashboardPage.page.url()).toContain("/admin/themes");
    });

    await test.step(`Verify theme vừa được add`, async () => {
      themePage = new ThemeEcom(dashboardPage.page);
      const addedTheme = (await themePage.getListThemeUnpublished())[0];
      expect(addedTheme.name).toEqual(templateName);
      expect(addedTheme.justAdded).toBe(true);
    });

    await test.step(`Public theme vừa add > Verify theme ở storefront`, async () => {
      // Do template trên dev chứa nhiều page rác nên cần clean trước khi verify list pages
      const { access_token: shopToken } = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      if (process.env.ENV === "dev") {
        otherPage = new OtherPage(page, conf.suiteConf.domain);
        otherPage.setAccessToken(shopToken);
        await otherPage.deleteAllPages();
      }
      await themePage.publishTheme(templateName);
      const sfPage = await themePage.clickViewStore();
      const sfHome = new SFHome(sfPage, shopDomain);
      await sfHome.page.reload();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage,
        selector: trustBadge,
        snapshotName: `${conf.caseName}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Click Online stores > Pages > Verify list page`, async () => {
      otherPage = new OtherPage(themePage.page, shopDomain);
      await otherPage.goToUrlPath();
      const listPages = await otherPage.getAllPagesDisplayed();
      const listExpectedPages = conf.suiteConf.pages;

      let valid = true;
      listExpectedPages.forEach(addedPage => {
        valid &&= !!listPages.find(
          page =>
            page.title === addedPage.title &&
            page.handle === `/pages/${addedPage.handle}${addedPage.duplicated ? "-1" : ""}`,
          snapshotOptions,
        );
      });
      expect(valid).toEqual(true);
    });
  });
});
