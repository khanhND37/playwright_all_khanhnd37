import { buildQueryString } from "@core/utils/string";
import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import type { GetCustomerAPI } from "@types";

export class CustomerAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get customer already signup
   * @param page
   * @param limit
   * @param query
   * @param order
   */
  async getCustomers({
    page = 1,
    limit = 50,
    query = "",
    order = "updated_at desc",
  }: GetCustomerAPI): Promise<APIResponse> {
    const raw = await this.request.get(`https://${this.domain}/admin/customers.json`, {
      params: { page, limit, order, query },
    });

    if (raw.ok()) {
      const response = await raw.json();
      return response.customers;
    } else {
      return Promise.reject("Error: Get customer error");
    }
  }

  /**
   * Count customers
   * @param query
   * @returns
   */
  async countCustomers(query?: { form_ids?: string; platform?: string }): Promise<number> {
    const raw = await this.request.get(`https://${this.domain}/admin/customers/count.json?${buildQueryString(query)}`);
    if (raw.ok()) {
      const response = await raw.json();
      return response.count;
    } else {
      return Promise.reject("Error: Count customer error");
    }
  }

  /**
   * Get customer forms
   * @returns list of forms
   */
  async getCustomerForms(): Promise<Array<{ id: number; title: string }>> {
    const raw = await this.request.get(`https://${this.domain}/admin/customers/forms.json`);
    if (raw.ok()) {
      const response = await raw.json();
      return response.forms;
    } else {
      return Promise.reject("Error: Get customer forms error");
    }
  }

  /**
   * Get form submissions
   * @param customerId
   * @returns list of form submissions
   */
  async getFormSubmissions(customerId: number): Promise<Array<{ id: number; title: string; form_url: string }>> {
    const raw = await this.request.get(`https://${this.domain}/admin/customers/${customerId}/form-submission.json`);
    if (raw.ok()) {
      const response = await raw.json();
      return response.submissions;
    } else {
      return Promise.reject("Error: Get form submissions error");
    }
  }

  /**
   * get all info of customer on dashboard
   * @param emailCustomer: email of customer
   */
  async getCustomerInfoByEmail(emailCustomer: string) {
    const res = await this.request.get(`https://${this.domain}/admin/customers.json?query=${emailCustomer}`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.customers[0];
  }
}
