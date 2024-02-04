import { test, expect } from "@fixtures/website_builder";
import { verifyRedirectUrl, waitSelector } from "@utils/theme";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { loadData } from "@core/conf/conf";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { PageSettingsData, ShopTheme } from "@types";

test.describe("Website page style", () => {
  let webPageStyle: WebPageStyle;
  let blocks: Blocks;
  let webBuilder: WebBuilder;
  let themeTest: ShopTheme;
  let sectionId = "";

  test.beforeEach(async ({ theme, builder, conf, dashboard }) => {
    webPageStyle = new WebPageStyle(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Pre-conditions", async () => {
      const listTheme = await theme.list();
      themeTest = listTheme.find(theme => theme.name === conf.suiteConf.theme_test);
      const themeBackup = listTheme.find(theme => theme.name === "Backup theme auto");
      const response = await builder.pageSiteBuilder(themeTest.id);
      const backupRes = await builder.pageSiteBuilder(themeBackup.id);
      const backupWebStyle = (backupRes.settings_data as PageSettingsData).designs;
      const backupPageStyle = (backupRes.settings_data as PageSettingsData).pages["home"].default.designs;
      const settingsData = response.settings_data as PageSettingsData;
      settingsData.pages["home"].default.elements = [];
      settingsData.pages["home"].default.designs = backupPageStyle;
      settingsData.designs = backupWebStyle;
      await builder.updateSiteBuilder(themeTest.id, settingsData);

      await test.step("Open design sale page and choose setting web page style", async () => {
        await webPageStyle.openWebBuilder({ type: "site", id: themeTest.id, page: "home" });
        await webPageStyle.loadingScreen.waitFor();
        await webPageStyle.reloadIfNotShow("web builder");
        sectionId = await webPageStyle.dragAndDropInWebBuilder(conf.suiteConf.add_section);
        await blocks.backBtn.click();
        await webPageStyle.clickIconStylingSetting();
      });
    });
  });

  test.afterEach(async () => {
    await test.step("Delete section after test", async () => {
      if (sectionId) {
        await blocks.clickElementById(sectionId, ClickType.SECTION);
        await blocks.removeBtn.click();
        await blocks.clickSave();
      }
    });
  });

  const conf = loadData(__dirname, "STYLE_LIBRARY");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const data = conf.caseConf.data[k];
    test(`${data.description} @${data.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
      await test.step("Switch tab web or page style", async () => {
        await webPageStyle.switchTabWebPageStyle(data.type);
        await expect(dashboard.locator(webPageStyle.xpathSettingStylingSidebar)).toBeVisible();
      });

      await test.step("Select page style and choose styling", async () => {
        for (const style of data.style) {
          await webPageStyle.clickStylingType(style.styling);
          if (style.color_library) {
            await dashboard.locator(await webPageStyle.getXpathColorLibraryByTitle(style.color_library)).click();
          }
          if (style.font_library) {
            await dashboard.locator(webPageStyle.getXpathFontLibraryByIndex(style.font_library)).click();
          }
          await dashboard.waitForSelector(webPageStyle.xpathApplied, { state: "hidden" });
          await test.step("Verify preview when change setting", async () => {
            await snapshotFixture.verifyWithAutoRetry({
              page: dashboard,
              iframe: blocks.iframe,
              selector: `section[id='${sectionId}']`,
              snapshotName: style.snapshot,
            });
            await dashboard.locator(webPageStyle.xpathBackListStyle).click();
          });
        }
        await dashboard.locator(blocks.xpathButtonSave).click();
      });

      await test.step("Click save > click preview button and verify change", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: blocks.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        const SFUrl = storefront.url();
        await storefront.goto(SFUrl);
        await storefront.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: `section[id='${sectionId}']`,
          snapshotName: data.expected.snapshots.storefront,
        });
      });
    });
  }

  test("Check setting Page styles @SB_WEB_BUILDER_WEB_PAGE_STYLE_8", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await dashboard.locator(blocks.xpathButtonLayer).click();
    await test.step("Add block and setting secondary button", async () => {
      blocks = new Blocks(dashboard, conf.caseConf.domain);
      webBuilder = new WebBuilder(dashboard, conf.caseConf.domain);
      const openBlock = conf.caseConf.open_block_button;
      await blocks.expandCollapseLayer({
        sectionName: conf.caseConf.expand_section.section_name,
        isExpand: true,
      });
      await blocks.openLayerSettings({
        sectionName: openBlock.section_name,
        subLayerName: openBlock.block_name,
      });
      await blocks.selectOptionOnQuickBar("Duplicate");
      await blocks.switchToTab("Design");
      await dashboard.waitForSelector(blocks.xpathSidebar);
      await webBuilder.selectButtonGroup("Secondary");
      await waitSelector(dashboard, webPageStyle.xpathStyle);
      await webPageStyle.backBtn.click();
    });

    await test.step("Setting block button", async () => {
      await webPageStyle.clickIconStylingSetting();
      await webPageStyle.clickStylingType(conf.caseConf.styling);
      for (const setting of conf.caseConf.setting) {
        await webBuilder.selectButtonGroup(setting.button);
        await webPageStyle.selectDropdownStyle("Font", setting.font);
        await webPageStyle.setShape(setting.shape);
        await webPageStyle.selectDropdownStyle("Size", setting.size);
        await webPageStyle.shadow(setting.shadow);
        await waitSelector(dashboard, webPageStyle.xpathShadowActive);
      }
    });

    await test.step("Verify block button", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        iframe: blocks.iframe,
        selector: `section[id='${sectionId}']`,
        snapshotName: conf.caseConf.expect.snapshot_webfront,
      });
    });

    await test.step("Click save > click preview button and verify change", async () => {
      await dashboard.locator(blocks.xpathButtonSave).click();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: blocks.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      const SFUrl = storefront.url();
      await storefront.goto(SFUrl);
      await storefront.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: `section[id='${sectionId}']`,
        snapshotName: conf.caseConf.expect.snapshot_sf,
      });
    });
  });

  test("Check setting Page styles @SB_WEB_BUILDER_WEB_PAGE_STYLE_10", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Verify font, color of page style", async () => {
      await blocks.sidebarContainer.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        iframe: blocks.iframe,
        selector: `section[id='${sectionId}']`,
        snapshotName: conf.caseConf.snapshot_page,
      });
    });

    await test.step("Switch tab web style", async () => {
      await webPageStyle.switchTabWebPageStyle(conf.caseConf.type);
      await expect(dashboard.locator(webPageStyle.xpathSettingStylingSidebar)).toBeVisible();
    });

    await test.step("Verify font, color of web style", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        iframe: blocks.iframe,
        selector: `section[id='${sectionId}']`,
        snapshotName: conf.caseConf.snapshot_web,
      });
    });

    await test.step("Click save > click preview button and verify change", async () => {
      await dashboard.locator(blocks.xpathButtonSave).click();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: blocks.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      const SFUrl = storefront.url();
      await storefront.goto(SFUrl);
      await storefront.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: `section[id='${sectionId}']`,
        snapshotName: conf.caseConf.snapshot_sf,
      });
    });
  });
});

/**
 * Case remove khỏi RC
 */
// const conf1 = loadData(__dirname, "SET_STYLE");
// for (let i = 0; i < conf1.caseConf.data.length; i++) {
//   const data = conf1.caseConf.data[i];
//   test(`${data.description} @${data.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
//     webBuilder = new WebBuilder(dashboard, conf.caseConf.domain);
//     await test.step("Switch tab web or page style", async () => {
//       await webPageStyle.switchTabWebPageStyle(data.type);
//       await expect(dashboard.locator(webPageStyle.xpathSettingStylingSidebar)).toBeVisible();
//     });

//     await test.step("Select page style and choose styling", async () => {
//       for (const style of data.style) {
//         await webPageStyle.clickStylingType(style.styling);
//         if (style.colors) {
//           const color = style.colors;
//           for (let i = 0; i < color.length; i++) {
//             await webPageStyle.inputColorWithIndex(i + 1, color[i]);
//           }
//         }

//         if (style.fonts) {
//           for (const setFont of style.fonts) {
//             await webBuilder.selectButtonGroup(setFont.tab);
//             await webPageStyle.chooseFonts(setFont.font);
//             await webPageStyle.titleBar.click();
//             for (const setSize of setFont.size) {
//               await webPageStyle.setFontSize(setSize.tag, setSize.value);
//             }
//             await dashboard.waitForSelector(webPageStyle.xpathStyleFont, { state: "hidden" });
//           }
//         }

//         await test.step("Verify preview when change setting", async () => {
//           await snapshotFixture.verifyWithAutoRetry({
//             page: dashboard,
//             iframe: blocks.iframe,
//             selector: `section[id='${sectionId}']`,
//             snapshotName: style.snapshot_preview,
//           });

//           await dashboard.locator(webPageStyle.xpathBackListStyle).click();
//         });
//       }
//       await dashboard.locator(blocks.xpathButtonSave).click();
//     });
//     await test.step("Click save > click preview button and verify change", async () => {
//       const storefront = await verifyRedirectUrl({
//         page: dashboard,
//         selector: blocks.xpathButtonPreview,
//         redirectUrl: "?theme_preview_id",
//         context,
//       });

//       const SFUrl = storefront.url();
//       await storefront.goto(SFUrl);
//       await storefront.waitForLoadState("networkidle");
//       await snapshotFixture.verifyWithAutoRetry({
//         page: storefront,
//         selector: `section[id='${sectionId}']`,
//         snapshotName: data.expected.snapshots.storefront,
//       });
//     });
//   });
// }
