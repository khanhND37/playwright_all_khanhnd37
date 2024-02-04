import { loadData } from "@core/conf/conf";
import { verifyWidthHeightCSSInRange } from "@core/utils/css";
import { test, expect } from "@fixtures/website_builder";
import { ProductAPI } from "@pages/api/product";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SFBlocks } from "@pages/storefront/block";
import { Locator } from "@playwright/test";
import { PageSettingsData, ShopTheme } from "@types";

test.describe("@SB_TABS_ACCORDION - Check block Tabs/Accordion", () => {
  let webBuilder: WebBuilder,
    block: Blocks,
    productSF: SFBlocks,
    prodAPI: ProductAPI,
    displayAs: Locator,
    testProdId: number,
    firstBlock: Locator,
    border: Locator,
    background: Locator,
    padding: Locator,
    margin: Locator,
    widthValue: Locator,
    widthUnit: Locator,
    heightValue: Locator,
    heightUnit: Locator,
    layoutBtn: Locator,
    themeTest: ShopTheme;
  const blockIds = [];
  const softAssertion = expect.configure({ soft: true, timeout: 1000 });

  test.beforeEach(async ({ dashboard, theme, builder, conf, authRequest, context }) => {
    prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain, context);
    block = new Blocks(dashboard, conf.suiteConf.domain, context);
    displayAs = webBuilder.genLoc(block.getSelectorByLabel("mode")).getByRole("button");
    firstBlock = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    border = block.genLoc(block.getSelectorByLabel("border")).getByRole("button");
    background = block.genLoc(block.getSelectorByLabel("background")).locator(block.colorSidebar);
    padding = block.genLoc(block.getSelectorByLabel("padding")).getByRole("textbox");
    margin = block.genLoc(block.getSelectorByLabel("margin")).getByRole("textbox");
    widthValue = block.genLoc(block.getSelectorByLabel("width")).getByRole("spinbutton");
    widthUnit = block.genLoc(block.getSelectorByLabel("width")).getByRole("button");
    heightValue = webBuilder.genLoc(block.getSelectorByLabel("height")).getByRole("spinbutton");
    heightUnit = webBuilder.genLoc(block.getSelectorByLabel("height")).getByRole("button");
    layoutBtn = webBuilder.genLoc(block.getSelectorByLabel("tab_layout")).getByRole("button");
    const listProducts = await prodAPI.getAllProduct(conf.suiteConf.domain);

    await test.step("Pre-condition: Clear data", async () => {
      listProducts.forEach(prod => {
        if (prod.title === conf.suiteConf.product_test) {
          testProdId = prod.id;
        }
      });
    });

    await test.step("Pre-condition: Restore theme test", async () => {
      const listTheme = await theme.list();
      themeTest = listTheme.find(theme => theme.name === conf.suiteConf.theme_test);
      const response = await builder.pageSiteBuilder(themeTest.id);
      const settingsData = response.settings_data as PageSettingsData;
      for (const section of settingsData.pages["product"].default.elements) {
        section.elements[0].elements[0].elements = [];
      }
      await builder.updateSiteBuilder(themeTest.id, settingsData);
    });

    await test.step("Pre-condition: Go to Web builder", async () => {
      await webBuilder.openWebBuilder({
        type: "ecom product custom",
        id: themeTest.id,
        productId: testProdId,
        layout: "default",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.reloadIfNotShow("products");
    });
  });

  test.afterEach(async ({}) => {
    await test.step("Xoá block sau khi test", async () => {
      if (blockIds.length > 0) {
        for (const id of blockIds) {
          await block.clickElementById(id, ClickType.BLOCK);
          await block.removeBtn.click();
        }
        await block.clickSave();
        blockIds.length = 0;
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_08 Check setting Design cho block Tab`, async ({
    snapshotFixture,
    dashboard,
    cConf,
  }) => {
    let backgroundImg: string;
    const expected = cConf.expected;
    await test.step(`Add block Tab mới vào preview`, async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: cConf.add_tabs.parent_position,
        category: cConf.add_tabs.basics_cate,
        template: cConf.add_tabs.template,
      });
      blockIds.push(blockId);
    });

    await test.step(`Mở layout settings của tabs`, async () => {
      await webBuilder.switchToTab("Design");
      await layoutBtn.click();
    });

    for (const data of cConf.click_layout) {
      const layout = webBuilder.genLoc(block.popover).locator(block.tabsLayoutType).nth(data.index);
      await test.step(`Click vào layout ${data.layout_name}`, async () => {
        await layout.click();
      });

      await test.step("Verify popup layout default data", async () => {
        const tabLayoutWidgets = block.genLoc(block.getSelectorByLabel("tab_layout")).locator(block.tabLayoutWidgets);
        const activeColor = tabLayoutWidgets.filter({ hasText: "Active Color" }).locator(block.colorSidebar);
        const activeText = tabLayoutWidgets.filter({ hasText: "Active Text" }).locator(block.colorSidebar);
        const underline = block.getTabsLayoutField("underline").getByRole("checkbox");
        const shape = block.getTabsLayoutField("shape").getByRole("button");
        await softAssertion(layout).toHaveClass(new RegExp(data.expected.selected));
        await softAssertion(activeColor).toHaveCSS("background-color", data.expected.default_active_color);
        await softAssertion(activeText).toHaveCSS("background-color", data.expected.default_active_text);
        if (data.expected.default_on) {
          await softAssertion(underline).toHaveAttribute("value", data.expected.default_on);
        }
        if (data.expected.default_shape) {
          await softAssertion(shape).toHaveText(data.expected.default_shape);
        }
      });
    }

    for (const layoutData of cConf.edit_layout_tabs) {
      await test.step(`Setting layout cho block`, async () => {
        await block.settingDesignAndContentWithSDK(layoutData);
      });

      await test.step("Verify changed in preview", async () => {
        await softAssertion(firstBlock.locator(block.tabsLayout)).toHaveClass(new RegExp(layoutData.expected.layout));
        await softAssertion(firstBlock.locator(block.tabsLayout)).toHaveCSS(
          "--active-color",
          layoutData.expected.active_color,
        );
        await softAssertion(firstBlock.locator(block.tabsLayout)).toHaveCSS(
          "--active-text-color",
          layoutData.expected.active_text,
        );
      });
    }

    for (const headingAlign of cConf.align_data) {
      await test.step(`Thay đổi Align của Heading: left/center/right/distribute`, async () => {
        await firstBlock.click({ position: { x: 1, y: 1 } });
        await block.switchToTab("Design");
        await block.settingDesignAndContentWithSDK(headingAlign);
      });

      await test.step("Verify heading changed", async () => {
        await block.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: firstBlock.locator(block.tabsHeading),
          combineOptions: {
            maxDiffPixelRatio: 0.01,
            expectToPass: {
              timeout: 20000,
              intervals: [1_000, 3_000, 5_000],
            },
          },
          snapshotName: headingAlign.expected.align_position,
        });
      });
    }

    await test.step(`Settings:- Align: Left- Width: auto- Height: auto- Background: upload image- Border: size S- Opacity: 50%- Radius: 8px- Shadow: Light- Pading: 10,10, 20, 20- Margin: None`, async () => {
      await firstBlock.click({ position: { x: 1, y: 1 } });
      await block.switchToTab("Design");
      await block.settingDesignAndContentWithSDK(cConf.edit_design);
      await block.genLoc(block.getSelectorByLabel("background")).locator(block.colorSidebar).click();
      await block.getTabBackground("Image").click();
      backgroundImg = await block.genLoc(block.popover).getByRole("img").first().getAttribute("src");
      await block.titleBar.click();
    });

    await test.step("Verify block after edit", async () => {
      await verifyWidthHeightCSSInRange(firstBlock, "width", {
        min: expected.preview_width_min,
        max: expected.preview_width_max,
      });
      await softAssertion(firstBlock).toHaveCSS("position", expected.preview_position);
      await softAssertion(firstBlock).toHaveCSS("align-self", expected.preview_align);
      await softAssertion(firstBlock.locator(block.blockTabs)).toHaveCSS("background-image", new RegExp(backgroundImg));
      await softAssertion(firstBlock.locator(block.blockTabs)).toHaveCSS("border", expected.preview_border);
      await softAssertion(firstBlock.locator(block.blockTabs)).toHaveCSS("opacity", expected.preview_opacity);
      await softAssertion(firstBlock.locator(block.blockTabs)).toHaveCSS("border-radius", expected.preview_radius);
      await softAssertion(firstBlock.locator(block.blockTabs)).toHaveCSS("box-shadow", expected.preview_shadow);
      await softAssertion(firstBlock).toHaveCSS("margin", expected.preview_margin);
      await softAssertion(firstBlock.locator(block.blockTabs)).toHaveCSS("padding", expected.preview_padding);
    });

    for (const tab of cConf.tab_name) {
      await test.step(`Click vào ${tab.name}`, async () => {
        await firstBlock.getByRole("button", { name: tab.name }).click();
      });

      await test.step(`Verify item content ${tab.name}`, async () => {
        await firstBlock.locator(block.tabsAccordionItem.first()).hover({ position: { x: 1, y: 1 } });
        await expect(webBuilder.breadCrumb).toContainText(tab.item);
      });
    }
  });

  test(`@SB_WEB_BUILDER_LB_TABA_10 Check setting Content với block Tab`, async ({ cConf }) => {
    const expected = cConf.expected;
    const addItemBtn = webBuilder.genLoc(block.getSelectorByLabel("headings")).getByRole("button");
    const deleteLastItemBtn = block.getBtnTabsAccordionHeading({ item: 10, button: "delete" });
    const duplicateItem1Btn = block.getBtnTabsAccordionHeading({ item: 1, button: "duplicate" });
    const blockInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const popoverShowIcon = block.genLoc(block.popover).locator(block.getSelectorByLabel("show_icon"));
    const popoverSelectIcon = block.genLoc(block.popover).locator(block.getSelectorByLabel("icon"));

    await test.step(`Add block tab mới vào preview`, async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: cConf.add_tabs.parent_position,
        category: cConf.add_tabs.basics_cate,
        template: cConf.add_tabs.template,
      });
      blockIds.push(blockId);
    });

    await test.step(`Click Add item`, async () => {
      await block.switchToTab("Content");
      await addItemBtn.click();
    });

    await test.step("Verify new tab is added in sidebar and preview", async () => {
      await expect(block.getBtnTabsAccordionHeading({ item: 4 })).toBeVisible();
      await softAssertion(blockInPreview.getByRole("button").last()).toHaveText(expected.new_tab_title);
    });

    await test.step(`Add > 10 items vào block`, async () => {
      for (let i = 0; i < 6; i++) {
        await addItemBtn.click();
      }
    });

    await test.step("Verify add item button is hidden", async () => {
      await expect(addItemBtn).toBeHidden();
      for (let i = 1; i <= cConf.max_items; i++) {
        const duplicateBtn = block.getBtnTabsAccordionHeading({ item: i, button: "duplicate" });
        await expect(duplicateBtn).toHaveClass(new RegExp(expected.disabled));
      }
    });

    await test.step(`Kéo thả để thay đổi vị trí của các item`, async () => {
      await block.dndTabAccordionItemInSidebar(cConf.dnd_item2_to_item_10);
    });

    await test.step("Verify after dropped item", async () => {
      await softAssertion(blockInPreview.getByRole("button").last()).toHaveText(expected.tab2_title);
    });

    await test.step(`Click Remove item 10`, async () => {
      await deleteLastItemBtn.click();
    });

    await test.step("Verify item is deleted", async () => {
      await expect(blockInPreview.getByRole("button").filter({ hasText: cConf.deleted_tab })).toBeHidden();
      await expect(blockInPreview.getByRole("button").filter({ hasText: cConf.deleted_tab })).not.toBeAttached();
    });

    await test.step(`Remove đến khi chỉ còn 1 item`, async () => {
      for (let i = 9; i > 1; i--) {
        const deleteItemBtn = block.getBtnTabsAccordionHeading({ item: i, button: "delete" });
        await deleteItemBtn.click();
      }
    });

    await test.step("Verify delete button is disabled", async () => {
      await softAssertion(block.getBtnTabsAccordionHeading({ item: 1, button: "delete" })).toBeHidden();
    });

    await test.step(`Click Duplicate item khi đang có < 10 items`, async () => {
      await duplicateItem1Btn.click();
    });

    await test.step("Verify duplicated tab have the same content", async () => {
      await softAssertion(blockInPreview.getByRole("button").last()).toHaveText(expected.tab1_title);
    });

    await test.step(`Click vào option Edit`, async () => {
      await block.getBtnTabsAccordionHeading({ item: 1, button: "settings" }).click();
    });

    await test.step("Verify popup change icon appear", async () => {
      await expect(block.genLoc(block.popover).locator(block.getSelectorByLabel("show_icon"))).toBeVisible();
    });

    await test.step(`Turn on Icon và select icon`, async () => {
      await block.switchToggle(popoverShowIcon, cConf.turn_on);
      await block.selectIcon(popoverSelectIcon, cConf.icon_home);
    });

    await test.step("Verify icon is added", async () => {
      await expect(
        blockInPreview.getByRole("button").locator(block.tabsIcon).filter({ hasText: cConf.icon_home }),
      ).toBeVisible();
    });

    await test.step(`Turn off Icon`, async () => {
      await block.getBtnTabsAccordionHeading({ item: 1, button: "settings" }).click();
      await block.switchToggle(popoverShowIcon, cConf.turn_off);
    });

    await test.step("Verify icon is added", async () => {
      await expect(
        blockInPreview.getByRole("button").locator(block.tabsIcon).filter({ hasText: cConf.icon_home }),
      ).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_11 Check setting Content với block Accordion`, async ({ cConf, conf }) => {
    const expected = cConf.expected;
    const addItemBtn = webBuilder.genLoc(block.getSelectorByLabel("headings")).getByRole("button");
    const deleteLastItemBtn = block.getBtnTabsAccordionHeading({ item: 10, button: "delete" });
    const duplicateItem1Btn = block.getBtnTabsAccordionHeading({ item: 1, button: "duplicate" });
    const blockInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const popoverShowIcon = block.genLoc(block.popover).locator(block.getSelectorByLabel("show_icon"));
    const popoverSelectIcon = block.genLoc(block.popover).locator(block.getSelectorByLabel("icon"));

    await test.step(`Add block tab mới vào preview`, async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: cConf.add_accordion.parent_position,
        category: cConf.add_accordion.basics_cate,
        template: cConf.add_accordion.template,
      });
      blockIds.push(blockId);
    });

    await test.step(`Click Add item`, async () => {
      await block.switchToTab("Content");
      await addItemBtn.click();
    });

    await test.step("Verify new tab is added in sidebar and preview", async () => {
      await expect(block.getBtnTabsAccordionHeading({ item: 4 })).toBeVisible();
      await softAssertion(blockInPreview.getByRole("paragraph").last()).toHaveText(expected.new_heading_title);
    });

    await test.step(`Add > 10 items vào block`, async () => {
      for (let i = 0; i < 6; i++) {
        await addItemBtn.click();
      }
    });

    await test.step("Verify add item button is hidden", async () => {
      await expect(addItemBtn).toBeHidden();
      for (let i = 1; i <= cConf.max_items; i++) {
        const duplicateBtn = block.getBtnTabsAccordionHeading({ item: i, button: "duplicate" });
        await expect(duplicateBtn).toHaveClass(new RegExp(expected.disabled));
      }
    });

    await test.step(`Kéo thả để thay đổi vị trí của các item`, async () => {
      await block.dndTabAccordionItemInSidebar(cConf.dnd_item2_to_item_10);
    });

    await test.step("Verify after dropped item", async () => {
      await softAssertion(blockInPreview.getByRole("paragraph").last()).toHaveText(expected.heading2_title);
    });

    await test.step(`Click Remove item 10`, async () => {
      await deleteLastItemBtn.click();
    });

    await test.step("Verify item is deleted", async () => {
      await expect(blockInPreview.getByRole("paragraph").filter({ hasText: cConf.deleted_heading })).toBeHidden();
      await expect(blockInPreview.getByRole("paragraph").filter({ hasText: cConf.deleted_heading })).not.toBeAttached();
    });

    await test.step(`Remove đến khi chỉ còn 1 item`, async () => {
      for (let i = 9; i > 1; i--) {
        const deleteItemBtn = block.getBtnTabsAccordionHeading({ item: i, button: "delete" });
        await deleteItemBtn.click();
      }
    });

    await test.step("Verify delete button is disabled", async () => {
      await softAssertion(block.getBtnTabsAccordionHeading({ item: 1, button: "delete" })).toBeHidden();
    });

    await test.step(`Click Duplicate item khi đang có < 10 items`, async () => {
      await duplicateItem1Btn.click();
    });

    await test.step("Verify duplicated tab have the same content", async () => {
      await softAssertion(blockInPreview.getByRole("paragraph").last()).toHaveText(expected.heading1_title);
    });

    await test.step(`Click vào option Edit`, async () => {
      await block.getBtnTabsAccordionHeading({ item: 1, button: "settings" }).click();
    });

    await test.step("Verify popup change icon appear", async () => {
      await expect(block.genLoc(block.popover).locator(block.getSelectorByLabel("show_icon"))).toBeVisible();
    });

    await test.step(`Turn on Icon và select icon`, async () => {
      await block.switchToggle(popoverShowIcon, cConf.turn_on);
      await block.selectIcon(popoverSelectIcon, cConf.icon_home);
    });

    await test.step("Verify icon is added", async () => {
      await expect(
        blockInPreview.locator(block.accordionItemGroup).locator(block.accordionIcon, { hasText: cConf.icon_home }),
      ).toBeVisible();
    });

    await test.step(`Turn off Icon`, async () => {
      await block.getBtnTabsAccordionHeading({ item: 1, button: "settings" }).click();
      await block.switchToggle(popoverShowIcon, cConf.turn_off);
    });

    await test.step("Verify icon is added", async () => {
      await expect(
        blockInPreview.getByRole("paragraph").locator(block.tabsIcon).filter({ hasText: cConf.icon_home }),
      ).toBeHidden();
    });

    await test.step("Verify accordion expand first item Preview ", async () => {
      const sfPage = await webBuilder.clickSaveAndGoTo("Preview");
      productSF = new SFBlocks(sfPage, conf.suiteConf.domain);
      await expect(productSF.blockAccordionLv0).toBeVisible();
      await expect(productSF.blockAccordionLv0.locator(productSF.accordionIcon).first()).toHaveText(
        expected.first_icon_expanded,
      );
      await sfPage.close();
    });

    await test.step(`Tắt expand first item`, async () => {
      await block.switchToggle("expand_first", cConf.turn_off);
    });

    await test.step("Verify accordion ko expand first item Preview", async () => {
      const sfPage = await webBuilder.clickSaveAndGoTo("Preview");
      const productSF = new SFBlocks(sfPage, conf.suiteConf.domain);
      await expect(productSF.blockAccordionLv0).toBeVisible();
      await expect(productSF.blockAccordionLv0.locator(productSF.accordionIcon).first()).toHaveText(
        expected.first_icon_collapsed,
      );
      await sfPage.close();
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_12 Check edit item name của block Tab level 1/ level 2`, async ({ cConf, conf }) => {
    let tabsLv0Id: string, tabsLv1Id: string;
    const expected = cConf.expected;
    const addTabs = cConf.add_tabs;

    await test.step("Pre-condition: Add block tabs", async () => {
      tabsLv0Id = await webBuilder.insertSectionBlock({
        parentPosition: addTabs.parent_position,
        category: addTabs.basics_cate,
        template: addTabs.template,
      });
      blockIds.push(tabsLv0Id);
      await webBuilder.clickAddBlockInTabsAccordion(`[block-id="${tabsLv0Id}"]`, cConf.add_block_lvl1);
      await webBuilder.searchbarTemplate.fill(addTabs.template);
      await webBuilder.getTemplatePreviewByName(addTabs.template).click();
      tabsLv1Id = await webBuilder.templateTitle.getAttribute("data-id");
    });

    const blockTabsLv0 = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, column: 1, block: 1 }));
    const blockTabsLv1 = webBuilder.frameLocator.locator(`[data-block-id="${tabsLv1Id}"]`);
    const tabHeadingLv0 = blockTabsLv0.locator(block.tabsHeading).first().getByRole("button");
    const tabHeadingLv1 = blockTabsLv1.locator(block.tabsHeading).getByRole("button");

    await test.step(`Double click vào item name của block Tab`, async () => {
      await block.backBtn.click();
      await tabHeadingLv0.first().dblclick();
    });

    await test.step("Verify edit được name của heading", async () => {
      await expect(block.textEditor).toBeVisible();
      await expect(block.quickSettingsText).toBeVisible();
    });

    await test.step(`Xoá item name`, async () => {
      await block.editTabsAccordionHeading(tabHeadingLv0.first(), cConf.delete_heading);
    });

    await test.step("Verify placeholder appear", async () => {
      await expect(tabHeadingLv0.first().locator(block.blankHeading)).toBeVisible();
      await softAssertion(tabHeadingLv0.first().locator(block.blankHeading)).toHaveAttribute(
        "data-placeholder",
        expected.blank_heading_placeholder,
      );
    });

    await test.step(`Edit font`, async () => {
      await block.editTabsAccordionHeading(tabHeadingLv0.last(), cConf.edit_font);
    });

    await test.step("Verify font changed in live preview", async () => {
      await expect(blockTabsLv1).toBeHidden();
      await softAssertion(tabHeadingLv0.last().getByRole("paragraph")).toHaveClass(expected.p1_value);
      await softAssertion(tabHeadingLv0.last().getByRole("paragraph")).toHaveCSS("font", expected.p1_font);
    });

    await test.step("Go to Preview", async () => {
      const sfPage = await block.clickSaveAndGoTo("Preview");
      productSF = new SFBlocks(sfPage, conf.suiteConf.domain);
    });

    const tabsLv0SF = productSF.blockTabsLv0;
    const tabsLv1SF = productSF.blockTabsLv1;
    const tabsLv0Heading = tabsLv0SF.locator(productSF.tabsHeading).first().getByRole("button");
    const tabsLv1Heading = tabsLv1SF.locator(productSF.tabsHeading).getByRole("button");

    await test.step("Verify font changed in Preview", async () => {
      await expect(tabsLv0SF).toBeVisible();
      await softAssertion(tabsLv0Heading.last().getByRole("paragraph")).toHaveClass(expected.p1_value);
      await softAssertion(tabsLv0Heading.last().getByRole("paragraph")).toHaveCSS("font", expected.p1_font);
    });

    await test.step(`Enable/disable Bold text`, async () => {
      await tabHeadingLv0.first().click();
      await block.editTabsAccordionHeading(tabHeadingLv1.first(), cConf.enable_bold);
    });

    await test.step("Verify bold text in live preview", async () => {
      const boldHeading = tabHeadingLv1.first().getByRole("strong");
      await expect(boldHeading).toBeVisible();
      await expect(boldHeading).toHaveText(cConf.enable_bold.title);
    });

    await test.step("Verify changes in Preview", async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      const boldHeading = tabsLv1Heading.first().getByRole("strong");
      await expect(boldHeading).toBeVisible();
      await expect(boldHeading).toHaveText(cConf.enable_bold.title);
    });

    await test.step(`Italic text`, async () => {
      await block.editTabsAccordionHeading(tabHeadingLv1.last(), cConf.enable_italic);
    });

    await test.step("Verify italic text in live preview", async () => {
      const italicHeading = tabHeadingLv1.last().getByRole("emphasis");
      await expect(italicHeading).toBeVisible();
      await expect(italicHeading).toHaveText(cConf.enable_italic.title);
    });

    await test.step("Verify changes in Preview", async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      const italicHeading = tabsLv1Heading.last().getByRole("emphasis");
      await expect(italicHeading).toBeVisible();
      await expect(italicHeading).toHaveText(cConf.enable_italic.title);
    });

    await test.step(`insert biến`, async () => {
      await block.editTabsAccordionHeading(tabHeadingLv0.nth(1), cConf.insert_variable);
    });

    await test.step("Verify variable in live preview", async () => {
      await expect(tabHeadingLv0.nth(1).locator(block.variable)).toBeVisible();
      await softAssertion(tabHeadingLv0.nth(1).locator(block.variable)).toHaveText(conf.suiteConf.shop_name);
      await softAssertion(tabHeadingLv0.nth(1).locator(block.variable)).toHaveAttribute(
        "value",
        expected.shop_name_value,
      );
    });

    await test.step("Verify font changed in Preview", async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(tabsLv0Heading.nth(1).locator(productSF.variable)).toBeVisible();
      await softAssertion(tabsLv0Heading.nth(1).locator(productSF.variable)).toHaveText(conf.suiteConf.shop_name);
      await softAssertion(tabsLv0Heading.nth(1).locator(productSF.variable)).toHaveAttribute(
        "value",
        expected.shop_name_value,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_13 Check edit item name của block Accordion level 1/ level 2`, async ({
    cConf,
    conf,
  }) => {
    let accordionLv0Id: string, accordionLv1Id: string;
    const expected = cConf.expected;
    const addAccordion = cConf.add_accordion;

    await test.step("Pre-condition: Add block tabs", async () => {
      accordionLv0Id = await webBuilder.insertSectionBlock({
        parentPosition: addAccordion.parent_position,
        category: addAccordion.basics_cate,
        template: addAccordion.template,
      });
      blockIds.push(accordionLv0Id);
      await webBuilder.clickAddBlockInTabsAccordion(`[block-id="${accordionLv0Id}"]`, cConf.add_block_lvl1);
      await webBuilder.searchbarTemplate.fill(addAccordion.template);
      await webBuilder.getTemplatePreviewByName(addAccordion.template).click();
      accordionLv1Id = await webBuilder.templateTitle.getAttribute("data-id");
    });

    const blockAccordionLv0 = webBuilder.frameLocator.locator(
      block.getSelectorByIndex({ section: 1, column: 1, block: 1 }),
    );
    const blockAccordionLv1 = webBuilder.frameLocator.locator(`[data-block-id="${accordionLv1Id}"]`);
    const accordionHeadingLv0 = blockAccordionLv0
      .locator(block.accordionItemGroup)
      .filter({ has: block.dataLv1 })
      .locator(block.accordionHeading);
    const accordionHeadingLv1 = blockAccordionLv1.locator(block.accordionItemGroup).locator(block.accordionHeading);

    await test.step(`Double click vào item name của block Tab`, async () => {
      await accordionHeadingLv0.first().dblclick();
    });

    await test.step("Verify edit được name của heading", async () => {
      await expect(block.textEditor).toBeVisible();
      await expect(block.quickSettingsText).toBeVisible();
    });

    await test.step(`Xoá item name`, async () => {
      await block.editTabsAccordionHeading(accordionHeadingLv0.first(), cConf.delete_heading);
    });

    await test.step("Verify placeholder appear", async () => {
      await expect(accordionHeadingLv0.first().locator(block.blankHeading)).toBeVisible();
      await softAssertion(accordionHeadingLv0.first().locator(block.blankHeading)).toHaveAttribute(
        "data-placeholder",
        expected.blank_heading_placeholder,
      );
    });

    await test.step(`Edit font`, async () => {
      await block.editTabsAccordionHeading(accordionHeadingLv0.last(), cConf.edit_font);
    });

    await test.step("Verify font changed in live preview", async () => {
      await softAssertion(accordionHeadingLv0.last().getByRole("paragraph")).toHaveClass(expected.p1_value);
      await softAssertion(accordionHeadingLv0.last().getByRole("paragraph")).toHaveCSS("font", expected.p1_font);
    });

    await test.step("Go to Preview", async () => {
      const sfPage = await block.clickSaveAndGoTo("Preview");
      productSF = new SFBlocks(sfPage, conf.suiteConf.domain);
    });

    const accordionLv0SF = productSF.blockAccordionLv0;
    const accordionLv1SF = productSF.blockAccordionLv1;
    const accordionLv0Heading = accordionLv0SF
      .locator(productSF.accordionItemGroup)
      .locator(productSF.accordionHeading);
    const accordionLv1Heading = accordionLv1SF
      .locator(productSF.accordionItemGroup)
      .locator(productSF.accordionHeading);

    await test.step("Verify font changed in Preview", async () => {
      await expect(accordionLv0SF).toBeVisible();
      await softAssertion(accordionLv0Heading.last().getByRole("paragraph")).toHaveClass(expected.p1_value);
      await softAssertion(accordionLv0Heading.last().getByRole("paragraph")).toHaveCSS("font", expected.p1_font);
    });

    await test.step(`Enable/disable Bold text`, async () => {
      await block.editTabsAccordionHeading(accordionHeadingLv1.first(), cConf.enable_bold);
    });

    await test.step("Verify bold text in live preview", async () => {
      const boldHeading = accordionHeadingLv1.first().getByRole("strong");
      await expect(boldHeading).toBeVisible();
      await expect(boldHeading).toHaveText(cConf.enable_bold.title);
    });

    await test.step("Verify changes in Preview", async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      const boldHeading = accordionLv1Heading.first().getByRole("strong");
      await expect(boldHeading).toBeVisible();
      await expect(boldHeading).toHaveText(cConf.enable_bold.title);
    });

    await test.step(`Italic text`, async () => {
      await block.editTabsAccordionHeading(accordionHeadingLv1.last(), cConf.enable_italic);
    });

    await test.step("Verify italic text in live preview", async () => {
      const italicHeading = accordionHeadingLv1.last().getByRole("emphasis");
      await expect(italicHeading).toBeVisible();
      await expect(italicHeading).toHaveText(cConf.enable_italic.title);
    });

    await test.step("Verify changes in Preview", async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      const italicHeading = accordionLv1Heading.last().getByRole("emphasis");
      await expect(italicHeading).toBeVisible();
      await expect(italicHeading).toHaveText(cConf.enable_italic.title);
    });

    await test.step(`insert biến`, async () => {
      await block.editTabsAccordionHeading(accordionHeadingLv0.nth(1), cConf.insert_variable);
    });

    await test.step("Verify variable in live preview", async () => {
      await expect(accordionHeadingLv0.nth(1).locator(block.variable)).toBeVisible();
      await softAssertion(accordionHeadingLv0.nth(1).locator(block.variable)).toHaveText(conf.suiteConf.domain);
      await softAssertion(accordionHeadingLv0.nth(1).locator(block.variable)).toHaveAttribute(
        "value",
        expected.shop_name_value,
      );
    });

    await test.step("Verify font changed in Preview", async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(accordionLv0Heading.nth(1).locator(productSF.variable)).toBeVisible();
      await softAssertion(accordionLv0Heading.nth(1).locator(productSF.variable)).toHaveText(conf.suiteConf.domain);
      await softAssertion(accordionLv0Heading.nth(1).locator(productSF.variable)).toHaveAttribute(
        "value",
        expected.shop_name_value,
      );
    });

    await test.step("Click collapse/expand item", async () => {
      await accordionHeadingLv0.first().click();
      await accordionHeadingLv0.last().click();
    });

    await test.step("Verify hiển thị ở live preview", async () => {
      await expect(blockAccordionLv1).toBeHidden();
      await expect(
        blockAccordionLv0.locator(block.accordionItemGroup).last().locator(block.tabsAccordionItem),
      ).toBeVisible();
    });
  });

  const drivenCase3 = "SETTINGS_ITEM_SECTION";
  const item1Conf = loadData(__dirname, drivenCase3);
  item1Conf.caseConf.data.forEach(data => {
    test(`@${data.case_id} Check settings item content của block ${data.block} level 1/level 2 khi item content là Section (không phải là Container)`, async () => {
      test.slow();
      let blockLv0Id: string, blockLv1Id: string, paragraphId: string;
      const cConf = item1Conf.caseConf;
      const suiteConf = item1Conf.suiteConf;
      const expected = cConf.expected;
      const addBlock = data.add_block;
      const edgePosition = { position: { x: 5, y: 5 } };

      await test.step("Pre-condition: Add block tabs", async () => {
        blockLv0Id = await webBuilder.insertSectionBlock({
          parentPosition: addBlock.parent_position,
          category: addBlock.basics_cate,
          template: addBlock.template,
        });
        blockIds.push(blockLv0Id);
      });

      const blockLv0 = webBuilder.getElementById(blockLv0Id, ClickType.BLOCK);
      const blockLv0Item = blockLv0.locator(block.tabsAccordionItem);

      await test.step(`Click vào item content`, async () => {
        await blockLv0Item.first().click(edgePosition);
      });

      await test.step("Verify item is selected and sidebar settings", async () => {
        await expect(blockLv0Item.first()).toHaveClass(new RegExp(expected.selected));
        await expect(block.titleBar.getByRole("paragraph")).toHaveText(expected.item1_title);
        await expect(block.activeTab).toHaveText(expected.tab_content);
      });

      await test.step(`Tại Tab Content trên sidebar, select Source = None`, async () => {
        await block.switchToTab("Content");
        await block.settingDesignAndContentWithSDK(cConf.source_none);
      });

      await test.step("Verify source is not applied in preview", async () => {
        await expect(blockLv0Item.first().locator(block.sourceConnected)).not.toBeAttached();
      });

      await test.step(`Tại Tab Content trên sidebar, select Source = "Product"`, async () => {
        await blockLv0Item.first().click(edgePosition);
        await block.switchToTab("Content");
        await block.settingDesignAndContentWithSDK(cConf.source_product);
        await block.clickAddBlockInTabsAccordion(blockLv0, cConf.add_block_position);
        await block.searchbarTemplate.fill("Paragraph");
        await block.getTemplatePreviewByName("Paragraph").click();
        paragraphId = await block.titleBar.getByRole("paragraph").getAttribute("data-id");
        await block.selectOptionOnQuickBar("Edit text");
        //NOTE: Tạm thời handle bug lần đầu ko hiện đủ variable
        await block.getQuickSettingsTextBtn("variable").click();
        const productVariable = block
          .getQuickSettingsTextBtn("variable")
          .locator(block.variableGroups)
          .filter({ hasText: "Product" });
        if (await productVariable.isHidden()) {
          await blockLv0Item.first().click(edgePosition);
          await block.clickElementById(paragraphId, ClickType.BLOCK);
          await block.selectOptionOnQuickBar("Edit text");
        }
        await block.editQuickSettingsText(cConf.insert_product_description);
      });

      await test.step("Verify source applied in Preview", async () => {
        const blockParagraph = webBuilder.getElementById(paragraphId, ClickType.BLOCK);
        await expect(block.textEditor.locator(block.variable)).toBeVisible();
        await expect(block.textEditor.locator(block.variable)).toHaveAttribute("value", expected.description_value);
        await block.backBtn.click();
        await expect(blockParagraph).toContainText(expected.product_description);
      });

      await test.step("Verify changes in Preview", async () => {
        const sfPage = await block.clickSaveAndGoTo("Preview");
        productSF = new SFBlocks(sfPage, suiteConf.domain);
        await expect(productSF.blockParagraph).toContainText(expected.product_description);
      });

      await test.step(`Chuyển qua tab Design`, async () => {
        await blockLv0Item.first().click(edgePosition);
        await block.switchToTab("Design");
      });

      await test.step("Verify default data in sidebar", async () => {
        await softAssertion(border).toHaveText(expected.default_border);
        await softAssertion(background).toHaveCSS("background", new RegExp(expected.default_background));
        await softAssertion(padding).toHaveValue(expected.default_padding);
        await softAssertion(margin).toHaveValue(expected.default_margin);
      });

      for (const designData of cConf.design_data) {
        const imgUrl = designData.background.img ? designData.background.img.src : "";
        await test.step(`Setting style cho item content`, async () => {
          await block.settingDesignAndContentWithSDK(designData);
          await block.clickSave();
        });

        await test.step("Verify settings changed in Preview", async () => {
          const expectedItemBackground = designData.expected.item_background.replace("image", imgUrl);
          await softAssertion(blockLv0Item.first().locator("[data-section-id]")).toHaveCSS(
            "border",
            designData.expected.item_border,
          );
          await softAssertion(blockLv0Item.first().locator("[data-section-id]")).toHaveCSS(
            "background",
            new RegExp(expectedItemBackground),
          );
          await softAssertion(blockLv0Item.first().locator("[data-section-id]")).toHaveCSS(
            "padding",
            designData.expected.item_padding,
          );
          await softAssertion(blockLv0Item.first()).toHaveCSS("margin", designData.expected.item_margin);
        });

        await test.step("Verify settings changed in Preview", async () => {
          await productSF.page.reload({ waitUntil: "networkidle" });
          const blockSFLv0 = data.block === "Tabs" ? productSF.blockTabsLv0 : productSF.blockAccordionLv0;
          const blockItemSF = blockSFLv0.locator(productSF.tabsAccordionItem);
          const imgUrlSF = imgUrl;
          const expectedItemBackgroundSF = designData.expected.item_background.replace("image", imgUrlSF);
          await softAssertion(blockItemSF.first()).toHaveCSS("border", designData.expected.item_border);
          await softAssertion(blockItemSF.first()).toHaveCSS("background", new RegExp(expectedItemBackgroundSF));
          await softAssertion(blockItemSF.first()).toHaveCSS("padding", designData.expected.item_padding);
          await softAssertion(blockItemSF.first()).toHaveCSS("margin", designData.expected.item_margin);
        });
      }

      await test.step(`Ấn nút add row`, async () => {
        await block.selectParentBreadcrumb(cConf.lv1_column, "Row", 2);
        await block.addRow({ parentPosition: cConf.lv1_column, position: "Bottom", quickbar: true });
      });

      await test.step("Verify new row added and selected", async () => {
        const row2InBlockLv0 = block.getLocInTabsAccordion(blockLv0, { level: 1, row: 2 });
        await expect(row2InBlockLv0).toBeVisible();
        await expect(row2InBlockLv0).toHaveClass(new RegExp(expected.selected));
      });

      await test.step(`Chọn edit spacing`, async () => {
        await block.settingDesignAndContentWithSDK(cConf.spacing);
      });

      await test.step("Verify changes in preview", async () => {
        const columnInBlockLv0 = block
          .getLocInTabsAccordion(blockLv0, { level: 1, row: 2 })
          .locator("[data-row-id]>.column");
        for (const column of await columnInBlockLv0.all()) {
          await expect(column).toHaveCSS("--gutter", expected.column_spacing);
        }
      });

      await test.step(`Click vào content của block Tab level 2`, async () => {
        await block.clickElementById(paragraphId, ClickType.BLOCK);
        await block.selectOptionOnQuickBar("Delete");
        await webBuilder.clickAddBlockInTabsAccordion(`[block-id="${blockLv0Id}"]`, cConf.add_block_lvl1);
        await webBuilder.searchbarTemplate.fill(addBlock.template);
        await webBuilder.getTemplatePreviewByName(addBlock.template).click();
        blockLv1Id = await webBuilder.templateTitle.getAttribute("data-id");
        const blockLv1 = webBuilder.getElementById(blockLv1Id, ClickType.BLOCK);
        const blockLv1Item = blockLv1.locator(block.tabsAccordionItem);
        await blockLv1Item.first().click(edgePosition);
      });

      await test.step("Verify no Content tab in sidebar", async () => {
        await expect(block.settingsTabContainer).toBeHidden();
        await expect(block.settingsTabContainer).not.toBeAttached();
      });
    });
  });

  const drivenCase4 = "SETTINGS_ITEM_CONTAINER";
  const item2Conf = loadData(__dirname, drivenCase4);
  item2Conf.caseConf.data.forEach(data => {
    test(`@${data.case_id} Check settings item content của block ${data.block} level 1/level 2 khi item content là Container`, async ({}) => {
      test.slow();
      let blockLv0Id: string, paragraphId: string, containerId: string;
      let containerBlock: Locator, containerAddBlockBtn: Locator;
      const cConf = item2Conf.caseConf;
      const suiteConf = item2Conf.suiteConf;
      const expected = cConf.expected;
      const addBlock = data.add_block;
      const edgePosition = { position: { x: 10, y: 10 } };

      await test.step("Pre-condition: Add block tabs and Container", async () => {
        blockLv0Id = await webBuilder.insertSectionBlock({
          parentPosition: addBlock.parent_position,
          category: addBlock.basics_cate,
          template: addBlock.template,
        });
        blockIds.push(blockLv0Id);
        await block.clickAddBlockInTabsAccordion(`[block-id="${blockLv0Id}"]`, cConf.add_block_lvl1);
        await block.templateContainer.waitFor();
        await block.waitAbit(2000); // Hành động quá nhanh làm click ko add đc block
        await block.getTemplatePreviewByName("Container").click();
        await block.insertPreview.waitFor({ state: "hidden" });
        containerId = await block.titleBar.getByRole("paragraph").getAttribute("data-id");
      });

      const blockLv0 = webBuilder.getElementById(blockLv0Id, ClickType.BLOCK);
      const blockLv0Item = blockLv0.locator(block.tabsAccordionItem);
      containerBlock = block.getElementById(containerId, ClickType.BLOCK);
      containerAddBlockBtn = containerBlock.locator(block.addBlockBtn);

      await test.step("Verify container sidebar settings", async () => {
        await expect(block.titleBar.getByRole("paragraph")).toHaveText(expected.container_title);
        await expect(block.activeTab).toHaveText(expected.tab_content);
        await block.backBtn.click();
        // Tránh lỗi quickbar ko ẩn đi chỉ bị khi run auto chưa rõ nguyên nhân
        try {
          await block.frameLocator.locator(block.quickSettingsBlock).waitFor({ state: "hidden", timeout: 1000 });
        } catch (error) {
          await block.clickElementById(containerId, ClickType.BLOCK);
          await block.selectOptionOnQuickBar("Delete");
          await block.clickAddBlockInTabsAccordion(`[block-id="${blockLv0Id}"]`, cConf.add_block_lvl1);
          await block.getTemplatePreviewByName("Container").click();
          await block.insertPreview.waitFor({ state: "hidden" });
          containerId = await block.titleBar.getByRole("paragraph").getAttribute("data-id");
          containerBlock = block.getElementById(containerId, ClickType.BLOCK);
          containerAddBlockBtn = containerBlock.locator(block.addBlockBtn);
        }
      });

      await test.step(`Tại Tab Content trên sidebar, select Source = None`, async () => {
        await block.clickElementById(containerId, ClickType.BLOCK);
        await block.changeContent(cConf.source_none);
      });

      await test.step("Verify source is not applied in preview", async () => {
        await expect(blockLv0Item.locator(block.sourceConnected)).not.toBeAttached();
      });

      await test.step(`Tại Tab Content trên sidebar, select Source = "Product"`, async () => {
        await block.changeContent(cConf.source_product);
        await containerBlock.hover();
        await containerAddBlockBtn.click({ delay: 500 });
        await block.getTemplatePreviewByName("Paragraph").click();
        paragraphId = await block.titleBar.getByRole("paragraph").getAttribute("data-id");
        await block.selectOptionOnQuickBar("Edit text");
        //NOTE: Tạm thời handle bug lần đầu ko hiện đủ variable
        await block.getQuickSettingsTextBtn("variable").click();
        const productVariable = block
          .getQuickSettingsTextBtn("variable")
          .locator(block.variableGroups)
          .filter({ hasText: "Product" });
        if (await productVariable.isHidden()) {
          await containerBlock.click(edgePosition);
          await block.clickElementById(paragraphId, ClickType.BLOCK);
          await block.selectOptionOnQuickBar("Edit text");
        }
        await block.editQuickSettingsText(cConf.insert_product_description);
      });

      await test.step("Verify source applied in Preview", async () => {
        const blockParagraph = webBuilder.getElementById(paragraphId, ClickType.BLOCK);
        await expect(block.textEditor.locator(block.variable)).toBeVisible();
        await expect(block.textEditor.locator(block.variable)).toHaveAttribute("value", expected.description_value);
        await block.titleBar.click();
        await block.quickSettingsText.waitFor({ state: "hidden" });
        await block.backBtn.click({ delay: 500 }); // Hành động nhanh làm quickbar lỗi ko ẩn
        await block.frameLocator.locator(block.quickSettingsBlock).waitFor({ state: "hidden" });
        await expect(blockParagraph).toContainText(expected.product_description);
      });

      await test.step("Verify changes in Preview", async () => {
        const sfPage = await block.clickSaveAndGoTo("Preview");
        productSF = new SFBlocks(sfPage, suiteConf.domain);
        await expect(productSF.blockParagraph).toContainText(expected.product_description);
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_18 Check switch display giữa các block`, async ({ cConf, conf, snapshotFixture }) => {
    test.slow();
    let blockId: string, blockInSF: Locator;
    const suiteConf = conf.suiteConf;
    const expected = cConf.expected;
    const addTabs = cConf.add_tabs;
    const edgePosition = { position: { x: 10, y: 5 } };
    const expandIcon = block.genLoc(block.getSelectorByLabel("expand_icon")).getByRole("button");
    const iconPosition = block.genLoc(block.getSelectorByLabel("icon_position"));
    const accordionSpacing = block.genLoc(block.getSelectorByLabel("spacing"));
    const accordionDivider = block.genLoc(block.getSelectorByLabel("show_divider")).getByRole("checkbox");
    const alignCenter = block.genLoc(block.getSelectorByLabel("align_self")).locator(block.alignOptions).nth(1);
    const shadow = block.genLoc(block.getSelectorByLabel("box_shadow")).getByRole("button");
    const opacity = block.genLoc(block.getSelectorByLabel("opacity")).getByRole("spinbutton");
    const radius = block.genLoc(block.getSelectorByLabel("border_radius")).getByRole("spinbutton");
    const headingAlignLeft = block.genLoc(block.getSelectorByLabel("tab_justify")).locator(block.alignOptions).first();

    await test.step("Pre-condition: add block tabs", async () => {
      blockId = await block.insertSectionBlock({
        parentPosition: addTabs.parent_position,
        category: addTabs.basics_cate,
        template: addTabs.template,
      });
      blockIds.push(blockId);
    });

    const blockInPreview = block.getElementById(blockId, ClickType.BLOCK);
    await test.step(`Verify default settings in Design tab`, async () => {
      await block.switchToTab("Design");
      await expect(displayAs).toHaveText(expected.default_display);
    });

    await test.step(`Chọn Display là Accordion`, async () => {
      await block.changeDesign(cConf.display_as_accordion);
    });

    await test.step("Verify settings of block accordion in Sidebar", async () => {
      await expect(expandIcon).toBeVisible();
      await expect(iconPosition).toBeVisible();
      await expect(accordionSpacing).toBeVisible();
      await expect(accordionDivider).toBeVisible();
      await softAssertion(expandIcon).toHaveText(expected.default_expand_icon);
      await softAssertion(iconPosition.locator(block.alignOptions).first()).toHaveClass(new RegExp(expected.active));
      await softAssertion(accordionSpacing.locator(block.alignOptions).first()).toHaveClass(
        new RegExp(expected.active),
      );
      await softAssertion(accordionDivider).not.toBeChecked();
      await softAssertion(alignCenter).toHaveClass(new RegExp(expected.active));
      await softAssertion(heightValue).toHaveValue(expected.default_height_value);
      await softAssertion(heightUnit).toHaveText(expected.default_height_unit);
      await softAssertion(widthValue).toHaveValue(expected.default_width_value);
      await softAssertion(widthUnit).toHaveText(expected.default_width_unit);
      await softAssertion(background).toHaveCSS("background", new RegExp(expected.default_background));
      await softAssertion(border).toHaveText(expected.default_border);
      await softAssertion(opacity).toHaveValue(expected.default_opacity);
      await softAssertion(radius).toHaveValue(expected.default_radius);
      await softAssertion(shadow).toHaveText(expected.default_shadow);
      await softAssertion(margin).toHaveValue(expected.default_margin);
      await softAssertion(padding).toHaveValue(expected.default_padding);
    });

    await test.step("Verify block accordion show in Preview", async () => {
      await blockInPreview.hover(edgePosition);
      await expect(block.breadCrumb.locator(block.sourceBreadcrumb)).toHaveText(expected.accordion_breadcrumb);
    });

    await test.step("Verify block accordion show in Preview", async () => {
      const sfPage = await block.clickSaveAndGoTo("Preview");
      productSF = new SFBlocks(sfPage, suiteConf.domain);
      blockInSF = productSF.blockTabsLv0;
      await expect(blockInSF).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: productSF.page,
        selector: blockInSF,
        snapshotName: expected.default_accordion_SF_snapshot,
      });
    });

    await test.step(`Thay đổi các setting của block Accordion`, async () => {
      await block.settingDesignAndContentWithSDK(cConf.edit_accordion);
      await block.clickSave();
    });

    await test.step("Verify changes in Webfront", async () => {
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockInPreview,
        snapshotName: expected.modified_accordion_preview_snapshot,
      });
    });

    await test.step("Verify changes in Preview", async () => {
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(blockInSF).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: productSF.page,
        selector: blockInSF,
        snapshotName: expected.modified_accordion_SF_snapshot,
      });
    });

    await test.step(`Tại Sidebar, chọn Display sang Tab`, async () => {
      await block.clickElementById(blockId, ClickType.BLOCK);
      await block.changeDesign(cConf.display_as_tabs);
      await block.clickSave();
    });

    await test.step("Verify settings of block tabs in Sidebar", async () => {
      await softAssertion(layoutBtn).toHaveText(expected.default_tab_layout);
      await softAssertion(headingAlignLeft).toHaveClass(new RegExp(expected.active));
    });

    await test.step("Verify block tabs show in Webfront", async () => {
      await blockInPreview.hover(edgePosition);
      await expect(block.breadCrumb.locator(block.sourceBreadcrumb)).toHaveText(expected.tabs_breadcrumb);
    });

    await test.step("Verify block accordion show in Preview", async () => {
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(blockInSF).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: productSF.page,
        selector: blockInSF,
        snapshotName: expected.accordion_switch_tabs_SF_snapshot,
      });
    });

    await test.step(`Thay đổi các setting của block Tab`, async () => {
      await block.settingDesignAndContentWithSDK(cConf.edit_tabs);
      await block.clickSave();
    });

    await test.step("Verify changes in Webfront", async () => {
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockInPreview,
        snapshotName: expected.modified_tabs_preview_snapshot,
      });
    });

    await test.step("Verify changes in Preview", async () => {
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(blockInSF).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: productSF.page,
        selector: blockInSF,
        snapshotName: expected.modified_tabs_SF_snapshot,
      });
    });

    await test.step(`Tại Sidebar, chọn Display sang Accordion`, async () => {
      await blockInPreview.click(edgePosition);
      await block.changeDesign(cConf.display_as_accordion);
      await block.clickSave();
    });

    await test.step("Verify changes in Webfront", async () => {
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockInPreview,
        snapshotName: expected.tabs_switch_accordion_preview_snapshot,
      });
    });

    await test.step("Verify changes in Preview", async () => {
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(blockInSF).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: productSF.page,
        selector: blockInSF,
        snapshotName: expected.tabs_switch_accordion_SF_snapshot,
      });
    });
  });

  const drivenCase5 = "SWITCH_MOBILE";
  const mbConf = loadData(__dirname, drivenCase5);
  mbConf.caseConf.data.forEach(data => {
    test(`@${data.case_id} Check hiển thị block ${data.block} khi thực hiện switch qua lại giữa desktop và mobile`, async ({
      snapshotFixture,
    }) => {
      let blockId: string, blockInPreview: Locator;
      const addBlock = data.add_block;

      await test.step("Pre-condition: Add block ", async () => {
        blockId = await block.insertSectionBlock({
          parentPosition: addBlock.parent_position,
          category: addBlock.category,
          template: addBlock.template,
        });
        blockIds.push(blockId);
        blockInPreview = block.getElementById(blockId, ClickType.BLOCK);
        await block.page.waitForLoadState("networkidle");
        await block.waitAbit(5000); //Background image render chậm lần đầu tiên
        await block.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: block.page,
          selector: blockInPreview,
          snapshotName: data.expected.block_default_desktop_snapshot,
        });
      });

      await test.step(`Tại màn preview desktop, click icon mobile ở Action bar để chuyển màn preview từ desktop sang mobile`, async () => {
        await block.clickBtnNavigationBar("mobile");
      });

      await test.step("Verify in Mobile preview", async () => {
        await snapshotFixture.verifyWithAutoRetry({
          page: block.page,
          selector: blockInPreview,
          snapshotName: data.expected.block_responsive_in_mobile_preview_snapshot,
        });
      });

      await test.step(`Click icon desktop ở action bar để chuyển từ mobile sang desktop`, async () => {
        await block.clickBtnNavigationBar("desktop");
      });

      await test.step("Verify design back to default in desktop", async () => {
        await snapshotFixture.verifyWithAutoRetry({
          page: block.page,
          selector: blockInPreview,
          snapshotName: data.expected.block_default_desktop_snapshot,
        });
      });

      await test.step(`Ở màn mobile, thực hiện thay đổi một số data so với ban đầu cho phù hợp với màn mobile`, async () => {
        await block.clickBtnNavigationBar("mobile");
        await block.clickElementById(blockId, ClickType.BLOCK);
        await block.switchToTab("Design");
        await block.settingDesignAndContentWithSDK(data.edit_design);
      });

      await test.step("Verify block is modified in mobile", async () => {
        await block.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: block.page,
          selector: blockInPreview,
          snapshotName: data.expected.modified_block_in_mobile_snapshot,
        });
      });

      await test.step(`Click icon desktop ở Action bar để chuyển từ mobile sang desktop`, async () => {
        await block.clickBtnNavigationBar("desktop");
      });

      await test.step("Verify design in desktop is independent", async () => {
        await snapshotFixture.verifyWithAutoRetry({
          page: block.page,
          selector: blockInPreview,
          snapshotName: data.expected.block_default_desktop_snapshot,
        });
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_21 Check hiển thị row khi khi switch qua lại block Tabs/Accordion giữa desktop và mobile`, async ({
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    let tabsId: string, accordionId: string;
    const expected = cConf.expected;
    const addTabs = cConf.add_tabs;
    const dndAccordion = cConf.dnd_accordion;
    const edgePosition = { position: { x: 5, y: 5 } };
    const firstSection = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1 }));

    await test.step("Pre-condition: Add block", async () => {
      tabsId = await block.insertSectionBlock({
        parentPosition: addTabs.parent_position,
        category: addTabs.test_cate,
        template: addTabs.test_template,
      });
      accordionId = await block.dragAndDropInWebBuilder(dndAccordion);
      blockIds.push(tabsId, accordionId);
      await block.selectOptionOnQuickBar("Move down");
      await block.backBtn.click();
    });

    const blockTabs = block.getElementById(tabsId, ClickType.BLOCK);
    const blockAccordion = block.getElementById(accordionId, ClickType.BLOCK);
    await test.step("Get default screenshot of block tabs/accordion", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });

    await test.step(`Tại màn preview desktop, click icon mobile ở Action bar để chuyển màn preview từ desktop sang mobile`, async () => {
      await block.clickBtnNavigationBar("mobile");
    });

    await test.step("Verify responsive mobile", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.row_in_tabs_responsive_mobile_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.row_in_accordion_responsive_mobile_snapshot,
      });
    });

    await test.step(`Click icon desktop ở action bar để chuyển từ mobile sang desktop`, async () => {
      await block.clickBtnNavigationBar("desktop");
    });

    await test.step("Verify style row back to default", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });

    await test.step(`Ở màn mobile, thực hiện thay đổi một số data so với ban đầu cho phù hợp với màn mobile`, async () => {
      await block.clickBtnNavigationBar("mobile");
      await block.expandCollapseLayer({ sectionName: cConf.section_1, isExpand: true });
      for (const data of cConf.edit_data) {
        const row2InSidebar = block.genLoc(block.getSidebarSelectorByName(data.second_row_item1));
        const hideFirstRow = Object.assign({}, data.first_row_item1, { isHide: true });
        const showThirdRow = Object.assign({}, data.third_row_item1, { isHide: false });
        await block.expandCollapseLayer(data.expand_item1);
        await block.hideOrShowLayerInSidebar(hideFirstRow);
        await block.hideOrShowLayerInSidebar(showThirdRow);
        await row2InSidebar.click();
        await block.settingDesignAndContentWithSDK(data.edit_design_row2);
        await block.backBtn.click();
        await block.dndLayerInSidebar(data.dnd_row_in_block);
      }
    });

    await test.step("Verify changes in preview", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.modified_row_in_tabs_mobile_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.modified_row_in_accordion_mobile_snapshot,
      });
    });

    await test.step(`Click icon desktop ở Action bar để chuyển từ mobile sang desktop`, async () => {
      await block.clickBtnNavigationBar("desktop");
    });

    await test.step("Verify style row back to default", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_22 Check hiển thị column khi switch qua lại block Tabs/Accordion giữa desktop và mobile`, async ({
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    let tabsId: string, accordionId: string;
    const expected = cConf.expected;
    const addTabs = cConf.add_tabs;
    const dndAccordion = cConf.dnd_accordion;
    const edgePosition = { position: { x: 5, y: 5 } };
    const firstSection = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1 }));

    await test.step("Pre-condition: Add block", async () => {
      tabsId = await block.insertSectionBlock({
        parentPosition: addTabs.parent_position,
        category: addTabs.test_cate,
        template: addTabs.test_template,
      });
      accordionId = await block.dragAndDropInWebBuilder(dndAccordion);
      await block.selectOptionOnQuickBar("Move down");
      blockIds.push(tabsId, accordionId);
      await block.backBtn.click();
    });

    const blockTabs = block.getElementById(tabsId, ClickType.BLOCK);
    const blockAccordion = block.getElementById(accordionId, ClickType.BLOCK);
    await test.step("Get default screenshot of block tabs/accordion", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });

    await test.step(`Tại màn preview desktop, click icon mobile ở Action bar để chuyển màn preview từ desktop sang mobile`, async () => {
      await block.clickBtnNavigationBar("mobile");
    });

    await test.step("Verify responsive mobile", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.column_in_tabs_responsive_mobile_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.column_in_accordion_responsive_mobile_snapshot,
      });
    });

    await test.step(`Click icon desktop ở action bar để chuyển từ mobile sang desktop`, async () => {
      await block.clickBtnNavigationBar("desktop");
    });

    await test.step("Verify style row back to default", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });

    await test.step(`Ở màn mobile, thực hiện thay đổi một số data so với ban đầu cho phù hợp với màn mobile`, async () => {
      await block.clickBtnNavigationBar("mobile");
      await block.expandCollapseLayer({ sectionName: cConf.section_1, isExpand: true });
      for (const data of cConf.edit_data) {
        const selector = !data.expand_item1.sectionIndex ? blockTabs : blockAccordion;
        const col1row1Sidebar = block.genLoc(block.getSidebarSelectorByName(data.column1_row1_item1));
        const col1row2Preview = block.getLocInTabsAccordion(selector, { level: 1, row: 2, column: 1 });
        await block.expandCollapseLayer(data.expand_item1);
        await col1row1Sidebar.click();
        await block.settingDesignAndContentWithSDK(data.edit_design_column1_row1);
        await col1row2Preview.click(edgePosition);
        await block.settingDesignAndContentWithSDK(data.edit_design_column1_row2);
        await block.page.keyboard.press("ArrowRight");
        await block.backBtn.click();
      }
    });

    await test.step("Verify changes in preview", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.modified_column_in_tabs_mobile_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.modified_column_in_accordion_mobile_snapshot,
      });
    });

    await test.step(`Click icon desktop ở Action bar để chuyển từ mobile sang desktop`, async () => {
      await block.clickBtnNavigationBar("desktop");
    });

    await test.step("Verify style row back to default", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_TABA_23 Check hiển thị block khi switch qua lại block Tabs/Accordion giữa desktop và mobile`, async ({
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    let tabsId: string, accordionId: string;
    const expected = cConf.expected;
    const addTabs = cConf.add_tabs;
    const dndAccordion = cConf.dnd_accordion;
    const edgePosition = { position: { x: 5, y: 5 } };
    const firstSection = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1 }));

    await test.step("Pre-condition: Add block", async () => {
      tabsId = await block.insertSectionBlock({
        parentPosition: addTabs.parent_position,
        category: addTabs.test_cate,
        template: addTabs.test_template,
      });
      accordionId = await block.dragAndDropInWebBuilder(dndAccordion);
      blockIds.push(tabsId, accordionId);
      await block.selectOptionOnQuickBar("Move down");
      await block.backBtn.click();
    });

    const blockTabs = block.getElementById(tabsId, ClickType.BLOCK);
    const blockAccordion = block.getElementById(accordionId, ClickType.BLOCK);
    await test.step("Get default screenshot of block tabs/accordion", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });

    await test.step(`Tại màn preview desktop, click icon mobile ở Action bar để chuyển màn preview từ desktop sang mobile`, async () => {
      await block.clickBtnNavigationBar("mobile");
    });

    await test.step("Verify responsive mobile", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.block_in_tabs_responsive_mobile_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.block_in_accordion_responsive_mobile_snapshot,
      });
    });

    await test.step(`Click icon desktop ở action bar để chuyển từ mobile sang desktop`, async () => {
      await block.clickBtnNavigationBar("desktop");
    });

    await test.step("Verify style row back to default", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });

    await test.step(`Ở màn mobile, thực hiện thay đổi một số data so với ban đầu cho phù hợp với màn mobile`, async () => {
      await block.clickBtnNavigationBar("mobile");
      await block.expandCollapseLayer({ sectionName: cConf.section_1, isExpand: true });
      for (const data of cConf.edit_data) {
        const selector = !data.expand_item1.sectionIndex ? blockTabs : blockAccordion;
        const blockHTML = selector.locator(block.blockHTMLCode);
        const blockParagraph = selector.locator(block.blockParagraph);
        await block.expandCollapseLayer(data.expand_item1);
        await blockHTML.click();
        await block.switchToTab("Design");
        await block.settingDesignAndContentWithSDK(data.edit_design_block1_column1);
        await block.backBtn.click();
        await blockParagraph.click();
        await block.settingDesignAndContentWithSDK(data.edit_design_block1_column2);
        await block.backBtn.click();
        await blockParagraph.click();
        await block.page.keyboard.press("ArrowDown");
        await block.backBtn.click();
      }
    });

    await test.step("Verify changes in preview", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.modified_block_in_tabs_mobile_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.modified_block_in_accordion_mobile_snapshot,
      });
    });

    await test.step(`Click icon desktop ở Action bar để chuyển từ mobile sang desktop`, async () => {
      await block.clickBtnNavigationBar("desktop");
    });

    await test.step("Verify desktop to default", async () => {
      await firstSection.hover(edgePosition);
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockTabs,
        snapshotName: expected.tabs_default_desktop_snapshot,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: block.page,
        selector: blockAccordion,
        snapshotName: expected.accordion_default_desktop_snapshot,
      });
    });
  });
});

