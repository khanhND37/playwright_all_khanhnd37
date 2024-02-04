import { expect } from "@core/fixtures";
import type { ProductLevels, ProductTemplate, ValueLineItem } from "@types";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { ProductPage } from "@pages/dashboard/products";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductAPI } from "@pages/api/product";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";

let plusbaseProductAPI: PlusbaseProductAPI;
let tokenShopTemplate: { access_token: string };
let dataProductLevel: number[];
let processingRate: number;
let domain: string;
let productPage: ProductPage;
let productTemplateIds: number[];
let odooService;
let productAPI: ProductAPI;
let productSbId: number;
let taxRates: number[];
let ordersPage: OrdersPage;

test.beforeAll(async ({ conf, token, authRequest, odoo }) => {
  plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
  tokenShopTemplate = await token.getWithCredentials({
    domain: conf.suiteConf.domain_template,
    username: conf.suiteConf.username_template,
    password: conf.suiteConf.password_template,
  });
  odooService = OdooService(odoo);
  productTemplateIds = conf.suiteConf.product_template_ids;
  productSbId = conf.suiteConf.product_sb_id;
  taxRates = conf.suiteConf.tax_rates;
});
test.beforeEach(async ({ conf, dashboard, authRequest }) => {
  domain = conf.suiteConf.domain;
  productPage = new ProductPage(dashboard, domain);
  ordersPage = new OrdersPage(dashboard, domain);
  productAPI = new ProductAPI(domain, authRequest);
});

test.describe("Improve dynamic processing fee with product level", async () => {
  test(`@SB_PLB_PLB-UD-PR_SPL_94 Verify processing rate default khi product không thỏa mãn điều kiện của tất cả các level`, async ({
    conf,
    page,
  }) => {
    await test.step("Vào odoo > sales > products > Search product > get total point của product > Verify proceesing rate of product template", async () => {
      let productTemplate: ProductTemplate = await odooService.getProductTemplatesById(productTemplateIds[0]);
      const isCheckUseAliExpress = productTemplate.x_use_aliexpress_rating;
      if (!isCheckUseAliExpress) {
        await odooService.updateProductTemplate([productTemplateIds[0]], {
          x_use_aliexpress_rating: true,
        });
        productTemplate = await odooService.getProductTemplatesById(productTemplateIds[0]);
      }
      const totalPoint = productTemplate.x_ali_express_point;
      const processingRateActual = productTemplate.x_ali_processing_rate;
      const levelActual = productTemplate.x_ali_product_level;
      dataProductLevel = await plusbaseProductAPI.getBiggestProductLevel(
        Number(totalPoint),
        conf.suiteConf.domain_template,
        tokenShopTemplate.access_token,
      );
      expect(processingRateActual).toEqual(dataProductLevel[0] * 100);
      expect(levelActual).toEqual(dataProductLevel[1]);
    });

    await test.step("Vào store merchant > Dropship products > AliExpress products > Search product > Vào SO detail > Verify hiển thị processing rate > ", async () => {
      const dataProduct = await plusbaseProductAPI.getShippingRate({ product_id: productTemplateIds[0] });
      processingRate = dataProduct.processing_fee_rate;
      expect(processingRate).toEqual(dataProductLevel[0]);
      const dataProductDetail = await productAPI.getDataProductById(productSbId);
      expect(dataProductDetail.product.processing_rate).toEqual(processingRate * 100);
    });

    await test.step("Go to storefront > add to cart > checkout > vào order detail > verify profit", async () => {
      const paymentFeeRate = conf.suiteConf.payment_fee_rate;
      const checkout = new SFCheckout(page, domain, "");
      const infoOrder = await checkout.createStripeOrder(
        conf.caseConf.product_info.name,
        conf.caseConf.product_info.quantity,
        conf.suiteConf.customer_info,
        conf.suiteConf.discount_code,
      );

      const orderId = infoOrder.orderId;
      const ordersPage = new OrdersPage(productPage.page, domain);
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();
      const orderSummary = await ordersPage.getOrderSummaryInOrderDetail();
      const profit = ordersPage.calculateProfitPlusbase(
        infoOrder.totalSF,
        orderSummary.subtotal,
        orderSummary.discount,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        orderSummary.shipping_fee,
        conf.suiteConf.tax_include,
        orderSummary.tip,
        paymentFeeRate,
        processingRate,
      );
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
    });
  });

  test(`@SB_PLB_PLB-UD-PR_SPL_98 Verify processing rate của product khi config level cho product template trên odoo, không dùng AliExpress`, async ({
    conf,
    page,
  }) => {
    await test.step("Vào odoo > Sale > Product > Search product > config level cho product template > Verify processing rate của product trên store merchant ", async () => {
      const levels: Array<ProductLevels> = await plusbaseProductAPI.getAllProductLevels(
        conf.suiteConf.domain_template,
        tokenShopTemplate.access_token,
      );
      let levelId = 0;
      for (const level of levels) {
        const rulesAliExpress = level.rules.ali_express;
        if (level.is_enable === 1 && rulesAliExpress.is_enable == false) {
          processingRate = level.processing_fee;
          levelId = level.level;
          break;
        }
      }

      // lấy level[0] nếu không có level nào có rulesAliExpress.is_enable == false
      if (levelId === 0) {
        levelId = levels[0].level;
        processingRate = levels[0].processing_fee;
      }
      await odooService.updateProductTemplate([productTemplateIds[1]], {
        x_product_level_list: `${levelId}`,
        x_use_aliexpress_rating: false,
      });
      const dataProduct = await plusbaseProductAPI.getShippingRate({ product_id: productTemplateIds[1] });
      const actualProcessingRate = dataProduct.processing_fee_rate;
      expect(processingRate).toEqual(actualProcessingRate);
    });

    await test.step("Go to storefront > add to cart > checkout > vào order detail > verify profit", async () => {
      const paymentFeeRate = conf.suiteConf.payment_fee_rate;
      const checkout = new SFCheckout(page, domain, "");
      const infoOrder = await checkout.createStripeOrder(
        conf.caseConf.product_info.name,
        conf.caseConf.product_info.quantity,
        conf.suiteConf.customer_info,
        conf.suiteConf.discount_code,
      );

      const orderId = infoOrder.orderId;
      const ordersPage = new OrdersPage(productPage.page, domain);
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();
      const orderSummary = await ordersPage.getOrderSummaryInOrderDetail();
      const profit = ordersPage.calculateProfitPlusbase(
        infoOrder.totalSF,
        orderSummary.subtotal,
        orderSummary.discount,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        orderSummary.shipping_fee,
        conf.suiteConf.tax_include,
        orderSummary.tip,
        paymentFeeRate,
        processingRate,
      );
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
    });
  });
});

