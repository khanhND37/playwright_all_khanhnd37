import { PaymentProviders } from "@pages/api/payment_providers";
import { removeCurrencySymbol } from "@core/utils/string";
import { SFCheckout } from "@pages/storefront/checkout";
import { genOrderTimelineXpath } from "@utils/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { MailBox } from "@pages/thirdparty/mailbox";
import { CheckoutAPI } from "@pages/api/checkout";
import { expect, test } from "@core/fixtures";
import type { CaptureInfo } from "@types";
import { AccountSetting } from "@pages/dashboard/account_setting";

test.describe("Cancel order", () => {
  //Defind variable
  let productInfo, shippingAddress;
  let email: string;
  let orderId: number;
  let accName: string;
  let cancelAmt: number;
  let orderName: string;
  let partiallyCancelAmount: number;
  let mailbox: MailBox;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let checkoutAPI: CheckoutAPI;
  let patmentSetting: PaymentProviders;
  let captureInfo: CaptureInfo;
  let account: AccountSetting;

  test.beforeEach(async ({ page, dashboard, conf, request, authRequest }) => {
    //Define variable
    const domain = conf.suiteConf.domain;
    const cardInfo = conf.suiteConf.card_info;
    const tippingInfo = conf.suiteConf.tipping_info;
    const discountCode = conf.suiteConf.discount_code;

    email = conf.suiteConf.email;
    productInfo = conf.suiteConf.product_info;
    shippingAddress = conf.suiteConf.shipping_address;
    captureInfo = conf.caseConf.capture_info;

    //Init page
    checkout = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    checkoutAPI = new CheckoutAPI(domain, request);
    patmentSetting = new PaymentProviders(domain, authRequest);
    account = new AccountSetting(dashboard, domain);

    //get shop profile name
    accName = await account.getProfileName();

    //Update capture payment to auto capture
    if (captureInfo) {
      await patmentSetting.updateCapturePayment(captureInfo.type, captureInfo);
    }

    //Create order by API
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: productInfo,
      customerInfo: { emailBuyer: email, shippingAddress: shippingAddress },
      cardInfo: cardInfo,
      discount: discountCode,
      tipping: tippingInfo,
    });

    //Get order info
    orderId = checkoutInfo.order.id;
    orderName = checkoutInfo.order.name;
    cancelAmt = checkoutInfo.totals.total_price;
    cancelAmt = Number(cancelAmt.toFixed(2));
    partiallyCancelAmount = cancelAmt / 2;
  });
  test(`@TC_SB_ORD_ODU_192 - Kiểm tra order detail khi cancel tất cả giá trị đơn hàng  với payment status có trạng thái paid`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Cancel order
      - Nhập số tiền cacel (Refund with): total order
      - Merchant chọn button cancel order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 10);
      await orderPage.cancelOrder(cancelAmt);
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Order has been canceled`));
    });

    await test.step(`Kiểm tra thông tin order dau khi cancel order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Refunded")).toBeVisible();
      await expect(orderPage.genOrderStatusLoc("Cancelled")).toBeVisible();

      /***** Assertion for Net Payment and Refunded fields ******/
      const totalAmt = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
      const actNetPayment = Number(removeCurrencySymbol(await orderPage.getNetPayment()));
      const actAmountRefunded = Number(removeCurrencySymbol(await orderPage.getRefundedAmount()));

      expect(Math.abs(actAmountRefunded)).toEqual(cancelAmt);
      expect(actNetPayment).toEqual(totalAmt - cancelAmt);

      /***** Assertion for actions after cancel ******/
      await orderPage.moreActionLoc.click();
      await expect(orderPage.genOrderActionLoc("View order status page")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Edit order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Archive")).toBeVisible();

      /***** Assertion for show timeline after cancel ******/
      await orderPage.page.reload();
      await orderPage.page.waitForSelector("//h2[contains(text(), 'Order')]|//h3[contains(text(), 'Order')]");
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        cancelAmt: cancelAmt.toFixed(2),
        firstName: shippingAddress.first_name,
        lastName: shippingAddress.last_name,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcCancelOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcRefundedOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentEmailCancel)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName);
      expect(orderStatus).toEqual("refunded");
    });

    await test.step(`Buyer mở email canceled gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      await mailbox.openOrderCanceledNotification(orderName);
      const actRefundAmt = await mailbox.getRefundAmount();
      expect(removeCurrencySymbol(actRefundAmt)).toEqual(`-${cancelAmt.toFixed(2)}`);
    });
  });

  test(`@SB_ORD_ODU_196	- Kiểm tra order detail khi cancel order một phần giá trị đơn hàng với payment status có trạng thái paid`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Cancel order
      - Nhập số tiền cacel (Refund with): total order
      - Merchant chọn button cancel order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 5);
      await orderPage.cancelOrder(partiallyCancelAmount);
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Order has been canceled`));
    });

    await test.step(`Kiểm tra thông tin order dau khi cancel order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Partially refunded")).toBeVisible();
      await expect(orderPage.genOrderStatusLoc("Cancelled")).toBeVisible();

      /***** Assertion for Net Payment and Refunded fields ******/
      const totalAmt = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
      const actNetPayment = Number(removeCurrencySymbol(await orderPage.getNetPayment()));
      const actAmountRefunded = Number(removeCurrencySymbol(await orderPage.getRefundedAmount()));

      expect(Math.abs(actAmountRefunded)).toEqual(partiallyCancelAmount);
      expect(actNetPayment).toEqual(totalAmt - partiallyCancelAmount);

      /***** Assertion for actions after cancel ******/
      await orderPage.moreActionLoc.click();
      await expect(orderPage.genOrderActionLoc("View order status page")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Edit order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Archive")).toBeVisible();

      /***** Assertion for show timeline after cancel ******/
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        cancelAmt: partiallyCancelAmount.toFixed(2),
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcCancelOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcRefundedOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentEmailCancel)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName);
      expect(orderStatus).toEqual("partially refunded");
    });

    await test.step(`Buyer mở email canceled gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      await mailbox.openOrderCanceledNotification(orderName);
      const actRefundAmt = await mailbox.getRefundAmount();
      expect(removeCurrencySymbol(actRefundAmt)).toEqual(`-${partiallyCancelAmount.toFixed(2)}`);
    });
  });
});

