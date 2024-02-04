import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import type {
  AliexpressProductListItem,
  OdooProductTemplate,
  CheckoutInfo,
  OdooSaleOrderUpdateReq,
  ShippingData,
} from "@types";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { OrdersPage } from "@pages/dashboard/orders";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { CheckoutAPI } from "@pages/api/checkout";
import { ProductTemplate } from "@services/odoo/product_template";
import { removeCurrencySymbol, roundingTwoDecimalPlaces } from "@core/utils/string";
import { OdooService } from "@services/odoo";
import { SaleOrder as OdooSaleOrder } from "@services/odoo/sale_order";

test.describe("Private request", async () => {
  let domain: string;
  let product: AliexpressProductListItem;
  let shippingTypes: string[];
  let countryCode: string;
  let dataShipping: Map<string, ShippingData>;
  let odooService;

  test.beforeEach(async ({ conf, odoo }) => {
    test.setTimeout(conf.suiteConf.timeout);
    domain = conf.suiteConf.domain;
    shippingTypes = conf.suiteConf.shipping_types;
    countryCode = conf.suiteConf.country_code;
    odooService = OdooService(odoo);
  });

  test(`Verify báo giá cho product private request @SB_PLB_CTL_PR_45`, async ({
    dashboard,
    conf,
    authRequest,
    odoo,
    context,
  }) => {
    let odooProduct: OdooProductTemplate;
    let sellingPrice: string;
    let profitMargin: number;
    const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(dashboard, domain);
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    const productTemplateService = new ProductTemplate(odoo);

    await test.step(`Vào Private request > Click button Create product request > Add link > Click button Send request`, async () => {
      // Clear product before request
      await plusbasePrivateRequestPage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: conf.caseConf.url,
        odoo_partner_id: conf.suiteConf.odoo_partner_id,
        cancel_reason_id: conf.suiteConf.cancel_reason_id,
        skip_if_not_found: true,
        not_ali: true,
      });

      await plusbasePrivateRequestPage.goToPrivateRequest();
      await plusbasePrivateRequestPage.clickOnBtnWithLabel("Create product request");
      await plusbasePrivateRequestPage.fillLinkRequestProduct(conf.caseConf.url);
      await plusbasePrivateRequestPage.sendRequestProduct();

      await plusbasePrivateRequestPage.waitTabItemLoaded();
      await plusbasePrivateRequestPage.searchWithKeyword(conf.caseConf.url);

      // Validate product data
      const itemContent = await plusbasePrivateRequestPage.getDataOfFirstProductInList();
      expect(itemContent.img_src).toContain("product_thumb");
      expect(itemContent.product_name).toEqual("Untitled product name");
      expect(itemContent.product_status).toEqual("Processing");
      expect(itemContent.product_cost).toEqual("Update later");

      product = await plusbasePrivateRequestPage.getPrivateProductByUrl(plusbaseProductAPI, conf.caseConf.url, true);
      expect(product.id).toBeGreaterThan(0);
      expect(product.quotation_id).toBeGreaterThan(0);
    });
    await test.step(`Vào odoo > Sale > Product template > Search product theo link request > Verify product template detail`, async () => {
      // check product template
      odooProduct = await productTemplateService.getProductTemplateById(product.id);
      expect(odooProduct.id).toEqual(product.id);
      expect(odooProduct.name).toEqual(conf.caseConf.url);
      expect(odooProduct.x_url).toEqual(conf.caseConf.url);
      expect(odooProduct.x_is_custom_request).toEqual(true);
      expect(odooProduct.x_is_plus_base).toEqual(true);
    });
    await test.step(`Click button Edit > Nhập thông tin product > click button "Save"`, async () => {
      await productTemplateService.updateProductTemplateById(product.id, {
        name: conf.caseConf.product_name,
        x_delivery_carrier_type_ids: [[6, false, conf.caseConf.delivery_carrier_ids]],
        x_warehouse_id: conf.caseConf.warehouse_id,
        x_weight: 0.05,
        attribute_line_ids: [
          [
            0, // create new attribute will create new variant
            null,
            { attribute_id: conf.caseConf.attribute_id, value_ids: [[6, null, conf.caseConf.arrtibute_value_ids]] },
          ],
        ],
      });
    });
    await test.step(`Vào SO detail > Nhập thông tin cho SO > click button "Send by email"`, async () => {
      await odooService.sentQuotationForPrivateProduct(odoo, {
        product_tmpl_id: odooProduct.id,
        quotation_id: product.quotation_id,
        price_unit: conf.caseConf.price_unit,
      });
    });
    await test.step(`Vào shop dashboard > Mở SO detail`, async () => {
      countryCode = conf.suiteConf.country_code;
      shippingTypes = conf.suiteConf.shipping_types;
      dataShipping = await odooService.updateThenGetShippingDatas(product.id, shippingTypes, countryCode);
      const shippingFee = dataShipping.get(conf.caseConf.shipping_names[0]);
      await plusbasePrivateRequestPage.goToQuotationDetail(product.id);

      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");

      const shippingData = await plusbasePrivateRequestPage.getShippingsInQuotationDetailPage();
      expect(shippingData.shippings.map(i => i.shipping_method).sort()).toEqual(conf.caseConf.shipping_names.sort());

      const productCost = await plusbasePrivateRequestPage.getProductCost();
      expect(productCost).toEqual(conf.caseConf.price_unit);

      sellingPrice = await plusbasePrivateRequestPage.getSellingPrice();
      const sellingPriceExpect = await plusbasePrivateRequestPage.calculatorSellingPrice(productCost);
      expect(sellingPrice).toEqual(sellingPriceExpect);

      profitMargin = await plusbasePrivateRequestPage.getProfitMargin();
      const profitMarginExpect = await plusbasePrivateRequestPage.calculatorProfitMargin(
        shippingFee.first_item_fee,
        conf.caseConf.processing_rate,
        productCost,
      );
      expect(profitMargin.toString()).toEqual(profitMarginExpect);

      const totalCost = await plusbasePrivateRequestPage.getTotalCost();
      const totalCostExpect = await plusbasePrivateRequestPage.calculatorTotalCost(
        shippingFee.first_item_fee,
        productCost,
      );
      expect(totalCost).toEqual(totalCostExpect);
    });
    await test.step(`Click button "import product to store" > click button "Edit product"`, async () => {
      await plusbasePrivateRequestPage.clickBtnImportToStore();
      await plusbasePrivateRequestPage.importFirstProductToStore();
      await plusbasePrivateRequestPage.waitProductImportSuccess(conf.caseConf.product_name);

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await plusbasePrivateRequestPage.clickOnBtnWithLabel("Edit product"),
      ]);
      await newPage.waitForLoadState("load");

      const newProductPage = new ProductPage(newPage, domain);
      expect(await newProductPage.getProductName()).toEqual(conf.caseConf.product_name);

      const variants = await newProductPage.getDataVariant();
      expect(variants.length).toEqual(conf.caseConf.arrtibute_value_ids.length);
      for (const variant of variants) {
        expect(removeCurrencySymbol(variant[3])).toEqual(sellingPrice);
        expect(removeCurrencySymbol(variant[4])).toEqual(conf.caseConf.price_unit.toString());
      }

      const shipping = await newProductPage.getDataShippingV2();
      expect(shipping.shippings.map(i => i.shipping_method).sort()).toEqual(conf.caseConf.shipping_names.sort());
      expect(
        removeCurrencySymbol(
          shipping.shippings.filter(i => i.shipping_method === "Standard Shipping")[0].shipping_est_profit,
        ),
      ).toEqual(profitMargin.toString());

      await newProductPage.deleteProductInProductDetail();
    });
  });

  test(`Verify checkout product private request @SB_PLB_CTL_PR_46`, async ({ dashboard, conf, authRequest }) => {
    let checkoutInfo: CheckoutInfo;
    const dashboardPage = new DashboardPage(dashboard, domain);
    const orderPage = new OrdersPage(dashboard, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
    dataShipping = await odooService.updateThenGetShippingDatas(conf.caseConf.product_id, shippingTypes, countryCode);
    await test.step(`Mở Storefront > Add product to cart > Checkout > Nhập customer information`, async () => {
      await checkoutAPI.addProductToCartThenCheckout([
        {
          variant_id: conf.caseConf.sb_variant_id,
          quantity: 1,
        },
      ]);

      const shippingMethods = await checkoutAPI.getShippingMethodInfo("US");
      expect(shippingMethods.length).toEqual(conf.caseConf.shipping_methods.length);
      for (const expectShipping of conf.caseConf.shipping_methods) {
        const matchShippings = shippingMethods.filter(i => i.method_title === expectShipping.name);
        expect(matchShippings.length).toEqual(1);
        expect(roundingTwoDecimalPlaces(matchShippings[0].amount)).toEqual(
          dataShipping.get(expectShipping.name).first_item_fee,
        );
      }

      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod("US");
    });
    await test.step(`Nhập thông tin thanh toán > Complete order`, async () => {
      await checkoutAPI.authorizedThenCreateStripeOrder(conf.suiteConf.card_info);
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
    });
    await test.step(`Verify order detail`, async () => {
      await dashboardPage.goto("admin/orders");
      await orderPage.searchOrder(checkoutInfo.order.name);
      await orderPage.goToOrderDetailSBase(checkoutInfo.order.name);
      expect(await orderPage.getPaymentStatus()).toEqual("Authorized");
      expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Unfulfilled");

      const orderSummary = await orderPage.getOrderSummaryInOrderDetail();
      expect(orderSummary.subtotal).toEqual(conf.caseConf.order_summary.sub_total);
      expect(orderSummary.total - orderSummary.tax_amount).toEqual(
        conf.caseConf.order_summary.sub_total + dataShipping.get("Standard Shipping").first_item_fee,
      );
      expect(orderSummary.shipping_fee).toEqual(dataShipping.get("Standard Shipping").first_item_fee);
    });
  });

  test(`Verify báo giá Expiration < date now @SB_PLB_CTL_PR_50`, async ({ odoo, dashboard }) => {
    const saleOrder = new OdooSaleOrder(odoo);
    const updateSoReq: OdooSaleOrderUpdateReq = {
      validity_date: "2021-01-01",
    };
    await test.step(`update quotation expiration < date now`, async () => {
      await saleOrder.updateSaleOrderById(product.quotation_id, updateSoReq);
    });

    await test.step(`Vào dashboad shop > Private request > Search SO > Vào SO detail > Verify SO`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(dashboard, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(product.id);

      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.page.waitForSelector(
        plusbasePrivateRequestPage.getXpathWithLabel("Shipping information"),
      );
      expect(await plusbasePrivateRequestPage.isTextVisible("This quotation has expired")).toBeTruthy();
      expect(await plusbasePrivateRequestPage.isTextVisible("Expired")).toBeTruthy();
      await plusbasePrivateRequestPage.page
        .locator(plusbasePrivateRequestPage.getXpathWithLabel("Import to your store"))
        .isDisabled();
    });
  });

  test(`Verify cancel quotation @SB_PLB_CTL_PR_51`, async ({ dashboard }) => {
    await test.step(`Login odoo > Sale > Search SO > Vào SO detail > Cancel SO`, async () => {
      await odooService.cancelQuotation(product.quotation_id, 3);
    });

    await test.step(`Vào dashboad shop > Private request > Search SO > Vào SO detail > Verify SO`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(dashboard, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(product.id);

      // Wait timeline loaded before verify
      await plusbasePrivateRequestPage.page.waitForSelector(plusbasePrivateRequestPage.getXpathWithLabel("Timeline"));

      expect(await plusbasePrivateRequestPage.isTextVisible("No Result")).toBeTruthy();
      expect(await plusbasePrivateRequestPage.isTextVisible("Shipping information")).toBeFalsy();
      expect(await plusbasePrivateRequestPage.isTextVisible("Variants")).toBeFalsy();
      expect(await plusbasePrivateRequestPage.isTextVisible("Import to your store")).toBeFalsy();
    });
  });
});
