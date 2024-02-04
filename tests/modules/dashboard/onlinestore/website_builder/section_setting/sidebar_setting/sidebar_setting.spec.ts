import { snapshotDir, verifyRedirectUrl } from "@core/utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { expect, test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { loadData } from "@core/conf/conf";
import { XpathNavigationButtons } from "@constants/web_builder";

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
      //set date for page
      const page = await builder.pageBuilder(conf.suiteConf.page_id);
      page.settings_data.pages.product[conf.suiteConf.variant].sections = conf.suiteConf.theme_data.sections;
      await builder.updatePageBuilder(conf.suiteConf.page_id, page.settings_data);
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

  test("Check trường full width @SB_WEB_BUILDER_SECTION_SETTING_148", async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
  }) => {
    const elemetSelectorOnWebFront = await webBuilder.getSelectorByIndex(conf.caseConf.row_on_webfront);
    const frameLocator = dashboard.frameLocator("#preview");
    const sectionWidth = (await frameLocator.locator(elemetSelectorOnWebFront).boundingBox()).width;

    await test.step("Check default section & default width", async () => {
      await webBuilder.openLayerSettings(conf.caseConf.element_on_sidebar);
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.default_section,
      });
      await expect(sectionWidth).toEqual(1120);
    });

    await test.step("Set full width section", async () => {
      await webBuilder.switchToggle("full_width", true);
      await expect(frameLocator.locator(section.fullWidthSection)).toBeVisible();
    });

    await test.step("Verify full width on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.SF_full_width_section,
        },
        snapshotFixture,
      );
    });
  });

  const borderConf = loadData(__dirname, "TC_SIDEBAR_BORDER");
  for (const setBorder of borderConf.caseConf.data) {
    test(`${setBorder.description} @${setBorder.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
      await webBuilder.expandCollapseLayer({
        sectionName: setBorder.element_on_sidebar.sectionName,
        isExpand: true,
      });

      await webBuilder.openLayerSettings(setBorder.element_on_sidebar);
      if (!setBorder.element_on_sidebar.subLayerName) {
        await webBuilder.switchToTab("Design");
      }

      for (const borderData of setBorder.set_border) {
        await test.step("Set border", async () => {
          await webBuilder.setBorder("border", borderData.border);
        });

        await test.step("Save template", async () => {
          await dashboard.locator(XpathNavigationButtons["save"]).click();
          await dashboard.waitForSelector("text='All changes are saved'");
        });

        await test.step("Verify setting border on SF", async () => {
          const storefront = await verifyRedirectUrl({
            page: dashboard,
            selector: XpathNavigationButtons["preview"],
            redirectUrl: "theme_preview_id",
            context,
          });

          const SFUrl = storefront.url();
          await storefront.goto(SFUrl);
          await storefront.waitForLoadState("networkidle");

          await snapshotFixture.verify({
            page: storefront,
            selector: ".main",
            snapshotName: borderData.snap_shot,
          });
          await storefront.close();
        });
      }
    });
  }

  const backgroundConf = loadData(__dirname, "TC_SIDEBAR_BACKGROUND");
  for (const setBackground of backgroundConf.caseConf.data) {
    test(`${setBackground.description} @${setBackground.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
      await webBuilder.expandCollapseLayer({
        sectionName: setBackground.element_on_sidebar.sectionName,
        isExpand: true,
      });

      await webBuilder.openLayerSettings(setBackground.element_on_sidebar);
      if (!setBackground.element_on_sidebar.subLayerName) {
        await webBuilder.switchToTab("Design");
      }

      for (const backgroundData of setBackground.set_background) {
        await webBuilder.setBackground("background", backgroundData.background);
        await blocks.clickSaveAndVerifyPreview(
          {
            context,
            dashboard,
            savedMsg: setBackground.expected.saved,
            snapshotName: backgroundData.snap_shot,
          },
          snapshotFixture,
        );
      }
    });
  }

  const paddingConf = loadData(__dirname, "TC_SIDEBAR_PADDING");
  for (const setPadding of paddingConf.caseConf.data) {
    test(`${setPadding.description} @${setPadding.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
      await webBuilder.expandCollapseLayer({
        sectionName: setPadding.element_on_sidebar.sectionName,
        isExpand: true,
      });

      await webBuilder.openLayerSettings(setPadding.element_on_sidebar);
      if (!setPadding.element_on_sidebar.subLayerName) {
        await webBuilder.switchToTab("Design");
      }

      for (const paddingData of setPadding.set_padding) {
        await test.step("Set padding", async () => {
          await webBuilder.setMarginPadding("padding", paddingData.padding);
        });

        await test.step("Save template", async () => {
          await dashboard.locator(XpathNavigationButtons["save"]).click();
          await dashboard.waitForSelector("text='All changes are saved'");
        });

        await test.step("Verify setting padding on SF", async () => {
          const storefront = await verifyRedirectUrl({
            page: dashboard,
            selector: XpathNavigationButtons["preview"],
            redirectUrl: "theme_preview_id",
            context,
          });

          const SFUrl = storefront.url();
          await storefront.goto(SFUrl);
          await storefront.waitForLoadState("networkidle");

          await snapshotFixture.verify({
            page: storefront,
            selector: ".main",
            snapshotName: paddingData.snap_shot,
          });
          await storefront.close();
        });
      }
    });
  }

  const marginConf = loadData(__dirname, "TC_SIDEBAR_MARGIN");
  for (const setMargin of marginConf.caseConf.data) {
    test(`${setMargin.description} @${setMargin.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
      await webBuilder.expandCollapseLayer({
        sectionName: setMargin.element_on_sidebar.sectionName,
        isExpand: true,
      });

      await webBuilder.openLayerSettings(setMargin.element_on_sidebar);
      if (!setMargin.element_on_sidebar.subLayerName) {
        await webBuilder.switchToTab("Design");
      }

      for (const marginData of setMargin.set_margin) {
        await test.step("Set margin", async () => {
          await webBuilder.setMarginPadding("margin", marginData.margin);
        });

        await test.step("Save template", async () => {
          await dashboard.locator(XpathNavigationButtons["save"]).click();
          await dashboard.waitForSelector("text='All changes are saved'");
        });

        await test.step("Verify setting margin on SF", async () => {
          const storefront = await verifyRedirectUrl({
            page: dashboard,
            selector: XpathNavigationButtons["preview"],
            redirectUrl: "theme_preview_id",
            context,
          });

          const SFUrl = storefront.url();
          await storefront.goto(SFUrl);
          await storefront.waitForLoadState("networkidle");

          await snapshotFixture.verify({
            page: storefront,
            selector: ".main",
            snapshotName: marginData.snap_shot,
          });
          await storefront.close();
        });
      }
    });
  }
});
