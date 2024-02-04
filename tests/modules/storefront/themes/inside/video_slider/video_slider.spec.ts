import { Page } from "@playwright/test";
import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import type { FixtureThemeApi, ShopTheme } from "@types";
import { snapshotDir } from "@utils/theme";

const videoSliderSection = "section[type='video-slider'] .video-slider-section";
let shopThemeId = 0;
const goToHomePage = async (page: Page, domain: string) => {
  await page.goto(`https://${domain}`);
  await page.waitForLoadState("networkidle");
};
const updateSection = async (theme: FixtureThemeApi, conf) => {
  const shopTheme = await theme.single(shopThemeId);
  const res = await theme.updateSection({
    shopThemeId: shopTheme.id,
    updateSection: conf.caseConf.data,
    settingsData: shopTheme.settings_data,
  });
  expect(res.id).toBe(shopTheme.id);
};
const verifyVideoSliderWithSnapshot = async (
  page: Page,
  snapshotName: string,
  selector = videoSliderSection,
  snapshotFixture,
) => {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const isThumbnail = await page
    .locator(`${selector} .VueCarousel-slide-active .video-slider-section__thumbnail`)
    .count();
  if (isThumbnail > 0) {
    const img = page.locator(`${selector} .VueCarousel-slide-active .video-slider-section__thumbnail`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await img.evaluate((image: any) => image.complete || new Promise(f => (image.onload = f)));
  }
  const videoSliderInner = await page.waitForSelector(`${selector} .VueCarousel-inner`);
  await videoSliderInner.waitForElementState("stable");
  await snapshotFixture.verify({
    page: page,
    selector: selector,
    snapshotName: snapshotName,
  });
};
const verifyYoutubePlaying = async (page: Page, label = "Pause", title = "Pause") => {
  if (title === "Pause") {
    await page.waitForResponse(response => {
      return response.url().includes("/api/stats/playback") && response.status() === 204;
    });
  }

  const videoIframe = await page.frameLocator(`${videoSliderSection} .VueCarousel-slide-active iframe`);
  const buttonPause = await videoIframe.locator(`[aria-label='${label} (k)'][title='${title} (k)']`).isVisible();
  expect(buttonPause).toBeTruthy();
};

let shopTheme: ShopTheme;
test.describe("@TS_INS_SF_VIDEO_SLIDER", () => {
  test.beforeEach(async ({ theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    if (!shopThemeId) {
      const res = await theme.getBootstrap();
      shopThemeId = res.theme.shop_theme_id;
    }
  });
  test.beforeAll(async ({ theme }) => {
    await test.step("Create and publish theme by API", async () => {
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

  test("Check display outside SF with default data @SB_OLS_THE_INS_SF_VIDEO_SLIDER_1", async ({
    page,
    theme,
    conf,
  }) => {
    await test.step("Add section Video Slider", async () => {
      shopTheme = await theme.single(shopThemeId);
      const res = await theme.addSection({
        shopThemeId: shopTheme.id,
        addSection: conf.caseConf.data,
        settingsData: shopTheme.settings_data,
      });
      expect(res.id).toBe(shopTheme.id);
    });

    await test.step("Check display Video Slider outside SF", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      expect(await page.isHidden(videoSliderSection)).toBeTruthy();
    });
  });

  test(
    "Check Video Slider when setting data full width and disable autoplay video, " +
      "text inside thumbnail image @SB_OLS_THE_INS_SF_VIDEO_SLIDER_2",
    async ({ page, theme, conf, snapshotFixture }) => {
      await test.step("Update section Video Slider", async () => {
        await updateSection(theme, conf);
      });

      await test.step("Open SF and scroll to Video Slider", async () => {
        await goToHomePage(page, conf.suiteConf.domain);
        await verifyVideoSliderWithSnapshot(page, "video-slider-full-width.png", videoSliderSection, snapshotFixture);
      });

      await test.step("Click icon play", async () => {
        await page.click(`${videoSliderSection} .video-play-icon`);
        await verifyYoutubePlaying(page);
        expect(await page.isHidden(`${videoSliderSection} .video__media`)).toBeTruthy();
      });
    },
  );

  test(
    "Check Video Slider when setting data not full width and disable autoplay video, " +
      "text below thumbnail image @SB_OLS_THE_INS_SF_VIDEO_SLIDER_3",
    async ({ page, theme, conf, snapshotFixture }) => {
      await test.step("Update section Video Slider", async () => {
        await updateSection(theme, conf);
      });

      await test.step("Open SF and scroll to Video Slider", async () => {
        await goToHomePage(page, conf.suiteConf.domain);
        await verifyVideoSliderWithSnapshot(
          page,
          "video-slider-no-full-width.png",
          videoSliderSection,
          snapshotFixture,
        );
      });
    },
  );

  test("Check Video Slider when setting data do no have thumbnail image @SB_OLS_THE_INS_SF_VIDEO_SLIDER_4", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Open SF and scroll to Video Slider", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-do-no-have-thumbnail.png",
        videoSliderSection,
        snapshotFixture,
      );
    });

    await test.step("Click icon play", async () => {
      await page.click(`${videoSliderSection} .mediaWrapper`);
      await verifyYoutubePlaying(page, "Play");
    });
  });

  test("Check Video Slider when setting data do have thumbnail image @SB_OLS_THE_INS_SF_VIDEO_SLIDER_5", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Open SF and scroll to Video Slider", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-do-have-thumbnail.png",
        videoSliderSection,
        snapshotFixture,
      );
    });
  });

  test("Check Video Slider when setting data auto play @SB_OLS_THE_INS_SF_VIDEO_SLIDER_6", async ({
    page,
    theme,
    conf,
  }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Open SF and scroll to Video Slider", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      await page.evaluate(() =>
        document
          .querySelector("section[type='video-slider'] .video-slider-section")
          .scrollIntoView({ block: "center" }),
      );
      await verifyYoutubePlaying(page);
    });
  });

  test("Check Video Slider when setting data many videos @SB_OLS_THE_INS_SF_VIDEO_SLIDER_7", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Open SF and scroll to Video Slider", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      await verifyVideoSliderWithSnapshot(page, "video-slider-many-videos.png", videoSliderSection, snapshotFixture);
    });

    await test.step("Click icon next", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-next`);
      await verifyVideoSliderWithSnapshot(page, "video-slider-third-block.png", videoSliderSection, snapshotFixture);
    });

    await test.step("Click icon play third block video", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-slide-active .mediaWrapper`);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-third-block-error.png",
        videoSliderSection,
        snapshotFixture,
      );
    });

    await test.step("Click icon next", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-next`);
      await verifyVideoSliderWithSnapshot(page, "video-slider-fourth-block.png", videoSliderSection, snapshotFixture);
    });

    await test.step("Click icon play fourth block video", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-slide-active .video-play-icon`);
      await verifyYoutubePlaying(page);
    });

    await test.step("Click icon next", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-next`);
      await verifyVideoSliderWithSnapshot(page, "video-slider-second-block.png", videoSliderSection, snapshotFixture);
    });

    await test.step("Click icon prev", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-prev`);
      await verifyYoutubePlaying(page, "Pause", "Play");
    });
  });

  test("Check hide block Video Slider @SB_OLS_THE_INS_SF_VIDEO_SLIDER_8", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Check display Video Slider 1", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-first-block-hide.png",
        videoSliderSection,
        snapshotFixture,
      );
    });

    await test.step("Check display Video Slider 3", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-next`);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-third-block-hide.png",
        videoSliderSection,
        snapshotFixture,
      );
    });
  });

  test("Check hide section Video Slider @SB_OLS_THE_INS_SF_VIDEO_SLIDER_9", async ({ page, theme, conf }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Check display Video Slider outside SF", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      expect(await page.isHidden(videoSliderSection)).toBeTruthy();
    });
  });

  test("Check unhide and remove Video Slider @SB_OLS_THE_INS_SF_VIDEO_SLIDER_10", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      await updateSection(theme, conf);
    });

    await test.step("Check display Video Slider 1", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-first-block-hide-remove.png",
        videoSliderSection,
        snapshotFixture,
      );
    });

    await test.step("Check display Video Slider 2", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-next`);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-second-block-hide-remove.png",
        videoSliderSection,
        snapshotFixture,
      );
    });
  });

  test("Check move section and block Video Slider @SB_OLS_THE_INS_SF_VIDEO_SLIDER_12", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      const shopTheme = await theme.single(shopThemeId);
      shopTheme.settings_data.pages.home.default = shopTheme.settings_data.pages.home.default.filter(
        section => section.type !== "video-slider",
      );
      shopTheme.settings_data.pages.home.default.unshift(conf.caseConf.data.home);
      const res = await theme.updateThemeSettings({
        shopThemeId: shopTheme.id,
        updateSections: shopTheme.settings_data,
        settingsData: shopTheme.settings_data,
      });
      expect(res.id).toBe(shopTheme.id);
    });

    await test.step("Check display Video Slider 2", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      expect(await page.getAttribute(".content > section:first-child", "type")).toBe("video-slider");
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-second-block-move.png",
        videoSliderSection,
        snapshotFixture,
      );
    });

    await test.step("Check display Video Slider 1", async () => {
      await page.click(`${videoSliderSection} .VueCarousel-navigation-next`);
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-first-block-move.png",
        videoSliderSection,
        snapshotFixture,
      );
    });
  });

  test("Check duplicate section and block Video Slider @SB_OLS_THE_INS_SF_VIDEO_SLIDER_13", async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Update section Video Slider", async () => {
      const shopTheme = await theme.single(shopThemeId);
      shopTheme.settings_data.pages.home.default = shopTheme.settings_data.pages.home.default.filter(
        section => section.type !== "video-slider",
      );

      for (const section of conf.caseConf.data) {
        await theme.addSection({
          shopThemeId: shopTheme.id,
          addSection: section,
          settingsData: shopTheme.settings_data,
        });
      }
    });

    await test.step("Check duplicate section and block Video Slider", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      // Verify section video slider 1
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-duplicate.png",
        "section[data-section-id='Xgf'] .video-section",
        snapshotFixture,
      );
      // Verify section video slider 2
      await verifyVideoSliderWithSnapshot(
        page,
        "video-slider-duplicate.png",
        "section[data-section-id='UKy'] .video-section",
        snapshotFixture,
      );
    });
  });

  test("Check remove Video Slider @SB_OLS_THE_INS_SF_VIDEO_SLIDER_13", async ({ page, theme, conf }) => {
    await test.step("Update section Video Slider", async () => {
      const shopTheme = await theme.single(shopThemeId);
      shopTheme.settings_data.pages.home.default = shopTheme.settings_data.pages.home.default.filter(
        section => section.type !== "video-slider",
      );
      const res = await theme.updateThemeSettings({
        shopThemeId: shopTheme.id,
        updateSections: { home: shopTheme.settings_data.pages.home },
        settingsData: shopTheme.settings_data,
      });
      expect(res.id).toBe(shopTheme.id);
    });

    await test.step("Check display Video Slider", async () => {
      await goToHomePage(page, conf.suiteConf.domain);
      expect(await page.isHidden(videoSliderSection)).toBeTruthy();
    });
  });
});
