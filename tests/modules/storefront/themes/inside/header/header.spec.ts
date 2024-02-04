import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeFixed, ThemeSettingValue } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { expect } from "@core/fixtures";
import { Page } from "@playwright/test";
import { loadData } from "@core/conf/conf";

/**
 * Click icon hamburger menu in header mobile
 * @param page
 */
const clickHamburgerMenu = async (page: Page) => {
  await page.click(".header-mobile .mobile-nav");
  const mobileMenu = await page.waitForSelector(".header-mobile .mobile-menu .popover-left__overlay");
  await mobileMenu.waitForElementState("stable");
};

/**
 * Click icon + or - in mega menu
 * @param page
 * @param dataDropdown
 * @param isOpen
 */
const clickToggleMenu = async (page: Page, dataDropdown: string, isOpen: boolean) => {
  const isDropDownShow = await page
    .locator(`.mobile-nav-menu [data-dropdown="${dataDropdown.toLowerCase()}"] .mega-menu__dropdown-content`)
    .isVisible();
  if (isOpen && !isDropDownShow) {
    await page.click(`//*[text() = '${dataDropdown}']//following-sibling::*[contains(@class, 'icon-toggle')]`);
  }

  if (!isOpen && isDropDownShow) {
    await page.click(`//*[text() = '${dataDropdown}']//following-sibling::*[contains(@class, 'icon-toggle')]`);
  }
};

