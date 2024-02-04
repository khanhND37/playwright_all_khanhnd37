import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/api/product";

test.describe("Clone product Plusbase", () => {
  let dashboardPageFirst: DashboardPage;
  let dashboardPageSecond: DashboardPage;
  let productPageFirst: ProductPage;
  let productPageSecond: ProductPage;
  let productPageFirstAPI: ProductAPI;
  let accessToken: string;
  let domainFirst: string;
  let productHandle: string;
  test.beforeEach(async ({ dashboard, conf, page, token }) => {
    // Skip all case on prodtest env
    if (process.env.ENV === "prodtest") {
      return;
    }
    domainFirst = conf.suiteConf.info_shop_first.domain;
    dashboardPageSecond = new DashboardPage(dashboard, conf.suiteConf.domain);
    dashboardPageFirst = new DashboardPage(page, domainFirst);
    const shopToken = await token.getWithCredentials({
      domain: domainFirst,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    await dashboardPageFirst.loginWithToken(accessToken);
    await dashboardPageFirst.navigateToSubMenu("Dropship products", "All products");
    productPageFirst = new ProductPage(dashboardPageFirst.page, domainFirst);
    productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
  });

  const caseName = "CLONE_PRODUCT_PLB_TO_PLB";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.data.forEach(testCase => {
    const productName = testCase.product_name;
    const cloneInfo = testCase.clone_info;
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest, token }) => {
      test.setTimeout(conf.suiteConf.timeout);
      // Skip all case on prodtest env
      if (process.env.ENV === "prodtest") {
        return;
      }
      await test.step("Login vào first shop > đi đến màn hình All products và search product > Clone products sang second shop", async () => {
        productPageFirstAPI = new ProductAPI(domainFirst, authRequest);
        await productPageFirst.searchProduct(productName);
        const xpathProductName = await productPageFirst.getXpathProductName(productName);
        const isProductVisible = await productPageFirst.page
          .locator(`(${xpathProductName})[1]`)
          .isVisible({ timeout: 10000 });
        if (!isProductVisible) {
          await productPageFirstAPI.addProductPlusbaseByAPI(domainFirst, accessToken, testCase.body_add_product);
          await productPageFirstAPI.updateProductInfo(testCase.info_product_update);
          await productPageFirst.page.reload();
          await productPageFirst.searchProduct(productName);
        }
        await productPageFirst.cloneProductToStore(cloneInfo);
        //check hiển thị message thông báo clone thành công ở shop gốc
        await productPageFirst.checkMsgAfterCreated({
          message: `${conf.suiteConf.message} ${cloneInfo.second_shop}`,
        });
      });

      await test.step("Login vào second shop sau đó verify hiển thị status và process ở progress bar", async () => {
        await dashboardPageSecond.navigateToSubMenu("Dropship products", "All products");

        let textStatus;
        let textProcess;
        let j = 0;
        do {
          await productPageSecond.clickProgressBar();
          textStatus = await productPageSecond.getStatus();
          textProcess = await productPageSecond.getProcess();
          await productPageSecond.page.waitForTimeout(1000);
          await productPageSecond.page.click(productPageSecond.xpathTitleProduct);
          j++;
        } while (textStatus != conf.suiteConf.status && j < 11);
        //Kiểm tra trạng thái quá trình clone
        expect(textProcess).toEqual(testCase.process);
      });

      if (testCase.product_detail) {
        await test.step("Mở màn hình product detail > verify thông tin product trong màn product detail ở shop đích", async () => {
          await productPageSecond.searchProduct(productName);
          await productPageSecond.chooseProduct(productName);
          const shopToken = await token.getWithCredentials({
            domain: conf.suiteConf.domain,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          });
          accessToken = shopToken.access_token;
          // Lấy ProductId của product được clone và verify thông tin product được clone đủ giống product gốc
          const productId = await productPageSecond.getProductId(
            authRequest,
            productName,
            conf.suiteConf.domain,
            accessToken,
          );
          productHandle = await productPageSecond.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
          expect(
            await productPageSecond.getProductInfoDashboardByApi(
              authRequest,
              conf.suiteConf.domain,
              productId,
              testCase.product_detail,
              accessToken,
            ),
          ).toEqual(testCase.product_detail);
        });
      }

      if (testCase.product_sf) {
        await test.step("Verify thông tin product ngoài SF", async () => {
          expect(
            await productPageSecond.getProductInfoStoreFrontByApi(
              authRequest,
              conf.suiteConf.domain,
              productHandle,
              testCase.product_sf,
            ),
          ).toEqual(testCase.product_sf);
        });
      }
    });
  });
});
