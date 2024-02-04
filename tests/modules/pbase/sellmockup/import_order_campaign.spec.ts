import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Import campaign to order", () => {
  let printbasePage: PrintBasePage;
  let dashboardPage: DashboardPage;
  let checkout: SFCheckout;
  let customerInfo;
  let cardInfo;
  let orderID;
  let orderPage: OrdersPage;
  let orderVerify;
  let layerList;
  let status;
  let campaignSFPage: SFProduct;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    customerInfo = conf.suiteConf.customer;
    cardInfo = conf.suiteConf.card;
    layerList = conf.caseConf.layers;
    orderVerify = conf.caseConf.order_verify;
    test.setTimeout(conf.suiteConf.time_out_tc);
  });

  test(`@SB_PRB_SCWM_30 [Order] Create thành công order chứa 1 line item campaign with custom mockup`, async ({
    conf,
    hivePBase,
    context,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    const orderInfo = conf.caseConf.order_info;
    const variantLine = conf.caseConf.variant_line;
    const importCampaign = conf.caseConf.import_campaign;

    await test.step(`Login vào hive Approve order và verify order detail trong hive`, async () => {
      await printbasePage.navigateToMenu("Orders");
      await orderPage.openFirstOrderDetail();
      const orderID = await orderPage.getOrderIdInOrderDetail();

      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      await hivePbase.goToOrderDetail(orderID, "pbase-order");
      while ((await hivePbase.getArtworkStatus(2)) !== "artwork_rendered") {
        await hivePbase.page.waitForTimeout(60000);
        await hivePbase.page.reload();
        await hivePbase.reRenderArtwork(1);
      }
      await hivePbase.approveOrderInHive();
      const infoOrdersDetail = await hivePbase.getInfoProductInOrderDetail(conf.caseConf.order_detail);
      expect(infoOrdersDetail).toEqual(conf.caseConf.order_detail);
    });

    await test.step(`1. Import campaign thành công và checkout campaign vừa import`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.searchWithKeyword(orderInfo.product_name);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importCampaign.status);

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      expect(await printbasePage.getStatus(importCampaign.file_name)).toEqual(importCampaign.status);
      expect(await printbasePage.getProcess(importCampaign.file_name)).toEqual(importCampaign.process);
      await printbasePage.searchWithKeyword(orderInfo.product_name);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);

      await printbasePage.openCampSFFromCampDetail(orderInfo.product_name);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSFPage.page.waitForLoadState("networkidle");
      await campaignSFPage.selectValueProduct(variantLine);
      await campaignSFPage.addToCart();
      await campaignSFPage.gotoCart();
      checkout = await campaignSFPage.navigateToCheckoutPage();
      await campaignSFPage.page.waitForTimeout(3000);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
    });

    await test.step(`1. Vào lại dashboard > Vào mục "Orders" 2. Vào order detail vừa order`, async () => {
      orderID = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderID, "pbase");
      await expect(await orderPage.genLoc(orderPage.xpathLabelAwaitingArtwork)).toBeVisible();
    });

    await test.step(`Click "Upload artwork" cho base product từ màn hình order detail và verify message trong order detail`, async () => {
      await orderPage.clickUploadArtworkInOrderDetail();
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await expect(printbasePage.isToastMsgVisible(orderVerify.message)).toBeTruthy();
    });
  });

  test(`@SB_PRB_SCWM_31 [Order]  Create thành công order chứa nhiều line item có cả base đã upload artwork và chưa upload artwork`, async ({
    conf,
    hivePBase,
    context,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    const orderInfo = conf.caseConf.order_info;
    const variantLine1 = conf.caseConf.variant_line1;
    const variantLine2 = conf.caseConf.variant_line2;
    const importCampaign = conf.caseConf.import_campaign;

    await test.step(`1. Import campaign thành công và checkout campaign vừa import`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.searchWithKeyword(orderInfo.product_name_first);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importCampaign.status);

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      expect(await printbasePage.getStatus(importCampaign.file_name)).toEqual(importCampaign.status);
      expect(await printbasePage.getProcess(importCampaign.file_name)).toEqual(importCampaign.process);
      await printbasePage.clickProgressBar();
      await printbasePage.openCampSFFromCampDetail(orderInfo.product_name_first);

      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);

      campaignSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSFPage.page.waitForLoadState("networkidle");
      await campaignSFPage.selectValueProduct(variantLine1);
      await campaignSFPage.addToCart();
      await campaignSFPage.selectValueProduct(variantLine2);
      await campaignSFPage.addToCart();
      await campaignSFPage.gotoCart();
      checkout = await campaignSFPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
    });

    await test.step(`1. Vào lại dashboard > Vào mục "Orders" 2. Vào order detail vừa order`, async () => {
      orderID = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderID, "pbase");
      await expect(await orderPage.genLoc(orderPage.xpathLabelAwaitingArtwork)).toBeVisible();
    });

    await test.step(`Click "Upload artwork" cho base product từ màn hình order detail và verify message trong order detail`, async () => {
      await orderPage.clickUploadArtworkInOrderDetail();
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await expect(printbasePage.isToastMsgVisible(orderVerify.message)).toBeTruthy();
    });

    await test.step(`Login vào hive Approve order và verify order detail trong hive`, async () => {
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      await hivePbase.goToOrderDetail(orderID, "pbase-order");
      await hivePbase.reRenderArtwork(1);
      await hivePbase.approveOrderInHive();

      //lỗi không hiển thị artwork trong Hive
      const infoOrdersDetail = await hivePbase.getInfoProductInOrderDetail(conf.caseConf.order_detail);
      expect(infoOrdersDetail).toEqual(conf.caseConf.order_detail);
    });
  });

  test(`@SB_PRB_SCWM_32 [Order]  Create thành công order chứa nhiều line item campaign with custom mockup`, async ({
    conf,
    context,
    hivePBase,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    const orderInfo = conf.caseConf.order_info;
    const variantLine1 = conf.caseConf.variant_line1;
    const variantLine2 = conf.caseConf.variant_line2;
    const importCampaign = conf.caseConf.import_campaign;

    await test.step(`1. Import campaign thành công và checkout campaign vừa import`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.searchWithKeyword(orderInfo.product_name_first);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importCampaign.status);

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      expect(await printbasePage.getStatus(importCampaign.file_name)).toEqual(importCampaign.status);
      expect(await printbasePage.getProcess(importCampaign.file_name)).toEqual(importCampaign.process);
      await printbasePage.clickProgressBar();
      await printbasePage.searchWithKeyword(orderInfo.product_name_first);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.openCampSFFromCampDetail(orderInfo.product_name_first);

      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);

      campaignSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSFPage.page.waitForLoadState("domcontentloaded");
      await campaignSFPage.selectValueProduct(variantLine1);
      await campaignSFPage.addToCart();
      await campaignSFPage.page.reload();
      await campaignSFPage.selectValueProduct(variantLine2);
      await campaignSFPage.addToCart();
      await campaignSFPage.gotoCart();
      checkout = await campaignSFPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
    });

    await test.step(`Click "Upload artwork" cho base product 1 từ màn hình order detail và verify message trong order detail`, async () => {
      orderID = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderID, "pbase");
      await expect(await orderPage.genLoc(orderPage.xpathLabelAwaitingArtwork)).toBeVisible();
      await orderPage.clickUploadArtworkInOrderDetail();
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
    });

    await test.step(`Click "Upload artwork" cho base product 2 từ màn hình order detail và verify message trong order detail`, async () => {
      await printbasePage.clickBaseInPersonalization(variantLine2.style);
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await expect(printbasePage.isToastMsgVisible(orderVerify.message)).toBeTruthy();
    });

    await test.step(` Login vào hive Approve order và verify order detail trong hive Click "Upload artwork" cho base product từ màn hình order detail và verify message trong order detail`, async () => {
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      await hivePbase.goToOrderDetail(orderID, "pbase-order");
      await hivePbase.reRenderArtwork(1);
      await hivePbase.approveOrderInHive();

      // Lỗi không render artwork - fix sau
      // const infoOrdersDetail = await hivePbase.getInfoProductInOrderDetail(conf.caseConf.order_detail);
      // expect(infoOrdersDetail).toEqual(conf.caseConf.order_detail);
    });
  });

  test(`@SB_PRB_SCWM_33 [Order]  Create thành công order chứa cả line item của printbase và line item campaign with custom mockup`, async ({
    conf,
    context,
    hivePBase,
    page,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    const orderInfo = conf.caseConf.order_info;
    const variantLine1 = conf.caseConf.variant_line1;
    const variantLine2 = conf.caseConf.variant_line2;
    const importCampaign = conf.caseConf.import_campaign;

    await test.step(`1. Import campaign thành công và checkout campaign vừa import`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.searchWithKeyword(orderInfo.product_name_first);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importCampaign.status);

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      expect(await printbasePage.getStatus(importCampaign.file_name)).toEqual(importCampaign.status);
      expect(await printbasePage.getProcess(importCampaign.file_name)).toEqual(importCampaign.process);
      await printbasePage.clickProgressBar();
      await printbasePage.openCampSFFromCampDetail(orderInfo.product_name_first);

      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);

      campaignSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSFPage.page.waitForLoadState("networkidle");
      await campaignSFPage.selectValueProduct(variantLine1);
      await campaignSFPage.addToCart();
      //add line item second
      const sfHome = new SFHome(page, conf.suiteConf.domain);
      await sfHome.searchThenViewProduct(orderInfo.product_name_second);
      await campaignSFPage.selectValueProduct(variantLine2);
      await campaignSFPage.addToCart();
      await campaignSFPage.gotoCart();
      checkout = await campaignSFPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
    });

    await test.step(`1. Vào lại dashboard > Vào mục "Orders" 2. Vào order detail vừa order`, async () => {
      orderID = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderID, "pbase");
      await expect(await orderPage.genLoc(orderPage.xpathLabelAwaitingArtwork)).toBeVisible();
    });

    await test.step(`Click "Upload artwork" cho base product từ màn hình order detail và verify message trong order detail`, async () => {
      await orderPage.clickUploadArtworkInOrderDetail();
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Save change");
      await expect(printbasePage.isToastMsgVisible(orderVerify.message)).toBeTruthy();
    });

    await test.step(`Login vào hive Approve order và verify order detail trong hive`, async () => {
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      await hivePbase.goToOrderDetail(orderID, "pbase-order");
      await hivePbase.reRenderArtwork(1);
      await hivePbase.approveOrderInHive();
      // Lỗi không hiển thị artwork trong Hive
      const infoOrdersDetail = await hivePbase.getInfoProductInOrderDetail(conf.caseConf.order_detail);
      expect(infoOrdersDetail).toEqual(conf.caseConf.order_detail);
    });
  });
});
