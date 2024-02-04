import { APIRequestContext } from "@playwright/test";

/**
 * @deprecated: use src/shopbase_creator/storefront/ instead
 */
export class ChangePasswordByAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }
  /**
   * post change password by API
   * @param currentPass
   * @param newPass
   * @returns <number> status
   */
  async postChangePasswordByAPI(currentPass: string, newPass: string, token: string) {
    const response = await this.request.post(
      `https://${this.domain}/api/customer/next/change-password.json?token=${token}`,
      {
        data: {
          current_password: currentPass,
          new_password: newPass,
        },
      },
    );
    const actualStatus = response.status();
    return actualStatus === 200;
  }
}
