import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import path from "path";
import { DashboardPage } from "@pages/dashboard/dashboard";
import appRoot from "app-root-path";

test.describe("Limit import products by csv", async () => {
  let product;
  let dashboardPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.navigateToMenu("Products");
  });

  test(`[Import csv] Import file csv vượt quá limit product 1 ngày của shop free @TC_SB_PRO_IMP_145`, async ({
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const importInfo = conf.caseConf.import_info;
    await test.step(`Import file csv có 60 product`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/file_60_products.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
    });
    await test.step(`Check process sau khi import file có 60 product`, async () => {
      await product.clickProgressBar();
      expect(await product.getStatus()).toEqual(importInfo.status);
      expect(await product.getProcess()).toEqual(importInfo.process);
    });
    await test.step(`Import file csv có 2990 product`, async () => {
      await product.goToProductList();
      const pathFile = path.join(appRoot + "/assets/import_product_csv/file-with-2990-product.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.checkMsgAfterCreated({
        errMsg: importInfo.error_message,
      });
    });
  });

  test(`[Import csv] Import file csv vượt quá limit product 1 ngày của shop basic @TC_SB_PRO_IMP_146`, async ({
    dashboard,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.caseConf.domain);
    const importInfo = conf.caseConf.import_info;
    await test.step(`Import file csv có 60 product`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/file_60_products.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
    });
    await test.step(`Check process sau khi import file có 60 product`, async () => {
      await product.clickProgressBar();
      expect(await product.getStatus()).toEqual(importInfo.status);
      expect(await product.getProcess()).toEqual(importInfo.process);
    });
    await test.step(`Import file csv có 2990 product`, async () => {
      await product.goToProductList();
      const pathFile = path.join(appRoot + "/assets/import_product_csv/file-with-2990-product.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.checkMsgAfterCreated({
        errMsg: importInfo.error_message,
      });
    });
  });

  test(`[Import csv] Import file csv vượt quá limit product 1 ngày của shop standard @TC_SB_PRO_IMP_147`, async ({
    dashboard,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.caseConf.domain);
    const importInfo = conf.caseConf.import_info;
    await test.step(`Import file csv có 60 product`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/file_60_products.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
    });
    await test.step(`Check process sau khi import file có 60 product`, async () => {
      await product.clickProgressBar();
      expect(await product.getStatus()).toEqual(importInfo.status);
      expect(await product.getProcess()).toEqual(importInfo.process);
    });
    await test.step(`Import file csv có 5980 product`, async () => {
      await product.goToProductList();
      const pathFile = path.join(appRoot + "/assets/import_product_csv/import-with-5980-product.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.checkMsgAfterCreated({
        errMsg: importInfo.error_message,
      });
    });
  });

  test(`[Import csv] Import file csv vượt quá limit product 1 ngày của shop pro @TC_SB_PRO_IMP_148`, async ({
    dashboard,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.caseConf.domain);
    const importInfo = conf.caseConf.import_info;
    await test.step(`Import file csv có 345 product`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/file_345_products.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
    });
    await test.step(`Check process sau khi import file có 345 product`, async () => {
      await product.clickProgressBar();
      expect(await product.getStatus()).toEqual(importInfo.status);
      expect(await product.getProcess()).toEqual(importInfo.process);
    });
    await test.step(`Import file csv có 29700 product`, async () => {
      await product.goToProductList();
      const pathFile = path.join(appRoot + "/assets/import_product_csv/import-with-29700-product.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.checkMsgAfterCreated({
        errMsg: importInfo.error_message,
      });
    });
  });
});
