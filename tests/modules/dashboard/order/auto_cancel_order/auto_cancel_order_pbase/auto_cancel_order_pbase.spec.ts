/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { ContactUsPage } from "@pages/storefront/contact_us";
import { removeCurrencySymbol } from "@core/utils/string";
import { isEqual } from "@core/utils/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import { buildOrderTimelineMsg } from "@utils/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { HivePBase } from "@pages/hive/hivePBase";

test.describe(`[Pbase][Tax include] Kiểm tra luồng cancel order qua request cancel order trên page contact us`, () => {
  let domain, email, productInfo, discountCode, tippingInfo, firstName;
  let lastName, shopId, gatewayCode, secretKey, connectedAcc, accessToken, actualTotalOrder, actRefundToBuyer;
  let orderName: string;
  let orderId: number;
  let totalProfitBefore: number;
  let balanceAmtBefore: number;
  let totalOrderBefore: number;
  let dashboardAPI: DashboardAPI;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let contactUsPage: ContactUsPage;
  let orderApi: OrderAPI;
  let homepage: SFHome;

  test.beforeEach(async ({ page, conf, request, token, authRequest }) => {
    domain = conf.suiteConf.domain;
    productInfo = conf.suiteConf.product_name;
    const customerInfo = conf.suiteConf.customer_info;
    discountCode = conf.suiteConf.discount_code;
    tippingInfo = conf.suiteConf.tipping_info;
    firstName = customerInfo.first_name;
    lastName = customerInfo.last_name;
    email = customerInfo.email;
    secretKey = conf.suiteConf.secret_key_stripe;
    connectedAcc = conf.suiteConf.connected_account;
    shopId = conf.suiteConf.shop_id;

    // Set time out
    test.setTimeout(300 * 1000);

    //get total profit and balance amount before checkout and cancel order
    dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest, page);
    contactUsPage = new ContactUsPage(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain, "", request);

    dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });

    /* This data need for amt step below
    const analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);

    totalProfitBefore = await analyticsInfo.total_profit;
    totalOrderBefore = await analyticsInfo.total_order;
    balanceAmtBefore = await dashboardAPI.getTotalBalance();
    */

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    //checkout order and sent request cancel order

    await homepage.gotoHomePage();
    const productPage = await homepage.searchThenViewProduct(productInfo);
    await productPage.addProductToCart();
    await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(customerInfo);
    await checkout.applyDiscountCode(discountCode);
    await checkout.addTip(tippingInfo);
    await checkout.selectPaymentMethod();
    gatewayCode = await checkout.getTypeOfStripeCreditCardMethod();
    await checkout.completeOrderWithMethod();

    orderName = await checkout.getOrderName();
    orderId = await checkout.getOrderIdBySDK();

    // wait until order return profit success then will able to cancel order
    await orderApi.getOrderProfit(orderId, "printbase");
  });

  test(
    `[Pbase] Kiểm tra luồng Cancel order khi cancel order có tax include thành công qua email confirmation ` +
      `@SB_TC_PB_PLB_RDR_23`,
    async ({ dashboard, conf, authRequestWithExchangeToken }) => {
      //Pre-condition: fill form contact us
      await contactUsPage.goto(`pages/contact-us`);
      await contactUsPage.fillFormContactUs(email, orderName);

      await test.step(`
        - Vào mailinator.com
        - Search mail theo email dùng để checkout order A
        - Vào emaill confirm cancel
        - Click Cancel order`, async () => {
        const mailBox = await checkout.openMailBox(email);
        contactUsPage = await mailBox.confirmCancelOrdInMailBox(orderName);
        await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
      });

      await test.step(`- Click Yes, I want to cancel this order`, async () => {
        await contactUsPage.confirmCancelOrd();
        await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
      });

      await test.step(`
        Login vào dashboard:
        - Vào order detail của order trên
        - Kiểm tra thông tin order`, async () => {
        orderPage = new OrdersPage(dashboard, domain);
        await orderPage.goToOrderByOrderId(orderId, "pbase");
        const orderStatus = await orderPage.getOrderStatus();

        //cause sometimes order profit get slower than usual
        await orderPage.reloadUntilOrdCapture(orderStatus);
        expect(orderStatus).toEqual("Voided");

        //verify net payment
        actualTotalOrder = await orderPage.getTotalOrder();
        actualTotalOrder = removeCurrencySymbol(actualTotalOrder);
        const actNetPayment = await orderPage.getNetPaymentValue();
        expect(actNetPayment).toEqual(0);

        //verify profit
        let actProfit = await orderPage.getProfit();
        actProfit = removeCurrencySymbol(actProfit);
        expect(isEqual(parseFloat(actProfit), 0, 0.01)).toEqual(true);

        //verify timeline
        const ordTimelineCancelOrd = buildOrderTimelineMsg(firstName, lastName, email).timelineCancelOrdPbase;
        const ordTimelineSentMailCancel = buildOrderTimelineMsg(firstName, lastName, email).timelineSentCancelMailPbase;
        await expect(await orderPage.orderTimeLines(ordTimelineCancelOrd)).toBeVisible();
        await expect(await orderPage.orderTimeLines(ordTimelineSentMailCancel)).toBeVisible();
      });

      /* API analytics need a few minute to return correct data. But recently it's not stable
        I mean adding hard step wait timeout is not stable and lengthen test case.
        Then disable this step for suitable solution
      await test.step(`- Vào Analytics > Verify Total profit`, async () => {
        // verify total profit and total order after cancel order
        let analyticsInfo;
        // api analytics need a few minute to return correct data. in case will call api 6 times every 5 seconds
        for (let i = 0; i <= 6; i++) {
          // eslint-disable-next-line playwright/no-wait-for-timeout
          await page.waitForTimeout(5000);
          analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
        }
        const totalProfitAfter = await analyticsInfo.total_profit;
        const totalOrderAfter = await analyticsInfo.total_order;
        expect(totalOrderAfter).toEqual(totalOrderBefore + 1);
        expect(isEqual(totalProfitAfter, totalProfitBefore, 0.01)).toEqual(true);
      });
      */

      await test.step(`
        - Tại order detail > Action > Chọn action view invoice
        - Verify transaction`, async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        orderApi = new OrderAPI(domain, requestObj);
        dashboardAPI = new DashboardAPI(domain, requestObj, dashboard);
        // verify invoice transaction
        await orderPage.viewInvoice();
        const listTransAmt = await dashboardAPI.getOrderTransAmt();
        let totalTransAmt = 0;
        for (let i = 0; i < listTransAmt.length; i++) {
          totalTransAmt += listTransAmt[i];
        }
        expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);

        /* Cmt for the same reason above
        // verify balance amount
        const balanceAmtAfter = await dashboardAPI.getTotalBalance();
        expect(isEqual(balanceAmtAfter, balanceAmtBefore, 0.01)).toEqual(true);
        */
      });

      await test.step(`
        Tại order detail của order > Lấy ra transaction ID
        - Mở F12 > Network
        - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
        Vào Stripe dashboard > search theo transaction ID > Verify transaction `, async () => {
        // verify order status in stripe dashboard
        await orderApi.getTransactionId(orderId);
        if (gatewayCode === "platform") {
          secretKey = conf.suiteConf.secret_key_spay;
        }
        const ordInfo = await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAcc,
        });
        const ordStatus = ordInfo.ordRefundStatus;
        let ordRefundAmt = ordInfo.ordRefundAmt;
        ordRefundAmt = Number((ordRefundAmt / 100).toFixed(2));
        expect(ordStatus).toEqual("refund");
        expect(ordRefundAmt).toEqual(Number(actualTotalOrder));
      });
    },
  );

  test(
    `[Pbase] Kiểm tra luồng Cancel order qua form Contact us, order có tax exclude đã được approved ` +
      `@SB_TC_PB_PLB_RDR_76`,
    async ({ page, conf }) => {
      // Pre-condition: approve order on hive
      const hiveInfo = conf.suiteConf.hive_info;
      const hivePbase = new HivePBase(page, hiveInfo.domain);
      await hivePbase.loginToHivePrintBase(hiveInfo.username, hiveInfo.password);
      await hivePbase.goToOrderDetail(orderId, "pbase-order");
      await hivePbase.approveOrder();

      //Pre-condition: fill form contact us
      await contactUsPage.goto(`pages/contact-us`);
      await contactUsPage.fillFormContactUs(email, orderName);

      await test.step(`
        - Vào mailinator.com
        - Search mail theo email dùng để checkout order A
        - Vào emaill confirm cancel
        - Click Cancel order`, async () => {
        const mailBox = await checkout.openMailBox(email);
        contactUsPage = await mailBox.confirmCancelOrdInMailBox(orderName);
        await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
      });

      await test.step(`- Click Yes, I want to cancel this order`, async () => {
        await contactUsPage.confirmCancelOrd();
        await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
      });

      await test.step(`
        Login vào dashboard:
        - Vào order detail của order trên
        - Kiểm tra thông tin order`, async () => {
        orderPage = await checkout.openOrderByAPI(orderId, accessToken, "printbase");
        const orderStatus = await orderPage.getOrderStatus();

        //cause sometimes order profit get slower than usual
        await orderPage.reloadUntilOrdCapture(orderStatus);
        expect(orderStatus).toEqual("Partially refunded");

        //verify net payment, refund to buyer, paid by customer
        actualTotalOrder = await orderPage.getTotalOrder();
        actualTotalOrder = removeCurrencySymbol(actualTotalOrder);

        let actualPaidByCustomer = await orderPage.getPaidByCustomer();
        actualPaidByCustomer = removeCurrencySymbol(actualPaidByCustomer);

        actRefundToBuyer = await orderPage.getRefundToCustomer();
        const actNetPayment = await orderPage.getNetPaymentValue();

        expect(actualPaidByCustomer).toEqual(actualTotalOrder);
        //Payment fee = total amount * 3%
        expect(actNetPayment.toFixed(2)).toEqual((parseFloat(actualTotalOrder) * 0.03).toFixed(2));
        expect(actRefundToBuyer.toFixed(2)).toEqual((parseFloat(actualTotalOrder) - actNetPayment).toFixed(2));

        //verify profit
        let actProfit = await orderPage.getProfit();
        actProfit = removeCurrencySymbol(actProfit);
        expect(isEqual(parseFloat(actProfit), 0, 0.01)).toEqual(true);

        //verify timeline
        const ordTimelineCancelOrd = buildOrderTimelineMsg(firstName, lastName, email).timelineCancelOrdPbase;
        const ordTimelineSentMailCancel = buildOrderTimelineMsg(firstName, lastName, email).timelineSentCancelMailPbase;
        await expect(await orderPage.orderTimeLines(ordTimelineCancelOrd)).toBeVisible();
        await expect(await orderPage.orderTimeLines(ordTimelineSentMailCancel)).toBeVisible();
      });

      /* API analytics need a few minute to return correct data. But recently it's not stable
        I mean adding hard step wait timeout is not stable and lengthen test case.
        Then disable this step for suitable solution
      await test.step(`- Vào Analytics > Verify Total profit`, async () => {
        // verify total profit and total order after cancel order
        let analyticsInfo;
        // api analytics need a few minute to return correct data. in case will call api 6 times every 5 seconds
        for (let i = 0; i <= 6; i++) {
          // eslint-disable-next-line playwright/no-wait-for-timeout
          await page.waitForTimeout(5000);
          analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
        }
        const totalProfitAfter = await analyticsInfo.total_profit;
        const totalOrderAfter = await analyticsInfo.total_order;
        expect(totalOrderAfter).toEqual(totalOrderBefore + 1);
        expect(isEqual(totalProfitAfter, totalProfitBefore, 0.01)).toEqual(true);
      });
      */

      await test.step(`
        - Tại order detail > Action > Chọn action view invoice
        - Verify transaction`, async () => {
        // verify invoice transaction
        await orderPage.viewInvoice();
        const listTransAmt = await dashboardAPI.getOrderTransAmt();
        let totalTransAmt = 0;
        for (let i = 0; i < listTransAmt.length; i++) {
          totalTransAmt += listTransAmt[i];
        }
        expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);

        /* Cmt for the same reason above
        // verify balance amount
        const balanceAmtAfter = await dashboardAPI.getTotalBalance();
        expect(isEqual(balanceAmtAfter, balanceAmtBefore, 0.01)).toEqual(true);
        */
      });

      await test.step(`
        Tại order detail của order > Lấy ra transaction ID
        - Mở F12 > Network
        - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
        Vào Stripe dashboard > search theo transaction ID > Verify transaction `, async () => {
        // verify order status in stripe dashboard
        await orderApi.getTransactionId(orderId, accessToken);
        if (gatewayCode === "platform") {
          secretKey = conf.suiteConf.secret_key_spay;
        }
        const ordInfo = await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAcc,
        });
        const ordStatus = await ordInfo.ordRefundStatus;
        let ordRefundAmt = await ordInfo.ordRefundAmt;
        ordRefundAmt = Number((ordRefundAmt / 100).toFixed(2));
        expect(ordStatus).toEqual("refund");
        expect(ordRefundAmt).toEqual(Number(actRefundToBuyer));
      });
    },
  );
});

