import { test, expect } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { snapshotDir } from "@utils/theme";
import { ProductAPI } from "@pages/api/product";
import { loadData } from "@core/conf/conf";
import type { APIRequestContext } from "@playwright/test";
import type { ProductValue } from "@types";

test.describe("Bulk Editor", async () => {
  let productID: number;
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let dataEdit;
  let parameterSnapshot;

  test.beforeEach(async ({ conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const product = await productAPI.createNewProduct(conf.suiteConf.data.product);
    productID = product.id;
  });
  test.afterAll(async ({ conf }) => {
    await productAPI.deleteProductById(conf.suiteConf.domain, productID);
  });

  const checkDataChangeOnDashboardAndSF = async (
    authRequest: APIRequestContext,
    prodInfo: ProductValue,
    prodInfoSF: ProductValue,
    productHandle: string,
  ): Promise<void> => {
    // check data change in dashboard
    expect(
      await productPage.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productID, prodInfo),
    ).toEqual(prodInfo);

    //key dùng để lấy ra data của product ngoài SF API
    expect(
      await productPage.getProductInfoStoreFrontByApi(authRequest, conf.suiteConf.domain, productHandle, prodInfoSF),
    ).toEqual(prodInfoSF);
  };

  test("Verify màn Bulk editor @SB_PRO_BE_28", async ({ conf, dashboard, snapshotFixture }) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await productPage.goToProductList();
    parameterSnapshot = conf.caseConf.info_setup_snapshot;
    await test.step("Select 1 product -> Chọn action -> edit product", async () => {
      await productPage.selectProductByID(productID);
      await productPage.selectActionProduct("Edit products");
      await dashboard.waitForSelector(productPage.xpathPresentationBulkEditor);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathPresentationBulkEditor,
        snapshotName: parameterSnapshot.snapshot_name,
        snapshotOptions: {
          maxDiffPixelRatio: parameterSnapshot.max_diff_pixel_ratio,
          threshold: parameterSnapshot.threshold,
          maxDiffPixels: parameterSnapshot.max_diff_pixels,
        },
      });
    });
  });

  test("verify UI số lượng product tối đa hiển thị trong 1 page bulk editor @SB_PRO_BE_29", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await productPage.goToProductList();
    parameterSnapshot = conf.caseConf.info_setup_snapshot;

    await test.step("Chọn all product của 1 page-> click sang page 2", async () => {
      await productPage.selectAllProductOnListProduct();
      await dashboard.locator(productPage.xpathBtnNextPage).click();
      await expect(dashboard.locator(productPage.xpathTableProduct)).toBeVisible();
    });

    await test.step("Select thêm all product của page 2 product-> Chọn action -> edit product", async () => {
      await productPage.selectAllProductOnListProduct();
      await productPage.selectActionProduct("Edit products");
      await dashboard.waitForSelector(productPage.xpathBulkEditorTitle);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathVerifySnapshotPaging,
        snapshotName: parameterSnapshot.snapshot_name,
        snapshotOptions: {
          maxDiffPixelRatio: parameterSnapshot.max_diff_pixel_ratio,
          threshold: parameterSnapshot.threshold,
          maxDiffPixels: parameterSnapshot.max_diff_pixels,
        },
      });
    });
  });

  test("Verify use navigation keys 'Esc' to revert data of a cell. @SB_PRO_BE_30", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await productPage.goToProductList();
    dataEdit = conf.caseConf.data_edit;
    parameterSnapshot = conf.caseConf.info_setup_snapshot;

    await test.step("1. Select 1 product -> Chọn action -> edit product.", async () => {
      await productPage.selectProductByID(productID);
      await productPage.selectActionProduct("Edit products");
      await expect(dashboard.locator(productPage.xpathBulkEditorTitle)).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathPresentationBulkEditor,
        snapshotName: parameterSnapshot.snapshot_name2,
        snapshotOptions: {
          maxDiffPixelRatio: parameterSnapshot.max_diff_pixel_ratio,
          threshold: parameterSnapshot.threshold,
          maxDiffPixels: parameterSnapshot.max_diff_pixels,
        },
      });
    });
    await test.step("2. Edit cell title product -> Ấn phím 'Esc' ", async () => {
      await productPage.editProductInBulkEditor(dataEdit.valueEdit, 0, dataEdit.field);
      await dashboard.keyboard.press("Escape");
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathPresentationBulkEditor,
        snapshotName: parameterSnapshot.snapshot_name,
        snapshotOptions: {
          maxDiffPixelRatio: parameterSnapshot.max_diff_pixel_ratio,
          threshold: parameterSnapshot.threshold,
          maxDiffPixels: parameterSnapshot.max_diff_pixels,
        },
      });
    });
  });

  const conf = loadData(__dirname, "VERIFY_PRODUCT");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const dataSetting = conf.caseConf.data[i];
    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({ dashboard, conf, authRequest }) => {
      productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      await productPage.goToProductList();
      dataEdit = dataSetting.data_edit;
      parameterSnapshot = dataSetting.info_setup_snapshot;
      //productHandle
      const productHandle = await productPage.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productID);

      await test.step("- Select 1 product -> Click button action -> Chọn btn 'Edit product'", async () => {
        await productPage.selectProductByID(productID);
        await productPage.selectActionProduct("Edit products");
        await expect(dashboard.locator(productPage.xpathBulkEditorTitle)).toBeVisible();
      });

      await test.step("Input giá trị vào field, thực hiện Action", async () => {
        for (let i = 0; i < dataEdit.length; i++) {
          await productPage.editProductInBulkEditor(dataEdit[i].valueEdit, dataEdit[i].row, dataEdit[i].field);
          switch (dataEdit[i].action) {
            case "Enter":
              await dashboard.keyboard.press("Enter");
              //check thay đổi trong dashboard and sf
              await checkDataChangeOnDashboardAndSF(
                authRequest,
                dataEdit[i].product_all_info,
                dataEdit[i].product_validate_SF,
                productHandle,
              );
              break;

            case "Discard":
              await dashboard.keyboard.press("Enter");
              await productPage.clickOnBtnWithLabel("Discard");
              await dashboard.waitForSelector(productPage.xpathButtonDiscard, { state: "hidden" });
              //check thay đổi trong dashboard and sf
              await checkDataChangeOnDashboardAndSF(
                authRequest,
                dataEdit[i].product_all_info,
                dataEdit[i].product_validate_SF,
                productHandle,
              );
              break;

            case "Save changes":
              if (i < dataEdit.length - 1) {
                await dashboard.keyboard.press("Enter");
                continue;
              } else {
                await dashboard.keyboard.press("Enter");
                await productPage.clickOnBtnWithLabel("Save changes");
                await dashboard.waitForSelector(productPage.xpathButtonSaveChanges, { state: "hidden" });
              }
              //check thay đổi trong dashboard and sf
              await checkDataChangeOnDashboardAndSF(
                authRequest,
                dataEdit[i].product_all_info,
                dataEdit[i].product_validate_SF,
                productHandle,
              );
              break;
          }
        }
      });
    });
  }
});