/**
 * Các case bị bỏ khỏi release checklist
 */
// const drivenCase1 = "DND_TABS_ACCORDION";
// const dndConf = loadData(__dirname, drivenCase1);
// dndConf.caseConf.data.forEach(data => {
//   test(`@${data.case_id} Check việc add block ${data.block_type} vào preview`, async ({}) => {
//     let buttonId: string, ratingId: string;
//     const expected = data.expected;
//     const addContainer = data.add_container;
//     const firstBlock = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 1 }));
//     const tabsInsertPanel = webBuilder.getTemplatePreviewByName("Tabs");
//     const accordionInsertPanel = webBuilder.getTemplatePreviewByName("Accordion");
//     const columnLvl2 = webBuilder.getLocInTabsAccordion(firstBlock, { level: 2, row: 1, column: 1 });
//     const droppedBlock = webBuilder.selectedTemplate;

//     await test.step(`Click "+" icon trên Navigation bar`, async () => {
//       await webBuilder.clickBtnNavigationBar("insert");
//     });

//     await test.step("Verify insert panel visible", async () => {
//       await expect(webBuilder.insertPreview).toBeVisible();
//       await expect(tabsInsertPanel).toBeVisible();
//       await expect(accordionInsertPanel).toBeVisible();
//     });

//     await test.step(`Kéo thả block Tab vào 1 vị trí auto trên preview
//(nằm ngoài 1 block Container, Tabs, Accordion)`, async () => {
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_block);
//     });

