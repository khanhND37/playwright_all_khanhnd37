import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir } from "@utils/theme";
import { cloneDeep } from "@utils/object";
import { expect } from "@playwright/test";
import { ThemeFixed } from "@types";

let shopTheme: ShopTheme;

test.describe("Verify setting section theme Roller @SB_OLS_THE_ROLV3", () => {
  test.beforeAll(async ({ theme }) => {
    await test.step("Create theme by API", async () => {
      const res = await theme.create(2);
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
  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`Theme Roller - Verify test apply setting Header trong theme edit setting @SB_OLS_THE_ROLV3_30`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const header = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionHeader = navigationPage.xpathHeader;

    await test.step("Setting Header trong theme editor", async () => {
      shopTheme = await theme.updateSection({
        updateSection: header as Record<string, ThemeFixed>,
        settingsData: shopTheme.settings_data,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify section Header on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionHeader).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionHeader,
        snapshotName: header.expect.screenshot_setting_header,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Footer trong theme edit setting @SB_OLS_THE_ROLV3_29`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const footer = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionFooter = navigationPage.xpathFooter;

    await test.step("Setting Footer trong theme editor", async () => {
      shopTheme = await theme.updateSection({
        updateSection: footer as Record<string, ThemeFixed>,
        settingsData: shopTheme.settings_data,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify section Footer on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionFooter).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionFooter,
        snapshotName: footer.expect.screenshot_setting_footer,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Slideshow trong theme edit setting @SB_OLS_THE_ROLV3_24`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const slideShow = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionSlideShow = navigationPage.xpathSlideShow;

    await test.step("Setting Slideshow trong theme editor", async () => {
      shopTheme = await theme.updateSection({
        updateSection: slideShow as Record<string, ThemeSection>,
        settingsData: shopTheme.settings_data,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify section SlideShow on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionSlideShow).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionSlideShow,
        snapshotName: slideShow.expect.screenshot_setting_slideshow,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Featured Collection trong theme edit setting @SB_OLS_THE_ROLV3_20`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const featuredCollection = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionfeaturedCollection = navigationPage.xpathFeaturedCollection;

    await test.step("Setting Featured Collection trong theme editor", async () => {
      shopTheme = await theme.updateSection({
        updateSection: featuredCollection as Record<string, ThemeSection>,
        settingsData: shopTheme.settings_data,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify section Featured Collection on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionfeaturedCollection).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionfeaturedCollection,
        snapshotName: featuredCollection.expect.screenshot_setting_featuredCollection,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Collection List trong theme edit setting @SB_OLS_THE_ROLV3_17`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const collectionList = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionCollectionList = navigationPage.xpathCollectionList;

    await test.step("Setting Collection List trong theme editor", async () => {
      shopTheme = await theme.updateSection({
        updateSection: collectionList as Record<string, ThemeSection>,
        settingsData: shopTheme.settings_data,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify section Collection List on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionCollectionList).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionCollectionList,
        snapshotName: collectionList.expect.screenshot_setting_collectionList,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Footer background @SB_OLS_THE_ROLV3_TS_9`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const dataColor = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionFooter = navigationPage.xpathFooter;

    await test.step("Setting Footer background trong theme editor", async () => {
      await theme.updateThemeSettings({
        updateSections: dataColor.settings_data,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify Footer background on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionFooter).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionFooter,
        snapshotName: dataColor.expect.screenshot_setting_footerBackground,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Featured Product trong theme edit setting @SB_OLS_THE_ROLV3_15`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const featuredProduct = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionFeaturedProduct = navigationPage.xpathFeaturedProduct;
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    await test.step("Setting Featured Product trong theme editor", async () => {
      shopTheme = await theme.addSection({
        addSection: featuredProduct.input as Record<string, ThemeSection>,
        settingsData: shopTheme.settings_data,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify section Featured Product on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(sectionFeaturedProduct).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionFeaturedProduct,
        snapshotName: featuredProduct.expect.screenshot_setting_featuredProduct,
      });
    });
  });

  test(`Theme Roller - Verify test apply setting Color Price và Compare at price trong theme edit setting @SB_OLS_THE_ROLV3_TS_16`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const dataPriceColor = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    await test.step("Setting Color Price và Compare at price trong theme editor", async () => {
      await theme.updateThemeSettings({
        updateSections: dataPriceColor.settings_data,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify Color Price và Compare at price on Product Page", async () => {
      await navigationPage.gotoProduct(dataPriceColor.product_handle);
      await page.locator(navigationPage.xpathPriceOnProductPage).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: navigationPage.xpathPriceOnProductPage,
        snapshotName: dataPriceColor.expect.screenshot_setting_priceColor,
      });
    });
  });

  test(`Theme Roller - Verify test setting Cart goal @SB_OLS_THE_ROLV3_1`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const dataCart = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const mainContent = navigationPage.xpathMainContent;

    await test.step("Setting Cart goal trong theme editor", async () => {
      await theme.updateThemeSettings({
        updateSections: dataCart.settings_data,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify setting Cart goal on Cart page khi chưa add product", async () => {
      await navigationPage.gotoHomePage("/cart", true);
      await page.locator(mainContent).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: mainContent,
        snapshotName: dataCart.expect.screenshot_setting_cart_goal,
      });
    });
    await test.step("Verify setting Cart goal on Cart page khi đã add product", async () => {
      await navigationPage.gotoProduct(dataCart.product_handle);
      await page.locator(navigationPage.xpathButtonAddtocart).click();
      await page.waitForLoadState("networkidle");
      const cartGoalMessage = page.locator(navigationPage.xpathCartGoalMessage);
      await expect(cartGoalMessage).toHaveText(dataCart.expect.cart_goal_reach_message);
    });
  });

  test(`Theme Roller - Verify test setting Supported language = Some languages @SB_OLS_THE_ROLV3_TS_70`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionFooter = navigationPage.xpathFooter;
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }
    for (let dataIndex = 0; dataIndex < conf.caseConf.data.length; dataIndex++) {
      const dataLanguage = conf.caseConf.data[dataIndex];
      await test.step("Setting language trong theme settings", async () => {
        await theme.updateThemeSettings({
          updateSections: dataLanguage.settings_data,
          settingsData: cloneDeep(shopTheme.settings_data),
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify setting language tại Footer", async () => {
        await navigationPage.gotoHomePage("", true);
        await page.locator(sectionFooter).scrollIntoViewIfNeeded();
        await page.locator(navigationPage.xpathCurrencyLanguageRoller).click();
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: navigationPage.xpathLanguageList,
          snapshotName: dataLanguage.expect.screenshot_setting_language,
        });
      });
    }
  });

  test(`Theme Roller - Verify test setting Supported currencies = Some currencies @SB_OLS_THE_ROLV3_TS_75`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const sectionFooter = navigationPage.xpathFooter;
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }
    for (let dataIndex = 0; dataIndex < conf.caseConf.data.length; dataIndex++) {
      const dataCurrency = conf.caseConf.data[dataIndex];
      await test.step("Setting Supported currencies trong theme settings", async () => {
        await theme.updateThemeSettings({
          updateSections: dataCurrency.settings_data,
          settingsData: cloneDeep(shopTheme.settings_data),
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify setting Supported currencies tại Footer", async () => {
        await navigationPage.gotoHomePage("", true);
        await page.locator(sectionFooter).scrollIntoViewIfNeeded();
        await page.locator(navigationPage.xpathCurrencyLanguageRoller).click();
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: navigationPage.xpathCurrencyList,
          snapshotName: dataCurrency.expect.screenshot_setting_currency,
        });
      });
    }
  });

  test(`Theme Roller - Verify test apply setting Typography Heading font and base size @SB_OLS_THE_ROLV3_TS_26`, async ({
    page,
    theme,
    conf,
    snapshotFixture,
  }) => {
    const typoHeading = conf.caseConf.data;
    const navigationPage = new SFHome(page, conf.suiteConf.domain);
    const richText = navigationPage.xpathRichText;

    await test.step("Setting Typography Heading font and base size trong theme editor", async () => {
      await theme.updateThemeSettings({
        updateSections: typoHeading.settings_data,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify Typography Heading font and base size on SF", async () => {
      await navigationPage.gotoHomePage("", true);
      await page.locator(richText).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: richText,
        snapshotName: typoHeading.expect.screenshot_setting_typoHeading,
      });
    });
  });
});
