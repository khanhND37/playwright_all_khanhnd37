import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { ProductAPI } from "@pages/api/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import { PrintBasePage } from "@pages/dashboard/printbase";
import path from "path";

let productAPI: ProductAPI;
let dashboardPage: DashboardPage;
let productPage: ProductPage;
let accessToken: string;
let storeFrontProduct: SFProduct;
let printbasePage: PrintBasePage;
let status;

test.describe("Verify set watermark", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, token }, testInfo) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });
  test("[PrintBase] Merchant import products với ảnh đã có sẵn watermarks @SB_WTM_38", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const fileCSV = conf.caseConf.file;
    const campName = conf.caseConf.camp_name;

    await test.step("Tại Product> All product: Merchant chọn import product có ảnh watermark->Merchant view product import ở màn hình product detail", async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await productAPI.setupWatermark(conf.suiteConf.domain, conf.caseConf.watermark, accessToken);
      await printbasePage.searchWithKeyword(campName);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      const pathFile = path.join(fileCSV);
      await productPage.importProduct(pathFile, productPage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(campName, 1);
      } while (status !== conf.caseConf.status);

      expect(await productPage.getStatus()).toEqual(conf.caseConf.status);
      expect(await productPage.getProcess()).toEqual(conf.caseConf.process);
      await productPage.clickProgressBar();
      const media = await printbasePage.waitDisplayMockupDetailCampaign(campName);
      expect(media).toBeTruthy();
      await productPage.page.hover(productPage.xpathTitle);
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathListMedia,
        snapshotName: conf.caseConf.picture.image_detai,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
    await test.step("Tại storefronts, Buyer view product", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), productPage.clickViewProductSF()]);
      storeFrontProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await storeFrontProduct.page.waitForLoadState("networkidle");
      await storeFrontProduct.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: storeFrontProduct.page,
        selector: storeFrontProduct.xpathImageActive,
        snapshotName: conf.caseConf.picture.image_storefront,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });
});
