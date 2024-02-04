import { expect, Page } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { SFCollection } from "@sf_pages/collection";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import type { ShopTheme, ThemeSettingValue } from "@types";
import { loadData } from "@core/conf/conf";
import { cloneDeep } from "@utils/object";
import { waitForProgressBarDetached } from "@utils/storefront";

test.describe("Verify global setting in theme @TS_INS_SF_GLOBAL_SETTING", async () => {
  let shopTheme: ShopTheme;
  const sectionFooter = "[type = 'footer-menu']";
  const btnScrollTop = ".scroll-to-top";

  test.beforeAll(async ({ theme }) => {
    await test.step("Pre-condition: Create  and publish new theme", async () => {
      const res = await theme.create(3);
      await theme.publish(res.id);
      shopTheme = await theme.single(res.id);
    });

    await test.step("Remove shop theme not active", async () => {
      const res = await theme.list();
      const shopThemeNotActive = res.filter(shopTheme => shopTheme.active !== true);
      if (shopThemeNotActive.length) {
        for (let i = 0; i < shopThemeNotActive.length; i++) {
          await theme.delete(shopThemeNotActive[i].id);
        }
      }
    });
  });

  test.beforeEach(async ({ theme, cConf }, testInfo) => {
    testInfo.snapshotSuffix = "";

    test.slow();
    await test.step("Setting theme editor", async () => {
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      if (cConf.data) {
        shopTheme = await theme.updateSection({
          updateSection: cConf.data,
          settingsData: cloneDeep(shopTheme.settings_data),
          shopThemeId: shopTheme.id,
        });
      }
    });
  });

  test.afterEach(async ({ page, conf }) => {
    if (conf.caseConf.sleep) {
      const home = new SFHome(page, conf.suiteConf.domain);
      // Pause for a period of time before starting a new case
      await home.waitAbit(conf.caseConf.sleep);
    }
  });

  test(`@SB_OLS_THE_INS_SF_GLOBAL_SETTING_01 Collection list_Desktop_Check hiển thị collection list khi setting Enable sort = checked + Pagination = Lazy load`, async ({
    page,
    conf,
    cConf,
    authRequest,
  }) => {
    const collectionPage = new SFCollection(page, conf.suiteConf.domain);
    const collectionAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);

    await test.step(`Open collection all ngoài SF`, async () => {
      await collectionPage.goto("/collections/all");
      await collectionPage.page.waitForLoadState("networkidle");
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toHaveValue(cConf.expected.sort_default_all);
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });

    await test.step(`Scroll xuống cuối page`, async () => {
      await collectionPage.genLoc(collectionPage.collectionEndSelector).scrollIntoViewIfNeeded();
      await Promise.all([
        collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" }),
        collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
      ]);
      // infinite scroll to page 2
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default * 2,
      );
      await collectionPage.genLoc(collectionPage.collectioHeaderSelector).scrollIntoViewIfNeeded();
    });

    await test.step(`Click vào droplist sort`, async () => {
      const options = await collectionPage.genLoc(`${collectionPage.collectionSelect} option`).all();
      const expectedOptions = cConf.expected.options.slice(1);
      expect(options.length).toEqual(expectedOptions.length);
      for (let i = 0; i < options.length; i++) {
        await expect(options[i]).toHaveText(expectedOptions[i]);
      }
    });

    for (let sortIndex = 0; sortIndex < cConf.sorts.length; sortIndex++) {
      await test.step(`Click vào droplist sort => ${cConf.sorts[sortIndex].sort_label}`, async () => {
        await collectionPage
          .genLoc(collectionPage.collectionSelect)
          .selectOption({ label: cConf.sorts[sortIndex].sort_label });
        const isTruthy = await collectionPage.verifyResponseProductWithDom(cConf.sorts[sortIndex].sort);
        expect(isTruthy).toBeTruthy();
      });
    }

    await test.step(`Open collection list detail page ngoài SF`, async () => {
      await collectionPage.goto("collections/furniture", true);
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toHaveValue(
        cConf.expected.sort_default_detail,
      );
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });

    await test.step(`Scroll xuống cuối page`, async () => {
      await collectionPage.genLoc(collectionPage.collectionEndSelector).scrollIntoViewIfNeeded();
      await Promise.all([
        collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" }),
        collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
      ]);
      // infinite scroll to page 2
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default * 2,
      );
      await collectionPage.genLoc(collectionPage.collectioHeaderSelector).scrollIntoViewIfNeeded();
    });

    await test.step(`Click vào droplist sort`, async () => {
      const options = await collectionPage.genLoc(`${collectionPage.collectionSelect} option`).all();
      expect(options.length).toEqual(cConf.expected.options.length);
      for (let i = 0; i < options.length; i++) {
        await expect(options[i]).toHaveText(cConf.expected.options[i]);
      }
    });

    await test.step(`Sort theo điều kiện Featured`, async () => {
      await collectionPage.genLoc(collectionPage.collectionSelect).selectOption({ label: cConf.expected.options[0] });
      await waitForProgressBarDetached(collectionPage.page);
      const collectionId = collectionPage.page.url().split("collection_ids=").pop();
      const res: { products: Array<{ title: string }> } = await collectionAPI.getProductsByCollectionId({
        limit: 12,
        collection_id: Number(collectionId),
        sort_order: "manual",
      });
      const products = res.products;
      const isTruthy = await collectionPage.verifyResponseProductWithDom(null, products);
      expect(isTruthy).toBeTruthy();
    });

    await test.step(`Open collection list ngoiaf SF`, async () => {
      await collectionPage.goto("collections", true);
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toBeHidden();
    });
  });

  test(`@SB_OLS_THE_INS_SF_GLOBAL_SETTING_4 Collection list_Mobile_Check hiển thị collection list khi setting Enable sort = unchecked + Pagination = Paging number`, async ({
    pageMobile,
    conf,
    cConf,
  }) => {
    const collectionPage = new SFCollection(pageMobile, conf.suiteConf.domain);

    await test.step(`Open collection all ngoài SF`, async () => {
      await collectionPage.goto("/collections/all");
      await collectionPage.page.waitForLoadState("networkidle");
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toBeHidden();
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });

    await test.step(`Click vào page 2`, async () => {
      await collectionPage.genLoc(collectionPage.paginationSelector).getByRole("button", { name: "2" }).click();
      const isTruthy = await collectionPage.verifyResponseProductWithDom();
      expect(isTruthy).toBeTruthy();
    });

    await test.step(`Open collection list page ngoài SF`, async () => {
      await collectionPage.goto("collections/furniture", true);
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toBeHidden();
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });
  });

  test(`@SB_OLS_THE_INS_SF_GLOBAL_SETTING_5 Collection list_Desktop_Check hiển thị collection list khi setting Enable sort = checked + Pagination = Paging number`, async ({
    page,
    conf,
    cConf,
  }) => {
    const collectionPage = new SFCollection(page, conf.suiteConf.domain);

    await test.step(`Open collection all ngoài SF`, async () => {
      await collectionPage.goto("collections/all");
      await collectionPage.page.waitForLoadState("networkidle");
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toHaveValue(cConf.expected.sort_default_all);
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });

    for (let i = 0; i < cConf.actions.length; i++) {
      await test.step(cConf.actions[i].step, async () => {
        await collectionPage
          .genLoc(collectionPage.collectionSelect)
          .selectOption({ label: cConf.actions[i].sort_label });
        const isTruthy = await collectionPage.verifyResponseProductWithDom(cConf.actions[i].sort);
        expect(isTruthy).toBeTruthy();
      });

      await test.step(`Click vào page 2`, async () => {
        await collectionPage.genLoc(collectionPage.paginationSelector).getByRole("button", { name: "2" }).click();
        const isTruthy = await collectionPage.verifyResponseProductWithDom();
        expect(isTruthy).toBeTruthy();
      });
    }

    await test.step(`Open collection list page ngoài SF`, async () => {
      await collectionPage.goto("collections/furniture", true);
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toHaveValue(
        cConf.expected.sort_default_detail,
      );
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });
  });

  test(`@SB_OLS_THE_INS_SF_GLOBAL_SETTING_8 Collection list_Mobile_Check hiển thị collection list khi setting Enable sort = unchecked + Pagination = Lazy load`, async ({
    pageMobile,
    conf,
    cConf,
  }) => {
    const collectionPage = new SFCollection(pageMobile, conf.suiteConf.domain);

    await test.step(`Open collection all ngoài SF`, async () => {
      await collectionPage.goto("/collections/all");
      await collectionPage.page.waitForLoadState("networkidle");
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toBeHidden();
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });

    await test.step(`Scroll xuống cuối page`, async () => {
      await collectionPage.genLoc(collectionPage.collectionEndSelector).scrollIntoViewIfNeeded();
      await Promise.all([
        collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" }),
        collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
      ]);
      // infinite scroll to page 2
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default * 2,
      );
      await collectionPage.genLoc(collectionPage.collectioHeaderSelector).scrollIntoViewIfNeeded();
    });

    await test.step(`Open collection list page ngoài SF`, async () => {
      await collectionPage.goto("collections/furniture", true);
      await expect(collectionPage.genLoc(collectionPage.collectionSelect)).toBeHidden();
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.total_el_default,
      );
    });
  });

  test(`@SB_OLS_THE_INS_SF_GLOBAL_SETTING_9 Search_Desktop_Check hiển thị search result khi Enable sort in search results = checked + Default logic = Newest`, async ({
    page,
    conf,
    cConf,
  }) => {
    const collectionPage = new SFCollection(page, conf.suiteConf.domain);

    await test.step(`Open shop ngoài SF`, async () => {
      await collectionPage.goto();
      await collectionPage.page.waitForLoadState("networkidle");
    });

    await test.step(`Click icon search`, async () => {
      await collectionPage.genLoc(collectionPage.searchIconDesktop).click();
      await expect(collectionPage.genLoc(collectionPage.searchModal)).toBeVisible();
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toBeHidden();
    });

    await test.step(`Nhập data search đúng`, async () => {
      await collectionPage.genLoc(collectionPage.searchModal).getByRole("searchbox").fill(cConf.search);
      const res = await Promise.all([
        collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
        collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" }),
      ]);
      const resJson = await res[0].json();
      resJson.result.items.sort((a, b) => (a.created_at > b.created_at ? -1 : 0));
      const titles = await collectionPage.genLoc(collectionPage.searchModalProductTitle).all();
      for (let i = 0; i < titles.length; i++) {
        await expect(titles[i]).toHaveText(resJson.result.items[i].title);
      }
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toHaveValue(cConf.expected.sort_default);
    });

    await test.step(`Click vào droplist sort`, async () => {
      const options = await collectionPage.genLoc(`${collectionPage.searchSort} option`).all();
      expect(options.length).toEqual(cConf.expected.options.length);
      for (let i = 0; i < options.length; i++) {
        await expect(options[i]).toHaveText(cConf.expected.options[i]);
      }
    });

    await test.step(`Chọn sort theo Most related`, async () => {
      await collectionPage.genLoc(collectionPage.searchSort).selectOption({ label: cConf.expected.options[0] });
      await collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" });
      const titles = await collectionPage.genLoc(collectionPage.searchModalProductTitle).all();
      for (let i = 0; i < titles.length; i++) {
        await expect(titles[i]).toContainText(new RegExp(cConf.search.split(" ").shift()));
      }
    });

    await test.step(`Nhập data search sai`, async () => {
      await collectionPage
        .genLoc(collectionPage.searchModal)
        .getByRole("searchbox")
        .fill(cConf.search.replace(" ", ""));
      await collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" });
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toBeHidden();
      await collectionPage.genLoc(collectionPage.searchModalClose).click();
    });

    await test.step(`Open search page ngoài SF`, async () => {
      await collectionPage.goto("search", true);
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toBeHidden();
    });

    await test.step(`Nhập data search và enter`, async () => {
      await collectionPage.genLoc(collectionPage.searchPage).getByRole("textbox").fill(cConf.search);
      await collectionPage.genLoc(collectionPage.searchPage).getByRole("textbox").press("Enter");
      const res = await Promise.all([
        collectionPage.waitResponseWithUrl("sort=created_at"),
        collectionPage.genLoc(collectionPage.searching).waitFor({ state: "detached" }),
      ]);
      const resJson = await res[0].json();
      resJson.result.items.sort((a, b) => (a.created_at > b.created_at ? -1 : 0));
      const titles = await collectionPage.genLoc(collectionPage.productTitleSelector).all();
      for (let i = 0; i < titles.length; i++) {
        await expect(titles[i]).toHaveText(resJson.result.items[i].title);
      }
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toHaveValue(cConf.expected.sort_default);
    });

    await test.step(`Click vào droplist sort`, async () => {
      const options = await collectionPage.genLoc(`${collectionPage.searchSort} option`).all();
      expect(options.length).toEqual(cConf.expected.options.length);
      for (let i = 0; i < options.length; i++) {
        await expect(options[i]).toHaveText(cConf.expected.options[i]);
      }
    });

    await test.step(`Chọn sort theo Most related`, async () => {
      await collectionPage.genLoc(collectionPage.searchSort).selectOption({ label: cConf.expected.options[0] });
      await collectionPage.genLoc(collectionPage.searching).waitFor({ state: "detached" });
      await expect(collectionPage.genLoc(collectionPage.productTitleSelector)).toHaveCount(
        cConf.expected.product_per_page,
      );
      const titles = await collectionPage.genLoc(collectionPage.productTitleSelector).all();
      const keywords = cConf.search.split(" ");
      let isTruthy = false;
      for (let i = 0; i < titles.length; i++) {
        const textContent = await titles[i].textContent();
        isTruthy = keywords.some(str => textContent.includes(str));
      }
      expect(isTruthy).toBeTruthy();
    });
  });

  const confSearch = loadData(__dirname, "SETTING_SEARCH");
  for (let i = 0; i < confSearch.caseConf.length; i++) {
    const cConf = confSearch.caseConf[i];
    test(`@${cConf.id} ${cConf.description}`, async ({ page, conf, theme }) => {
      const collectionPage = new SFCollection(page, conf.suiteConf.domain);

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: cConf.data,
          settingsData: cloneDeep(shopTheme.settings_data),
          shopThemeId: shopTheme.id,
        });
      });

      await test.step(`Open shop ngoài SF`, async () => {
        await collectionPage.goto();
        await collectionPage.page.waitForLoadState("networkidle");
      });

      await test.step(`Click icon search`, async () => {
        await collectionPage.genLoc(collectionPage.searchIconDesktop).click();
        await expect(collectionPage.genLoc(collectionPage.searchModal)).toBeVisible();
      });

      await test.step(`Nhập data search đúng`, async () => {
        await collectionPage.genLoc(collectionPage.searchModal).getByRole("searchbox").fill(cConf.search);
        await Promise.all([
          collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
          collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" }),
        ]);

        for (let i = 0; i < cConf.expected.length; i++) {
          await expect(collectionPage.genLoc(collectionPage.searchModalProductTitle).nth(i)).toHaveText(
            cConf.expected[i],
          );
        }
        await collectionPage.genLoc(collectionPage.searchModalClose).click();
      });

      await test.step(`Open search page ngoài SF`, async () => {
        await collectionPage.goto("search", true);
      });

      await test.step(`Nhập data search và enter`, async () => {
        await collectionPage.genLoc(collectionPage.searchPage).getByRole("textbox").fill(cConf.search);
        await collectionPage.genLoc(collectionPage.searchPage).getByRole("textbox").press("Enter");
        await Promise.all([
          collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
          collectionPage.genLoc(collectionPage.searching).waitFor({ state: "detached" }),
        ]);
        for (let i = 0; i < cConf.expected.length; i++) {
          await expect(collectionPage.genLoc(collectionPage.productTitleSelector).nth(i)).toHaveText(cConf.expected[i]);
        }
      });
    });
  }

  test(`@SB_OLS_THE_INS_SF_GLOBAL_SETTING_14 Search_Desktop_Check hiển thị khi Enable sort in search results = unchecked`, async ({
    page,
    conf,
    cConf,
  }) => {
    const collectionPage = new SFCollection(page, conf.suiteConf.domain);

    await test.step(`Open shop ngoài SF`, async () => {
      await collectionPage.goto();
      await collectionPage.page.waitForLoadState("networkidle");
    });

    await test.step(`Click icon search`, async () => {
      await collectionPage.genLoc(collectionPage.searchIconDesktop).click();
      await expect(collectionPage.genLoc(collectionPage.searchModal)).toBeVisible();
    });

    await test.step(`Nhập data search đúng`, async () => {
      await collectionPage.genLoc(collectionPage.searchModal).getByRole("searchbox").fill(cConf.search);
      await Promise.all([
        collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
        collectionPage.genLoc(collectionPage.xpathLoadSpinner).waitFor({ state: "detached" }),
      ]);
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toBeHidden();
      await collectionPage.genLoc(collectionPage.searchModalClose).click();
    });

    await test.step(`Open search page ngoài SF`, async () => {
      await collectionPage.goto("search", true);
    });

    await test.step(`Nhập data search và enter`, async () => {
      await collectionPage.genLoc(collectionPage.searchPage).getByRole("textbox").fill(cConf.search);
      await collectionPage.genLoc(collectionPage.searchPage).getByRole("textbox").press("Enter");
      await Promise.all([
        collectionPage.waitResponseWithUrl("/api/catalog/next/products.json"),
        collectionPage.genLoc(collectionPage.searching).waitFor({ state: "detached" }),
      ]);
      await expect(collectionPage.genLoc(collectionPage.searchSort)).toBeHidden();
    });
  });

  const confProductCard = loadData(__dirname, "SETTING_PRODUCT_CARD");
  for (let i = 0; i < confProductCard.caseConf.length; i++) {
    const testApiCase = confProductCard.caseConf[i];

    test(`@${testApiCase.id} ${testApiCase.description}`, async ({ page, conf, theme, pageMobile }) => {
      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: testApiCase.data as unknown as Record<string, Record<string, ThemeSettingValue>>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      const { desktop, mobile } = testApiCase.expect;
      if (desktop) {
        for (const pageSF of desktop.page) {
          const navigationPage = new SFHome(page, conf.suiteConf.domain);
          await expect(async () => {
            const bootstrap = await theme.getBootstrap(shopTheme.id);
            expect(bootstrap.theme.settings.global_settings).toMatchObject(testApiCase.data.global_settings);
          }).toPass({ timeout: 60_000, intervals: [3_000] });
          await navigationPage.waitAbit(3000); // Chờ SF update data mới nhất
          await navigationPage.gotoHomePage(pageSF.link);
          await test.step("Verify display product image in page", async () => {
            if (pageSF.image_display) {
              switch (pageSF.image_display) {
                case "square":
                  await expect(page.locator(".collection-product-wrap .is-square>>nth=0")).toBeVisible();
                  break;
                case "portraits":
                  await expect(page.locator(".collection-product-wrap .is-4by5>>nth=0")).toBeVisible();
                  break;
                default:
                  await expect(page.locator(".collection-product-wrap .is-square>>nth=0")).toBeHidden();
                  await expect(page.locator(".collection-product-wrap .is-4by5>>nth=0")).toBeHidden();
              }
            }
          });

          await test.step("Verify align content in page", async () => {
            if (pageSF.content_align) {
              await expect(
                page.locator(
                  `(//*[contains(@class, 'collection-product-wrap')]//*[contains(@class,'text-align-${pageSF.content_align.toLowerCase()}')])[1]`,
                ),
              ).toBeVisible();
            }
          });

          await test.step("Verify shape in page", async () => {
            await expect(page.locator(`(//*[contains(@class, 'shape-${desktop.shape}')])[1]`)).toBeVisible();
          });

          await test.step("Verify show sale banner in page", async () => {
            if (pageSF.sale_banner) {
              await expect(page.locator(".product-grid .sale_banner>>nth=0")).toBeVisible();
            } else if (pageSF.sale_banner == false) {
              await expect(page.locator(".product-grid .sale_banner>>nth=0")).toBeHidden();
            }
          });

          await test.step("Verify show button add to cart in page", async () => {
            if (pageSF.add_to_cart) {
              await page.locator("section .collection-product-wrap>>nth=0").hover();
              await expect(page.locator(".collection-product-wrap button>>nth=0")).toBeVisible();
            } else if (pageSF.add_to_cart == false) {
              await expect(page.locator(".collection-product-wrap button>>nth=0")).toBeHidden();
            }
          });
        }
      }
      if (mobile) {
        const navigationPage = new SFHome(pageMobile, conf.suiteConf.domain);
        await expect(async () => {
          const bootstrap = await theme.getBootstrap(shopTheme.id);
          expect(bootstrap.theme.settings.global_settings).toMatchObject(testApiCase.data.global_settings);
        }).toPass({ timeout: 60_000, intervals: [3_000] });
        await navigationPage.gotoHomePage(mobile.link);
        await pageMobile.waitForLoadState("networkidle");
        await test.step("Verify show number product in row", async () => {
          const col = mobile.per_row == 1 ? "col-12" : "col-6";
          await expect(pageMobile.locator(`.product-grid .${col}>>nth=0`)).toBeVisible();
        });
      }
    });
  }

  const confAdvancedSetting = loadData(__dirname, "SETTING_ADVANCED_SETTING");
  for (let i = 0; i < confAdvancedSetting.caseConf.length; i++) {
    const testApiCase = confAdvancedSetting.caseConf[i];
    test(`@${testApiCase.id} ${testApiCase.description}`, async ({ page, conf, theme, pageMobile }) => {
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: testApiCase.data as unknown as Record<string, Record<string, ThemeSettingValue>>,
          settingsData: cloneDeep(shopTheme.settings_data),
          shopThemeId: shopTheme.id,
        });
      });

      const verifyScrollTop = async (typePage: Page) => {
        await typePage.locator(sectionFooter).scrollIntoViewIfNeeded();
        await expect(typePage.locator(btnScrollTop)).toBeVisible();
        await typePage.locator(btnScrollTop).click();
        await expect(typePage.locator(btnScrollTop)).toBeHidden();
        const box = await typePage.locator("[type='header']").boundingBox();
        await expect(box.x).toEqual(0);
        await expect(box.y).toEqual(0);
      };

      await test.step("Verify icon back on top on SF", async () => {
        if (testApiCase.expect.desktop) {
          const navigationPage = new SFHome(page, conf.suiteConf.domain);
          await navigationPage.gotoHomePage("");
          await page.waitForLoadState("networkidle");
          if (testApiCase.expect.desktop.scroll) {
            await verifyScrollTop(page);
          } else {
            await page.locator(sectionFooter).scrollIntoViewIfNeeded();
            await expect(page.locator(btnScrollTop)).toBeHidden();
          }
        }

        if (testApiCase.expect.mobile) {
          const navigationPage = new SFHome(pageMobile, conf.suiteConf.domain);
          await navigationPage.gotoHomePage("");
          await pageMobile.waitForLoadState("networkidle");
          if (testApiCase.expect.mobile.scroll) {
            await verifyScrollTop(pageMobile);
          } else {
            await pageMobile.locator(sectionFooter).scrollIntoViewIfNeeded();
            await expect(pageMobile.locator(btnScrollTop)).toBeHidden();
          }
        }
      });
    });
  }
});
