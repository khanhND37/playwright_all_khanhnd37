import { buildQueryString } from "@core/utils/string";
import { APIRequestContext, expect } from "@playwright/test";
import { CollectionInfo, CreateCustomCollectionResponse } from "@types";

export class CollectionAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }
  /**
   * Create a new collection by info
   * @param infoCollection
   */
  async create(infoCollection: CreateCustomCollectionResponse): Promise<CreateCustomCollectionResponse> {
    const rawResponse = await this.request.post(`https://${this.domain}/admin/collections/custom.json`, {
      data: infoCollection,
    });
    if (rawResponse.ok()) {
      return (await rawResponse.json()) as CreateCustomCollectionResponse;
    }
    return Promise.reject("Error: Create collection fail");
  }

  /**
   * Update collection by id
   * @param id
   * @param payload
   */
  async update(id: number, payload: object) {
    const rawResponse = await this.request.put(`https://${this.domain}/admin/collections/custom/${id}.json`, {
      data: payload,
    });
    if (rawResponse.ok()) {
      return await rawResponse.json();
    }
    return Promise.reject("Error: Update collection fail");
  }

  /**
   * Delete a collection by id
   * @param id
   */
  async delete(id: string) {
    let rawResponse;
    try {
      await expect
        .poll(
          async () => {
            rawResponse = await this.request.delete(`https://${this.domain}/admin/collections/custom/${id}.json`);
            return rawResponse.status();
          },
          { intervals: [1_000, 5_000, 10_000], timeout: 60_000 },
        )
        .toBe(200);
      return await rawResponse.json();
    } catch (error) {
      throw new Error("Delete collection failed");
    }
  }

  /**
   * Create a new smart collection by info
   * @param infoCollection
   */
  async createSmartCollection(infoCollection: string) {
    const rawResponse = await this.request.post(`https://${this.domain}/admin/collections/smart.json`, {
      data: infoCollection,
    });
    if (rawResponse.ok()) {
      return await rawResponse.json();
    }
    return Promise.reject("Error: Create collection fail");
  }

  /**
   * Delete a smart collection by id
   * @param id
   */
  async deleteSmartCollection(id: string) {
    const rawResponse = await this.request.delete(`https://${this.domain}/admin/collections/smart/${id}.json`);
    if (rawResponse.ok()) {
      return await rawResponse.json();
    }
    return Promise.reject("Error: Delete collection fail");
  }

  /**
   * Delete all smart collection
   */
  async deleteAllSmartCollection() {
    const response = await this.getAll();
    if (response) {
      const collections = response.collections;
      for (let i = 0; i < collections.length; i++) {
        await this.deleteSmartCollection(collections[i].id);
      }
    }
  }

  /**
   * Get list of collections
   */
  async getAll(): Promise<{ collections: CollectionInfo[] }> {
    const rawResponse = await this.request.get(`https://${this.domain}/admin/collections.json`);
    if (rawResponse.ok()) {
      return await rawResponse.json();
    }
    return Promise.reject("Error: Get list of collections fail");
  }

  /**
   * Get list of collections
   */
  async searchCollections(params: Record<string, unknown>) {
    const rawResponse = await this.request.get(
      `https://${this.domain}/admin/collections.json${buildQueryString(params)}`,
    );
    if (rawResponse.ok()) {
      const res = await rawResponse.json();
      return res.collections;
    }

    return Promise.reject("Error: search collections by name fail");
  }

  /**
   * Get products by collection_id
   * @param api
   * @param payload
   * @returns
   */
  async getProductsByCollectionId(payload: Record<string, string | number>) {
    const params = Object.assign({ limit: 50, page: 1 }, payload);
    const res = await this.request.get(
      `https://${this.domain}/admin/products/collections.json${buildQueryString(params)}`,
    );
    if (res.ok()) {
      const resJson = await res.json();
      return resJson;
    }

    return Promise.reject("Get products failed");
  }

  /**
   * Get custom collections by product_id
   * @param api
   * @param payload
   * @returns
   */
  async getCustomCollectionsByProductId(payload: Record<string, string | number>) {
    const params = Object.assign(payload);
    const res = await this.request.get(
      `https://${this.domain}/admin/collections/custom.json${buildQueryString(params)}`,
    );
    if (res.ok()) {
      const resJson = await res.json();
      return resJson;
    }

    return Promise.reject("Get collections failed");
  }

  /**
   * get collection data on SF
   * @param collectionHandle
   * @param locale exp: "vi-vn"; "vi-us"....
   * @returns
   */
  async getCollectionDataOnSF(collectionHandle: string, locale: string) {
    let options = {};
    options = {
      headers: {
        "X-Lang": locale,
      },
    };
    const res = await this.request.get(
      `https://${this.domain}/api/catalog/next/collections.json?handles=${collectionHandle}`,
      options,
    );
    if (res.ok()) {
      return res.json();
    }
    return Promise.reject("Get collection data failed");
  }

  /**
   * Trigger update view count of collection
   */
  async triggerUpdateViewCount() {
    const res = await this.request.get(
      `https://${this.domain}/admin/collections/trigger-update-statistics.json?type=view_count`,
    );
    if (res.ok()) {
      return await res.json();
    }
    return Promise.reject("Error: Trigger update failed");
  }

  /**
   * Trigger update other statistics of collection
   */
  async triggerUpdate() {
    const res = await this.request.get(`https://${this.domain}/admin/collections/trigger-update-statistics.json`);
    if (res.ok()) {
      return await res.json();
    }
    return Promise.reject("Error: Trigger update failed");
  }
}
