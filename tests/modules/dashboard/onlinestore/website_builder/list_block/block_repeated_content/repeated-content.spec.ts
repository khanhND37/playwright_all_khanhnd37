import { expect, test } from "@fixtures/website_builder";
import { Blocks, ClickType } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { Locator, Page } from "@playwright/test";
import { PageSettingsData, ShopTheme } from "@types";
import { FrameLocator } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("Verify Repeated content block @TS_SB_WEB_BUILDER_LB_BRC", () => {
  let blocks: Blocks,
    sectionSelector: Locator,
    blockSelector: Locator,
    firstBlock: Locator,
    secondBlock: Locator,
    droppedBlock: Locator,
    blockInItemSelector: string,
    frameLocator: FrameLocator,
    themeTest: ShopTheme,
    settingData,
    expectData;

  const blockIds = [];
  const sectionIds = [];
  const softAssertion = expect.configure({ soft: true });

  test.beforeEach(async ({ dashboard, conf, theme, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = blocks.frameLocator;
    droppedBlock = blocks.selectedTemplate;
    settingData = conf.caseConf.data;
    expectData = conf.caseConf.expect;

    await test.step("Restore theme data", async () => {
      const listTheme = await theme.list();
      themeTest = listTheme.find(theme => theme.name === conf.suiteConf.theme_test);
      const response = await builder.pageSiteBuilder(themeTest.id);
      const settingsData = response.settings_data as PageSettingsData;
      for (const section of settingsData.pages["home"].default.elements) {
        section.elements[0].elements[0].elements = [];
      }
      settingsData.pages["home"].default.elements[0].elements[1].elements[0].elements = [];
      await builder.updateSiteBuilder(themeTest.id, settingsData);
    });

    await test.step("Open web builder", async () => {
      await Promise.all([
        blocks.openWebBuilder({
          type: "site",
          id: themeTest.id,
        }),
        blocks.loadingScreen.waitFor(),
      ]);
      await blocks.reloadIfNotShow("web builder");
      const blockId = await blocks.insertSectionBlock({
        parentPosition: { section: 1, column: 2 },
        category: "Template",
        template: "Block default",
      });
      blockIds.push(blockId);
      await blocks.backBtn.click();
    });
  });

  test.afterEach(async ({}) => {
    await test.step("Xoá block sau khi test", async () => {
      if (blockIds.length > 0) {
        for (const id of blockIds) {
          await blocks.clickElementById(id, ClickType.BLOCK);
          await blocks.removeBtn.click();
        }
        await blocks.clickSave();
      }
      if (sectionIds.length > 0) {
        for (const id of sectionIds) {
          await blocks.clickElementById(id, ClickType.SECTION);
          await blocks.removeBtn.click();
        }
        await blocks.clickSave();
      }
      blockIds.length = 0;
      sectionIds.length = 0;
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_01 Check việc add block Repeated content vào preview`, async ({
    snapshotFixture,
    context,
  }) => {
    const blockRepeated = blocks.getTemplatePreviewByName("Repeated content");
    sectionSelector = frameLocator.locator(blocks.getSelectorByIndex(settingData.section_1));

    await test.step(`Click "+" icon trên Navigation bar`, async () => {
      await blocks.clickBtnNavigationBar("insert");
      await expect(blocks.insertPreview).toBeVisible();
      await expect(blockRepeated).toBeVisible();
      await blocks.closeInsertPanelBtn.click();
    });

    await test.step(`Ở section 1, kéo thả block Repeated content vào 1 vị trí auto trên preview (nằm ngoài 1 block Container, Tabs, Accordion)`, async () => {
      const repeated = settingData.add_block_repeated;
      await blocks.insertSectionBlock({
        parentPosition: repeated.parent_position,
        category: repeated.basics_cate,
        template: repeated.template,
      });
      await blocks.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.xpathSidebar,
        snapshotName: expectData.data_default,
      });

      await blocks.clickBackLayer();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: sectionSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.block_in_blank_section_desktop,
      });
    });

    await test.step(`Ở section 2, add block Repeated content vào trong 1 Container`, async () => {
      const container = settingData.add_block_in_container;
      await blocks.insertSectionBlock({
        parentPosition: container.add_container.parent_position,
        category: container.add_container.basics_cate,
        template: container.add_container.template,
      });

      await blocks.insertSectionBlock({
        parentPosition: container.add_block.parent_position,
        category: container.add_block.basics_cate,
        template: container.add_block.template,
      });

      await expect(blocks.toastMessage).toHaveText(expectData.add_block_in_container_msg);
      await blocks.toastMessage.waitFor({ state: "hidden" });
    });

    await test.step(`Delete block Container`, async () => {
      const blockContainer = blocks.getSelectorByIndex({ section: 2, block: 1 });
      await blocks.closeInsertPanelBtn.click();
      await blocks.clickOnElementInIframe(frameLocator, blockContainer);
      await blocks.quickBarButton("Delete").click();
    });

    await test.step(`Ở section 2, add block Repeated content vào Item 1 thuộc block Tabs/ Accoridon`, async () => {
      // Add block in tabs
      const tabs = settingData.add_block_in_tab;
      const blockInTabs = frameLocator.locator(blocks.getSelectorByIndex({ section: 2, block: 1 }));
      await blocks.insertSectionBlock({
        parentPosition: tabs.add_tab.parent_position,
        category: tabs.add_tab.basics_cate,
        template: tabs.add_tab.template,
      });
      await blocks.backBtn.click({ delay: 200 });

      await blocks.clickAddBlockInTabsAccordion(blockInTabs, tabs.add_block_lvl1);
      await blocks.searchbarTemplate.clear();
      await blocks.searchbarTemplate.fill(settingData.block_name);
      await blocks.getTemplatePreviewByName(settingData.block_name).click();

      // Add block in accordion
      const accordion = settingData.add_block_in_accordion;
      const blockInAccordion = frameLocator.locator(blocks.getSelectorByIndex({ section: 3, block: 1 }));
      await blocks.insertSectionBlock({
        parentPosition: accordion.add_accordion.parent_position,
        category: accordion.add_accordion.basics_cate,
        template: accordion.add_accordion.template,
      });

      await blocks.clickAddBlockInTabsAccordion(blockInAccordion, accordion.add_block_lvl1);
      await blocks.searchbarTemplate.clear();
      await blocks.searchbarTemplate.fill(settingData.block_name);
      await blocks.getTemplatePreviewByName(settingData.block_name).click();
    });

    await test.step(`Click icon Mobile nằm ở Navigation bar`, async () => {
      await blocks.switchMobileBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: sectionSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.block_in_blank_section_mobile,
      });
    });

    await test.step(`Click button Save`, async () => {
      await blocks.genLoc(blocks.xpathButtonSave).click();
      await blocks.page.waitForSelector("text='All changes are saved'");
    });

    await test.step(`Verify block repeated content in SF`, async () => {
      const storefront = await verifyRedirectUrl({
        page: blocks.page,
        selector: blocks.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        combineOptions: { fullPage: true },
        snapshotName: expectData.block_on_storefront,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_05 Check setting Content với block Repeated content`, async ({ snapshotFixture }) => {
    const addItemBtn = blocks.genLoc(blocks.getSelectorByLabel("repeated_items")).getByRole("button");
    blockSelector = frameLocator.locator(blocks.getSelectorByIndex(settingData.position_block));

    await test.step(`Pre-condition: Add block Repeated content vào preview và set item`, async () => {
      const blockId = await blocks.insertSectionBlock({
        parentPosition: settingData.add_block.parent_position,
        category: settingData.add_block.basics_cate,
        template: settingData.add_block.template,
      });
      blockIds.push(blockId);
      await blocks.clickAddBlockInRepeatedContent(blockSelector, settingData.item_index);
      await blocks.searchbarTemplate.clear();
      await blocks.templateContainer.waitFor();
      await blocks.searchbarTemplate.fill("Button");
      await blocks.getTemplatePreviewByName("Button").click();

      for (const setBlockInItem of settingData.set_data_each_item) {
        await blockSelector.locator(blocks.getXpathItemRC(setBlockInItem.item)).click();
        await blocks.switchToTab("Content");
        await blocks.inputTextBox("title", setBlockInItem.text);
      }
    });

    await test.step(`Click Add item`, async () => {
      await blockSelector.click();
      await blocks.switchToTab("Content");
      await addItemBtn.click();
    });

    await test.step("Verify new tab is added in sidebar and preview", async () => {
      await expect(blocks.getBtnRepeatedItem({ item: 5 })).toBeVisible();
    });

    await test.step(`Add 10 items vào block`, async () => {
      for (let i = 0; i < 5; i++) {
        await addItemBtn.click();
      }
    });

    await test.step(`Kéo thả để thay đổi vị trí của các item`, async () => {
      await blocks.dndRepeatedItemInSidebar(settingData.dnd_item2_to_item_10);
    });

    await test.step("Verify after dropped item", async () => {
      await snapshotFixture.verifyWithIframe({
        page: blocks.page,
        selector: blockSelector,
        snapshotName: expectData.snapshot_preview,
      });
    });

    await test.step(`Click Remove item 10`, async () => {
      await blocks.getBtnRepeatedItem(settingData.remove_item).click();
    });

    await test.step("Verify item is deleted", async () => {
      await expect(blockSelector.getByRole("button").filter({ hasText: settingData.deleted_item })).toBeHidden();
      await expect(blockSelector.getByRole("button").filter({ hasText: settingData.deleted_item })).not.toBeAttached();
    });

    await test.step(`Remove đến khi chỉ còn 1 item`, async () => {
      for (let i = 9; i > 1; i--) {
        const deleteItemBtn = blocks.getBtnRepeatedItem({ item: i, button: "delete" });
        await deleteItemBtn.click();
      }
    });

    await test.step("Verify delete button is disabled", async () => {
      await softAssertion(blocks.getBtnRepeatedItem({ item: 1, button: "delete" })).toBeHidden();
    });

    await test.step(`Click vào option Edit`, async () => {
      await blocks.getBtnRepeatedItem({ item: 1, button: "settings" }).click();
    });
    await test.step("Verify setting khi click option Edit", async () => {
      await snapshotFixture.verify({
        page: blocks.page,
        selector: blocks.xpathSidebar,
        snapshotName: expectData.snapshot_sidebar,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_06 Check drag and drop item trên màn webfront`, async ({ snapshotFixture, context }) => {
    blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step(`Pre-condition: Duplicate block Repeated content and set layout = Carousel`, async () => {
      await blockSelector.click({ delay: 500 });
      await blocks.quickBarButton("Duplicate").click();
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.design);

      // Dnd second block into section 2
      await blocks.dndTemplateInPreview(settingData.dnd_block_into_blank_section);
      await blocks.switchToTab("Design");
      await blocks.genLoc(`${blocks.xpathWidgetLayout} .w-builder__widget--layout > span`).click();
      await blocks.genLoc(blocks.layoutSlideOnPopup).click();
      await blocks.titleBar.click({ delay: 200 });
    });

    await test.step(`Ở sidebar, expand block RC và dnd item ở từng block`, async () => {
      await blocks.backBtn.click();
      for (const dndItem of settingData.dnd_item) {
        await blocks.expandCollapseLayer({
          sectionName: dndItem.expand_layer.section_name,
          isExpand: true,
        });
        await blocks.dndLayerInSidebar({
          from: {
            sectionName: dndItem.dnd.section_name,
            subLayerName: dndItem.dnd.sub_layer_1,
          },
          to: {
            sectionName: dndItem.dnd.section_name,
            subLayerName: dndItem.dnd.sub_layer_2,
          },
        });
      }
    });

    await test.step(`Verify block Repeated content after dnd item in sidebar`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        combineOptions: { fullPage: true },
        snapshotName: expectData.snapshot_wf,
      });
    });

    await test.step(`Click button Save and Preview, verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.snapshot_sf,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_07 Check add item trên màn webfront`, async ({ snapshotFixture, context }) => {
    firstBlock = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, row: 2, block: 1 }));
    secondBlock = frameLocator.locator(blocks.getSelectorByIndex({ section: 2, block: 1 }));

    await test.step(`Pre-condition: Remove 2 items`, async () => {
      await firstBlock.click();
      await blocks.switchToTab("Content");
      for (let i = 2; i > 0; i--) {
        const deleteItemBtn = blocks.getBtnRepeatedItem({ item: i, button: "delete" });
        await deleteItemBtn.click();
      }
      await blocks.clickBackLayer();
    });

    await test.step(`Pre-condition: Duplicate block and set layout = carousel`, async () => {
      await blocks.expandCollapseLayer({
        sectionName: "Section 1",
        isExpand: true,
      });

      await blocks.openLayerSettings({
        sectionName: "Section 1",
        subLayerName: "Block default",
      });
      await blocks.quickBarButton("Duplicate").click();
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.design);
      // Dnd second block into section 2
      await blocks.dndTemplateInPreview(settingData.dnd_block_into_blank_section);
      await blocks.switchToTab("Design");
      await blocks.genLoc(`${blocks.xpathWidgetLayout} .w-builder__widget--layout > span`).click();
      await blocks.genLoc(blocks.layoutSlideOnPopup).click();
      await blocks.titleBar.click({ delay: 200 });
    });

    await test.step(`Click vào block RC và add item với số lượng item <= số lượng item per row đã set `, async () => {
      await firstBlock.click();
      await expect(frameLocator.locator(blocks.xpathBtnAddItem)).toBeVisible();
      await expect(frameLocator.locator(blocks.xpathBtnAddItem)).toHaveText("Add item");

      await firstBlock.locator(blocks.xpathBtnAddItem).click();
      await secondBlock.click();
      await secondBlock.locator(blocks.xpathBtnAddItem).click();
    });

    await test.step(`Verify block on webfront`, async () => {
      await blocks.clickBackLayer();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        iframe: blocks.iframe,
        selector: "html",
        snapshotName: expectData.snapshot_add_item_less_equal_wf,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.snapshot_add_item_less_equal_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Click vào block RC và add item với số lượng item > số lượng item per row đã set `, async () => {
      await firstBlock.click();
      await firstBlock.locator(blocks.xpathBtnAddItem).click();
      await secondBlock.click();
      await secondBlock.locator(blocks.xpathBtnAddItem).click();
    });

    await test.step(`Verify block on webfront`, async () => {
      await blocks.clickBackLayer();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        iframe: blocks.iframe,
        selector: "html",
        snapshotName: expectData.snapshot_add_item_more_wf,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.snapshot_add_item_more_sf,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_08 Check add block vào item`, async ({ snapshotFixture, context }) => {
    await test.step(`Pre-condition: Add block Repeated content`, async () => {
      blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 2, column: 1 }));
      const id = await blocks.insertSectionBlock({
        parentPosition: { section: 3 },
        category: "Test",
        template: "Footer test",
      });
      sectionIds.push(id);
      await blocks.backBtn.click({ delay: 200 });
      const blockId = await blocks.insertSectionBlock({
        parentPosition: settingData.add_block.parent_position,
        category: settingData.add_block.basics_cate,
        template: settingData.add_block.template,
      });
      blockIds.push(blockId);
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.add_padding);
    });

    await test.step(`Tại section 2, hover vào item bất kì`, async () => {
      await blockSelector.locator(blocks.getXpathItemRC(1)).hover();
    });

    await test.step(`Click vào button Add block`, async () => {
      await blocks.clickAddBlockInRepeatedContent(blockSelector, settingData.item_index);
      await expect(blocks.insertPreview).toBeVisible();
    });

    await test.step(`Chọn 1 block bất kì ở Insert panel Repeatable`, async () => {
      await blocks.searchbarTemplate.fill("Button");
      await blocks.getTemplatePreviewByName("Button").click();
      await blocks.backBtn.click({ delay: 200 });
    });

    await test.step(`Drag and drop block vào repeated item`, async () => {
      for (const dndBlock of settingData.dnd_block_into_item) {
        await blocks.dragAndDropInWebBuilder(dndBlock.dnd);
        if (dndBlock.component) {
          await expect(droppedBlock).toHaveAttribute("data-block-component", dndBlock.component);
        }
        if (dndBlock.toast_message) {
          await expect(blocks.toastMessage).toHaveText(dndBlock.toast_message);
          await blocks.toastMessage.waitFor({ state: "hidden" });
        }
      }
    });

    await test.step(`Dnd block được cho phép add vào item từ section/ row/column khác vào item`, async () => {
      for (const dndOtherBlock of settingData.dnd_other_block_into_item) {
        await blocks.dndTemplateInPreview(dndOtherBlock.dnd);
        if (dndOtherBlock.component) {
          await expect(droppedBlock).toHaveAttribute("data-block-component", dndOtherBlock.component);
        }
        if (dndOtherBlock.toast_message) {
          await expect(blocks.toastMessage).toHaveText(dndOtherBlock.toast_message);
          await blocks.toastMessage.waitFor({ state: "hidden" });
        }
      }
    });

    await test.step(`Drag block từ item này sang item khác trong cùng 1 block RC`, async () => {
      await blocks.dndTemplateInPreview(settingData.dnd_between_items.dnd);
      await expect(blocks.toastMessage).toHaveText(settingData.dnd_between_items.toast_message);
      await blocks.toastMessage.first().waitFor({ state: "hidden" });
    });

    await test.step(`Verify ở màn webfront`, async () => {
      await blocks.backBtn.click({ delay: 200 });
      await snapshotFixture.verifyWithIframe({
        page: blocks.page,
        iframe: blocks.iframe,
        selector: blockSelector,
        snapshotName: expectData.snapshot_preview,
      });
    });

    await test.step(`Hide section 1`, async () => {
      await blocks.hideOrShowLayerInSidebar({
        sectionName: "Section 1",
        isHide: true,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.snapshot_sf,
        },
        snapshotFixture,
      );
      await blocks.hideOrShowLayerInSidebar({
        sectionName: "Section 1",
        isHide: false,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_11 Check sync data giữa các item khi setting data của column`, async ({
    context,
    snapshotFixture,
  }) => {
    blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step(`Pre-condition: Dnd block vào item`, async () => {
      await blocks.dragAndDropInWebBuilder(settingData.dnd_block_into_item);
    });

    await test.step(`Click vào Item 1`, async () => {
      blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item);
      await frameLocator.locator(blockInItemSelector).hover();
      await frameLocator.locator(blocks.getSelectorBreadcrumb("Image")).hover();
      await frameLocator.locator(blocks.getSelectorPreBreadcrumb()).click();
      await frameLocator.locator(blocks.getSelectorBreadcrumb("Column", 1)).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.xpathSidebar,
        snapshotName: expectData.default_data_column_sidebar,
      });
    });

    await test.step(`Setting column của item 1 có layout = Vertical, clipping content = turn off`, async () => {
      const settingColumnData = settingData.setting_column_vertical;
      await blocks.setLayoutForContainer(
        `${blocks.xpathWidgetLayout} .w-builder__widget--layout > span`,
        settingColumnData.layout,
      );
      await blocks.genLoc(blocks.xpathHeaderBar).click({ position: { x: 10, y: 10 } });
      await blocks.switchToggle("clipping_content", settingColumnData.clipping);
      await blocks.setBorder("border", settingColumnData.border);

      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.setting_column_vertical_wf,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.setting_column_vertical_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Setting column của item 1 có layout = Horizontal, clipping content = turn off`, async () => {
      const settingColumnData = settingData.setting_column_horizontal;
      await blocks.setLayoutForContainer(
        `${blocks.xpathWidgetLayout} .w-builder__widget--layout > span`,
        settingColumnData.layout,
      );
      await blocks.genLoc(blocks.xpathHeaderBar).click({ position: { x: 10, y: 10 } });
      await blocks.switchToggle("clipping_content", settingColumnData.clipping);
      await blocks.setBorder("border", settingColumnData.border);
      await blocks.titleBar.hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.setting_column_horizontal_wf,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.setting_column_horizontal_sf,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_12 Check sync data giữa các block trong item khi setting data của block`, async ({
    context,
    snapshotFixture,
  }) => {
    let blockId;
    blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, row: 2, block: 1 }));
    await test.step(`Pre-condition: Add block Repeated content vào preview và set item`, async () => {
      for (const dndBlock of settingData.dnd_block_into_item) {
        await blocks.dragAndDropInWebBuilder(dndBlock);
      }
    });
    await test.step(`Click vào block Button thuộc Item 1, setting content của block`, async () => {
      blockInItemSelector = blocks.getSelectorByIndex(settingData.block_button);

      await frameLocator.locator(blockInItemSelector).click();
      await blocks.switchToTab("Content");
      await blocks.inputTextBox("title", settingData.setting_block_button.text);
      await blocks.selectButtonIcon("Left");
      blockId = await blocks.getAttrsDataId();
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.not_sync_content_between_items,
      });
      await blocks.frameLocator.locator(blocks.getElementSelector(blockId, ClickType.BLOCK)).click();
    });

    await test.step(`Click vào block Button thuộc Item 1, setting style của block`, async () => {
      await blocks.switchToTab("Design");
      await blocks.settingWidthHeight("width", settingData.setting_block_button.width);
      await blocks.setBackground("background", settingData.setting_block_button.background);
      await blocks.setMarginPadding("padding", settingData.setting_block_button.padding);
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.sync_style_between_items,
      });
      await blocks.frameLocator.locator(blocks.getElementSelector(blockId, ClickType.BLOCK)).click();
    });

    await test.step(`Ở block Paragraph,thay đổi content, style của block ở quick settings và sidebar`, async () => {
      // Thay đổi content
      blockInItemSelector = blocks.getSelectorByIndex(settingData.block_paragraph);
      await frameLocator.locator(blockInItemSelector).click();
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(settingData.setting_block_paragraph.text);
      await blocks.titleBar.click({ delay: 200 });

      // Thay đổi style ở quicksettings
      await blockSelector.click();
      await frameLocator.locator(blockInItemSelector).click();
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.editQuickSettingsText(settingData.setting_block_paragraph.color);
      await blocks.titleBar.click({ delay: 200 });

      // Thay đổi style ở sidebar
      await blocks.setBackground("background", settingData.setting_block_paragraph.background);
      await blocks.backBtn.click({ delay: 200 });
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.sync_data_text_editor_between_items,
      });
    });

    await test.step(`Remove block bất kì`, async () => {
      blockInItemSelector = blocks.getSelectorByIndex(settingData.block_image);
      await frameLocator.locator(blockInItemSelector).click();
      await blocks.selectOptionOnQuickBar("Delete");
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.sync_number_of_blocks_in_item_after_delete_block,
      });
      await blocks.frameLocator.locator(blocks.getElementSelector(blockId, ClickType.BLOCK)).click();
    });

    await test.step(`Drag and drop block bất kì ra khỏi item`, async () => {
      await blockSelector.click();
      await blocks.dndTemplateInPreview(settingData.dnd_block_out_of_item);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blockSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.sync_number_of_blocks_in_item_after_dnd_block_out_of_item,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.sync_data_between_block_sf,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_13 Check layout của block RC khi setting layout = Grid`, async ({
    conf,
    context,
    snapshotFixture,
    pageMobile,
  }) => {
    let previewPage: Page;
    sectionSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1 }));
    blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, row: 2, block: 1 }));
    blockInItemSelector = blocks.getSelectorByIndex({ section: 1, row: 2, block: 1 });

    await test.step(`Click vào block RC, setting data với layout = Grid`, async () => {
      const desktopBlock = settingData.desktop;
      await blockSelector.click();
      await blocks.switchToTab("Design");
      await blocks.genLoc(`${blocks.xpathWidgetLayout} .w-builder__widget--layout > span`).click();
      await blocks.settingDesignAndContentWithSDK(conf.caseConf.layout_grid_desktop);
      await expect(blocks.genLoc(blocks.getXpathSlider("Spacing"))).toHaveAttribute(
        "style",
        new RegExp(desktopBlock.slider_spacing),
      );
      await expect(blocks.genLoc(blocks.getXpathSlider("Item per row"))).toHaveAttribute(
        "style",
        new RegExp(desktopBlock.slider_item),
      );
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: sectionSelector,
        iframe: blocks.iframe,
        snapshotName: expectData.setting_data_desktop_wf,
      });
    });

    await test.step(`Click icon Switch mobile, check hiển thị data trên mobile`, async () => {
      const mobileBlock = settingData.mobile;
      await blocks.switchMobileBtn.click();
      await blockSelector.click({ position: { x: 10, y: 10 } });
      await blocks.switchToTab("Design");
      await blocks.genLoc(`${blocks.xpathWidgetLayout} .w-builder__widget--layout > span`).click();
      await blocks.settingDesignAndContentWithSDK(conf.caseConf.layout_grid_mobile);
      await expect(blocks.genLoc(blocks.getXpathSlider("Spacing"))).toHaveAttribute(
        "style",
        new RegExp(mobileBlock.slider_spacing),
      );
      await expect(blocks.genLoc(blocks.getXpathSlider("Item per row"))).toHaveAttribute(
        "style",
        new RegExp(mobileBlock.slider_item),
      );
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: sectionSelector,
        snapshotName: expectData.setting_data_mobile_wf,
      });
    });

    await test.step(`Verify block on storefront`, async () => {
      previewPage = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.setting_data_desktop_sf,
          selector: blocks.getSelectorByIndex({ section: 1 }),
          isNextStep: true,
        },
        snapshotFixture,
      );
    });

    await test.step(`Verify block on storefront on mobile`, async () => {
      const dbMobile = new DashboardPage(pageMobile, conf.suiteConf.domain);
      await dbMobile.login({
        userId: conf.suiteConf.user_id,
        shopId: conf.suiteConf.shop_id,
        password: conf.suiteConf.password,
        email: conf.suiteConf.username,
      });
      await dbMobile.waitUtilNotificationIconAppear();
      await pageMobile.waitForURL(/admin/);
      const previewUrl = previewPage.url();
      await pageMobile.goto(previewUrl);
      await pageMobile.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: pageMobile,
        selector: "[component='repeated']",
        snapshotName: expectData.setting_data_mobile_sf,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BRC_14 Check layout của block RC khi setting layout = Carousel`, async ({
    snapshotFixture,
    context,
    pageMobile,
    conf,
  }) => {
    firstBlock = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, row: 2, block: 1 }));

    await test.step(`Pre-condition: Add block Repeated content vào section 2 và section 3`, async () => {
      for (const dndBlock of settingData.dnd_block) {
        await blocks.dragAndDropInWebBuilder(dndBlock);
      }
    });
    await test.step(`Tại section 1, set layout = Slide, không setting data, giữ nguyên data mặc định của block`, async () => {
      await firstBlock.click();
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.desktop.block_1);
    });

    await test.step(`Ở block 2, setting data để show trạng thái lấp ló của items và tự động chuyển slide`, async () => {
      const desktopBlock2 = settingData.desktop.setting_block_2;
      await blocks.clickBackLayer();
      await blocks.expandCollapseLayer({
        sectionName: desktopBlock2.expand_layer.section_name,
        isExpand: true,
      });
      await blocks.openLayerSettings({
        sectionName: desktopBlock2.open_layer.section_name,
        subLayerName: desktopBlock2.open_layer.block_name,
      });
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.desktop.block_2);
      await blocks.backBtn.click({ delay: 200 });
    });

    await test.step(`Ở block 3, setting data với số lượng item ít hơn item per row`, async () => {
      const desktopBlock3 = settingData.desktop.setting_block_3;
      await blocks.expandCollapseLayer({
        sectionName: desktopBlock3.expand_layer.section_name,
        isExpand: true,
      });
      await blocks.openLayerSettings({
        sectionName: desktopBlock3.open_layer.section_name,
        subLayerName: desktopBlock3.open_layer.block_name,
      });
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.desktop.block_3);
      await blocks.backBtn.click({ delay: 200 });
    });

    await test.step(`Verify setting data của 3 block trên ở màn webfront on desktop`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: "html",
        iframe: blocks.iframe,
        snapshotName: expectData.setting_data_desktop_wf,
      });
    });

    await test.step(`Click icon button Switch mobile, click vào từng block để set layout = Slide`, async () => {
      await blocks.switchMobileBtn.click();
      await expect(blocks.toastMessage).toBeHidden();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: "html",
        iframe: blocks.iframe,
        snapshotName: expectData.default_data_on_mobile,
      });
    });
    await test.step(`Tại section 1, set layout = Slide, không setting data, giữ nguyên data mặc định của block`, async () => {
      await firstBlock.click({ delay: 300 });
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.mobile.block_1);
    });

    await test.step(`Ở block 2, setting data để show trạng thái lấp ló của items và tự động chuyển slide`, async () => {
      const mobileBlock2 = settingData.mobile.setting_block_2;
      await blocks.clickBackLayer();
      await blocks.expandCollapseLayer({
        sectionName: mobileBlock2.expand_layer.section_name,
        isExpand: true,
      });
      await blocks.openLayerSettings({
        sectionName: mobileBlock2.open_layer.section_name,
        subLayerName: mobileBlock2.open_layer.block_name,
      });
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.mobile.block_2);
      await blocks.backBtn.click({ delay: 200 });
    });

    await test.step(`Ở block 3, setting data`, async () => {
      const mobileBlock3 = settingData.mobile.setting_block_3;
      await blocks.openLayerSettings({
        sectionName: mobileBlock3.open_layer.section_name,
        subLayerName: mobileBlock3.open_layer.block_name,
      });
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(settingData.mobile.block_3);
      await blocks.backBtn.click({ delay: 200 });
    });

    await test.step(`Verify setting data của 3 block bên trên ở màn webfront on mobile`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: "html",
        iframe: blocks.iframe,
        snapshotName: expectData.setting_data_mobile_wf,
      });
    });

    await test.step(`Click button Save -> click button Preview, check hiển thị ngoài SF`, async () => {
      // Verify on desktop
      const previewPage = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          snapshotName: expectData.setting_data_desktop_sf,
          isNextStep: true,
        },
        snapshotFixture,
      );

      // Verify on mobile
      const dbMobile = new DashboardPage(pageMobile, conf.suiteConf.domain);
      await dbMobile.login({
        userId: conf.suiteConf.user_id,
        shopId: conf.suiteConf.shop_id,
        password: conf.suiteConf.password,
        email: conf.suiteConf.username,
      });
      await dbMobile.waitUtilNotificationIconAppear();
      await pageMobile.waitForURL(/admin/);
      await pageMobile.goto(previewPage.url());
      await pageMobile.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: pageMobile,
        selector: ".main",
        snapshotName: expectData.setting_data_mobile_sf,
      });
    });
  });
});

