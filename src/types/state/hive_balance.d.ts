export type ChargeToZero = {
  form_reason: string;
  form_note: string;
};

export type ChargeOrRefund = {
  invoice_type: string;
  value: string;
  form_reason: string;
  form_note: string;
};

export type RequestPayoutInfo = {
  user: string;
  destinationEmail?: string;
  destinationMethod: string;
  requestedAmount: string;
  status?: string;
  refuseReason?: string;
};
