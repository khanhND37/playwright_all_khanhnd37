import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { OdooService } from "@services/odoo";
import { capitalizeWords, checkAccountTest, verifyDataAfterSorting } from "./catalog";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { waitForImageLoaded, verifyRedirectUrl } from "@utils/theme";

test.describe("Check Catalog PlusBase @TS_SB_PLB_CTL_UIC", () => {
  test.beforeAll(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
  });

  test("Verify show header @SB_PLB_CTL_UIC_1", async ({ conf, dashboard, snapshotFixture }) => {
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/plusbase/catalog`);
    await dashboard.waitForLoadState("networkidle");
    await dashboard.waitForSelector("#page-header");
    if (await dashboard.locator(`.button-close`).isVisible()) {
      await dashboard.locator(`.button-close`).click();
      await dashboard.waitForTimeout(1000);
    }

    const snapshots = conf.caseConf.expect.snapshot.split(",");
    await snapshotFixture.verify({ page: dashboard, selector: "#page-header", snapshotName: snapshots[0] });
    await waitForImageLoaded(dashboard, ".banner img");
    await dashboard.locator(".sb-pagination").scrollIntoViewIfNeeded();
    await dashboard.waitForTimeout(1000);
    await snapshotFixture.verify({ page: dashboard, selector: "#page-header", snapshotName: snapshots[1] });
  });

  test("Verify show banner @SB_PLB_CTL_UIC_3", async ({ hiveSBase, dashboard, conf }) => {
    let banner = "";
    let bannerLink = "";

    await test.step("Get setting on hive", async () => {
      const hiveDomain = conf.suiteConf.hive_domain;

      await hiveSBase.goto(`https://${hiveDomain}/admin/app/packagesetting/list?filter%5B_per_page%5D=256`);
      await hiveSBase
        .locator("//tr[td[2][normalize-space()='PlusBase'] and td[3][normalize-space()='yes']]//td[2]//a")
        .click();

      await hiveSBase.waitForLoadState("networkidle");

      const countKeyBanner = await hiveSBase
        .locator("//tr[td[@class='key' and normalize-space()='catalog_banner']]")
        .count();
      if (countKeyBanner) {
        banner = await hiveSBase
          .locator("//tr[td[@class='key' and normalize-space()='catalog_banner']]//td[@class='value']//div[1]")
          .innerText();
      }

      const countBannerLink = await hiveSBase
        .locator("//tr[td[@class='key' and normalize-space()='catalog_banner_link']]")
        .count();
      if (countBannerLink) {
        bannerLink = await hiveSBase
          .locator("//tr[td[@class='key' and normalize-space()='catalog_banner_link']]//td[@class='value']//div[1]")
          .innerText();
      }
    });

    await test.step("Verify show banner on dashboard", async () => {
      await dashboard.goto(`https:${conf.suiteConf.domain}/admin/plusbase/catalog`);
      await waitForImageLoaded(dashboard, ".banner img");

      if (banner) {
        const actualImage = await dashboard.getAttribute(".banner img", "src");
        expect(actualImage).toEqual(banner);
        await verifyRedirectUrl({ page: dashboard, selector: ".banner", redirectUrl: bannerLink });
      } else {
        await expect(dashboard.locator(".banner")).toBeHidden();
      }
    });
  });

  test("Verify search result with All categories @SB_PLB_CTL_UIC_4", async ({ dashboard, conf, odoo, authRequest }) => {
    const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
    const plusbasePage = new DropshipCatalogPage(dashboard, conf.suiteConf.domain);

    const productPerPage = 20;
    const catalog = OdooService(odoo);
    const isTest = checkAccountTest(conf.suiteConf.username);
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/plusbase/catalog`);

    for (const key of conf.caseConf.data) {
      let countResult = 0;
      await test.step("Get products by key from odoo", async () => {
        countResult = await catalog.countPlbCatalogProduct({
          isTestProduct: isTest,
          isRealProduct: !isTest,
          args: [["name", "ilike", key.key_search]],
        });
      });

      if (countResult > 0) {
        await test.step("Input key search and verify products", async () => {
          await dashboard.fill("input[placeholder='Search by product name']", key.key_search);
          await dashboard.waitForLoadState("networkidle");
          const productNames = await plusbasePage.getCatalogProductNames("Filter result");
          expect(productNames.length).toBeLessThanOrEqual(productPerPage);
          for (const productName of productNames) {
            expect(productName.toLocaleLowerCase()).toContain(key.key_search);
          }
        });

        await test.step("Change rule sort and verify", async () => {
          await dashboard.locator("[id*='Sort']").click();
          await dashboard.locator(`li:has-text('Most views')`).click();
          await dashboard.waitForLoadState("networkidle");
          let productNames = await plusbasePage.getCatalogProductNames("Filter result");
          productNames = productNames.map(name => name.trim());
          expect(productNames.length).toBeLessThanOrEqual(productPerPage);
          for (const productName of productNames) {
            expect(productName.toLocaleLowerCase()).toContain(key.key_search);
          }

          const apiProducts = (
            await plusbaseProductAPI.getCatalogProducts({
              search: key.key_search,
              page: 1,
              limit: 20,
              sort_mode: "desc",
              sort_field: "view",
            })
          ).products;
          expect(productNames).toEqual(apiProducts.map(product => product.name));
          verifyDataAfterSorting(apiProducts, "Most views");
        });
        continue;
      }

      await dashboard.fill("input[placeholder='Search by product name']", key.key_search);
      await expect(dashboard.locator(`text='Sorry, there's no matched product for “${key.key_search}”'`)).toBeVisible();
    }
  });

  test("Verify show collections @SB_PLB_CTL_UIC_7", async ({ dashboard, odoo, conf, authRequest }) => {
    let collections: Array<{ id: number; display_name: string }>;

    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);

    await test.step("Get collections from odoo", async () => {
      collections = await odoo.searchRead({
        model: "product.public.category",
        args: [
          ["x_is_custom_badge", "=", true],
          ["x_enable", "=", true],
          ["x_is_flash_sale", "=", false],
          ["x_is_testing", "=", false],
        ],
        fields: ["display_name", "x_product_public_category_handles"],
        offset: 0,
        limit: conf.caseConf.max_collection,
        order: "sequence asc",
      });
    });

    await test.step("Verify number of collections on dashboard", async () => {
      await dashboardPage.goto("admin/plusbase/catalog");
      await dashboard.waitForSelector(".catalog-products-view");
      const countCollections = await dashboard.locator(".catalog-products-view").count();

      // Collection invisiable if not have any product
      expect(collections.length).toBeGreaterThanOrEqual(countCollections);
    });

    for (const collection of collections) {
      let displayName = "";
      switch (collection.display_name.toLowerCase()) {
        case "best_selling":
        case "trending_now":
          displayName = capitalizeWords(collection.display_name.replace("_", " "));
          break;
        default:
          displayName = collection.display_name;
          break;
      }
      const collectionXpath = `.catalog-products-view:has(.title:has-text('${displayName}'))`;
      let skipNextStep = false;

      await test.step("Verify collection name", async () => {
        const apiProducts = (
          await plusbaseProductAPI.getCatalogProducts({
            page: 1,
            limit: 1,
            collection_id: collection.id,
          })
        ).products;

        if (apiProducts.length === 0) {
          await expect(dashboard.locator(collectionXpath)).toHaveCount(0);
          skipNextStep = true;
        } else {
          await expect(dashboard.locator(collectionXpath)).toHaveCount(1);
        }
      });

      if (skipNextStep) {
        continue;
      }

      await test.step("Click on View all and verify products of collection", async () => {
        const viewAll = `${collectionXpath} a:has-text('View all')`;
        const urlCollection = `page=1&limit=20&collection_id=${collection.id}`;
        await verifyRedirectUrl({ page: dashboard, selector: viewAll, redirectUrl: urlCollection });

        await dashboard.waitForSelector(".product__name");
        const countProducts = await dashboard.locator(".product__name").count();
        expect(countProducts).toBeGreaterThanOrEqual(1);

        await dashboardPage.goto("admin/plusbase/catalog");
        await dashboard.waitForSelector(".catalog-products-view");
      });
    }

    await test.step("Verify collection New Arrivals", async () => {
      const collectionName = await dashboard.locator(".catalog-products-view .title").last().textContent();
      await expect(collectionName.trim()).toEqual("New Arrivals");
    });
  });

  test("Verify show categories @SB_PLB_CTL_UIC_13", async ({ dashboard, conf, odoo }) => {
    let countParentCatagories = 0;
    let categories: Array<{
      id: number;
      parent_id: Array<string | number>;
      display_name: string;
      x_image_url: string;
      x_enable: boolean;
    }>;

    await test.step("Get categories on odoo", async () => {
      categories = await odoo.searchRead({
        model: "product.public.category",
        args: [["x_is_custom_badge", "=", false]],
        fields: ["display_name", "x_image_url", "parent_id", "x_enable"],
      });

      for (const category of categories) {
        if (!category.parent_id) {
          if (category.x_enable) {
            countParentCatagories++;
          }
        }
      }
    });

    await test.step("Open dashboard and verify number of categories", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/plusbase/catalog`);
      await dashboard.waitForLoadState("networkidle");
      await waitForImageLoaded(dashboard, ".banner img");
      await dashboard.waitForSelector("#catalog-categories-view .category");
      await expect(dashboard.locator("#all-categories.selected")).toBeVisible();
      await dashboard.locator("#catalog-categories-view").scrollIntoViewIfNeeded();

      const countCategory = await dashboard.locator(".category").count();
      expect(countCategory).toEqual(countParentCatagories);
    });

    await test.step("Verify categories name", async () => {
      for (const category of categories) {
        if (category.parent_id) {
          const isCheck = categories.filter(data => data.id === category.parent_id[0] && data.x_enable === false);
          if (isCheck) {
            break;
          }
        }
        if (category.display_name.includes("/")) {
          const categoryPath = category.display_name.split("/");

          await dashboard
            .locator(
              `//*[contains(@class, 'category') and descendant::span[normalize-space()="${capitalizeWords(
                categoryPath[0].trim(),
              )}"]]`,
            )
            .hover();

          await expect(
            dashboard.locator(
              `//div[contains(@class, 'sb-popover__popper') and not(contains(@style,'display: none;'))]//*[normalize-space()="${capitalizeWords(
                categoryPath[1].trim(),
              )}"]`,
            ),
          ).toBeVisible();
        } else {
          await expect(
            dashboard.locator(
              `//*[contains(@class, 'category') and descendant::span[normalize-space()="${capitalizeWords(
                category.display_name.trim(),
              )}"]]`,
            ),
          ).toBeVisible();
        }
      }
    });
  });

  test("Verify paging collection New Arrivals @SB_PLB_CTL_UIC_16", async ({ conf, dashboard, authRequest }) => {
    const plusbasePage = new DropshipCatalogPage(dashboard, conf.suiteConf.domain);
    const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);

    const defaultProductsPerPage = 12;
    let activePage: string, numberPages: number, countProducts: number, countAllProducts: number;
    let currentPage = 1;
    let productsPerPage = defaultProductsPerPage;
    let tempProductNames = new Array<string>();

    const collectionName = "New Arrivals";
    const pagingSelector = ".sb-pagination__list-item";
    const activePageSelector = ".sb-pagination__list-item.active";
    const collectionSelector = `.catalog-products-view:has(.title:has-text('${collectionName}'))`;

    await test.step("Get all products", async () => {
      const response = await plusbaseProductAPI.totalProduct();
      countAllProducts = response.total_products;
    });

    await test.step("Verify paging", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/plusbase/catalog`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.waitForSelector(collectionSelector);

      numberPages = Math.ceil(countAllProducts / productsPerPage);
      const lastPage = await dashboard.locator(pagingSelector).last().textContent();
      expect(parseInt(lastPage.trim())).toEqual(numberPages);

      activePage = await dashboard.locator(activePageSelector).textContent();
      expect(activePage.trim()).toEqual(currentPage.toString());
    });

    await test.step("Verify show products on active page", async () => {
      // Verify page 1
      if (numberPages == currentPage) {
        productsPerPage = countAllProducts;
      }

      countProducts = await plusbasePage.countCatalogProduct(collectionName);
      expect(countProducts).toEqual(productsPerPage);

      tempProductNames = await plusbasePage.getCatalogProductNames(collectionName);
    });

    await test.step("Click Next page icon and verify", async () => {
      // Verify next page
      currentPage += 1;
      if (numberPages > 1 && currentPage < numberPages) {
        await dashboard.locator(`${collectionSelector} g[id='Icons/Arrow/Chevron/Right']`).click();

        activePage = await dashboard.locator(activePageSelector).textContent();
        expect(activePage.trim()).toEqual(currentPage.toString());
        countProducts = await plusbasePage.countCatalogProduct(collectionName);
        expect(countProducts).toEqual(productsPerPage);

        // Compare product name
        const productNames = await plusbasePage.getCatalogProductNames(collectionName);
        expect(tempProductNames.sort()).not.toEqual(productNames.sort());
        tempProductNames = productNames;
      }
    });

    await test.step("Click on page index and verify", async () => {
      // Verify last page
      if (numberPages > 1) {
        await dashboard.locator(pagingSelector).last().click();
        await dashboard.waitForLoadState("networkidle");
        await dashboard.waitForSelector(collectionSelector);

        currentPage = Number(numberPages);
        await expect(dashboard.locator(activePageSelector)).toHaveText(currentPage.toString());

        if (countAllProducts !== productsPerPage * numberPages) {
          productsPerPage = countAllProducts - productsPerPage * (numberPages - 1);
        }
        countProducts = await plusbasePage.countCatalogProduct(collectionName);
        expect(countProducts).toEqual(productsPerPage);

        // Compare product name
        const productNames = await plusbasePage.getCatalogProductNames(collectionName);
        expect(tempProductNames.sort()).not.toEqual(productNames.sort());
      }
    });
  });

  test("Verify sort products collection New Arrivals @SB_PLB_CTL_UIC_17", async ({ dashboard, conf, authRequest }) => {
    const newArrivalsXpath = ".catalog-products-view:has(.title:has-text('New Arrivals'))";
    const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);

    await test.step("Open dashboard, select rule sort and verify", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/plusbase/catalog`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.waitForSelector(".catalog-products-view");

      for (const sort of conf.caseConf.sorts) {
        await dashboard.locator("[id*='Sort']").click();
        await dashboard.locator(`li:has-text('${sort.name}')`).click();
        await dashboard.waitForLoadState("networkidle");
        await dashboard.waitForSelector(newArrivalsXpath);
        let productNames = await dashboard.locator(`${newArrivalsXpath} .product__name`).allTextContents();
        productNames = productNames.map(name => name.trim());

        const apiProducts = (
          await plusbaseProductAPI.getCatalogProducts({
            page: 1,
            limit: 12,
            sort_mode: sort.sort_mode,
            sort_field: sort.sort_field,
          })
        ).products;

        expect(productNames).toEqual(apiProducts.map(product => product.name));
        verifyDataAfterSorting(apiProducts, sort.name);
      }
    });
  });
});
