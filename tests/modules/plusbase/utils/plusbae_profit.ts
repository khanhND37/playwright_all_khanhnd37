import type { PlbRefundInput, PlbOrder } from "@types";

export function profitAfterRefund(plbOrder: PlbOrder, input: PlbRefundInput): number {
  const refundBuyer = input.refund_buyer_selling + input.refund_buyer_tip;
  const refundSeller =
    input.refund_seller_payment +
    input.refund_seller_shipping +
    input.refund_seller_tax +
    input.refund_seller_base_cost +
    input.refund_seller_processing;
  return plbOrder.profit - refundBuyer + refundSeller;
}
