import { expect, test } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe("Hive- Order list", async () => {
  let printbasePage: PrintBasePage;
  let hiveInfo;
  let homepage;
  let productPage: SFProduct;
  let orderId: number;
  let customerInfo;
  let cardInfo;
  let hivePage: HivePBase;
  let importCampaign;
  let orderName;
  let artworkStatus;
  let orderPage: OrdersPage;
  let layerList;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    hiveInfo = conf.suiteConf.hive_info;
    customerInfo = conf.suiteConf.customer_info;
    cardInfo = conf.suiteConf.card_info;
    importCampaign = conf.suiteConf.import_campaign;

    for (let i = 0; i < importCampaign.length; i++) {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(importCampaign[i].campaign_name);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.importProduct(importCampaign[i].file_path, printbasePage.xpathImportFile);
      await printbasePage.page.reload();
      await printbasePage.waitDisplayMockupDetailCampaign(importCampaign[i].campaign_name);
    }
  });

  test(`@SB_PRB_SCWM_42 [Hive- Order list]-Verify fillter order list trong hive`, async ({ dashboard, page, conf }) => {
    for (let i = 0; i < conf.caseConf.case_driven.length; i++) {
      const caseDriven = conf.caseConf.case_driven[i];
      const variantProduct = conf.caseConf.variant_product;
      const status = caseDriven.status;
      layerList = caseDriven.layers;

      await test.step("Preconditon: tạo order ", async () => {
        homepage = new SFHome(page, conf.suiteConf.domain);
        await homepage.gotoHomePage();
        productPage = await homepage.searchThenViewProduct(importCampaign[i].campaign_name);
        await productPage.selectValueProduct(variantProduct);
        const checkout = new SFCheckout(page, conf.suiteConf.domain);
        await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
      });

      if (caseDriven.upload_artwork) {
        await test.step("Preconditon: Upload artwork cho order: Login admin shop > tại Menu, chọn Orders > Click order name > Click button [Upload/Replace Artwork]", async () => {
          orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
          await orderPage.goToOrderByOrderId(orderId, "pbase");
          await orderPage.page.waitForLoadState("networkidle");
          await orderPage.clickElementWithLabel("div", "Upload/Replace Artwork");
          await orderPage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
          printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);

          for (const layer of layerList) {
            await printbasePage.addNewLayer(layer);
          }
          await orderPage.clickOnBtnWithLabel("Save change");
          await expect(orderPage.genLoc(".page-order-show")).toBeVisible();
        });
      }

      await test.step("Login Hive Pbase> Chọn Customer Support> Chọn Pbase Order", async () => {
        hivePage = new HivePBase(page, hiveInfo.hive_domain);

        if (caseDriven.login_hive_first_time) {
          await hivePage.loginToHivePrintBase(hiveInfo.hive_username, hiveInfo.hive_password);
        }
        await hivePage.goto("/admin/pbase-order/list");
      });

      await test.step("Chọn Awaiting Artwork", async () => {
        await hivePage.filterDataByName([
          {
            value: orderName,
            name: "Order Name",
          },
        ]);
        await hivePage.page.waitForLoadState("networkidle");
        artworkStatus = await hivePage.getArtworkStatusInOrderList(orderName);
        await expect(artworkStatus).toEqual(status);
      });
    }
  });

  test(`@SB_PRB_SCWM_43 [Hive- Order list]-Verify hiển thị Status của order detail trong Hive`, async ({
    page,
    conf,
    dashboard,
  }) => {
    for (let i = 0; i < conf.caseConf.case_driven.length; i++) {
      const caseDriven = conf.caseConf.case_driven[i];
      const variantProduct = conf.caseConf.variant_product;
      const status = caseDriven.status;
      layerList = caseDriven.layers;
      await test.step(`Preconditon: tạo order `, async () => {
        homepage = new SFHome(page, conf.suiteConf.domain);
        await homepage.gotoHomePage();
        productPage = await homepage.searchThenViewProduct(importCampaign[i].campaign_name);
        await productPage.selectValueProduct(variantProduct);
        const checkout = new SFCheckout(page, conf.suiteConf.domain);
        await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
        orderId = await checkout.getOrderIdBySDK();
      });

      if (caseDriven.upload_artwork) {
        await test.step("Preconditon: Upload artwork cho order: Login admin shop > tại Menu, chọn Orders > Click order name > Click button [Upload/Replace Artwork]", async () => {
          orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
          await orderPage.goToOrderByOrderId(orderId, "pbase");
          await orderPage.page.waitForLoadState("networkidle");

          await orderPage.clickElementWithLabel("div", "Upload/Replace Artwork");
          await orderPage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
          printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
          for (const layer of layerList) {
            await printbasePage.addNewLayer(layer);
          }
          await orderPage.clickOnBtnWithLabel("Save change");
          await expect(orderPage.genLoc(".page-order-show")).toBeVisible();
          await orderPage.page.reload();
        });
      }

      await test.step("Login Hive Pbase> Chọn Customer Support> Chọn Pbase Order > Click order detail", async () => {
        hivePage = new HivePBase(page, hiveInfo.hive_domain);
        if (caseDriven.login_hive_first_time) {
          await hivePage.loginToHivePrintBase(hiveInfo.hive_username, hiveInfo.hive_password);
        }
        await hivePage.goToOrderDetail(orderId);
      });

      await test.step(`Vào order detail -1012 có status [Uploaded artwork]`, async () => {
        // wait for artwork rendered
        await hivePage.page.waitForTimeout(5 * 1000);
        await page.reload();
        expect(await hivePage.getArtworkStatus(2)).toEqual(status);
      });
    }
  });

  test(`@SB_PRB_SCWM_44 [Hive- Order Detail]-Check hiển thị mockup và artwork trong hive`, async ({
    dashboard,
    page,
    conf,
  }) => {
    const variantProduct = conf.caseConf.variant_product;
    const layerList = conf.caseConf.layers;

    await test.step("Checkout thành công order với 2 line item ", async () => {
      homepage = new SFHome(page, conf.suiteConf.domain);
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(importCampaign[1].campaign_name);
      await productPage.selectValueProduct(variantProduct[0]);
      await productPage.addProductToCart();
      await productPage.selectValueProduct(variantProduct[1]);
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
      orderId = await checkout.getOrderIdBySDK();

      orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      await orderPage.page.waitForLoadState("networkidle");

      for (let i = 1; i <= layerList.length; i++) {
        await orderPage.clickElementWithLabel("div", "Upload/Replace Artwork", i + 1);
        await orderPage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
        printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
        for (const layer of layerList) {
          await printbasePage.addNewLayer(layer);
        }
        await orderPage.clickOnBtnWithLabel("Save change");
        await expect(orderPage.genLoc(".page-order-show")).toBeVisible();
      }
    });

    await test.step("Login Hive Pbase> Chọn Customer Support> Chọn Pbase Order> Click order name > Approved thành công order ", async () => {
      hivePage = new HivePBase(page, hiveInfo.hive_domain);
      await hivePage.loginToHivePrintBase(hiveInfo.hive_username, hiveInfo.hive_password);
      await hivePage.goToOrderDetail(orderId);
      await hivePage.approveOrder();
      await expect(hivePage.isTextVisible("success")).toBeTruthy();
    });

    await test.step("Chờ order rendered artwork > Verify hiển thị mockup và artwork của line item ", async () => {
      expect(await hivePage.getArtworkStatus(2)).toEqual("artwork_rendered");
    });

    await test.step("Chờ order rendered artwork > Verify hiển thị mockup và artwork của line item ", async () => {
      expect(await hivePage.getArtworkStatus(4)).toEqual("artwork_rendered");
    });
  });
});
