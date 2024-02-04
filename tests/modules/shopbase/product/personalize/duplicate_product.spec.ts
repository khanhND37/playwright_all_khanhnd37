import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@sf_pages/product";
import { SFHome } from "@sf_pages/homepage";

test.describe("Allow sellers duplicate product from product detail", async () => {
  let product;
  let dashboardPage;
  let homePage;
  let productSF: SFProduct;
  let productValidateDetail;
  let productValidateSF;

  test.beforeEach(async ({ dashboard, conf, page }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    homePage = new SFHome(page, conf.suiteConf.domain);
    productSF = new SFProduct(page, conf.suiteConf.domain);
    productValidateDetail = conf.caseConf.product_validate_detail;
    productValidateSF = conf.caseConf.product_validate_sf;
    await dashboardPage.navigateToMenu("Products");
    await product.searchProdByName(conf.caseConf.title);
    await product.chooseProduct(conf.caseConf.title);
  });

  test(`[Duplicate product] Duplicate product no keep medias
  khi product chỉ chứa custom option only @TC_SB_PRO_test_263`, async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Không tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(false);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
      expect(await productSF.getListC0SF()).toEqual(conf.caseConf.list_custom_options);
    });
  });

  test(`[Duplicate product] Duplicate product keep medias
  khi product chỉ chứa custom option only @TC_SB_PRO_test_267`, async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(true);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
      expect(await productSF.getListC0SF()).toEqual(conf.caseConf.list_custom_options);
    });
  });

  test(`[Duplicate product] Duplicate product no keep medias
  khi product chỉ chứa preview image @TC_SB_PRO_test_264`, async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Không tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(false);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Preview Image')]]/following-sibling::div//img"),
      ).toBeVisible();
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
      expect(await productSF.getListC0SF()).toEqual(conf.caseConf.list_custom_options);
    });
  });

  test(`[Duplicate product] Duplicate product keep medias
  khi product chỉ chứa preview image @TC_SB_PRO_test_268`, async ({ conf, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(true);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Preview Image')]]/following-sibling::div//img"),
      ).toBeVisible();
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
    });

    await test.step(`4. Input value custom option > Click vào btn preview`, async () => {
      const customOptionInfo = conf.caseConf.custom_option_info;
      for (let i = 0; i < customOptionInfo.length; i++) {
        await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info[i]);
      }
      await productSF.clickOnBtnPreviewSF();
      // chờ hiện đủ ảnh preview
      await page.waitForTimeout(2000); // eslint-disable-line
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_SB_PRO_test_268.png`, {
        threshold: 0.02,
      });
    });
  });

  test(`[Duplicate product] Duplicate product no keep medias
  khi product chỉ chứa print file @TC_SB_PRO_test_265`, async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Không tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(false);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Print Files')]]/following-sibling::div//img"),
      ).toBeVisible();
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
      expect(await productSF.getListC0SF()).toEqual(conf.caseConf.list_custom_options);
    });
  });

  test(`[Duplicate product] Duplicate product keep medias khi product chỉ chứa print file @TC_SB_PRO_test_269`, async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(true);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Print Files')]]/following-sibling::div//img"),
      ).toBeVisible();
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
      expect(await productSF.getListC0SF()).toEqual(conf.caseConf.list_custom_options);
    });
  });

  test(`[Duplicate product] Duplicate product no keep medias
  khi product chứa cả preview image và print file @TC_SB_PRO_test_266`, async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Không tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(false);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Print Files')]]/following-sibling::div//img"),
      ).toBeVisible();
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Preview Image')]]/following-sibling::div//img"),
      ).toBeVisible();
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
      expect(await productSF.getListC0SF()).toEqual(conf.caseConf.list_custom_options);
    });
  });

  test(`[Duplicate product] Duplicate product keep medias
  khi product chứa cả preview image và print file @TC_SB_PRO_test_270`, async ({ conf, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Tick chọn Keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(true);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await product.getListC0InProductDetail()).toEqual(conf.caseConf.list_custom_options);
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Preview Image')]]/following-sibling::div//img"),
      ).toBeVisible();
      await expect(
        product.genLoc("//div[child::h3[contains(.,'Print Files')]]/following-sibling::div//img"),
      ).toBeVisible();
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productValidateSF.product_name);
    });

    await test.step(`4. Input value custom option > Click vào btn preview`, async () => {
      const customOptionInfo = conf.caseConf.custom_option_info;
      for (let i = 0; i < customOptionInfo.length; i++) {
        await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info[i]);
      }
      await productSF.clickOnBtnPreviewSF();
      // chờ hiện đủ ảnh preview
      await page.waitForTimeout(2000); // eslint-disable-line
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_SB_PRO_test_270.png`, {
        threshold: 0.02,
      });
    });
  });

  test(`[Duplicate product] Duplicate product edit new your product @TC_SB_PRO_test_271`, async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`1. Click vào btn Duplicate`, async () => {
      await product.clickOnBtnWithLabel("Duplicate");
      await expect(product.genLoc("//p[normalize-space()='Duplicate this product?']")).toBeVisible();
    });

    await test.step(`2. Input value vào trường New your product,
    tick chọn keep medias > Click btn Duplicate`, async () => {
      await product.duplicateProduct(true, productValidateDetail.product_name);
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
    });

    await test.step(`3. View product ngoài SF > Verify thông tin của product`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
    });
  });
});
