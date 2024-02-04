import { expect } from "@core/fixtures";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import dayjs from "dayjs";
import { CheckoutAPI } from "@pages/api/checkout";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { removeExtraSpace, roundingDecimal } from "@core/utils/string";
import { OdooService } from "@services/odoo";

test.describe("Flash sale for PlusBase", async function () {
  let domain, shippingMethodTitle: string;
  let categoryId, productId, variantId, baseCost, timeRetry: number;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let plusbaseOrderAPI: PlusbaseOrderAPI;
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    categoryId = conf.suiteConf.category_fls_id;
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    productId = conf.suiteConf.product_id;
    variantId = conf.suiteConf.variant_id;
    baseCost = conf.suiteConf.base_cost;
    timeRetry = conf.suiteConf.time_retry;
    shippingMethodTitle = conf.suiteConf.shipping_method_title;
  });
  test.beforeEach(async ({ odoo, conf }) => {
    const odooService = OdooService(odoo);
    await odooService.updateFlashsale(
      odoo,
      conf.suiteConf.category_fls_id,
      dayjs().add(conf.caseConf.add_day, "day"),
      conf.caseConf.duration,
    );
  });

  test("Verify base cost của sản phẩm trong catalog flash sales bị hết hạn @SB_PLB_CTL_FLS_6", async () => {
    const product = await plusbaseProductAPI.getProductCatalogDetail(productId);
    expect(product).not.toBeNull();
    expect(product.variants).not.toBeNull();

    expect(product.product_public_categories).not.toBeNull();

    const flsCategory = product.product_public_categories.find(c => c.id === categoryId);
    expect(flsCategory).not.toBeUndefined();
    expect(flsCategory.x_enable).toBeTruthy();
    expect(flsCategory.x_start_flash_sale).toBeGreaterThan(0);
    expect(flsCategory.x_duration_flash_sale).toBeGreaterThan(0);
    const startFlsDate = dayjs.unix(flsCategory.x_start_flash_sale);
    expect(startFlsDate.add(flsCategory.x_duration_flash_sale, "day").unix()).toBeLessThan(dayjs().unix());

    const targetVariant = product.variants.find(v => v.id === variantId);
    expect(targetVariant).not.toBeUndefined();

    expect(targetVariant.base_cost).toEqual(baseCost);
  });

  test("Verify base cost của order khi checkout với sản phẩm trong catalog có setting end flash sales @SB_PLB_CTL_FLS_5", async ({
    authRequest,
    conf,
  }) => {
    expect(conf.suiteConf.wait_time_profit).toBeGreaterThan(0);
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: [
        {
          variant_id: conf.suiteConf.sb_variant_id,
          quantity: 1,
        },
      ],
      isMultipleShipping: true,
      shippingMethodName: shippingMethodTitle,
    });

    const plusbaseOrder = await plusbaseOrderAPI.getOrderPlbDetail(checkoutInfos.order.id, {
      retry: timeRetry,
      waitBefore: conf.suiteConf.wait_time_profit,
    });
    expect(plusbaseOrder).not.toBeUndefined();
    expect(plusbaseOrder.id).toBeGreaterThan(0);
    expect(plusbaseOrder.base_cost).toEqual(conf.suiteConf.base_cost);
  });

  test("Verify base cost của order được apply discount cost khi checkout với các product trong flash sales @SB_PLB_CTL_FLS_4", async ({
    authRequest,
    conf,
  }) => {
    expect(conf.suiteConf.wait_time_profit).toBeGreaterThan(0);
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: [
        {
          variant_id: conf.suiteConf.sb_variant_id,
          quantity: 1,
        },
      ],
      isMultipleShipping: true,
      shippingMethodName: shippingMethodTitle,
    });
    const plusbaseOrder = await plusbaseOrderAPI.getOrderPlbDetail(checkoutInfos.order.id, {
      retry: timeRetry,
      waitBefore: conf.suiteConf.wait_time_profit,
    });
    expect(plusbaseOrder).not.toBeUndefined();
    expect(plusbaseOrder.id).toBeGreaterThan(0);
    expect(plusbaseOrder.base_cost).toEqual(conf.suiteConf.discount_base_cost);
  });

  test("Check thay đổi giá base cost theo discount trong flash sales khi import product @SB_PLB_CTL_FLS_3", async ({
    conf,
    dashboard,
  }) => {
    const catalogPage = new DropshipCatalogPage(dashboard, domain);
    const addResp = await plusbaseProductAPI.addToImportList([productId]);
    expect(addResp.success).toBeTruthy();

    const importList = await plusbaseProductAPI.getImportList([productId]);

    expect(importList.result.length).toBeGreaterThan(0);
    for await (const variant of importList.result[0].variants) {
      if (variant.id === conf.suiteConf.variant_id) {
        expect(variant.base_cost).toEqual(conf.suiteConf.discount_base_cost);
      }
    }

    const variantBaseCost = await plusbaseProductAPI.getVariantBaseCost(conf.suiteConf.sb_product_id);
    expect(variantBaseCost.variant_base_cost[conf.suiteConf.sb_variant_id]).not.toBeUndefined();
    expect(variantBaseCost.variant_base_cost[conf.suiteConf.sb_variant_id].base_cost).toEqual(
      conf.suiteConf.discount_base_cost,
    );
    await dashboard.goto(`https://${domain}/admin/products/${conf.suiteConf.sb_product_id}`);
    await dashboard.waitForSelector(".product__variant__action");
    await catalogPage.selectVariantCombo({
      group_combo_by: conf.suiteConf.group_combo_by,
      combo_names: conf.suiteConf.combo_names,
    });
    await expect(
      removeExtraSpace(
        await dashboard
          .locator(`//table[contains(@class,"combo__table")]//tr[1]/td[5]/div[1][@class="combo__cost"]`)
          .textContent(),
      ),
    ).toEqual(`$${roundingDecimal(conf.suiteConf.combo_base_cost, 2)}`);
  });

  test("Check show flash sales trên catalog after start date @SB_PLB_CTL_FLS_2", async ({ conf, dashboard }) => {
    const catalogPage = new DropshipCatalogPage(dashboard, domain);
    await expect(conf.suiteConf.flashsale_title).not.toBeNull();
    await catalogPage.goToCatalogPage(domain);
    await expect(
      await dashboard.locator(
        `//div[contains(@class, "has-flash-sale")]/span[contains(@class, "title") and contains(text(), "${conf.suiteConf.flashsale_title}")]`,
      ),
    ).toBeVisible();

    await catalogPage.searchAndViewProductCatalog(conf.suiteConf.product_name);

    await expect(
      removeExtraSpace(
        await dashboard
          .locator(
            `//div[contains(@class, "product__name") and contains(text(), "${conf.suiteConf.product_name}")]/following-sibling::div[2]/div[contains(@class, "sb-text-red")]`,
          )
          .textContent(),
      ),
    ).toEqual(`$${roundingDecimal(conf.suiteConf.discount_base_cost, 2)}`);

    await catalogPage.searchAndViewProductCatalog(conf.suiteConf.normal_product_name);

    await expect(
      removeExtraSpace(
        await dashboard
          .locator(
            `(//div[contains(@class, "product__name") and contains(text(), "${conf.suiteConf.normal_product_name}")]/following-sibling::div[2]//div[contains(@class, "sb-text-neutral")])[1]`,
          )
          .textContent(),
      ),
    ).toEqual(`${conf.suiteConf.normal_base_cost}`);
  });

  test("Check show flash sales trên catalog before start date @SB_PLB_CTL_FLS_1", async ({ conf, odoo, dashboard }) => {
    const catalogPage = new DropshipCatalogPage(dashboard, domain);
    const categoryId = conf.suiteConf.category_fls_id;
    await expect(conf.suiteConf.flashsale_title).not.toBeNull();

    await test.step("Update flash sale category", async () => {
      await odoo.update("product.public.category", categoryId, {
        x_is_flash_sale: false,
      });
    });

    await catalogPage.goToCatalogPage(domain);

    await expect(
      await dashboard.locator(
        `//div[contains(@class, "has-flash-sale")]/span[contains(@class, "title") and contains(text(), "${conf.suiteConf.flashsale_title}")]`,
      ),
    ).not.toBeVisible();

    await expect(
      await dashboard.locator(
        `//div[contains(@class, "has-flash-sale")]/parent::div/parent::div[contains(@class, "catalog-products-view__title-block")]/following-sibling::div[contains(@class, "catalog-products-view__products")]//div[contains(@class, "product__name") and contains(text(), "${conf.suiteConf.product_name}")]`,
      ),
    ).not.toBeVisible();
  });
});
