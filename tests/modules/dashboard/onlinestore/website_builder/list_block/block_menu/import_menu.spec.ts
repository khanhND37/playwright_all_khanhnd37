import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { expect, FrameLocator, Page } from "@playwright/test";
import { XpathNavigationButtons } from "@constants/web_builder";

test.describe("Import menu", () => {
  let webBuilder: WebBuilder,
    xpathBlock: Blocks,
    themeId: number,
    themes: ThemeEcom,
    accessToken: string,
    frameLocator: FrameLocator,
    storefront: Page;

  test.beforeEach(async ({ dashboard, theme, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    const response = await theme.applyTemplate(conf.suiteConf.template_id);
    themeId = response.id;

    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;

    await test.step("Open web builder > Add blank section > Add block menu", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "home" });
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_block);
      await webBuilder.switchToTab("Content");
    });
  });

  test.afterEach(async ({ dashboard, conf, token }) => {
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    await themes.deleteAllThemesUnPublish(accessToken);
  });

  test("Check import menu chỉ có 1 level thành công @SB_WEB_BUILDER_LB_BMN_33", async ({
    conf,
    dashboard,
    snapshotFixture,
    context,
  }) => {
    const data = conf.caseConf.expect;

    await test.step("Show link import ở tab content của block menu", async () => {
      await expect(xpathBlock.textImportMenu).toHaveText(data.text_import);
      await expect(xpathBlock.linkImportMenu).toHaveText(data.link_import);
    });

    await test.step("Click link Click here to import", async () => {
      await xpathBlock.linkImportMenu.click();
      await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlock.popupTemplate,
        snapshotName: data.snapshot,
      });
    });

    await test.step("Click dropdown select menu > Chọn menu > Click button Import", async () => {
      await xpathBlock.selectMenuItem(data.select.name_menu, data.select.index);
      await webBuilder.clickBtnInConfirmPopup("Import");
      await expect(dashboard.locator(webBuilder.getXpathByText("Import data successfully!"))).toBeVisible();
      await webBuilder.clickBtnInConfirmPopup("x");
    });

    for (const menu of data.menu) {
      await test.step(`Hover vào ${menu.label} > Click icon edit`, async () => {
        await xpathBlock.selectActionWithItem(menu.item, "Item setting");
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Label", xpathBlock.xpathInput))).toHaveValue(
          menu.label,
        );
        await expect(
          dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Show icon", xpathBlock.xpathInput)),
        ).toHaveValue(menu.show_icon);
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Action", xpathBlock.xpathLabel))).toHaveText(
          menu.action,
        );
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Page", xpathBlock.xpathLabel))).toHaveText(
          menu.page,
        );
        await expect(
          dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Open in new tab", xpathBlock.xpathInput)),
        ).toHaveValue(menu.new_tab);
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Badge", xpathBlock.xpathLabel))).toHaveText(
          menu.badge,
        );
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Type", xpathBlock.xpathLabel))).toHaveText(
          menu.type,
        );
        await xpathBlock.iconCloseMenu.click();
      });
    }

    await test.step("Save template và preview ngoài SF", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      if (await storefront.locator(xpathBlock.closePopupSF).isVisible()) {
        await storefront.locator(xpathBlock.closePopupSF).click();
      }
    });

    for (const menu of data.menu) {
      await test.step(`Click ${data.label}`, async () => {
        const selectorMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.item);
        await verifyRedirectUrl({
          page: storefront,
          selector: selectorMenuItem,
          redirectUrl: menu.redirect,
        });
        await xpathBlock.waitForElementVisibleThenInvisible(xpathBlock.xpathPreviewSpinner);
      });
    }
  });

  test("Check import menu có 2 level thành công @SB_WEB_BUILDER_LB_BMN_34", async ({ conf, dashboard, context }) => {
    const data = conf.caseConf.expect;

    await test.step("Click link Click here to import", async () => {
      await xpathBlock.linkImportMenu.click();
      await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeVisible();
    });

    await test.step("Click dropdown select menu > Chọn menu > Click button Import", async () => {
      await xpathBlock.selectMenuItem(data.select.name_menu, data.select.index);
      await webBuilder.clickBtnInConfirmPopup("Import");
      await expect(dashboard.locator(webBuilder.getXpathByText("Import data successfully!"))).toBeVisible();
      await webBuilder.clickBtnInConfirmPopup("x");
    });

    for (const menu of data.menu) {
      await test.step(`Hover vào ${menu.label} > Click icon edit`, async () => {
        await xpathBlock.selectActionWithItem(menu.item, "Item setting");
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Label", xpathBlock.xpathInput))).toHaveValue(
          menu.label,
        );
        await expect(
          dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Show icon", xpathBlock.xpathInput)),
        ).toHaveValue(menu.show_icon);
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Action", xpathBlock.xpathLabel))).toHaveText(
          menu.action,
        );
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Page", xpathBlock.xpathLabel))).toHaveText(
          menu.page,
        );
        await expect(
          dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Open in new tab", xpathBlock.xpathInput)),
        ).toHaveValue(menu.new_tab);
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Badge", xpathBlock.xpathLabel))).toHaveText(
          menu.badge,
        );
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Type", xpathBlock.xpathLabel))).toHaveText(
          menu.type,
        );
        await xpathBlock.iconCloseMenu.click();
      });
    }

    for (const menu of data.menu) {
      if (menu.submenu) {
        await test.step(`Click vào mũi tên icon của ${menu.label}`, async () => {
          expect(await xpathBlock.menuItemInSideBarLoc(menu.item).count()).toEqual(menu.count_submenu);
        });

        await test.step(`Hover vào ${menu.label} > Click icon edit`, async () => {
          await xpathBlock.selectActionWithItem(menu.submenu.item, "Item setting");
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Item type", xpathBlock.xpathLabel)),
          ).toHaveText(menu.submenu.type);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Label", xpathBlock.xpathInput)),
          ).toHaveValue(menu.submenu.label);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Show icon", xpathBlock.xpathInput)),
          ).toHaveValue(menu.submenu.show_icon);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Action", xpathBlock.xpathLabel)),
          ).toHaveText(menu.submenu.action);
          await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Page", xpathBlock.xpathLabel))).toHaveText(
            menu.submenu.page,
          );
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Open in new tab", xpathBlock.xpathInput)),
          ).toHaveValue(menu.submenu.new_tab);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Badge", xpathBlock.xpathLabel)),
          ).toHaveText(menu.submenu.badge);
          await xpathBlock.iconCloseMenu.click();
        });
      }
    }

    await test.step("Save template và preview ngoài SF", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      if (await storefront.locator(xpathBlock.closePopupSF).isVisible()) {
        await storefront.locator(xpathBlock.closePopupSF).click();
      }
    });

    for (const menu of data.menu) {
      await test.step(`Click ${data.label}`, async () => {
        const selectorMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.item);
        await verifyRedirectUrl({
          page: storefront,
          selector: selectorMenuItem,
          redirectUrl: menu.redirect,
        });
        await xpathBlock.waitForElementVisibleThenInvisible(xpathBlock.xpathPreviewSpinner);
      });
    }

    for (const menu of data.menu) {
      if (menu.submenu) {
        await test.step(`Click submenu ${data.label}`, async () => {
          const selectorMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.item);
          await storefront.locator(selectorMenuItem).hover();
          const selectorSubMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.submenu.item);
          await verifyRedirectUrl({
            page: storefront,
            selector: selectorSubMenuItem,
            redirectUrl: menu.submenu.redirect,
          });
          await xpathBlock.waitForElementVisibleThenInvisible(xpathBlock.xpathPreviewSpinner);
        });
      }
    }
  });

  test("Check import menu có 3 level thành công @SB_WEB_BUILDER_LB_BMN_35", async ({ conf, dashboard, context }) => {
    test.slow();
    const data = conf.caseConf.expect;

    await test.step("Click link Click here to import", async () => {
      await xpathBlock.linkImportMenu.click();
      await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeVisible();
    });

    await test.step("Click dropdown select menu > Chọn menu > Click button Import", async () => {
      await xpathBlock.selectMenuItem(data.select.name_menu, data.select.index);
      await webBuilder.clickBtnInConfirmPopup("Import");
      await expect(dashboard.locator(webBuilder.getXpathByText("Import data successfully!"))).toBeVisible();
      await webBuilder.clickBtnInConfirmPopup("x");
    });

    for (const menu of data.menu) {
      await test.step(`Hover vào ${menu.label} > Click icon edit`, async () => {
        await xpathBlock.selectActionWithItem(menu.item, "Item setting");
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Label", xpathBlock.xpathInput))).toHaveValue(
          menu.label,
        );
        await expect(
          dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Show icon", xpathBlock.xpathInput)),
        ).toHaveValue(menu.show_icon);
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Action", xpathBlock.xpathLabel))).toHaveText(
          menu.action,
        );
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Page", xpathBlock.xpathLabel))).toHaveText(
          menu.page,
        );
        await expect(
          dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Open in new tab", xpathBlock.xpathInput)),
        ).toHaveValue(menu.new_tab);
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Badge", xpathBlock.xpathLabel))).toHaveText(
          menu.badge,
        );
        await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Type", xpathBlock.xpathLabel))).toHaveText(
          menu.type,
        );
        await xpathBlock.iconCloseMenu.click();
      });
    }

    for (const menu of data.menu) {
      if (menu.submenu) {
        await test.step(`Click vào mũi tên icon của ${menu.label}`, async () => {
          expect(await xpathBlock.menuItemInSideBarLoc(menu.item).count()).toEqual(menu.count_submenu);
        });

        await test.step(`Hover vào ${menu.label} > Click icon edit`, async () => {
          await xpathBlock.selectActionWithItem(menu.submenu.item, "Item setting");
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Item type", xpathBlock.xpathLabel)),
          ).toHaveText(menu.submenu.type);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Label", xpathBlock.xpathInput)),
          ).toHaveValue(menu.submenu.label);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Show icon", xpathBlock.xpathInput)),
          ).toHaveValue(menu.submenu.show_icon);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Action", xpathBlock.xpathLabel)),
          ).toHaveText(menu.submenu.action);
          await expect(dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Page", xpathBlock.xpathLabel))).toHaveText(
            menu.submenu.page,
          );
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Open in new tab", xpathBlock.xpathInput)),
          ).toHaveValue(menu.submenu.new_tab);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Badge", xpathBlock.xpathLabel)),
          ).toHaveText(menu.submenu.badge);
          await xpathBlock.iconCloseMenu.click();
        });
      }
    }

    for (const menu of data.menu) {
      const megamenu = menu.submenu.megamenu;
      if (megamenu) {
        await test.step(`Click vào mũi tên icon của ${menu.submenu.label}`, async () => {
          expect(await xpathBlock.menuItemInSideBarLoc(menu.submenu.item).count()).toEqual(menu.submenu.count_submenu);
        });

        await test.step(`Hover vào ${megamenu.label} > Click icon edit`, async () => {
          await xpathBlock.selectActionWithItem(megamenu.item, "Item setting");
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Item type", xpathBlock.xpathLabel)),
          ).toHaveText(megamenu.type);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Label", xpathBlock.xpathInput)),
          ).toHaveValue(megamenu.label);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Show icon", xpathBlock.xpathInput)),
          ).toHaveValue(megamenu.show_icon);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Action", xpathBlock.xpathLabel)),
          ).toHaveText(megamenu.action);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Target URL", xpathBlock.xpathInput)),
          ).toHaveValue(megamenu.page);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Open in new tab", xpathBlock.xpathInput)),
          ).toHaveValue(megamenu.new_tab);
          await expect(
            dashboard.locator(xpathBlock.getSelectorInWidgetMenu("Badge", xpathBlock.xpathLabel)),
          ).toHaveText(megamenu.badge);
          await xpathBlock.iconCloseMenu.click();
        });
      }
    }

    await test.step("Save template và preview ngoài SF", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      if (await storefront.locator(xpathBlock.closePopupSF).isVisible()) {
        await storefront.locator(xpathBlock.closePopupSF).click();
      }
    });

    for (const menu of data.menu) {
      await test.step(`Click ${data.label}`, async () => {
        const selectorMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.item);
        await verifyRedirectUrl({
          page: storefront,
          selector: selectorMenuItem,
          redirectUrl: menu.redirect,
        });
        await xpathBlock.waitForElementVisibleThenInvisible(xpathBlock.xpathPreviewSpinner);
      });
    }

    for (const menu of data.menu) {
      if (menu.submenu) {
        await test.step(`Click submenu ${data.label}`, async () => {
          const selectorMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.item);
          await storefront.locator(selectorMenuItem).hover();
          const selectorSubMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.submenu.item);
          //case này đang có bug, click link chứa blog detail không điều hướng đi đâu
          await verifyRedirectUrl({
            page: storefront,
            selector: selectorSubMenuItem,
            redirectUrl: menu.submenu.redirect,
          });
          await xpathBlock.waitForElementVisibleThenInvisible(xpathBlock.xpathPreviewSpinner);
        });
      }
    }

    for (const menu of data.menu) {
      const megamenu = menu.submenu.megamenu;
      if (menu.submenu) {
        await test.step(`Click megamenu ${megamenu.label}`, async () => {
          const selectorMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.item);
          await storefront.locator(selectorMenuItem).hover();
          const selectorSubMenuItem = xpathBlock.getSelectorMenuItemOnSF(menu.submenu.item);
          await storefront.locator(selectorSubMenuItem).hover();
          const selectorMegaMenuItem = xpathBlock.getSelectorMenuItemOnSF(megamenu.item);
          await verifyRedirectUrl({
            page: storefront,
            selector: selectorMegaMenuItem,
            redirectUrl: megamenu.redirect,
          });
          await xpathBlock.waitForElementVisibleThenInvisible(xpathBlock.xpathPreviewSpinner);
        });
      }
    }
  });

  test("Check import menu ở cùng 1 menu nhiều lần @SB_WEB_BUILDER_LB_BMN_36", async ({
    conf,
    dashboard,
    snapshotFixture,
    context,
  }) => {
    const data = conf.caseConf.expect;

    await test.step("Chọn tab Design, chỉnh sửa data bất kì", async () => {
      await webBuilder.switchToTab("Design");
      await webBuilder.setBackground("background", data.design.background);
      await webBuilder.editSliderBar("border_radius", data.design.radius);
    });

    for (const menu of data.select) {
      await test.step("Click link Click here to import", async () => {
        await webBuilder.switchToTab("Content");
        await xpathBlock.linkImportMenu.click();
        await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeVisible();
      });

      await test.step("Click dropdown select menu > Chọn menu > Click button Import", async () => {
        await xpathBlock.selectMenuItem(menu.name_menu, menu.index);
        await webBuilder.clickBtnInConfirmPopup("Import");
        await expect(dashboard.locator(webBuilder.getXpathByText("Import data successfully!"))).toBeVisible();
        await webBuilder.clickBtnInConfirmPopup("x");
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: xpathBlock.sectionFirst,
          iframe: webBuilder.iframe,
          snapshotName: menu.preview,
        });
      });

      if (menu.SF) {
        await test.step("Save template và preview ngoài SF", async () => {
          await dashboard.locator(XpathNavigationButtons["save"]).click();
          await dashboard.waitForSelector("text='All changes are saved'");
          storefront = await verifyRedirectUrl({
            page: dashboard,
            selector: XpathNavigationButtons["preview"],
            redirectUrl: "theme_preview_id",
            context,
          });
          if (await storefront.locator(xpathBlock.closePopupSF).isVisible()) {
            await storefront.locator(xpathBlock.closePopupSF).click();
          }

          await snapshotFixture.verify({
            page: storefront,
            selector: xpathBlock.sectionFirst,
            snapshotName: menu.SF,
          });
        });
      }
    }
  });

  test("Check import menu không thành công @SB_WEB_BUILDER_LB_BMN_37", async ({
    conf,
    dashboard,
    snapshotFixture,
    context,
  }) => {
    const data = conf.caseConf.expect;

    for (const menu of data.select) {
      await test.step("Click link Click here to import", async () => {
        await xpathBlock.linkImportMenu.click();
        await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeVisible();
      });

      await test.step(`Click dropdown select menu > Chọn menu > Click ${menu.action}`, async () => {
        await xpathBlock.selectMenuItem(menu.name_menu, menu.index);
        if (menu.action != "area empty") {
          await webBuilder.clickBtnInConfirmPopup(menu.action);
        } else {
          await dashboard.locator(xpathBlock.overlayPopup).click({ position: { x: 1, y: 1 } });
        }
        await expect(dashboard.locator(webBuilder.getXpathByText("Import data successfully!"))).toBeHidden();
        await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeHidden();
      });
    }

    if (data.SF) {
      await test.step("Save template và preview ngoài SF", async () => {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        if (await storefront.locator(xpathBlock.closePopupSF).isVisible()) {
          await storefront.locator(xpathBlock.closePopupSF).click();
        }

        await snapshotFixture.verify({
          page: storefront,
          selector: xpathBlock.sectionFirst,
          snapshotName: data.SF,
        });
      });
    }
  });

  test("Check hiển thị khi click undo/redo sau khi import thành công @SB_WEB_BUILDER_LB_BMN_38", async ({
    conf,
    dashboard,
    snapshotFixture,
    context,
  }) => {
    const data = conf.caseConf.expect;

    await test.step("Click link Click here to import", async () => {
      await xpathBlock.linkImportMenu.click();
      await expect(dashboard.locator(xpathBlock.popupTemplate)).toBeVisible();
    });

    await test.step("Click dropdown select menu > Chọn menu > Click button Import", async () => {
      await xpathBlock.selectMenuItem(data.select.name_menu, data.select.index);
      await webBuilder.clickBtnInConfirmPopup("Import");
      await expect(dashboard.locator(webBuilder.getXpathByText("Import data successfully!"))).toBeVisible();
      await webBuilder.clickBtnInConfirmPopup("x");
    });

    for (const menu of data.actions) {
      await test.step(`Click ${menu.action} trên thanh bar`, async () => {
        await dashboard.locator(XpathNavigationButtons[menu.action]).click();
      });

      await test.step("Save template và preview ngoài SF", async () => {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        if (await storefront.locator(xpathBlock.closePopupSF).isVisible()) {
          await storefront.locator(xpathBlock.closePopupSF).click();
        }

        await snapshotFixture.verify({
          page: storefront,
          selector: xpathBlock.sectionFirst,
          snapshotName: menu.SF,
        });
      });
    }
  });
});
