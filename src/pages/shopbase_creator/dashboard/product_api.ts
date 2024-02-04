import { APIRequestContext, expect } from "@playwright/test";
import type {
  CreateProductResponse,
  DigitalValue,
  GetProductAPIParam,
  GetProductAPIResponse,
  GetProductsAPIResponse,
  ProductLecture,
  ProductListInfo,
  PublishProductResponse,
  SectionInfo,
} from "@types";
import type { CountProductAPIResponse, CreateProductBody } from "@types";
import { printLog } from "@utils/logger";

export class ProductAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  async countProducts(params: GetProductAPIParam): Promise<CountProductAPIResponse> {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/count.json`, {
      params: params,
    });

    if (!response.ok()) {
      const responseText = await response.text();
      printLog(responseText);
      return;
    }

    const jsonResponse = await response.json();
    return jsonResponse as CountProductAPIResponse;
  }

  async getProducts(params: GetProductAPIParam): Promise<GetProductsAPIResponse> {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product.json`, {
      params: params,
    });

    if (!response.ok()) {
      const responseText = await response.text();
      printLog(responseText);
      return;
    }

    const jsonResponse = await response.json();
    return jsonResponse as GetProductsAPIResponse;
  }

  /**
   * Function return info prod with api
   * @param id productID
   * @param customDomain
   * @param accessToken
   * @returns
   */
  async getProduct(id: number, customDomain?: string, accessToken?: string): Promise<GetProductAPIResponse> {
    if (accessToken && customDomain) {
      const response = await this.request.get(
        `https://${customDomain}/admin/digital-products/product/${id}.json?access_token=${accessToken}`,
      );
      if (!response.ok()) {
        const responseText = await response.text();
        printLog(responseText);
        return;
      }

      const jsonResponse = await response.json();
      return jsonResponse as GetProductAPIResponse;
    } else {
      const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${id}.json`);

      if (!response.ok()) {
        const responseText = await response.text();
        printLog(responseText);
        return;
      }

      const jsonResponse = await response.json();
      return jsonResponse as GetProductAPIResponse;
    }
  }

  async createProduct(body: CreateProductBody): Promise<CreateProductResponse> {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/product.json`, {
      data: body,
    });

    if (!response.ok()) {
      const responseText = await response.text();
      printLog(responseText);
      throw new Error("Error when create product");
    }

    const jsonResponse = await response.json();
    return jsonResponse as CreateProductResponse;
  }

  /**
   * Hàm dùng để publish, unpublish 1 hoặc nhiều digital product
   * @param ids
   */
  async publishProduct(ids: string[], status: boolean): Promise<PublishProductResponse> {
    // api change to number, so I need to convert to number
    const convertedIds = ids.map(id => parseInt(id));

    const response = await this.request.patch(`https://${this.domain}/admin/digital-products/product.json`, {
      data: {
        ids: convertedIds,
        data: {
          published: status,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async deleteProduct(productIds: number[]) {
    const joinedIds = productIds.join(",");
    const response = await this.request.delete(`https://${this.domain}/admin/digital-products/product.json`, {
      params: {
        ids: joinedIds,
      },
      data: {
        type: "",
      },
    });

    if (!response.ok()) {
      const responseText = await response.text();
      printLog(responseText);
      return;
    }

    const jsonResponse = await response.json();
    return jsonResponse as CreateProductResponse;
  }

  /**
   * create chapter with api
   * @param bodyRequest
   */
  async createChapter(bodyRequest: SectionInfo): Promise<SectionInfo> {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/section.json`, {
      data: bodyRequest,
    });
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse.data;
    }
  }

  /**
   * create lesson with api
   */
  async createLesson(chapterId: number, bodyRequest: string): Promise<ProductLecture> {
    const response = await this.request.post(
      `https://${this.domain}/admin/digital-products/section/${chapterId}/lectures.json`,
      {
        data: bodyRequest,
      },
    );
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse.data;
    }
  }

  /*
   * Api get product list, filter list product
   * @param productListInfo: thông tin get product list
   */
  async getProductList(productListInfo: ProductListInfo): Promise<number> {
    let response;
    if (productListInfo.filter) {
      response = await this.request.get(
        `https://${this.domain}/admin/digital-products/product/count.json${productListInfo.filter}`,
      );
    } else {
      response = await this.request.get(`https://${this.domain}/admin/digital-products/product/count.json`);
    }
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse.data.count;
    }
  }

  //update data of section after create section
  async updateChapter(sectionInfo: SectionInfo, sectionId: number): Promise<SectionInfo> {
    const response = await this.request.put(`https://${this.domain}/admin/digital-products/section/${sectionId}.json`, {
      data: sectionInfo,
    });
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse;
    }
  }

  //delete section after create section
  async deleteChapter(chapterId: number): Promise<SectionInfo> {
    const response = await this.request.delete(
      `https://${this.domain}/admin/digital-products/section/${chapterId}.json`,
    );
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse;
    }
  }

  /**
   * Send request api to get products detail of order bump
   * @param productId id of product target
   * @returns variants products of order bump
   */
  async getProductsOrderBump(productId: string): Promise<DigitalValue> {
    const response = await this.request.get(`https://${this.domain}/api/offers/order-bump.json?ids=${productId}`);
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse;
    }
  }

  /**
   * Function return prodID
   * @param prodDpHandle Handle of prod
   * @param domain
   * @returns
   */
  async getDpProductIDByHandle(prodDpHandle: string, domain: string = this.domain): Promise<number> {
    const response = await this.request.get(`https://${domain}/admin/products.json?handle=${prodDpHandle}`);
    if (response.ok()) {
      const jsonResponse = await response.json();
      return jsonResponse.products[0].id;
    }
    return Promise.reject();
  }
}
