import { test } from "@fixtures/theme";
import { ProductPage } from "@pages/dashboard/products";
import { expect } from "@core/fixtures";
import { CollectionPage } from "@pages/dashboard/collections";
import { loadData } from "@core/conf/conf";
import { snapshotDir } from "@utils/theme";

test.describe("Support single-item tracking ID for SB/PLB", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    testInfo.setTimeout(conf.suiteConf.timeout);
  });

  test(`Check hiển thị field nhập Pixel ID & Access Token ở màn Add product/Collection @SB_SF_TKE_SIT_2`, async ({
    dashboard,
    conf,
  }) => {
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    await test.step("Kiểm tra hiển thị block ở màn Add product", async () => {
      await product.goToProductList();
      await product.clickOnBtnWithLabel("Add product");
      await expect(
        await dashboard.locator("//div[contains(@class,'title-description section-overview')]").screenshot(),
      ).toMatchSnapshot("block-fb-pixel-add-product.png");
    });
    await test.step("Kiểm tra hiển thị block ở màn Add collections", async () => {
      await collection.goToAddCollection();
      await expect(
        await dashboard.locator("//div[contains(@class,'title-description section-overview')]").screenshot(),
      ).toMatchSnapshot("block-fb-pixel-add-collection.png");
    });
  });

  test(`Check hiển thị field nhập Pixel ID & Access Token ở màn Edit product/Collection @SB_SF_TKE_SIT_3`, async ({
    dashboard,
    conf,
  }) => {
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    const productName = conf.caseConf.productName;
    const collectionName = conf.caseConf.collectionName;
    await test.step("Kiểm tra hiển thị block ở màn Edit product", async () => {
      await product.goToProductList();
      await product.gotoProductDetail(productName);
      await dashboard.waitForSelector("//div[contains(@class,'title-description section-overview')]");
      await expect(
        await dashboard.locator("//div[contains(@class,'title-description section-overview')]//h3"),
      ).toHaveText("Facebook Pixel & Conversion API");
    });
    await test.step("Kiểm tra hiển thị block ở màn Edit collection", async () => {
      await collection.gotoCollectionDetail(collectionName);
      await expect(
        await dashboard.locator("//div[contains(@class,'title-description section-overview')]").screenshot(),
      ).toMatchSnapshot("block-fb-pixel-edit-collection.png", {
        threshold: 0.2,
      });
    });
  });

  const caseName = "VERIFY_BLOCK_FACEBOOK_PIXEL";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      description: description,
      case_id: caseID,
      messageProduct: messageProduct,
      messageCollection: messageCollection,
      productName: productName,
      collectionName: collectionName,
      pixelId: pixelId,
      accessToken: accessToken,
    }) => {
      test(`${description} @${caseID}`, async ({ dashboard, conf }) => {
        const product = new ProductPage(dashboard, conf.suiteConf.domain);
        const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
        const xpathAlert = "//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom']";
        await test.step("Check giá trị vào Pixel ID & Access Token tại màn Product", async () => {
          await product.goToProductList();
          await product.gotoProductDetail(productName);
          await product.editBlockFbPixel(pixelId, accessToken);
          await product.genLoc("text=Save changes").click();
          await dashboard.waitForSelector(xpathAlert, { state: "hidden" });
          const text = await dashboard.locator(xpathAlert).textContent();
          expect(text).toEqual(messageProduct);
        });
        await test.step("Check giá trị vào Pixel ID & Access Token tại màn Collection", async () => {
          await collection.gotoCollectionDetail(collectionName);
          await product.editBlockFbPixel(pixelId, accessToken);
          await product
            .genLoc("//div[contains(@class,'save-setting-content')]//button[child::span[normalize-space()='Save']]")
            .click();
          await dashboard.waitForSelector(xpathAlert, { state: "hidden" });
          const text = await dashboard.locator(xpathAlert).textContent();
          expect(text).toEqual(messageCollection);
        });
      });
    },
  );
});
