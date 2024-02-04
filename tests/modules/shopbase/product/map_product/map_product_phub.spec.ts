import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify mapping printhub for product", () => {
  let dashboardPage: DashboardPage;
  let product: ProductPage;
  let productInfo;
  let picture;
  let snapshotOptions;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.navigateToMenu("Products");
    productInfo = conf.caseConf.product_info;
    picture = conf.caseConf.picture;
    snapshotOptions = conf.suiteConf.snapshot_options;
  });

  test("Verify UI hiển thị phần upload artwork khi thay đổi select base product @SB_PRH_MP_119", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Add new product > Chọn [More options] > Click button [Map product] của PrintHub > Verify hiển thị default phần Upload your artworks", async () => {
      await product.searchProduct(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
      await product.addNewProductWithData(productInfo);
      await product.openFulfillmentSetupScreen(productInfo.app_name);
      await dashboard.reload();
      await dashboard.waitForLoadState("domcontentloaded");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.waitUntilElementVisible(product.xpathTitleToBeFulfilled);
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathUploadArtwork,
        snapshotName: `${picture}`,
        snapshotOptions,
        sizeCheck: true,
      });
    });
    const loadConfigData = conf.caseConf.DATA_DRIVEN_MAPPING.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        await product.selectBaseProductOnFulfillmentSetup(caseData.base_product);
        await product.waitUntilElementVisible(product.xpathTitleToBeFulfilled);
        await snapshotFixture.verify({
          page: dashboard,
          selector: product.xpathUploadArtwork,
          snapshotName: `${caseData.picture_name}`,
          snapshotOptions,
          sizeCheck: true,
        });
      });
    }
  });

  test("Verify mapping product không thành công khi upload artwork không hợp lệ @SB_PRH_MP_120", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Add new product > Chọn [More options] > Click button [Map product] của PrintHub > Click field [Select a product] > Chọn base product", async () => {
      await product.searchProduct(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
      await product.addNewProductWithData(productInfo);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.openFulfillmentSetupScreen(productInfo.app_name);
      await dashboard.reload();
      await dashboard.waitForLoadState("domcontentloaded");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.waitUntilElementVisible(product.xpathTitleToBeFulfilled);
      await product.selectBaseProductOnFulfillmentSetup(productInfo.base_product);
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathSelectBaseProduct,
        snapshotName: `${picture}`,
        snapshotOptions,
        sizeCheck: true,
      });
    });
    const loadConfigData = conf.caseConf.DATA_DRIVEN_UPLOAD_ARTWORK.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      await test.step(`${caseData.step}`, async () => {
        if (i == 0) {
          // await prepareFile(caseData.s3_path, caseData.local_path);
          // await product.uploadArtworkOnFulfillmentSetup(caseData.side, caseData.local_path);
        } else {
          await product.uploadArtworkOnFulfillmentSetup(caseData.side, caseData.artwork);
          await expect(dashboard.locator(product.xpathMessage(caseData.message))).toBeVisible();
        }
      });
    }
  });

  test("Verify action delete /change artwork thành công @SB_PRH_MP_121", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Add new product > Chọn [More options] > Click button [Map product] của PrintHub > Select base product> Upload artwork", async () => {
      await product.searchProduct(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
      await product.addNewProductWithData(productInfo);
      await product.openFulfillmentSetupScreen(productInfo.app_name);
      await dashboard.reload();
      await dashboard.waitForLoadState("domcontentloaded");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.waitUntilElementVisible(product.xpathTitleToBeFulfilled);
      await product.selectBaseProductOnFulfillmentSetup(productInfo.base_product);
      await product.uploadArtworkOnFulfillmentSetup(productInfo.side, productInfo.artwork);
      await product.waitForElementVisibleThenInvisible(product.xpathProcessBarUploadArtwork(productInfo.side));
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathUploadArtwork,
        snapshotName: `${picture.upload_artwork}`,
        snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step("Hover and click button Preview Image > chọn image hợp lệ", async () => {
      await dashboard.hover(product.xpathArtworkUploaded(productInfo.side));
      await dashboard.focus(product.xpathFocusBtnOnUploadArtwork(productInfo.side));
      await dashboard.click(product.xpathBtnWithArtwork());
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathPreviewArtwork,
        snapshotName: `${picture.change_artwork}`,
        snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step("Hover and click button Delete artwork", async () => {
      await dashboard.click(product.xpathButtonClosePopupPreviewImage);
      await dashboard.hover(product.xpathArtworkUploaded(productInfo.side));
      await dashboard.focus(product.xpathFocusBtnOnUploadArtwork(productInfo.side));
      await dashboard.click(product.xpathBtnWithArtwork(2));
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathUploadArtwork,
        snapshotName: `${picture.delete_artwork}`,
        snapshotOptions,
        sizeCheck: true,
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_MAP_PRODUCT");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
        const productData = caseData.product_info;
        const picture = caseData.picture;
        await test.step("Precondition: Search product name > Delete product > Add new product", async () => {
          await product.searchProduct(productData.title);
          await product.deleteProduct(conf.suiteConf.password);
          await product.addNewProductWithData(productData);
          await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
          if (caseData.case_id != "SB_PRH_MP_122") {
            await product.addVariants(productData);
          }
          await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
        });

        await test.step("Chọn [More options] > Click button [Map product] của PrintHub > Chọn base product> Upload artwork", async () => {
          await product.gotoProductDetail(productData.title);
          await product.openFulfillmentSetupScreen(productData.app_name);
          if (await product.checkButtonVisible("Save")) {
            await product.clickOnBtnWithLabel("Save");
          }
          await dashboard.waitForLoadState("domcontentloaded");
          await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
          await product.waitUntilElementVisible(product.xpathTitleToBeFulfilled);
          await product.selectBaseProductOnFulfillmentSetup(productData.base_product);
          await product.uploadArtworkOnFulfillmentSetup(productData.side, productData.artwork);
          await product.waitForElementVisibleThenInvisible(product.xpathProcessBarUploadArtwork(productData.side));
          await product.waitForElementVisibleThenInvisible(product.xpathIconLoadImage);
          await product.removeLiveChat();
          await snapshotFixture.verify({
            page: dashboard,
            selector: product.xpathUploadArtwork,
            snapshotName: `${picture.upload_artwork}`,
            snapshotOptions,
            sizeCheck: true,
          });
        });

        await test.step("Click on checkbox and select variant need mapping> Click button Save", async () => {
          await product.mapProductVariants(caseData.variant_mapping);
          await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
          await snapshotFixture.verify({
            page: dashboard,
            selector: product.xpathResultMapped,
            snapshotName: `${picture.result_mapped}`,
            snapshotOptions,
            sizeCheck: true,
          });
        });

        await test.step("Back lại màn Product detail > Verify status mapping", async () => {
          await product.clickOnBreadcrumb();
          await expect(dashboard.locator(product.xpathStatusMappedProduct(productData.app_name))).toBeVisible();
        });
      });
    }
  }
});
