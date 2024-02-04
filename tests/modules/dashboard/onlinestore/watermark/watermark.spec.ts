import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { ProductAPI } from "@pages/api/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import { csvToJson } from "@helper/file";
import path from "path";

let productAPI: ProductAPI;
let dashboardPage: DashboardPage;
let productPage: ProductPage;
let accessToken: string;
let storeFrontProduct: SFProduct;
let staffPage: DashboardPage;
let productStaffPage: ProductPage;
let status;

const verifyStyleEnable = async (style: Array<string>) => {
  for (let i = 0; i < style.length; i++) {
    const xpathStyle = dashboardPage.getXpathWithLabel(style[i]);
    expect(await dashboardPage.checkLocatorVisible(xpathStyle)).toBeTruthy();
  }
};
test.describe("Verify set watermark", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, token }, testInfo) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    await productAPI.setupWatermark(conf.suiteConf.domain, conf.suiteConf.watermark_default, accessToken);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_SET_TYPE_ANY");
  conf.caseConf.data.forEach(testCase => {
    test(`${testCase.description} @${testCase.case_id}`, async ({ snapshotFixture, token }) => {
      await test.step("Pre-condition: Merchant login dashboard > Online store > Watermark: Enable is On", async () => {
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        accessToken = shopToken.access_token;
        await dashboardPage.navigateToSubMenu("Online Store", "Watermark");
        await productAPI.setupWatermark(conf.suiteConf.domain, testCase.watermark, accessToken);
        const type = testCase.type;
        await dashboardPage.page.click(dashboardPage.getXpathWithLabel(type), { timeout: 10000 });
        await test.step("Merchant chọn style", async () => {
          await verifyStyleEnable(testCase.style);
        });
      });

      for (let i = 0; i < testCase.style.length; i++) {
        const style = testCase.style[i];
        await test.step(`Merchant chọn style ${style}`, async () => {
          await dashboardPage.page.locator(dashboardPage.getXpathWithLabel(style)).click();
          await dashboardPage.page.waitForTimeout(2000);
          await snapshotFixture.verify({
            page: dashboardPage.page,
            selector: dashboardPage.xpathImageStylePreview,
            snapshotName: `${testCase.case_id}_${style}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
          });
        });
      }

      await test.step("Merchant chọn Save", async () => {
        await dashboardPage.page.locator(dashboardPage.xpathBtnWithLabel("Save")).click();
        await dashboardPage.page.waitForLoadState("networkidle");
        expect(await dashboardPage.getTextContent(dashboardPage.xpathMessSaveWaterMarkSuccess)).toBe(
          conf.suiteConf.message_save_water_mark_success,
        );
      });
    });
  });

  const confStyle = loadData(__dirname, "DATA_DRIVEN_SET_TYPE_AND_STYLE");
  confStyle.caseConf.data.forEach(testCase => {
    test(`${testCase.description} @${testCase.case_id}`, async ({ context, token, conf, snapshotFixture }) => {
      await test.step("Tạiproduct page, merchant view product được tạo trước khi bật watermark", async () => {
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        accessToken = shopToken.access_token;
        await productAPI.setupWatermark(conf.suiteConf.domain, conf.suiteConf.watermark_off, accessToken);
        await dashboardPage.goto(conf.suiteConf.url_home);
        await dashboardPage.navigateToMenu("Products");
        await productPage.addNewProductWithData(conf.suiteConf.product);
        await productPage.waitForToastMessageHide(conf.suiteConf.message_create_product_success);
        await productPage.page.waitForTimeout(2000);
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathMedia,
          snapshotName: `${testCase.case_id}_off_watermark_media.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
      await test.step("Tại storefronts, Buyer view product được tạo trước khi bật watermark", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), productPage.clickViewProductSF()]);
        storeFrontProduct = new SFProduct(SFPage, conf.suiteConf.domain);
        let checkImageMockupError;
        do {
          await storeFrontProduct.page.waitForSelector(storeFrontProduct.xpathProductMockupSlide);
          await storeFrontProduct.waitForImagesMockupLoaded();
          await storeFrontProduct.waitForImagesDescriptionLoaded();
          checkImageMockupError = await storeFrontProduct.page
            .locator(storeFrontProduct.xpathImageMockupError)
            .isVisible({ timeout: 90000 });
          await storeFrontProduct.page.reload();
        } while (checkImageMockupError);

        await snapshotFixture.verify({
          page: storeFrontProduct.page,
          selector: storeFrontProduct.xpathImageActive,
          snapshotName: `${testCase.case_id}_off_watermark_storefront.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await productPage.deleteProductInProductDetail();
        await storeFrontProduct.page.close();
      });
      await test.step("Tại product page,merchant view product được tạo sau khi bật watermark", async () => {
        await productAPI.setupWatermark(conf.suiteConf.domain, testCase.watermark, accessToken);
        await dashboardPage.navigateToMenu("Products");
        await productPage.addNewProductWithData(conf.suiteConf.product);
        await productPage.waitForToastMessageHide(conf.suiteConf.message_create_product_success);
        await productPage.page.waitForTimeout(2000);
        await snapshotFixture.verify({
          page: productPage.page,
          selector: productPage.xpathMedia,
          snapshotName: `${testCase.case_id}_on_watermark_media.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
      await test.step("Tại storefronts, Buyer view product được tạo sau khi bật watermark", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), productPage.clickViewProductSF()]);
        storeFrontProduct = new SFProduct(SFPage, conf.suiteConf.domain);
        await storeFrontProduct.page.waitForLoadState("networkidle");
        await storeFrontProduct.page.waitForTimeout(2000);
        let checkImageMockupError;
        do {
          await storeFrontProduct.page.waitForSelector(storeFrontProduct.xpathProductMockupSlide);
          await storeFrontProduct.waitForImagesMockupLoaded();
          await storeFrontProduct.waitForImagesDescriptionLoaded();
          checkImageMockupError = await storeFrontProduct.page
            .locator(storeFrontProduct.xpathImageMockupError)
            .isVisible({ timeout: 90000 });
          await storeFrontProduct.page.reload();
        } while (checkImageMockupError);
        await snapshotFixture.verify({
          page: storeFrontProduct.page,
          selector: storeFrontProduct.xpathImageActive,
          snapshotName: `${testCase.case_id}_on_watermark_storefront.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await productPage.deleteProductInProductDetail();
        await storeFrontProduct.page.close();
      });
    });
  });

  test("[ShopBase] Merchant import products với ảnh đã có sẵn watermarks @SB_WTM_40", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const fileCSV = conf.caseConf.file;
    const productName = conf.caseConf.name_product;
    await test.step("Tại Product> All product: Merchant chọn import product có ảnh watermark->Merchant view product import ở màn hình product detail", async () => {
      await productAPI.setupWatermark(conf.suiteConf.domain, conf.caseConf.watermark, accessToken);
      await dashboardPage.navigateToMenu("Products");
      await productPage.searchProdByName(conf.caseConf.name_product);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathTableLoad);
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      const pathFile = path.join(fileCSV);
      await productPage.importProduct(pathFile, productPage.xpathImportFile, false, true);

      do {
        await productPage.page.waitForTimeout(60000);
        await productPage.navigateToMenu("Products");
        await productPage.clickProgressBar();
        status = await productPage.getStatus(conf.caseConf.file_name, 1);
      } while (status != conf.caseConf.status);

      expect(await productPage.getStatus(conf.caseConf.file_name)).toEqual(conf.caseConf.status);
      expect(await productPage.getProcess(conf.caseConf.file_name)).toEqual(conf.caseConf.process);
      await productPage.clickProgressBar();
      await productPage.chooseProduct(productName);
      await productPage.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathMedia,
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
      await storeFrontProduct.page.waitForTimeout(2000);
      await storeFrontProduct.waitForImagesMockupLoaded();
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

    await test.step("After: Delete product imported", async () => {
      // delete product ở step cuối để clear data thành công
      await productPage.navigateToMenu("Products");
      await productPage.searchProdByName(conf.caseConf.name_product);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathTableLoad);
      await productPage.deleteProduct(conf.suiteConf.password);
    });
  });

  test("[ShopBase] Merchant clone products với ảnh watermarks sang store mới set Watermark: Enable is On @SB_WTM_43", async ({
    conf,
    token,
    page,
    context,
    snapshotFixture,
  }) => {
    const product = conf.caseConf.product;
    await dashboardPage.navigateToMenu("Products");
    await productAPI.setupWatermark(conf.suiteConf.domain, conf.caseConf.watermark_first, accessToken);
    await productPage.addNewProductWithData(product);
    await productPage.waitForToastMessageHide(conf.suiteConf.message_create_product_success);
    await dashboardPage.navigateToMenu("Products");
    await productPage.searchProduct(product.title);
    await productPage.cloneProductToStore(conf.caseConf.clone_info);

    await test.step("Merchant login store khác view product ở màn hình product detail", async () => {
      const shopToken = await token.getWithCredentials({
        domain: conf.caseConf.shop_clone.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      await productAPI.setupWatermark(conf.caseConf.shop_clone.domain, conf.caseConf.watermark, accessToken);
      staffPage = new DashboardPage(page, conf.caseConf.shop_clone.domain);
      await staffPage.loginWithToken(accessToken);
      productStaffPage = new ProductPage(staffPage.page, conf.caseConf.shop_clone.domain);
      await staffPage.navigateToMenu("Products");
      let textStatus;
      let j = 0;
      do {
        await productStaffPage.clickProgressBar();
        textStatus = await productStaffPage.getStatus();
        await productStaffPage.page.waitForTimeout(1000);
        await productStaffPage.page.click(productStaffPage.xpathTitleProduct);
        j++;
      } while (textStatus != "Completed" && j < 11);
      await productStaffPage.searchProduct(product.title);
      await productStaffPage.chooseProduct(product.title);
      await productStaffPage.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: productStaffPage.page,
        selector: productStaffPage.xpathMedia,
        snapshotName: conf.caseConf.picture.image_detail,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });

      await test.step("Tại storefronts, Buyer view product", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), productStaffPage.clickViewProductSF()]);
        storeFrontProduct = new SFProduct(SFPage, conf.suiteConf.domain);
        await storeFrontProduct.waitResponseWithUrl("/assets/landing.css", 90000);
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
        await storeFrontProduct.page.close();
        await dashboardPage.navigateToMenu("Products");
        await productPage.searchProduct(product.title);
        await productPage.deleteProduct(conf.suiteConf.password);
      });
    });
  });

  test("[ShopBase] Merchant export products với ảnh watermarks @SB_WTM_42", async ({ conf, page, snapshotFixture }) => {
    const product = conf.caseConf.product;
    await productAPI.setupWatermark(conf.suiteConf.domain, conf.caseConf.watermark, accessToken);
    await dashboardPage.navigateToMenu("Products");
    await productPage.addNewProductWithData(product);
    await productPage.waitForToastMessageHide(conf.suiteConf.message_create_product_success);
    await dashboardPage.navigateToMenu("Products");
    await productPage.searchProduct(product.title);
    await test.step("Tại Product> All product: Merchant chọn export->Merchant mở file export và mở link Variant Image", async () => {
      await productPage.exportProduct(conf.caseConf.export_info, conf.caseConf.forder_name);
      const dataFileExport = await csvToJson(conf.caseConf.file_csv);
      for (let i = 0; i < dataFileExport.length; i++) {
        await page.goto(dataFileExport[i]["Image Src"]);
        await waitForImageLoaded(page, "//body//img");
        await snapshotFixture.verify({
          page: page,
          snapshotName: `SB_WTM_42_${i}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      }
      await productPage.searchProduct(product.title);
      await productPage.deleteProduct(conf.suiteConf.password);
    });
  });
});
