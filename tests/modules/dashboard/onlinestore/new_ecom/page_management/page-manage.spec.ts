import { test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { BrowserContext, FrameLocator, expect } from "@playwright/test";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { SFProduct } from "@pages/storefront/product";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

test.describe("Page management", () => {
  let otherPage: OtherPage;
  let dashboardPage: DashboardPage;
  let webBuilder: WebBuilder;
  let accessToken: string;
  let context: BrowserContext;
  let domain: string;
  let otherPageSf: SFProduct;
  let titlePageTemplate: string;
  let pageName: string;
  let description: string;
  let pageContent: string;
  let templateName: string;
  let themePage: ThemeDashboard;
  let blockSelector: string;
  let section: number;
  let block: number;
  let blocks: Blocks;
  let frameLocator: FrameLocator;

  test.beforeEach(async ({ token, conf, browser, dashboard }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, domain);
    otherPage = new OtherPage(page, conf.suiteConf.domain);
    themePage = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    titlePageTemplate = conf.caseConf.title_page_template;
    pageName = conf.caseConf.page_name;
    description = conf.caseConf.description;
    pageContent = conf.caseConf.content;
    templateName = conf.suiteConf.template_name;
    blocks = new Blocks(dashboard, domain);
    frameLocator = blocks.frameLocator;
    otherPage.setAccessToken(accessToken);
    await dashboardPage.loginWithToken(accessToken);
    await otherPage.deleteAllPages();
  });

  test.afterEach(async () => {
    await otherPage.deleteAllPages();
  });

  test(`@SB_NEWECOM_PM_16 Verify customize page chưa apply template, đang active theme v2`, async ({
    conf,
    snapshotFixture,
    dashboard,
  }) => {
    await otherPage.createPage({ title: pageName });
    await test.step(`Vào "Online store" > Design > Click "Customize" tại Website templates`, async () => {
      await themePage.goToCustomizeThemeV3(2);
      await expect(webBuilder.page.locator(webBuilder.xpathMainWebBuilder)).toHaveCount(1);
    });

    await test.step(`Chọn Page`, async () => {
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickPageByName(pageName);
      const headerTitle = await webBuilder.page.locator(webBuilder.xpathTitlePageTemplate).textContent();
      expect(headerTitle.trim()).toEqual(titlePageTemplate);
    });

    await test.step(`Chọn template `, async () => {
      await webBuilder.searchAndApplyPageTemplate(templateName);
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathTitlePagePreview(templateName))).toHaveCount(1);
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.selectMainPage,
        snapshotName: `${conf.caseName}-${process.env.ENV}-${conf.caseConf.main_snapshot_sf}`,
      });
    });
  });

  test(`@SB_NEWECOM_PM_14 Verify create page khi theme v2 đang active`, async ({ conf, snapshotFixture, context }) => {
    await test.step(`Vào online store > Pages > Add new page > Nhập data page > Save`, async () => {
      await otherPage.createPage({ title: pageName });
      await dashboardPage.navigateToSubMenu("Online Store", "Pages");
      await expect(dashboardPage.isTextVisible(pageName)).toBeTruthy();
    });

    await test.step(`Click "Customize"`, async () => {
      await themePage.goToCustomizeThemeV3(2);
      await expect(webBuilder.page.locator(webBuilder.xpathMainWebBuilder)).toHaveCount(1);
    });

    await test.step(`Chọn template `, async () => {
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickPageByName(pageName);
      await webBuilder.searchAndApplyPageTemplate(templateName);
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathTitlePagePreview(templateName))).toHaveCount(1);
    });

    await test.step(`Click preview on newtab`, async () => {
      await webBuilder.page.waitForLoadState("load");
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      otherPageSf = new SFProduct(newPage, domain);
      await otherPageSf.page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: newPage,
        selector: otherPageSf.selectMainSF,
        snapshotName: `${conf.caseName}-${process.env.ENV}-${conf.caseConf.main_snapshot_sf}`,
      });
    });
  });

  test(`@SB_NEWECOM_PM_22 Verify biến page title khi thực hiện customize page theme v2`, async ({
    context,
    snapshotFixture,
    conf,
  }) => {
    let paragraphId: string;
    await otherPage.createPage({ title: pageName });
    const addSection = conf.caseConf.add_section;
    await test.step(`Vào "Online store" > Design > Click "Customize" tại Website templates`, async () => {
      await themePage.goToCustomizeThemeV3(2);
      await expect(webBuilder.page.locator(webBuilder.xpathMainWebBuilder)).toHaveCount(1);
    });

    await test.step(`Chọn Pages`, async () => {
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickPageByName(pageName);
      const headerTitle = await webBuilder.getTextContent(webBuilder.xpathTitlePageTemplate);
      expect(headerTitle).toEqual(titlePageTemplate);
      await webBuilder.searchAndApplyPageTemplate(templateName);
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathTitlePagePreview(templateName))).toHaveCount(1);
    });

    await test.step(`Kéo block "Paragraph" vào page > Nhập biến page tilte > Click ra ngoài block`, async () => {
      const pageSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 2 });
      await webBuilder.clickSectionOnPage(pageSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });

      section = block = 1;
      blockSelector = webBuilder.getSelectorByIndex({ section, block });

      await blocks.clickBackLayer();
      await webBuilder.dragAndDropInWebBuilder(addSection.block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.editQuickSettingsText(conf.caseConf.insert_page_title);
      paragraphId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
      const blockParagraph = webBuilder.getElementById(paragraphId, ClickType.BLOCK);
      await blocks.clickBackLayer();
      await expect(blockParagraph).toContainText(pageName);
    });

    await test.step(`Click preview on newtab`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      otherPageSf = new SFProduct(newPage, domain);
      await otherPageSf.page.waitForLoadState("networkidle");
      await otherPageSf.page.reload();
      await snapshotFixture.verify({
        page: newPage,
        selector: otherPageSf.selectMainSF,
        snapshotName: `${conf.caseName}-${process.env.ENV}-${conf.caseConf.main_snapshot_sf}`,
      });
    });
  });

  test(`@SB_NEWECOM_PM_24 Verify biến page meta description khi thực hiện customize page theme v2`, async ({
    context,
    snapshotFixture,
    conf,
  }) => {
    let paragraphId: string;
    await otherPage.createPage({ title: pageName, search_engine_meta_description: description });
    const addSection = conf.caseConf.add_section;
    await test.step(`Vào "Online store" > Design > Click "Customize" tại Website templates`, async () => {
      await themePage.goToCustomizeThemeV3(2);
      await expect(webBuilder.page.locator(webBuilder.xpathMainWebBuilder)).toHaveCount(1);
    });

    await test.step(`Chọn Pages`, async () => {
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickPageByName(pageName);
      const headerTitle = await webBuilder.getTextContent(webBuilder.xpathTitlePageTemplate);
      expect(headerTitle).toEqual(titlePageTemplate);
      await webBuilder.searchAndApplyPageTemplate(templateName);
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathTitlePagePreview(templateName))).toHaveCount(1);
    });

    await test.step(`Kéo block Paragraph vào page > Nhập biến page description > Click ra ngoài block`, async () => {
      const pageSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 2 });
      await webBuilder.clickSectionOnPage(pageSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });

      section = block = 1;
      blockSelector = webBuilder.getSelectorByIndex({ section, block });

      await blocks.clickBackLayer();
      await webBuilder.dragAndDropInWebBuilder(addSection.block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.editQuickSettingsText(conf.caseConf.insert_page_description);
      paragraphId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
      const blockParagraph = webBuilder.getElementById(paragraphId, ClickType.BLOCK);
      await blocks.clickBackLayer();
      await expect(blockParagraph).toContainText(description);
    });

    await test.step(`Click preview on newtab`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      otherPageSf = new SFProduct(newPage, domain);
      await otherPageSf.page.waitForLoadState("networkidle");
      await otherPageSf.page.reload();
      await snapshotFixture.verify({
        page: newPage,
        selector: otherPageSf.selectMainSF,
        snapshotName: `${conf.caseName}-${process.env.ENV}-${conf.caseConf.main_snapshot_sf}`,
      });
    });
  });

  test(`@SB_NEWECOM_PM_19 Verify các page được tạo ra ở theme v2 nhưng chưa apply template khi user active theme v3 thay v2`, async ({
    conf,
  }) => {
    await otherPage.createPage({ title: conf.caseConf.privacy_policy.page_name });
    await otherPage.createPage({
      title: conf.caseConf.contact_us.page_name,
      template: conf.caseConf.contact_us.template,
    });
    await otherPage.createPage({
      title: conf.caseConf.all_reviews.page_name,
      template: conf.caseConf.all_reviews.template,
    });

    await test.step(`Vào "Online store" > Design > Public theme v3 > Pages > Chọn page > View`, async () => {
      await themePage.goToCustomizeThemeV3(2);
      await expect(webBuilder.page.locator(webBuilder.xpathMainWebBuilder)).toHaveCount(1);
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickPageByName(conf.caseConf.privacy_policy.page_name);
      const headerTitle = await webBuilder.getTextContent(webBuilder.xpathTitlePageTemplate);
      expect(headerTitle).toEqual(titlePageTemplate);
      const tag = await webBuilder.page.locator(webBuilder.xpathSelectedTagOnPageTemplate);
      await expect(tag).toHaveCount(0);
    });

    await test.step(`Quay lại màn page list > Chọn page > View`, async () => {
      await webBuilder.closePageTemplate();
      await webBuilder.clickPageByName(conf.caseConf.contact_us.page_name);
      const tag = await webBuilder.getTextContent(webBuilder.xpathSelectedTagOnPageTemplate);
      await expect(tag).toEqual(conf.caseConf.contact_us.tag);
    });

    await test.step(`Quay lại màn page list > Chọn page > View`, async () => {
      await webBuilder.closePageTemplate();
      await webBuilder.clickPageByName(conf.caseConf.all_reviews.page_name);
      const tag = await webBuilder.getTextContent(webBuilder.xpathSelectedTagOnPageTemplate);
      await expect(tag).toEqual(conf.caseConf.all_reviews.tag);
    });
  });

  test(`@SB_NEWECOM_PM_23 Verify biến page content khi thực hiện customize page theme v2`, async ({
    context,
    snapshotFixture,
    conf,
  }) => {
    let paragraphId: string;
    await otherPage.createPage({ title: pageName, body_html: conf.caseConf.content });
    const addSection = conf.caseConf.add_section;
    await test.step(`Vào "Online store" > Design > Click "Customize" tại Website templates`, async () => {
      await themePage.goToCustomizeThemeV3(2);
      await expect(webBuilder.page.locator(webBuilder.xpathMainWebBuilder)).toHaveCount(1);
    });

    await test.step(`Chọn Pages`, async () => {
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickPageByName(pageName);
      const headerTitle = await webBuilder.getTextContent(webBuilder.xpathTitlePageTemplate);
      expect(headerTitle).toEqual(titlePageTemplate);
      await webBuilder.searchAndApplyPageTemplate(templateName);
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathTitlePagePreview(templateName))).toHaveCount(1);
    });

    await test.step(`Kéo block "HTML code" vào page > Nhập biến page content > Click ra ngoài block`, async () => {
      const pageSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 2 });
      await webBuilder.clickSectionOnPage(pageSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });

      section = block = 1;
      blockSelector = webBuilder.getSelectorByIndex({ section, block });

      await blocks.clickBackLayer();
      await webBuilder.dragAndDropInWebBuilder(addSection.block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await webBuilder.switchToTab("Content");
      await webBuilder.inputContentToBlockHtm("Get content from page", "Page content");
      paragraphId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
      const blockParagraph = webBuilder.getElementById(paragraphId, ClickType.BLOCK);
      await blocks.clickBackLayer();
      await expect(blockParagraph).toContainText(pageContent);
    });

    await test.step(`Click preview on newtab`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      otherPageSf = new SFProduct(newPage, domain);
      await otherPageSf.page.waitForLoadState("networkidle");
      await otherPageSf.page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: newPage,
        selector: otherPageSf.selectMainSF,
        snapshotName: `${conf.caseName}-${process.env.ENV}-${conf.caseConf.main_snapshot_sf}`,
      });
    });
  });

  test(`@SB_NEWECOM_PM_13 Check hiển thị page detail khi switch theme v2>v3 và từ v3>v2`, async ({
    conf,
    dashboard,
  }) => {
    let pageContent: string;
    await otherPage.createPage({ title: pageName, body_html: conf.caseConf.content });

    await test.step(`Website > Themes - Add theme Criadora mới- Publish theme này- Tạo 1 page "New Criadora"`, async () => {
      await themePage.publishTheme(1);
      expect(await themePage.isTextVisible(conf.caseConf.message)).toBeTruthy();
    });

    await test.step(`- Website > Pages- Mở detail Page old`, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Pages");
      otherPage = new OtherPage(dashboard, conf.suiteConf.domain);
      await otherPage.searchAndViewDetailPage(pageName);
      pageContent = await otherPage.getPageContent();
      await expect(pageContent).toEqual(conf.caseConf.content);
    });

    await test.step(`Website > Themes Publish lại theme Inside v2Mở detail page "New Criadora"`, async () => {
      await themePage.publishTheme(1);
      expect(await themePage.isTextVisible(conf.caseConf.message)).toBeTruthy();
      await dashboardPage.navigateToSubMenu("Online Store", "Pages");
      await otherPage.searchAndViewDetailPage(pageName);

      await expect(async () => {
        await otherPage.page.reload();
        pageContent = await otherPage.getPageContent();
        expect(pageContent).toEqual(conf.caseConf.content);
      }).toPass();
    });
  });

  test(`@SB_NEWECOM_PM_10 Check filter page theo status`, async ({ conf, dashboard }) => {
    await otherPage.createPage({
      title: conf.caseConf.visible_page.page_name,
      publish: conf.caseConf.visible_page.publish,
    });
    await otherPage.createPage({
      title: conf.caseConf.hidden_page.page_name,
      publish: conf.caseConf.hidden_page.publish,
    });
    await test.step(`Mở Website > Pages`, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Pages");
      otherPage = new OtherPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.page.waitForSelector(otherPage.xpathPageTable);
      const numberOfPages = await otherPage.countPages();
      expect(numberOfPages).toEqual(2);
    });

    await test.step(`Chọn tab "Visible" `, async () => {
      await dashboardPage.clickElementWithLabel("p", "Visible");
      await dashboardPage.page.waitForSelector(otherPage.xpathPageTable);
      const numberOfPages = await otherPage.countPages();
      const listPage: Array<string> = [];
      for (let i = 1; i <= numberOfPages; i++) {
        listPage.push(await otherPage.getPageName(i));
      }
      expect(listPage).toContain(conf.caseConf.visible_page.page_name);
    });

    await test.step(`Chọn tab "Hidden"`, async () => {
      await dashboardPage.clickElementWithLabel("p", "Hidden");
      await dashboardPage.page.waitForSelector(otherPage.xpathPageTable);
      const numberOfPages = await otherPage.countPages();
      const listPage: Array<string> = [];
      for (let i = 1; i <= numberOfPages; i++) {
        listPage.push(await otherPage.getPageName(i));
      }
      expect(listPage).toContain(conf.caseConf.hidden_page.page_name);
    });
  });
});
