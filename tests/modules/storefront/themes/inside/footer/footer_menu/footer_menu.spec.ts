import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeFixed } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify footer menu section @TS_INS_SF_FOOTER_MENU", async () => {
  const sectionFooter = ".footer-section";
  const sectionFooterMenu = "[type='footer-menu']";
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

  const conf = loadData(__dirname, "FOOTER_MENU");
  for (let i = 0; i < conf.caseConf.length; i++) {
    const dataSetting = conf.caseConf[i];
    test(`${dataSetting.description} @${dataSetting.id}`, async ({ page, pageMobile, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, conf.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      const { desktop } = dataSetting.expect;
      if (desktop) {
        await test.step("Verify section Footer menu on web", async () => {
          await navigationPage.gotoHomePage();
          await page.waitForLoadState("networkidle");
          await page.locator(sectionFooter).scrollIntoViewIfNeeded();
          if (desktop.visible) {
            await snapshotFixture.verify({
              page: page,
              selector: sectionFooterMenu,
              snapshotName: desktop.screenshot_setting_data,
            });
          } else
            await snapshotFixture.verify({
              page: page,
              selector: sectionFooter,
              snapshotName: desktop.screenshot_setting_data,
            });
        });

        if (desktop.link_text_url) {
          await test.step("Verify click link text", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: "[type= 'footer-menu'] a >> nth=1",
              redirectUrl: desktop.link_text_url.url,
            });
          });

          await test.step("Go back previous page", async () => {
            await page.goBack();
          });

          await page.locator(sectionFooterMenu).scrollIntoViewIfNeeded();

          await test.step("Verify click on other text (not text link)", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: "[type= 'footer-menu'] strong",
              redirectUrl: conf.suiteConf.domain,
            });
          });
        }

        if (desktop.link_menu) {
          await page.locator(sectionFooterMenu).scrollIntoViewIfNeeded();
          await verifyRedirectUrl({
            page: page,
            selector: `css=.site-footer__menu a>>text=${desktop.link_menu.link_text}`,
            redirectUrl: desktop.link_menu.url,
            waitForElement: ".other-page",
          });
        }
      }

      const navigationMobilePage = new SFHome(pageMobile, conf.suiteConf.domain);
      const { mobile } = dataSetting.expect;
      if (mobile) {
        await test.step("Verify section Footer menu on mobile", async () => {
          await navigationMobilePage.gotoHomePage();
          await pageMobile.waitForLoadState("networkidle");
          await pageMobile.locator(sectionFooterMenu).scrollIntoViewIfNeeded();
          await snapshotFixture.verify({
            page: pageMobile,
            selector: sectionFooterMenu,
            snapshotName: mobile.screenshot_setting_data,
          });
        });
      }
    });
  }
});
