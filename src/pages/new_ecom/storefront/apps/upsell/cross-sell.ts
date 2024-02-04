import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { APIRequestContext, expect } from "@playwright/test";
import type { FixtureApi, UpsellOffer } from "@types";

export class SFUpSellAPI {
  domain: string;
  request: APIRequestContext;
  api: FixtureApi;
  constructor(domain: string, api?: FixtureApi, request?: APIRequestContext) {
    this.domain = domain;
    this.api = api;
    this.request = request;
  }

  /**
   * Get list offer ngoài storefront
   * @param api fixture api
   * @param refIds Id của product target (kèm id collection nếu product thuộc collection)
   * @returns
   */
  async getListOfferInSF(refIds: number[]): Promise<UpsellOffer[]> {
    const res = await this.api.request<UpsellOffer[]>({
      url: `https://${this.domain}/api/offers/list.json?ref_ids=${refIds.join(",")}`,
      response: {
        status: 200,
        data: {},
      },
    });
    return res.data;
  }

  /**
   * Handle purge cache api in cart offer
   * @param api
   * @param domain
   * @returns
   */
  requestPurgeCacheInCart() {
    return this.api.request<Record<string, number>[]>({
      url: `https://${this.domain}/api/offers/cart-recommend.json?skip_cache=true`,
      method: "POST",
      request: {
        data: {
          cart_items: [],
        },
      },
    });
  }

  /**
   * Wait offer update in Storefront match data with dashboard
   * @param ids: offer's ids
   * @param matchData
   * @param timeout
   */
  async waitOfferUpdated(ids: number[], matchData = {}, timeout = 60000) {
    const promies = [];
    let refIds = [];
    const upsellAPI = new CrossSellAPI(this.domain);
    ids.forEach(id => {
      promies.push(upsellAPI.getSpecificOffer(this.api, id));
    });
    const responseOffers = await Promise.all(promies);
    responseOffers.forEach(res => {
      refIds = refIds.concat(res.target_ids);
    });
    await expect(async () => {
      const listOfferSF = await this.getListOfferInSF(refIds);
      const isTruthy = ids.every(id => listOfferSF.find(offer => offer.id === id));
      expect(isTruthy).toBeTruthy();
      if (matchData && Object.keys(matchData).length > 0) {
        for (let i = 0; i < ids.length; i++) {
          const offer = listOfferSF.find(o => ids[i] === o.id);
          expect(offer).toMatchObject(matchData);
        }
      }
    }).toPass({ timeout });
  }

  /**
   * Hàm wait offer hết cache (VD: Thêm hoặc xoá offer -> check số lượng dựa vào data truyền vào)
   * @param prodId
   * @param data
   */
  async waitOfferUntilNotCache(prodId: number[], data: { id: number; offer_type: string }[], timeout = 60_000) {
    await expect(async () => {
      const listOfferSF = await this.getListOfferInSF(prodId);
      const offers =
        data.length > 0 ? listOfferSF.filter(o => data.some(d => d.offer_type === o.offer_type)) : listOfferSF;
      expect(offers.length).toEqual(data.length);
      const isTruthy = data.every(d => offers.find(offer => offer.id === d.id));
      expect(isTruthy).toBeTruthy();
    }).toPass({ timeout: timeout });
  }
}
