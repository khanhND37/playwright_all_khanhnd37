import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFProduct } from "@sf_pages/product";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFHome } from "@sf_pages/homepage";

test.describe("Create group layer for shopbase persionalize", () => {
  let dashboardPage: DashboardPage;
  let productPage: ProductPage;
  let printbasePage: PrintBasePage;
  let layerList;
  let productInfo;
  let groupList;
  let customOption;
  let productValidateDetail;
  let homepage: SFHome;
  let customOptionSF;
  let checkout: SFCheckout;
  let customerInfo;
  let cardInfo;
  let orderPage: OrdersPage;
  let orderId: number;
  let accessToken;
  let totalOrderSF: string;
  let productSF: SFProduct;
  test.beforeEach(async ({ dashboard, conf, token }) => {
    test.setTimeout(conf.suiteConf.timeout);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    productPage = new ProductPage(dashboard, conf.suiteConf["domain"]);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    productSF = new SFProduct(dashboard, conf.suiteConf.domain);
    homepage = new SFHome(dashboard, conf.suiteConf.domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    checkout = new SFCheckout(dashboard, conf.suiteConf.domain);
    layerList = conf.caseConf.layers;
    productInfo = conf.caseConf.product_info;
    groupList = conf.caseConf.groups;
    customOption = conf.caseConf.custom_options;
    productValidateDetail = conf.caseConf.product_validate_detail;
    customOptionSF = conf.caseConf.custom_options_sf;
    customerInfo = conf.suiteConf.customer_info;
    cardInfo = conf.suiteConf.card_info;
    totalOrderSF = conf.caseConf.total_order_sf;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    await dashboardPage.navigateToMenu("Products");
    await productPage.addNewProductWithData(productInfo);
    await test.step("Click vào btn Create preview image sau đó upload ảnh preview", async () => {
      await productPage.clickOnBtnWithLabel("Create Preview image");
      await productPage.uploadImagePreviewOrPrintfile(conf.caseConf.image_preview);
      await productPage.waitBtnDeleteVisible();
    });

    await test.step("Add layer, tạo group layer sau đó add layer vào group", async () => {
      for (let i = 0; i < layerList.length; i++) {
        await productPage.addLayer(layerList[i]);
      }
      for (let i = 0; i < groupList.length; i++) {
        await productPage.createGroupLayer(groupList[i].current_group, groupList[i].new_group);
        await productPage.addLayerToGroup(groupList[i].layer_name, groupList[i].new_group);
      }
    });

    await test.step("Click vào btn Add custom option sau đó setup custom option cho preview", async () => {
      await printbasePage.clickBtnAddCO();
      for (let i = 0; i < customOption.length; i++) {
        await productPage.addCustomOptionOnEditor(customOption[i]);
      }
      if ((await productPage.checkLocatorVisible("(//a[normalize-space()='Picture choice'])[1]")) === true) {
        await productPage.clickElementWithLabel("a", "Picture choice");
        await productPage.clickOnElement(
          "//div[contains(@class,'custom-option')]//i[@class='mdi mdi-chevron-left mdi-36px']",
        );
      }
      await productPage.waitBtnEnable("Save");
    });
  });

  // eslint-disable-next-line max-len
  test("[Preview image] Check tạo thành công Customize group dạng Droplist với các loại CO @SB_PRO_test_183", async ({
    conf,
    authRequest,
  }) => {
    await test.setTimeout(conf.suiteConf.timeout);

    await test.step("Click button [Customize group], sau đó setup customize group", async () => {
      // eslint-disable-next-line max-len
      await productPage.setupCustomizeGroup(conf.caseConf.customize_group);
    });

    await test.step("Click vào btn Next, create print file sau đó upload ảnh print file", async () => {
      await productPage.clickOnBtnWithLabel("Next, create Print file");
      await productPage.uploadImagePreviewOrPrintfile(conf.caseConf.image_printfile);
      await productPage.waitBtnDeleteVisible();
      await printbasePage.clickBtnExpand();
      expect(await productPage.getNameCustomOption()).toEqual(conf.caseConf.custom_options_vadidate);
    });

    await test.step("Click vào btn Save sau đó verify màn hình productSF detail", async () => {
      await productPage.waitBtnEnable("Save");
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Cancel");
      const productId = await productPage.getProductId(authRequest, productValidateDetail.title, conf.suiteConf.domain);
      expect(
        await productPage.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await productPage.checkImageEnableAfterCreated("Preview Images")).toEqual(true);
      expect(await productPage.checkImageEnableAfterCreated("Print Files")).toEqual(true);
    });

    // eslint-disable-next-line max-len
    await test.step("Search and select productSF ngoài SF > Lần lượt select các group sau đó input các custom option của các group tương ứng", async () => {
      await homepage.gotoHomePage();
      await homepage.searchThenViewProduct(productInfo.title);
      for (let i = 0; i < customOptionSF.length; i++) {
        await productSF.inputCustomOptionSF(customOptionSF[i]);
      }
      await productPage.waitBtnEnable("Preview your design");
    });

    await test.step("Click button [Add to cart]> thực hiện các step checkout thành công order", async () => {
      await productSF.addToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithCardInfo(cardInfo);
      await orderPage.thankYouPageAppear();
    });

    await test.step("Mở hành hình order detail sau đó verify các thông tin trong order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const orderStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(orderStatus);
      expect(orderStatus).toEqual("Paid");
      expect(await orderPage.getTotalOrder()).toEqual(totalOrderSF);
      expect(await orderPage.getPaidByCustomer()).toEqual(totalOrderSF);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.label_print_file,
      });
    });
  });

  // eslint-disable-next-line max-len
  test("Check tạo thành công Customize group dạng Radio với các loại CO @SB_PRO_test_184", async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);

    await test.step("Click button [Customize group], sau đó setup customize group", async () => {
      await productPage.clickOnBtnWithLabel("Customize group");
      // eslint-disable-next-line max-len
      await productPage.setupCustomizeGroup(conf.caseConf.customize_group);
    });

    await test.step("Click vào btn Next, create print file sau đó upload ảnh print file", async () => {
      await productPage.clickOnBtnWithLabel("Next, create Print file");
      await productPage.uploadImagePreviewOrPrintfile(conf.caseConf.image_printfile);
      await productPage.waitBtnDeleteVisible();
      await printbasePage.clickBtnExpand();
      expect(await productPage.getNameCustomOption()).toEqual(conf.caseConf.custom_options_vadidate);
    });

    await test.step("Click vào btn Save sau đó verify màn hình productSF detail", async () => {
      await productPage.waitBtnEnable("Save");
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Cancel");
      const productId = await productPage.getProductId(authRequest, productValidateDetail.title, conf.suiteConf.domain);
      expect(
        await productPage.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await productPage.checkImageEnableAfterCreated("Preview Images")).toEqual(true);
      expect(await productPage.checkImageEnableAfterCreated("Print Files")).toEqual(true);
    });

    // eslint-disable-next-line max-len
    await test.step("Search and select productSF ngoài SF > Lần lượt select các group sau đó input các custom option của các group tương ứng", async () => {
      await homepage.gotoHomePage();
      await homepage.searchThenViewProduct(productInfo.title);
      for (let i = 0; i < customOptionSF.length; i++) {
        await productSF.inputCustomOptionSF(customOptionSF[i]);
      }
      await productPage.waitBtnEnable("Preview your design");
    });

    await test.step("Click button [Add to cart]> thực hiện các step checkout thành công order", async () => {
      await productSF.addToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithCardInfo(cardInfo);
      await orderPage.thankYouPageAppear();
    });

    await test.step("Mở hành hình order detail sau đó verify các thông tin trong order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const orderStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(orderStatus);
      expect(orderStatus).toEqual("Paid");
      expect(await orderPage.getTotalOrder()).toEqual(totalOrderSF);
      expect(await orderPage.getPaidByCustomer()).toEqual(totalOrderSF);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.label_print_file,
      });
    });
  });

  // eslint-disable-next-line max-len
  test("Check tạo thành công Customize group dạng Picture choice với các loại CO @SB_PRO_test_185", async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);

    await test.step("Click button [Customize group], sau đó setup customize group", async () => {
      await productPage.clickOnBtnWithLabel("Customize group");
      // eslint-disable-next-line max-len
      await productPage.setupCustomizeGroup(conf.caseConf.customize_group);
    });

    await test.step("Click vào btn Next, create print file sau đó upload ảnh print file", async () => {
      await productPage.waitBtnEnable("Next, create Print file");
      await productPage.clickOnBtnWithLabel("Next, create Print file");
      await productPage.uploadImagePreviewOrPrintfile(conf.caseConf.image_printfile);
      await productPage.waitBtnDeleteVisible();
      await printbasePage.clickBtnExpand();
      expect(await productPage.getNameCustomOption()).toEqual(conf.caseConf.custom_options_vadidate);
    });

    await test.step("Click vào btn Save sau đó verify màn hình productSF detail", async () => {
      await productPage.waitBtnEnable("Save");
      await productPage.clickOnBtnWithLabel("Save");
      const productId = await productPage.getProductId(authRequest, productValidateDetail.title, conf.suiteConf.domain);
      expect(
        await productPage.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
      expect(await productPage.checkImageEnableAfterCreated("Preview Images")).toEqual(true);
      expect(await productPage.checkImageEnableAfterCreated("Print Files")).toEqual(true);
    });

    // eslint-disable-next-line max-len
    await test.step("Search and select productSF ngoài SF > Lần lượt select các group sau đó input các custom option của các group tương ứng", async () => {
      await homepage.gotoHomePage();
      await homepage.searchThenViewProduct(productInfo.title);
      for (let i = 0; i < customOptionSF.length; i++) {
        await productSF.inputCustomOptionSF(customOptionSF[i]);
      }
      await productPage.waitBtnEnable("Preview your design");
    });

    await test.step("Click button [Add to cart]> thực hiện các step checkout thành công order", async () => {
      await productSF.addToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithCardInfo(cardInfo);
      await orderPage.thankYouPageAppear();
    });

    await test.step("Mở hành hình order detail sau đó verify các thông tin trong order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const orderStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(orderStatus);
      expect(orderStatus).toEqual("Paid");
      expect(await orderPage.getTotalOrder()).toEqual(totalOrderSF);
      expect(await orderPage.getPaidByCustomer()).toEqual(totalOrderSF);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.label_print_file,
      });
    });
  });
});
