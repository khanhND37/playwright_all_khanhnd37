import { APIRequestContext, expect } from "@playwright/test";

export class PaymentProviderAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * This function enables or disables test mode for a payment processor.
   * @param [isEnabled=true] - A boolean value indicating whether to enable or disable test mode. If set
   * to true, test mode will be enabled. If set to false, test mode will be disabled.
   */
  async enableTestmode(isEnabled = true) {
    const response = await this.request.put(`https://${this.domain}/admin/setting/creator.json`, {
      data: {
        phone: "",
        brand_name: "",
        descriptor: "DP*",
        is_cardholder_name_hidden: false,
        test_mode: {
          enable: isEnabled,
        },
      },
    });
    expect(response.status()).toBe(200);
  }
}
