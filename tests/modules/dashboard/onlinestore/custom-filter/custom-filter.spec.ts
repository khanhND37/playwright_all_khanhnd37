import { test, expect } from "@core/fixtures";
import { DashboardAPI } from "@pages/api/dashboard";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { SFCollection } from "@pages/storefront/collection";
import { Page } from "@playwright/test";
import { FilterSF } from "@types";

const softAssertion = expect.configure({ soft: true });
let dashboardPage: DashboardPage;
let dashboardAPI: DashboardAPI;
let themeEditor: ThemeDashboard;
let collectionSF: SFCollection;
let sfPage: Page;

test.describe("Check Custom filter cho theme v2", () => {
  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    themeEditor = new ThemeDashboard(dashboard, conf.suiteConf.domain);
  });

  test(`@SB_OLS_NVG_CF_04 DB Custom filter_Check hiển thị khi click button xóa all filter`, async ({ cConf }) => {
    await test.step("Setup filters data", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
    });

    await test.step(`Vào Online store>Navigation`, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
    });

    await test.step("Verify hiển thị màn Navigation", async () => {
      await softAssertion(dashboardPage.filtersSection).toBeVisible();
    });

    const allFilters = await dashboardPage.getAllFilters();
    for (const filter of allFilters) {
      await test.step(`Click button remove (icon thùng rác) ở tất cả các filter`, async () => {
        await dashboardPage.removeFilter(filter);
      });

      await test.step("Verify remove filter success", async () => {
        await softAssertion(dashboardPage.collectionSearchFilter.filter({ hasText: filter })).toBeHidden();
      });
    }

    await test.step(`Click button add filter`, async () => {
      await dashboardPage.addFilterBtn.click();
    });

    await test.step("Verify các filter đều untick", async () => {
      if (await dashboardPage.filterShowMoreBtn.isVisible()) {
        await dashboardPage.filterShowMoreBtn.click();
      }
      for (const checkbox of await dashboardPage.filterCheckboxes.all()) {
        await softAssertion(checkbox).not.toBeChecked();
      }
    });
  });

  test(`@SB_OLS_NVG_CF_11 DB Custom filter_Add filter_Check hiển thị khi click button Show more + Show less TH store có variant, tổng số variant > 5`, async ({
    cConf,
  }) => {
    await test.step("Open add filter popup", async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
      await dashboardPage.addFilterBtn.click();
    });

    await test.step("Verify product options only has 5 & show more button", async () => {
      await softAssertion(dashboardPage.productOptionsCheckboxes).toHaveCount(cConf.expected_min_filters_count);
      await softAssertion(dashboardPage.filterShowMoreBtn).toBeVisible();
    });

    await test.step(`Click button show more`, async () => {
      await dashboardPage.filterShowMoreBtn.click();
    });

    await test.step("Verify show more than 5 options and show less button", async () => {
      await softAssertion(dashboardPage.productOptionsCheckboxes).toHaveCount(cConf.expected_all_filters_count);
    });

    await test.step(`Click button show less`, async () => {
      await dashboardPage.filterShowLessBtn.click();
    });

    await test.step("Verify show only 5 and show more button", async () => {
      await softAssertion(dashboardPage.productOptionsCheckboxes).toHaveCount(cConf.expected_min_filters_count);
      await softAssertion(dashboardPage.filterShowMoreBtn).toBeVisible();
    });
  });

  test(`@SB_OLS_NVG_CF_15 DB Custom filter_Add filter_Check hiển thị add filter thành công`, async ({ cConf }) => {
    await test.step("Pre-condition: clear all filters", async () => {
      await dashboardAPI.setSearchFilter(cConf.untick_all);
    });

    await test.step(`Onlline store>Navigation`, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
    });

    await test.step(`Click button add filter`, async () => {
      await dashboardPage.addFilterBtn.click();
    });

    await test.step(`Tích chọn 1 số variant trong popup và Save`, async () => {
      await dashboardPage.manageFilters(cConf.filter_data);
    });

    await test.step(`Verify add filter success and filter display on collection and search filter`, async () => {
      for (const filter of cConf.filter_data.filters) {
        const addedFilter = dashboardPage.collectionSearchFilter.filter({ hasText: filter });
        await softAssertion(addedFilter).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CF_17 DB Custom filter_Add filter_Check hiển thị edit lựa chọn filter thành công`, async ({
    cConf,
  }) => {
    await test.step("Pre-condition: Set filters test", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
    });

    await test.step(`Onlline store>Navigation`, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
    });

    await test.step(`Click button add filter`, async () => {
      await dashboardPage.addFilterBtn.click();
    });

    await test.step(`Bỏ chọn 1 số trường cũ, tích chọn 1 số trường mới`, async () => {
      await dashboardPage.manageFilters(cConf.remove_filters);
    });

    await test.step(`Verify filter update`, async () => {
      for (const filter of cConf.remove_filters.filters) {
        const removedFilter = dashboardPage.collectionSearchFilter.filter({ hasText: filter });
        await softAssertion(removedFilter).toBeHidden();
      }
    });
  });

  test(`@SB_OLS_NVG_CF_24 Theme editor Custom filter_Check hiển thị khi on/off checkbox Enable filtering`, async ({
    cConf,
    conf,
    context,
  }) => {
    await test.step("Pre-condition: set filters trong dashboard", async () => {
      await dashboardAPI.setSearchFilter(cConf.filters);
    });

    await test.step("Open theme editor page collection", async () => {
      const previewTag = themeEditor.previewTags;
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id);
      await themeEditor.selectPage("Collection");
      await softAssertion(themeEditor.previewSection).toBeVisible();
      await softAssertion(themeEditor.spinner).toBeHidden();
      if (await previewTag.isVisible()) {
        await previewTag.locator(themeEditor.removeTagIcon).click();
      }
      await themeEditor.selectPreviewSource(conf.suiteConf.collection_test);
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.switchDeviceBtn.filter({ has: themeEditor.desktopIcon }).click();
    });

    await test.step(`Tại theme editor, Check checkbox Enable filtering và save change`, async () => {
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).check();
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    await test.step(`Check hiển thị ở preview`, async () => {
      await themeEditor.selectSortCollection("Newest");
      await themeEditor.setFilterPosition("Left sidebar");
      await themeEditor.collectionSection.hover();
    });

    await test.step("Verify filters in preview", async () => {
      await softAssertion(themeEditor.leftFilters).toBeVisible();
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    const sfPage = await context.newPage();
    const collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step("Open collection in SF", async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.collectionSort.selectOption(cConf.sort_newest);
    });

    await test.step("Verify filters in SF", async () => {
      await softAssertion(collectionSF.leftFilters).toBeVisible();
    });

    await test.step(`Tại theme editor, Uncheck checkbox Enable filtering`, async () => {
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).setChecked(false);
      await themeEditor.saveTheme();
    });

    await test.step(`Check hiển thị trong Preview`, async () => {
      await softAssertion(themeEditor.leftFilters).toBeHidden();
      await softAssertion(themeEditor.onTopFilters).toBeHidden();
      await softAssertion(themeEditor.drawerFiltersBtn).toBeHidden();
    });

    await test.step("Verify Filters in SF", async () => {
      await sfPage.reload({ waitUntil: "networkidle" });
      await softAssertion(collectionSF.leftFilters).toBeHidden();
      await softAssertion(collectionSF.onTopFilters).toBeHidden();
      await softAssertion(collectionSF.drawerFiltersBtn).toBeHidden();
    });
  });

  test(`@SB_OLS_NVG_CF_77 Theme editor Custom filter_Check Filter khi click button Clear all`, async ({
    context,
    cConf,
    conf,
  }) => {
    await test.step("Pre-condition: Enable filter in theme editor", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id, "collection");
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).check();
      await themeEditor.setFilterPosition("In drawer");
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    const sfPage = await context.newPage();
    const collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step(`Open popup filter trong collection A ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await sfPage.waitForResponse(/app.json/);
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step(`Checked checkbox avaibility, nhập giá min, max`, async () => {
      await collectionSF.inDrawerFilters
        .locator(collectionSF.checkboxes)
        .filter({ hasText: cConf.available_only })
        .check();
      await collectionSF.setPriceFilter("In drawer", cConf.price_filter);
    });

    await test.step(`Verify Clear all button`, async () => {
      await softAssertion(collectionSF.inDrawerFilters.getByRole("button", { name: "Clear all" })).toHaveClass(
        new RegExp(cConf.expected.disabled),
      );
    });

    await test.step(`Click button apply`, async () => {
      await collectionSF.inDrawerFilters.getByRole("button", { name: "Apply" }).click();
    });

    await test.step("Verify products after applied filter", async () => {
      await softAssertion(collectionSF.productsInCollection).toHaveCount(cConf.expected.products_filtered);
      const listProducts = await collectionSF.getProductsInfo();
      for (const product of listProducts) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: product.title as string }),
        ).toBeVisible();
        softAssertion(product.price).toBeGreaterThanOrEqual(cConf.price_filter.from);
        softAssertion(product.price).toBeLessThanOrEqual(cConf.price_filter.to);
      }
    });

    await test.step(`Open popup filter, click button clear all`, async () => {
      await collectionSF.drawerFiltersBtn.click();
      await collectionSF.inDrawerFilters.getByRole("button", { name: "Clear all" }).click();
    });

    await test.step("Verify products after applied filter", async () => {
      await softAssertion(collectionSF.productsInCollection).toHaveCount(cConf.expected.all_products);
    });
  });

  test(`@SB_OLS_NVG_CF_78 Theme editor Custom filter_Filter with 1 option`, async ({ context, cConf, conf }) => {
    await test.step("Pre-condition: Enable filter in theme editor", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id, "collection");
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).check();
      await themeEditor.setFilterPosition("In drawer");
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    const sfPage = await context.newPage();
    const collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step(`Open popup filter trong collection A ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await sfPage.waitForResponse(/locales/);
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step(`Filter theo 1 option bất kì`, async () => {
      await collectionSF.inDrawerFilters
        .locator(collectionSF.checkboxes)
        .filter({ hasText: cConf.product_type })
        .check();
    });

    await test.step(`Click button apply`, async () => {
      await collectionSF.inDrawerFilters.getByRole("button", { name: "Apply" }).click();
    });

    await test.step("Verify filter applied", async () => {
      await softAssertion(collectionSF.filterTags).toHaveCount(cConf.expected.filter_count);
      await softAssertion(collectionSF.filterTags).toHaveText(cConf.expected.filter_text);
      await softAssertion(collectionSF.productsInCollection).toHaveCount(cConf.expected.result_count);
      await softAssertion(
        collectionSF.productsInCollection.filter({ hasText: cConf.expected.product_title }),
      ).toBeVisible();
      await softAssertion(collectionSF.productsInCollection.locator(collectionSF.productPrice)).toHaveText(
        cConf.expected.product_price,
      );
    });
  });

  test(`@SB_OLS_NVG_CF_79 Theme editor Custom filter_Filter chính xác với many option, trả về 1 result`, async ({
    context,
    cConf,
    conf,
  }) => {
    await test.step("Pre-condition: Enable filter in theme editor", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id, "collection");
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).check();
      await themeEditor.checkbox.filter({ hasText: "Enable color swatches" }).setChecked(false);
      await themeEditor.setFilterPosition("In drawer");
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    const sfPage = await context.newPage();
    const collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step(`Open popup filter trong collection A ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await sfPage.waitForResponse(/locales/);
    });

    await test.step(`Filter theo nhiều option`, async () => {
      await collectionSF.setSearchFilter(cConf.select_filters);
    });

    await test.step("Verify filtered results", async () => {
      await softAssertion(collectionSF.filterTags).toHaveCount(cConf.expected.filters_count);
      for (const expectedText of cConf.expected.filters_text) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: expectedText })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(cConf.expected.result_count);
      await softAssertion(
        collectionSF.productsInCollection.filter({ hasText: cConf.expected.product_title_multi_filters }),
      ).toBeVisible();
      await softAssertion(collectionSF.productsInCollection.locator(collectionSF.productPrice)).toHaveText(
        cConf.expected.product_price_multi_filters,
      );
    });

    await test.step(`Filter theo 1 option Size`, async () => {
      await collectionSF.clearAllFiltersBtn.click();
      await collectionSF.setSearchFilter(cConf.filter_size);
    });

    await test.step("Verify filtered results", async () => {
      await softAssertion(collectionSF.filterTags).toHaveCount(cConf.expected.filter_count);
      await softAssertion(collectionSF.filterTags).toHaveText(cConf.expected.filter_text);
      await softAssertion(collectionSF.productsInCollection).toHaveCount(cConf.expected.results_count);
      for (const productTitle of cConf.expected.product_title_size_filters) {
        await softAssertion(collectionSF.productsInCollection.filter({ hasText: productTitle })).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CF_80 Theme editor Custom filter_Filter chính xác với many option, trả về nhiều result`, async ({
    context,
    cConf,
    conf,
  }) => {
    await test.step("Pre-condition: Enable filter in theme editor", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id, "collection");
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).check();
      await themeEditor.setFilterPosition("In drawer");
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    const sfPage = await context.newPage();
    const collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step(`Open popup filter trong collection A ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await sfPage.waitForResponse(/locales/);
    });

    await test.step(`Filter theo nhiều option`, async () => {
      await collectionSF.setSearchFilter(cConf.multi_filters);
    });

    await test.step(`Verify filters applied`, async () => {
      await softAssertion(collectionSF.filterTags).toHaveCount(cConf.expected.filters_count);
      for (const expectedText of cConf.expected.filters_text) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: expectedText })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(cConf.expected.results_count);
      for (const product of cConf.expected.products) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CF_81 Theme editor Custom filter_Filter with no results`, async ({ context, cConf, conf }) => {
    await test.step("Pre-condition: Enable filter in theme editor", async () => {
      await dashboardAPI.setSearchFilter(cConf.set_filters);
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id, "collection");
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).check();
      await themeEditor.setFilterPosition("In drawer");
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    const sfPage = await context.newPage();
    const collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step(`Open popup filter trong collection A ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await sfPage.waitForResponse(/locales/);
    });

    await test.step(`Filter để kết quả trả về no result`, async () => {
      await collectionSF.setSearchFilter(cConf.filter_no_result);
    });

    await test.step(`Verify no result`, async () => {
      await softAssertion(collectionSF.filterTags.filter({ hasText: cConf.expected_filter_tag })).toBeVisible();
      await softAssertion(collectionSF.noResult).toBeVisible();
    });
  });
});

