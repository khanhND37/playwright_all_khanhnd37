import { addDays, formatDate, getUnixTime } from "@core/utils/datetime";
import { SBPage } from "@pages/page";
import { APIRequestContext, expect, Page } from "@playwright/test";
import type {
  TippingInfo,
  CountriesInfo,
  CalculateProfitInfos,
  StoreStatus,
  TaxInfor,
  DataSetting,
  DiscountAPI,
  GlobalMarket,
  BoostUpsellInfo,
  VariantRequest,
  VariantInfo,
  ShippingProfileRequest,
  ShippingZoneInfo,
  ShippingZoneRequest,
  FilterFunnel,
  ConversionAnalytics,
  BoostUpsellRequest,
  DataTokenShopTemplate,
  ShippingCountry,
  ShippingProfile,
  TaxResponse,
  CheckFilters,
  Order,
  MenuInfo,
  DataHomepage,
} from "@types";
import { ProductAPI } from "@pages/api/product";
import { ShopOptions } from "@utils/token";
import { SignUpStorefrontInfo } from "tests/modules/dashboard/order/multiple_storefronts/send_mail_of_multiple_storefronts";
import { OcgLogger } from "@core/logger";
const logger = OcgLogger.get();
export class DashboardAPI extends SBPage {
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext, page?: Page) {
    super(page, domain);
    this.request = request;
  }

  defaultConversionAnalytics: ConversionAnalytics = {
    view_all: 0,
    view_collect: 0,
    view_product: 0,
    add_to_cart: 0,
    reached_checkout: 0,
    do_checkout: 0,
    fill_shipping_info: 0,
    complete_shipping_info: 0,
    fill_payment_info: 0,
    place_order: 0,
    purchase: 0,
  };

  /*
   * Setup tipping by API
   * @param tippingInfo: thông tin setup tipping tại dashboard
   */
  async setupTipping(tippingInfo: TippingInfo) {
    const dataBody = await this.getDataCheckoutSetting();
    expect(!!dataBody).toBeTruthy();
    if (tippingInfo.shop_type === "shopbase") {
      dataBody.tip.percentages = tippingInfo.percentages;
    } else {
      dataBody.tip = tippingInfo;
    }
    const res = await this.request.put(`https://${this.domain}/admin/setting/checkout.json`, {
      data: dataBody,
    });
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * Get data checkout setting
   */
  async getDataCheckoutSetting() {
    const res = await this.request.get(`https://${this.domain}/admin/setting/checkout.json`);
    expect(res.status()).toBe(200);
    return await res.json();
  }

  //Get total sales at analytics page by API
  async getTotalSalesByShopId(shopId: string) {
    const date = new Date();
    const time = formatDate(date, "YYYY-MM-DD");
    const res = await this.request.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: {
        report_type: "sale_over_time",
        from_time: time,
        to_time: time,
        aov_field: "total_sales",
        shop_ids: shopId,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const summary = resBody.summary;
    if (summary) {
      return summary.total_sales;
    }
    return 0;
  }

  //Get tip when choose report by Sales over time by API
  async getTipAtSalesOverTimeByShopId(shopId: string) {
    const date = new Date();
    const time = formatDate(date, "YYYY-MM-DD");
    const res = await this.request.post(`https://${this.domain}/admin/analytics/report.json?shop_ids=${shopId}`, {
      data: {
        report_type: "sale_over_time",
        from_time: time,
        to_time: time,
        aov_field: "total_sales",
        shopIds: shopId,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const summary = resBody.summary;
    if (summary) {
      return summary.total_tip;
    }
    return 0;
  }

  //Get total profits at analytics page by API
  async getTotalProfitsByShopId(shopId: string) {
    const date = new Date();
    const time = formatDate(date, "YYYY-MM-DD");
    const res = await this.request.post(`https://${this.domain}/admin/analytics.json?shop_ids=${shopId}`, {
      data: {
        report_type: "customer",
        from_time: time,
        to_time: time,
        aov_field: "total_profit",
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();

    const analyticInfo = {
      total_profit: resBody.summary.profit.total,
      total_order: resBody.summary.order.total,
    };
    return analyticInfo;
  }

  /**
   *
   * @returns total balance in Balance page
   */
  async getTotalBalance(): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/balance.json`, {
      params: {
        "fetch-bucket-details": true,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.balance.available_amount + resBody.balance.available_soon;
  }

  /**
   * Get total tax in order detail on dashboard
   * @param orderId
   * @returns total tax amount
   */
  async getTotalTaxInOrderDetail(orderId: string) {
    const res = await this.request.get(`https://${this.domain}/admin/orders/${orderId}.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.order.total_tax;
  }

  /**
   * Get order info in order detail on dashboard of store pbase/plbase
   * @param orderId
   * @param accessToken
   * @param shopType
   * @returns response body
   */
  async getOrderInfoByApi(orderId: number, shopType: "Shopbase" | "Printbase" | "Plusbase"): Promise<Order> {
    let url: string;
    logger.info(`-----> Domain hien tai = ${this.domain}`);
    switch (shopType) {
      case "Shopbase":
        url = `https://${this.domain}/admin/orders/${orderId}.json`;
        break;
      case "Printbase":
        url = `https://${this.domain}/admin/pbase-orders/${orderId}.json`;
        break;
      case "Plusbase":
        url = `https://${this.domain}/admin/orders/plusbase/${orderId}.json`;
        break;
    }
    try {
      const res = await this.request.get(url);
      if (res.ok()) {
        return await res.json();
      }
    } catch {
      await this.getOrderInfoByApi(orderId, shopType);
    }
  }

  /**
   * Active/deactive payment method by API
   * @param shopId
   * @param paymentId: Id of payment method needed to active/deactive
   */
  async activePaymentMethod(shopId: number, paymentId: number, isActive: boolean) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${paymentId}/changeStatus.json`, {
      data: {
        id: paymentId,
        shop_id: shopId,
        active: isActive,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * get checkout setting
   * @returns new data of checkout setting
   */
  async getCheckoutSetting() {
    const res = await this.request.get(`https://${this.domain}/admin/setting/checkout.json`);
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * edit checkout setting
   * @param payloadData: full data payload for API PUT setting/checkout.json.
   * @returns new data of checkout setting
   */
  async editCheckoutSetting(payloadData) {
    const res = await this.request.put(`https://${this.domain}/admin/setting/checkout.json`, {
      data: payloadData,
    });
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * @param layout
   *        "one-page" : one page checkout
   *        "multi-step": 3-steps checkout
   * @returns new data of checkout setting
   */
  async updateLayoutCheckoutPlb(layout: "one-page" | "multi-step") {
    let resBody = await this.getCheckoutSetting();
    resBody.checkout_layout = layout;
    resBody = await this.editCheckoutSetting(resBody);
    return resBody;
  }

  /**
   * Only apply for store pbase, plbase
   * @param isTaxInclude true <=> tax include, false <=> tax exclude
   */
  async updateTaxSettingPbPlb(option = { isTaxInclude: true }) {
    const res = await this.request.put(`https://${this.domain}/admin/tax/update-tax-settings.json`, {
      data: {
        tax_included: option.isTaxInclude,
        tax_update_subcribe: false,
        include_shipping: false,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `updateTaxSetting` updates the tax settings based on the provided `taxInfo` object.
   * @param {TaxInfor} taxInfo - The `taxInfo` parameter is an object that contains the following
   * properties:
   */
  async updateTaxSetting(taxInfo: TaxInfor) {
    const dataSetting = await this.getDataCheckoutSetting();
    expect(dataSetting).toBeTruthy();
    let tax = dataSetting?.tax;
    if (!tax) {
      tax = {
        include_shipping: false,
        tax_included: false,
        tax_update_subcribe: false,
      };
    }
    if (taxInfo.isTaxIncluded != undefined) {
      tax.tax_included = taxInfo.isTaxIncluded;
    }
    if (taxInfo.isTaxIncludedShipping != undefined) {
      tax.include_shipping = taxInfo.isTaxIncludedShipping;
    }
    const res = await this.request.put(`https://${this.domain}/admin/tax/update-tax-settings.json`, {
      data: tax,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * get all order transaction amount
   * @returns list amount of all transaction
   */
  async getOrderTransAmt(invoiceId?: string): Promise<Array<number>> {
    if (!invoiceId) {
      const url = this.page.url();
      const arr = url.split("/");
      invoiceId = arr[arr.length - 1];
    }
    const res = await this.request.get(`https://${this.domain}/admin/balance/invoices/${invoiceId}/transactions.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const listTransAmt = [];
    const listTransaction = resBody.transactions;
    for (const trans of listTransaction) {
      listTransAmt.push(trans.amount_cent);
    }
    return listTransAmt;
  }

  /**
   * get countries
   * @returns list all countries of sbase
   */
  async getCountries(getCurrentCountry?: boolean): Promise<CountriesInfo> {
    let url = `https://${this.domain}/admin/countries.json`;
    if (getCurrentCountry) {
      url += "?get-current-country=1";
    }

    const res = await this.request.get(url);
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * calculate profit of order pbase
   * @param orderId
   * @param accessToken
   * @returns order printbase profit
   */
  async calculateProfitAndFeesPbaseFromAPI(
    orderId: number,
  ): Promise<{ paymentFee: number; processingFee: number; profit: number }> {
    const orderInfo = await this.getOrderInfoByApi(orderId, "Printbase");
    // subtotal amount
    let subtotal = orderInfo.order.subtotal_price;
    // tipping amount
    const tip = orderInfo.order.tip_amount;
    // shipping fee
    const shipLineList = orderInfo.order.shipping_lines;
    let shippingFee = 0;
    if (shipLineList.length > 0) {
      for (const lineShip of shipLineList) {
        shippingFee += lineShip.price;
      }
    }
    // tax amount
    const taxAmount = orderInfo.order.total_tax;
    if (orderInfo.order.taxes_included) {
      subtotal -= taxAmount;
    }
    // total store discount amount
    const storeDiscount = orderInfo.order.total_discounts;
    // base cost
    const baseCost = orderInfo.pbase_order.base_cost;
    // design fee
    const designFee = orderInfo.pbase_order.manual_design_fee;
    // payment fee amount
    const paymentFeePercent = orderInfo.pbase_order.payment_fee_rate;
    // processing fee rate
    const processingFeePercent = orderInfo.pbase_order.processing_rate;
    // calculate profit
    const orderFeesAndProfit = this.calculateProfitPbase(
      subtotal,
      tip,
      shippingFee,
      taxAmount,
      storeDiscount,
      baseCost,
      designFee,
      paymentFeePercent,
      processingFeePercent,
    );
    return orderFeesAndProfit;
  }

  /**
   * get info calculate profit of order pbase
   * @param orderId
   * @param accessToken
   * @returns order printbase profit
   */
  async getInfoCalculateProfitByAPI(orderId: number): Promise<CalculateProfitInfos> {
    let orderInfo: Order;
    do {
      orderInfo = await this.getOrderInfoByApi(orderId, "Printbase");
      logger.info(`-----> ${JSON.stringify(orderInfo.pbase_order)}`);
    } while (orderInfo.pbase_order == null);
    // subtotal amount
    let subtotal = orderInfo.order.total_line_items_price;
    // tipping amount
    const tip = orderInfo.order.tip_amount;
    // shipping fee
    const shipLineList = orderInfo.order.shipping_lines;
    let storeDiscount = orderInfo.order.total_discounts + orderInfo.order.previous_shipping_fee;
    let shippingFee = 0;
    if (shipLineList.length > 0) {
      for (const lineShip of shipLineList) {
        shippingFee += lineShip.price;
        storeDiscount += lineShip.discounted_price;
      }
    }
    const taxAmount = orderInfo.order.total_tax;
    if (orderInfo.order.taxes_included) {
      subtotal -= taxAmount;
    }
    const baseCost = orderInfo.pbase_order.base_cost;
    const designFee = orderInfo.pbase_order.manual_design_fee;
    const paymentFee = orderInfo.pbase_order.payment_fee;
    const paymentFeePercent = orderInfo.pbase_order.payment_fee_rate;
    const processingFee = orderInfo.pbase_order.processing_fee;
    const processingFeePercent = orderInfo.pbase_order.processing_rate;
    const calculateProfitInfos = {
      sub_total: subtotal,
      tip: tip,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      store_discount: storeDiscount,
      base_cost: baseCost,
      design_fee: designFee,
      payment_fee_percent: paymentFeePercent,
      processing_fee_percent: processingFeePercent,
      payment_fee: paymentFee,
      processing_fee: processingFee,
    };
    return calculateProfitInfos;
  }

  /**
   * Call this api to update store status following by time
   * @param gApi
   * @param storeStatus
   */
  async updateStoreStatus(gApi: string, storeStatus: StoreStatus) {
    if (storeStatus.end_free_trial_at) {
      storeStatus.end_free_trial_at = getUnixTime(addDays(storeStatus.end_free_trial_at)) / 1000;
      storeStatus.subscription_expired_at = getUnixTime(addDays(storeStatus.subscription_expired_at)) / 1000;
    }

    const res = await this.request.post(`${gApi}/admin/qc-tools/update-qc-shop`, {
      data: storeStatus,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * This function adds a new tax rate to a shopbase store using the provided tax information.
   * @param {TaxInfor} taxInfo - This is an object that contains information about a tax rate
   */
  async addNewTaxRate(taxInfo: TaxInfor, accessToken?: string) {
    let url = `https://${this.domain}/admin/tax.json`;
    if (accessToken) {
      url += `?access_token=${accessToken}`;
    }
    const res = await this.request.post(url, {
      data: {
        country_code: taxInfo.country,
        province_code: taxInfo.province,
        threshold: taxInfo.minItemValue,
        threshold_to: taxInfo.maxItemValue,
        name: taxInfo.taxName,
        rate: taxInfo.taxRate,
        type: taxInfo.categories,
        conditions: {
          type: "shopbase",
        },
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * This function retrieves all tax rates from a shopbase store using an access token.
   * @param {string} [accessToken] - An optional access token that can be used to authenticate the
   * request to the Shopbase API.
   */
  async getAllTaxRate(accessToken?: string) {
    let url = `https://${this.domain}/admin/tax.json`;
    if (accessToken) {
      url += `?access_token=${accessToken}`;
    }
    const res = await this.request.get(url, {
      params: {
        limit: 20,
        page: 1,
        type: "country",
      },
    });
    expect(res.status()).toBe(200);
    return await res.json();
  }

  async deleteAllTaxRate(accessToken?: string) {
    const taxList = await this.getAllTaxRate(accessToken);
    if (taxList.taxes.length === 0) {
      return;
    }
    for (const tax of taxList.taxes) {
      await this.deleteTaxRate(tax.country_code, accessToken);
    }
  }

  /**
   * This function deletes a tax rate for a specific country.
   * @param {string} countryCode - a string representing the country code of the tax rate to be deleted.
   */
  async deleteTaxRate(countryCode: string, accessToken?: string) {
    let url = `https://${this.domain}/admin/tax/country/${countryCode}.json`;
    if (accessToken) {
      url += `?access_token=${accessToken}`;
    }
    const res = await this.request.delete(url);
    expect(res.status()).toBe(200);
  }

  /**
   * The function `getDiscountByTitle` retrieves a discount from an API based on its title.
   * @param {DiscountAPI} discount - The `discount` parameter is an object of type `DiscountAPI`.
   * @returns a Promise that resolves to a DiscountAPI object.
   */
  async getDiscountByTitle(discount: DiscountAPI): Promise<DiscountAPI> {
    const res = await this.request.get(
      `https://${this.domain}/admin/price_rules.json?limit=50&type=${discount.type}&filter=all&query=${discount.title}&page=1`,
    );
    expect(res.status()).toBe(200);
    const discountList = await res.json();
    return discountList.price_rules.find(({ title }) => title === discount.title);
  }

  /**
   * The function `getDiscountInfoById` retrieves discount information by its ID from an API endpoint.
   * @param {number} discountId
   * @returns a Promise that resolves to a DiscountAPI object.
   */
  async getDiscountInfoById(discountId: number): Promise<DiscountAPI> {
    const res = await this.request.get(`https://${this.domain}/admin/price_rules/${discountId}.json`);
    expect(res.status()).toBe(200);
    const discountInfo = await res.json();
    return discountInfo.price_rule;
  }

  /**
   * this function use to change Discount's info.
   * action's change includes create/update/delete
   * @param discount
   */
  async changeDiscountInfo(discount: DiscountAPI) {
    if (discount.is_update) {
      await this.updateDiscountInfo(discount);
    }
    if (discount.is_create) {
      await this.createDiscountInfo(discount);
    }
    if (discount.is_remove) {
      await this.removeDiscountInfo(discount);
    }
  }

  /**
   * The function `removeDiscountInfo` delete the discount information if it exists
   * @param {DiscountAPI} discount - The `discount` parameter is an object of type `DiscountAPI`.
   */
  async removeDiscountInfo(discount: DiscountAPI) {
    const discountInfo = await this.getDiscountByTitle(discount);
    expect(discountInfo).toBeTruthy();
    const res = await this.request.delete(`https://${this.domain}/admin/price_rules/${discountInfo.id}.json`);
    expect(res.status()).toBe(200);
  }

  /**
   * The function `updateDiscountInfo` updates the discount information by making a PUT request to the
   * specified URL with the updated discount data.
   * @param {DiscountAPI} discount - The `discount` parameter is an object of type `DiscountAPI`.
   */
  async updateDiscountInfo(discount: DiscountAPI) {
    const discountInfo = await this.getDiscountByTitle(discount);
    expect(!!discountInfo).toBeTruthy();
    for (const field of discount.update_fields) {
      if (discountInfo[field] != undefined) {
        // check if key exists in discountInfo
        discountInfo[field] = discount[field];
      }
    }
    const res = await this.request.put(`https://${this.domain}/admin/price_rules/${discountInfo.id}.json`, {
      data: {
        price_rule: discountInfo,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `createDiscountInfo` create the discount information
   * @param {DiscountAPI} discount - The `discount` parameter is an object of type `DiscountAPI`.
   */
  async createDiscountInfo(discount: DiscountAPI | DiscountAPI[]) {
    const createSingleDiscount = async (discount: DiscountAPI) => {
      const discountInfo = await this.getDiscountByTitle(discount);
      if (!discountInfo) {
        const startAt = new Date();
        startAt.setDate(startAt.getDate() - 1);
        const payload = {
          allocation_method: "each" || discount.allocation_method,
          customer_selection: "all",
          target_selection: "all",
          target_type: "line_item",
          usage_limit: -1,
          starts_at: startAt,
          ends_at: "",
          title: discount.title,
          entitled_variant_ids: discount.customer_get_variants || null,
          prerequisite_variant_ids: discount.customer_buy_variants,
          value: discount.value,
          value_type: discount.value_type,
          prerequisite_to_entitlement_quantity_ratio: discount.quantity_ratio,
          prerequisite_subtotal_range: discount.prerequisite_subtotal_range || null,
          metadata: discount.metadata || null,
          type: discount.type,
        };
        await this.request.post(`https://${this.domain}/admin/price_rules.json?check_overlap=false`, {
          data: {
            price_rule: payload,
          },
        });
      }
    };
    // Chuyển discount thành mảng nếu nó không phải là mảng
    const discountsToCreate = Array.isArray(discount) ? discount : [discount];

    for (const singleDiscount of discountsToCreate) {
      await createSingleDiscount(singleDiscount);
    }
    return true;
  }

  /**
   * The function `getGlobalMarketByName` get global market info by name
   * @param globalMarket
   */
  async getGlobalMarketByName(globalMarket: string): Promise<GlobalMarket> {
    const res = await this.request.get(`https://${this.domain}/admin/global-markets/all.json`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    return data.result?.find(gm => gm.name.trim() === globalMarket);
  }

  /**
   * The function `updateGlobalInfo` update global market's info
   * @param globalMarket
   */
  async updateGlobalInfo(globalMarket: GlobalMarket) {
    const globalMarketInfo = await this.getGlobalMarketByName(globalMarket.name);
    expect(globalMarketInfo).toBeTruthy();
    for (const field of globalMarket.update_fields) {
      globalMarketInfo[field] = globalMarket[field];
    }
    const res = await this.request.put(`https://${this.domain}/admin/global-markets/${globalMarketInfo.id}.json`, {
      data: globalMarketInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The `changeOfferStatus` function is an asynchronous function that takes in an array of offer IDs, a
   * status boolean, and a shop ID, and sends a PUT request to change the status of the offers.
   * @param offerId
   * @param {boolean} status
   * @param {number} shopId
   */
  async changeOfferStatus(offerId: Array<number>, status: boolean, shopId: number) {
    const res = await this.request.put(`https://${this.domain}/admin/offers/change-offer-status.json`, {
      data: {
        offer_ids: offerId,
        status: status,
        shop_id: shopId,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `changeBoostUpsellInfo` update boostUpsell's info
   * @param boostUpsell
   */
  async changeBoostUpsellInfo(boostUpsell: BoostUpsellRequest) {
    const boostUpsellInfo = await this.getBoostUpsellByTitle(boostUpsell);
    expect(boostUpsellInfo).toBeTruthy();
    const discountData = {
      data: boostUpsell.discount_data,
    };
    boostUpsellInfo.discount_data = JSON.stringify(discountData);
    const res = await this.request.put(`https://${this.domain}/admin/offers/${boostUpsellInfo.id}.json`, {
      data: boostUpsellInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `getListVariantInfoByIds` get list variant by list variantIds
   * @param variantIds
   */
  async getListVariantInfoByIds(variantIds: Array<number>): Promise<Array<VariantInfo>> {
    const res = await this.request.get(`https://${this.domain}/admin/variants/bulk.json?ids=${variantIds.join(",")}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    return data.variants;
  }

  /**
   * The function `changeVariantInfo` update variant's info
   * @param variantRequest
   */
  async changeVariantInfo(variantRequest: Array<VariantRequest>) {
    const variantIds = [];
    variantRequest.forEach(variant => {
      variantIds.push(variant.id);
    });

    const variantInfo = await this.getListVariantInfoByIds(variantIds);
    if (!variantInfo || !variantInfo.length) {
      return;
    }
    variantInfo.map(item => {
      const variant = variantRequest.find(vr => vr.id === item.id);
      if (variant) {
        variant.update_fields.forEach(field => {
          item[field] = variant[field];
        });
      }
    });

    const res = await this.request.patch(`https://${this.domain}/admin/variants/bulk.json`, {
      data: {
        variants: variantInfo,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `getBoostUpsellByTitle` get boostUpsell's info by title
   * @param boostUpsell
   */
  async getBoostUpsellByTitle(boostUpsell: BoostUpsellRequest): Promise<BoostUpsellInfo> {
    const res = await this.request.get(`https://${this.domain}/admin/offers/list.json`, {
      params: {
        search: boostUpsell.offer_name,
        limit: 10,
        page: 1,
        offer_types: "pre-purchase,post-purchase,in-cart,quantity",
        only_active: false,
      },
    });
    expect(res.status()).toBe(200);
    const boostUpsells = await res.json();
    return boostUpsells.find((item: BoostUpsellInfo) => item.offer_name === boostUpsell.offer_name);
  }

  /**
   * The function `getTaxByCountry` get taxInfo's info by country
   * @param taxInfo
   */
  async getTaxByCountry(taxInfo: TaxInfor): Promise<TaxResponse> {
    let type = "country";
    if (taxInfo.categories) {
      type = taxInfo.categories;
    }
    const res = await this.request.get(
      `https://${this.domain}/admin/tax.json?limit=20&page=1&type=${type}&country_code=${taxInfo.country}`,
    );
    expect(res.status()).toBe(200);
    const taxZones = await res.json();
    return taxZones.taxes.find(({ name }) => name === taxInfo.taxName);
  }

  /**
   * The function updates tax information by making an API request to update the tax rate, threshold, and
   * threshold_to values.
   * @param {TaxInfor} taxInfo
   */
  async updateTaxInfo(taxInfo: TaxInfor) {
    const taxResponse = await this.getTaxByCountry(taxInfo);
    expect(!!taxResponse).toBeTruthy();
    taxResponse.rate = taxInfo.taxRate;
    taxResponse.threshold = taxInfo.minItemValue || 0;
    taxResponse.threshold_to = taxInfo.maxItemValue || null;
    const res = await this.request.put(`https://${this.domain}/admin/tax.json`, {
      data: taxResponse,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `getShippingProfileInfo` get ShippingProfile's info by name
   * @param shippingProfileRequest
   * @param shopOption
   */
  async getShippingProfileInfo(
    shippingProfileRequest: ShippingProfileRequest,
    shopOption?: ShopOptions,
  ): Promise<ShippingProfile> {
    let domain = this.domain;
    const option = {};
    if (shopOption && shopOption.domain) {
      domain = shopOption.domain;
      option["headers"] = {
        "X-ShopBase-Access-Token": shopOption.token,
      };
    }
    const res = await this.request.get(
      `https://${domain}/admin/shipping/profiles.json?search=${shippingProfileRequest.name}`,
      option,
    );
    expect(res.status()).toBe(200);
    const shipping = await res.json();
    return shipping.data.find(({ name }) => name === shippingProfileRequest.name);
  }

  /**
   * The function `updateItemBaseShippingRate` update ItemBaseShippingRate's info
   * for shippingZoneTarget from shippingZoneReq
   * @param shippingZoneReq
   * @param shippingZoneTarget
   */
  updateItemBaseShippingRate(shippingZoneReq: ShippingZoneRequest, shippingZoneTarget: ShippingZoneInfo) {
    shippingZoneTarget.item_based_shipping_rate.map(item => {
      const itemBaseReq = shippingZoneReq.item_based_shipping_rate.find(i => i.name === item.name);
      if (itemBaseReq) {
        for (const field of itemBaseReq.update_fields) {
          item[field] = itemBaseReq[field];
        }
      }
    });
  }

  /**
   * The function `updatePriceBaseShippingRate` update PriceBaseShippingRate's info
   * for shippingZoneTarget from shippingZoneReq
   * @param shippingZoneReq
   * @param shippingZoneTarget
   */
  updatePriceBaseShippingRate(shippingZoneReq: ShippingZoneRequest, shippingZoneTarget: ShippingZoneInfo) {
    shippingZoneTarget.price_based_shipping_rate.map(item => {
      const priceBaseReq = shippingZoneReq.price_based_shipping_rate.find(i => i.name === item.name);
      if (priceBaseReq) {
        for (const field of priceBaseReq.update_fields) {
          item[field] = priceBaseReq[field];
        }
      }
    });
  }

  /**
   * The function `updateCountriesShippingZone` update CountriesShippingZone's info
   * for shippingZoneTarget from shippingZoneReq
   * @param shippingZoneReq
   * @param shippingZoneTarget
   */
  updateCountriesShippingZone(
    shippingZoneReq: ShippingZoneRequest,
    shippingZoneTarget: ShippingZoneInfo,
  ): ShippingCountry[] {
    const countries: ShippingCountry[] = [];
    for (const countryT of shippingZoneTarget.countries) {
      const country = shippingZoneReq.countries.find(i => i.id === countryT.id);
      if (!country) {
        countries.push(countryT);
        continue;
      }
      if (country.is_remove) {
        continue;
      }
      countries.push(country);
    }
    for (const countryT of shippingZoneReq.countries) {
      const country = shippingZoneTarget.countries.find(i => i.id === countryT.id);
      if (!country) {
        countries.push(countryT);
      }
    }
    return countries;
  }

  /**
   * The function `changeShippingProfileInfo` update ShippingProfile's info
   * @param shippingProfileRequest
   * @param shopOption
   */
  async changeShippingProfileInfo(shippingProfileRequest: ShippingProfileRequest, shopOption?: ShopOptions) {
    const shippingProfileRes = await this.getShippingProfileInfo(shippingProfileRequest, shopOption);
    expect(!!shippingProfileRes).toBeTruthy();
    shippingProfileRes.shipping_zones.map(shippingZone => {
      const shippingZoneReq = shippingProfileRequest.shipping_zones.find(item => item.name === shippingZone.name);
      if (shippingZoneReq) {
        for (const field of shippingZoneReq.update_fields) {
          if (field == "item_based_shipping_rate") {
            this.updateItemBaseShippingRate(shippingZoneReq, shippingZone);
            continue;
          }
          if (field == "countries") {
            shippingZone.countries = this.updateCountriesShippingZone(shippingZoneReq, shippingZone);
            continue;
          }
          shippingZone[field] = shippingZoneReq[field];
        }
      }
    });
    let domain = this.domain;
    const option = {
      data: shippingProfileRes,
    };
    if (shopOption && shopOption.domain) {
      domain = shopOption.domain;
      option["headers"] = {
        "X-ShopBase-Access-Token": shopOption.token,
      };
    }
    const res = await this.request.put(
      `https://${domain}/admin/shipping/profile/${shippingProfileRes.id}.json`,
      option,
    );
    expect(res.status()).toBe(200);
  }

  /**
   * The function `getShippingZoneInfo` get ShippingZone's info
   * @param shippingZoneRequest
   */
  async getShippingZoneInfo(shippingZoneRequest: ShippingZoneRequest): Promise<ShippingZoneInfo> {
    const url = `https://${this.domain}/admin/shipping/zones.json`;
    const res = await this.request.get(url);
    expect(res.status()).toBe(200);
    const shipping = await res.json();
    return shipping.shipping_zones.find(({ name }) => name.trim() === shippingZoneRequest.name);
  }

  /**
   * The function `changeShippingZoneInfo` update ShippingZone's info
   * @param shippingZoneRequest
   */
  async changeShippingZoneInfo(shippingZoneRequest: ShippingZoneRequest) {
    const shippingZoneRes = await this.getShippingZoneInfo(shippingZoneRequest);
    expect(shippingZoneRes).toBeTruthy();
    for (const field of shippingZoneRequest.update_fields) {
      if (field == "item_based_shipping_rate") {
        this.updateItemBaseShippingRate(shippingZoneRequest, shippingZoneRes);
        continue;
      }
      if (field == "price_based_shipping_rate") {
        this.updatePriceBaseShippingRate(shippingZoneRequest, shippingZoneRes);
        continue;
      }
      shippingZoneRes[field] = shippingZoneRequest[field];
    }
    const res = await this.request.put(`https://${this.domain}/admin/shipping/zone/${shippingZoneRes.id}.json`, {
      data: shippingZoneRes,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `updateOfferPPC` updates a boost upsell offer with the provided data.
   * @param {BoostUpsellRequest} dataSetting
   */
  async updateOfferPPC(dataSetting: BoostUpsellRequest) {
    const boostUpsellInfo = await this.getBoostUpsellByTitle(dataSetting);
    boostUpsellInfo.discount_data = JSON.stringify(dataSetting.discount_data[0].value_discount);
    const res = await this.request.put(`https://${this.domain}/admin/offers/${boostUpsellInfo.id}.json`, {
      data: boostUpsellInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The function `changeDataSetting` updates data setting.
   * @param dataSetting
   * @param accessTokenShopTemplate
   */
  async changeDataSetting(dataSetting: DataSetting, accessTokenShopTemplate?: DataTokenShopTemplate) {
    for (const [key, value] of Object.entries(dataSetting)) {
      if (!value) {
        continue;
      }
      switch (key) {
        case "product":
          await new ProductAPI(this.domain, this.request).updateProductInfo(dataSetting.product);
          break;
        case "discount":
          await this.changeDiscountInfo(dataSetting.discount);
          break;
        case "tipping":
          await this.setupTipping(dataSetting.tipping);
          break;
        case "tax":
          if (!dataSetting.tax.isIgnoreUpdateTaxInfo) {
            await this.updateTaxInfo(dataSetting.tax);
          }
          await this.updateTaxSetting(dataSetting.tax);
          break;
        case "global_market":
          await this.updateGlobalInfo(dataSetting.global_market);
          break;
        case "boost_upsell":
          await this.changeBoostUpsellInfo(dataSetting.boost_upsell);
          break;
        case "variant":
          await this.changeVariantInfo(dataSetting.variant);
          break;
        case "shipping_profile":
          await this.changeShippingProfileInfo(dataSetting.shipping_profile, accessTokenShopTemplate?.shipping);
          break;
        case "markup_shipping":
          await this.changeShippingZoneInfo(dataSetting.markup_shipping);
          break;
        case "post_purchase":
          await this.updateOfferPPC(dataSetting.post_purchase);
          break;
      }
    }
  }

  /**
   * Get value of funnels by shop ID
   * @param filterInfo include: shop_id, funnel_from, funnel_to, action_list
   * @param initData original data
   */
  async getDataConversionAnalytics(
    filterInfo: FilterFunnel,
    initData: ConversionAnalytics = this.defaultConversionAnalytics,
    isCheckTraffic?: boolean,
  ): Promise<object> {
    const date = new Date();
    const time = formatDate(date, "YYYY-MM-DD");
    let dataWithTrafficForm = {};

    if (isCheckTraffic !== undefined) {
      dataWithTrafficForm = {
        report_type: "conversion_analytic_funnel",
        from_time: time,
        to_time: time,
        aov_field: "total_sales",
        shopIds: filterInfo.shop_id,
        group_by: ["display_time"],
        funnel_from: filterInfo.funnel_from,
        funnel_to: filterInfo.funnel_to,
        funnel_steps: filterInfo.action_list,
        exclude_traffic_non_shipping: isCheckTraffic,
      };
    } else {
      dataWithTrafficForm = {
        report_type: "conversion_analytic_funnel",
        from_time: time,
        to_time: time,
        aov_field: "total_sales",
        shopIds: filterInfo.shop_id,
        group_by: ["display_time"],
        funnel_from: filterInfo.funnel_from,
        funnel_to: filterInfo.funnel_to,
        funnel_steps: filterInfo.action_list,
      };
    }
    const res = await this.request.post(
      `https://${this.domain}/admin/analytics/report.json?shop_ids=${filterInfo.shop_id}`,
      {
        data: dataWithTrafficForm,
      },
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();

    if (resBody.data.length === 0) {
      return initData;
    } else {
      const dataConversionAnalytics = resBody.summary;
      const obj = { ...initData };
      for (const key in obj) {
        if (dataConversionAnalytics[key] != undefined) {
          obj[key] = dataConversionAnalytics[key];
        }
      }
      return obj;
    }
  }

  /**
   * validate Data Conversion Analytics
   * @param dataAnalyticsBefore data before checkout
   * @param filterInfo include: shop_id, funnel_from, funnel_to, action_list
   * @param validateData includes data change
   * @param timeOut time Out Wait Call Api Per Session
   * @returns
   */
  async validateDataConversionAnalytics(
    dataAnalyticsBefore: object,
    filterInfo: FilterFunnel,
    validateData: ConversionAnalytics = this.defaultConversionAnalytics,
    timeOut = 15000,
  ): Promise<object> {
    let dataChanges;
    for (let i = 0; i < 7; i++) {
      dataChanges = await this.getDataConversionAnalytics(filterInfo, validateData);
      if (Object.keys(dataChanges).every(key => dataChanges[key] !== dataAnalyticsBefore[key])) {
        return dataChanges;
      }
      await new Promise(t => setTimeout(t, timeOut));
    }
    return Promise.reject("Timeout rollup data in database for updating API");
  }

  /**
   * get shop id
   * @param storeDomain
   * @param accessToken input if api return 401: Unauthorized
   * @returns
   */
  async getShopId(storeDomain: string, accessToken?: string): Promise<number> {
    let response;
    if (accessToken) {
      response = await this.request.get(`https://${storeDomain}/admin/shop/staffs/current.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.get(`https://${storeDomain}/admin/shop/staffs/current.json`);
    }
    if (!response.ok()) {
      return Promise.reject("Error");
    } else {
      const resBody = await response.json();
      return resBody.user.shop_id;
    }
  }

  /**
   * Check, uncheck filter, add custom filter by API
   * @param data
   * @returns
   */
  async setSearchFilter(data: CheckFilters): Promise<{ success: boolean }> {
    try {
      const res = await this.request.put(`https://${this.domain}/admin/menus/filter.json`, {
        data: data,
      });
      const resJson = await res.json();
      return resJson.result;
    } catch (error) {
      throw new Error("Check filters failed");
    }
  }

  /**
   * Hàm get menu info của shop
   * @returns
   */
  async getAllMenus(): Promise<MenuInfo[]> {
    try {
      const res = await this.request.get(`https://${this.domain}/admin/menus.json`);
      const resJson = await res.json();
      return resJson.menus;
    } catch (error) {
      throw new Error("Get menus info failed!");
    }
  }

  /**
   * Hàm delete menu của shop
   * @param id
   * @returns
   */
  async deleteMenuByAPI(id: number): Promise<boolean> {
    try {
      const res = await this.request.delete(`https://${this.domain}/admin/menus/${id}.json`);
      const resJson = await res.json();
      return resJson.success;
    } catch (error) {
      throw new Error("Delete menu failed");
    }
  }

  /**
   * Turn on page locks for product, collection, search page
   * @param page
   */
  async setPageLocks(pages: string[]): Promise<void> {
    try {
      await this.request.put(`https://${this.domain}/admin/setting/online-store-page-locks.json`, {
        data: { pages: pages },
      });
    } catch (error) {
      throw new Error("Set page locks failed");
    }
  }

  /**
   * Get data in home page
   * @returns data home page
   */
  async getDataHomepage(): Promise<DataHomepage> {
    const res = await this.request.get(`https://${this.domain}/admin/dashboards.json`);
    return await res.json();
  }

  /**
   * Sign-up at Storefront by API
   * @param accSignUpStorefrontInfo has domain, mail, password info of buyer to sign-up
   */
  async signUpAPI(accSignUpStorefrontInfo: SignUpStorefrontInfo) {
    const res = await this.request.post(`https://${accSignUpStorefrontInfo.domain}/api/customer/next/create.json`, {
      data: { email: accSignUpStorefrontInfo.email, password: accSignUpStorefrontInfo.password },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Reset password at Storefront by API
   * @param accSignUpStorefrontInfo has domain, mail info of buyer to reset password
   */
  async resetPasswordAPI(accSignUpStorefrontInfo: SignUpStorefrontInfo) {
    const res = await this.request.post(
      `https://${accSignUpStorefrontInfo.domain}/api/customer/next/request-reset-password.json?digital_product=true`,
      {
        data: { email: accSignUpStorefrontInfo.email },
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * Get total message in tab
   * @param tabName tab's name of require action
   * @returns number of message in tab
   */
  async countRequireActionInTab(tabName: string): Promise<number> {
    const response = await this.request.get(
      `https://${this.domain}/admin/in-app-notification/notification-generated/count.json?tab_name=${tabName}`,
      {},
    );
    expect(response.status()).toBe(200);
    const resBody = await response.json();
    return resBody.total_notifications;
  }

  /**
   * get Inventory Variant Info By Ids
   * @param variantIds
   * @returns
   */
  async getInventoryVariantInfoByIds(variantIds: number): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/variants/bulk.json?ids=${variantIds}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    return data.variants[0].inventory_quantity;
  }
}