test.describe(`[Pbase][Tax exclude] Kiểm tra luồng cancel order qua request cancel order trên page contact us`, () => {
  let domain, email, productInfo, discountCode, tippingInfo, firstName;
  let lastName, shopId, gatewayCode, secretKey, connectedAcc, accessToken, actualTotalOrder, actRefundToBuyer;
  let orderName: string;
  let orderId: number;
  let totalProfitBefore: number;
  let balanceAmtBefore: number;
  let totalOrderBefore: number;
  let dashboardAPI: DashboardAPI;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let contactUsPage: ContactUsPage;
  let orderApi: OrderAPI;
  let homepage: SFHome;

  test.beforeEach(async ({ page, conf, request, token, authRequest }) => {
    domain = conf.suiteConf.domain;
    productInfo = conf.suiteConf.product_name;
    const customerInfo = conf.suiteConf.customer_info;
    discountCode = conf.suiteConf.discount_code;
    tippingInfo = conf.suiteConf.tipping_info;
    firstName = customerInfo.first_name;
    lastName = customerInfo.last_name;
    email = customerInfo.email;
    secretKey = conf.suiteConf.secret_key_stripe;
    connectedAcc = conf.suiteConf.connected_account;
    shopId = conf.suiteConf.shop_id;

    // Set time out
    test.setTimeout(300 * 1000);

    //get total profit and balance amount before checkout and cancel order
    dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest, page);
    contactUsPage = new ContactUsPage(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain, "", request);
    dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });

    /* This data need for amt step below
    const analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
    totalProfitBefore = await analyticsInfo.total_profit;
    totalOrderBefore = await analyticsInfo.total_order;
    balanceAmtBefore = await dashboardAPI.getTotalBalance();
    */

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    //checkout order and sent request cancel order
    await homepage.gotoHomePage();
    const productPage = await homepage.searchThenViewProduct(productInfo);
    await productPage.addProductToCart();
    await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(customerInfo);
    await checkout.applyDiscountCode(discountCode);
    await checkout.addTip(tippingInfo);
    await checkout.selectPaymentMethod();
    gatewayCode = await checkout.getTypeOfStripeCreditCardMethod();
    await checkout.completeOrderWithMethod();

    orderName = await checkout.getOrderName();
    orderId = await checkout.getOrderIdBySDK();

    // wait until order return profit success then will able to cancel order
    await orderApi.getOrderProfit(orderId, "printbase");
  });

  test(
    `[Pbase] Kiểm tra luồng Cancel order khi cancel order có tax include thành công qua email confirmation ` +
      `@SB_TC_PB_PLB_RDR_24`,
    async ({ page, conf }) => {
      //Pre-condition: fill form contact us
      await contactUsPage.goto(`pages/contact-us`);
      await contactUsPage.fillFormContactUs(email, orderName);

      await test.step(`
        - Vào mailinator.com
        - Search mail theo email dùng để checkout order A
        - Vào emaill confirm cancel
        - Click Cancel order`, async () => {
        const mailBox = await checkout.openMailBox(email);
        contactUsPage = await mailBox.confirmCancelOrdInMailBox(orderName);
        await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
      });

      await test.step(`- Click Yes, I want to cancel this order`, async () => {
        await contactUsPage.confirmCancelOrd();
        await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
      });

      await test.step(`
        Login vào dashboard:
        - Tại order page: search order theo order name:
        - Vào order detail của order trên
        - Kiểm tra thông tin order`, async () => {
        await orderPage.goToOrderByOrderId(orderId, "pbase");
        const orderStatus = await orderPage.getOrderStatus();

        //cause sometimes order profit get slower than usual
        await orderPage.reloadUntilOrdCapture(orderStatus);
        expect(orderStatus).toEqual("Voided");

        //verify net payment
        actualTotalOrder = await orderPage.getTotalOrder();
        actualTotalOrder = removeCurrencySymbol(actualTotalOrder);
        const actNetPayment = await orderPage.getNetPaymentValue();
        expect(actNetPayment).toEqual(0);

        //verify profit
        let actProfit = await orderPage.getProfit();
        actProfit = removeCurrencySymbol(actProfit);
        expect(isEqual(parseFloat(actProfit), 0, 0.01)).toEqual(true);

        //verify timeline
        const ordTimelineCancelOrd = buildOrderTimelineMsg(firstName, lastName, email).timelineCancelOrdPbase;
        const ordTimelineSentMailCancel = buildOrderTimelineMsg(firstName, lastName, email).timelineSentCancelMailPbase;
        await expect(await orderPage.orderTimeLines(ordTimelineCancelOrd)).toBeVisible();
        await expect(await orderPage.orderTimeLines(ordTimelineSentMailCancel)).toBeVisible();
      });

      /* API analytics need a few minute to return correct data. But recently it's not stable
        I mean adding hard step wait timeout is not stable and lengthen test case.
        Then disable this step for suitable solution
      await test.step(`- Vào Analytics > Verify Total profit`, async () => {
        // verify total profit and total order after cancel order
        let analyticsInfo;
        // api analytics need a few minute to return correct data. in case will call api 6 times every 5 seconds
        for (let i = 0; i <= 6; i++) {
          // eslint-disable-next-line playwright/no-wait-for-timeout
          await page.waitForTimeout(5000);
          analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
        }
        const totalProfitAfter = await analyticsInfo.total_profit;
        const totalOrderAfter = await analyticsInfo.total_order;
        expect(totalOrderAfter).toEqual(totalOrderBefore + 1);
        expect(isEqual(totalProfitAfter, totalProfitBefore, 0.01)).toEqual(true);
      });
      */

      await test.step(`
        - Tại order detail > Action > Chọn action view invoice
        - Verify transaction`, async () => {
        // verify invoice transaction
        await orderPage.viewInvoice();
        const listTransAmt = await dashboardAPI.getOrderTransAmt();
        let totalTransAmt = 0;
        for (let i = 0; i < listTransAmt.length; i++) {
          totalTransAmt += listTransAmt[i];
        }
        expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);

        /* Cmt for the same reason above
        // verify balance amount
        const balanceAmtAfter = await dashboardAPI.getTotalBalance();
        expect(isEqual(balanceAmtAfter, balanceAmtBefore, 0.01)).toEqual(true);
        */
      });

      await test.step(`
        Tại order detail của order > Lấy ra transaction ID
        - Mở F12 > Network
        - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
        Vào Stripe dashboard > search theo transaction ID > Verify transaction `, async () => {
        // verify order status, refund amount in stripe dashboard
        await orderApi.getTransactionId(orderId, accessToken);
        if (gatewayCode === "platform") {
          secretKey = conf.suiteConf.secret_key_spay;
        }
        const ordInfo = await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAcc,
        });
        const ordStatus = await ordInfo.ordRefundStatus;
        let ordRefundAmt = await ordInfo.ordRefundAmt;
        ordRefundAmt = Number((ordRefundAmt / 100).toFixed(2));
        expect(ordStatus).toEqual("refund");
        expect(ordRefundAmt).toEqual(Number(actualTotalOrder));
      });
    },
  );

  test(
    `[Pbase] Kiểm tra luồng Cancel order qua form Contact us, order có tax exclude đã được approved ` +
      `@SB_TC_PB_PLB_RDR_81`,
    async ({ dashboard, conf, authRequestWithExchangeToken, page }) => {
      // Pre-condition: approve order on hive
      const hiveInfo = conf.suiteConf.hive_info;
      const hivePbase = new HivePBase(page, hiveInfo.domain);
      await hivePbase.loginToHivePrintBase(hiveInfo.username, hiveInfo.password);
      await hivePbase.goToOrderDetail(orderId, "pbase-order");
      await hivePbase.approveOrder();

      //Pre-condition: fill form contact us
      await contactUsPage.goto(`pages/contact-us`);
      await contactUsPage.fillFormContactUs(email, orderName);

      await test.step(`
        - Vào mailinator.com
        - Search mail theo email dùng để checkout order A
        - Vào emaill confirm cancel
        - Click Cancel order`, async () => {
        const mailBox = await checkout.openMailBox(email);
        contactUsPage = await mailBox.confirmCancelOrdInMailBox(orderName);
        await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
      });

      await test.step(`- Click Yes, I want to cancel this order`, async () => {
        await contactUsPage.confirmCancelOrd();
        await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
      });

      await test.step(`
        Login vào dashboard:
        - Tại order page: search order theo order name:
        - Vào order detail của order trên
        - Kiểm tra thông tin order`, async () => {
        orderPage = new OrdersPage(dashboard, domain);
        await orderPage.goToOrderByOrderId(orderId, "pbase");
        const orderStatus = await orderPage.getOrderStatus();

        //cause sometimes order profit get slower than usual
        await orderPage.reloadUntilOrdCapture(orderStatus);
        expect(orderStatus).toEqual("Partially refunded");

        //verify net payment, refund to buyer, paid by customer
        actualTotalOrder = await orderPage.getTotalOrder();
        actualTotalOrder = removeCurrencySymbol(actualTotalOrder);

        let actualPaidByCustomer = await orderPage.getPaidByCustomer();
        actualPaidByCustomer = removeCurrencySymbol(actualPaidByCustomer);

        actRefundToBuyer = await orderPage.getRefundToCustomer();
        const actNetPayment = await orderPage.getNetPaymentValue();

        expect(actualPaidByCustomer).toEqual(actualTotalOrder);
        //Payment fee = total amount * 3%
        expect(actNetPayment.toFixed(2)).toEqual((parseFloat(actualTotalOrder) * 0.03).toFixed(2));
        expect(actRefundToBuyer.toFixed(2)).toEqual((parseFloat(actualTotalOrder) - actNetPayment).toFixed(2));

        //verify profit
        let actProfit = await orderPage.getProfit();
        actProfit = removeCurrencySymbol(actProfit);
        expect(isEqual(parseFloat(actProfit), 0, 0.01)).toEqual(true);

        //verify timeline
        const ordTimelineCancelOrd = buildOrderTimelineMsg(firstName, lastName, email).timelineCancelOrdPbase;
        const ordTimelineSentMailCancel = buildOrderTimelineMsg(firstName, lastName, email).timelineSentCancelMailPbase;
        await expect(await orderPage.orderTimeLines(ordTimelineCancelOrd)).toBeVisible();
        await expect(await orderPage.orderTimeLines(ordTimelineSentMailCancel)).toBeVisible();
      });

      /* API analytics need a few minute to return correct data. But recently it's not stable
        I mean adding hard step wait timeout is not stable and lengthen test case.
        Then disable this step for suitable solution      
      await test.step(`- Vào Analytics > Verify Total profit`, async () => {
        // verify total profit and total order after cancel order
        let analyticsInfo;
        // api analytics need a few minute to return correct data. in case will call api 6 times every 5 seconds
        for (let i = 0; i <= 6; i++) {
          // eslint-disable-next-line playwright/no-wait-for-timeout
          await page.waitForTimeout(5000);
          analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
        }
        const totalProfitAfter = await analyticsInfo.total_profit;
        const totalOrderAfter = await analyticsInfo.total_order;
        expect(totalOrderAfter).toEqual(totalOrderBefore + 1);
        expect(isEqual(totalProfitAfter, totalProfitBefore, 0.01)).toEqual(true);
      });
      */

      await test.step(`
        - Tại order detail > Action > Chọn action view invoice
        - Verify transaction`, async () => {
        const requestObj = await authRequestWithExchangeToken.changeToken();
        orderApi = new OrderAPI(domain, requestObj);
        dashboardAPI = new DashboardAPI(domain, requestObj, dashboard);
        // verify invoice transaction
        await orderPage.viewInvoice();
        const listTransAmt = await dashboardAPI.getOrderTransAmt();
        let totalTransAmt = 0;
        for (let i = 0; i < listTransAmt.length; i++) {
          totalTransAmt += listTransAmt[i];
        }
        expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);

        /* Cmt for the same reason above
        // verify balance amount
        const balanceAmtAfter = await dashboardAPI.getTotalBalance();
        expect(isEqual(balanceAmtAfter, balanceAmtBefore, 0.01)).toEqual(true);
        */
      });

      await test.step(`
        Tại order detail của order > Lấy ra transaction ID
        - Mở F12 > Network
        - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
        Vào Stripe dashboard > search theo transaction ID > Verify transaction `, async () => {
        // verify order status, refund amount in stripe dashboard
        await orderApi.getTransactionId(orderId);
        if (gatewayCode === "platform") {
          secretKey = conf.suiteConf.secret_key_spay;
        }
        const ordInfo = await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAcc,
        });
        const ordStatus = ordInfo.ordRefundStatus;
        let ordRefundAmt = ordInfo.ordRefundAmt;
        ordRefundAmt = Number((ordRefundAmt / 100).toFixed(2));
        expect(ordStatus).toEqual("refund");
        expect(ordRefundAmt).toEqual(Number(actRefundToBuyer));
      });
    },
  );
});
