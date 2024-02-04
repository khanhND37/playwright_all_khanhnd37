import { APIRequestContext } from "@playwright/test";
import type { PaymentInfo } from "@types";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class PaymentProviderAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * This function for clone new object with exclude some fields which defined in excludeFields param
   * @param sourceObject source object
   * @param excludeFields fileds want to exclude
   * @returns cloned object with fields not exists in excludeFields param
   */
  cloneObject<TReturnType>(sourceObject: object, excludeFields: string[] = []): TReturnType {
    excludeFields = excludeFields || [];
    const newObject = {} as TReturnType;
    for (const key in sourceObject) {
      if (Object.prototype.hasOwnProperty.call(sourceObject, key) && excludeFields.indexOf(key) < 0) {
        newObject[key] = sourceObject[key];
      }
    }
    return newObject;
  }

  /**
   * send request create payment provider with api
   * @param paymentMethodInfo : info of provider from config
   * @returns
   */
  async connectPaymentProvider(paymentInfo: PaymentInfo, accessToken?: string) {
    let response;
    if (accessToken) {
      response = await this.request.post(`https://${this.domain}/admin/payments.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
        data: paymentInfo,
      });
    } else {
      response = await this.request.post(`https://${this.domain}/admin/payments.json`, {
        data: paymentInfo,
      });
    }

    const jsonResponse = await response.json();
    const paymentInfoAPI = this.cloneObject<PaymentInfo>(paymentInfo);
    if (response.status() === 200) {
      if (paymentInfo.active) {
        paymentInfoAPI.active = jsonResponse.payment_method.active;
      }

      if (paymentInfo.code) {
        paymentInfoAPI.code = jsonResponse.payment_method.code;
      }

      if (paymentInfo.title) {
        paymentInfoAPI.title = jsonResponse.payment_method.title;
      }

      if (paymentInfo.provider_options.api_key) {
        paymentInfoAPI.provider_options.api_key = jsonResponse.payment_method.provider_options.api_key;
      }

      if (paymentInfo.provider_options.client_id) {
        paymentInfoAPI.provider_options.client_id = jsonResponse.payment_method.provider_options.client_id;
      }

      if (paymentInfo.provider_options.client_secret) {
        paymentInfoAPI.provider_options.client_secret = jsonResponse.payment_method.provider_options.client_secret;
      }

      if (paymentInfo.provider_options.disable_update_tracking) {
        paymentInfoAPI.provider_options.disable_update_tracking =
          jsonResponse.payment_method.provider_options.disable_update_tracking;
      }

      if (paymentInfo.provider_options.enable_smart_button) {
        paymentInfoAPI.provider_options.enable_smart_button =
          jsonResponse.payment_method.provider_options.enable_smart_button;
      }

      if (paymentInfo.provider_options.public_key) {
        paymentInfoAPI.provider_options.public_key = jsonResponse.payment_method.provider_options.public_key;
      }

      if (paymentInfo.provider_options.sandbox) {
        paymentInfoAPI.provider_options.sandbox = jsonResponse.payment_method.provider_options.sandbox;
      }

      if (paymentInfo.provider_options.secret_key) {
        paymentInfoAPI.provider_options.secret_key = jsonResponse.payment_method.provider_options.secret_key;
      }

      return paymentInfoAPI;
    } else {
      return jsonResponse.error;
    }
  }

  /**
   * after send request create payment provider, this function get payment provider id
   * @param paymentInfo info of provider from config
   * @returns
   */
  async getProviderID(paymentInfo: PaymentInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/payments.json`, {
      data: paymentInfo,
    });
    const jsonResponse = await response.json();
    return jsonResponse.payment_method.id;
  }

  /**
   * send requestd delete provider with API and provider id
   * @param providerId
   * @returns
   */
  async deleteProvider(providerId: string) {
    const response = await this.request.delete(`https://${this.domain}/admin/payments/${providerId}.json`);
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.deleted;
    } else {
      return false;
    }
  }
}
