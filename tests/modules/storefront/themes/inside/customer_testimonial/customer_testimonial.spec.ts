import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyCountSelector, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;

test.describe("Verify Customer Testimonials section @TS_INS_SF_CUSTOMER_TESTIMONIAL", () => {
  const sectionTestimonials = "[type='testimonials']";
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

  const confSettings = loadData(__dirname, "CHANGE_SETTINGS");
  for (let i = 0; i < confSettings.caseConf.data.length; i++) {
    const testimonials = confSettings.caseConf.data[i];

    test(`${testimonials.description} @${testimonials.case_id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confSettings.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        if (testimonials.input) {
          shopTheme = await theme.updateSection({
            shopThemeId: shopTheme.id,
            updateSection: testimonials.input as unknown as Record<string, ThemeSection>,
            settingsData: shopTheme.settings_data,
          });
        }
      });

      await test.step("Verify section Customer Testimonials setting", async () => {
        await navigationPage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await page.locator(sectionTestimonials).scrollIntoViewIfNeeded();

        if (typeof testimonials.expect.count_section !== "undefined") {
          await verifyCountSelector(page, sectionTestimonials, testimonials.expect.count_section);
        }

        if (testimonials.expect.screenshot_setting_data) {
          await waitForImageLoaded(page, sectionTestimonials);
          await snapshotFixture.verify({
            page: page,
            selector: sectionTestimonials,
            snapshotName: testimonials.expect.screenshot_setting_data,
          });
        }
        const settingTestimonial = testimonials.input.home.settings;
        const numOfBlock = testimonials.expect.count_block;
        const numOfBlockPerSlide = settingTestimonial.number_of_testimonials;

        // Auto change slide
        if (numOfBlock > numOfBlockPerSlide) {
          await test.step("Auto change slide", async () => {
            await page.locator(sectionTestimonials).scrollIntoViewIfNeeded();
            const timeAutoChangeSlide = settingTestimonial.change_slides_every;
            await new Promise(wait => setTimeout(wait, timeAutoChangeSlide * 1000));
            await expect(
              page.locator(`.testimonial-slide >> nth=${testimonials.expect.count_block - 1}`),
            ).toBeVisible();
          });
        }

        // Click button Next/Previous
        const isNavigation = settingTestimonial.show_navigation;
        if (numOfBlock > numOfBlockPerSlide && isNavigation) {
          await test.step("Click button Next", async () => {
            await page.locator(sectionTestimonials).scrollIntoViewIfNeeded();
            await page.locator(`${sectionTestimonials} [type='button'][aria-label='Next page']`).click();
            const testimonialLast = await page.waitForSelector(
              `.testimonial-slide >> nth=${testimonials.expect.count_block - 1}`,
            );
            await testimonialLast.waitForElementState("stable");
            await waitForImageLoaded(page, sectionTestimonials);
            await snapshotFixture.verify({
              page: page,
              selector: sectionTestimonials,
              snapshotName: testimonials.expect.screenshot_button_next,
            });
          });
          await test.step("Click button Previous", async () => {
            await page.locator(sectionTestimonials).scrollIntoViewIfNeeded();
            await page.locator(`${sectionTestimonials} [type='button'][aria-label='Previous page']`).click();
            const testimonialFirst = await page.waitForSelector(`.testimonial-slide >> nth=0`);
            await testimonialFirst.waitForElementState("stable");
            await waitForImageLoaded(page, sectionTestimonials);
            await snapshotFixture.verify({
              page: page,
              selector: sectionTestimonials,
              snapshotName: testimonials.expect.screenshot_button_prev,
            });
          });
        }

        // Click indicator
        const isPagination = settingTestimonial.show_pagination;
        if (numOfBlock > numOfBlockPerSlide && isPagination) {
          await test.step("Click indicator", async () => {
            await page.locator(sectionTestimonials).scrollIntoViewIfNeeded();
            await page.locator(`${sectionTestimonials}.VueCarousel-dot`).click;
            await waitForImageLoaded(page, sectionTestimonials);
            await snapshotFixture.verify({
              page: page,
              selector: sectionTestimonials,
              snapshotName: testimonials.expect.screenshot_indicator,
            });
          });
        }
      });
    });
  }

  const confActions = loadData(__dirname, "ACTIONS");
  for (let i = 0; i < confActions.caseConf.data.length; i++) {
    const testimonials = confActions.caseConf.data[i];

    test(`${testimonials.description} @${testimonials.case_id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confActions.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateThemeSettings({
          updateSections: testimonials.input as unknown as Record<string, ThemeSection[]>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");

      if (testimonials.expect.index_section) {
        await test.step("Verify section on SF", async () => {
          for (const section of testimonials.expect.index_section) {
            await expect(await page.locator(`.index-sections section >> nth=${section.index}`)).toHaveAttribute(
              "type",
              section.type_section,
            );
          }
        });
      }

      if (testimonials.expect.screenshot_setting_data) {
        await waitForImageLoaded(page, sectionTestimonials);
        await snapshotFixture.verify({
          page: page,
          snapshotName: testimonials.expect.screenshot_setting_data,
          screenshotOptions: { fullPage: true },
        });
      }
    });
  }
});
