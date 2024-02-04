import { test } from "@fixtures/odoo";
import type { Categories, CategoryHandle, CatalogProductItem } from "@types";
import { CatalogAPI } from "@pages/api/dashboard/catalog";
import { expect } from "@core/fixtures";
import { ProductCatalogPlusBase } from "@pages/landing_page/product_catalog_plusbase";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { snapshotDir } from "@utils/theme";
import { OdooService } from "@services/odoo";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";

test.describe("PlusBase landing catalog page", () => {
  // Landing page chỉ có trên evn production
  let productCatalogPlusBase: ProductCatalogPlusBase;
  let domainLandingPage: string;
  test.beforeEach(async ({ conf, page }, testInfo) => {
    domainLandingPage = conf.suiteConf.domain_landing_page;
    productCatalogPlusBase = new ProductCatalogPlusBase(page, domainLandingPage);
    await page.goto(domainLandingPage);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test("@SB_PLB_PLB_PLCL_22 Verify categories hiển thị ngoài product catalog landing page", async ({
    conf,
    odoo,
    authRequest,
  }) => {
    const catalogAPI = new CatalogAPI(conf.suiteConf.domain, authRequest);

    let countParentCatagoriesInOdoo = 0;
    let countParentCatagoriesInLandingPage = 0;
    let categories: Array<{ id: number; parent_id: Array<string | number>; display_name: string }>;

    await test.step("Get categories on odoo > Verify data ngoài trang landing page", async () => {
      categories = await odoo.searchRead({
        model: "product.public.category",
        args: [
          ["x_is_custom_badge", "=", false],
          ["x_enable", "=", true],
        ],
        fields: ["parent_id", "display_name"],
      });

      const categoryOdoo = [];
      for (const category of categories) {
        if (category.parent_id && category.parent_id.length > 0) {
          continue;
        }
        categoryOdoo.push(category.display_name);
        countParentCatagoriesInOdoo += 1;
      }

      const response: Array<Categories> = await catalogAPI.getDataCategory(conf.caseConf.filter_conditions);
      const categoryLandingPage = [];
      for (const category of response) {
        if (category.parent_id > 0) {
          continue;
        }
        categoryLandingPage.push(category.name.replace(" ", ""));
        countParentCatagoriesInLandingPage += 1;
      }

      expect(countParentCatagoriesInOdoo).toEqual(countParentCatagoriesInLandingPage);
      expect(JSON.stringify(categoryOdoo).toLowerCase()).toEqual(JSON.stringify(categoryLandingPage).toLowerCase());
    });

    await test.step("Chọn một category > Verify total product trong 1 page", async () => {
      // Verify landing catalog page
      await productCatalogPlusBase.clickElementWithLabel("span", conf.caseConf.category_name);
      await productCatalogPlusBase.page.locator(productCatalogPlusBase.xpathCtaText).scrollIntoViewIfNeeded();
      await productCatalogPlusBase.page.waitForSelector(productCatalogPlusBase.xpathProductCard);
      const totalProductOnePage = await productCatalogPlusBase.page
        .locator(productCatalogPlusBase.xpathProductCard)
        .count();
      expect(totalProductOnePage).toEqual(conf.caseConf.total_product_one_page);
    });
  });

  test("@SB_PLB_PLB_PLCL_18 Verify hiển thị image và profit margin của product trong popup product catalog", async ({
    conf,
    snapshotFixture,
  }) => {
    const productName = conf.caseConf.product.product_name;
    const plusbasePage = new DropshipCatalogPage(productCatalogPlusBase.page, domainLandingPage);

    await test.step("Vào landing page > search product", async () => {
      await productCatalogPlusBase.searchProductCatalog(productName);
      expect(productCatalogPlusBase.isTextVisible(productName)).toBeTruthy();
    });

    await test.step("Vào product detail > Verify image product và profit margin", async () => {
      // go to product catalog detail
      await productCatalogPlusBase.openPopupProductCatalog(productName);
      const data = await productCatalogPlusBase.getDataProductCatalog();
      expect(data.variants.sort()).toEqual(conf.caseConf.product.variants.sort());
      const profitMargin = await plusbasePage.calculatorProfitMargin(
        data.first_item,
        conf.caseConf.processing_rate,
        data.base_cost,
        0.03,
        data.selling_price,
      );

      // verify profit margin
      expect(Number(profitMargin)).toEqual(data.profit_margin);

      // verify image product
      await snapshotFixture.verifyWithAutoRetry({
        page: productCatalogPlusBase.page,
        selector: productCatalogPlusBase.xpathImageProductCatalog(),
        snapshotName: `SB_PLB_PLB_PLCL_18.png`,
      });
    });
  });

  test("@SB_PLB_PLB_PLCL_23 Check thứ tự hiển thị products trong Collection ở collection đặc biệt: Best selling", async ({
    conf,
    authRequest,
    odoo,
  }) => {
    const odooService = OdooService(odoo);

    await test.step("Vào odoo > Get data product colection best selling > Vào landing catalog page > Verify hiển thị product trong collection best selling", async () => {
      //Get data product colection best selling
      const productHavePriority: Array<CategoryHandle> = await odooService.getAndSortProductCategoriesHavePriority(
        conf.caseConf.filter_conditions.category_ids,
      );

      // Get data product in landing catalog page
      const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
      const response = (await plusbaseProductAPI.getCatalogProducts(conf.caseConf.filter_conditions)).products;

      // Verify data
      for (let i = 0; i < productHavePriority.length; i++) {
        expect(productHavePriority[i].product_name).toEqual(response[i].name);
      }
    });
  });

  test("@SB_PLB_PLB_PLCL_28 Check thứ tự hiển thị product khi sort theo product cost ở màn category", async ({
    conf,
    authRequest,
  }) => {
    const filterConditions = conf.caseConf.filter_conditions;

    await test.step("Vào landing page > Sort theo product cost", async () => {
      const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
      for (const filterCondition of filterConditions) {
        const dataFilter: Array<CatalogProductItem> = (await plusbaseProductAPI.getCatalogProducts(filterCondition))
          .products;
        const dataBaseCost = dataFilter.map(item => item.min_base_cost);
        for (let i = 0; i < dataBaseCost.length - 1; i++) {
          if (filterCondition.sort_mode === "desc") {
            expect(dataBaseCost[i]).toBeGreaterThanOrEqual(dataBaseCost[i + 1]);
          } else {
            expect(dataBaseCost[i]).toBeLessThanOrEqual(dataBaseCost[i + 1]);
          }
          i++;
        }
      }
    });
  });
});
