import { loadData } from "@core/conf/conf";
import { verifyWidthHeightCSSInRange } from "@core/utils/css";
import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { Locator } from "@playwright/test";

const softExpect = expect.configure({ soft: true });
const dProIds = [];
let webBuilder: WebBuilder,
  dProAPI: ProductAPI,
  applyTemplateId: number,
  section1InWebfront: string,
  section2InWebfront: string,
  section3InWebfront: string,
  spacingValue: Locator,
  fullWidthBtn: Locator,
  widthValue: Locator,
  widthUnit: Locator,
  borderValue: Locator,
  borderColor: Locator,
  backgroundValueNew: Locator,
  backgroundValue: Locator,
  paddingValue: Locator,
  marginValue: Locator;
const position = { position: { x: 5, y: 5 } };

test.use({ launchOptions: { args: ["--start-maximized"], ignoreDefaultArgs: ["--hide-scrollbars"] } });
test.describe("Check module switch device @SB_WEB_BUILDER_NAV_SD", () => {
  test.beforeAll(async ({ authRequest, builder, conf }) => {
    await test.step("Get template on web base", async () => {
      const libDetail = await builder.libraryDetail(conf.suiteConf.web_base_id);
      const templates = libDetail.pages;
      templates.forEach(template => {
        if (template.title === conf.suiteConf.template_name) {
          applyTemplateId = template.id;
        }
      });
    });

    dProAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Create product test", async () => {
      const response = await dProAPI.createProduct(conf.suiteConf.create_product);
      dProIds.push(response.data.product.id);
      await dProAPI.publishProduct(dProIds, true);
    });

    await test.step("Apply template test", async () => {
      await builder.applyTemplate({
        templateId: applyTemplateId,
        type: "product",
        productId: dProIds[0],
      });
    });
  });

  test.beforeEach(async ({ dashboard, conf }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    section1InWebfront = webBuilder.getSelectorByIndex({ section: 1 });
    section2InWebfront = webBuilder.getSelectorByIndex({ section: 2 });
    section3InWebfront = webBuilder.getSelectorByIndex({ section: 3 });
    spacingValue = webBuilder
      .genLoc(webBuilder.getSelectorByLabel("layouts"))
      .filter({ hasText: "Spacing" })
      .getByRole("paragraph");
    fullWidthBtn = webBuilder.genLoc(webBuilder.getSelectorByLabel("full_width")).getByRole("checkbox");
    widthValue = webBuilder.genLoc(webBuilder.getSelectorByLabel("width")).locator("input");
    widthUnit = webBuilder.genLoc(webBuilder.getSelectorByLabel("width")).getByRole("button");
    borderValue = webBuilder.genLoc("[data-widget-id=border], [data-widget-id=btn_border]").getByRole("button");
    borderColor = borderValue.locator("div.color");
    backgroundValueNew = webBuilder
      .genLoc("[data-widget-id=background] img")
      .or(webBuilder.genLoc("[data-widget-id=background] div.color"));
    backgroundValue = webBuilder
      .genLoc("[data-widget-id=background],[data-widget-id=btn_background]")
      .locator("div.color");
    paddingValue = webBuilder.genLoc("[data-widget-id=padding], [data-widget-id=btn_padding]").locator("input");
    marginValue = webBuilder.genLoc("[data-widget-id=margin], [data-widget-id=btn_margin]").locator("input");
    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({ type: "sale page", id: dProIds[0] });
      await webBuilder.reloadIfNotShow("web builder");
    });
  });

  test.afterAll(async ({}) => {
    await test.step("Delete product after test", async () => {
      await dProAPI.deleteProduct(dProIds);
    });
  });

  const firstGroup = "SB_DESKTOP_VIEWPORT";
  const conf = loadData(__dirname, firstGroup);
  conf.caseConf.data.forEach(data => {
    test(`@${data.code_name} - ${data.title}`, async ({ dashboard, snapshotFixture }) => {
      const expected = conf.caseConf.expected;
      await test.step("Set browser viewport", async () => {
        await dashboard.setViewportSize(data.viewport_size);
      });

      await test.step(`Verify icon ${data.button} in navigation bar`, async () => {
        await expect(webBuilder.switchDesktopBtn).toBeVisible();
      });

      await test.step(`Hover on ${data.button}`, async () => {
        await webBuilder.switchDesktopBtn.hover();
      });

      await test.step("Verify switch device tooltip", async () => {
        await expect(webBuilder.visibleTooltip).toHaveText(expected.tooltip);
        await webBuilder.titleBar.click();
      });

      await test.step("Verify sidebar and web front preview size", async () => {
        const sidebarBox = await webBuilder.sidebarContainer.boundingBox();
        const desktopPreviewBox = await webBuilder.webFrontDesktopPreview.boundingBox();
        expect(sidebarBox.width).toEqual(data.expected.sidebar_width + data.expected.border);
        expect(desktopPreviewBox.width).toEqual(data.expected.preview_width);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          combineOptions: {
            mask: [webBuilder.sidebarContainer, webBuilder.frameLocator.locator(webBuilder.wbFullHeight)],
          },
          snapshotName: `${data.snapshot_prefix}-web-builder.png`,
        });
      });
    });
  });

  const secondGroup = "SB_MOBILE_VIEWPORT";
  const config = loadData(__dirname, secondGroup);
  config.caseConf.data.forEach(data => {
    test(`@${data.code_name} - ${data.title}`, async ({ dashboard, snapshotFixture }) => {
      test.slow();
      const expected = config.caseConf.expected;
      await test.step("Set browser viewport", async () => {
        await dashboard.setViewportSize(data.viewport_size);
      });

      await test.step(`Verify icon ${config.caseConf.button} in navigation bar`, async () => {
        await expect(webBuilder.switchDesktopBtn).toBeVisible();
        await expect(webBuilder.switchMobileBtn).toBeVisible();
      });

      await test.step(`Hover on switch mobile button`, async () => {
        await webBuilder.switchMobileBtn.hover();
      });

      await test.step("Verify switch device tooltip", async () => {
        await expect(webBuilder.visibleTooltip).toHaveText(expected.tooltip);
      });

      await test.step(`Click switch mobile button first time`, async () => {
        await Promise.all([
          webBuilder.switchMobileBtn.click(),
          await expect(webBuilder.toastMessage).toHaveText(expected.message),
        ]);
      });

      await test.step("Verify toggle view switch to mobile button", async () => {
        await expect(webBuilder.toggleDeviceView).toHaveAttribute("class", new RegExp(expected.toggle));
      });

      await test.step("Verify toast message disappear after 3s", async () => {
        await dashboard.waitForTimeout(3000);
        await expect(webBuilder.toastMessage).toBeHidden();
      });

      await test.step("Verify sidebar and web front preview size", async () => {
        const sidebarBox = await webBuilder.sidebarContainer.boundingBox();
        const mobilePreviewBox = await webBuilder.webFrontMobilePreview.boundingBox();
        expect(sidebarBox.width).toEqual(data.expected.sidebar_width + data.expected.border);
        expect(mobilePreviewBox.width).toEqual(data.expected.preview_width);
      });

      await test.step("Switch desktop and switch mobile view again", async () => {
        await webBuilder.switchDesktopBtn.click();
        await webBuilder.switchMobileBtn.click();
      });

      await test.step("Verify no toast message appear", async () => {
        await expect(webBuilder.toastMessage).toBeHidden();
      });

      await test.step("Hover to an element in the bottom to see mobile able to scroll", async () => {
        const sectionCount = (await webBuilder.getAllSectionName()).length;
        const bottomSection = dashboard
          .frameLocator("#preview")
          .locator(webBuilder.getSelectorByIndex({ section: sectionCount }));
        await bottomSection.hover();
        await webBuilder.layerBar.click();
      });

      await test.step("Verify user able to scroll to bottom", async () => {
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: "div.w-builder__preview-mobile",
          combineOptions: {
            mask: [webBuilder.frameLocator.locator(webBuilder.wbFullHeight)],
          },
          snapshotName: `SD-3-4-Scrollable-mobile-preview.png`,
        });
      });
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_05 - Check hiển thị section khi switch qua lại giữa desktop và mobile", async ({
    conf,
  }) => {
    test.slow();
    const createSection = conf.caseConf.create_section;
    const expected = conf.caseConf.expected;
    let sectionNames: Array<string>;
    await test.step("Pre-condition: Create test sections", async () => {
      for (const data of conf.caseConf.data) {
        await webBuilder.insertSectionBlock({
          parentPosition: createSection.parent_position,
          position: createSection.position,
          category: createSection.category,
          template: createSection.template,
        });
        await webBuilder.switchToTab("Design");
        await webBuilder.switchToggle("full_width", data.full_width);
        await webBuilder.setBorder("border", data.border);
        await webBuilder.setBackground("background", data.background);
        await webBuilder.setMarginPadding("margin", data.margin);
        await webBuilder.setMarginPadding("padding", data.padding);
        await webBuilder.switchToTab("Content");
        await webBuilder.changeContent(data.settings_info);
        await webBuilder.titleBar.click();
        await webBuilder.switchToTab("Design");
      }
      await webBuilder.backBtn.click();
      await webBuilder.hideOrShowLayerInSidebar({
        sectionName: conf.caseConf.hide_section,
        isHide: true,
      });
    });

    await test.step("Click switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.closeToastBtn.click();
    });

    await test.step("Verify mobile preview has right order in layer panel and preview", async () => {
      sectionNames = await webBuilder.getAllSectionName();
      for (const orderInLayerPanel of expected.sidebar_order) {
        const actualSectionOrder = sectionNames.indexOf(orderInLayerPanel.name);
        expect(actualSectionOrder).toEqual(orderInLayerPanel.index);
      }
      await webBuilder.frameLocator.locator(section1InWebfront).hover(position);
      await expect(webBuilder.breadCrumb).toHaveText(expected.sidebar_order[0].name);
      await expect(webBuilder.genLoc(section2InWebfront)).toBeHidden();
      await webBuilder.frameLocator.locator(section3InWebfront).hover(position);
      await expect(webBuilder.breadCrumb).toHaveText(expected.sidebar_order[2].name);
    });

    await test.step("Switch to desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify style settings is not change", async () => {
      sectionNames = await webBuilder.getAllSectionName();
      for (const data of expected.sidebar_order) {
        const defaultValue = data.default_value;
        const actualSectionOrder = sectionNames.indexOf(data.name);
        softExpect(actualSectionOrder).toEqual(data.index);
        await webBuilder.openLayerSettings({ sectionName: data.name });
        await webBuilder.switchToTab("Design");
        await softExpect(fullWidthBtn).toHaveAttribute("value", defaultValue.full_width);
        await softExpect(borderValue).toHaveText(defaultValue.border_value);
        await softExpect(borderColor).toHaveAttribute("style", defaultValue.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(
          defaultValue.background_attribute,
          new RegExp(defaultValue.background),
        );
        await softExpect(paddingValue).toHaveValue(defaultValue.padding);
        await softExpect(marginValue).toHaveValue(defaultValue.margin);
        await webBuilder.backBtn.click();
      }
      await webBuilder.frameLocator.locator(section1InWebfront).hover(position);
      await softExpect(webBuilder.breadCrumb).toHaveText(expected.sidebar_order[0].name);
      await expect(webBuilder.genLoc(section2InWebfront)).toBeHidden();
      await webBuilder.frameLocator.locator(section3InWebfront).hover(position);
      await softExpect(webBuilder.breadCrumb).toHaveText(expected.sidebar_order[2].name);
    });

    await test.step("Switch to mobile view and make some changes", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.dndLayerInSidebar({
        from: { sectionName: sectionNames[2] },
        to: { sectionName: sectionNames[1], isExpand: true },
      });
    });

    await test.step("Verify layers order have changed in sidebar and preview", async () => {
      for (const orderAfterEdited of expected.mobile_after_edit) {
        await test.step("Verify mobile preview has right order in layer panel", async () => {
          const sectionsAfterEdit = await webBuilder.getAllSectionName();
          const actualSectionOrder = sectionsAfterEdit.indexOf(orderAfterEdited.name);
          softExpect(actualSectionOrder).toEqual(orderAfterEdited.index);
        });
      }
      await webBuilder.frameLocator.locator(section1InWebfront).hover(position);
      await softExpect(webBuilder.breadCrumb).toHaveText(expected.sidebar_order[0].name);
      await webBuilder.frameLocator.locator(section2InWebfront).hover(position);
      await softExpect(webBuilder.breadCrumb).toHaveText(expected.sidebar_order[2].name);
      await expect(webBuilder.genLoc(section3InWebfront)).toBeHidden();
    });

    await test.step("Switch back to Desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify changes in mobile are not applied in desktop", async () => {
      for (const orderAfterEdited of expected.desktop_after_edit) {
        const defaultValue = orderAfterEdited.default_value;
        await test.step("Verify mobile preview has right order in layer panel", async () => {
          const sectionsSwitchDesktop = await webBuilder.getAllSectionName();
          const actualSectionOrder = sectionsSwitchDesktop.indexOf(orderAfterEdited.name);
          softExpect(actualSectionOrder).toEqual(orderAfterEdited.index);
        });
        await webBuilder.openLayerSettings({ sectionName: orderAfterEdited.name });
        await webBuilder.switchToTab("Design");
        await softExpect(fullWidthBtn).toHaveAttribute("value", defaultValue.full_width);
        await softExpect(borderValue).toHaveText(defaultValue.border_value);
        await softExpect(borderColor).toHaveAttribute("style", defaultValue.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(
          defaultValue.background_attribute,
          new RegExp(defaultValue.background),
        );
        await softExpect(paddingValue).toHaveValue(defaultValue.padding);
        await softExpect(marginValue).toHaveValue(defaultValue.margin);
        await webBuilder.backBtn.click();
      }
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_06 - Check hiển thị row khi switch qua lại giữa desktop và mobile", async ({ conf }) => {
    test.slow();
    const editSection = conf.caseConf.edit_section;
    const createSection = conf.caseConf.create_section;
    const firstRow = conf.caseConf.first_row;
    const dndMobile = conf.caseConf.dnd_mobile;
    const hiddenRow = conf.caseConf.hidden_row;
    const firstRowPreview = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, row: 1 }));
    const secondRowPreview = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, row: 2 }));
    const thirdRowPreview = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, row: 3 }));
    await test.step("Pre-condition: Create test sections", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: createSection.parent_position,
        position: createSection.position,
        category: createSection.category,
        template: createSection.template,
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(editSection);
      await webBuilder.selectParentBreadcrumb({ section: 1, column: 1 }, "Row");
      await webBuilder.setBorder("border", firstRow.border);
      await webBuilder.setBackground("background", firstRow.background);
      await webBuilder.setMarginPadding("margin", firstRow.margin);
      await webBuilder.setMarginPadding("padding", firstRow.padding);

      for (const setting of conf.caseConf.data) {
        await webBuilder.addRow({
          parentPosition: { section: 1, row: setting.row_index },
          layout: "Single column",
          quickbar: true,
        });
        await webBuilder.setBorder("border", setting.border);
        await webBuilder.setBackground("background", setting.background);
        await webBuilder.setMarginPadding("margin", setting.margin);
        await webBuilder.setMarginPadding("padding", setting.padding);
        await webBuilder.backBtn.click();
      }
      await webBuilder.expandCollapseLayer({ sectionName: editSection.content, isExpand: true });
      await webBuilder.hideOrShowLayerInSidebar({
        sectionName: editSection.content,
        subLayerName: editSection.sub_layer.name,
        subLayerIndex: editSection.sub_layer.index,
        isHide: true,
      });
    });

    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.closeToastBtn.click();
    });

    await test.step("Verify rows order and status in sidebar and mobile preview", async () => {
      for (const data of conf.caseConf.design) {
        await webBuilder.selectParentBreadcrumb({ section: 1, column: data.column_index }, "Row");
        await softExpect(spacingValue).toHaveText(data.spacing_mobile);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding_mobile);
        await softExpect(marginValue).toHaveValue(data.margin);
        await webBuilder.backBtn.click();
      }
      await webBuilder.openLayerSettings({ sectionName: editSection.content, subLayerName: "Row", subLayerIndex: 3 });
      await softExpect(spacingValue).toHaveText(hiddenRow.spacing_mobile);
      await softExpect(borderValue).toHaveText(hiddenRow.border_value);
      await softExpect(borderColor).toHaveAttribute("style", hiddenRow.border_color);
      await softExpect(backgroundValueNew).toHaveAttribute(
        hiddenRow.background_attribute,
        new RegExp(hiddenRow.background),
      );
      await softExpect(paddingValue).toHaveValue(hiddenRow.padding_mobile);
      await softExpect(marginValue).toHaveValue(hiddenRow.margin);
      await webBuilder.backBtn.click();
      await expect(thirdRowPreview).toBeHidden();
    });

    await test.step("Switch back to desktop view w/o editing", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify switch to Desktop view and nothing change in sidebar", async () => {
      for (const data of conf.caseConf.design) {
        await webBuilder.selectParentBreadcrumb({ section: 1, column: data.column_index }, "Row");
        await softExpect(spacingValue).toHaveText(data.spacing_desktop);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding_desktop);
        await softExpect(marginValue).toHaveValue(data.margin);
        await webBuilder.backBtn.click();
      }
      await webBuilder.openLayerSettings({ sectionName: editSection.content, subLayerName: "Row", subLayerIndex: 3 });
      await softExpect(spacingValue).toHaveText(hiddenRow.spacing_desktop);
      await softExpect(borderValue).toHaveText(hiddenRow.border_value);
      await softExpect(borderColor).toHaveAttribute("style", hiddenRow.border_color);
      await softExpect(backgroundValueNew).toHaveAttribute(
        hiddenRow.background_attribute,
        new RegExp(hiddenRow.background),
      );
      await softExpect(paddingValue).toHaveValue(hiddenRow.padding_desktop);
      await softExpect(marginValue).toHaveValue(hiddenRow.margin);
      await webBuilder.backBtn.click();
      await expect(thirdRowPreview).toBeHidden();
    });

    await test.step("Switch back to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Edit in mobile view", async () => {
      const dndRowData = {
        from: {
          sectionName: editSection.content,
          subLayerName: dndMobile.from.layer,
          subLayerIndex: dndMobile.from.index,
        },
        to: {
          sectionName: editSection.content,
          subLayerName: dndMobile.to.layer,
          subLayerIndex: dndMobile.to.index,
          isExpand: true,
        },
      };
      await webBuilder.dndLayerInSidebar(dndRowData);
    });

    await test.step("Verify layer panel after edited", async () => {
      for (const data of conf.caseConf.mobile_after_dnd) {
        await webBuilder.openLayerSettings({
          sectionName: editSection.content,
          subLayerName: "Row",
          subLayerIndex: data.row_index,
        });
        await softExpect(spacingValue).toHaveText(data.spacing);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding);
        await softExpect(marginValue).toHaveValue(data.margin);
        await webBuilder.backBtn.click();
      }
      await expect(secondRowPreview).toBeHidden();
    });

    await test.step("Switch back to Desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify rows settings, order go back to default", async () => {
      await expect(firstRowPreview).toBeVisible();
      await expect(secondRowPreview).toBeVisible();
      await expect(thirdRowPreview).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_07 - Check hiển thị column khi switch qua lại giữa desktop và mobile", async ({
    conf,
  }) => {
    const createSection = conf.caseConf.create_section;
    const editSection = conf.caseConf.edit_section;
    const secondRow = conf.caseConf.second_row;
    const secondColumn = conf.caseConf.second_column;
    const firstColDesign = conf.caseConf.first_column_design;
    const secondColDesign = conf.caseConf.second_column_design;
    const thirdColDesign = conf.caseConf.third_column_design;
    const dndColumn = conf.caseConf.dnd_column;
    const expected = conf.caseConf.expected;
    const secondRowSidebar = webBuilder.getSidebarSelectorByName({
      sectionName: editSection.content,
      subLayerName: secondRow.name,
      subLayerIndex: secondRow.index,
    });
    const secondColumnSidebar = webBuilder.getSidebarSelectorByName({
      sectionName: editSection.content,
      subLayerName: secondColumn.name,
      subLayerIndex: secondColumn.index,
    });
    const firstColumnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 1 });
    const thirdColumnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 3 });
    const firstSectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
    const layoutValue = webBuilder
      .genLoc("[data-widget-id=layout]")
      .locator("span", { hasText: "Layout" })
      .getByRole("button");
    const clippingContent = webBuilder.genLoc("[data-widget-id=clipping_content]").getByRole("checkbox");
    await test.step("Pre-condition: create test data", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: createSection.parent_position,
        position: createSection.position,
        category: createSection.category,
        template: createSection.template,
      });
      await webBuilder.changeContent(editSection);
      await webBuilder.addRow({ parentPosition: { section: 1, row: 1 }, quickbar: true, layout: "1:1" });
      await webBuilder.editSpacing("layouts", conf.caseConf.spacing);
      await webBuilder.backBtn.click();
      await webBuilder.expandCollapseLayer({ sectionName: editSection.content, isExpand: true });
      await webBuilder.clickOnElement(secondColumnSidebar);
      await webBuilder.setBorder("border", secondColDesign.border);
      await webBuilder.setBackground("background", secondColDesign.background);
      await webBuilder.setMarginPadding("padding", secondColDesign.padding);
      await webBuilder.clickOnElement(firstColumnPreview, webBuilder.iframe);
      await webBuilder.setBorder("border", firstColDesign.border);
      await webBuilder.setBackground("background", firstColDesign.background);
      await webBuilder.setMarginPadding("padding", firstColDesign.padding);
      await webBuilder.clickOnElement(thirdColumnPreview, webBuilder.iframe);
      await webBuilder.setBorder("border", thirdColDesign.border);
      await webBuilder.setBackground("background", thirdColDesign.background);
      await webBuilder.setMarginPadding("padding", thirdColDesign.padding);
      await webBuilder.backBtn.click();
    });

    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.closeToastBtn.click();
    });

    await test.step("Verify sidebar and preview", async () => {
      for (const data of expected.design) {
        const columnPreview = webBuilder.getSelectorByIndex({ section: 1, column: data.column_index });
        await webBuilder.clickOnElement(columnPreview, webBuilder.iframe);
        await softExpect(layoutValue).toHaveText(data.layout);
        await softExpect(clippingContent).toHaveAttribute("value", data.clipping_content);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding_mobile);
      }
    });

    await test.step("Switch back to Desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify settings not changes", async () => {
      for (const data of expected.design) {
        const columnPreview = webBuilder.getSelectorByIndex({ section: 1, column: data.column_index });
        await webBuilder.clickOnElement(columnPreview, webBuilder.iframe);
        await softExpect(layoutValue).toHaveText(data.layout);
        await softExpect(clippingContent).toHaveAttribute("value", data.clipping_content);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding_desktop);
      }
    });

    await test.step("Switch back to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Make some changes", async () => {
      const dndColumnData = {
        from: {
          sectionName: editSection.content,
          subLayerName: dndColumn.from.layer,
          subLayerIndex: dndColumn.from.index,
        },
        to: {
          sectionName: editSection.content,
          subLayerName: dndColumn.to.layer,
          subLayerIndex: dndColumn.to.index,
          isExpand: true,
        },
      };
      await webBuilder.backBtn.click();
      await webBuilder.clickOnElement(secondRowSidebar);
      await webBuilder.editSpacing("layouts", conf.caseConf.edit_spacing.spacing);
      await webBuilder.backBtn.click();
      await webBuilder.dndLayerInSidebar(dndColumnData);
    });

    await test.step("Verify layers in sidebar and preview", async () => {
      const columnSpacing = webBuilder.frameLocator.locator(firstSectionPreview).locator(".column").nth(2);
      await softExpect(columnSpacing).toHaveCSS("--gutter", `${conf.caseConf.edit_spacing.spacing}px`);
      for (const data of expected.after_changed) {
        const columnPreview = webBuilder.getSelectorByIndex({ section: 1, column: data.column_index });
        await webBuilder.clickOnElement(columnPreview, webBuilder.iframe);
        await softExpect(layoutValue).toHaveText(data.layout);
        await softExpect(clippingContent).toHaveAttribute("value", data.clipping_content);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding_mobile);
      }
    });

    await test.step("Switch to desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
      await webBuilder.backBtn.click();
    });

    await test.step("Verify layer in sidebar and preview", async () => {
      const spacingValue = webBuilder
        .genLoc("[data-widget-id=layouts]")
        .filter({ hasText: "Spacing" })
        .getByRole("paragraph");
      for (const data of expected.design) {
        const columnPreview = webBuilder.getSelectorByIndex({ section: 1, column: data.column_index });
        await webBuilder.clickOnElement(columnPreview, webBuilder.iframe);
        await softExpect(layoutValue).toHaveText(data.layout);
        await softExpect(clippingContent).toHaveAttribute("value", data.clipping_content);
        await softExpect(borderValue).toHaveText(data.border_value);
        await softExpect(borderColor).toHaveAttribute("style", data.border_color);
        await softExpect(backgroundValueNew).toHaveAttribute(data.background_attribute, new RegExp(data.background));
        await softExpect(paddingValue).toHaveValue(data.padding_desktop);
      }
      await webBuilder.backBtn.click();
      await webBuilder.clickOnElement(secondRowSidebar);
      await softExpect(spacingValue).toHaveText(expected.desktop_spacing_value);
    });
  });

  const caseName = "SD_BLOCKS";
  const blocksConfig = loadData(__dirname, caseName);
  blocksConfig.caseConf.data.forEach(data => {
    test(`@${data.code_name} - Check hiển thị block ${data.block_type} khi switch qua lại giữa desktop và mobile`, async ({}) => {
      const addSection = blocksConfig.caseConf.add_section;
      const firstSectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
      const blockPreview = webBuilder.getSelectorByIndex({ section: 1, block: 1 });
      const marginStyle = webBuilder.frameLocator.locator(blockPreview);
      let blockStyle = marginStyle.locator(`[component=${data.component}]`);
      let shadowStyle: Locator;
      switch (data.component) {
        case "block_image":
          shadowStyle = marginStyle.locator("img.image");
          break;
        case "button":
          shadowStyle = marginStyle.locator("[class*=btn-]");
          blockStyle = shadowStyle;
          break;
        case "container":
          blockStyle = marginStyle.locator(`[data-block-component=${data.component}]`);
          shadowStyle = blockStyle;
          break;
        default:
          shadowStyle = blockStyle;
      }
      await test.step(`Pre-condition: Insert test block ${data.block_type}`, async () => {
        await webBuilder.insertSectionBlock({
          parentPosition: addSection.parent_position,
          category: addSection.category,
          template: addSection.template,
        });
        await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
        await webBuilder.insertSectionBlock({
          parentPosition: data.add_block.parent_position,
          category: data.add_block.category,
          template: data.add_block.template,
        });
        switch (data.component) {
          case "heading":
          case "paragraph":
          case "divider":
            break;
          default:
            await webBuilder.switchToTab("Design");
            break;
        }
      });

      await test.step("Switch to mobile view", async () => {
        await webBuilder.switchMobileBtn.click();
        await webBuilder.closeToastBtn.click();
      });

      await test.step("Verify block in mobile view", async () => {
        await softExpect(widthValue).toHaveValue(data.mobile_default.width_value);
        await softExpect(widthUnit).toHaveText(data.mobile_default.width_unit);
      });

      await test.step("Switch back to desktop without changing anything", async () => {
        await webBuilder.switchDesktopBtn.click();
      });

      await test.step("Verify no changes applied", async () => {
        await webBuilder.clickOnElement(blockPreview, webBuilder.iframe);
        await softExpect(widthValue).toHaveValue(data.desktop_default.width_value);
        await softExpect(widthUnit).toHaveText(data.desktop_default.width_unit);
      });

      await test.step("Switch to mobile view", async () => {
        await webBuilder.switchMobileBtn.click();
      });

      await test.step("Edit block", async () => {
        await webBuilder.changeDesign(data.edit_style);
      });

      await test.step("Verify changes responsive in preview", async () => {
        await verifyWidthHeightCSSInRange(blockStyle, "height", {
          min: data.after_edit.height.min,
          max: data.after_edit.height.max,
        });
        await verifyWidthHeightCSSInRange(blockStyle, "width", {
          min: data.after_edit.width.min,
          max: data.after_edit.width.max,
        });
        await softExpect(blockStyle).toHaveCSS("border", new RegExp(data.after_edit.border));
        await softExpect(blockStyle).toHaveCSS("background", new RegExp(data.after_edit.background));
        await softExpect(blockStyle).toHaveCSS("opacity", data.after_edit.opacity);
        await softExpect(blockStyle).toHaveCSS("border-radius", data.after_edit.radius);
        await softExpect(shadowStyle).toHaveCSS("box-shadow", data.after_edit.shadow);
        await softExpect(blockStyle).toHaveCSS("padding", data.after_edit.padding);
        await softExpect(marginStyle).toHaveCSS("margin", data.after_edit.margin);
      });

      await test.step("Switch to desktop view", async () => {
        await webBuilder.switchDesktopBtn.click();
      });

      await test.step("Verify no changes applied in desktop", async () => {
        await verifyWidthHeightCSSInRange(blockStyle, "height", {
          min: data.desktop_default.height.min,
          max: data.desktop_default.height.max,
        });
        await verifyWidthHeightCSSInRange(blockStyle, "width", {
          min: data.desktop_default.width.min,
          max: data.desktop_default.width.max,
        });
        await softExpect(blockStyle).toHaveCSS("border", new RegExp(data.desktop_default.border));
        await softExpect(blockStyle).toHaveCSS("background", new RegExp(data.desktop_default.background));
        await softExpect(blockStyle).toHaveCSS("opacity", data.desktop_default.opacity);
        await softExpect(blockStyle).toHaveCSS("border-radius", data.desktop_default.radius);
        await softExpect(shadowStyle).toHaveCSS("box-shadow", data.desktop_default.shadow);
        await softExpect(blockStyle).toHaveCSS("padding", data.desktop_default.padding);
        await softExpect(marginStyle).toHaveCSS("margin", data.desktop_default.margin);
      });
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_20 - Check hiển thị switch devices khi add template mới ở màn desktop", async ({
    conf,
  }) => {
    const addSection = conf.caseConf.add_section;
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    const sectionName = conf.caseConf.section_name;
    const firstSectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
    const firstColumnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 1 });
    const marginStyle = webBuilder.frameLocator.locator(firstSectionPreview);
    const sectionStyle = marginStyle.locator("[data-section-id]");
    const columnStyle = webBuilder.frameLocator.locator(firstColumnPreview);
    await test.step("Pre-condition: Setup data test", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.changeDesign(conf.caseConf.setup_desktop);
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
      await webBuilder.backBtn.click();
      await webBuilder.switchMobileBtn.click();
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
      await webBuilder.changeDesign(conf.caseConf.setup_mobile);
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Add section and blocks", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        position: addSection.position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(sectionName);
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.dndTemplateFromInsertPanel(conf.caseConf.dnd_block);
    });

    await test.step("Switch to desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify desktop preview and sidebar back to default", async () => {
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
      await webBuilder.switchToTab("Design");
      await softExpect(fullWidthBtn).toHaveAttribute("value", expected.side_bar.full_width);
      await softExpect(borderValue).toHaveText(expected.side_bar.border);
      await softExpect(borderColor).not.toHaveAttribute("style", expected.side_bar.border_color);
      await softExpect(backgroundValue).not.toHaveAttribute("style", expected.side_bar.background);
      await softExpect(paddingValue).toHaveValue(expected.side_bar.padding);
      await softExpect(marginValue).toHaveValue(expected.side_bar.margin);
      await verifyWidthHeightCSSInRange(columnStyle, "width", {
        min: expected.preview.column_width.min,
        max: expected.preview.column_width.max,
      });
      await softExpect(sectionStyle).toHaveCSS("height", expected.preview.height);
      await softExpect(sectionStyle).toHaveCSS("border", new RegExp(expected.preview.border));
      await softExpect(sectionStyle).toHaveCSS("background", new RegExp(expected.preview.background));
      await softExpect(sectionStyle).toHaveCSS("padding", expected.preview.padding);
      await softExpect(marginStyle).toHaveCSS("margin", expected.preview.margin);
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_21 - Check khi drag and drop block sang column/container khác khi chuyển từ desktop sang mobile", async ({
    conf,
  }) => {
    test.slow();
    const blankSectionName = conf.caseConf.section_name;
    const addSection = conf.caseConf.add_section;
    const expected = conf.caseConf.expected;
    const firstColumnSidebar = webBuilder.genLoc(
      webBuilder.getSidebarSelectorByIndex({ section: 1, row: 1, column: 1 }),
    );
    const secondColumnSidebar = webBuilder.genLoc(
      webBuilder.getSidebarSelectorByIndex({ section: 1, row: 1, column: 2 }),
    );
    const fourthColumnSidebar = webBuilder.genLoc(
      webBuilder.getSidebarSelectorByIndex({ section: 1, row: 2, column: 2 }),
    );
    const firstSectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
    const firstColumnPreview = webBuilder.frameLocator.locator(
      webBuilder.getSelectorByIndex({ section: 1, column: 1 }),
    );
    const secondColumnPreview = webBuilder.frameLocator.locator(
      webBuilder.getSelectorByIndex({ section: 1, column: 2 }),
    );
    const fourthColumnPreview = webBuilder.frameLocator.locator(
      webBuilder.getSelectorByIndex({ section: 1, column: 4 }),
    );
    const blockInFirstColumnPreview = firstColumnPreview.locator(webBuilder.blocksInPreview);
    const blockInSecondColumnPreview = secondColumnPreview.locator(webBuilder.blocksInPreview);
    const blockInFourthColumnPreview = fourthColumnPreview.locator(webBuilder.blocksInPreview);
    const blockInFirstColumnSidebar = firstColumnSidebar.locator(webBuilder.blocksInSidebar);
    const blockInSecondColumnSidebar = secondColumnSidebar.locator(webBuilder.blocksInSidebar);
    const blockInFourthColumnSidebar = fourthColumnSidebar.locator(webBuilder.blocksInSidebar);
    await test.step("Pre-condition: Setup test data", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.switchToTab("Design");
      await webBuilder.changeContent(blankSectionName);
      await webBuilder.addRow({ parentPosition: { section: 1, row: 1 }, layout: "1:1", quickbar: true });
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
      for (const block of conf.caseConf.add_blocks) {
        await webBuilder.dragAndDropInWebBuilder(block);
      }
      await webBuilder.backBtn.click();
      await webBuilder.expandCollapseLayer({ sectionName: blankSectionName.content, isExpand: true });
    });

    await test.step("Click switch mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.closeToastBtn.click();
    });

    await test.step("Drag and drop block 2 in row 1 column 1 to row 1 column 2", async () => {
      await webBuilder.dndTemplateInPreview(conf.caseConf.dnd_blocks.mobile);
    });

    await test.step("Verify blocks in preview and toast appear", async () => {
      await softExpect(webBuilder.toastMessage).toHaveText(expected.message);
      await softExpect(blockInFirstColumnPreview).toHaveCount(expected.mobile.first_column.block_count);
      await softExpect(blockInSecondColumnPreview).toHaveCount(expected.mobile.second_column.block_count);
      await softExpect(blockInFirstColumnPreview.nth(0)).toHaveAttribute(
        "component",
        expected.mobile.first_column.block_name,
      );
      for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
        await softExpect(blockInSecondColumnPreview.nth(blockIndex)).toHaveAttribute(
          "component",
          expected.mobile.second_column.block_name[blockIndex],
        );
      }
      await softExpect(blockInFirstColumnSidebar).toHaveCount(expected.mobile.first_column.block_count);
      await softExpect(blockInSecondColumnSidebar).toHaveCount(expected.mobile.second_column.block_count);
      await softExpect(blockInFirstColumnSidebar.nth(0)).toContainText(expected.mobile.first_column.sidebar_name);
      for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
        await softExpect(blockInSecondColumnSidebar.nth(blockIndex)).toContainText(
          expected.mobile.second_column.sidebar_name[blockIndex],
        );
      }
    });

    await test.step("Switch to desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Verify block order is synchronized in mobile and desktop view", async () => {
      await softExpect(blockInFirstColumnPreview).toHaveCount(expected.mobile.first_column.block_count);
      await softExpect(blockInSecondColumnPreview).toHaveCount(expected.mobile.second_column.block_count);
      await softExpect(blockInFirstColumnPreview.nth(0)).toHaveAttribute(
        "component",
        expected.mobile.first_column.block_name,
      );
      for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
        await softExpect(blockInSecondColumnPreview.nth(blockIndex)).toHaveAttribute(
          "component",
          expected.mobile.second_column.block_name[blockIndex],
        );
      }
      await softExpect(blockInFirstColumnSidebar).toHaveCount(expected.mobile.first_column.block_count);
      await softExpect(blockInSecondColumnSidebar).toHaveCount(expected.mobile.second_column.block_count);
      await softExpect(blockInFirstColumnSidebar.nth(0)).toContainText(expected.mobile.first_column.sidebar_name);
      for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
        await softExpect(blockInSecondColumnSidebar.nth(blockIndex)).toContainText(
          expected.mobile.second_column.sidebar_name[blockIndex],
        );
      }
    });

    await test.step("Drag block in row 1 column 1 to row 2 column 2", async () => {
      await webBuilder.dndTemplateInPreview(conf.caseConf.dnd_blocks.desktop);
    });

    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Verify block order is synchronized with desktop view", async () => {
      await expect(blockInFirstColumnPreview).toBeHidden();
      await softExpect(blockInFourthColumnPreview).toHaveCount(expected.desktop.fourth_column.block_count);
      for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
        await softExpect(blockInFourthColumnPreview.nth(blockIndex)).toHaveAttribute(
          "component",
          expected.desktop.fourth_column.block_name[blockIndex],
        );
      }
      await expect(blockInFirstColumnSidebar).toBeHidden();
      await softExpect(blockInFourthColumnSidebar).toHaveCount(expected.desktop.fourth_column.block_count);
      for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
        await softExpect(blockInFourthColumnSidebar.nth(blockIndex)).toContainText(
          expected.desktop.fourth_column.sidebar_name[blockIndex],
        );
      }
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_22 - Check khi remove section/ row/block", async ({ conf }) => {
    const deleteBlock = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(conf.caseConf.block_position));
    await test.step("Pre-condition: Setup test data", async () => {
      for (const section of conf.caseConf.add_sections) {
        await webBuilder.insertSectionBlock({
          parentPosition: section.config.parent_position,
          category: section.config.category,
          template: section.config.template,
        });
        await webBuilder.switchToTab("Content");
        await webBuilder.changeContent(section.settings);
        await webBuilder.backBtn.click();
        await webBuilder.insertSectionBlock({
          parentPosition: section.add_block.parent_position,
          category: section.add_block.category,
          template: section.add_block.template,
        });
        await webBuilder.dragAndDropInWebBuilder(section.dnd_block);
      }
    });

    await test.step("Pre-condition: Settings mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.switchToTab("Design");
      await webBuilder.setMarginPadding("margin", conf.caseConf.mobile_margin);
      await webBuilder.switchDesktopBtn.click();
    });

    await test.step("Delete Block in column 2 of section 1", async () => {
      await webBuilder.switchMobileBtn.click();
      await deleteBlock.click();
      await webBuilder.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify block was deleted in both desktop and mobile view", async () => {
      await expect(deleteBlock).toBeHidden();
      await webBuilder.switchDesktopBtn.click();
      await expect(deleteBlock).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_23 - Check quickbar setting của section trên mobile", async ({ conf }) => {
    const sectionName = conf.caseConf.section_name;
    const firstSectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
    const addSection = conf.caseConf.add_section;
    const expected = conf.caseConf.expected;
    const firstSectionSidebar = webBuilder.getSidebarSelectorByName({
      sectionName: sectionName.content,
    });
    const secondSectionPreview = webBuilder.getSelectorByIndex({ section: 2 });
    await test.step("Pre-condition: setup data test", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(sectionName);
    });

    await test.step("Click section 1", async () => {
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
    });

    await test.step("Verify quick bar settings button", async () => {
      for (const name of expected.section_quickbar) {
        await expect(webBuilder.quickBarButton(name.button)).toBeVisible();
      }
    });

    await test.step("Click row 1 in section 1", async () => {
      const rowSidebar = webBuilder.genLoc(
        webBuilder.getSidebarSelectorByName({
          sectionName: sectionName.content,
          subLayerName: "Row",
        }),
      );
      await webBuilder.backBtn.click();
      await webBuilder.expandCollapseLayer({ sectionName: sectionName.content, isExpand: true });
      await rowSidebar.click();
    });

    await test.step("Verify row quickbar settings", async () => {
      for (const name of expected.row_quickbar) {
        await expect(webBuilder.quickBarButton(name.button)).toBeVisible();
      }
    });

    await test.step("Click move down button", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Move down");
    });

    await test.step("Verify section is moved down", async () => {
      await webBuilder.frameLocator.locator(secondSectionPreview).hover({ position: { x: 1, y: 1 } });
      await expect(webBuilder.breadCrumb).toHaveText(expected.bread_crumb);
    });

    await test.step("Click move up button", async () => {
      await webBuilder.selectOptionOnQuickBar("Move up");
    });

    await test.step("Verify section is moved up", async () => {
      await webBuilder.frameLocator.locator(firstSectionPreview).hover({ position: { x: 1, y: 1 } });
      await expect(webBuilder.breadCrumb).toHaveText(expected.bread_crumb);
    });

    await test.step("Click hide button", async () => {
      await webBuilder.selectOptionOnQuickBar("Hide");
    });

    await test.step("Verify section is hidden", async () => {
      await expect(webBuilder.frameLocator.locator(firstSectionPreview)).toBeHidden();
    });

    await test.step("Click duplicate button", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.hideOrShowLayerInSidebar({ sectionName: sectionName.content, isHide: false });
      await webBuilder.genLoc(firstSectionSidebar).click();
      await webBuilder.selectOptionOnQuickBar("Duplicate");
    });

    await test.step("Verify the duplicated section is below and have same name as test section", async () => {
      await webBuilder.frameLocator.locator(secondSectionPreview).hover({ position: { x: 1, y: 1 } });
      await expect(webBuilder.breadCrumb).toHaveText(expected.bread_crumb);
      await expect(webBuilder.frameLocator.locator(secondSectionPreview)).toHaveAttribute(
        expected.section_state.attribute,
        new RegExp(expected.section_state.value),
      );
    });

    await test.step("Click Save as template button", async () => {
      await webBuilder.selectOptionOnQuickBar("Save as template");
    });

    await test.step("Verify popup displays", async () => {
      const popupSaveTemplate = webBuilder.popupSaveTemplate;
      const popupDescription = webBuilder.popupDescription;
      const learnMoreBtn = popupSaveTemplate.getByRole("link", { name: "Learn more" });
      await expect(popupSaveTemplate).toBeVisible();
      await expect(popupDescription).toContainText(expected.save_template_description);
      await expect(learnMoreBtn).toHaveAttribute("href", new RegExp(expected.learn_more));
      await popupSaveTemplate.getByRole("button", { name: "Cancel" }).click();
    });

    await test.step("Click remove button", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.clickOnElement(secondSectionPreview, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify section is removed in preview and sidebar", async () => {
      const sectionNames = await webBuilder.getAllSectionName();
      await webBuilder.frameLocator.locator(secondSectionPreview).hover({ position: { x: 1, y: 1 } });
      await expect(webBuilder.breadCrumb).not.toHaveText(expected.bread_crumb);
      const actualSectionCountSidebar = sectionNames.filter(count => {
        return count === sectionName.content;
      }).length;
      expect(actualSectionCountSidebar).toEqual(expected.test_section_count);
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_24 - Check quickbar setting của row trên mobile", async ({ conf }) => {
    let newRowId: string;
    const addSection = conf.caseConf.add_section;
    const expected = conf.caseConf.expected;
    const sectionName = conf.caseConf.section_name;
    const firstRowPreview = webBuilder.getSelectorByIndex({ section: 1, row: 1 });
    const secondRowPreview = webBuilder.getSelectorByIndex({ section: 1, row: 2 });
    const firstRowStatus = webBuilder.frameLocator.locator(
      `${firstRowPreview}//ancestor::div[contains(@class,'row relative')]`,
    );
    const duplicatedRow = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, row: 2 }));
    await test.step("Pre-condition: setup data test", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(sectionName);
    });

    await test.step("Select row 1 in section 1", async () => {
      const rowSidebar = webBuilder.genLoc(
        webBuilder.getSidebarSelectorByName({
          sectionName: sectionName.content,
          subLayerName: "Row",
        }),
      );
      await webBuilder.backBtn.click();
      await webBuilder.expandCollapseLayer({ sectionName: sectionName.content, isExpand: true });
      await rowSidebar.click();
    });

    await test.step("Verify row quickbar buttons", async () => {
      for (const name of expected.row_quickbar) {
        await expect(webBuilder.quickBarButton(name.button)).toBeVisible();
      }
    });

    await test.step("Verify row is selected", async () => {
      await expect(firstRowStatus).toHaveClass(new RegExp(expected.row_selected));
    });

    await test.step("Click add row button", async () => {
      await webBuilder.addRow({ parentPosition: { section: 1, row: 1 }, quickbar: true });
      newRowId = await webBuilder.frameLocator
        .locator(secondRowPreview)
        .locator(webBuilder.rowContainer)
        .getAttribute("data-row-id");
    });

    await test.step("Verify new row created and selected", async () => {
      await expect(duplicatedRow).toHaveClass(new RegExp(expected.row_selected));
    });

    await test.step("Click move up button", async () => {
      await webBuilder.selectOptionOnQuickBar("Move up");
    });

    await test.step("Verify new row is moved up", async () => {
      await expect(webBuilder.frameLocator.locator(firstRowPreview).locator(webBuilder.rowContainer)).toHaveAttribute(
        "data-row-id",
        newRowId,
      );
    });

    await test.step("Click move down button", async () => {
      await webBuilder.selectOptionOnQuickBar("Move down");
    });

    await test.step("Verify new row is moved down", async () => {
      await expect(webBuilder.frameLocator.locator(secondRowPreview).locator(webBuilder.rowContainer)).toHaveAttribute(
        "data-row-id",
        newRowId,
      );
    });

    await test.step("CLick duplicate button", async () => {
      await webBuilder.selectOptionOnQuickBar("Duplicate");
    });

    await test.step("Verify duplicate row", async () => {
      await softExpect(spacingValue).toHaveText(expected.duplicate_row.spacing);
      await softExpect(borderValue).toHaveText(expected.duplicate_row.border_value);
      await softExpect(borderColor).not.toHaveAttribute("style", expected.duplicate_row.border_color);
      await softExpect(backgroundValue).not.toHaveAttribute("style", new RegExp(expected.duplicate_row.background));
      await softExpect(paddingValue).toHaveValue(expected.duplicate_row.padding);
      await softExpect(marginValue).toHaveValue(expected.duplicate_row.margin);
    });

    await test.step("Click remove button", async () => {
      await webBuilder.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify duplicated row is removed", async () => {
      const duplicatedRowPreview = webBuilder.getSelectorByIndex(conf.caseConf.duplicated_row);
      const duplicatedRowInSideBar = webBuilder.genLoc("[section-index='0']").locator("[data-row-id]").nth(2);
      await webBuilder.expandCollapseLayer({ sectionName: sectionName.content, isExpand: true });
      await expect(webBuilder.frameLocator.locator(duplicatedRowPreview)).toBeHidden();
      await expect(duplicatedRowInSideBar).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_25 - Check quickbar setting của column trên mobile", async ({ conf }) => {
    let movedColumnId: string;
    const firstSectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
    const addSection = conf.caseConf.add_section;
    const sectionName = conf.caseConf.section_name;
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    const firstRowSidebar = webBuilder.genLoc(
      webBuilder.getSidebarSelectorByName({
        sectionName: sectionName.content,
        subLayerName: "Row",
      }),
    );
    const firstColumnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 1 });
    const secondColumnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 2 });
    await test.step("Pre-condition: setup data test", async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(sectionName);
      await webBuilder.backBtn.click();
      await webBuilder.expandCollapseLayer({ sectionName: sectionName.content, isExpand: true });
      await firstRowSidebar.click();
      await webBuilder.addRow({ parentPosition: { section: 1, row: 1 }, quickbar: true });
      await webBuilder.clickOnElement(firstSectionPreview, webBuilder.iframe);
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
    });

    await test.step("Click first column", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.openLayerSettings({
        sectionName: conf.caseConf.section_name.content,
        subLayerName: "Column",
      });
    });

    await test.step("Verify column quickbar buttons", async () => {
      for (const name of expected.column_quickbar) {
        await expect(webBuilder.quickBarButton(name.button)).toBeVisible();
        await expect(webBuilder.quickBarButton(name.button)).toHaveClass(new RegExp(expected.disabled));
      }
    });

    await test.step("Add 1 more column in desktop view", async () => {
      await webBuilder.switchDesktopBtn.click();
      await webBuilder.selectOptionOnQuickBar("Add column");
      movedColumnId = await webBuilder.frameLocator
        .locator(firstColumnPreview)
        .locator(webBuilder.columnContainer)
        .getAttribute("data-column-id");
    });

    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Click move right button", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.openLayerSettings({
        sectionName: conf.caseConf.section_name.content,
        subLayerName: "Column",
      });
      await webBuilder.selectOptionOnQuickBar("Move right");
    });

    await test.step("Verify column is moved down", async () => {
      await expect(
        webBuilder.frameLocator.locator(secondColumnPreview).locator(webBuilder.columnContainer),
      ).toHaveAttribute("data-column-id", movedColumnId);
    });

    await test.step("Click move left button", async () => {
      await webBuilder.selectOptionOnQuickBar("Move left");
    });

    await test.step("Verify column is moved up", async () => {
      await expect(
        webBuilder.frameLocator.locator(firstColumnPreview).locator(webBuilder.columnContainer),
      ).toHaveAttribute("data-column-id", movedColumnId);
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_26 - Check quickbar setting của block trên mobile", async ({ conf }) => {
    test.slow(); //Tăng timeout cho các môi trường run chậm, lag
    const addSection = conf.caseConf.add_section;
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    const sectionName = conf.caseConf.section_name;
    const duplicatedBlockPreview = webBuilder.frameLocator
      .locator(webBuilder.getSelectorByIndex(conf.caseConf.duplicated_block))
      .locator("[component=button]");
    const blockButton = webBuilder.getSelectorByIndex(conf.caseConf.block_button);
    await test.step("Pre-condition: setup data test", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(sectionName);
      await webBuilder.backBtn.click();
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Verify quickbar buttons of block with position = auto", async () => {
      for (const name of expected.block_quickbar) {
        await expect(webBuilder.quickBarButton(name.button)).toBeVisible();
      }
    });

    await test.step("Click hide block", async () => {
      await webBuilder.frameLocator.locator(blockButton).click();
      await webBuilder.selectOptionOnQuickBar("Hide");
    });

    await test.step("Verify block is hidden", async () => {
      await expect(webBuilder.frameLocator.locator(blockButton)).toBeHidden();
    });

    await test.step("Click duplicate button", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.expandCollapseLayer({
        sectionName: sectionName.content,
        isExpand: true,
      });
      await webBuilder.hideOrShowLayerInSidebar({
        sectionName: sectionName.content,
        subLayerName: addBlock.template,
        isHide: false,
      });
      await webBuilder.frameLocator.locator(blockButton).click();
      await webBuilder.selectOptionOnQuickBar("Duplicate");
    });

    await test.step("Verify duplicated a similar block", async () => {
      const styleOption = webBuilder
        .genLoc(webBuilder.getSelectorByLabel("style"))
        .getByRole("button", { name: "Primary" });
      const textColor = webBuilder.genLoc(webBuilder.getSelectorByLabel("btn_color")).locator(webBuilder.colorSidebar);
      const alignCenter = webBuilder
        .genLoc(webBuilder.getSelectorByLabel("align_self"))
        .locator(webBuilder.alignItem)
        .nth(1);
      const opacity = webBuilder.genLoc(webBuilder.getSelectorByLabel("opacity")).getByRole("spinbutton");
      const radius = webBuilder.genLoc(webBuilder.getSelectorByLabel("btn_radius")).getByRole("spinbutton");
      const btnLabel = webBuilder.frameLocator.locator(blockButton);
      await webBuilder.switchToTab("Design");
      await softExpect(styleOption).toHaveClass(new RegExp(expected.style));
      await softExpect(textColor).toHaveAttribute("style", expected.text_color);
      await softExpect(alignCenter).toHaveClass(new RegExp(expected.align));
      await softExpect(widthValue).toHaveValue(expected.width_value);
      await softExpect(widthUnit).toHaveText(expected.width_unit);
      await softExpect(backgroundValue).toHaveAttribute("style", expected.background);
      await softExpect(borderColor).not.toHaveAttribute("style", expected.border_value);
      await softExpect(borderValue).toHaveText(expected.border_value);
      await softExpect(opacity).toHaveValue(expected.opacity);
      await softExpect(radius).toHaveValue(expected.radius);
      await softExpect(btnLabel).toContainText(expected.label);
    });

    await test.step("Click Save as template button", async () => {
      await webBuilder.selectOptionOnQuickBar("Save as template");
    });

    await test.step("Verify popup displays", async () => {
      const popupSaveTemplate = webBuilder.popupSaveTemplate;
      const popupDescription = webBuilder.popupDescription;
      const learnMoreBtn = popupSaveTemplate.getByRole("link", { name: "Learn more" });
      await expect(popupSaveTemplate).toBeVisible();
      await softExpect(popupDescription).toContainText(expected.save_template_description);
      await softExpect(learnMoreBtn).toHaveAttribute("href", new RegExp(expected.learn_more));
      await popupSaveTemplate.getByRole("button", { name: "Cancel" }).click();
    });

    await test.step("Click remove button", async () => {
      await duplicatedBlockPreview.click();
      await webBuilder.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify block is deleted", async () => {
      const duplicatedBlockInSideBar = webBuilder.genLoc("[section-index='0']").locator("[data-block-id]").nth(1);
      await expect(duplicatedBlockPreview).toBeHidden();
      await expect(duplicatedBlockInSideBar).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_NAV_SD_27 - Check ghost của block/section khi drag block/section từ Insert Panel vào webfront trên mobile", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Open insert panel", async () => {
      await webBuilder.clickBtnNavigationBar(conf.caseConf.insert_panel);
      await expect(webBuilder.templateContainer).toBeVisible();
    });

    const insertPanelBox = await webBuilder.templateContainer.boundingBox();
    await test.step("Hold mouse down on a section template", async () => {
      await webBuilder.templateInCategory(conf.caseConf.section_template).hover();
      await dashboard.mouse.down();
      await dashboard.mouse.move(
        insertPanelBox.x + insertPanelBox.width / 2,
        insertPanelBox.y + insertPanelBox.height / 2,
        { steps: 2 },
      );
    });

    await test.step("Verify ghost appear while hold to drag section", async () => {
      await expect(webBuilder.draggingGhost).toBeVisible();
      await dashboard.mouse.up();
    });

    await test.step("Hold mouse down on a block template", async () => {
      await webBuilder.templateInCategory(conf.caseConf.block_template).hover();
      await dashboard.mouse.down();
      await dashboard.mouse.move(
        insertPanelBox.x + insertPanelBox.width / 2,
        insertPanelBox.y + insertPanelBox.height / 2,
        { steps: 2 },
      );
    });

    await test.step("Verify ghost appear while hold to drag block", async () => {
      await expect(webBuilder.draggingGhost).toBeVisible();
      await dashboard.mouse.up();
    });
  });
});