test.describe("Verify header section @TS_INS_SF_HEADER", async () => {
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

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const dataSetting = conf.caseConf.data[i];

    test(`${dataSetting.description} @${dataSetting.case_id}`, async ({ pageMobile, page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, conf.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      if (dataSetting.fixed && dataSetting.setting) {
        await test.step("Setting theme editor", async () => {
          for (const data of dataSetting.fixed) {
            shopTheme = await theme.updateSection({
              updateSection: data as unknown as Record<string, ThemeFixed>,
              settingsData: shopTheme.settings_data,
              shopThemeId: shopTheme.id,
            });
          }

          for (const data of dataSetting.setting) {
            shopTheme = await theme.updateSection({
              updateSection: data as unknown as Record<string, Record<string, ThemeSettingValue>>,
              settingsData: shopTheme.settings_data,
              shopThemeId: shopTheme.id,
            });
          }
        });
      }

      const { desktop, mobile } = dataSetting.output;
      if (desktop) {
        await navigationPage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        if (desktop.snapshot) {
          await test.step("Verify header on SF", async () => {
            await snapshotFixture.verify({
              page: page,
              selector: ".header",
              snapshotName: desktop.snapshot,
            });
          });
        }

        if (desktop.redirect_url) {
          await test.step("Verify redirect when click menu on nav", async () => {
            for (let i = 0; i < desktop.redirect_url.length; i++) {
              await verifyRedirectUrl({
                page: page,
                selector: `[data-dropdown-rel='${desktop.redirect_url[i].menu}']`,
                redirectUrl: desktop.redirect_url[i].redirect,
                waitForElement: ".other-page",
              });
            }
          });
        }

        if (desktop.logo) {
          await test.step("Verify redirect when click logo", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: ".header .logo",
              waitForElement: ".header .logo-text",
              redirectUrl: desktop.logo.redirect,
            });
          });
        }

        if (desktop.search) {
          await test.step("Verify redirect when click icon search", async () => {
            await page.click(".header .search-icon");
            await page.waitForSelector(".search-modal .search-modal__wrap--animation-show");
            await snapshotFixture.verify({
              page: page,
              selector: ".search-modal .search-modal__wrap",
              snapshotName: desktop.search.snapshot,
            });
            await page.click(".search-modal .search-modal__close");
          });
        }

        if (desktop.bag) {
          await test.step("Verify redirect when click icon bag", async () => {
            await page.click(".header .mini-cart");
            await page.waitForSelector(".cart-drawer");
            await snapshotFixture.verify({
              page: page,
              selector: ".cart-drawer-container",
              snapshotName: desktop.bag.snapshot,
            });
            await page.click(".cart-drawer-icon-close");
          });
        }

        if (desktop.megamenu) {
          await test.step("Verify mega menu in header", async () => {
            for (let i = 0; i < desktop.megamenu.length; i++) {
              const { option, snapshot, submenu } = desktop.megamenu[i];
              const dropdown = `.header .active[data-dropdown='${option}'] .mega-menu__dropdown-menu`;
              const iconToggle = await page.waitForSelector(`.header [data-dropdown-rel='${option}'] span`);
              const count = await page.locator(dropdown).count();
              //Verify submenu
              if (submenu) {
                await page.hover(`.header [data-dropdown-rel='${option}']`);
                for (let z = 0; z < submenu.length; z++) {
                  await expect(
                    page.locator(
                      `//*[contains(@class, 'header ')]//*[@data-dropdown-rel='${option}']` +
                        `//following-sibling::ul//*[@data-dropdown-rel='${submenu[z]}']`,
                    ),
                  ).toBeVisible();
                }
              } else {
                //Verify megamenu
                if (!count) {
                  await page.hover(`[data-dropdown-rel='${option}']`);
                }

                await expect(page.locator(`.header [data-dropdown='${option}']`)).toHaveClass(/active/);
                await snapshotFixture.verify({
                  page: page,
                  selector: dropdown,
                  snapshotName: snapshot,
                });

                await page.hover(`.site-nav__item>>nth=0`);
                await iconToggle.waitForElementState("stable");
                await page.waitForSelector(`.header [data-dropdown='${option}']:not(.active)`, { state: "hidden" });
                await iconToggle.waitForElementState("stable");
              }

              //Click title option in mega menu
              const redirectURL = desktop.megamenu[i].redirect_url;
              if (redirectURL) {
                for (let j = 0; j < redirectURL.length; j++) {
                  await page.hover(`[data-dropdown-rel='${option}']`);
                  await expect(page.locator(`.header [data-dropdown='${option}']`)).toHaveClass(/active/);
                  await verifyRedirectUrl({
                    page: page,
                    selector: `.mega-menu__column-menu a>>text=${redirectURL[j].option}`,
                    redirectUrl: `${redirectURL[j].redirect}`,
                  });
                }
              }
            }
          });
        }

        if (desktop.links_no_megamenu) {
          await test.step("Verify not show mega menu when hover menu no setting mega menu", async () => {
            for (let i = 0; i < desktop.links_no_megamenu.length; i++) {
              const selector = `.site-nav [data-dropdown-rel="${desktop.links_no_megamenu[i]}"]`;
              await page.hover(selector);
              await expect(page.locator(".mega-menu.active")).toHaveCount(0);
            }
          });
        }

        if (desktop.fixed) {
          await test.step("Check fixed announcement bar and header", async () => {
            await expect(page.locator('[type="announcement-bar"]')).toHaveClass(/announcement-bar-fixed-true/);
            await expect(page.locator(".header")).toHaveClass(/fixed-header--true/);
          });
        } else {
          await test.step("Check not fixed announcement bar and header", async () => {
            await expect(page.locator('[type="announcement-bar"]')).toHaveClass(/announcement-bar-fixed-false/);
            await expect(page.locator(".header")).toHaveClass(/fixed-header--false/);
          });
        }

        if (desktop.minimal) {
          await test.step("Verify setting layout minimal and not show megamenu", async () => {
            await page.locator(".header .header__minimal-nav div").click();
            for (let z = 0; z < desktop.minimal.submenu.length; z++) {
              await page.click(
                `//*[contains(@class, 'header ')]//*[text() = '${desktop.minimal.option}']` +
                  `/following-sibling::*[contains(@class, 'icon-toggle')]`,
              );
              await expect(
                page.locator(
                  `//*[contains(@class, 'header ')]//div[child::*[text() = '${desktop.minimal.option}']]` +
                    `//following-sibling::ul//*[text()='${desktop.minimal.submenu[z]}']`,
                ),
              ).toBeVisible();
            }
          });
        }
      }

      if (mobile) {
        const navigationPage = new SFHome(pageMobile, conf.suiteConf.domain);
        await navigationPage.gotoHomePage();
        await pageMobile.waitForLoadState("networkidle");
        if (mobile.snapshot) {
          await test.step("Verify header on SF", async () => {
            await snapshotFixture.verify({
              page: pageMobile,
              selector: "#header",
              snapshotName: mobile.snapshot,
            });
          });
        }

        if (mobile.megamenu) {
          //Click icon hamburger on header mobile
          await clickHamburgerMenu(pageMobile);
          await test.step("Verify mega menu in header mobile", async () => {
            for (let i = 0; i < mobile.megamenu.length; i++) {
              if (mobile.megamenu[i].open_mega_menu) {
                await test.step("Verify click icon + from mega menu on menu sidebar", async () => {
                  await clickToggleMenu(pageMobile, mobile.megamenu[i].option, true);

                  //Click icon + of title megamenu
                  if (mobile.megamenu[i].title) {
                    await pageMobile.click(
                      `//*[contains(@class, 'mobile-nav-menu')]` +
                        `//*[text() = '${mobile.megamenu[i].title}']//following-sibling::div`,
                    );
                  }
                  const megamenu =
                    `//li[contains(@class, 'mobile-nav-menu__item') ` +
                    `and child::*[normalize-space()='${mobile.megamenu[i].option}']]`;

                  //Wait load image in megamenu
                  if (mobile.megamenu[i].image) {
                    await waitForImageLoaded(
                      pageMobile,
                      ":nth-match(.mobile-nav-menu .mega-menu__dropdown-sub-menu__image img, 1)",
                    );
                  }
                  await pageMobile.locator(megamenu).scrollIntoViewIfNeeded();
                  await snapshotFixture.verify({
                    page: pageMobile,
                    selector: megamenu,
                    screenshotOptions: { animations: "disabled" },
                    snapshotName: mobile.megamenu[i].open_mega_menu,
                  });
                });
              }

              if (mobile.megamenu[i].close_mega_menu) {
                await test.step("Verify click icon - from mega menu on menu sidebar", async () => {
                  await clickToggleMenu(pageMobile, mobile.megamenu[i].option, false);
                  await pageMobile.locator("#header .mobile-nav-menu__header").scrollIntoViewIfNeeded();
                  await pageMobile.waitForSelector(".mega-menu[style*='display: none;']", { state: "hidden" });
                  const icon = await pageMobile.waitForSelector(
                    `//*[text() = '${mobile.megamenu[i].option}']` +
                      `//following-sibling::*[contains(@class, 'icon-toggle')]`,
                  );
                  await icon.waitForElementState("stable");

                  await snapshotFixture.verify({
                    page: pageMobile,
                    selector: "#header .popover-left__content",
                    screenshotOptions: { animations: "disabled" },
                    snapshotName: mobile.megamenu[i].close_mega_menu,
                  });
                });
              }
            }
          });
        }

        if (mobile.submenu) {
          //Click icon hamburger on header mobile
          await clickHamburgerMenu(pageMobile);
          for (const menu of mobile.submenu) {
            await pageMobile.click(
              `//*[contains(@class, 'mobile-nav-menu')]` + `//*[text() = '${menu.option}']//following-sibling::div`,
            );
            for (const submenu of menu.child) {
              await expect(
                pageMobile.locator(
                  `//*[contains(@class, 'header-mobile')]//div[child::*[text() = '${menu.option}']]//following-sibling::ul//a[text()='${submenu}']`,
                ),
              ).toBeVisible();
            }
          }
        }
      }
    });
  }
});
