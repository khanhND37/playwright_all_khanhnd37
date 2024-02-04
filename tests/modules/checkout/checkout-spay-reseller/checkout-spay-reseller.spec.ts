import { test, expect } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { OrdersPage } from "@pages/dashboard/orders";
import { Card, CheckoutInfo, Product } from "@types";

let domain: string;
let orderPage: OrdersPage;
let orderAPI: OrderAPI;
let productCheckout: Array<Product>;
let checkoutInfo: CheckoutInfo;
let checkoutAPI: CheckoutAPI;
let cardInfo: Card;
let orderId: number;
let secretKey: string, gatewayCode: string;
let paymentIntendID: string;
let trackingInfo;

test.beforeEach(async ({ conf, dashboard, authRequest }) => {
  domain = conf.suiteConf.domain;
  productCheckout = conf.suiteConf.product_info;
  cardInfo = conf.suiteConf.card_info;
  checkoutAPI = new CheckoutAPI(domain, authRequest);
  orderPage = new OrdersPage(dashboard, domain);
  orderAPI = new OrderAPI(domain, authRequest);

  checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
    productsCheckout: productCheckout,
    cardInfo: cardInfo,
  });
  orderId = checkoutInfo.order.id;
  gatewayCode = "platform";
  secretKey = conf.suiteConf.secret_key_smp;
  trackingInfo = conf.caseConf.tracking_info;
});

test(`@SB_CHE_SPAY3_17 Check tracking number sync từ Spay Reseller lên Stripe transaction với 1 tracking number cho cả order`, async () => {
  await test.step(`Nhập tracking number > Fulfill order`, async () => {
    await orderPage.goToOrderByOrderId(orderId);
    const totalOrder = await orderPage.getTotalOrder();
    await orderPage.captureOrder(removeCurrencySymbol(totalOrder));
    await orderPage.markAsFulfillOrd(trackingInfo);
    const actStatus = orderPage.genOrderStatusLoc("Fulfilled").isVisible();
    expect(actStatus).toBeTruthy();
  });

  await test.step(`Vào Stripe dashboard, check tracking number của transaction`, async () => {
    await orderAPI.getTransactionId(orderId);
    paymentIntendID = orderAPI.paymentIntendId;
    const connectedAcc = await orderAPI.getConnectedAccInOrder(orderId);
    const orderInfo = await orderAPI.getOrdInfoInStripe({
      key: secretKey,
      gatewayCode: gatewayCode,
      connectedAcc: connectedAcc,
      paymentIntendId: paymentIntendID,
      isHaveTrackingNumber: true,
    });
    expect(orderInfo.ordTrackingNumber).toBe(trackingInfo.number);
  });
});
