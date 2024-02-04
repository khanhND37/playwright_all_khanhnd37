import { APIResponse, expect } from "@playwright/test";
import type { PlbOrder, SbOrders } from "@types";
import { waitTimeout } from "@core/utils/api";
import type {
  FixtureApiResponse,
  FilterOrderParam,
  DataHoldFromPayout,
  HoldBalanceApiResponse,
  ReleaseHoldFromPayoutResponse,
} from "@types";
import { OrderAPI } from "@pages/api/order";
export class PlusbaseOrderAPI extends OrderAPI {
  /**
   * Get plusbase orders API in order list.
   * @param request query params
   */
  async searchOrders(request): Promise<FixtureApiResponse<SbOrders>> {
    const getOrder = async params => {
      return await this.request.get(`https://${this.domain}/admin/orders/v2.json`, {
        params,
      });
    };
    let response: APIResponse;
    let data: SbOrders;
    let dataOrder = [];
    let i = 0;
    while (dataOrder.length < 1 && i < 10) {
      response = await getOrder(request);
      expect(response.status()).toBe(200);
      data = await response.json();
      dataOrder = data.orders;
      i++;
    }

    return {
      ok: response.status() === 200,
      data,
      status: response.status(),
    };
  }

  /**
   * Get plubase order detail by API.
   * @param orderId sb order id
   * @param opts
   */
  async getOrderPlbDetail(
    orderId: number,
    opts: {
      retry?: number;
      waitBefore?: number;
    },
  ): Promise<PlbOrder> {
    if (opts.waitBefore) {
      await waitTimeout(opts.waitBefore);
    }
    const url = `https://${this.domain}/admin/orders/plusbase/${orderId}.json`;
    let response;
    response = await this.request.get(url);
    if (!opts.retry) {
      expect(response.status()).toBe(200);
      return await response.json();
    }
    let plusbaseOrder: PlbOrder;
    plusbaseOrder = await response.json();
    if (plusbaseOrder.id) {
      return plusbaseOrder;
    }
    for (let i = 0; i < opts.retry; i++) {
      await waitTimeout(opts.waitBefore);
      response = await this.request.get(url);
      if (response.status() === 404) {
        continue;
      }
      plusbaseOrder = await response.json();
      if (plusbaseOrder.id) break;
    }
    expect(response.status()).toBe(200);
    return plusbaseOrder;
  }

  /**
   * Get plusbase order detail API.
   */
  async getPlbOrder(id: number): Promise<PlbOrder> {
    const response = await this.request.get(`https://${this.domain}/admin/orders/plusbase/${id}.json`);
    expect(response.status()).toBe(200);
    return response.json();
  }

