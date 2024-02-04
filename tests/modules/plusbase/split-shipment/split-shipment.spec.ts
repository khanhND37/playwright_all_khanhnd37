import { OdooService, OdooServiceInterface } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { expect } from "@playwright/test";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrderAPI } from "@pages/api/order";
import { Order, OrderSummary } from "@types";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";
import { isEqual } from "@core/utils/checkout";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { ProductAPI } from "@pages/api/product";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { SFHome } from "@pages/storefront/homepage";

let domain: string;
let plusbasePage: DropshipCatalogPage;
let odooService: OdooServiceInterface;
let productId: number;
let variants: Array<Array<string>>;
let splitDescription: string;
let dashboardPage: DashboardPage;
let plusbasePrivateRequestPage: PlusbasePrivateRequestPage;
let checkoutAPI: CheckoutAPI;
let orderPage, orderTemplatePage: OrdersPage;
let firstItemPrice, firstItemPriceMarkup, additionalItemPrice, additionalItemPriceMarkup: number;
let orderApi: OrderAPI;
let orderInfo: Order;
let emailBuyer;
let shippingAddress;
let shippingFee: number;
let checkout: SFCheckout;
let orderSummary: OrderSummary;
let plbTemplateDashboardPage: DashboardPage;
let orderId: number;
let plbTemplateShopDomain: string;
let fulfillOrdersPage: FulfillmentPage;
let orderName: string;
let splitPack, splitPackOfVarriant: number;
let productAPI: ProductAPI;
let totalItems: number;
let shippingCost: number;
let homePage: SFHome;

test.describe("Verify UI split shipment", async () => {
  test.beforeEach(async ({ page, dashboard, conf, odoo }) => {
    domain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, domain);
    plusbasePage = new DropshipCatalogPage(dashboardPage.page, domain);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(page, domain);
    odooService = OdooService(odoo);
    productId = conf.caseConf.product_id;
    variants = conf.caseConf.varriants;
    splitDescription = conf.caseConf.split_description;
  });

  test(`@SB_PLB_SPS_29 Verify hiển thị split shipment trong màn Aliexpress Product khi product đã được config split shipment`, async ({}) => {
    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Vào SO detail`, async () => {
      await plusbasePage.goToProductRequestDetail(productId);
      expect(await plusbasePage.isTextVisible("Split shipments")).toBeTruthy();
    });

    await test.step(`Click chọn từng variant > Verify split shipment hiển thị`, async () => {
      const packageRuleQuantity = await odooService.getProductVariantsByProductTemplateId(productId, [
        "x_fulfillment_package_rule_max_quantity",
      ]);
      for (let i = 0; i < variants.length; i++) {
        await plusbasePage.selectVariantByTitle(variants[i]);
        expect((await plusbasePage.getSplitShipment()).split("")[0]).toEqual(
          `${packageRuleQuantity[i].x_fulfillment_package_rule_max_quantity}`,
        );
        expect(splitDescription).toEqual(await plusbasePage.getSplitDescription());
      }
    });
  });

  test(`@SB_PLB_SPS_30 Verify hiển thị split shipment trong màn Catalog khi product đã được config split shipment`, async ({}) => {
    await test.step(`Vào menu "Dropship Products" > Vào "Catalog" > Vào SO detail`, async () => {
      await plusbasePage.goToProductCatalogDetailById(productId);
      expect(await plusbasePage.isTextVisible("Split shipments")).toBeTruthy();
    });

    await test.step(`Click chọn từng variant > Verify split shipment hiển thị`, async () => {
      const packageRuleQuantity = await odooService.getProductVariantsByProductTemplateId(productId, [
        "x_fulfillment_package_rule_max_quantity",
      ]);
      for (let i = 0; i < variants.length; i++) {
        await plusbasePage.selectVariantByTitle(variants[i]);
        expect((await plusbasePage.getSplitShipment()).split("")[0]).toEqual(
          `${packageRuleQuantity[i].x_fulfillment_package_rule_max_quantity}`,
        );
        expect(splitDescription).toEqual(await plusbasePage.getSplitDescription());
      }
    });
  });

  test(`@SB_PLB_SPS_31 Verify hiển thị split shipment trong màn Private khi product đã được config split shipment`, async ({}) => {
    await test.step(`Vào menu "Dropship Products" > Vào "Catalog" > Search product > Vào SO detail > Click chọn từng variant > Verify split shipment hiển thị`, async () => {
      await plusbasePrivateRequestPage.goToQuotationDetail(productId);
      expect(await plusbasePrivateRequestPage.isTextVisible("Split shipments")).toBeTruthy();
    });

    await test.step(`Click chọn từng variant > Verify split shipment hiển thị`, async () => {
      const packageRuleQuantity = await odooService.getProductVariantsByProductTemplateId(productId, [
        "x_fulfillment_package_rule_max_quantity",
      ]);
      for (let i = 0; i < variants.length; i++) {
        await plusbasePrivateRequestPage.selectVariantByTitle(variants[i]);
        expect((await plusbasePrivateRequestPage.getSplitShipment()).split("")[0]).toEqual(
          `${packageRuleQuantity[i].x_fulfillment_package_rule_max_quantity}`,
        );
        expect(splitDescription).toEqual(await plusbasePrivateRequestPage.getSplitDescription());
      }
    });
  });

  test(`@SB_PLB_SPS_28 Verify hiển thị split shipment trong SO detail khi không config split shipment trên odoo`, async ({
    conf,
  }) => {
    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Search product > Vào SO detail > Click chọn từng variant > Verify split shipment hiển thị`, async () => {
      await plusbasePage.goToProductRequestDetail(productId);
      expect(await plusbasePage.isTextVisible("Split shipments")).toBeTruthy();
    });

    await test.step(`Click chọn từng variant > Verify split shipment hiển thị`, async () => {
      const variantIds = await odooService.getProductVariantIdsByProductId(productId, true);
      const dataWeightProductVariants = await odooService.getVariantInforByIds(variantIds, ["x_variant_weight"]);
      const dataRules = await odooService.getPriceRuleDatas([conf.caseConf.rules_id]);
      for (let i = 0; i < variants.length; i++) {
        await plusbasePage.selectVariantByTitle(variants[i]);
        const maxQuantity = Math.floor(
          parseFloat(dataRules[0].name.split("<=")[1]) / dataWeightProductVariants[i].x_variant_weight,
        );
        expect(parseInt((await plusbasePage.getSplitShipment()).replace(/\D/g, ""))).toEqual(Number(`${maxQuantity}`));
        expect(splitDescription).toEqual(await plusbasePage.getSplitDescription());
      }
    });
  });
});

