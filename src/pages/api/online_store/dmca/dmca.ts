import { APIRequestContext, expect } from "@playwright/test";
import type { DMCAReport } from "@types";
export class DMCAReportAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Send DMCA report via API
   * @param dmcaReport DMCA report
   */
  async sendDMCAReport(dmcaReport: DMCAReport): Promise<void> {
    const res = await this.request.post(`https://${this.domain}/api/online-store/dmca.json`, {
      data: dmcaReport,
    });
    expect(res.status()).toBe(200);
  }
}
