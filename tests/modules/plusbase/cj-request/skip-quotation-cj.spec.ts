import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { OdooService } from "@services/odoo";
import type { RequestProductData, SaleOrder, ShippingFee } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductAPI } from "@pages/api/product";
import { CJDropshippingAPI } from "@pages/thirdparty/cj-dropshipping";

test.describe("Skip quotation ", async () => {
  let domain: string;
  let plusbasePage: DropshipCatalogPage;
  let plusbasePrivateRequestPage: PlusbasePrivateRequestPage;
  let productPage: ProductPage;
  let confSaleOrder: SaleOrder;
  let productId: number;
  let unitPrice: number;
  let stockWareHouseId: number;
  let weight: number;
  let carrierIds: Array<number>;
  let odooService = OdooService(null);
  let plusbaseProductAPI: PlusbaseProductAPI;
  let quotationInfo: Array<SaleOrder>;
  let productName: string;
  let expectTotalCost: number;
  let expectShippingMethod: string;
  let productTemplateId: number;
  let countryCode: string;
  let shippingTypes: Array<string>;
  let defaultUrl: string;
  let productAPI: ProductAPI;
  let accessToken: string;
  let cjDropshippingAPI: CJDropshippingAPI;
  let urlCj: string;

  test.beforeAll(async ({ authRequest, conf }) => {
    domain = conf.suiteConf.domain;
    cjDropshippingAPI = new CJDropshippingAPI(authRequest);
    accessToken = await cjDropshippingAPI.getAccessToken(conf.suiteConf.email_user, conf.suiteConf.api_key);
  });

  test.beforeEach(async ({ conf, odoo, authRequest, multipleStore }) => {
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    const dashBoardPage = await multipleStore.getDashboardPage(
      conf.suiteConf.username,
      conf.suiteConf.password,
      domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );
    plusbasePage = new DropshipCatalogPage(dashBoardPage, domain);
    productAPI = new ProductAPI(domain, authRequest);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(dashBoardPage, domain);
    productPage = new ProductPage(dashBoardPage, domain);
    odooService = OdooService(odoo);
    unitPrice = conf.caseConf.unit_price;

    stockWareHouseId = conf.suiteConf.stock_warehouse_id;
    weight = conf.caseConf.weight;
    carrierIds = conf.caseConf.shipping_method_ids;
    confSaleOrder = {
      validity_date: conf.caseConf.expiration,
      x_minimum_order_quantity: conf.caseConf.minimun_order_quantity,
      x_minimum_order_value: conf.caseConf.minimun_order_value,
      x_estimated_delivery: conf.caseConf.estimated_delivery,
      x_quote_based_on: conf.caseConf.is_base_on_for_all_variants,
    };
    urlCj = conf.caseConf.url_cj;
    productName = conf.caseConf.product_name;
    expectShippingMethod = conf.caseConf.shipping_method;
    expectTotalCost = conf.caseConf.total_cost;
    productTemplateId = conf.caseConf.sbcn_product_id;
    countryCode = conf.caseConf.country_code;
    shippingTypes = conf.caseConf.shipping_types;
    defaultUrl = conf.caseConf.default_url;
  });

  test(`Verify SO detail trên dashboard sau khi sent quotation nhưng chưa Notify to merchant @SB_PLB_CJ_RC_47`, async ({
    conf,
  }) => {
    const { variants } = await cjDropshippingAPI.getProductDetailCJ(conf.caseConf.product_id, accessToken);

    await test.step(`Vào Dropship products > Product request > Click button Add product > Nhập link CJ > Click button Import product`, async () => {
      await plusbasePage.goToProductRequest();
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: urlCj, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, urlCj, 10, true);
    });

    await test.step(`Vào SO detail > Verify data trong SO`, async () => {
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, urlCj, 10, true);
      // auto cancel and sent to quotation
      await odooService.actionCancelThenSentToQuotationByProductId(productId);
      await plusbasePage.goToProductRequestDetail(productId);
      const productCost = await plusbasePage.getProductCostBeforeSentSO();
      expect(productCost).toEqual(variants[1].variantSellPrice);

      const productName = await plusbasePage.getProductNameInSODetail();
      expect(productName).toEqual(productName);
    });

    await test.step(`Login vào Odoo > Sales > Thực hiện send quotation `, async () => {
      // full flow sourcing
      await odooService.updateProductAndSentQuotationWithOptions(
        productId,
        {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
          x_weight: weight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: 1,
        },
        { price_unit: unitPrice },
        true,
        false,
        true,
        true,
      );
      quotationInfo = await odooService.getQuotationByProductId(productId, ["id", "state"]);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
    });

    await test.step(`Ở dashboard shop > verify data SO detail`, async () => {
      await plusbasePage.goToProductRequest();
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, urlCj, 10, true);
      const productTemplate = await odooService.getProductTemplatesById(productId);
      // parse shipping fee crawl from ali
      const cjShipping = JSON.parse(productTemplate.x_platform_shipping_fee);
      const shipping = cjShipping[countryCode];
      // markup shipping
      const shippingFeeExp: ShippingFee = plusbasePage.markupShippingAliCj(shipping.freight_amount);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productId);
      const shippingFeeFirstItem = removeCurrencySymbol(await plusbasePage.getShipping(2));
      const shippingFeeAdditionalItem = removeCurrencySymbol(await plusbasePage.getShipping(3));
      const productCostAct = await plusbasePage.getProductCost();
      // verify shipping method, shipping cost, total cost in popup
      expect(productCostAct).toEqual(variants[1].variantSellPrice);
      expect(shippingFeeFirstItem).toEqual(shippingFeeExp.first_item.toFixed(2));
      expect(shippingFeeAdditionalItem).toEqual(shippingFeeExp.additional_item.toFixed(2));
    });
  });

  test(`Verify SO detail trên store merchant sau khi thực hiện action Notify to merchant @SB_PLB_CJ_RC_48`, async ({
    conf,
  }) => {
    let sbProductId: number;
    const { variants } = await cjDropshippingAPI.getProductDetailCJ(conf.caseConf.product_id, accessToken);

    await test.step(`Vào Dropship products > Product request > Request product CJ`, async () => {
      // clear data before test
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, urlCj, 10, true);
      if (productId > 0) {
        productTemplateId = productId;
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id"]);
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
      }
      // Request product
      await plusbasePage.goToProductRequest();
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: urlCj, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, urlCj, 10, true);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, urlCj, 20, true);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchWithKeyword(urlCj);
      await plusbasePage.waitTabItemLoaded();
      expect(await plusbasePage.countSearchResult()).toEqual(1);
      const data = await plusbasePage.getDataOfFirstProductInList();
      expect(data.product_name).toContain(productName);
      expect(parseFloat(data.product_cost.replace("$", ""))).toEqual(variants[0].variantSellPrice);
    });

    await test.step(`Import product vào store`, async () => {
      sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productTemplateId);
      await productPage.goToProdDetailByID(domain, sbProductId);
      expect(await productPage.isTextVisible(productName, 2)).toEqual(true);
    });

    await test.step(`Vào Odoo thực hiện send Quotation > Notify to merchant`, async () => {
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // full flow sourcing quotation
      await odooService.updateProductAndSentQuotationWithOptions(
        productTemplateId,
        {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
          x_weight: weight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: 1,
        },
        { price_unit: unitPrice },
        true,
        true,
        true,
        true,
      );
      // get quotation after sourcing
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, [
        "id",
        "state",
        "x_use_partner_price",
      ]);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      expect(quotationInfo[0]["x_use_partner_price"]).toEqual(false);
    });

    await test.step(`Verify SO detail trong store merchant`, async () => {
      const shipInfoTargetProduct = await odooService.updateThenGetShippingDatas(
        productTemplateId,
        shippingTypes,
        countryCode,
      );
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      await plusbasePage.clickSeeDetail();

      // get shipping method, shipping cost, total cost in popup
      const dataInPopUp = await plusbasePage.getDataInPopUpShipping();
      const expectFirstItem = shipInfoTargetProduct.get(dataInPopUp.shippingMethod).first_item_fee;
      const expectAdditionItem = shipInfoTargetProduct.get(dataInPopUp.shippingMethod).additional_item_fee;

      // verify shipping method, shipping cost, total cost in popup
      expect(dataInPopUp.shippingMethod).toEqual(expectShippingMethod);
      expect(dataInPopUp.productCostAct).toEqual("From $" + unitPrice.toFixed(2));
      expect(dataInPopUp.totalCostAct).toEqual("From $" + expectTotalCost);
      expect(dataInPopUp.firstItem).toEqual("$" + expectFirstItem.toFixed(2));
      expect(dataInPopUp.additionalItem).toEqual("$" + expectAdditionItem.toFixed(2));
    });

    await test.step(`Mở product admin detail trên dashboard > Verify product cost`, async () => {
      await productPage.goToProdDetailByID(domain, sbProductId, productPage.xpathProductGroupOption);
      const getProductCost = await productPage.getDataTable(2, 2, 5);
      expect(getProductCost).toEqual(unitPrice.toString());

      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, sbProductId);
    });
  });
});
