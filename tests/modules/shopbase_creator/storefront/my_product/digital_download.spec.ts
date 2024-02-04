import { DefaultGetProductAPIParam } from "@constants";
import { expect, test } from "@core/fixtures";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { CreatorCheckoutAPI } from "@pages/shopbase_creator/storefront/checkout_api";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe(`Kiểm tra chức năng My product Page`, async () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let myProductPage: MyProductPage;
  let orderPage: OrderPage;
  let checkoutAPI: CreatorCheckoutAPI;
  let productDataRequest;
  let sfTab;

  test.beforeEach(async ({ dashboard, conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.time_out);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);

    //Create product with api
    productDataRequest = conf.suiteConf.product_request;
    const productsCheckout = conf.suiteConf.products_checkout;
    const productResponse = await productAPI.createProduct(productDataRequest);
    const variantId = productResponse.data.product.variant_offers[0].variant_id;
    await productPage.navigateToMenu("Products");
    productsCheckout.cartItem.variant_id = variantId;
    const customerInfo = conf.suiteConf.customer_info;
    checkoutAPI = new CreatorCheckoutAPI(conf.suiteConf.domain, authRequest);
    await checkoutAPI.createAnOrderCreator(productsCheckout, customerInfo);
    await productPage.navigateToMenu("Orders");
    await orderPage.waitForFirstOrderStatus("paid");

    //Login to acc user
    sfTab = await context.newPage();
    myProductPage = new MyProductPage(sfTab, conf.suiteConf.domain);
    await myProductPage.login(conf.suiteConf.member_email, conf.suiteConf.member_password);
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`my_product_detail - digital_download - Kiểm tra download file ở lecture bất kì trong khóa học @SB_SC_SCSF_SCSP_30`, async ({
    conf,
  }) => {
    let timestampStr;
    let suggestedFilename;

    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct("Product Digital download");
    await productPage.switchTab("Content");
    await productPage.uploadFileOrMedia(conf.caseConf.type_file, conf.caseConf.file_path, conf.caseConf.product_type);

    await test.step(`Click button Download 1 file ở màn hình view nội dung lecture -> mở file vừa download.`, async () => {
      await myProductPage.goto("/my-products");
      await myProductPage.clickOpenContent("Product Digital download");
      const download = await myProductPage.downloadFileDigitalDownload();
      timestampStr = Date.now().toString().slice(0, 8);
      suggestedFilename = download.suggestedFilename().slice(0, 8);
      expect(suggestedFilename).toEqual(timestampStr);
    });

    await test.step(`Click button Download file đó một lần nữa.`, async () => {
      await myProductPage.downloadFileDigitalDownload();
      const download = await myProductPage.downloadFileDigitalDownload();
      timestampStr = Date.now().toString().slice(0, 8);
      suggestedFilename = download.suggestedFilename().slice(0, 8);
      expect(suggestedFilename).toEqual(timestampStr);
    });
  });

  test(`my_product_detail - digital_download - Kiểm tra UI - UX trang Digital download product detail của member trên storefront @SB_SC_SCSF_SCSP_15`, async ({
    conf,
  }) => {
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct("Product Digital download");
    await productPage.switchTab("Content");
    await productPage.uploadFileOrMedia(conf.caseConf.type_file, conf.caseConf.file_path, conf.caseConf.product_type);

    await test.step(`Click vào sản phẩm Digital download đã mua`, async () => {
      await myProductPage.goto("/my-products");
      await myProductPage.clickOpenContent("Product Digital download");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("All products"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("My products"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.xpathMyAvatar)).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Back to My Products"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Digital download"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("1 file"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.xpathBtnDownload)).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Test data.pptx"))).toBeVisible();
    });

    await test.step(`Ở phần header, click All products`, async () => {
      await myProductPage.clickToOpenAllProduct();
      await expect(myProductPage.genLoc(myProductPage.xpathHeaderAllProduct)).toBeVisible();
    });

    await test.step(`Mở lại trang Digital download detail của member bằng cách thực hiện 2 step sau:
     - Click mục My product phía trên cùng bên phải 
     - Click vào sản phẩm Digital download đã mua`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct("Product Digital download");
      await productPage.switchTab("Content");
      await productPage.uploadFileOrMedia(conf.caseConf.type_file, conf.caseConf.file_path, conf.caseConf.product_type);
      await myProductPage.goto("/my-products");
      await myProductPage.clickOpenContent("Product Digital download");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("2 files"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.xpathBtnDownload)).toBeVisible();
    });

    await test.step(`Ở phần header, click My products`, async () => {
      await myProductPage.clickMyProductMenu();
      await expect(myProductPage.genLoc(myProductPage.xpathHeaderMyProduct)).toBeVisible();
    });

    await test.step(`Mở lại trang Digital download detail của member bằng cách thực hiện step sau: - Click vào sản phẩm Digital download đã mua`, async () => {
      await myProductPage.clickOpenContent("Product Digital download");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("2 files"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.xpathBtnDownload)).toBeVisible();
    });

    await test.step(`Ở phần header, click mục My account`, async () => {
      await myProductPage.genLoc(myProductPage.xpathMyAvatar).click();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("My profile"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Change password"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Purchase history"))).toBeVisible();
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Log out"))).toBeVisible();
    });

    await test.step(`Phía dưới header, click breadcrum Back to My Products`, async () => {
      await myProductPage.clickToBackMyProduct();
      await expect(myProductPage.genLoc(myProductPage.xpathHeaderMyProduct)).toBeVisible();
    });
  });
});
