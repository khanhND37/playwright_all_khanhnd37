import { Locator, Page, expect, mergeTests } from "@playwright/test";
import { test as core } from "@core/fixtures";
import { test as wb } from "@fixtures/website_builder";
import { ThemeSettingsData } from "@types";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";

export const test = mergeTests(core, wb);
const softExpect = expect.configure({ soft: true, timeout: 500 });

export const getLocatorBlock = (page: Page, name: string, iframe?: string): Locator => {
  const loc = iframe ? page.frameLocator(iframe) : page;
  return loc.locator(`[component=${name}]`);
};

test.describe("Auto core Web builder", () => {
  let themeSettingsData: ThemeSettingsData;
  let webBuilder: WebBuilder;

  test.beforeAll(async ({ conf, theme }) => {
    await test.step("Check test theme is published or not", async () => {
      const publishedTheme = await theme.getPublishedTheme();
      if (publishedTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });
  });

  test.beforeEach(async ({ theme, conf, dashboard, builder, context }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain, context);

    await test.step("Update settings data theme to initial state", async () => {
      const themeList = await theme.list();
      const backup = themeList.find(theme => theme.name === "Theme default backup");
      const themeTest = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      const themeBackup = await builder.pageSiteBuilder(backup.id);
      themeTest.settings_data.pages["home"].default.elements = themeBackup.settings_data.pages["home"].default.elements;
      themeSettingsData = themeTest.settings_data as ThemeSettingsData;
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, themeSettingsData);
    });

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: conf.suiteConf.theme_id,
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
    });
  });

  test("@SB_WEB_BUILDER_CWB_01 - Drag and drop block trong webfront", async ({ cConf, snapshotFixture }) => {
    let blockId: string;
    for (const block of cConf.blocks) {
      await test.step("Kéo vài block vào webfront", async () => {
        blockId = await webBuilder.dragAndDropInWebBuilder(block.data);
      });

      await test.step("Verify block kéo vào webfront thành công", async () => {
        await webBuilder.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: webBuilder.getElementById(blockId, ClickType.BLOCK),
          snapshotName: block.default_dnd_snapshot,
        });
      });
    }
  });

  test(`@SB_WEB_BUILDER_CWB_02 Check delete block`, async ({ cConf }) => {
    let paragraphId: string;
    const quickbarBlock = webBuilder.frameLocator.locator(webBuilder.quickSettingsBlock);

    await test.step(`Add 1 block bất kỳ vào webfront`, async () => {
      paragraphId = await webBuilder.insertSectionBlock({
        parentPosition: cConf.add_paragraph.parent_position,
        template: "Paragraph",
        category: "Basics",
      });
      await webBuilder.backBtn.click();
    });

    await test.step("Verify quickbar settings block hiển thị", async () => {
      await webBuilder.clickElementById(paragraphId, ClickType.BLOCK);
      await expect(quickbarBlock).toBeVisible();
    });

    await test.step(`Click delete tại quickbar settings`, async () => {
      await webBuilder.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify block bị xoá khỏi webfront", async () => {
      const blockParagraph = getLocatorBlock(webBuilder.page, "paragraph", webBuilder.iframe);
      await expect(blockParagraph).toBeHidden();
    });

    await test.step(`Add thêm 1 block vào webfront`, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: cConf.add_video.parent_position,
        template: "Video",
        category: "Basics",
      });
    });

    await test.step("Verify quickbar settings block hiển thị", async () => {
      await expect(quickbarBlock).toBeVisible();
    });

    await test.step(`Tại Sidebar click remove block`, async () => {
      await webBuilder.removeBtn.click();
    });

    await test.step("Verify block bị xoá khỏi webfront", async () => {
      const blockVideo = getLocatorBlock(webBuilder.page, "video", webBuilder.iframe);
      await expect(blockVideo).toBeHidden();
    });

    await test.step(`Click Save + Check Preview/SF`, async () => {
      const sfPage = await webBuilder.clickSaveAndGoTo("Storefront");
      const blockParagraph = getLocatorBlock(sfPage, "paragraph");
      const blockVideo = getLocatorBlock(sfPage, "video");
      await expect(blockParagraph).toBeHidden();
      await expect(blockVideo).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_CWB_03 Check các settings common ở tab Design của block`, async ({ cConf }) => {
    let imgUrl: string;
    const blockRatingWebfront = getLocatorBlock(webBuilder.page, "rating", webBuilder.iframe);
    const marginBlock = webBuilder.frameLocator.locator("[data-block-component=rating]");
    const alignWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("align_self"));
    const backgroundWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("background"));
    const borderWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("border"));
    const opacityWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("opacity"));
    const radiusWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("border_radius"));
    const shadowWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("box_shadow"));
    const paddingWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("padding"));
    const marginWidget = webBuilder.genLoc(webBuilder.getSelectorByLabel("margin"));
    const expectedFirstCSS = cConf.edit_common_first.expected;
    const expectedSecondCSS = cConf.edit_common_second.expected;
    const expectedThirdCSS = cConf.edit_common_third.expected;

    await test.step(`Add 1 block bất kỳ vào webfront`, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: cConf.add_rating.parent_position,
        category: "Basics",
        template: "Rating",
      });
    });

    await test.step(`Chuyển qua tab Design (nếu có)`, async () => {
      await webBuilder.switchToTab("Design");
    });

    await test.step("Verify common widget", async () => {
      await softExpect(alignWidget).toBeVisible();
      await softExpect(backgroundWidget).toBeVisible();
      await softExpect(borderWidget).toBeVisible();
      await softExpect(opacityWidget).toBeVisible();
      await softExpect(radiusWidget).toBeVisible();
      await softExpect(shadowWidget).toBeVisible();
      await softExpect(paddingWidget).toBeVisible();
      await softExpect(marginWidget).toBeVisible();
    });

    await test.step(`Thay đổi setting với data`, async () => {
      await webBuilder.changeDesign(cConf.edit_common_first);
    });

    await test.step("Verify block thay đổi ở webfront", async () => {
      await softExpect(blockRatingWebfront).toHaveCSS("align-self", expectedFirstCSS.align_left);
      await softExpect(blockRatingWebfront).toHaveCSS("background", expectedFirstCSS.background_color_5);
      await softExpect(blockRatingWebfront).toHaveCSS("border", new RegExp(expectedFirstCSS.border_s));
      await softExpect(blockRatingWebfront).toHaveCSS("opacity", expectedFirstCSS.opacity_25);
      await softExpect(blockRatingWebfront).toHaveCSS("border-radius", expectedFirstCSS.radius_99);
      await softExpect(blockRatingWebfront).toHaveCSS("box-shadow", expectedFirstCSS.shadow_soft);
      await softExpect(blockRatingWebfront).toHaveCSS("padding", expectedFirstCSS.padding_5);
      await softExpect(marginBlock).toHaveCSS("margin", expectedFirstCSS.margin_10);
    });

    await test.step(`Click Save + Check Preview/SF`, async () => {
      const sfPage = await webBuilder.clickSaveAndGoTo("Storefront");
      const blockRating = getLocatorBlock(sfPage, "rating");
      await expect(blockRating).toBeVisible();
      await softExpect(blockRating).toHaveCSS("align-self", expectedFirstCSS.align_left);
      await softExpect(blockRating).toHaveCSS("background", expectedFirstCSS.background_color_5);
      await softExpect(blockRating).toHaveCSS("border", new RegExp(expectedFirstCSS.border_s));
      await softExpect(blockRating).toHaveCSS("opacity", expectedFirstCSS.opacity_25);
      await softExpect(blockRating).toHaveCSS("border-radius", expectedFirstCSS.radius_99);
      await softExpect(blockRating).toHaveCSS("box-shadow", expectedFirstCSS.shadow_soft);
      await softExpect(blockRating).toHaveCSS("padding", expectedFirstCSS.padding_5);
      await softExpect(blockRating).toHaveCSS("margin", expectedFirstCSS.margin_10);
      await sfPage.close();
    });

    await test.step(`Thay đổi setting với data`, async () => {
      imgUrl = await webBuilder.changeDesign(cConf.edit_common_second);
    });

    await test.step("Verify block thay đổi ở webfront", async () => {
      await softExpect(blockRatingWebfront).toHaveCSS("align-self", expectedSecondCSS.align_right);
      await softExpect(blockRatingWebfront).toHaveCSS(
        "background",
        new RegExp(`${expectedSecondCSS.background_image}\\("${imgUrl}"\\)`),
      );
      await softExpect(blockRatingWebfront).toHaveCSS("border", new RegExp(expectedSecondCSS.border_m));
      await softExpect(blockRatingWebfront).toHaveCSS("opacity", expectedSecondCSS.opacity_70);
      await softExpect(blockRatingWebfront).toHaveCSS("border-radius", expectedSecondCSS.radius_56);
      await softExpect(blockRatingWebfront).toHaveCSS("box-shadow", expectedSecondCSS.shadow_hard);
      await softExpect(blockRatingWebfront).toHaveCSS("padding", expectedSecondCSS.padding_10_84);
      await softExpect(marginBlock).toHaveCSS("margin", expectedSecondCSS.margin_64_32);
    });

    await test.step(`Thay đổi setting với data`, async () => {
      await webBuilder.changeDesign(cConf.edit_common_third);
    });

    await test.step("Verify block thay đổi ở webfront", async () => {
      await softExpect(blockRatingWebfront).toHaveCSS("align-self", expectedThirdCSS.align_center);
      await softExpect(blockRatingWebfront).toHaveCSS("background", expectedThirdCSS.background_custom);
      await softExpect(blockRatingWebfront).toHaveCSS("border", new RegExp(expectedThirdCSS.border_l));
      await softExpect(blockRatingWebfront).toHaveCSS("opacity", expectedThirdCSS.opacity_99);
      await softExpect(blockRatingWebfront).toHaveCSS("border-radius", expectedThirdCSS.radius_1);
      await softExpect(blockRatingWebfront).toHaveCSS("box-shadow", expectedThirdCSS.shadow_none);
      await softExpect(blockRatingWebfront).toHaveCSS("padding", expectedThirdCSS.padding_50_100);
      await softExpect(marginBlock).toHaveCSS("margin", expectedThirdCSS.margin_200_100);
    });
  });
});
