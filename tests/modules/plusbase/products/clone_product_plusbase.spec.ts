import { loadData } from "@core/conf/conf";
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

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ conf, dashboard, token, authRequest }) => {
      // Setting watermark cho shop được clone
      const accessToken = (
        await token.getWithCredentials({
          domain: caseData.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await productAPI.setupWatermark(caseData.domain, caseData.watermark, accessToken);
      await productAPI.deleteProductByAPI(caseData.domain, accessToken, conf.suiteConf.param_body);

      await test.step(`${caseData.step_1}`, async () => {
        const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: conf.suiteConf.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await dashboardPage.loginWithToken(accessToken);
        await productPage.navigateToMenu("Products");
        await productPage.searchProduct(caseData.product_name);
        await productPage.cloneProductToStore(caseData.clone_info);
        await productPage.checkMsgAfterCreated({ message: caseData.message });
      });

      await test.step(`${caseData.step_2}`, async () => {
        const dashboardPage = new DashboardPage(dashboard, caseData.domain);
        await dashboardPage.loginWithToken(accessToken);
        await dashboardPage.navigateToMenu("Products");
        await productPage.clickProgressBar();
        expect(await productPage.getStatus()).toEqual(caseData.status);
        expect(await productPage.getProcess()).toEqual(caseData.process);
        await productPage.clickProgressBar();
      });

      await test.step(`${caseData.step_3}`, async () => {
        await productPage.searchProduct(caseData.product_name);
        await productPage.chooseProduct(caseData.product_name);
        // Lấy ProductId của product được clone và verify thông tin product được clone đủ giống product gốc
        const accessToken = (
          await token.getWithCredentials({
            domain: caseData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        const productId = await productAPI.getProductIdByHandle(caseData.product_validate_detail.product_handle);
        expect(
          await productPage.getProductInfoDashboardByApi(
            authRequest,
            caseData.domain,
            productId,
            caseData.product_validate_detail,
            accessToken,
          ),
        ).toEqual(caseData.product_validate_detail);

        // View ảnh của product được clone và verify ảnh có/không hiện watermark theo setting shop được clone
        await plusbasePage.clickButtonViewImage();
        expect(
          await plusbasePage
            .genLoc("//div[@class='s-flex content-image justify-content-center']//img[@class='img-responsive']")
            .screenshot(),
        ).toMatchSnapshot(`${caseData.case_name}.png`, {
          threshold: 0.1,
        });
      });

      await test.step(`${caseData.step_4}`, async () => {
        const accessToken = (
          await token.getWithCredentials({
            domain: caseData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        expect(
          await productAPI.getProductInfoStoreFrontByApi(
            caseData.domain,
            caseData.product_validate_detail.product_handle,
            caseData.product_validate_sf,
            accessToken,
          ),
        ).toEqual(caseData.product_validate_sf);
      });
    });
  }

  const confCloneMultiProduct = loadData(__dirname, "CLONE_MULTI_PRODUCT");
  for (let i = 0; i < confCloneMultiProduct.caseConf.data.length; i++) {
    const caseData = confCloneMultiProduct.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ conf, dashboard, token, authRequest }) => {
      await test.step(`${caseData.step_1}`, async () => {
        // Xóa product ở shop được clone
        const tokenSecondShop = (
          await token.getWithCredentials({
            domain: caseData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await productAPI.deleteProductByAPI(caseData.domain, tokenSecondShop, conf.suiteConf.param_body);
        if (caseData.body_add_product) {
          await productAPI.addProductPlusbaseByAPI(caseData.domain, tokenSecondShop, caseData.body_add_product);
        }
        const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessToken = shopToken.access_token;
        await dashboardPage.loginWithToken(accessToken);
        await productPage.navigateToMenu("Products");
        await productPage.searchProduct(caseData.search_product_title);
        await productPage.cloneProductToStore(caseData.clone_info);
        await productPage.checkMsgAfterCreated({
          message: caseData.message,
        });
        await test.step(`${caseData.step_2}`, async () => {
          const dashboardPage = new DashboardPage(dashboard, caseData.domain);
          const shopToken = await token.getWithCredentials({
            domain: caseData.domain,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          });
          const accessToken = shopToken.access_token;
          await dashboardPage.loginWithToken(accessToken);
          await dashboardPage.navigateToMenu("Products");
          await productPage.clickProgressBar();
          expect(await productPage.getStatus()).toEqual(caseData.status);
          expect(await productPage.getProcess()).toEqual(caseData.process);
        });
        await test.step(`${caseData.step_3}`, async () => {
          await dashboard.click("(//span[@data-label='Select all products']//span)[1]");
          expect(
            (await dashboard.locator(`//span[@class='color-gray-draker type--bold']`).textContent()).trim(),
          ).toContain(caseData.number_product);
        });
        await test.step(`${caseData.step_4}`, async () => {
          for (let i = 0; i < caseData.product_validate_detail; i++) {
            await productPage.searchProduct(caseData.product_validate_detail[i].product_name);
            await productPage.chooseProduct(caseData.product_validate_detail[i].product_name);
            // Lấy ProductId của product được clone và verify thông tin product được clone đủ giống product gốc
            const accessToken = (
              await token.getWithCredentials({
                domain: caseData.shop_name,
                username: conf.suiteConf.username,
                password: conf.suiteConf.password,
              })
            ).access_token;
            const productId = await productAPI.getProductIdByHandle(caseData.product_validate_detail[i].product_handle);
            expect(
              await productPage.getProductInfoDashboardByApi(
                authRequest,
                caseData.domain,
                productId,
                caseData.product_validate_detail[i],
                accessToken,
              ),
            ).toEqual(caseData.product_validate_detail[i]);
          }
        });
        await test.step(`${caseData.step_5}`, async () => {
          for (let i = 0; i < caseData.product_validate_sf; i++) {
            const accessToken = (
              await token.getWithCredentials({
                domain: caseData.shop_name,
                username: conf.suiteConf.username,
                password: conf.suiteConf.password,
              })
            ).access_token;
            expect(
              await productAPI.getProductInfoStoreFrontByApi(
                caseData.domain,
                caseData.product_validate_detail.product_handle,
                caseData.product_validate_sf,
                accessToken,
              ),
            ).toEqual(caseData.product_validate_sf);
          }
        });
      });
    });
  }

  test(` [Clone Plus_Plus] Clone product không thành công khi chọn [Skip the product] với product đã được clone
   @TC_PLB_PLB_CPP_21`, async ({ conf, dashboard, token }) => {
    await test.step(`
    Tại list product chọn product cần clone
    Action chọn Import product to another
    Trường Select the store to import to chọn store "au-des-plus.onshopbase.com"
    Trường If the importing handle exists, process the import as follows chọn Skip the product
    Click on btn Import
  `, async () => {
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
      await productPage.searchProduct(conf.caseConf.product_name);
      await productPage.cloneProductToStore(conf.caseConf.clone_info);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.message,
      });
    });
    await test.step(`Thực hiện step trên import product lần 2`, async () => {
      await dashboard.reload();
      await productPage.searchProduct(conf.caseConf.product_name);
      await productPage.cloneProductToStore(conf.caseConf.clone_info);
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
      await productPage.clickProgressBar();
      expect(await productPage.getStatus()).toEqual(conf.caseConf.status);
      expect(await productPage.getProcess()).toEqual(conf.caseConf.process);
    });
  });
});
