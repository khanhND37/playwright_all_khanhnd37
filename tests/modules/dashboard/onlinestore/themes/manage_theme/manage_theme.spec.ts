import { loadData } from "@core/conf/conf";
import { expect, test } from "@fixtures/theme";
import { verifyRedirectUrl, waitForImageLoaded } from "@core/utils/theme";
import { ThemeAPI } from "@pages/api/dashboard/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { Page } from "@playwright/test";

let dashboardPage: DashboardPage;
let themesPage: OnlineStorePage;
let themeAPI: ThemeAPI;
let firstThemeInMoreThemes;
let accessToken;

test.describe("Check theme's actions functions @SB_OLS_THE", () => {
  test.beforeEach(async ({ dashboard, authRequest, conf, theme }) => {
    themeAPI = new ThemeAPI(conf.suiteConf.domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    themesPage = new OnlineStorePage(dashboard, conf.suiteConf.domain);
    await test.step("Clear templates", async () => {
      const listTemplate = await theme.list();
      if (listTemplate.length > 0) {
        for (const template of listTemplate) {
          if (template.id !== conf.suiteConf.theme_id.inside && template.id !== conf.suiteConf.theme_id.roller) {
            await theme.delete(template.id);
          }
        }
      }
    });

    await test.step("Go to Online Store > Themes", async () => {
      await dashboardPage.navigateToMenu(conf.suiteConf.menu);
    });
  });

  test.afterAll(async ({ theme, conf }) => {
    await test.step("Rename theme to original", async () => {
      await theme.updateTheme(conf.suiteConf.theme_id.inside, { id: conf.suiteConf.theme_id.inside, name: "Inside" });
      await theme.updateTheme(conf.suiteConf.theme_id.roller, { id: conf.suiteConf.theme_id.inside, name: "Roller" });
    });
  });

  test(`@SB_OLS_THE_01 - Check Preview theme `, async ({ dashboard, context, conf, snapshotFixture }) => {
    let previewThemePage: Page;
    for (const data of conf.caseConf.data) {
      const currentTheme = await dashboard.locator(themesPage.xpathCurrentTemplate).textContent();
      await test.step(`Preview theme ${data.preview_theme}`, async () => {
        if (currentTheme.includes(data.preview_theme)) {
          await themesPage.actionWithThemes({
            action: data.publish_action,
            themeName: data.theme_type,
          });
        }

        [previewThemePage] = await Promise.all([
          context.waitForEvent("page"),
          themesPage.actionWithThemes({
            action: data.preview_action,
            themeName: data.preview_theme,
          }),
        ]);
        await previewThemePage.waitForResponse(/theme.css/);
      });

      await test.step("Verify no css issue", async () => {
        const homeSF = new OnlineStorePage(previewThemePage, createThemeConf.suiteConf.domain);
        await homeSF.manageBar(data.close_editor);
        await previewThemePage.waitForTimeout(1000); //Đợi page stable rồi mới chụp ảnh
        await snapshotFixture.verifyWithAutoRetry({
          page: previewThemePage,
          selector: "//main[@role='main']",
          snapshotName: data.snapshot_name,
          combineOptions: {
            fullPage: true,
            animations: "disabled",
            mask: [
              previewThemePage.locator("//section[@type='slideshow']"),
              previewThemePage.locator("//div[contains(@class,'collection-list')]//div[@class='row']"),
              previewThemePage.locator("//section[contains(@class,'image-text-block')]"),
            ],
            maxDiffPixelRatio: 0.01,
          },
        });
      });

      await test.step("Close theme preview tab", async () => {
        await previewThemePage.close();
      });
    }
  });

  test("@SB_OLS_THE_02 - Check Publish theme", async ({ dashboard, context, conf, snapshotFixture }) => {
    let insideTheme: Page;
    await test.step(`Publish Inside theme`, async () => {
      const currentTheme = await dashboard.locator(themesPage.xpathCurrentTemplate).textContent();
      if (currentTheme.includes(conf.suiteConf.theme_names[0])) {
        await themesPage.actionWithThemes({
          action: conf.caseConf.actions[0],
          themeName: conf.suiteConf.theme_names[1],
        });
      }
      await themesPage.actionWithThemes({
        action: conf.caseConf.actions[0],
        themeName: conf.suiteConf.theme_names[0],
      });
    });

    await test.step("Go to Storefront", async () => {
      insideTheme = await verifyRedirectUrl({
        page: dashboard,
        selector: `//button[normalize-space()='${conf.caseConf.actions[1]}']`,
        redirectUrl: conf.suiteConf.domain,
        context,
      });
    });

    await test.step("Verify theme is published via API", async () => {
      const actualThemeId = await themeAPI.getPublishedThemeInfo();
      expect(actualThemeId).toMatchObject({
        shop_theme_id: conf.suiteConf.theme_id.inside,
      });
    });

    await test.step("Verify no css issue", async () => {
      const homeSF = new OnlineStorePage(insideTheme, conf.suiteConf.domain);
      await insideTheme.waitForSelector("#manage-bar");
      await homeSF.manageBar(conf.caseConf.actions[2]);
      await insideTheme.waitForTimeout(1000); //Đợi page stable rồi mới chụp ảnh
      await snapshotFixture.verifyWithAutoRetry({
        page: insideTheme,
        selector: "//main[@role='main']",
        snapshotName: conf.caseConf.snapshot_name,
        combineOptions: {
          expectToPass: {
            timeout: 30_000,
            intervals: [3_000],
          },
          animations: "disabled",
          mask: [
            insideTheme.locator("//section[@type='slideshow']"),
            insideTheme.locator("//div[contains(@class,'collection-list')]//div[@class='row']"),
          ],
          maxDiffPixelRatio: 0.01,
        },
      });

      await test.step("Close store front page", async () => {
        await insideTheme.close();
      });
    });
  });

  test("@SB_OLS_THE_03 - Check Rename theme", async ({ dashboard, conf }) => {
    const currentTheme = dashboard.locator(themesPage.xpathCurrentTemplate);
    const currentThemeName = await currentTheme.textContent();
    if (currentThemeName.includes(conf.suiteConf.theme_names[1])) {
      await themesPage.actionWithThemes({
        action: "Publish",
        themeName: conf.suiteConf.theme_names[0],
      });
    }

    await test.step("Rename current theme", async () => {
      await themesPage.actionWithThemes({
        action: conf.caseConf.action,
        section: conf.caseConf.section,
        themeName: conf.caseConf.theme_name,
        rename: conf.caseConf.name,
      });
    });

    await test.step("Verify rename successfully", async () => {
      await expect(currentTheme).toHaveText(conf.caseConf.name);
    });

    await test.step("Rename in more themes", async () => {
      await themesPage.actionWithThemes({
        action: conf.caseConf.action,
        themeName: conf.caseConf.rename.before,
        rename: conf.caseConf.rename.after,
      });
    });

    await test.step("Verify rename successfully", async () => {
      await expect(themesPage.moreTheme(conf.caseConf.rename.after)).toBeVisible();
    });

    await test.step("Verify renamed theme is in first place", async () => {
      firstThemeInMoreThemes = dashboard.locator(themesPage.xpathFirstThemeInMoreThemes).first();
      await expect(firstThemeInMoreThemes).toHaveText(conf.caseConf.rename.after);
    });

    await test.step("Rename theme after test", async () => {
      await themeAPI.renameTheme(conf.suiteConf.theme_id.inside, "Inside");
      await themeAPI.renameTheme(conf.suiteConf.theme_id.roller, "Roller");
    });
  });

  test("@SB_OLS_THE_04 - Check Duplicate theme", async ({ dashboard, theme, context, conf, snapshotFixture }) => {
    let duplicateThemeId: number;
    let listThemes;
    let previewDuplicate: Page;
    await test.step("Duplicate more themes", async () => {
      await themesPage.actionWithThemes({
        action: conf.caseConf.actions[0],
        themeName: conf.caseConf.theme_name,
      });
    });

    await test.step("Verify duplicate successfully", async () => {
      firstThemeInMoreThemes = dashboard.locator(themesPage.xpathFirstThemeInMoreThemes).first();
      await expect(firstThemeInMoreThemes).toHaveText(`Copy of ${conf.caseConf.theme_name}`);
    });

    await test.step("Preview duplicate theme", async () => {
      [previewDuplicate] = await Promise.all([
        context.waitForEvent("page"),
        themesPage.actionWithThemes({
          action: conf.caseConf.actions[1],
          themeName: `Copy of ${conf.caseConf.theme_name}`,
        }),
      ]);
      await previewDuplicate.waitForResponse(/theme.css/);
      await waitForImageLoaded(previewDuplicate, "//img[@alt='Visa']");
    });

    await test.step("Get duplicate theme id by API", async () => {
      listThemes = await theme.list();
      const duplicateThemeIndex = listThemes.length - 1;
      duplicateThemeId = listThemes[duplicateThemeIndex].id;
    });

    await test.step("Verify switch to preview Duplicate theme", async () => {
      await expect(previewDuplicate).toHaveURL(new RegExp(`theme_preview_id=${duplicateThemeId}`));
    });

    await test.step("Verify no css issue", async () => {
      const homeSF = new OnlineStorePage(previewDuplicate, conf.suiteConf.domain);
      await homeSF.manageBar(conf.caseConf.actions[2]);
      await previewDuplicate.waitForTimeout(1000); //Đợi page stable rồi mới chụp ảnh
      await snapshotFixture.verifyWithAutoRetry({
        page: previewDuplicate,
        selector: "//main[@role='main']",
        snapshotName: conf.caseConf.snapshot_name,
        combineOptions: {
          fullPage: true,
          animations: "disabled",
          mask: [
            previewDuplicate.locator("//section[@type='slideshow']"),
            previewDuplicate.locator("//div[contains(@class,'collection-list')]//div[@class='row']"),
            previewDuplicate.locator("//section[contains(@class,'image-text-block')]"),
          ],
          maxDiffPixelRatio: 0.01,
        },
      });
    });

    await test.step("Close preview duplicate theme", async () => {
      await previewDuplicate.close();
    });
  });

  test("@SB_OLS_THE_05 - Check Remove theme", async ({ dashboard, conf, theme }) => {
    await test.step("Create a template to remove", async () => {
      const themeInfo = await theme.create(3);
      await themeAPI.renameTheme(themeInfo.id, conf.caseConf.theme_name);
      await dashboard.reload();
    });

    await test.step("Remove theme", async () => {
      await themesPage.actionWithThemes({
        action: conf.caseConf.action,
        themeName: conf.caseConf.theme_name,
      });
    });

    await test.step("Verify theme is deleted", async () => {
      await expect(themesPage.moreTheme(conf.caseConf.theme_name)).toBeHidden();
    });
  });

  test("@SB_OLS_THE_06 - Check copy theme of another user", async ({ conf }) => {
    await test.step("Copy theme from another user", async () => {
      await themesPage.copyATheme(conf.caseConf.theme_id);
    });

    await test.step("Verify error message displays", async () => {
      const alert = themesPage.page.locator(themesPage.messageCopyTheme);
      await expect(alert).toHaveText(conf.caseConf.message);
    });

    await test.step("Close the popup", async () => {
      await themesPage.genLoc(themesPage.closePopup).click();
    });
  });

  const dataDriven1 = "CREATE_THEME";
  const createThemeConf = loadData(__dirname, dataDriven1);
  createThemeConf.caseConf.data.forEach(
    ({ case_id: caseId, theme_type: type, action: action, theme_name: name, snapshot_name: snapshotName }) => {
      test(`@${caseId} - Check create ${type} theme success `, async ({
        dashboard,
        theme,
        context,
        snapshotFixture,
      }) => {
        let newThemeTab: Page;
        await test.step(`Create ${type} theme`, async () => {
          await themesPage.createNew(createThemeConf.caseConf.tab, type);
        });

        const themeInfo = await theme.list();
        const newThemeIndex = themeInfo.length - 1;
        const newThemeInfo = themeInfo[newThemeIndex];
        const newThemeId = newThemeInfo.id;
        await themeAPI.renameTheme(newThemeId, name);
        await dashboard.reload({ waitUntil: "networkidle" });

        await test.step("Preview new created theme ", async () => {
          [newThemeTab] = await Promise.all([
            context.waitForEvent("page"),
            themesPage.actionWithThemes({
              action: action,
              themeName: name,
            }),
          ]);
          await newThemeTab.waitForResponse(/theme.css/);
        });

        await test.step("Verify switch to preview tab", async () => {
          await expect(newThemeTab).toHaveURL(new RegExp(`theme_preview_id=${newThemeId}`));
        });

        await test.step("Verify no css issue", async () => {
          const homeSF = new OnlineStorePage(newThemeTab, createThemeConf.suiteConf.domain);
          await homeSF.manageBar(createThemeConf.caseConf.editor);
          await newThemeTab.waitForTimeout(1000); //Đợi page stable rồi mới chụp ảnh
          await snapshotFixture.verifyWithAutoRetry({
            page: newThemeTab,
            selector: "//main[@role='main']",
            snapshotName: snapshotName,
            combineOptions: {
              fullPage: true,
              animations: "disabled",
              mask: [
                newThemeTab.locator("//section[@type='slideshow']"),
                newThemeTab.locator("//div[contains(@class,'collection-list')]//div[@class='row']"),
                newThemeTab.locator("//section[contains(@class,'image-text-block')]"),
              ],
              maxDiffPixelRatio: 0.01,
            },
          });
        });
        await test.step("Close preview tab", async () => {
          await newThemeTab.close();
        });
      });
    },
  );

  test("@SB_OLS_THE_13 - Check copy theme from other shop with same type", async ({ dashboard, conf, authRequest }) => {
    const themeAPI = new ThemeAPI(conf.suiteConf.domain, authRequest);
    await test.step("Check copy theme Shopbase", async () => {
      await themesPage.copyATheme(conf.suiteConf.theme_id.copy_sb);
    });

    await test.step("Verify copy theme success and copied theme in top list", async () => {
      firstThemeInMoreThemes = dashboard.locator(themesPage.xpathFirstThemeInMoreThemes).first();
      await expect(firstThemeInMoreThemes).toHaveText(conf.caseConf.theme_name);
    });

    const copyId = await themesPage.getThemeId(conf.caseConf.theme_name);
    await test.step("Verify theme data", async () => {
      const themeInfo = await themeAPI.getPreviewThemeInfo(copyId);
      expect(themeInfo).toMatchObject(conf.caseConf.theme);
    });
  });
});

const dataDriven2 = "PB_PLB_INSIDE";
const otherShopConf = loadData(__dirname, dataDriven2);
otherShopConf.caseConf.data.forEach(({ case_id: caseId, default_theme: defaultTheme }, i: number) => {
  test(`@${caseId} - Check create Inside theme in ${otherShopConf.suiteConf.shop_types[i]}`, async ({
    browser,
    token,
    theme,
    snapshotFixture,
  }) => {
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    dashboardPage = new DashboardPage(newPage, otherShopConf.suiteConf.other_domains[i]);
    await test.step("Get token", async () => {
      const shop = await token.getWithCredentials({
        domain: otherShopConf.suiteConf.other_domains[i],
        username: otherShopConf.suiteConf.username,
        password: otherShopConf.suiteConf.password,
      });
      accessToken = shop.access_token;
    });

    await test.step("Set up default theme and clear themes before test", async () => {
      const authConfig = {
        domain: otherShopConf.suiteConf.other_domains[i],
        username: otherShopConf.suiteConf.username,
        password: otherShopConf.suiteConf.password,
      };
      const themeList = await theme.list(authConfig);
      for (const themeInfo of themeList) {
        if (themeInfo.name === defaultTheme && !themeInfo.active) {
          await theme.publish(themeInfo.id, authConfig);
        }
      }
      const newList = await theme.list(authConfig);
      for (const themeInfo of newList) {
        if (themeInfo.name !== defaultTheme) {
          await theme.delete(themeInfo.id, authConfig);
        }
      }
    });

    await test.step("Go to Printbase shop dashboard", async () => {
      await dashboardPage.loginWithToken(accessToken);
    });

    await test.step("Go to Online store > Themes", async () => {
      await dashboardPage.navigateToMenu(otherShopConf.suiteConf.menu);
    });

    themesPage = new OnlineStorePage(newPage, otherShopConf.suiteConf.other_domains[i]);
    await test.step("Create Inside theme", async () => {
      await themesPage.createNew(otherShopConf.caseConf.tab, otherShopConf.caseConf.theme_type);
    });

    let previewInside: Page;
    await test.step("Preview Inside theme", async () => {
      [previewInside] = await Promise.all([
        newContext.waitForEvent("page"),
        await themesPage.actionWithThemes({
          action: otherShopConf.caseConf.actions[0],
          themeName: otherShopConf.caseConf.theme_type,
        }),
      ]);
      await previewInside.waitForLoadState("networkidle");
      await waitForImageLoaded(previewInside, "//img[@alt='Visa']");
    });

    const themeId = await themesPage.getThemeId(otherShopConf.caseConf.theme_type);
    await test.step("Verify switch to the preview tab", async () => {
      await expect(previewInside).toHaveURL(new RegExp(`theme_preview_id=${themeId}`));
    });

    await test.step("Verify no css issue", async () => {
      const homeSF = new OnlineStorePage(previewInside, otherShopConf.suiteConf.other_domains[i]);
      await homeSF.manageBar(otherShopConf.caseConf.actions[2]);
      await snapshotFixture.verifyWithAutoRetry({
        page: previewInside,
        selector: "//main[@role='main']",
        snapshotName: otherShopConf.caseConf.snapshot_preview,
        combineOptions: {
          fullPage: true,
          animations: "disabled",
          mask: [
            previewInside.locator("//section[@type='slideshow']"),
            previewInside.locator("//div[contains(@class,'collection-list')]//div[@class='row']"),
          ],
        },
      });
    });

    await test.step("Close preview tab", async () => {
      await previewInside.close();
    });

    await test.step("Publish Inside theme", async () => {
      await themesPage.actionWithThemes({
        action: otherShopConf.caseConf.actions[1],
        themeName: otherShopConf.caseConf.theme_type,
      });
    });

    let publishedTheme: Page;
    await test.step("Preview published theme", async () => {
      [publishedTheme] = await Promise.all([
        newContext.waitForEvent("page"),
        await themesPage.genLoc(themesPage.btnViewYourStore).click(),
      ]);
      await publishedTheme.waitForLoadState("networkidle");
      await waitForImageLoaded(publishedTheme, "//img[@alt='Visa']");
    });

    themesPage = new OnlineStorePage(publishedTheme, otherShopConf.suiteConf.other_domains[i]);
    await test.step("Verify no css issue", async () => {
      await themesPage.manageBar(otherShopConf.caseConf.actions[2]);
      await snapshotFixture.verifyWithAutoRetry({
        page: publishedTheme,
        selector: "//main[@role='main']",
        snapshotName: otherShopConf.caseConf.snapshot_published,
        combineOptions: {
          fullPage: true,
          animations: "disabled",
          mask: [
            publishedTheme.locator("//section[@type='slideshow']"),
            publishedTheme.locator("//div[contains(@class,'collection-list')]//div[@class='row']"),
          ],
        },
      });
    });

    await test.step("Set default theme and close browser after test", async () => {
      themesPage = new OnlineStorePage(newPage, otherShopConf.suiteConf.other_domains[i]);
      await themesPage.actionWithThemes({
        action: otherShopConf.caseConf.actions[1],
        themeName: defaultTheme,
      });
      await newContext.close();
    });
  });
});
