import { roundingTwoDecimalPlaces } from "@core/utils/string";

/**
 * Estimate calculate the profit in set up shipping fee
 * @param salePrice
 * @param baseCost
 * @param markupShippingFee
 * @param shippingShopTemplate
 * @returns profit
 */
export function calculateProfit(
  salePrice: number,
  baseCost: number,
  markupShippingFee: number,
  shippingShopTemplate: number,
) {
  const actualShippingFee = shippingShopTemplate + markupShippingFee;
  const paymentFee = (salePrice + actualShippingFee) * 0.03;
  const processingFee = (salePrice - baseCost - paymentFee) * 0.04;
  const handlingFee = paymentFee + processingFee;
  const profit = roundingTwoDecimalPlaces(salePrice - baseCost + markupShippingFee - handlingFee);
  return profit;
}
