import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { XpathNavigationButtons } from "@constants/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";

let block, section, column, sectionSetting, sectionSelector: string, blockSelector, pageBlock: Blocks;

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

  test("Check data default block Rating @SB_WEB_BUILDER_LB_BR_1", async ({ cConf, context, snapshotFixture }) => {
    await test.step("Add block Rating", async () => {
      await pageBlock.clickAddBlockBtn("content", 1);
      await pageBlock.getTemplatePreviewByName("Rating").click();
    });
    await test.step("Verify data setting in sidebar", async () => {
      await pageBlock.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: cConf.expect.snapshot_stylebar,
      });
      await pageBlock.switchToTab("Content");
      await snapshotFixture.verifyWithAutoRetry({
        page: pageBlock.page,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: cConf.expect.snapshot_settingsbar,
      });
    });
    await test.step("Save template", async () => {
      await pageBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: pageBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Rating on SF", async () => {
        const storefront = await verifyRedirectUrl({
          context,
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
        });
        await storefront.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: storefront.locator(pageBlock.xpathAttrsDataBlock).first(),
          snapshotName: cConf.expect.snapshot_storefront,
        });
      });
    });
  });

  test("Check setting icon block Rating @SB_WEB_BUILDER_LB_BR_3", async ({ cConf, context, snapshotFixture }) => {
    await test.step("Add 2 blocks Rating for section", async () => {
      sectionSetting = cConf.data.section;
      section = 1;
      sectionSelector = pageBlock.getSelectorByIndex({ section });
      for (const template of sectionSetting.dnd_blocks) {
        await pageBlock.dragAndDropInWebBuilder(template);
      }
    });

    column = 1;
    block = 1;
    blockSelector = pageBlock.getSelectorByIndex({ section, column, block });
    await test.step("Setting data block Rating 1", async () => {
      // Breadcrumb của block Rating bên dưới đang đè lên block trên nên cần click ra ngoài để đóng breadcrumb
      await pageBlock.frameLocator.locator(sectionSelector).click({ position: { x: 1, y: 1 } });
      await pageBlock.frameLocator.locator(blockSelector).click();
      await pageBlock.switchToTab("Design");
      await pageBlock.genLoc(pageBlock.popupSelectIcon).click();
      await pageBlock.genLoc(pageBlock.iconStarRounded).click();
      await pageBlock.switchToTab("Content");
      await pageBlock.editSliderBar("rating", cConf.rating.star_rounded);
    });

    column = 1;
    block = 2;
    blockSelector = pageBlock.getSelectorByIndex({ section, column, block });
    await test.step("Setting data block Rating 2", async () => {
      await pageBlock.frameLocator.locator(blockSelector).click();
      await pageBlock.switchToTab("Design");
      await pageBlock.genLoc(pageBlock.popupSelectIcon).click();
      await pageBlock.genLoc(pageBlock.iconHeart).click();
      await pageBlock.switchToTab("Content");
      await pageBlock.editSliderBar("rating", cConf.rating.heart);
      await pageBlock.frameLocator.locator(sectionSelector).click({ position: { x: 1, y: 1 } });
    });

    await test.step("Verify block Rating in preview", async () => {
      await pageBlock.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: pageBlock.page,
        selector: pageBlock.frameLocator.locator(pageBlock.columnsInPreview).first(),
        snapshotName: cConf.expect.snapshot_preview_setting_icon,
      });
    });

    await test.step("Save template", async () => {
      await pageBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: pageBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Rating on SF", async () => {
        const storefront = await verifyRedirectUrl({
          context,
          page: pageBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
        });
        await storefront.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: storefront.locator(pageBlock.columnsInPreview).first(),
          snapshotName: cConf.expect.snapshot_storefront_setting_icon,
        });
      });
    });
  });
});
