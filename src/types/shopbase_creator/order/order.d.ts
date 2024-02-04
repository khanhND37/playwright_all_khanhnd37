/**
 * Use: get information product in order detail
 */
export type SummaryRefund = {
  subtotal: string;
  refund: string;
};

export type ResponseOrder = {
  orders: OrderDetailAPIResponse;
};

export type OrderDetailAPIResponse = {
  customer: ResponseCustomer;
};

export type ResponseCustomer = {
  id: number;
};

export type ResponseAbandonedCheckout = {
  id: number;
  email: string;
  name: string;
  abandoned_email_status: string;
  total_price: number;
  note: string;
};
