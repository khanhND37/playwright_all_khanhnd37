import { test, expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { PrintHubPage } from "@pages/apps/printhub";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import { PrintBasePage } from "@pages/dashboard/printbase";

test.describe("Manage oder", () => {
  let printbase: PrintBasePage;
  let homepage;
  let customerInfo;
  let checkout: SFCheckout;
  let productPage: SFProduct;
  let orderID;
  let cardInfo;
  let printHubPage: PrintHubPage;
  let invoicePage: InvoicePage;
  let snapshotOptions;
  let variantLine;
  let balancePage: BalancePage;
  let invoiceFilter;
  let picture;
  let orderInfo;
  let invoiceInfo;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
    homepage = new SFHome(dashboard, conf.suiteConf.domain);
    checkout = new SFCheckout(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    customerInfo = conf.suiteConf.customer;
    cardInfo = conf.suiteConf.card;
    snapshotOptions = conf.suiteConf.snapshot_options;
    variantLine = conf.caseConf.variant_line;
    invoiceFilter = conf.caseConf.invoice_filter;
    picture = conf.caseConf.picture;
    orderInfo = conf.caseConf.order_info;
    invoiceInfo = conf.caseConf.invoice_info;
  });

  test("Verify charge manual thành công cho 1 order @SB_PRH_PM_1", async ({ dashboard, snapshotFixture, conf }) => {
    await test.step("Search and select product on SF > Check out thành công", async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
      await productPage.selectValueProduct(variantLine);
      await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
      orderID = await checkout.getOrderIDSF();
    });

    await test.step("Login shop Print Hub > Chọn PrintHub > Open All orders > Chọn ${orderInfo.tab_name} > Search order name > Verify sync order", async () => {
      await printHubPage.goto(printHubPage.urlToManageOrderPhub);
      // enable setting payment
      await printbase.navigateToMenu("Settings", 2);
      if (await printHubPage.page.locator(printHubPage.xpathTogglePaymentDisable).isVisible()) {
        await dashboard.click(printHubPage.xpathTogglePaymentDisable);
        await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_setting))).toBeVisible();
      }
      await printbase.navigateToMenu("Fulfillment", 2);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });

    await test.step("Click Pay now > Verify popup confirm payment", async () => {
      await printHubPage.clickOnBtnWithLabel("Pay now");
      await snapshotFixture.verify({
        page: dashboard,
        selector: printHubPage.xpathPopupConfirmPayment,
        snapshotName: picture,
        snapshotOptions,
      });
    });

    await test.step("Click Close > Verify thông tin order", async () => {
      await printHubPage.clickOnBtnWithLabel("Close");
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });

    await test.step("Click button [Pay now] > Click button [Confirm payment] on popup", async () => {
      await printHubPage.clickOnBtnWithLabel("Pay now");
      await printHubPage.clickOnBtnWithLabel("Confirm payment");
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name_shipment);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name_shipment);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status_shipment);
    });

    await test.step("Click Balance > Click View invoices> Verify log invoice", async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterInvoiceWithConditions(invoiceFilter);
      await dashboard.waitForLoadState("load");
      for (let i = 0; i < invoiceInfo.length; i++) {
        expect(await invoicePage.getInforInvoice(invoiceInfo[i].colum_name)).toContain(invoiceInfo[i].value);
      }
    });
  });

  test("Verify charge không thành công khi deactivate payment @SB_PRH_375", async ({ dashboard, conf }) => {
    await test.step("Search and select product on SF > Check out thành công", async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
      await productPage.selectValueProduct(variantLine);
      await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
      orderID = await checkout.getOrderIDSF();
    });

    await test.step("Login shop Print Hub > Chọn PrintHub > Open All orders > Chọn ${orderInfo.tab_name} > Search order name > Verify sync order", async () => {
      await printHubPage.goto(printHubPage.urlToManageOrderPhub);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });

    await test.step("Từ Menu, Chọn Setting > Deactivate payment", async () => {
      await printbase.navigateToMenu("Settings", 2);
      if (await printHubPage.page.locator(printHubPage.xpathTogglePaymentEnable).isVisible()) {
        await dashboard.click(printHubPage.xpathTogglePaymentEnable);
        await printHubPage.clickOnBtnWithLabel("Deactivate");
        await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_setting))).toBeVisible();
      }
    });

    await test.step("Từ Menu, chọn Fulfillment > Chọn Tab Awaiting payment > Click button Pay now > Click button Confirm", async () => {
      await printbase.navigateToMenu("Fulfillment", 2);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      await printHubPage.clickOnBtnWithLabel("Pay now");
      await printHubPage.clickOnBtnWithLabel("Confirm payment");
      await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_payment))).toBeVisible();
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });
  });

  test("Verify auto charge thành công payment sau khi Ụnhold order @SB_PRH_413", async ({ dashboard, conf }) => {
    await test.step("Search and select Product on SF >Check out order > Verify order sync về Phub", async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
      await productPage.selectValueProduct(variantLine);
      await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
      orderID = await checkout.getOrderIDSF();
      await printHubPage.goto(printHubPage.urlToManageOrderPhub);
      await printbase.navigateToMenu("Settings", 2);
      if (await printHubPage.page.locator(printHubPage.xpathTogglePaymentDisable).isVisible()) {
        await dashboard.click(printHubPage.xpathTogglePaymentDisable);
        await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_setting))).toBeVisible();
      }
      await printbase.navigateToMenu("Fulfillment", 2);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      await printHubPage.searchOrder(orderID);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });

    await test.step("Click order > Click Action > Thực hiên Hold order > Verify thông tin order", async () => {
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      await printHubPage.selectActionOrder(orderInfo.action_name, orderInfo.action_name);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name_hold);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name_hold);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.tab_name_hold);
    });

    await test.step("Click order > Click Action > Thực hiên UnHold order > Verify thông tin order", async () => {
      await dashboard.reload();
      await dashboard.waitForLoadState("domcontentloaded");
      await dashboard.click(printHubPage.getXpathOrderName(orderID));
      await printHubPage.selectActionOrder(orderInfo.action_unhold, orderInfo.action_unhold);
      await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
      expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
    });

    await test.step("Click Pay now order > Click Balance > Click Invoice> Verify thông tin invoice", async () => {
      await printHubPage.payOrder(orderID);
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterInvoiceWithConditions(invoiceFilter);
      await dashboard.waitForLoadState("load");
      for (let i = 0; i < invoiceInfo.length; i++) {
        expect(await invoicePage.getInforInvoice(invoiceInfo[i].colum_name)).toContain(invoiceInfo[i].value);
      }
    });
  });

  test("Verify charge manual thành công cho nhiều order @SB_PRH_PM_2", async ({ dashboard, conf }) => {
    const listOrder = [];
    const numberOrderCreate = conf.caseConf.number_order_create;
    for (let i = 1; i < numberOrderCreate; i++) {
      await test.step("Search and select product on SF > Check out thành công 2 order > Verify sync order về Phub ", async () => {
        await homepage.gotoHomePage();
        productPage = await homepage.searchThenViewProduct(orderInfo.product_name);
        await productPage.selectValueProduct(variantLine);
        await checkout.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
        orderID = await checkout.getOrderIDSF();
        listOrder.push(orderID);
        await printHubPage.goto(printHubPage.urlToManageOrderPhub);
        await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
        await printHubPage.searchOrder(orderID);
        await printHubPage.waitSyncOrderPrintHub(orderID, orderInfo.tab_name, 25);
        expect(await printHubPage.getOrderStatus()).toContain(orderInfo.order_status);
      });
    }

    await test.step("Click checkbox order name > Click Actions > Click Pay now > Click confirm > Verify charge thành công order", async () => {
      // enable setting payment
      await printbase.navigateToMenu("Settings", 2);
      if (await printHubPage.page.locator(printHubPage.xpathTogglePaymentDisable).isVisible()) {
        await dashboard.click(printHubPage.xpathTogglePaymentDisable);
        await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_setting))).toBeVisible();
      }
      await printbase.navigateToMenu("Fulfillment", 2);
      await printHubPage.switchTabInAllOrders(orderInfo.tab_name);
      for (let i = 0; i < listOrder.length; i++) {
        await dashboard.click(printHubPage.getXpathCheckboxOrderName(listOrder[i]));
      }
      await printHubPage.clickOnBtnWithLabel("Actions");
      await dashboard.click(printHubPage.xpathBtnPayNow);
      await printHubPage.clickOnBtnWithLabel("Confirm payment");
      await expect(dashboard.locator(printbase.xpathToastMessageEditor(conf.caseConf.message_payment))).toBeVisible();
    });

    await test.step("Click Balance > Click View invoices> Verify log invoice", async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterInvoiceWithConditions(invoiceFilter);
      await dashboard.waitForLoadState("load");
      for (let i = 0; i < invoiceInfo.length; i++) {
        expect(await invoicePage.getInforInvoice(invoiceInfo[i].colum_name)).toContain(invoiceInfo[i].value);
      }
    });
  });
});
