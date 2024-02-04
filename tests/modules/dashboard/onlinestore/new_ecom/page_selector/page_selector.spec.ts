import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";

test.describe("Feature page selector", () => {
  let otherPage: OtherPage;
  let accessToken: string;
  let webBuilder: WebBuilder;

  test.beforeAll(async ({ token, conf }) => {
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.caseConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
  });

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    webBuilder = new WebBuilder(dashboard, conf.caseConf.domain);

    otherPage = new OtherPage(dashboard, conf.caseConf.domain);
    otherPage.setAccessToken(accessToken);
  });

  test.afterEach(async () => {
    await otherPage.deleteAllPages();
  });

  test("Check data default của Page selector khi shop type=Physical @SB_WEB_BUILDER_PS_2", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Check show data default", async () => {
      await webBuilder.openCustomizeTheme(dashboard, conf.caseConf.domain);
      await dashboard.locator(otherPage.pagePanelSelector).click();
      await dashboard.locator(otherPage.xpathPages).hover();
      await snapshotFixture.verify({
        page: dashboard,
        selector: otherPage.pagePanelContentSelector,
        snapshotName: conf.caseConf.snapshot_page_panel,
      });
    });

    await test.step("Check filter = E-commerce in page selector panel", async () => {
      await expect(dashboard.locator(otherPage.filterShopTypeSelector)).toHaveText(conf.caseConf.ecommerce_type);

      for (const listName of conf.caseConf.list_on_ecommerce_type) {
        await expect(dashboard.locator(webBuilder.collapseButtonXpath(listName))).toBeVisible();
        //collapse list
        await dashboard.locator(webBuilder.collapseButtonXpath(listName)).click();
        await expect(dashboard.locator(webBuilder.groupItemXpath(listName))).toBeHidden();
      }
    });

    await test.step("Check filter = Creator in page selector panel", async () => {
      await dashboard.locator(otherPage.filterShopTypeSelector).click();
      await dashboard.locator(".sb-select-menu li >> nth=1").click();
      await expect(dashboard.locator(otherPage.filterShopTypeSelector)).toHaveText(conf.caseConf.creator_type);

      for (const listName of conf.caseConf.list_on_creator_type) {
        await expect(dashboard.locator(webBuilder.collapseButtonXpath(listName))).toBeVisible();
        //expand list
        if (listName !== "Creator pages") {
          await dashboard.locator(webBuilder.collapseButtonXpath(listName)).click();
        }
        await expect(dashboard.locator(webBuilder.groupItemXpath(listName))).toBeVisible();
      }
    });
  });

  test("Check data default của Page selector khi shop type=Digital @SB_WEB_BUILDER_PS_3", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Check show data default", async () => {
      await webBuilder.openCustomizeTheme(dashboard, conf.caseConf.domain);
      await dashboard.locator(otherPage.pagePanelSelector).click();
      await dashboard.locator(otherPage.xpathPages).hover();
      await snapshotFixture.verify({
        page: dashboard,
        selector: otherPage.pagePanelContentSelector,
        snapshotName: conf.caseConf.snapshot_page_panel,
      });
    });

    await test.step("Check filter = Creator in page selector panel", async () => {
      await expect(dashboard.locator(otherPage.filterShopTypeSelector)).toHaveText(conf.caseConf.creator_type);

      for (const listName of conf.caseConf.list_on_creator_type) {
        await expect(dashboard.locator(webBuilder.collapseButtonXpath(listName))).toBeVisible();
        //collapse list
        await dashboard.locator(webBuilder.collapseButtonXpath(listName)).click();
        await expect(dashboard.locator(webBuilder.groupItemXpath(listName))).toBeHidden();
      }
    });

    await test.step("Check filter = E-commerce in page selector panel", async () => {
      await dashboard.locator(otherPage.filterShopTypeSelector).click();
      await dashboard.locator(".sb-select-menu li >> nth=0").click();
      await expect(dashboard.locator(otherPage.filterShopTypeSelector)).toHaveText(conf.caseConf.ecommerce_type);

      for (const listName of conf.caseConf.list_on_ecommerce_type) {
        await expect(dashboard.locator(webBuilder.collapseButtonXpath(listName))).toBeVisible();
      }
    });
  });

  test("Check hiển thị list page khi shop có >, <, = 10 Website pages @SB_WEB_BUILDER_PS_6", async ({
    conf,
    dashboard,
    builder,
  }) => {
    await test.step("Check show list page when shop have < 10 pages", async () => {
      for (let i = 0; i < conf.caseConf.add_page_less_than_10; i++) {
        //create page
        const response = await otherPage.createPage({
          title: conf.caseConf.page_title,
        });
        //assign template for page
        await builder.applyTemplate({
          productId: response.id,
          templateId: conf.caseConf.template_id,
          type: "page",
        });
      }
      await webBuilder.openCustomizeTheme(dashboard, conf.caseConf.domain);
      //check show list page on web front
      await dashboard.locator(otherPage.pagePanelSelector).click();
      await expect(dashboard.locator(otherPage.viewMoreButtonSelector)).toBeHidden();
    });

    await test.step("Check show list page when shop have = 10 pages", async () => {
      for (let i = 0; i < conf.caseConf.add_page_equal_10; i++) {
        //create page
        const response = await otherPage.createPage({
          title: conf.caseConf.page_title,
        });
        //assign template for page
        await builder.applyTemplate({
          productId: response.id,
          templateId: conf.caseConf.template_id,
          type: "page",
        });
      }
      await dashboard.reload();
      //check show list page on web front
      await dashboard.locator(otherPage.pagePanelSelector).click();
      await expect(dashboard.locator(otherPage.viewMoreButtonSelector)).toBeHidden();
    });

    await test.step("Check show list page when shop have > 10 pages", async () => {
      for (let i = 0; i < conf.caseConf.add_page_more_than_10; i++) {
        //create page
        const response = await otherPage.createPage({
          title: conf.caseConf.page_title,
        });
        //assign template for page
        await builder.applyTemplate({
          productId: response.id,
          templateId: conf.caseConf.template_id,
          type: "page",
        });
      }

      await dashboard.reload();
      //check show list page on web front
      await dashboard.locator(otherPage.pagePanelSelector).click();
      await expect(dashboard.locator(otherPage.viewMoreButtonSelector)).toBeVisible();
    });
  });

  test("Check hiển thị list Website page ở Page selector khi add new, edit, delete page, hide page @SB_WEB_BUILDER_PS_7", async ({
    conf,
    dashboard,
    builder,
  }) => {
    let response;
    await test.step("Check not show website page when page not apply template", async () => {
      await webBuilder.openCustomizeTheme(dashboard, conf.caseConf.domain);
      await dashboard.locator(otherPage.pagePanelSelector).click();
      const countPageOnList = dashboard.locator(webBuilder.itemOnPageList("Website pages")).count();
      //create page
      response = await otherPage.createPage({
        title: conf.caseConf.add_page,
      });

      await dashboard.reload();
      await dashboard.locator(otherPage.pagePanelSelector).click();
      const countPageOnListAfter = dashboard.locator(webBuilder.itemOnPageList("Website pages")).count();
      expect(countPageOnList).toEqual(countPageOnListAfter);
    });

    await test.step("Check show website page when page applied template", async () => {
      const countPageOnList = await dashboard.locator(webBuilder.itemOnPageList("Website pages")).count();
      //assign template for page
      await builder.applyTemplate({
        productId: response.id,
        templateId: conf.caseConf.template_id,
        type: "page",
      });

      await dashboard.reload();
      await dashboard.locator(otherPage.pagePanelSelector).click();
      const countPageOnListAfter = await dashboard.locator(webBuilder.itemOnPageList("Website pages")).count();
      expect(countPageOnList).toEqual(countPageOnListAfter);
    });

    await test.step("Check show website page when edit page", async () => {
      //edit page
      const title = conf.caseConf.edit_page_title;
      const result = await otherPage.editPage({ title: title }, response.id);
      expect(result.title).toEqual(title);
      await dashboard.reload();
      await dashboard.locator(otherPage.pagePanelSelector).click();
      await expect(dashboard.locator(webBuilder.itemOnPageList("Website pages")).locator("nth=-1")).toHaveText(title);
    });
  });

  test("Check hiển thị Layer Page selector khi đang ở trang sale page/offer page @SB_WEB_BUILDER_PS_8", async ({
    conf,
    dashboard,
  }) => {
    await dashboard.goto(`https://${conf.caseConf.domain}/admin/creator/products/${conf.caseConf.product_id}`);

    await test.step("Check not show page panel on sale page", async () => {
      await dashboard.locator(otherPage.xpathBtnDesignSalePage).click();
      await expect(dashboard.locator(otherPage.pagePanelSelector)).toBeHidden();
      await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.buttonExitWebBuilderSelector,
        waitForElement: "id=page-header",
        redirectUrl: `https://${conf.caseConf.domain}/admin/creator/products/${conf.caseConf.product_id}`,
      });
    });

    await test.step("Check not show page panel on offer page", async () => {
      await dashboard.locator(otherPage.xpathTabCheckout).click();
      await dashboard.locator(otherPage.xpathBtnCheckoutDesign).click();
      await expect(dashboard.locator(otherPage.pagePanelSelector)).toBeHidden();
    });
  });

  test("Check search on list Website page @SB_WEB_BUILDER_PS_11", async ({ conf, dashboard }) => {
    await webBuilder.openCustomizeTheme(dashboard, conf.caseConf.domain);
    await dashboard.locator(otherPage.pagePanelSelector).click();

    for (const searchPage of conf.caseConf.search_function) {
      await dashboard.locator(otherPage.xpathSearchPage).fill(`${searchPage.text}`);

      await dashboard.waitForResponse(
        `https://${conf.caseConf.domain}/admin/themes/builder/site/${conf.caseConf.page_id}.json?search=${searchPage.text}`,
      );

      const matchedElements = await webBuilder.genLoc(otherPage.pageItemNameXpath).allInnerTexts();
      if (matchedElements.length) {
        expect(matchedElements.length).toEqual(searchPage.number_of_result);
        expect(
          matchedElements.every(el => {
            return el.toLowerCase().includes(`${searchPage.text}`);
          }),
        ).toBeTruthy();
      } else {
        await expect(dashboard.locator(`text=${searchPage.message}`)).toBeVisible();
      }
    }
  });
});
