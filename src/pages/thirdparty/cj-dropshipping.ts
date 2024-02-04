import { APIRequestContext, expect } from "@playwright/test";
import { CJDropshipping, DataShipping, ShippingFee } from "@types";

export class CJDropshippingAPI {
  request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Get access token in CJ Dropshipping page
   * @param emailUser Email used when registering account in CJ
   * @param apiKey Key of the CJ API
   * @returns accessToken
   */
  async getAccessToken(emailUser: string, apiKey: string): Promise<string | null> {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 300000;

    while (retryCount < maxRetries) {
      const res = await this.request.post(
        "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
        {
          data: {
            email: emailUser,
            password: apiKey,
          },
        },
      );

      if (res.status() === 429) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        if (res.status() === 200) {
          const resBody = await res.json();
          return resBody.data.accessToken;
        } else {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Get product detail in CJ Dropshipping page
   * @param productIds pid of product
   * @param emailUser Email used when registering account in CJ
   * @param apiKey Key of the CJ API
   * @returns data in product detail
   */
  async getProductDetailCJ(productId: string, accessToken: string): Promise<CJDropshipping> {
    const res = await this.request.get(`https://developers.cjdropshipping.com/api2.0/v1/product/query`, {
      params: {
        pid: productId,
      },
      headers: {
        "CJ-Access-Token": accessToken,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.data;
  }

  /**
   * Get product detail in CJ Dropshipping page
   * @param productIds pid of product
   * @param emailUser Email used when registering account in CJ
   * @param apiKey Key of the CJ API
   * @returns data in product detail
   */
  async getShippingFee(dataShipping: DataShipping, accessToken: string): Promise<ShippingFee | null> {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 300;

    while (retryCount < maxRetries) {
      const res = await this.request.post(`https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`, {
        data: { ...dataShipping },
        headers: {
          "Content-Type": "application/json",
          "CJ-Access-Token": accessToken,
        },
      });

      if (res.status() === 429) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryCount++;
      } else if (res.status() === 200) {
        const resBody = await res.json();
        return resBody.data;
      }
    }
    return null;
  }
}
