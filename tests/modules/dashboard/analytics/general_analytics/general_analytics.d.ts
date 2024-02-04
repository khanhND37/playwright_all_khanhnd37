export type AbandonedInfo = {
  url: string;
  time: number;
};

export type OrderConversionFunnel = {
  event_sent: number;
  event_click: number;
  order_recovery: number;
};