//     await test.step("Verify data position default block", async () => {
//       await expect(positionValue).toHaveText(expected.position_auto);
//       await expect(displayAs).toHaveText(expected.mode);
//       await webBuilder.backBtn.click();
//       await firstBlock.click({ position: { x: 1, y: 1 } });
//       await webBuilder.selectOptionOnQuickBar("Delete");
//     });

//     await test.step(`Kéo thả block Tab vào 1 vị trí ngoài column, row trên preview`, async () => {
//       const dndManual = Object.assign({}, data.dnd_block, {
//         async callBack({ page, x, y }) {
//           await page.mouse.move(x, y * 1.5);
//         },
//       });
//       await webBuilder.dragAndDropInWebBuilder(dndManual);
//     });

//     await test.step("Verify position still auto when drop outside row/column", async () => {
//       await expect(positionValue).toHaveText(expected.position_auto);
//     });

//     await test.step(`Kéo thả block Tab vào trong 1 Container`, async () => {
//       await webBuilder.insertSectionBlock({
//         parentPosition: addContainer.parent_position,
//         category: addContainer.basics_cate,
//         template: addContainer.template,
//       });
//       await webBuilder.backBtn.click();
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_in_container);
//     });

//     await test.step("Verify error message appear", async () => {
//       await expect(webBuilder.toastMessage).toHaveText(expected.add_tabs_in_container_msg);
//       await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     });

