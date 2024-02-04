import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyCountSelector, waitForImageLoaded } from "@utils/theme";
import { expect } from "@core/fixtures";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;

test.describe("Verify Gallery image section @TS_INS_SF_GALLERY_IMAGE", () => {
  const sectionSelector = "[type='gallery-image']";
  test.beforeAll(async ({ theme }) => {
    const themeList = await theme.list();
    for (let i = 0; i < themeList.length; i++) {
      if (themeList[i].active) {
        continue;
      }

      await theme.delete(themeList[i].id);
    }
  });

  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test("Verify show default section after add new section @SB_OLS_THE_INS_SF_GALLERY_IMAGE_1", async ({
    theme,
    page,
    conf,
    snapshotFixture,
  }) => {
    const navigationPage = new SFHome(page, conf.suiteConf.domain);

    await test.step("Create new theme and verify show section on SF", async () => {
      const res = await theme.create(3);
      shopTheme = await theme.publish(res.id);

      const themeList = await theme.list();
      const shopThemeId = themeList.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }

      await navigationPage.gotoHomePage();
      await page.reload();
      await page.waitForResponse(/theme.css/);
      await verifyCountSelector(page, sectionSelector, 0);
    });

    await test.step("Add new section", async () => {
      shopTheme = await theme.addSection({
        shopThemeId: shopTheme.id,
        settingsData: shopTheme.settings_data,
        addSection: conf.caseConf.data.input,
      });
    });

    await page.reload();
    await page.waitForResponse(/theme.css/);
    await waitForImageLoaded(page, sectionSelector);
    await verifyCountSelector(page, sectionSelector, conf.caseConf.data.expect.count_section);
    await snapshotFixture.verifyWithAutoRetry({
      page: page,
      selector: sectionSelector,
      snapshotName: conf.caseConf.data.expect.snapshot,
    });
  });

  const confSections = loadData(__dirname, "MULTIPLE_SECTIONS");
  for (let i = 0; i < confSections.caseConf.length; i++) {
    const galleryImage = confSections.caseConf[i];

    test(`${galleryImage.description} @${galleryImage.id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confSections.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateThemeSettings({
          updateSections: galleryImage.data as unknown as Record<string, ThemeSection[]>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.reload();
      await page.waitForResponse(/theme.css/);
      await waitForImageLoaded(page, sectionSelector);

      if (galleryImage.expect.index_section) {
        await test.step("Verify section on SF", async () => {
          for (const section of galleryImage.expect.index_section) {
            await expect(page.locator(`.index-sections section >> nth=${section.index}`)).toHaveAttribute(
              "type",
              section.type_section,
            );
          }
        });
      }

      if (galleryImage.expect.snapshot) {
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          snapshotName: galleryImage.expect.snapshot,
          selector: "[role='main']",
          combineOptions: { animations: "disabled" },
        });
      }
    });
  }

  const confASection = loadData(__dirname, "SECTION");
  for (let i = 0; i < confASection.caseConf.data.length; i++) {
    const galleryImage = confASection.caseConf.data[i];

    test(`${galleryImage.description} @${galleryImage.id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confASection.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          shopThemeId: shopTheme.id,
          updateSection: galleryImage.input as unknown as Record<string, ThemeSection>,
          settingsData: shopTheme.settings_data,
        });
      });

      await test.step("Verify show section Gallery image on SF", async () => {
        await navigationPage.gotoHomePage();
        await page.reload();
        await page.waitForResponse(/theme.css/);

        if (typeof galleryImage.expect.count_section !== "undefined") {
          await verifyCountSelector(page, sectionSelector, galleryImage.expect.count_section);
        }

        if (galleryImage.expect.snapshot) {
          await page.locator(sectionSelector).scrollIntoViewIfNeeded();
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: sectionSelector,
            snapshotName: galleryImage.expect.snapshot,
          });
        }
      });
    });
  }

  test("Verify Preview image in gallery image section @SB_OLS_THE_INS_SF_GALLERY_IMAGE_8", async ({
    theme,
    page,
    conf,
  }) => {
    const navigationPage = new SFHome(page, conf.suiteConf.domain);

    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    await test.step("Setup data section in theme", async () => {
      shopTheme = await theme.updateSection({
        shopThemeId: shopTheme.id,
        settingsData: shopTheme.settings_data,
        updateSection: conf.caseConf.data.input,
      });
    });

    await test.step("Verify preview on SF", async () => {
      await navigationPage.gotoHomePage();
      await page.reload();
      await page.waitForResponse(/theme.css/);

      await page.locator(sectionSelector).scrollIntoViewIfNeeded();
      await page.locator(":nth-match([type='gallery-image'] .row div, 1) img").click();

      await expect(page.locator(".inside-modal")).toBeVisible();
      await expect(
        page.locator(
          "[type='gallery-image'] [type='button'][aria-label='Previous page'].VueCarousel-navigation--disabled",
        ),
      ).toBeVisible();

      await page.locator("[type='gallery-image'] [type='button'][aria-label='Next page']").click();
      await expect(
        page.locator("[type='gallery-image'] [type='button'][aria-label='Next page'].VueCarousel-navigation--disabled"),
      ).toBeVisible();
    });
  });
});
