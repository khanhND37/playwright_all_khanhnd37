import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyCountSelector, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";

/*
- Setup shop data:
  + Created page "Contact us" with handle = contact-us
  + Created collection "collection 1" with handle = collection-1
 */

let shopTheme: ShopTheme;

test.describe("Verify Banner section in Storefront @TS_INS_SF_BANNER", () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test.beforeAll(async ({ theme }) => {
    await test.step("Create theme by API", async () => {
      const res = await theme.create(3);
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

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const banner = conf.caseConf.data[i];

    test(`${banner.description} @${banner.case_id}`, async ({ page, conf, theme, snapshotFixture }) => {
      const sectionSelector = ":nth-match(.banner-section div, 1)";
      const domain = conf.suiteConf.domain;
      const homePage = new SFHome(page, domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        if (banner.input) {
          shopTheme = await theme.updateSection({
            updateSection: banner.input as unknown as Record<string, ThemeSection>,
            settingsData: shopTheme.settings_data,
            shopThemeId: shopTheme.id,
          });
        }
      });

      await test.step("Verify show section on SF", async () => {
        await homePage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await waitForImageLoaded(page, sectionSelector);

        if (banner.expect.count_section) {
          await verifyCountSelector(page, `${sectionSelector}`, banner.expect.count_section);
        }

        if (banner.expect.snapshot) {
          await snapshotFixture.verify({
            page: page,
            selector: `${sectionSelector}`,
            snapshotName: banner.expect.snapshot,
          });
        }
      });

      await test.step("Verify navigation page", async () => {
        // When click on primary button
        if (typeof banner.expect.primary_button_link !== "undefined") {
          await verifyRedirectUrl({
            page: page,
            selector: `${sectionSelector} .btn-primary`,
            redirectUrl: banner.expect.primary_button_link,
          });

          if (banner.expect.primary_button_link) {
            await page.goBack();
          }
        }

        // When click on secondary button
        if (typeof banner.expect.secondary_button_link !== "undefined") {
          await verifyRedirectUrl({
            page: page,
            selector: `${sectionSelector} .btn-outline`,
            redirectUrl: banner.expect.secondary_button_link,
          });
        }
      });
    });
  }

  test("Show multiple section on SF @SB_OLS_THE_INS_SF_BANNER_8", async ({ page, conf, theme, snapshotFixture }) => {
    const sectionSelector = "[type='banner'] div.banner-section__wrap";
    const domain = conf.suiteConf.domain;
    const homePage = new SFHome(page, domain);
    const data = conf.caseConf.data;

    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    let countSection = shopTheme.settings_data.pages.home.default.filter(
      section => section.type === "banner" && section.visible === true,
    ).length;

    for (const section of data.input) {
      shopTheme = await theme.addSection({
        shopThemeId: shopTheme.id,
        settingsData: shopTheme.settings_data,
        addSection: section,
      });
    }
    countSection += data.input.length;
    const snapshots = data.expect.snapshot.split(",");
    let index = snapshots.length - 1;

    await homePage.gotoHomePage();
    await page.reload();
    await page.waitForNavigation();
    await page.waitForLoadState("networkidle");
    await waitForImageLoaded(page, sectionSelector);

    for (let i = countSection; i > countSection - data.input.length; i--) {
      await snapshotFixture.verify({
        page: page,
        snapshotName: snapshots[index--].trim(),
        selector: `${sectionSelector} >> nth=${i - 1}`,
      });
    }
  });
});
