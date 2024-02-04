import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import { snapshotDir } from "@core/utils/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { loadData } from "@core/conf/conf";

let shopThemeId = 0;
let shopTheme: ShopTheme;

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.beforeEach(async ({ theme }) => {
  await test.step("Create theme by API", async () => {
    const res = await theme.create(3);
    shopTheme = await theme.publish(res.id);
    shopThemeId = res.id;
  });

  await test.step("Remove shop theme not active", async () => {
    const res = await theme.list();
    const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
    if (shopThemeId) {
      await theme.delete(shopThemeId.id);
    }
  });
});

test.describe("Verify Feature promotion section in Storefront", () => {
  const conf = loadData(__dirname, "FEATURED_PROMOTION");
  for (const featurePromotion of conf.caseConf.data) {
    test(`${featurePromotion.description} @${featurePromotion.case_id}`, async ({ page, theme, snapshotFixture }) => {
      const domain = conf.suiteConf.domain;
      const homePage = new SFHome(page, domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      if (featurePromotion.expect) {
        await theme.updateThemeSettings({
          updateSections: featurePromotion.sections_data as unknown as Record<string, ThemeSection[]>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopThemeId,
        });
      }
      await test.step("Open shop SF, check display Featured promotion", async () => {
        await homePage.gotoHomePage();
        await page.waitForLoadState("networkidle");

        if (featurePromotion.expect.name_snapshot) {
          await page.locator("[type='featured-promotion']").scrollIntoViewIfNeeded();
          await page.locator("[type='footer']").scrollIntoViewIfNeeded();
          if (featurePromotion.expect.wait_selector) {
            await page.waitForSelector(featurePromotion.expect.wait_selector);
          }
          await snapshotFixture.verify({
            page: page,
            selector: "[type='featured-promotion']",
            snapshotName: featurePromotion.expect.name_snapshot,
          });
        }

        if (featurePromotion.expect.section_type) {
          await expect(await page.locator(`[type="${featurePromotion.expect.section_type}"]`)).toBeHidden();
        }

        if (featurePromotion.expect.first_section) {
          await expect(
            await page.getAttribute(".index-sections .content > section[data-section-id]:first-child", "type"),
          ).toEqual(`${featurePromotion.expect.first_section}`);
        }
      });
    });
  }
});
