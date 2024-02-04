import type { DataShippingPack, Discount, Order, TaxAmount, TaxInfo } from "@types";

/**
 * Calculate revenue, payment fee, processing fee, handlingFee, profit of order
 * @param total
 * @param subtotal
 * @param discount
 * @param baseCost
 * @param shippingCost
 * @param shippingFee
 * @param taxInclude tax amount included in the product price
 * @param tip
 * @param paymentFeePercent Payment Fee Rate, default = 3%
 * @param processingFeePercent Processing Fee Rate, default = 4%
 * Nếu tính profit line item thì nhập param line item
 */
export function calculateProfit(
  total: number,
  subtotal: number,
  discount: number,
  baseCost: number,
  shippingCost: number,
  shippingFee: number,
  taxInclude = 0,
  tip = 0,
  paymentFeePercent = 0.03,
  processingFeePercent = 0.04,
  podDesignFee = 0,
): Order {
  const revenue = subtotal - discount + shippingFee + tip - taxInclude;
  const paymentFee = total * paymentFeePercent;
  const processingFee =
    (subtotal - discount - baseCost - shippingCost + shippingFee - paymentFee + tip - taxInclude - podDesignFee) *
    processingFeePercent;
  const handlingFee = paymentFee + processingFee + podDesignFee;
  const profit = revenue - baseCost - shippingCost - handlingFee;
  return {
    revenue: Number(revenue.toFixed(2)),
    payment_fee: Number(paymentFee.toFixed(2)),
    processing_fee: Number(processingFee.toFixed(2)),
    handling_fee: Number(handlingFee.toFixed(2)),
    profit: Number(profit.toFixed(2)),
  };
}

/**
 * Calculate tax include, tax exclude
 * @param taxInfo
 * @param price price after discount( subtotal | price of item | shipping fee)
 * @return tax include, tax exclude
 */
export function calculateTax(taxInfo: TaxInfo, price: number): TaxAmount {
  let taxInclude = 0;
  let taxExclude = 0;
  switch (taxInfo.type) {
    case "exclude":
      taxExclude = (price * taxInfo.rate) / 100;
      break;
    case "include":
      taxInclude = ((taxInfo.rate / 100) * price) / (1 + taxInfo.rate / 100);
      break;
  }
  return {
    tax_include: taxInclude,
    tax_exclude: taxExclude,
  };
}

/**
 * calculate discount value by type
 * @param discountInfo
 * @returns discount value
 */
export function calculateDiscount(discountInfo: Discount, price: number): number {
  let discountValue = 0;
  switch (discountInfo.type) {
    case "percentage":
      discountValue = (price * discountInfo.value) / 100;
      break;
    case "fixed amount":
      discountValue = discountInfo.value;
      break;
  }
  return Number(discountValue.toFixed(2));
}

/**
 * Calculate shipping cost by package rule
 * @param totalItems
 * @param packageRule
 * @param firstItemPrice
 * @param additionalItemPrice
 * @returns splitPack,shippingCost
 */
export function calShippingCostByPack(
  totalItems: number,
  packageRule: number,
  firstItemPrice: number,
  additionalItemPrice: number,
): DataShippingPack {
  const splitPack = Math.ceil(totalItems / packageRule);
  const shippingCost = splitPack * firstItemPrice + additionalItemPrice * (totalItems - splitPack);
  return { split_pack: splitPack, shipping_cost: shippingCost };
}
