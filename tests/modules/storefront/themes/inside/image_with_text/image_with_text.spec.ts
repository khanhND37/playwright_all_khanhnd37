import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyCountSelector, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { waitForProgressBarDetached } from "@utils/storefront";
import type { ShopTheme, ThemeSection } from "@types";
import { loadData } from "@core/conf/conf";

/*
- Setup shop data:
  + "product 1" with handle = product-1
  + "product test" with handle = product-test
  + "collection 1" with handle = collection-1
  + page "Contact us" with handle = contact-us
 */

let shopTheme: ShopTheme;

test.describe("Verify Image with text section in Storefront @TS_INS_SF_IMAGE_WITH_TEXT", () => {
  const sectionSelector = "[type='image-with-text']";

  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test.beforeAll(async ({ theme }) => {
    const res = await theme.create(3);
    await theme.publish(res.id);

    const resList = await theme.list();
    const shopThemeId = resList.find(shopTheme => shopTheme.active !== true);
    if (shopThemeId) {
      await theme.delete(shopThemeId.id);
    }
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const image = conf.caseConf.data[i];

    test(`${image.description} @${image.id}`, async ({ page, theme, snapshotFixture }) => {
      const domain = conf.suiteConf.domain;
      const homePage = new SFHome(page, domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        if (image.input) {
          shopTheme = await theme.updateSection({
            shopThemeId: shopTheme.id,
            updateSection: image.input as unknown as Record<string, ThemeSection>,
            settingsData: shopTheme.settings_data,
          });
        }
      });

      await test.step("Verify show section on SF", async () => {
        await homePage.gotoHomePage();
        await homePage.page.waitForLoadState("networkidle");
        await waitForImageLoaded(homePage.page, sectionSelector);

        if (typeof image.expect.count_section !== "undefined") {
          await verifyCountSelector(homePage.page, sectionSelector, image.expect.count_section);
        }

        if (image.expect.snapshot) {
          await snapshotFixture.verify({
            page: homePage.page,
            selector: `${sectionSelector} >> nth=0`,
            snapshotName: image.expect.snapshot,
          });
        }
      });

      await test.step("Verify navigation page", async () => {
        // when click on image link
        if (image.expect.blocks) {
          const contentWrap = `${sectionSelector} .feature-set-content-wrap`;
          for (const block of image.expect.blocks) {
            if (typeof block.image_link !== "undefined") {
              const imageSelector = block.image_link ? "a" : "";

              await verifyRedirectUrl({
                page: homePage.page,
                selector: `:nth-match(${contentWrap}, ${block.index_block}) .feature-image ${imageSelector}`,
                redirectUrl: block.image_link,
              });

              if (block.image_link) {
                await homePage.page.goBack();
                await waitForProgressBarDetached(homePage.page);
              }
            }

            // when click on button link
            if (typeof block.button_link !== "undefined") {
              await verifyRedirectUrl({
                page: homePage.page,
                selector: `:nth-match(${contentWrap}, ${block.index_block}) .btn-wrap a`,
                redirectUrl: block.button_link,
              });

              if (block.button_link) {
                await homePage.page.goBack();
                await waitForProgressBarDetached(homePage.page);
              }
            }
          }
        }
      });
    });
  }

  test("Verify duplicate section @SB_OLS_THE_INS_SF_IMAGE_WITH_TEXT_10", async ({
    page,
    conf,
    theme,
    snapshotFixture,
  }) => {
    const shop = conf.suiteConf.domain;
    const homePage = new SFHome(page, shop);

    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    let numberOfSection = shopTheme.settings_data.pages.home.default.filter(
      section => section.type === "image-with-text" && section.visible === true,
    ).length;
    numberOfSection += conf.caseConf.data.input.length;

    for (const section of conf.caseConf.data.input) {
      shopTheme = await theme.addSection({
        shopThemeId: shopTheme.id,
        settingsData: shopTheme.settings_data,
        addSection: section,
      });
    }

    await homePage.gotoHomePage();
    await page.waitForLoadState("networkidle");
    await waitForImageLoaded(page, sectionSelector);
    const snapshots = conf.caseConf.data.expect.snapshot.split(",");
    let index = snapshots.length - 1;

    for (let i = numberOfSection; i > conf.caseConf.data.input.length; i--) {
      await snapshotFixture.verify({
        page: page,
        selector: `${sectionSelector} >> nth=${i - 1}`,
        snapshotName: snapshots[index--].trim(),
      });
    }
  });

  test("Verify section position @SB_OLS_THE_INS_SF_IMAGE_WITH_TEXT_11", async ({
    page,
    conf,
    theme,
    snapshotFixture,
  }) => {
    const shop = conf.suiteConf.domain;
    const homePage = new SFHome(page, shop);

    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }
    shopTheme = await theme.updateThemeSettings({
      shopThemeId: shopTheme.id,
      settingsData: shopTheme.settings_data,
      updateSections: conf.caseConf.data.input,
    });

    await homePage.gotoHomePage();
    await page.waitForLoadState("networkidle");
    await waitForImageLoaded(page, sectionSelector);
    await snapshotFixture.verify({
      page: page,
      snapshotName: conf.caseConf.data.expect.snapshot,
    });
  });
});
