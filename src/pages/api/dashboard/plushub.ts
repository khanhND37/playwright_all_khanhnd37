import { waitTimeout } from "@core/utils/api";
import { APIRequestContext, expect, Page } from "@playwright/test";
import type {
  InvoicePurchaseInfo,
  PurchaseOrderInfo,
  Inventory,
  ListQuotation,
  ProductMappingInfo,
  FixtureApiResponse,
  SbOrders,
  DataOrderToFulfill,
  AutoPurchaseInfo,
  Claim,
  ReplaceWarehouseData,
  WarehouseInfo,
  ChangeMappingData,
  SaleOrderLinesDB,
  PurchaseOrders,
} from "@types";

export class PlusHubAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  /**
   * Get Purchase order ID
   * @param saleOrderId is id of SO
   * @param produtTemplateId is id of product
   * @param productId is id of variant
   */
  async getPurchaseOrderId(purchaseOrderInfo: PurchaseOrderInfo) {
    const response = await this.request.post(
      `https://${this.domain}/admin/panda-sourcing/warehouse/purchase-order.json`,
      {
        data: {
          ...purchaseOrderInfo,
        },
      },
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res.sbcn_draft_order_id;
  }

  /**
   * Pay purchase order
   * @param amoutCent is total amount
   * @param customId
   * @param productName
   * @param purchaseOrderId
   */
  async payPurchaseOrder(invoiceInfo: InvoicePurchaseInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/balance/invoices.json`, {
      data: {
        ...invoiceInfo,
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Canel SBCN draff order
   * @param purchaseOrderId
   */
  async cancelSBCNDraffOrder(purchaseOrderId: number) {
    const response = await this.request.delete(
      `https://${this.domain}/admin/panda-fulfillment/cancel-sbcn-draft-order.json?sbcn_draft_id=${purchaseOrderId}`,
    );
    expect(response.status()).toBe(200);
  }

  /**
   * Get value inventory in warehouse
   * @param productId is product template id
   * @returns data inventory
   */
  async getValueInventoryPurchase(
    productId: number,
    valueInventoryBefore?: Inventory,
    accessToken?: string,
  ): Promise<Inventory> {
    let dataInventory: Inventory;
    let response;
    const url = `https://${this.domain}/admin/panda-sourcing/warehouse/inventory.json?sbcn_product_id=${productId}`;
    // Wait trước khi get để get được data đúng
    await waitTimeout(3000);
    const getInventory = async (url: string) => {
      if (accessToken) {
        response = await this.request.get(url, {
          headers: {
            "X-ShopBase-Access-Token": accessToken,
          },
        });
      } else {
        response = await this.request.get(url);
      }
      expect(response.status()).toBe(200);
      const res = await response.json();
      dataInventory = res.result;
      return dataInventory[0];
    };
    dataInventory = await getInventory(url);
    if (valueInventoryBefore) {
      let i = 0;
      while (JSON.stringify(dataInventory) === JSON.stringify(valueInventoryBefore) && i < 40) {
        await waitTimeout(2000);
        dataInventory = await getInventory(url);
        i++;
      }
    }
    return dataInventory;
  }

  /**
   * Select order to fulfill
   * @param orderId is id of order
   * @param lineItemId is id of order
   * @returns purchase order id
   */
  async selectOrderToFulfill(dataOrderToFulfill: DataOrderToFulfill): Promise<number[]> {
    const response = await this.request.post(`https://${this.domain}/admin/panda-fulfillment/fulfill.json?`, {
      data: {
        ...dataOrderToFulfill,
      },
    });
    expect(response.status()).toBe(200);
    const res = await response.json();
    return [res.sbcn_draft_order_id, res.total_price_cent, res.auto_po_total_price_cent];
  }

  /**
   * Get list quotation
   * @param keySearch is key search: Quotation name, product name, url request ...
   * @tabName all| submitted_request| quotation_created| needs_update| quotation_expired| no_result
   * @returns list quotation data
   */
  async getListQuotation(keySearch: string, tabName = "all"): Promise<ListQuotation> {
    const response = await this.request.get(
      `https://${this.domain}/admin/panda-sourcing/quotations/v2.json?key=${keySearch}&tab=${tabName}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**get data quotation detail by quotation id
   * @param quotationId is quotation id
   * @param userAccessToken is user access token
   * return data quotation detail
   */
  async getDataQuotation(quotationId: number, userAccessToken: string): Promise<Array<SaleOrderLinesDB>> {
    const response = await this.request.get(
      `https://${this.domain}/admin/panda-sourcing/quotation-detail/${quotationId}.json`,
      {
        headers: {
          "X-ShopBase-Access-Token": userAccessToken,
        },
      },
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res.sale_order.sale_order_lines;
  }
  /**
   * Auto purchase enough item to fulfill order
   * @param autoPurchaseInfo
   */
  async autoPurchaseInFulFillOrder(autoPurchaseInfo: AutoPurchaseInfo) {
    const response = await this.request.post(
      `https://${this.domain}/admin/panda-fulfillment/change-fulfillment-type.json`,
      {
        data: {
          ...autoPurchaseInfo,
        },
      },
    );
    expect(response.status()).toBe(200);
  }

  /**
   * Replace warehouse item
   * @param newProductInfo is product id of product mapping
   */
  async replaceWarehouseItem(newProductInfo: ProductMappingInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/panda-fulfillment/products/replace.json`, {
      data: {
        ...newProductInfo,
      },
    });
    expect(response.status()).toBe(200);
  }

  /**
   * Get plushub orders API.
   * @param request query params
   */
  async searchFulfillOrders(request): Promise<FixtureApiResponse<SbOrders>> {
    const response = await this.request.post(
      `https://${this.domain}/admin/panda-fulfillment/fulfillment-info/orders.json`,
      {
        params: request,
        data: {},
      },
    );
    return {
      ok: response.status() === 200,
      data: await response.json(),
      status: response.status(),
    };
  }
  /**
   * Get Stocking ID in tab Purchase order
   * @param productWareHouse is name of product
   * @param stockPickingIdBefore is stock picking id before
   */

  async getStockPickingIdByApi(warehouseInfo: WarehouseInfo): Promise<number> {
    let stockPickingId: number;
    const purchaseOrder = await this.getPurchaseOrderInfo(warehouseInfo);
    stockPickingId = purchaseOrder[0].stock_picking_id;
    if (warehouseInfo.is_stock_picking_id_before === true) {
      let i = 0;
      while (stockPickingId === warehouseInfo.stock_picking_id_before && i < 5) {
        await waitTimeout(1000);
        const purchaseOrder = await this.getPurchaseOrderInfo(warehouseInfo);
        stockPickingId = purchaseOrder[0].stock_picking_id;
        i++;
      }
    }
    return stockPickingId;
  }

  /**
   * get data claim by claim id
   * @param claimId is claim id
   * return data claim
   */
  async getDataClaimByClaimId(claimId: number): Promise<Claim> {
    const response = await this.request.get(`https://${this.domain}/admin/panda-fulfillment/claim/${claimId}.json`);
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res;
  }

  /**
   * cancel claim by claim id
   * @param claimId is claim id
   */
  async cancelClaimByClaimId(claimId: number) {
    const response = await this.request.put(
      `https://${this.domain}/admin/panda-fulfillment/claim/${claimId}/cancellation.json`,
    );
    expect(response.status()).toBe(200);
  }

  /**
   * Get replace warehouse data in order detail
   * @param orderId is order id
   * @param maxRetry is retry time
   * @returns data replace warehouse
   */
  async getReplaceWarehouseData(orderId: number, maxRetry = 1): Promise<ReplaceWarehouseData> {
    for (let i = 0; i < maxRetry; i++) {
      const res = await this.request.get(
        `https://${this.domain}/admin/orders/plusbase/${orderId}/action-logs.json?limit=100&page=1`,
      );
      const resBody = await res.json();
      if (resBody?.log?.length && resBody.log[0].action === "replace-warehouse-item") {
        return JSON.parse(resBody.log[0].value);
      }
      await waitTimeout(2000);
      continue;
    }
    return Promise.reject(`Can't get replace warehouse data of order id: ${orderId}`);
  }

  /**
   * Change mapping order in fulfillment page
   * @param changeMappingData is data for change mapping
   */
  async changeMapping(changeMappingData: ChangeMappingData) {
    const response = await this.request.post(`https://${this.domain}/admin/panda-fulfillment/products/map.json`, {
      data: {
        ...changeMappingData,
      },
    });
    expect(response.status()).toBe(200);
  }

  /**
   * Release order in tab Need to review back to tab To fulfill
   * @param orderId is order id
   */
  async releaseOrder(orderId: Array<number>) {
    const response = await this.request.put(`https://${this.domain}/admin/panda-fulfillment/order-issue/release.json`, {
      data: {
        order_ids: orderId,
      },
    });
    expect(response.status()).toBe(200);
  }

  /**
   * Fetches purchase order information based on warehouse details.
   * @param warehouseInfo - The warehouse information.
   * @returns {Promise<Array<PurchaseOrders>>} An array of purchase orders.
   */
  async getPurchaseOrderInfo(warehouseInfo: WarehouseInfo): Promise<Array<PurchaseOrders>> {
    const response = await this.request.get(
      `https://${this.domain}/admin/panda-sourcing/warehouse/purchase-order.json?status=on_the_way&q=${warehouseInfo.product_warehouse}`,
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res.result;
  }

  /**
   * Purchase order by api
   * @param purchaseOrderInfo - data purchase
   */
  async purchaseOrder(purchaseOrderInfo: PurchaseOrderInfo) {
    const response = await this.request.post(
      `https://${this.domain}/admin/panda-sourcing/warehouse/purchase-order.json`,
      {
        data: {
          ...purchaseOrderInfo,
        },
      },
    );
    expect(response.status()).toBe(200);
  }
}
