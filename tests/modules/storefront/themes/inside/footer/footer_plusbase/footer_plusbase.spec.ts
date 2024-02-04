import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeFixed } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify footer content section @TS_PLB_INS_SF_FOOTER_CONTENT", async () => {
  const sectionFooterContent = "[type='footer-content']";
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

  const conf = loadData(__dirname, "FOOTER_CONTENT");
  for (let i = 0; i < conf.caseConf.length; i++) {
    const dataSetting = conf.caseConf[i];

    test(`@${dataSetting.id} ${dataSetting.description}`, async ({ page, theme, snapshotFixture }) => {
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

      await test.step("Verify footer content setting", async () => {
        await navigationPage.gotoHomePage();
        await navigationPage.page.reload();
        await navigationPage.page.waitForResponse(/theme.css/);
        await page
          .locator(sectionFooterContent)
          .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: sectionFooterContent,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });
    });
  }
});
