import { test, expect } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { XpathNavigationButtons } from "@constants/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";

let blockSelector, pageBlock: Blocks;

test.describe("Check module block Rating @SB_WEB_BUILDER_LB_BR", () => {
  let settingsData: PageSettingsData;
  let blocks: Blocks;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: Apply blank template and open web builder", async () => {
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
      await blocks.reloadIfNotShow("/");
      await blocks.frameLocator.locator(blocks.xpathAddSection).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
    });
  });

  test("Check data default block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_1", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Add block Bullet", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
    });
    await test.step("Verify data default in sidebar", async () => {
      await pageBlock.switchToTab("Content");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: conf.caseConf.expect.snapshot_settingsbar,
      });
      await pageBlock.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: conf.caseConf.expect.snapshot_stylebar,
      });
    });
    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront,
        });
      });
    });
  });
  test("Check setting data block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_2", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blockSelector = pageBlock.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step("Add block Bullet", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
    });

    await test.step("Setting data block Bullet", async () => {
      const blockSetting = conf.caseConf.data.blockSetting;
      await pageBlock.switchToTab("Design");
      await pageBlock.settingWidthHeight("width", blockSetting.width);
      await pageBlock.settingWidthHeight("height", blockSetting.height);
    });
    await test.step("Setting icon of block Bullet", async () => {
      const blockSetting = conf.caseConf.data.blockSetting;
      await pageBlock.switchToTab("Content");
      const icon = blockSetting.icon;
      await pageBlock.settingListBullet("bullets", { icon });
      await pageBlock.clickBackLayer();
    });

    await test.step("Verify block Bullet in preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: blockSelector,
        iframe: pageBlock.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview_settingdata,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront_settingdata,
        });
      });
    });
  });
  test("Check setting icon color of block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_3", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blockSelector = pageBlock.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step("Add block Bullet", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
    });

    await test.step("Setting icon color block Bullet", async () => {
      const blockSetting = conf.caseConf.data.blockSetting;
      await pageBlock.switchToTab("Design");
      await pageBlock.color(blockSetting.color, "icon_color");
      await pageBlock.clickBackLayer();
    });

    await test.step("Verify block Bullet in preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: blockSelector,
        iframe: pageBlock.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview_iconcolor,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront_iconcolor,
        });
      });
    });
  });

  test("Check add more item in block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_5", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blockSelector = pageBlock.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step("Add block Bullet", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
    });
    await pageBlock.clickBackLayer();
    await test.step("Add item in block Bullet", async () => {
      await pageBlock.frameLocator.locator(blockSelector).click();
      await pageBlock.switchToTab("Content");
      await dashboard.locator(pageBlock.getXpathByText("Add item")).click();
      await expect(pageBlock.bulletItem).toHaveCount(4);
    });

    await test.step("Verify block Bullet in preview", async () => {
      await pageBlock.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: blockSelector,
        iframe: pageBlock.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview_additem,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront_additem,
        });
      });
    });
  });
  test("Check delete item in block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_6", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blockSelector = pageBlock.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step("Add block Bullet", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
      await pageBlock.clickBackLayer();
    });
    await test.step("Delete item in block Bullet", async () => {
      await pageBlock.frameLocator.locator(blockSelector).click();
      await pageBlock.switchToTab("Content");
      await pageBlock.genLoc(pageBlock.iconDeleteItemBullet).click();
      await pageBlock.waitForXpathState("[label='Bullet']", "stable");
    });

    await test.step("Verify block Bullet in preview", async () => {
      await pageBlock.backBtn.click({ delay: 200 });
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: blockSelector,
        iframe: pageBlock.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview_deleteitem,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront_deleteitem,
        });
      });
    });
  });
  test("Check drag and drop item in block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_7", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blockSelector = pageBlock.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step("Add block Bullet", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
      await pageBlock.clickBackLayer();
    });
    const blockSetting = conf.caseConf.data.blockSetting;
    await test.step("Setting icon for Item 1", async () => {
      await pageBlock.frameLocator.locator(blockSelector).click();
      await pageBlock.switchToTab("Content");
      const icon = blockSetting.icon;
      await pageBlock.settingListBullet("bullets", { icon });
    });
    await test.step("Drag and drop Item 1", async () => {
      await pageBlock.dndItemInSidebar({
        from: { sectionName: "Bullet", sectionIndex: blockSetting.move.from },
        to: { sectionName: "Bullet", sectionIndex: blockSetting.move.to },
      });
    });

    await test.step("Verify block Bullet in preview", async () => {
      await pageBlock.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: blockSelector,
        iframe: pageBlock.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview_dragdropitem,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront_dragdropitem,
        });
      });
    });
  });
  test("Check edit item in block Bullet @SB_WEB_BUILDER_LB_BULLET_BLOCK_9", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    blockSelector = pageBlock.getSelectorByIndex({ section: 1, column: 1, block: 1 });
    const blockSetting = conf.caseConf.data.blockSetting;

    await test.step("Add block Bullet and edit width", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Bullet").click();
      await pageBlock.switchToTab("Design");
      await pageBlock.settingWidthHeight("width", blockSetting.width);
    });

    await test.step("Edit text item in block Bullet ", async () => {
      await pageBlock.inputTextBulletToggleList(blockSetting.setting_items);
      await pageBlock.clickBackLayer();
    });

    await test.step("Verify block Bullet in preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: blockSelector,
        iframe: pageBlock.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview_edititem,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSave();
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Bullet on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: pageBlock.xpathAttrsDataBlock,
          snapshotName: conf.caseConf.expect.snapshot_storefront_edititem,
        });
      });
    });
  });
});
