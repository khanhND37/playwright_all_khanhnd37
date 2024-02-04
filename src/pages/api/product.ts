import { APIRequestContext, Page, expect } from "@playwright/test";
import type {
  ProductValue,
  WatermarkInfo,
  Products,
  Combo,
  Product,
  Artwork,
  CreateNEProductResponse,
  CreateNEProduct,
  CloneProductData,
  BalanceIssues,
  VariantMapping,
  Collect,
  CampaignDetail,
} from "@types";
import { cloneObject } from "@utils/object";
import { buildQueryString } from "@utils/string";

export class ProductAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  simpleProductDefault = {
    title: `Default product ${Math.floor(Date.now() / 1000)}`,
    variantDefault: {
      price: 10,
    },
  };

  /**
   * Create new product
   */
  async createNewProduct(body: CreateNEProduct = this.simpleProductDefault): Promise<CreateNEProductResponse> {
    const res = await this.request.post(`https://${this.domain}/admin/products.json`, {
      data: { product: body },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.product;
  }

  async deleteProducts(ids: number[], password?: string): Promise<boolean> {
    let resBody;
    let msgId: string;
    const productIds = ids.join(",");
    let res = await this.request.delete(`https://${this.domain}/admin/products.json`, {
      params: {
        ids: productIds,
      },
      data: {
        products_deleted_log: [],
      },
    });
    if (res.status() === 428) {
      resBody = await res.json();
      msgId = resBody.message_id;
      const verifyRequest = {
        verification_request: [
          {
            name: "user_password",
            method: "password",
            value: password,
          },
        ],
        msg_id: msgId,
      };
      const base64VerifyRequest = btoa(JSON.stringify(verifyRequest));
      res = await this.request.delete(`https://${this.domain}/admin/products.json`, {
        headers: {
          "x-sb-otp": base64VerifyRequest,
        },
        params: {
          ids: productIds,
        },
        data: {
          products_deleted_log: [],
        },
      });
    }
    await expect(res).toBeOK();
    resBody = await res.json();
    return resBody.success;
  }
  /**
   * Get list product using store front api response
   * After add product/import/clone product success, get list product info from Store front api
   * @param domain is the domain of the shop
   * @param productHandle is the handle of the product
   * @param productValue data from config contain product info (title, description, image, tags ...)
   */
  async getProductInfoStoreFrontByApi(
    domain: string,
    productHandle: string,
    productValue: ProductValue,
    accessToken: string,
  ) {
    const response = await this.request.get(`https://${domain}/api/catalog/product.json?handle=${productHandle}`, {
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
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
   * Setting watermark cho shop
   * @param accessToken is token of the shop
   * @param domain: domain shop cần setting
   * @param watermarkInfo: thông tin cần setting như enable watermark, type, style watermark
   */
  async setupWatermark(domain: string, watermarkInfo: WatermarkInfo, accessToken: string) {
    const response = await this.request.put(`https://${domain}/admin/setting/copyrights.json`, {
      data: {
        watermark: watermarkInfo,
      },
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Get ID of product from api response
   * @param productHandle is the handle of the product
   * @param domain is the domain of the shop
   */
  async getProductIdByHandle(productHandle: string): Promise<number> {
    const response = await this.request.get(`https://${this.domain}/admin/products.json?handle=${productHandle}`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.products[0].id;
  }

  /**
   * Add product by api
   * @param accessToken token shop cần xóa product
   * @param domain is the domain of the shop
   */
  async addProductPlusbaseByAPI(domain: string, accessToken: string, paramBody: string) {
    const response = await this.request.post(`https://${domain}/admin/panda-sourcing/inventory/store-products.json`, {
      data: paramBody,
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Delete all product by api
   * @param accessToken token shop cần xóa product
   * @param domain is the domain of the shop
   */
  async deleteProductByAPI() {
    const response = await this.request.delete(`https://${this.domain}/admin/products.json`, {
      data: { type: "all", products_deleted_log: [] },
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Setting Personalization Preview by api
   */
  async setPersonalizationPreview(body: string, shopId: string) {
    const res = await this.request.put(`https://${this.domain}/admin/setting/online-store-preferences.json`, {
      data: { personalize: body, shop_id: shopId },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Count combo in product PlusBase
   * @param productID
   */
  async countComboInProduct(productID: string) {
    const res = await this.request.get(`https://${this.domain}/admin/products/${productID}/combo.json`);
    expect(res.status()).toBe(200);
    return res.json();
  }

  /**
   * get product cost by product and variant id
   * @param productId
   * @param variantId
   * @returns product cost
   */
  async getProductCostItemPlbase(productId: number, variantId: number) {
    const res = await this.request.get(`https://${this.domain}/admin/plusbase-sourcing/variant-basecost.json`, {
      params: {
        sb_product_id: productId,
        include_combo: true,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const variant = resBody.variant_base_cost;
    return variant[`${variantId}`].base_cost;
  }

  /**
   * get all product list
   * @param domain is domain of shop
   * @param accessToken is token of shop
   * Returns all product on product list
   */
  async getAllProduct(domain: string, accessToken?: string): Promise<Products[]> {
    let response;
    if (accessToken) {
      response = await this.request.get(`https://${domain}/admin/products.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.get(`https://${domain}/admin/products.json`);
    }
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res.products;
  }

  /**
   * delete product by product id
   * @param domain is domain of shop
   * @param accessToken is token of shop
   * @param productId is id of product
   */
  async deleteProductById(domain: string, productId: number, accessToken?: string) {
    let response;
    if (accessToken) {
      response = await this.request.delete(`https://${domain}/admin/products/${productId}.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.delete(`https://${domain}/admin/products/${productId}.json`);
    }
    expect(response.status()).toBe(200);
  }

  /**
   * delete all product by product id
   * @param domain s domain of shop
   * @param accessToken is token of shop
   */
  async deleteAllProduct(domain: string, accessToken?: string) {
    let listProduct: Products[];
    if (accessToken) {
      listProduct = await this.getAllProduct(domain, accessToken);
    } else {
      listProduct = await this.getAllProduct(domain);
    }
    if (listProduct != null) {
      const lengthList = listProduct.length;
      for (let i = 0; i < lengthList; i++) {
        if (accessToken) {
          await this.deleteProductById(domain, listProduct[i].id, accessToken);
        } else {
          await this.deleteProductById(domain, listProduct[i].id);
        }
      }
    }
  }

  /**
   * Create variant combo of product
   * @param productId is id of sb product
   * @param combo is data combo of product
   */
  async createCombo(productId: number, combo: Combo) {
    const response = await this.request.post(`https://${this.domain}/admin/products/${productId}/combo.json`, {
      data: {
        ...combo,
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Delete variant combo of product by combo id
   * @param productId is id of sb product
   * @param variantId is id of variant combo
   */
  async deleteVariantById(productId: number, variantId: number | string) {
    const response = await this.request.delete(
      `https://${this.domain}/admin/products/${productId}/variants.json?ids=${variantId}`,
    );
    expect(response.status()).toBe(200);
  }

  /**
   * Get data product detail by id
   * @param productId is id of sb product
   */
  async getDataProductById(productId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/products/${productId}.json`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Update product infomation by API
   * @param productInfo
   */
  async updateProductInfo(productInfo: Product) {
    const productId = await this.getProductIdByHandle(productInfo.handle);
    const data = await this.getDataProductById(productId);
    if (productInfo.product_type) {
      data.product.product_type = productInfo.product_type;
    }
    if (productInfo.tags) {
      data.product.tags = productInfo.tags;
    }
    if (productInfo.vendor) {
      data.product.vendor = productInfo.vendor;
    }
    if (productInfo.variant_sku && !productInfo.variant_id) {
      data.product.variants[0].sku = productInfo.variant_sku;
    }
    if (productInfo.price) {
      data.product.variants[0].price = productInfo.price;
    }

    const res = await this.request.put(`https://${this.domain}/admin/products/${productId}.json`, {
      data: data,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update product infomation
   * @param productRequest
   */
  async updateProduct(productRequest) {
    const { id } = productRequest;
    if (typeof id === "undefined" || id <= 0) {
      return new Error("Missing product id");
    }

    try {
      const { product } = await this.getDataProductById(id);

      const productData = Object.assign({}, product, productRequest);

      const res = await this.request.put(`https://${this.domain}/admin/products/${id}.json`, {
        data: {
          product: productData,
        },
      });

      const out = await res.json();
      return out;
    } catch (err) {
      return new Error("Error when updating product", err);
    }
  }

  /**
   * Get list artwork
   * */
  async getListArtwork(limit: number, page = 1): Promise<Array<Artwork>> {
    const res = await this.request.get(`https://${this.domain}/admin/pbase-file-library.json`, {
      params: {
        limit: limit,
        page: page,
      },
      timeout: 90000,
    });
    expect(res.status()).toBe(200);
    const listArtwork = await res.json();
    return listArtwork.file_library;
  }

  /**get total artwork*/
  async getTotalArtwork(): Promise<number> {
    const response = await this.request.get(`https://${this.domain}/admin/pbase-file-library/count.json`);
    expect(response.status()).toBe(200);
    const result = await response.json();
    return result.total;
  }

  /**
   * delete artwork by product id
   * @param artworkId is id of artwork
   */
  async deleteArtworkById(artworkId: number) {
    const response = await this.request.delete(`https://${this.domain}/admin/pbase-file-library.json`, {
      params: {
        id: artworkId,
      },
    });
    expect(response.status()).toBe(200);
  }

  /**
   * delete all product by product id
   * @param domain s domain of shop
   * @param accessToken is token of shop
   */
  async deleteAllArtwork() {
    const total = await this.getTotalArtwork();
    const listProduct = await this.getListArtwork(total);
    if (listProduct != null) {
      for (let i = 0; i < total; i++) {
        await this.deleteArtworkById(listProduct[i].id);
      }
    }
  }

  /**
   * Get the 1st varriant ID of store
   * If store don't have any product, func will create a product
   * @returns
   */
  async getThe1stVarriantId(): Promise<number> {
    // Get product list
    const resProdList = await this.request.get(`https://${this.domain}/admin/products.json`);
    expect(resProdList.status()).toBe(200);
    const prodList = (await resProdList.json()).products;
    // Get the 1st varriant ID
    let the1stProdId: number;
    if (prodList.length == 0) {
      const { id } = await this.createNewProduct();
      the1stProdId = id;
    } else {
      the1stProdId = prodList[0].id;
    }
    const the1stVarriantId = (await this.getDataProductById(the1stProdId)).product.reference_keys[0];
    return the1stVarriantId;
  }

  /**
   * Get sb product id by sbcn product id
   * @param sbcnProductId is id of sbcn product
   * @returns sb product id
   */
  async getSbProductIdBySbcnProductId(sbcnProductId: number): Promise<Array<number>> {
    const listProduct = await this.getAllProduct(this.domain);
    return listProduct.filter(product => product.sbcn_product_id == sbcnProductId).map(product => product.id);
  }

  /**
   * Get list products
   * @param payload
   * @returns
   */
  async getProducts(payload: Record<string, unknown>) {
    // Get product list
    const resProdList = await this.request.get(
      `https://${this.domain}/admin/products.json${buildQueryString(payload)}`,
    );
    if (resProdList.ok()) {
      const res = await resProdList.json();
      return res.products;
    }

    return Promise.reject("Error: search collections by name fail");
  }

  /**
   * Add product variant
   * @param productId
   * @param payload
   * @returns
   */
  async addProductVariant(productId: number, payload: Record<string, unknown>) {
    const res = await this.request.post(`https://${this.domain}/admin/products/${productId}/variants.json`, {
      data: { variant: payload },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).variant;
  }

  /**
   * Edit product variants policy
   * @param variantIds
   * @param payload
   * @returns
   */
  async editProductVariantsPolicy(variantIds: number[], payload: Record<string, unknown>) {
    const response = await this.request.put(`https://${this.domain}/admin/variants/policy.json`, {
      params: { ids: variantIds.join(",") },
      data: { variant: payload },
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Clone product to another store
   * @param cloneProductInfo is clone product data
   */
  async cloneProduct(cloneProductInfo: CloneProductData) {
    const response = await this.request.post(`https://${this.domain}/admin/products/import-process.json`, {
      data: {
        ...cloneProductInfo,
      },
    });
    expect(response.status()).toBe(200);
  }

  /**
   * Get balance issues when product problems
   * @param productId is product id
   * @returns data balance issues
   */
  async getBalanceIssues(productId: number[]): Promise<BalanceIssues> {
    const response = await this.request.post(`https://${this.domain}/admin/products/addition-info.json?`, {
      data: {
        ids: productId,
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get variant of product template mapping with sb product variant
   * @param sbProductId is sb product id
   * @returns variant of product template
   */
  async getVariantSbcnProductMapping(sbProductId: number): Promise<Array<VariantMapping>> {
    const response = await this.request.get(
      `https://${this.domain}/admin/plusbase-sourcing/markup-shipping.json?sb_product_id=${sbProductId}`,
    );
    expect(response.status()).toBe(200);
    return (await response.json()).variants;
  }

  /**
   * Bật tắt hiển thị size chart widget
   * @param isOn
   */
  async setSizeChart(isOn: boolean): Promise<void> {
    try {
      await this.request.post(`https://${this.domain}/admin/size-chart/setting.json`, {
        data: {
          enable: isOn,
        },
      });
    } catch (error) {
      throw new Error(`Set size chart widget failed: ${error}`);
    }
  }

  async changeProductsStatus(ids: number[], data: Record<string, boolean>): Promise<boolean> {
    try {
      const res = await this.request.patch(`https://${this.domain}/admin/products.json`, {
        data: {
          ids: ids,
          data: data,
        },
      });
      const resBody = await res.json();
      return resBody.status;
    } catch (error) {
      throw new Error(`Change products status failed: ${error}`);
    }
  }

  /**
   * Add collection for sb product
   * @param collect is data collecttion add to product
   * @returns collection of product
   */
  async addCollectionToProd(collect: Collect): Promise<Collect> {
    const response = await this.request.post(`https://${this.domain}/admin/collects.json`, {
      data: {
        collect,
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Remove collection of sb product
   * @param collectionId is collection id
   */
  async removeCollectionToProd(collectionId: number): Promise<void> {
    const response = await this.request.delete(`https://${this.domain}/admin/collects/${collectionId}.json`);
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Get collections id with product id.
   * @param productId is sb product id
   * @returns list collection
   */
  async getCollectionId(productId: number): Promise<Array<Collect>> {
    const response = await this.request.get(`https://${this.domain}/admin/collects.json?product_id=${productId}`);
    expect(response.status()).toBe(200);
    return (await response.json()).collects;
  }

  /**
   * Deletes all campaigns with a specified status.
   * @param campaignStatus - The status of the campaigns to be deleted.
   * @returns A Promise that resolves once the campaigns are deleted.
   */
  async deleteAllCampaignWithStatus(campaignStatus: string): Promise<void> {
    // Get all campaign list
    const listCampaignIds: number[] = await this.getCampaignIdsByStatus(campaignStatus);
    if (listCampaignIds.length === 0) {
      return;
    }

    // Delete all campaigns with campaign ids
    const deleteResponse = await this.request.delete(`https://${this.domain}/admin/pbase-campaigns.json`, {
      data: {
        ids: listCampaignIds,
      },
    });

    expect(deleteResponse.status()).toBe(200);
  }

  /**
   * Retrieves campaign IDs based on the specified status.
   * @param campaignStatus - The status of the campaigns to retrieve IDs for.
   * @returns A Promise that resolves to an array of campaign IDs.
   */
  async getCampaignIdsByStatus(campaignStatus: string): Promise<number[]> {
    const response = await this.request.get(`https://${this.domain}/admin/pbase-campaigns.json`);
    expect(response.status()).toBe(200);

    const jsonResponse = await response.json();
    const campaignList: Array<CampaignDetail> = jsonResponse.campaigns;

    return campaignList.filter(campaign => campaign.campaign_status === campaignStatus).map(campaign => campaign.id);
  }

  /**
   * get total variants in the store
   * This api only returns 500 maximum variations if no limit
   * -> default = 20000, if more variations -> enter a larger limit
   * @return total variants
   */
  async countAllVariants(limit = 20000): Promise<number> {
    const response = await this.request.get(`https://${this.domain}/admin/variants.json?limit=${limit}`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    let countVariants = 0;
    const idVariant = data.variants;
    for (let j = 0; j < idVariant.length; j++) {
      countVariants++;
    }
    return countVariants;
  }

  /**
   * Deletes all variant combos for a given product ID.
   * @param sbProductId - The ID of the product.
   * @returns A Promise that resolves when all variant combos are deleted.
   */
  async deleteAllVariantCombos(sbProductId: number): Promise<void> {
    // Step 1: Get all variants for the given product ID
    const productData = await this.getDataProductById(sbProductId);
    const defaultVariantIds = productData.product.variant_images.map(variant => variant.variant_id);
    const allVariants = productData.product.variants;

    // Step 2: Identify variant combos to be deleted
    const variantsToDelete = allVariants
      .filter(variant => !defaultVariantIds.includes(variant.id))
      .map(variant => variant.id);

    // Step 3: Delete identified variant combos
    for (const variantId of variantsToDelete) {
      await this.deleteVariantById(sbProductId, variantId);
    }
  }
}