test.describe("Cancel order with authorized status", () => {
  //Defind variable
  let productInfo, shippingAddress;
  let email: string;
  let orderId: number;
  let accName: string;
  let cancelAmt: number;
  let orderName: string;
  let accessToken: string;
  let paymentMethod: string;
  let captureInfo: CaptureInfo;

  let mailbox: MailBox;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let checkoutAPI: CheckoutAPI;
  let patmentSetting: PaymentProviders;

  test.beforeEach(async ({ page, conf, token, request, authRequest }) => {
    //Define variable
    const domain = conf.suiteConf.domain;
    const tippingInfo = conf.suiteConf.tipping_info;
    const discountCode = conf.suiteConf.discount_code;

    email = conf.suiteConf.email;
    accName = conf.suiteConf.account_name;
    productInfo = conf.suiteConf.product_info;

    captureInfo = conf.caseConf.capture_info;
    paymentMethod = conf.caseConf.payment_method;
    shippingAddress = conf.suiteConf.shipping_address;

    //Get shop token
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    //Init page
    checkout = new SFCheckout(page, domain);
    orderPage = new OrdersPage(page, domain);
    checkoutAPI = new CheckoutAPI(domain, request, page);
    patmentSetting = new PaymentProviders(domain, authRequest);

    //Update capture payment to manual capture
    if (captureInfo) {
      await patmentSetting.updateCapturePayment(captureInfo.type, captureInfo);
    }

    //Create order by API
    await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
    await checkoutAPI.applyDiscountByApi(discountCode);
    await checkoutAPI.addTipping(tippingInfo);
    await checkoutAPI.openCheckoutPageByToken();
    await checkout.completeOrderWithMethod(paymentMethod);

    orderId = await checkout.getOrderIdBySDK();
    orderName = await checkout.getOrderName();
    cancelAmt = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
  });
  test(`@SB_ORD_ODU_193 - Kiểm tra order detail khi cancel tất cả giá trị đơn hàng với payment status có trạng thái authorized`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Cancel order
      - Nhập số tiền cacel (Refund with): total order
      - Merchant chọn button cancel order`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      await orderPage.cancelOrder(cancelAmt);
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Order has been canceled`));
    });

    await test.step(`Kiểm tra thông tin order dau khi cancel order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Cancelled")).toBeVisible();
      await expect(orderPage.genOrderStatusLoc("Voided")).toBeVisible();

      /***** Assertion for Net Payment and Refunded fields ******/
      const actNetPayment = Number(removeCurrencySymbol(await orderPage.getNetPayment()));

      expect(actNetPayment).toEqual(0);

      /***** Assertion for actions after cancel ******/
      await orderPage.moreActionLoc.click();
      await expect(orderPage.genOrderActionLoc("View order status page")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Edit order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Archive")).toBeVisible();

      /***** Assertion for show timeline after cancel ******/
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        cancelAmt: cancelAmt.toFixed(2),
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcCancelOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentEmailCancel)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName);
      expect(orderStatus).toEqual("voided");
    });

    await test.step(`Buyer mở email canceled gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      const isCancelEmailSent = await mailbox.openOrderCanceledNotification(orderName);
      expect(isCancelEmailSent).toEqual(true);
    });

    await test.step(`Reset data`, async () => {
      //Reset capture payment to auto capture
      if (captureInfo.type === "manual") {
        captureInfo.type = "auto";
        await patmentSetting.updateCapturePayment(captureInfo.type, captureInfo);
      }
    });
  });

  test(`@SB_ORD_ODU_194 - Kiểm tra order detail khi cancel tất cả giá trị đơn hàng với payment status có trạng thái pending`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Cancel order
      - Nhập số tiền cacel (Refund with): total order
      - Merchant chọn button cancel order`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      await orderPage.cancelOrder(cancelAmt);
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Order has been canceled`));
    });

    await test.step(`Kiểm tra thông tin order dau khi cancel order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Cancelled")).toBeVisible();
      await expect(orderPage.genOrderStatusLoc("Voided")).toBeVisible();

      /***** Assertion for Net Payment and Refunded fields ******/
      const actNetPayment = Number(removeCurrencySymbol(await orderPage.getNetPayment()));

      expect(actNetPayment).toEqual(0);

      /***** Assertion for actions after cancel ******/
      await orderPage.moreActionLoc.click();
      await expect(orderPage.genOrderActionLoc("View order status page")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Archive")).toBeVisible();

      /***** Assertion for show timeline after cancel ******/
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        cancelAmt: cancelAmt.toFixed(2),
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcCancelOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentEmailCancel)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName);
      expect(orderStatus).toEqual("voided");
    });

    await test.step(`Buyer mở email canceled gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      const isCancelEmailSent = await mailbox.openOrderCanceledNotification(orderName);
      expect(isCancelEmailSent).toEqual(true);
    });
  });
});
