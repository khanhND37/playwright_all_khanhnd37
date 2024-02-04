import { expect, test } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import type { RefundInfo } from "@types";

let orderName: string;
let totalSF: number;
let shippingSF: string | number;
let checkout: SFCheckout;
let accessToken: string;
let orderId: number;
let refundAmountDB: number;
let orderPage: OrdersPage;
let refundInfo: RefundInfo;

test.describe("Test Refund, Cancel, Fulfill order checkout bằng Oceanpayment method", () => {
  test.beforeEach(async ({ page, conf }) => {
    checkout = new SFCheckout(page, conf.suiteConf.domain, "");
    const infoOrder = await checkout.createOceanPaymentOrder(
      conf.suiteConf.product_info,
      conf.suiteConf.customer_info,
      conf.suiteConf.discount.code,
      conf.suiteConf.card_info,
    );
    orderName = infoOrder.orderName;
    totalSF = infoOrder.totalSF;
    shippingSF = infoOrder.shippingSF;
  });

  test.beforeEach(async ({ conf, token }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
  });

  test("Verify việc refund một order checkout bằng oceanpayment method @SB_CHE_OCP_6", async ({ page, conf }) => {
    refundInfo = {
      shipping_fee: shippingSF.toString(),
      product_qty: conf.caseConf.refund_info.product_qty,
      reason: conf.caseConf.refund_info.reason,
    };

    await test.step("Trong dashboard, đi đến trang order detail của product vừa checkout", async () => {
      orderPage = new OrdersPage(page, conf.suiteConf.domain);
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
    });

    await test.step("Thực hiện refund order", async () => {
      await orderPage.waitForPaymentStatusIsPaid();
      refundAmountDB = await orderPage.refundOrder(refundInfo);
    });

    await test.step("Verify order detail sau khi refund thành công", async () => {
      const netPayment = (await orderPage.getNetPayment()).replace("$", "");
      const refunded = (await orderPage.getTotalRefundedOnOrderDetail()).replace("-$", "");
      expect(await orderPage.page.innerText(orderPage.orderStatus)).toEqual("Refunded");

      //Verify total order sau khi refund
      expect(netPayment).toContain(orderPage.netPayment(totalSF, refundAmountDB).toString());
      expect(refunded).toContain(refundAmountDB.toString());

      //Verify timeline sau khi refunnd order
      //Neu khong tim thay text Refund thi reload
      for (let i = 0; i < 5; i++) {
        try {
          await expect(orderPage.getXpathTextRefundInTimeline(refundAmountDB.toString()).first()).toBeVisible();
          break;
        } catch {
          await orderPage.page.reload();
        }
      }

      //Verify trạng thái order ở màn order list
      await test.step("Đi đến trang All product > kiểm tra trạng thái order Payment status của order vừa refund", async () => {
        await orderPage.goToOrderListFromOrderDetail();
        const orderPaymentStatus = await orderPage.getPaymentStatusInOrderList(orderName);
        expect(orderPaymentStatus).toEqual("Refunded");
      });
    });
  });

  test("Cancel order checkout qua Oceanpayment @SB_CHE_OCP_7", async ({ page, conf }) => {
    const cancelWith = totalSF;
    await test.step("Trong dashboard, đi đến trang order detail của product vừa checkout", async () => {
      orderPage = new OrdersPage(page, conf.suiteConf.domain);
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
    });

    await test.step("Thực hiện cancel order", async () => {
      await orderPage.waitForPaymentStatusIsPaid();
      await orderPage.cancelOrder(cancelWith);
    });

    await test.step("Verify order detail sau khi cancel order", async () => {
      //Verify hiển thị các action có thể thực hiện trên 1 order sau khi cancel order
      await orderPage.waitUntilElementVisible(orderPage.printOrder);
      await orderPage.genLoc(orderPage.xpathMoreActions).click();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("Edit order"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("Archive"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("View order status page"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("Cancel order"))).toBeHidden();

      //Cancel, Refund, Partially Refund thì không fulfill được
      await expect(orderPage.genLoc(orderPage.xpathBtnMarkAsFulfilled)).toBeHidden();

      //Verify total sau khi cancel order
      const netPayment = (await orderPage.getNetPayment()).replace("$", "");
      const refunded = (await orderPage.getTotalRefundedOnOrderDetail()).replace("-$", "");
      expect(netPayment).toContain(orderPage.netPayment(totalSF, cancelWith).toString());
      expect(refunded).toContain(cancelWith.toString());

      //Verify time line sau khi cancel order thành công
      for (let i = 0; i < 5; i++) {
        const isXpathBtnResendEmailVisible = await orderPage.genLoc(orderPage.xpathBtnResendEmail).isVisible();
        if (!isXpathBtnResendEmailVisible) {
          await orderPage.page.waitForTimeout(conf.suiteConf.time_out);
          await orderPage.page.reload();
          await orderPage.page.waitForSelector(orderPage.orderStatus);
        }
      }
      await expect(
        orderPage.getLocatorTimelineSendEmail(
          conf.suiteConf.customer_info.first_name,
          conf.suiteConf.customer_info.last_name,
          conf.suiteConf.customer_info.email,
        ),
      ).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathBtnResendEmail)).toBeVisible();
      await expect(orderPage.getLocatorTextRefundAmountInTimeline(cancelWith)).toBeVisible();
      await expect(orderPage.getLocatorReasonCancelInTimeline(conf.caseConf.timeline_reason)).toBeVisible();
    });

    //Verify trạng thái order tại màn order list sau khi cancel order thành công
    await test.step("Đi đến trang All product > kiểm tra trạng thái order Payment status của order mới cancel", async () => {
      await orderPage.goToOrderListFromOrderDetail();
      const orderPaymentStatus = await orderPage.getPaymentStatusInOrderList(orderName);
      expect(orderPaymentStatus).toEqual("Refunded");
    });
  });

  test("Test fulfill order thanh toán bằng Ocean payment @SB_CHE_OCP_9", async ({ page, conf }) => {
    await test.step("Mở order detail", async () => {
      orderPage = new OrdersPage(page, conf.suiteConf.domain);
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
    });

    await test.step("Thực hiện fulfill một phần order", async () => {
      await orderPage.markAsFulfillOrd(conf.caseConf.tracking_info, conf.caseConf.product_fulfillment);
      expect(await orderPage.page.innerText(orderPage.xpathToastMessage)).toEqual("Line item(s) have been fulfilled");
    });

    await test.step("Kiểm tra trạng thái order, các line item sau khi fulfill 1 phần", async () => {
      /***** Assertion trạng thái order ******/
      await orderPage.waitUntilElementVisible(orderPage.printOrder);
      expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Partially Fulfilled");
      await orderPage.genLoc(orderPage.xpathMoreActions).click();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("Edit order"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("Archive"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathMoreActionWithLabel("View order status page"))).toBeVisible();

      /***** Assertion Item của order chưa fulfill******/
      await expect(
        orderPage.genLoc(orderPage.xpathBtnWithLabelOnBlockUnfulfilledOrFulfilled("Unfulfilled", "Hold order")),
      ).toBeVisible();
      await expect(
        orderPage.genLoc(orderPage.xpathBtnWithLabelOnBlockUnfulfilledOrFulfilled("Unfulfilled", "Fulfill with")),
      ).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathBtnMarkAsFulfilled)).toBeVisible();

      /***** Assertion Item của order đã fulfill******/
      await expect(
        orderPage.genLoc(orderPage.xpathBtnWithLabelOnBlockUnfulfilledOrFulfilled("Fulfilled", "Cancel fulfillment")),
      ).toBeVisible();
      await expect(
        orderPage.genLoc(orderPage.xpathBtnWithLabelOnBlockUnfulfilledOrFulfilled("Fulfilled", "Track shipment")),
      ).toBeVisible();
      await expect(
        orderPage.genLoc(orderPage.xpathBtnWithLabelOnBlockUnfulfilledOrFulfilled("Fulfilled", "Edit tracking")),
      ).toBeVisible();

      /***** Assertion for timeline order after fulfill successfuly******/
      for (let i = 0; i < 5; i++) {
        const textMarkItemAsFulfillInTimeline = await orderPage
          .getLocatorTextMarkItemAsFulfillInTimeline(conf.caseConf.product_fulfillment[0].quantities)
          .isVisible();
        if (!textMarkItemAsFulfillInTimeline) {
          await orderPage.page.waitForTimeout(conf.suiteConf.time_out);
          await orderPage.page.reload();
          await orderPage.page.waitForSelector(orderPage.orderStatus);
        }
      }
      await expect(
        orderPage.getLocatorTextMarkItemAsFulfillInTimeline(conf.caseConf.product_fulfillment[0].quantities),
      ).toBeVisible();

      for (let i = 0; i < 5; i++) {
        const isXpathBtnResendEmailVisible = await orderPage.genLoc(orderPage.xpathBtnResendEmail).isVisible();
        if (!isXpathBtnResendEmailVisible) {
          await orderPage.page.waitForTimeout(conf.suiteConf.time_out);
          await orderPage.page.reload();
          await orderPage.page.waitForSelector(orderPage.orderStatus);
        }
      }
      await expect(
        orderPage.getLocatorTextSendEmailConfirmShippingInTimeline(
          conf.suiteConf.customer_info.first_name,
          conf.suiteConf.customer_info.last_name,
          conf.suiteConf.customer_info.email,
        ),
      ).toBeVisible();
    });

    //Verify trạng thái order tại màn order list sau khi fulfill 1 phần order thành công
    await test.step("Đi đến trang All product > kiểm tra trạng thái Fulfillment Status của order trên", async () => {
      await orderPage.goToOrderListFromOrderDetail();
      expect(await orderPage.getFulfillmentStatusInOrderList(orderName)).toEqual("Partially Fulfilled");
    });

    await test.step("Đi đến trang order detail và thực hiện fulfill hết phần còn lại của order > kiểm tra trạng thái fulfillment status của order", async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      await orderPage.markAsFulfillOrd(conf.caseConf.tracking_info, conf.caseConf.product_fulfillment);
      expect(await orderPage.page.innerText(orderPage.xpathToastMessage)).toEqual("Line item(s) have been fulfilled");
      await orderPage.waitUntilElementVisible(orderPage.printOrder);
      expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Fulfilled");
    });

    //Verify trạng thái order tại màn order list sau khi fulfill hết order thành công
    await test.step("Đi đến trang All product > kiểm tra trạng thái Fulfillment Status của order trên", async () => {
      await orderPage.goToOrderListFromOrderDetail();
      expect(await orderPage.getFulfillmentStatusInOrderList(orderName)).toEqual("Fulfilled");
    });
  });
});
