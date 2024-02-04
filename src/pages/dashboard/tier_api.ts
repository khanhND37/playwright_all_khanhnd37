import { expect, APIRequestContext } from "@playwright/test";

export class TierByAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * get user tier info by API
   * @returns <json>
   */
  async getTierDetailByAPI() {
    const response = await this.request.get(`https://${this.domain}/admin/tiers/synthetic.json`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Call api to end current cycle
   * @param id is user id
   * @param start is the started time of cycle
   * @param end is the end time of cycle
   * @returns <boolean>
   */
  async apiEndCycle(domain: string, id: number, start: number, end: number) {
    const response = await this.request.get(
      `https://${domain}/admin/tiers/end-cycle.json` + `?user_id=${id}&from_time=${start}&to_time=${end}`,
    );
    const jsonResponse = await response.json();
    return jsonResponse.success == true;
  }
}
