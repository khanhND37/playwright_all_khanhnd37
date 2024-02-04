import { APIRequestContext, expect } from "@playwright/test";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class ContentPageAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * login to storefront with api login
   * @param account username, password of storefront account
   * @returns customer token after login
   */
  async getCustomerToken(account: string) {
    const response = await this.request.post(`https://${this.domain}/api/customer/next/login.json`, {
      data: account,
    });
    expect(response.ok()).toBeTruthy();
    const resBody = await response.json();
    return resBody.result.token;
  }

  /**
   * get messages download file
   * @param productId: productId chứa file cần get xpath
   */
  async getPathFile(productId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${productId}.json`);
    expect(response.ok()).toBeTruthy();
    const resBody = await response.json();
    const path = resBody.data.products[0].sections[0].lectures[0].medias[0].path;
    return path;
  }

  /**
   * get messages download file ( hàm có thể trả về cả lỗi và check lỗi trong message return, nên ko check HTTP OK)
   * @param token: token của Customer khi login web
   * @param path: path của file check download
   * @return Response.code và messages trả về thông báo có cho phép download file không
   */
  async getMessagesDownloadFile(token: string, path: string) {
    const response = await this.request.get(
      `https://${this.domain}/api/digital-products/get-object.json?token=${token}&path=${path}`,
    );
    const jsonResponse = await response.json();
    return [jsonResponse.code, jsonResponse.messages];
  }
}
