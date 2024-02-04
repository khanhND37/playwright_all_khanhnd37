import { AppsAPI } from "@pages/api/apps";
import { APIRequestContext, expect } from "@playwright/test";
import type { DataReviewInApp, DataReviews, ReviewSF, Reviews, SettingReviewApp, paramCountRviews } from "@types";

export class ReviewAppAPI extends AppsAPI {
  shopId: number;

  constructor(domain: string, shopId?: number, request?: APIRequestContext) {
    super(domain, request);
    this.shopId = shopId;
  }

  /**
   * count reviews in dashboard by API
   */
  async countReviews(params?: paramCountRviews): Promise<number> {
    try {
      const response = await this.request.get(`https://${this.domain}/admin/reviews/count.json`, {
        params: params,
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      return await data.count;
    } catch (error) {
      throw new Error("Count reviews failed");
    }
  }
  /**
   *get All Review Product By ID
   * @param productId
   * @returns
   */
  async getAllReviewProductByID(productId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/reviews.json?product_id=${productId}`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    return data;
  }

  /**
   * delete All Review Product By ID
   * @param productId
   */
  async deleteAllReviewProductByID(productId: number): Promise<void> {
    try {
      const dataReview = await this.getAllReviewProductByID(productId);
      let listIdReview = [];
      if (dataReview.reviews) {
        listIdReview = dataReview.reviews.map(reviewID => reviewID.id);
      }
      const id: string = listIdReview.join(",");
      if (listIdReview.length > 0) {
        const response = await this.request.delete(`https://${this.domain}/admin/reviews/deletes.json`, {
          params: {
            ids: id,
          },
        });
        expect(response.status()).toBe(200);
      }
    } catch (error) {
      throw new Error("Delete review failed");
    }
  }

  /**
   * get Review SF By Id
   * @param productId
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getReviewSFById(productId: number): Promise<any> {
    try {
      const apiUrl = `https://${this.domain}/api/review/widget.json`;
      const response = await this.request.get(apiUrl, {
        params: {
          product_ids: productId,
        },
      });
      expect(response.status()).toBe(200);
      return await response.json();
    } catch (error) {
      throw new Error("get review SF By Id failed");
    }
  }

  /**
   * Setting app Review
   * @param dataSetting settings of App Review
   */
  async settingReviewApp(dataSetting: SettingReviewApp): Promise<void> {
    const res = await this.request.put(`https://${this.domain}/admin/reviews/settings.json`, {
      data: { ...dataSetting },
    });
    expect(res.status()).toBe(200);
  }

  /**
   *
   * @param productId product's id
   * @param accessToken access token of store
   * @returns list review by product's id
   */
  async getReviewInAppByProductId(productId: number): Promise<DataReviewInApp> {
    const response = await this.request.get(`https://${this.domain}/admin/reviews.json?product_id=${productId}`, {});
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Delete all reviews of store
   * @param productId product's id
   * @param accessToken access token of store
   * @returns list review by product's id
   */
  async deletAllReviews(): Promise<void> {
    const response = await this.request.patch(`https://${this.domain}/admin/reviews/batch.json`, {
      data: {
        action_type: "delete",
        filter: {},
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * submit review to campaign
   * @param review data review
   */
  async submitReviewCampaign(review: DataReviews) {
    const res = await this.request.post(`https://${this.domain}/api/review.json`, {
      data: { ...review },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Get review on SF on other pages
   * @param isOn boolean
   * @returns list review
   */
  async getReviewSF(isOn: boolean, isCheck?: boolean, productId?: number): Promise<ReviewSF> {
    const apiUrl = `https://${this.domain}/api/review/reviews.json`;
    const params = { is_starred: isOn, is_carousel: isCheck, ...(productId && { product_ids: productId }) };
    const response = await this.request.get(apiUrl, { params });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Move review to another product/campaign
   * @param review Review of product/campaign
   * @param reviewId Review's id of the product/campaign
   */
  async moveReview(review: Reviews, reviewId: number) {
    const res = await this.request.put(`https://${this.domain}/admin/reviews/${reviewId}.json`, {
      data: {
        review: review,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Get detail's review of the product/campaign
   * @param reviewId review'id of the product/campaign
   * @returns detail's review of the product/campaign
   */
  async getDetailReview(reviewId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/reviews/${reviewId}.json`, {});
    expect(response.status()).toBe(200);
    return await response.json();
  }
}
