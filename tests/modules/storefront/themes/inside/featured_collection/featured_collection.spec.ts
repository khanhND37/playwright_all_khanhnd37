import { test } from "@fixtures/theme";
import { expect } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";

/*
- Setup shop data:
  + Created Collections : Collection 1 with handle collection-1, Collection 2 with handle collection-2
 */

let shopTheme: ShopTheme;
test.describe("Verify Featured collection section in Storefront @TS_SB_OLS_THE_INS_SF_FEATURED_COLLECTION", () => {
  const sectionSelector = "//section[@type='featured-collection'][1]";
  const selectorProduct =
    "(//section[@type='featured-collection'])[1]//div[contains(@class,'collection-product-wrap')]";
  let lastImgSelector = "(//section[@type='featured-collection'][1]//img)[last()]";

  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
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

  test(`@SB_OLS_THE_INS_SF_FEATURED_COLLECTION_1 Check display show Featured Collection section on SF with data default`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Open homepage SF with slide show data default", async () => {
      const navigationPage = new SFHome(page, conf.suiteConf.domain);
      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: sectionSelector,
        snapshotName: conf.caseConf.snapshot,
      });
    });
  });

  const conf = loadData(__dirname, "CHANGE_SETTINGS");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const { data, case_id: id, description, expected } = conf.caseConf.data[i];
    test(`@${id} ${description}`, async ({ page, theme, snapshotFixture }) => {
      const domain = conf.suiteConf.domain;
      const homePage = new SFHome(page, domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        if (data) {
          shopTheme = await theme.updateSection({
            updateSection: data as unknown as Record<string, ThemeSection>,
            settingsData: shopTheme.settings_data,
            shopThemeId: shopTheme.id,
          });
        }
      });
      await test.step("Verify Featured Collection shown on SF ", async () => {
        await homePage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await page.reload();
        await page.waitForLoadState("networkidle");
        await page.locator(sectionSelector).scrollIntoViewIfNeeded();
        await page.waitForLoadState("load");
        //wait image of collection load
        if (expected.layout === "slider") {
          lastImgSelector = `(//section[@type='featured-collection'][1]//img)[${expected.product_per_row}]`;
        }
        await waitForImageLoaded(page, lastImgSelector);

        //verify limit  product in section
        await expect(page.locator(selectorProduct)).toHaveCount(expected.limit);

        //verify capture section
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: sectionSelector,
          snapshotName: expected.snapshot,
        });

        // verify section when click next back with layout slider
        if (expected.layout === "slider") {
          await page.click(`${sectionSelector}//button[@aria-label='Previous page']`);
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: sectionSelector,
            snapshotName: expected.snapshot,
            combineOptions: {
              animations: "disabled",
            },
          });
          await page.click(`${sectionSelector}//button[@aria-label='Next page']`);
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: sectionSelector,
            snapshotName: expected.snapshot_next,
            combineOptions: {
              animations: "disabled",
            },
          });
        }

        //verify redirect to Collection page when click View more
        if (expected.button_view_more) {
          await verifyRedirectUrl({
            page: page,
            selector: "//section[@type='featured-collection'][1]//a[contains(@class,'view-more')]",
            redirectUrl: expected.collection_link,
          });
        }
      });
    });
  }
});
