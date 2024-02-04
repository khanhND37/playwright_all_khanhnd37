import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Clone product Plusbase", () => {
  let productPage;
  let plusbasePage;
  let productAPI;

  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    plusbasePage = new DropshipCatalogPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    test.setTimeout(conf.suiteConf.timeout);
  });

  test(`[Clone Plus_Plus] Verify quota khi Clone product trong 1 ngày @TC_PLB_PLB_CPP_24`, async ({
    conf,
    dashboard,
    token,
  }) => {
    await test.step(`Tại list product chọn all product cần clone
    > Action chọn Import product to another
    > Trường Select the store to import to chọn store "shop-clone-pluspbase02.onshopbase.com"
    > Trường If the importing handle exists, process the import as follows chọn Skip the product
    > Click on btn Import`, async () => {
      // Xóa product ở shop được clone
      const tokenSecondShop = (
        await token.getWithCredentials({
          domain: conf.caseConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await productAPI.deleteProductByAPI(conf.caseConf.domain, tokenSecondShop, conf.suiteConf.param_body);
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      const tokenFirstShop = (
        await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await dashboardPage.loginWithToken(tokenFirstShop);
      await productPage.navigateToMenu("Products");
      await plusbasePage.cloneAllProductToStore(conf.caseConf.clone_info);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.message,
      });
    });
    await test.step(`Tại shop thứ 2 Click on icon Process - Verify thông tin hiển thị`, async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.caseConf.domain);
      const tokenSecondShop = (
        await token.getWithCredentials({
          domain: conf.caseConf.domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await dashboardPage.loginWithToken(tokenSecondShop);
      await dashboardPage.navigateToMenu("Products");
      for (let i = 0; i < 100; i++) {
        const respone = await productPage.getStatus();
        await productPage.clickProgressBar();
        if (respone === conf.caseConf.status) {
          break;
        } else {
          await productPage.clickProgressBar();
          await dashboard.waitForTimeout(60000);
        }
      }
    });
  });

  test(`[Clone Plus_Plus] Verify product khi Clone nhiều product @TC_PLB_PLB_CPP_25`, async ({
    conf,
    dashboard,
    token,
    authRequest,
  }) => {
    await test.step(`
  Tại list product chọn product cần clone
  > Mục Action chọn Import product to another
  > Trường Select the store to import to chọn store au-des-plus.onshopbase.com
  > Trường If the importing handle exists, process the import as follows chọn Keep both products
  > Click on btn Import
  `, async () => {
      // Xóa product ở shop được clone
      const tokenSecondShop = (
        await token.getWithCredentials({
          domain: conf.caseConf.second_shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await productAPI.deleteProductByAPI(conf.caseConf.domain_second_shop, tokenSecondShop, conf.suiteConf.param_body);
      const dashboardPage = new DashboardPage(dashboard, conf.caseConf.domain_first_shop);
      const tokenFirstShop = (
        await token.getWithCredentials({
          domain: conf.caseConf.first_shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await dashboardPage.loginWithToken(tokenFirstShop);
      await productPage.navigateToMenu("Products");
      await plusbasePage.cloneAllProductToStore(conf.caseConf.clone_info);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.message,
      });
    });
    await test.step(`Tại shop thứ 2 Click on icon Process - Verify thông tin hiển thị`, async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.caseConf.domain_second_shop);
      const tokenSecondShop = (
        await token.getWithCredentials({
          domain: conf.caseConf.domain_second_shop,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await dashboardPage.loginWithToken(tokenSecondShop);
      await dashboardPage.navigateToMenu("Products");
      for (let i = 0; i < 100; i++) {
        await productPage.clickProgressBar();
        const respone = await productPage.getStatus();
        if (respone === conf.caseConf.status) {
          break;
        } else {
          await productPage.clickProgressBar();
          await dashboard.waitForTimeout(60000);
        }
      }
    });
    await test.step(`Verify số lượng product trong list`, async () => {
      await dashboard.click("(//span[@data-label='Select all products']//span)[1]");
      expect(
        (
          await dashboard.locator(`//span[normalize-space()='Select all 1000 products across all pages']`).textContent()
        ).trim(),
      ).toContain(conf.caseConf.number_product);
    });
    await test.step(`Verify các product trong dashboard và ngoài SF`, async () => {
      for (let i = 0; i < conf.caseConf.product_validate_detail; i++) {
        await productPage.searchProduct(conf.caseConf.product_validate_detail[i].product_name);
        await productPage.chooseProduct(conf.caseConf.product_validate_detail[i].product_name);
        // Lấy ProductId của product được clone và verify thông tin product được clone đủ giống product gốc
        const accessToken = (
          await token.getWithCredentials({
            domain: conf.caseConf.second_shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        const productId = await productAPI.getProductIdByHandle(
          conf.caseConf.product_validate_detail[i].product_handle,
        );
        expect(
          await productPage.getProductInfoDashboardByApi(
            authRequest,
            conf.caseConf.domain_second_shop,
            productId,
            conf.caseConf.product_validate_detail[i],
            accessToken,
          ),
        ).toEqual(conf.caseConf.product_validate_detail[i]);
      }
      for (let i = 0; i < conf.caseConf.product_validate_sf; i++) {
        const accessToken = (
          await token.getWithCredentials({
            domain: conf.caseConf.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        expect(
          await productAPI.getProductInfoStoreFrontByApi(
            conf.caseConf.domain_second_shop,
            conf.caseConf.product_validate_detail.product_handle,
            conf.caseConf.product_validate_sf,
            accessToken,
          ),
        ).toEqual(conf.caseConf.product_validate_sf);
      }
    });
  });
});
