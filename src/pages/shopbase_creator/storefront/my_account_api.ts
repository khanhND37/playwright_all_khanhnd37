import { APIRequestContext } from "@playwright/test";

export class MyAccountAPI {
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
  async statusChangePasswordByAPI(currentPass: string, newPass: string, token: string): Promise<boolean> {
    const response = await this.request.post(
      `https://${this.domain}/api/customer/next/change-password.json?token=${token}`,
      {
        data: {
          current_password: currentPass,
          new_password: newPass,
        },
      },
    );
    if (response.ok()) return true;
    else return false;
  }
}
