import { DataBalance } from "@types";

export type HoldFromPayoutPb = {
  data_balance_before_hold: DataBalance;
  order: [
    {
      id: number;
      name: string;
    },
    {
      id: number;
      name: string;
    },
  ];
  orders_name: string;
  total_profit: number;
};
