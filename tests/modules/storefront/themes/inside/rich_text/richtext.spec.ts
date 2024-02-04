import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import { snapshotDir, verifyRedirectUrl } from "@core/utils/theme";
import type { ShopTheme, ThemeSettingValue } from "@types";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;

test.beforeAll(async ({ theme }) => {
  await test.step("Get shop theme id", async () => {
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }
  });
});

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.describe("Verify Rich text section in Storefront", () => {
  const conf = loadData(__dirname, "RICH_TEXT");
  for (const richText of conf.caseConf.data) {
    test(`${richText.description} @${richText.case_id}`, async ({ page, theme, snapshotFixture }) => {
      const domain = conf.suiteConf.domain;
      const homePage = new SFHome(page, domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      if (richText.expect) {
        await test.step("Setting theme editor", async () => {
          shopTheme = await theme.updateSection({
            updateSection: richText.input as unknown as Record<string, Record<string, ThemeSettingValue>>,
            settingsData: shopTheme.settings_data,
            shopThemeId: shopTheme.id,
          });
        });
      }

      await test.step("Open shop SF, check display Rich text", async () => {
        await homePage.gotoHomePage();
        await page.waitForLoadState("networkidle");

        if (richText.expect.name_snapshot) {
          await page.locator("[type='rich-text']").scrollIntoViewIfNeeded();
          await snapshotFixture.verify({
            page: page,
            selector: "[type='rich-text']",
            snapshotName: richText.expect.name_snapshot,
          });
        }

        if (richText.expect.redirect_link) {
          await verifyRedirectUrl({
            page: page,
            selector: richText.expect.redirect_link.redirect_selector,
            redirectUrl: richText.expect.redirect_link.redirect_url,
            waitForElement: richText.expect.redirect_link.wait_element,
          });
        }
      });
    });
  }
});
