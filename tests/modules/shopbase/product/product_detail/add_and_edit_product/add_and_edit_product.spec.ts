import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@sf_pages/product";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { CollectionPage } from "@pages/dashboard/collections";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { SFCollection } from "@sf_pages/collection";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import type { DefaultVariantSettings } from "@types";
import { expect, test } from "@core/fixtures";

test.describe("Add new product", () => {
  let dashboardPage: DashboardPage;
  let product: ProductPage;
  let collection: CollectionPage;
  let sfProduct: SFProduct;
  let productInforSF;
  let productSeoTitle;
  let urlSeo: string;
  const env = process.env.ENV;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    if (conf.caseConf.product_sf) {
      productInforSF = conf.caseConf.product_sf;
      if (productInforSF.url_handle_sf) {
        urlSeo = `https://${conf.suiteConf.domain}${productInforSF.url_handle_sf}`;
      }
    }
    if (conf.caseConf.product_seo_title) {
      productSeoTitle = conf.caseConf.product_seo_title;
    }
    await dashboardPage.navigateToMenu("Products");
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = `${snapshotDir(__filename).replaceAll("\\", "/")}`;
  });

  test("Sync product mới @TC_SB_PRO_SP_85", async ({ authRequest, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    //productInfo4 : lấy ra list product info từ file config product_tile
    const productInfo4 = conf.caseConf.product_all_info;
    const productValidateAfCreateSF = conf.caseConf.product_validate_SF;

    await test.step("Click Add product, Nhập các thông tin product và Click Save", async () => {
      await product.addNewProductWithData(productInfo4);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("Search product by title on storefront", async () => {
      await product.goToSearchProductOnSF(productInfo4.title);
    });

    await test.step("Click product and Check product information", async () => {
      await product.chooseProduct(productInfo4.title);
      await product.page.waitForLoadState("domcontentloaded");
      const productId = await product.getProductId(authRequest, productInfo4.title, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(authRequest, conf.suiteConf.domain, productHandle, productInfo4),
      ).toEqual(productValidateAfCreateSF);
    });
  });

  test("[SEO]Verify Page title và Meta description khi Add product @SB_PRO_test_201", async ({ context, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_tile;

    await test.step("Add new product, edit Website SEO và verify thông tin place holder của Page title", async () => {
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.clickOnBtnWithLabel("Edit website SEO");
      expect(await product.getPageTitle()).toEqual(productSeoTitle.page_title_default);
    });

    await test.step("Click vào trường Page tilte và verify thông tin hiển thị", async () => {
      await product.clickFieldPageTitle();
      expect(await product.getPageTitle()).toEqual(productSeoTitle.page_title_default);
    });

    await test.step("Nhập Page title và Meta description, rồi Save change, View product on storefront", async () => {
      await product.inputSeoTitle(productSeoTitle.page_title, productSeoTitle.meta_description);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("domcontentloaded");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getProductTitle()).toEqual(productInforSF.title_sf);
      expect((await productStoreFront.getHandleURLSF()).includes(urlSeo)).toBeTruthy();
    });
  });

  test("[SEO] Verify trường URL and handle khi Add product @SB_PRO_test_202", async ({ conf, context }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;

    await test.step("Add new product > Click Edit Website SEO và verify thông tinURL and handle", async () => {
      await product.page.waitForSelector("//*[@id='all-products']");
      await product.searchProdByName(productInfo.title);
      await product.page.waitForSelector("//span[@class='s-tag']//div[contains(text(),'Title contains')]");
      await product.deleteProduct(conf.suiteConf.password);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.clickOnBtnWithLabel("Edit website SEO");
      expect(await product.getHandle()).toEqual(productSeoTitle.handle_default);
    });

    await test.step("Input thông tin handle > Save > Verify url và handle on SF ", async () => {
      await product.inputHandle(productSeoTitle.handle);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("domcontentloaded");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getProductTitle()).toEqual(productInforSF.title_sf);
      expect((await productStoreFront.getHandleURLSF()).includes(urlSeo)).toBeTruthy();
    });
  });

  test("[SEO] Verify thông tin của SEO khi thay đổi Title của product chưa từng tạo Seo @SB_PRO_test_204", async ({
    conf,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_tile;

    await test.step("Add new product with data, search và mở product detail của product vừa tạo", async () => {
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await dashboardPage.navigateToMenu("Products");
      await product.searchProduct(productInfo.title);
      await product.chooseProduct(productInfo.title);
    });
    await test.step("Thực hiện Edit title > Verify thông tin các trường của SEO ", async () => {
      await product.editProductTitle(productInfo.new_title);
      await product.clickOnBtnWithLabel("Edit website SEO");
      expect(await product.getPageTitle()).toEqual(productSeoTitle.page_title_default);
      expect(await product.getHandle()).toContain(productSeoTitle.handle_expect);
    });
    await test.step("Click buton View > Verify thông tin product on SF ", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("domcontentloaded");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getProductTitle()).toEqual(productInforSF.title_sf);
      expect((await productStoreFront.getHandleURLSF()).includes(urlSeo)).toBeTruthy();
    });
  });

  test("Verify max_lenght title và message báo lỗi của khi add product @SB_PRO_test_95", async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    //productInfo1 : lấy ra list product info từ file config product_max_length
    const productInfo1 = conf.caseConf.product_max_length;
    //productInfo2 : lấy ra list product info từ file config product_no_title
    const productInfo2 = conf.caseConf.product_no_title;

    await test.step("Verify max_lenght của title", async () => {
      await product.addProductMaxLength(productInfo1.max_length_title);
      await expect(product.page.locator(product.xpathTitleLength)).toContainText(productInfo1.max_length_title);
      await product.closeOnboardingPopup();
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
    });

    await test.step("Thực hiện để trống trường Title, click button Save trên thanh Save bar", async () => {
      await product.addNewProductWithData(productInfo2);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ errMsg: productInfo2.errorMessage });
    });
  });

  test("[Edit product] Edit title của product @TC_SB_PRO_test_272", async ({ conf, authRequest, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;

    await test.step("Search product đã tạo trước đó > Mở màn hình prodcut detail", async () => {
      await product.searchProdByName(conf.caseConf.title);
      if (await product.genLoc(product.xpathNoProduct).isVisible()) {
        await product.addNewProductWithData(conf.caseConf.product_info);
        await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
        await expect(await product.toastWithText(conf.suiteConf.create_product_success)).toBeVisible();
        await product.closeOnboardingPopup();
        await product.clickBackProductList();
      }
      await dashboard.reload();
      await product.chooseProduct(conf.caseConf.title);
    });

    await test.step("Xóa hết value trường title > Click vào btn Save changes", async () => {
      await product.editProductTitle("");
      await product.checkMsgAfterCreated({ errMsg: conf.caseConf.message_title });
    });

    await test.step("Input > 255 kí tự vào trường title > Click btn Save changes", async () => {
      await product.editProductTitle(conf.caseConf.limit_title);
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
      expect(await product.getTextContent(product.xpathTitleLength)).toEqual(conf.caseConf.title_length_value);
    });

    await test.step("Input < 255 kí tự vào trường title > Click btn Save changes", async () => {
      await product.editProductTitle(conf.caseConf.title_update);
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
      await product.waitAbit(1500);
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

    await test.step("Verify thông tin product ngoài SF", async () => {
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

  test("[Edit product] Edit trường product type của product @TC_SB_PRO_test_273", async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;

    await test.step("Mở màn hình product detail > Clear trường product type > Click vào btn Save changes", async () => {
      await product.searchProdByName(conf.caseConf.title);
      if (await product.genLoc(product.xpathNoProduct).isVisible()) {
        await product.addNewProductWithData(conf.caseConf.product_info);
        await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
        await expect(await product.toastWithText(conf.suiteConf.create_product_success)).toBeVisible();
        await product.closeOnboardingPopup();
        await product.clickBackProductList();
      }
      await product.page.reload();
      await product.chooseProduct(conf.caseConf.title);
      await product.editProductType("");
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
    });

    await test.step("Edit product type thành 1 giá trị khác > Click vào btn Save changes", async () => {
      await product.editProductType(productValidateDetail.product_type);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
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

    await test.step("Verify thông tin product ngoài SF", async () => {
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

  test("[Edit product] Edit trường product vendor của product @TC_SB_PRO_test_274", async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;

    await test.step("Mở màn hình product detail > Clear trường vendor > Click vào btn Save changes", async () => {
      await product.searchProdByName(conf.caseConf.title);
      await product.chooseProduct(conf.caseConf.title);
      await product.editProductVendor("");
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
    });

    await test.step("Edit vendor thành 1 giá trị khác > Click vào btn Save changes", async () => {
      await product.editProductVendor(productValidateDetail.product_vendor);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
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

    await test.step("Verify thông tin product ngoài SF", async () => {
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

  test("[Edit product] Edit trường tag của product @TC_SB_PRO_test_275", async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;

    await test.step("Mở màn hình product detail > Clear trường tag > Click vào btn Save changes", async () => {
      await product.searchProdByName(conf.caseConf.title);
      await product.chooseProduct(conf.caseConf.title);
      await product.removeProductTagFromProductDetail(conf.caseConf.remove_tags);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
    });

    await test.step("Add nhiều tags cho product > Click vào btn Save changes", async () => {
      await product.editProductTagFromProductDetail(productValidateDetail.tag);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.checkMsgAfterCreated({ message: conf.caseConf.save_product_success });
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

    await test.step("Verify thông tin product ngoài SF", async () => {
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

  test("[Edit product] [Edit product] Edit medias của product đã có 500 medias @TC_SB_PRO_test_276", async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productValidateDetail = conf.caseConf.product_validate_detail;

    await test.step("Search product Product has 500 image, mở product detail, check Add medias", async () => {
      await product.searchProdByName(conf.caseConf.title);
      await product.chooseProduct(conf.caseConf.title);
      await product.page.locator(product.xpathAddMedia).isDisabled();
      await product.page.locator(product.xpathAddMediaFromUrl).isDisabled();
    });

    await test.step("Xóa 1 media", async () => {
      await product.deleteImageProduct();
      await product.page.locator(product.xpathAddMedia).isEnabled();
      await product.page.locator(product.xpathAddMediaFromUrl).isEnabled();
    });

    await test.step("Add 1 medias bằng url hoặc upload từ local > Click vào btn Save changes", async () => {
      await dashboard.setInputFiles(product.xpathAddMedia, `./data/shopbase/${conf.caseConf.image}`);
      await product.page.locator(product.xpathSaveChangedBtn).isEnabled();
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await dashboard.locator(product.xpathAddMedia).isDisabled();
      await dashboard.locator(product.xpathAddMediaFromUrl).isDisabled();
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
  });

  test("[Edit product] Edit medias của product đối với product có < 500 medias @TC_SB_PRO_test_277", async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const medias = conf.caseConf.medias;
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;

    await test.step("Search product  Mở màn hình product detail > Check Add medias", async () => {
      await product.searchProdByName(conf.caseConf.title);
      await product.chooseProduct(conf.caseConf.title);
      await dashboard.locator(product.xpathAddMedia).isEnabled();
      await dashboard.locator(product.xpathAddMediaFromUrl).isEnabled();
    });

    await test.step("Click vào Add medias > Upload medias từ local", async () => {
      const listMedias = medias.split(",").map(item => item.trim());
      for (let i = 0; i < listMedias.length; i++) {
        await dashboard.setInputFiles(product.xpathAddMedia, `./data/shopbase/${listMedias[i]}`);
      }
    });

    await test.step("Click vào Add medias > Upload medias từ local", async () => {
      const listMedias = medias.split(",").map(item => item.trim());
      for (let i = 0; i < listMedias.length; i++) {
        await dashboard.setInputFiles(product.xpathAddMedia, `./data/shopbase/${listMedias[i]}`);
      }
    });

    await test.step("Click vào Add medias from URL > Insert link medias", async () => {
      const listMedias = medias.split(",").map(item => item.trim());
      for (let i = 0; i < listMedias.length; i++) {
        await dashboard.setInputFiles(product.xpathAddMedia, `./data/shopbase/${listMedias[i]}`);
      }
    });

    await test.step("Click btn Save changes > Verify product trong dashboard", async () => {
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
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

    await test.step("Verify thông tin product ngoài SF", async () => {
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

  test("[Add product] Verify media của product khi thực hiện các Action View, Delete ALT @SB_PRO_test_104", async ({
    dashboard,
    conf,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const productDetailSF = conf.caseConf.product_detail_sf;
    const btnPreview = conf.caseConf.btn_preview;
    const btnEditMediaText = conf.caseConf.btn_edit_media_text;

    await test.step("Create product, nhập Title product, add media from URL, click btn [Add media]", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
      await product.setProductMediasByURL(productDetail.image_URL);
      await product.setProductMedias(productDetail.image);
    });

    await test.step("Tại list media Click vào Icon View của media", async () => {
      await dashboard.hover(`(${product.xpathOverlay})[${conf.caseConf.media_number}]`);
      await dashboard.click(`(${product.xpathIconView})[${conf.caseConf.media_number}]`);
      expect(await product.getTextContent(product.xpathPreviewModal)).toContain(btnPreview);
      await product.clickOnBtnWithLabel("Done");
    });

    await test.step("Tại list media Click vào Icon ALT của media", async () => {
      await dashboard.hover(`(${product.xpathOverlay})[${conf.caseConf.media_number}]`);
      await dashboard.click(`(${product.xpathIconAlt})[${conf.caseConf.media_number}]`);
      expect(await product.getTextContent(product.xpathAltModal)).toContain(btnEditMediaText);
      await product.clickOnBtnWithLabel("Cancel");
    });

    await test.step("Tại list media Click vào Icon Delete media, verify meida trong list, Save changes", async () => {
      await dashboard.hover(`(${product.xpathOverlay})[${conf.caseConf.media_number}]`);
      await dashboard.click(`(${product.xpathIconDelete})[${conf.caseConf.media_number}]`);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("Click icon View , View product A ngoài SF Verify media của product A ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      const listProductSf = productDetailSF.medias.split(",");
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      expect(await productStoreFront.countProductMedias()).toEqual(listProductSf.length);
    });
  });

  //@SB_PRO_test_105
  test("[Add product] Add Weight cho product @SB_PRO_test_105", async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productWeightMaxLen = conf.caseConf.product_weight_max_lenght;
    const productWeightStr = conf.caseConf.product_weight_str;
    const weightMaxLen = conf.caseConf.weight_max_lenght;
    const weightMin = conf.caseConf.weight_min;

    await test.step("Tại màn [All products] > Create product, Verify maxlenght của trường weight", async () => {
      await product.searchProdByName(productWeightStr.title);
      await product.page.waitForSelector("//span[@class='s-tag']//div[contains(text(),'Title contains')]");
      await product.deleteProduct(conf.suiteConf.password);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductWeight(productWeightMaxLen.weight);
      const productWeightValue = await product.getInputValue(
        "(//*[descendant-or-self::*[normalize-space(text())='Weight']]/following-sibling::*//input)[1]",
      );
      expect(productWeightValue.trim().length).toEqual(weightMaxLen);
      await product.closeOnboardingPopup();
      await product.clickBackProductList();
    });
    await test.step("1.Input Title product2. Input data cho trường Weight Verify thông tin data input cho trường Weight3. Click button Save changes4. Verify Weight của product A sau khi save", async () => {
      await product.addNewProductWithData(productWeightStr);
      await product.page.waitForSelector(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      const productId = await product.getProductId(authRequest, productWeightStr.title, conf.suiteConf.domain);
      const productInfo = await product.getProductInfoDashboardByApi(
        authRequest,
        conf.suiteConf.domain,
        productId,
        productWeightMaxLen,
      );
      expect(Number(productInfo.weight)).toEqual(weightMin);
    });
    await test.step("Click icon View > Verify Weight của product A ngoài SF", async () => {
      // Product weight not visible in storefront
    });
  });

  //@SB_PRO_test_106
  test("[Add product]  Verify add Pricing cho product @SB_PRO_test_106", async ({ conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const productPriceStr = conf.caseConf.product_price_str;
    const minPrice = conf.caseConf.min_price;

    await test.step("Create product và Input data cho mục pricing , Verify trường thông tin pricing trong dashboard1. Tại màn [All products] > Click btn Create product2. Input Title product3. Input thông tin cho các trường của Pricing-Price- Compare at price-Cost per item4. click button Save changes5. Verify thông tin các trường sau khi save product", async () => {
      await product.searchProdByName(productDetail.product_name);
      await product.deleteProduct(conf.suiteConf.password);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
      await product.setProductPrice(productPriceStr);
      await product.genLoc("//input[@id='compare_price']").click();
      const productPrice = await product.getInputValue("//input[@id='price']");
      expect(Number(productPrice.trim())).toEqual(minPrice);
      await product.setProductPrice(productDetail.price);
      await product.setProductComparePrice(productDetail.compare_at_price);
      await product.setProductCostPerItem(productDetail.cost_per_item);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathToastMessage, { timeout: 70000 });
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });

      const productId = await product.getProductId(authRequest, productDetail.product_name, conf.suiteConf.domain);
      const productInfo = await product.getProductInfoDashboardByApi(
        authRequest,
        conf.suiteConf.domain,
        productId,
        productDetail,
      );
      expect(productInfo.price).toEqual(Number(productDetail.price));
    });

    await test.step("7.Click icon View , View product A ngoài SF > Verify thông tin các trường của mục pricing", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.waitResponseWithUrl("/assets/landing.css", 90000);
      const productPrice = await productStoreFront.getProductPrice("price");
      expect(productPrice.toString()).toContain(productDetail.price);
      const productComparePrice = await productStoreFront.getProductPrice("compare at price");
      expect(productComparePrice.toString()).toContain(productDetail.compare_at_price);
    });
  });

  //@SB_PRO_test_111
  test("[Add product] Verify add Product type và Product vendor cho product @SB_PRO_test_111", async ({
    context,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const typeMaxLen = conf.caseConf.product_type_max;
    const vendorMaxLen = conf.caseConf.product_vendor_max;
    const maxValue = conf.caseConf.default_max_value;

    await test.step("Tại màn [All products] > Click btn Create product Input Title product", async () => {
      await product.addNewProductWithData(conf.caseConf.product_info);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await expect(await product.toastWithText(conf.suiteConf.create_product_success)).toBeVisible();
    });

    await test.step("Trong block Organization, thực hiện xoá hết các ký tự trong textbox 'Product Type' và 'Product Vendor'Organization: + Tại trường Product type và Product Vendor 1. Xóa hết tất cả các ký tự2. Click button Save changes", async () => {
      await product.setProductType("");
      await product.setProductVendor("");
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });
    await test.step("Click icon 'Preview' product on storefrontVerify trường Product type và product vendor", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("domcontentloaded");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await expect(productStoreFront.vendorLocator).toBeHidden();
      await expect(productStoreFront.typeLocator).toBeHidden();
      await SFPage.close();
    });
    await test.step("-Organization:+ Tại trường Product type và Product Vendor input với các kiểu dữ liệu: - input các kiểu dữ liệu trong data- Click button Save changes", async () => {
      await product.setProductType(productDetail.type);
      await product.setProductVendor(productDetail.vendor);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });
    await test.step("Click icon 'Preview' product on storefrontVerify trường Product type và product vendor", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.waitResponseWithUrl("/assets/landing.css", 60000);
      await productStoreFront.viewProductAgain(conf.caseConf.product_info.title);
      expect(await productStoreFront.getProductVendorSF()).toEqual(productDetail.vendor);
      expect(await productStoreFront.getProductTypeSF()).toEqual(productDetail.type);
      await SFPage.close();
    });
    await test.step("-Organization: + Tại trường Product type và trường product vendor input dataVerify giới hạn ký tựClick button Save changes", async () => {
      await product.setProductType(typeMaxLen);
      await product.setProductVendor(vendorMaxLen);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });
    await test.step("Click icon 'Preview' product on storefrontVerify trường Product type và product vendor", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.waitResponseWithUrl("/assets/landing.css", 60000);
      await productStoreFront.viewProductAgain(conf.caseConf.product_info.title);
      expect((await productStoreFront.getProductVendorSF()).length).toEqual(maxValue);
      expect((await productStoreFront.getProductTypeSF()).length).toEqual(maxValue);
    });
  });

  //SB_PRO_test_112
  test("[Add product]  Verify add tag cho product @SB_PRO_test_112", async ({ context, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const tagPlaceHolder = conf.caseConf.tag_place_holder;
    const tagMaxLen = conf.caseConf.tag_max_length;
    const listTag = conf.caseConf.list_tag;
    const selectedTag = conf.caseConf.selected_tag;
    const defaultValue = conf.caseConf.default_value;
    let tag: string;
    let productStoreFront: SFProduct;

    await test.step("Tại [All products], Create product, tại field Tags, verify Place holder của Vendor", async () => {
      await product.page.waitForSelector("//*[@id='all-products']");
      await product.searchProduct(productDetail.product_name);
      await product.page.waitForSelector("//span[@class='s-tag']//div[contains(text(),'Title contains')]");
      await product.deleteProduct(conf.suiteConf.password);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(`${productDetail.product_name} one`);
      await expect(product.genLoc("//input[@placeholder='Vintage, cotton, summer']")).toHaveAttribute(
        "placeholder",
        tagPlaceHolder,
      );
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.closeOnboardingPopup();
    });

    await test.step("click Preview, check tag của product trên store front", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.page.waitForSelector(`(${productStoreFront.xpathTrustBadgeImg})[1]`, { timeout: 100000 });
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      await productStoreFront.viewProductAgain(`${productDetail.product_name} one`);
      expect((await productStoreFront.getProductTagsSF()).length).toEqual(defaultValue);
      await SFPage.close();
    });

    await test.step("Tại Organization, add Tags với các kiểu dữ liệu, click [Save changes]", async () => {
      const tags = productDetail.tags.split(",");
      for (tag of tags) {
        await product.setProductTags(tag);
      }
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("click Preview, verify tags của product trên SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.page.waitForSelector(`(${productStoreFront.xpathTrustBadgeImg})[1]`, { timeout: 100000 });
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      await productStoreFront.viewProductAgain(`${productDetail.product_name} one`);
      await productStoreFront.page.waitForSelector(productStoreFront.xpathProductTags, { timeout: 10000 });
      expect((await productStoreFront.getProductTagsSF()).trim().toLowerCase()).toEqual(
        productDetail.tags.toLowerCase(),
      );
      await SFPage.close();
      await product.clickBackProductList();
    });

    await test.step("Tại Organization, Verify giới hạn ký tự, Click button Save changes", async () => {
      await product.page.waitForSelector("//button[normalize-space()='Add product']");
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(`${productDetail.product_name} two`);
      await product.setProductTags(tagMaxLen);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("click icon view on product detail, verify product tags của product trên SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.page.waitForSelector(`(${productStoreFront.xpathTrustBadgeImg})[1]`, { timeout: 100000 });
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      await productStoreFront.viewProductAgain(`${productDetail.product_name} two`);
      await productStoreFront.page.waitForSelector(productStoreFront.xpathProductTags, { timeout: 10000 });
      expect((await productStoreFront.getProductTagsSF()).trim().length).toEqual(tagMaxLen.length);
      await SFPage.close();
      await product.clickBackProductList();
    });

    await test.step("Tại Organization, verify hiển thị tag droplist, select a Tag, click [Save changes]", async () => {
      await product.page.waitForSelector("//button[normalize-space()='Add product']");
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(`${productDetail.product_name} three`);
      await product.setProductTags(selectedTag);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("click icon preview on product detail , verify Product Tags của product trên SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.page.waitForSelector(`(${productStoreFront.xpathTrustBadgeImg})[1]`, { timeout: 100000 });
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      await productStoreFront.viewProductAgain(`${productDetail.product_name} three`);
      await productStoreFront.page.waitForSelector(productStoreFront.xpathProductTags, { timeout: 10000 });
      expect((await productStoreFront.getProductTagsSF()).trim().toLowerCase()).toEqual(selectedTag.toLowerCase());
      await SFPage.close();
    });

    await test.step("Tại Organization, add nhiều Tags, click [Save changes]", async () => {
      await product.removeAllTags();
      await product.setProductTags(listTag);
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("click icon preview on product detail, verify Product Tags của product trên SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.page.waitForSelector(`(${productStoreFront.xpathTrustBadgeImg})[1]`, { timeout: 100000 });
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      await productStoreFront.viewProductAgain(`${productDetail.product_name} three`);
      await productStoreFront.page.waitForSelector(productStoreFront.xpathProductTags, { timeout: 10000 });
      expect((await productStoreFront.getProductTagsSF()).trim().toLowerCase()).toEqual(listTag.toLowerCase().trim());
    });
  });

  //SB_PRO_test_196
  test("[Add product] Add description có media cho Product @SB_PRO_test_196", async ({ context, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const embedURL = conf.caseConf.embed_url;
    const productEmbed = conf.caseConf.product_detail_embed;

    await test.step("Create product và add thông tin description cho product, verify thông tin product trong dashboard :1.Tại màn [All products] -> Click btn Add product2. Input title product3. Click vào icon media trong Description4. Input thông tin theo data5.Verify thông tin description tại màn hình product detail dasbhboard6.Click button Save changes", async () => {
      await product.searchProduct(productDetail.product_name);
      await product.deleteProduct(conf.suiteConf.password);
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
      await product.createDescriptionInsertMedia(productDetail.description);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.waitAbit(10000);
    });
    await test.step("Click vào icon View > Verify Description của product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.page.waitForSelector(`(${productStoreFront.xpathTrustBadgeImg})[1]`, {
        timeout: 100000,
      });
      await productStoreFront.waitAbit(10000);
      expect(await productStoreFront.getMediaDescriptionSf(productDetail.description)).toEqual(embedURL);
      await SFPage.close();
      await product.clickBackProductList();
    });
    await test.step("Create product và add thông tin description cho product, verify thông tin product trong dashboard :1.Tại màn [All products] -> Click btn Add product2. Input title product3. Click vào icon media trong Description4. Input thông tin theo data5.Verify thông tin description tại màn hình product detail dasbhboard6.Click button Save changes", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productEmbed.product_name);
      await product.createDescriptionInsertMedia(productEmbed.description);
      await product.page.waitForSelector(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.waitAbit(10000);
    });
    await test.step("Click vào icon View > Verify Description của product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.waitAbit(10000);
      expect(await productStoreFront.getMediaDescriptionSf(productEmbed.description)).toEqual(
        productEmbed.description.embed_code,
      );
    });
  });

  //SB_PRO_test_197
  test("[Add product] Verify add description cho Product  khi add  image @SB_PRO_test_197", async ({
    dashboard,
    context,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const productUpload = conf.caseConf.product_detail_upload;

    await test.step("Create product và add thông tin description image cho product, verify thông tin product trong dashboard:1.Tại màn [All products] -> Click btn Add product 2. Input title product2. Click vào icon Media trong Description3. Input link theo data -> Click button Save4. Verify thông tin description tại màn hình product detail", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
      await product.createDescriptionInsertImage(productDetail.description);
    });
    await test.step("Verify Description của product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getImageDescriptionSf()).toEqual(productDetail.description.source);
      await SFPage.close();
      await product.clickBackProductList();
    });
    await test.step("Create product và add thông tin description image cho product, verify thông tin product trong dashboard:1.Tại màn [All products] -> Click btn Add product 2. Input title product2. Click vào icon Media trong Description3. Upload Image hợp lệ với size <=20Mb và có định dạng là png, jpg, jpegtheo data -> Click button Save4. Verify thông tin description tại màn hình product detail", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productUpload.product_name);
      await product.createDescriptionInsertImage(productUpload.description);
    });
    await test.step("Verify Description của product ngoài SF", async () => {
      const uploadedUrl = (
        await dashboard
          .frameLocator(product.xpathDescriptionFrame)
          .locator("//body[@id='tinymce']//img")
          .getAttribute("src")
      ).split("/");
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getImageDescriptionSf()).toContain(uploadedUrl[uploadedUrl.length - 1]);
    });
  });

  //SB_PRO_test_198
  test("[Add product] Verify add description cho Product  khi add  Text @SB_PRO_test_198", async ({
    context,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    await test.step("1.Tại màn [All products] -> Click btn Add product 2. Input title product", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
    });
    await test.step("Input link theo dataĐổi màu Text, căn chỉnh text theo data 5.Verify thông tin description tại màn hình product detail", async () => {
      await product.genLoc("//div[@title = 'Text color']//span[2]").click();
      await product
        .genLoc(`//div[@class='tox-tiered-menu']//div[@title = '${productDetail.description.text_color}']`)
        .click();
      await product.genLoc("//button[@title = 'Align']").click();
      await product
        .genLoc(`//div[@class='tox-tiered-menu']//div[@title = '${productDetail.description.text_align}']`)
        .click();
      await product.setProductDescription(productDetail.description.content);
    });
    await test.step("6.Click button Save changes", async () => {
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });
    await test.step("1. Click vào icon View", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      const textAlign = await productStoreFront
        .genLoc("//div[@class='product__description-html']//p")
        .getAttribute("style");
      expect(textAlign).toContain(productDetail.description.text_align.toLowerCase());
      const textColor = await productStoreFront
        .genLoc("//div[@class='product__description-html']//span")
        .getAttribute("style");
      expect(textColor).toContain(productDetail.description.color_code);
      const content = await productStoreFront.genLoc("//div[@class='product__description-html']//span").innerText();
      expect(content).toEqual(productDetail.description.content);
    });
  });

  //@SB_PRO_test_199
  test("[Edit product]  Edit Inventory policy của product @SB_PRO_test_199", async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;
    const inventoryOptions = conf.caseConf.inventory_options;
    const productQuantityStr = conf.caseConf.quantity_str;
    const minQuantity = conf.caseConf.min_quantity;
    await product.clickOnBtnWithLabel("Add product");
    await product.setProductTitle(productDetail.product_name);
    await product.clickOnBtnWithLabel("Save changes");
    await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    await product.clickBackProductList();

    await test.step("Tại màn [All products] > sreach product vơi title Product AClick vào product A để mở detailTại check box Inventorytrường Inventory policy Click vào field Inventory policyVerify doplist hiển thị", async () => {
      await product.searchProduct(productDetail.product_name);
      await product.chooseProduct(productDetail.product_name);
      const options = inventoryOptions.split(",").map(item => item.trim());
      expect(
        await product.verifySelectOptions(
          "//div[@class='s-form-item'][descendant::*[normalize-space()='Inventory policy']]//select//option",
          options,
        ),
      ).toEqual(true);
    });
    await test.step("Select option 'ShopBase tracks this product's inventory'Verify thông tin hiển thị trên check box inventory và thông tin trường [Quantity ]", async () => {
      await product.setInventoryPolicy(productDetail.inventory_policy, productDetail.quantity);
    });
    await test.step("Input data vào trường QuantittyClick ra bên ngoài field [Quantity]Verify thông tin trường Quantity", async () => {
      await product.setProductQuantity(productQuantityStr);
      await product.genLoc("//input[@id='compare_price']").click();
      const productQuantity = await product.getInputValue("//input[@id='quantity']");
      expect(Number(productQuantity.trim())).toEqual(minQuantity);
    });
    await test.step("Nhập số thập phân vào field [Quantity ] theo data :Click ra bên ngoài field [Quantity]Verify thông tin trường Quantity", async () => {
      await product.setProductQuantity(productDetail.quantity);
      await product.genLoc("//input[@id='compare_price']").click();
      const productQuantity = await product.getInputValue("//input[@id='quantity']");
      expect(Number(productQuantity.trim())).toEqual(Math.floor(Number(productDetail.quantity)));
    });
  });

  test("[Add product]  Verify thông tin các trường SKU, Barcode của product @SB_PRO_test_200", async ({
    conf,
    authRequest,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_detail;

    await test.step("Tại màn [All products] > Click btn Create productInput Title product", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
    });
    await test.step("Add thông tin cho trường SKU và Barcode theo data", async () => {
      await product.setProductSKU(productDetail.sku);
      await product.setProductBarCode(productDetail.bar_code);
    });

    await test.step("Click btn Save change product Verify thông tin các trường SKU, Barcode củatrong màn product detail", async () => {
      await product.clickOnBtnWithLabel("Save changes");
      await (await product.toastWithText(conf.suiteConf.create_product_success)).isVisible({ timeout: 9000 });
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.page.waitForSelector('//button[normalize-space()="Save changes"]', { state: "hidden" });
      await (await product.toastWithText(conf.suiteConf.create_product_success)).isHidden({ timeout: 9000 });
      // wait to save data and sync successfully
      await product.waitAbit(3000);
      const productId = await product.getProductId(authRequest, productDetail.product_name, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, productDetail),
      ).toEqual(productDetail);
    });

    await test.step("Click icon View , View Product A ngoài SF Verify thông tin trường SKU và Barcode của product A", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.page.waitForSelector(`(${productSF.xpathTrustBadgeImg})[1]`, { timeout: 90000 });

      expect(await productSF.getProductSKUSF()).toEqual(productDetail.sku);
    });
  });

  //@SB_PRO_test_113
  test("[Edit product] Verify product khi được Duplicate @SB_PRO_test_113", async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;
    const productValidateDashboard = conf.caseConf.product_validate_dashboard;
    const productValidateSF = conf.caseConf.product_validate_SF;
    const productWithoutImage = conf.caseConf.product_valid_db_without_img;
    const productSFWithoutImage = conf.caseConf.product_sf_without_img;
    let productId: number;

    await test.step("Precondition: Tao product", async () => {
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 9000 });
      await expect(await product.toastWithText(conf.suiteConf.create_product_success)).toBeVisible();
      await product.closeOnboardingPopup();
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
    });

    await test.step("Search product và thực hiện duplicate product, verify thông tin product vừa được duplicate trong dashboard :1. Tại màn [All products] > sreach product vơi title Product A2. Click vào product A để mở detail3. Click button [Dupicate] Verify popup hiển thị trên màn hình- Tại Popup duplicateinput Provide a name for your new product : Product BCheck checkbox 'Duplicate product medias'Click button [Duplicate]Verify thông tin của Product B", async () => {
      await product.searchProduct(productInfo.product);
      await product.chooseProduct(productInfo.product);
      await product.clickOnBtnWithLabel("Duplicate");
      await product.duplicateProduct(true, productInfo.title_new);
      await product.waitAbit(2000);

      productId = await product.getProductId(authRequest, productInfo.title_new, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDashboard,
        ),
      ).toEqual(productValidateDashboard);
    });

    await test.step("verify thông tin của product B ngoài SF", async () => {
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
    });

    await test.step("Tại màn [All products] > sreach product vơi title Product AClick vào product A để mở detailClick button [Dupicate]Tại popup duplicate: input Provide a name for your new product : Product BUncheck checkbox 'Duplicate product medias'Click button [Duplicate]Verify thông tin của Product B", async () => {
      await product.searchProduct(productInfo.product);
      await product.chooseProduct(productInfo.product);
      await product.clickOnBtnWithLabel("Duplicate");
      await product.duplicateProduct(false, productInfo.product_without_img);
      await product.waitAbit(2000);
      productId = await product.getProductId(authRequest, productInfo.product_without_img, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, productWithoutImage),
      ).toEqual(productWithoutImage);
    });

    await test.step("verify thông tin của product B ngoài SF", async () => {
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productSFWithoutImage,
        ),
      ).toEqual(productSFWithoutImage);
    });
  });

  //SB_PRO_test_114
  test("[Edit product]Verify các action show, hide của product khi thực hiện edit product @SB_PRO_test_114", async ({
    conf,
    dashboard,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;
    const productStatus = conf.caseConf.product_status;
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    const waitTime = conf.caseConf.img_loading_time;
    sfProduct = new SFProduct(dashboard, conf.suiteConf.domain);

    await test.step("Precondition: Reset old data and Create new product", async () => {
      await product.searchProduct(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.navigateToSubMenu("Products", "Collections");
      await collection.deleteCollection(conf.caseConf.collection_info.collection_title);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.navigateToSubMenu("Products", "Collections");
      await collection.clickOnBtnWithLabel("Create collection");
      await collection.createCollection(conf.caseConf.collection_info);
      await collection.page.waitForSelector('//div[@class="s-alert__description"]');
      await product.waitAbit(10000);
      await product.navigateToSubMenu("Products", "All products");
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await expect(await product.toastWithText(conf.suiteConf.create_product_success)).toBeVisible();
      await (await product.toastWithText(conf.suiteConf.create_product_success)).waitFor({ state: "hidden" });
      await product.closeOnboardingPopup();
      await product.page.waitForSelector('//button[normalize-space()="Save changes"]', { state: "hidden" });
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
      await product.waitAbit(10000);
    });

    await test.step("Ở Dashboard, vào product detail, click [Hide product] > Click [Save change]", async () => {
      await product.searchProduct(productInfo.title);
      await product.chooseProduct(productInfo.title);
      await product.clickOnBtnWithLabel("Hide product");
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
      await product.waitAbit(10000);
    });

    await test.step("Tại màn product list, search product, check status hide product hiển thị", async () => {
      await product.searchProduct(productInfo.title);
      expect((await product.genLoc("(//div[contains(@class,'product-status')])[1]").innerText()).trim()).toContain(
        productStatus.unavailable,
      );
    });

    await test.step("Open SF, search product và check hiển thị", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/search`);
      await dashboard.fill("//input[@placeholder = 'Enter keywords...']", productInfo.title);
      await dashboard.locator("//input[@placeholder = 'Enter keywords...']").press("Enter");
      await dashboard.waitForLoadState("networkidle");
      await dashboard.waitForTimeout(waitTime);
      await expect(dashboard.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title))).toBeHidden();
    });

    await test.step("Verify hiển thị product trong collection ngoài SF", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/collections`);
      await dashboard.click(`//h5[normalize-space()="${productInfo.collections}"]`);
      while (await dashboard.isHidden("//div[contains(@class,'collection-detail__product-image')]")) {
        await dashboard.reload();
        await dashboard.waitForLoadState("networkidle");
        await dashboard.waitForTimeout(waitTime);
      }
      await expect(dashboard.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title))).toBeHidden();
    });

    await test.step("Ở Dashboard, vào product detail, click [Show product] > Click [Save change]", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.waitForLoadState("networkidle");
      await product.searchProduct(productInfo.title);
      await product.chooseProduct(productInfo.title);
      await product.clickOnBtnWithLabel("Show product");
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
      await product.waitAbit(10000);
    });

    await test.step("Tại màn product list, search product, check status product", async () => {
      await product.searchProduct(productInfo.title);
      await expect(product.genLoc("(//div[contains(@class,'product-status')])[1]")).toBeHidden();
    });

    await test.step("Open SF, search product và check hiển thị", async () => {
      await product.goToSearchProductOnSF(productInfo.title);
      await product.page.waitForTimeout(waitTime);
      await expect(dashboard.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title))).toBeVisible();
    });

    await test.step("Verify hiển thị product trong collection ngoài SF", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/collections`, { waitUntil: "networkidle" });
      await dashboard.click(`//h5[normalize-space()="${productInfo.collections}"]`);
      const collectionSF = new SFCollection(dashboard, conf.suiteConf.domain);
      while ((await collectionSF.page.locator(collectionSF.xpathProductExampleInCollection).count()) > 0) {
        await collectionSF.page.reload({ waitUntil: "domcontentloaded" });
        await collectionSF.waitAbit(1000); //chờ 1 giây để tránh load spam
      }
      await dashboard.waitForTimeout(waitTime);
      await expect(dashboard.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title))).toBeVisible();
    });
  });

  //SB_PRO_test_116
  test("[Edit product] Verify khối Pricing khi thực hiện edit product @SB_PRO_test_116", async ({
    dashboard,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productWithVariants = conf.caseConf.product_with_variants;

    await test.step("Tại màn [All products] > sreach product vơi title Product AClick vào product A để mở detail Verify pricing của product", async () => {
      await product.addNewProductWithData(productWithVariants);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await expect(dashboard.locator(product.xpathBlockPrice)).toBeVisible();
    });

    await test.step("Add variant cho product >  Verify pricing của product", async () => {
      await product.addVariants(productWithVariants);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      const visiblePrice = await dashboard.locator(product.xpathBlockPrice).isVisible();
      expect(visiblePrice).toEqual(productWithVariants.block_pricing);
    });
  });

  //@SB_PRO_test_193
  test("[Add product] Add product thành công khi chỉ fill trường Title @SB_PRO_test_193", async ({ context, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;

    await test.step("Create product và verify thông tin product trong dashboard :1. Tại màn [All products] >Click btn[Add product]2. Input title theo data:3.Click button Save changes", async () => {
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });
    await test.step("Click icon View > Verify thông tin Product A ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getProductTitle()).toEqual(productInfo.title);
    });
  });

  //SB_PRO_test_194
  test("[Add product] Add product thành công khi fill thông tin cho tất cả các trường @SB_PRO_test_194", async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;

    await test.step("Precondition: Reset old data and Tao product", async () => {
      await product.searchProduct(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
    });

    await test.step("Create product và verify thông tin product trong dashboard :1. Tại màn [All products] >Click btn[Add product]2. Input title theo data:3.Click button Save changes", async () => {
      await product.addNewProductWithData(productInfo);
      await product.waitResponseWithUrl("/content/default/content.min.css", 60000);
      await waitForImageLoaded(product.page, '//div[contains(@class,"section-image")]/div[last()]');
      await product.page.waitForSelector('//div[contains(@class,"s-toast")]', { state: "detached" });
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.clickOnBtnWithLabel("Edit website SEO");
      await product.page.waitForSelector('//label[text()="URL and handle"]');
      // video thuong hien thi châm
      await product.page.waitForTimeout(6000);
      await snapshotFixture.verify({
        page: product.page,
        selector: '//div[@class="row product-info"]',
        snapshotName: `${env}-product-all-info-in-dashboard.png`,
        sizeCheck: true,
      });
    });
    await test.step("Click icon View > Verify thông tin Product A ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfProduct.waitResponseWithUrl("/assets/landing.css", 60000);
      await SFPage.waitForSelector(`(${sfProduct.xpathTrustBadgeImg})[1]`, { timeout: 10000 });
      await SFPage.frameLocator("#manage-bar").locator('//span[@class="s-icon is-small"]').click();
      await snapshotFixture.verify({
        page: SFPage,
        selector: '//div[@id="detail-contents"]',
        snapshotName: `${env}-product-all-info-in-storefornt.png`,
      });
      await snapshotFixture.verify({
        page: SFPage,
        selector: '//div[@id="detail-contents"]/preceding-sibling::div/div',
        snapshotName: `${env}-product-media-in-storefornt.png`,
      });
    });
  });

  //SB_PRO_test_195
  test("[Add product] Verify add description cho Product  khi có link @SB_PRO_test_195", async ({
    conf,
    dashboard,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productDetail = conf.caseConf.product_info;
    const productWithTargetUrl = conf.caseConf.product_desc_target_url;
    const targetUrl = conf.caseConf.target_url;

    await test.step("Create product và add thông tin description cho product, verify thông tin product trong dashboard", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
      await product.createDescriptionInsertLink(productDetail.description);
      const description = dashboard.frameLocator(product.xpathDescriptionFrame).locator(product.xpathLinkInDescription);
      await expect(description).toHaveAttribute("href", productDetail.description.description_URL);
      await expect(description).toHaveText(productDetail.description.text_to_display);
      await expect(description).toHaveAttribute("title", productDetail.description.title_description);
    });

    await test.step("Click vào icon View > Verify Description của product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("domcontentloaded");
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await sfProduct.getMediaDescriptionSf(productDetail.description)).toEqual(
        JSON.stringify(productDetail.description),
      );
      await SFPage.close();
      await product.clickBackProductList();
      await product.page.waitForSelector(product.xpathTableProduct, { timeout: 9000 });
    });

    await test.step("Tạo product với: title product, Link trong Description và verify lại thông tin tại product detail", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productWithTargetUrl.product_name);
      await product.createDescriptionInsertLink(productWithTargetUrl.description);
      const description = dashboard.frameLocator(product.xpathDescriptionFrame).locator(product.xpathLinkInDescription);
      await expect(description).toHaveAttribute("target", targetUrl);
    });
    await test.step("View product ngoài SF > Verify Description của product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("domcontentloaded");
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await sfProduct.getMediaDescriptionSf(productWithTargetUrl.description)).toEqual(
        JSON.stringify(productWithTargetUrl.description),
      );
    });
  });
  //SB_PRO_test_203 - pass
  test("[SEO] Verify thông tin product trên google @SB_PRO_test_203", async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;

    await test.step("Add product, Edit Website SEO, nhập Page tilte và Meta description", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productInfo.title);
      await product.setWebSEO(productInfo.page_title, productInfo.meta_description);
    });

    await test.step("Click Save change, Verify list thông tin hiển thị sau khi sreach", async () => {
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      expect(await product.getTextContent(product.xpathGoogleTitlePreview)).toEqual(productInfo.page_title);
      expect(await product.getTextContent(product.xpathGoogleDescriptionPreview)).toEqual(productInfo.meta_description);
    });
  });

  test("[Add product] Add description có media theo Advanced cho Product @SB_PRO_test_207", async ({
    conf,
    context,
  }) => {
    const productDetail = conf.caseConf.product_info;
    await test.step("Create product và add thông tin description cho product, verify thông tin product trong dashboard", async () => {
      await product.clickOnBtnWithLabel("Add product");
      await product.setProductTitle(productDetail.product_name);
      await product.createDescriptionInsertMedia(productDetail.description);
      const description = product.page
        .frameLocator(product.xpathDescriptionFrame)
        .locator(product.xpathMediaInDescription);
      await expect(description).toHaveAttribute("data-mce-p-src", productDetail.alternative_source_URL);
    });
    await test.step("Click vào icon View > Verify Description của product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await expect(sfProduct.page.locator(sfProduct.xpathDescriptionIframe)).toHaveAttribute(
        "src",
        productDetail.descriptionInsert,
      );
    });
  });

  test("Sync - Unavilable 1 product @SB_PRO_SP_101", async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_all_info;
    await test.step("Click Add product, Nhập các thông tin product và Click Save", async () => {
      await product.addNewProductWithData(productInfo);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step('Click btn "Hide product" trong màn hình product detail > Click btn "Save changes" > Verify product ngoài SF', async () => {
      await dashboard.click(product.xpathBtnHideProduct);
      await product.clickOnBtnWithLabel("Save changes", 1);
      const handle = await product.getTextContent(product.xpathUrl);
      await dashboard.goto(handle);
      await product.page.waitForSelector(product.xpathNotFound, { timeout: 10000 });
      expect(await product.getTextContent(product.xpathNotFound)).toEqual("404 Page Not Found");
    });
  });

  test("Verify image của product khi Setting theme là `Only from the variant group` @SB_PRO_test_280 ", async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
  }) => {
    const productDetail = conf.caseConf.product_info;
    await test.step("Create product have the variants with images", async () => {
      await product.addNewProductWithData(productDetail);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.addVariants(conf.caseConf.product_variant);
      await product.selectAllVariantImage();
      await product.clickOnBtnWithLabel("Save changes");
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("Setting 'Only from the variant group' trong theme", async () => {
      const theme = new ThemeDashboard(dashboard, conf.suiteConf.domain);
      await theme.goToCustomizeTheme(conf.suiteConf.domain);
      await theme.page.waitForSelector("//div[contains(@id,'tab-navigation')]//div[text()='Settings']");
      await theme.settingForPhotoList(conf.caseConf.photo_list_style);
    });

    await test.step("Verify product at SF", async () => {
      await product.navigateToMenu("Products");
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnOnlineStore()]);
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfProduct.page.waitForSelector(sfProduct.variantIBtn, { timeout: 30000 });
      const variantQuantity = await sfProduct.page.locator(sfProduct.variantIBtn).count();
      for (let i = 1; i <= variantQuantity; i++) {
        await sfProduct.page.click(`(${sfProduct.variantIBtn})[${i}]`);
        await waitForImageLoaded(SFPage, sfProduct.xpathProductMediaGallery);
        // wait for image display stable
        await sfProduct.page.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: SFPage,
          selector: sfProduct.xpathProductMediaGallery,
          snapshotName: `${env}-variant${i}.png`,
        });
      }
    });
  });

  test("Verify product type/tag/colletion của product ngoài SF @SB_PRO_test_290", async ({ conf, context }) => {
    const productDetail = conf.caseConf.product_info;
    await test.step("Create product with Type, Categories, Collection", async () => {
      await product.navigateToSubMenu("Products", "Collections");
      await collection.searchCollection(conf.caseConf.collection_info.collection_title);
      await collection.page.waitForTimeout(3000);
      if (await collection.page.locator(collection.xpathNoCollectionMessage).isVisible()) {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(conf.caseConf.collection_info);
      }
      await product.navigateToSubMenu("Products", "All products");
      await product.addNewProductWithData(productDetail);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
    });

    await test.step("Ngoai SF, verify tung organization", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfProduct.goto(conf.suiteConf.collection_url);
      const sfCollection = new SFCollection(SFPage, conf.suiteConf.doamin);
      await sfProduct.clickElementWithLabel("h5", conf.caseConf.collection_info.collection_title);
      await expect(sfCollection.page.locator(sfCollection.xpathProductList)).toContainText(productDetail.title);
      await sfProduct.goto(conf.suiteConf.type_url + productDetail.product_type);
      await expect(sfProduct.page.locator(sfCollection.xpathProductList)).toContainText(productDetail.title);
      await sfProduct.goto(conf.suiteConf.tag_url + productDetail.tag);
      await expect(sfProduct.page.locator(sfCollection.xpathProductList)).toContainText(productDetail.title);
    });
  });

  test("Verify Add to cart product tại product page khi select value và không select value @SB_PRO_test_288 ", async ({
    context,
    conf,
    authRequest,
    dashboard,
  }) => {
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest, dashboard);
    const variantOptions = conf.caseConf.variant_options;
    const notDefaultvariant: DefaultVariantSettings = conf.caseConf.not_default_variant;
    const selectDefaultvariant: DefaultVariantSettings = conf.caseConf.select_default_variant;
    let productUrl: string;
    await test.step("Precondition: Tao product, voi variant options", async () => {
      await product.closeOnboardingPopup();
      await product.addNewProductWithData(conf.caseConf.product_info);
      await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 90000 });
      await product.addVariants(conf.caseConf.product_variant);
    });
    await test.step("Setting cho phần default variant selection trong Online store > preferences là Do not select ...", async () => {
      await preferences.settingDefaultVariantSelection(notDefaultvariant, conf.suiteConf.shop_id);
    });
    await test.step("View product ngoài SF> không chọn value và click vào button Add to cart > Verify message hiển thị", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      productUrl = sfProduct.page.url();
      await sfProduct.page.goto(productUrl);
      await sfProduct.page.waitForSelector(`(${sfProduct.xpathTrustBadgeImg})[1]`, { timeout: 10000 });
      await sfProduct.viewProductAgain(conf.caseConf.product_info.title);
      await sfProduct.page.waitForSelector(`(${sfProduct.xpathTrustBadgeImg})[1]`, { timeout: 10000 });
      await sfProduct.addProductToCart();
      for (const variantOption of variantOptions) {
        await expect(sfProduct.page.locator(sfProduct.xpathMsgChooseOption(variantOption.option))).toContainText(
          variantOption.message,
        );
      }
    });
    await test.step("click chọn value và click button Add to cart, Verify thông tin trong cart", async () => {
      await sfProduct.page.click(`(${sfProduct.xpathTrustBadgeImg})[1]`);
      await sfProduct.selectValueProduct(conf.caseConf.variant);
      await sfProduct.addProductToCart();
      await sfProduct.page.waitForSelector(`(${sfProduct.xpathTrustBadgeImg})[1]`, { timeout: 9000 });
      await expect(sfProduct.page.locator(sfProduct.xpathProductOptionInCart())).toContainText(
        `${conf.caseConf.variant.size} / ${conf.caseConf.variant.color}`,
      );
    });
    await test.step("Quay lại setting cho phần default variant selection trong Online store > preferences là automatically", async () => {
      await preferences.settingDefaultVariantSelection(selectDefaultvariant, conf.suiteConf.shop_id);
    });
    await test.step("View product ngoài SF> không chọn value và click vào button Add to cart, Verify thông tin trong cart", async () => {
      await sfProduct.page.goto(productUrl);
      await sfProduct.page.waitForSelector(`(${sfProduct.xpathTrustBadgeImg})[1]`, { timeout: 10000 });
      await sfProduct.viewProductAgain(conf.caseConf.product_info.title);
      await sfProduct.page.waitForSelector(`(${sfProduct.xpathTrustBadgeImg})[1]`, { timeout: 10000 });
      await sfProduct.addProductToCart();
      await sfProduct.page.waitForSelector(sfProduct.xpathProductOptionInCart(), { timeout: 9000 });
      await expect(sfProduct.page.locator(sfProduct.xpathProductOptionInCart())).toContainText(
        `${conf.caseConf.default_variant.size} / ${conf.caseConf.default_variant.color}`,
      );
    });
  });
});
