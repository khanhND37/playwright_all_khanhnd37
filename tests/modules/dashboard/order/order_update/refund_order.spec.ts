import { removeCurrencySymbol } from "@core/utils/string";
import { genOrderTimelineXpath } from "@utils/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { MailBox } from "@pages/thirdparty/mailbox";
import { CheckoutAPI } from "@pages/api/checkout";
import { expect, test } from "@core/fixtures";
import type { RefundInfo } from "@types";
import { PaymentProviders } from "@pages/api/payment_providers";
import { AccountSetting } from "@pages/dashboard/account_setting";

test.describe("Refund order", () => {
  //Define variable
  let productInfo, shippingAddress;
  let email: string;
  let orderId: number;
  let accName: string;
  let orderName: string;
  let shippingSF: number;
  let accessToken: string;
  let actAmountRefunded: number;
  let refundQuantity: number;
  let refundInfo: RefundInfo;

  let mailbox: MailBox;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let checkoutAPI: CheckoutAPI;
  let patmentSetting: PaymentProviders;
  let account: AccountSetting;

  test.beforeEach(async ({ page, dashboard, conf, token, request, authRequest }) => {
    //Define variable
    const domain = conf.suiteConf.domain;
    const cardInfo = conf.suiteConf.card_info;
    const tippingInfo = conf.suiteConf.tipping_info;
    const discountCode = conf.suiteConf.discount_code;

    email = conf.suiteConf.email;
    productInfo = conf.suiteConf.product_info;
    refundQuantity = conf.caseConf.refund_quantity;
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
    orderPage = new OrdersPage(dashboard, domain);
    checkoutAPI = new CheckoutAPI(domain, request);
    patmentSetting = new PaymentProviders(domain, authRequest);
    account = new AccountSetting(dashboard, domain);
    mailbox = new MailBox(page, domain);

    //get shop profile name
    accName = await account.getProfileName();

    //Update capture payment to auto capture
    await patmentSetting.updateCapturePayment("auto");

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
    shippingSF = checkoutInfo.totals.total_shipping;
  });
  test(`@TC_SB_ORD_ODU_198 - Kiểm tra order detail khi refund tất cả giá trị đơn hàng`, async () => {
    refundInfo = {
      shipping_fee: shippingSF.toString(),
      product_qty: refundQuantity.toString(),
      is_refund_tip: true,
    };
    await test.step(`
      Merchant vào dashboard order và chọn action refund item
      -Nhập số lượng item
      -Nhập refund shipping
      -Reason for refund this order:
      -Send notification to the customer:
      Merchant chọn button refund order`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus);
      await orderPage.refundOrder(refundInfo);
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Refund succeeded`));
    });

    await test.step(`Kiểm tra thông tin order dau khi refund order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Refunded")).toBeVisible();

      /***** Assertion for Net Payment and Refunded fields ******/
      const totalAmt = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
      actAmountRefunded = Number(removeCurrencySymbol(await orderPage.getRefundedAmount()));
      const actNetPayment = Number(removeCurrencySymbol(await orderPage.getNetPayment()));

      expect(Math.abs(actAmountRefunded)).toEqual(totalAmt);
      expect(actNetPayment).toEqual(0);

      /***** Assertion for actions after refund ******/
      await orderPage.moreActionLoc.click();
      await expect(orderPage.genOrderActionLoc("View order status page")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeHidden();
      await expect(orderPage.genOrderActionLoc("Cancel order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Edit order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Archive")).toBeVisible();

      /***** Assertion for show timeline after refund ******/
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        cancelAmt: totalAmt.toFixed(2),
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcRefundedOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentEmailRefund)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName);
      expect(orderStatus).toEqual("refunded");
    });

    await test.step(`Buyer mở email refund gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      mailbox = await checkout.openMailBox(email);
      await mailbox.openRefundNotification();
      const actRefundAmt = await mailbox.getRefundAmount();
      expect(removeCurrencySymbol(actRefundAmt)).toEqual(`-${actAmountRefunded.toFixed(2)}`);
    });
  });

  test(`@TC_SB_ORD_ODU_199 - 	Kiểm tra order detail khi refund order một phần giá trị đơn hàng và một phần giá shipping`, async () => {
    await test.step(`
      Merchant vào dashboard order và chọn action refund item
      -Nhập số lượng item
      -Nhập refund shipping
      -Reason for refund this order:
      -Send notification to the customer:
      Merchant chọn button refund order`, async () => {
      refundInfo = {
        shipping_fee: (shippingSF / 2).toString(),
        product_qty: refundQuantity.toString(),
        is_refund_tip: true,
      };
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture(orderStatus, 5);
      await orderPage.refundOrder(refundInfo);
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Refund succeeded`));
    });

    await test.step(`Kiểm tra thông tin order dau khi refund order`, async () => {
      /***** Assertion for Status Order ******/
      await expect(orderPage.genOrderStatusLoc("Partially refunded")).toBeVisible();

      /***** Assertion for Net Payment and Refunded fields ******/
      actAmountRefunded = Number(removeCurrencySymbol(await orderPage.getRefundedAmount()));
      const actNetPayment = Number(removeCurrencySymbol(await orderPage.getNetPayment()));
      const subTotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      const totalAmt = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
      const tippingAmt = Number(removeCurrencySymbol(await orderPage.getTip()));

      //Expected refund amount = (tipping amount + shipping fee / 2 + subtotal * (refund quantity / total quantity))
      const expRefundAmt =
        tippingAmt + shippingSF / 2 + subTotal * (Number(refundQuantity) / Number(productInfo[0].quantity));
      expect(Math.abs(actAmountRefunded)).toEqual(Number(expRefundAmt.toFixed(2)));
      expect(actNetPayment).toEqual(totalAmt - Number(expRefundAmt.toFixed(2)));

      /***** Assertion for actions after refund ******/
      await orderPage.moreActionLoc.click();
      await expect(orderPage.genOrderActionLoc("View order status page")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Mark as fulfilled")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Cancel order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Edit order")).toBeVisible();
      await expect(orderPage.genOrderActionLoc("Archive")).toBeVisible();

      /***** Assertion for show timeline after refund ******/
      await orderPage.page.reload();
      await orderPage.page.waitForSelector("//h2[contains(text(), 'Order')]|//h3[contains(text(), 'Order')]");
      const orderTimeLine = genOrderTimelineXpath({
        email: email,
        accName: accName,
        lastName: shippingAddress.last_name,
        firstName: shippingAddress.first_name,
        cancelAmt: expRefundAmt.toFixed(2),
      });
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcRefundedOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLine.timelineMcSentEmailRefund)).toBeVisible();
    });

    await test.step(`Merchant view all order`, async () => {
      /***** Assertion order status in order list ****/
      await orderPage.goto("admin/orders");
      const orderStatus = await orderPage.getOrderInfoBy(orderName);
      expect(orderStatus).toEqual("partially refunded");
    });

    await test.step(`Buyer mở email refund gửi cho buyer`, async () => {
      /***** Assertion order refund amount in mail box ****/
      await mailbox.openRefundNotification(email);
      const actRefundAmt = await mailbox.getRefundAmount();
      expect(removeCurrencySymbol(actRefundAmt)).toEqual(actAmountRefunded.toFixed(2));
    });
  });
});
