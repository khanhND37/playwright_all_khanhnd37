import { APIRequestContext, expect } from "@playwright/test";
import { waitTimeout } from "@core/utils/api";
import type {
  AliexpressProductRequest,
  AliexpressProductListItems,
  ShippingRateRequest,
  ShippingRateResponse,
  CatalogProductRequest,
  CatalogProductListItems,
  PlbCatalogProduct,
  PlbVariantBaseCost,
  RateByVariant,
  ProductValue,
  ProductLevels,
  MappedOptions,
  TotalProduct,
  RequestProductData,
} from "@types";
import { cloneObject } from "@utils/object";
import { buildQueryString } from "@core/utils/string";

export class PlusbaseProductAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get ID of product from api response
   * @param productHandle is the handle of the product
   * @param domain is the domain of the shop
   */
  async getProductIdByHandle(productHandle: string, accessToken?: string) {
    let response;
    if (accessToken) {
      response = await this.request.get(`https://${this.domain}/admin/products.json?handle=${productHandle}`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.get(`https://${this.domain}/admin/products.json?handle=${productHandle}`);
    }
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.products[0].id;
  }

  /**
   * Get list product using store front api response
   * After add product/import/clone product success, get list product info from Store front api
   * @param domain is the domain of the shop
   * @param productHandle is the handle of the product
   * @param productValue data from config contain product info (title, description, image, tags ...)
   */
  async getProductInfoStoreFrontByApi(domain: string, productHandle: string, productValue: ProductValue) {
    const response = await this.request.get(`https://${domain}/api/catalog/next/product/${productHandle}.json`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const productInfoApi = cloneObject(productValue, {
      keys: ["title", "image_name", "inventory_policy", "cost_per_item"],
    }) as ProductValue;

    if (productInfoApi.description) {
      productInfoApi.description = jsonResponse.description;
    }
    if (productInfoApi.tag) {
      productInfoApi.tag = jsonResponse.tags;
    }
    if (productInfoApi.bar_code) {
      productInfoApi.bar_code = jsonResponse.configurable_children[0].barcode;
    }
    if (productInfoApi.product_type) {
      productInfoApi.product_type = jsonResponse.product_type;
    }
    if (productInfoApi.vendor) {
      productInfoApi.vendor = jsonResponse.vendor;
    }
    if (productInfoApi.price) {
      productInfoApi.price = jsonResponse.configurable_children[0].price;
    }
    if (productInfoApi.compare_at_price) {
      productInfoApi.compare_at_price = jsonResponse.configurable_children[0].compare_at_price;
    }
    if (productInfoApi.sku) {
      productInfoApi.sku = jsonResponse.configurable_children[0].sku;
    }
    if (productInfoApi.quantity) {
      productInfoApi.quantity = jsonResponse.configurable_children[0].quantity;
    }
    if (productInfoApi.weight) {
      productInfoApi.weight = jsonResponse.configurable_children[0].weight;
    }
    if (productInfoApi.color) {
      const color = [];
      for (let i = 0; i < jsonResponse.configurable_options[0].values.length; i++) {
        const listColor = jsonResponse.configurable_options[0].values[i].label;
        color.push(listColor);
      }
    }
    if (productInfoApi.size) {
      const size = [];
      for (let i = 0; i < jsonResponse.configurable_options[1].values.length; i++) {
        const listSize = jsonResponse.configurable_options[1].values[i].label;
        size.push(listSize);
      }
    }
    return productInfoApi;
  }

  /**
   * Get products by API.
   * @param request is request object
   */
  async getProducts(request: AliexpressProductRequest): Promise<AliexpressProductListItems> {
    let url = `https://${this.domain}/admin/plusbase-sourcing/products.json`;
    url += this.buildQuery(request);

    const response = await this.request.get(url);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get products catalog by API.
   * @param request is request object
   */
  async getCatalogProducts(request: CatalogProductRequest): Promise<CatalogProductListItems> {
    let url = `https://${this.domain}/admin/plusbase-sourcing/products/next.json`;
    url += this.buildQuery(request);

    const response = await this.request.get(url);
    expect(response.status()).toBe(200);
    return await response.json();
  }
  async getShippingRate(request: ShippingRateRequest): Promise<ShippingRateResponse> {
    let url = `https://${this.domain}/admin/plusbase-sourcing/shipping/rates.json`;
    url += this.buildQuery(request);

    const response = await this.request.get(url);
    if (response.status() === 500 && request.return_default_if_500) {
      const rateVariants = new Map<string, Array<RateByVariant>>();
      return {
        country_ids: [],
        is_data_from_ali_site: false,
        is_support_all_country: false,
        product_id: 0,
        processing_fee_rate: 0,
        variant_shipping_methods: rateVariants,
      };
    }
    expect(response.status()).toBe(200);
    return await response.json();
  }

  buildQuery(request: Record<string, unknown>): string {
    let query: string;
    const params: string[] = [];
    for (const key in request) {
      if (request[key]) {
        params.push(`${key}=${request[key]}`);
      }
    }

    if (params.length > 0) {
      query = `?${params.join("&")}`;
    }

    return query;
  }

  /**
   * Get product catalog detail by API.
   * @param productId product template id
   */
  async getProductCatalogDetail(productId: number, params?: Record<string, string>): Promise<PlbCatalogProduct> {
    const response = await this.request.get(
      `https://${this.domain}/admin/plusbase-sourcing/products/${productId}.json${buildQueryString(params)}`,
    );

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get product campaign detail by Id
   * @param productId product id
   * @returns product detail
   */
  async getProductCampaignDetailById(productId: number, accessToken?: string) {
    let response;
    if (accessToken) {
      response = await this.request.get(`https://${this.domain}/admin/pbase-campaigns/live/${productId}.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.get(`https://${this.domain}/admin/pbase-campaigns/live/${productId}.json`);
    }
    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    return jsonResponse.product;
  }

  /**
   * Get campaign detail by campaign id
   * @param campaignId
   * @returns campaign detail
   */
  async getCampaignDetailById(campaignId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/pbase-campaigns/${campaignId}.json`);
    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    return jsonResponse;
  }

  /**
   * Add to import list
   * productTmplIds list product template ids
   */
  async addToImportList(productTmplIds: Array<number>): Promise<{
    success: boolean;
  }> {
    const response = await this.request.post(
      `https://${this.domain}/admin/plusbase-sourcing/products/importing-products-cache.json`,
      {
        data: {
          product_tmpl_ids: productTmplIds,
        },
      },
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  async getImportList(productTmplIds: Array<number>): Promise<{
    result: Array<PlbCatalogProduct>;
  }> {
    const response = await this.request.post(
      `https://${this.domain}/admin/plusbase-sourcing/products/import-list.json`,
      {
        data: {
          product_template_ids: productTmplIds,
        },
      },
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  async getVariantBaseCost(productId: number): Promise<PlbVariantBaseCost> {
    const response = await this.request.get(`https://${this.domain}/admin/plusbase-sourcing/variant-basecost.json`, {
      params: {
        sb_product_id: productId,
        include_combo: true,
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get product tmpl id by request url
   * @param api is PlusbaseProductAPI
   * @param url is full url of product
   */
  async getProductTmplIDByUrl(api: PlusbaseProductAPI, url: string, retryTime?: number, isCj = false): Promise<number> {
    let products;
    let i = 0;
    if (retryTime === undefined) {
      retryTime = 1;
    }
    while (i < retryTime) {
      products = (
        await api.getProducts({
          type: "private",
          tab: "all",
          only_cj: isCj,
          only_ali: !isCj,
          search: url,
          page: 1,
          limit: 1,
        })
      ).products;
      if (products.length < 1) {
        i++;
        await waitTimeout(5000);
        continue;
      }

      if (products[0]) {
        return products[0].id;
      }
    }
  }

  /**
   * Get all level of product
   * @param accessToken is access token of shop template
   * @return list of product level
   */
  async getAllProductLevels(domain: string, accessToken: string): Promise<Array<ProductLevels>> {
    const response = await this.request.get(`https://${domain}/admin/plusbase-sourcing/product-level/all.json`, {
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });

    expect(response.ok()).toBeTruthy();
    const res = (await response.json()).data;

    // Parse json rules of level
    res.forEach((level: { rules: string }) => {
      level.rules = JSON.parse(level.rules);
    });
    return res;
  }

  /**
   * Get biggest product level
   * @param totalPoint is total point of product template
   * @param accessToken is access token of shop template
   * @returns biggest processing rate of product
   */
  async getBiggestProductLevel(totalPoint: number, domain: string, accessToken: string): Promise<Array<number>> {
    // khai bao processing rate default
    let processingRate = 0.04;
    let productLevel = 0;

    // Get all level of product
    const levels: Array<ProductLevels> = await this.getAllProductLevels(domain, accessToken);

    // check total point of product template
    const compareProductLevel = (
      operator: string,
      totalPoint: number,
      targetPoint: number,
      targetPointFrom?: number,
      targetPointTo?: number,
    ): boolean => {
      switch (operator) {
        case "greater":
          return totalPoint > targetPoint;
        case "less":
          return totalPoint < targetPoint;
        case "between":
          return totalPoint > targetPointFrom && totalPoint < targetPointTo;
        default:
          return totalPoint === targetPoint;
      }
    };

    for (const level of levels) {
      // Get rules of level
      const rulesAliExpress = level.rules.ali_express;

      // Check level is enable and rules of level is enable
      if (level.is_enable === 1 && rulesAliExpress.is_enable == true) {
        // check operator of level
        const hasUpdateRate = () => {
          return compareProductLevel(
            level.rules.ali_express.operator,
            totalPoint,
            rulesAliExpress.target_point,
            rulesAliExpress.target_point_from,
            rulesAliExpress.target_point_to,
          );
        };

        if (hasUpdateRate() == true) {
          processingRate = processingRate < level.processing_fee ? level.processing_fee : processingRate;
          productLevel = processingRate === level.processing_fee ? level.level : productLevel;
        }
      }
    }
    return [processingRate, productLevel];
  }

  /**
   * Request product by API
   * @param dataProductAli is data product
   * @param userToken is user token
   */
  async requestProductByAPI(dataProduct: RequestProductData) {
    const res = await this.request.post(`https://${this.domain}/admin/panda-sourcing/shop/quotations.json`, {
      data: {
        ...dataProduct,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Mapping product in shop template
   * @param domain is the shop template domain
   * @param userId is the userId
   * @param targetShopId is the targetShopId
   * @param sbcnProductId is the sbcnProductId
   * @param platformProductId is the platformProductId
   * @param mappedOptions is the mappedOptions
   */
  async mappingProduct(
    mappedOptions: Array<MappedOptions>,
    targetShopId: number,
    userId: number,
    sbcnProductId: number,
    platformProductId: number,
    accessToken?: string,
  ): Promise<{ success: boolean }> {
    let url: string;
    if (accessToken) {
      url = `https://${this.domain}/admin/panda-fulfillment/products/map.json?access_token=${accessToken}`;
    } else {
      url = `https://${this.domain}/admin/panda-fulfillment/products/map.json`;
    }
    const request = {
      mapped_options: mappedOptions,
      user_id: userId,
      target_shop_id: targetShopId,
      sbcn_product_id: sbcnProductId,
      platform_product_id: platformProductId,
    };
    let response = await this.request.post(url, {
      data: request,
    });
    let numberRetry = 0;

    while (!response.ok() && numberRetry < 20) {
      response = await this.request.post(url, {
        data: request,
      });
      numberRetry++;
    }

    if (!response.ok()) {
      return Promise.reject(`Error message: ${(await response.json()).error} ${new Error().stack}`);
    }
    expect(response.status()).toBe(200);
    return response.json();
  }

  /**
   * Get total product of catalog
   * @returns total product
   */
  async totalProduct(): Promise<TotalProduct> {
    const response = await this.request.get(`https://${this.domain}/admin/plusbase-sourcing/products/count/next.json`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Import product to store by API
   * @param productTmplIds
   * @returns sb product id
   */
  async importProductToStoreByAPI(productTmplIds: number): Promise<number> {
    const response = await this.request.post(
      `https://${this.domain}/admin/panda-sourcing/inventory/store-products/quickly.json`,
      {
        data: {
          product_template_id: productTmplIds,
        },
      },
    );
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    const sbProductId = responseData.productId;
    return sbProductId;
  }
}
