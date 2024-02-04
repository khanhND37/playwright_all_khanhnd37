import { printLog } from "@core/utils/logger";
import { APIRequestContext, expect } from "@playwright/test";
import type { AffiliateCommission, CommissionAPIResponse, DataRefPrintBaseOrPlusBase, DataSummary } from "@types";

export class PartnerDashboardAPI {
  apiEndpoint: string;
  request: APIRequestContext;

  constructor(apiEndpoint: string, request: APIRequestContext) {
    this.apiEndpoint = apiEndpoint;
    this.request = request;
  }

  async getCommissionByApi(data: AffiliateCommission): Promise<CommissionAPIResponse> {
    const res = await this.request.get(`${this.apiEndpoint}/admin/affiliate/cashback-statistic`, {
      params: {
        user_id: data.userId,
        page: data.page,
        limit: data.limit,
        search: data.email,
        is_search: data.isSearch,
        shop_type: data.platform,
        start_date: data.startDate,
        end_date: data.endDate,
      },
    });
    if (!res.ok()) {
      const responseText = await res.text();
      printLog(responseText);
      return;
    }
    const jsonResponse = await res.json();
    return jsonResponse;
  }

  async getSummaryCommissionByApi(data: AffiliateCommission): Promise<DataSummary> {
    const commision = await this.getCommissionByApi(data);
    const summary = {
      totalClick: commision.total_click,
      totalRef: commision.total_ref_user,
      totalQualifiedItems: commision.total_qualified_item,
      totalHoldItem: commision.total_hold_item,
      totalCashback: commision.total_cashback,
      totalRefInTime: commision.quantity_ref_user_in_time,
    };
    return summary;
  }

  async getCommissionDetailPrintBaseByApi(data: AffiliateCommission): Promise<DataRefPrintBaseOrPlusBase> {
    const commision = await this.getCommissionByApi(data);
    const commisionDetail = {
      qualifiedItemsGB: commision.list[data.refId].gold_base_data.qualified_item,
      holdItemsGB: commision.list[data.refId].gold_base_data.hold_item,
      cashbackGB: commision.list[data.refId].gold_base_data.cashback,
      qualifiedItemsSB: commision.list[data.refId].silver_base_data.qualified_item,
      holdItemsSB: commision.list[data.refId].silver_base_data.hold_item,
      cashbackSB: commision.list[data.refId].silver_base_data.cashback,
      totalCashback: commision.list[data.refId].total_cashback_user,
    };
    return commisionDetail;
  }

  async getCommissionDetailPlusBaseByApi(data: AffiliateCommission): Promise<DataRefPrintBaseOrPlusBase> {
    const commision = await this.getCommissionByApi(data);
    const commisionDetail = {
      qualifiedItemsGB: commision.list[data.refId].plus_base_data_sorted[1].qualified_item,
      holdItemsGB: commision.list[data.refId].plus_base_data_sorted[1].hold_item,
      cashbackGB: commision.list[data.refId].plus_base_data_sorted[1].cashback,
      qualifiedItemsSB: commision.list[data.refId].plus_base_data_sorted[0].qualified_item,
      holdItemsSB: commision.list[data.refId].plus_base_data_sorted[0].hold_item,
      cashbackSB: commision.list[data.refId].plus_base_data_sorted[0].cashback,
      totalCashback: commision.list[data.refId].total_cashback_user,
    };
    return commisionDetail;
  }

  /**
   * Hàm get tổng ref trong 1 khoảng thời gian filter
   * @param data
   * @returns
   */
  async getTotalRefShopBaseInTime(data: AffiliateCommission): Promise<number> {
    const res = await this.request.get(`${this.apiEndpoint}/admin/partner/affiliate/statistics`, {
      params: {
        page: data.page,
        limit: data.limit,
        type: data.type,
        start_date: data.startDate,
        end_date: data.endDate,
      },
    });
    if (!res.ok()) {
      const responseText = await res.text();
      printLog(responseText);
      return;
    }
    expect(res.ok()).toBeTruthy();
    const jsonResponse = await res.json();
    return jsonResponse.total;
  }
}
