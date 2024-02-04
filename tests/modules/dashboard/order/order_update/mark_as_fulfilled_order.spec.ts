import { genOrderTimelineXpath } from "@core/utils/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { MailBox } from "@pages/thirdparty/mailbox";
import { CheckoutAPI } from "@pages/api/checkout";
import { expect, test } from "@core/fixtures";
import { PaymentProviders } from "@pages/api/payment_providers";
import { AccountSetting } from "@pages/dashboard/account_setting";

test.describe("Fulfill order", () => {
  //Defind variable
  let fulfillInfo, shippingAddress, trackingInfo, nullTrackingInfo;
  let email: string;
  let orderId: number;
  let accName: string;
  let orderName: string;
  let accessToken: string;
  let mailbox: MailBox;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let checkoutAPI: CheckoutAPI;
  let patmentSetting: PaymentProviders;
  let account: AccountSetting;

  test.beforeEach(async ({ page, dashboard, conf, token, request, authRequest }) => {
    //Defind variable
    const domain = conf.suiteConf.domain;
    const cardInfo = conf.suiteConf.card_info;
    const productInfo = conf.suiteConf.product_info;

    email = conf.suiteConf.email;
    trackingInfo = conf.suiteConf.tracking_info;
    shippingAddress = conf.suiteConf.shipping_address;

    fulfillInfo = conf.caseConf.fulfill_info;
    nullTrackingInfo = conf.caseConf.tracking_info;

    //Get shop token
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    //Init page
    checkout = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    checkoutAPI = new CheckoutAPI(domain, request);
    patmentSetting = new PaymentProviders(domain, authRequest);
    account = new AccountSetting(dashboard, domain);

    //get shop profile name
    accName = await account.getProfileName();

    //Update capture payment to auto capture
    await patmentSetting.updateCapturePayment("auto");

    //Create order by API
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: productInfo,
      customerInfo: { emailBuyer: email, shippingAddress: shippingAddress },
      cardInfo: cardInfo,
    });
    orderId = checkoutInfo.order.id;
    orderName = checkoutInfo.order.name;
  });
  test(`@TC_SB_ORD_ODU_201 - Kiểm tra order detail khi fulfill toàn bộ item trong order có status paid`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Fulfill order
      - Nhập số lượng item và thông tin tracking info
      - Merchant chọn button fulfill order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 5);
      await orderPage.markAsFulfillOrd(trackingInfo, fulfillInfo);
      await orderPage.waitForElementVisibleThenInvisible(
        orderPage.genXpathToastMsg(`Line item(s) have been fulfilled`),
      );
    });

    await test.step(`Kiểm tra thông tin order dau khi fulfill order`, async () => {
      //Reload order detail page to show all timeline
      await orderPage.page.reload();

      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Fulfilled")).toBeVisible();

      /***** Assertion for Order button after fulfill ******/
      await expect(orderPage.genOrderActionLoc("Cancel fulfillment")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Edit tracking")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Track shipment")).toBeVisible();

      /***** Assertion for show timeline after fulfill ******/
      const orderTimeLine = genOrderTimelineXpath({
        accName: accName,
        email: email,
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
        fulfillItem: fulfillInfo[0].quantities,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcFulfillOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentMailFulfill)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName, 5);
      expect(orderStatus).toEqual("Fulfilled");
    });

    await test.step(`Buyer mở email fulfill gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      const isMailFulfillOrderSent = await mailbox.openShipmentNotification(orderName);
      expect(isMailFulfillOrderSent).toEqual(true);
    });
  });

  test(`@TC_SB_ORD_ODU_205 - Kiểm tra order detail khi fulfill một vài item trong order có status paid`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Fulfill order
      - Nhập số lượng item và thông tin tracking info
      - Merchant chọn button fulfill order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 5);
      await orderPage.markAsFulfillOrd(trackingInfo, fulfillInfo);
      await orderPage.waitForElementVisibleThenInvisible(
        orderPage.genXpathToastMsg(`Line item(s) have been fulfilled`),
      );
    });

    await test.step(`Kiểm tra thông tin order dau khi fulfill order`, async () => {
      //Reload order detail page to show all timeline
      await orderPage.page.reload();

      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Partially Fulfilled")).toBeVisible();

      /***** Assertion for Order button after fulfill ******/
      await expect(orderPage.genOrderActionLoc("Cancel fulfillment")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Edit tracking")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Track shipment")).toBeVisible();

      /***** Assertion for show timeline after fulfill ******/
      const orderTimeLine = genOrderTimelineXpath({
        accName: accName,
        email: email,
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
        fulfillItem: fulfillInfo[0].quantities,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcFulfillOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentMailFulfill)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName, 5);
      expect(orderStatus).toEqual("Partially Fulfilled");
    });

    await test.step(`Buyer mở email fulfill gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      const isMailFulfillOrderSent = await mailbox.openShipmentNotification(orderName);
      expect(isMailFulfillOrderSent).toEqual(true);
    });
  });

  test(`@TC_SB_ORD_ODU_209 - Kiểm tra order detail khi cancel fulfillment`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Fulfill order
      - Nhập số lượng item và thông tin tracking info
      - Merchant chọn button fulfill order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 5);
      await orderPage.markAsFulfillOrd(trackingInfo, fulfillInfo);
      await orderPage.waitForElementVisibleThenInvisible(
        orderPage.genXpathToastMsg(`Line item(s) have been fulfilled`),
      );
    });

    await test.step(`
      - Merchant chọn button cancel fulfillment
      - Merchant click OK`, async () => {
      //Cancel fulfillment and verify for toast message success
      const isCancelFulfillmentSuccess = await orderPage.cancelFulfillment();
      expect(isCancelFulfillmentSuccess).toBe(true);
    });

    await test.step(`Kiểm tra thông tin order dau khi fulfill order`, async () => {
      //Reload order detail page to show all timeline
      await orderPage.page.reload();

      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Unfulfilled")).toBeVisible();

      /***** Assertion for Order button after cancel fulfill ******/
      await expect(orderPage.genOrderActionLoc("Edit tracking")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Track shipment")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Cancel fulfillment")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeVisible();

      /***** Assertion for show timeline after fulfill ******/
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
        fulfillItem: fulfillInfo[0].quantities,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineUnarchived)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcFulfillOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentMailFulfill)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMCCancelFulfillment)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName, 5);
      expect(orderStatus).toEqual("Unfulfilled");
    });
  });

  test(`@TC_SB_ORD_ODU_212 - Kiểm tra order detail khi không add tracking number`, async () => {
    await test.step(`
      - Merchant vào dashboard order và More actions > Fulfill order
      - Nhập số lượng item và thông tin tracking info
      - Merchant chọn button fulfill order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 5);
      await orderPage.markAsFulfillOrd(nullTrackingInfo);
      await orderPage.waitForElementVisibleThenInvisible(
        orderPage.genXpathToastMsg(`Line item(s) have been fulfilled`),
      );
    });

    await test.step(`Kiểm tra thông tin order dau khi fulfill order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Fulfilled")).toBeVisible();

      /***** Assertion for Order button after fulfill ******/
      await expect(orderPage.genOrderActionLoc("Cancel fulfillment")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Track shipment")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Edit tracking")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Add tracking")).toBeVisible();
    });

    await test.step(`Merchant add tracking info và save lại`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.genOrderActionLoc(`Add tracking`).click();
      await orderPage.addTrackingNumber();
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Edit success`));
    });

    await test.step(`Buyer mở email fulfill gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      const isMailFulfillOrderSent = await mailbox.openShipmentNotification(orderName);
      expect(isMailFulfillOrderSent).toEqual(true);
    });
  });

  test(`@TC_SB_ORD_ODU_213 - Kiểm tra order detail khi fulfill bằng cách select các order number`, async () => {
    await test.step(`Merchant vào dashboard order chọn order numaber và select action Mark as fulfilled`, async () => {
      await orderPage.goto(`admin/orders?x_key=${accessToken}`);
      await orderPage.genSelectOrderLoc(orderName).click();
      await orderPage.selectActionToOrder(`Mark as fulfilled`);
      await orderPage.page.reload();

      const orderStatus = await orderPage.getOrderInfoBy(orderName, 5);
      expect(orderStatus).toEqual("Fulfilled");
    });

    await test.step(`Merchant view order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Fulfilled")).toBeVisible();

      /***** Assertion for Order button after fulfill ******/
      await expect(orderPage.genOrderActionLoc("Add tracking")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
    });
  });
});