test.describe("Verify công thức tính split shipment", async () => {
  test.beforeEach(async ({ page, dashboard, authRequest, multipleStore, conf, odoo }) => {
    test.setTimeout(conf.suiteConf.timeout);
    domain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    dashboardPage = new DashboardPage(dashboard, domain);
    plusbasePage = new DropshipCatalogPage(dashboardPage.page, domain);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(page, domain);
    odooService = OdooService(odoo);
    productId = conf.caseConf.product_id;
    variants = conf.caseConf.varriants;
    splitDescription = conf.caseConf.split_description;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    emailBuyer = conf.suiteConf.email_buyer;
    shippingAddress = conf.suiteConf.customer_info;
    homePage = new SFHome(page, domain);

    checkout = new SFCheckout(page, domain);
    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );
    plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
    orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    fulfillOrdersPage = new FulfillmentPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    productAPI = new ProductAPI(domain, authRequest);
  });

  const caseName = "SB_PLB_SPS_32";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      product_id: productId,
      product_tmpl_id: productTmplId,
      products_checkout: productsCheckout,
      product_product_id: productProductId,
      odoo_country: odooCountry,
      is_combo: isCombo,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ authRequest }) => {
        //get first item, additionl item
        const dataShipping = await odooService.getShippingDatas(productTmplId, odooCountry, productProductId);
        firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
        additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;

        await test.step(`Vào SF > Search product > Add to cart > Check out > Verify shipping fee`, async () => {
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
          await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
          await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
          await checkoutAPI.openCheckoutPageByToken();
          const res = await checkoutAPI.getShippingMethodInfo("US");
          shippingFee = res[0].amount;
          const packageRuleQuantity = await odooService.getProductVariantsByProductTemplateId(productTmplId, [
            "x_fulfillment_package_rule_max_quantity",
          ]);
          let totalItems = productsCheckout[0].quantity;
          if (isCombo) {
            const res = await productAPI.countComboInProduct(productId);
            const variantInCombo: object = res.combo_option_values;
            const itemsCombo: Array<string> = Object.entries(variantInCombo)[0][1];
            totalItems = productsCheckout[0].quantity + Number(itemsCombo[0].match(/\d+/)[0]);
          }
          splitPack = Math.ceil(totalItems / packageRuleQuantity[0].x_fulfillment_package_rule_max_quantity);
          expect(shippingFee).toEqual(splitPack * firstItemPrice + additionalItemPrice * (totalItems - splitPack));
        });

        await test.step(`Complete order > Vào order detail order vừa tạo > Verify shipping cost và profit của order`, async () => {
          const plbOrder = new PlusbaseOrderAPI(domain, authRequest);
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithMethod("Shopbase payment");
          expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
          orderSummary = await checkout.getOrderSummaryInfo();
          orderId = await checkout.getOrderIdBySDK();
          orderName = await checkout.getOrderName();
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.waitForProfitCalculated();
          await orderApi.getOrderProfit(orderId, "plusbase", true);
          orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
          const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
          expect(shippingCost).toEqual(shippingFee);
          let taxInclude = 0;
          if (orderInfo.is_tax_include) {
            taxInclude = orderInfo.tax_amount;
          }
          orderPage.calculateProfitPlusbase(
            orderSummary.totalPrice,
            orderSummary.subTotal,
            Math.abs(orderInfo.discount),
            orderInfo.base_cost,
            orderInfo.shipping_cost,
            orderInfo.shipping_fee,
            taxInclude,
            orderSummary.tippingVal,
          );
          expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
        });

        await test.step(`Vào dashboard store template > Order > Vào order detail > Thực hiện approve order > Click PlusHub > Thực hiện fulfill `, async () => {
          await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
          await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
          expect(await orderTemplatePage.getApproveStatus()).toEqual("Approved");
          await orderTemplatePage.clickOnBtnWithLabel("PlusHub");
          await orderTemplatePage.page.waitForLoadState("networkidle");
          await fulfillOrdersPage.removeFilterOrderPlusBase();
          let isCheck = false;
          let i = 0;
          while (!isCheck && i < 3) {
            await fulfillOrdersPage.navigateToFulfillmentTab("To fulfill");
            await fulfillOrdersPage.clickFulfillSelectedOrder();
            await fulfillOrdersPage.clickOnBtnWithLabel("Confirm");
            isCheck = await fulfillOrdersPage.isTextVisible("You have no order that needs to fulfill yet.");
            i++;
          }
          await fulfillOrdersPage.page.waitForLoadState("networkidle");
          await fulfillOrdersPage.page.reload();
          await fulfillOrdersPage.removeFilterOrderPlusBase();
          expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Awaiting stock", 10)).toEqual(true);
          await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
          await expect(async () => {
            expect(await orderTemplatePage.countLineFulfillment()).toEqual(splitPack);
          }).toPass();
          const paidByCustomer = await orderTemplatePage.getPaidByCustomer();
          expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummary.totalPrice, 0.01)).toBe(true);
        });
      });
    },
  );
});

