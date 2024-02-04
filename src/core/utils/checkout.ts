import type { RiskLevelInfo, Tax } from "@types";

/**
 * Return order timeline message
 * @param firstName
 * @param lastName
 * @param email
 * @returns
 */
export function buildOrderTimelineMsg(firstName: string, lastName: string, email: string, totalOrder?: string) {
  const orderTimelineSendingEmail = `Order confirmation email was sent to ${firstName} ${lastName} (${email})`;
  const orderTimelineCustomerPlaceOrder = `${firstName} ${lastName} placed this order on Online Store`;
  const timelineCancelOrdPbase =
    `ShopBase Moderation Team canceled this order. ` + `Reason: Customer changed/canceled order`;
  const timeLineSentCancelMailPbase =
    `ShopBase Moderation Team sent an order cancelled email to ` + `${firstName} ${lastName} (${email})`;
  const timeLineSentCancelMailPlbase =
    `PlusBase sent an order cancelled email to ` + `${firstName} ${lastName} (${email})`;
  const timelineFraudRuleCancelOrder = `ShopBase Moderation Team canceled this order. Reason: Fraudulent order`;
  const timelineCancelOrdPlbase = `PlusBase canceled some items. Reason: Customer changed/canceled order`;
  const timelineCancelOrdPlbaseByContactUsForm = `CC01_Order canceled due to Buyer's request - Deduct Seller's profit.`;
  const timelineFraudRuleCancelPlbaseOrder = `PlusBase canceled this order. Reason: Fraudulent order`;
  const timeLineShippingConfirmation = `PlusBase sent a shipping confirmation email to ${firstName} ${lastName} (${email})`;
  const timeLineChargeback = `The customer opened a chargeback totalling ${totalOrder} USD`;
  const orderTimeline = {
    timelineSendEmail: orderTimelineSendingEmail,
    timelinePlaceOrd: orderTimelineCustomerPlaceOrder,
    timelineCancelOrdPbase: timelineCancelOrdPbase,
    timelineSentCancelMailPbase: timeLineSentCancelMailPbase,
    timelineCancelOrdPlbase: timelineCancelOrdPlbase,
    timelineSentCancelMailPlbase: timeLineSentCancelMailPlbase,
    timelineFraudRuleCancelOrder: timelineFraudRuleCancelOrder,
    timelineFraudRuleCancelPlbaseOrder: timelineFraudRuleCancelPlbaseOrder,
    timeLineShippingConfirmation: timeLineShippingConfirmation,
    timelineCancelOrdPlbaseByContactUsForm: timelineCancelOrdPlbaseByContactUsForm,
    timeLineChargeback: timeLineChargeback,
  };
  return orderTimeline;
}

/**
 * Gen order timeline string with bunch of properties
 * @param timelineInfo - {
 * @returns An object with 3 properties.
 */
export function genOrderTimelineXpath(timelineInfo: {
  accName?: string;
  cancelAmt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  fulfillItem?: number;
}) {
  let item = `item`;
  if (timelineInfo.fulfillItem > 1) {
    item = `items`;
  }
  return {
    timelineMcCancelOrder: `${timelineInfo.accName} canceled this order. Reason: Customer changed/canceled order`,
    timelineMcSentEmailCancel: `${timelineInfo.accName} sent an order cancelled email to ${timelineInfo.firstName} ${timelineInfo.lastName} (${timelineInfo.email})`,
    timelineMcSentEmailRefund: `${timelineInfo.accName} sent an order refund email to ${timelineInfo.firstName} ${timelineInfo.lastName} (${timelineInfo.email})`,
    timelineMcRefundedOrder: `${timelineInfo.accName} refunded $${timelineInfo.cancelAmt} USD on`,
    timelineMcFulfillOrder: `${timelineInfo.accName} marked ${timelineInfo.fulfillItem} ${item} as fulfilled`,
    timelineMcSentMailFulfill: `${timelineInfo.accName} sent a shipping confirmation email to ${timelineInfo.firstName} ${timelineInfo.lastName} (${timelineInfo.email})`,
    timelineUnarchived: `This order was unarchived`,
    timelineMCCancelFulfillment: `${timelineInfo.accName} canceled fulfillment via ShopBase for ${timelineInfo.fulfillItem} ${item}.`,
  };
}

// accept the difference of two numbers in an interval epsilon
export function isEqual(num1: number, num2: number, epsilon: number) {
  if (Math.round(Math.abs(num1 - num2) * 100) / 100 <= epsilon) {
    return true;
  }
  return {
    num1: num1,
    num2: num2,
  };
}

