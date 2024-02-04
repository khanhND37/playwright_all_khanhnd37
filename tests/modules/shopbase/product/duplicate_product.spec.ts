import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Duplicate product", () => {
  let product;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    await product.navigateToMenu("Products");
  });

  test(`Check sync khi Duplicate product @TC_SB_PRO_SP_131`, async ({ authRequest, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;

    await test.step(`
  Tại màn [All products] > search product vơi title Product A
  Click vào product A để mở detail
  `, async () => {
      const productId = await product.getProductId(authRequest, productInfo.title, conf.suiteConf.domain);
      await product.searchAndSelectProduct(productInfo.title, productId);
    });

    await test.step(`
  Click button [Duplicate]
  Checkbox [Duplicate product medias]
  input Provide a name for your new product : Product B
  tick Duplicate product medias
  Click button [Duplicate]
  `, async () => {
      await product.duplicateProduct(productInfo.product_duplicate_name);
    });

    await test.step(`Verify Product info on product B`, async () => {
      const productId = await product.getProductId(
        authRequest,
        productInfo.product_duplicate_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          conf.caseConf.product_info_validate_dashboard,
        ),
      ).toEqual(conf.caseConf.product_info_validate_dashboard);
    });

    await test.step(`Verify product B info on SF`, async () => {
      const productId = await product.getProductId(
        authRequest,
        productInfo.product_duplicate_name,
        conf.suiteConf.domain,
      );
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          conf.caseConf.product_info_validate_SF,
        ),
      ).toEqual(conf.caseConf.product_info_validate_SF);
    });

    await test.step(`Search product by title on storefront`, async () => {
      const productId = await product.getProductId(
        authRequest,
        productInfo.product_duplicate_name,
        conf.suiteConf.domain,
      );
      await product.goToSearchProductOnSF(productInfo.product_duplicate_name);
      conf.caseConf.delete_product.id = productId;
      await product.deleteProductByName(authRequest, conf.suiteConf.domain, productId, conf.caseConf.delete_product);
    });
  });
});
