import { AppsAPI } from "@pages/api/apps";
import { APIRequestContext, expect } from "@playwright/test";
import type { CrossSellWidgetType, CrossSellWidget, FixtureApi, UpsellOffer } from "@types";

export class CrossSellAPI extends AppsAPI {
  shopId: number;

  constructor(domain: string, shopId?: number, request?: APIRequestContext) {
    super(domain, request);
    this.shopId = shopId;
  }

  /**
   * set trạng thái của boost upsell trong Apps
   * @param isOn
   * @returns
   */
  async setBoostUpsell(isOn: boolean): Promise<boolean> {
    try {
      const res = await this.request.put(`https://${this.domain}/admin/settings/app-enable/usell.json`, {
        data: {
          enable: isOn,
        },
      });
      const resBody = await res.json();
      return resBody.enable;
    } catch (error) {
      throw new Error(`Failed to set status for boost upsell: ${error}`);
    }
  }

  /**
   * Get all cross sell product widgets
   */
  async getProductWidgets(): Promise<CrossSellWidget[]> {
    try {
      const rawResponse = await this.request.get(
        `https://${this.domain}/admin/product-widgets/short-setting.json?shop_id=${this.shopId}`,
      );

      if (rawResponse.ok()) {
        const res = await rawResponse.json();
        return res;
      }

      return [];
    } catch (error) {
      throw new Error("Error when get product widgets", error.message);
    }
  }

  /**
   * Action enable/disable cross sell product widget
   * @param widgetType type of widget
   * @param status true|false
   */
  async changeProductWidgetStatus(widgetType: CrossSellWidgetType, status: boolean): Promise<boolean> {
    try {
      const rawResponse = await this.request.post(`https://${this.domain}/admin/product-widgets/change-status.json`, {
        data: {
          shop_id: this.shopId,
          widget_type: widgetType,
          active: status,
        },
      });

      if (rawResponse.ok()) {
        const res = await rawResponse.json();
        return res.success;
      }

      return false;
    } catch (error) {
      throw new Error("Error when change product widget status", error.message);
    }
  }

  /**
   * Get data of offer by Id
   * @param api Fixture api
   * @param id offer id
   * @returns
   */
  async getSpecificOffer(api: FixtureApi, id: number): Promise<UpsellOffer> {
    const res = await api.request<UpsellOffer>(
      {
        url: `https://${this.domain}/admin/offers/${id}.json`,
        method: "GET",
        response: {
          status: 200,
          data: {},
        },
      },
      { autoAuth: true },
    );
    return res.data;
  }

  /**
   * Handle on/off offer
   * @param params
   */
  async requestOnOffOffer(params: {
    api: APIRequestContext;
    domain: string;
    shop_id?: number;
    offer_ids: number[];
    status: boolean;
  }) {
    await expect(async () => {
      const res = await params.api.put(`https://${params.domain}/admin/offers/change-offer-status.json`, {
        data: {
          offer_ids: params.offer_ids,
          active: params.status,
          shop_id: params.shop_id,
        },
      });
      await expect(res).toBeOK();
    }).toPass({ timeout: 60_000 });
  }

  /**
   * Hàm bật tắt widget trong Product widgets
   * @param type: widget type
   * @param status: bật/tắt
   */
  async setProductWidgets(widgetType: string, status: boolean): Promise<boolean> {
    try {
      const res = await this.request.post(`https://${this.domain}/admin/product-widgets/change-status.json`, {
        data: {
          active: status,
          shop_id: this.shopId,
          widget_type: widgetType,
        },
      });
      const resBody = await res.json();
      return resBody.success;
    } catch (error) {
      throw new Error(`Set product widget ${widgetType}: ${error}`);
    }
  }
}