/**
 * Return transactions invoice dispute
 * @param orderName
 * @returns
 */
export function buildInfoInvoiceDispute(orderName: string, payment: "spay" | "smp") {
  let contentInvoice = "";
  let detailInvoice = "";
  let transDeductChargebackAmount = "";
  let transDeductChargebackFee = "";
  let transRefundChargebackAmount = "";
  let transRefundChargebackTotal = "";
  switch (payment) {
    case "spay":
      transDeductChargebackAmount = `Deduct chargeback amount for order ${orderName} from Available payout balance due to dispute. View details`;
      transDeductChargebackFee = `Deduct chargeback fee for order ${orderName} from Available payout balance due to dispute.`;
      transRefundChargebackTotal = `Refund chargeback amount and chargeback fee for order ${orderName} from Available payout balance due to dispute resolution.`;
      contentInvoice = `ShopBase Payments order on hold`;
      detailInvoice = `Order ${orderName} on hold due to dispute. Learn more`;
      break;
    case "smp":
      transDeductChargebackAmount = `Deduct chargeback amount for order ${orderName} from Available payout balance due to dispute. View details`;
      transDeductChargebackFee = `Collect chargeback fee for order ${orderName} from Available payout balance due to dispute.`;
      transRefundChargebackAmount = `Refund chargeback amount for order ${orderName} to Available payout balance due to dispute resolution.`;
      contentInvoice = `ShopBase Marketplace Payment order on hold`;
      detailInvoice = `Order ${orderName} on hold due to dispute. Learn more`;
      break;
  }
  const transactionInvoiceDispute = {
    transDeductChargebackAmount: transDeductChargebackAmount,
    transDeductChargebackFee: transDeductChargebackFee,
    transRefundChargebackAmount: transRefundChargebackAmount,
    transRefundChargebackTotal: transRefundChargebackTotal,
    contentInvoice: contentInvoice,
    detailInvoice: detailInvoice,
  };
  return transactionInvoiceDispute;
}

export function buildInfoInvoiceDetail(orderName: string) {
  const contentInvoice = `ShopBase Payments order collecting`;
  const detailInvoice = `Collected profit of the order ${orderName}`;
  const transCollectedProfit = `Collected profit of the order ${orderName}`;
  const transRefundOrder = `Refund the order ${orderName}`;
  const transactionInvoiceDispute = {
    contentInvoice: contentInvoice,
    detailInvoice: detailInvoice,
    transCollectedProfit: transCollectedProfit,
    transRefundOrder: transRefundOrder,
  };
  return transactionInvoiceDispute;
}

/**
 * Tax calculate formular
 * @param taxInfo
 * @param value
 * @returns tax amount
 */
export function calculateTax(taxInfo: Tax, value: number) {
  let taxAmount: number;
  if (taxInfo.tax_type === "exclude") {
    taxAmount = (value * taxInfo.tax_rate) / 100;
  } else {
    taxAmount = (value * taxInfo.tax_rate) / (100 + taxInfo.tax_rate);
  }
  return taxAmount;
}

/**
 * Parse currency from string to float. use regex to detect money
 * sample: $55.82 -> 55.82, $55.82 USD -> 55.82
 * @param currency string
 * @returns value float
 */
export function parseMoneyCurrency(currency: string) {
  if (!currency) {
    return 0;
  }
  const regexs = currency.match(/([0-9.,]+)/g);
  return !regexs || !regexs.length ? 0 : parseFloat(regexs[0].replace(",", "."));
}

/**
 * Convert days to weeks feature ETA PLB
 * @param days is business days
 * @returns weeks
 */
export function convertDaysToWeeks(days: number) {
  const remainingDays = days % 7;
  const fullWeeks = Math.floor(days / 7);
  const weeks = remainingDays < 6 ? fullWeeks : fullWeeks + 1;
  return weeks;
}

/**
 * Return message chargeback
 * @param totalOrder
 * @returns
 */
