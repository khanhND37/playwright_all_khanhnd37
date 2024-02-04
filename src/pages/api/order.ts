/* eslint-disable camelcase */
import { APIResponse, expect, request, APIRequestContext } from "@playwright/test";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {
  FraudInfo,
  ProfitLineItem,
  StripeOrderInfo,
  ManualCapture,
  FulfillApiResponse,
  FulfillOrderApiBody,
  EditOrderApiResponse,
  OrdInfoInStripe,
  Product,
  AuthRequestWithExchangeFixture,
  PaymentInfoInRazorpay,
  TransactionInfoInRazorpay,
} from "@types";
import { urlType } from "aws-sdk/clients/sts";
import { PaymentMethod } from "@sf_pages/checkout";
import { waitTimeout } from "@core/utils/api";

export class OrderAPI {
  domain: string;
  request: APIRequestContext;
  paymentIntendId: string;
  chargeId: string;
  accessToken: string;
  listPaymentIntendId: Array<string> = [];
  listChargeId: Array<string> = [];

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  async changeToken(authReqFixture: AuthRequestWithExchangeFixture) {
    const newReqInstance = await authReqFixture.changeToken();
    this.request = newReqInstance;
  }

  async getOrderInfo(orderId: number) {
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return {
      id: resBody.order.id,
      name: resBody.order.name,
      subtotal: resBody.order.subtotal_price,
      total: resBody.order.total_price,
      shipping: resBody.order.shipping_fee,
      lineItems: resBody.order.line_items,
      accountId: resBody.order.account_id,
      paymentProviderPayload: resBody.order.payment_provider_payload,
      shippingAddress: resBody.order.shipping_address,
      statusOrder: resBody.order.financial_status,
    };
  }

  /**
   * In orrder to get specific line item id by using variant id
   * @param orderId
   * @param variantID
   * @returns line item id
   */
  async getLineItemID(orderId: number): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/orders/edited/${orderId}.json`);
    expect(res.status()).toBe(200);
    const resBody = (await res.json()) as EditOrderApiResponse;
    const lineItemInfo = resBody?.order?.line_items;
    const lineItem = lineItemInfo.find(item => item.is_post_purchase_item === false);
    if (!lineItem) {
      return 0;
    }

    return lineItem.id;
  }

  /**
   * Get invoice data by order id
   * @param orderId
   * @returns invoice data
   */
  async getInvoiceByOrderId(orderId: number) {
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}/invoice.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * Get profit amount of specific line item when order have one or many item
   * @param orderId
   * @param lineItemID
   * @returns line item profit amount
   */
  async getProfitByLineItem(orderId: number, accessToken: string) {
    const res = await this.request.get(`https://${this.domain}/admin/orders/plusbase/${orderId}.json`, {
      params: {
        include_lines: true,
        access_token: accessToken,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const lineItemInfo = resBody.line_items;
    const lineItemID = await this.getLineItemID(orderId);
    // eslint-disable-next-line camelcase
    const profitLineItem = lineItemInfo.find(({ sb_line_item_id }) => sb_line_item_id === lineItemID).profit;
    return profitLineItem;
  }

  /**
   * Get profit line item PlusBase
   * @param orderId: Order's id
   * @param profitLineItem: profit match with product id
   */

  async getLineItemProfitPlbWithProdID(orderId: number, profitLineItem: ProfitLineItem): Promise<ProfitLineItem> {
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}.json?shop_type=plus_base`);
    if (res.ok()) {
      const pblOrder = await res.json();
      const lineItemRaw = pblOrder.order.line_items;
      // eslint-disable-next-line camelcase
      profitLineItem.sbase.profit = lineItemRaw.find(
        ({ product_id }) =>
          // eslint-disable-next-line camelcase
          product_id === profitLineItem.sbase.id,
      ).profit;
      profitLineItem.upsell.profit = lineItemRaw.find(
        ({ product_id }) =>
          // eslint-disable-next-line camelcase
          product_id === profitLineItem.upsell.id,
      ).profit;
      return profitLineItem;
    }
  }

  /**
   * Get transaction id (include payment intent id and charge id) by api to verify order info on Stripe dashboard
   * @param orderId
   * @param accessToken
   * @returns payment intent id
   */
  async getTransactionId(orderId: number, accessToken?: string): Promise<string> {
    const params = {};
    if (accessToken) {
      params["access_token"] = accessToken;
    }
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}/transactions.json`, {
      params,
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();

    this.paymentIntendId = await resBody.transactions.find(trans => trans.kind === "authorization").authorization;
    try {
      this.chargeId = await resBody.transactions.find(trans => trans.kind === "capture").authorization;
    } catch {
      return this.paymentIntendId;
    }
    return this.chargeId;
  }