//     await test.step(`Kéo thả 1 block bất kì (trừ block Container, Tabs, Accordion)
// vào item content của block Tab level 1`, async () => {
//       buttonId = await webBuilder.dragAndDropInWebBuilder(data.dnd_block_to_lvl1);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.first_block_component);
//     });

//     await test.step(`Kéo thả nhiều block vào item content level 1 (trừ Container, Tab, Accordion)`, async () => {
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_more_to_lvl1);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.second_block_component);
//       await webBuilder.removeBtn.click();
//       await webBuilder.selectElementInPreviewById(buttonId);
//       await webBuilder.selectOptionOnQuickBar("Delete");
//     });

//     await test.step(`Kéo thả block Container vào item content của block Tab level 1`, async () => {
//       await webBuilder.selectParentBreadcrumb(data.lvl1_column, "Row", 2);
//       await webBuilder.changeDesign(data.edit_row_height);
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_container_in_lvl1);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.container_component);
//       await webBuilder.removeBtn.click();
//     });

//     await test.step(`Kéo thả block Tab vào trong item content của 1 block Tab khác (level 1)`, async () => {
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_tabs_in_lvl1);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.tabs_component);
//       await webBuilder.removeBtn.click();
//     });

//     await test.step(`Kéo thả block Accordion vào trong item content của 1 block Tab khác (level 1)`, async () => {
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_accordion_in_lvl1);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.accordion_component);
//       await webBuilder.removeBtn.click();
//     });

