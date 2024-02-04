import { APIRequestContext, expect, Page } from "@playwright/test";
import type {
  AutoUpsellInfor,
  PerformanceOffer,
  CreateUpsellOffer,
  CreateUpsellOfferResponse,
  OnboardingApp,
  ParamsOffer,
  UpsellOffer,
} from "@types";
export class AppsAPI {
  domain: string;
  request: APIRequestContext;
  page: Page;

  constructor(domain: string, request?: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  /**
   * Get thông số performance cho Offer Upsell
   * @param offerId
   * @returns
   */
  async getPerformanceOffer(offerId: number): Promise<PerformanceOffer> {
    const date = new Date();
    const currentDate = date.toISOString().slice(0, 10);
    date.setDate(date.getDate() - 1);
    const previousDate = date.toISOString().slice(0, 10);
    const res = await this.request.post(`https://${this.domain}/admin/analytics.json`, {
      data: {
        from_time: previousDate,
        to_time: currentDate,
        report_type: "offer",
        filters: [
          {
            field: "offer_id",
            operator: "equals",
            value: offerId.toString(),
          },
        ],
      },
    });
    await expect(res).toBeOK();
    const resJson = await res.json();
    return resJson.summary;
  }

  /**
   * Get list upsell offer dựa theo type
   * @param params
   * @returns
   */
  async getListUpsellOffers(params?: ParamsOffer): Promise<UpsellOffer[]> {
    const res = await this.request.get(`https://${this.domain}/admin/offers/list.json`, {
      params: params,
    });
    expect(res.ok()).toBeTruthy();
    return await res.json();
  }

  /**
   * Tạo mới upsell offer
   * @param info
   * @returns
   */
  async createNewUpsellOffer(info: CreateUpsellOffer | UpsellOffer): Promise<CreateUpsellOfferResponse> {
    const res = await this.request.post(`https://${this.domain}/admin/offers.json`, {
      data: info,
    });
    expect(res.ok()).toBeTruthy();
    return await res.json();
  }

  async getCTABtnSettings() {
    const res = await this.request.get(`https://${this.domain}/admin/setting/app.json`, {
      params: {
        settings: "call_to_action,smart_up_sell,cart_product_suggestion,smart_cross_sell",
        app_code: "usell",
      },
    });
    expect(res.ok()).toBeTruthy();
    return await res.json();
  }

  /**
   * Thay đổi button action + bật tắt smart bundles, pre-purchase...
   * @param setting
   */
  async changeCTABtnSettings(setting: string) {
    const res = await this.request.post(`https://${this.domain}/admin/setting/app.json`, {
      data: {
        settings: setting,
        app_code: "usell",
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  /**
   * Xoá Upsell offer theo id
   * @param ids
   */
  async deleteAllUpsellOffers(ids: number[]) {
    const res = await this.request.delete(`https://${this.domain}/admin/offers/delete.json`, {
      data: {
        ids: ids,
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  /**
   * Get list offer auto upsell on shop template plusbase
   * @return data list offer
   */
  async getListOfferAutoUpSell(accessToken?: string): Promise<AutoUpsellInfor[]> {
    let url: string;
    if (accessToken) {
      url = `https://${this.domain}/admin/plusbase-sourcing/auto-offer.json?limit=100&access_token=${accessToken}`;
    } else {
      url = `https://${this.domain}/admin/plusbase-sourcing/auto-offer.json?limit=100`;
    }

    const res = await this.request.get(url);
    expect(res.status()).toBe(200);
    if (res.ok()) {
      return (await res.json()).data.result;
    }
    throw new Error("Error get list offer");
  }

  /**
   * Action for list offer auto upsell on shop template plusbase
   * @param offerIds list offer id
   * @param action Activated offer|Update offer|Delete offer
   * @param value true|false
   */

  async actionForOfferAutoUpSell(
    offerIds: Array<number>,
    action: "activated" | "update" | "delete",
    value: "true" | "false",
    accessToken?: string,
  ) {
    let url: string;
    if (accessToken) {
      url = `https://${this.domain}/admin/plusbase-sourcing/auto-offer/action.json?access_token=${accessToken}`;
    } else {
      url = `https://${this.domain}/admin/plusbase-sourcing/auto-offer/action.json`;
    }
    const res = await this.request.post(url, {
      data: {
        offer_ids: offerIds,
        value: value,
        action_field: action,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Action enable/disable app
   * @param appName app name
   * @param value true|false
   */
  async actionEnableDisableApp(appName: string, value: boolean) {
    const res = await this.request.put(`https://${this.domain}/admin/setting/app-enable/${appName}.json`, {
      data: {
        enable: value,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Hàm thay đổi data offer bằng API
   * @param id
   * @param data
   * @returns
   */
  async updateOffer(id: number, data: CreateUpsellOffer | UpsellOffer): Promise<CreateUpsellOfferResponse> {
    const res = await this.request.put(`https://${this.domain}/admin/offers/${id}.json`, {
      data: data,
    });
    await expect(res).toBeOK();
    const responseJson = await res.json();
    return responseJson.data;
  }

  /**
   * Clear onboarding cho shop
   * @param accessToken is token of the shop
   * @param domain: domain shop cần setting
   * @param Onboarding: thông tin cần setting
   */
  async setupOnboarding(domain: string, onboarding: OnboardingApp, accessToken: string) {
    const response = await this.request.post(`https://${domain}/admin/dashboards/app-onboarding.json`, {
      data: {
        app_code: onboarding.app_code,
        key_string: onboarding.key_string,
        value: onboarding.value,
      },
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });

    expect(response.ok()).toBeTruthy();
  }

  /**
   * get list offer id on sf
   * @param domain
   * @param productId
   * @returns
   */
  async getListOfferIdOfProductOnSF(domain: string, productId: number): Promise<Array<number>> {
    const response = await this.request.get(`https://${domain}/api/offers/list.json`, {
      params: {
        ref_ids: productId,
      },
    });
    expect(response.ok()).toBeTruthy();
    const responseJson = await response.json();
    const listOfferId = responseJson.map(item => item.id);
    return listOfferId;
  }

  /**
   * get list offer id on sf
   * @param domain
   * @param productId
   * @returns
   */
  async getListOfferInfoOfProductOnSF(domain: string, productId: number, locale?): Promise<AutoUpsellInfor[]> {
    const response = await this.request.get(`https://${domain}/api/offers/list.json?ref_ids=${productId}&lang=de`, {
      headers: {
        "X-Lang": locale,
      },
    });
    expect(response.ok()).toBeTruthy();
    const responseJson = await response.json();
    return responseJson;
  }

  /**
   * This function gets performance of an offer by id after buyer checkout an order
   * @param id is id offer
   * @param sale is the product's price added to order on post-purchase popup
   */
  async getPerformanceOfferById(id: number, sale: number) {
    const obj = await this.getPerformanceOffer(id);
    let exp;
    if (obj !== null) {
      exp = {
        acr_checkout: obj.acr_checkout + 1,
        acr_sales: obj.acr_sales + sale,
        acr_view: obj.acr_view + 1,
        acr_add_cart: obj.acr_add_cart + 1,
      };
    } else {
      exp = {
        acr_checkout: 1,
        acr_sales: sale,
        acr_view: 1,
        acr_add_cart: 1,
      };
    }
    return exp;
  }
}
