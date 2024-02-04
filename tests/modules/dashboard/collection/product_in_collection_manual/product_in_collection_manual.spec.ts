import { test } from "@fixtures/theme";
import { CollectionPage } from "@pages/dashboard/collections";
import { snapshotDir } from "@utils/theme";
import { SFCollection } from "@sf_pages/collection";
import { ProductPage } from "@pages/dashboard/products";
import { expect } from "@core/fixtures";
import { ActivityHistory } from "@pages/dashboard/activity_history";
import { SFProduct } from "@sf_pages/product";

test.describe("Product in collection manual @TS_SB_CL_PIC", async () => {
  let SFPage;
  let collectionSF;
  let productPageSF;
  let collectionInfo;
  let collection: CollectionPage;
  let productPage: ProductPage;
  let maxDiffPixelRatio;
  let threshold;
  let maxDiffPixels;
  let productCollection;

  const createCollection = async (collection: CollectionPage, collectionInfo): Promise<void> => {
    await collection.gotoCollectionList();
    await collection.clickOnBtnWithLabel("Create collection");
    await collection.page.waitForSelector(collection.xpathDescriptionArea, { timeout: 9000 });
    await collection.createCollection(collectionInfo);
  };

  const verifyActivityHistory = async (dashboard, activityHistory, activityLog): Promise<void> => {
    await activityHistory.filterActivity("Collection");
    await expect(dashboard.locator("(//tr/td[1]/div/span)[1]")).toContainText(activityLog.username);
    await expect(dashboard.locator("(//tr/td[2]/div/span)[1]")).toContainText(activityLog.category);
    await expect(dashboard.locator("(//tr/td[3]/div/span)[1]")).toContainText(activityLog.activity);
  };

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    collectionInfo = conf.caseConf.collection_manual;
    productCollection = conf.caseConf.product_add;
    collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await collection.gotoCollectionList();
    await collection.deleteAllCollection();
  });

  test("[Sync product - Collection manual ]Check khi add collection manual trong product detail @SB_CL_SPC_11", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const activityHistory = new ActivityHistory(dashboard, conf.suiteConf.domain);
    const productSortSF = conf.caseConf.product_sort;
    const activityLog = conf.caseConf.activity_log;

    await test.step("Precondition: Create new collection", async () => {
      await createCollection(collection, collectionInfo);
    });

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail " +
        " > Tại block Products -> Click button Add product > search và chọn product > Click button Refresh",
      async () => {
        await collection.gotoCollectionDetail(collectionInfo.collection_title);
        await collection.clickOnBtnWithLabel("Add product");
        await dashboard.waitForSelector("//div[contains(@class,'item-list')]//div[@class='item']");
        await collection.addProductToCollectionDetail(productCollection);
        await dashboard.waitForSelector(collection.xpathBtnRefresh, { timeout: 9000 });
        await collection.clickOnBtnWithLabel("Refresh");
        await collection.waitForElementVisibleThenInvisible("//img[@class='sbase-spinner']");
        while (
          await collection.page.locator(await collection.getXpathProductInCollection(productCollection[0])).isHidden()
        ) {
          await collection.page.reload();
          await collection.page.waitForLoadState("networkidle");
        }

        await snapshotFixture.verify({
          page: dashboard,
          selector: collection.xpathBlockProduct,
          snapshotName: "block-products-SB_CL_SPC_11.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      expect(await collectionSF.verifyProductSortOnColectionSF(productSortSF)).toBe(true);
      SFPage.close();
    });

    await test.step("Tại dashboard đi đến màn All product > search product > Open product detai", async () => {
      await productPage.gotoProductDetail(productCollection[0]);
      await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: collection.xpathCollectionOnProductDetail,
        snapshotName: "block-collections-on-product-detail-SB_CL_SPC_11.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Tại màn collection detail, tại block Products>  Click icon X tại product > Click button Refresh", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      await collection.deleteProductInCollectionDetailPage(productCollection);
      expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(false);
    });

    await test.step("Tại dashboard, đi đến màn Setting > chọn Account > scoll xuống dưới > Click View all của Activity history", async () => {
      await activityHistory.goToActivityHistory();
      await verifyActivityHistory(dashboard, activityHistory, activityLog);
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(false);
      SFPage.close();
    });

    await test.step("Tại dashboard đi đến màn All product > search product > Open product detai", async () => {
      await productPage.gotoProductDetail(productCollection[0]);
      await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: collection.xpathCollectionOnProductDetail,
        snapshotName: "block-remove-collections-on-product-detail-SB_CL_SPC_11.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("View product trên SF sau khi remove collection", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      productPageSF = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productPageSF.getProductTitle()).toContain(productCollection[0]);
    });
  });

  test("[Sync product - Collection manual ]Check khi sync product vào collection manual từ product detail @SB_CL_SPC_12", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Precondition: Create new collection", async () => {
      await createCollection(collection, collectionInfo);
    });

    await test.step(
      "Tại dashboard đi đến màn All product > search product > Open product detail > " +
        "Tại block Collections > input collection name > Click Add collection > Click button Save changes",
      async () => {
        await productPage.gotoProductDetail(productCollection[0]);
        await collection.addCollectionToProductDetailPage(collectionInfo.collection_title);
        await collection.clickOnBtnWithLabel("Save changes");
        await collection.isToastMsgVisible("Product was successfully saved!");
        await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: collection.xpathCollectionOnProductDetail,
          snapshotName: "block-add-collections-on-product-detail-SB_CL_SPC_12.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail " +
        "> Check block Products",
      async () => {
        await collection.gotoCollectionDetail(collectionInfo.collection_title);
        await dashboard.waitForSelector(collection.xpathBlockProduct);
        await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(true);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(true);
      SFPage.close();
    });

    await test.step(
      "Tại dashboard đi đến màn product detail, tại block Collections " +
        "Click icon X sau collection > Click button Save changes",
      async () => {
        await productPage.gotoProductDetail(productCollection[0]);
        await collection.removeCollectionFromProductDetailPage(collectionInfo.collection_title);
        await collection.clickOnBtnWithLabel("Save changes");
        await collection.isToastMsgVisible("Product was successfully saved!");
        await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: collection.xpathCollectionOnProductDetail,
          snapshotName: "block-remove-collections-on-product-detail-SB_CL_SPC_12.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail " +
        "> Check block Products",
      async () => {
        await collection.gotoCollectionDetail(collectionInfo.collection_title);
        await dashboard.waitForSelector(collection.xpathBlockProduct);
        await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(false);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(false);
      SFPage.close();
    });
  });

  test("[Sync product - Collection manual ]Check khi sync product vào collection manual từ bulk update @SB_CL_SPC_13", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const bulkUpdateAddCollection = conf.caseConf.bulk_update_add_collection;
    const bulkUpdateRemoveCollection = conf.caseConf.bulk_update_remove_collection;

    await test.step("Precondition: Create new collection", async () => {
      await createCollection(collection, collectionInfo);
    });

    await test.step(
      "Tại dashboard, Chọn Products > Chọn [Bulk update] > Click btn [Creat an update] > " +
        "Chọn Action: Add to collection > Filter >  Click button Preview Bulk Update > Click button Start Bulk Update " +
        "> Click button Update",
      async () => {
        await productPage.createBulkUpdate(bulkUpdateAddCollection);
        await productPage.startBulkUpdate();
        await dashboard.reload();
        // await collection.waitUntilElementVisible("//div[@class='page-bulk-updates']");
        while (await productPage.page.locator("//img[@class='sbase-spinner']").isVisible()) {
          await productPage.page.reload();
          await productPage.page.waitForLoadState("networkidle");
        }
        expect(await productPage.getInfoBulkUpdate()).toEqual(bulkUpdateAddCollection.bulk_update_info);
      },
    );

    await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      await dashboard.waitForSelector(collection.xpathBlockProduct);
      await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(true);
    });

    await test.step("Tại dashboard đi đến màn product detail, tại block Collections ", async () => {
      await productPage.gotoProductDetail(productCollection[0]);
      await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: collection.xpathCollectionOnProductDetail,
        snapshotName: "block-add-collections-on-product-detail-SB_CL_SPC_13.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(true);
      SFPage.close();
    });

    await test.step(
      "Tại dashboard, Chọn Products > Chọn [Bulk update] > Click btn [Creat an update] > " +
        "Chọn Action: Remove from collection > Filter >  Click button Preview Bulk Update > Click button Start Bulk Update " +
        "> Click button Update",
      async () => {
        await productPage.createBulkUpdate(bulkUpdateRemoveCollection);
        await productPage.startBulkUpdate();
        await dashboard.reload();
        await collection.waitUntilElementVisible("//div[@class='page-bulk-updates']");
        expect(await productPage.getInfoBulkUpdate()).toEqual(bulkUpdateRemoveCollection.bulk_update_info);
      },
    );

    await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      await dashboard.waitForSelector(collection.xpathBlockProduct);
      await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(false);
    });

    await test.step("Tại dashboard đi đến màn product detail, tại block Collections ", async () => {
      await productPage.gotoProductDetail(productCollection[0]);
      await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: collection.xpathCollectionOnProductDetail,
        snapshotName: "block-remove-collections-on-product-detail-bulk-update-SB_CL_SPC_13.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(false);
      SFPage.close();
    });
  });

  test("[Sync product - Collection manual ]Check khi sync product vào collection manual từ add collection ngoài list product @SB_CL_SPC_14", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Precondition: Create new collection", async () => {
      await createCollection(collection, collectionInfo);
    });

    await test.step("Tại dashboard đi đến màn All product > search product > select product", async () => {
      await productPage.goToProductList();
      await productPage.searchProduct(productCollection[0]);
      await productPage.selectProduct(productCollection[0]);
      await expect(
        dashboard.locator(
          "//table[@id='all-products']//div[@class='action-table']//label[normalize-space()='1 product selected']",
        ),
      ).toBeVisible();
    });

    await test.step("Click btn [Actions] > Chọn Add to collection", async () => {
      await productPage.clickOnBtnWithLabel("Action");
      await productPage.genLoc("text=Add to collection").click();
      await expect(await dashboard.locator("//p[normalize-space()='Add 1 product to collection']")).toBeVisible();
    });

    await test.step("Search collection name > Chọn collection cần add > Click button [Save]", async () => {
      await collection.addOrRemoveToCollectionFromProductListPage(collectionInfo.collection_title);
      await collection.isToastMsgVisible("Added 1 product");
    });

    await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      await collection.page.waitForSelector(collection.xpathDescriptionArea, { timeout: 9000 });
      while ((await collection.page.locator(collection.xpathProductList).count()) < 2) {
        await collection.page.waitForLoadState("networkidle");
        await collection.page.reload();
      }
      await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(true);
    });

    await test.step("Tại dashboard đi đến màn product detail, tại block Collections ", async () => {
      await productPage.gotoProductDetail(productCollection[0]);
      await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: collection.xpathCollectionOnProductDetail,
        snapshotName: "block-add-collections-on-product-detail-SB_CL_SPC_14.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(true);
      SFPage.close();
    });

    await test.step(
      "Tại dashboard đi đến màn All product > search product > select product > Click btn [Actions] > " +
        "Chọn Add to collection",
      async () => {
        await productPage.goToProductList();
        await productPage.searchProduct(productCollection[0]);
        await productPage.selectProduct(productCollection[0]);
        await productPage.clickOnBtnWithLabel("Action");
        await productPage.genLoc("text=Remove from collection").click();
        await collection.addOrRemoveToCollectionFromProductListPage(collectionInfo.collection_title);
        await collection.isToastMsgVisible("Removed 1 product");
      },
    );

    await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      await dashboard.waitForSelector(collection.xpathBlockProduct);
      await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(false);
    });

    await test.step("Tại dashboard đi đến màn product detail, tại block Collections ", async () => {
      await productPage.gotoProductDetail(productCollection[0]);
      await dashboard.locator(collection.xpathCollectionOnProductDetail).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: collection.xpathCollectionOnProductDetail,
        snapshotName: "block-remove-collections-on-product-detail-SB_CL_SPC_14.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(false);
      SFPage.close();
    });
  });

  test("[Sync product - Collection manual] Check khi remove product ra khỏi collection manual từ action delete product @SB_CL_SPC_15", async ({
    conf,
    context,
  }) => {
    const productInfo = conf.caseConf.product_info;

    await test.step("Precondition: Create product and collection", async () => {
      await productPage.goToProductList();
      await productPage.addNewProductWithData(productInfo);
      await createCollection(collection, collectionInfo);
    });

    await test.step(
      "Đi đến màn All product > Tìm kiếm product với title > select product > " +
        "Open product detail > Click button Delete",
      async () => {
        await productPage.goToProductList();
        await productPage.searchProduct(productInfo.title);
        await productPage.deleteProduct(conf.suiteConf.password);
      },
    );

    await test.step("Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail ", async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title);
      await collection.page.waitForSelector(collection.xpathDescriptionArea, { timeout: 9000 });
      await expect(await collection.checkProductSyncToCollectionDetailPage(collectionInfo.product_title)).toBe(false);
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible("//div[contains(@class,'container collection-detail')]");
      await expect(await collectionSF.checkProductSyncToCollectionSF(collectionInfo.product_title)).toBe(false);
      SFPage.close();
    });
  });
});