//     await test.step(`Click button Add block tại item content của 1 block Tab level 1
// và select block Tab trên Insert panel`, async () => {
//       await webBuilder.clickAddBlockInTabsAccordion(firstBlock, data.add_block_lvl1);
//       await webBuilder.searchbarTemplate.fill("Tabs");
//       await webBuilder.getTemplatePreviewByName("Tabs").click();
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.tabs_component);
//     });

//     await test.step(`Kéo thả 1 block bất kì (trừ block Container, Tabs, Accordion)
// vào item content của block Tab level 2`, async () => {
//       const dndBlockToTabsLvl2 = data.dnd_block_lvl2;
//       ratingId = await webBuilder.dragAndDropInWebBuilder(dndBlockToTabsLvl2);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.first_block_component);
//     });

//     await test.step(`Kéo thả nhiều block vào item content level 2 (trừ Container, Tab, Accordion)`, async () => {
//       const dndMoreToTabsLvl2 = data.dnd_more_lvl2;
//       await webBuilder.dragAndDropInWebBuilder(dndMoreToTabsLvl2);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.second_block_component);
//       await webBuilder.removeBtn.click();
//       await webBuilder.selectElementInPreviewById(ratingId);
//       await webBuilder.selectOptionOnQuickBar("Delete");
//     });

