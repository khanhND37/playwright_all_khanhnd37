import { ProductProduct } from "@services/odoo/product_product";
import { SaleOrder as OdooSaleOrder } from "@services/odoo/sale_order";
import { SaleOrderLine } from "@services/odoo/sale_order_line";
import type {
  FixtureOdoo,
  ProductInfo,
  StockPicking,
  TypeSearchReadOdoo,
  SaleOrder,
  Specification,
  OrderCapProduct,
  ProductTemplatePartner,
  TemplateAttribute,
  PlbProductVariant,
  DeliveryCarrier,
  ResCountry,
  ConfigCrawlShipping,
  PlbCatalogRequest,
  ShippingType,
  MailMessage,
  GetSmallestDeliveryCondition,
  DeliveryCarrierPriceRule,
  GetDeliveryCarriersCondition,
  GetDeliveryCarrierGroupsCondition,
  DeliveryCarrierGroup,
  GetProductTemplatesCondition,
  ProductTemplate,
  ShippingData,
  SentQuotationForPrivateProductReq,
  OdooSaleOrderUpdateReq,
  GetStockPickingsCondition,
  QuotationCancelReason,
  QuantityDoneDoIn,
  CategoryHandle,
  ProductPublicCategory,
  PurchaseUrl,
  CallActionResponse,
  ViewProductTmpl,
  ResponseShippingRates,
  IrConfigParameter,
  ShippingRateResponse,
  MoqProduct,
  PriceRules,
  AliCostAndPLBCost,
  VariantDispath,
  SOInfo,
  VariantInformation,
} from "@types";
import dayjs from "dayjs";
import { expect, APIRequestContext } from "@playwright/test";
import { updateShippingFee, buildQueryString } from "@core/utils/string";
import { waitTimeout } from "@core/utils/api";
import { BaseCostData, OdooProductProduct, OdooSaleOrderLine } from "@types";

export type defaultSaleOrderType = {
  validity_date?: string;
  x_minimum_order_quantity?: number;
  x_minimum_order_value?: number;
  x_estimated_delivery?: number;
  x_quote_based_on?: boolean;
  user_id?: number;
  order_line?: Array<Array<OdooSaleOrderLine>>;
  payment_term_id?: number;
  x_discount_time_from?: string;
  x_discount_time_to?: string;
  x_not_duplicate_price?: boolean;
};

export type defaultProductTemplateType = {
  x_warehouse_id?: number;
  x_delivery_carrier_type_ids?: Array<Array<string | number | boolean | Array<string | number | boolean>>>;
  x_weight?: number;
};

export type saleOrderLine = {
  id?: number;
  price_unit?: number;
  x_product_cost?: number;
  x_domestic_shipping?: number;
  salesman_id?: number;
  x_discount_amount?: number;
};

export interface OdooServiceInterface {
  defaultSaleOrder: defaultSaleOrderType;
  defaultProductTemplate: defaultProductTemplateType;
  defaultSaleOrderLine: Array<saleOrderLine>;

  checkProduct(id: number, isTest: boolean): Promise<boolean>;

  getProductsByCollection(collection: string, isTest: boolean): Promise<Array<ProductInfo>>;

  getProductsBaseCost(products: Array<ProductInfo>): Promise<void>;

  getProductsProfitMargin(products: Array<ProductInfo>): Promise<void>;

  sortProducts(products: Array<ProductInfo>, orderBy?: string): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAllProducts(isTest: boolean, args?: Array<Array<any>>): Promise<Array<ProductInfo>>;

  countPlbCatalogProduct(request: PlbCatalogRequest): Promise<number>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPickingID(orderNumber: string): any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countProducts(isTest: boolean, args?: Array<Array<any>>): Promise<number>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getVariantsProduct(productId: number): any;

  getStockPickingId(orderNumber: string, doType?: string, ownerId?: number, maxRetry?: number): Promise<number>;

  getStockPickingIds(orderNumber: string, doType?: string, ownerId?: number, maxRetry?: number): Promise<Array<number>>;

  getStockPickingState(stockPickingId: number, expectedState?: string, maxRetry?: number): Promise<string>;

  getStockPickingTrackingNumber(stockPickingId: number): Promise<string>;

  doneStockPicking(stockPickingId: number): Promise<void>;

  checkAvailabilityStockPicking(stockPickingId: number): Promise<void>;

  setUnavailableProduct(productID: number, dataUpdate: OrderCapProduct): Promise<boolean>;

  setUnavailableVariant(productVariantID: number, dataUpdate: OrderCapProduct): Promise<boolean>;

  setUnarchivedVariant(productVariantID: number): Promise<boolean>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancelQuotation(soId: number, reasonId?: number): any;

  setQuotationDraft(soId: number): Promise<void>;

  unlinkQuotation(soId: number): Promise<void>;

  deleteProductTemplatePartnerWithProductTmplId(productId: number, partnerId: number): Promise<void>;

  updateProductTemplateXUrl(productId: number, newUrl: string): Promise<void>;

  updateTrackingNumber(stockPickingId: number, tkn: string): Promise<void>;

  createSpecification(productId: number, specNames: Array<string>, specValues: Array<string>): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSpecification(productId: number, type: string): any;

  updateSpecification(productId: number, valueSpec: string): Promise<void>;

  deleteSpecification(productId: number): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createProductTemplate(name: string, deliveryCarrierId: number, attributes: Array<TemplateAttribute>): any;

  addProductAttributeLines(productId: number, attribute: TemplateAttribute): Promise<void>;

  getProductVariantIdsByProductId(productId: number, active: boolean, limit?: number): Promise<number[]>;

  removeAtrributeLine(productId: number, attributeLineId: number): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProductVariant(ids: Array<number>, productVariant: PlbProductVariant): any;
  getQuotationByProductId(productId: number, fields?: string[], partnerId?: number): Promise<Array<SaleOrder>>;
  getShippingRates(quotationId: number): Promise<ResponseShippingRates[]>;
  getTotalBaseCostOrder(productId: number, sbcnVariantIds: BaseCostData[], sbcnVariantId?: number): Promise<number>;

  sendQuotation(productId: number, shippingTypeId?: number, isProductAli?: boolean): Promise<void>;

  getCountriesNeedCrawl(id: number): Promise<ConfigCrawlShipping>;

  getCountriesSupportByShippingTypeId(ids: Array<number>): Promise<Array<ResCountry>>;

  resetProductTemplateToResyncShipping(id: number): Promise<void>;

  updateQuotationProcessingTime(quotationId: number, newEstimateDelivery: number): Promise<void>;

  setProductAvailability(productId: number, availability: boolean, reason: string): Promise<void>;

  addProductToFlashSale(productId: number, collectionId: number, startDate: string, duration: number): Promise<void>;

  updateFlashsale(odoo: FixtureOdoo, categoryId: number, startDate: dayjs.Dayjs, duration: number): Promise<void>;

  updateShippingTypeProductTemplate(productId: number, shippingTypes: Array<string>): Promise<Array<number>>;

  updateThenGetShippingDatas(
    productTemplateId: number,
    shippingTypesOdoo: Array<string>,
    countryCode: string,
  ): Promise<Map<string, ShippingData>>;

  getMailMessagebyText(model: string, id: number, text: string, opts?: { date: string }): Promise<Array<MailMessage>>;

  getSmallestDeliveryCarriersByConditions(cond: GetSmallestDeliveryCondition): Promise<{
    deliveryCarrier: DeliveryCarrier | null;
    shipping: [number, number];
    shippingTime: [number, number];
  }>;

  getDeliveryCarriersByConditions(cond: GetDeliveryCarriersCondition): Promise<Array<DeliveryCarrier> | []>;

  getDeliveryCarrierGroupsByConditions(
    cond: GetDeliveryCarrierGroupsCondition,
  ): Promise<Array<DeliveryCarrierGroup> | []>;

  getProductTemplatesByConditions(cond: GetProductTemplatesCondition): Promise<Array<ProductTemplate> | []>;
  getProductTemplatesById(id: number, fields?: Array<string>): Promise<ProductTemplate>;
  getWarehouseDoOut(stockPickingId: number): Promise<string>;

  sentQuotation(id: number, type?: string): Promise<boolean>;

  sentQuotationForPrivateProduct(odoo: FixtureOdoo, req: SentQuotationForPrivateProductReq): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProductTemplate(ids: Array<number>, productTemplate: any, igNoreProdTest?: boolean): Promise<boolean>;

  updateQuotationAndQuickSentQuotation(
    id: number,
    saleOrder: defaultSaleOrderType,
    isSentQuotation?: boolean,
    isNotifyToMerchant?: boolean,
    isAddAllVariant?: boolean,
    ignoreUpdateSaleOrder?: boolean,
  ): Promise<void>;

  notifyToMerchant(id: number): Promise<boolean>;

  actionCancelThenSentToQuotationByProductId(productId: number): Promise<boolean>;

  updateProductAndSentQuotationWithOptions(
    productId: number,
    productTemplate: defaultProductTemplateType,
    saleOrder: defaultSaleOrderType,
    saleOrderLine: saleOrderLine,
    isSentQuotation?: boolean,
    isNotifyToMerchant?: boolean,
    isAddAllVariant?: boolean,
    isUpdateProductTemplate?: boolean,
  ): Promise<boolean>;

  getStockPickingsByConditions(cond: GetStockPickingsCondition): Promise<Array<StockPicking>>;

  waitStockPickingCreated(cond: GetStockPickingsCondition): Promise<void>;

  getQuotationCancelReasonById(id: number, fields: string[]): Promise<QuotationCancelReason>;

  donePartialStockPicking(stockPickingId: number, quantityDone: number, trackingNumber: string): Promise<void>;

  updateQuotationAndQuickSentQuotationPlushub(
    id: number,
    productTemplateId: number,
    isSentQuotation: boolean,
    isNotifyToMerchant: boolean,
    isAddAllVariant: boolean,
    xQuoteBasedOn: boolean,
    priceUnit: number[],
  ): Promise<void>;

  getMoveLineId(stockPickingId: number): Promise<number[][]>;

  getQuantityDone(moveLineIds: number): Promise<Array<number>>;

  getAndSortProductCategoriesHavePriority(categoryId: number): Promise<Array<CategoryHandle>>;

  getVariantInforById(variantId: number): Promise<PlbProductVariant>;

  updateTknForDeliveryOrder(deliveryOrderId: number, trackingNumber: string): Promise<void>;

  deleteAllPurchaseUrlByProductId(productId: number): Promise<void>;

  callActionGenSku(productTmplId: number): Promise<CallActionResponse>;

  getVariantInforByIds(variantIds: number[], fields: string[]): Promise<Array<PlbProductVariant>>;

  deleteMailMessageByVariantIds(variantIds: number[]): Promise<void>;

  deleteAllMailMessageByProductId(productId: number): Promise<void>;

  deleteViewProductTmplRecordByValues(productId: number, replaceValues: string[]): Promise<void>;

  deleteViewProductTmplRecordByActionType(productId: number, actionType: string): Promise<void>;

  replaceProductAttributeValue(productTmplId: number, attributeId: number, replaceValue: string): Promise<void>;

  isTestProduct(productTmplId: number): Promise<boolean>;

  isTestVariants(variantIds: number[]): Promise<boolean>;

  importSourcingInfoCost(productId: number, fileName: string, fileBase64: string): Promise<void>;

  syncToQuotation(id: number): Promise<CallActionResponse>;
  getProductVariantsByProductTemplateId(
    productTemplateId: number,
    fields?: Array<string>,
    limit?: number,
  ): Promise<Array<OdooProductProduct>>;
  getSaleOrderLineBySaleOrderId(saleOrderId: number): Promise<Array<OdooSaleOrderLine>>;

  getIrConfigParameterByKey(key: string, fields: string[]): Promise<IrConfigParameter>;

  getRmbRate(): Promise<number>;

  getProductShippingRate(
    request: APIRequestContext,
    api: string,
    productId: number,
    shopId: number,
    countryId: number,
  ): Promise<ShippingRateResponse>;

  createProductCatalogPlusBase(
    name: string,
    deliveryCarrierId: number,
    attributes: Array<TemplateAttribute>,
    dataProductVariant: Array<PlbProductVariant>,
    argsUpdateQuotation: OdooSaleOrderUpdateReq,
    priceVariant: number[],
  );

