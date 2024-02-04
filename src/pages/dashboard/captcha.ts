import { APIRequestContext, expect, Page } from "@playwright/test";
import { SBPage } from "@pages/page";

export class Captcha extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get CAPTCHA service information
   * @param domain accounts.shopbase.com
   * @param domainApi api.shopbase.com
   * @param request APIRequestContext
   * @returns geetest | google
   */
  async getServiceInfo(domain: string, domainApi: string, request: APIRequestContext) {
    const response = await request.get(`${domainApi}/v1/auth/captcha?host=${domain}`, {
      headers: {
        Accept: "application/json",
      },
    });
    expect(response.ok()).toBeTruthy();
    return response.json().then(result => result.service);
  }

  /**
   * Get sign up response status code
   * @param xSbCaptcha
   * @param xSbFpHash
   * @param xShopbaseAccessToken
   * @param username
   * @param password
   * @param timeStamp
   * @param store
   * @param api
   * @param request
   * @returns
   */
  async getSignUpResponseStatusCode(
    xSbCaptcha: string,
    xSbFpHash: string,
    xShopbaseAccessToken: string,
    username: string,
    password: string,
    timeStamp: number,
    store: string,
    api: string,
    request: APIRequestContext,
  ) {
    const headerDict = {
      "x-sb-captcha": xSbCaptcha,
      "x-sb-fp-hash": xSbFpHash,
      "x-shopbase-access-token": xShopbaseAccessToken,
    };

    const data = {
      email: username + "+" + timeStamp + "@beeketing.net",
      password: password,
      shop_name: store + timeStamp,
    };

    const requestOptions = {
      headers: headerDict,
      data: data,
    };

    return await request.post(`${api}/signup/account`, requestOptions);
  }
}
