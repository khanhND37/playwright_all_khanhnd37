import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyCountSelector, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;

test.describe("Verify Logo list section @SB_OLS_THE_INS_SF_LOGO", () => {
  const sectionLogoList = "[type='logo-list']";
  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test.beforeAll(async ({ theme }) => {
    await test.step("Create theme by API", async () => {
      const res = await theme.create(2);
      shopTheme = await theme.publish(res.id);
    });

    await test.step("Remove shop theme not active", async () => {
      const res = await theme.list();
      const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
    });
  });
  const confSettings = loadData(__dirname, "CHANGE_SETTINGS");
  for (let i = 0; i < confSettings.caseConf.data.length; i++) {
    const logoList = confSettings.caseConf.data[i];
    test(`${logoList.description} @${logoList.case_id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confSettings.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        if (logoList.input) {
          const indexSection = shopTheme.settings_data.pages.home.default.findIndex(
            section => section.type === "logo-list",
          );

          if (indexSection !== -1) {
            shopTheme = await theme.updateSection({
              shopThemeId: shopTheme.id,
              updateSection: logoList.input as unknown as Record<string, ThemeSection>,
              settingsData: shopTheme.settings_data,
            });
          } else {
            shopTheme = await theme.addSection({
              shopThemeId: shopTheme.id,
              settingsData: shopTheme.settings_data,
              addSection: logoList.input as unknown as Record<string, ThemeSection>,
            });
          }
        }
      });

      await test.step("Verify section logo list setting", async () => {
        await navigationPage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await page.locator(sectionLogoList).scrollIntoViewIfNeeded();

        if (typeof logoList.expect.count_section !== "undefined") {
          await verifyCountSelector(page, sectionLogoList, logoList.expect.count_section);
        }

        if (logoList.expect.screenshot_setting_data) {
          await waitForImageLoaded(page, sectionLogoList);
          await snapshotFixture.verify({
            page: page,
            selector: sectionLogoList,
            snapshotName: logoList.expect.screenshot_setting_data,
          });
        }

        // Click logo link
        if (logoList.expect.logo) {
          await test.step("Verify click logo list", async () => {
            for (const block of logoList.expect.logo) {
              await verifyRedirectUrl({
                page: page,
                selector: `.logo-list-carousel img >> nth=0`,
                redirectUrl: block.link_logo,
              });
              await page.goBack();
            }
          });
        }
      });
    });
  }
});