//     await test.step(`Kéo thả block Container vào item content của block Tab level 2`, async () => {
//       await webBuilder.selectParentBreadcrumb(data.lvl2_column, "Row", 2);
//       await webBuilder.changeDesign(data.edit_row_height);
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_container_to_lvl2);
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.container_component);
//       await webBuilder.removeBtn.click();
//     });

//     await test.step(`Kéo thả block Tab vào item content của
// 1 block Tab level 2 (block Tab đã ở trong 1 block Tab khác)`, async () => {
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_tabs_to_lvl2);
//     });

//     await test.step("Verify error message appear", async () => {
//       await expect(webBuilder.toastMessage).toHaveText(expected.add_tabs_accordion_in_lvl2_msg);
//       await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     });

//     await test.step(`Kéo thả block Accordion vào trong item content của 1 block Tab khác (level 2)`, async () => {
//       await webBuilder.dragAndDropInWebBuilder(data.dnd_accordion_to_lvl2);
//     });

//     await test.step("Verify error message appear", async () => {
//       await expect(webBuilder.toastMessage).toHaveText(expected.add_tabs_accordion_in_lvl2_msg);
//       await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     });

//     await test.step(`Click button Add block tại item content của
// 1 block Tab level 2 và select block Tab trên Insert panel`, async () => {
//       await columnLvl2.hover();
//       await columnLvl2.locator(webBuilder.addBlockBtn).click();
//       await webBuilder.getTemplatePreviewByName(data.insert_tabs_to_lvl2).click({ delay: 300 });
//     });

