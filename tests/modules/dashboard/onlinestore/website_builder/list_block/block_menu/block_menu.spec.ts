import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { SFBlocks } from "@pages/storefront/block";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { expect, Page } from "@playwright/test";
import type { PageSettingsData } from "@types";
import { XpathNavigationButtons } from "@constants/web_builder";
import { loadData } from "@core/conf/conf";
import { cloneDeep } from "@core/utils/object";

let templateData: PageSettingsData, pageInfo: PageSettingsData, webBuilder: Blocks;

test.describe("Verify block menu", () => {
  test.beforeAll(async ({ conf, builder }) => {
    await test.step("Pre-condition: get menu template", async () => {
      const [resTemplate, resTheme] = await Promise.all([
        builder.getPageTemplate(conf.suiteConf.pre_condition.template_id),
        builder.pageSiteBuilder(conf.suiteConf.pre_condition.theme_id),
      ]);
      templateData = resTemplate.settings_data as PageSettingsData;
      pageInfo = resTheme.settings_data as PageSettingsData;
    });
  });
  test.beforeEach(async ({ conf, builder, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new Blocks(dashboard, conf.suiteConf.domain);

    test.slow();
    await test.step("Pre-condition: apply blank template and open web builder", async () => {
      if (!templateData || !pageInfo) {
        const [resTemplate, resTheme] = await Promise.all([
          builder.getPageTemplate(conf.suiteConf.pre_condition.template_id),
          builder.pageSiteBuilder(conf.suiteConf.pre_condition.theme_id),
        ]);
        templateData = resTemplate.settings_data as PageSettingsData;
        pageInfo = resTheme.settings_data as PageSettingsData;
      }

      pageInfo.pages["home"].default.elements = cloneDeep(templateData.pages["home"].default.elements);
      pageInfo.pages["home"].default.designs = cloneDeep(templateData.pages["home"].default.designs);
      pageInfo.pages["home"].default.devices = cloneDeep(templateData.pages["home"].default.devices);
      await builder.updateSiteBuilder(conf.suiteConf.pre_condition.theme_id, pageInfo);
      await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.pre_condition.theme_id });
      await webBuilder.reloadIfNotShow("/");
    });
  });

  test("Check DnD and actions with Menu block on Quick bar setting @SB_WEB_BUILDER_LB_BMN_01", async ({
    conf,
    snapshotFixture,
  }) => {
    const data = conf.caseConf;
    const blockPosition = data.quick_bar.block;
    const blockSelector = webBuilder.getSelectorByIndex(blockPosition);

    await test.step("DnD block from Insert panel to auto position and verify style default", async () => {
      await webBuilder
        .genLoc(webBuilder.getSidebarSelectorByIndex({ section: data.add_blank_section.index.section }))
        .click();
      await webBuilder.getAddSectionBtn(data.add_blank_section.index).click({ delay: 200 });
      await webBuilder.getCategoryByName(data.add_blank_section.basics_cate).click();
      await webBuilder.getTemplatePreviewByName(data.add_blank_section.template).click();
      await webBuilder.backBtn.click({ delay: 200 });
      await webBuilder.insertSectionBlock({
        parentPosition: data.add_menu_auto.parent_position,
        category: data.add_menu_auto.basics_cate,
        template: data.add_menu_auto.template,
      });
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebar,
        snapshotName: data.snapshot_style_default,
      });
    });

    await test.step("Select Manage menu option on quick bar setting and verify", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar(data.quick_bar.manage_menu.option);
      await expect(webBuilder.genLoc(webBuilder.activeTabSideBar)).toHaveText(data.quick_bar.manage_menu.open_tab);
    });

    await test.step("Verify duplicate block", async () => {
      const beforeCountBlock = await webBuilder.countBlockInPreview(blockPosition);
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar(data.quick_bar.duplicate_block);
      const afterCountBlock = await webBuilder.countBlockInPreview(blockPosition);
      expect(afterCountBlock).toEqual(beforeCountBlock + 1);
    });

    await test.step("Verify Hide/Show block", async () => {
      // Verify hide block on preview
      let beforeCountBlock = await webBuilder.countBlockInPreview(blockPosition);
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar(data.quick_bar.hide_block);
      let afterCountBlock = await webBuilder.countBlockInPreview(blockPosition);
      expect(afterCountBlock).toEqual(beforeCountBlock - 1);

      // Verify status hide block on layer panel
      await webBuilder.clickBtnNavigationBar("layer");
      await webBuilder.expandCollapseLayer({
        sectionName: data.quick_bar.show_block.sectionName,
        sectionIndex: blockPosition.section,
        isExpand: true,
      });
      const numberOfBlockInLayerPanel = await webBuilder.countBlockInLayerPanel({
        section: blockPosition.section,
        row: blockPosition.row,
        column: blockPosition.column,
      });
      expect(numberOfBlockInLayerPanel).toEqual(beforeCountBlock);
      const selectorBlockInLayer = webBuilder.getSidebarSelectorByIndex(blockPosition);
      await expect(webBuilder.genLoc(selectorBlockInLayer)).toHaveAttribute(
        "class",
        new RegExp("w-builder__is-hidden"),
      );

      // Click eye icon and verify show block
      beforeCountBlock = afterCountBlock;
      await webBuilder.hideOrShowLayerInSidebar(data.quick_bar.show_block);
      afterCountBlock = await webBuilder.countBlockInPreview(blockPosition);
      expect(afterCountBlock).toEqual(beforeCountBlock + 1);
    });

    await test.step("Verify Remove block", async () => {
      // Verify remove block on preview
      const beforeCountBlock = await webBuilder.countBlockInPreview(blockPosition.section);
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar(data.quick_bar.remove_block);
      const afterCountBlock = await webBuilder.countBlockInPreview(blockPosition.section);
      expect(afterCountBlock).toEqual(beforeCountBlock - 1);

      // Verify remove block in layer panel
      await webBuilder.clickBtnNavigationBar("layer");
      const numberOfBlockInLayerPanel = await webBuilder.countBlockInLayerPanel({
        section: blockPosition.section,
        row: blockPosition.row,
        column: blockPosition.column,
      });
      expect(numberOfBlockInLayerPanel).toEqual(afterCountBlock);
    });
  });

  test("Check setting style cho block Menu @SB_WEB_BUILDER_LB_BMN_03", async ({ conf, builder, snapshotFixture }) => {
    const data = conf.caseConf;
    const previewUrl = await webBuilder.genLoc(webBuilder.previewWb).getAttribute("src");
    const sfUrl = new URL(previewUrl);
    sfUrl.searchParams.delete("preview");
    for (const settings of data.settings_style) {
      await test.step("Settings style block by API", async () => {
        const position = settings.block;
        pageInfo.pages["home"].default.elements[position.section - 1].elements[position.row - 1].elements[
          position.column - 1
        ].elements[position.block - 1].designs = settings.style.designs;
        await builder.updateSiteBuilder(conf.suiteConf.pre_condition.theme_id, pageInfo);
      });

      await test.step("Verify setting block in Storefront", async () => {
        await webBuilder.goto(sfUrl.href);
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: webBuilder.sectionsInPreview,
          snapshotName: settings.snapshot_change_style,
        });
      });
    }
  });

  test("Check các action với menu level 1 @SB_WEB_BUILDER_LB_BMN_4", async ({ conf }) => {
    const data = conf.caseConf;

    await test.step("Open settings tab in sidebar", async () => {
      const blockSelector = webBuilder.getSelectorByIndex(data.block_position);
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
    });

    await test.step("Add sub items level 2", async () => {
      const beforeCountSubItem = await webBuilder.menuItemInSideBarLoc(data.add_sub_items.item).count();
      for (let i = 0; i < data.add_sub_items.numbers; i++) {
        await webBuilder.selectActionWithItem(data.add_sub_items.item, "Add sub item");
        await webBuilder
          .genLoc(webBuilder.getSelectorMenu({ ...data.add_sub_items.item, subMenu: beforeCountSubItem + 1 }))
          .waitFor();
      }
      await expect(webBuilder.menuItemInSideBarLoc(data.add_sub_items.item)).toHaveCount(
        beforeCountSubItem + data.add_sub_items.numbers,
      );
    });

    await test.step("Remove items level 1", async () => {
      const beforeCountItem = await webBuilder.menuItemInSideBarLoc().count();
      for (let i = 0; i < beforeCountItem - 1; i++) {
        await webBuilder.selectActionWithItem({ menu: beforeCountItem - i }, "Remove item");
        await webBuilder
          .genLoc(webBuilder.getSelectorMenu({ menu: beforeCountItem - i }))
          .waitFor({ state: "detached" });
      }
      await expect(webBuilder.menuItemInSideBarLoc()).toHaveCount(1);
    });

    await test.step("Add new items level 1", async () => {
      const beforeCountItem = await webBuilder.menuItemInSideBarLoc().count();
      for (let i = 0; i < data.add_items.number; i++) {
        await webBuilder.genLoc(webBuilder.addMenuItem).click();
        await webBuilder.genLoc(webBuilder.getSelectorMenu({ menu: i + 1 })).waitFor();
      }
      await expect(webBuilder.menuItemInSideBarLoc()).toHaveCount(beforeCountItem + data.add_items.number);
    });
  });

  test("Check các action với menu level 2 @SB_WEB_BUILDER_LB_BMN_6", async ({ conf }) => {
    const data = conf.caseConf;

    await test.step("Open settings tab in sidebar", async () => {
      const blockSelector = webBuilder.getSelectorByIndex(data.block_position);
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
    });

    await test.step("Add sub items level 3", async () => {
      await webBuilder.collapseOrExpandMenuItem({ menu: data.add_sub_items.item.menu }, false);
      const beforeCountSubItem = await webBuilder.menuItemInSideBarLoc(data.add_sub_items.item).count();
      for (let i = 0; i < data.add_sub_items.numbers; i++) {
        await webBuilder.selectActionWithItem(data.add_sub_items.item, "Add sub item");
        await webBuilder
          .genLoc(webBuilder.getSelectorMenu({ ...data.add_sub_items.item, megaMenu: beforeCountSubItem + 1 }))
          .waitFor();
      }
      await expect(webBuilder.menuItemInSideBarLoc(data.add_sub_items.item)).toHaveCount(
        beforeCountSubItem + data.add_sub_items.numbers,
      );
    });

    await test.step("Remove items level 2", async () => {
      const beforeCountItem = await webBuilder.menuItemInSideBarLoc(data.remove_items.item).count();
      for (let i = 0; i < beforeCountItem; i++) {
        await webBuilder.selectActionWithItem({ menu: 1, subMenu: beforeCountItem - i }, "Remove item");
        await webBuilder
          .genLoc(webBuilder.getSelectorMenu({ menu: 1, subMenu: beforeCountItem - i }))
          .waitFor({ state: "detached" });
      }
      await expect(webBuilder.menuItemInSideBarLoc(data.remove_items.item)).toHaveCount(0);
    });
  });

  test("Check setting item menu level 1 khi click vào Item setting @SB_WEB_BUILDER_LB_BMN_5", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const data = conf.caseConf;
    let storefront: Page;

    await test.step("Open tab preview SF", async () => {
      storefront = await verifyRedirectUrl({
        page: webBuilder.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefront.close();
    });

    await test.step("Open settings tab in sidebar", async () => {
      const blockSelector = webBuilder.getSelectorByIndex(data.block);
      await webBuilder.frameLocator.locator(blockSelector).click();
    });

    for (const settings of data.settings) {
      const setupData = settings.settings;
      const expectData = settings.expect;
      const isMegaMenu = setupData.type === "Mega menu";

      await test.step("Change setting on widget menu", async () => {
        await webBuilder.switchToTab("Content");
        await webBuilder.selectActionWithItem(data.item, "Item setting");
        await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetMenu("Label"), setupData.label);
        await webBuilder.selectActionWithItem(data.item, "Item setting");
        await webBuilder.switchToggle(webBuilder.getSelectorInWidgetMenu("Show icon"), setupData.show_icon);
        await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetLink("Action"), setupData.action);
        if (setupData.target_url) {
          await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetLink("Target URL"), setupData.target_url);
          await webBuilder.selectActionWithItem(data.item, "Item setting");
        }
        if (setupData.page) {
          await webBuilder.selectAutoComplete(webBuilder.getSelectorInWidgetLink("Page"), setupData.page);
        }
        if (typeof setupData.phone !== "undefined") {
          await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetLink("Phone number"), setupData.phone);
          await webBuilder.selectActionWithItem(data.item, "Item setting");
        }
        if (setupData.email) {
          await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetLink("Email"), setupData.email);
          await webBuilder.selectActionWithItem(data.item, "Item setting");
        }

        if (typeof setupData.open_in_new_tab !== "undefined") {
          await webBuilder.switchToggle(
            webBuilder.getSelectorInWidgetLink("Open in new tab"),
            setupData.open_in_new_tab,
          );
        }
        await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Badge"), setupData.badge);
        if (typeof setupData.badge_label !== "undefined") {
          await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetMenu("Badge label"), setupData.badge_label);
          await webBuilder.selectActionWithItem(data.item, "Item setting");
        }
        await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Type"), setupData.type);
        if (typeof setupData.full_width !== "undefined") {
          await webBuilder.switchToTab("Design");
          await webBuilder.onChangeLayoutMenu({ full_width: setupData.full_width });
        }
      });

      await test.step("Verify preview", async () => {
        if (isMegaMenu) {
          await waitForImageLoaded(webBuilder.page, webBuilder.megaMenuVisible, webBuilder.iframe);
        }

        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.defaultLayoutSF,
          snapshotName: expectData.snapshot_preview,
          sizeCheck: true,
        });
      });

      await test.step("Save change", async () => {
        storefront = await webBuilder.clickSaveAndVerifyPreview({
          context,
          dashboard: webBuilder.page,
          savedMsg: "All changes are saved",
          snapshotName: "",
          isNextStep: true,
        });
      });

      await test.step("Verify setting on SF", async () => {
        const selectorMenuItem = webBuilder.getSelectorMenuItemOnSF(data.item);
        await storefront.locator(selectorMenuItem).hover();
        if (isMegaMenu) {
          await storefront.locator(webBuilder.megaMenuVisible).waitFor();
          await waitForImageLoaded(storefront, webBuilder.megaMenuVisible);
        } else {
          await storefront.locator(webBuilder.menuDropdownVisible).waitFor();
        }

        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          snapshotName: expectData.snapshot_sf,
        });
        if (expectData.href) {
          await expect(storefront.locator(`${selectorMenuItem}//a`)).toHaveAttribute("href", `${expectData.href}`);
        }
        if (expectData.redirect) {
          const currentPage = await verifyRedirectUrl({
            page: storefront,
            selector: selectorMenuItem,
            redirectUrl: expectData.redirect.target_url,
            context: expectData.redirect.new_tab ? context : null,
          });
          if (expectData.redirect.new_tab) {
            await currentPage.close();
          }
        }

        await storefront.close();
      });
    }
  });

  test(`Check các action với menu level 3 @SB_WEB_BUILDER_LB_BMN_7`, async ({ conf, snapshotFixture }) => {
    const data = conf.caseConf;

    await test.step(`Tại sidebar, hover vào 1 item (sub item 1) level 3`, async () => {
      const blockSelector = webBuilder.getSelectorByIndex(data.block_position);
      const selectorMenuItem = webBuilder.getSelectorMenuItem(data.menu_item);
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
      await webBuilder.collapseOrExpandMenuItem({ menu: 1 }, false);
      await webBuilder.collapseOrExpandMenuItem({ menu: 2 }, false);
      await webBuilder.genLoc(selectorMenuItem).hover();
      await expect(webBuilder.genLoc(`${selectorMenuItem}${webBuilder.getXpathCollapseIcon("expand")}`)).toBeHidden();
      await expect(webBuilder.getLocatorActionWithItem(data.menu_item, "Item setting")).toBeVisible();
      await expect(webBuilder.getLocatorActionWithItem(data.menu_item, "Remove item")).toBeVisible();
      await expect(webBuilder.genLoc(`${selectorMenuItem}${webBuilder.xpathDragInSidebar}`)).toBeVisible();
      await webBuilder.templateTitle.click();
    });

    for (let i = 0; i < data.dnd_mega_menus.length; i++) {
      const dndMegaMenu = data.dnd_mega_menus[i];
      await test.step(dndMegaMenu.step, async () => {
        await webBuilder.genLoc(webBuilder.getSelectorMenuItem(dndMegaMenu.dnd.from)).click({ delay: 200 });
        await webBuilder.dndMenuItemInSidebar(dndMegaMenu.dnd);
        await webBuilder.templateTitle.hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: webBuilder.getSelectorMenu({ menu: dndMegaMenu.dnd.to.menu, subMenu: dndMegaMenu.dnd.to.subMenu }),
          snapshotName: dndMegaMenu.expect.snapshot_content,
        });
        if (dndMegaMenu.expect.snapshot_storefront) {
          await snapshotFixture.verifyWithAutoRetry({
            page: webBuilder.page,
            iframe: webBuilder.iframe,
            selector: webBuilder.getSelectorMenuItemOnSF({
              menu: dndMegaMenu.dnd.to.menu,
              subMenu: dndMegaMenu.dnd.to.subMenu,
            }),
            snapshotName: dndMegaMenu.expect.snapshot_storefront,
          });
        }
      });
    }

    await test.step(`Click Remove tại tất cả các item level 3`, async () => {
      const totalMegaMenu = await webBuilder.menuItemInSideBarLoc(data.remove_megamenu.item).count();
      for (let i = 0; i < totalMegaMenu; i++) {
        const menuItemObj = { ...data.remove_megamenu.item, megaMenu: totalMegaMenu - i };
        await webBuilder.genLoc(webBuilder.getSelectorMenuItem(menuItemObj)).click({ delay: 200 });
        await webBuilder.selectActionWithItem(menuItemObj, "Remove item");
        await webBuilder.genLoc(webBuilder.getSelectorMenu(menuItemObj)).waitFor({ state: "detached" });
      }

      await expect(webBuilder.menuItemInSideBarLoc(data.remove_megamenu.item)).toHaveCount(0);
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.getSelectorMenuItemOnSF(data.remove_megamenu.item),
        snapshotName: data.remove_megamenu.expect_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BMN_14 Check việc hiển thị menu và submenu trên preview và SF`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    const storeFront = new SFBlocks(page, conf.suiteConf.domain);
    const previewUrl = await webBuilder.genLoc(webBuilder.previewWb).getAttribute("src");
    const url = new URL(previewUrl);
    url.searchParams.delete("preview");
    const hoverItem = conf.caseConf.hover_item;

    await test.step(`Precondition: Add block Menu vào page`, async () => {
      const allSection = await webBuilder.genLoc(webBuilder.sectionsInSidebar).all();
      for (let i = 0; i < allSection.length; i++) {
        await allSection[0].click();
        await webBuilder.removeBtn.click();
      }
      await webBuilder.frameLocator.locator(webBuilder.xpathAddSection).click({ delay: 200 });
      await webBuilder.page.getByTestId("section_default").click();
      await webBuilder.genLoc(`${webBuilder.layerDetailLoc} [data-id]`).waitFor();
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: "Basics",
        template: "Menu",
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_content);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Check hiển thị dấu mũi tên bên phải item level 1`, async () => {
      await storeFront.goto(url.href);
      await storeFront.page.waitForLoadState("networkidle");
      await expect(storeFront.genLoc(storeFront.xpathExpandIconOfItemMenu("ITEM 1"))).toBeVisible();
    });

    await test.step(`Hover vào item Menu 1`, async () => {
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_menu_1)).hover();
      await expect(storeFront.genLoc(storeFront.xpathSubLvOfItemMenu("sub-lv1"))).toHaveCSS("visibility", "visible");
    });

    await test.step(`Hover vào item Header 1`, async () => {
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_header_1)).hover();
      await expect(await storeFront.genLoc(storeFront.xpathSubLvOfItemMenu("sub-lv2")).getAttribute("class")).toContain(
        "show flex-column",
      );
    });

    await test.step(`Check hiển thị các item level 1 khi số lượng item > width của block`, async () => {
      await webBuilder.switchToTab("Design");
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_design_quantity_item_lv1);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await storeFront.page.reload();
      await storeFront.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: storeFront.page,
        selector: storeFront.blockmenu,
        snapshotName: conf.caseConf.expect.snapshot_sf_block_menu_with_width_block,
      });
    });

    await test.step(`Check hiển thị các sub menu ở dạng dropdown khi menu nằm bên trái màn hình`, async () => {
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_design_left_block_menu);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await storeFront.page.reload();
      await storeFront.page.waitForLoadState("networkidle");
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_menu_1)).hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: storeFront.page,
        selector: storeFront.mainSF,
        snapshotName: conf.caseConf.expect.snapshot_sf_setup_left_block_menu,
      });
    });

    await test.step(`Check hiển thị các sub menu ở dạng dropdown khi menu nằm bên phải màn hình`, async () => {
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_design_right_block_menu);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await storeFront.page.reload();
      await storeFront.page.waitForLoadState("networkidle");
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_menu_1)).hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: storeFront.page,
        selector: storeFront.mainSF,
        snapshotName: conf.caseConf.expect.snapshot_sf_setup_right_block_menu,
      });
    });

    await test.step(`Check hiển thị các sub menu ở dạng dropdown khi menu nằm phía dưới màn hình`, async () => {
      await webBuilder.clickBackLayer();
      const dragBtnSection = await webBuilder.getXpathDragBtnOfSection("Single column");
      const sidebarArea = await webBuilder.getSidebarArea("footer");
      await webBuilder.dragAndDropStepByStep(dragBtnSection, sidebarArea);
      await webBuilder.clickOnBtnWithLabel("Save");
      await storeFront.goto(url.href);
      await storeFront.page.waitForLoadState("networkidle");
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_menu_1, 1)).hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: storeFront.page,
        selector: storeFront.mainSF,
        snapshotName: conf.caseConf.expect.snapshot_sf_setup_bottom_block_menu,
      });
    });

    await test.step(`Check hiển thị các sub menu ở dạng mege menu khi height của submenu > height của screen`, async () => {
      await webBuilder.expandCollapseLayer(conf.caseConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_content_mega_menu);
      await webBuilder.clickBackLayer();
      const dragBtnSection = await webBuilder.getXpathDragBtnOfSection("Single column");
      const sidebarArea = await webBuilder.getSidebarArea("body");
      await webBuilder.dragAndDropStepByStep(dragBtnSection, sidebarArea);
      await webBuilder.clickOnBtnWithLabel("Save");
      await storeFront.goto(url.href);
      await storeFront.page.waitForLoadState("networkidle");
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_menu_1)).hover();
      await storeFront.genLoc(storeFront.xpathItemsMenu(hoverItem.item_header_1)).hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: storeFront.page,
        selector: storeFront.mainSF,
        snapshotName: conf.caseConf.expect.snapshot_sf_setup_mege_menu,
      });
    });
  });

  test(`Check hiển thị ảnh, name của product/ collection trên menu tại preview và SF @SB_WEB_BUILDER_LB_BMN_15`, async ({
    conf,
    snapshotFixture,
  }) => {
    const data = conf.caseConf;

    await test.step(`Product name dài hơn 2 dòng`, async () => {
      const allSection = await webBuilder.genLoc(webBuilder.sectionsInSidebar).all();
      for (let i = 0; i < allSection.length; i++) {
        await allSection[0].click();
        await webBuilder.removeBtn.click();
      }
      await webBuilder.frameLocator.locator(webBuilder.xpathAddSection).click({ delay: 200 });
      await webBuilder.page.getByTestId("section_default").click();
      await webBuilder.genLoc(`${webBuilder.layerDetailLoc} [data-id]`).waitFor();
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: "Basics",
        template: "Menu",
      });
      await webBuilder.switchToTab("Content");
      await webBuilder.genLoc(webBuilder.getSelectorMenuItem({ menu: data.item.menu })).click();
      await webBuilder.selectActionWithItem(data.item, "Item setting");
      await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Item type"), data.settings.type);
      await webBuilder.selectAutoComplete(webBuilder.getSelectorInWidgetMenu("Product"), data.settings.product);
      await waitForImageLoaded(webBuilder.page, webBuilder.megaMenuVisible, webBuilder.iframe);
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.frameLocator
          .locator(webBuilder.xpathListMenu)
          .first()
          .locator(webBuilder.xpathSubNestedMenu)
          .first(),
        snapshotName: data.expect.snapshot_sf_truncate,
      });
    });

    await test.step(`Ảnh của product/collection có width <=  width của 1 cột`, async () => {
      // Wait bug fixed
    });

    await test.step(`Ảnh của product/collection là ảnh chữ nhật`, async () => {
      // Wait bug fixed
    });
  });

  const confCasesMenuMobile = loadData(__dirname, "SETTING_CASE_16_17");
  for (let caseIndex = 0; caseIndex < confCasesMenuMobile.caseConf.data.length; caseIndex++) {
    const caseData = confCasesMenuMobile.caseConf.data[caseIndex];
    test(`${caseData.description} @${caseData.case_id}`, async ({ context, conf, snapshotFixture, pageMobile }) => {
      const data = conf.caseConf;
      const blockSelector = webBuilder.getSelectorByIndex({ section: 1, column: 1, block: 1 });
      const storeFront = new SFBlocks(pageMobile, conf.suiteConf.domain);
      const previewUrl = await webBuilder.genLoc(webBuilder.previewWb).getAttribute("src");
      const url = new URL(previewUrl);
      url.searchParams.delete("preview");

      await test.step(`Mở preview và SF của page trên mobile`, async () => {
        const allSection = await webBuilder.genLoc(webBuilder.sectionsInSidebar).all();
        for (let i = 0; i < allSection.length; i++) {
          await allSection[0].click();
          await webBuilder.removeBtn.click();
        }
        await webBuilder.frameLocator.locator(webBuilder.xpathAddSection).click({ delay: 200 });
        await webBuilder.page.getByTestId("section_default").click();
        await webBuilder.genLoc(`${webBuilder.layerDetailLoc} [data-id]`).waitFor();
        await webBuilder.insertSectionBlock({
          parentPosition: { section: 1, column: 1 },
          category: "Basics",
          template: "Menu",
        });
        await webBuilder.page.getByTestId("mobile").click();
        await webBuilder.switchToTab("Content");
        await webBuilder.genLoc(webBuilder.getSelectorMenuItem(data.item)).click();
        await webBuilder.selectActionWithItem(data.item, "Item setting");
        await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Type"), data.settings.type);
        await webBuilder.backBtn.click();
        await webBuilder.clickSaveAndVerifyPreview({
          context,
          dashboard: webBuilder.page,
          savedMsg: "All changes are saved",
          onlyClickSave: true,
        });
        await webBuilder.frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Content");
        await storeFront.goto(url.href);
        await storeFront.page.waitForLoadState("networkidle");
        await storeFront.menuIcon.waitFor();
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: webBuilder.sectionsInPreview,
          snapshotName: data.expect.snapshot_sf_hamburger,
        });
      });

      await test.step(`Click vào dấu 3 gạch`, async () => {
        await storeFront.menuIcon.click();
        await storeFront.menuPopover.waitFor();
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: storeFront.mainSF,
          snapshotName: data.expect.snapshot_sf_menu_expand,
        });
      });

      await test.step(`Click vào item Menu 1 (có submenu)`, async () => {
        await storeFront.menuExpandIcon.first().click();
        await storeFront.waitForXpathState(storeFront.menuContent, "stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: storeFront.mainSF,
          snapshotName: data.expect.snapshot_sf_menu_expand_lv2,
        });
      });

      await test.step(`Click vào item Header 1 (có submenu level 3)`, async () => {
        await storeFront.menuExpandIcon.first().click();
        await storeFront.waitForXpathState(storeFront.menuContent, "stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: storeFront.mainSF,
          snapshotName: data.expect.snapshot_sf_menu_expand_lv3,
        });
      });

      await test.step(`Click vào tên item level 2 ở trên đầu list (item Header 1)`, async () => {
        await storeFront.menuBackParent.click();
        await storeFront.waitForXpathState(storeFront.menuContent, "stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: storeFront.mainSF,
          snapshotName: data.expect.snapshot_sf_menu_expand_lv2,
        });
      });

      await test.step(`Click vào tên item level 1 ở trên đầu list (item Menu 1)`, async () => {
        await storeFront.menuBackParent.click();
        await storeFront.waitForXpathState(storeFront.menuContent, "stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: storeFront.mainSF,
          snapshotName: data.expect.snapshot_sf_menu_expand,
        });
      });

      await test.step(`Click close item trên drawer`, async () => {
        // eslint-disable-next-line
        await storeFront.menuIcon.click({ force: true });
        await storeFront.menuPopover.waitFor({ state: "detached" });
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: webBuilder.sectionsInPreview,
          snapshotName: data.expect.snapshot_sf_hamburger,
        });
      });

      await test.step(`Check settings layout`, async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.onChangeLayoutMenu({ layout: "text", direction: data.settings.direction });
        await webBuilder.editSliderBar("spacing", { fill: true, number: data.settings.spacing });
        await webBuilder.titleBar.click({ delay: 200 });
        await webBuilder.clickSaveAndVerifyPreview({
          context,
          dashboard: webBuilder.page,
          savedMsg: "All changes are saved",
          onlyClickSave: true,
        });
        await storeFront.goto(url.href);
        await storeFront.page.waitForLoadState("networkidle");
        await storeFront.menuExpandIcon.first().click();
        await snapshotFixture.verifyWithAutoRetry({
          page: storeFront.page,
          selector: storeFront.mainSF,
          combineOptions: { maxDiffPixelRatio: 0.002 },
          snapshotName: data.expect.snapshot_sf_menu_vertical_spacing,
        });
      });
    });
  }

  const confSettingItem = loadData(__dirname, "SETTING_LEVEL_2_3");
  for (let caseIndex = 0; caseIndex < confSettingItem.caseConf.data.length; caseIndex++) {
    const caseData = confSettingItem.caseConf.data[caseIndex];
    test(`${caseData.description} @${caseData.case_id}`, async ({ context, conf, snapshotFixture }) => {
      const data = conf.caseConf;
      let storefront: Page;

      await test.step("Open tab preview SF", async () => {
        storefront = await verifyRedirectUrl({
          page: webBuilder.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await storefront.close();
      });

      await test.step("Open settings tab in sidebar", async () => {
        const blockSelector = webBuilder.getSelectorByIndex(data.block);
        await webBuilder.frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Content");
        await webBuilder.collapseOrExpandMenuItem({ menu: data.item.menu }, false);
        if (data.item.megaMenu) {
          await webBuilder.selectActionWithItem({ menu: data.item.menu, subMenu: data.item.subMenu }, "Add sub item");
        }
      });

      for (const settings of data.settings) {
        const setupData = settings.settings;
        const expectData = settings.expect;

        await test.step("Change setting item level 2", async () => {
          await webBuilder.selectActionWithItem(data.item, "Item setting");
          if (setupData.item_type) {
            await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Item type"), setupData.item_type);
          }
          if (typeof setupData.label !== "undefined") {
            await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetMenu("Label"), setupData.label);
            await webBuilder.selectActionWithItem(data.item, "Item setting");
          }
          if (typeof setupData.show_icon !== "undefined") {
            await webBuilder.switchToggle(webBuilder.getSelectorInWidgetMenu("Show icon"), setupData.show_icon);
          }
          if (typeof setupData.display_title !== "undefined") {
            await webBuilder.switchToggle(
              webBuilder.getSelectorInWidgetMenu("Display as title"),
              setupData.display_title,
            );
          }
          if (setupData.collection) {
            await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Collection"), setupData.collection);
          }

          if (setupData.product) {
            await webBuilder.selectAutoComplete(webBuilder.getSelectorInWidgetMenu("Product"), setupData.product);
          }
          if (setupData.image) {
            await webBuilder.uploadImage(webBuilder.getSelectorInWidgetMenu("Image"), setupData.image);
          }
          if (typeof setupData.swap !== "undefined") {
            await webBuilder.switchToggle(webBuilder.getSelectorInWidgetMenu("Swap"), setupData.swap);
          }
          if (setupData.image_swap) {
            await webBuilder.uploadImage(webBuilder.getSelectorInWidgetMenu("Image swap"), setupData.image_swap);
          }
          if (setupData.layout) {
            await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Layout"), setupData.layout);
          }
          if (setupData.action) {
            await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetLink("Action"), setupData.action);
          }
          if (typeof setupData.target_url !== "undefined") {
            await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetLink("Target URL"), setupData.target_url);
            await webBuilder.selectActionWithItem(data.item, "Item setting");
          }
          if (setupData.page) {
            await webBuilder.selectAutoComplete(webBuilder.getSelectorInWidgetLink("Page"), setupData.page);
          }
          if (typeof setupData.phone !== "undefined") {
            await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetLink("Phone number"), setupData.phone);
            await webBuilder.selectActionWithItem(data.item, "Item setting");
          }
          if (typeof setupData.email !== "undefined") {
            await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetLink("Email"), setupData.email);
            await webBuilder.selectActionWithItem(data.item, "Item setting");
          }
          if (typeof setupData.open_in_new_tab !== "undefined") {
            await webBuilder.switchToggle(
              webBuilder.getSelectorInWidgetLink("Open in new tab"),
              setupData.open_in_new_tab,
            );
          }
          if (typeof setupData.open_new_tab !== "undefined") {
            await webBuilder.switchToggle(webBuilder.getSelectorInWidgetMenu("Open new tab"), setupData.open_new_tab);
          }
          if (setupData.badge) {
            await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Badge"), setupData.badge);
          }
          if (typeof setupData.badge_label !== "undefined") {
            await webBuilder.inputTextBox(webBuilder.getSelectorInWidgetMenu("Badge label"), setupData.badge_label);
            await webBuilder.selectActionWithItem(data.item, "Item setting");
          }
        });

        await test.step("Verify preview", async () => {
          await waitForImageLoaded(webBuilder.page, webBuilder.megaMenuVisible, webBuilder.iframe);
          await snapshotFixture.verifyWithAutoRetry({
            page: webBuilder.page,
            iframe: webBuilder.iframe,
            selector: webBuilder.defaultLayoutSF,
            snapshotName: expectData.snapshot_preview,
            sizeCheck: true,
          });
        });

        await test.step("Save change", async () => {
          storefront = await webBuilder.clickSaveAndVerifyPreview({
            context,
            dashboard: webBuilder.page,
            savedMsg: "All changes are saved",
            snapshotName: "",
            isNextStep: true,
          });
        });

        await test.step("Verify setting on SF", async () => {
          await storefront.locator(webBuilder.getSelectorMenuItemOnSF({ menu: data.item.menu })).hover();
          await storefront.locator(webBuilder.megaMenuVisible).waitFor();
          if (data.item.megaMenu) {
            await storefront
              .locator(webBuilder.getSelectorMenuItemOnSF({ menu: data.item.menu, subMenu: data.item.subMenu }))
              .hover();
          }

          await waitForImageLoaded(storefront, webBuilder.megaMenuVisible);
          await snapshotFixture.verifyWithAutoRetry({
            page: storefront,
            snapshotName: expectData.snapshot_sf,
          });

          if (expectData.redirect) {
            const currentPage = await verifyRedirectUrl({
              page: storefront,
              selector: `${webBuilder.getSelectorMenuItemOnSF(data.item)}${
                expectData.redirect.target_url ? "//a" : ""
              }`,
              redirectUrl: expectData.redirect.target_url,
              context: expectData.redirect.new_tab ? context : null,
            });

            if (expectData.redirect.new_tab) {
              await currentPage.close();
            }
          }

          await storefront.close();
        });
      }
    });
  }

  test(`Check widget layout của block Menu @SB_WEB_BUILDER_LB_BMN_24`, async ({ conf, snapshotFixture }) => {
    const data = conf.caseConf;
    const blockSelector = webBuilder.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step(`Kéo hoặc add block menu vào`, async () => {
      const allSection = await webBuilder.genLoc(webBuilder.sectionsInSidebar).all();
      for (let i = 0; i < allSection.length; i++) {
        await allSection[0].click();
        await webBuilder.removeBtn.click();
      }
      await webBuilder.frameLocator.locator(webBuilder.xpathAddSection).click({ delay: 200 });
      await webBuilder.page.getByTestId("section_default").click();
      await webBuilder.genLoc(`${webBuilder.layerDetailLoc} [data-id]`).waitFor();
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: "Basics",
        template: "Menu",
      });
      await webBuilder.switchToTab("Design");
      await expect(webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu)).toHaveText(data.expect.default_layout);
    });

    await test.step(`Click vào button layout`, async () => {
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click();
      await expect(webBuilder.genLoc(webBuilder.getXpathLayoutMenuAction("text", true))).toBeVisible();
      await expect(webBuilder.genLoc(webBuilder.xpathDirectionMenu)).toHaveText(data.expect.default_direction);
      await expect(webBuilder.genLoc(webBuilder.xpathFullWidthMenu)).toHaveClass(
        new RegExp(data.expect.default_fullwidth),
      );
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click();
      await expect(webBuilder.genLoc(webBuilder.xpathInputSlideBar("spacing"))).toHaveValue(
        data.expect.default_spacing,
      );
      await webBuilder.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.xpathAttrsDataBlock,
        snapshotName: data.expect.snapshot_sf_default_layout,
      });
    });

    await test.step(`Edit settings layout`, async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
      await webBuilder.genLoc(webBuilder.getSelectorMenuItem(data.item)).click();
      await webBuilder.selectActionWithItem(data.item, "Item setting");
      await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Type"), data.settings.type_dropdown);
      await webBuilder.genLoc(webBuilder.getSelectorMenuItem(data.item)).click();
      await webBuilder.selectActionWithItem({ ...data.item, subMenu: 1 }, "Item setting");
      await webBuilder.switchToTab("Design");
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click();
      await webBuilder.selectDropDown(webBuilder.xpathSettingMenu, data.settings.direction_vertical);
      await expect(webBuilder.genLoc(webBuilder.xpathFullWidthMenu)).toBeHidden();
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.storefrontMain,
        snapshotName: data.expect.snapshot_sf_dropdown_vertical,
      });
    });

    await test.step(`Edit settings layout`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.genLoc(webBuilder.getSelectorMenuItem(data.item)).click();
      await webBuilder.selectActionWithItem(data.item, "Item setting");
      await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Type"), data.settings.type_mega);
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.storefrontMain,
        snapshotName: data.expect.snapshot_sf_mega_vertical,
      });
    });

    await test.step(`Edit settings layout`, async () => {
      await webBuilder.switchToTab("Design");
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click();
      await webBuilder.selectDropDown(webBuilder.xpathSettingMenu, data.settings.direction_horizontal);
      await webBuilder.switchToggle(webBuilder.genLoc(webBuilder.xpathSettingMenu), false);
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click();
      await webBuilder.editSliderBar("spacing", { fill: true, number: 16 });
      await webBuilder.titleBar.click({ delay: 200 });
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.storefrontMain,
        snapshotName: data.expect.snapshot_sf_mega_horizontal,
      });
    });

    await test.step(`Edit settings layout`, async () => {
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click();
      await webBuilder.genLoc(webBuilder.getXpathLayoutMenuAction("hamburger")).click();
      await webBuilder.genLoc(webBuilder.xpathWidgetLayoutMenu).click({ delay: 200 });
      await expect(
        webBuilder.frameLocator.locator(`${webBuilder.xpathAttrsDataBlock} .menu__material-icon`),
      ).toBeVisible();
    });
  });

  const confSettingCasesGroup = loadData(__dirname, "SETTING_CASE_27_28");
  for (let caseIndex = 0; caseIndex < confSettingCasesGroup.caseConf.data.length; caseIndex++) {
    const caseData = confSettingCasesGroup.caseConf.data[caseIndex];
    test(`${caseData.description} @${caseData.case_id}`, async ({ conf, snapshotFixture }) => {
      const data = conf.caseConf;
      const blockSelector = webBuilder.getSelectorByIndex({ section: 1, column: 1, block: 1 });
      const menuAttrsIndexOne = webBuilder.getSelectorMenu(data.item);
      const menuLevel1 = webBuilder.genLoc(webBuilder.getSelectorMenuItem(data.item));
      const objMenuLevel2 = { ...data.item, subMenu: 1 };
      const menuLevel2 = webBuilder.genLoc(webBuilder.getSelectorMenuItem(objMenuLevel2));
      const menuAttrsIndexTwo = webBuilder.getSelectorMenu(objMenuLevel2);
      const menuItem2Level1 = webBuilder.genLoc(webBuilder.getSelectorMenuItem({ menu: 2 }));
      const menuItem3Level1 = webBuilder.genLoc(webBuilder.getSelectorMenuItem({ menu: 3 }));

      await test.step(`Click vào Menu 1 trên preview`, async () => {
        const allSection = await webBuilder.genLoc(webBuilder.sectionsInSidebar).all();
        for (let i = 0; i < allSection.length; i++) {
          await allSection[0].click();
          await webBuilder.removeBtn.click();
        }
        await webBuilder.frameLocator.locator(webBuilder.xpathAddSection).click({ delay: 200 });
        await webBuilder.page.getByTestId("section_default").click();
        await webBuilder.genLoc(`${webBuilder.layerDetailLoc} [data-id]`).waitFor();
        await webBuilder.insertSectionBlock({
          parentPosition: { section: 1, column: 1 },
          category: "Basics",
          template: "Menu",
        });
        await webBuilder.switchToTab("Content");
        await menuLevel1.click();
        await webBuilder.selectActionWithItem(data.item, "Item setting");
        await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Type"), data.settings.type);
        await webBuilder.backBtn.click();
        await webBuilder.frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Content");
      });

      for (let i = 0; i < data.actions.length; i++) {
        const action = data.actions[i];
        await test.step(action.step, async () => {
          await webBuilder.genLoc(webBuilder.getSelectorMenuItem(action.item)).click();
          await webBuilder.titleBar.hover();
          await snapshotFixture.verifyWithAutoRetry({
            page: webBuilder.page,
            selector: webBuilder.getSelectorMenu({ menu: action.item.menu }),
            snapshotName: action.expect.snapshot_wb,
          });
          await snapshotFixture.verifyWithAutoRetry({
            page: webBuilder.page,
            iframe: webBuilder.iframe,
            selector: webBuilder.storefrontMain,
            snapshotName: action.expect.snapshot_sf,
          });
        });
      }

      await test.step(`Đóng hết tất cả menu trên sidebar và preview`, async () => {
        await webBuilder.backBtn.click();
        await webBuilder.frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Content");
        await webBuilder.collapseOrExpandMenuItem(data.item, true);
      });

      await test.step(`Tại sidebar, hover vào Item 1`, async () => {
        await menuLevel1.hover();
        await expect(menuLevel1.locator(webBuilder.iconSelector).first()).toBeVisible();
        await expect(webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first()).toHaveClass(
          new RegExp("selected"),
        );
        await expect(webBuilder.genLoc(menuAttrsIndexOne).locator(webBuilder.xpathSubMenuSidebar).first()).toBeHidden();
        await expect(
          webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first().locator(webBuilder.xpathSubMenu).first(),
        ).toBeHidden();
      });

      await test.step(`Tại sidebar, expand Item 1 bằng cách click vào icon expand`, async () => {
        await webBuilder.collapseOrExpandMenuItem(data.item, false);
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: menuAttrsIndexOne,
          snapshotName: data.expect.snapshot_wb_expand_lv1,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.sectionsInPreview,
          snapshotName: data.expect.snapshot_sf_expand_lv1,
        });
      });

      await test.step(`Tại sidebar, expand Item 1 bằng cách click vào icon expand. sau đó hover vào Sub item 1`, async () => {
        await menuLevel2.hover();
        await expect(
          webBuilder.genLoc(webBuilder.getSelectorMenuItem(objMenuLevel2)).locator(webBuilder.iconSelector).first(),
        ).toBeVisible();
        await expect(
          webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first().locator(webBuilder.xpathSelectedMenu),
        ).toBeHidden();
        await expect(
          webBuilder.genLoc(menuAttrsIndexOne).locator(webBuilder.xpathSubMenuSidebar).first(),
        ).toBeVisible();
        await expect(
          webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first().locator(webBuilder.xpathSubMenu).first(),
        ).toBeHidden();
      });

      await test.step(`Tại sidebar, select Sub item 1`, async () => {
        await menuLevel2.click();
        await webBuilder.titleBar.hover();
        await expect(menuLevel2).toHaveClass(new RegExp("active-item"));
        await expect(
          webBuilder.genLoc(menuAttrsIndexTwo).locator(webBuilder.xpathSubMenuSidebar).first(),
        ).toBeVisible();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.storefrontMain,
          snapshotName: data.expect.snapshot_sf_click_lv2,
        });
      });

      await test.step(`Tại sidebar, collapse Item 1 bằng cách click vào icon collapse`, async () => {
        await webBuilder.collapseOrExpandMenuItem(data.item, true);
        await webBuilder.titleBar.hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: webBuilder.xpathWidgetMenu,
          snapshotName: data.expect.snapshot_wb_collase_lv1,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.storefrontMain,
          snapshotName: data.expect.snapshot_sf_click_lv2,
        });
      });

      await test.step(`Tại sidebar, select Item 3 sau đó hover vào Item 1`, async () => {
        await menuItem2Level1.click();
        await menuLevel1.hover();
        await expect(menuLevel1.locator(webBuilder.iconSelector).first()).toBeVisible();
        await expect(webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first()).toHaveClass(
          new RegExp("selected"),
        );
        await expect(webBuilder.genLoc(menuAttrsIndexOne).locator(webBuilder.xpathSubMenuSidebar).first()).toBeHidden();
        await expect(menuItem2Level1).toHaveClass(new RegExp("active-item"));
        await expect(
          webBuilder.genLoc(webBuilder.getSelectorMenu(data.item)).locator(webBuilder.xpathSubMenuSidebar).first(),
        ).toBeHidden();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.storefrontMain,
          snapshotName: data.expect.snapshot_sf_click_menu2_lv1,
        });
      });

      await test.step(`Tại sidebar, select Item 3 sau đó click expand Item 1 và hover vào Sub item 1`, async () => {
        await webBuilder.collapseOrExpandMenuItem(data.item, false);
        await menuLevel2.hover();
        await expect(
          webBuilder.genLoc(webBuilder.getSelectorMenuItem(objMenuLevel2)).locator(webBuilder.iconSelector).first(),
        ).toBeVisible();
        await expect(
          webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first().locator(webBuilder.xpathSelectedMenu),
        ).toBeHidden();
        await expect(
          webBuilder.genLoc(menuAttrsIndexOne).locator(webBuilder.xpathSubMenuSidebar).first(),
        ).toBeVisible();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.storefrontMain,
          snapshotName: data.expect.snapshot_sf_click_menu2_lv1,
        });
      });

      await test.step(`Tại sidebar, select Sub item 1 và add sub item cho Item 2`, async () => {
        await menuLevel2.click();
        const totalMegaItem = await webBuilder.menuItemInSideBarLoc(objMenuLevel2).count();
        await webBuilder.selectActionWithItem(objMenuLevel2, "Add sub item");
        await webBuilder
          .genLoc(webBuilder.getSelectorMenu({ ...data.item, subMenu: 1, megaMenu: totalMegaItem + 1 }))
          .waitFor();
        await webBuilder.titleBar.hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: menuAttrsIndexOne,
          snapshotName: data.expect.snapshot_wb_add_mega,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.storefrontMain,
          snapshotName: data.expect.snapshot_sf_add_mega,
        });
      });

      await test.step(`Tại sidebar, select Sub item 1 và select Settings item tại Sub item 4`, async () => {
        await webBuilder.selectActionWithItem({ menu: 3 }, "Item setting");
        await expect(menuItem3Level1).toHaveClass(new RegExp("active-item"));
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.sectionsInPreview,
          snapshotName: data.expect.snapshot_sf_setting_menu3,
        });
      });

      await test.step(`Tại sidebar, select Sub item 1 và select Remove Sub item 1`, async () => {
        await menuLevel2.click();
        await webBuilder.selectActionWithItem(objMenuLevel2, "Remove item");
        await webBuilder.titleBar.hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: menuAttrsIndexOne,
          snapshotName: data.expect.snapshot_wb_remove_lv2,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          iframe: webBuilder.iframe,
          selector: webBuilder.storefrontMain,
          snapshotName: data.expect.snapshot_sf_remove_lv2,
        });
      });
    });
  }

  const confSettingCases = loadData(__dirname, "SETTING_CASE_29_30");
  for (let caseIndex = 0; caseIndex < confSettingCases.caseConf.data.length; caseIndex++) {
    const caseData = confSettingCases.caseConf.data[caseIndex];
    test(`${caseData.description} @${caseData.case_id}`, async ({ conf, snapshotFixture }) => {
      const data = conf.caseConf;
      const blockSelector = webBuilder.getSelectorByIndex({ section: 1, column: 1, block: 1 });

      await test.step(`Mở Content tab`, async () => {
        const allSection = await webBuilder.genLoc(webBuilder.sectionsInSidebar).all();
        for (let i = 0; i < allSection.length; i++) {
          await allSection[0].click();
          await webBuilder.removeBtn.click();
        }
        await webBuilder.frameLocator.locator(webBuilder.xpathAddSection).click({ delay: 200 });
        await webBuilder.page.getByTestId("section_default").click();
        await webBuilder.genLoc(`${webBuilder.layerDetailLoc} [data-id]`).waitFor();
        await webBuilder.insertSectionBlock({
          parentPosition: { section: 1, column: 1 },
          category: "Basics",
          template: "Menu",
        });
        await webBuilder.switchToTab("Content");
        await webBuilder.genLoc(webBuilder.getSelectorMenuItem(data.item)).click();
        await webBuilder.selectActionWithItem(data.item, "Item setting");
        await webBuilder.selectDropDown(webBuilder.getSelectorInWidgetMenu("Type"), data.settings.type);
        await webBuilder.backBtn.click();
        await webBuilder.frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Content");
      });

      await test.step(`Trên preview, hover vào Item 1`, async () => {
        await webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first().hover();
        await expect(
          webBuilder.genLoc(webBuilder.getSelectorMenu(data.item)).locator(`> ${webBuilder.xpathHighLightMenu}`),
        ).toBeVisible();
        await expect(webBuilder.frameLocator.locator(webBuilder.xpathListMenu).first()).toHaveClass(
          new RegExp("selected"),
        );
      });

      for (let i = 0; i < data.actions.length; i++) {
        const action = data.actions[i];
        if (action.level === 1) {
          await test.step(action.step, async () => {
            await webBuilder.frameLocator.locator(`${webBuilder.xpathListMenu} [aria-haspopup="menu"]`).first().click();
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              selector: webBuilder.getSelectorMenu(data.item),
              snapshotName: action.expect.snapshot_wb,
            });
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              iframe: webBuilder.iframe,
              selector: webBuilder.storefrontMain,
              snapshotName: action.expect.snapshot_sf,
            });
          });
        }

        if (action.level === 2) {
          await test.step(action.step, async () => {
            await webBuilder.frameLocator
              .locator(webBuilder.xpathListMenu)
              .first()
              .locator(`${webBuilder.xpathSubMenu} [aria-haspopup="menu"]`)
              .first()
              .click();
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              selector: webBuilder.getSelectorMenu(data.item),
              snapshotName: action.expect.snapshot_wb,
            });
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              iframe: webBuilder.iframe,
              selector: webBuilder.storefrontMain,
              snapshotName: action.expect.snapshot_sf,
            });
          });
        }

        if (action.level === 3) {
          await test.step(action.step, async () => {
            await webBuilder.frameLocator
              .locator(webBuilder.xpathListMenu)
              .first()
              .locator(`${webBuilder.xpathSubNestedMenu} [aria-haspopup="menu"]`)
              .first()
              .click();
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              selector: webBuilder.getSelectorMenu(data.item),
              snapshotName: action.expect.snapshot_wb,
            });
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              iframe: webBuilder.iframe,
              selector: webBuilder.storefrontMain,
              snapshotName: action.expect.snapshot_sf,
            });
          });
        }
      }
    });
  }
});
