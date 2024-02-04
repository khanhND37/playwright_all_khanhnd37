import { APIRequestContext } from "@playwright/test";
import type { ProductListInfo } from "@types";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class ProductListAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /*
   * Api get product list, filter list product
   * @param productListInfo: thông tin get product list
   */
  async getProductList(productListInfo: ProductListInfo) {
    let response;
    if (productListInfo.filter) {
      response = await this.request.get(
        `https://${this.domain}/admin/digital-products/product.json${productListInfo.filter}`,
      );
    } else {
      response = await this.request.get(`https://${this.domain}/admin/digital-products/product.json`);
    }
    if (response.ok()) {
      const jsonResponse = await response.json();
      const length = Object.keys(jsonResponse.data).length;
      return length;
    }
  }
  /*
   * Delete product,delete multi product
   * @param shopId: thông tin shop id cần xóa
   * @param idProductDelete: thông tin id product cần xóa
   */
  async deleteProduct(idProductDelete: Array<string>) {
    const response = await this.request.delete(
      `https://${this.domain}/admin/digital-products/product.json?ids=${idProductDelete}`,
      {
        data: {
          ids: idProductDelete,
        },
      },
    );
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse;
    }
  }

  /*
   * Api get product list, filter list product
   * @param productListInfo: thông tin get product list
   * @param totalProduct: thông tin tổng số product ở list
   */
  async getProductListStoreFront(productListInfo: ProductListInfo, totalProduct: string) {
    let response;
    if (productListInfo.filter) {
      response = await this.request.get(
        `https://${this.domain}/api/catalog/next/products.json${productListInfo.filter}`,
      );
    } else {
      response = await this.request.get(`https://${this.domain}/api/catalog/next/products.json`);
    }
    if (response.ok()) {
      const jsonResponse = await response.json();
      const countProduct = jsonResponse.result.count;
      if (totalProduct === countProduct) {
        const idExpectProduct = jsonResponse.result.items[0].id;
        return idExpectProduct;
      }
    }
  }

  /*
   * Api get product list, filter list product
   */
  async getProductIdList() {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product.json`);
    const productIdList = [];
    if (response.ok()) {
      const jsonResponse = await response.json();
      for (let i = 0; i < jsonResponse.data.length; i++) {
        const productId = jsonResponse.data[i].id;
        productIdList.push(productId);
      }
    }
    return productIdList;
  }
}
