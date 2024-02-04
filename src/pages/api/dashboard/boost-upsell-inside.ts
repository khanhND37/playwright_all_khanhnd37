import { APIRequestContext, expect } from "@playwright/test";
import { OfferDetail } from "@types";

export class BoostUpsellAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * get Created Date Offer
   * @param offerId offoffer id
   * @param shopID shop id
   * @returns Created Date Offer
   */
  async getCreatedDateOffer(offerId: number, shopID: number): Promise<string> {
    const res = await this.request.get(`https://${this.domain}/admin/offers/${offerId}.json`, {
      params: {
        shop_id: shopID,
      },
    });
    expect(res.status()).toBe(200);
    const dataOffer = await res.json();
    return dataOffer.created_at_str.substring(0, 10);
  }

  /**
   * get Info Performance if offer new created assign data performace = 0
   * @param offerId offoffer id
   * @param shopID shop id
   * @param inputDay time from created offer to input day
   * @returns
   */
  async getInfoPerformance(offerId: number, shopID: number, inputDay: string): Promise<OfferDetail> {
    const createDateOffer = await this.getCreatedDateOffer(offerId, shopID);
    const res = await this.request.post(`https://${this.domain}/admin/analytics.json`, {
      params: {
        shop_id: shopID,
      },
      data: {
        from_time: createDateOffer,
        to_time: inputDay,
        report_type: "offer",
        shop_ids: shopID,
        filters: [{ field: "offer_id", operator: "equals", value: offerId.toString() }],
      },
    });
    expect(res.status()).toBe(200);
    const dataPerformance = await res.json();
    const performance = dataPerformance.summary;

    // create init data
    const initData: OfferDetail = {
      sale: 0,
      view: 0,
      add_to_cart: 0,
      conversion_rate: 0,
      checkout_success: 0,
    };

    if (!performance) {
      return initData;
    } else {
      initData.sale = performance.acr_sales;
      initData.view = performance.acr_view;
      initData.add_to_cart = performance.acr_add_cart;
      initData.conversion_rate = performance.acr_rate;
      initData.checkout_success = performance.acr_checkout;
      return initData;
    }
  }

  /**
   * verify Data Performance Changes
   * @param dataPerformanceBefore data Performance Before checkout
   * @param validateData data want to validateData
   * @param offerId offoffer id
   * @param shopId shop id
   * @param inputDay time from created offer to input day
   * @returns
   */
  async DataPerformanceChanges(
    dataPerformanceBefore: OfferDetail,
    validateData: OfferDetail,
    offerId: number,
    shopId: number,
    inputDay: string,
    timeout: number,
  ): Promise<OfferDetail> {
    let timer;
    let isStop = false;
    return Promise.race([
      new Promise<OfferDetail>(resolve => {
        const checkPerformanceChanges = async () => {
          let dataChanges;

          // the firt assign Data want to validateData = data Performance Before checkout
          for (const key in validateData) {
            if (key in dataPerformanceBefore) {
              validateData[key] = dataPerformanceBefore[key];
            }
          }
          const keys = Object.keys(validateData);
          while (!isStop) {
            dataChanges = await this.getInfoPerformance(offerId, shopId, inputDay);
            const allKeysDifferent = keys.every(key => key in dataChanges && dataChanges[key] !== validateData[key]);

            if (allKeysDifferent) {
              isStop = true;
              resolve(dataChanges);
              return;
            }
          }
          resolve(dataChanges);
        };
        checkPerformanceChanges();
      }),
      new Promise<OfferDetail>(
        resolve =>
          (timer = setTimeout(() => {
            isStop = true;
            resolve(validateData);
          }, timeout)),
      ),
    ]).finally(() => clearTimeout(timer));
  }
}
