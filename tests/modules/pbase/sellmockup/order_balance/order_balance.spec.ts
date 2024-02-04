import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import { OrdersPage } from "@pages/dashboard/orders";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFProduct } from "@pages/storefront/product";

let printbasePage: PrintBasePage;
let hiveInfo;
let campaignSFPage: SFProduct;
let orderPage: OrdersPage;
let orderId: number;
let customerInfo;
let cardInfo;
let hivePage: HivePBase;
let profitMessage;
let importCampaign;
let balancePage: BalancePage;
let beforeAvailableSoonBalance;
let afterAvailableSoonBalance;
let availableValue;
let status;

test.describe("Order balance with artwork", async () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ dashboard, conf }) => {
    //Prodtest không import camp được - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }

    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    hiveInfo = conf.suiteConf.hive_info;
    customerInfo = conf.suiteConf.customer_info;
    cardInfo = conf.suiteConf.card_info;
    profitMessage = conf.suiteConf.message;
    test.setTimeout(conf.suiteConf.timeout);
    importCampaign = conf.caseConf.import_campaign;
  });

  test(`@SB_PRB_SCWM_39 [Dashboard-Balance]-Check hiển thị balance khi tạo thành công với order ( đủ artwork + approved ) chứa line item là camp custom with mockup`, async ({
    page,
    conf,
    dashboard,
  }) => {
    //Prodtest không import camp được - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }
    const dataInvoice = conf.caseConf.data_invoice;
    const profit = conf.suiteConf.profit;

    await test.step("Click button [Upload artwork] > Tại màn Editor, Click button [Add text ] > Click button [Add image] > Select image tại popup [Artwork Library] > Click button [Upload] trên popup > Click btn Save", async () => {
      // get balance "Available soon" trươc khi order được approved
      balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
      await balancePage.goToBalance();
      availableValue = await balancePage.genLoc(balancePage.getXpathBalanceWithLabel("Available soon")).textContent();
      beforeAvailableSoonBalance = parseFloat(availableValue.replace("$", "").replace(",", "").trim());
    });

    await test.step(`Login Hive Pbase> Chọn Customer Support> Chọn Pbase Order> Click order name > Click button [Approve]`, async () => {
      await printbasePage.navigateToMenu("Orders");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await orderPage.openFirstOrderDetail();
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      orderId = await orderPage.getOrderIdInOrderDetail();

      hivePage = new HivePBase(page, hiveInfo.hive_domain);
      await hivePage.loginToHivePrintBase(hiveInfo.hive_username, hiveInfo.hive_password);
      await hivePage.goToOrderDetail(orderId);
      while ((await hivePage.getArtworkStatus(2)) !== "artwork_rendered") {
        await hivePage.page.waitForTimeout(60000);
        await hivePage.page.reload();
        await hivePage.reRenderArtwork(1);
      }
      await hivePage.approveOrder();
      expect(await hivePage.getArtworkStatus(2)).toEqual("artwork_rendered");
    });

    await test.step(`Load lại trang Order detail tại admin shop > Verify Profit`, async () => {
      orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      expect(await orderPage.getProfit()).toEqual(profit);
    });

    await test.step(`Click phần Account ở góc trái bên dưới > Chọn [Balance] `, async () => {
      balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
      await balancePage.goToBalance();
      availableValue = await balancePage.genLoc(balancePage.getXpathBalanceWithLabel("Available soon")).textContent();
      afterAvailableSoonBalance = parseFloat(availableValue.replace("$", "").replace(",", "").trim());
      expect((afterAvailableSoonBalance - beforeAvailableSoonBalance).toFixed(2)).toEqual(profit.replace("$", ""));
    });

    await test.step(`Click button [View invoices]`, async () => {
      await balancePage.clickBtnViewTransactions();
      const invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);

      await invoicePage.filterWithConditionDashboard("More filters", [
        {
          field: "Shop Domain",
          checkbox_array: [
            {
              checkbox: conf.suiteConf.domain,
            },
          ],
        },
        {
          field: "Invoice",
          select_ddl_value: "PrintBase order collecting",
        },
      ]);

      await invoicePage.page.waitForLoadState("networkidle");
      const verifyAmount = await invoicePage.verifyAmount(dataInvoice);
      expect(verifyAmount).toBe(true);
    });
  });

  test(`@SB_PRB_SCWM_37 [Dashboard-Balance]-Check hiển thị balance khi tạo thành công với order chỉ chứa line item không có artwork`, async ({
    page,
    conf,
    dashboard,
    context,
  }) => {
    //Prodtest không import camp được - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }
    const variantProduct = conf.caseConf.variant_product;
    const profitMessage = conf.caseConf.profit_message;
    const importInfo = conf.suiteConf.import_info;
    const fileName = importCampaign.file_name;

    await test.step(`Pre-condition: Xóa camp cũ, Import campaign mới`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(120000);
        await printbasePage.page.reload();
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(fileName, 1);
      } while (status !== importInfo.status);

      expect(await printbasePage.getStatus(fileName)).toEqual(importInfo.status);
      expect(await printbasePage.getProcess(fileName)).toEqual(importInfo.process);
      await printbasePage.clickProgressBar();
    });

    await test.step(`Create thành công order `, async () => {
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await printbasePage.clickViewProductOnOnlineStore(),
      ]);
      campaignSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSFPage.waitResponseWithUrl("/assets/landing.css", 500000);
      await campaignSFPage.waitForImagesDescriptionLoaded();
      await campaignSFPage.waitForImagesMockupLoaded();
      await campaignSFPage.selectValueProduct(variantProduct);
      await campaignSFPage.addToCart();
      await campaignSFPage.waitForEventCompleted(conf.suiteConf.domain, "add_to_cart");
      const checkout = await campaignSFPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.number,
        cardInfo.holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      await checkout.page.waitForSelector(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step('Get balance "Available soon" ', async () => {
      balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
      await balancePage.goToBalance();
      availableValue = await balancePage.genLoc(balancePage.getXpathBalanceWithLabel("Available soon")).textContent();
      beforeAvailableSoonBalance = parseFloat(availableValue.replace("$", "").replace(",", "").trim());
    });

    await test.step("Vào Hive > Customer support > Pbase Order > click Order detail > Approve order", async () => {
      hivePage = new HivePBase(page, hiveInfo.hive_domain);
      await hivePage.loginToHivePrintBase(hiveInfo.hive_username, hiveInfo.hive_password);
      await hivePage.goToOrderDetail(orderId);
      // Hive bị lỗi hiển thị sai artwork status
      // expect(await hivePage.getArtworkStatus(2)).toEqual("awaiting_artwork");
    });

    await test.step("Login admin shop > tại Menu, chọn Orders > Verify hiển thị order mới tạo > Click order name > chờ profit đươc calculated", async () => {
      orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      expect(await orderPage.getProfitMessage()).toEqual(profitMessage);
    });

    await test.step("Click phần Account ở góc trái bên dưới > Chọn [Balance]", async () => {
      balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
      await balancePage.goToBalance();
      availableValue = await balancePage.genLoc(balancePage.getXpathBalanceWithLabel("Available soon")).textContent();
      afterAvailableSoonBalance = parseFloat(availableValue.replace("$", "").replace(",", "").trim());
      expect(afterAvailableSoonBalance - beforeAvailableSoonBalance).toEqual(0);
    });
  });

  test(`@SB_PRB_SCWM_38 [Dashboard-Balance]-Check hiển thị balance khi tạo thành công với order (chưa được approved ) chứa line item có artwork`, async ({
    conf,
    dashboard,
  }) => {
    //Prodtest không import camp được - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }
    const layerList = conf.caseConf.layers;

    await test.step('Get balance "Available soon" ', async () => {
      balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
      await balancePage.goToBalance();
      availableValue = await balancePage.genLoc(balancePage.getXpathBalanceWithLabel("Available soon")).textContent();
      beforeAvailableSoonBalance = parseFloat(availableValue.replace("$", "").replace(",", "").trim());
    });

    await test.step("Login admin shop > tại Menu, chọn Orders > Click Order name  Verify detail order mới tạoClick Upload/Replace artwork > Add layer text 1, Add layer Image > Save", async () => {
      await printbasePage.navigateToMenu("Orders");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await orderPage.openFirstOrderDetail();
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      expect(await orderPage.isTextVisible("Awaiting artwork")).toBeTruthy();
      await orderPage.clickElementWithLabel("div", "Upload/Replace Artwork");
      await orderPage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);

      for (const layer of layerList) {
        await printbasePage.addNewLayer(layer);
      }
      await orderPage.clickOnBtnWithLabel("Save change");
      await orderPage.waitUntilElementInvisible(orderPage.xpathToastMessage);
      await orderPage.page.waitForSelector(".page-order-show");
    });

    await test.step(`chờ profit đươc calculated`, async () => {
      expect(await orderPage.getProfitMessage()).toEqual(profitMessage);
    });

    await test.step(`Click phần Account ở góc trái bên dưới > Chọn [Balance] `, async () => {
      balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
      await balancePage.goToBalance();
      await balancePage.page.reload();
      availableValue = await balancePage.genLoc(balancePage.getXpathBalanceWithLabel("Available soon")).textContent();
      afterAvailableSoonBalance = parseFloat(availableValue.replace("$", "").replace(",", "").trim());
      expect(afterAvailableSoonBalance - beforeAvailableSoonBalance).toEqual(0);
    });
  });
});