// Move into common (WB core)
// test(`@SB_WEB_BUILDER_LB_BRC_03 Check resize block Repeated content (RC) đối với layout = Grid`, async ({
//   dashboard,
//   context,
//   snapshotFixture,
// }) => {
//   await test.step("Pre-condition: Duplicate block", async () => {
//     await frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
//     await blocks.selectOptionOnQuickBar("Duplicate");
//     await frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 2 })).click();
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   for (const dataResize of settingData) {
//     // Setting data resize
//     blockSelector = frameLocator.locator(blocks.getSelectorByIndex(dataResize.position));
//     await blockSelector.click();
//     await blocks.settingWidthHeight("width", dataResize.set_unit_width);
//     await blocks.resizeBlock(blockSelector, dataResize.resize);

//     //Verify width của block và width của item của block sau khi resize
//     await blocks.switchToTab("Design");
//     const widthBlockAfterResized = await blockSelector.boundingBox();
//     const widthItemAfterResized = await blockSelector.locator(blocks.getXpathItemRC(0)).boundingBox();
//     const expectedWidth = Math.round(
//       parseFloat(await blocks.genLoc(`${blocks.getSelectorByLabel("width")}//input`).inputValue()),
//     );
//     await expect(Math.round(widthBlockAfterResized.width)).toBe(expectedWidth);
//     await expect(widthItemAfterResized.width).toBe(dataResize.width_item);
//   }

//   await test.step(`Verify block Repeated content after resize on storefront`, async () => {
//     await blocks.clickSaveAndVerifyPreview(
//       {
//         context,
//         dashboard: dashboard,
//         snapshotName: expectData.resize_sf,
//       },
//       snapshotFixture,
//     );
//   });
// });

// test(`@SB_WEB_BUILDER_LB_BRC_04 Check resize block Repeated content (RC) đối với layout = Carousel`, async ({
//   dashboard,
//   context,
//   snapshotFixture,
// }) => {
//   await test.step("Pre-condition: Duplicate block", async () => {
//     await frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
//     await blocks.selectOptionOnQuickBar("Duplicate");
//     await frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 2 })).click();
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   for (const dataResize of settingData) {
//     // Setting data resize
//     blockSelector = frameLocator.locator(blocks.getSelectorByIndex(dataResize.position));
//     // const repeatedBlock = blocks.getSelectorByIndex(dataResize.position);
//     await blockSelector.click();
//     await dashboard.locator(blocks.widgetLayoutXpath).click();
//     await dashboard.locator(blocks.layoutSlideOnPopup).click();
//     await dashboard.locator(blocks.widgetLayoutXpath).click();

//     await blocks.settingWidthHeight("width", dataResize.set_unit_width);
//     await blocks.resizeBlock(blockSelector, dataResize.resize);

//     //Verify width của block và width của item của block sau khi resize
//     await blocks.switchToTab("Design");
//     const widthBlockAfterResized = await blockSelector.boundingBox();
//     const expectedWidth = Math.round(
//       parseFloat(await blocks.genLoc(`${blocks.getSelectorByLabel("width")}//input`).inputValue()),
//     );
//     await expect(Math.round(widthBlockAfterResized.width)).toBe(expectedWidth);
//   }

//   await test.step(`Verify block on storefront`, async () => {
//     await blocks.clickSaveAndVerifyPreview(
//       {
//         context,
//         dashboard: dashboard,
//         snapshotName: expectData.resize_sf,
//       },
//       snapshotFixture,
//     );
//   });
// });

// test(`@SB_WEB_BUILDER_LB_BRC_15 Check common settings của block RC`, async ({ context, snapshotFixture }) => {
//   blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, row: 2, block: 1 }));
//   await test.step(`Click vào block RC`, async () => {
//     await blockSelector.click();
//   });
//   await test.step(`Setting 1 bộ data`, async () => {
//     //setting layout
//     await blocks.switchToTab("Design");
//     await blocks.settingWidthHeight("width", settingData.width);
//     await blocks.settingWidthHeight("height", settingData.height);
//     await blocks.backBtn.click({ delay: 200 });
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       combineOptions: { fullPage: true },
//       snapshotName: expectData.setting_data_wf,
//     });
//   });

//   await test.step(`Verify block on storefront`, async () => {
//     await blocks.clickSaveAndVerifyPreview(
//       {
//         context,
//         dashboard: blocks.page,
//         snapshotName: expectData.setting_data_sf,
//       },
//       snapshotFixture,
//     );
//   });
// });

// test(`@SB_WEB_BUILDER_LB_BRC_02 Check các action với block Repeated content`, async ({ snapshotFixture }) => {
//   const addBlockAuto = settingData.add_block_auto;
//   const blockAuto = frameLocator.locator(blocks.getSelectorByIndex(addBlockAuto.position));
//   const duplicatedBlock = frameLocator.locator(blocks.getSelectorByIndex(addBlockAuto.position_block_duplicate));

//   await test.step("Pre-condition: Add block", async () => {
//     // Add block Auto
//     await blocks.insertSectionBlock({
//       parentPosition: addBlockAuto.add.parent_position,
//       category: addBlockAuto.add.basics_cate,
//       template: addBlockAuto.add.template,
//     });
//     await blocks.clickAddBlockInRepeatedContent(blockAuto, addBlockAuto.item_index);
//     await blocks.searchbarTemplate.fill(addBlockAuto.block_name);
//     await blocks.getTemplatePreviewByName(addBlockAuto.block_name).click();
//   });

//   await test.step(`Click vào block Repeated content Auto`, async () => {
//     await blockAuto.click();
//   });

//   await test.step("Verify quickbar settings buttons", async () => {
//     for (const button of settingData.quickbar_buttons) {
//       await expect(blocks.quickBarButton(button)).toBeVisible();
//     }
//   });

//   await test.step(`Click Edit Repeated content trên Quickbar`, async () => {
//     await blocks.selectOptionOnQuickBar(settingData.edit_button);
//   });

//   await test.step("Verify changed to tab Content", async () => {
//     await expect(blocks.tabSettings.filter({ hasText: "Content" })).toHaveClass(new RegExp(expectData.tab_active));
//     await expect(blocks.genLoc(blocks.getSelectorByLabel("repeated_items"))).toBeVisible();
//   });

//   await test.step(`Verify Move forward/ Move backward trên Quickbar của block Repeated Auto disabled`, async () => {
//     await expect(blocks.quickBarButton("Move up")).toHaveClass(new RegExp(expectData.disabled_button));
//     await expect(blocks.quickBarButton("Move down")).toHaveClass(new RegExp(expectData.disabled_button));
//   });

//   await test.step(`Click Duplicate option trên Quickbar trên block Repeated Auto"`, async () => {
//     await blockAuto.click();
//     await blocks.selectOptionOnQuickBar("Duplicate");
//   });

//   await test.step("Verify duplicate block", async () => {
//     await expect(duplicatedBlock).toHaveClass(new RegExp(expectData.selected));
//     await blocks.backBtn.click();
//     await expect(duplicatedBlock).not.toHaveClass(new RegExp(expectData.selected));
//     await snapshotFixture.verifyWithIframe({
//       page: blocks.page,
//       selector: duplicatedBlock,
//       snapshotName: expectData.duplicate_block_snapshot,
//     });
//   });

//   await test.step(`Click Hide option trên Quickbar trên block Repeated Auto"`, async () => {
//     await duplicatedBlock.click();
//     await blocks.selectOptionOnQuickBar("Hide");
//   });

//   await test.step("Verify block is hidden", async () => {
//     await expect(duplicatedBlock).toBeHidden();
//     await expect(duplicatedBlock).toBeAttached();
//   });

//   await test.step(`Click Show block Repeated Auto trên Sidebar`, async () => {
//     await blocks.backBtn.click();
//     await blocks.expandCollapseLayer({
//       sectionName: settingData.section_name,
//       isExpand: true,
//     });
//     await blocks.hideOrShowLayerInSidebar({
//       sectionName: settingData.section_name,
//       subLayerName: settingData.block_name,
//       subLayerIndex: 2,
//       isHide: false,
//     });
//   });

//   await test.step("Verify show block hidden", async () => {
//     await expect(duplicatedBlock).toBeVisible();
//   });

//   await test.step(`Click Save as template option trên Quickbar của block Repeated Auto và save block vào library`,
//   async () => {
//     await blockAuto.click();
//     await blocks.saveAsTemplate(settingData.save_block);
//   });

//   await test.step("Verify message save", async () => {
//     await expect(blocks.toastMessage).toHaveText(expectData.save_success_msg);
//   });

//   await test.step(`Click Delete option trên Quickbar của block Repeated Auto"`, async () => {
//     await duplicatedBlock.click();
//     await blocks.selectOptionOnQuickBar("Delete");
//   });

//   await test.step("Verify block is deleted", async () => {
//     await expect(duplicatedBlock).toBeHidden();
//     await expect(duplicatedBlock).not.toBeAttached();
//   });
// });

// test(`@SB_WEB_BUILDER_LB_BRC_09 Check layer của mỗi item ở Sidebar`, async ({ snapshotFixture }) => {
//   blockSelector = frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 }));

//   await test.step(`Ở sidebar, expand layer block RC`, async () => {
//     await blocks.genLoc(blocks.xpathButtonLayer).click();
//     await blocks.expandCollapseLayer(settingData.expand_layer);
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: blocks
//         .getSidebarArea("body")
//         .locator(blocks.sectionsInSidebar)
//         .filter({ hasText: settingData.section_name }),
//       snapshotName: expectData.screenshot_layer_repeated,
//     });
//   });

//   await test.step(`Click vào item 1 tại layer panel`, async () => {
//     await blocks.openLayerSettings(settingData.open_item);
//     await expect(blocks.genLoc(blocks.xpathStyleSettingbar)).toHaveText(expectData.item_setting);
//   });

//   await test.step(`Click button Back ở Item 1 trên layer panel`, async () => {
//     await blocks.clickBackLayer();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: blocks
//         .getSidebarArea("body")
//         .locator(blocks.sectionsInSidebar)
//         .filter({ hasText: settingData.section_name }),
//       snapshotName: expectData.screenshot_layer_item,
//     });
//   });

//   await test.step(`Click vào Row thuộc Item 1 trên layer panel`, async () => {
//     await blocks.openLayerSettings(settingData.open_row_item);
//     await expect(blocks.genLoc(blocks.xpathStyleSettingbar)).toHaveText(expectData.item_setting);
//   });

//   await test.step(`Click button Back ở Row trên layer panel`, async () => {
//     await blocks.clickBackLayer();
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: blocks
//         .getSidebarArea("body")
//         .locator(blocks.sectionsInSidebar)
//         .filter({ hasText: settingData.section_name }),
//       snapshotName: expectData.screenshot_layer_item,
//     });
//   });

//   await test.step(`Click button Column thuộc Item 1 trên layer panel`, async () => {
//     await blocks.openLayerSettings(settingData.open_column_item);
//     await snapshotFixture.verifyWithAutoRetry({
//       page: blocks.page,
//       selector: blocks.xpathSidebar,
//       snapshotName: expectData.screenshot_default_setting_column,
//     });
//   });
// });

// test(`@SB_WEB_BUILDER_LB_BRC_10 Check breadcrumb của mỗi Item ở web front`, async () => {
//   await test.step(`Ở webfront, click vào block thuộc Item`, async () => {
//     blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item_1);
//     await blocks.clickOnElementInIframe(blocks.frameLocator, blockInItemSelector);
//     await expect(frameLocator.locator(blockInItemSelector)).toHaveAttribute(
//       "class",
//       new RegExp("wb-content-selected"),
//     );
//   });

//   await test.step(`Click vào breadcrumb của block`, async () => {
//     blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item_1);
//     const breadCrumbNames = [];
//     await frameLocator.locator(blockInItemSelector).hover();
//     await frameLocator.locator(blocks.getSelectorPreBreadcrumb()).click();
//     const breadCrumbCount = await frameLocator.locator(blocks.breadCrumbList).count();
//     await test.step("Get breadcrumb name in each item", async () => {
//       for (let i = 0; i < breadCrumbCount; i++) {
//         const breadCrumbName = await frameLocator.locator(blocks.breadCrumbList).nth(i).innerText();
//         breadCrumbNames.push(breadCrumbName);
//       }
//     });
//     expect(breadCrumbNames).toEqual(expectData.breadcrumb);
//   });

//   await test.step(`Select vào breadcrumb, chọn Column`, async () => {
//     blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item_1);
//     await frameLocator.locator(blockInItemSelector).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Image")).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Column", 1)).hover();
//     await expect(frameLocator.locator(blocks.quickSetting)).not.toHaveAttribute("type", new RegExp("button"));
//   });

//   await test.step(`Select vào , chọn Row`, async () => {
//     blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item_1);
//     await frameLocator.locator(blockInItemSelector).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Image")).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Row", 1)).hover();
//     await expect(frameLocator.locator(blocks.quickSetting)).not.toHaveAttribute("type", new RegExp("button"));
//   });

//   await test.step(`Select vào breadcrumb, chọn Item`, async () => {
//     // check disable option Move left ở quick bar khi mở quick bar của item đầu tiên
//     blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item_1);
//     await frameLocator.locator(blockInItemSelector).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Image")).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Item 1")).click();
//     await frameLocator.locator(blockInItemSelector).hover();
//     await expect(frameLocator.locator(blocks.getQuickBarItemSelector(" Move left "))).toHaveAttribute(
//       "class",
//       new RegExp("is-disabled"),
//     );
//     await expect(frameLocator.locator(blocks.getQuickBarItemSelector(" Move right "))).not.toHaveAttribute(
//       "class",
//       new RegExp("is-disabled"),
//     );

//     // Check enable option Move left ở quick bar khi mở quick bar không phải item đầu tiên
//     blockInItemSelector = blocks.getSelectorByIndex(settingData.block_item_2);
//     await frameLocator.locator(blockInItemSelector).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Image")).hover();
//     await frameLocator.locator(blocks.getSelectorBreadcrumb("Item 2")).click();
//     await frameLocator.locator(blockInItemSelector).hover();
//     await expect(frameLocator.locator(blocks.getQuickBarItemSelector(" Move left "))).not.toHaveAttribute(
//       "class",
//       new RegExp("is-disabled"),
//     );
//     await expect(frameLocator.locator(blocks.getQuickBarItemSelector(" Move right "))).not.toHaveAttribute(
//       "class",
//       new RegExp("is-disabled"),
//     );
//   });
// });
