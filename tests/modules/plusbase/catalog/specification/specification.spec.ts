import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { expect } from "@playwright/test";
import { OdooService } from "@services/odoo";

test.describe("config specification in odoo and verify display in UI", async () => {
  test("@SB_PLB_PSP_11 Verify show specifications trong product detail catalog", async ({ odoo, conf, dashboard }) => {
    const domain = conf.suiteConf.domain;
    const productId = conf.suiteConf.productId_catalog;
    const productOdoo = OdooService(odoo);
    const soDetailPage = new DropshipCatalogPage(dashboard, domain);

    await test.step("Vào Dropship products > Mở product catalog detail > Verify UI product detail", async () => {
      await productOdoo.deleteSpecification(productId);

      await soDetailPage.goToProductCatalogDetailById(productId);
      await expect(dashboard.locator("//*[normalize-space(text())='Specification'] ")).not.toBeVisible();
    });

    await test.step("Verify data trong tab Specification ", async () => {
      // create and get specification in odoo
      const spec = conf.caseConf.specification;
      const spectNames = [],
        specValues = [];

      spec.forEach(item => {
        spectNames.push(item.specName);
        specValues.push(item.specValue);
      });

      await productOdoo.createSpecification(productId, spectNames, specValues);

      const specNamesOdoo = await productOdoo.getSpecification(productId, "name");
      const specValuesOdoo = await productOdoo.getSpecification(productId, "value");

      // get specification in UI
      await soDetailPage.clickTabSpecification();

      const specNamesUI = await soDetailPage.getSpecificationSODetail("name");
      const specValuesUI = await soDetailPage.getSpecificationSODetail("value");

      expect(specNamesOdoo).toEqual(specNamesUI);
      expect(specValuesOdoo).toEqual(specValuesUI);
    });

    await test.step("Vào odoo > Update Specification cho product ", async () => {
      const valueSpec = conf.caseConf.valueSpecUpdate;
      await productOdoo.updateSpecification(productId, valueSpec);
    });

    await test.step("Mở product catalog detail trên dashboard > Verify Specification", async () => {
      //get specification odoo
      const specNamesOdoo = await productOdoo.getSpecification(productId, "name");
      const specValuesOdoo = await productOdoo.getSpecification(productId, "value");

      // get specification in UI
      await soDetailPage.clickTabSpecification();

      const specNamesUI = await soDetailPage.getSpecificationSODetail("name");
      const specValuesUI = await soDetailPage.getSpecificationSODetail("value");

      expect(specNamesOdoo).toEqual(specNamesUI);
      expect(specValuesOdoo).toEqual(specValuesUI);
    });

    await test.step("Vào odoo > Xóa Specification cho product ", async () => {
      await productOdoo.deleteSpecification(productId);
    });

    await test.step("Mở product catalog detail trên dashboard > Verify Specification ", async () => {
      await soDetailPage.goToProductCatalogDetailById(productId);
      await expect(dashboard.locator("//*[normalize-space(text())='Specification'] ")).not.toBeVisible();
    });
  });

  test("@SB_PLB_PSP_12 Verify show specifications trong product detail private", async ({ odoo, conf, dashboard }) => {
    const domain = conf.suiteConf.domain;
    const productId = conf.suiteConf.productId_ali;
    const productOdoo = OdooService(odoo);
    const soDetailPage = new DropshipCatalogPage(dashboard, domain);

    await test.step("Vào Private request > Mở product private detail > Verify UI product detail", async () => {
      await productOdoo.deleteSpecification(productId);

      await soDetailPage.goToProductRequestDetail(productId);
      await expect(dashboard.locator("//*[normalize-space(text())='Specification'] ")).not.toBeVisible();
    });

    await test.step("Verify data trong tab Specification ", async () => {
      // create and get specification in odoo
      const spec = conf.caseConf.specification;
      const spectNames = [],
        specValues = [];

      spec.forEach(item => {
        spectNames.push(item.specName);
        specValues.push(item.specValue);
      });

      await productOdoo.createSpecification(productId, spectNames, specValues);

      const specNamesOdoo = await productOdoo.getSpecification(productId, "name");
      const specValuesOdoo = await productOdoo.getSpecification(productId, "value");

      // get specification in UI
      await soDetailPage.clickTabSpecification();

      const specNamesUI = await soDetailPage.getSpecificationSODetail("name");
      const specValuesUI = await soDetailPage.getSpecificationSODetail("value");

      expect(specNamesOdoo).toEqual(specNamesUI);
      expect(specValuesOdoo).toEqual(specValuesUI);
    });

    await test.step("Vào odoo > Update Specification cho product ", async () => {
      const valueSpec = conf.caseConf.valueSpecUpdate;
      await productOdoo.updateSpecification(productId, valueSpec);
    });

    await test.step("Mở product private detail trên dashboard > Verify Specification ", async () => {
      //get specification odoo
      const specNamesOdoo = await productOdoo.getSpecification(productId, "name");
      const specValuesOdoo = await productOdoo.getSpecification(productId, "value");

      // get specification in UI
      await soDetailPage.clickTabSpecification();

      const specNamesUI = await soDetailPage.getSpecificationSODetail("name");
      const specValuesUI = await soDetailPage.getSpecificationSODetail("value");

      expect(specNamesOdoo).toEqual(specNamesUI);
      expect(specValuesOdoo).toEqual(specValuesUI);
    });

    await test.step("Vào odoo > Xóa Specification cho product ", async () => {
      await productOdoo.deleteSpecification(productId);
    });

    await test.step("Mở product private detail trên dashboard > Verify Specification ", async () => {
      await soDetailPage.goToProductRequestDetail(productId);
      await expect(dashboard.locator("//*[normalize-space(text())='Specification'] ")).not.toBeVisible();
    });
  });

  test("@TC_SB_PLB_PSP_13 Verify show specifications trong product admin", async ({ dashboard, conf, odoo }) => {
    const domain = conf.suiteConf.domain;
    const productId = conf.suiteConf.productId_ali;
    const productIdAdminDetail = conf.suiteConf.productId;
    const productOdoo = OdooService(odoo);
    const productPage = new ProductPage(dashboard, domain);

    await test.step("Vào Products > Mở product admin detail > Verify UI product detail ", async () => {
      await productOdoo.deleteSpecification(productId);
      await productPage.goToEditProductPage(productIdAdminDetail);

      await expect(dashboard.locator("//div[@class = 'specification']")).not.toBeVisible();
    });

    await test.step("Vào odoo config specification và verify data trong tab Specification  ", async () => {
      // create and get specification in odoo
      const spec = conf.caseConf.specification;
      const spectNames = [],
        specValues = [];

      spec.forEach(item => {
        spectNames.push(item.specName);
        specValues.push(item.specValue);
      });

      await productOdoo.createSpecification(productId, spectNames, specValues);

      const specNamesOdoo = await productOdoo.getSpecification(productId, "name");
      const specValuesOdoo = await productOdoo.getSpecification(productId, "value");

      //get specification in product detail

      await expect(async () => {
        await dashboard.reload();
        await dashboard.waitForLoadState("load");
        const specNamesUI = await productPage.getSpecificationProDetail("name");
        const specValuesUI = await productPage.getSpecificationProDetail("value");

        expect(specNamesOdoo).toEqual(specNamesUI);
        expect(specValuesOdoo).toEqual(specValuesUI);
      }).toPass();
    });

    await test.step("Vào odoo > Update Specification cho product  ", async () => {
      const valueSpec = conf.caseConf.valueSpecUpdate;
      await productOdoo.updateSpecification(productId, valueSpec);
    });

    await test.step("Mở product admin detail trên dashboard > Verify Specification  ", async () => {
      //get specification odoo
      const specNamesOdoo = await productOdoo.getSpecification(productId, "name");
      const specValuesOdoo = await productOdoo.getSpecification(productId, "value");

      // get specification in UI
      await dashboard.reload();
      await dashboard.waitForLoadState("load");
      await expect(async () => {
        const specNamesUI = await productPage.getSpecificationProDetail("name");
        const specValuesUI = await productPage.getSpecificationProDetail("value");

        expect(specNamesOdoo).toEqual(specNamesUI);
        expect(specValuesOdoo).toEqual(specValuesUI);
      }).toPass();
    });

    await test.step("Vào odoo > Xóa Specification cho product  ", async () => {
      await productOdoo.deleteSpecification(productId);
    });

    await test.step("Mở product admin detail trên dashboard > Verify Specification  ", async () => {
      await productPage.goToEditProductPage(productIdAdminDetail);

      await expect(dashboard.locator("//div[@class = 'specification']")).not.toBeVisible();
    });
  });
});
