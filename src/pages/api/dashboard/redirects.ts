import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import { RedirectsResponse } from "@types";

export class RedirectsAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Hàm get tất cả url redirects
   */
  async getListUrlRedirects(): Promise<RedirectsResponse[]> {
    let res: APIResponse;
    try {
      await expect(async () => {
        res = await this.request.get(`https://${this.domain}/admin/redirects.json`, {
          params: {
            order_by: "from_url",
            order_direction: "asc",
            limit: 50,
            page: 1,
            total: true,
          },
        });
        expect(res.status()).toBe(200);
      }).toPass({ intervals: [1_000, 5_000, 10_000], timeout: 60_000 });
      const resJson = await res.json();
      return resJson.redirects as RedirectsResponse[];
    } catch (error) {
      throw new Error("Get list redirects URL failed!");
    }
  }

  /**
   * Hàm xoá redirects url
   * @param ids
   * @returns
   */
  async deleteUrlRedirects(ids: number[]): Promise<{ success: boolean }> {
    let res: APIResponse;
    try {
      await expect(async () => {
        res = await this.request.delete(`https://${this.domain}/admin/redirects.json`, {
          params: {
            ids: ids.join(","),
          },
        });
        expect(res.status()).toBe(200);
      }).toPass({ intervals: [1_000, 5_000, 10_000], timeout: 60_000 });
      const resJson = await res.json();
      return resJson.success;
    } catch (error) {
      throw new Error("Delete url redirects failed!");
    }
  }
}
