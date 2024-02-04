import { XpathNavigationButtons } from "@constants/web_builder";
import { test, expect } from "@fixtures/website_builder";
import { DigitalProductAPI } from "@pages/api/dashboard/digital_product";
import { WebBuilder } from "@pages/dashboard/web_builder";

let dProId;
let webBuilder: WebBuilder;
const sectionNames = [];
test.describe("@SB_WEB_BUILDER_NAV_LP - Check module Layer panel", () => {
  test.beforeAll(async ({ authRequest, builder, conf }) => {
    const dp = new DigitalProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Create digital product", async () => {
      const productInfo = await dp.createProduct({
        title: conf.suiteConf.dpro_config.title,
        published: conf.suiteConf.dpro_config.published,
        product_type: conf.suiteConf.dpro_config.product_type,
      });
      dProId = productInfo.id;
    });

    let applyTemplateId;
    await test.step("Get template ID from Web Base to apply", async () => {
      const templateInfo = await builder.libraryDetail(conf.suiteConf.web_base_id);
      for (const template of templateInfo.pages) {
        if (template.title === conf.suiteConf.apply_template) {
          applyTemplateId = template.id;
        }
      }
    });

    await test.step("Apply template for digital product", async () => {
      await builder.applyTemplate({
        templateId: applyTemplateId,
        productId: dProId,
        type: conf.suiteConf.type,
      });
    });
  });

  test.afterAll(async ({ authRequest, conf }) => {
    const dp = new DigitalProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Delete digital product after test", async () => {
      await dp.deleteProducts(dProId);
    });
  });

  test.beforeEach(async ({ dashboard, conf }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await test.step("Open web builder from test product", async () => {
      await webBuilder.openWebBuilder({ type: "sale page", id: dProId });
    });

    const sectionCount = await webBuilder.getSidebarArea("sales page").locator(webBuilder.sectionsInSidebar).count();
    await test.step("Get sections name in sidebar", async () => {
      for (let i = 0; i < sectionCount; i++) {
        const sectionName = await webBuilder
          .getSidebarArea("sales page")
          .locator(webBuilder.sectionsInSidebar)
          .nth(i)
          .innerText();
        sectionNames.push(sectionName);
      }
    });
  });

  test("@SB_WEB_BUILDER_NAV_LP_01 - Layer panel_Check hiển thị icon layer panel ", async ({ conf }) => {
    const collapsed = conf.caseConf.collapsed;
    await test.step("Check all sections is collapsed by default", async () => {
      for (const section of sectionNames) {
        const sectionSidebar = webBuilder
          .getSidebarArea("sales page")
          .locator(webBuilder.sectionsInSidebar)
          .filter({ hasText: section });
        for (let i = 0; i < sectionNames.filter(name => name == section).length; i++) {
          const arrowBtnStatus = sectionSidebar.nth(i).locator("[class*=layer-child]");
          await expect(arrowBtnStatus).toHaveAttribute(collapsed.attribute, collapsed.value);
        }
      }
    });

    await test.step("Check layer button is focused", async () => {
      await expect(webBuilder.genLoc(XpathNavigationButtons["layer"])).toHaveClass(
        new RegExp(conf.caseConf.focused.value),
      );
    });

    await test.step("Hover on layer button", async () => {
      await webBuilder.genLoc(XpathNavigationButtons["layer"]).hover();
    });

    const layerTooltip = webBuilder.visibleTooltip.filter({ hasText: "Layers" });
    await test.step("Verify layer tooltip ", async () => {
      await expect(layerTooltip).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_NAV_LP_02 - Check hiển thị layer panel khi expand/collapse parent layer có child layer ở Sidebar", async ({
    conf,
  }) => {
    const expanded = conf.caseConf.expanded;
    const collapsed = conf.caseConf.collapsed;
    const collapses = conf.caseConf.collapse_info;
    await test.step("Expand section in sidebar", async () => {
      await webBuilder.expandCollapseLayer({ sectionName: sectionNames[10], isExpand: true });
    });

    await test.step("Verify all child layers are expanded", async () => {
      const sectionSidebar = webBuilder
        .getSidebarArea("sales page")
        .locator(webBuilder.sectionsInSidebar)
        .filter({ hasText: sectionNames[10] });
      const sectionStatus = sectionSidebar.locator("[class*=layer-child]");
      await expect(sectionStatus).toHaveAttribute(expanded.attribute, expanded.expected_value);
    });

    for (const collapse of collapses) {
      await test.step("Collapse child layers and section", async () => {
        await webBuilder.expandCollapseLayer({
          sectionName: sectionNames[10],
          subLayerName: collapse.sub_layer,
          subLayerIndex: collapse.sub_layer_index,
          isExpand: collapse.expand,
        });
      });

      await test.step("Verify layer is collapsed", async () => {
        const childLayerBtn = webBuilder.getArrowBtnOfLayer({
          sectionName: sectionNames[10],
          subLayerName: collapse.sub_layer,
          subLayerIndex: collapse.sub_layer_index,
        });
        const childLayerStatus = webBuilder.genLoc(
          `${childLayerBtn}/ancestor::div[contains(@class,'sb-pointer')]/following-sibling::div`,
        );
        await expect(childLayerStatus).toHaveAttribute(collapsed.attribute, collapsed.value);
      });
    }
  });

  test("@SB_WEB_BUILDER_NAV_LP_03 - Check hiển thị của layer đối với layer là section, row, column container, block khi hover", async ({
    conf,
  }) => {
    const expectedHighlight = conf.caseConf.expected_highlight;
    await test.step("Pre-condition: Expand sections", async () => {
      await webBuilder.expandCollapseLayer({ sectionName: sectionNames[10], isExpand: true });
    });

    for (const data of conf.caseConf.hover_info) {
      await test.step(`Check ${data.type}`, async () => {
        await webBuilder.hideOrShowLayerInSidebar({
          sectionName: sectionNames[10],
          subLayerName: data.layer_info.sub_layer,
          subLayerIndex: data.layer_info.sub_layer_index,
          isHide: data.layer_info.hide,
        });
      });

      const layerSelector = webBuilder.getSidebarSelectorByName({
        sectionName: sectionNames[10],
        subLayerName: data.layer_info.sub_layer,
        subLayerIndex: data.layer_info.sub_layer_index,
      });
      await test.step(`Hover on an ${data.type} `, async () => {
        await webBuilder.genLoc(layerSelector).hover();
        await webBuilder.waitAbit(1000); // Spec tối đa 1s sẽ scroll layer lên viewport
      });

      const eyeBtn = webBuilder.genLoc(`${layerSelector}/following-sibling::div`).getByRole("button");
      await test.step(`Verify ${data.button} is visible`, async () => {
        await expect(eyeBtn).toBeVisible();
      });

      await test.step(`Verify ${data.type} in SF Preview is hovered and scrolled into viewport`, async () => {
        const layerInPreview = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(data.layer_in_preview));
        if (data.type.includes("inactive")) {
          await expect.soft(layerInPreview).toBeHidden();
        } else {
          await expect.soft(layerInPreview).toBeInViewport(data.ratio);
        }
      });
    }

    await test.step("Expand section", async () => {
      await webBuilder.expandCollapseLayer({ sectionName: sectionNames[9], isExpand: true });
    });

    for (const data of conf.caseConf.hover_preview) {
      const previewSelector = webBuilder.getSelectorByIndex({
        section: data.sf_preview.section,
        block: data.sf_preview.block,
      });
      await test.step(`Hover on an ${data.type} in Web front preview`, async () => {
        await webBuilder.frameLocator.locator(previewSelector).hover({ position: { x: 1, y: 1 } });
      });

      await test.step(`Verify ${data.type} status in sidebar`, async () => {
        const sectionInSidebar = webBuilder
          .genLoc(`${webBuilder.sectionsInSidebar}>div`)
          .filter({ hasText: sectionNames[data.sf_preview.section - 1] });
        const blockInSidebar = webBuilder
          .genLoc(webBuilder.sectionsInSidebar)
          .filter({ hasText: sectionNames[data.sf_preview.section - 1] })
          .locator(webBuilder.blocksInSidebar)
          .nth(data.sf_preview.block - 1);

        if (data.type.includes("collapsed") || data.type.includes(" section")) {
          await expect(sectionInSidebar).toHaveClass(new RegExp(expectedHighlight));
        } else if (data.type.includes("expanded block")) {
          await expect(blockInSidebar).toHaveClass(new RegExp(expectedHighlight));
        }
      });
    }
  });

  test("@SB_WEB_BUILDER_NAV_LP_04 - Check hiển thị khi show/hide layer", async ({ conf }) => {
    const sectionSelector = webBuilder.getSidebarSelectorByName({ sectionName: sectionNames[6] });
    const eyeBtn = webBuilder.genLoc(`${sectionSelector}/following-sibling::div`).getByRole("button");
    const hideTooltip = webBuilder.visibleTooltip.filter({ hasText: "Hide" });
    const showTooltip = webBuilder.visibleTooltip.filter({ hasText: "Show" });
    await test.step("Expand section", async () => {
      await webBuilder.expandCollapseLayer({ sectionName: sectionNames[6], isExpand: true });
    });

    await test.step("Hover on eye button", async () => {
      await eyeBtn.hover();
    });

    await test.step("Verify hide tooltip", async () => {
      await expect(hideTooltip).toBeVisible();
    });

    for (const data of conf.caseConf.hide_info) {
      const layerSelector = webBuilder.getSidebarSelectorByName({
        sectionName: sectionNames[6],
        subLayerName: data.layer_info.sub_layer,
      });
      const hiddenBtn = webBuilder.genLoc(`${layerSelector}/following-sibling::div`).getByRole("button");
      await test.step("Hide child layers", async () => {
        await webBuilder.hideOrShowLayerInSidebar({
          sectionName: sectionNames[6],
          subLayerName: data.layer_info.sub_layer,
          isHide: true,
        });
      });

      await test.step("Verify layer is hidden in Sidebar", async () => {
        await expect(hiddenBtn).toBeVisible();
      });

      const layerPreview = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(data.sf_preview));
      await test.step("Verify layer is hidden in Storefront preview", async () => {
        await expect(layerPreview).toBeHidden();
      });
    }

    await test.step("Hover on column", async () => {
      const columnInSidebar = webBuilder.getSidebarSelectorByName({
        sectionName: sectionNames[6],
        subLayerName: "Column",
      });
      await webBuilder.genLoc(columnInSidebar).hover();
    });

    await test.step("Verify no hide button in column", async () => {
      const hideBtn = webBuilder
        .genLoc(webBuilder.getSidebarSelectorByIndex({ section: 7, column: 1 }))
        .locator(webBuilder.layerInSidebar)
        .filter({ hasText: "Column" })
        .locator(webBuilder.buttonsInLayer)
        .getByRole("button");
      await expect(hideBtn).not.toBeAttached();
    });

    await test.step("Hover on eye button", async () => {
      await webBuilder.genLoc(sectionSelector).hover();
      await eyeBtn.hover();
    });

    await test.step("Verify Show tooltip and hover out", async () => {
      await expect(showTooltip).toBeVisible();
      await webBuilder.titleBar.hover();
    });

    for (const data of conf.caseConf.show_info) {
      const layerSelector = webBuilder.getSidebarSelectorByName({
        sectionName: sectionNames[6],
        subLayerName: data.layer_info.sub_layer,
      });
      const hiddenBtn = webBuilder.genLoc(`${layerSelector}/following-sibling::div`).getByRole("button");
      await test.step("Show child layers", async () => {
        await webBuilder.hideOrShowLayerInSidebar({
          sectionName: sectionNames[6],
          subLayerName: data.layer_info.sub_layer,
          isHide: false,
        });
      });

      await test.step("Verify layer is not hidden in Sidebar", async () => {
        await expect(hiddenBtn).toBeHidden();
      });

      const layerPreview = webBuilder.frameLocator.locator(webBuilder.getLayerStatusInWebFrontPreview(data.sf_preview));
      await test.step("Verify layer is showed again in Storefront preview", async () => {
        await expect(layerPreview).not.toHaveClass(new RegExp(data.expected.value));
      });
    }
  });

  test("@SB_WEB_BUILDER_NAV_LP_05 - Check hiển thị layer khi drag n drop", async ({ conf }) => {
    test.slow(); //Increase timeout
    const sectionsAfterDrag = [];
    const sectionFrom = [sectionNames[3], sectionNames[2], sectionNames[2], sectionNames[2]];
    const sectionTo = [sectionNames[3], sectionNames[2], sectionNames[2], sectionNames[1]];
    const section = conf.caseConf.dnd_section;
    const dragTooltip = webBuilder.visibleTooltip.filter({ hasText: "Drag" });

    await test.step("Expand sections", async () => {
      await webBuilder.expandCollapseLayer({ sectionName: sectionNames[2], isExpand: true });
      await webBuilder.expandCollapseLayer({ sectionName: sectionNames[3], isExpand: true });
    });

    for (const data of conf.caseConf.hover_layers) {
      const layerSelector = webBuilder.getSidebarSelectorByName({
        sectionName: sectionNames[3],
        subLayerName: data.layer_info.sub_layer,
        subLayerIndex: data.layer_info.sub_layer_index,
      });
      await test.step(`Hover ${data.type}`, async () => {
        await webBuilder.genLoc(layerSelector).hover();
      });

      const dragBtn = webBuilder.genLoc(
        `${layerSelector}/following-sibling::div//span[contains(@class,'drag-handle')]`,
      );
      await test.step("Verify Drag button and tooltip visible", async () => {
        await expect(dragBtn).toBeVisible();
        await dragBtn.hover();
        await expect(dragTooltip).toBeVisible();
      });
    }

    for (const block of conf.caseConf.dnd_blocks) {
      await test.step(block.step_title, async () => {
        await webBuilder.dndLayerInSidebar({
          from: {
            sectionName: sectionNames[3],
            subLayerName: block.dnd_info.from.sub_layer,
            subLayerIndex: block.dnd_info.from.sub_layer_index,
          },
          to: {
            sectionName: sectionNames[3],
            subLayerName: block.dnd_info.to.sub_layer,
            subLayerIndex: block.dnd_info.to.sub_layer_index,
          },
        });
      });

      await test.step("Verify position of block after perform drag and drop", async () => {
        const columnFrom = webBuilder.genLoc(
          webBuilder.getSidebarSelectorByIndex({ section: 4, column: block.column_index }),
        );
        const blocksInColumn = columnFrom.locator(webBuilder.blocksInSidebar);
        const blocksCount = await blocksInColumn.count();
        for (let i = 0; i < blocksCount; i++) {
          await expect(blocksInColumn.nth(i)).toContainText(block.expected.block_after_dnd[i]);
        }
      });
    }

    const columnRow = conf.caseConf.dnd_columns_rows;
    for (let i = 0; i < columnRow.length; i++) {
      await test.step(columnRow[i].step_title, async () => {
        await webBuilder.dndLayerInSidebar({
          from: {
            sectionName: sectionFrom[i],
            subLayerName: columnRow[i].dnd_info.from.sub_layer,
            subLayerIndex: columnRow[i].dnd_info.from.sub_layer_index,
          },
          to: {
            sectionName: sectionTo[i],
            subLayerName: columnRow[i].dnd_info.to.sub_layer,
            subLayerIndex: columnRow[i].dnd_info.to.sub_layer_index,
            isExpand: columnRow[i].dnd_info.to.is_expand,
          },
        });
      });

      const arrowBtn = webBuilder.getArrowBtnOfLayer({
        sectionName: sectionFrom[i],
        subLayerName: columnRow[i].dnd_info.from.sub_layer,
        subLayerIndex: columnRow[i].dnd_info.from.sub_layer_index,
      });
      const isCollapsed = webBuilder.genLoc(arrowBtn).getAttribute(columnRow[i].attribute);
      await test.step("Verify column/row is collapsed while drag n drop", async () => {
        expect(isCollapsed).toBeTruthy();
      });

      const columnRowSelector = webBuilder.getSidebarSelectorByName({
        sectionName: sectionFrom[i],
        subLayerName: columnRow[i].expected.position.sub_layer,
        subLayerIndex: columnRow[i].expected.position.sub_layer_index,
      });
      const columnRowOrder = webBuilder.genLoc(`${columnRowSelector}/parent::div/parent::div`);
      await test.step("Verify position of column/row after perform drag and drop", async () => {
        await expect(columnRowOrder).toHaveAttribute(columnRow[i].expected.attribute, columnRow[i].expected.value);
      });
    }

    await test.step("Drag n drop section", async () => {
      await webBuilder.dndLayerInSidebar({
        from: { sectionName: sectionNames[2] },
        to: { sectionName: sectionNames[1] },
      });
    });

    const arrowBtn = webBuilder.getArrowBtnOfLayer({ sectionName: sectionNames[2] });
    const isCollapsed = webBuilder.genLoc(arrowBtn).getAttribute(section.attribute);
    await test.step("Verify section is collapsed while drag n drop", async () => {
      expect(isCollapsed).toBeTruthy();
    });

    const sectionCount = await webBuilder.genLoc(webBuilder.sectionsInSidebar).count();
    await test.step("Get sections name in sidebar", async () => {
      for (let i = 0; i < sectionCount; i++) {
        const sectionName = await webBuilder.genLoc(webBuilder.sectionsInSidebar).nth(i).innerText();
        sectionsAfterDrag.push(sectionName);
      }
    });

    const newSectionIndex = sectionsAfterDrag.indexOf(sectionNames[2]);
    await test.step("Verify position of section after perform drag and drop", async () => {
      expect(newSectionIndex).toEqual(section.expected_index);
    });
  });

  test("@SB_WEB_BUILDER_NAV_LP_06 - Check khi user mở/đóng settings layer", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const sectionSelector = webBuilder.getSidebarSelectorByName({ sectionName: sectionNames[12] });
    const sectionSettingsLoc = `${sectionSelector}/ancestor::div[@style]/following::div[contains(@class,'tab-heading')]`;
    await test.step("Open collapsed section", async () => {
      await webBuilder.openLayerSettings({ sectionName: sectionNames[12] });
    });

    await test.step("Verify settings of section is opened", async () => {
      await expect(webBuilder.genLoc(sectionSettingsLoc)).toBeVisible();
    });

    await test.step("Click back icon to close settings", async () => {
      await webBuilder.backBtn.click();
    });

    await test.step("Verify section and all row, column is expanded", async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.genLoc(webBuilder.sectionsInSidebar).nth(12).locator(webBuilder.childLayersInSidebar),
        snapshotName: `LP_6-Expanded-All.png`,
      });
    });

    for (const data of conf.caseConf.open_layers) {
      const layerInfo = {
        sectionName: sectionNames[12],
        subLayerName: data.sub_layer,
      };
      await test.step("Open Row, column and block settings", async () => {
        await webBuilder.openLayerSettings(layerInfo);
      });

      const layerSelector = webBuilder.getSidebarSelectorByName(layerInfo);
      const layerSettingsLoc = `${layerSelector}/ancestor::div[@style]/following::div[contains(@class,'tab-heading')]`;
      await test.step("Verify opened settings of layer", async () => {
        await expect(webBuilder.genLoc(layerSettingsLoc)).toBeVisible();
      });

      await test.step("Click back icon to close settings", async () => {
        await webBuilder.backBtn.click();
      });
    }
  });
});