test.describe("Check Custom filter by tag theme v2", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, cConf, context }) => {
    let filters: FilterSF[];
    dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    themeEditor = new ThemeDashboard(dashboard, conf.suiteConf.domain);

    await test.step("Open theme editor collection section", async () => {
      const previewTag = themeEditor.previewTags;
      await themeEditor.openThemeEditor(conf.suiteConf.test_theme_id, "collection");
      await softAssertion(themeEditor.previewSection).toBeVisible();
      await softAssertion(themeEditor.spinner).toBeHidden();
      if (await previewTag.isVisible()) {
        await previewTag.locator(themeEditor.removeTagIcon).click();
      }
      await themeEditor.selectPreviewSource(conf.suiteConf.collection_test);
      await themeEditor.openSectionBlock("Collection");
      await themeEditor.checkbox.filter({ hasText: "Enable filtering" }).setChecked(true);
      await themeEditor.checkbox.filter({ hasText: "Enable color swatches" }).setChecked(cConf.color_swatches);
      await themeEditor.setFilterPosition("In drawer");
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
    });

    await test.step("Pre-condition: setup custom filter và enable trong theme editor", async () => {
      await dashboardAPI.setSearchFilter(cConf.setup_filters);
    });

    sfPage = await context.newPage();
    collectionSF = new SFCollection(sfPage, conf.suiteConf.domain);
    await test.step("Pre-condition: Wait till SF not cache", async () => {
      if (!conf.suiteConf.domain.includes("myshopbase")) {
        cConf.filters_sf.forEach(filter => {
          if (filter.colors) {
            filter.colors.Black = "#111111";
            filter.colors.Purple = "#4B256E";
          }
        });
      }
      const collectionHandle = cConf.collection_handle.split("/")[1];
      await expect(async () => {
        filters = await collectionSF.getCollectionFiltersInfo(collectionHandle);
        expect(filters).toMatchObject(cConf.filters_sf);
      }).toPass({ timeout: 60_000, intervals: [2_000] });
    });
  });

  test(`@SB_OLS_NVG_CFBT_36 Storefront - Check hiển thị custom ngoài SF`, async ({ cConf }) => {
    await test.step(`Open popup filter trong collection A ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step("Verify custom filter in SF", async () => {
      const customFilter = collectionSF.inDrawerFiltersSection.filter({ hasText: cConf.setup_filters.custom[0].title });
      const customFilterOptions = customFilter.locator(collectionSF.checkboxes);
      await softAssertion(customFilter).toBeVisible();
      for (const tag of cConf.setup_filters.custom[0].tags) {
        await softAssertion(customFilterOptions.filter({ hasText: tag })).toBeVisible();
      }
    });

    await test.step(`Edit custom VIP custom trong dashboard`, async () => {
      await dashboardPage.goto(cConf.navigation_menu);
      await dashboardPage.editCustomFilters(cConf.edit_custom_filter);
    });

    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await sfPage.reload({ waitUntil: "networkidle" });
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step("Verify edit custom filter in SF", async () => {
      const customFilter = collectionSF.inDrawerFiltersSection.filter({ hasText: cConf.edit_custom_filter.edit.name });
      const customFilterOptions = customFilter.locator(collectionSF.checkboxes);
      await softAssertion(customFilter).toBeVisible();
      for (const tag of cConf.edit_custom_filter.edit.tags) {
        await softAssertion(customFilterOptions.filter({ hasText: tag })).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CFBT_38 Storefront - Check hiển thị nhiều custom có Name trùng nhau ngoài SF`, async ({
    cConf,
  }) => {
    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step(`Verify 2 custom filters in drawer`, async () => {
      const customFilter = collectionSF.inDrawerFiltersSection.filter({ hasText: cConf.expected.title });
      await softAssertion(customFilter.first()).toBeVisible();
      await softAssertion(customFilter).toHaveCount(cConf.expected.custom_filter_count);
    });

    await test.step(`Chọn các option filter của (1)`, async () => {
      await collectionSF.setSearchFilter(cConf.custom_filter_1);
    });

    await test.step("Verify result after applied filter", async () => {
      for (const product of cConf.expected.products_result) {
        await softAssertion(collectionSF.productsInCollection.filter({ hasText: product })).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CFBT_39 Storefront - Check hiển thị nhiều custom có Name trùng nhau chỉ khác nhau chữ hoa chữ thường ngoài SF`, async ({
    cConf,
  }) => {
    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step(`Verify 2 custom filters in drawer`, async () => {
      const customFilter = collectionSF.inDrawerFiltersSection.filter({ hasText: cConf.expected.title });
      await softAssertion(customFilter.first()).toBeVisible();
      await softAssertion(customFilter).toHaveCount(cConf.expected.custom_filter_count);
    });

    await test.step(`Chọn các option filter của (1)`, async () => {
      await collectionSF.setSearchFilter(cConf.custom_filter_1);
    });

    await test.step("Verify result after applied filter", async () => {
      for (const product of cConf.expected.products_result) {
        await softAssertion(collectionSF.productsInCollection.filter({ hasText: product })).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CFBT_40 Storefront - Check hiển thị custom có Name trùng với Product info`, async ({ cConf }) => {
    const normalFilter = cConf.expected.normal_filter;
    const customFilter = cConf.expected.custom_filter;
    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
    });

    await test.step(`chọn các option filter của (price 1)`, async () => {
      await collectionSF.setSearchFilter(cConf.price_filter);
    });

    await test.step("Verify filter result", async () => {
      await softAssertion(collectionSF.filterTags.filter({ hasText: cConf.expected.price_tag })).toBeVisible();
      await softAssertion(collectionSF.productsInCollection).toHaveCount(normalFilter.length);
      for (const product of normalFilter) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });

    await test.step(`chọn các option filter của (price 2)`, async () => {
      await collectionSF.clearAllFiltersBtn.click();
      await collectionSF.setSearchFilter(cConf.custom_tag);
    });

    await test.step("Verify filter result", async () => {
      await softAssertion(collectionSF.filterTags.filter({ hasText: cConf.expected.custom_tag })).toBeVisible();
      await softAssertion(collectionSF.productsInCollection).toHaveCount(customFilter.length);
      await softAssertion(
        collectionSF.productsInCollection.filter({ hasText: `${customFilter[0].title}${customFilter[0].price}` }),
      ).toBeVisible();
    });
  });

  test(`@SB_OLS_NVG_CFBT_41 Storefront - Check hiển thị custom có Name trùng với option variant của product trogn collection`, async ({
    cConf,
  }) => {
    const color1Filter = cConf.expected.color1_filter;
    const color2Filter = cConf.expected.color2_filter;

    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
    });

    await test.step(`chọn các option filter của (price 1)`, async () => {
      await collectionSF.setSearchFilter(cConf.color1_filter);
    });

    await test.step("Verify filter result", async () => {
      for (const tag of cConf.expected.filter1_tag) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: tag })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(color1Filter.length);
      for (const product of color1Filter) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });

    await test.step(`chọn các option filter của (price 2)`, async () => {
      await collectionSF.clearAllFiltersBtn.click();
      await collectionSF.setSearchFilter(cConf.color2_filter);
    });

    await test.step("Verify filter result", async () => {
      for (const tag of cConf.expected.filter2_tag) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: tag })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(color2Filter.length);
      await softAssertion(
        collectionSF.productsInCollection.filter({ hasText: `${color2Filter[0].title}${color2Filter[0].price}` }),
      ).toBeVisible();
    });
  });

  test(`@SB_OLS_NVG_CFBT_42 Storefront - Check chọn option filter ngoài SF`, async ({ cConf }) => {
    const firstFilter = cConf.expected.products_before;
    const secondFilter = cConf.expected.products_after;

    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
    });

    await test.step(`Chọn filter option blue, gold của Custom VIP`, async () => {
      await collectionSF.setSearchFilter(cConf.custom_filter);
    });

    await test.step("Verify filter result", async () => {
      for (const tag of cConf.expected.tag_before) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: tag })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(firstFilter.length);
      for (const product of firstFilter) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });

    await test.step(`Bỏ chọn option blue`, async () => {
      await collectionSF.setSearchFilter(cConf.uncheck_filter);
    });

    await test.step("Verify filter result", async () => {
      for (const tag of cConf.expected.tag_after) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: tag })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(secondFilter.length);
      for (const product of secondFilter) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CFBT_43 Storefront - Check chọn nhiều option filter ngoài SF trong đó có option Custom`, async ({
    cConf,
  }) => {
    const expected = cConf.expected;

    await test.step(`Mở collection bất kì ngoài SF -> mở Filter`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
    });

    await test.step(`Select nhiều option filter (Animals, price, color)`, async () => {
      await collectionSF.setSearchFilter(cConf.filters_include_custom);
    });

    await test.step("Verify result", async () => {
      for (const tag of expected.tags_filters) {
        await softAssertion(collectionSF.filterTags.filter({ hasText: tag })).toBeVisible();
      }
      await softAssertion(collectionSF.productsInCollection).toHaveCount(expected.products.length);
      for (const product of expected.products) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_OLS_NVG_CFBT_51 Color swatches - Check hiển thị color swatches ngoài SF với custom color/colors/colour/colours có các tags về màu sắc`, async ({
    cConf,
  }) => {
    const expected = cConf.expected;
    await test.step("Pre-condition: Go to Theme editor and save enable color swatches", async () => {
      await themeEditor.switchDeviceBtn.filter({ has: themeEditor.desktopIcon }).click();
      if (await themeEditor.saveBtn.isEnabled()) {
        await themeEditor.saveTheme();
      }
      await themeEditor.drawerFiltersBtn.click();
    });

    await test.step("Verify color swatches in preview", async () => {
      const colorSwatches = themeEditor.inDrawerFilters.locator(themeEditor.colorSwatches);
      for (const color of expected.color_swatches) {
        await softAssertion(colorSwatches.filter({ has: themeEditor.genLoc(`#${color}`) })).toBeVisible();
      }
    });

    await test.step(`Mở collection bất kì ngoài SF`, async () => {
      await collectionSF.goto(cConf.collection_handle);
      await collectionSF.page.waitForResponse(/theme.css/, { timeout: 30_000 });
    });

    await test.step(`Mở custom filter`, async () => {
      await collectionSF.drawerFiltersBtn.click();
    });

    await test.step("Verify color swatches display in filter", async () => {
      const colorSwatches = collectionSF.genLoc(collectionSF.colorSwatches);
      for (const color of expected.color_swatches) {
        await softAssertion(colorSwatches.filter({ has: collectionSF.genLoc(`#${color}`) })).toBeVisible();
      }
    });

    await test.step(`chọn option filter`, async () => {
      await collectionSF.selectColorSwatches(cConf.color_swatches_filter);
    });

    await test.step("Verify result", async () => {
      await softAssertion(collectionSF.filterTags.filter({ hasText: expected.filter_tag })).toBeVisible();
      await softAssertion(collectionSF.productsInCollection).toHaveCount(expected.products.length);
      for (const product of expected.products) {
        await softAssertion(
          collectionSF.productsInCollection.filter({ hasText: `${product.title}${product.price}` }),
        ).toBeVisible();
      }
    });

    await test.step("Bỏ tick enable color swatches ở theme editor", async () => {
      await themeEditor.checkbox.filter({ hasText: "Enable color swatches" }).setChecked(false);
      await themeEditor.saveTheme();
    });

    await test.step("Verify color swatches is hidden in preview", async () => {
      const colorSwatches = collectionSF.genLoc(collectionSF.colorSwatches);
      for (const color of expected.color_swatches) {
        await softAssertion(colorSwatches.filter({ has: collectionSF.genLoc(`#${color}`) })).toBeHidden();
      }
    });

    await test.step("Verify in SF color swatches is hidden", async () => {
      const colorSwatches = collectionSF.genLoc(collectionSF.colorSwatches);
      await sfPage.reload({ waitUntil: "networkidle" });
      await collectionSF.drawerFiltersBtn.click();
      for (const color of expected.color_swatches) {
        await softAssertion(colorSwatches.filter({ has: collectionSF.genLoc(`#${color}`) })).toBeHidden();
      }
    });
  });
});
