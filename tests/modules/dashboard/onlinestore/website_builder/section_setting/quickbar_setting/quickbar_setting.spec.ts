import { snapshotDir } from "@core/utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { expect, test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

const setDataForPage = async (builder, conf, themeData) => {
  const page = await builder.pageBuilder(conf.suiteConf.page_id);
  page.settings_data.pages.product[conf.suiteConf.variant].sections = themeData.sections;
  await builder.updatePageBuilder(conf.suiteConf.page_id, page.settings_data);
};

test.describe("Quick bar setting of section/row/column", () => {
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

    await test.step("Open quick bar by section name", async () => {
      await webBuilder.expandCollapseLayer({
        sectionName: conf.caseConf.section_name,
        isExpand: true,
      });
      await webBuilder.openLayerSettings({
        sectionName: conf.caseConf.section_name,
        subLayerName: conf.caseConf.sub_layer_name,
        subLayerIndex: conf.caseConf.sub_layer_index,
      });
    });
  });

  test("Check hiển thị section khi click up/down button @SB_WEB_BUILDER_SECTION_SETTING_134", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Click down button", async () => {
      //verify disable up button
      await expect(await webBuilder.frameLocator.locator(section.getQuickBarXpath("Move up"))).toHaveAttribute(
        "class",
        /is-disabled/,
      );
      await webBuilder.selectOptionOnQuickBar("Move down");
      const sectionNames = await webBuilder.getAllSectionName();
      await expect(sectionNames[1]).toEqual(conf.caseConf.section_name);

      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_down_section,
      });

      //verify on SF
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_down_section,
        },
        snapshotFixture,
      );
    });

    await test.step("Click up button", async () => {
      //verify disable down button
      await expect(await webBuilder.frameLocator.locator(section.getQuickBarXpath("Move down"))).toHaveAttribute(
        "class",
        /is-disabled/,
      );
      await webBuilder.selectOptionOnQuickBar("Move up");
      const sectionNames = await webBuilder.getAllSectionName();
      await expect(sectionNames[0]).toEqual(conf.caseConf.section_name);

      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_up_section,
      });

      //verify on SF
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_up_section,
        },
        snapshotFixture,
      );
    });
  });

  test("Check hiển thị khi click visible button @SB_WEB_BUILDER_SECTION_SETTING_135", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Click hide section", async () => {
      await webBuilder.selectOptionOnQuickBar("Hide");
      const selector = await webBuilder.getSelectorByIndex({ section: 1 });
      await expect(webBuilder.frameLocator.locator(selector)).toHaveAttribute("class", /hidden/);
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_hide_section,
      });
    });

    await test.step("Verify hide section on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_hide_section,
        },
        snapshotFixture,
      );
    });
  });

  test("Check hiển thị khi click duplicate button @SB_WEB_BUILDER_SECTION_SETTING_136", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Click duplicate button", async () => {
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      const sectionNames = await webBuilder.getAllSectionName();
      await expect(sectionNames[1]).toEqual(sectionNames[0]);
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_duplicate_section,
      });
    });

    await test.step("Verify duplicate section on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_duplicate_section,
        },
        snapshotFixture,
      );
    });
  });

  test("Check Save as template button @SB_WEB_BUILDER_SECTION_SETTING_137", async ({ conf, dashboard }) => {
    await test.step("Click save as template button", async () => {
      await webBuilder.selectOptionOnQuickBar("Add to library");
      await expect(dashboard.locator(section.headerSaveTemplatePopupSelector)).toHaveText(
        conf.caseConf.expected.header_popup,
      );
    });
  });

  test("Check Delete section @SB_WEB_BUILDER_SECTION_SETTING_138", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Click delete button", async () => {
      const sectionNamesList = await webBuilder.genLoc(section.sectionNameXpath).count();
      await webBuilder.selectOptionOnQuickBar("Remove");
      const sectionNamesListAfter = await webBuilder.genLoc(section.sectionNameXpath).count();
      await expect(sectionNamesListAfter + 1).toEqual(sectionNamesList);
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_delete_section,
      });
    });

    await test.step("Verify section not show on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_delete_section,
        },
        snapshotFixture,
      );
    });
  });

  test("Check add new row in section @SB_WEB_BUILDER_SECTION_SETTING_139", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    const countRow = await webBuilder.countRowInSection(1);
    await webBuilder.selectOptionOnQuickBar("Edit layout");

    await test.step("Click Add row on row 1", async () => {
      await webBuilder.selectOptionOnQuickBar("Add row");
      const countRow2 = await webBuilder.countRowInSection(1);
      await expect(countRow + 1).toEqual(countRow2);
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_add_row,
      });
    });

    await test.step("Verify section not show on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_add_row,
        },
        snapshotFixture,
      );
    });
  });

  test("Check set column layout of row @SB_WEB_BUILDER_SECTION_SETTING_140", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await webBuilder.selectOptionOnQuickBar("Edit layout");
    await test.step("Choose column layout of row", async () => {
      //Choose layout & spacing for column
      await webBuilder.editLayoutSection({ column: conf.caseConf.change_layout_index, spacing: conf.caseConf.spacing });
      await expect(
        webBuilder.frameLocator.locator(section.getColumnLayoutSelector(conf.caseConf.change_layout_index)),
      ).toHaveAttribute("class", /selected/);
      await webBuilder.frameLocator.locator(section.columnLayoutXpath).click();
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_change_column_layout,
      });
    });

    await test.step("Verify show column layout on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_change_column_layout,
        },
        snapshotFixture,
      );
    });
  });

  test("Check hiển thị row khi click up/down button @SB_WEB_BUILDER_SECTION_SETTING_142", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await webBuilder.selectOptionOnQuickBar("Edit layout");
    await test.step("Click down button", async () => {
      //verify disable up button
      await expect(await webBuilder.frameLocator.locator(section.getQuickBarXpath("Move up"))).toHaveAttribute(
        "class",
        /is-disabled/,
      );
      await webBuilder.selectOptionOnQuickBar("Move down");
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_down_row,
      });
      //verify on preview
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_down_row,
        },
        snapshotFixture,
      );
    });

    await test.step("Click up button", async () => {
      //verify disable down button
      await expect(await webBuilder.frameLocator.locator(section.getQuickBarXpath("Move down"))).toHaveAttribute(
        "class",
        /is-disabled/,
      );
      await webBuilder.selectOptionOnQuickBar("Move up");
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_up_row,
      });
      //verify on preview
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_up_row,
        },
        snapshotFixture,
      );
    });
  });

  test("Check hiển thị khi duplicate row @SB_WEB_BUILDER_SECTION_SETTING_143", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    const countRow = await webBuilder.countRowInSection(1);
    await webBuilder.selectOptionOnQuickBar("Edit layout");

    await test.step("Click duplicate button", async () => {
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      const countRow2 = await webBuilder.countRowInSection(1);
      await expect(countRow + 1).toEqual(countRow2);
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_duplicate_row,
      });
    });

    await test.step("Verify duplicate section on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_duplicate_row,
        },
        snapshotFixture,
      );
    });
  });

  test("Check Delete row @SB_WEB_BUILDER_SECTION_SETTING_144", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    const countRow = await webBuilder.countRowInSection(1);
    await webBuilder.selectOptionOnQuickBar("Edit layout");

    await test.step("Click delete button", async () => {
      await webBuilder.selectOptionOnQuickBar("Remove");
      const countRowAfter = await webBuilder.countRowInSection(1);
      await expect(countRowAfter + 1).toEqual(countRow);
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_delete_row,
      });
    });

    await test.step("Verify section not show on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_delete_row,
        },
        snapshotFixture,
      );
    });
  });

  test("Check di chuyen column @SB_WEB_BUILDER_SECTION_SETTING_145", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Click move right button", async () => {
      //verify disable left button
      await expect(await webBuilder.frameLocator.locator(section.getQuickBarXpath("Move left"))).toHaveAttribute(
        "class",
        /is-disabled/,
      );
      await webBuilder.selectOptionOnQuickBar("Move right");
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_move_right,
      });
    });

    await test.step("Verify column state on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_move_right,
        },
        snapshotFixture,
      );
    });

    await test.step("Click move left button", async () => {
      //verify disable right button
      await expect(await webBuilder.frameLocator.locator(section.getQuickBarXpath("Move right"))).toHaveAttribute(
        "class",
        /is-disabled/,
      );
      await webBuilder.selectOptionOnQuickBar("Move left");
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_move_left,
      });
    });

    await test.step("Verify column state on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_move_left,
        },
        snapshotFixture,
      );
    });
  });

  test("Check layout column khi move column đang ở layout 1/3 @SB_WEB_BUILDER_SECTION_SETTING_146", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Move column", async () => {
      await webBuilder.selectOptionOnQuickBar("Move right");
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_change_layout_6th,
      });
    });

    await test.step("Verify layout column apply 2/3", async () => {
      await blocks.clickBackLayer();
      await webBuilder.openLayerSettings({
        sectionName: conf.caseConf.section_name,
        subLayerName: "Row",
        subLayerIndex: 1,
      });
      await webBuilder.frameLocator.locator(section.columnLayoutXpath).click();
      await expect(webBuilder.frameLocator.locator(section.getColumnLayoutSelector(6))).toHaveAttribute(
        "class",
        /selected/,
      );
    });

    await test.step("Verify section not show on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_change_layout_6th,
        },
        snapshotFixture,
      );
    });
  });

  test("Check thay đổi layout column từ nhiều xuống ít cột @SB_WEB_BUILDER_SECTION_SETTING_147", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Choose column layout of row", async () => {
      //Choose layout & spacing for column
      await webBuilder.editLayoutSection({ column: conf.caseConf.change_layout_index, spacing: conf.caseConf.spacing });
      await expect(
        webBuilder.frameLocator.locator(section.getColumnLayoutSelector(conf.caseConf.change_layout_index)),
      ).toHaveAttribute("class", /selected/);
      await webBuilder.frameLocator.locator(section.columnLayoutXpath).click();
      //verify on web front
      await snapshotFixture.verify({
        page: dashboard,
        selector: section.webfrontSelector,
        snapshotName: conf.caseConf.expected.preview_change_column_layout,
      });
    });

    await test.step("Verify show column layout on SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.storefront_change_column_layout,
        },
        snapshotFixture,
      );
    });
  });
});
