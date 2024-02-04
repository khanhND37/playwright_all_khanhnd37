import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect, test } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Dashboard - Order campaign detail", () => {
  test.describe.configure({ mode: "serial" });
  let printbasePage: PrintBasePage;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let orderId: number;
  let productPrice;
  let customerInfo;
  let campaignName;
  let cardInfo;
  let layerList;
  let hivePage: HivePBase;
  let profitMessage;
  let ordername;
  let totalPrice;
  let mailBoxPage: MailBox;
  let status;
  let productPage: SFProduct;
  let SFPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    customerInfo = conf.suiteConf.customer;
    cardInfo = conf.suiteConf.card;
    profitMessage = conf.suiteConf.message;
    test.setTimeout(conf.suiteConf.time_out_tc);
  });

  test(`@SB_PRB_SCWM_36 [Dashboard-Order Detail]-Check hiển thị profit của order sau khi đủ artwork + aproved`, async ({
    conf,

    hivePBase,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out_tc);
    campaignName = conf.caseConf.campaign_name;
    layerList = conf.caseConf.layers;

    await test.step(`Login Hive Pbase> Chọn Customer Support> Chọn Pbase Order> Click order name > Verify status artwork `, async () => {
      await printbasePage.navigateToMenu("Orders");
      await orderPage.waitForElementVisibleThenInvisible(orderPage.xpathTableLoad);
      await orderPage.openFirstOrderDetail();
      orderId = await orderPage.getOrderIdInOrderDetail();

      hivePage = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      await hivePage.goToOrderDetail(orderId);
      while ((await hivePage.getArtworkStatus(2)) !== "artwork_rendered") {
        await hivePage.reRenderArtwork(1);
        await hivePage.page.waitForTimeout(60000);
        await hivePage.page.reload();
      }
      await hivePage.approveOrder();
      expect(await hivePage.getArtworkStatus(2)).toEqual("artwork_rendered");
    });

    await test.step(`Back lại list order > Click order name > Verify profit sau khi approve order`, async () => {
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      expect(await orderPage.getProfit()).toEqual(conf.suiteConf.profit);
    });
  });

  test(`@SB_PRB_SCWM_34 [Dashboard-Order Detail]-Check hiển thị profit của order chưa đủ artwork + chưa aproved`, async ({
    dashboard,
    conf,

    context,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out_tc);
    campaignName = conf.caseConf.campaign_name;
    layerList = conf.caseConf.layers;
    const variantProduct = conf.caseConf.variant_product;
    const importInfo = conf.caseConf.import_info;
    const importCampaign = conf.caseConf.import_campaign;

    await test.step(`Pred-condition: Import campaign mới`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.searchWithKeyword(importCampaign.campaign_name);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(120000);
        await printbasePage.page.reload();
        printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importInfo.status);

      expect(await printbasePage.getStatus(importCampaign.file_name)).toEqual(importInfo.status);
      expect(await printbasePage.getProcess(importCampaign.file_name)).toEqual(importInfo.process);
      await printbasePage.clickProgressBar();
    });

    await test.step(`Create thành công order `, async () => {
      await printbasePage.searchWithKeyword(campaignName);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await printbasePage.clickViewProductOnOnlineStore(),
      ]);
      productPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await productPage.waitResponseWithUrl("/assets/landing.css", 50000);
      await productPage.selectValueProduct(variantProduct);
      await productPage.addProductToCart();
      await productPage.gotoCart();
      checkout = await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
      productPrice = await checkout.getProductPriceOnOrder();
    });

    await test.step(`Login admin shop > tại Menu, chọn Orders > Click order name > Verify thông tin order`, async () => {
      orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      await orderPage.page.waitForLoadState("networkidle");
      expect(await orderPage.isTextVisible("Awaiting artwork")).toBeTruthy();
    });

    await test.step(`Verify Profit của order`, async () => {
      expect(await orderPage.getProfitMessage()).toEqual(profitMessage);
    });
  });

  test(`@SB_PRB_SCWM_35 [Dashboard-Order Detail]-Check hiển thị profit của order đủ artwork + chưa aproved`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    if (process.env.ENV == "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out_tc);
    campaignName = conf.caseConf.campaign_name;
    layerList = conf.caseConf.layers;
    const picture = conf.caseConf.picture;

    await test.step(`Verify Profit của order`, async () => {
      await printbasePage.navigateToMenu("Orders");
      await orderPage.waitForElementVisibleThenInvisible(orderPage.xpathTableLoad);
      await orderPage.openFirstOrderDetail();
      expect(await orderPage.getProfitMessage()).toEqual(profitMessage);
    });

    await test.step(`Click button [Upload/Replace Artwork] `, async () => {
      await orderPage.clickElementWithLabel("div", "Upload/Replace Artwork");
      await orderPage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      for (const layer of layerList) {
        await printbasePage.addNewLayer(layer);
      }
      await (await orderPage.page.waitForSelector(printbasePage.xpathLeftMenuEditor)).waitForElementState("stable");
      await dashboard.locator(printbasePage.xpathBtnPreview).click();
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Click button [Save]`, async () => {
      await orderPage.clickOnBtnWithLabel("Save change");
      await orderPage.waitUntilElementInvisible(orderPage.xpathToastMessage);
      await orderPage.page.waitForSelector(".page-order-show");
    });

    await test.step(`Verify label Awaiting Artwork biến mất `, async () => {
      let retries = 0;
      do {
        retries++;
        await orderPage.page.waitForTimeout(30 * 1000);
        await orderPage.page.reload();
        await orderPage.waitForElementVisibleThenInvisible(orderPage.xpathTableLoad);
        await orderPage.page.waitForSelector(await orderPage.getXpathWithLabel("Awaiting artwork"), {
          state: "hidden",
        });
      } while (retries < 10); // timeout = 5 mins
    });

    await test.step(`Verify Profit của order`, async () => {
      expect(await orderPage.getProfitMessage()).toEqual(profitMessage);
    });
  });

  test(`@SB_PRB_SCWM_40 [Order- Mail confirm]-Verify hiển thị mail confirm sau khi tạo thành công order`, async ({
    conf,
    context,
  }) => {
    if (process.env.ENV == "prodtest" || process.env.ENV == "dev") {
      return;
    }
    const variantProduct = conf.caseConf.variant_product;
    campaignName = conf.caseConf.campaign_name;
    const importCampaign = conf.caseConf.import_campaign;

    await test.step(`Open shop ngoài SF > Input [product name] vào thanh search> Nhấn phím Enter > Click product name vừa search > Select variant > click button [Add to cart] > Check out thành công`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(importCampaign.campaign_name);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);

      [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.clickViewProductOnOnlineStore()]);

      const productPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await productPage.waitResponseWithUrl("/assets/landing.css", 50000);

      await productPage.selectValueProduct(variantProduct);
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();

      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
      productPrice = await checkout.getProductPriceOnOrder();
      ordername = await checkout.getOrderName();
      totalPrice = await checkout.getTotalOnOrderSummary();
    });

    await test.step(`Login gmail > Check gửi mail > Open mail confirm order > verify nội dung mail confirm`, async () => {
      mailBoxPage = await checkout.openMailBox(customerInfo.email);
      await mailBoxPage.openOrderConfirmationNotification(ordername);
      await expect(mailBoxPage.genLocProductLine(campaignName, "1")).toBeVisible({ timeout: 5000 });
      expect(await mailBoxPage.getAmountOnOrderConfrimationMail("Total")).toEqual(totalPrice);
      expect(await mailBoxPage.getAmountOnOrderConfrimationMail("Subtotal")).toEqual(productPrice);
    });

    await test.step(`Click button "Track your order" ở mail detail`, async () => {
      await mailBoxPage.clickTrackOrder();
      const orderDetailPage = new SFCheckout(SFPage, conf.suiteConf.domain);
      await expect(orderDetailPage.genLoc(orderDetailPage.xpathThankYou)).toBeVisible();
    });
  });
});
