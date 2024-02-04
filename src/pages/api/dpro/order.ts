import { dateFilter } from "@core/utils/datetime";
import { printLog } from "@core/utils/logger";
import { APIRequestContext, expect } from "@playwright/test";
import type { ResponseAbandonedCheckout, ResponseOrder } from "@types";
/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class orderAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  async getOrder(limit: string, page: string): Promise<ResponseOrder> {
    const response = await this.request.get(
      `https://${this.domain}/admin/orders/v2.json?` +
        {
          params: {
            fields:
              "id,name,email,created_at,customer,financial_status,fulfillment_status,sales_channel,created_source,total_price,fulfillments,line_items,shop_id,closed_at,product_mappings,source_name,is_risk,note,print_file_status,shipment_status,payment_gateway,chargeback_deadline_at&line_item_fields=id,fulfillment_status,image_src,title,product_id,variant_title,created_at,quantity,raw_price,holding_time&tab=all",
            orderType: "order",
            limit: limit,
            page: page,
            sort_field: "created_at",
            sort_mode: "desc",
            view_product_mapping: true,
            search_option: "order_name",
          },
        },
    );
    if (!response.ok()) {
      const responseText = await response.text();
      printLog(responseText);
    }
    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    return jsonResponse;
  }

  /**
   * Api get order list, filter list order
   * @param filter: filter order theo status,product name...
   * @param type = string, today, yesterday, last7days, thisMonth
   * @param value: value filter
   * @return số lượng order khi filter
   */
  async getOrderList(filter?: Array<{ field: string; type: string; value: string }>) {
    let response;
    const paramFilter = [];
    if (filter.length > 0) {
      let filterStr1 = "";
      let filterStr2 = "";
      filter.forEach(filterField => {
        if (filterField.type === "string") {
          filterStr1 = `${filterField.field}=${filterField.value}`;
          paramFilter.push(filterStr1);
        } else {
          const date = dateFilter(filterField.type);
          filterStr1 += `${filterField.field}_min=${date.from}`;
          filterStr2 += `${filterField.field}_max=${date.to}`;
          paramFilter.push(filterStr1, filterStr2);
        }
      });
      response = await this.request.get(`https://${this.domain}/admin/orders/v2.json?${paramFilter.join("&")}`);
    } else {
      response = await this.request.get(`https://${this.domain}/admin/orders/v2.json`);
    }
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const length = Object.keys(jsonResponse.orders).length;
      return length;
    }
  }

  /**
   * Api get count order list
   * @param filter: filter order theo status,product name...
   * @param type = string, today, yesterday, last7days, thisMonth
   * @param value: value filter
   * @return count số lượng order khi filter
   */
  async countOrderList(filter?: Array<{ field: string; type: string; value: string }>) {
    let response;
    const paramFilter = [];
    if (filter.length > 0) {
      let filterStr1 = "";
      let filterStr2 = "";
      filter.forEach(filterField => {
        if (filterField.type === "string") {
          filterStr1 = `${filterField.field}=${filterField.value}`;
          paramFilter.push(filterStr1);
        } else {
          const date = dateFilter(filterField.type);
          filterStr1 += `${filterField.field}_min=${date.from}`;
          filterStr2 += `${filterField.field}_max=${date.to}`;
          paramFilter.push(filterStr1, filterStr2);
        }
      });
      response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json?${paramFilter.join("&")}`);
    } else {
      response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json`);
    }
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.count;
    }
  }

  /**
   * Get infor order detail
   * @param orderId: id order cần lấy thông tin
   * @returns: orderId và total price order
   */
  async getOrderInfo(orderId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/orders/${orderId}.json`);
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return {
        order_id: jsonResponse.order.id,
        subtotal: jsonResponse.order.total_price,
      };
    }
  }

  /**
   * Get line item in order detail
   * @param orderId: id order cần lấy thông tin
   * @param lineItemName: name item đã checkout
   * @returns: name, price và quantity của lineItem
   */
  async getLineItemOrderDetail(orderId: number, lineItemName: string) {
    const response = await this.request.get(`https://${this.domain}/admin/orders/edited/${orderId}.json`);
    if (response.status() === 200) {
      const resBody = await response.json();
      const lineItemInfo = resBody.order.line_items;
      const lineName = lineItemInfo.find(({ name }) => name === lineItemName).name;
      const lineItemPrice = lineItemInfo.find(({ name }) => name === lineItemName).price;
      const lineQuantity = lineItemInfo.find(({ name }) => name === lineItemName).quantity;
      return {
        name: lineName,
        price: lineItemPrice,
        quantity: lineQuantity,
      };
    }
  }

  /**
   * Get customer in order detail
   * @param orderId: id order cần lấy thông tin
   * @returns: email, firstName và lastName của customer
   */
  async getCustomerOrderDetail(orderId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/orders/edited/${orderId}.json`);
    if (response.status() === 200) {
      const resBody = await response.json();
      const customerInfo = resBody.order.customer;
      return {
        email: customerInfo.email,
        firstName: customerInfo.first_name,
        lastName: customerInfo.last_name,
      };
    }
  }

  /**
   * Get customer in order detail
   * @param orderId: id order cần lấy thông tin
   * @return số event timeline
   */
  async getTimelineOrderDetail(orderId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/orders/${orderId}/timeline.json`);
    if (response.status() === 200) {
      const resBody = await response.json();
      const lenghtTimeline = Object.keys(resBody.timeline_items).length;
      return lenghtTimeline;
    }
  }

  /**
   * Api get abandoned checkout list, filter checkout list
   * @returns: số checkout trong list
   */
  async getAbandonedCheckoutList(
    filter?: Array<{ field: string; type: string; value: string }>,
  ): Promise<ResponseAbandonedCheckout> {
    let response;
    const paramFilter = [];
    if (filter.length > 0) {
      let filterStr1 = "";
      let filterStr2 = "";
      filter.forEach(filterField => {
        if (filterField.type === "string") {
          filterStr1 = `${filterField.field}=${filterField.value}`;
          paramFilter.push(filterStr1);
        } else {
          const date = dateFilter(filterField.type);
          filterStr1 += `${filterField.field}_min=${date.from}`;
          filterStr2 += `${filterField.field}_max=${date.to}`;
          paramFilter.push(filterStr1, filterStr2);
        }
      });
      response = await this.request.get(`https://${this.domain}/admin/checkouts.json?${paramFilter.join("&")}`);
    } else {
      response = await this.request.get(`https://${this.domain}/admin/checkouts.json`);
    }
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const res = jsonResponse.checkouts;
      return res;
    }
  }

  /**
   * Api get count abandoned checkout list
   * @param filter: thông tin get count checkout list theo filter
   * @returns: số lượng order trong list
   */
  async countAbandonedCheckout(filter?: Array<{ field: string; type: string; value: string }>) {
    let response;
    const paramFilter = [];
    if (filter.length > 0) {
      let filterStr1 = "";
      let filterStr2 = "";
      filter.forEach(filterField => {
        if (filterField.type === "string") {
          filterStr1 = `${filterField.field}=${filterField.value}`;
          paramFilter.push(filterStr1);
        } else {
          const date = dateFilter(filterField.type);
          filterStr1 += `${filterField.field}_min=${date.from}`;
          filterStr2 += `${filterField.field}_max=${date.to}`;
          paramFilter.push(filterStr1, filterStr2);
        }
      });
      response = await this.request.get(`https://${this.domain}/admin/checkouts/count.json?${paramFilter.join("&")}`);
    } else {
      response = await this.request.get(`https://${this.domain}/admin/checkouts/count.json`);
    }
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.count;
    }
  }

  /**
   * Get infor abandoned checkout detail
   * @param checkoutId: id order cần lấy thông tin
   * @returns: checkout_id và total_price của checkout
   */
  async getCheckoutInfo(checkoutId: number) {
    const response = await this.request.get(
      `https://${this.domain}/admin/checkouts/${checkoutId}.json?is_completed=true`,
    );
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return {
        checkout_id: jsonResponse.checkout.id,
        total_price: jsonResponse.checkout.total_price,
      };
    }
  }

  /**
   * Get line item in abandoned checkout detail
   * @param checkoutId: id abandoned checkout cần lấy thông tin
   * @param lineItemName: name item
   * @returns: title, price và quantity của lineItem checkout
   */
  async getLineItemCheckoutDetail(checkoutId: number, lineItemName: string) {
    const response = await this.request.get(
      `https://${this.domain}/admin/checkouts/${checkoutId}.json?is_completed=true`,
    );
    if (response.status() === 200) {
      const resBody = await response.json();
      const lineItemInfo = resBody.checkout.line_items;
      const lineName = lineItemInfo.find(({ title }) => title === lineItemName).title;
      const lineItemPrice = lineItemInfo.find(({ title }) => title === lineItemName).price;
      const lineQuantity = lineItemInfo.find(({ title }) => title === lineItemName).quantity;
      return {
        title: lineName,
        price: lineItemPrice,
        quantity: lineQuantity,
      };
    }
  }

  /**
   * Get customer in abandoned checkout detail
   * @param checkoutId: id abandoned checkout cần lấy thông tin
   * @returns: email và note của customer
   */
  async getCustomerCheckoutDetail(checkoutId: number) {
    const response = await this.request.get(
      `https://${this.domain}/admin/checkouts/${checkoutId}.json?is_completed=true`,
    );
    if (response.status() === 200) {
      const resBody = await response.json();
      const customerInfo = resBody.checkout.customer;
      return {
        email: customerInfo.email,
        note: customerInfo.note,
      };
    }
  }

  /**
   * Get customer in abandoned checkout detail
   * @param checkoutId: id abandoned checkout cần lấy thông tin
   * @return số event timeline
   */
  async getTimelineCheckoutDetail(checkoutId: number) {
    const response = await this.request.get(
      `https://${this.domain}/admin/checkouts/${checkoutId}/timeline.json?is_completed=true`,
    );
    if (response.status() === 200) {
      const resBody = await response.json();
      const lenghtTimeline = Object.keys(resBody.timeline_items).length;
      return lenghtTimeline;
    }
  }

  /**
   * get total order of shop with api
   * @returns number of order on order list
   */
  async getNumberOfOrder(accessToken?: string) {
    let response;
    if (accessToken) {
      response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json`);
    }

    if (response.status() === 200) {
      const resBody = await response.json();
      const count = resBody.count as number;
      return count;
    }
  }
}
