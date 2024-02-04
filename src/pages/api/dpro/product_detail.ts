import { APIRequestContext, expect } from "@playwright/test";
import type {
  DigitalInfo,
  DigitalValue,
  ProductLecture,
  ProductLectureVerify,
  ProductMedia,
  SectionInfo,
  VariantOfferOld,
} from "@types";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class ProductDetailAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * This function for clone new object with exclude some fields which defined in excludeFields param
   * @param sourceObject source object
   * @param excludeFields fileds want to exclude
   * @returns cloned object with fields not exists in excludeFields param
   */
  cloneObject<TReturnType>(sourceObject: object, excludeFields: string[] = []): TReturnType {
    excludeFields = excludeFields || [];
    const newObject = {} as TReturnType;
    for (const key in sourceObject) {
      if (Object.prototype.hasOwnProperty.call(sourceObject, key) && excludeFields.indexOf(key) < 0) {
        newObject[key] = sourceObject[key];
      }
    }
    return newObject;
  }

  //create product with api
  async createProduct(digitalInfo: DigitalInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/product.json`, {
      data: {
        product: digitalInfo,
      },
    });
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const digitalValueAPI = this.cloneObject<DigitalInfo>(digitalInfo);

    if (digitalInfo.title) {
      digitalValueAPI.title = jsonResponse.data.product.title;
    }

    if (digitalInfo.handle) {
      digitalValueAPI.handle = jsonResponse.data.product.handle;
    }

    if (digitalInfo.product_type) {
      digitalValueAPI.product_type = jsonResponse.data.product.product_type;
    }
    return digitalValueAPI;
  }

  //get product id after create product successfully
  async getProductId(digitalInfo: DigitalInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/product.json`, {
      data: {
        product: digitalInfo,
      },
    });
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data.product.id;
  }

  //update product with api
  async updateProduct(productId: number, digitalInfo: DigitalValue) {
    const response = await this.request.put(`https://${this.domain}/admin/digital-products/product/${productId}.json`, {
      data: {
        product: digitalInfo,
      },
    });
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const digitalInfoAPI = this.cloneObject<DigitalValue>(digitalInfo);
      if (digitalInfo.title) {
        digitalInfoAPI.title = jsonResponse.data.product.title;
      }
      if (digitalInfo.body_html) {
        digitalInfoAPI.body_html = jsonResponse.data.product.body_html;
      }
      if (digitalInfo.handle) {
        digitalInfoAPI.handle = jsonResponse.data.product.handle;
      }

      if (digitalInfo.product_type) {
        digitalInfoAPI.product_type = jsonResponse.data.product.product_type;
      }

      if (digitalInfo.variant_offers) {
        if (digitalInfo.variant_offers[0].name) {
          digitalInfoAPI.variant_offers[0].name = jsonResponse.data.product.variant_offers[0].price.name;
        }

        if (digitalInfo.variant_offers[0].price) {
          digitalInfoAPI.variant_offers[0].price = jsonResponse.data.product.variant_offers[0].price;
        }

        if (digitalInfo.variant_offers[0].quantity_limit.limit) {
          digitalInfo.variant_offers[0].quantity_limit.limit =
            jsonResponse.data.product.variant_offers[0].quantity_limit.limit;
        }

        if (digitalInfo.variant_offers[0].quantity_limit.enabled) {
          digitalInfo.variant_offers[0].quantity_limit.enabled =
            jsonResponse.data.product.variant_offers[0].quantity_limit.enabled;
        }

        if (digitalInfo.variant_offers[0].access_limit.limit) {
          digitalInfo.variant_offers[0].access_limit.limit =
            jsonResponse.data.product.variant_offers[0].access_limit.limit;
        }

        if (digitalInfo.variant_offers[0].access_limit.enabled) {
          digitalInfo.variant_offers[0].access_limit.enabled =
            jsonResponse.data.product.variant_offers[0].access_limit.enabled;
        }

        if (digitalInfo.variant_offers[0].time_limit.time_limit_type) {
          digitalInfo.variant_offers[0].time_limit.time_limit_type =
            jsonResponse.data.product.variant_offers[0].time_limit.time_limit_type;
        }

        if (digitalInfo.variant_offers[0].time_limit.time) {
          digitalInfo.variant_offers[0].time_limit.time = jsonResponse.data.product.variant_offers[0].time_limit.time;
        }

        if (digitalInfo.variant_offers[0].time_limit.time_type) {
          digitalInfo.variant_offers[0].time_limit.time_type =
            jsonResponse.data.product.variant_offers[0].time_limit.time_type;
        }

        if (digitalInfo.variant_offers[0].time_limit.enabled) {
          digitalInfo.variant_offers[0].time_limit.enabled =
            jsonResponse.data.product.variant_offers[0].time_limit.enabled;
        }
      }

      return digitalInfoAPI;
    }
  }

  //get info of product detail
  async getProductDetailInfo(productId: number, digitalValue: DigitalValue) {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${productId}.json`);
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const digitalValueAPI = this.cloneObject<DigitalValue>(digitalValue);

      if (digitalValue.title) {
        digitalValueAPI.title = jsonResponse.data.products[0].product.title;
      }

      if (digitalValue.body_html) {
        digitalValueAPI.body_html = jsonResponse.data.products[0].product.body_html;
      }

      if (digitalValue.product_type) {
        digitalValueAPI.product_type = jsonResponse.data.products[0].product.product_type;
      }

      if (digitalValue.handle) {
        digitalValueAPI.handle = jsonResponse.data.products[0].product.handle;
      }

      if (digitalValue.published) {
        digitalValueAPI.published = jsonResponse.data.products[0].product.published;
      }

      if (digitalValue.variant_offers) {
        if (digitalValue.variant_offers[0].name) {
          digitalValueAPI.variant_offers[0].name = jsonResponse.data.products[0].product.variant_offers.name;
        }

        if (digitalValue.variant_offers[0].price) {
          digitalValueAPI.variant_offers[0].price = jsonResponse.data.products[0].product.variant_offers.price;
        }

        if (digitalValue.variant_offers[0].quantity_limit) {
          if (digitalValue.variant_offers[0].quantity_limit.limit) {
            digitalValueAPI.variant_offers[0].quantity_limit.limit =
              jsonResponse.data.products[0].product.variant_offers[0].quantity_limit.limit;
          }

          if (digitalValue.variant_offers[0].quantity_limit.enabled) {
            digitalValueAPI.variant_offers[0].quantity_limit.enabled =
              jsonResponse.data.products[0].product.variant_offers[0].quantity_limit.enabled;
          }
        }

        if (digitalValue.variant_offers[0].access_limit) {
          if (digitalValue.variant_offers[0].access_limit.limit) {
            digitalValueAPI.variant_offers[0].access_limit.limit =
              jsonResponse.data.products[0].product.variant_offers[0].access_limit.limit;
          }

          if (digitalValue.variant_offers[0].access_limit.enabled) {
            digitalValueAPI.variant_offers[0].access_limit.enabled =
              jsonResponse.data.products[0].product.variant_offers[0].access_limit.enabled;
          }
        }

        if (digitalValue.variant_offers[0].time_limit) {
          if (digitalValue.variant_offers[0].time_limit.time_limit_type) {
            digitalValueAPI.variant_offers[0].time_limit.time_limit_type =
              jsonResponse.data.products[0].product.variant_offers[0].time_limit.time_limit_type;
          }

          if (digitalValue.variant_offers[0].time_limit.time) {
            digitalValueAPI.variant_offers[0].time_limit.time =
              jsonResponse.data.products[0].product.variant_offers[0].time_limit.time;
          }

          if (digitalValue.variant_offers[0].time_limit.time_type) {
            digitalValueAPI.variant_offers[0].time_limit.time_type =
              jsonResponse.data.products[0].product.variant_offers[0].time_limit.time_type;
          }

          if (digitalValue.variant_offers[0].time_limit.enabled) {
            digitalValueAPI.variant_offers[0].time_limit.enabled =
              jsonResponse.data.products[0].product.variant_offers[0].time_limit.enabled;
          }
        }
      }

      return digitalValueAPI;
    }
  }
  //delete 1 product from product detail screen
  async deleteProduct(shopId: number, productId: number) {
    const response = await this.request.delete(
      `https://${this.domain}/admin/digital-products/product.json?shop_id=${shopId}&ids=${productId}`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return [jsonResponse.success, jsonResponse.message];
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

  //get wista token
  async getWisaToken() {
    const response = await this.request.get(`https://${this.domain}/admin/dp-media/expiring-token`, {});
    expect(response.ok()).toBeTruthy();
  }

  //api upload caption
  async uploadCaption(mediaHashID: number, filePath: string, language: string) {
    const data = new FormData();
    data.append("file_caption", filePath);
    data.append("language", language);
    const response = await this.request.post(`https://${this.domain}/admin/dp-media/${mediaHashID}/captions`, {
      data: {
        data,
      },
    });
    expect(response.ok()).toBeTruthy();
  }

  // create section with api
  async createSection(sectionInfo: SectionInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/section.json`, {
      data: sectionInfo,
    });

    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const sectionInfoAPI = this.cloneObject<SectionInfo>(sectionInfo);

      if (sectionInfo.title) {
        sectionInfoAPI.title = jsonResponse.data.title;
      }

      if (sectionInfo.description) {
        sectionInfoAPI.description = jsonResponse.data.description;
      }

      if (sectionInfo.status) {
        sectionInfoAPI.status = jsonResponse.data.status;
      }

      if (sectionInfo.position) {
        sectionInfoAPI.position = jsonResponse.data.position;
      }

      if (sectionInfo.message) {
        sectionInfoAPI.message = jsonResponse.message;
      }

      if (sectionInfo.success) {
        sectionInfoAPI.success = jsonResponse.success;
      }
      return sectionInfoAPI;
    } else {
      return response.status();
    }
  }

  //get section id after create product successfully
  async getSectionIdAtCreateProduct(sectionInfo: SectionInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/section.json`, {
      data: sectionInfo,
    });
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data.id;
  }

  //update data of section after create section
  async updateSection(sectionInfo: SectionInfo, sectionId: number) {
    const response = await this.request.put(`https://${this.domain}/admin/digital-products/section/${sectionId}.json`, {
      data: sectionInfo,
    });
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse;
  }

  //delete section after create section
  async deleteSection(sectionId: number) {
    const response = await this.request.delete(
      `https://${this.domain}/admin/digital-products/section/${sectionId}.json`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse;
  }

  /*
   * Create lecture by API
   * @param sectionId: thông tin id section cần tạo lecture
   * @param lecture: thông tin lecture cần tạo
   * @param media: media của lecture
   */
  async createLectureAtCreateProduct(sectionId: number, lecture: ProductLecture, media?: Array<ProductMedia>) {
    const response = await this.request.post(
      `https://${this.domain}/admin/digital-products/section/${sectionId}/lectures.json`,
      {
        data: {
          lecture: lecture,
          medias: media,
        },
      },
    );
    let lectureVerify: ProductLectureVerify;
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const lectureInfoAPI = this.cloneObject<ProductLectureVerify>(lectureVerify);
      if (media) {
        lectureInfoAPI.number_media = Object.keys(jsonResponse.data.medias).length;
      }
      if (lecture.title) {
        lectureInfoAPI.title = jsonResponse.data.title;
      }
      if (lecture.description) {
        lectureInfoAPI.description = jsonResponse.data.description;
      }
      if (lecture.status) {
        lectureInfoAPI.status = jsonResponse.data.status;
      }
      if (lecture.position) {
        lectureInfoAPI.position = jsonResponse.data.position;
      }
      return lectureInfoAPI;
    }
  }

  /*
   * Get lecture id by API
   * @param sectionId: thông tin id section cần tạo lecture
   * @param lecture: thông tin lecture cần tạo
   * @param media: media của lecture
   */
  async getLectureIdAtCreateProduct(sectionId: number, lecture: ProductLecture, media: Array<ProductMedia>) {
    const response = await this.request.post(
      `https://${this.domain}/admin/digital-products/section/${sectionId}/lectures.json`,
      {
        data: {
          lecture: lecture,
          medias: media,
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data.id;
  }

  /*
   * Update lecture by API
   * @param sectionId: thông tin id section cần tạo lecture
   * @param lectureId: thông tin lecture cần tạo
   * @param media: media của lecture
   */
  async updateLectureAtCreateProduct(sectionId: number, lectureId: number, lecture: ProductLecture) {
    const response = await this.request.put(
      `https://${this.domain}/admin/digital-products/section/${sectionId}/lectures/${lectureId}.json`,
      {
        data: lecture,
      },
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.message;
  }

  /*
   * Delete lecture by API
   * @param sectionId: thông tin id section chứa lecture cần xóa
   * @param lectureId: thông tin id lecture cần xóa
   */
  async deleteLectureAtCreateProduct(sectionId: number, lectureId: number) {
    const response = await this.request.delete(
      `https://${this.domain}/admin/digital-products/section/${sectionId}/lectures/${lectureId}.json`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.message;
  }

  /**
   * after create product, auto gen variant id
   * this function return variant_id from API
   */
  async getVariantID(productId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${productId}.json`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data.products[0].product.variant_offers[0].variant_id;
  }

  /**
   * after create product, auto gen ref id
   * this function return id from API
   */
  async getRefIDPricing(productId: number) {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${productId}.json`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data.products[0].product.variant_offers[0].id;
  }

  /**
   * get section info from product detail with API
   * @param productId
   * @param digitalValue
   * @returns
   */
  async getSectionFromProductDetail(productId: number, sectionInfo: SectionInfo) {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${productId}.json`);
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const sectionValueAPI = this.cloneObject<SectionInfo>(sectionInfo);

      if (sectionInfo.title) {
        sectionValueAPI.title = jsonResponse.data.products[0].sections[0].title;
      }

      if (sectionInfo.description) {
        sectionValueAPI.description = jsonResponse.data.products[0].sections[0].description;
      }

      if (sectionInfo.position) {
        sectionValueAPI.position = jsonResponse.data.products[0].sections[0].position;
      }

      if (sectionInfo.status) {
        sectionValueAPI.status = jsonResponse.data.products[0].sections[0].status;
      }

      return sectionValueAPI;
    }
  }

  /**
   * get product detail on storefront with shopbase token and customer token
   * @param productHandle: handle of product to view content on storefront
   * @param tokenType: name of token type on header of request
   * @param token: token can be shopbase token or customer token
   * @returns response contain infomation of product
   */
  async getProductDetailSF(productHandle: string, tokenType: string, token: string) {
    const response = await this.request.get(
      `https://${this.domain}/api/digital-products/product/${productHandle}.json`,
      {
        headers: { [tokenType]: token },
      },
    );
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const messages = jsonResponse.messages;
      const handle = jsonResponse.result.handle;
      const title = jsonResponse.result.title;
      const type = jsonResponse.result.type;
      const number = jsonResponse.result.number_session;
      const image = jsonResponse.result.image;
      return { messages, handle, title, type, number, image };
    } else {
      return false;
    }
  }

  /**
   * login to storefront with api login
   * @param account username, password of storefront account
   * @returns customer token after login
   */
  async getCustomerToken(account: string) {
    const response = await this.request.post(`https://${this.domain}/api/customer/next/login.json`, {
      data: account, // {"username": "shopbase@beeketing.net", "password": "123456"}
    });
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.result.token;
    } else {
      return false;
    }
  }

  /**
   * Create upsell with api upsell
   * @returns message response of API create upsell
   */
  async createUpsellAPI(body: string) {
    const response = await this.request.post(`https://${this.domain}/admin/offers/batch.json`, {
      data: { offers: body },
    });
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.success;
    } else {
      return false;
    }
  }

  /**
   * update information for upsell with api
   * @returns message response of API update upsell
   */
  async updateUpsellAPI(body: string) {
    const response = await this.request.put(`https://${this.domain}/admin/offers/batch.json`, {
      data: { body },
    });
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.success;
    } else {
      return false;
    }
  }

  /**
   * get list offer after create upsell downsell
   * @param shopId from config
   * @param productId id of product target
   * @returns id of offer product target
   */
  async getOfferId(shopId: number, productId: number) {
    const response = await this.request.get(
      `https://${this.domain}/admin/offers/list.json?shop_id=${shopId}&ref_ids=${productId}`,
    );
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse[0].id;
    } else {
      return false;
    }
  }

  /**
   * delete offer with API
   * @param shopId from config
   * @returns message response of API update upsell
   */
  async deleteOffer(shopId: number, offerId: string) {
    const response = await this.request.delete(`https://${this.domain}/admin/offers/delete.json?shop_id=${shopId}`, {
      data: offerId,
    });
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      return jsonResponse.success;
    } else {
      return response.status();
    }
  }

  /**
   * get variant offer from api get product detail
   * @param productId
   * @param variantOffer
   * @returns
   */
  async getVariantInfo(productId: number, variantOffer: VariantOfferOld) {
    const response = await this.request.get(`https://${this.domain}/admin/digital-products/product/${productId}.json`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const variantOfferAPI = this.cloneObject<VariantOfferOld>(variantOffer);
    if (variantOffer.name) {
      variantOfferAPI.name = jsonResponse.data.products[0].product.variant_offers[0].name;
    }

    if (variantOffer.price) {
      variantOfferAPI.price = jsonResponse.data.products[0].product.variant_offers[0].price;
    }

    if (variantOffer.quantity_limit) {
      if (variantOffer.quantity_limit.limit) {
        variantOfferAPI.quantity_limit.limit =
          jsonResponse.data.products[0].product.variant_offers[0].quantity_limit.limit;
      }

      if (variantOffer.quantity_limit.enabled) {
        variantOfferAPI.quantity_limit.enabled =
          jsonResponse.data.products[0].product.variant_offers[0].quantity_limit.enabled;
      }
    }

    if (variantOffer.access_limit) {
      if (variantOffer.access_limit.limit) {
        variantOfferAPI.access_limit.limit = jsonResponse.data.products[0].product.variant_offers[0].access_limit.limit;
      }

      if (variantOffer.access_limit.enabled) {
        variantOfferAPI.access_limit.enabled =
          jsonResponse.data.products[0].product.variant_offers[0].access_limit.enabled;
      }
    }

    if (variantOffer.time_limit) {
      if (variantOffer.time_limit.time_limit_type) {
        variantOfferAPI.time_limit.time_limit_type =
          jsonResponse.data.products[0].product.variant_offers[0].time_limit.time_limit_type;
      }

      if (variantOffer.time_limit.time) {
        variantOfferAPI.time_limit.time = jsonResponse.data.products[0].product.variant_offers[0].time_limit.time;
      }

      if (variantOffer.time_limit.time_type) {
        variantOfferAPI.time_limit.time_type =
          jsonResponse.data.products[0].product.variant_offers[0].time_limit.time_type;
      }

      if (variantOffer.time_limit.enabled) {
        variantOfferAPI.time_limit.enabled = jsonResponse.data.products[0].product.variant_offers[0].time_limit.enabled;
      }
    }
    return variantOfferAPI;
  }

  /**
   * send request api to create or update pricing option for product with body request get from config
   * @param productId get after create product
   * @param body is body request was define in config
   * @returns
   */
  async createOrUpdatePricingOption(productId: number, body: string) {
    const response = await this.request.put(
      `https://${this.domain}/admin/digital-products/product/${productId}/pricing-options.json`,
      {
        data: body,
      },
    );
    const jsonResponse = await response.json();
    if (response.ok()) {
      return jsonResponse.data;
    } else {
      return [response.status(), jsonResponse];
    }
  }

  /**
   * send request api to get response contain multi pricing option of product
   * @param productId get after create product and multiple pricing
   * @returns
   */
  async getMultiPricingOption(productId: number) {
    const response = await this.request.get(
      `https://${this.domain}/admin/digital-products/product/${productId}/pricing-options.json`,
    );
    const jsonResponse = await response.json();
    if (response.ok()) {
      return jsonResponse.data;
    } else {
      return [response.status(), jsonResponse];
    }
  }

  //create product with api
  async createDigitalProduct(digitalInfo: DigitalInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/digital-products/product.json`, {
      data: {
        product: digitalInfo,
      },
    });
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data;
  }

  /**
   * Send request api to get products detail of order bump
   * @param productId id of product target
   * @returns variants products of order bump
   */
  async getProductsOrderBump(productId: string) {
    const response = await this.request.get(`https://${this.domain}/api/offers/order-bump.json?ids=${productId}`);
    const jsonResponse = await response.json();
    if (response.ok()) {
      return jsonResponse;
    } else {
      return [response.status(), jsonResponse];
    }
  }

  /**
   * Get thông tin các template sale page bằng api
   * @param domain
   * @returns
   */
  async getTemplateCustomizeSalesPage(domain: string) {
    const response = await this.request.get(
      `https://${domain}/admin/themes/builder/template/pages.json?search=&limit=24&page=1&type=product&` +
        `status=1&action=editor&count=true&tags=&library_ids=&sort_field=&sort_direction=&current_id=`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }
}
