import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyCarouselWithSnapshot, verifyRedirectUrl } from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify Slide show section in Storefront @TS_INS_SF_SLIDESHOW", () => {
  const section = "[type='slideshow']";
  const blockSlides = `${section} .VueCarousel-slide`;
  const imgLink = `${section} .slideshow-section__link`;
  const firstBtn = `${section} .btn-primary`;
  const secondBtn = `${section} .btn-outline`;
  const iconNext = `${section} [aria-label='Next page']`;
  const iconPrev = `${section} [aria-label='Previous page']`;
  const selectorImage = `${section} .slideshow-section__active img`;
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

  test("Check display Slide show section on SF with data default @SB_OLS_THE_INS_SF_SLIDESHOW_1", async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Open homepage SF with slide show data default", async () => {
      const navigationPage = new SFHome(page, conf.suiteConf.domain);
      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: page,
        selector: section,
        snapshotName: conf.caseConf.snapshot,
      });
    });
  });

  const confBlock = loadData(__dirname, "SETTING_BLOCK");
  for (let i = 0; i < confBlock.caseConf.data.length; i++) {
    const caseData = confBlock.caseConf.data[i];

    test(`${caseData.description} @${caseData.id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confBlock.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: caseData.data as unknown as Record<string, ThemeSection>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");

      await test.step("Verify slideshow section + block setting", async () => {
        if (caseData.expect.count_section) {
          await test.step("Count section slideshow", async () => {
            await expect(page.locator(section)).toHaveCount(caseData.expect.count_section);
          });
        }

        if (caseData.expect.count_block) {
          await test.step("Count block of section slideshow", async () => {
            await expect(page.locator(blockSlides)).toHaveCount(caseData.expect.count_block);
          });
        }

        if (caseData.expect.snapshot) {
          await snapshotFixture.verify({
            page: page,
            selector: section,
            snapshotName: caseData.expect.snapshot,
          });
        }

        if (caseData.expect.image_link) {
          await test.step("Verify click image of slideshow", async () => {
            const href = await page.locator(imgLink).getAttribute("href");
            await expect(href).toContain(caseData.expect.image_link);
          });
        }

        if (caseData.expect.first_button_link) {
          await test.step("Verify click first button of slideshow", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: firstBtn,
              redirectUrl: caseData.expect.first_button_link,
            });
            await page.goBack();
          });
        }

        if (caseData.expect.second_button_link) {
          await test.step("Verify click second button of slideshow", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: secondBtn,
              redirectUrl: caseData.expect.second_button_link,
              waitForElement: ".breadcrumb_link--current",
            });
            await page.goBack();
          });
        }

        if (caseData.expect.icon_next_prev) {
          await test.step("Verify click next + prev slideshow", async () => {
            await page.locator(iconNext).click();
            await verifyCarouselWithSnapshot(page, caseData.expect.snapshot_next, selectorImage, section);
            await page.locator(iconPrev).click();
            await verifyCarouselWithSnapshot(page, caseData.expect.snapshot_prev, selectorImage, section);
          });
        }
      });
    });
  }

  test("Verify show section when setting change position section @SB_OLS_THE_INS_SF_SLIDESHOW_8", async ({
    page,
    conf,
    theme,
    snapshotFixture,
  }) => {
    await test.step("Verify change position section slideshow", async () => {
      const navigationPage = new SFHome(page, conf.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateThemeSettings({
          updateSections: conf.caseConf.data as unknown as Record<string, ThemeSection[]>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: page,
        selector: ".flex-grow.main-content",
        snapshotName: conf.caseConf.expect.snapshot,
      });
    });
  });
});