test.describe("Improve dynamic processing fee with product level", async () => {
  const caseName = "SB_PLB_PLB-UD-PR_SPL_100";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      product_infos: productInfos,
      shipping_types: shippingTypes,
      country_code: countryCode,
      product_checkout: productCheckout,
      shipping_checkout: shippingCheckout,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ page, authRequestWithExchangeToken }) => {
        const productTemplateIds = conf.suiteConf.product_template_ids;
        const shippingData = [];
        let orderId: number;

        // get shipping cost
        for (const product of productTemplateIds) {
          const dataShipping = await odooService.updateThenGetShippingDatas(product, [shippingTypes], countryCode);
          const shippingCost = dataShipping.get(shippingCheckout);
          shippingData.push(shippingCost.first_item_fee);
        }

        const checkout = new SFCheckout(page, conf.suiteConf.domain);

        await test.step("Search product > add to cart > Checkout", async () => {
          const infoOrder = await checkout.createStripeOrderMultiProduct(
            conf.suiteConf.customer_info,
            conf.suiteConf.discount,
            productCheckout,
            conf.suiteConf.card_info,
          );
          orderId = infoOrder.orderId;
          expect(await checkout.page.locator(checkout.xpathThankYou).textContent()).toEqual("Thank you!");
        });
        await test.step(" Vào order detail > Verify processing fee của order", async () => {
          await ordersPage.goToOrderByOrderId(orderId);
          await ordersPage.waitForProfitCalculated();
          const authRequestNew = await authRequestWithExchangeToken.changeToken();
          const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequestNew);
          const orderSummary = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

          const shippingCostPOD = productInfos[1].shipping_cost;
          shippingData.push(shippingCostPOD);
          let totalProcessingFee = 0;
          for (const productInfo of productInfos) {
            let index = 0;
            //calculate value: total, subtotal, discount, markup shipping, tax, tip of line item
            const valueByLineItem: ValueLineItem = await ordersPage.calculateValueByLineItem(
              productInfo.selling_price,
              taxRates[productInfo.index_tax_rate],
              productInfo.shipping_fee,
              orderSummary.tip,
              conf.suiteConf.is_tax_exclude,
              productCheckout.length,
              Number(productCheckout[index].quantity),
              orderSummary.shipping_fee,
              orderSummary.shipping_cost,
              conf.suiteConf.discount_info,
              checkout,
            );
            const profit = ordersPage.calculateProfitPlusbase(
              valueByLineItem.totalByLineItem,
              valueByLineItem.subtotalByLineItem,
              valueByLineItem.discountByLineItem,
              productInfo.base_cost,
              shippingData[productInfo.index_shipping_cost],
              valueByLineItem.markupShippingByLineItem + shippingData[productInfo.index_shipping_cost],
              valueByLineItem.taxIncludeByLineItem,
              valueByLineItem.tipByLineItem,
              conf.suiteConf.payment_fee_rate,
              productInfo.processing_rate,
            );
            totalProcessingFee = profit.processingFee + totalProcessingFee;
            index++;
          }

          expect(isEqual(totalProcessingFee, orderSummary.processing_fee, 0.01)).toEqual(true);
        });
      });
    },
  );
});
