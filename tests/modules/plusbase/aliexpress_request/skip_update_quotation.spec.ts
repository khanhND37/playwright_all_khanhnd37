import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { OdooService } from "@services/odoo";
import type { SaleOrder, Product, Card, CheckoutInfo } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import { currencyToNumber, removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { waitTimeout } from "@core/utils/api";
import { ProductAPI } from "@pages/api/product";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { SFCheckout } from "@pages/storefront/checkout";
import { AppsAPI } from "@pages/api/apps";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Skip update quotation", async () => {
  let shippingAddress;
  let email: string;
  let orderName: string;
  let domain: string;
  let plbTemplateShopDomain: string;
  let aliUrl: string;
  let productStoreID: number;
  let plusbasePage: DropshipCatalogPage;
  let plusbasePrivateRequestPage: PlusbasePrivateRequestPage;
  let orderPage: OrdersPage;
  let productPage: ProductPage;
  let confSaleOrder: SaleOrder;
  let productTemplateId: number;
  let unitPrice: number;
  let stockWareHouseId: number;
  let weight: number;
  let odooCountryId: number;
  let carrierIds: Array<number>;
  let rates = [];
  let odooService = OdooService(null);
  let plusbaseProductAPI, quotationInfo;
  let productName: string;
  let expectTotalCost: number;
  let expectShippingMethod: string;
  let checkoutAPI: CheckoutAPI;
  let productsCheckout: Array<Product>;
  let cardInfo: Card;
  let orderApi: OrderAPI;
  let checkoutInfos: CheckoutInfo;
  let paymentFeePercent, processingFeePercent: number;
  let adminToken: string;
  let plbDashboardPage: DashboardPage;
  let fulfillOrdersPage: FulfillmentPage;
  let countryCode: string;
  let shippingTypes: Array<string>;
  let defaultUrl: string;
  let sourcingCost: number;
  let sourcingShipping: number;
  let productAPI: ProductAPI;
  let accessToken: string;
  let plusHubAPI: PlusHubAPI;
  let stockPickingIdBefore: number;
  let productProductId: number;
  let sbProductId: number;
  let messageLoss: string;

  test.beforeEach(async ({ page, conf, odoo, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    plusbasePage = new DropshipCatalogPage(page, domain);
    productAPI = new ProductAPI(domain, authRequest);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(page, domain);
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    plbDashboardPage = new DashboardPage(page, domain);
    orderPage = new OrdersPage(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    productPage = new ProductPage(page, domain);
    fulfillOrdersPage = new FulfillmentPage(page, plbTemplateShopDomain);
    odooService = OdooService(odoo);

    messageLoss = conf.suiteConf.message_loss;
    unitPrice = conf.caseConf.unit_price;
    sourcingCost = conf.caseConf.x_product_cost;
    sourcingShipping = conf.caseConf.x_domestic_shipping;
    stockWareHouseId = conf.suiteConf.stock_warehouse_id;
    aliUrl = conf.caseConf.ali_url;
    odooCountryId = conf.caseConf.odoo_country_id;
    weight = conf.caseConf.weight;
    carrierIds = conf.caseConf.shipping_method_ids;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    confSaleOrder = {
      validity_date: conf.caseConf.expiration,
      x_minimum_order_quantity: conf.caseConf.minimun_order_quantity,
      x_minimum_order_value: conf.caseConf.minimun_order_value,
      x_estimated_delivery: conf.caseConf.estimated_delivery,
      x_quote_based_on: conf.caseConf.is_base_on_for_all_variants,
    };
    productName = conf.caseConf.product_name;
    expectShippingMethod = conf.caseConf.shipping_method;
    expectTotalCost = conf.caseConf.total_cost;
    productsCheckout = conf.caseConf.products_checkout;
    cardInfo = conf.caseConf.card_info;
    productTemplateId = conf.caseConf.sbcn_product_id;
    paymentFeePercent = conf.caseConf.payment_fee_percent;
    processingFeePercent = conf.caseConf.processing_fee_percent;
    countryCode = conf.caseConf.country_code;
    shippingTypes = conf.caseConf.shipping_types;
    defaultUrl = conf.caseConf.default_url;
    productProductId = conf.caseConf.product_product_id;

    adminToken = await plbDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });
  });

  test(`Verify total Ali sau khi SO created @SB_PLB_SUQ_6`, async ({}) => {
    await test.step(`Vào Dropship products > AliExpress products > Click button Add AliExpress product > Nhập link Ali > Click button Import AliExpress link   `, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);
      await expect(plusbasePage.page.locator(plusbasePage.xpathProductRequest)).toBeVisible();
    });

    await test.step(`Login vào Odoo > Sales > Search product > Verify total Ali trong tab Ali Price`, async () => {
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 20);
      expect(productTemplateId > 0).toEqual(true);
      const productShippingRates = await plusbasePage.getProductShippingRates(plusbaseProductAPI, productTemplateId);
      const variantShippingMethods = productShippingRates.variant_shipping_methods;
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotationInfo.length > 0).toEqual(true);
      await odooService.actionCancelThenSentToQuotationByProductId(productTemplateId);
      rates = await odooService.getShippingRates(quotationInfo[0]["id"]);
      rates.forEach(item => {
        const id = item.product_variant_id[0];
        const variantShippingMethod = variantShippingMethods[id];
        let firstItemPrice;
        // sort by first_item_price ASC
        const sortedShippingMethod = variantShippingMethod.sort((a, b) =>
          a.first_item_price < b.first_item_price ? -1 : 1,
        );
        // get first line ship in array by odoo_country_id
        sortedShippingMethod.forEach(i => {
          if (i.odoo_country_ids.includes(odooCountryId)) {
            firstItemPrice = i.first_item_price;
            return;
          }
        });
        const totalPrice = item.ali_cost + firstItemPrice;
        expect(isEqual(totalPrice, item.total_ali, 0.01)).toBe(true);
      });
    });
  });

  test(`Verify total PLB sau khi SO đã được config PLB cost và shipping fee @SB_PLB_SUQ_10`, async ({ conf }) => {
    await test.step(`Vào Dropship products > AliExpress products > Click button Add AliExpress product > Nhập link Ali > Click button Import AliExpress link   `, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);
      await expect(plusbasePage.page.locator(plusbasePage.xpathProductRequest)).toBeVisible();
    });

    await test.step(`Vào odoo > Sale > Product template > Search product theo link request > Click button Edit > Nhập thông tin product > click button "Save" `, async () => {
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 20);
      await odooService.actionCancelThenSentToQuotationByProductId(productTemplateId);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
      // update data product template
      await odooService.updateProductTemplate([productTemplateId], {
        x_warehouse_id: stockWareHouseId,
        x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        x_weight: weight,
      });
      const productTemplate = await odooService.getProductTemplatesById(productTemplateId);
      // verify update success
      const wareHouseId = productTemplate["x_warehouse_id"];
      const deliveryCarrierIds = productTemplate["x_delivery_carrier_type_ids"];
      const productWeight = productTemplate["x_weight"];
      expect(wareHouseId[0]).toEqual(stockWareHouseId);
      expect(deliveryCarrierIds.length).toEqual(carrierIds.length);
      expect(weight).toEqual(productWeight);
    });

    await test.step(`Sales > Vào SO detail > Edit > Click button Quotation sent`, async () => {
      await odooService.updateProductAndSentQuotationWithOptions(
        productTemplateId,
        {},
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
        false,
      );

      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
    });

    await test.step(`Verify total PLB trong tab Ali Price `, async () => {
      rates = await odooService.getShippingRates(quotationInfo[0]["id"]);
      const dataShipping = await odooService.getShippingDatas(productTemplateId, conf.caseConf.country_code);
      const firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      rates.forEach(i => {
        if (i.product_variant_id[0] == productProductId) {
          const totalPrice = unitPrice + firstItemPrice;
          expect(isEqual(totalPrice, i.total_plb, 0.01)).toBe(true);
        }
      });
    });
  });

  test(`Verify SO detail trên dashboard sau khi sent quotation nhưng chưa Notify to merchant @SB_PLB_SUQ_11`, async ({}) => {
    await test.step(`Vào Dropship products > AliExpress products > Click button Add AliExpress product > Nhập link Ali > Click button Import AliExpress link   `, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);
      await expect(plusbasePage.page.locator(plusbasePage.xpathProductRequest)).toBeVisible();
    });

    await test.step(`Verify data trong màn SO detail của product trên store`, async () => {
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      // auto cancel and sent to quotation
      await odooService.actionCancelThenSentToQuotationByProductId(productTemplateId);
      await plusbasePage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePage.waitForCrawlSuccess("Available");

      const productName = await plusbasePage.getProductNameInSODetail();
      expect(productName).toEqual(productName);
    });

    await test.step(`Login vào Odoo > Sales > Thực hiện send quotation `, async () => {
      // full flow sourcing
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
        false,
        true,
        true,
      );
      // verify after full flow sourcing
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
    });

    await test.step(`Verify data trong màn SO detail của product trên store`, async () => {
      await plusbasePage.goToProductRequest();
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      const productTemplate = await odooService.getProductTemplatesById(productTemplateId);
      // parse shipping fee crawl from ali
      const aliShipping = JSON.parse(productTemplate.x_platform_shipping_fee);
      const shipping = aliShipping[countryCode];
      // markup shipping
      const expectFirstItemPrice = Math.ceil(shipping.freight_amount) + 0.99;
      const expectAdditionalItemPrice = (expectFirstItemPrice + 0.01) / 2 + 0.01;
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      const shippingFeeFirstItem = removeCurrencySymbol(await plusbasePage.getShipping(2));
      const shippingFeeAdditionalItem = removeCurrencySymbol(await plusbasePage.getShipping(3));

      // verify shipping method, shipping cost, total cost in popup
      expect(shippingFeeFirstItem).toEqual(expectFirstItemPrice.toFixed(2));
      expect(shippingFeeAdditionalItem).toEqual(expectAdditionalItemPrice.toFixed(2));
    });
  });

  test(`Verify SO detail trên store merchant sau khi thực hiện action Notify to merchant @SB_PLB_SUQ_13`, async ({}) => {
    await test.step(`Vào Dropship products > AliExpress products > Request product Ali`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      // auto cancel quotation
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      if (productTemplateId > 0) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id"]);
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
      }

      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 20);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchWithKeyword(aliUrl);
      await plusbasePage.waitTabItemLoaded();
      expect(await plusbasePage.countSearchResult()).toEqual(1);
      const data = await plusbasePage.getDataOfFirstProductInList();
      expect(data.product_name).toContain(productName);
      expect(currencyToNumber(data.product_cost)).toBeGreaterThan(0);
    });

    await test.step(`Import product vào store`, async () => {
      sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productTemplateId);
      await productPage.goToProdDetailByID(domain, sbProductId);
      const visibleProductName = await productPage.isTextVisible(productName, 2, 10000);
      expect(visibleProductName).toEqual(true);
    });

    await test.step(`Vào Odoo thực hiện send Quotation > Notify to merchant`, async () => {
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
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
      const dataInPopUpShipping = await plusbasePage.getDataInPopUpShipping();
      const expectFirstItem = shipInfoTargetProduct.get(dataInPopUpShipping.shippingMethod).first_item_fee;
      const expectAdditionItem = shipInfoTargetProduct.get(dataInPopUpShipping.shippingMethod).additional_item_fee;

      // verify shipping method, shipping cost, total cost in popup
      expect(dataInPopUpShipping.shippingMethod).toEqual(expectShippingMethod);
      expect(dataInPopUpShipping.productCostAct).toEqual("From $" + unitPrice.toFixed(2));
      expect(dataInPopUpShipping.totalCostAct).toEqual("From $" + expectTotalCost);
      expect(dataInPopUpShipping.firstItem).toEqual("$" + expectFirstItem.toFixed(2));
      expect(dataInPopUpShipping.additionalItem).toEqual("$" + expectAdditionItem.toFixed(2));
    });

    await test.step(`Mở product admin detail trên dashboard > Verify product cost`, async () => {
      await productPage.goToProdDetailByID(domain, sbProductId);
      const getProductCost = await productPage.getDataTable(2, 2, 6);
      expect(getProductCost).toEqual(unitPrice.toString());

      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, sbProductId);
    });
  });

  test(`Verify alert shipping fee, basecost update trên product detail sau khi  Notify to merchant @SB_PLB_SUQ_21`, async ({}) => {
    await test.step(`Vào Odoo thực hiện update quotation và thực hiện sent Quotation, Notify to merchant`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 1);
      if (productTemplateId > 0) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id"]);
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
      }
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
      sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productTemplateId);
      // full flow sourcing
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
      // verify after flow sourcing
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, [
        "id",
        "state",
        "x_use_partner_price",
      ]);
      expect(quotationInfo.length > 0).toEqual(true);
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
      await plusbasePrivateRequestPage.clickSeeDetail();

      // get shipping method, shipping cost, total cost in popup
      const dataInPopUpShipping = await plusbasePage.getDataInPopUpShipping();
      const expectFirstItem = shipInfoTargetProduct.get(dataInPopUpShipping.shippingMethod).first_item_fee;
      const expectAdditionItem = shipInfoTargetProduct.get(dataInPopUpShipping.shippingMethod).additional_item_fee;

      // verify shipping method, shipping cost, total cost in popup
      expect(dataInPopUpShipping.shippingMethod).toEqual(expectShippingMethod);
      expect(dataInPopUpShipping.productCostAct).toEqual("From $" + unitPrice.toFixed(2));
      expect(dataInPopUpShipping.firstItem).toEqual("$" + expectFirstItem.toFixed(2));
      expect(dataInPopUpShipping.additionalItem).toEqual("$" + expectAdditionItem.toFixed(2));
    });

    await test.step(`Verify alert hiển thị trong product list, product detail`, async () => {
      await productPage.goToProdDetailByID(domain, sbProductId);
      const alertProductCostUpdate = await productPage.isTextVisible("Product cost and shipping fee have been updated");
      expect(alertProductCostUpdate).toEqual(true);
      await productPage.clickBackProductList();
      await productPage.searchProduct(productName);
      expect(await productPage.isTextVisible("Product cost & shipping fee have been updated")).toEqual(true);

      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, sbProductId);
    });
  });

  test(`Verity alert trên store merchant khi SO chưa sent quotation + đạt SO cap @SB_PLB_SUQ_25`, async ({
    context,
    authRequest,
    token,
    conf,
  }) => {
    let orderId: number;
    let shopToken: {
      id: number;
      access_token: string;
    };
    await test.step(`Pre conditions: cancel old quotation and request new quotation`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      if (productTemplateId > 0) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id"]);
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
      }
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 20);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
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
        false,
        false,
        true,
        true,
      );
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "x_is_cap"]);
      expect(quotationInfo.length > 0).toEqual(true);
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchWithKeyword(aliUrl);
      await plusbasePage.waitTabItemLoaded();
      await plusbasePage.importProductToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("networkidle");
      productStoreID = Number(await productPage.getProductIDByURL());
      shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      const variantId = await productPage.getVariantIdByAPI(
        authRequest,
        productStoreID,
        conf.caseConf.variant_name,
        accessToken,
      );
      productsCheckout[0].variant_id = variantId;
    });

    await test.step(`Thực hiện checkout `, async () => {
      // checkout with new variant
      const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfos).not.toBeUndefined();
      orderId = checkoutInfos.order.id;
    });

    await test.step(`Verify alert hiển thị trong product detail, SO detail trên store merchant`, async () => {
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      // wait set cap
      while (!quotationInfo[0]["x_is_cap"]) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "x_is_cap"]);
        await waitTimeout(3000);
      }
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      expect(await plusbasePrivateRequestPage.isTextVisible(messageLoss)).toEqual(true);
      await productPage.goToEditProductPage(productStoreID);
      expect(await productPage.isTextVisible(messageLoss)).toEqual(true);
      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, productStoreID);
    });
  });

  test(`Verify profit của order sau khi sent quotation nhưng chưa notify to merchant @SB_PLB_SUQ_17`, async ({
    conf,
    page,
    authRequest,
    multipleStore,
  }) => {
    const checkout = new SFCheckout(page, domain);
    let orderId: number;
    let totalOrder: number;
    let expectTotalShipping: number;
    const qtyCheckout = conf.caseConf.qty_checkout;
    //get first items, additional items
    await plbDashboardPage.loginWithToken(adminToken);
    await plusbasePage.goToProductRequestDetail(productTemplateId);
    const firstItemPrice = Number(removeCurrencySymbol(await plusbasePage.getShipping(2)));
    const additionalPrice = Number(removeCurrencySymbol(await plusbasePage.getShipping(3)));

    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );
    const homePage = new SFHome(page, domain);
    await homePage.gotoHomePage();
    await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
    await test.step(`Thực hiện checkout có tax exclude`, async () => {
      // Get stock picking ID before purchase
      plusHubAPI = new PlusHubAPI(plbTemplateShopDomain, authRequestTpl);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productName });
      const adminDashboardPage = new DashboardPage(page, domain);
      await adminDashboardPage.loginWithToken(adminToken);
      await appsAPI.actionEnableDisableApp("usell", false);

      const quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      //get first item, additionl item
      expect(firstItemPrice).toEqual(conf.caseConf.shipping_ali_first_item);
      expect(additionalPrice).toEqual(conf.caseConf.shipping_ali_add_item);
      expectTotalShipping = firstItemPrice + (qtyCheckout - 1) * additionalPrice;

      // checkout
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      const shippingFee = await checkoutAPI.getShippingFee();
      await checkout.completeOrderWithMethod("Shopbase payment");
      totalOrder = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      orderName = await checkout.getOrderNumber();
      orderId = await checkout.getOrderIdBySDK();
      expect(isEqual(shippingFee, expectTotalShipping, 0.01)).toBe(true);
    });

    await test.step(`Verify profit trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      await orderPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(conf.caseConf.ali_price * qtyCheckout);
      const shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      const totalDiscount = 0;
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      expect(shippingCost).toEqual(Number(expectTotalShipping.toFixed(2)));
      const taxInclude = 0;
      const tip = 0;

      orderPage.calculateProfitPlusbase(
        totalOrder,
        subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        tip,
      );
      const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
      expect(profitActual).toEqual(Number(orderPage.profit.toFixed(2)));
    });

    await test.step(`Login vào shop template >Search order > Approve order > PlusHub > Chọn order > Click Fulfill selected order`, async () => {
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      const orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await orderTemplatePage.fulfillOrderPlusBase();
      fulfillOrdersPage = new FulfillmentPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await fulfillOrdersPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Awaiting stock", 15)).toEqual(true);
    });

    await test.step(`Login vào Odoo > Inventory > Receipts > Done DO-in `, async () => {
      await fulfillOrdersPage.navigateToMenuPlusHub("Warehouse");
      // Get stock picking ID after purchase
      const stockPickingId = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productName,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });
      let doInState = await odooService.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("assigned");
      await odooService.doneStockPicking(stockPickingId);
      doInState = await odooService.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("done");
    });

    await test.step(`Vào Inventory > Delivery order > Search DO của order theo order name > Check available > Validate`, async () => {
      const stockPickingIds = await odooService.getStockPickingIds(orderName, "out", conf.suiteConf.owner_id, 20);
      const stockPickingId = stockPickingIds[0];
      let doOutState = await odooService.getStockPickingState(stockPickingId);
      if (doOutState === "confirmed") {
        await odooService.checkAvailabilityStockPicking(stockPickingId);
      }
      doOutState = await odooService.getStockPickingState(stockPickingId);
      expect(doOutState).toEqual("assigned");
      await odooService.doneStockPicking(stockPickingId);
      doOutState = await odooService.getStockPickingState(stockPickingId);
      expect(doOutState).toEqual("done");
    });
  });

  test(`Verify profit của order sau khi SO được Notify to merchant @SB_PLB_SUQ_18`, async ({ conf }) => {
    let orderId: number;
    let expectTotalShipping: number;
    await test.step(`Thực hiện checkout có tax exclude`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      const shipInfoTargetProduct = await odooService.updateThenGetShippingDatas(
        productTemplateId,
        shippingTypes,
        countryCode,
      );
      const expectFirstItem = shipInfoTargetProduct.get(expectShippingMethod).first_item_fee;
      expect(expectFirstItem).toEqual(conf.caseConf.shipping_first_item);
      const expectAdditionItem = shipInfoTargetProduct.get(expectShippingMethod).additional_item_fee;
      expect(expectAdditionItem).toEqual(conf.caseConf.shipping_add_item);
      // calculate total shipping fee
      expectTotalShipping = expectFirstItem + (productsCheckout[0].quantity - 1) * expectAdditionItem;
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderId = checkoutInfos.order.id;
      expect(isEqual(checkoutInfos.totals.shipping_fee, expectTotalShipping, 0.01)).toBe(true);
    });

    await test.step(`Verify profit trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      await orderPage.clickShowCalculation();
      const productCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(productCost).toEqual(conf.caseConf.unit_price * productsCheckout[0].quantity);
      expect(removeCurrencySymbol(await orderPage.getShippingCost())).toEqual(expectTotalShipping.toFixed(2));
      await orderPage.verifyOrderInfo(checkoutInfos.totals, paymentFeePercent, processingFeePercent, {
        profit: true,
        revenue: true,
        handlingFee: true,
        paidByCustomer: false,
        paymentFee: true,
        processingFee: true,
      });
    });
  });

  test(`Verify alert trên store merchant sau khi SO đã được sent quotation + đạt SO cap + bị loss @SB_PLB_SUQ_29`, async ({
    authRequest,
    token,
    context,
    conf,
  }) => {
    let orderIdFirstStep: number;
    let orderIdSecondStep: number;
    let shopToken: {
      id: number;
      access_token: string;
    };
    await test.step(`Pre conditions: cancel old quotation and request new quotation`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      if (productTemplateId > 0) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id"]);
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
      }
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.addProductRequest(aliUrl);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 20);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
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
        { price_unit: unitPrice, x_product_cost: sourcingCost, x_domestic_shipping: sourcingShipping },
        true,
        false,
        true,
        true,
      );
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, [
        "id",
        "state",
        "x_use_partner_price",
      ]);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchWithKeyword(aliUrl);
      await plusbasePage.waitTabItemLoaded();
      await plusbasePage.importProductToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("networkidle");
      productStoreID = Number(await productPage.getProductIDByURL());
      //get access token
      shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      const variantId = await productPage.getVariantIdByAPI(
        authRequest,
        productStoreID,
        conf.caseConf.variant_name,
        accessToken,
      );
      productsCheckout[0].variant_id = variantId;
    });

    await test.step(`Thực hiện checkout 100 order`, async () => {
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderIdFirstStep = checkoutInfos.order.id;
      await orderApi.getOrderProfit(orderIdFirstStep, "plusbase", true);
    });

    await test.step(`Verity alert hiển thị ở product detail, product list, SO detail trên store merchant`, async () => {
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      const currentAlertSoCapInSoDetail = await plusbasePrivateRequestPage.isTextVisible(messageLoss);
      expect(currentAlertSoCapInSoDetail).toEqual(false);
      await productPage.goToEditProductPage(productStoreID);
      const currentAlertSoCapInProductDetail = await productPage.isTextVisible(messageLoss);
      expect(currentAlertSoCapInProductDetail).toEqual(false);
    });

    await test.step(`Thực hiện checkout 100 order`, async () => {
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfos).not.toBeUndefined();
      orderIdSecondStep = checkoutInfos.order.id;
      await orderApi.getOrderProfit(orderIdSecondStep, "plusbase", true);
      // wait set cap
      while (!quotationInfo[0]["x_is_cap"]) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "x_is_cap"]);
        await waitTimeout(3000);
      }
    });

    await test.step(`Verity alert hiển thị ở product detail, product list, SO detail trên store merchant`, async () => {
      await expect(async () => {
        await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
        expect(await plusbasePrivateRequestPage.isTextVisible(messageLoss)).toEqual(true);
      }).toPass();
      await productPage.goToEditProductPage(productStoreID);
      expect(await productPage.isTextVisible(messageLoss)).toEqual(true);
      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, productStoreID);
    });
  });
});
