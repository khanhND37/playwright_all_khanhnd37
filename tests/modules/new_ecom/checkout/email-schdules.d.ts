import { OrderAfterCheckoutInfo } from "@types";

export type EmailScheduleData = {
  emailBuyer: string;
  orderSummaryInfo: OrderAfterCheckoutInfo;
};