  /**
   * API support auto reserve DO out
   * @params variant product ID
   * @params domain store template PLB
   */
  async autoReserveDoOut(productId: number, domain: string) {
    const res = await this.request.post(`https://${domain}/admin/panda-fulfillment/auto-reserve-do-out.json`, {
      data: {
        product_ids: [productId],
        should_notify: false,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Approve order by api
   * @param orderId is order id
   */
  async approveOrderByApi(orderId: number, accessToken?: string) {
    let url: string;
    if (accessToken) {
      url = `https://${this.domain}/admin/orders/plusbase/order-approval.json?access_token=${accessToken}`;
    } else {
      url = `https://${this.domain}/admin/orders/plusbase/order-approval.json`;
    }

    const res = await this.request.put(url, {
      data: {
        order_ids: [orderId],
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Wait for log activity on shop template order plusbase
   * @param orderId is id of order
   * @param action action for order
   */
  async waitForLogActivity(
    orderId: number,
    action: "approve-order" | "capture-order" | "refund-order" | "cancel-order" | "hold-order",
    accessToken?: string,
  ): Promise<void> {
    let log: Array<string>;
    const url = `https://${this.domain}/admin/orders/plusbase/${orderId}/action-logs.json?limit=100&page=1`;

    const getActivityLog = async (url: string) => {
      let resBody: APIResponse;
      if (accessToken) {
        resBody = await this.request.get(url, {
          headers: {
            "X-ShopBase-Access-Token": accessToken,
          },
        });
      } else {
        resBody = await this.request.get(url);
      }
      expect(resBody.status()).toBe(200);
      const res = await resBody.json();
      const activityLog = res.log;
      log = activityLog.map(item => item.action);
      return log;
    };

    log = await getActivityLog(url);
    let i = 0;
    while (!log.includes(action) && i < 30) {
      waitTimeout(1000);
      log = await getActivityLog(url);
      i++;
    }
  }

  /**
   * Get data base cost with line item and total base cost
   * @param orderId is order id
   * @returns data base cost with line item and total base cost
   */
  async getBaseCost(orderId: number): Promise<Map<string, number>> {
    const dataBaseCost = new Map<string, number>();
    const dataPlbOrder = await this.getPlbOrder(orderId);
    dataBaseCost.set("base_cost", dataPlbOrder.base_cost);
    const dataSbOrder = await this.getOrderInfo(orderId);
    dataPlbOrder.line_items.map(item => {
      const variantId = dataSbOrder.lineItems.find(
        (lineItem: { id: number }) => lineItem.id === item.sb_line_item_id,
      ).variant_id;
      dataBaseCost.set(variantId.toString(), item.base_cost);
    });
    return dataBaseCost;
  }

  /**
   * Count sbcn product of order by created date
   * @param productId is sb product id
   * @param params is condition filter
   * @returns total is quantity of product
   */
  async qtyOfProductDailyPack(productId: Array<number>, timeConfig: number, params?: FilterOrderParam) {
    const orderList = await this.searchOrders(params);
    let qtyAfterThreadHold = 0;
    let qtyBeforeThreadHold = 0;
    for (const order of orderList.data.orders) {
      for (const lineItem of order.line_items) {
        if (productId.includes(lineItem.product_id)) {
          const timeZone = order.created_at_in_timezone.split("T")[1];
          const setTime = timeZone.split(":")[0];
          if (Number(setTime) >= timeConfig) {
            qtyAfterThreadHold = qtyAfterThreadHold + lineItem.fulfillable_quantity;
          } else {
            qtyBeforeThreadHold = qtyBeforeThreadHold + lineItem.fulfillable_quantity;
          }
        }
      }
    }

    const dataQuantityOfProduct = {
      qtyAfterThreadHold: qtyAfterThreadHold,
      qtyBeforeThreadHold: qtyBeforeThreadHold,
    };

    return dataQuantityOfProduct;
  }

  /**
   * Trigger re-calculator profit order PLB
   * @param shopId is shop id merchant
   * @param orderId is order want re-calculator profit
   */
  async triggerReCalculatorProfit(shopId: number, orderId: number): Promise<void> {
    const res = await this.request.get(
      `https://${this.domain}/admin/panda-fulfillment/trigger_moq.json?shop_trigger_id=${shopId}&order_trigger_id=${orderId}`,
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    expect(res.status()).toBe(200);
  }

  /**
   * Hold from payout order PLB
   * @param dataHoldFromPayout
   */
  async holdFromPayoutPlb(dataHoldFromPayout: DataHoldFromPayout): Promise<HoldBalanceApiResponse> {
    const res = await this.request.post(`https://${this.domain}/admin/orders/plusbase/hold-balance.json`, {
      data: {
        ...dataHoldFromPayout,
      },
    });
    expect(res.status()).toBe(200);
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody as HoldBalanceApiResponse;
  }

  /**
   * Release hold from payout order PLB
   * @param orderIds is order ids
   */
  async releaseHoldFromPayout(orderIds: Array<number>): Promise<ReleaseHoldFromPayoutResponse> {
    const res = await this.request.post(`https://${this.domain}/admin/orders/plusbase/release-balance.json`, {
      data: {
        order_ids: orderIds,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody as ReleaseHoldFromPayoutResponse;
  }

  /**
   * Calculates the daily pack quantity for a product based on time criteria.
   * @param productId - An array of product IDs to filter orders.
   * @param timeConfig - The time threshold for filtering orders.
   * @param todayDate - Filter parameters for today's orders (optional).
   * @param yesterdayDate - Filter parameters for yesterday's orders (optional).
   * @returns The daily pack quantity for the specified product.
   */
  async dailyPackQty(
    productId: number[],
    timeConfig: number,
    todayDate: FilterOrderParam,
    yesterdayDate: FilterOrderParam,
  ): Promise<number> {
    // Calculate total quantities for today and yesterday.
    const dataToday = await this.qtyOfProductDailyPack(productId, timeConfig, todayDate);
    const dataYesterday = await this.qtyOfProductDailyPack(productId, timeConfig, yesterdayDate);

    // Initialize the daily pack quantity.
    let dailyPackQty = 0;

    if (dataToday.qtyAfterThreadHold === 0) {
      // If there are no quantities for today, add quantities from yesterday.
      dailyPackQty = dataToday.qtyBeforeThreadHold + dataYesterday.qtyAfterThreadHold;
    } else {
      // Otherwise, use quantities for today.
      dailyPackQty = dataToday.qtyAfterThreadHold;
    }

    return dailyPackQty;
  }
}
