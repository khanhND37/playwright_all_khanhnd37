import { formatDate } from "@core/utils/datetime";
import { APIRequestContext, expect } from "@playwright/test";
import type { TaxReport } from "@types";

export class AnalyticsAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  async getTaxReportData(dateFilter?: { from: string; to: string }): Promise<TaxReport> {
    const date = formatDate(new Date(), "YYYY-MM-DD");
    if (!dateFilter) {
      dateFilter = {
        from: date,
        to: date,
      };
    }
    const res = await this.request.get(`https://${this.domain}/admin/statistics/taxes-report.json`, {
      params: {
        from_time: dateFilter.from,
        to_time: dateFilter.to,
        limit: 50,
        page: 1,
      },
    });
    expect(res.status()).toBe(200);
    return await res.json();
  }
}