//     await test.step("Verify error message appear", async () => {
//       await expect(webBuilder.toastMessage).toHaveText(expected.add_tabs_accordion_in_lvl2_msg);
//     });

//     await test.step(`Click button Add block tại item content của
// 1 block Tab level 2 và select 1 block bất kì (trừ Container, Tab, Accordion)`, async () => {
//       await webBuilder.toastMessage.waitFor({ state: "hidden" });
//       await webBuilder.getTemplatePreviewByName(data.insert_heading_to_lvl2).click();
//     });

//     await test.step("Verify block dropped successfully", async () => {
//       await expect(droppedBlock).toBeVisible();
//       await expect(droppedBlock).toHaveAttribute("data-block-component", expected.heading_component);
//     });
//   });
// });

// const drivenCase2 = "ACTION_TABS_ACCORDION";
// const actConf = loadData(__dirname, drivenCase2);
// actConf.caseConf.data.forEach(data => {
//   test(`@${data.case_id} Check các action với block ${data.block_type}`, async ({ dashboard, snapshotFixture }) => {
//     const addBlockAuto = data.add_block_auto;
//     const addBlockManual = data.add_block_manual;
//     const expected = data.expected;
//     const edgePosition = { position: { x: 5, y: 5 } };
//     const section1 = actConf.caseConf.section_1;
//     const blockAuto = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
//     const duplicatedBlock = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 2 }));
//     const blockManual = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 2, block: 1 }));

//     await test.step("Pre-condition: Add bock", async () => {
//       await webBuilder.insertSectionBlock({
//         parentPosition: addBlockAuto.parent_position,
//         category: addBlockAuto.basics_cate,
//         template: addBlockAuto.template,
//       });
//       for (const addBlock of addBlockManual) {
//         await webBuilder.dragAndDropInWebBuilder(addBlock);
//         await webBuilder.changeDesign(data.position_manual);
//         if (data.block_type === "Accordion") {
//           await blockManual.locator(block.accordionHeading).first().click(edgePosition);
//         }
//       }
//     });

//     await test.step(`Click vào block ${data.block_type} Auto`, async () => {
//       await blockAuto.click(edgePosition);
//     });

//     await test.step("Verify quickbar settings buttons", async () => {
//       for (const button of data.quickbar_buttons) {
//         await expect(block.quickBarButton(button)).toBeVisible();
//       }
//     });

//     await test.step(`Click Edit ${data.block_type} trên Quickbar`, async () => {
//       await webBuilder.selectOptionOnQuickBar(data.edit_button);
//     });

//     await test.step("Verify changed to tab Content", async () => {
//       await expect(block.tabSettings.filter({ hasText: "Content" })).toHaveClass(new RegExp(expected.tab_active));
//       await expect(webBuilder.genLoc(block.getSelectorByLabel("headings"))).toBeVisible();
//     });

//     await test.step(`Verify Move forward/ Move backward
// trên Quickbar của block "${data.block_type} Auto" disabled`, async () => {
//       await expect(block.quickBarButton("Bring forward")).toHaveClass(new RegExp(expected.disabled_button));
//       await expect(block.quickBarButton("Bring backward")).toHaveClass(new RegExp(expected.disabled_button));
//     });

//     await test.step(`Click Move forward/ Move backward
// trên Quickbar của block "${data.block_type} Manual"`, async () => {
//       await blockManual.click(edgePosition);
//       await block.selectOptionOnQuickBar("Bring forward");
//     });

//     await test.step(`Verify Move forward/ Move backward
// trên Quickbar của block "${data.block_type} Auto" disabled`, async () => {
//       await expect(block.quickBarButton("Bring forward")).not.toHaveClass(new RegExp(expected.disabled_button));
//       await expect(block.quickBarButton("Bring backward")).not.toHaveClass(new RegExp(expected.disabled_button));
//       await block.backBtn.click();
//       await softAssertion(blockManual).toHaveCSS("z-index", expected.block_z_index);
//     });

//     await test.step(`Click Duplicate option trên Quickbar trên block "${data.block_type} Auto"`, async () => {
//       await blockAuto.click(edgePosition);
//       await block.selectOptionOnQuickBar("Duplicate");
//     });