  /**
   * The function `getTransactionIdInOrderJson` retrieves the transaction ID from an order in JSON
   * format.
   * @param {number} orderId
   * @param {string} [accessToken] - The `accessToken` parameter is an optional string
   * If no access token is provided, it will default to `null`.
   * @returns a Promise that resolves to a string.
   */
  async getTransactionIdInOrderJson(orderId: number, accessToken?: string): Promise<string> {
    const res = await this.request.get(`https://${this.domain}/admin/orders/edited/${orderId}.json`, {
      params: {
        access_token: accessToken || null,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.order.payment_provider_payload.auth_id;
  }

  /**
   * Get list transaction id (include payment intent id and charge id) (in case the order added PPC)
   * @param orderId
   * @param accessToken
   * @returns payment intent id
   */
  async getListTransactionId(orderId: number, accessToken = this.accessToken) {
    let listTransaction;
    this.listPaymentIntendId = [];
    this.listChargeId = [];
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}/transactions.json`, {
      params: {
        access_token: accessToken,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    listTransaction = await resBody.transactions.filter(trans => trans.kind === "authorization");
    for (const transaction of listTransaction) {
      this.listPaymentIntendId.push(transaction.authorization);
    }
    try {
      listTransaction = await resBody.transactions.filter(trans => trans.kind === "capture");
      if (listTransaction.length === 0) {
        return this.listPaymentIntendId;
      }
      for (const transaction of listTransaction) {
        this.listChargeId.push(transaction.authorization);
      }
      return this.listChargeId;
    } catch {
      return this.listPaymentIntendId;
    }
  }

  /**
   * Get body infor order in stripe dashboard
   * @param key stripe secret key
   * @returns body respone api
   */

  async getBodyOrdInfoInStripe(ordInfoStripe: OrdInfoInStripe) {
    let resBody: StripeOrderInfo;
    const context = await request.newContext({
      httpCredentials: { username: ordInfoStripe.key, password: "" },
    });
    let res: APIResponse;
    let url: urlType;
    if (!ordInfoStripe.paymentIntendId) {
      ordInfoStripe.paymentIntendId = this.paymentIntendId;
    }
    url = `https://api.stripe.com/v1/payment_intents/${ordInfoStripe.paymentIntendId}`;
    if (ordInfoStripe.isDisputed) {
      url += `?expand%5B%5D=charges.data.dispute.balance_transactions`;
    }
    //Call cho den khi path charges tra ra data
    for (let i = 0; i < 30; i++) {
      if (ordInfoStripe.gatewayCode === "platform") {
        res = await context.get(url, {
          headers: {
            "Stripe-Account": ordInfoStripe.connectedAcc,
          },
        });
      } else {
        res = await context.get(`https://api.stripe.com/v1/payment_intents/${ordInfoStripe.paymentIntendId}`);
      }
      if (res.ok()) {
        resBody = await res.json();
        if (typeof resBody === "object" && resBody.charges.data) {
          if (ordInfoStripe.isHaveTrackingNumber) {
            if (!resBody.shipping.tracking_number) {
              continue;
            }
          }
          break;
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return resBody;
  }

  /**
   * Get order infomation in stripe dashboard.
   * Note: this function is only use to get order in sandbox not use to live
   * @param key
   * @param transaction
   * @returns order total amount
   */
  async getOrdInfoInStripe(ordInfoStripe: OrdInfoInStripe) {
    const resBody = await this.getBodyOrdInfoInStripe(ordInfoStripe);
    const refundInfo = resBody.charges.data[0].refunds.data;
    const disputeInfo = resBody.charges.data[0].dispute;
    const trackingNumber = resBody.shipping.tracking_number;
    const orderInfo = {
      ordAmount: resBody.amount,
      orderStatus: resBody.charges.data[0].status,
      ordRefundStatus: refundInfo.length > 0 ? resBody.charges.data[0].refunds.data[0].object : null,
      ordRefundAmt: resBody.charges.data[0].amount_refunded,
      ordCaptureAmt: resBody.charges.data[0].amount_captured,
      ordPaymentMethod: resBody.payment_method_types[0],
      ordDisputeStatus: disputeInfo !== null ? disputeInfo.status : null,
      ordTrackingNumber: trackingNumber !== null ? trackingNumber : null,
      amountDispute: disputeInfo !== null ? disputeInfo.balance_transactions[0].amount : null,
      feeDispute: disputeInfo !== null ? disputeInfo.balance_transactions[0].fee : null,
      netDispute: disputeInfo !== null ? disputeInfo.balance_transactions[0].net : null,
      exchangeRate: disputeInfo !== null ? disputeInfo.balance_transactions[0].exchange_rate : null,
    };
    return orderInfo;
  }

  /**
   * getting total order info from dashboard payment by list transaction id
   * @param accDashboardPayment
   * @param transactions
   * @param globalMarketRate
   * @param paymentMethod
   */
  async getTotalOrderInfoInDashboardPayment(
    accDashboardPayment,
    transactions: string[],
    globalMarketRate = 0,
    paymentMethod: string,
  ) {
    switch (paymentMethod) {
      case PaymentMethod.PAYONEER:
        return this.getTotalOrderInfoInPayoneer(accDashboardPayment.payoneer, transactions, globalMarketRate);
      case PaymentMethod.PAYPAL:
        return this.getTotalOrderInfoInPaypal(accDashboardPayment.paypal, transactions, globalMarketRate);
      default:
        return this.getTotalOrderInfoInStripe(accDashboardPayment.stripe, transactions, globalMarketRate);
    }
  }

  /**
   * getting total order info from dashboard payment for stripe by list transaction id
   * @param ordInfoStripe
   * @param transactions
   * @param globalMarketRate
   */
  async getTotalOrderInfoInStripe(ordInfoStripe: OrdInfoInStripe, transactions: string[], globalMarketRate = 0) {
    let totalOrderDBStripe = 0;
    let paymentMethodDBStripe = "";
    for (const transactionId of transactions) {
      if (ordInfoStripe.stripe_secret_key) {
        ordInfoStripe.key = ordInfoStripe.stripe_secret_key;
      }
      if (ordInfoStripe.gatewayCode === "platform" && ordInfoStripe.stripe_platform_secret_key) {
        ordInfoStripe.key = ordInfoStripe.stripe_platform_secret_key;
      }
      ordInfoStripe.transactionId = transactionId;
      const paymentIntendID = await this.getPaymentIntendByTransactionId(ordInfoStripe);
      expect(paymentIntendID).toBeTruthy();
      // Get order info in Stripe dashboard by payment intend ID
      ordInfoStripe.paymentIntendId = paymentIntendID;
      const orderInfo = await this.getOrdInfoInStripe(ordInfoStripe);
      totalOrderDBStripe += orderInfo.ordAmount;
      paymentMethodDBStripe = orderInfo.ordPaymentMethod;
    }
    if (globalMarketRate > 0) {
      totalOrderDBStripe = totalOrderDBStripe / globalMarketRate;
    }
    totalOrderDBStripe = Number((totalOrderDBStripe / 100).toFixed(2));

    return { total: totalOrderDBStripe, payment_method: paymentMethodDBStripe };
  }

  /**
   * getting total order info from dashboard payment for paypal by list transaction id
   * @param acc
   * @param listTransactionId
   * @param globalMarketRate
   */
  async getTotalOrderInfoInPaypal(
    acc: { id: string; secret_key: string },
    listTransactionId: string[],
    globalMarketRate = 0,
  ) {
    let totalAmount = 0;
    let orderInfoOnPaypal;
    for (const transactionId of listTransactionId) {
      orderInfoOnPaypal = await this.getOrdInfoInPaypal({
        id: acc.id,
        secretKey: acc.secret_key,
        transactionId,
      });
      totalAmount += Number(orderInfoOnPaypal.total_amount);
    }

    if (globalMarketRate > 0) {
      totalAmount = totalAmount / globalMarketRate;
    }
    return { total: totalAmount, payment_method: "Paypal", transaction_stt: orderInfoOnPaypal.order_status };
  }

  /**
   * getting total order info from dashboard payment for payoneer by list transaction id
   * @param acc
   * @param listTransactionId
   * @param globalMarketRate
   */
  async getTotalOrderInfoInPayoneer(
    acc: { user_name: string; password: string },
    listTransactionId: string[],
    globalMarketRate = 0,
  ) {
    let totalAmount = 0;
    for (const transactionId of listTransactionId) {
      const orderInfoOnPayoneer = await this.getOrdInfoInPayoneer({
        userNamePayoneer: acc.user_name,
        passWordPayoneer: acc.password,
        transactionId,
      });
      totalAmount += orderInfoOnPayoneer.total_amount;
    }

    if (globalMarketRate > 0) {
      totalAmount = totalAmount / globalMarketRate;
    }
    return { total: totalAmount, payment_method: "Payoneer" };
  }

  /**
   * Get order infomation in Paypal sandbox dashboard
   * @param account
   * @param transactionId
   * @returns order info
   */
  async getOrdInfoInPaypal(account: {
    id: string;
    secretKey: string;
    transactionId?: string;
  }): Promise<{ total_amount: number; order_status: string }> {
    let res;
    if (!account.transactionId) {
      account.transactionId = this.chargeId;
    }
    // Create a new context with custom HTTP credentials.
    const httpCredentials = {
      username: account.id,
      password: account.secretKey,
    };
    // Generate a base64 encoded string from the username and password.
    const btoa = (str: string) => Buffer.from(str).toString("base64");
    // Generate the basic auth header.
    const credentialsBase64 = btoa(`${httpCredentials.username}:${httpCredentials.password}`); //Use for legacy web app
    const context = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Basic ${credentialsBase64}`,
      },
    });
    for (let i = 0; i < 20; i++) {
      // Use for loop to call api when getting order info in paypal sandbox dashboard, break when response status is 200
      res = await context.get(`https://api.sandbox.paypal.com/v2/payments/captures/${account.transactionId}`);
      if (res.status() === 200) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    const resBody = await res.json();
    const orderInfo = {
      total_amount: resBody.amount.value,
      order_status: resBody.status,
    };
    return orderInfo;
  }

  /**
   * Get order infomation in Paypal sandbox dashboard when order has just authorized
   * @param account
   * @param transactionId
   * @returns order info
   */
  async getOrdAuthorizedInfoInPaypal(account: {
    id: string;
    secretKey: string;
    transactionId?: string;
  }): Promise<{ total_amount: number; order_status: string }> {
    let res;
    if (!account.transactionId) {
      account.transactionId = this.chargeId;
    }
    // Create a new context with custom HTTP credentials.
    const httpCredentials = {
      username: account.id,
      password: account.secretKey,
    };
    // Generate a base64 encoded string from the username and password.
    const btoa = (str: string) => Buffer.from(str).toString("base64");
    // Generate the basic auth header.
    const credentialsBase64 = btoa(`${httpCredentials.username}:${httpCredentials.password}`); //Use for legacy web app
    const context = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Basic ${credentialsBase64}`,
      },
    });
    for (let i = 0; i < 10; i++) {
      // Use for loop to call api when getting order info in paypal sandbox dashboard, break when response status is 200
      res = await context.get(`https://api.sandbox.paypal.com/v2/payments/authorizations/${account.transactionId}`);
      if (res.status() === 200) {
        break;
      }
      await waitTimeout(5000);
    }
    const resBody = await res.json();
    const orderInfo = {
      total_amount: Number(resBody.amount.value),
      order_status: resBody.status,
    };
    return orderInfo;
  }

  /**
   * Get order infomation in Payoneer dashboard
   * @param account
   * @param transactionId
   * @returns order info
   */
  async getOrdInfoInPayoneer(account: {
    userNamePayoneer: string;
    passWordPayoneer: string;
    transactionId: string;
  }): Promise<{ infoOrder: Array<Product>; total_amount: number }> {
    let res;
    const context = await request.newContext({
      httpCredentials: { username: account.userNamePayoneer, password: account.passWordPayoneer },
    });
    for (let i = 0; i < 20; i++) {
      // Use for loop to call api when getting order info in paypal sandbox dashboard, break when response status is 200
      res = await context.get(`https://api.sandbox.oscato.com/api/charges/${account.transactionId}`);
      if (res.status() === 200) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    const resBody = await res.json();
    const infoOrder = [];
    for (const product of resBody.products) {
      const item = {
        name: product.name,
        variant_id: parseInt(product.code),
        quantity: parseInt(product.quantity),
      };
      infoOrder.push(item);
    }
    const orderInfo = {
      total_amount: resBody.payment.amount,
      infoOrder: infoOrder,
    };
    return orderInfo;
  }

  /**
   * Verify if tracking number is synced to paypal dashboard successfully
   * @param account
   * @param transactionId
   * @param trackingNumber
   * @returns response status
   */
  async verifyTrackingInfoInPaypal(
    account: { id: string; secretKey: string },
    trackingNumber: string,
  ): Promise<boolean> {
    const httpCredentials = {
      username: account.id,
      password: account.secretKey,
    };
    const btoa = (str: string) => Buffer.from(str).toString("base64");
    const credentialsBase64 = btoa(`${httpCredentials.username}:${httpCredentials.password}`);
    const context = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Basic ${credentialsBase64}`,
      },
    });
    for (let i = 0; i < 10; i++) {
      const res = await context.get(
        `https://api.sandbox.paypal.com/v1/shipping/trackers/${this.chargeId}-${trackingNumber}`,
      );
      if (res.status() === 200) {
        return true;
      } else {
        await waitTimeout(5000);
      }
    }

    return false;
  }

  /**
   * Get order profit of store printbase and plusbase
   * @param orderId
   * @param shopType is printbase or plusbase
   * @param accessToken
   * @returns profit amount
   */
  async getOrderProfit(orderId: number, shopType: "printbase" | "plusbase", isWaitProfit?: boolean): Promise<number> {
    let ordProfit = 0;
    let linkUrl: string;
    switch (shopType) {
      case "printbase":
        linkUrl = `https://${this.domain}/admin/pbase-orders/${orderId}.json`;
        break;
      case "plusbase":
        linkUrl = `https://${this.domain}/admin/orders/plusbase/${orderId}.json`;
        break;
    }

    //wait until order profit has been caculated
    for (let i = 0; i <= 20; i++) {
      const res = await this.request.get(linkUrl);
      // TODO: tmp fix because sometime we got 404 in API
      if (res.status() !== 200) {
        continue;
      }
      expect(res.status()).toBe(200);
      const resBody = await res.json();
      if (shopType === "printbase") {
        if (resBody.pbase_order === null) {
          continue;
        }
        ordProfit = resBody.pbase_order.profit;
      } else if (shopType === "plusbase" && isWaitProfit) {
        if (resBody.profit === 0 || resBody.profit === undefined) {
          await waitTimeout(5000);
          continue;
        }
        ordProfit = resBody.profit;
      } else ordProfit = resBody.profit;
      if (ordProfit !== 0) {
        break;
      } else {
        throw Error;
      }
    }
    return ordProfit;
  }

  /**
   * Get fraud rules infomation in shop template by fraud name
   * @param fraudName fraud rule name
   * @param accessToken access token of shop template
   * @returns FraudInfo
   */
  async getFraudOrderRuleInfo(fraudName: string, accessToken: string): Promise<FraudInfo> {
    let url = `https://${this.domain}/admin/fraud.json?&limit=50`;
    if (accessToken) {
      url = `https://${this.domain}/admin/fraud.json?access_token=${accessToken}&limit=50`;
    }
    const res = await this.request.get(url);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const fraudInfos = resBody.result;
    const fraudInfo = fraudInfos.find(({ name }) => name === fraudName);
    return fraudInfo;
  }

  /**
   * Get timeline list in order detail
   * @param orderId is id of order
   * @returns
   */
  async getTimelineList(orderId: number): Promise<string[]> {
    // Wait cho timeline mới nhất hiển thị trong order detail
    await waitTimeout(2000);
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}/timeline.json?page=1&limit=50`);
    const resBody = await res.json();
    const timelineItem = resBody.timeline_items;
    const timelineList = [];

    timelineItem.forEach(item => {
      timelineList.push(item.body);
    });
    return timelineList;
  }

  /**
   * Get connected account in order detail
   * @param orderId
   * @returns
   */
  async getConnectedAccInOrder(orderId: number, retries = 20): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      const res = await this.request.get(
        `https://${this.domain}/admin/orders/${orderId}/timeline.json?page=1&limit=50`,
      );
      if (res.status() != 200) {
        continue;
      }
      const resBody = await res.json();
      if (!resBody.timeline_items) {
        continue;
      }
      const timeLine = resBody.timeline_items.find(
        ({ event_type }) => event_type === "order_activity_payment_processed",
      );
      if (timeLine) {
        const body = timeLine.body.split(" ");
        if (body.length > 0) {
          return body[body.length - 1];
        }
      }
    }
    throw new Error("Cannot find connected account");
  }

