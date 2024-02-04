import type { ShopTheme } from "@types";
import { test, expect } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir } from "@utils/theme";
import { cloneDeep } from "@utils/object";
import { waitForProgressBarDetached } from "@utils/storefront";

test.describe("InCart Offer @TS_SB_OLS_THE_INS_SF_ANNOUNCEMENT_BAR", () => {
  let shopTheme: ShopTheme;
  let homePage: SFHome;

  test.beforeAll(async ({ theme, conf }) => {
    shopTheme = await theme.single(conf.suiteConf.theme_id);
  });
  test.beforeEach(async ({ page, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    homePage = new SFHome(page, conf.suiteConf.domain);
  });
  test.afterAll(async ({ theme, conf }) => {
    await theme.update(conf.suiteConf.theme_id, shopTheme.settings_data);
  });

  test(`@SB_OLS_THE_INS_SF_ANNOUNCEMENT_BAR_1 Announcement bar_Check hiển thị Announcement bar ngoài SF với data default`, async () => {
    await test.step(`Mở announcement ngoài SF với data mặc định`, async () => {
      await homePage.gotoHomePage();
      await expect(homePage.genLoc(homePage.xpathAnnouncementBar)).toBeHidden();
      await homePage.page.close();
    });
  });

  test(`@SB_OLS_THE_INS_SF_ANNOUNCEMENT_BAR_2 Announcement bar_Check hiển thị announcement bar có content chứa text có style, có link điều hướng`, async ({
    theme,
    cConf,
    snapshotFixture,
  }) => {
    await test.step(`Open shop ngoài SF, check hiển thị announcement`, async () => {
      // Update setting section
      await theme.updateSection({
        updateSection: cConf.section,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });

      await homePage.gotoHomePage();
      await snapshotFixture.verify({
        page: homePage.page,
        selector: homePage.xpathAnnouncementBar,
        snapshotName: cConf.expected.snapshot,
      });
    });

    await test.step(`Click vào link text: a link`, async () => {
      await homePage.genLoc(`${homePage.xpathAnnouncementBar} .announcement-bar-section__content a`).click();
      await waitForProgressBarDetached(homePage.page);
      expect(homePage.page.url()).toContain(cConf.expected.pathName);
      await homePage.page.goBack();
      await waitForProgressBarDetached(homePage.page);
    });

    await test.step(`Click vào các text khác text "a link"`, async () => {
      await homePage.genLoc(`${homePage.xpathAnnouncementBar} .announcement-bar-section`).click();
      await waitForProgressBarDetached(homePage.page);
      expect(homePage.page.url()).toContain(cConf.expected.pathName);
    });
  });

  test(`@SB_OLS_THE_INS_SF_ANNOUNCEMENT_BAR_3 Announcement bar_Check hiển thị announcement bar có content chứa text có style, không có link điều hướng, background có opacity`, async ({
    theme,
    cConf,
    snapshotFixture,
  }) => {
    await test.step(`Open shop ngoài SF, check hiển thị announcement`, async () => {
      // Update setting section
      await theme.updateSection({
        updateSection: cConf.section,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });

      await homePage.gotoHomePage();
      await snapshotFixture.verify({
        page: homePage.page,
        selector: homePage.xpathAnnouncementBar,
        snapshotName: cConf.expected.snapshot,
      });
    });

    await test.step(`Click vào link text: a link`, async () => {
      await homePage.genLoc(`${homePage.xpathAnnouncementBar} .announcement-bar-section__content a`).click();
      await homePage.page.waitForLoadState("networkidle");
      expect(homePage.page.url()).toContain(cConf.expected.pathName);
      await homePage.page.goBack();
    });

    await test.step(`Click vào các text khác text "a link"`, async () => {
      await homePage.genLoc(`${homePage.xpathAnnouncementBar} .announcement-bar-section`).click();
      expect(homePage.page.url()).toContain("/");
    });
  });
});