test.describe("Verify công thức tính split shipment khi markup shipping", async () => {
  test.beforeAll(async ({ authRequest }) => {
    // Turn on marrkup shipping
    const shippingSettingAPI = new SettingShippingAPI(conf.suiteConf.domain, authRequest);
    const listShippingZones = await shippingSettingAPI.getListShippingZone();
    const usSettingZone = listShippingZones.find(sz => {
      return sz.countries.some(c => (c.code = "US"));
    });
    usSettingZone.is_disabled = false;
    await shippingSettingAPI.updateShippingZone(usSettingZone);
    firstItemPriceMarkup = usSettingZone.item_based_shipping_rate[0].first_item_price;
    additionalItemPriceMarkup = usSettingZone.item_based_shipping_rate[0].additional_item_price;
  });
  test.beforeEach(async ({ page, authRequest, multipleStore, conf, odoo, dashboard }) => {
    domain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    dashboardPage = new DashboardPage(dashboard, domain);
    plusbasePage = new DropshipCatalogPage(dashboardPage.page, domain);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(page, domain);
    odooService = OdooService(odoo);
    variants = conf.caseConf.varriants;
    splitDescription = conf.caseConf.split_description;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    emailBuyer = conf.suiteConf.email_buyer;
    checkout = new SFCheckout(page, domain);
    homePage = new SFHome(page, domain);
    productId = conf.caseConf.product_id;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );
    plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
    orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    fulfillOrdersPage = new FulfillmentPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    productAPI = new ProductAPI(domain, authRequest);
  });

  test.afterAll(async ({ authRequest }) => {
    // Turn off marrkup shipping
    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);
    const listShippingZones = await shippingSettingAPI.getListShippingZone();
    const usSettingZone = listShippingZones.find(sz => {
      return sz.countries.some(c => (c.code = "US"));
    });
    usSettingZone.is_disabled = true;
    await shippingSettingAPI.updateShippingZone(usSettingZone);
  });

  const caseName = "SB_PLB_SPS_36";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      product_id: productId,
      product_tmpl_id: productTmplId,
      products_checkout: productsCheckout,
      product_product_id: productProductId,
      odoo_country: odooCountry,
      is_combo: isCombo,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ authRequest }) => {
        //get first item, additionl item in odoo
        const dataShipping = await odooService.getShippingDatas(productTmplId, odooCountry, productProductId);
        firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
        additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;

        await test.step(`Vào SF > Search product > Thực hiện checkout order > Verify shipping fee`, async () => {
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
          await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
          await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
          await checkoutAPI.openCheckoutPageByToken();
          const res = await checkoutAPI.getShippingMethodInfo("US");
          shippingFee = res[0].amount;
          const packageRuleQuantity = await odooService.getProductVariantsByProductTemplateId(productTmplId, [
            "x_fulfillment_package_rule_max_quantity",
          ]);

          //caculate shipping fee markup
          let itemInCombo = 0;
          const productQuantity = productsCheckout[0].quantity;
          const maxQuantity = packageRuleQuantity[0].x_fulfillment_package_rule_max_quantity;
          const calculateShippingFee = (firstItemQty, additionalItemQty) =>
            Number((firstItemQty * firstItemPriceMarkup + additionalItemQty * additionalItemPriceMarkup).toFixed(2));

          if (isCombo) {
            const resBody = await productAPI.countComboInProduct(productId);
            const variantCombo = resBody.combo_option_values && Object.values(resBody.combo_option_values)[0];
            itemInCombo = Number(variantCombo[0]?.match(/\d+/)?.[0]);
            splitPackOfVarriant = Math.ceil(productQuantity / maxQuantity);
          }
          totalItems = productQuantity + itemInCombo;
          splitPack = Math.ceil(totalItems / maxQuantity);

          const shippingFeeActual = isCombo
            ? calculateShippingFee(
              splitPackOfVarriant + 1,
              productQuantity - splitPackOfVarriant + productsCheckout[1].quantity - 1,
            )
            : calculateShippingFee(splitPack, totalItems - splitPack);
          expect(shippingFee).toEqual(shippingFeeActual);
        });

        await test.step(`Vào order detail order vừa tạo > Verify shipping cost > Verify profit của order `, async () => {
          const plbOrder = new PlusbaseOrderAPI(domain, authRequest);
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithMethod(paymentMethod);
          expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
          orderSummary = await checkout.getOrderSummaryInfo();
          orderId = await checkout.getOrderIdBySDK();
          orderName = await checkout.getOrderName();
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.waitForProfitCalculated();
          await orderApi.getOrderProfit(orderId, "plusbase", true);
          orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
          shippingCost = splitPack * firstItemPrice + additionalItemPrice * (totalItems - splitPack);
          expect(shippingCost).toEqual(Number(removeCurrencySymbol(await orderPage.getShippingCost())));
          let taxInclude = 0;
          if (orderInfo.is_tax_include) {
            taxInclude = orderInfo.tax_amount;
          }
          orderPage.calculateProfitPlusbase(
            orderSummary.totalPrice,
            orderSummary.subTotal,
            Math.abs(orderInfo.discount),
            orderInfo.base_cost,
            orderInfo.shipping_cost,
            orderInfo.shipping_fee,
            taxInclude,
            orderSummary.tippingVal,
          );
          expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
        });

        await test.step(`Vào dashboard store template > Order > Vào order detail > Thực hiện approve order > Click PlusHub > Thực hiện fulfill `, async () => {
          await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
          await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
          expect(await orderTemplatePage.getApproveStatus()).toEqual("Approved");
          await orderTemplatePage.clickOnBtnWithLabel("PlusHub");
          await orderTemplatePage.page.waitForLoadState("networkidle");
          await fulfillOrdersPage.removeFilterOrderPlusBase();
          let isCheck = false;
          let i = 0;
          while (!isCheck && i < 3) {
            await fulfillOrdersPage.navigateToFulfillmentTab("To fulfill");
            await fulfillOrdersPage.clickFulfillSelectedOrder();
            await fulfillOrdersPage.clickOnBtnWithLabel("Confirm");
            isCheck = await fulfillOrdersPage.isTextVisible("You have no order that needs to fulfill yet.");
            i++;
          }
          await fulfillOrdersPage.page.waitForLoadState("networkidle");
          await fulfillOrdersPage.page.reload();
          await fulfillOrdersPage.removeFilterOrderPlusBase();
          expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Awaiting stock", 10)).toEqual(true);
          await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
          await expect(async () => {
            expect(await orderTemplatePage.countLineFulfillment()).toEqual(splitPack);
          }).toPass();
          const paidByCustomer = await orderTemplatePage.getPaidByCustomer();
          expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummary.totalPrice, 0.01)).toBe(true);
        });
      });
    },
  );
});
