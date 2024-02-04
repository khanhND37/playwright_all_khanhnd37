import type { FixtureApi, FixtureApiOptions, FixtureApiResponse, TestApiCase } from "@types";
import { AccessTokenHeaderName, DefaultUserAgent, UserAgentHeaderName } from "@core/constant";
import { Page } from "@playwright/test";

export class SbaseAdminApi {
  domain: string;
  shopToken: string;
  userToken: string;
  api: FixtureApi;
  page: Page;

  constructor(domain: string, api: FixtureApi, page: Page, token: { shopToken?: string; userToken?: string }) {
    this.domain = domain;
    this.shopToken = token.shopToken;
    this.userToken = token.userToken;
    this.api = api;
    this.page = page;
  }

  async requestByShopToken<T>(testApiCase: TestApiCase, options?: FixtureApiOptions): Promise<FixtureApiResponse<T>> {
    if (!testApiCase.request?.headers) {
      testApiCase.request = { ...testApiCase.request, headers: {} };
    }

    if (!testApiCase.request?.headers[AccessTokenHeaderName]) {
      testApiCase.request.headers[AccessTokenHeaderName] = this.shopToken;
      testApiCase.request.headers[UserAgentHeaderName] = DefaultUserAgent;
    }
    if (testApiCase.url.indexOf("/admin") == 0) {
      testApiCase.url = `https://${this.domain}${testApiCase.url}`;
    }
    if (!testApiCase.response) {
      testApiCase.response = { status: 200, data: null };
    }
    if (testApiCase.request?.params) {
      const params = {};
      for (const k in testApiCase.request.params) {
        params[k.toString()] = testApiCase.request.params[k].toString();
      }
      testApiCase.url = `${testApiCase.url}?${new URLSearchParams(params).toString()}`;
    }
    return await this.api.request<T>(testApiCase, options);
  }
}
