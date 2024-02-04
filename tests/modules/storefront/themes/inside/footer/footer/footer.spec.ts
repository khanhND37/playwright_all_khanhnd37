import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import type { ShopTheme, ThemeFixed } from "@types";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify footer content section @TS_INS_SF_FOOTER_SECTION", async () => {
  const sectionFooter = "[type='footer']";
  let shopTheme: ShopTheme;

  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test.beforeAll(async ({ theme }) => {
    await test.step("Create theme by API", async () => {
      const res = await theme.create(3);
      await theme.publish(res.id);
    });

    await test.step("Remove shop theme not active", async () => {
      const res = await theme.list();
      const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
    });
  });

  const conf = loadData(__dirname, "FOOTER_SECTION");
  for (let i = 0; i < conf.caseConf.length; i++) {
    const dataSetting = conf.caseConf[i];

    test(`${dataSetting.description} @${dataSetting.id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, conf.suiteConf.domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify section + block Footer setting", async () => {
        await navigationPage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await waitForImageLoaded(page, sectionFooter);
        await snapshotFixture.verify({
          page: page,
          selector: sectionFooter,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });
    });
  }
});
