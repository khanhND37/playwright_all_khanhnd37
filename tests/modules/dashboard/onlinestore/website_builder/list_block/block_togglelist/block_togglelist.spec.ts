import { test, expect } from "@fixtures/website_builder";
import { verifyCountSelector, verifyRedirectUrl } from "@utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { XpathNavigationButtons } from "@constants/web_builder";
import { PageSettingsData } from "@types";

let block,
  blockSelector,
  sectionSetting,
  settingsBlock,
  themeSetting: number,
  webBuilder: WebBuilder,
  xpathBlock: Blocks,
  settingsData: PageSettingsData,
  frameLocator,
  storefront;

test.describe("Check module block Togglelist @SB_WEB_BUILDER_LB_BA", () => {
  test.beforeEach(async ({ dashboard, conf, builder }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    themeSetting = conf.suiteConf.themes_setting;
    sectionSetting = conf.suiteConf.dnd_block;

    await test.step(`get data setting web`, async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.themes_setting);
      settingsData = response.settings_data as PageSettingsData;
    });

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step("Add block toggle list for section", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Toggle list",
      });
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });
  });

  test.afterEach(async ({ conf, builder }) => {
    await builder.updateSiteBuilder(conf.suiteConf.themes_setting, settingsData);
  });

  test("Check data default when add block toggle list @SB_WEB_BUILDER_LB_BA_1", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    sectionSetting = conf.caseConf.data.section_1;
    frameLocator = xpathBlock.frameLocator;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

    await test.step("Verify block toggle list in sidebar + preview", async () => {
      await webBuilder.switchToTab("Content");
      const dataSetting = await webBuilder.getDesignAndContentWithSDK();
      expect(dataSetting).toEqual(conf.caseConf.data_setting);
    });

    await test.step("Save > click preview, verify block toggle list on SF", async () => {
      // Verify SF preview
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(webBuilder.xpathButtonPreview),
      ]);
      await sfTab.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTab,
        selector: xpathBlock.xpathBlockToggleList,
        snapshotName: conf.caseConf.expect.preview,
      });
    });
  });

  test("Check setting expand toggle list @SB_WEB_BUILDER_LB_BA_2", async ({ dashboard, conf, context }) => {
    sectionSetting = conf.caseConf.data.section_1;
    frameLocator = xpathBlock.frameLocator;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });
    let isShow;

    await test.step("Verify default expand toggle list", async () => {
      blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });
      await frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
      const dataSetting = await webBuilder.getDesignAndContentWithSDK();
      expect(dataSetting).toMatchObject(conf.caseConf.default_expand);
    });

    for (const settingBlock of sectionSetting.dnd_blocks) {
      await test.step("Save and reload web builder", async () => {
        await webBuilder.settingDesignAndContentWithSDK(settingBlock.setting_expand);
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        isShow = settingBlock.setting_expand.default_expand
          ? "height: auto; visibility: visible;"
          : "height: 0px; visibility: hidden;";
        await expect(
          frameLocator.locator(xpathBlock.getXpathToggleList({ option: "paragraph", indexSection: 1 })),
        ).toHaveAttribute("style", isShow);
      });

      await test.step("Verify block toggle list in SF", async () => {
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        const iconExpand = sfTab.locator(xpathBlock.xpathIconExpand);
        const listIconExpand = await iconExpand.evaluateAll(list => list.map(element => element.textContent.trim()));
        const checkIconExpand = listIconExpand.every(element => element === settingBlock.expect_icon_expand);
        expect(checkIconExpand).toEqual(true);
      });
    }
  });

  test("Check add item toggle list @SB_WEB_BUILDER_LB_BA_3", async ({ dashboard, conf, context }) => {
    sectionSetting = conf.caseConf.data.section_1;
    const dataSetting = conf.caseConf.data_setting;
    frameLocator = xpathBlock.frameLocator;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

    for (const data of dataSetting) {
      await test.step("Verify add item in sidebar", async () => {
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(data);
        if (data.accordions.length === conf.caseConf.quantity_item_toggle.max_item) {
          await expect(webBuilder.genLoc(xpathBlock.xpathBtnAddItemToggle)).toBeDisabled();
        } else {
          await expect(webBuilder.genLoc(xpathBlock.xpathBtnAddItemToggle)).toBeEnabled();
        }
      });

      await test.step("Verify count item toggle list in preview", async () => {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        await expect(sfTab.locator(xpathBlock.getXpathItem(1))).toHaveCount(data.accordions.length);
      });
    }
  });

  test("Check edit item and drag drop item in toggle list @SB_WEB_BUILDER_LB_BA_4", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    sectionSetting = conf.caseConf.data.section_1;
    frameLocator = xpathBlock.frameLocator;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

    await test.step("Edit content item in sidebar", async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.inputTextBulletToggleList(sectionSetting.setting_items);
    });
    await webBuilder.dndItemInSidebar({
      from: { sectionName: "Item", sectionIndex: sectionSetting.dnd.from },
      to: { sectionName: "Item", sectionIndex: sectionSetting.dnd.to },
    });
    await test.step("Save > click preview, verify block toggle list on SF", async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      // Verify SF preview
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(webBuilder.xpathButtonPreview),
      ]);
      await sfTab.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTab,
        selector: xpathBlock.xpathBlockToggleList,
        snapshotName: conf.caseConf.expect.preview,
      });
    });
  });

  test("Check delete item toggle list @SB_WEB_BUILDER_LB_BA_5", async ({ dashboard, conf, context }) => {
    sectionSetting = conf.caseConf.data.section_1;
    frameLocator = xpathBlock.frameLocator;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

    const initItemToggleList = await webBuilder.frameLocator.locator(xpathBlock.getXpathItem(1)).count();
    for (const settingBlock of sectionSetting.dnd_blocks) {
      await test.step("Verify delete item in sidebar", async () => {
        await webBuilder.switchToTab("Content");
        await dashboard.locator(xpathBlock.iconDeleteItem).click();
        await webBuilder.waitForXpathState("[label='Item']", "stable");
        await expect(webBuilder.frameLocator.locator(xpathBlock.getXpathItem(1))).toHaveCount(
          initItemToggleList - settingBlock.delete_item,
        );
      });

      await test.step("Save > Verify block toggle list in preview", async () => {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");

        await expect(sfTab.locator(xpathBlock.getXpathItem(1))).toHaveCount(
          initItemToggleList - settingBlock.delete_item,
        );
      });
    }
  });

  test("Check setting width, height block toggle list @SB_WEB_BUILDER_LB_BA_7", async ({
    dashboard,
    conf,
    context,
  }) => {
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block });

    block = 0;
    for (const settingBlock of settingsBlock) {
      block++;
      await test.step("Setting style toggle list in sidebar ", async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.settingWidthHeight("width", settingBlock.data_setting.width);
        await webBuilder.settingWidthHeight("height", settingBlock.data_setting.height);
      });

      await test.step("Verify toggle list setting in preview", async () => {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");

        const idBlockToggle = await sfTab.locator(xpathBlock.xpathBlockToggleList).getAttribute("block-id");
        const widthValue = await xpathBlock.getWidthHeightBlock(sfTab, idBlockToggle, "width");
        const heightValue = await xpathBlock.getWidthHeightBlock(sfTab, idBlockToggle, "height");
        await expect(widthValue).toEqual(settingBlock.expect_data.width);
        await expect(heightValue).toEqual(settingBlock.expect_data.height);
        await sfTab.close();
      });
    }
  });

  test("Check setting icon color, border, opacity, shadow, background, radius, padding, margin block toggle list @SB_WEB_BUILDER_LB_BA_8", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    blockSelector = webBuilder.getSelectorByIndex({ section: 1, block });

    await test.step("Add section and add block toggle list for section", async () => {
      await xpathBlock.clickBackLayer();
      await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_block);
    });

    await test.step("Setting style toggle list in sidebar ", async () => {
      const blockSetting = conf.caseConf.data.section_1.settings_block;
      await webBuilder.switchToTab("Design");
      await webBuilder.color(blockSetting.color, "icon_color");
      await webBuilder.selectAlign("align_self", blockSetting.align);
      await webBuilder.settingWidthHeight("width", blockSetting.width);
      await webBuilder.settingWidthHeight("height", blockSetting.height);
      await webBuilder.setBackground("background", blockSetting.background);
      await webBuilder.setBorder("border", blockSetting.border);
      await webBuilder.editSliderBar("opacity", blockSetting.opacity);
      await webBuilder.editSliderBar("border_radius", blockSetting.radius);
      await webBuilder.setShadow("box_shadow", blockSetting.shadow);
      await webBuilder.setMarginPadding("padding", blockSetting.padding);
      await webBuilder.setMarginPadding("margin", blockSetting.margin);
    });

    await test.step("Verify toggle list setting in webfront", async () => {
      await webBuilder.setAttribute({ selector: "//aside", attributeName: "style", attributeValue: "display: none;" });
      const size = await webBuilder.getElementSize("body", "#preview");
      await dashboard.setViewportSize({ height: size.height + 100, width: size.width });
      expect(await frameLocator.locator("html").screenshot()).toMatchSnapshot(conf.caseConf.expect.preview);
    });

    await test.step("Save > click preview, verify block toggle list on SF", async () => {
      await webBuilder.clickSave();
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });

      const SFUrl = storefront.url();
      await storefront.goto(SFUrl);
      await storefront.waitForLoadState("networkidle");
      await test.step("Verify image setting on SF", async () => {
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: xpathBlock.xpathBlockToggleList,
          snapshotName: conf.caseConf.expect.storefront,
        });
      });
    });
  });

  test("Check remove block toggle list @SB_WEB_BUILDER_LB_BA_9", async ({ dashboard, conf, context }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    sectionSetting = conf.caseConf.data.section_1;

    await test.step("Add block Bullet", async () => {
      await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_block);
    });

    const numOfBlock = await webBuilder.frameLocator.locator(xpathBlock.xpathAttrsDataBlock).count();
    await test.step("Remove block Bullet", async () => {
      await dashboard.locator(xpathBlock.buttonRemoveInSidebar).click();
    });

    await test.step("Verify block Bullet in preview", async () => {
      await expect(webBuilder.frameLocator.locator(xpathBlock.blockBullet)).toHaveCount(0);
    });

    await test.step("Save template", async () => {
      await webBuilder.clickSave();
    });

    await test.step("Verify block Bullet on SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      const SFUrl = storefront.url();
      await storefront.goto(SFUrl);
      await storefront.waitForLoadState("networkidle");
      await verifyCountSelector(storefront, xpathBlock.xpathAttrsDataBlock, numOfBlock - 1);
    });
  });
});
