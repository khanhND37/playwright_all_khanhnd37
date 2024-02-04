import { test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { expect } from "@playwright/test";
import { waitTimeout } from "@utils/api";

test.describe("Section interaction on web front", () => {
  let webBuilder: WebBuilder,
    section: Sections,
    blocks: Blocks,
    themes: ThemeEcom,
    themeId: number,
    accessToken: string,
    data,
    storefront;
  test.beforeEach(async ({ dashboard, conf, theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    section = new Sections(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    data = conf.caseConf.data;
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);

    const id = await theme.getIdByNameTemplate(data.template_name, conf.suiteConf.lib_id);
    const response = await theme.applyTemplate(id[0]);
    themeId = response.id;

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "home" });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
    });
  });

  test.afterEach(async ({ conf, token }) => {
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    await themes.deleteTheme(themeId, accessToken);
  });

  test("@SB_WEB_BUILDER_SECTION_SETTING_155 Section_Check remove section trên side bar", async ({
    dashboard,
    context,
  }) => {
    await test.step("Click vào section 1", async () => {
      await webBuilder.clickOnSection("Single column");
    });

    await test.step("Click remove section button", async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.clickOnBtnWithLabel("Delete section");
      await expect(dashboard.locator(webBuilder.getXpathByText("Single column"))).toBeHidden();
      await expect(webBuilder.frameLocator.locator(section.selectorSection)).toBeHidden();
    });

    await test.step(`Click save > click icon preview trên thanh bar`, async () => {
      storefront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: dashboard,
        isNextStep: true,
      });
      await expect(storefront.locator(section.selectorSection)).toBeHidden();
    });
  });

  test("Check change content & icon section on side bar @SB_WEB_BUILDER_SECTION_SETTING_156", async ({ dashboard }) => {
    let sectionName = "Single column";
    for (const change of data.change) {
      await test.step("Click vào section 1", async () => {
        await webBuilder.clickOnSection(sectionName);
      });

      await test.step("Change section name + icon", async () => {
        await webBuilder.switchToTab("Content");
        await blocks.settingDesignAndContentWithSDK(change.data);
        await webBuilder.frameLocator.locator(section.selectorSection).hover({ position: { x: 1, y: 1 } });
        await expect(webBuilder.frameLocator.locator(section.nameElement)).toHaveText(change.expect.section_name);
        await blocks.clickBackLayer();
        await expect(dashboard.locator(section.iconSection)).toHaveAttribute("clip-path", change.expect.icon);
      });
      sectionName = change.expect.section_name;
    }
  });

  test("@SB_WEB_BUILDER_SECTION_SETTING_161 Row_Side bar_Check remove row trên side bar", async ({
    dashboard,
    context,
  }) => {
    await test.step("Click vào row của section 1", async () => {
      await webBuilder.clickOnRowColumn("Single column");
    });

    await test.step("Click remove row button", async () => {
      await webBuilder.clickOnBtnWithLabel("Delete row");
      await expect(dashboard.locator(webBuilder.getXpathByText("Single column"))).toBeHidden();
      await expect(webBuilder.frameLocator.locator(section.selectorSection)).toBeHidden();
    });

    await test.step(`Click save > click icon preview trên thanh bar`, async () => {
      storefront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: dashboard,
        isNextStep: true,
      });
      await expect(storefront.locator(section.selectorSection)).toBeHidden();
    });
  });

  test("Check set column align & spacing trường hợp layout = vertical @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_13", async ({
    context,
    snapshotFixture,
  }) => {
    await test.step("Add block for column with layout = Vertical", async () => {
      for (const childBlock of data.child_blocks) {
        await blocks.genLoc(section.insertPanelButton).click();
        await blocks.dragAndDropInWebBuilder(childBlock);
      }
    });

    await test.step("Check setting Layout vertical", async () => {
      for (const layout of data.layout_data) {
        await blocks.clickBackLayer();
        await test.step("Expand section by section name", async () => {
          await blocks.expandCollapseLayer({
            sectionName: "Single column",
            isExpand: true,
          });
        });
        await blocks.openLayerSettings(data.column_on_sidebar);
        await webBuilder.settingDesignAndContentWithSDK(layout);
        await expect(blocks.frameLocator.locator(".wb-preview__column .vertical[style]").first()).toHaveAttribute(
          "style",
          new RegExp(layout.style_web_front),
        );

        await test.step("Verify layout = vertical on SF", async () => {
          const newTab = await blocks.clickSaveAndVerifyPreview({
            context,
            dashboard: blocks.page,
            savedMsg: data.expected.saved,
            isNextStep: true,
          });

          await snapshotFixture.verifyWithAutoRetry({
            page: newTab,
            selector: ".main",
            snapshotName: layout.snapshot_column_vertical_web_front,
          });
        });
      }
    });
  });

  test("Check set column align & spacing trường hợp layout = horizontal @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_14", async ({
    context,
    snapshotFixture,
  }) => {
    await test.step("Add block for column with layout = horizontal", async () => {
      for (const childBlock of data.child_blocks) {
        await blocks.genLoc(section.insertPanelButton).click();
        await blocks.dragAndDropInWebBuilder(childBlock);
      }
    });

    await test.step("Check setting Layout horizontal", async () => {
      for (const layout of data.layout_data) {
        await blocks.clickBackLayer();
        await test.step("Expand section by section name", async () => {
          await blocks.expandCollapseLayer({
            sectionName: "Single column",
            isExpand: true,
          });
        });
        await blocks.openLayerSettings(data.column_on_sidebar);
        await webBuilder.settingDesignAndContentWithSDK(layout);
        if (layout.layout.align == "space-between") {
          await expect(blocks.genLoc(blocks.spacingLayout)).toHaveAttribute("style", /display: none;/);
        }
        await expect(blocks.frameLocator.locator(blocks.previewHorizontalLayout)).toHaveAttribute(
          "style",
          new RegExp(layout.style_web_front),
        );

        await test.step("Verify layout = horizontal on SF", async () => {
          const newTab = await blocks.clickSaveAndVerifyPreview({
            context,
            dashboard: blocks.page,
            savedMsg: data.expected.saved,
            isNextStep: true,
          });

          await snapshotFixture.verifyWithAutoRetry({
            page: newTab,
            selector: ".main",
            snapshotName: layout.snapshot_column_horizontal_web_front,
          });
        });
      }
    });
  });

  test("Check hiển thị column khi set width(layout = horizontal) @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_15", async ({
    context,
    snapshotFixture,
  }) => {
    await test.step("Pre-condition: Add block for column with layout = horizontal", async () => {
      for (const childBlock of data.child_blocks) {
        await blocks.genLoc(section.insertPanelButton).click();
        await blocks.dragAndDropInWebBuilder(childBlock);
        await blocks.switchToTab("Design");
        //set width for child block
        await blocks.settingDesignAndContentWithSDK(childBlock);
      }
    });

    await test.step("Pre-condition: Set Layout horizontal for column", async () => {
      await blocks.clickBackLayer();
      await test.step("Expand section by section name", async () => {
        await blocks.expandCollapseLayer({
          sectionName: "Single column",
          isExpand: true,
        });
      });
      await blocks.openLayerSettings(data.column_on_sidebar);
      await blocks.settingDesignAndContentWithSDK(data.layout_data);
    });

    await test.step("Change child width and check on SF", async () => {
      const childSelector = blocks.getSelectorByIndex(data.child_blocks_on_web_front);
      await blocks.clickBackLayer();
      await blocks.clickOnElementInIframe(blocks.frameLocator, childSelector);
      await blocks.settingDesignAndContentWithSDK(data.set_child_width);

      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: data.expected.saved,
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: data.expected.snapshot_on_SF,
      });
    });
  });

  test("Check hiển thị column khi set height(layout = vertical) @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_16", async ({
    context,
    snapshotFixture,
  }) => {
    await test.step("Pre-condition: Add block for column with layout = vertical", async () => {
      for (const childBlock of data.child_blocks) {
        await blocks.genLoc(section.insertPanelButton).click();
        await blocks.dragAndDropInWebBuilder(childBlock);
        await blocks.switchToTab("Design");
        //set height for child block
        await blocks.settingDesignAndContentWithSDK(childBlock);
      }
    });

    await test.step("Pre-condition: Set Layout vertical for column", async () => {
      await blocks.clickBackLayer();
      await test.step("Expand section by section name", async () => {
        await blocks.expandCollapseLayer({
          sectionName: "Single column",
          isExpand: true,
        });
      });
      await blocks.openLayerSettings(data.column_on_sidebar);
      await blocks.settingDesignAndContentWithSDK(data.layout_data);
    });

    await test.step("Change child height and check on SF", async () => {
      const childSelector = blocks.getSelectorByIndex(data.child_blocks_on_web_front);
      await blocks.clickBackLayer();
      await blocks.clickOnElementInIframe(blocks.frameLocator, childSelector);
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(data.set_child_height);
      await blocks.clickOnElementInIframe(blocks.frameLocator, childSelector);

      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: data.expected.saved,
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: data.expected.snapshot_on_SF,
      });
    });
  });

  test("Check section, row, column với data default @SB_WEB_BUILDER_SECTION_SETTING_44", async ({
    snapshotFixture,
    dashboard,
  }) => {
    await test.step("Click icon + Insert Panel trên thanh bar > Kéo Single column vào preview", async () => {
      await webBuilder.dragAndDropInWebBuilder(data.position_section);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.expected.section_preview,
        combineOptions: {
          fullPage: true,
        },
      });
    });

    await test.step("Click vào tab design trên sidebar", async () => {
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: blocks.sidebar,
        snapshotName: data.expected.sidebar_section,
      });
    });

    await test.step("Click vào vùng của row", async () => {
      await blocks.clickBackLayer();
      await blocks.expandCollapseLayer({
        sectionName: "Single column",
        sectionIndex: 1,
        isExpand: true,
      });
      await blocks.openLayerSettings(data.row_on_sidebar);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.expected.row_preview,
        combineOptions: {
          fullPage: true,
        },
      });
    });

    await test.step("Click vào vùng của column", async () => {
      await blocks.clickBackLayer();
      await blocks.expandCollapseLayer({
        sectionName: "Single column",
        sectionIndex: 1,
        isExpand: true,
      });
      await blocks.openLayerSettings(data.column_on_sidebar);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.expected.column_preview,
        combineOptions: {
          fullPage: true,
        },
      });
    });
  });

  test("Section_Check setting data content + design của section @SB_WEB_BUILDER_SECTION_SETTING_45", async ({
    context,
    snapshotFixture,
    dashboard,
  }) => {
    await test.step("Trên preview, click vào section > click icon Duplicate thêm 2 section", async () => {
      await blocks.openLayerSettings(data.section_on_sidebar);
      for (let i = 0; i < data.add_section.number; ++i) {
        await blocks.selectOptionOnQuickBar("Duplicate");
      }
    });

    await test.step("Trên preview, click vào column > setting màu của column", async () => {
      const countColumn = await webBuilder.frameLocator.locator(blocks.columnsInPreview).count();
      for (let i = 0; i < countColumn; ++i) {
        await webBuilder.frameLocator
          .locator(blocks.columnsInPreview)
          .nth(i)
          .click({ position: { x: 10, y: 10 } });
        await blocks.settingDesignAndContentWithSDK(data.add_section.column);
      }
    });

    for (const setting of data.sections) {
      await blocks.clickBackLayer();
      await blocks.openLayerSettings(data.section_on_sidebar);
      await test.step("Chọn Section và nhập thông tin section name", async () => {
        await webBuilder.switchToTab("Content");
        await blocks.settingDesignAndContentWithSDK(setting.content);
        await webBuilder.switchToTab("Design");
        await blocks.settingDesignAndContentWithSDK(setting.design);
        if (setting.design.background.img) {
          await webBuilder.waitForXpathState(blocks.imgBackground, "stable");
        }
        if (setting.design.background.video) {
          await webBuilder.waitForXpathState(blocks.imgBackgroundVideo, "stable");
          //wait video load
          await waitTimeout(3000);
        }
      });
    }
    await test.step("Check hiển thị 3 section trên preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: ".main",
        iframe: webBuilder.iframe,
        snapshotName: data.expected.snapshot_on_preview,
      });

      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: data.expected.saved,
        isNextStep: true,
      });

      //wait video load
      await waitTimeout(3000);
      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: data.expected.snapshot_on_SF,
      });
    });
  });

  test("Row_Check setting data design của row @SB_WEB_BUILDER_SECTION_SETTING_46", async ({
    context,
    snapshotFixture,
    dashboard,
  }) => {
    await test.step("Trên preview, click vào row > click icon + Add thêm 3 row", async () => {
      await blocks.expandCollapseLayer({
        sectionName: "Single column",
        isExpand: true,
      });
      await blocks.openLayerSettings(data.row_on_sidebar);
      for (let i = 0; i < data.add_row.number; ++i) {
        await blocks.selectOptionOnQuickBar("Add row");
        await blocks.selectColumnLayout(data.add_row.layout, true);
      }
    });

    await test.step("Trên preview, click vào column > setting màu của column", async () => {
      const countColumn = await webBuilder.frameLocator.locator(blocks.columnsInPreview).count();
      for (let i = 1; i < countColumn; ++i) {
        await webBuilder.frameLocator
          .locator(blocks.columnsInPreview)
          .nth(i)
          .click({ position: { x: 10, y: 10 } });
        await blocks.settingDesignAndContentWithSDK(data.add_row.column);
      }
    });

    for (const setting of data.rows) {
      await test.step("Chọn Row và nhập thông tin", async () => {
        await blocks.clickBackLayer();
        await blocks.expandCollapseLayer({
          sectionName: "Single column",
          isExpand: true,
        });
        await blocks.openLayerSettings(setting.row);
        await blocks.settingDesignAndContentWithSDK(setting);
        if (setting.background.img) {
          await webBuilder.waitForXpathState(blocks.imgBackground, "stable");
        }
      });
    }
    await test.step("Check hiển thị 3 row trên preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: ".main section",
        iframe: webBuilder.iframe,
        snapshotName: data.expected.snapshot_on_preview,
      });

      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: data.expected.saved,
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: data.expected.snapshot_on_SF,
      });
    });
  });

  test("Column_Check setting data design của Column @SB_WEB_BUILDER_SECTION_SETTING_47", async ({
    context,
    snapshotFixture,
    dashboard,
  }) => {
    await test.step("Trên preview, click vào column > click icon + Add thêm 3 Column", async () => {
      await test.step("Expand section by section name", async () => {
        await blocks.expandCollapseLayer({
          sectionName: "Single column",
          isExpand: true,
        });
      });
      await blocks.openLayerSettings(data.column_on_sidebar);
      for (let i = 1; i < data.columns.length; ++i) {
        await blocks.selectOptionOnQuickBar("Add column");
      }
    });

    for (const setting of data.columns) {
      await test.step("Chọn Column và nhập thông tin", async () => {
        await blocks.clickBackLayer();
        await blocks.expandCollapseLayer({
          sectionName: "Single column",
          isExpand: true,
        });
        await blocks.openLayerSettings(setting.column);
        await blocks.settingDesignAndContentWithSDK(setting);
        if (setting.background.img) {
          await webBuilder.waitForXpathState(blocks.imgBackground, "stable");
        }
      });
    }
    await test.step("Check hiển thị 4 column trên preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: ".main section",
        iframe: webBuilder.iframe,
        snapshotName: data.expected.snapshot_on_preview,
      });

      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: data.expected.saved,
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: data.expected.snapshot_on_SF,
      });
    });
  });
});
