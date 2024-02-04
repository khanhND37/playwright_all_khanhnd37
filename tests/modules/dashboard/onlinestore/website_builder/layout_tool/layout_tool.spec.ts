import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@fixtures/website_builder";
import { Blocks, ClickType } from "@pages/shopbase_creator/dashboard/blocks";
import { loadData } from "@core/conf/conf";
import { snapshotDir } from "@utils/theme";
import { getStyle, verifyWidthHeightCSSInRange } from "@utils/css";
import { SFWebBuilder } from "@pages/storefront/web_builder";
import { PageSettingsData } from "@types";

test.describe("Layout tool @TS_SB_WEB_BUILDER_EL", () => {
  let blocks: Blocks;
  let previewPage: Page;
  let settingsData: PageSettingsData;
  let storeFront: SFWebBuilder;
  let firstSection: Locator;
  let firstRow: Locator;
  let firstCol: Locator;
  let secondCol: Locator;
  let thirdCol: Locator;
  let fourthCol: Locator;
  let columnsInPreview: Locator;
  let edgePosition: Record<string, Record<string, number>>;
  const softExpect = expect.configure({ soft: true });

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, builder, conf, context }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    blocks = new Blocks(dashboard, conf.suiteConf.domain, context);
    firstSection = blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1 }));
    firstRow = blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, row: 1 }));
    firstCol = blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, column: 1 }));
    secondCol = blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, column: 2 }));
    thirdCol = blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, column: 3 }));
    fourthCol = blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, column: 4 }));
    columnsInPreview = blocks.frameLocator.locator(blocks.columnsInPreview);
    edgePosition = { position: { x: 10, y: 5 } };

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      settingsData.pages["home"].default.elements = [];
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
      await blocks.openWebBuilder({
        id: conf.suiteConf.theme_id,
        type: "site",
      });
      await blocks.reloadIfNotShow();
    });
  });

  test(`@SB_WEB_BUILDER_EL_14 Section_Check add section mới khi kéo từ Insert panel màn desktop`, async ({ cConf }) => {
    for (let i = 0; i < cConf.data.length; i++) {
      const data = cConf.data[i];
      await test.step("- Click Open Insert panel rồi kéo 1 section với layout preset vào webfront", async () => {
        const sectionId = await blocks.dragAndDropInWebBuilder(data.dnd_section);
        const sectionLoc = blocks.getElementById(sectionId, ClickType.SECTION);
        await softExpect(sectionLoc.locator(blocks.rowsInPreview)).toHaveCount(data.expected.count_row);
        await softExpect(sectionLoc.locator(blocks.columnsInPreview)).toHaveCount(data.expected.count_column);
        await softExpect(sectionLoc).toHaveCSS("padding", data.expected.padding_section);
        await softExpect(sectionLoc.locator(blocks.rowsInPreview)).toHaveCSS("padding", data.expected.padding_row);
        await softExpect(sectionLoc.locator(blocks.columnsInPreview).first()).toHaveCSS(
          "--gutter",
          data.expected.gutter,
        );
        for (let index = 0; index < data.expected.width_column.length; index++) {
          const width = data.expected.width_column[index];
          const expectedWidth = width === 12 ? "100%" : new RegExp(`calc\\(${width}`);
          // 12 is total column follow bootstrap
          await softExpect(sectionLoc.locator(blocks.columnsInPreview).nth(index)).toHaveCSS("--width", expectedWidth);
        }
      });
    }
  });

  test(`@SB_WEB_BUILDER_EL_15 Section_Check add section mới khi kéo từ Insert panel màn mobile`, async ({ cConf }) => {
    await test.step("Click icon Mobile nằm ở Navigation bar", async () => {
      await blocks.actionInPreviewTemplate("Mobile");
      await blocks.toastMessage.waitFor();
      await blocks.closeToastBtn.click();
    });

    for (let i = 0; i < cConf.data.length; i++) {
      const data = cConf.data[i];
      await test.step("- Click Open Insert panel rồi kéo 1 section với layout preset vào webfront", async () => {
        const sectionId = await blocks.dragAndDropInWebBuilder(data.dnd_section);
        const sectionLoc = blocks.getElementById(sectionId, ClickType.SECTION);
        await softExpect(sectionLoc.locator(blocks.rowsInPreview)).toHaveCount(data.expected.count_row);
        await softExpect(sectionLoc.locator(blocks.columnsInPreview)).toHaveCount(data.expected.count_column);
        await softExpect(sectionLoc.locator(blocks.columnsInPreview).first()).toHaveCSS(
          "--gutter",
          data.expected.gutter,
        );
        const columns = await sectionLoc.locator(blocks.columnsInPreview).all();
        for (let index = 0; index < columns.length; index++) {
          const column = columns[index];
          await softExpect(column).toHaveCSS("--width", "100%");
        }
      });
    }

    await test.step("Click icon Desktop nằm ở Navigation bar", async () => {
      await blocks.actionInPreviewTemplate("Desktop");
      await blocks.webFrontDesktopPreview.waitFor();
      const sections = await blocks.genLoc(blocks.sectionsInPreview).all();
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        for (let index = 0; index < cConf.expected_width_desktop.length; index++) {
          const width = cConf.expected_width_desktop[index];
          // 12 is total column follow bootstrap
          await softExpect(section.locator(blocks.columnsInPreview).nth(index)).toHaveCSS(
            "--width",
            new RegExp(`${(width / 12) * 100}%`),
          );
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_EL_18 Section_Quick bar_Check hiển thị section khi click up/down button`, async ({
    cConf,
    context,
  }) => {
    await test.step("Add sections", async () => {
      for (let i = 0; i < 3; i++) {
        await blocks.dragAndDropInWebBuilder(Object.assign({ to: { position: { section: i } } }, cConf.dnd_section));
        await blocks.settingDesignAndContentWithSDK(cConf.change_design);
        await blocks.backBtn.click();
      }
    });

    for (let i = 0; i < cConf.data.length; i++) {
      const data = cConf.data[i];
      await test.step(`Tại web front: click vào section ${data.section_index + 1}`, async () => {
        await blocks.frameLocator
          .locator(blocks.sectionsInPreview)
          .nth(data.section_index)
          .click({ position: { x: 5, y: 5 } });
        await blocks.backBtn.hover();
        await expect(blocks.frameLocator.locator(blocks.quickBarLoc)).toBeVisible();
        await expect(blocks.quickBarButton("Move up")).toBeVisible();
        await expect(blocks.quickBarButton("Move down")).toBeVisible();
        await expect(blocks.quickBarButton("Duplicate")).toBeVisible();
        await expect(blocks.quickBarButton("Hide")).toBeVisible();
        await expect(blocks.quickBarButton("Save as template")).toBeVisible();
        await expect(blocks.quickBarButton("Delete")).toBeVisible();
      });

      await test.step(`Click Move Down button`, async () => {
        await blocks.selectOptionOnQuickBar(data.action);
        await blocks.backBtn.hover();
        await expect(blocks.quickBarButton("Move up")).toBeEnabled();
        await expect(blocks.quickBarButton("Move down")).toBeEnabled();
      });

      await test.step(`nhấn save > nhấn preview button`, async () => {
        const sectionId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
        await blocks.backBtn.click();
        const webfront = await blocks.clickSaveAndVerifyPreview({
          context,
          dashboard: blocks.page,
          savedMsg: cConf.expected.saved,
          isNextStep: true,
        });
        await softExpect(webfront.locator(blocks.sectionsInPreview).nth(1)).toHaveAttribute(
          "data-section-id",
          sectionId,
        );
        await webfront.close();
      });
    }
  });

  test(`@SB_WEB_BUILDER_EL_19 Section_Quick bar_Check hiển thị khi click hide button`, async ({ cConf, context }) => {
    let id: string;
    await test.step("Add sections", async () => {
      id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      await blocks.settingDesignAndContentWithSDK(cConf.change_design);
      await blocks.backBtn.click();
    });

    await test.step(`Tại web front: section 1 đang default được visible, click vào section 1 area`, async () => {
      await blocks.frameLocator
        .locator(blocks.sectionsInPreview)
        .first()
        .click({ position: { x: 5, y: 5 } });
    });

    await test.step(`click visible button trên quick bar`, async () => {
      await blocks.selectOptionOnQuickBar("Hide");
      await blocks.backBtn.click();
      await softExpect(blocks.frameLocator.locator(blocks.getElementSelector(id, ClickType.SECTION))).toBeHidden();
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      await softExpect(webfront.locator(blocks.getElementSelector(id, ClickType.SECTION))).toBeHidden();
      await webfront.close();
    });

    await test.step(`Trong dashboard, ở side bar của section 1, click visible`, async () => {
      const section = blocks.getElementFromSidebarById(id);
      await section.hover();
      await section.locator(blocks.buttonShowLayer).click();
      await softExpect(blocks.frameLocator.locator(blocks.getElementSelector(id, ClickType.SECTION))).toBeVisible();
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      await softExpect(webfront.locator(blocks.getElementSelector(id, ClickType.SECTION))).toBeVisible();
      await webfront.close();
    });
  });

  test(`@SB_WEB_BUILDER_EL_20 Section_Quick bar_Check hiển thị khi click duplicate button`, async ({
    context,
    cConf,
  }) => {
    let id: string;
    let color: string;
    await test.step(`Tại web front: click vào section A area`, async () => {
      id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(cConf.change_design);
    });

    await test.step(`Click duplicate button`, async () => {
      await blocks.selectOptionOnQuickBar("Duplicate");
      await softExpect(blocks.selectedTemplate).not.toHaveAttribute("id", id);
      await softExpect(blocks.frameLocator.locator(blocks.sectionsInPreview)).toHaveCount(cConf.expected.total_section);
      color = await getStyle(blocks.frameLocator.locator(blocks.previewWebFront), cConf.expected.color);
      await softExpect(blocks.selectedTemplate.locator(blocks.sectionsInPreview)).toHaveCSS(
        "background-color",
        `rgb(${color})`,
      );
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      await softExpect(webfront.locator(blocks.sectionsInPreview)).toHaveCount(cConf.expected.total_section);
      await softExpect(webfront.locator(blocks.sectionsInPreview).nth(1)).toHaveCSS(
        "background-color",
        `rgb(${color})`,
      );
      await webfront.close();
    });
  });

  test(`@SB_WEB_BUILDER_EL_22 Section_Quick bar_Check hiển thị section khi click delete button`, async ({
    context,
    cConf,
  }) => {
    await test.step(`Tại web front: click vào section A area`, async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      await blocks.settingDesignAndContentWithSDK(cConf.change_design);
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        onlyClickSave: true,
      });
    });

    await test.step(`click delete`, async () => {
      await blocks.selectOptionOnQuickBar("Delete");
      await softExpect(blocks.genLoc(blocks.layerSelector)).toBeHidden();
      await softExpect(blocks.frameLocator.locator(blocks.sectionsInPreview)).toBeHidden();
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      await softExpect(webfront.locator(blocks.sectionsInPreview)).toBeHidden();
      await webfront.close();
    });
  });

  const confSectionMarginPadding = loadData(__dirname, "SECTION_MARGIN_PADDING");
  for (let caseIndex = 0; caseIndex < confSectionMarginPadding.caseConf.data.length; caseIndex++) {
    const data = confSectionMarginPadding.caseConf.data[caseIndex];
    test(`@${data.case_id} ${data.description}`, async ({ cConf }) => {
      await test.step("Add sections", async () => {
        for (let i = 0; i < cConf.default_designs.length; i++) {
          const design = cConf.default_designs[i];
          await blocks.dragAndDropInWebBuilder(Object.assign({ to: { position: { section: i } } }, cConf.dnd_section));
          await blocks.switchToTab("Design");
          await blocks.settingDesignAndContentWithSDK(design);
          await blocks.backBtn.click();
        }
      });

      const sections = await blocks.frameLocator.locator(blocks.sectionsInPreview).all();
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const id = await section.getAttribute("data-section-id");
        const sectionName = cConf.section_name[i];

        await test.step(`Select vào section ${sectionName} rồi hover vào ${data.type} top/bottom/left/right của section ${sectionName}`, async () => {
          await blocks.clickElementById(id, ClickType.SECTION);
          for (let index = 0; index < cConf.expected.hover.length; index++) {
            const position = cConf.expected.hover[index].position;
            const opacity = cConf.expected.hover[index].opacity;
            const tooltip = cConf.expected.hover[index].tooltip;
            const result = await blocks.hoverPaddingMarginResizer(data.type, position);
            let valueCss = opacity;
            if (typeof valueCss === "object") {
              valueCss = opacity[`section_index_${i}`];
            }

            await softExpect(result.resizer).toHaveCSS("opacity", `${valueCss}`);
            for (let hoverIndex = 0; hoverIndex < tooltip.length; hoverIndex++) {
              softExpect(result.tooltip).toEqual(tooltip[i]);
            }
          }
          await blocks.backBtn.click();
        });

        await test.step(`Edit ${data.type} top/bottom của section ${sectionName} = 80px bằng việc kéo thả ${data.type} line`, async () => {
          for (let index = 0; index < cConf.resize_spacing.length; index++) {
            const position = cConf.resize_spacing[index];
            await blocks.editPaddingMarginByMouseGesture({
              element: section,
              type: data.type,
              position,
              value: cConf.expected.spacing_top_bottom,
            });
            let actual = section;
            if (data.type === "margin") {
              actual = blocks.frameLocator.locator(`[id="${id}"]`);
            }

            await softExpect(actual).toHaveCSS(`${data.type}-${position}`, `${cConf.expected.spacing_top_bottom}px`);
          }
          await blocks.switchToTab("Design");
          await softExpect(blocks.genLoc(blocks.getSelectorByLabel(data.type)).getByRole("textbox")).toHaveValue(
            cConf.expected.spacing_top_bottom_design[i],
          );
          await blocks.backBtn.click();
        });

        await test.step(`Edit ${data.type} left/right của section ${sectionName} bằng việc edit bên sidebar setting`, async () => {
          await blocks.clickElementById(id, ClickType.SECTION);
          const design = cConf.change_designs[i];
          await blocks.switchToTab("Design");
          await blocks.settingDesignAndContentWithSDK(design);
          for (let index = 0; index < cConf.change_spacing.length; index++) {
            const position = cConf.change_spacing[index];
            let actual = section;
            if (data.type === "margin") {
              actual = blocks.frameLocator.locator(`[id="${id}"]`);
            }

            await softExpect(actual).toHaveCSS(`${data.type}-${position}`, cConf.expected.spacing_left_right);
          }
          await blocks.backBtn.click();
        });

        await test.step(`Hover vào ${data.type} left/right của section ${sectionName}`, async () => {
          await blocks.clickElementById(id, ClickType.SECTION);
          for (let index = 0; index < cConf.change_spacing.length; index++) {
            const position = cConf.change_spacing[index];
            const result = await blocks.hoverPaddingMarginResizer(data.type, position);
            softExpect(result.tooltip).toEqual(cConf.expected.spacing_left_right);
          }
          await blocks.backBtn.click();
        });
      }
    });
  }

  const confSettingAddRow = loadData(__dirname, "ADD_ROW_DEVICE");
  for (let caseIndex = 0; caseIndex < confSettingAddRow.caseConf.data.length; caseIndex++) {
    const data = confSettingAddRow.caseConf.data[caseIndex];
    const isMobile = data.device === "mobile";
    test(`@${data.case_id} ${data.description}`, async ({ cConf, snapshotFixture }) => {
      let id: string;
      await test.step("Add section", async () => {
        if (isMobile) {
          await blocks.actionInPreviewTemplate("Mobile");
          await blocks.toastMessage.waitFor();
          await blocks.closeToastBtn.click();
        }

        id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
        await blocks.switchToTab("Design");
        await blocks.settingDesignAndContentWithSDK(cConf.change_padding);
        await blocks.backBtn.click();
      });

      await test.step(`Click select vào 1 row`, async () => {
        await blocks
          .getElementById(id, ClickType.SECTION)
          .locator(blocks.rowsInPreview)
          .click({ position: { x: 10, y: 5 } });
        await softExpect(blocks.selectedTemplate.locator(blocks.beforeIndicatorResizeRow)).toBeHidden();
        await softExpect(blocks.selectedTemplate.locator(blocks.afterIndicatorResizeRow)).toBeHidden();
      });

      await test.step(`Click vào button Add row (phía trên/dưới)`, async () => {
        for (let i = 0; i < cConf.expected.popover_add_row.length; i++) {
          const expected = cConf.expected.popover_add_row[i];
          await blocks.frameLocator.locator(blocks[expected.button]).click();
          await blocks.backBtn.hover();
          await snapshotFixture.verifyWithAutoRetry({
            page: blocks.page,
            selector: blocks.frameLocator.locator(blocks.layoutColumnPopover),
            snapshotName: expected.snapshot,
          });
          await blocks.frameLocator.locator(blocks.popoverChooseTemplateOverlay).click();
        }
      });

      await test.step(`Click chọn 1 layout `, async () => {
        for (let i = 0; i < cConf.add_rows.length; i++) {
          const layout = cConf.add_rows[i];
          await blocks.selectedTemplate.locator(blocks.afterAddIndicatorRow).click();
          await blocks.selectColumnLayout(layout.id);
          await blocks
            .getElementById(id, ClickType.SECTION)
            .locator(blocks.rowNotAttrs)
            .nth(i + 1)
            .waitFor();
          await softExpect(blocks.selectedTemplate.locator(blocks.rowsInPreview)).toHaveCSS(
            "padding",
            cConf.expected.padding_row,
          );
          await softExpect(blocks.selectedTemplate.locator(blocks.columnsInPreview).first()).toHaveCSS(
            "--gutter",
            cConf.expected.gutter,
          );
          for (let index = 0; index < layout.columns.length; index++) {
            const expectedWidth = layout.columns[index] === 12 ? "100%" : new RegExp(`calc\\(${layout.columns[index]}`);
            // 12 is total column follow bootstrap
            await softExpect(blocks.selectedTemplate.locator(blocks.columnsInPreview).nth(index)).toHaveCSS(
              "--width",
              expectedWidth,
            );
          }
        }
      });
    });
  }

  test(`@SB_WEB_BUILDER_EL_27 Row_Check resize spacing giữa các column trong row (chỉ support desktop)`, async ({
    cConf,
    snapshotFixture,
  }) => {
    let sectionSelected: Locator;
    await test.step(`Click select vào row của section A`, async () => {
      const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(cConf.change_padding);
      sectionSelected = blocks.getElementById(id, ClickType.SECTION);
      await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
    });

    await test.step(`Hover vào adjust spacing`, async () => {
      await blocks.frameLocator.locator(blocks.spacingDot).first().hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: sectionSelected.locator(blocks.rowsInPreview),
        snapshotName: cConf.expected.snapshot_hover_gutter,
      });
    });

    await test.step(`Drag điều chỉnh spacing `, async () => {
      await blocks.resizeLayout({
        element: sectionSelected.locator(blocks.rowsInPreview),
        pointer: "spacing",
        width: cConf.expected.gutter,
        beforeUp: async () => {
          await snapshotFixture.verifyWithAutoRetry({
            page: blocks.page,
            selector: sectionSelected,
            snapshotName: cConf.expected.snapshot_resizing_gutter,
          });
        },
      });
      await softExpect(sectionSelected.locator(blocks.columnsInPreview).first()).toHaveCSS(
        "--gutter",
        `${cConf.expected.gutter}px`,
      );
      await softExpect(blocks.genLoc(blocks.getSelectorByLabel("layouts")).getByRole("paragraph")).toHaveText(
        `${cConf.expected.gutter}px`,
      );
    });

    await test.step(`Edit spacing bên sidebar`, async () => {
      await blocks.settingDesignAndContentWithSDK(cConf.change_spacing);
      await softExpect(sectionSelected.locator(blocks.columnsInPreview).first()).toHaveCSS(
        "--gutter",
        `${cConf.change_spacing.layouts.gutter}px`,
      );
    });
  });

  const confSettingAddQuickBarRow = loadData(__dirname, "ADD_QUICKBAR_ROW_DEVICE");
  for (let caseIndex = 0; caseIndex < confSettingAddQuickBarRow.caseConf.data.length; caseIndex++) {
    const data = confSettingAddQuickBarRow.caseConf.data[caseIndex];
    const isMobile = data.device === "mobile";
    test(`@${data.case_id} ${data.description}`, async ({ cConf, snapshotFixture, conf }) => {
      let sectionSelected: Locator;
      await test.step("Add section", async () => {
        if (isMobile) {
          await blocks.actionInPreviewTemplate("Mobile");
          await blocks.toastMessage.waitFor();
          await blocks.closeToastBtn.click();
        }

        const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
        sectionSelected = blocks.getElementById(id, ClickType.SECTION);
        await blocks.switchToTab("Design");
        await blocks.settingDesignAndContentWithSDK(cConf.change_padding);
        await blocks.backBtn.click();
      });

      await test.step(`Click select vào 1 row`, async () => {
        await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
      });

      await test.step(`Click vào button Add row trên quickbar`, async () => {
        await blocks.selectOptionOnQuickBar("Add row");
        await blocks.backBtn.hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: blocks.page,
          selector: blocks.frameLocator.locator(blocks.layoutPresetPopover),
          snapshotName: cConf.expected.snapshot_popover_layout,
        });
        await blocks.backBtn.click();
      });

      await test.step(`Click chọn 1 layout `, async () => {
        await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
        for (let i = 0; i < cConf.add_rows.length; i++) {
          const layout = cConf.add_rows[i];
          await blocks.selectOptionOnQuickBar("Add row");
          await blocks.selectColumnLayout(layout.id, true);
          await sectionSelected
            .locator(blocks.rowNotAttrs)
            .nth(i + 1)
            .waitFor();
          await softExpect(blocks.selectedTemplate.locator(blocks.rowsInPreview)).toHaveCSS(
            "padding",
            cConf.expected.padding_row,
          );
          await softExpect(blocks.selectedTemplate.locator(blocks.columnsInPreview).first()).toHaveCSS(
            "--gutter",
            cConf.expected.gutter,
          );

          for (let index = 0; index < layout.columns.length; index++) {
            const width = layout.columns[index];
            let expectedWidth = width === 12 ? "100%" : new RegExp(`calc\\(${width}`);
            if (conf.suiteConf.env === "prod") {
              expectedWidth = new RegExp(`${(width / 12) * 100}%`);
            }
            // 12 is total column follow bootstrap
            await softExpect(blocks.selectedTemplate.locator(blocks.columnsInPreview).nth(index)).toHaveCSS(
              "--width",
              expectedWidth,
            );
          }
        }
      });
    });
  }

  test(`@SB_WEB_BUILDER_EL_31 Row_Quick bar_Check hiển thị row khi click up/down button`, async ({
    context,
    cConf,
  }) => {
    let sectionSelected: Locator;
    await test.step("Add section", async () => {
      const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      sectionSelected = blocks.getElementById(id, ClickType.SECTION);
      await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
    });

    for (let i = 0; i < cConf.add_rows.length; i++) {
      const row = cConf.add_rows[i];
      await test.step("Add row", async () => {
        if (row.layout) {
          await blocks.selectedTemplate.locator(blocks.afterAddIndicatorRow).click();
          await blocks.selectColumnLayout(row.layout);
          await sectionSelected.locator(blocks.rowNotAttrs).nth(i).waitFor();
        }

        await blocks.settingDesignAndContentWithSDK(row.default_design);
      });
    }

    await test.step(`Click select row đầu tiên trong section A`, async () => {
      await blocks.backBtn.click();
      await sectionSelected
        .locator(blocks.rowsInPreview)
        .first()
        .click({ position: { x: 10, y: 5 } });
      await blocks.backBtn.hover();
      await expect(blocks.quickBarButton("Add row")).toBeVisible();
      await expect(blocks.quickBarButton("Move up")).toBeVisible();
      await expect(blocks.quickBarButton("Move up")).toHaveClass(/disabled/);
      await expect(blocks.quickBarButton("Move down")).toBeVisible();
      await expect(blocks.quickBarButton("Move down")).toBeEnabled();
      await expect(blocks.quickBarButton("Duplicate")).toBeVisible();
      await expect(blocks.quickBarButton("Delete")).toBeVisible();
    });

    await test.step(`Click Down button`, async () => {
      await blocks.selectOptionOnQuickBar("Move down");
      const color3 = await getStyle(
        blocks.frameLocator.locator(blocks.previewWebFront),
        cConf.expected.background.row1,
      );
      await softExpect(sectionSelected.locator(blocks.rowsInPreview).nth(1)).toHaveCSS(
        "background-color",
        `rgb(${color3})`,
      );
      await blocks.backBtn.hover();
      await expect(blocks.quickBarButton("Add row")).toBeVisible();
      await expect(blocks.quickBarButton("Move up")).toBeVisible();
      await expect(blocks.quickBarButton("Move up")).toBeEnabled();
      await expect(blocks.quickBarButton("Move down")).toBeVisible();
      await expect(blocks.quickBarButton("Move down")).toHaveClass(/disabled/);
      await expect(blocks.quickBarButton("Duplicate")).toBeVisible();
      await expect(blocks.quickBarButton("Delete")).toBeVisible();
      await blocks.backBtn.click();
    });

    await test.step(`Tại web front: mở setting của row 1 trong section 1, click Up button trên quick bar`, async () => {
      await sectionSelected
        .locator(blocks.rowsInPreview)
        .nth(1)
        .click({ position: { x: 10, y: 5 } });
      await blocks.selectOptionOnQuickBar("Move up");
      await blocks.backBtn.hover();
      await expect(blocks.quickBarButton("Add row")).toBeVisible();
      await expect(blocks.quickBarButton("Move up")).toBeVisible();
      await expect(blocks.quickBarButton("Move up")).toHaveClass(/disabled/);
      await expect(blocks.quickBarButton("Move down")).toBeVisible();
      await expect(blocks.quickBarButton("Move down")).toBeEnabled();
      await expect(blocks.quickBarButton("Duplicate")).toBeVisible();
      await expect(blocks.quickBarButton("Delete")).toBeVisible();
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      const colors = await Promise.all([
        getStyle(webfront.locator(blocks.defaultLayoutSF), cConf.expected.background.row1),
        getStyle(webfront.locator(blocks.defaultLayoutSF), cConf.expected.background.row2),
      ]);
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        await softExpect(webfront.locator(blocks.rowsInPreview).nth(i)).toHaveCSS("background-color", `rgb(${color})`);
      }
      await webfront.close();
    });
  });

  test(`@SB_WEB_BUILDER_EL_32 Row_Quick bar_Check hiển thị khi click duplicate button`, async ({ cConf, context }) => {
    let sectionSelected: Locator;
    let color3: string;
    await test.step("Add section", async () => {
      const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      sectionSelected = blocks.getElementById(id, ClickType.SECTION);
    });

    await test.step(`Tại web front: mở setting của row đầu tiên trong setcion 1`, async () => {
      await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
      await blocks.settingDesignAndContentWithSDK(cConf.change_design);
    });

    await test.step(`Click duplicate button`, async () => {
      await blocks.selectOptionOnQuickBar("Duplicate");
      color3 = await getStyle(blocks.frameLocator.locator(blocks.previewWebFront), "--color-3");
      await softExpect(sectionSelected.locator(blocks.rowsInPreview).nth(1)).toHaveCSS(
        "background-color",
        `rgb(${color3})`,
      );
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      const rows = await webfront.locator(blocks.rowsInPreview).all();
      for (let i = 0; i < rows.length; i++) {
        await softExpect(rows[i]).toHaveCSS("background-color", `rgb(${color3})`);
      }
      await webfront.close();
    });
  });

  test(`@SB_WEB_BUILDER_EL_33 Row_Quick bar_Check hiển thị row khi click delete button`, async ({ context, cConf }) => {
    let rows: Locator;
    await test.step("Add section", async () => {
      const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
      const sectionSelected = blocks.getElementById(id, ClickType.SECTION);
      rows = sectionSelected.locator(blocks.rowsInPreview);
      await rows.click({ position: { x: 10, y: 5 } });
    });

    for (let i = 0; i < cConf.add_rows.length; i++) {
      const row = cConf.add_rows[i];
      await test.step("Add row", async () => {
        if (row.layout) {
          await blocks.selectedTemplate.locator(blocks.afterAddIndicatorRow).click();
          await blocks.selectColumnLayout(row.layout);
          await rows.nth(i).waitFor();
        }

        await blocks.settingDesignAndContentWithSDK(row.default_design);
      });
    }

    await test.step("Save changes", async () => {
      await blocks.backBtn.click();
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        onlyClickSave: true,
      });
    });

    await test.step(`Tại web front: mở setting của row đầu tiên trong setcion 1`, async () => {
      await rows.first().click({ position: { x: 10, y: 5 } });
    });

    await test.step(`click delete`, async () => {
      await blocks.selectOptionOnQuickBar("Delete");
      await softExpect(rows).toHaveCount(cConf.expected.total_row);
      const color = await getStyle(blocks.frameLocator.locator(blocks.previewWebFront), cConf.expected.color_row_2);
      await softExpect(rows).toHaveCSS("background-color", `rgb(${color})`);
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      const webfront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        isNextStep: true,
      });
      await softExpect(webfront.locator(blocks.rowsInPreview)).toHaveCount(cConf.expected.total_row);
      const color = await getStyle(webfront.locator(blocks.defaultLayoutSF), cConf.expected.color_row_2);
      await softExpect(webfront.locator(blocks.rowsInPreview)).toHaveCSS("background-color", `rgb(${color})`);
    });
  });

  const confRowMarginPadding = loadData(__dirname, "ROW_MARGIN_PADDING");
  for (let caseIndex = 0; caseIndex < confRowMarginPadding.caseConf.data.length; caseIndex++) {
    const data = confRowMarginPadding.caseConf.data[caseIndex];
    test(`@${data.case_id} ${data.description}`, async ({ cConf }) => {
      let sectionSelected: Locator;
      await test.step("Add section", async () => {
        const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
        sectionSelected = blocks.getElementById(id, ClickType.SECTION);
        await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
      });

      for (let i = 0; i < cConf.add_rows.length; i++) {
        const row = cConf.add_rows[i];
        await test.step("Add row", async () => {
          if (row.layout) {
            await blocks.selectedTemplate.locator(blocks.afterAddIndicatorRow).click();
            await blocks.selectColumnLayout(row.layout);
            await sectionSelected.locator(blocks.rowNotAttrs).nth(i).waitFor();
          }

          await blocks.settingDesignAndContentWithSDK(row.default_design);
        });
      }

      const rows = await sectionSelected.locator(blocks.rowsInPreview).all();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowName = `row ${cConf.section_name[i]}`;
        await test.step(`Select vào ${rowName} rồi hover vào ${data.type} top/bottom/left/right của ${rowName}`, async () => {
          await blocks.backBtn.click();
          for (let index = 0; index < cConf.hover.length; index++) {
            await row.click({ position: { x: 10, y: 5 } });
            const hover = cConf.hover[index];
            const result = await blocks.hoverPaddingMarginResizer(data.type, hover.position);
            await softExpect(result.resizer).toHaveCSS("opacity", cConf.expected.opacity);
            for (let hoverIndex = 0; hoverIndex < hover.tooltip.length; hoverIndex++) {
              softExpect(result.tooltip).toEqual(hover.tooltip[i]);
            }
          }
        });

        await test.step(`Edit ${data.type} top/bottom của ${rowName} = 80px bằng việc kéo thả ${data.type} line`, async () => {
          for (let index = 0; index < cConf.resize_spacing.length; index++) {
            const position = cConf.resize_spacing[index];
            await blocks.editPaddingMarginByMouseGesture({
              element: row,
              type: data.type,
              position,
              value: cConf.expected.spacing_top_bottom,
            });
            let actual = row;
            if (data.type === "margin") {
              actual = blocks.selectedTemplate.and(blocks.rowNotAttrs);
            }

            await softExpect(actual).toHaveCSS(`${data.type}-${position}`, `${cConf.expected.spacing_top_bottom}px`);
          }
          await softExpect(blocks.genLoc(blocks.getSelectorByLabel(data.type)).getByRole("textbox")).toHaveValue(
            cConf.expected.spacing_top_bottom_design[i],
          );
        });

        await test.step(`Edit ${data.type} left/right của ${rowName} bằng việc edit bên sidebar setting`, async () => {
          const design = cConf.change_designs[i];
          await blocks.settingDesignAndContentWithSDK(design);
          for (let index = 0; index < cConf.change_spacing.length; index++) {
            const position = cConf.change_spacing[index];
            let actual = row;
            if (data.type === "margin") {
              actual = blocks.selectedTemplate.and(blocks.rowNotAttrs);
            }

            await softExpect(actual).toHaveCSS(`${data.type}-${position}`, cConf.expected.spacing_left_right);
          }
        });

        await test.step(`Hover vào ${data.type} left/right của ${rowName}`, async () => {
          for (let index = 0; index < cConf.change_spacing.length; index++) {
            const position = cConf.change_spacing[index];
            const result = await blocks.hoverPaddingMarginResizer(data.type, position);
            softExpect(result.tooltip).toEqual(cConf.expected.spacing_left_right);
          }
        });
      }
    });
  }

  test(`@SB_WEB_BUILDER_EL_38 Column_Quickbar_Check click add column ở màn desktop`, async ({
    conf,
    cConf,
    snapshotFixture,
  }) => {
    let newColId: string;
    const expected = cConf.expected;

    await test.step("Pre-condition: Add section with 2:1 layout", async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_2_1);
    });

    await test.step(`Click select column 1 trong row của section A`, async () => {
      await firstCol.click(edgePosition);
    });

    await test.step("Verify after selected column 1", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.frameLocator.locator(blocks.quickBarLoc)).toBeVisible();
      await softExpect(blocks.getResizePointerLayout("left")).toBeHidden();
      await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
      await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeVisible();
      await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeVisible();
    });

    await test.step(`Click select column 2 trong row của section A
  Click button add column ở quickbar setting `, async () => {
      await secondCol.click(edgePosition);
      newColId = await blocks.selectOptionOnQuickBar("Add column");
    });

    await test.step("Verify new column", async () => {
      const columnsWidth = [];
      const newCol = thirdCol.filter({ has: blocks.genLoc(`[data-column-id="${newColId}"]`) });
      await softExpect(newCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
        expected.first_add_column_count,
      );
      for (const column of await blocks.frameLocator.locator(blocks.columnsInPreview).all()) {
        const columnWidth = await column.evaluate(ele => ele.clientWidth);
        columnsWidth.push(columnWidth);
      }
      for (let i = 1; i < columnsWidth.length; i++) {
        softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
      }
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 3 trong row của section A
  Click button add column ở quickbar setting `, async () => {
      await thirdCol.click(edgePosition);
      newColId = await blocks.selectOptionOnQuickBar("Add column");
    });

    await test.step("Verify new column", async () => {
      const columnsWidth = [];
      const newCol = fourthCol.filter({ has: blocks.genLoc(`[data-column-id="${newColId}"]`) });
      await softExpect(newCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
        expected.second_add_column_count,
      );
      for (const column of await blocks.frameLocator.locator(blocks.columnsInPreview).all()) {
        const columnWidth = await column.evaluate(ele => ele.clientWidth);
        columnsWidth.push(columnWidth);
      }
      for (let i = 1; i < columnsWidth.length; i++) {
        softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
      }
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 3 trong row`, async () => {
      await thirdCol.click(edgePosition);
    });

    await test.step("Verify add column button in quickbar is disabled", async () => {
      await softExpect(thirdCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.selectedTemplate.locator(blocks.beforeAddIndicator)).toHaveClass(
        new RegExp(expected.disabled),
      );
      await softExpect(blocks.selectedTemplate.locator(blocks.afterAddIndicator)).toHaveClass(
        new RegExp(expected.disabled),
      );
      await softExpect(blocks.quickBarButton("Add column")).toHaveClass(new RegExp(expected.disabled));
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
        await column.click(edgePosition);
        await blocks.selectedTemplate.locator(blocks.addBlockBtn).click();
        await blocks.getTemplatePreviewByName("Paragraph").click();
        const blockId = await blocks.templateTitle.filter({ hasText: "Paragraph" }).getAttribute("data-id");
        if (await blocks.frameLocator.locator(blocks.quickBarLoc).isHidden()) {
          await blocks.backBtn.click();
          await blocks.clickElementById(blockId, ClickType.BLOCK);
        }
        await blocks.selectOptionOnQuickBar("Edit text");
        await blocks.textEditor.waitFor();
        await blocks.page.keyboard.press("Control+A");
        await blocks.textEditor.fill(`Column index: ${i}`);
        await blocks.titleBar.click();
        await blocks.textEditor.waitFor({ state: "hidden" });
      }
      await blocks.backBtn.click();
      previewPage = await blocks.clickSaveAndGoTo("Preview");
    });

    await test.step("Verify columns in preview", async () => {
      storeFront = new SFWebBuilder(previewPage, conf.suiteConf.domain);
      await softExpect(storeFront.sections.first()).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: storeFront.sections.first(),
        snapshotName: expected.column_in_preview_after_edited_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_EL_39 Column_Quickbar_Check click add column ở màn mobile`, async ({
    pageMobile,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    let newColId: string;
    const expected = cConf.expected;

    await test.step("Pre-condition: Add section has 2 columns and switch to mobile", async () => {
      await blocks.clickBtnNavigationBar("mobile");
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_1);
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 1 trong row`, async () => {
      await firstCol.click(edgePosition);
    });

    await test.step("Verify after selected column 1", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.frameLocator.locator(blocks.quickBarLoc)).toBeVisible();
      await softExpect(blocks.getResizePointerLayout("left")).toBeVisible();
      await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
      await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeHidden();
      await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeHidden();
    });

    await test.step(`Click select column 2 trong row của section A
  Click button add column ở quickbar setting `, async () => {
      await secondCol.click(edgePosition);
      newColId = await blocks.selectOptionOnQuickBar("Add column");
    });

    await test.step("Verify new column", async () => {
      const columnsWidth = [];
      const newCol = thirdCol.filter({ has: blocks.genLoc(`[data-column-id="${newColId}"]`) });
      await softExpect(newCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
        expected.first_add_column_count,
      );
      for (const column of await blocks.frameLocator.locator(blocks.columnsInPreview).all()) {
        const columnWidth = await column.evaluate(ele => ele.clientWidth);
        columnsWidth.push(columnWidth);
      }
      for (let i = 1; i < columnsWidth.length; i++) {
        softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
      }
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 3 trong row của section A
  Click button add column ở quickbar setting `, async () => {
      await thirdCol.click(edgePosition);
      newColId = await blocks.selectOptionOnQuickBar("Add column");
    });

    await test.step("Verify new column", async () => {
      const columnsWidth = [];
      const newCol = fourthCol.filter({ has: blocks.genLoc(`[data-column-id="${newColId}"]`) });
      await softExpect(newCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
        expected.second_add_column_count,
      );
      for (const column of await blocks.frameLocator.locator(blocks.columnsInPreview).all()) {
        const columnWidth = await column.evaluate(ele => ele.clientWidth);
        columnsWidth.push(columnWidth);
      }
      for (let i = 1; i < columnsWidth.length; i++) {
        softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
      }
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 1 trong row`, async () => {
      await firstCol.click(edgePosition);
    });

    await test.step("Verify add column button in quickbar is disabled", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Add column")).toHaveClass(new RegExp(expected.disabled));
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
        await column.click(edgePosition);
        await blocks.selectedTemplate.locator(blocks.addBlockBtn).click();
        await blocks.getTemplatePreviewByName("Paragraph").click();
        const blockId = await blocks.templateTitle.filter({ hasText: "Paragraph" }).getAttribute("data-id");
        if (await blocks.frameLocator.locator(blocks.quickBarLoc).isHidden()) {
          await blocks.backBtn.click();
          await blocks.clickElementById(blockId, ClickType.BLOCK);
        }
        await blocks.selectOptionOnQuickBar("Edit text");
        await blocks.textEditor.waitFor();
        await blocks.page.keyboard.press("Control+A");
        await blocks.textEditor.fill(`Column index: ${i}`);
        await blocks.titleBar.click();
        await blocks.textEditor.waitFor({ state: "hidden" });
      }
      await blocks.backBtn.click();
      previewPage = await blocks.clickSaveAndGoTo("Preview");
    });

    await test.step("Verify columns in preview", async () => {
      storeFront = new SFWebBuilder(pageMobile, conf.suiteConf.domain);
      await storeFront.page.goto(previewPage.url());
      await previewPage.close();
      await softExpect(storeFront.sections.first()).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: storeFront.sections.first(),
        snapshotName: expected.column_in_preview_mobile_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_EL_40 Column_Quick bar_Check di chuyển vị trí các column ở desktop`, async ({
    cConf,
    conf,
    snapshotFixture,
  }) => {
    let colId: string;
    const expected = cConf.expected;

    await test.step("Pre-condition: add section with 3 columns", async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_2_1);
    });

    await test.step(`Click vào select vào column 1 của row trong section A`, async () => {
      await firstCol.click(edgePosition);
      colId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
    });

    await test.step("Verify column state", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
      await softExpect(blocks.getResizePointerLayout("left")).toBeHidden();
      await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
      await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeVisible();
      await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeVisible();
    });

    await test.step(`Click button Move Right của column 1`, async () => {
      await blocks.selectOptionOnQuickBar("Move right");
    });

    await test.step("Verify new position and button in quickbar", async () => {
      const newColPosition = secondCol.filter({ has: blocks.genLoc(`[data-column-id="${colId}"]`) });
      await softExpect(newColPosition).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move left")).not.toHaveClass(new RegExp(expected.disabled));
    });

    await test.step(`Click button Move Right của column 1`, async () => {
      await blocks.selectOptionOnQuickBar("Move right");
    });

    await test.step("Verify new position and button in quickbar", async () => {
      const newColPosition = thirdCol.filter({ has: blocks.genLoc(`[data-column-id="${colId}"]`) });
      await softExpect(newColPosition).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move right")).toHaveClass(new RegExp(expected.disabled));
    });

    await test.step(`Click button Move Left của column 1`, async () => {
      await blocks.selectOptionOnQuickBar("Move left");
    });

    await test.step("Verify new position and button in quickbar", async () => {
      const newColPosition = secondCol.filter({ has: blocks.genLoc(`[data-column-id="${colId}"]`) });
      await softExpect(newColPosition).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move right")).not.toHaveClass(new RegExp(expected.disabled));
    });

    await test.step(`Click button Move Left của column 1`, async () => {
      await blocks.selectOptionOnQuickBar("Move left");
    });

    await test.step("Verify new position and button in quickbar", async () => {
      const newColPosition = firstCol.filter({ has: blocks.genLoc(`[data-column-id="${colId}"]`) });
      await softExpect(newColPosition).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
        await column.click(edgePosition);
        await blocks.settingDesignAndContentWithSDK(cConf.edit_border[i]);
      }
      await blocks.backBtn.click();
      await thirdCol.click(edgePosition);
      await blocks.page.keyboard.press("ArrowLeft");
      previewPage = await blocks.clickSaveAndGoTo("Preview");
    });

    await test.step("Verify columns in preview", async () => {
      storeFront = new SFWebBuilder(previewPage, conf.suiteConf.domain);
      await storeFront.page.goto(previewPage.url());
      await softExpect(storeFront.sections.first()).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: storeFront.sections.first(),
        snapshotName: expected.column_in_preview_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_EL_44 Column_Quick bar_Check delete column`, async ({ cConf, conf }) => {
    let currentColId: string;
    const expected = cConf.expected;

    await test.step("Pre-condition: add section with layout 1:2:1", async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_2_1);
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 1 trong row của section A`, async () => {
      await firstCol.click(edgePosition);
      currentColId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
    });

    await test.step("Verify column state", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
      await softExpect(blocks.getResizePointerLayout("left")).toBeHidden();
      await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
      await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeVisible();
      await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeVisible();
    });

    await test.step(`Click Delete column trên quickbar `, async () => {
      await blocks.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify column is deleted", async () => {
      const columnsWidth = [];
      await softExpect(blocks.getElementById(currentColId, ClickType.COLUMN)).toBeHidden();
      await softExpect(blocks.getElementById(currentColId, ClickType.COLUMN)).not.toBeAttached();
      await softExpect(columnsInPreview).toHaveCount(expected.columns_after_first_deleted);
      for (const column of await columnsInPreview.all()) {
        const columnWidth = await column.evaluate(ele => ele.clientWidth);
        columnsWidth.push(columnWidth);
      }
      for (let i = 1; i < columnsWidth.length; i++) {
        softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
      }
    });

    await test.step(`Click Delete các column còn lại `, async () => {
      await firstCol.click(edgePosition);
      currentColId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
      await blocks.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify column is deleted", async () => {
      const columnWidth = await firstCol.evaluate(ele => ele.clientWidth);
      const rowWidth = await firstRow.evaluate(ele => ele.clientWidth);
      await softExpect(blocks.getElementById(currentColId, ClickType.COLUMN)).toBeHidden();
      await softExpect(blocks.getElementById(currentColId, ClickType.COLUMN)).not.toBeAttached();
      await softExpect(columnsInPreview).toHaveCount(expected.columns_after_second_deleted);
      softExpect(columnWidth).toEqual(rowWidth);
    });

    await test.step(`Click Delete các column còn lại `, async () => {
      await firstCol.click(edgePosition);
      await blocks.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify section is deleted too", async () => {
      await softExpect(firstSection).toBeHidden();
      await softExpect(firstSection).not.toBeAttached();
    });

    await test.step(`nhấn save > nhấn preview button`, async () => {
      previewPage = await blocks.clickSaveAndGoTo("Preview");
    });

    await test.step("Verify no section in preview", async () => {
      storeFront = new SFWebBuilder(previewPage, conf.suiteConf.domain);
      const firstSectionSF = storeFront.sections.first();
      await softExpect(firstSectionSF).toBeHidden();
      await softExpect(firstSectionSF).not.toBeAttached();
    });
  });

  test(`@SB_WEB_BUILDER_EL_45 Column_Check resize column ở desktop`, async ({ cConf }) => {
    const expected = cConf.expected;

    await test.step("Pre-condition: add section with layout 1:1", async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_1);
      await blocks.changeDesign(cConf.full_width_on);
      await blocks.backBtn.click();
      await blocks.resizeLayout({
        element: firstRow,
        pointer: "spacing",
        width: cConf.min_spacing,
      });
      await blocks.backBtn.click();
    });

    await test.step(`Click select column 1 trong row`, async () => {
      await firstCol.click(edgePosition);
    });

    await test.step("Verify column state", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
      await softExpect(blocks.getResizePointerLayout("left")).toBeHidden();
      await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
      await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeVisible();
      await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeVisible();
    });

    await test.step(`Resize width column 1 sang bên phải thêm 1grid (grid system 12 columns)`, async () => {
      await blocks.resizeLayout({ element: firstCol, pointer: "right", grid: cConf.increase_1_grid });
    });

    const oneGridPx = await firstRow.evaluate(ele => ele.clientWidth / 12);
    await test.step("Verify columns after resize", async () => {
      const firstColExpectedWidth = Math.floor(oneGridPx * expected.first_resize.first_column_grid);
      const firstColWidth = Math.floor(await firstCol.evaluate(ele => ele.getBoundingClientRect().width));
      const secondColExpectedWidth = Math.floor(oneGridPx * expected.first_resize.second_column_grid);
      const secondColWidth = Math.floor(await secondCol.evaluate(ele => ele.getBoundingClientRect().width));
      softExpect(firstColWidth).toEqual(firstColExpectedWidth);
      softExpect(secondColWidth).toEqual(secondColExpectedWidth);
      await blocks.backBtn.click();
    });

    await test.step(`Resize column 1 sang bên phải đến khi width của column 2 có layout = 2grid của grid system 12 columns`, async () => {
      await blocks.resizeLayout({ element: firstCol, pointer: "right", grid: cConf.max_grid });
    });

    await test.step("Verify columns after resize", async () => {
      const firstColExpectedWidth = oneGridPx * expected.second_resize.first_column_grid;
      const firstColWidth = await firstCol.evaluate(ele => ele.clientWidth);
      const secondColExpectedWidth = oneGridPx * expected.second_resize.second_column_grid;
      const secondColWidth = await secondCol.evaluate(ele => ele.clientWidth);
      softExpect(firstColWidth).toEqual(firstColExpectedWidth);
      softExpect(secondColWidth).toEqual(secondColExpectedWidth);
      await blocks.backBtn.click();
    });

    await test.step(`Select column 1
  Click button Add column phía bên phải của col 1 `, async () => {
      await firstCol.click(edgePosition);
      await blocks.selectedTemplate.locator(blocks.afterAddIndicator).click();
    });

    await test.step("Verify new column added and columns width are the same", async () => {
      const columnsWidth = [];
      await softExpect(columnsInPreview).toHaveCount(expected.column_count_after_added);
      for (const column of await columnsInPreview.all()) {
        const columnWidth = await column.evaluate(ele => ele.clientWidth);
        columnsWidth.push(columnWidth);
      }
      for (let i = 1; i < columnsWidth.length; i++) {
        softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
      }
      await blocks.backBtn.click();
    });

    await test.step(`Resize column 2 sang bên phải đến khi width của column 2 có layout 2grid của grid system 12 columns`, async () => {
      await blocks.resizeLayout({ element: secondCol, pointer: "right", grid: cConf.min_grid });
    });

    await test.step("Verify columns after resize", async () => {
      const firstColExpectedWidth = oneGridPx * expected.third_resize.first_column_grid;
      const firstColWidth = await firstCol.evaluate(ele => ele.clientWidth);
      const secondColExpectedWidth = oneGridPx * expected.third_resize.second_column_grid;
      const secondColWidth = await secondCol.evaluate(ele => ele.clientWidth);
      const thirdColExpectedWidth = oneGridPx * expected.third_resize.third_column_grid;
      const thirdColWidth = await thirdCol.evaluate(ele => ele.clientWidth);
      softExpect(firstColWidth).toEqual(firstColExpectedWidth);
      softExpect(secondColWidth).toEqual(secondColExpectedWidth);
      softExpect(thirdColWidth).toEqual(thirdColExpectedWidth);
    });
  });

  test(`@SB_WEB_BUILDER_EL_46 Column_Check resize column ở mobile`, async ({ cConf, snapshotFixture }) => {
    const expected = cConf.expected;

    await test.step("Pre-condition: add section with layout 1:1:1", async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_1_1);
      for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
        await column.click(edgePosition);
        await blocks.settingDesignAndContentWithSDK(cConf.edit_border[i]);
      }
      await blocks.backBtn.click();
      await blocks.resizeLayout({
        element: firstRow,
        pointer: "spacing",
        width: cConf.min_spacing,
      });
      await blocks.backBtn.click();
    });

    await test.step(`Switch sang màn mobile`, async () => {
      await blocks.clickBtnNavigationBar("mobile");
    });

    await test.step("Verify column width = 100% row - 2*default padding", async () => {
      const rowWidth = await firstRow.evaluate(ele => ele.getBoundingClientRect().width);
      for (const column of await columnsInPreview.all()) {
        const columnWidth = await column.evaluate(ele => ele.getBoundingClientRect().width);
        softExpect(columnWidth).toEqual(rowWidth - 2 * cConf.default_padding);
      }
    });

    await test.step(`Click select column 1 trong row`, async () => {
      await firstCol.click(edgePosition);
    });

    await test.step("Verify column state", async () => {
      await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
      await softExpect(blocks.getResizePointerLayout("left")).toBeVisible();
      await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
      await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeHidden();
      await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeHidden();
      await blocks.backBtn.click();
    });

    await test.step(`Resize width của column 1 `, async () => {
      await blocks.resizeLayout({ element: firstCol, pointer: "left", grid: cConf.first_column_resize_grid_1 });
    });

    await test.step("Verify column after resize", async () => {
      await blocks.backBtn.click();
      await blocks.titleBar.hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: firstSection,
        snapshotName: expected.first_resize_snapshot,
      });
    });

    await test.step(`- Click select column 2 trong row
  - Resize width của column 2`, async () => {
      await secondCol.click(edgePosition);
      await blocks.resizeLayout({ element: secondCol, pointer: "right", grid: cConf.second_column_resize_grid_1 });
    });

    await test.step("Verify column after resize", async () => {
      await blocks.backBtn.click();
      await blocks.titleBar.hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: firstSection,
        snapshotName: expected.second_resize_snapshot,
      });
    });

    await test.step(`Resize width của column 2`, async () => {
      await blocks.resizeLayout({ element: secondCol, pointer: "right", grid: cConf.second_column_resize_grid_2 });
    });

    await test.step("Verify column after resize", async () => {
      await blocks.backBtn.click();
      await blocks.titleBar.hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: firstSection,
        snapshotName: expected.third_resize_snapshot,
      });
    });

    await test.step(`Resize width của column 1 `, async () => {
      await blocks.resizeLayout({ element: firstCol, pointer: "left", grid: cConf.first_column_resize_grid_2 });
    });

    await test.step("Verify column after resize", async () => {
      await blocks.backBtn.click();
      await blocks.titleBar.hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: firstSection,
        snapshotName: expected.fourth_resize_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_EL_47 Column_Check edit padding của column`, async ({ cConf }) => {
    const expected = cConf.expected;
    const paddingSidebar = blocks.genLoc(blocks.getSelectorByLabel("padding")).getByRole("textbox");
    const contentFirstCol = firstCol.locator(blocks.emptyCol);
    const contentSecondCol = secondCol.locator(blocks.emptyCol);

    await test.step("Pre-condition: add section with layout 2:1", async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_section_2_1);
      await blocks.backBtn.click();
      await blocks.expandCollapseLayer({ sectionName: "2:1", isExpand: true });
      for (const [i] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
        await blocks.openLayerSettings({ sectionName: "2:1", subLayerName: "Column", subLayerIndex: i + 1 });
        await blocks.settingDesignAndContentWithSDK(cConf.edit_border_padding[i]);
        await blocks.backBtn.click();
      }
    });

    const contentFirstColWidth = await contentFirstCol.evaluate(ele => ele.getBoundingClientRect().width);
    const contentSecondColWidth = await contentSecondCol.evaluate(ele => ele.getBoundingClientRect().width);
    const contentFirstColHeight = await contentFirstCol.evaluate(ele => ele.clientHeight);
    const contentSecondColHeight = await contentSecondCol.evaluate(ele => ele.clientHeight);

    for (const position of cConf.padding_column_positions) {
      await test.step(`- Select vào column A
  - Hover vào padding ${position} của column A`, async () => {
        await firstCol.click(edgePosition);
        await blocks.hoverPaddingMarginResizer("padding", position);
      });

      await test.step("Verify tooltip value and padding line", async () => {
        await expect(blocks.getPaddingMarginResizer("padding", position)).toHaveCSS("opacity", "1");
      });
    }

    await test.step(`Edit padding top/bottom của column A = 80px bằng việc kéo thả padding line`, async () => {
      await blocks.editPaddingMarginByMouseGesture({
        element: firstCol,
        type: "padding",
        position: cConf.padding_column_positions[0],
        value: cConf.edit_padding_top,
      });
      await blocks.editPaddingMarginByMouseGesture({
        element: firstCol,
        type: "padding",
        position: cConf.padding_column_positions[1],
        value: cConf.edit_padding_bottom,
      });
    });

    await test.step("Verify padding in sidebar", async () => {
      const expectedColHeight =
        contentFirstColHeight + cConf.edit_padding_bottom + cConf.edit_padding_top + 2 * cConf.border_column_1;
      await softExpect(paddingSidebar).toHaveValue(expected.first_column.padding_top_bottom_sidebar_after_edited);
      await softExpect(firstCol).toHaveCSS("height", `${expectedColHeight}px`);
    });

    await test.step(`Edit padding left/right của column A bằng việc edit bên sidebar setting`, async () => {
      await blocks.editPaddingMarginByMouseGesture({
        element: firstCol,
        type: "padding",
        position: cConf.padding_column_positions[2],
        value: cConf.edit_padding_left,
      });
      await blocks.editPaddingMarginByMouseGesture({
        element: firstCol,
        type: "padding",
        position: cConf.padding_column_positions[3],
        value: cConf.edit_padding_right,
      });
    });

    await test.step("Verify padding in sidebar", async () => {
      const expectedContentWidth = contentFirstColWidth - cConf.edit_padding_left - cConf.edit_padding_right;
      await softExpect(paddingSidebar).toHaveValue(expected.first_column.padding_left_right_sidebar_after_edited);
      //Sai số giữa các môi trường
      await verifyWidthHeightCSSInRange(contentFirstCol, "width", {
        min: expectedContentWidth - 1,
        max: expectedContentWidth + 1,
      });
    });

    for (const position of cConf.padding_column_positions) {
      await test.step(`- Select vào column A
  - Hover vào padding ${position} của column A`, async () => {
        await firstCol.click(edgePosition);
        await blocks.hoverPaddingMarginResizer("padding", position);
      });

      await test.step("Verify tooltip value and padding line", async () => {
        await expect(blocks.getPaddingMarginResizer("padding", position)).toHaveCSS("opacity", "1");
        await expect(blocks.getPaddingMarginResizer("padding", position)).toHaveCSS(
          cConf.padding_css[position],
          `${cConf[`edit_padding_${position}`]}px`,
        );
      });
    }

    await test.step(`Edit padding top/bottom của column B = 80px bằng việc kéo thả padding line`, async () => {
      await blocks.editPaddingMarginByMouseGesture({
        element: secondCol,
        type: "padding",
        position: cConf.padding_column_positions[0],
        value: cConf.edit_padding_top,
      });
      await blocks.editPaddingMarginByMouseGesture({
        element: secondCol,
        type: "padding",
        position: cConf.padding_column_positions[1],
        value: cConf.edit_padding_bottom,
      });
    });

    await test.step("Verify padding in sidebar", async () => {
      const expectedColHeight =
        contentSecondColHeight + cConf.edit_padding_bottom + cConf.edit_padding_top + 2 * cConf.border_column_1;
      await softExpect(paddingSidebar).toHaveValue(expected.second_column.padding_top_bottom_sidebar_after_edited);
      await softExpect(secondCol).toHaveCSS("height", `${expectedColHeight}px`);
    });

    await test.step(`Edit padding left/right của column B bằng việc edit bên sidebar setting`, async () => {
      await blocks.editPaddingMarginByMouseGesture({
        element: secondCol,
        type: "padding",
        position: cConf.padding_column_positions[2],
        value: cConf.edit_padding_left,
      });
      await blocks.editPaddingMarginByMouseGesture({
        element: secondCol,
        type: "padding",
        position: cConf.padding_column_positions[3],
        value: cConf.edit_padding_right,
      });
    });

    await test.step("Verify padding in sidebar", async () => {
      const expectedContentWidth =
        contentSecondColWidth + 2 * (cConf.padding_left_default_column_2 - cConf.edit_padding_left);
      await softExpect(paddingSidebar).toHaveValue(expected.second_column.padding_left_right_sidebar_after_edited);
      //Sai số giữa các môi trường
      await verifyWidthHeightCSSInRange(contentSecondCol, "width", {
        min: expectedContentWidth - 1,
        max: expectedContentWidth + 1,
      });
    });
  });
});

/**
 * Update bỏ resize section, row -> bỏ case khỏi RC
 */
// test(`@SB_WEB_BUILDER_EL_17 Section_Check resize section`, async ({ cConf }) => {
//   await test.step("Add sections", async () => {
//     for (let i = 0; i < cConf.designs.length; i++) {
//       const design = cConf.designs[i];
//       await blocks.dragAndDropInWebBuilder(Object.assign({ to: { position: { section: i } } }, cConf.dnd_section));
//       await blocks.changeDesign(design);
//       await blocks.backBtn.click();
//     }
//   });

//   for (let i = 0; i < cConf.resizes.length; i++) {
//     await test.step(`Click select section ${
//       i + 1
//     } và hover vào resize indicator của section, drag resize indicator`, async () => {
//       const height = cConf.resizes[i];
//       const section = blocks.frameLocator.locator(blocks.sectionsInPreview).nth(i);
//       const id = await section.getAttribute("data-section-id");
//       await blocks.clickElementById(id, ClickType.SECTION);
//       const sectionWrap = blocks.frameLocator.locator(`[id="${id}"]`);
//       await softExpect(sectionWrap).toHaveClass(/wb-content-selected/);
//       await softExpect(sectionWrap.locator(blocks.beforeIndicatorResize)).toBeVisible();
//       await softExpect(sectionWrap.locator(blocks.afterIndicatorResize)).toBeVisible();
//       await softExpect(sectionWrap.locator(blocks.beforeAddIndicator)).toBeVisible();
//       await softExpect(sectionWrap.locator(blocks.beforeAddIndicator)).toHaveCSS(
//         "margin-bottom",
//         cConf.expected.space_add_with_resize,
//       );
//       await softExpect(sectionWrap.locator(blocks.afterAddIndicator)).toBeVisible();
//       await softExpect(sectionWrap.locator(blocks.afterAddIndicator)).toHaveCSS(
//         "margin-top",
//         cConf.expected.space_add_with_resize,
//       );
//       await blocks.resizeLayout({
//         element: section,
//         pointer: i === 0 ? "bottom" : "top",
//         height,
//       });
//       await softExpect(section).toHaveCSS("height", `${height}px`);
//       await blocks.backBtn.click();
//     });
//   }
// });

// test(`@SB_WEB_BUILDER_EL_28 Row_Check resize row`, async ({ cConf }) => {
//   let sectionSelected: Locator;
//   await test.step("Add section and rows", async () => {
//     const id = await blocks.dragAndDropInWebBuilder(cConf.dnd_section);
//     sectionSelected = blocks.getElementById(id, ClickType.SECTION);
//     await sectionSelected.locator(blocks.rowsInPreview).click({ position: { x: 10, y: 5 } });
//     for (let i = 0; i < cConf.designs.length; i++) {
//       const design = cConf.designs[i];
//       await blocks.selectedTemplate.locator(blocks.afterAddIndicatorRow).click();
//       await blocks.selectColumnLayout("one-two-one");
//       await blocks
//         .getElementById(id, ClickType.SECTION)
//         .locator(blocks.rowNotAttrs)
//         .nth(i + 1)
//         .waitFor();
//       await blocks.changeDesign(design);
//     }
//     await blocks.backBtn.click();
//   });

//   const rows = await sectionSelected.locator(blocks.rowsInPreview).all();
//   for (let i = 0; i < rows.length; i++) {
//     const row = rows[i];
//     const index = i + 1;
//     const height = cConf.expected.height[i];
//     await test.step(`
//      Click select vào row ${index} của section A rồi hover vào resize indicator của row, drag resize indicator`
//      , async () => {
//       await blocks.resizeLayout({
//         element: row,
//         pointer: "bottom",
//         height: height,
//       });
//       await softExpect(row).toHaveCSS("height", `${height}px`);
//       await softExpect(blocks.genLoc(blocks.getSelectorByLabel("height")).getByRole("spinbutton")).toHaveValue(
//         `${height}`,
//       );
//       await blocks.backBtn.click();
//     });
//   }
// });

// test(`@SB_WEB_BUILDER_EL_36 Column_Check click add column ở màn desktop`, async ({
//   conf,
//   cConf,
//   snapshotFixture,
// }) => {
//   const expected = cConf.expected;

//   await test.step("Pre-condition: Add section with 2:! layout", async () => {
//     await blocks.dragAndDropInWebBuilder(cConf.dnd_section_2_1);
//   });

//   await test.step(`Click select column 1 trong row của section A`, async () => {
//     await firstCol.click(edgePosition);
//   });

//   await test.step("Verify after selected column 1", async () => {
//     await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
//     await softExpect(blocks.frameLocator.locator(blocks.quickBarLoc)).toBeVisible();
//     await softExpect(blocks.getResizePointerLayout("left")).toBeHidden();
//     await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
//     await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeVisible();
//     await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeVisible();
//   });

//   for (const data of cConf.add_column) {
//     let newColumnId: string;
//     await test.step(`Click button add column ở bên ${data.position} `, async () => {
//       newColumnId = await blocks.addColumn({ element: firstCol, position: data.position });
//     });

//     await test.step("Verify new column", async () => {
//       const columnsWidth = [];
//       const newCol =
//         data.position === "right"
//           ? secondCol.filter({ has: blocks.genLoc(`[data-column-id="${newColumnId}"]`) })
//           : firstCol.filter({ has: blocks.genLoc(`[data-column-id="${newColumnId}"]`) });
//       await softExpect(newCol).toHaveClass(new RegExp(expected.selected));
//       await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
//      data.expected.column_count);
//       for (const column of await blocks.frameLocator.locator(blocks.columnsInPreview).all()) {
//         const columnWidth = await column.evaluate(ele => ele.clientWidth);
//         columnsWidth.push(columnWidth);
//       }
//       for (let i = 1; i < columnsWidth.length; i++) {
//         softExpect(columnsWidth[0]).toEqual(columnsWidth[i]);
//       }
//       await blocks.backBtn.click();
//     });
//   }

//   await test.step(`Hover vào button add column`, async () => {
//     await firstCol.click(edgePosition);
//     await blocks.selectedTemplate.locator(blocks.beforeAddIndicator).hover();
//   });

//   await test.step("Verify button add column is disabled and tooltip appear", async () => {
//     await softExpect(blocks.selectedTemplate.locator(blocks.beforeAddIndicator)).toHaveClass(
//       new RegExp(expected.disabled),
//     );
//     await softExpect(blocks.selectedTemplate.locator(blocks.afterAddIndicator)).toHaveClass(
//       new RegExp(expected.disabled),
//     );
//     await softExpect(blocks.selectedTemplate.locator(blocks.addColPopper).first()).toBeVisible();
//   });

//   await test.step(`nhấn save > nhấn preview button`, async () => {
//     for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
//       await column.click(edgePosition);
//       await blocks.selectedTemplate.locator(blocks.addBlockBtn).click();
//       await blocks.getTemplatePreviewByName("Paragraph").click();
//       const blockId = await blocks.templateTitle.filter({ hasText: "Paragraph" }).getAttribute("data-id");
//       if (await blocks.frameLocator.locator(blocks.quickBarLoc).isHidden()) {
//         await blocks.backBtn.click();
//         await blocks.clickElementById(blockId, ClickType.BLOCK);
//       }
//       await blocks.selectOptionOnQuickBar("Edit text");
//       await blocks.textEditor.waitFor();
//       await blocks.page.keyboard.press("Control+A");
//       await blocks.textEditor.fill(`Column index: ${i}`);
//       await blocks.titleBar.click();
//       await blocks.textEditor.waitFor({ state: "hidden" });
//     }
//     await blocks.backBtn.click();
//     previewPage = await blocks.clickSaveAndGoTo("Preview");
//   });

//   await test.step("Verify columns in preview", async () => {
//     storeFront = new SFWebBuilder(previewPage, conf.suiteConf.domain);
//     await softExpect(storeFront.sections.first()).toBeVisible();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: previewPage,
//       selector: storeFront.sections.first(),
//       snapshotName: expected.column_in_preview_after_edited_snapshot,
//     });
//   });
// });

// test(`@SB_WEB_BUILDER_EL_41 Column_Quick bar_Check di chuyển vị trí của column ở màn mobile`, async ({
//   pageMobile,
//   cConf,
//   conf,
//   snapshotFixture,
// }) => {
//   let colId: string;
//   const expected = cConf.expected;

//   await test.step("Pre-condition: Switch to mobile and add section with 2 columns", async () => {
//     await blocks.clickBtnNavigationBar("mobile");
//     await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_1);
//     await blocks.backBtn.click();
//     for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
//       await column.click(edgePosition);
//       await blocks.changeDesign(cConf.edit_border[i]);
//     }
//     await blocks.backBtn.click();
//   });

//   await test.step(`Click select column 2 trong row`, async () => {
//     await secondCol.click(edgePosition);
//     colId = await blocks.titleBar.getByRole("paragraph").getAttribute("data-id");
//   });

//   await test.step("Verify column state", async () => {
//     await softExpect(secondCol).toHaveClass(new RegExp(expected.selected));
//     await softExpect(blocks.quickBarButton("Move right")).toHaveClass(new RegExp(expected.disabled));
//     await softExpect(blocks.getResizePointerLayout("left")).toBeVisible();
//     await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
//     await softExpect(secondCol.locator(blocks.beforeAddIndicator)).toBeHidden();
//     await softExpect(secondCol.locator(blocks.afterAddIndicator)).toBeHidden();
//   });

//   await test.step(`Click Move up ở column 2 `, async () => {
//     await blocks.selectOptionOnQuickBar("Move left");
//   });

//   await test.step("Verify new position and button in quickbar", async () => {
//     const newColPosition = firstCol.filter({ has: blocks.genLoc(`[data-column-id="${colId}"]`) });
//     await softExpect(newColPosition).toHaveClass(new RegExp(expected.selected));
//     await softExpect(blocks.quickBarButton("Move right")).not.toHaveClass(new RegExp(expected.disabled));
//     await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
//   });

//   await test.step(`Click Move down ở column 1`, async () => {
//     await blocks.selectOptionOnQuickBar("Move right");
//   });

//   await test.step("Verify new position and button in quickbar", async () => {
//     const newColPosition = secondCol.filter({ has: blocks.genLoc(`[data-column-id="${colId}"]`) });
//     await softExpect(newColPosition).toHaveClass(new RegExp(expected.selected));
//     await softExpect(blocks.quickBarButton("Move right")).toHaveClass(new RegExp(expected.disabled));
//     await softExpect(blocks.quickBarButton("Move left")).not.toHaveClass(new RegExp(expected.disabled));
//   });

//   await test.step(`nhấn save > nhấn preview button`, async () => {
//     previewPage = await blocks.clickSaveAndGoTo("Preview");
//   });

//   await test.step("Verify columns in preview", async () => {
//     storeFront = new SFWebBuilder(pageMobile, conf.suiteConf.domain);
//     await storeFront.page.goto(previewPage.url());
//     await previewPage.close();
//     await softExpect(storeFront.sections.first()).toBeVisible();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: previewPage,
//       selector: storeFront.sections.first(),
//       snapshotName: expected.column_in_preview_mobile_snapshot,
//     });
//   });
// });

// test(`@SB_WEB_BUILDER_EL_42 Column_Quick bar_Check duplicate column ở màn desktop`, async ({
//   cConf,
//   conf,
//   snapshotFixture,
// }) => {
//   const expected = cConf.expected;

//   await test.step("Pre-condition: add section with layout 1:2", async () => {
//     await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_2);
//     await blocks.backBtn.click();
//     for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
//       await column.click(edgePosition);
//       await blocks.changeDesign(cConf.edit_border[i]);
//     }
//     await blocks.backBtn.click();
//   });

//   await test.step(`Click select column 1 trong row`, async () => {
//     await firstCol.click(edgePosition);
//   });

//   await test.step("Verify column state", async () => {
//     await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
//     await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
//     await softExpect(blocks.getResizePointerLayout("left")).toBeHidden();
//     await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
//     await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeVisible();
//     await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeVisible();
//   });

//   await test.step(`Click duplicate column trên quickbar của column 1`, async () => {
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   await test.step("Verify after duplicated column", async () => {
//     await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
//       expected.column_count_first_duplicate,
//     );
//     await softExpect(secondCol).toHaveClass(new RegExp(expected.selected));
//     await blocks.backBtn.click();
//     await firstSection.hover(edgePosition);
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: firstSection,
//       snapshotName: expected.first_duplicate_column_webfront_snapshot,
//     });
//   });

//   await test.step(`Click duplicate column trên quickbar của column 2`, async () => {
//     await secondCol.click(edgePosition);
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   await test.step("Verify after duplicated column", async () => {
//     await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
//       expected.column_count_second_duplicate,
//     );
//     await softExpect(thirdCol).toHaveClass(new RegExp(expected.selected));
//     await blocks.backBtn.click();
//     await firstSection.hover(edgePosition);
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: firstSection,
//       snapshotName: expected.second_duplicate_column_webfront_snapshot,
//     });
//   });

//   await test.step(`Hover vào button duplicate column trên quick bar của column 3 `, async () => {
//     await thirdCol.click(edgePosition);
//     // Hover disabled button cần force = true
//     // eslint-disable-next-line playwright/no-force-option
//     await blocks.quickBarButton("Duplicate").hover({ force: true });
//   });

//   await test.step("Verify after duplicated column", async () => {
//     await softExpect(blocks.quickBarButton("Duplicate")).toHaveClass(new RegExp(expected.disabled));
//   });

//   await test.step(`nhấn save > nhấn preview button`, async () => {
//     previewPage = await blocks.clickSaveAndGoTo("Preview");
//   });

//   await test.step("Verify columns in preview", async () => {
//     storeFront = new SFWebBuilder(previewPage, conf.suiteConf.domain);
//     await storeFront.page.goto(previewPage.url());
//     await softExpect(storeFront.sections.first()).toBeVisible();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: previewPage,
//       selector: storeFront.sections.first(),
//       snapshotName: expected.column_in_preview_snapshot,
//     });
//   });
// });

// test(`@SB_WEB_BUILDER_EL_43 Column_Quick bar_Check duplicate column ở màn mobile`, async ({
//   pageMobile,
//   conf,
//   cConf,
//   snapshotFixture,
// }) => {
//   const expected = cConf.expected;

//   await test.step("Pre-condition: add section with layout 1:2", async () => {
//     await blocks.clickBtnNavigationBar("mobile");
//     await blocks.dragAndDropInWebBuilder(cConf.dnd_section_1_2);
//     await blocks.backBtn.click();
//     for (const [i, column] of (await blocks.frameLocator.locator(blocks.columnsInPreview).all()).entries()) {
//       await column.click(edgePosition);
//       await blocks.changeDesign(cConf.edit_border[i]);
//     }
//     await blocks.backBtn.click();
//   });

//   await test.step(`Click select column 1 trong row`, async () => {
//     await firstCol.click(edgePosition);
//   });

//   await test.step("Verify column state", async () => {
//     await softExpect(firstCol).toHaveClass(new RegExp(expected.selected));
//     await softExpect(blocks.quickBarButton("Move left")).toHaveClass(new RegExp(expected.disabled));
//     await softExpect(blocks.getResizePointerLayout("left")).toBeVisible();
//     await softExpect(blocks.getResizePointerLayout("right")).toBeVisible();
//     await softExpect(firstCol.locator(blocks.beforeAddIndicator)).toBeHidden();
//     await softExpect(firstCol.locator(blocks.afterAddIndicator)).toBeHidden();
//   });

//   await test.step(`Click duplicate column trên quickbar của column 1`, async () => {
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   await test.step("Verify after duplicated column", async () => {
//     await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
//       expected.column_count_first_duplicate,
//     );
//     await softExpect(secondCol).toHaveClass(new RegExp(expected.selected));
//     await blocks.backBtn.click();
//     await firstSection.hover(edgePosition);
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: firstSection,
//       snapshotName: expected.first_duplicate_column_webfront_snapshot,
//     });
//   });

//   await test.step(`Click duplicate column trên quickbar của column 2`, async () => {
//     await secondCol.click(edgePosition);
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   await test.step("Verify after duplicated column", async () => {
//     await softExpect(blocks.frameLocator.locator(blocks.columnsInPreview)).toHaveCount(
//       expected.column_count_second_duplicate,
//     );
//     await softExpect(thirdCol).toHaveClass(new RegExp(expected.selected));
//     await blocks.backBtn.click();
//     await firstSection.hover(edgePosition);
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: firstSection,
//       snapshotName: expected.second_duplicate_column_webfront_snapshot,
//     });
//   });

//   await test.step(`Hover vào button duplicate column trên quick bar của column 3 `, async () => {
//     await thirdCol.click(edgePosition);
//     // eslint-disable-next-line playwright/no-force-option
//     await blocks.quickBarButton("Duplicate").hover({ force: true });
//   });

//   await test.step("Verify after duplicated column", async () => {
//     await softExpect(blocks.quickBarButton("Duplicate")).toHaveClass(new RegExp(expected.disabled));
//   });

//   await test.step(`nhấn save > nhấn preview button`, async () => {
//     previewPage = await blocks.clickSaveAndGoTo("Preview");
//   });

//   await test.step("Verify columns in preview", async () => {
//     storeFront = new SFWebBuilder(pageMobile, conf.suiteConf.domain);
//     await storeFront.page.goto(previewPage.url());
//     await previewPage.close();
//     await softExpect(storeFront.sections.first()).toBeVisible();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: previewPage,
//       selector: storeFront.sections.first(),
//       snapshotName: expected.column_in_preview_mobile_snapshot,
//     });
//   });
// });
