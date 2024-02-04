import { test, expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { PrintHubPage } from "@pages/apps/printhub";
import { loadData } from "@core/conf/conf";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Manage oder", () => {
  let printbase: PrintBasePage;
  let homepage;
  let customerInfo;
  let checkout: SFCheckout;
  let productPage: SFProduct;
  let orderID;
  let cardInfo;
  let printHubPage: PrintHubPage;
  let product: ProductPage;
  let snapshotOptions;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
    homepage = new SFHome(dashboard, conf.suiteConf.domain);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    customerInfo = conf.suiteConf.customer;
    cardInfo = conf.suiteConf.card;
    snapshotOptions = conf.suiteConf.snapshot_options;
  });

  test("Verify search order thành công @SB_PRH_ODR_21", async ({ conf }) => {
    await printHubPage.goto(printHubPage.urlToManageOrderPhub);
    await printHubPage.switchTabInAllOrders(conf.caseConf.tab_name);
    const configDataOrderExist = conf.caseConf.DATA_DRIVEN_ORDER_EXIST.data;
    for (let i = 0; i < configDataOrderExist.length; i++) {
      const caseData = configDataOrderExist[i];
      await test.step(`${caseData.step}`, async () => {
        await printHubPage.searchOrder(caseData.value_exist);
        expect(await printHubPage.getNumberOrder()).toEqual(caseData.number_order);
      });
    }

    const configDataOrderNotExist = conf.caseConf.DATA_DRIVEN_ORDER_NOT_EXIST.data;
    for (let i = 0; i < configDataOrderNotExist.length; i++) {
      const caseData = configDataOrderNotExist[i];
      await test.step(`${caseData.step}`, async () => {
        await printHubPage.searchOrder(caseData.value_not_exist);
        expect(await printHubPage.getMessageOrderEmpty()).toContain(caseData.message);
      });
    }
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_VERIFY_SYNC_ORDER");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
        const orderInfo = caseData.order_info;
        const picture = caseData.picture;
        const variantLine1 = caseData.variant_line1;
        const variantLine2 = caseData.variant_line2;
        await test.step("Search and select product on SF > Check out thành công", async () => {
          await homepage.gotoHomePage();
          productPage = await homepage.searchThenViewProduct(orderInfo.product_name_first);
          await productPage.selectValueProduct(variantLine1);
          await productPage.addToCart();
          //add line item second
          await homepage.gotoHomePage();
          productPage = await homepage.searchThenViewProduct(orderInfo.product_name_second);
          await productPage.selectValueProduct(variantLine2);
          await productPage.addToCart();
          checkout = await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(customerInfo);
          await checkout.inputCardInfoAndCompleteOrder(
            cardInfo.card_number,
            cardInfo.card_holder_name,
            cardInfo.expire_date,
            cardInfo.cvv,
          );
          orderID = await checkout.getOrderIDSF();
        });

        await test.step(`Login shop Print Hub > Chọn PrintHub > Open All orders > Chọn ${orderInfo.tab_name} > Search order name > Verify sync order`, async () => {
          await printHubPage.goto(printHubPage.urlToManageOrderPhub);
          await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
          await printHubPage.searchOrder(orderID);
          await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
          expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
        });

        await test.step("Click order name > Verify thông tin order", async () => {
          await dashboard.click(printHubPage.getXpathOrderName(orderID));
          expect(await printHubPage.countNumberLineItemOnOrder()).toEqual(orderInfo.number_line_item);
          await snapshotFixture.verify({
            page: dashboard,
            selector: printHubPage.xpathPriceInfoOnOrder,
            snapshotName: `${picture}.png`,
            snapshotOptions,
          });
        });

        if (caseData.case_id == "SB_PRH_ODR_25") {
          await test.step(`Click ${orderInfo.tab_name_second} >Click order name > Verify thông tin order`, async () => {
            await printHubPage.switchTabInAllOrders(orderInfo.tab_name_second);
            await dashboard.click(printHubPage.getXpathOrderName(orderID));
            expect(await printHubPage.countNumberLineItemOnOrder()).toEqual(orderInfo.number_line_item);
            await snapshotFixture.verify({
              page: dashboard,
              selector: printHubPage.xpathPriceInfoOnOrder,
              snapshotName: `${caseData.picture_partially}`,
              snapshotOptions,
            });
          });
        }
      });
    }
  }
  const configDataAction = loadData(__dirname, "DATA_DRIVEN_VERIFY_ACTION_ORDER");
  for (let i = 0; i < configDataAction.caseConf.data.length; i++) {
    const caseData = configDataAction.caseConf.data[i];

    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
        const orderInfo = caseData.order_info;
        const variantLine = caseData.variant_line;
        await test.step("Search and select product on SF > Check out thành công", async () => {
          productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
          await productPage.selectValueProduct(variantLine);
          await productPage.addToCart();
          checkout = await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(customerInfo);
          await checkout.inputCardInfoAndCompleteOrder(
            cardInfo.card_number,
            cardInfo.card_holder_name,
            cardInfo.expire_date,
            cardInfo.cvv,
          );
          orderID = await checkout.getOrderIDSF();
        });

        await test.step("Login shop Print Hub > chọn Apps > Chọn Print Hub> Chọn tab [Awaiting payment] > Search order name> Verify order sync", async () => {
          await printHubPage.goto(printHubPage.urlToManageOrderPhub);
          await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
          await printHubPage.searchOrder(orderID);
          await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
          await expect(dashboard.locator(printHubPage.getXpathStatusOfOrder(orderInfo.order_status))).toBeVisible();
        });

        await test.step(`Chọn [Action]> Click ${orderInfo.action_name} > Click button Confirm > Verify thông tin order`, async () => {
          await dashboard.click(printHubPage.getXpathOrderName(orderID));
          await printHubPage.selectActionOrder(orderInfo.action_name, orderInfo.button_confirm);
          await printHubPage.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(caseData.message));
          await printHubPage.switchTabInAllOrders(orderInfo.tab_name_second);
          await dashboard.click(printHubPage.getXpathOrderName(orderID));
          expect(await printHubPage.countNumberLineItemOnOrder()).toEqual(orderInfo.number_line_item);
          await snapshotFixture.verify({
            page: dashboard,
            selector: printHubPage.xpathPriceInfoOnOrder,
            snapshotName: `${caseData.picture}`,
            snapshotOptions,
          });
        });

        if (caseData.case_id == "SB_PRH_ODR_28") {
          await test.step("Chọn [Action]> Click Unhold > Click button Confirm > Chọn tab Awaiting payment >Verify thông tin order", async () => {
            await printHubPage.selectActionOrder(orderInfo.action_unhold, orderInfo.action_unhold);
            await printHubPage.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(caseData.message));
            await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
            await dashboard.click(printHubPage.getXpathOrderName(orderID));
            expect(await printHubPage.countNumberLineItemOnOrder()).toEqual(orderInfo.number_line_item);
            await snapshotFixture.verify({
              page: dashboard,
              selector: printHubPage.xpathPriceInfoOnOrder,
              snapshotName: `${caseData.picture_unhold}`,
              snapshotOptions,
            });
          });
        }
      });
    }
  }

  test("Verify order sau khi charge thành công sẽ sync sang tab [Awaiting shipment] @SB_PRH_ODR_29", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const picture = conf.caseConf.picture;
    const orderInfo = conf.caseConf.order_info;
    await test.step("Search and select product on SF > Check out thành công", async () => {
      const variantLine = conf.caseConf.variant_line;
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
      await productPage.selectValueProduct(variantLine);
      await productPage.addToCart();
      checkout = await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderID = await checkout.getOrderIDSF();
    });

    await test.step("Login shop Print Hub > Chọn PrintHub > Open All orders > Chọn ${orderInfo.tab_name} > Search order name > Verify sync order", async () => {
      await printHubPage.goto(printHubPage.urlToManageOrderPhub);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });

    await test.step("Click Pay now> Click tab Awaiting Shipment > Verify thông tin order", async () => {
      await printHubPage.payOrder(orderID);
      await printHubPage.waitForElementVisibleThenInvisible(printbase.xpathToastMessageEditor(orderInfo.message));
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name_second);
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      expect(await printHubPage.countNumberLineItemOnOrder()).toEqual(orderInfo.number_line_item);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printHubPage.xpathPriceInfoOnOrder,
        snapshotName: `${picture}`,
        snapshotOptions,
      });
    });

    await test.step("Click tab Awaiting payment > Verify show order", async () => {
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      expect(await printHubPage.getMessageOrderEmpty()).toContain(orderInfo.message_empty);
    });
  });

  test("Verify sync order chứa line item not map về tab In Review sau đó mapped thì sync về tab Awaiting payment @SB_PRH_ODR_30", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const picture = conf.caseConf.picture;
    const orderInfo = conf.caseConf.order_info;
    const mapInfo = conf.caseConf.map_info;
    await test.step("Precondition: Remove map product ", async () => {
      await product.navigateToMenu("Products");
      await product.searchProdByName(orderInfo.product_name);
      await product.chooseProduct(orderInfo.product_name);
      await product.removeMapProduct(mapInfo.app_name, mapInfo.action);
      await dashboard.waitForLoadState("domcontentloaded");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await dashboard.click(product.xpathCheckboxVariant(conf.caseConf.variant_line.size));
      await printbase.clickOnBtnWithLabel("Save");
    });

    await test.step("Search and select product on SF > Check out thành công", async () => {
      const variantLine = conf.caseConf.variant_line;
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
      await productPage.selectValueProduct(variantLine);
      await productPage.addToCart();
      checkout = await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderID = await checkout.getOrderIDSF();
    });

    await test.step("Login shop Print Hub > Chọn PrintHub > Open All orders > Chọn tab In Review > Search order name > Verify sync order", async () => {
      await printHubPage.goto(printHubPage.urlToManageOrderPhub);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      await snapshotFixture.verify({
        page: dashboard,
        selector: printHubPage.xpathPriceInfoOnOrder,
        snapshotName: `${picture.order_in_review}`,
        snapshotOptions,
      });
    });

    await test.step("Mapping product > Click tab Awaiting Payment > Verify thông tin order", async () => {
      const variantMapping = conf.caseConf.variant_mapping;
      await printHubPage.clickOnBtnWithLabel("Map product");
      await dashboard.waitForLoadState("domcontentloaded");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.waitUntilElementVisible(product.xpathTitleToBeFulfilled);
      await product.mapProductVariants(variantMapping);
      await printbase.clickOnBreadcrumb();
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name_second);
      await dashboard.reload();
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.status_awaiting_payment);
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      expect(await printHubPage.countNumberLineItemOnOrder()).toEqual(orderInfo.number_line_item);
      await dashboard.reload();
      await dashboard.waitForLoadState("domcontentloaded");
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name_second);
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      await expect(
        dashboard.locator(printHubPage.getXpathSkuLineItem(orderInfo.product_name, orderInfo.sku)),
      ).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printHubPage.xpathPriceInfoOnOrder,
        snapshotName: `${picture.order_after_mapped}`,
        snapshotOptions,
      });
    });
  });

  test("Verify order có 1 line item không thuộc khu vực được ship thì phải sync sang tab In Review @SB_PRH_ODR_31", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const picture = conf.caseConf.picture;
    const orderInfo = conf.caseConf.order_info;
    await test.step("Search and select product on SF > Check out thành công", async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
      await productPage.addToCart();
      checkout = await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderID = await checkout.getOrderIDSF();
    });

    await test.step("Login shop Print Hub > Chọn PrintHub > Open All orders > Chọn tab All> Search order name > Verify sync order", async () => {
      await printHubPage.goto(printHubPage.urlToManageOrderPhub);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
    });

    await test.step("Click order name > Verify info order", async () => {
      await expect(dashboard.locator(printHubPage.getXpathStatusOfOrder(orderInfo.status))).toBeVisible();
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      const numberLinItemActual = await printHubPage.countNumberLineItemOnOrder();
      expect(numberLinItemActual).toEqual(orderInfo.number_line_item);
      await expect(dashboard.locator(printHubPage.xpathWarningMessage)).toBeVisible();
      await expect(dashboard.locator(printHubPage.xpathBtnWithLabel(orderInfo.button_label))).toBeHidden();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printHubPage.xpathPriceInfoOnOrder,
        snapshotName: `${picture}`,
        snapshotOptions,
      });
    });
  });
});
