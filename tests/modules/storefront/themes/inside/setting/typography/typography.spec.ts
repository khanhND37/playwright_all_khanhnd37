import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { cloneDeep } from "@utils/object";
import { snapshotDir, waitSelector } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import type { ShopTheme } from "@types";

test.describe("Inside typography @TS_SB_OLS_THE_INS_SF_TYPOGRAPHY_SETTING", () => {
  test.slow();

  const caseName = "DATA_DRIVEN";
  const conf = loadData(__dirname, caseName);

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

  for (let dataIndex = 0; dataIndex < conf.caseConf.data.length; dataIndex++) {
    const data = conf.caseConf.data[dataIndex];

    test(`@${data.case_id} Typography_Check hiển thị font + Base size + Capitalize headings, buttons text ${data.case_name}`, async ({
      conf,
      api,
      context,
      theme,
      snapshotFixture,
    }) => {
      await theme.updateThemeSettings({
        updateSections: data.change_settings,
        settingsData: cloneDeep(shopTheme.settings_data),
        shopThemeId: shopTheme.id,
      });

      await test.step(`Open homepage ngoài SF, check font, font size, font weight`, async () => {
        await homePage.gotoHomePage();
        await homePage.waitResponseWithUrl("/assets/landing.css");
        await homePage.genLoc(homePage.xpathHeaderLogoText).evaluate(el => (el.style.display = "none"));
        await homePage.genLoc(homePage.xpathFooterCopyright).evaluate(el => (el.style.display = "none"));
        await homePage.visiblityHideAllImg();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathAnnouncementBar,
          snapshotName: data.expected.snapshot_announcement,
          combineOptions: {
            animations: "disabled",
            expectToPass: {
              timeout: 15000,
            },
          },
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathHeader,
          snapshotName: data.expected.snapshot_header,
          combineOptions: {
            animations: "disabled",
            expectToPass: {
              timeout: 15000,
            },
          },
        });
        await homePage.genLoc(homePage.xpathFooterSection).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathFooterSection,
          snapshotName: data.expected.snapshot_footer,
          combineOptions: {
            animations: "disabled",
            expectToPass: {
              timeout: 15000,
            },
          },
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathMain,
          snapshotName: data.expected.snapshot_home,
          combineOptions: {
            animations: "disabled",
            expectToPass: {
              timeout: 15000,
            },
          },
        });
      });

      await test.step(`Open cart drawer`, async () => {
        const cartToken = await homePage.page.evaluate(() => window.localStorage.getItem("cartToken"));
        await api.request(
          {
            url: `https://${conf.suiteConf.domain}/api/checkout/next/cart.json?cart_token=${cartToken}`,
            method: "PUT",
            request: {
              data: {
                cartItem: {
                  variant_id: conf.suiteConf.variant_id,
                  qty: 1,
                  properties: [],
                },
                from: "add-to-cart",
              },
            },
            response: {
              status: 200,
              data: {},
            },
          },
          { autoAuth: false, context: context.request },
        );
        await homePage.page.reload();
        await homePage.waitResponseWithUrl("/assets/theme.css");
        await homePage.genLoc(homePage.xpathCartIcon).click();
        await waitSelector(homePage.page, `:nth-match(${homePage.xpathCartDrawerProduct}, 1)`);
        await homePage.visiblityHideAllImg();
        await homePage.genLoc(homePage.xpathCartDrawerClose).hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathCartDrawerContainer,
          snapshotName: data.expected.snapshot_cart_drawer,
          combineOptions: {
            animations: "disabled",
            expectToPass: {
              timeout: 15000,
            },
          },
        });
        await homePage.genLoc(homePage.xpathCartDrawerClose).click();
      });

      let useRouter = true;
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        await test.step(`Open ${step.title} page`, async () => {
          await homePage.goto(step.path, useRouter);
          useRouter = typeof homePage[step.selector] === "undefined";
          if (await homePage.notFoundTitle.isVisible()) {
            await homePage.page.reload({ waitUntil: "networkidle" });
          }

          await homePage.visiblityHideAllImg();
          await snapshotFixture.verifyWithAutoRetry({
            page: homePage.page,
            selector: homePage[step.selector || ""] || homePage.xpathMain,
            snapshotName: step.expected_snapshot,
            combineOptions: {
              animations: "disabled",
              expectToPass: {
                timeout: 15000,
              },
            },
          });
        });
      }

      await test.step(`Click language + currency cuối page`, async () => {
        await homePage.genLoc(homePage.xpathCurrencyLanguage).click();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: `${homePage.xpathCurrencyLanguageModal} .inside-modal__body`,
          snapshotName: data.expected.snapshot_currency_language_modal,
          combineOptions: {
            animations: "disabled",
            expectToPass: {
              timeout: 15000,
            },
          },
        });
      });
    });
  }
});