  async fulfillOrder(body: FulfillOrderApiBody): Promise<FulfillApiResponse> {
    const res = await this.request.post(
      `https://${this.domain}/admin/orders/${body.fulfillment.order_id}/fulfillments.json`,
      {
        data: body,
      },
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.result as FulfillApiResponse;
  }

  /**
   * ManualCapture order
   * @param dataOrderCapture is data for capture order
   */
  async manualCaptureOrder(dataOrderCapture: ManualCapture) {
    const res = await this.request.post(`https://${this.domain}/admin/orders/manual-capture.json`, {
      data: {
        ...dataOrderCapture,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * ignoreValidateCustomerAddress order
   * @param api is api link
   * @param shopId is shopId store merchant
   * @param orderId is from checkout order id
   */
  async ignoreValidateCustomerAddress(shopId: number, orderId: number) {
    const res = await this.request.post(
      `https://${this.domain}/admin/panda-fulfillment/qc-tools/sync-data-by-type.json`,
      {
        data: {
          type: "customer_address",
          data: {
            shop_id: shopId,
            order_id: orderId,
          },
        },
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * Get body infor order in stripe dashboard
   * @param key stripe secret key
   * @returns body respone api
   */

  async getPaymentIntendByTransactionId(ordInfoStripe: OrdInfoInStripe) {
    let resBody;
    const context = await request.newContext({
      httpCredentials: { username: ordInfoStripe.key, password: "" },
    });
    let res: APIResponse;
    const url = `https://api.stripe.com/v1/charges/${ordInfoStripe.transactionId}`;
    //Call cho den khi path charges tra ra data
    for (let i = 0; i < 30; i++) {
      if (ordInfoStripe.gatewayCode === "platform") {
        res = await context.get(url, {
          headers: {
            "Stripe-Account": ordInfoStripe.connectedAcc,
          },
        });
      } else {
        res = await context.get(url);
      }
      if (res.ok()) {
        resBody = await res.json();
        return resBody.payment_intent;
      }
    }
    return "";
  }

  /**
   * call api to create order for checkout by send message to checkout-consumer
   * @param checkoutToken
   * @param shopId
   */
  async callApiCreateOrderByConsumer(checkoutToken: string, shopId: number) {
    const url = `https://${this.domain}/api/checkout/create-order-by-checkout-consumer.json`;
    const options = {
      data: {
        checkout_tokens: [checkoutToken],
        shop_id: shopId,
      },
    };
    const res = await this.request.post(url, options);
    expect(res.status()).toBe(200);
  }

  /*
   * get Rate Currency In Order Detail includes 2 value rate_currency_to_usd,rate_currency_account_to_payment
   * @param orderId
   * @param accessToken
   * @returns
   */
  async getRateCurrencyInOrderDetail(orderId: number, accessToken = this.accessToken) {
    const rateCurrency = {
      rateCurrencyAccountToPayment: 0,
      rateCurrencyToUsd: 0,
    };
    const res = await this.request.get(
      `https://${this.domain}/admin/orders/${orderId}.json?shop_type=&is_throughout=null`,
      {
        params: {
          access_token: accessToken,
        },
      },
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    rateCurrency.rateCurrencyAccountToPayment = !Number(resBody.order.rate_currency_account_to_payment)
      ? 1
      : Number(resBody.order.rate_currency_account_to_payment);

    rateCurrency.rateCurrencyToUsd = !Number(resBody.order.rate_currency_to_usd)
      ? 1
      : Number(resBody.order.rate_currency_to_usd);

    return rateCurrency;
  }

  /**
   * get data payment of info transaction on stripe
   * @param ordInfoStripe
   * @returns
   */
  async getDataOfTransactionStripe(ordInfoStripe: OrdInfoInStripe) {
    let resBody: StripeOrderInfo;
    const context = await request.newContext({
      httpCredentials: { username: ordInfoStripe.key, password: "" },
    });
    let res: APIResponse;
    const orderInfoStripe = await this.getBodyOrdInfoInStripe(ordInfoStripe);
    const balanceTransactions = orderInfoStripe.charges.data[0]["balance_transaction"];
    const url = `https://api.stripe.com/v1/balance_transactions/${balanceTransactions}`;
    let option = null;
    if (ordInfoStripe.gatewayCode === "platform") {
      option = {
        headers: {
          "Stripe-Account": ordInfoStripe.connectedAcc,
        },
      };
    }

    //Call cho den khi url tra ra data
    for (let i = 0; i < 30; i++) {
      res = await context.get(url, option);
      if (res.ok()) {
        resBody = await res.json();
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return resBody;
  }

  /**
   * Converts the balance from "available soon" to "available to payout" for a specific order.
   * Pre-condition: User in fs "plusbase_balance_release_now".
   * @param {number} orderId - The ID of the order to release the profit.
   */
  async releaseAvailableToPayoutProfit(orderId: number): Promise<void> {
    const res = await this.request.post(`https://${this.domain}/admin/orders/${orderId}/release-atp-profit.json`);
    expect(res.status()).toBe(200);
  }

  /**
   * Get data of orders in PlusBase with the date
   * @param authRequest
   * @param fromDate
   * @param toDate
   * @returns
   */
  async getPLBOrdersListWithDate(authRequest: APIRequestContext, fromDate, toDate) {
    let grossProfit = 0.0;
    const res = await authRequest.get(`https://${this.domain}/admin/orders/v2.json`, {
      params: {
        created_at_min: fromDate,
        created_at_max: toDate,
        limit: 150,
        plb_order: true,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    for (const profitOrder of resBody.orders) {
      grossProfit += profitOrder.plb_profit;
    }
    grossProfit = Math.round(grossProfit * 100) / 100;
    return grossProfit.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  /**
   * Hàm get thông tin của transaction (order id) của razorpay bằng api
   * @param account gồm key_id, key_secret: là thông tin account để connect cổng thanh toán ở trang payment shopbase
   * @param receipt là thứ tự đơn hàng, dựa vào receipt để tìm ra order_id
   * @param numberOrder : giới hạn số order hiển thị ở response
   * @returns
   */
  async getOrdInfoInRazorpay(
    account: { keyID: string; keySecret: string },
    receipt: string,
    numberOrder = 50,
  ): Promise<TransactionInfoInRazorpay> {
    let response;
    const context = await request.newContext({
      httpCredentials: { username: account.keyID, password: account.keySecret },
    });
    for (let i = 0; i < 2; i++) {
      // call api get order info in razorpay dashboard, break when response status is 200
      response = await context.get(`https://api.razorpay.com/v1/orders?count=${numberOrder}`);

      if (response.status() === 200) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const resBody = await response.json();
    const item = resBody.items.find(item => item.receipt === receipt);
    const orderInfo = {
      id: item.id,
      total_amount: item.amount_paid,
      currency: item.currency,
      status: item.status,
    };
    return orderInfo;
  }

  /**
   * Hàm get data của payment ở dashboard razorpay thông qua api
   * @param account gồm key_id, key_secret: là thông tin account để connect cổng thanh toán ở trang payment shopbase
   * @param orderID lấy từ tab order, dựa vào đây để tìm payment
   * @param numberPayment giới hạn số payment hiển thị ở response
   * @returns
   */
  async getPaymentInfoInRazorpay(
    account: { keyID: string; keySecret: string },
    orderID: string,
    numberPayment = 50,
  ): Promise<PaymentInfoInRazorpay> {
    let response;
    const context = await request.newContext({
      httpCredentials: { username: account.keyID, password: account.keySecret },
    });
    for (let i = 0; i < 2; i++) {
      // call api get payment info in razorpay dashboard, break when response status is 200
      response = await context.get(`https://api.razorpay.com/v1/payments?count=${numberPayment}`);

      if (response.status() === 200) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const resBody = await response.json();

    const item = resBody.items.find(item => item.order_id === orderID);
    const paymentInfo = {
      id: item.id,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      amountRefunded: item.amount_refunded,
      refundStatus: item.refund_status,
      captured: item.captured,
    };
    return paymentInfo;
  }
}
