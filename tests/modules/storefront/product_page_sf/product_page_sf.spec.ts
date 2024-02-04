import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";

let printHubPage: PrintHubPage;
let productPage: ProductPage;
let clipartSFPage: SFProduct;
let sfPage: SFProduct;

test.describe("Check product ngoài SF ", async () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test("@SB_PRO_PG_SF_2 Verify value CO sau khi khi add to card", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const productInfo = conf.caseConf.product_all_info;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const customOptionSF = conf.caseConf.custom_option_SF;
    const picture = conf.caseConf.picture;

    await test.step("Precondition: Tạo folder clipart ở màn Clipart- Printhub", async () => {
      await printHubPage.goto(printHubPage.urlClipartPage);
      await productPage.deleteClipartFolder(clipartFolderInfo.folder_name);
      await productPage.clickOnBtnLinkWithLabel("Create folder", 1);
      await productPage.addNewClipartFolder(clipartFolderInfo, 1);
      await productPage.clickOnBtnWithLabel("Save changes", 1);
    });

    await test.step("Tạo product có Custom Option", async () => {
      await productPage.goToProductList();
      await productPage.searchProdByName(productInfo.title);
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await productPage.addNewProductWithData(productInfo);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await productPage.clickBtnCustomOptionOnly();
      await productPage.addNewCustomOptionWithData(customOptionInfo);
      await productPage.clickOnBtnWithLabel("Save changes");
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);

      await productPage.removeBlockTitleDescription();
      await productPage.closeCustomOption(customOptionInfo);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathCustomOptionInProductDetail,
        snapshotName: picture.custom_option,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("View product lên SF > Input CO đã tạo", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await clipartSFPage.waitUntilElementVisible(clipartSFPage.xpathCustomOptionSF);
      await clipartSFPage.waitForCLipartImagesLoaded();

      for (let i = 1; i <= customOptionSF.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSF[i - 1]);
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: clipartSFPage.xpathCustomOptionSF,
          snapshotName: `${i} - ${picture.picture_choice_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step("Verify value CO sau khi khi add to card", async () => {
      await clipartSFPage.addToCart();
      await clipartSFPage.waitUntilElementVisible(clipartSFPage.xpathProductsIncart);
      await clipartSFPage.waitForElementVisibleThenInvisible(clipartSFPage.xpathIconLoadImage);
      await snapshotFixture.verify({
        page: clipartSFPage.page,
        selector: clipartSFPage.xpathLastProductInCart,
        snapshotName: picture.product_in_cart,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_PRO_PG_SF_3 Show product cùng vendor`, async ({ dashboard, conf, context }) => {
    const productInfo = conf.caseConf.product_all_info;

    await test.step("Precondition: Tạo product có vendor = Uniqlo", async () => {
      productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      await productPage.goToProductList();
      await productPage.searchProdByName(productInfo.title);
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.addNewProductWithData(productInfo);
    });

    await test.step("Open product ngoài SF > Click vào product vendor", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      sfPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfPage.page.waitForLoadState("domcontentloaded");
      await expect(sfPage.genLoc(sfPage.getXpathWithLabel(productInfo.vendor))).toBeVisible();
      await sfPage.clickElementWithLabel("a", productInfo.vendor);
    });

    await test.step("check product hiển thị trong collection page với filter là vendor", async () => {
      await sfPage.page.waitForLoadState("domcontentloaded");
      await expect(sfPage.genLoc(sfPage.xpathProductOnCollectionPage(productInfo.title))).toBeVisible();
    });
  });

  test("@SB_PRO_PG_SF_6 Filter product tag trên SF", async ({ dashboard, conf, context }) => {
    const productInfo = conf.caseConf.product_all_info;
    await test.step("Precondition: Tạo product có vendor = Uniqlo", async () => {
      productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      await productPage.goToProductList();
      await productPage.searchProdByName(productInfo.title);
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.addNewProductWithData(productInfo);
    });

    await test.step("View product lên SF > Click vào product tag 'test tag' ", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      sfPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfPage.page.waitForLoadState("domcontentloaded");
      await expect(await sfPage.genLoc(sfPage.getXpathWithLabel(productInfo.tag))).toBeVisible();
      await sfPage.clickElementWithLabel("a", productInfo.tag);
    });

    await test.step("check product hiển thị trong collection page với filter là tag", async () => {
      await sfPage.page.waitForLoadState("domcontentloaded");
      await expect(sfPage.genLoc(sfPage.xpathProductOnCollectionPage(productInfo.title))).toBeVisible();
    });
  });
});