export function buildChargebackMsg(totalOrder: string) {
  const msgChargebackOpen = `The customer opened a chargeback totalling ${totalOrder}`;
  const msgSubmitSuccessfully = `Submit reimbursement request for a chargeback successfully`;
  const msgChargebackLose = `A chargeback totalling ${totalOrder} was resolved in the customer's favor`;
  const msgDetailChargebackLose = `We submitted your response to the dispute on about 1 hour ago. The customer's bank sided with your customer.`;
  const msgChargebackWon = `A chargeback totalling ${totalOrder} was resolved in your favor`;
  const msgDetailChargebackWon = `The customer's bank sided with you. The ${totalOrder} chargeback amount will be returned to you in an upcoming payout.`;

  const msgChargeback = {
    msgChargebackOpen: msgChargebackOpen,
    msgSubmitSuccessfully: msgSubmitSuccessfully,
    msgChargebackLose: msgChargebackLose,
    msgDetailChargebackLose: msgDetailChargebackLose,
    msgChargebackWon: msgChargebackWon,
    msgDetailChargebackWon: msgDetailChargebackWon,
  };
  return msgChargeback;
}

/**
 * Calculates the estimated completion date after processing time.
 * Sample: Today 16/1, processing time: 5 days > Expect: Ready to ship: 16 + 5 = 21/1
 * @param {number} processingTime - The number of days required for order processing.
 * @returns {Promise<Date>} - The estimated completion date after processing.
 */
export function calculatorProcessingPlb(processingTime: number): Date {
  // Get the current date
  const currentDate = new Date();

  // Calculate the date after processing time
  const processedDate = new Date();
  processedDate.setDate(currentDate.getDate() + processingTime);

  // Return the estimated completion date after processing
  return processedDate;
}

/**
 * Calculates the estimated arrival date based on processing and shipping times.
 * Sample: Today 16/1, processing time: 5 days , shipping time: 6 business days
    - Expect ETA: Ready to ship: 16 + 5 = 21/1
                  Estimated delivery time: 21 + 6 business days = 29/1 ( Adjust for weekends)
 * @param {number} processingTime - The number of days required for order processing.
 * @param {number} shippingTime - The number of days for shipping.
 * @returns {Date} - The estimated arrival date.
 */
export function calculatorEtaPlb(processingTime: number, shippingTime: number): Date {
  const currentDate = new Date();
  const today = new Date();

  // Calculate the date after processing time
  currentDate.setDate(today.getDate() + processingTime);

  // Loop through shipping days
  for (let i = 1; i <= shippingTime; i++) {
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);

    // Adjust for weekends (Saturday)
    if (currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 2);
    } else if (currentDate.getDay() === 0) {
      // Adjust for weekends (Sunday)
      currentDate.setDate(currentDate.getDate() + 1);
      // currentDate.toLocaleDateString();
    }
  }
  return currentDate;
}

/**
 * Return message risk level
 * @param oldRiskLevelInfo: risk level info before change
 * @param newRiskLevelInfo: risk level info after change
 * @returns
 */
export function buildMsgRiskLevelDetails(oldRiskLevelInfo: RiskLevelInfo, newRiskLevelInfo: RiskLevelInfo) {
  const msgChangeDisputeRate = `90 Days Dispute Rate: ${(oldRiskLevelInfo.dispute_spay_rate * 100).toFixed(2)}% → ${(
    newRiskLevelInfo.dispute_spay_rate * 100
  ).toFixed(2)}%`;
  const msgAvgShippingTime = `Previous 21 days Average Shipping Time: ${(
    newRiskLevelInfo.astx_spay_rate / 86400
  ).toFixed(2)} days`;
  const msgDeliveryTackingMovedRatio = `(Last 20 days to last 25 days order delivered/ order tracking moved ratio: ${(
    newRiskLevelInfo.odrxy_spay_rate * 100
  ).toFixed(2)}%)`;
  const msgAvgFulfillmentTime = `Previous 21 days Average Fulfillment Time: ${(
    newRiskLevelInfo.aftx_spay_rate / 86400
  ).toFixed(2)} days`;
  const msgTrackingMovedTotalOrderRatio = `(Order tracking moved/ total order ratio from last 22 days to last 90 days: ${(
    newRiskLevelInfo.otmrxy_spay_rate * 100
  ).toFixed(2)}%)`;

  const msgRiskLevelDetails = {
    msgChangeDisputeRate: msgChangeDisputeRate,
    msgAvgShippingTime: msgAvgShippingTime,
    msgDeliveryTackingMovedRatio: msgDeliveryTackingMovedRatio,
    msgAvgFulfillmentTime: msgAvgFulfillmentTime,
    msgTrackingMovedTotalOrderRatio: msgTrackingMovedTotalOrderRatio,
  };

  return msgRiskLevelDetails;
}
