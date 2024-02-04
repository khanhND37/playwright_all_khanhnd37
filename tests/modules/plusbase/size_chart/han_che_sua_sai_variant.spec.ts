/* eslint-disable max-len */
import { test } from "@fixtures/odoo";
import { ProductPage } from "@pages/dashboard/products";
import { expect } from "@playwright/test";
import { OdooService } from "@services/odoo";

test.describe("Hạn chế merchant sửa sai variant", async () => {
  test("Verify show origin attribute fulfill với product chưa map size chart @TC_SB_PLB_OTMSC_2", async ({
    conf,
    dashboard,
    odoo,
  }) => {
    const domain = conf.suiteConf.domain;
    const productPage = new ProductPage(dashboard, domain);
    const productId = conf.suiteConf.product_id_odoo;

    const productOdoo = OdooService(odoo);

    const listVariantOdoo = await productOdoo.getVariantsProduct(productId);

    await test.step("Đến trang import list của product chưa map size chart", async () => {
      await productPage.goToImportListProducts(productId);

      const productName = conf.caseConf.product_name;
      const listVariantUI: Array<string> = await productPage.getValueFulfillWith(productName);

      expect(listVariantOdoo.length).toEqual(listVariantUI.length);
      listVariantOdoo.forEach(element => {
        expect(listVariantUI.includes(element)).toBeTruthy();
      });
    });

    await test.step("Đến trang edit variants", async () => {
      await productPage.goToEditProductPage(conf.suiteConf.product_id);
      await productPage.clickEditVariant();
      const listVariantUI = await productPage.getValueFulfillWithInEditVariantPage();
      expect(listVariantOdoo.length).toEqual(listVariantUI.length);
      listVariantOdoo.forEach(element => {
        expect(listVariantUI.includes(element)).toBeTruthy();
      });
    });
  });
});
