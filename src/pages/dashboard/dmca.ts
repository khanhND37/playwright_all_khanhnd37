import { Page } from "@playwright/test";
import { DashboardPage } from "./dashboard";

export type DMCAScheduler = {
  is_waiting_send_mail: boolean;
  is_waiting_send_mail_scan: boolean;
  is_waiting_deleted: boolean;
  is_waiting_campaign_available?: boolean;
  is_waiting_visible_hive: boolean;
  campaign_ids?: number[];
};

export type BaseInput = {
  titles: string[];
  key_search: string;
  handle_product_expect: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  campaigns?: any[];
  folder_name: string;
  pre_deleted_email_subject: string;
};

export class DMCA extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
}
