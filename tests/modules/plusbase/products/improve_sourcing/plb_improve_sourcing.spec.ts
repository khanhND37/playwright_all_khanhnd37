import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import type { SaleOrder } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { Card, Product } from "@types";
import { OrderAPI } from "@pages/api/order";
import { CheckoutAPI } from "@pages/api/checkout";
import { removeCurrencySymbol } from "@utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFProduct } from "@pages/storefront/product";
import { SFHome } from "@pages/storefront/homepage";
import { OcgLogger } from "@core/logger";
import { CheckoutInfo } from "./check_out_paypal";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Plb improve sourcing", async () => {
  let adminToken: string;
  let plbDashboardPage: DashboardPage;
  let domain: string;
  let plusbasePage: DropshipCatalogPage;
  let aliUrl: string;
  let carrierIds: Array<number>;
  let stockWareHouseId: number;
  let linkDrive: string;
  let etaProcessingTime: number;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let odooService: OdooServiceInterface;
  let productWeight: number;
  let plusbasePrivateRequestPage: PlusbasePrivateRequestPage;
  let productId: number;
  let confSaleOrder: SaleOrder;
  let unitPrice: number;
  let productCostRmb: number;
  let shippingCostRmb: number;
  let baseOnAllVariants: boolean;
  let productCost: number;
  let productPage: ProductPage;
  let productsCheckout: Array<Product>;
  let checkoutAPI: CheckoutAPI;
  let cardInfo: Card;
  let checkoutOrderId: number;
  let orderApi: OrderAPI;
  let orderPage: OrdersPage;
  let quotationId: number;
  let productProductId: number;
  let firstItemPrice: number;
  let additionalItemPrice: number;
  let defaultUrl: string;
  let sbProductId: number;

  test.beforeEach(async ({ page, conf, odoo, authRequest }) => {
    // Skip all case on prodtest env
    if (process.env.ENV === "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out);

    domain = conf.suiteConf.domain;
    plbDashboardPage = new DashboardPage(page, domain);
    plusbasePage = new DropshipCatalogPage(page, domain);
    aliUrl = conf.caseConf.ali_url;
    stockWareHouseId = conf.caseConf.stock_warehouse_id;
    carrierIds = conf.caseConf.shipping_method_ids;
    linkDrive = conf.caseConf.link_drive;
    etaProcessingTime = conf.caseConf.eta_processing_time;
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    odooService = OdooService(odoo);
    productWeight = conf.caseConf.weight;
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(page, domain);
    confSaleOrder = {
      validity_date: conf.caseConf.expiration,
      x_minimum_order_quantity: conf.caseConf.minimun_order_quantity,
      x_minimum_order_value: conf.caseConf.minimun_order_value,
      x_estimated_delivery: conf.caseConf.estimated_delivery,
      x_quote_based_on: conf.caseConf.is_base_on_for_all_variants,
      payment_term_id: conf.caseConf.payment_term_id,
    };
    unitPrice = conf.caseConf.unit_price;
    productCostRmb = conf.caseConf.product_cost_rmb;
    shippingCostRmb = conf.caseConf.shipping_cost_rmb;
    baseOnAllVariants = conf.caseConf.base_on_all_variants;
    productCost = conf.caseConf.product_cost;
    productPage = new ProductPage(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    cardInfo = conf.caseConf.card_info;
    productsCheckout = conf.caseConf.products_checkout;
    orderApi = new OrderAPI(domain, authRequest);
    orderPage = new OrdersPage(page, domain);
    productProductId = conf.caseConf.product_product_id ? conf.caseConf.product_product_id : 0;
    defaultUrl = conf.suiteConf.default_url;

    adminToken = await plbDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });

    // request ali product
    await plbDashboardPage.loginWithToken(adminToken);
    // ignore old quotation
    const currentProductId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 1);
    if (currentProductId > 0 && productProductId == 0) {
      const currentQuotationInfo = await odooService.getQuotationByProductId(currentProductId, ["id"]);
      await odooService.updateProductTemplateXUrl(currentProductId, defaultUrl);
      await odooService.cancelQuotation(currentQuotationInfo[0]["id"], 1);
    }

    await plusbasePage.goToImportAliexpressProductPage();
    await plusbasePage.fillUrlToRequestProductTextArea(aliUrl);
    await plusbasePage.clickImportAliexpressLink();
    expect(plusbasePage.page.url()).toContain("aliexpress-products");
    productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
    expect(productId > 0).toEqual(true);
    await plusbasePrivateRequestPage.goToProductRequestDetail(productId);
    // Wait shipping loaded before verify
    await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
  });

  test(`@SB_SBFF_IS_28 Verify sync data sang các SO chưa được chuyển sang trạng thái sent`, async ({}) => {
    await test.step(`Điền đủ các thông tin trong tab sourcing infor  > Click Save`, async () => {
      // update data product template
      await odooService.updateProductTemplate([productId], {
        x_warehouse_id: stockWareHouseId,
        x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        x_weight: productWeight,
        eta_processing_time: etaProcessingTime,
        link_drive: linkDrive,
      });

      const productTemplate = await odooService.getProductTemplatesById(productId);
      // verify update success
      expect(stockWareHouseId).toEqual(productTemplate["x_warehouse_id"][0]);
      expect(carrierIds.length).toEqual(productTemplate["x_delivery_carrier_type_ids"].length);
      expect(productWeight).toEqual(productTemplate["x_weight"]);
      expect(linkDrive).toEqual(productTemplate["link_drive"]);
      expect(etaProcessingTime).toEqual(productTemplate["eta_processing_time"]);
    });
    await test.step(`Click button sync`, async () => {
      const res = await odooService.syncToQuotation(productId);
      expect(res.params.message).toEqual("Successfully");
    });
    await test.step(`Vào màn SO detail > Verify các data được sync sang SO detail `, async () => {
      const quotationInfo = await odooService.getQuotationByProductId(productId);
      const productVariant = await odooService.getProductVariantsByProductTemplateId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["x_estimated_delivery"]).toEqual(etaProcessingTime);
      expect(quotationInfo[0]["order_line"].length).toEqual(productVariant.length);
    });
  });

  test(`@SB_SBFF_IS_29 Verify sync data sang các SO đã được sent mà product có thay đổi`, async ({}) => {
    await test.step(`Vào Tab Sourcing info > Điền đầy đủ thông tin, Click checkbox All variant have the same cost > Click  Save`, async () => {
      // update data product template
      await odooService.updateProductTemplate([productId], {
        x_warehouse_id: stockWareHouseId,
        x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        x_weight: productWeight,
        eta_processing_time: etaProcessingTime,
        link_drive: linkDrive,
        base_on_variants: baseOnAllVariants,
      });

      const productVariants = await odooService.getProductVariantsByProductTemplateId(productId);
      const productVariantIds = [];
      productVariants.forEach(item => {
        productVariantIds.push(item.id);
      });

      await odooService.updateProductAndSentQuotationWithOptions(
        productId,
        {},
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: confSaleOrder.payment_term_id,
        },
        { price_unit: unitPrice },
        true,
        false,
        false,
        false,
      );

      await odooService.updateProductVariant(productVariantIds, {
        product_cost_rmb: productCostRmb,
        shipping_cost_rmb: shippingCostRmb,
        product_cost: productCost,
      });

      const productTemplate = await odooService.getProductTemplatesById(productId);
      // verify update success
      expect(stockWareHouseId).toEqual(productTemplate["x_warehouse_id"][0]);
      expect(carrierIds.length).toEqual(productTemplate["x_delivery_carrier_type_ids"].length);
      expect(productWeight).toEqual(productTemplate["x_weight"]);
      expect(linkDrive).toEqual(productTemplate["link_drive"]);
      expect(etaProcessingTime).toEqual(productTemplate["eta_processing_time"]);

      const quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
    });
    await test.step(`Click "Sync to quotation"`, async () => {
      const res = await odooService.syncToQuotation(productId);
      expect(res.params.message).toEqual("Successfully");
    });
    await test.step(`Vào màn SO detail > Click Sent quotation > Verify các data được sync sang SO`, async () => {
      const quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["x_estimated_delivery"]).toEqual(etaProcessingTime);
      expect(quotationInfo[0]["x_quote_based_on"]).toEqual(baseOnAllVariants);
      expect(quotationInfo[0]["order_line"].length).toEqual(1);
      const quotationLine = await odooService.getSaleOrderLineBySaleOrderId(quotationInfo[0]["id"]);
      expect(quotationLine[0]["x_product_cost"]).toEqual(productCostRmb);
      expect(quotationLine[0]["x_domestic_shipping"]).toEqual(shippingCostRmb);
      expect(quotationLine[0]["price_unit"]).toEqual(productCost);
    });
  });

  test(`@SB_SBFF_IS_30 Verify sync data sang các SO đã được notify mà product có thay đổi`, async () => {
    await test.step(`Vào Tab Sourcing info > Import thông tin, Click checkbox All variant have the same cost> Click  Save`, async () => {
      // update data product template
      await odooService.updateProductTemplate([productId], {
        x_warehouse_id: stockWareHouseId,
        x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        x_weight: productWeight,
        eta_processing_time: etaProcessingTime,
        link_drive: linkDrive,
        base_on_variants: baseOnAllVariants,
      });

      const productVariants = await odooService.getProductVariantsByProductTemplateId(productId);
      const productVariantIds = [];
      productVariants.forEach(item => {
        productVariantIds.push(item.id);
      });

      await odooService.updateProductAndSentQuotationWithOptions(
        productId,
        {},
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: confSaleOrder.payment_term_id,
        },
        { price_unit: unitPrice },
        true,
        true,
        true,
        false,
      );

      await odooService.updateProductVariant(productVariantIds, {
        product_cost_rmb: productCostRmb,
        shipping_cost_rmb: shippingCostRmb,
        product_cost: productCost,
      });

      const productTemplate = await odooService.getProductTemplatesById(productId);
      // verify update success
      expect(stockWareHouseId).toEqual(productTemplate["x_warehouse_id"][0]);
      expect(carrierIds.length).toEqual(productTemplate["x_delivery_carrier_type_ids"].length);
      expect(productWeight).toEqual(productTemplate["x_weight"]);
      expect(linkDrive).toEqual(productTemplate["link_drive"]);
      expect(etaProcessingTime).toEqual(productTemplate["eta_processing_time"]);
      expect(etaProcessingTime).toEqual(productTemplate["eta_processing_time"]);
      expect(baseOnAllVariants).toEqual(productTemplate["base_on_variants"]);

      const quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      expect(quotationInfo[0]["x_use_partner_price"]).toEqual(false);
    });
    await test.step(`Click "Sync to quotation"`, async () => {
      const res = await odooService.syncToQuotation(productId);
      expect(res.params.message).toEqual("Successfully");
    });
    await test.step(`Vào màn SO detail > Verify các data được sync sang SO`, async () => {
      const quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["x_estimated_delivery"]).toEqual(etaProcessingTime);
      expect(quotationInfo[0]["x_quote_based_on"]).toEqual(baseOnAllVariants);
      expect(quotationInfo[0]["order_line"].length).toEqual(1);
      const quotationLine = await odooService.getSaleOrderLineBySaleOrderId(quotationInfo[0]["id"]);
      expect(quotationLine[0]["x_product_cost"]).toEqual(productCostRmb);
      expect(quotationLine[0]["x_domestic_shipping"]).toEqual(shippingCostRmb);
      expect(quotationLine[0]["price_unit"]).toEqual(productCost);
    });
  });

  test(`@SB_SBFF_IS_31 Verify sync data không thành công sang Product template detail khi quotation thay đổi`, async ({
    authRequest,
    token,
    conf,
  }) => {
    await test.step(`Vào màn SO detail  > Thay đổi thông tin > Save`, async () => {
      await odooService.updateProductAndSentQuotationWithOptions(
        productId,
        {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
          x_weight: productWeight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: confSaleOrder.payment_term_id,
        },
        {
          price_unit: unitPrice,
          x_product_cost: productCostRmb,
          x_domestic_shipping: shippingCostRmb,
        },
        false,
        false,
        false,
        true,
      );
    });
    await test.step(`Vào Product template detail của SO > Verify data trong tab Sourcing info`, async () => {
      const productTemplate = await odooService.getProductTemplatesById(productId);
      // verify update success
      expect(stockWareHouseId).toEqual(productTemplate["x_warehouse_id"][0]);
      expect(carrierIds.length).toEqual(productTemplate["x_delivery_carrier_type_ids"].length);
      expect(productWeight).toEqual(productTemplate["x_weight"]);

      expect(productTemplate["eta_processing_time"]).toEqual(0);
      expect(productTemplate["base_on_variants"]).toEqual(false);

      const productVariants = await odooService.getProductVariantsByProductTemplateId(productId);
      expect(productVariants.length > 0).toEqual(true);
      expect(productVariants[0].product_cost == unitPrice).toEqual(false);
      expect(productVariants[0].product_cost_rmb == productCostRmb).toEqual(false);
      expect(productVariants[0].shipping_cost_rmb == shippingCostRmb).toEqual(false);
    });
    await test.step(`Vào màn SO detail  > Thực hiện Sent quotation`, async () => {
      let quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      await odooService.updateQuotationAndQuickSentQuotation(quotationInfo[0]["id"], {}, true, true, true);
      quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
    });
    await test.step(`Vào dashboard shop merchant > Thực hiện import to store`, async () => {
      sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productId);
      await productPage.goToProdDetailByID(domain, sbProductId);
      const shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessToken = shopToken.access_token;
      const productVariantId = await productPage.getVariantIdByAPI(
        authRequest,
        sbProductId,
        conf.caseConf.variant_name,
        accessToken,
      );
      productsCheckout[0].variant_id = productVariantId;
      expect(productVariantId > 0).toEqual(true);
    });
    await test.step(`Lên storefront > Thực hiện checkout order`, async () => {
      const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfos).not.toBeUndefined();
      checkoutOrderId = checkoutInfos.order.id;
      expect(checkoutOrderId > 0).toEqual(true);
    });
    await test.step(`Vào order detail > Verify product cost, shipping cost`, async () => {
      await orderPage.goToOrderByOrderId(checkoutOrderId);
      await orderApi.getOrderProfit(checkoutOrderId, "plusbase", true);
      await orderPage.page.reload();
      await orderPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(unitPrice * productsCheckout[0].quantity);

      //get first item, additionl item
      const dataShipping = await odooService.getShippingDatas(
        productId,
        conf.suiteConf.odoo_country_id,
        productProductId,
      );
      firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      expect(shippingCost).toEqual(firstItemPrice + additionalItemPrice * (productsCheckout[0].quantity - 1));
    });
  });

  test(`@SB_SBFF_IS_32 Verify sent SO khi product đã được config shipping type = AliExpress`, async ({
    conf,
    token,
    authRequest,
  }) => {
    //get of first item, additional item
    firstItemPrice = Number(removeCurrencySymbol(await plusbasePage.getShipping(2)));
    additionalItemPrice = Number(removeCurrencySymbol(await plusbasePage.getShipping(3)));

    await test.step(`Chọn Sales > Product template detail  >  Config Shipping type > Save`, async () => {
      await odooService.updateProductTemplate([productId], {
        x_warehouse_id: stockWareHouseId,
        x_delivery_carrier_type_ids: [[6, false, carrierIds]],
      });
    });
    await test.step(`Vào màn SO detail > Sent quotations`, async () => {
      let quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      await odooService.updateQuotationAndQuickSentQuotation(quotationInfo[0]["id"], {}, true, false, true, true);
      quotationInfo = await odooService.getQuotationByProductId(productId);
      expect(quotationInfo.length > 0).toEqual(true);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      expect(quotationInfo[0]["x_use_partner_price"]).toEqual(true);
      quotationId = quotationInfo[0]["id"];
    });
    await test.step(`Vào dashboard shop merchant > Thực hiện import to store > Thực hiện checkout order`, async () => {
      sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productId);
      await productPage.goToProdDetailByID(domain, sbProductId);
      const shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessToken = shopToken.access_token;
      const productVariantId = await productPage.getVariantIdByAPI(
        authRequest,
        sbProductId,
        conf.caseConf.variant_name,
        accessToken,
      );
      productsCheckout[0].variant_id = productVariantId;
      expect(productVariantId > 0).toEqual(true);

      const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfos).not.toBeUndefined();
      checkoutOrderId = checkoutInfos.order.id;
      expect(checkoutOrderId > 0).toEqual(true);
    });
    await test.step(`Vào order detail > Verify basecost và shipping`, async () => {
      await orderPage.goToOrderByOrderId(checkoutOrderId);
      await orderApi.getOrderProfit(checkoutOrderId, "plusbase", true);
      await orderPage.page.reload();
      await orderPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));

      // get shipping rates in quotation detail from odoo
      const rates = await odooService.getShippingRates(quotationId);
      let expectBaseCost;
      rates.forEach(i => {
        if (i.product_variant_id[0] == productProductId) {
          expectBaseCost = i.ali_cost;
        }
      });
      expect(baseCost).toEqual(expectBaseCost);
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      expect(shippingCost).toEqual(firstItemPrice + additionalItemPrice * (productsCheckout[0].quantity - 1));
    });
  });
});

