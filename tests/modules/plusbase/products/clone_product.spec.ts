import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CatalogPage } from "@pages/dashboard/catalog";
import { ProductPage } from "@pages/dashboard/products";
import type { ProductTemplate } from "@types";
import { ProductAPI } from "@pages/api/product";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";

test.describe("Clone product", async () => {
  test(" [PlusBase] Verify clone product private request giữa 2 store plusbase khác owners @SB_PRO_CP_296", async ({
    token,
    conf,
    dashboard,
    authRequest,
    odoo,
  }) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    const domain = conf.suiteConf.domain;
    const productName = conf.caseConf.data.product_name;
    const catalogPage = new CatalogPage(dashboard, domain);
    let prodShopStaff: ProductTemplate;
    let prodShopOwner: ProductTemplate;
    const odooService = OdooService(odoo);
    const reasonId = conf.suiteConf.cancel_reason_id;

    await test.step("Vào Products > Search product cần clone", async () => {
      const dashboardPage = new DashboardPage(dashboard, domain);
      const productPage = new ProductPage(dashboard, domain);
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProdByName(productName);
    });

    await test.step(" Select product > clone product to store owner", async () => {
      const productPage = new ProductPage(dashboard, domain);
      await productPage.selectAndCloneProduct(conf.suiteConf.domain_owner);

      const staffToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });

      // get data product store staff
      prodShopStaff = await catalogPage.getDataProduct(
        conf.suiteConf.domain,
        staffToken.access_token,
        conf.suiteConf.product_id,
      );
    });

    await test.step("Vào màn product private request detail của store owner > Kiểm tra thông tin SO", async () => {
      const ownerToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain_owner,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain_owner);
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain_owner);
      await dashboardPage.loginWithToken(ownerToken.access_token);
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProdByName(productName);
      expect(await productPage.page.waitForSelector(await productPage.getXpathProductName(productName))).toBeTruthy();

      // get data product store owner
      prodShopOwner = await catalogPage.getDataProduct(
        conf.suiteConf.domain_owner,
        ownerToken.access_token,
        conf.suiteConf.product_id,
      );
      const productCloneDetail = {
        product: prodShopOwner.id,
        name: prodShopOwner.product_name,
        processingTime: prodShopOwner.processing_time,
        processingRate: prodShopOwner.Processing_rate,
        description: prodShopOwner.description,
        productCrawlStatus: prodShopOwner.product_crawl_status,
        requestUrl: prodShopOwner.request_url,
      };

      // verify data product store owner and store staff
      expect(productCloneDetail).toEqual(
        expect.objectContaining({
          product: prodShopStaff.id,
          name: prodShopStaff.product_name,
          processingTime: prodShopStaff.processing_time,
          processingRate: prodShopStaff.Processing_rate,
          description: prodShopStaff.description,
          productCrawlStatus: prodShopStaff.product_crawl_status,
          requestUrl: prodShopStaff.request_url,
        }),
      );

      const productAPI = new ProductAPI(conf.suiteConf.domain_owner, authRequest);
      await productAPI.deleteAllProduct(conf.suiteConf.domain_owner, ownerToken.access_token);
      await odooService.cancelQuotation(prodShopOwner.quotation_id, reasonId);
    });
  });
});
