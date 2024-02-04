import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Campaign } from "@pages/storefront/campaign";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { ProductPage } from "@pages/dashboard/products";
import { HivePBase } from "@pages/hive/hivePBase";

test.describe("Checkout campaign without mockup", () => {
  let product;
  let printbasePage;
  let campaign;
  let hiveInfo;
  let accessToken;
  let homepage;
  let checkout: SFCheckout;
  let productPage: SFProduct;
  let orderPage: OrdersPage;
  let orderId: number;
  let customerInfo;
  let campaignName;
  let orderInfo;
  let cardInfo;
  let layerList;
  let hivePage;

  test.beforeEach(async ({ dashboard, page, conf, token }) => {
    product = new ProductPage(dashboard, conf.caseConf.domain);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    campaign = new Campaign(dashboard, conf.suiteConf.domain);
    hiveInfo = conf.suiteConf.hive_info;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    homepage = new SFHome(page, conf.suiteConf.domain);
    customerInfo = conf.suiteConf.customer_info;
    campaignName = conf.caseConf.campaign_name;
    orderInfo = conf.caseConf.order_info;
    cardInfo = conf.suiteConf.card_info;
    layerList = conf.caseConf.layers;
    hivePage = new HivePBase(page, conf.suiteConf.hive_domain);
  });

  test(`[Order] _Create thành công order chứa 1 line item campaign
  with custom mockup ( không co markup) @TC_PB_PRB_MC_67`, async ({ conf }) => {
    await test.step(`Add to cart campaign without mockup sau đó đi tới màn hình checkout`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(campaignName);
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();
    });

    await test.step("Input các thông tin checkout", async () => {
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`Mở màn hình order detail sau đó upload artwork cho base product từ màn hình order
    detail và verify order detail`, async () => {
      orderPage = await checkout.openOrderPBaseByAPI(orderId, accessToken);
      await orderPage.clickUploadArtworkInOrderDetail(1);
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await orderPage.waitLabelNoExistAndCheckMessage({
        message: orderInfo.message,
      });
    });

    await test.step(`Approve order và verify order detail trong Hive`, async () => {
      await hivePage.loginToHivePrintBase(hiveInfo.shopbase, hiveInfo.hive_password);
      await hivePage.goToOrderDetail(orderId);
      expect(await hivePage.getOrderStatus()).toEqual(conf.caseConf.label);
      await hivePage.approveOrder();
      expect(await hivePage.getNumberOfMockup()).toEqual(conf.caseConf.number_mockup);
      expect(await hivePage.getArtworkStatus()).toEqual("artwork_rendered");
    });
  });

  test(`[Order]_Create thành công order chứa nhiều line item campaign
  with custom mockup ( không co markup) @TC_PB_PRB_MC_68`, async ({ conf }) => {
    const style = conf.caseConf.style;
    await test.step(`Add to cart line item 1 sau đó đi đến trang checkout`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(campaignName);
      await productPage.addProductToCart();
    });

    await test.step(`Add to cart thêm 1 line item sau đó đi đến trang checkout`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(campaignName);
      await campaign.selectStyle(style);
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();
    });

    await test.step(`Input các thông tin checkout vào form checkout`, async () => {
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`Mở màn hình order detail sau đó upload artwork cho base Unisex T-shirt
    từ order detail và verify order detail`, async () => {
      orderPage = await checkout.openOrderPBaseByAPI(orderId, accessToken);
      await orderPage.clickUploadArtworkInOrderDetail(1);
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      const actualLabel = await orderPage.getLabelAwaitingArtwork();
      expect(actualLabel).toEqual(orderInfo.label);
      await product.checkMsgAfterCreated({
        errMsg: orderInfo.message,
      });
    });

    await test.step(`Upload artwork cho base product Ladies T-shirt từ order detail
    và verify order detail`, async () => {
      await orderPage.clickUploadArtworkInOrderDetail(2);
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await orderPage.waitLabelNoExistAndCheckMessage({
        message: orderInfo.message,
      });
    });

    await test.step(`Approve order và veriy order detail trong Hive`, async () => {
      await hivePage.loginToHivePrintBase(hiveInfo.shopbase, hiveInfo.hive_password);
      await hivePage.goToOrderDetail(orderId);
      expect(await hivePage.getOrderStatus()).toEqual(conf.caseConf.label);
      await hivePage.approveOrder();
      expect(await hivePage.getNumberOfMockup()).toEqual(conf.caseConf.number_mockup);
      const lineItem = 2;
      for (let i = 1; i <= lineItem; i++) {
        expect(await hivePage.getArtworkStatus()).toEqual("artwork_rendered");
      }
    });
  });

  test(`[Order]_Create thành công order chứa cả line item của printbase và line item campaign with custom mockup
  ( không co markup) @TC_PB_PRB_MC_69`, async ({ conf }) => {
    await test.step(`Add to cart 1 line item của campaign without mockup`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(campaignName.campaign_name1);
      await productPage.addProductToCart();
    });

    await test.step(`Add to cart 1 line item của campaign normal`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(campaignName.campaign_name2);
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();
    });

    await test.step(`Input thông tin checkout`, async () => {
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`Mở màn hình order detail và upload artwork cho campaign without artwork
    sau đó verify order detail`, async () => {
      orderPage = await checkout.openOrderPBaseByAPI(orderId, accessToken);
      const actualLabel = await orderPage.getLabelAwaitingArtwork();
      expect(actualLabel).toEqual(orderInfo.label);
      await orderPage.clickUploadArtworkInOrderDetail(1);
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await orderPage.waitLabelNoExistAndCheckMessage({
        message: orderInfo.message,
      });
    });

    await test.step(`Approve order và verify order detail trong Hive`, async () => {
      await hivePage.loginToHivePrintBase(hiveInfo.shopbase, hiveInfo.hive_password);
      await hivePage.goToOrderDetail(orderId);
      expect(await hivePage.getOrderStatus()).toEqual(conf.caseConf.label);
      await hivePage.approveOrder();
      expect(await hivePage.getArtworkStatus()).toEqual("artwork_rendered");
    });
  });

  test(`[Order]_Create thành công order chỉ có line item của printbase @TC_PB_PRB_MC_70`, async ({ page }) => {
    let totalOrderSF: string;
    await test.step(`Checkout thành công với campaign normal`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(campaignName);
      await productPage.addProductToCart();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
    });

    await test.step(`Mở màn hình order detail và verify order detail`, async () => {
      orderId = await checkout.getOrderIdBySDK();
      orderPage = await checkout.openOrderPBaseByAPI(orderId, accessToken);
      await orderPage.waitLabelNoExistAndCheckMessage({
        message: null,
      });
      const orderStatus = await orderPage.getOrderStatus();
      if (!orderStatus.includes("Paid")) {
        await page.reload();
        await page.waitForLoadState("load");
      }
      expect(orderStatus).toEqual("Paid");
      expect(await orderPage.getTotalOrder()).toEqual(totalOrderSF);
      expect(await orderPage.getPaidByCustomer()).toEqual(totalOrderSF);
    });
  });
});
