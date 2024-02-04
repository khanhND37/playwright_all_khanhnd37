import { snapshotDir } from "@core/utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { expect, test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { loadData } from "@core/conf/conf";

const setDataForPage = async (builder, conf, themeData) => {
  const page = await builder.pageBuilder(conf.suiteConf.page_id);
  page.settings_data.pages.product[conf.suiteConf.variant].sections = themeData.sections;
  await builder.updatePageBuilder(conf.suiteConf.page_id, page.settings_data);
};

test.describe("Section interaction on web front", () => {
  let webBuilder: WebBuilder;
  let section: Sections;
  let blocks: Blocks;
  test.beforeEach(async ({ dashboard, builder, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    section = new Sections(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Set data for page & go to page", async () => {
      await setDataForPage(builder, conf, conf.suiteConf.theme_data);
      //Go to web front by page ID
      await dashboard.evaluate(pageId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/builder/page/${pageId}`);
      }, conf.suiteConf.page_id);
      await dashboard.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      //wait icon loading hidden
      await dashboard.locator(blocks.xpathPreviewSpinner).waitFor({ state: "hidden" });
    });
  });

  const conf = loadData(__dirname, "TC_SECTION_INTERACTION");
  for (const caseData of conf.caseConf.data) {
    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
      const elemetSelector = await webBuilder.getSelectorByIndex(caseData.element_on_webfront);
      await test.step("Expand section by section name", async () => {
        await webBuilder.expandCollapseLayer({
          sectionName: caseData.element_on_sidebar.sectionName,
          isExpand: true,
        });
      });

      await test.step("Hover element on web front", async () => {
        await webBuilder.hoverElementInIframe(webBuilder.frameLocator, elemetSelector, dashboard);
        await webBuilder.frameLocator.locator(elemetSelector).hover({ position: { x: 1, y: 1 } });
        await expect(webBuilder.frameLocator.locator(section.elementSelector)).toBeVisible();
        await snapshotFixture.verify({
          page: dashboard,
          selector: section.webfrontSelector,
          snapshotName: caseData.expected.hover_element_on_webfront,
        });
      });

      await test.step("Hover element on side bar", async () => {
        await webBuilder.hoverLayer(caseData.element_on_sidebar, webBuilder);
        await expect(webBuilder.frameLocator.locator(section.elementSelector)).toBeVisible();
        await snapshotFixture.verify({
          page: dashboard,
          selector: section.webfrontSelector,
          snapshotName: caseData.expected.hover_element_on_sidebar,
        });
      });

      await test.step("Click element on web front", async () => {
        await webBuilder.clickOnElementInIframe(webBuilder.frameLocator, elemetSelector);
        await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
        await snapshotFixture.verify({
          page: dashboard,
          selector: section.webfrontSelector,
          snapshotName: caseData.expected.click_element_on_webfront,
        });
      });

      await test.step("Click element on side bar", async () => {
        //click back button
        await blocks.clickBackLayer();
        await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeHidden();
        //click block on side bar
        await webBuilder.openLayerSettings(caseData.element_on_sidebar);
        await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
        await snapshotFixture.verify({
          page: dashboard,
          selector: section.webfrontSelector,
          snapshotName: caseData.expected.click_element_on_sidebar,
        });
      });
    });
  }

  test("Check UI/UX của row/column trong luồng Edit layout @SB_WEB_BUILDER_SECTION_SETTING_131", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Open row 1 setting by clicking Edit layout", async () => {
      await webBuilder.openLayerSettings(conf.caseConf.element_on_sidebar);
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
      await webBuilder.selectOptionOnQuickBar("Edit layout");
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.select_row_on_webfront,
      });
    });

    for (const elementOnWebFront of conf.caseConf.hover_element) {
      const elemetSelector = await webBuilder.getSelectorByIndex(elementOnWebFront.element_on_webfront);
      await test.step("Hover element on web front", async () => {
        await webBuilder.hoverElementInIframe(webBuilder.frameLocator, elemetSelector, dashboard);
        await expect(webBuilder.frameLocator.locator(section.elementSelector)).toBeVisible();
        await snapshotFixture.verify({
          page: dashboard,
          selector: section.webfrontSelector,
          snapshotName: elementOnWebFront.hover_another_element_on_webfront,
        });
      });
    }
  });

  test("Check UI/UX khi hover/click vào breadcrumb của các element @SB_WEB_BUILDER_SECTION_SETTING_132", async ({
    conf,
    dashboard,
  }) => {
    await test.step("Expand section by section name", async () => {
      await webBuilder.expandCollapseLayer({
        sectionName: conf.caseConf.section_name,
        isExpand: true,
      });
    });
    for (const elementData of conf.caseConf.element_group) {
      await test.step("On side bar, open child element", async () => {
        await webBuilder.openLayerSettings(elementData.element_on_sidebar);
        await expect(webBuilder.frameLocator.locator(elementData.child_quick_bar)).toBeVisible();
      });

      await test.step("Hover child element on web front", async () => {
        const elemetSelector = await webBuilder.getSelectorByIndex(elementData.element_on_webfront);
        await webBuilder.hoverElementInIframe(webBuilder.frameLocator, elemetSelector, dashboard);
        await expect(webBuilder.frameLocator.locator(section.elementSelector)).toHaveText(elementData.breadcrumb_data);
      });

      await test.step("Hover & click on parent breadcrumb", async () => {
        await webBuilder.hoverElementInIframe(webBuilder.frameLocator, section.elementSelector, dashboard);
        await webBuilder.clickOnElementInIframe(webBuilder.frameLocator, section.parentBreadcrumbSelector);
        await expect(webBuilder.frameLocator.locator(elementData.parent_quick_bar)).toBeVisible();
      });

      await test.step("Click back button", async () => {
        await blocks.clickBackLayer();
        await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeHidden();
      });
    }
  });

  test("Check UI/UX khi thao tác với blank section trên web front @SB_WEB_BUILDER_SECTION_SETTING_133", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Add blank section & verify default data", async () => {
      await webBuilder.dndTemplateFromInsertPanel(conf.caseConf.dnd_section);
      await blocks.clickBackLayer();
      await expect(webBuilder.frameLocator.locator("text=This is a blank section")).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.default_blank_section,
      });
    });

    await test.step("Hover blank section on webfront", async () => {
      const elemetSelector = await webBuilder.getSelectorByIndex(conf.caseConf.element_on_webfront);
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, elemetSelector, dashboard);
      await webBuilder.frameLocator.locator(elemetSelector).hover({ position: { x: 1, y: 1 } });
      await expect(webBuilder.frameLocator.locator(section.elementSelector)).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.hover_section_area_on_webfront,
      });
    });

    await test.step("Hover column area on blank section", async () => {
      const elemetSelector = await webBuilder.getSelectorByIndex(conf.caseConf.column_on_webfront);
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, elemetSelector, dashboard);
      await expect(webBuilder.frameLocator.locator(section.addBlockButtonSelector)).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.hover_column_area_on_webfront,
      });
    });

    await test.step("Click Add block button", async () => {
      await webBuilder.frameLocator.locator(section.addBlockButtonSelector).click();
      await expect(dashboard.locator(section.insertPanelPreviewSelector)).toBeVisible();
    });
  });
});
