import { APIRequestContext, expect } from "@playwright/test";
import type { KlavyioMember, SaleChannel } from "@types";
import { GoogleAds } from "@types";

export class SaleChannelAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get Sale Channels
   * @param req
   * @returns
   */
  async getSaleChannels(req: { marketing_type?: string }): Promise<Array<SaleChannel>> {
    const raw = await this.request.get(`https://${this.domain}/admin/sales-channel.json`, {
      params: req,
    });

    if (raw.ok()) {
      const response = await raw.json();
      return response.channels;
    } else {
      return Promise.reject("Error: Get customer error");
    }
  }

  /**
   * Setting Google Ads Conversions
   *@param shopId: Id of shop setting Google Ads
   * @param googleAds: Info setting in Google Ads: Conversion ID,Conversion Label,Conversion Goal,...
   * */

  async settingGoogleAds(googleAds: GoogleAds, shopId: number, isMultipleSF = false) {
    let url;
    if (!isMultipleSF) {
      url = `https://${this.domain}/admin/sales-channel/google-settings.json?shop_id=${shopId}`;
    } else {
      url = `https://${this.domain}/admin/sales-channel/google-settings.json?storefront_id=${shopId}`;
    }
    const res = await this.request.put(url, {
      data: {
        ga_enhanced_ecommerce: googleAds.ga_enhanced_ecommerce,
        gads_conversions: googleAds.gads_conversions,
        migrates: googleAds.migrates,
        enable_ga_remarketing: googleAds.enable_ga_remarketing,
        ga_remarketing_target: googleAds.ga_remarketing_target,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update sale channel
   * @param id
   * @param data
   * @returns
   */
  updateSaleChannel(id: number, data: { id: string; key: string }) {
    return this.request.put(`https://${this.domain}/admin/sales-channel/${id}.json`, {
      data: {
        accounts: {
          klaviyo_api_key: [data.id],
          klaviyo_secret_api_key: [data.key],
        },
        id,
      },
    });
  }

  async getKlavyioMembersByEmail(payload: {
    email: string;
    token: string;
    revision?: string;
  }): Promise<Array<KlavyioMember>> {
    const { email, token, revision } = payload;
    const raw = await this.fetchKlavyioMember(email, token, revision);
    if (raw.ok()) {
      const response = await raw.json();
      return response.data;
    } else {
      return Promise.reject("Error: Get customer error");
    }
  }

  async fetchKlavyioMember(email: string, token: string, revision?: string) {
    return await this.request.get(`https://a.klaviyo.com/api/profiles`, {
      headers: {
        Authorization: `Klaviyo-API-Key ${token}`,
        revision: revision || "2023-01-24",
      },
      params: {
        filter: `equals(email,"${email}")`,
      },
    });
  }

  /**
   * Get Klavyio Member ID By Email
   * @param payload
   */
  async getKlavyioMemberIDByEmail(payload: { email: string; token: string; revision?: string }): Promise<string> {
    const { email, token, revision } = payload;
    const member = await this.getKlavyioMembersByEmail({ email, token, revision });
    return member.map(item => item.id)[0];
  }

  /**
   * Get Klavyio Event By Email
   * @param payload
   */
  async getKlavyioEventByEmail(payload: { memberID: string; token: string }): Promise<Array<KlavyioMember>> {
    const { memberID, token } = payload;
    const raw = await this.request.get(
      `https://a.klaviyo.com/api/v1/person/${memberID}/metrics/timeline?api_key=${token}`,
    );
    if (raw.ok()) {
      const response = await raw.json();
      return response.data;
    } else {
      return Promise.reject("Error: Get event error");
    }
  }

  /**
   * Get Klavyio Metric ID By Email
   * @param payload
   */
  async getKlavyioMetricIDByEmail(payload: { token: string }): Promise<string> {
    const { token } = payload;
    const raw = await this.request.get(`https://a.klaviyo.com/api/v1/metrics?page=0&count=50&api_key=${token}`, {});
    if (raw.ok()) {
      const response = await raw.json();
      return response.data.map(item => item.id)[0];
    } else {
      return Promise.reject("Error: Get metric id error");
    }
  }
}
