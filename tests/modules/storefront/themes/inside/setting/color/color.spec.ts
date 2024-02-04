import { test, expect } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { loadData } from "@core/conf/conf";
import { snapshotDir } from "@utils/theme";
import { cloneDeep } from "@utils/object";
import type { ShopTheme } from "@types";

test.describe("Inside color @TS_SB_OLS_THE_INS_SF_COLLOR_SETTING", () => {
  test.slow();

  const caseName = "DATA_DRIVEN";
  const conf = loadData(__dirname, caseName);

  let shopTheme: ShopTheme;
  let homePage: SFHome;

  test.beforeEach(async ({ theme, page, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    shopTheme = await theme.single(conf.suiteConf.theme_id);
    homePage = new SFHome(page, conf.suiteConf.domain);
  });

  test.afterEach(async ({ theme, conf }) => {
    await theme.update(conf.suiteConf.theme_id, shopTheme.settings_data);
  });

  for (let dataIndex = 0; dataIndex < conf.caseConf.data.length; dataIndex++) {
    const data = conf.caseConf.data[dataIndex];
    test(`@${data.case_id} Color_Check ${data.case_name}`, async ({ theme, snapshotFixture }) => {
      await test.step(`Change settings color`, async () => {
        await theme.updateThemeSettings({
          updateSections: data.settings_data,
          settingsData: cloneDeep(shopTheme.settings_data),
          shopThemeId: shopTheme.id,
        });
      });
      await test.step(`Open Homepage, check hiển thị color`, async () => {
        await homePage.gotoHomePage();
        await homePage.waitResponseWithUrl("/assets/landing.css");
        await homePage.visiblityHideAllImg();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathMain,
          snapshotName: data.expected.snapshot_home,
          combineOptions: {
            animations: "disabled",
          },
        });
      });
      await test.step(`Open Product page, check hiển thị color đã setting`, async () => {
        await homePage.goto("products/product-example", true);
        await homePage.visiblityHideAllImg();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathHeader,
          snapshotName: data.expected.snapshot_header,
          combineOptions: {
            animations: "disabled",
          },
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathFooterSection,
          snapshotName: data.expected.snapshot_footer,
          combineOptions: {
            animations: "disabled",
          },
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathMain,
          snapshotName: data.expected.snapshot_product,
          combineOptions: {
            animations: "disabled",
          },
        });
      });
      await test.step(`Open customer account`, async () => {
        await homePage.goto("login", true);
      });
      await test.step(`Nhập email, password sai`, async () => {
        await homePage
          .genLoc(homePage.xpathLoginPage)
          .getByRole("textbox")
          .and(homePage.genLoc("[name='email']"))
          .fill(data.input.wrong.email);
        await homePage
          .genLoc(homePage.xpathLoginPage)
          .getByRole("textbox")
          .and(homePage.genLoc("[name='password']"))
          .fill(data.input.wrong.password);
      });
      await test.step(`Click button Sign in`, async () => {
        await homePage.genLoc(homePage.xpathLoginPage).getByRole("button", { name: "Sign in" }).click();
        await homePage.page.getByRole("alert").waitFor({ state: "visible" });
        await expect(homePage.page.getByRole("alert")).toHaveCSS("background-color", data.expected.alert_wrong);
        await homePage.page.getByRole("alert").waitFor({ state: "detached" });
      });
      await test.step(`Nhập email, password đúng`, async () => {
        await homePage
          .genLoc(homePage.xpathLoginPage)
          .getByRole("textbox")
          .and(homePage.genLoc("[name='password']"))
          .fill(data.input.success.password);
      });
      await test.step(`Click button Sign in`, async () => {
        await homePage.genLoc(homePage.xpathLoginPage).getByRole("button", { name: "Sign in" }).click();
        await homePage.page.getByRole("alert").waitFor({ state: "visible" });
        await expect(homePage.page.getByRole("alert")).toHaveCSS("background-color", data.expected.alert_success);
      });
    });
  }

  test(`@SB_OLS_THE_INS_SF_COLLOR_SETTING_81 Color_Check sync/unsync color`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);

    await test.step(`Chuyển sang tab Settings, chọn Color`, async () => {
      await themeDashboard.openThemeEditor(shopTheme.id);
      await themeDashboard.openSetting("Colors");
      await themeDashboard.genLoc(themeDashboard.referenceExpandSelector).click();
    });

    for (let stepIndex = 0; stepIndex < conf.caseConf.steps.length; stepIndex++) {
      const step = conf.caseConf.steps[stepIndex];
      if (step === "sync") {
        await test.step(`Check các field sync với Primary`, async () => {
          for (let i = 0; i < conf.caseConf.widgets.length; i++) {
            const widget = conf.caseConf.widgets[i];
            await expect(themeDashboard.genLoc(`[data-key='${widget}'] ${themeDashboard.iconUnSync}`)).toBeVisible();
          }
        });

        await test.step(`Thay đổi màu của Primary -> click Save`, async () => {
          for (let i = 0; i < conf.caseConf.widgets.length; i++) {
            const widget = conf.caseConf.widgets[i];
            await themeDashboard.onClickIconSync(`[data-key='${widget}']`);
          }

          await themeDashboard
            .genLoc(`${themeDashboard.widgetColorPrimary} input`)
            .first()
            .fill(conf.caseConf.expected.hex_sync);

          await themeDashboard.genLoc(themeDashboard.titleEditor).click();

          for (let i = 0; i < conf.caseConf.widgets.length; i++) {
            const widget = conf.caseConf.widgets[i];
            await expect(themeDashboard.genLoc(`[data-key='${widget}'] input`)).toHaveValue(
              conf.caseConf.expected.hex_sync,
            );
          }
          await themeDashboard.saveTheme();
        });
      } else {
        await test.step(`Trong dashboard, unsync một vài field`, async () => {
          for (let i = 0; i < conf.caseConf.widgets_unsync.length; i++) {
            const widget = conf.caseConf.widgets_unsync[i];
            await themeDashboard.onClickIconSync(`[data-key='${widget}']`);
          }
        });

        await test.step(`Thay đổi màu của Primary`, async () => {
          await themeDashboard
            .genLoc(`${themeDashboard.widgetColorPrimary} input`)
            .first()
            .fill(conf.caseConf.expected.hex_unsync);

          for (let i = 0; i < conf.caseConf.widgets_sync.length; i++) {
            const widget = conf.caseConf.widgets_sync[i];
            await expect(themeDashboard.genLoc(`[data-key='${widget}'] input`)).toHaveValue(
              conf.caseConf.expected.hex_unsync,
            );
          }

          for (let i = 0; i < conf.caseConf.widgets_unsync.length; i++) {
            const widget = conf.caseConf.widgets_unsync[i];
            await expect(themeDashboard.genLoc(`[data-key='${widget}'] input`)).toHaveValue(
              conf.caseConf.expected.hex_sync,
            );
          }
          await themeDashboard.saveTheme();
        });
      }

      await test.step(`Mở Homepage ngoài SF, check hiển thị màu của các field sync với màu của Primary`, async () => {
        await homePage.gotoHomePage();
        await homePage.waitResponseWithUrl("/assets/landing.css");
        await homePage.visiblityHideAllImg();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathMain,
          snapshotName: conf.caseConf.expected[`snapshot_home_${step}`],
          combineOptions: {
            animations: "disabled",
          },
        });
      });

      await test.step(`Mở Product page,  check hiển thị màu của các field sync với màu của Primary`, async () => {
        await homePage.goto("products/product-example", true);
        await homePage.visiblityHideAllImg();
        await homePage.genLoc(homePage.xpathHeaderMenuHome).hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathHeader,
          snapshotName: conf.caseConf.expected[`snapshot_header_${step}`],
          combineOptions: {
            animations: "disabled",
          },
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathFooterSection,
          snapshotName: conf.caseConf.expected[`snapshot_footer_${step}`],
          combineOptions: {
            animations: "disabled",
          },
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: homePage.xpathMain,
          snapshotName: conf.caseConf.expected[`snapshot_product_${step}`],
          combineOptions: {
            animations: "disabled",
          },
        });
      });
    }
  });
});