test.describe("Bật/tắt PalPal", async () => {
  let adminToken: string;
  let plbDashboardPage: DashboardPage;
  let domain: string;
  let odooService: OdooServiceInterface;
  let checkoutAPI: CheckoutAPI;
  let productSFPage: SFProduct;
  let sfCheckout: SFCheckout;
  const logger = OcgLogger.get();

  test.beforeEach(async ({ page, conf, odoo, authRequest }) => {
    // Skip all case on prodtest env
    if (process.env.ENV === "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out);

    domain = conf.suiteConf.domain;
    plbDashboardPage = new DashboardPage(page, domain);
    odooService = OdooService(odoo);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    sfCheckout = new SFCheckout(page, domain);

    adminToken = await plbDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });
    await plbDashboardPage.loginWithToken(adminToken);
  });

  test(`@SB_SBFF_IS_55 Verify không hiển thị payment method PayPal khi tick chọn hight risk trong tab sourcing infor`, async ({
    page,
    conf,
    scheduler,
  }) => {
    let scheduleData: CheckoutInfo;
    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as CheckoutInfo;
    } else {
      logger.info("Init default object");
      scheduleData = {
        checkoutToken: null,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }
    await test.step(`Vào Tab Sourcing info > Click Edit > Click  checkbox High risk product >  Click Save`, async () => {
      // update data product template
      if (scheduleData.checkoutToken != null) {
        return;
      }
      await odooService.updateProductTemplate([conf.caseConf.product_id], {
        is_high_risk_product: true,
      });
    });

    await test.step(`Vào SF > Search product > Mở product detail > Verify button Buy with PayPal > Thực hiện checkout > Verify payment method > Vào product template > Bỏ tick high risk > Verify SF`, async () => {
      if (scheduleData.checkoutToken == null) {
        const homePage = new SFHome(page, domain);
        productSFPage = await homePage.gotoProductDetailByHandle(
          conf.caseConf.product_handle,
          conf.caseConf.product_name,
        );
        await productSFPage.page.waitForLoadState("load");
        await expect(productSFPage.page.locator(productSFPage.xpathBtnBuyWithPaypal)).toBeHidden();
        await checkoutAPI.addProductToCartThenCheckout([
          {
            variant_id: conf.caseConf.variant_id,
            quantity: 1,
          },
        ]);
        await checkoutAPI.openCheckoutPageByToken();
        await sfCheckout.enterShippingAddress(conf.caseConf.customer_info);
        expect(sfCheckout.xpathPaymentMethodLabel).toBeTruthy();
        scheduleData.checkoutToken = sfCheckout.page.url();
        await expect(sfCheckout.paypalBlockLoc).toBeHidden();

        // update lại data product template: bỏ tick high risk
        await odooService.updateProductTemplate([conf.caseConf.product_id], {
          is_high_risk_product: false,
        });
        await sfCheckout.page.reload();

        await scheduler.schedule({ mode: "later", minutes: 5 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
      }
      await sfCheckout.page.goto(scheduleData.checkoutToken);
      expect(sfCheckout.xpathPaymentMethodLabel).toBeTruthy();
      await expect(sfCheckout.paypalBlockLoc).toBeTruthy();
      logger.info("Clear scheduling");
      await scheduler.clear();
    });
  });
});
