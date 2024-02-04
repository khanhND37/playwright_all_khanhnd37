import { test } from "@fixtures/theme";
import { loadData } from "@core/conf/conf";
import { ProductPage } from "@pages/dashboard/products";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { expect } from "@core/fixtures";
import { CollectionPage } from "@pages/dashboard/collections";
import { SFCollection } from "@sf_pages/collection";
import { VariantDetailPage } from "@pages/dashboard/variant_detail";
import { SFProduct } from "@sf_pages/product";
import path from "path";
import appRoot from "app-root-path";
import { Page } from "@playwright/test";

test.describe("Product in collection auto @TS_SB_CL_AUTO", async () => {
  let SFPage: Page;
  let collectionSF: SFCollection;
  let productPageSF: SFProduct;

  const editValueProduct = async (
    productPage: ProductPage,
    variantDetail: VariantDetailPage,
    productInfo,
    fieldEdit,
    valueEdit,
  ): Promise<void> => {
    switch (fieldEdit) {
      case "Title":
        await productPage.goToProductList();
        await productPage.editProduct(productInfo.title, valueEdit);
        break;
      case "Tag":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.deleteTagOnProductDetailPage(productInfo.tag);
        await productPage.setProductTags(valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Vendor":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.editProductVendor(valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Product type":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.editProductType(valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Price":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.setProductPrice(valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Compare at price":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.setProductComparePrice(valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Weight":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.setProductWeight(valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Inventory stock":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.setInventoryPolicy("ShopBase tracks this product's inventory", valueEdit);
        await productPage.clickOnBtnWithLabel("Save changes");
        break;
      case "Product variant":
        await productPage.gotoProductDetail(productInfo.title);
        await productPage.clickEditVariant();
        await variantDetail.editVariantInfo(valueEdit);
        await productPage.clickOnElement("//div[@class='add-variant-page']//a[normalize-space()='Products']");
        break;
    }
  };
  test.beforeEach(async ({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const collectionAuto = conf.caseConf.data[i];
    test(`@${collectionAuto.case_id} ${collectionAuto.description}`, async ({
      dashboard,
      conf,
      context,
      snapshotFixture,
    }) => {
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
      const variantDetail = new VariantDetailPage(dashboard, conf.suiteConf.domain);
      const productInfo = collectionAuto.product_info;
      const productInfoEdit = collectionAuto.product_info_edit;
      const collectionInfo = collectionAuto.collection_info;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const xpathCollectionOnProductDetail =
        "//div[@class='s-form-item' and descendant::label[normalize-space()='Collections']]";

      await test.step("Precondition: Delete old data and create new data", async () => {
        await productPage.goToProductList();
        await productPage.searchProdByName(productInfo.title);
        await productPage.deleteProduct(conf.suiteConf.password);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        await collection.gotoCollectionList();
        await collection.searchCollection(collectionInfo.collection_title);
        await collection.waitForElementVisibleThenInvisible(collection.xpathTableLoading);
        await collection.deleteAllCollection();
        await collection.waitForElementVisibleThenInvisible(collection.xpathToastMessage);
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.page.waitForSelector(collection.xpathDescriptionArea);
        await collection.createCollection(collectionInfo);
      });

      await test.step("Tại dashboard đi đến màn All product > click button Add product > Nhập thông tin product > click button Save changes", async () => {
        await productPage.goToProductList();
        await productPage.addNewProductWithData(productInfo);
        if (collectionAuto.field_edit === "Product variant") {
          await productPage.addVariants(productInfo);
        }
      });

      await test.step("Reload lai trang product page >  Check block Collections", async () => {
        do {
          await productPage.gotoProductDetail(productInfo.title);
          await productPage.page.waitForSelector(productPage.xpathDescriptionFrame);
          await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//div[@class='tag-list-items']/span)[1]").isHidden());
        await productPage.page.waitForLoadState("networkidle");
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathCollectionOnProductDetail,
          snapshotName: `block-add-collections-on-product-${collectionAuto.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
        do {
          await collection.gotoCollectionDetail(collectionInfo.collection_title);
          await collection.page.waitForSelector(collection.xpathDescriptionArea);
          await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isHidden());
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo.product_collection)).toBe(true);
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        // wait for product sau khi tao sync trong db
        await collection.page.waitForTimeout(30000);
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await collectionSF.waitResponseWithUrl("/assets/landing.css", 500000);
        await SFPage.waitForLoadState("networkidle");
        if (await SFPage.locator(`//img[contains(@class,'image sb-lazy loading hover-secondary')]`).isVisible()) {
          await SFPage.waitForSelector(`//img[contains(@class,'image sb-lazy loading hover-secondary')]`, {
            state: "hidden",
          });
        }
        while ((await collectionSF.page.locator(collectionSF.xpathProductExampleInCollection).count()) > 0) {
          await collectionSF.page.reload({ waitUntil: "domcontentloaded" });
          await collectionSF.waitAbit(1000); //chờ 1 giây để tránh load spam
        }
        await collectionSF.page.waitForSelector(collectionSF.xpathFirstProductInCollection);
        expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo.product_collection)).toBe(true);
        await SFPage.close();
      });

      await test.step("Đi đến màn All product > search product > Open product detai > Edit value > Click button [Save changes]", async () => {
        await editValueProduct(
          productPage,
          variantDetail,
          productInfo,
          collectionAuto.field_edit,
          collectionAuto.value_edit,
        );
        if (collectionAuto.field_edit !== "Product variant") {
          await collection.isToastMsgVisible("Product was successfully saved!");
          await dashboard.waitForSelector("//div[@class='s-toast is-dark is-bottom']", { state: "hidden" });
        }
      });

      await test.step("Reload lai trang product page >  Check block Collections", async () => {
        if (collectionAuto.field_edit === "Title") {
          await productPage.gotoProductDetail(collectionAuto.value_edit);
        } else {
          await productPage.gotoProductDetail(productInfo.title);
        }
        do {
          await productPage.page.reload();
          await productPage.page.waitForSelector(productPage.xpathDescriptionFrame);
          await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
        } while (await dashboard.locator("//div[@class='tag-list-items']/span").isVisible());
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathCollectionOnProductDetail,
          snapshotName: `block-remove-collections-on-product-${collectionAuto.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
        do {
          await collection.gotoCollectionDetail(collectionInfo.collection_title);
          await collection.page.waitForSelector(collection.xpathDescriptionArea);
          await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isVisible());
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo.product_collection)).toBe(false);
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await SFPage.waitForLoadState("networkidle");
        if (await SFPage.locator(`//img[contains(@class,'image sb-lazy loading hover-secondary')]`).isVisible()) {
          await SFPage.waitForSelector(`//img[contains(@class,'image sb-lazy loading hover-secondary')]`, {
            state: "hidden",
          });
        }
        expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo.product_collection)).toBe(false);
        await SFPage.close();
      });

      await test.step("Đi đến màn All product > search product > Open product detai > Edit lại value > Click button [Save changes]", async () => {
        if (collectionAuto.field_edit === "Title" || collectionAuto.field_edit === "Tag") {
          await editValueProduct(
            productPage,
            variantDetail,
            productInfoEdit,
            collectionAuto.field_edit,
            collectionAuto.value_revert_edit,
          );
        } else {
          await editValueProduct(
            productPage,
            variantDetail,
            productInfo,
            collectionAuto.field_edit,
            collectionAuto.value_revert_edit,
          );
        }
        if (collectionAuto.field_edit !== "Product variant") {
          await collection.isToastMsgVisible("Product was successfully saved!");
          await dashboard.waitForSelector("//div[@class='s-toast is-dark is-bottom']", { state: "hidden" });
        }
      });

      await test.step("Reload lai trang product page >  Check block Collections", async () => {
        do {
          await productPage.gotoProductDetail(productInfo.title);
          await productPage.page.waitForSelector(productPage.xpathDescriptionFrame);
          await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
        } while (await dashboard.locator("//div[@class='tag-list-items']/span").isHidden());
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathCollectionOnProductDetail,
          snapshotName: `block-re-add-collections-on-product-${collectionAuto.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
        do {
          await collection.gotoCollectionDetail(collectionInfo.collection_title);
          await collection.page.waitForSelector(collection.xpathDescriptionArea);
          await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isHidden());
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo.product_collection)).toBe(true);
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await collectionSF.waitUntilElementVisible(
          "//div[contains(@class,'container collection-detail')]//div[contains(@class,'direction-column')]",
        );
        expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo.product_collection)).toBe(true);
        await SFPage.close();
      });

      await test.step("Tại dashboard đi đến màn All product > Search product > Click button Actions > Click Delete selected products > click button Delete", async () => {
        await productPage.deleteProductOnProductList(productInfo.title);
      });

      await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
        do {
          await collection.gotoCollectionDetail(collectionInfo.collection_title);
          await collection.page.waitForSelector(collection.xpathDescriptionArea);
          await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isVisible());
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo.product_collection)).toBe(false);
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await collectionSF.waitResponseWithUrl("/assets/landing.css", 500000);
        await collectionSF.page.waitForSelector("//div[contains(@class,'collection-detail')]", { timeout: 9000 });
        expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo.product_collection)).toBe(false);
        await SFPage.close();
      });

      await test.step("After test: Delete collection", async () => {
        await collection.gotoCollectionList();
        await collection.searchCollection(collectionInfo.collection_title);
        await collection.waitForElementVisibleThenInvisible(collection.xpathTableLoading);
        await collection.deleteAllCollection();
        await collection.waitForElementVisibleThenInvisible(collection.xpathToastMessage);
      });
    });
  }

  test("[Sync Product - Collection auto] Check mutil condition trong collection auto @SB_CL_SPC_17", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    const collectionInfo1 = conf.caseConf.collection_info1;
    const collectionInfo2 = conf.caseConf.collection_info2;
    const collectionDelete = conf.caseConf.collection_delete;
    const productInfo = conf.caseConf.product_info;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const xpathCollectionOnProductDetail =
      "//div[@class='s-form-item' and descendant::" + "label[normalize-space()='Collections']]";
    await test.step("Precondition: Delete old data and create new data", async () => {
      await productPage.goToProductList();
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      for (let i = 0; i < collectionDelete.length; i++) {
        await collection.gotoCollectionList();
        await collection.searchCollection(collectionDelete[i]);
        await collection.page.waitForTimeout(3000);
        await collection.deleteAllCollection();
      }
      await collection.waitForElementVisibleThenInvisible(collection.xpathToastMessage);
      for (const product of productInfo) {
        await productPage.page.goto(`https://${conf.suiteConf.domain}/admin/products`);
        await productPage.addNewProductWithData(product);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      }
    });

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Input [Title] > Chọn Collection type = Automated > chọn Add condtiton >  Chọn Conditions > Click button [Save]",
      async () => {
        await collection.gotoCollectionList();
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.page.waitForSelector(collection.xpathDescriptionArea);
        await collection.createCollection(collectionInfo1);
        do {
          // chờ 2 giây để sync product vào collection, back and access again để check hiển thị product trong collection
          await dashboard.waitForTimeout(2000);
          await collection.gotoCollectionDetail(collectionInfo1.collection_title);
          await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isHidden());
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo1.product_collection)).toBe(true);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await SFPage.waitForLoadState("networkidle");
      if (await SFPage.locator(`//img[contains(@class,'image sb-lazy loading hover-secondary')]`).isVisible()) {
        await SFPage.waitForSelector(`//img[contains(@class,'image sb-lazy loading hover-secondary')]`, {
          state: "hidden",
        });
      }
      while ((await collectionSF.page.locator('//div[@data-id="collection_page"]//a[@target="_blank"]').count()) > 0) {
        await collectionSF.page.reload({ waitUntil: "domcontentloaded" });
        await collectionSF.waitAbit(1000); //chờ 1 giây để tránh load spam
      }
      expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo1.product_collection)).toBe(true);
      await SFPage.close();
    });

    await test.step("Tại dashboard đi đến màn All product > Search product > Open product detail", async () => {
      await productPage.gotoProductDetail(productInfo[0].title);
      await waitForImageLoaded(dashboard, productPage.xpathLastProductImage);
      await productPage.page.waitForSelector(productPage.xpathDescriptionFrame);
      await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathCollectionOnProductDetail,
        snapshotName: "block-add-collections-auto-A-on-product.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      productPageSF = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productPageSF.getProductTitle()).toContain(productInfo[0].title);
      await SFPage.close();
    });

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Input [Title] > Chọn Collection type = Automated > chọn Add condtiton >  Chọn Conditions > Click button [Save]",
      async () => {
        await collection.gotoCollectionList();
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.page.waitForSelector(collection.xpathDescriptionArea);
        await collection.createCollection(collectionInfo2);
        do {
          // chờ 2 giây để sync product vào collection, back and access again để check hiển thị product trong collection
          await dashboard.waitForTimeout(2000);
          await collection.gotoCollectionDetail(collectionInfo2.collection_title);
          await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
        } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isHidden());
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo2.product_collection)).toBe(true);
      },
    );

    await test.step("Tại dashboard đi đến màn All product > Search product > Open product detail", async () => {
      await productPage.gotoProductDetail(productInfo[1].title);
      await dashboard.waitForSelector(xpathCollectionOnProductDetail);
      await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathCollectionOnProductDetail,
        snapshotName: "block-add-collections-auto-B-on-product.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      productPageSF = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productPageSF.getProductTitle()).toContain(productInfo[1].title);
      await SFPage.close();
    });
  });

  test(
    "[Sync Product - Collection auto] Check product được import từ file CSV thỏa mãn condition" +
      " của collection auto @SB_CL_SPC_18",
    async ({ dashboard, conf, context, snapshotFixture }) => {
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
      const collectionInfo = conf.caseConf.collection_info;
      const productInfo = conf.caseConf.product_info;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const xpathCollectionOnProductDetail =
        "//div[@class='s-form-item' and descendant::" + "label[normalize-space()='Collections']]";
      const xpathBlockProduct =
        "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
      await productPage.goToProductList();
      await productPage.deleteProduct(conf.suiteConf.password);

      await test.step(
        "Tại dashboard đi đến màn All product > Click button Import > " + "Chọn file import > Click button Upload File",
        async () => {
          const pathFile = path.join(appRoot + "/data/shopbase/import_product_collection.csv");
          await productPage.importProduct(pathFile, "//input[@type='file' and @accept='.zip, .csv']", false);
          await dashboard.reload();
        },
      );

      await test.step("Tại dashboard đi đến màn All product > Search product > Open product detail", async () => {
        await productPage.gotoProductDetail(productInfo.title);
        await dashboard.waitForSelector(xpathCollectionOnProductDetail);
        await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathCollectionOnProductDetail,
          snapshotName: "block-add-collections-auto-import-on-product.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
        productPageSF = new SFProduct(SFPage, conf.suiteConf.domain);
        expect(await productPageSF.getProductTitle()).toContain(productInfo.title);
        await SFPage.close();
      });

      await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
        await collection.gotoCollectionDetail(collectionInfo.collection_title);
        await dashboard.waitForSelector(xpathBlockProduct);
        expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo.product_collection)).toBe(true);
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
        expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo.product_collection)).toBe(true);
        await SFPage.close();
      });
    },
  );

  test(
    "[Sync Product - Collection auto] Check product được bulk update để thỏa mãn condition " +
      "của collection auto @SB_CL_SPC_19",
    async ({ dashboard, conf, context, snapshotFixture }) => {
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
      const collectionInfo = conf.caseConf.collection_info;
      const bulkUpdateInfo = conf.caseConf.bulk_update_info;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const xpathCollectionOnProductDetail =
        "//div[@class='s-form-item' and descendant::" + "label[normalize-space()='Collections']]";
      const xpathBlockProduct =
        "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      const pathFile = path.join(appRoot + "/data/shopbase/product_collection_auto.csv");
      await productPage.importProduct(pathFile, "//input[@type='file' and @accept='.zip, .csv']", false);
      await productPage.waitFortImportProductSuccess(2);

      for (let i = 0; i < bulkUpdateInfo.length; i++) {
        await test.step(
          "Tại dashboard, Chọn Products > Chọn [Bulk update] > Click btn [Creat an update] > " +
            "Chọn Action > Chọn Filter > Click button [Preview Bulk Update] > Click button [Start Bulk Update] " +
            "> Click button [Update]",
          async () => {
            await productPage.createBulkUpdate(bulkUpdateInfo[i]);
            await productPage.startBulkUpdate();
            await dashboard.reload();
            await collection.waitUntilElementVisible("//div[@class='page-bulk-updates']");
            expect(await productPage.getInfoBulkUpdate()).toEqual(bulkUpdateInfo[i].bulk_update_info);
          },
        );

        await test.step(
          "Tại dashboard, đi đến màn Collections list > Search collection > " + "Open collection detail ",
          async () => {
            await collection.gotoCollectionDetail(collectionInfo.collection_title);
            await dashboard.waitForSelector(xpathBlockProduct);
            await expect(await collection.checkProductSyncToCollectionDetailPage(bulkUpdateInfo[i].product_title)).toBe(
              true,
            );
          },
        );

        await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
          [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
          collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
          await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
          expect(await collectionSF.checkProductSyncToCollectionSF(bulkUpdateInfo[i].product_title)).toBe(true);
          await SFPage.close();
        });

        await test.step("Tại dashboard đi đến màn All product > Search product > Open product detail", async () => {
          await productPage.gotoProductDetail(bulkUpdateInfo[i].product_title.toString());
          await dashboard.waitForSelector(xpathCollectionOnProductDetail);
          await dashboard.locator(xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
          await snapshotFixture.verify({
            page: dashboard,
            selector: xpathCollectionOnProductDetail,
            snapshotName: `${bulkUpdateInfo[i].image_snapshot}`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });
      }
    },
  );

  test("Delete thành công collection @SB_CL_SPC_21", async ({ dashboard, conf }) => {
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    const collectionInfo = conf.caseConf.collection_info;
    await collection.gotoCollectionList();
    await collection.clickOnBtnWithLabel("Create collection");
    await collection.createCollection(collectionInfo);

    await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Tick on checkbox của collection name >  Chọn Action > CHọn Delete selected collections > Click Delete ", async () => {
      await collection.gotoCollectionList();
      await collection.deleteCollection(collectionInfo.collection_title);
      await collection.isToastMsgVisible(collectionInfo.message);
      // wait for product sau khi tao sync trong db
      await collection.page.waitForTimeout(30000);
    });

    await test.step("Open collection list on SF : /collections", async () => {
      const xpathTitleCollectionList =
        `//div[contains(@class,'collection-product-wrap')]` +
        `//h5[normalize-space()='${collectionInfo.collection_title}']`;
      await dashboard.goto(`https://${conf.suiteConf.domain}/collections`);
      await dashboard.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
        state: "hidden",
      });
      await expect(await dashboard.locator(xpathTitleCollectionList).isVisible()).toBe(false);
    });
  });
});
