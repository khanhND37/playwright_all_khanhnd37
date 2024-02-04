import { APIRequestContext, Page, expect } from "@playwright/test";
import type { DigitalProduct } from "@types";

export class DigitalProductAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  /**
   * Tạo 1 product ở Shopbase creator
   * @param data tên, trạng thái, type của product
   * @returns data của product được tạo thành công
   */
  async createProduct(data: DigitalProduct) {
    const res = await this.request.post(`https://${this.domain}/admin/digital-products/product.json`, {
      data: {
        product: {
          title: data.title,
          published: data.published,
          product_type: data.product_type,
        },
      },
    });
    if (res.status() != 200) {
      throw Error("Create product failed");
    }
    const jsonResponse = await res.json();
    return jsonResponse.data.product;
  }

  /**
   * Xoá product ở Shopbase creator
   * @param ids
   */
  async deleteProducts(ids: string) {
    const res = await this.request.delete(`https://${this.domain}/admin/digital-products/product.json?`, {
      params: {
        ids: ids,
      },
      data: {
        type: "",
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  /**
   * Đổi trạng thái của products
   * @param ids có thể đổi status của 1 hoặc nhiều product
   * @param isPublish true = publish, false = unpublish
   */
  async changeProductsStatus(ids: number[], isPublish: boolean) {
    const res = await this.request.put(`https://${this.domain}/admin/digital-products/product.json`, {
      data: {
        ids: ids,
        data: {
          published: isPublish,
        },
      },
    });
    expect(res.ok()).toBeTruthy();
  }
}