//     await test.step("Verify duplicated block", async () => {
//       await expect(duplicatedBlock).toHaveClass(new RegExp(expected.selected));
//       await block.backBtn.click();
//       await expect(duplicatedBlock).not.toHaveClass(new RegExp(expected.selected));
//       await snapshotFixture.verifyWithIframe({
//         page: dashboard,
//         selector: duplicatedBlock,
//         snapshotName: expected.duplicate_block_snapshot,
//       });
//     });

//     await test.step(`Click Hide option trên Quickbar trên block "${data.block_type} Auto"`, async () => {
//       await duplicatedBlock.click(edgePosition);
//       await block.selectOptionOnQuickBar("Hide");
//     });

//     await test.step("Verify block is hidden", async () => {
//       await expect(duplicatedBlock).toBeHidden();
//       await expect(duplicatedBlock).toBeAttached();
//     });

//     await test.step(`Click Show block "${data.block_type} Auto" trên Sidebar`, async () => {
//       await block.backBtn.click();
//       await block.expandCollapseLayer({
//         sectionName: section1,
//         isExpand: true,
//       });
//       await block.hideOrShowLayerInSidebar({
//         sectionName: section1,
//         subLayerName: data.block_type,
//         subLayerIndex: 2,
//         isHide: false,
//       });
//     });

//     await test.step("Verify show block hidden", async () => {
//       await expect(duplicatedBlock).toBeVisible();
//     });

//     await test.step(`Click Save as template option
// trên Quickbar của block "${data.block_type} Auto" và save block vào library`, async () => {
//       await blockManual.click(edgePosition);
//       await block.saveAsTemplate(data.save_block);
//     });

//     await test.step("Verify message save", async () => {
//       await expect(webBuilder.toastMessage).toHaveText(expected.save_success_msg);
//     });

//     await test.step(`Click Delete option trên Quickbar của block "${data.block_type} Auto"`, async () => {
//       await duplicatedBlock.click(edgePosition);
//       await block.selectOptionOnQuickBar("Delete");
//     });

//     await test.step("Verify block is deleted", async () => {
//       await expect(duplicatedBlock).toBeHidden();
//       await expect(duplicatedBlock).not.toBeAttached();
//     });
//   });
// });

// test(`@SB_WEB_BUILDER_LB_TABA_04 Check resize ngang block Tab`, async ({ dashboard, snapshotFixture, cConf }) => {
//   const expected = cConf.expected;
//   await test.step("Pre-condition: Add block tabs", async () => {
//     for (const dndBlock of cConf.dnd_blocks) {
//       await webBuilder.dragAndDropInWebBuilder(dndBlock);
//     }
//     await firstBlock.locator(block.tabsHeading).click();
//     await block.changeDesign(cConf.tabs1_align);
//     for (const data of cConf.tabs1_title) {
//       await block.editTabsAccordionTitle(firstBlock, data.tab_number, data.title);
//     }
//     await block.backBtn.click();
//     await block.clickAddBlockInTabsAccordion(firstBlock, { level: 1, row: 1, column: 1 });
//     await block.getTemplatePreviewByName("Heading").click();
//     await secondBlock.locator(block.tabsHeading).click();
//     await block.changeDesign(cConf.tabs2_align);
//     await block.editTabsAccordionTitle(secondBlock, 1, cConf.tabs2_title);
//     await block.switchToTab("Content");
//     await block.getBtnTabsAccordionHeading({ item: 2, button: "delete" }).click();
//     await block.getBtnTabsAccordionHeading({ item: 2, button: "delete" }).click();
//     await block.clickAddBlockInTabsAccordion(secondBlock, { level: 1, row: 1, column: 1 });
//     await block.getTemplatePreviewByName("Paragraph").click();
//     await thirdBlock.locator(block.tabsHeading).click();
//     await block.changeDesign(cConf.tabs3_align);
//     for (const data of cConf.tabs3_title) {
//       await block.editTabsAccordionTitle(thirdBlock, data.tab_number, data.title);
//     }
//     await block.switchToTab("Content");
//     await block.getBtnTabsAccordionHeading({ item: 3, button: "delete" }).click();
//     await block.clickAddBlockInTabsAccordion(thirdBlock, { level: 1, row: 1, column: 1 });
//     await block.getTemplatePreviewByName("Button").click();
//   });

//   await test.step(`Resize block Tab 1 width của block > tổng width của các item name`, async () => {
//     await block.resizeBlock(firstBlock, cConf.first_block_resize_1);
//   });

//   await test.step("Verify heading after resize", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: firstBlock.locator(block.tabsHeading),
//       snapshotName: expected.first_block_heading_resize_1,
//     });
//   });

//   await test.step(`Resize block Tab 1 width của block nhỏ dần bằng với tổng width của các item name`, async () => {
//     await block.resizeBlock(firstBlock, cConf.first_block_resize_2);
//   });

//   await test.step("Verify heading after resize", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: firstBlock.locator(block.tabsHeading),
//       snapshotName: expected.first_block_heading_resize_2,
//     });
//   });

//   await test.step(`Resize block Tab 1 tiếp width của block nhỏ dần`, async () => {
//     await block.resizeBlock(firstBlock, cConf.first_block_resize_3);
//   });

//   await test.step("Verify heading after resize", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: firstBlock.locator(block.tabsHeading),
//       snapshotName: expected.first_block_heading_resize_3,
//     });
//   });

//   await test.step(`Resize block Tab 2 nhỏ dần`, async () => {
//     await block.resizeBlock(secondBlock, cConf.second_block_resize);
//   });

//   await test.step("Verify heading after resize", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: secondBlock.locator(block.tabsHeading),
//       snapshotName: expected.second_block_resize,
//     });
//   });

//   await test.step(`Resize block Tab 3 nhỏ dần`, async () => {
//     await block.resizeBlock(thirdBlock, cConf.third_block_resize);
//   });

//   await test.step("Verify heading after resize", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: thirdBlock.locator(block.tabsHeading),
//       snapshotName: expected.third_block_resize,
//     });
//   });
// });

// test(`@SB_WEB_BUILDER_LB_TABA_05 Resize height của block Tab`, async ({ cConf }) => {
//   const expected = cConf.expected;
//   await test.step("Pre-condition: Add block tabs", async () => {
//     await webBuilder.dragAndDropInWebBuilder(cConf.dnd_block);
//     await firstBlock.locator(block.tabsHeading).click();
//     for (const data of cConf.tabs_title) {
//       await block.editTabsAccordionTitle(firstBlock, data.tab_number, data.title);
//     }
//   });

//   await test.step("Pre-condition: Add content for tabs", async () => {
//     await block.backBtn.click();
//     await block.clickAddBlockInTabsAccordion(firstBlock, { level: 1, row: 1, column: 1 });
//     await block.getTemplatePreviewByName("Toggle list").click();
//   });

//   await test.step(`Resize height của block > height của content`, async () => {
//     await block.resizeBlock(firstBlock, cConf.first_height_resize);
//   });

//   await test.step("Verify preview and sidebar match height", async () => {
//     const tabsBox = await firstBlock.boundingBox();
//     await expect(heightUnit).toHaveText(expected.height_unit_changed);
//     await expect(heightValue).toHaveValue(tabsBox.height.toString());
//   });

//   await test.step(`Resize height của block nhỏ hơn height của content`, async () => {
//     await block.changeDesign(cConf.edit_height);
//     await block.resizeBlock(firstBlock, cConf.second_height_resize);
//   });

//   await test.step("Verify hiển thị trong block tabs", async () => {
//     const toggleList = block.getLocInTabsAccordion(firstBlock, { level: 1, row: 1, column: 1, block: 1 });
//     const toggleListBox = await toggleList.boundingBox();
//     const columnTabsBox =
// await block.getLocInTabsAccordion(firstBlock, { level: 1, row: 1, column: 1 }).boundingBox();
//     softAssertion(columnTabsBox.height).toBeLessThan(toggleListBox.height);
//     await softAssertion(toggleList).not.toBeInViewport({ ratio: 0.6 });
//   });

//   await test.step(`Resize content < 160px`, async () => {
//     await block.resizeBlock(firstBlock, cConf.third_height_resize);
//   });

//   await test.step("Verify after resize", async () => {
//     const blockAfterResized = await firstBlock.boundingBox();
//     await softAssertion(heightValue).toHaveValue(blockAfterResized.height.toString());
//   });

//   await test.step(`Resize height dài ra`, async () => {
//     await block.resizeBlock(firstBlock, cConf.fourth_height_resize);
//   });

//   await test.step("Verify after resize", async () => {
//     const blockAfterResized = await firstBlock.boundingBox();
//     await softAssertion(heightValue).toHaveValue(blockAfterResized.height.toString());
//   });
// });

// test(`@SB_WEB_BUILDER_LB_TABA_07 Check resize block Accordion`, async ({ snapshotFixture, dashboard, cConf }) => {
//   const expected = cConf.expected;

//   await test.step("Pre-condition: Add block accordion", async () => {
//     await webBuilder.dragAndDropInWebBuilder(cConf.dnd_block);
//     await firstBlock.locator(block.accordionExpandIcon).first().click();
//   });

//   await test.step("Verify chỉ cho phép resize ngang", async () => {
//     await expect(block.getResizerInLivePreview("left")).toBeVisible();
//     await expect(block.getResizerInLivePreview("right")).toBeVisible();
//     await expect(block.getResizerInLivePreview("bottom")).toBeHidden();
//     await expect(block.getResizerInLivePreview("bottom-left")).toBeHidden();
//     await expect(block.getResizerInLivePreview("bottom-right")).toBeHidden();
//     await expect(block.getResizerInLivePreview("top")).toBeHidden();
//     await expect(block.getResizerInLivePreview("top-left")).toBeHidden();
//     await expect(block.getResizerInLivePreview("top-right")).toBeHidden();
//   });

//   await test.step(`Resize block Accordion với width block > width của item name`, async () => {
//     await block.resizeBlock(firstBlock, cConf.resize_equal_item_name);
//   });

//   await test.step("Verify block after resized", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: firstBlock,
//       snapshotName: expected.resize_accordion_1,
//     });
//   });

//   await test.step(`Resize width block nhỏ hơn width của item name`, async () => {
//     await block.resizeBlock(firstBlock, cConf.resize_smaller_than_item_name);
//   });

//   await test.step("Verify block after resized", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: firstBlock,
//       snapshotName: expected.resize_accordion_2,
//     });
//   });

//   await test.step(`Resize width block < 256px`, async () => {
//     await block.resizeBlock(firstBlock, cConf.resize_smaller_than_256px);
//   });

//   await test.step("Verify block after resized", async () => {
//     await block.backBtn.click();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: dashboard,
//       selector: firstBlock,
//       snapshotName: expected.resize_accordion_3,
//     });
//   });
// });