  getDataMoqProduct(productId: number): Promise<Array<MoqProduct>>;
  getPriceRuleDatas(ids: Array<number>): Promise<Array<PriceRules>>;
  getShippingDatas(
    productTemplateId: number,
    countryCode: string,
    productProductId?: number,
  ): Promise<Map<string, ShippingData>>;

  isPublishProduct(productTmplId: number): Promise<boolean>;
  sortDataMoqWithKey(productId: number): Promise<Map<string | number, Array<Record<string, number>>>>;

  updateQuotation(id: number, saleOrder: SaleOrder): Promise<SaleOrder>;

  sendQuotationWithAliEXpress(
    productId: number,
    quotationId: number,
    shippingTypesOdoo: Array<string>,
    reasonID: number,
  );
  getDataAllprice(shippingRateId: number): Promise<AliCostAndPLBCost>;
  getShippingFeeVariantDispatch(
    productTplId: number,
    productProductId: number,
    countryCode: string,
    aliExpressId: number,
  ): Promise<Map<string, ShippingData>>;

  getSOInfo(productTempID: number, partnerId?: number): Promise<SOInfo>;
}

export function OdooService(odoo: FixtureOdoo): OdooServiceInterface {
  return {
    defaultSaleOrder: {
      validity_date: "2030-11-11",
      x_minimum_order_quantity: 1,
      x_minimum_order_value: 2,
      x_estimated_delivery: 10,
      x_quote_based_on: true,
      payment_term_id: 1,
    },

    defaultProductTemplate: {
      x_warehouse_id: 1000003,
      x_delivery_carrier_type_ids: [[6, false, [10]]],
      x_weight: 1.2,
    },

    defaultSaleOrderLine: [{ price_unit: 20 }],

    /**
     * Check the product is allowed to display on dashboard or not
     * @param id
     * @param isTest
     */
    async checkProduct(id: number, isTest: boolean): Promise<boolean> {
      const args = [
        ["id", "=", id],
        ["x_is_plus_base", "=", true],
        ["x_is_custom_request", "=", false],
        ["x_is_testing_product", "=", isTest],
        ["x_is_plusbase_published", "=", true],
      ];

      return Boolean(await odoo.count("product.template", args));
    },

    /**
     * Is test product ?
     * @param productTmplId is product tmpl id
     * @returns boolean
     */
    async isTestProduct(productId: number): Promise<boolean> {
      if (productId <= 0) {
        throw new Error("invalid product id");
      }
      const products: Array<ProductTemplate> = await odoo.read(
        "product.template",
        [productId],
        ["x_is_testing_product"],
      );
      if (products.length != 1) {
        throw new Error("empty result");
      }
      return Boolean(products[0].x_is_testing_product);
    },

    /**
     * Check variants if of product test
     * @param variantIds is variant id
     * @returns boolean
     */
    async isTestVariants(variantIds: number[]): Promise<boolean> {
      if (variantIds.length === 0) {
        throw new Error("invalid variant ids");
      }

      const variants = await this.getVariantInforByIds(variantIds, ["product_tmpl_id"]);
      if (variants.length != variantIds.length) {
        throw new Error("result length not equal request length");
      }

      const variantMap = new Map<number, boolean>();
      variants.forEach((variant: PlbProductVariant) => {
        variantMap.set(Number(variant.product_tmpl_id[0]), true);
      });

      for (const productId of variantMap.keys()) {
        if (!(await this.isTestProduct(productId))) {
          return false;
        }
      }
      return true;
    },

    /**
     * Get manual products in collection allowed to display on dashboard
     * @param collection
     * @param isTest
     */
    async getProductsByCollection(collection: string, isTest: boolean): Promise<Array<ProductInfo>> {
      const productsRight: Array<ProductInfo> = [];

      // Get products info
      const productIds: Array<{ x_product_public_category_handles: Array<number>; product_tmpl_ids: Array<number> }> =
        await odoo.searchRead({
          model: "product.public.category",
          args: [["name", "=", collection]],
          fields: ["x_product_public_category_handles", "product_tmpl_ids"],
          limit: 1,
        });

      const priorityProducts: Array<{ id: number; priority: number; product_template_id: Array<number | string> }> =
        await odoo.read("product.public.category.handle", productIds[0].x_product_public_category_handles, [
          "priority",
          "product_template_id",
        ]);

      const products: Array<ProductInfo> = await odoo.read("product.template", productIds[0].product_tmpl_ids, [
        "name",
        "x_publish_date",
        "qty_available",
        "x_set_unavailable",
      ]);

      // Check products is allowed to display on dashboard or not
      for (const product of products) {
        const isCheck = await this.checkProduct(product.id, isTest);

        if (isCheck) {
          let priority = 0;
          for (const item of priorityProducts) {
            if (product.id === item.product_template_id[0]) {
              priority = item.priority;
            }
          }

          productsRight.push({
            priority: priority,
            id: product.id,
            name: product.name,
            x_publish_date: product.x_publish_date,
            x_set_unavailable: product.x_set_unavailable,
          });
        }
      }

      return productsRight;
    },

    /**
     * Get minimum base cost of product variant
     * @param products
     */
    async getProductsBaseCost(products: Array<ProductInfo>) {
      for (const product of products) {
        const variants: Array<{ x_plusbase_base_cost: number }> = await odoo.searchRead({
          model: "product.product",
          args: [["name", "=", product.name]],
          fields: ["x_plusbase_base_cost", "x_plusbase_profit_margin"],
        });

        const variant = variants.reduce((a, b) => (a.x_plusbase_base_cost < b.x_plusbase_base_cost ? a : b));
        product.x_plusbase_base_cost = variant.x_plusbase_base_cost;
      }
    },

    /**
     * Get minimum profit of product variant
     * @param products
     */
    async getProductsProfitMargin(products: Array<ProductInfo>) {
      for (const product of products) {
        const variants: Array<{ x_plusbase_profit_margin: number }> = await odoo.searchRead({
          model: "product.product",
          args: [["product_tmpl_id", "=", product.name]],
          fields: ["x_plusbase_base_cost", "x_plusbase_profit_margin"],
        });

        const variant = variants.reduce((a, b) => (a.x_plusbase_profit_margin < b.x_plusbase_profit_margin ? a : b));
        product.x_plusbase_profit_margin = variant.x_plusbase_profit_margin;
      }
    },

    /**
     * Sort products by condition
     * @param products
     * @param orderBy
     */
    async sortProducts(products: Array<ProductInfo>, orderBy?: string): Promise<void> {
      switch (orderBy) {
        case "Profit margin: high to low":
          products.sort(
            (a, b) =>
              Number(a.x_set_unavailable) - Number(b.x_set_unavailable) ||
              b.x_plusbase_profit_margin - a.x_plusbase_profit_margin,
          );
          break;
        case "Profit margin: low to high":
          products.sort(
            (a, b) =>
              Number(a.x_set_unavailable) - Number(b.x_set_unavailable) ||
              a.x_plusbase_profit_margin - b.x_plusbase_profit_margin,
          );
          break;
        case "Product cost: high to low":
          products.sort(
            (a, b) =>
              Number(a.x_set_unavailable) - Number(b.x_set_unavailable) ||
              a.x_plusbase_base_cost - b.x_plusbase_base_cost,
          );
          break;
        case "Product cost: low to high":
          products.sort(
            (a, b) =>
              Number(a.x_set_unavailable) - Number(b.x_set_unavailable) ||
              a.x_plusbase_base_cost - b.x_plusbase_base_cost,
          );
          break;
        default:
          products.sort(
            (a, b) =>
              Number(a.x_set_unavailable) - Number(b.x_set_unavailable) ||
              b.priority - a.priority ||
              b.x_publish_date.toString().localeCompare(a.x_publish_date) ||
              b.id - a.id,
          );
      }
    },

    /**
     * Get all products allowed to display on dashboard and match with conditions (if any)
     * @param isTest
     * @param args
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getAllProducts(isTest: boolean, args?: Array<Array<any>>): Promise<Array<ProductInfo>> {
      let params = [
        ["x_is_testing_product", "=", isTest],
        ["x_is_custom_request", "=", false],
        ["x_is_plus_base", "=", true],
        ["x_is_plusbase_published", "=", true],
      ];
      if (args) {
        params = params.concat(args);
      }

      return await odoo.searchRead({
        model: "product.template",
        args: params,
        fields: ["name", "x_publish_date", "x_set_unavailable"],
      });
    },

    /**
     * Count plb catalog product by conditions
     * @param request is request object (isTestProduct, isRealProduct, ...)
     * @returns number
     */
    async countPlbCatalogProduct(request: PlbCatalogRequest): Promise<number> {
      const args: Array<Array<string | number | boolean>> = [
        ["x_is_custom_request", "=", false],
        ["x_is_plus_base", "=", true],
        ["x_is_plusbase_published", "=", true],
      ];

      if (request.isTestProduct) {
        args.push(["x_is_testing_product", "=", true]);
      } else if (request.isRealProduct) {
        args.push(["x_is_testing_product", "=", false]);
      }

      if (request.args) {
        for (const arg of request.args) {
          args.push(arg);
        }
      }

      return await odoo.count("product.template", args);
    },

    /**
     * Get Picking ID of DO-OUT
     * @param orderNumber
     */
    async getPickingID(orderNumber: string) {
      type StockPicking = {
        id: string;
      };
      const result: Array<StockPicking> = await odoo.searchRead<StockPicking>({
        model: "stock.picking",
        args: [["origin", "ilike", orderNumber]],
        fields: ["id"],
        limit: 2,
      });
      const stockPickingIds = result.map(e => e.id);
      return stockPickingIds;
    },

    /**

     * Count number of products allowed to display on dashboard and match with conditions (if any)
     * @param isTest
     * @param args
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async countProducts(isTest: boolean, args?: Array<Array<any>>): Promise<number> {
      let params = [
        ["x_is_testing_product", "=", isTest],
        ["x_is_custom_request", "=", false],
        ["x_is_plus_base", "=", true],
        ["x_is_plusbase_published", "=", true],
      ];
      if (args) {
        params = params.concat(args);
      }

      return await odoo.count("product.template", params);
    },

    /**
     * @param productId
     * @returns all variant of product in odoo
     */
    async getVariantsProduct(productId: number) {
      /**
       * get attributeLineIds
       * return array unknown
       */
      let args: Array<Array<string | number | boolean | Array<string | number>>>;
      args = [["id", "=", productId]];
      let data: TypeSearchReadOdoo = {
        model: "product.template",
        args: args,
        fields: ["attribute_line_ids"],
      };
      let result = await odoo.searchRead(data);

      /**
       //  * convert array unknown to array number
       //  */
      const attributeLineIds: number[] = [];
      if (result.length > 0 && result[0]["attribute_line_ids"]) {
        result[0]["attribute_line_ids"].forEach(item => {
          if (typeof item === "number") {
            attributeLineIds.push(item as number);
          }
        });
      }
      /**
       * get value ids
       */
      if (attributeLineIds.length > 0) {
        args = [["id", "in", attributeLineIds]];
        data = {
          model: "product.template.attribute.line",
          args: args,
          fields: ["attribute_id", "value_ids"],
        };
        result = await odoo.searchRead(data);
      }

      /**
       * get display name for earch attribute
       */
      const displayNames: Array<Array<string | number>> = [];
      let resultName: unknown[];
      for (let i = 0; i < result.length; i++) {
        const valueIds: number[] = [];
        if (result[i]["value_ids"]) {
          result[i]["value_ids"].forEach(item => {
            if (typeof item === "number") {
              valueIds.push(item as number);
            }
          });
        }

        args = [["id", "in", valueIds]];
        data = {
          model: "product.attribute.value",
          args: args,
          fields: ["display_name"],
        };

        const names: string[] = [];
        resultName = await odoo.searchRead(data);
        resultName.forEach(item => {
          if (item["display_name"]) {
            let nameAttribute = item["display_name"] as string;
            if (nameAttribute.includes(":")) {
              nameAttribute = nameAttribute.split(":")[1].trim();
            }

            names.push(nameAttribute);
          }
        });

        displayNames.push(names);
      }
      let variantList = [];
      for (let i = 0; i < displayNames.length; i++) {
        if (i === 0) {
          variantList = displayNames[i];
          continue;
        }

        const tempVariantList = [];
        for (let y = 0; y < displayNames[i].length; y++) {
          variantList.forEach(item => {
            tempVariantList.push(`${item}/${displayNames[i][y]}`);
          });
        }
        variantList = tempVariantList;
      }

      return variantList;
    },

    /*
     * Get Picking ID of DO
     * @param orderNumber / purchaseOrder
     *
     */
    async getStockPickingId(
      orderNumber: string,
      doType?: string,
      ownerId?: number,
      maxRetry?: number,
    ): Promise<number> {
      const args: Array<Array<string | number>> = [["origin", "ilike", orderNumber]];
      switch (doType) {
        case "in":
          args.push(["name", "ilike", "WH/IN"]);
          break;
        case "out":
          args.push(["name", "ilike", "WH/OUT"]);
          break;
      }
      if (ownerId) {
        args.push(["owner_id", "=", ownerId]);
      }

      if (!maxRetry) {
        maxRetry = 1;
      }

      for (let i = 0; i < maxRetry; i++) {
        const result: Array<StockPicking> = await odoo.searchRead<StockPicking>({
          model: "stock.picking",
          args,
          fields: ["id", "state"],
          order: "id DESC",
          limit: 1,
        });

        const resultArr = result.map(e => e.id);
        if (resultArr.length !== 0) {
          return resultArr[0];
        } else {
          if (i + 1 == maxRetry) {
            return Promise.reject(`Cannot find Stock picking with Order number/Purchase order ${orderNumber}`);
          }
        }

        await waitTimeout(1000);
      }
    },

    /*
     * Get Picking ID of DO
     * @param orderNumber / purchaseOrder
     *
     */
    async getStockPickingIds(
      orderNumber: string,
      doType?: string,
      ownerId?: number,
      maxRetry?: number,
    ): Promise<Array<number>> {
      const args: Array<Array<string | number>> = [["origin", "ilike", orderNumber]];
      switch (doType) {
        case "in":
          args.push(["name", "ilike", "WH/IN"]);
          break;
        case "out":
          args.push(["name", "ilike", "WH/OUT"]);
          break;
      }
      if (ownerId) {
        args.push(["owner_id", "=", ownerId]);
      }

      if (!maxRetry) {
        maxRetry = 1;
      }

      for (let i = 0; i < maxRetry; i++) {
        const result: Array<StockPicking> = await odoo.searchRead<StockPicking>({
          model: "stock.picking",
          args,
          fields: ["id", "state"],
          order: "id DESC",
        });

        const resultArr = result.map(e => e.id);
        if (resultArr.length !== 0) {
          return resultArr;
        } else {
          if (i + 1 == maxRetry) {
            return Promise.reject(`Cannot find Stock picking with Order number/Purchase order ${orderNumber}`);
          }
        }

        await waitTimeout(1000);
      }
    },

    /*
     * Get state of DO
     * @param stockPickingId
     */
    async getStockPickingState(stockPickingId: number, expectedState?: string, maxRetry?: number): Promise<string> {
      if (!maxRetry) {
        maxRetry = 1;
      }
      for (let i = 0; i < maxRetry; i++) {
        const result: Array<StockPicking> = await odoo.read<StockPicking>("stock.picking", [stockPickingId], ["state"]);
        const resultArr = result.map(e => e.state);
        if (resultArr.length !== 0) {
          if (expectedState && resultArr[0] !== expectedState) {
            await waitTimeout(1000);
            continue;
          }
          return resultArr[0];
        } else {
          return Promise.reject(`Cannot get state of Stock picking ID ${stockPickingId}`);
        }
      }
    },

    /*
     * Get tracking number of DO
     * @param stockPickingId
     */
    async getStockPickingTrackingNumber(stockPickingId: number): Promise<string> {
      const result: Array<StockPicking> = await odoo.read<StockPicking>(
        "stock.picking",
        [stockPickingId],
        ["x_tracking_number"],
      );
      const resultArr = result.map(e => e.x_tracking_number);

      if (resultArr.length !== 0) {
        return resultArr[0];
      } else {
        return Promise.reject(`Cannot get tracking number of Stock picking ID ${stockPickingId}`);
      }
    },

    /*
     * Done Stock Pinking
     * @param stockPickingId
     */
    async doneStockPicking(stockPickingId: number) {
      await odoo.actionQuickDone({
        model: "stock.picking",
        args: [stockPickingId],
      });
    },

    /*
     * Check Availability Stock Picking
     * @param stockPickingId
     */
    async checkAvailabilityStockPicking(stockPickingId: number) {
      await odoo.actionCheckAvailability({
        model: "stock.picking",
        args: [stockPickingId],
      });
    },

    /**
     * set out stock for product by api
     * @param productID that's product's id at odoo
     * @param dataUpdate that are data update for product
     */
    async setUnavailableProduct(productID: number, dataUpdate: OrderCapProduct): Promise<boolean> {
      const args = [["id", "=", productID]];
      const totalRecord = await odoo.count("product.template", args);
      if (totalRecord) {
        return odoo.update("product.template", productID, dataUpdate);
      } else {
        return Promise.reject("Not found product ID");
      }
    },

    /**
     * set out stock for product's variant by api
     * @param productVariantID that's variant's id at odoo
     * @param dataUpdate that are data update for product
     */
    async setUnavailableVariant(productVariantID: number, dataUpdate: OrderCapProduct): Promise<boolean> {
      return odoo.update("product.product", productVariantID, dataUpdate);
    },

    /**
     * unarchived for product's variant by api
     * @param productVariantID that's variant's id at odoo
     * @param dataUpdate that are data update for product
     */
    async setUnarchivedVariant(productVariantID: number): Promise<boolean> {
      const variantArr: Array<number> = [];
      variantArr.push(productVariantID);
      const dataUpdate = {
        x_set_unavailable: false,
        active: true,
      };
      if (await this.isTestVariants(variantArr)) {
        return odoo.update("product.product", productVariantID, dataUpdate);
      } else {
        throw new Error("Func only for test variant");
      }
    },

    /*
     * Cancel quotation (set cancel reason inluding)
     * @param soId Sale order id
     * @param reasonId reason id in quotation_cancel_reason table
     */

    async cancelQuotation(soId: number, reasonId?: number) {
      const quotations: Array<SaleOrder> = await odoo.read<SaleOrder>("sale.order", [soId], ["x_cancel_reason_id"]);

      if (!quotations.length) {
        return Promise.reject(`Cannot get sale order ${soId}`);
      }

      if (!quotations[0].x_cancel_reason_id) {
        if (!reasonId) {
          return Promise.reject(`Invalid reason`);
        }
        await odoo.update("sale.order", soId, { x_cancel_reason_id: reasonId });
      }

      await odoo.callAction({
        model: "sale.order",
        args: [soId],
        action: "action_cancel",
      });
    },

    /**
     * Set to Quotation
     * @param soId quotation Id
     */
    async setQuotationDraft(soId: number) {
      await odoo.callAction({
        model: "sale.order",
        args: [soId],
        action: "action_draft",
      });
    },

    async unlinkQuotation(soId: number) {
      // TODO also need unlink product_template_partner to not show on list request, currently not
      await odoo.callAction({
        model: "sale.order",
        args: [soId],
        action: "unlink",
      });
    },

    /**
     * delete product template partner
     * @param productId is product template id
     */
    async deleteProductTemplatePartnerWithProductTmplId(productId: number, partnerId: number) {
      const result: Array<ProductTemplatePartner> = await odoo.searchRead<ProductTemplatePartner>({
        model: "product.template.partner",
        args: [
          ["product_tmpl_id", "=", productId],
          ["partner_id", "=", partnerId],
        ],
        fields: ["id"],
      });

      const ids = result.map(e => e.id);
      if (ids.length > 0) {
        await odoo.delete("product.template.partner", ids);
      }
    },

    /**
     * update product template x_url
     * @param productId is product template id
     */
    async updateProductTemplateXUrl(productId: number, newUrl: string) {
      await odoo.update("product.template", productId, {
        x_url: newUrl,
      });
    },

    /**
     * update stock picking tkn
     * @param stockPickingId is stock picking id
     */
    async updateTrackingNumber(stockPickingId: number, tkn: string) {
      await odoo.update("stock.picking", stockPickingId, {
        x_tracking_number: tkn,
      });
    },

    /**
     * create specification
     * @param productId
     * @param specNames
     * @param specValues
     */
    async createSpecification(productId: number, specNames: Array<string>, specValues: Array<string>) {
      //search specìication id by name
      const specArray: Array<Specification> = [];

      for (let i = 0; i < specNames.length; i++) {
        const specifications: Array<Specification> = await odoo.searchRead({
          model: "product.template.specification",
          args: [["name", "=", specNames[i]]],
          fields: ["id", "name"],
        });
        specArray.push(specifications[0]);
      }

      const payload = {
        x_template_specification_id: specArray.map((s, index) => [
          0,
          `virtual_${index}`,
          { specification_id: s.id, value: specValues[index] },
        ]),
      };

      await odoo.update("product.template", productId, payload);
    },

    /**
     * get specification data
     * @param productId
     * @param type
     * @returns specIds | listSpecName | listSpecValue
     */
    async getSpecification(productId: number, type: string) {
      // get specification ids
      const listSpecId: Array<string> = await odoo.searchRead({
        model: "product.template",
        args: [["id", "=", productId]],
        fields: ["x_template_specification_id"],
      });

      const specIds: number[] = [];
      listSpecId[0]["x_template_specification_id"].forEach(item => {
        specIds.push(item as number);
      });

      if (type.toLocaleLowerCase() === "id") {
        return specIds;
      }

      // get specification data
      const specification = await odoo.searchRead({
        model: "product.template.specification_value",
        args: [["id", "in", specIds]],
        fields: ["specification_id", "value"],
      });

      const listSpecName: string[] = [];
      const listSpecValue: string[] = [];
      specification.forEach(item => {
        listSpecName.push(item["specification_id"][1]);
        listSpecValue.push(item["value"]);
      });

      if (type.toLocaleLowerCase() === "name") {
        return listSpecName;
      }
      if (type.toLocaleLowerCase() === "value") {
        return listSpecValue;
      }
    },

    /**
     * update specification first row in odoo
     * @param productId
     * @param valueSpec
     */
    async updateSpecification(productId: number, valueSpec: string) {
      const spectIds = await this.getSpecification(productId, "id");

      await odoo.update("product.template.specification_value", spectIds[0], {
        value: valueSpec,
      });
    },

    /**
     * delete all specification
     * @param productId
     */
    async deleteSpecification(productId: number) {
      const spectIds = await this.getSpecification(productId, "id");
      if (spectIds.length > 0) {
        await odoo.delete("product.template.specification_value", [spectIds]);
      }
    },

    /**
     * create product template
     * @param name Name of product
     * @param delivery_carrier_id shipping id
     * @param attributes (optional) attribute lines id and value numbers
     */
    async createProductTemplate(name: string, deliveryCarrierId: number, attributes: Array<TemplateAttribute>) {
      const args = {
        name: name,
        x_is_plus_base: true,
        x_is_plusbase_published: true,
        active: true,
        x_is_testing_product: true,
        x_category_code: "TEST",
        type: "product",
        x_delivery_carrier_type_ids: [[6, false, [deliveryCarrierId]]],
        x_warehouse_id: 1000002,
        attribute_line_ids: [],
      };
      if (attributes.length > 0) {
        for (let i = 0; i < attributes.length; i++) {
          const searchArgs = [["attribute_id", "=", attributes[i].id]];
          const resultsAttrVal = await odoo.searchRead({
            model: "product.attribute.value",
            args: searchArgs,
            fields: ["id"],
            order: "id ASC",
            limit: attributes[i].number_of_values,
          });
          const vals = [];
          resultsAttrVal.forEach(val => {
            vals.push(val["id"]);
          });
          args.attribute_line_ids.push([0, null, { attribute_id: attributes[i].id, value_ids: [[6, null, vals]] }]);
        }
      } else {
        args.attribute_line_ids = undefined;
      }
      return await odoo.create("product.template", [args]);
    },

    /**
     * add product attribute line for product template, may result in addtional product variant(s)
     * @param productId
     * @param attribute
     */
    async addProductAttributeLines(productId: number, attribute: TemplateAttribute) {
      const resultsAttrVal = await odoo.searchRead({
        model: "product.attribute.value",
        args: [["attribute_id", "=", attribute.id]],
        fields: ["id"],
        order: "id ASC",
        limit: attribute.number_of_values,
      });
      const vals = [];
      resultsAttrVal.forEach(val => {
        vals.push(val["id"]);
      });
      const args = {
        attribute_line_ids: [[0, null, { attribute_id: attribute.id, value_ids: [[6, null, vals]] }]],
      };
      await odoo.update("product.template", productId, args);
    },

    /**
     * get product variant ids by product Id
     * @param productId product template id
     * @param active only product active?
     * @param limit query limit
     * @returns list ids
     */
    async getProductVariantIdsByProductId(productId: number, active: boolean, limit?: number): Promise<number[]> {
      return await odoo.search({
        model: "product.product",
        args: [
          ["product_tmpl_id", "=", productId],
          ["active", "=", active],
        ],
        order: "id DESC",
        limit: limit ? limit : undefined,
      });
    },

    /**
     * remove attribute line of product template. May result in remove some product variants
     * @param productId product template id
     * @param attributeLineId only product active?
     */
    async removeAtrributeLine(productId: number, attributeLineId: number) {
      const searchArgs = [
        ["product_tmpl_id", "=", productId],
        ["attribute_id", "=", attributeLineId],
      ];
      const results = await odoo.search({
        model: "product.template.attribute.line",
        args: searchArgs,
        limit: 1,
      });
      if (results.length <= 0) {
        throw new Error("product attribute line not found");
      }
      await odoo.update("product.template", productId, { attribute_line_ids: [[2, results[0], null]] });
    },

    /**
     * Update product variant(s)
     * @param ids product variant id list
     * @param productVariant fields/values to be updated
     */
    async updateProductVariant(ids: Array<number>, productVariant: PlbProductVariant) {
      if (ids.length === 0) {
        throw new Error("empty id list");
      }
      if (!(await this.isTestVariants(ids))) {
        throw new Error("Can not update live product");
      }
      if (ids.length === 1) {
        return await odoo.update("product.product", ids[0], productVariant);
      } else {
        return await odoo.updateMulti("product.product", ids, productVariant);
      }
    },

    /**
     * get quotation by product template id
     * @param productId product template id
     * @param fields  fields need to be extracted from model sale.order
     * @returns List quotations
     */
    async getQuotationByProductId(productId: number, fields?: string[], partnerId?: number): Promise<Array<SaleOrder>> {
      const args = [
        ["x_quoted_product_tmpl_id", "=", productId],
        ["x_is_test", "=", true],
        ["state", "!=", "cancel"],
      ];
      if (partnerId) {
        args.push(["partner_id", "=", partnerId]);
      }
      const quotationId = await odoo.search({
        model: "sale.order",
        args,
        limit: 1,
      });
      // fields is optional
      if (!fields) {
        return await odoo.read("sale.order", quotationId);
      }
      return await odoo.read("sale.order", quotationId, fields);
    },

    async getShippingRates<T>(quotationId: number): Promise<T[]> {
      const rateId = await odoo.search({
        model: "product.shipping.rates",
        args: [["quotation_id", "=", quotationId]],
      });
      return await odoo.read("product.shipping.rates", rateId);
    },

    /**
     * Send quotation for test product template Plusbase. Currently not support following cases
     *   - Quotation with multiple product
     *   - Quotation with product having attribute_line associated with size chart.
     *
     * Step 1: Update product template
     * Step 2: Update weight on all product variants
     * Step 3: Update quotation data
     * Step 4: Create mail_compose_message, update sale.model state
     * @param quotationId
     * @param productId
     */
    async sendQuotation(productId: number, shippingTypeId = 2, isProductAli?: boolean) {
      // Step 1
      await odoo.update("product.template", productId, {
        x_delivery_carrier_type_ids: [[6, false, [shippingTypeId]]],
        x_warehouse_id: 1000002,
      });

      // Step 2
      const variantIds = await odoo.searchRead({
        model: "product.product",
        args: [["product_tmpl_id", "=", productId]],
        fields: ["id"],
      });
      if (variantIds.length > 0) {
        const ids = [];
        variantIds.forEach(prd => {
          ids.push(prd["id"]);
        });
        await odoo.updateMulti("product.product", ids, { x_variant_weight: 1 });
      }

      // Step 3
      const quotationId = await odoo.search({
        model: "sale.order",
        args: [["x_quoted_product_tmpl_id", "=", productId]],
        limit: 1,
      });
      const quotation = await odoo.read("sale.order", quotationId, ["id", "partner_id"]);

      if (quotation.length <= 0) {
        throw new Error("quotation not found");
      }
      const argsUpdateQuotation = {
        validity_date: "2042-11-05",
        payment_term_id: 2,
        x_estimated_delivery: 1,
        x_minimum_order_quantity: 1,
        x_minimum_order_value: 1,
        // x_quotation_description: "similar_product",
      };
      await odoo.update("sale.order", quotation[0]["id"], argsUpdateQuotation);
      await odoo.callAction({
        args: [quotationId[0]],
        model: "sale.order",
        action: "add_all_variant",
      });
      // Step 4
      await odoo.callAction({
        model: "sale.order",
        args: [quotation[0]["id"]],
        action: "action_quick_send_quotation",
      });
      if (!isProductAli) {
        await odoo.callAction({
          model: "sale.order",
          args: [quotation[0]["id"]],
          action: "action_notify_to_merchant",
        });
      }

      const argsCreateMessage = {
        composition_mode: "comment",
        model: "sale.order",
        res_id: quotation[0]["id"],
        email_from: '"Administrator" <admin@example.com>',
        partner_ids: [[6, false, [quotation[0]["partner_id"][0]]]],
        subject: "My Company Quotation (Test)",
        body: "Test body",
      };
      const msgComposeId = await odoo.create("mail.compose.message", [argsCreateMessage]);
      await odoo.callAction({ args: [msgComposeId], model: "mail.compose.message", action: "action_send_mail" });
      await odoo.update("sale.order", quotation[0]["id"], { state: "sent" });
    },

    /**
     * Get config about countries need crawl
     * @param id is id of delivery carrier config
     */
    async getCountriesNeedCrawl(id: number): Promise<ConfigCrawlShipping> {
      const deliveryCarriers: Array<DeliveryCarrier> = await odoo.searchRead({
        model: "delivery.carrier",
        args: [["id", "=", id]],
        fields: ["id", "name", "x_display_name_checkout", "country_ids"],
      });
      if (deliveryCarriers.length !== 1) {
        throw new Error("Empty result or large than 1");
      }

      const deliveryCarrier = deliveryCarriers[0];
      if (deliveryCarrier.country_ids.length === 0) {
        throw new Error("Empty country ids");
      }

      const countries: Array<ResCountry> = await odoo.searchRead({
        model: "res.country",
        args: [["id", "in", deliveryCarrier.country_ids]],
        fields: ["id", "name", "code"],
      });
      if (countries.length === 0) {
        throw new Error("Empty result");
      }

      return {
        deliveryCarrier,
        countries,
      };
    },

    /**
     * Get countries support by shipping type id
     * @param id is id of shipping type
     */
    async getCountriesSupportByShippingTypeId(ids: Array<number>): Promise<Array<ResCountry>> {
      const deliveryCarriers: Array<DeliveryCarrier> = await odoo.searchRead({
        model: "delivery.carrier",
        args: [["x_delivery_carrier_type_id", "in", ids]],
        fields: ["id", "country_ids"],
      });
      if (deliveryCarriers.length === 0) {
        return [];
      }

      const countryIds = new Array<number>();
      for (const deliveryCarrier of deliveryCarriers) {
        countryIds.push(...deliveryCarrier.country_ids);
      }
      if (countryIds.length === 0) {
        return [];
      }

      const countries: Array<ResCountry> = await odoo.searchRead({
        model: "res.country",
        args: [["id", "in", countryIds]],
        fields: ["id", "name", "code"],
      });
      if (countries.length === 0) {
        throw [];
      }

      return countries;
    },

    /**
     * reset product template shipping data to resync when request
     * @param id is id of product template
     */
    async resetProductTemplateToResyncShipping(id: number) {
      if (id > 0) {
        await odoo.update("product.template", id, {
          x_platform_shipping_fee: "",
          x_not_support_ship: "",
        });
      }
      return;
    },

    /**
     * Update quotation estimated delivery time
     * @param quotationId Quotation Id
     * @param newEstimateDelivery new destimated delivery
     */
    async updateQuotationProcessingTime(quotationId: number, newEstimateDelivery: number) {
      await odoo.update("sale.order", quotationId, { x_estimated_delivery: newEstimateDelivery });
    },

    /**
     * Set product available/unavailable
     * @param productId Product template id
     * @param availability Availability of product
     * @param reason Reason set unavailable, use to trigger odoo auto-exclusive logic
     */
    async setProductAvailability(productId: number, availability: boolean, reason: string) {
      await odoo.update("product.template", productId, {
        x_set_unavailable: !availability,
        x_reason_set_unavailable: reason,
      });
    },

    /**
     * Enable flash sale for product template
     * @param productId product template id
     * @param collectionId flash sale collection id
     * @param startDate start date of flash sale
     * @param duration duration of flash sale
     */
    async addProductToFlashSale(productId: number, collectionId: number, startDate: string, duration: number) {
      await odoo.update("product.public.category", collectionId, { x_is_flash_sale: false });
      const res = await odoo.read("product.public.category", [collectionId], ["product_tmpl_ids"]);
      const productIds = res[0]["product_tmpl_ids"];
      productIds.push(productId);
      const args = {
        x_is_flash_sale: true,
        x_start_flash_sale: startDate,
        x_duration_flash_sale: duration,
        product_tmpl_ids: [[6, false, productIds]],
      };
      await odoo.update("product.public.category", collectionId, args);
    },

    async updateFlashsale(odoo: FixtureOdoo, categoryId: number, startDate: dayjs.Dayjs, duration: number) {
      // Turn off flash sale then turn on again to pass odoo validation
      // (check only 1 flash sale is active in the same time)
      await odoo.update("product.public.category", categoryId, {
        x_is_flash_sale: false,
      });
      await odoo.update("product.public.category", categoryId, {
        x_is_flash_sale: true,
        x_duration_flash_sale: duration,
        x_start_flash_sale: startDate.format("YYYY-MM-DD HH:mm:ss"), //2022-10-27 07:02:17
        x_is_testing: true,
      });
    },

    /**
     * Update shipping type of product template
     * @param productId product template id
     * @param shippingTypes shipping types of product
     */
    async updateShippingTypeProductTemplate(productId: number, shippingTypes: Array<string>): Promise<Array<number>> {
      const shippingTypeIds = new Array<number>();

      // Check product is test product
      const productTemplates: Array<ProductTemplate> = await odoo.read(
        "product.template",
        [productId],
        ["x_is_testing_product"],
      );
      expect(productTemplates.length).toEqual(1);
      expect(productTemplates[0].x_is_testing_product).toBeTruthy();
      const shippingTypeResult: Array<ShippingType> = await odoo.searchRead({
        model: "delivery.carrier.type",
        args: [["name", "in", shippingTypes]],
        fields: ["id", "name"],
      });
      for (const shippingType of shippingTypeResult) {
        shippingTypeIds.push(shippingType.id);
      }
      if (shippingTypeIds.length === 0) {
        return;
      }
      await odoo.update("product.template", productId, {
        x_delivery_carrier_type_ids: [[6, false, shippingTypeIds]],
      });
      return shippingTypeIds;
    },

    /**
     * Update shipping type for product, then return shipping info of the shipping lines
     * @param productTemplateId: product Id on odoo
     * @param shippingTypesOdoo: to update for product
     * @param countryCode: for shipping to
     * @returns {
     *     first_item_fee: firstItemFee,
     *     additional_item_fee: addtionalItemFee,
     *     eta_delivery_time: etaDeliveryTime,
     *   } of each shipping line
     */
    async updateThenGetShippingDatas(
      productTemplateId: number,
      shippingTypesOdoo: Array<string>,
      countryCode: string,
    ): Promise<Map<string, ShippingData>> {
      await this.updateShippingTypeProductTemplate(productTemplateId, shippingTypesOdoo);
      return this.getShippingDatas(productTemplateId, countryCode);
    },

    /**
     * Get mail message
     * @param model is model want to search
     * @param id product template id | product product id | etc
     * @param text text of message
     */
    async getMailMessagebyText(
      model: string,
      id: number,
      text: string,
      opts?: { date: string },
    ): Promise<Array<MailMessage>> {
      const args = [
        ["model", "=", model],
        ["res_id", "=", id],
        ["body", "ilike", text],
      ];
      if (opts && opts.date) {
        args.push(["create_date", ">", opts.date]);
      }
      const mailMessageResult: Array<MailMessage> = await odoo.searchRead({
        model: "mail.message",
        args: args,
        fields: ["id", "model", "res_id", "body", "create_date"],
      });
      return mailMessageResult;
    },

    /*
     * Get the smallest delivery carriers by condition
     */
    async getSmallestDeliveryCarriersByConditions(cond: GetSmallestDeliveryCondition): Promise<{
      deliveryCarrier: DeliveryCarrier | null;
      shipping: [number, number];
      shippingTime: [number, number];
    }> {
      if (cond.weight === 0) {
        throw new Error("Invalid weight");
        return;
      }
      const req: TypeSearchReadOdoo = {
        model: "delivery.carrier",
        fields: ["name", "price_rule_ids", "x_display_name_checkout", "x_estimated_delivery"],
        args: [],
      };
      if (cond.id) {
        req.args.push(["id", "=", cond.id]);
      }

      if (cond.countryCode) {
        req.args.push(["country_ids", "=", cond.countryCode]);
      }
      if (cond.shippingGroupName) {
        req.args.push(["x_delivery_carrier_group", "=", cond.shippingGroupName]);
      }

      if (cond.shippingTypes) {
        req.args.push(["x_delivery_carrier_type_id", "=", cond.shippingTypes]);
      }

      const deliveryCarriers: Array<DeliveryCarrier> = await odoo.searchRead(req);
      if (deliveryCarriers.length === 0) {
        return {
          deliveryCarrier: null,
          shipping: [0, 0],
          shippingTime: [0, 0],
        };
      }
      const priceRuleIds = deliveryCarriers.reduce((rs, dc) => {
        dc.price_rule_ids.forEach(pri => rs.push(pri));
        return rs;
      }, []);

      const priceRules: Array<DeliveryCarrierPriceRule> = await odoo.searchRead({
        model: "delivery.price.rule",
        args: [["id", "=", priceRuleIds]],
      });

      const priceRuleGroupByDc: Map<number, Array<DeliveryCarrierPriceRule>> = new Map<
        number,
        Array<DeliveryCarrierPriceRule>
      >();
      priceRules.forEach(pr => {
        let prs: Array<DeliveryCarrierPriceRule> = [];
        const oldPr = priceRuleGroupByDc.get(pr.carrier_id[0]);
        if (!oldPr) {
          prs = [pr];
        } else {
          prs = priceRuleGroupByDc.get(pr.carrier_id[0]).concat([pr]);
        }
        priceRuleGroupByDc.set(pr.carrier_id[0], prs);
      });
      const getShipping = function (weight: number, priceRules: Array<DeliveryCarrierPriceRule>): [number, number] {
        const appliedPriceRule = priceRules.find(pr => {
          switch (pr.operator) {
            case "<=":
              return weight <= pr.max_value;
            case "<":
              return weight < pr.max_value;
            case ">=":
              return weight >= pr.max_value;
            case ">":
              return weight > pr.max_value;
          }
        });
        if (appliedPriceRule && appliedPriceRule.list_price > 0) {
          return [
            appliedPriceRule.list_base_price + appliedPriceRule.list_price * cond.weight,
            appliedPriceRule.list_price * cond.weight,
          ];
        } else {
          return [appliedPriceRule.list_base_price, appliedPriceRule.list_base_price];
        }
        return [-1, -1];
      };

      // Get estimated shipping time from est string by regex and convert to number
      const getEstShippingTime = function (est: string): [number, number] {
        const estArr = est
          .replaceAll(/ ?- ?/g, "|")
          .replaceAll(/  +/g, " ")
          .replaceAll(/[^\d|]/g, "")
          .split("|");
        return [parseInt(estArr[0]), parseInt(estArr[1])];
      };

      // Get min dc
      if (!deliveryCarriers.length) {
        return null;
      }
      if (deliveryCarriers.length == 1) {
        const [firstShipping, addShipping]: [number, number] = getShipping(
          cond.weight,
          priceRuleGroupByDc.get(deliveryCarriers[0].id),
        );
        return {
          deliveryCarrier: deliveryCarriers[0],
          shipping: [firstShipping, addShipping],
          shippingTime: getEstShippingTime(deliveryCarriers[0].x_estimated_delivery),
        };
      }
      let smallestFirstShipping = 0;
      let smallestAddShipping = 0;
      const smallestDc: DeliveryCarrier = deliveryCarriers.reduce((rs, dc) => {
        const priceRules = priceRuleGroupByDc.get(dc.id);
        if (priceRules) {
          const [firstShipping, addShipping]: [number, number] = getShipping(cond.weight, priceRules);
          const [oldFirstShipping, oldAddShipping]: [number, number] = getShipping(
            cond.weight,
            priceRuleGroupByDc.get(rs.id),
          );
          smallestFirstShipping = oldFirstShipping;
          smallestAddShipping = oldAddShipping;
          if (firstShipping == -1) {
            return rs;
          }
          if (firstShipping < oldFirstShipping) {
            smallestFirstShipping = firstShipping;
            smallestAddShipping = addShipping;
            return dc;
          }
          return rs;
        }
        return rs;
      }, deliveryCarriers[0]);

      return {
        deliveryCarrier: smallestDc,
        shipping: [smallestFirstShipping, smallestAddShipping],
        shippingTime: getEstShippingTime(smallestDc.x_estimated_delivery),
      };
    },

    /*
     * Get Delivery carrier by condition
     * @param cond condition
     */
    async getDeliveryCarriersByConditions(cond: GetDeliveryCarriersCondition): Promise<Array<DeliveryCarrier> | []> {
      const args = [];
      expect(Object.keys(cond).length).toBeGreaterThan(0);

      if (cond.shippingTypeIds) {
        expect(cond.shippingTypeIds.length).toBeGreaterThan(0);
        args.push(["x_delivery_carrier_type_id", "in", cond.shippingTypeIds]);
      }
      const deliveryCarriers: Array<DeliveryCarrier> = await odoo.searchRead({
        model: "delivery.carrier",
        args,
        fields: ["id", "x_delivery_carrier_group", "x_display_name_checkout"],
      });

      return deliveryCarriers;
    },

    /*
     * Get Delivery carrier group by condition
     * @param cond condition
     */
    async getDeliveryCarrierGroupsByConditions(
      cond: GetDeliveryCarrierGroupsCondition,
    ): Promise<Array<DeliveryCarrierGroup> | []> {
      const args = [];
      expect(Object.keys(cond).length).toBeGreaterThan(0);

      if (cond.ids) {
        expect(cond.ids.length).toBeGreaterThan(0);
        args.push(["id", "=", cond.ids]);
      }
      const deliveryCarrierGroups: Array<DeliveryCarrierGroup> = await odoo.searchRead({
        model: "delivery.carrier.group",
        args,
        fields: ["id", "code", "name"],
      });

      return deliveryCarrierGroups;
    },

    /*
     * Get Delivery carrier group by condition
     * @param cond condition
     */
    async getProductTemplatesByConditions(cond: GetProductTemplatesCondition): Promise<Array<ProductTemplate> | []> {
      const args = [];
      expect(Object.keys(cond).length).toBeGreaterThan(0);

      if (cond.ids) {
        expect(cond.ids.length).toBeGreaterThan(0);
        args.push(["id", "=", cond.ids]);
      }
      const fields = [];
      if (cond.fields) {
        fields.push(...cond.fields);
      }
      const productTemplates: Array<ProductTemplate> = await odoo.searchRead({
        model: "product.template",
        args,
        fields,
      });

      return productTemplates;
    },

    /*
     * Get Delivery carrier group by condition
     * @param cond condition
     */
    async getProductTemplatesById(id: number, fields?: Array<string>): Promise<ProductTemplate> {
      expect(id).toBeGreaterThan(0);
      const productTemplates: Array<ProductTemplate> = await this.getProductTemplatesByConditions({
        ids: [id],
        fields,
      });

      return productTemplates[0];
    },

    /**
     * get warehouse in DO -out
     * @param stockPickingId
     * @returns warehouse ID
     */
    async getWarehouseDoOut(stockPickingId: number): Promise<string> {
      const dataWarehouse: Array<StockPicking> = await odoo.read<StockPicking>(
        "stock.picking",
        [stockPickingId],
        ["x_warehouse_id"],
      );
      const result = dataWarehouse.map(e => e.x_warehouse_id);
      if (result.length !== 0) {
        const warehouseInfo = result[0];
        return warehouseInfo[1];
      } else {
        return Promise.reject(`Cannot get warehouse of Stock picking ID ${stockPickingId}`);
      }
    },

    /**
     * Sent quotation (Only work with current flow, if new feauture about quotation send release, need update)
     * @param id quotation id
     * @param type private-request, aliexpress-request, catalog (current support only private-request)
     */
    async sentQuotation(id: number, type?: string): Promise<boolean> {
      if (!type || type === "private-request") {
        await odoo.callAction({
          model: "sale.order",
          args: [id],
          action: "action_quick_send_quotation",
        });

        await odoo.callAction({
          model: "sale.order",
          args: [id],
          action: "action_notify_to_merchant",
        });

        const argsCreateMessage = {
          composition_mode: "comment",
          model: "sale.order",
          res_id: id,
          email_from: '"Administrator" <admin@example.com>',
          subject: "Quotation (Test)",
          body: "Test body",
        };
        const msgComposeId = await odoo.create("mail.compose.message", [argsCreateMessage]);
        if (msgComposeId < 1) {
          return false;
        }

        await odoo.callAction({ args: [msgComposeId], model: "mail.compose.message", action: "action_send_mail" });

        await odoo.update("sale.order", id, { state: "sent" });

        return true;
      }
    },

    /**
     * Sent quotation for private product (with prepare data)
     * @param odoo
     * @param req
     */
    async sentQuotationForPrivateProduct(odoo: FixtureOdoo, req: SentQuotationForPrivateProductReq) {
      if (req.product_tmpl_id === 0 || req.quotation_id === 0) {
        throw new Error("missing product_tmpl_id or quotation_id");
      }

      const productProduct = new ProductProduct(odoo);
      const saleOrder = new OdooSaleOrder(odoo);
      const saleOrderLine = new SaleOrderLine(odoo);

      const variants = await productProduct.getProductProductsByProductTemplateId(req.product_tmpl_id);
      const variantIds = new Array<number>();
      for (const variant of variants) {
        variantIds.push(variant.id);
      }

      // Get sale order, prepare to remove default line in so
      const removeLines = new Array<Array<string | number>>();
      for (let index = 0; index < 10; index++) {
        const soLines = await saleOrderLine.getSaleOrderLinesBySaleOrderId(req.quotation_id);
        if (soLines.length === 0) {
          await waitTimeout(3000);
          continue;
        }

        for (const soLine of soLines) {
          removeLines.push([2, soLine.id, null]);
        }

        break;
      }

      if (removeLines.length === 0) {
        // Need have line to remove to avoid diff base cost when import
        throw new Error("error when get sale order line");
      }

      const updateSoReq: OdooSaleOrderUpdateReq = {
        validity_date: "2042-11-05",
        x_estimated_delivery: 1,
        x_minimum_order_quantity: 1,
        x_minimum_order_value: 1,
        x_quote_based_on: true,
        payment_term_id: 1,
        order_line: [
          ...removeLines,
          [0, null, { product_id: variants[0].id, product_uom_qty: 1, price_unit: req.price_unit }],
        ],
      };
      if (variantIds.length > 0) {
        updateSoReq.x_based_on_variant_ids_rel = [[6, null, variantIds]];
      }

      let resp = await saleOrder.updateSaleOrderById(req.quotation_id, updateSoReq);
      if (!resp) {
        throw new Error("error when update sale order before sent quotation");
      }

      resp = await this.sentQuotation(req.quotation_id);
      if (!resp) {
        throw new Error("error when sent quotation");
      }
    },

    /**
     * Update product product template(s)
     * @param ids product template id list
     * @param productTemplate fields/values to be updated
     */
    async updateProductTemplate(ids: Array<number>, productTemplate, igNoreProdTest = true): Promise<boolean> {
      if (ids.length === 0) {
        throw new Error("empty id list");
      }

      const product = await this.getProductTemplatesById(ids[0]);
      if (!product.x_is_testing_product && igNoreProdTest) {
        throw new Error("invalid product template");
      }

      if (ids.length === 1) {
        return await odoo.update("product.template", ids[0], productTemplate);
      }

      return await odoo.updateMulti("product.template", ids, productTemplate);
    },

    /**
     * quick sent sale order
     * @param id sale order
     */
    async updateQuotationAndQuickSentQuotation(
      id: number,
      saleOrder = this.defaultSaleOrder,
      isSentQuotation?: boolean,
      isNotifyToMerchant?: boolean,
      isAddAllVariant?: boolean,
      ignoreUpdateSaleOrder?: boolean,
    ) {
      if (id === 0) {
        throw new Error("invalid id");
      }
      if (isAddAllVariant) {
        await odoo.callAction({
          args: [id],
          model: "sale.order",
          action: "add_all_variant",
        });
      }
      if (!ignoreUpdateSaleOrder) {
        try {
          await odoo.update("sale.order", id, saleOrder);
        } catch (e) {
          throw new Error(e);
        }
      }
      if (isSentQuotation) {
        await odoo.callAction({
          args: [id],
          model: "sale.order",
          action: "action_quick_send_quotation",
        });
      }

      if (isNotifyToMerchant) {
        await this.notifyToMerchant(id);
      }
    },

    /**
     * notify to merchant
     * @param id sale order
     */
    async notifyToMerchant(id: number): Promise<boolean> {
      const argsCreateMessage = {
        composition_mode: "comment",
        model: "sale.order",
        res_id: id,
        email_from: '"Administrator" <admin@example.com>',
        subject: "Quotation (Test)",
        body: "Test body",
      };
      const msgComposeId = await odoo.create("mail.compose.message", [argsCreateMessage]);
      if (msgComposeId < 1) {
        return false;
      }

      await odoo.callAction({ args: [msgComposeId], model: "mail.compose.message", action: "action_send_mail" });

      return true;
    },

    /**
     * cancel quotation then sent to quotation
     * @param product template id
     * @return success
     */
    async actionCancelThenSentToQuotationByProductId(productId: number): Promise<boolean> {
      const saleOrder = new OdooSaleOrder(odoo);
      const quotationInfo = await this.getQuotationByProductId(productId, [
        "id",
        "x_is_test",
        "x_cancel_reason_id",
        "state",
      ]);
      const quotationId = quotationInfo[0]["id"];

      if (quotationInfo[0]["state"] != "sent") {
        return true;
      }
      expect(quotationInfo[0]["x_is_test"]).toEqual(true);
      if (!quotationInfo[0]["x_cancel_reason_id"]) {
        await saleOrder.updateSaleOrderById(quotationId, {
          x_cancel_reason_id: 1,
        });
      }

      // cancel quotation
      await odoo.callAction({
        args: [quotationId],
        model: "sale.order",
        action: "action_cancel",
      });

      // sent to quotation
      await odoo.callAction({
        args: [quotationId],
        model: "sale.order",
        action: "action_draft",
      });

      return true;
    },

    /**
     * full flow sourcing quotation: update product -> sent quotation -> add all variant -> notify to merchant
     * @param product template id, data sale order, product template
     * @return success
     */
    async updateProductAndSentQuotationWithOptions(
      productId: number,
      productTemplate = this.defaultProductTemplate,
      saleOrder = this.defaultSaleOrder,
      saleOrderLine = this.defaultSaleOrderLine,
      isSentQuotation?: boolean,
      isNotifyToMerchant?: boolean,
      isAddAllVariant?: boolean,
      isUpdateProductTemplate?: boolean,
    ): Promise<boolean> {
      // sent quotation
      const quotationInfo = await this.getQuotationByProductId(productId, [
        "id",
        "order_line",
        "x_is_test",
        "x_quote_based_on",
      ]);
      const quotationId = quotationInfo[0]["id"];
      const quotationLine = await this.getSaleOrderLineBySaleOrderId(quotationId);
      expect(quotationInfo[0]["x_is_test"]).toEqual(true);
      if (quotationInfo[0]["x_quote_based_on"]) {
        let lineId;
        const lineQuotation = quotationInfo[0]["order_line"];
        if (lineQuotation.length > 0) {
          lineId = lineQuotation[0];
        }
        lineId > 0 ? (saleOrder.order_line = [[1, lineId, saleOrderLine]]) : [[0, false, saleOrderLine]];
      } else {
        saleOrder.order_line = quotationLine;
      }

      if (isUpdateProductTemplate) {
        await this.updateProductTemplate([productId], productTemplate);
      }
      if (quotationId > 0) {
        await this.updateQuotationAndQuickSentQuotation(
          quotationId,
          saleOrder,
          isSentQuotation,
          isNotifyToMerchant,
          isAddAllVariant,
        );
      }
      return true;
    },

    /**
     * Get stock picking by condition
     * @param cond
     */
    async getStockPickingsByConditions(cond: GetStockPickingsCondition): Promise<Array<StockPicking>> {
      const args = [];
      args.push(["x_is_test", "!=", false]);
      const fields = ["id"];

      if (cond.fields?.length) {
        fields.push(...cond.fields);
      }
      if (cond.productName) {
        args.push(["product_id", "ilike", cond.productName]);
      }
      if (cond.ownerId) {
        args.push(["owner_id", "=", cond.ownerId]);
      }
      if (cond.orderName) {
        args.push(["origin", "ilike", cond.orderName]);
      }
      if (cond.parnerId) {
        args.push(["partner_id", "=", cond.parnerId]);
      }
      if (cond.id) {
        args.push(["id", "=", cond.id]);
      }
      if (cond.name) {
        args.push(["name", "ilike", cond.name]);
      }
      if (cond.created_date) {
        args.push(["create_date", ">=", cond.created_date]);
      }
      if (cond.state) {
        args.push(["state", "in", cond.state]);
      }

      const resp: Array<StockPicking> = await odoo.searchRead({
        model: "stock.picking",
        fields,
        limit: cond.limit || 20,
        args,
        order: "create_date DESC",
      });
      return resp;
    },

    /**
     * Wait stock picking is created by consumer
     * @param cond
     */
    async waitStockPickingCreated(cond: GetStockPickingsCondition) {
      // 5 times retry, delay 2s
      let res = [];
      await waitTimeout(2000);
      for (let i = 0; i < 20; i++) {
        const dos = await this.getStockPickingsByConditions(cond);
        if (dos.length) {
          res = dos;
          break;
        }
        await waitTimeout(2000);
      }
      expect(res.length).toBeGreaterThan(0);
    },

    /**
     * Get quotation cancel reason by id
     * @param id quotation cancel reason id
     * @param fields
     * @return quotation cancel reason
     */
    async getQuotationCancelReasonById(id: number, fields: string[]): Promise<QuotationCancelReason> {
      const resp: QuotationCancelReason[] = await odoo.searchRead({
        model: "quotation.cancel.reason",
        fields,
        limit: 1,
        args: [["id", "=", id]],
      });
      return resp[0];
    },

    /**
     * Done partial stock picking
     * @param stockPickingId is stock picking id
     * @param quantityDone is quantity done
     */
    async donePartialStockPicking(stockPickingId: number, quantityDone: number, trackingNumber: string) {
      // get ids of move line ids
      const getMoveLineIds = await this.getMoveLineId(stockPickingId);

      // update quantity stock picking
      await odoo.update("stock.picking", stockPickingId, {
        move_line_ids_without_package: [[1, getMoveLineIds[0][0], { qty_done: quantityDone }]],
      });

      await this.updateTknForDeliveryOrder(stockPickingId, trackingNumber);
      // call action done stock picking and create backorder
      await odoo.callAction({
        args: [stockPickingId],
        model: "stock.picking",
        action: "action_done_create_backorder",
      });
    },

    /**
     * quick sent sale order for find product
     * @param id sale order
     * @param productTemplateId is product template id
     * @param isSentQuotation is sent quotation
     * @param isNotifyToMerchant is notify to merchant
     * @param isAddAllVariant is add all variant
     * @param xQuoteBasedOn is quote based on
     * @param priceUnit is price unit
     *
     */
    async updateQuotationAndQuickSentQuotationPlushub(
      id: number,
      productTemplateId: number,
      isSentQuotation: boolean,
      isNotifyToMerchant: boolean,
      isAddAllVariant: boolean,
      xQuoteBasedOn: boolean,
      priceUnit: number[],
    ) {
      if (id === 0) {
        throw new Error("invalid id");
      }

      const productProduct = new ProductProduct(odoo);
      const saleOrder = new OdooSaleOrder(odoo);

      // get product template variants
      const variants = await productProduct.getProductProductsByProductTemplateId(productTemplateId);
      const variantIds = new Array<number>();
      const orderLines = [];
      let indexVariantId = 0;

      // add order line for each variant and do not delete order line default
      for (const variant of variants) {
        variantIds.push(variant.id);
        if (indexVariantId !== 0) {
          orderLines.push([
            0,
            null,
            { product_id: variant.id, product_uom_qty: 1, price_unit: priceUnit[indexVariantId] },
          ]);
        }
        indexVariantId++;
      }

      const updateSoReq: OdooSaleOrderUpdateReq = {
        validity_date: "2030-11-09",
        x_estimated_delivery: 1,
        x_minimum_order_quantity: 1,
        x_minimum_order_value: 1,
        payment_term_id: 3,
        x_quote_based_on: xQuoteBasedOn,
        order_line: orderLines,
      };

      if (variantIds.length > 0) {
        updateSoReq.x_based_on_variant_ids_rel = [[6, null, variantIds]];
      }

      await saleOrder.updateSaleOrderById(id, updateSoReq);
      if (isSentQuotation) {
        await odoo.callAction({
          args: [id],
          model: "sale.order",
          action: "action_quick_send_quotation",
        });
      }

      if (isNotifyToMerchant) {
        await this.notifyToMerchant(id);
      }

      if (isAddAllVariant) {
        await odoo.callAction({
          args: [id],
          model: "sale.order",
          action: "add_all_variant",
        });
      }
    },

    /**
     * Get move line id
     * @param stockPickingId
     * @returns move line id
     */
    async getMoveLineId(stockPickingId: number): Promise<number[][]> {
      const result: Array<StockPicking> = await odoo.read<StockPicking>(
        "stock.picking",
        [stockPickingId],
        ["move_line_ids_without_package"],
      );
      return result.map(e => e.move_line_ids_without_package);
    },

    /**
     * Get quantity done Do in, Do out
     * @param moveLineIds
     * @returns quantity done Do in, Do out
     */
    async getQuantityDone(moveLineIds: number): Promise<Array<number>> {
      const result: Array<QuantityDoneDoIn> = await odoo.read<QuantityDoneDoIn>(
        "stock.move.line",
        [moveLineIds],
        ["qty_done"],
      );
      return result.map(e => e.qty_done);
    },

    /**
     * get data product category have priority
     * @param odoo is odoo instance
     * @param categoryId is category id
     * return data product category have priority
     */
    async getAndSortProductCategoriesHavePriority(categoryId: number): Promise<Array<CategoryHandle>> {
      const productPublicCategory: Array<ProductPublicCategory> = await odoo.read(
        "product.public.category",
        [categoryId],
        ["x_product_public_category_handles"],
      );
      const data: Array<CategoryHandle> = await odoo.read(
        "product.public.category.handle",
        productPublicCategory[0].x_product_public_category_handles,
        ["priority", "product_name", "product_publish"],
      );
      const productHavePriority = data.filter(item => item.priority !== 0 && item.product_publish.length > 0);
      return productHavePriority.sort(
        (a, b) => b.priority - a.priority || Date.parse(b.product_publish) - Date.parse(a.product_publish),
      );
    },

    /**
     * Get product variant infor by variant id
     * @param variantId: product variant id on odoo
     * @returns variantInfor
     */
    async getVariantInforById(variantId: number): Promise<PlbProductVariant> {
      const variantInfor: Array<PlbProductVariant> = await odoo.read(
        "product.product",
        [variantId],
        [
          "active",
          "x_price",
          "x_compare_at_price",
          "x_variant_weight",
          "x_plusbase_selling_price",
          "x_plusbase_base_cost",
          "x_plusbase_discouted_base_cost",
          "x_set_unavailable",
        ],
      );
      return variantInfor[0];
    },

    /** Update TKN for delivery order
     * @param deliveryOrderId is delivery order id
     * @param trackingNumber is tracking number
     */
    async updateTknForDeliveryOrder(deliveryOrderId: number, trackingNumber: string) {
      await odoo.update("stock.picking", deliveryOrderId, { x_tracking_number: trackingNumber });
    },

    /** Clear record in purchase url table
     * @param productId is product tmpl id
     * @returns void
     */
    async deleteAllPurchaseUrlByProductId(productId: number): Promise<void> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      const purchaseUrls: Array<PurchaseUrl> = await odoo.searchRead({
        model: "purchase.url",
        args: [["x_product_tmpl_id", "=", productId]],
        fields: ["id"],
      });

      for (const url of purchaseUrls) {
        await odoo.callAction({
          model: "purchase.url",
          args: [url.id],
          action: "unlink",
        });
      }
    },

    /** Call action gen sku of product template
     * @param productId is product tmpl id
     * @returns CallActionResponse
     */
    async callActionGenSku(productId: number): Promise<CallActionResponse> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      return await odoo.callActionV2({
        args: [productId],
        model: "product.template",
        action: "action_gen_sku",
      });
    },

    /** Get variant infos by ids
     * @param variantIds is id of variant
     * @returns PlbProductVariant
     */
    async getVariantInforByIds(variantIds: number[], fields: string[]): Promise<Array<PlbProductVariant>> {
      return await odoo.read("product.product", variantIds, fields);
    },

    /** Delete all mail message by product id
     * @param productId is id of product template
     * @returns void
     */
    async deleteAllMailMessageByProductId(productId: number): Promise<void> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      const mailMessages: Array<MailMessage> = await odoo.searchRead({
        model: "mail.message",
        args: [
          ["model", "=", "product.template"],
          ["res_id", "=", productId],
        ],
        fields: ["id"],
      });

      for (const mail of mailMessages) {
        await odoo.callAction({
          model: "mail.message",
          args: [mail.id],
          action: "unlink",
        });
      }
    },

    /** Delete mail message by variant ids
     * @param variantIds is id of variant
     * @returns void
     */
    async deleteMailMessageByVariantIds(variantIds: number[]): Promise<void> {
      if (!(await this.isTestVariants(variantIds))) {
        throw new Error("Func only for test variant");
      }

      const mailMessages: Array<MailMessage> = await odoo.searchRead({
        model: "mail.message",
        args: [
          ["model", "=", "product.product"],
          ["res_id", "in", variantIds],
        ],
        fields: ["id"],
      });

      for (const mail of mailMessages) {
        await odoo.callAction({
          model: "mail.message",
          args: [mail.id],
          action: "unlink",
        });
      }
    },

    /** Delete view product tmpl record by values
     * @param productId is id of product template
     * @param replaceValues is replace values
     * @returns void
     */
    async deleteViewProductTmplRecordByValues(productId: number, replaceValues: string[]): Promise<void> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      if (replaceValues.length === 0) {
        throw new Error("invalid request");
      }

      const records: Array<ViewProductTmpl> = await odoo.searchRead({
        model: "view.product.tmpl",
        args: [
          ["product_tmpl_id", "=", productId],
          ["replace_values", "in", replaceValues],
        ],
        fields: ["id"],
      });

      for (const record of records) {
        await odoo.callAction({
          model: "view.product.tmpl",
          args: [record.id],
          action: "unlink",
        });
      }

      return;
    },

    /** Delete view product tmpl record by action type
     * @param productId is id of product template
     * @param actionType is action type of record
     * @returns void
     */
    async deleteViewProductTmplRecordByActionType(productId: number, actionType: string): Promise<void> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      const records: Array<ViewProductTmpl> = await odoo.searchRead({
        model: "view.product.tmpl",
        args: [
          ["product_tmpl_id", "=", productId],
          ["action_type", "=", actionType],
        ],
        fields: ["id"],
      });

      for (const record of records) {
        await odoo.callAction({
          model: "view.product.tmpl",
          args: [record.id],
          action: "unlink",
        });
      }

      return;
    },

    /** Replace production attribute value
     * @param productId is product tmpl id
     * @param attributeId is attribute id
     * @param replaceValue is new value
     * @returns void
     */
    async replaceProductAttributeValue(productId: number, attributeId: number, replaceValue: string): Promise<void> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      const id = await odoo.create("view.product.tmpl", [
        {
          product_tmpl_id: productId,
          replace_values: replaceValue,
          secondary_values: false,
          x_product_template_attribute_value_ids: [[6, false, [attributeId]]],
        },
      ]);
      await odoo.callActionV2({
        model: "view.product.tmpl",
        args: [id],
        action: "action_approved_replace_attribute_value",
      });
    },

    /** Replace production attribute value
     * @param productId is product tmpl id
     * @param fileName is name of file (Ex: import_file.csv)
     * @param fileBase64 is file data was convert to base64
     * @returns void
     */
    async importSourcingInfoCost(productId: number, fileName: string, fileBase64: string): Promise<void> {
      if (!(await this.isTestProduct(productId))) {
        throw new Error("Func only for test product");
      }

      const id = await odoo.create("view.product.tmpl", [
        {
          product_tmpl_id: productId,
          action_type: "import_sourcing_product",
          file: fileBase64,
          file_name: fileName,
        },
      ]);

      await odoo.callAction({
        model: "view.product.tmpl",
        args: [id],
        action: "action_import_sourcing_product",
      });
    },
    /**
     * Action sync to quotation
     * @param id
     */
    async syncToQuotation(id: number): Promise<CallActionResponse> {
      if (id < 1) {
        throw new Error("invalid quotation_id");
      }

      return await odoo.callActionV2({
        args: [id],
        model: "product.template",
        action: "sync_to_quotation",
      });
    },

    /**
     * Get all productVariant by productTemplateId
     * @param productTemplateId
     */
    async getProductVariantsByProductTemplateId(
      productTemplateId: number,
      fields?: Array<string>,
      limit?: number,
    ): Promise<Array<OdooProductProduct>> {
      if (productTemplateId < 1) {
        throw new Error("invalid product_template_id");
      }

      const productProduct = new ProductProduct(odoo);

      return await productProduct.getProductProductsByProductTemplateId(productTemplateId, fields, limit);
    },

    /**
     * Get all sale order line by saleOrderId
     * @param saleOrderId
     */
    async getSaleOrderLineBySaleOrderId(saleOrderId: number): Promise<Array<OdooSaleOrderLine>> {
      if (saleOrderId < 1) {
        throw new Error("invalid quotation_id");
      }

      const saleOrderLine = new SaleOrderLine(odoo);

      return await saleOrderLine.getSaleOrderLinesBySaleOrderId(saleOrderId, [
        "id",
        "order_id",
        "x_product_cost",
        "x_domestic_shipping",
        "price_unit",
        "product_id",
        "salesman_id",
      ]);
    },

    /**
     * Get if config parameter
     * @param key key of parameter
     * @param fields
     * @returns IrConfigParameter
     */
    async getIrConfigParameterByKey(key: string, fields: string[]): Promise<IrConfigParameter> {
      const parameters: Array<IrConfigParameter> = await odoo.searchRead({
        model: "ir.config_parameter",
        args: [["key", "=", key]],
        fields: fields,
        limit: 1,
      });

      if (!parameters || parameters.length === 0) {
        throw new Error("empty result");
      }

      return parameters[0];
    },

    /**
     * Get rmb convert rate
     * @returns rmb rate
     */
    async getRmbRate(): Promise<number> {
      const configParameter = await this.getIrConfigParameterByKey("x_rmb_rate", ["value"]);
      return configParameter ? parseFloat(configParameter.value) : 6.3;
    },

    /**
     * Get product shipping rate
     * @param request
     * @param api domain by env
     * @param productId
     * @param shopId
     * @param countryId sbase country id
     * @returns ShippingRateResponse
     */
    async getProductShippingRate(
      request: APIRequestContext,
      api: string,
      productId: number,
      shopId: number,
      countryId: number,
    ): Promise<ShippingRateResponse> {
      let url = `https://${api}/admin/plusbase-sourcing/shipping/rates.json`;
      url += buildQueryString({
        product_id: productId,
        shop_id: shopId,
        country_id: countryId,
        is_odoo: true,
      });

      const response = await request.get(url);
      expect(response.status()).toBe(200);
      return await response.json();
    },

    /**
     * created product catalog and send quotation
     * @param name is product name
     * @param deliveryCarrierId is delivery carrier id
     * @param attributes is product attributes
     * @param dataProductVariant is product variant data
     * @param argsUpdateQuotation is update quotation data
     * @param priceVariant is price variant
     * @returns product template id, sale order id
     */
    async createProductCatalogPlusBase(
      name: string,
      deliveryCarrierId: number,
      attributes: Array<TemplateAttribute>,
      dataProductVariant: Array<PlbProductVariant>,
      argsUpdateQuotation: OdooSaleOrderUpdateReq,
      priceVariant: number[],
    ) {
      const productId = await this.createProductTemplate(name, deliveryCarrierId, attributes);

      // get product variant id
      const variantIds = await odoo.searchRead({
        model: "product.product",
        args: [["product_tmpl_id", "=", productId[0]]],
        fields: ["id"],
      });
      let saleOrderId: number;
      if (variantIds.length > 0) {
        const ids = [];
        variantIds.forEach(prd => {
          ids.push(prd["id"]);
        });
        // update product variant: PlusBase Selling Price, PlusBase Base Cost, weight ...
        for (const id of ids) {
          await this.updateProductVariant(id, dataProductVariant[0]);
        }
        // get sale order and update sale order
        const quotationId = await odoo.search({
          model: "sale.order",
          args: [["x_quoted_product_tmpl_id", "=", productId[0]]],
          limit: 1,
        });
        const quotation = await odoo.read("sale.order", quotationId, ["id", "partner_id", "order_line"]);
        saleOrderId = quotation[0]["id"];
        if (quotation.length <= 0) {
          throw new Error("quotation not found");
        }
        await odoo.update("sale.order", quotation[0]["id"], argsUpdateQuotation);

        if (argsUpdateQuotation.x_quote_based_on) {
          // update price all variant
          await odoo.update("sale.order", quotation[0]["id"], {
            order_line: [[1, quotation[0]["order_line"][0], { price_unit: priceVariant[0] }]],
          });
        } else {
          // update price for each variant
          for (let i = 0; i < priceVariant.length; i++) {
            await odoo.update("sale.order", quotation[0]["id"], {
              order_line: [[1, quotation[0]["order_line"][i], { price_unit: priceVariant[i] }]],
            });
          }
        }

        // add all variant
        await odoo.callAction({
          args: [quotation[0]["id"]],
          model: "sale.order",
          action: "add_all_variant",
        });

        // send quotation
        await odoo.callAction({
          model: "sale.order",
          args: [quotation[0]["id"]],
          action: "action_quick_send_quotation",
        });

        // notify to merchant
        await this.notifyToMerchant(quotation[0]["id"]);
      }
      return {
        productTemplateId: productId[0],
        quotationId: saleOrderId,
      };
    },

    /**
     * Get data moq product
     * @param productId is product tmpl id
     * @returns data moq product
     */
    async getDataMoqProduct(productId: number): Promise<Array<MoqProduct>> {
      const products: Array<ProductTemplate> = await odoo.read("product.template", [productId], ["x_moqs"]);
      const moqs = products[0].x_moqs;
      const moqProduct: Array<MoqProduct> = await odoo.read("product.moq", moqs);
      return moqProduct;
    },

    /**
     * get shipping info of the shipping lines
     * @param productTemplateId: product Id on odoo
     * @param shippingTypesOdoo: to update for product
     * @param countryCode: for shipping to
     * @returns {
     *     first_item_fee: firstItemFee,
     *     additional_item_fee: addtionalItemFee,
     *     eta_delivery_time: etaDeliveryTime,
     *   } of each shipping line
     */
    async getShippingDatas(
      productTemplateId: number,
      countryCode: string,
      productProductId?: number,
    ): Promise<Map<string, ShippingData>> {
      const finalShippingInfo = new Map<string, ShippingData>();
      // Get shipping fee and shipping time of product from Odoo
      const shippingGroupIds = [];
      const productTemplate: ProductTemplate = await this.getProductTemplatesById(productTemplateId);
      const deliveryCarriers = await this.getDeliveryCarriersByConditions({
        shippingTypeIds: productTemplate.x_delivery_carrier_type_ids,
      });
      for (const deliveryCarrier of deliveryCarriers) {
        // Get group ID of each delivery carrier
        const groupId = deliveryCarrier.x_delivery_carrier_group[0];
        if (shippingGroupIds.includes(groupId)) {
          continue;
        }
        shippingGroupIds.push(groupId);
      }

      let weight = productTemplate.x_weight;
      // get data shipping type
      const shippingTypeResult: Array<ShippingType> = await odoo.searchRead({
        model: "delivery.carrier.type",
        args: [],
        fields: ["id", "name"],
      });
      const shippingTypesOdoo = [];
      for (const shippingTypeId of productTemplate.x_delivery_carrier_type_ids) {
        const shippingTypeName = shippingTypeResult.find(item => item.id === shippingTypeId);
        shippingTypesOdoo.push(shippingTypeName.name);
      }
      const shippingGroups = await this.getDeliveryCarrierGroupsByConditions({
        ids: shippingGroupIds,
      });

      if (productProductId) {
        const dataVariant = await this.getVariantInforById(productProductId);
        weight = dataVariant.x_variant_weight;
      }

      for await (const shippingGroup of shippingGroups) {
        // Get smallest shipping fee of shipping group by condition: shipping type, country code, weight
        const { deliveryCarrier: smlDeliveryCarrier, shipping: smlShippings } =
          await this.getSmallestDeliveryCarriersByConditions({
            countryCode: countryCode,
            shippingGroupName: shippingGroup.name,
            weight: weight,
            shippingTypes: shippingTypesOdoo,
          });
        if (smlDeliveryCarrier === null) {
          continue;
        }

        // Get estimated delivery time of shipping method
        const etaDeliveryTime = smlDeliveryCarrier.x_estimated_delivery.replace("-", " - ");

        // Get shipping fee first item of product
        const firstItemFee = Number(updateShippingFee(smlShippings[0]).toFixed(2));
        const addtionalItemFee = Number(updateShippingFee(smlShippings[1]).toFixed(2));
        finalShippingInfo.set(smlDeliveryCarrier.x_display_name_checkout, {
          first_item_fee: firstItemFee,
          additional_item_fee: addtionalItemFee,
          eta_delivery_time: etaDeliveryTime,
        });
      }
      return finalShippingInfo;
    },

    /**
     * Get price rule
     * @param ids is rule id
     * @returns line rule
     */
    async getPriceRuleDatas(ids: Array<number>): Promise<Array<PriceRules>> {
      const priceRules = await odoo.read("delivery.price.rule", ids);
      return priceRules;
    },

    /**
     * check product is publish or not
     * @param productId
     * @returns boolean
     */
    async isPublishProduct(productId: number): Promise<boolean> {
      if (productId <= 0) {
        throw new Error("invalid product id");
      }
      const products: Array<ProductTemplate> = await odoo.read(
        "product.template",
        [productId],
        ["x_is_plusbase_published"],
      );
      if (products.length != 1) {
        throw new Error("empty result");
      }
      return Boolean(products[0].x_is_plusbase_published);
    },

    /**
     * Sort data moq wwith key
     * @param productId
     * @returns data moq affter sort
     */
    async sortDataMoqWithKey(productId: number): Promise<Map<string | number, Array<Record<string, number>>>> {
      const variantDataMap = new Map<string | number, Array<Record<string, number>>>();
      const data: Array<MoqProduct> = await this.getDataMoqProduct(productId);
      const checkedQuantities = new Map<string | number, number>();

      for (const item of data) {
        const key = item.product_product_id[0];
        const existingData = variantDataMap.get(key);
        const quantity = item.quantity;

        if (existingData && quantity !== checkedQuantities.get(key)) {
          existingData.push({ quantity, price: item.base_cost });
          existingData.sort((a, b) => a.quantity - b.quantity);
          variantDataMap.set(key, existingData);
        } else {
          variantDataMap.set(key, [{ quantity, price: item.base_cost }]);
          checkedQuantities.set(key, quantity);
        }
      }
      return variantDataMap;
    },

    /**
     * update quotation
     * @param id is quotation_id
     * @param saleOrder is quotation data
     * @returns quotation after update
     */
    async updateQuotation(id: number, saleOrder: defaultSaleOrderType): Promise<SaleOrder> {
      await odoo.update("sale.order", id, saleOrder);
      const quotations: Array<SaleOrder> = await odoo.read<SaleOrder>("sale.order", [id]);
      return quotations[0];
    },

    /**
     * Renew quotation with action send no notify to merchant
     * @param productId is product template id
     * @param quotationID is sale order id
     * @param shippingTypesOdoo is shipping type of product
     * @param reasonID is reason cancel quotation
     */
    async sendQuotationWithAliEXpress(
      productId: number,
      quotationID: number,
      shippingTypesOdoo: Array<string>,
      reasonID: number,
    ) {
      const argsUpdateQuotation = {
        validity_date: "2042-11-05",
        payment_term_id: 2,
        x_estimated_delivery: 1,
        x_minimum_order_quantity: 1,
        x_minimum_order_value: 1,
      };
      // Update shipping type AliEXpress
      await this.updateShippingTypeProductTemplate(productId, shippingTypesOdoo);

      // Get state of quotation
      const result: Array<SaleOrder> = await odoo.read<SaleOrder>(
        "sale.order",
        [quotationID],
        ["state", "x_use_partner_price"],
      );
      const states = result.map(e => e.state);
      const usePartnerPrice = result.map(e => e.x_use_partner_price);

      switch (states[0]) {
        case "draft":
          await odoo.update("sale.order", quotationID, argsUpdateQuotation);
          await odoo.callAction({
            args: [quotationID],
            model: "sale.order",
            action: "add_all_variant",
          });

          await odoo.callAction({
            model: "sale.order",
            args: [quotationID],
            action: "action_quick_send_quotation",
          });
          break;
        case "sent":
          if (!usePartnerPrice[0]) {
            await this.cancelQuotation(quotationID, reasonID);
            await this.setQuotationDraft(quotationID);

            await odoo.update("sale.order", quotationID, argsUpdateQuotation);
            await odoo.callAction({
              args: [quotationID],
              model: "sale.order",
              action: "add_all_variant",
            });

            await odoo.callAction({
              model: "sale.order",
              args: [quotationID],
              action: "action_quick_send_quotation",
            });
          }
          break;
        case "cancel":
          await this.setQuotationDraft(quotationID);
          await odoo.update("sale.order", quotationID, argsUpdateQuotation);
          await odoo.callAction({
            args: [quotationID],
            model: "sale.order",
            action: "add_all_variant",
          });

          await odoo.callAction({
            model: "sale.order",
            args: [quotationID],
            action: "action_quick_send_quotation",
          });
          break;
      }
    },

    /**
     * Get data ALi cost and PLB cost in All price
     * @param shippingRateId shipping crawl Ali
     * @returns
     */
    async getDataAllprice(shippingRateId: number): Promise<AliCostAndPLBCost> {
      const response: Array<AliCostAndPLBCost> = await odoo.read<AliCostAndPLBCost>("product.shipping.rates", [
        shippingRateId,
      ]);
      return response[0];
    },

    async getShippingFeeVariantDispatch(
      productTplId: number,
      productProductId: number,
      countryCode: string,
      aliExpressId: number,
    ): Promise<Map<string, ShippingData>> {
      let finalShippingInfo = new Map<string, ShippingData>();

      //check config warehouse of variant
      const productTemplate: ProductTemplate = await this.getProductTemplatesById(productTplId);
      const warehouseDatas: Array<VariantDispath> = await odoo.read<VariantDispath>(
        "product.template.stock.warehouse",
        productTemplate.x_product_warehouse_ids,
      );

      const warehouseVariant = warehouseDatas.find(warehouseData =>
        warehouseData.product_product_ids.includes(productProductId),
      );

      if (warehouseVariant.stock_warehouse_id.includes("AliExpress")) {
        // parse shipping fee crawl from ali
        const aliShipping = JSON.parse(productTemplate.x_platform_shipping_fee);
        const shipping = aliShipping[countryCode];

        // markup shipping
        const expectFirstItemPrice = Math.ceil(shipping.freight_amount) + 0.99;
        const expectAdditionalItemPrice = (expectFirstItemPrice + 0.01) / 2 + 0.01;

        const shippingMethod: Array<DeliveryCarrier> = await odoo.read<DeliveryCarrier>(
          "delivery.carrier",
          [aliExpressId],
          ["x_estimated_delivery", "x_display_name_checkout"],
        );
        finalShippingInfo.set(shippingMethod[0].x_display_name_checkout, {
          first_item_fee: expectFirstItemPrice,
          additional_item_fee: expectAdditionalItemPrice,
          eta_delivery_time: shippingMethod[0].x_estimated_delivery,
        });
      } else {
        finalShippingInfo = await this.getShippingDatas(productTplId, countryCode, productProductId);
      }
      return finalShippingInfo;
    },

    async getTotalBaseCostOrder(productId: number, sbcnVariantIds: BaseCostData[]): Promise<number> {
      const quotationInfo = await this.getQuotationByProductId(productId, ["id", "order_line", "x_quote_based_on"]);
      expect(quotationInfo[0]["id"] > 0).toEqual(true);
      const soLines = await this.getSaleOrderLineBySaleOrderId(quotationInfo[0]["id"]);
      expect(soLines.length > 0).toEqual(true);
      let baseCostItem = 0;
      if (quotationInfo[0]["x_quote_based_on"]) {
        baseCostItem = soLines[0]["price_unit"];
      } else {
        if (sbcnVariantIds && sbcnVariantIds.length > 0) {
          for (let z = 0; z < soLines.length; z++) {
            const line = soLines[z];
            const sbcnVariant = sbcnVariantIds.find(el => line.product_id[0] == el.sbcn_variant_id);
            if (sbcnVariantIds.find(el => line.product_id[0] == el.sbcn_variant_id)) {
              const priceUnit = line.price_unit;
              baseCostItem = baseCostItem + priceUnit * sbcnVariant.quantity;
            }
          }
        }
      }

      return baseCostItem;
    },

    /**
     * Get SO discount information
     * @param productTempID
     * @param SOInfo
     */
    async getSOInfo(productTempID: number, partnerId?: number): Promise<SOInfo> {
      //Get data variants
      const productProducts: Array<OdooProductProduct> = await this.getProductVariantsByProductTemplateId(
        productTempID,
        ["id", "product_cost", "product_template_attribute_value_ids"],
      );

      // Get data quotation
      let dataQuotation: Array<SaleOrder>;
      if (partnerId) {
        dataQuotation = await this.getQuotationByProductId(
          productTempID,
          ["x_discount_time_from", "x_discount_time_to"],
          partnerId,
        );
      } else {
        dataQuotation = await this.getQuotationByProductId(productTempID, [
          "x_discount_time_from",
          "x_discount_time_to",
        ]);
      }

      // Get data sale order line
      const saleOrderLine = new SaleOrderLine(odoo);
      const dataSaleOrderLine: Array<OdooSaleOrderLine> = await saleOrderLine.getSaleOrderLinesBySaleOrderId(
        dataQuotation[0].id,
        ["id", "price_unit", "product_id", "x_discount_amount"],
      );

      const variants: Array<VariantInformation> = [];
      for (const orderLine of dataSaleOrderLine) {
        for (let i = 0; i < productProducts.length; i++) {
          if (orderLine.product_id[0] === productProducts[i].id) {
            const variant: VariantInformation = {
              id: productProducts[i].id,
              base_cost: productProducts[i].product_cost,
              unit_price: orderLine.price_unit,
              discount_amount: orderLine.x_discount_amount,
            };
            variants.push(variant);
          }
        }
      }
      return {
        from_time: dataQuotation[0].x_discount_time_from,
        to_time: dataQuotation[0].x_discount_time_to,
        variants: variants,
      };
    },
  };
}
