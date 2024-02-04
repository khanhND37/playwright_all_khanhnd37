import { expect, request } from "@core/fixtures";
import { AppsAPI } from "@pages/api/apps";
import { SFCheckout } from "@pages/storefront/checkout";
import type { Discount, Order, OrderAfterCheckoutInfo, OrderSummary, ShippingAddress, ShippingData } from "@types";
import { test } from "@fixtures/odoo";
import { OdooService } from "@services/odoo";
import { SFApps } from "@pages/storefront/apps";
import { removeCurrencySymbol, roundingTwoDecimalPlaces } from "@core/utils/string";
import { isEqual } from "@core/utils/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFProduct } from "@pages/storefront/product";
import { SFHome } from "@sf_pages/homepage";

let shopDomain: string;
let plbTemplateShopDomain: string;
let targetQuantity: string;
let recommendQuantity: string;
let targetShip: number;
let recommendPrice: number;
let recommendComparePrice: number;
let targetPrice: number;
let recommedShip: number;
let productTargetId: number;
let productRecommendId: number;
let defaultShippingType: Array<string>;
let shippingAddress: ShippingAddress;
let shipInforTargetProduct: Map<string, ShippingData>;
let shipInforRecommendProduct: Map<string, ShippingData>;
let homePage: SFHome;

let offerMessage: string;
let offerTitle: string;
let offerDiscount: Discount;
let offerDiscountShipping: Discount;

let sfCheckoutPage: SFCheckout;
let orderAfterCheckoutInfo: OrderAfterCheckoutInfo;
let productTargetName: string;
let productRecommendName: string;
let priceAfterDiscount: number;
let orderSummary: OrderSummary;
let orderInfo: Order;
let adminToken: string;
let plbToken: string;
let dashboardAPI: DashboardAPI;
let plusbaseOrderAPI: PlusbaseOrderAPI;

test.describe("Auto upsell PLB", () => {
  test.beforeEach(async ({ conf, odoo, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    productTargetId = conf.caseConf.product_target_id;
    productTargetName = conf.caseConf.product_target.name;
    targetQuantity = conf.caseConf.product_target.quantity;
    productRecommendId = conf.caseConf.product_recommend_id;
    productRecommendName = conf.caseConf.products_recommended.name;
    recommendQuantity = conf.caseConf.products_recommended.quantity;
    defaultShippingType = conf.suiteConf.default_shipping_type;
    shippingAddress = conf.suiteConf.shipping_address;
    targetPrice = conf.caseConf.product_target.price;
    recommendPrice = conf.caseConf.products_recommended.price;
    recommendComparePrice = conf.caseConf.products_recommended.compare_price;

    offerMessage = conf.caseConf.offer_message;
    offerTitle = conf.caseConf.offer_title;
    offerDiscount = conf.caseConf.offer_discount;
    offerDiscountShipping = conf.caseConf.offer_discount_shipping;

    dashboardAPI = new DashboardAPI(shopDomain, authRequest);
    homePage = new SFHome(page, shopDomain);
    await homePage.gotoHomePage();
    await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
    // Setting tax calculation
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: conf.caseConf.tax_include });

    // Deactive all offer on shop template setting auto upsell
    const context = await request.newContext();
    const appsAPI = new AppsAPI(conf.suiteConf.plb_template_upsell.domain, context);
    const dashboardTplUpsellPage = new DashboardPage(page, conf.suiteConf.plb_template_upsell.domain);
    const tplToken = await dashboardTplUpsellPage.getAccessToken({
      shopId: conf.suiteConf.plb_template_upsell.shop_id,
      userId: conf.suiteConf.plb_template_upsell.user_id,
      baseURL: conf.suiteConf.api,
      username: conf.suiteConf.plb_template_upsell.username,
      password: conf.suiteConf.plb_template_upsell.password,
    });
    const offerList = await appsAPI.getListOfferAutoUpSell(tplToken);
    const offerIds = offerList.map(offer => offer.id);
    await appsAPI.actionForOfferAutoUpSell(offerIds, "activated", "false", tplToken);
    // Active offers use run automation on shop template setting auto upsell
    await appsAPI.actionForOfferAutoUpSell(conf.caseConf.offer_id, "activated", "true", tplToken);

    const odooService = OdooService(odoo);
    // Update shipping type then get ship information for target product
    shipInforTargetProduct = await odooService.updateThenGetShippingDatas(
      productTargetId,
      conf.caseConf.product_target.shipping_type,
      shippingAddress.country_code,
    );

    targetShip = shipInforTargetProduct.get(conf.caseConf.product_target.shipping_method).first_item_fee;
    if (Number(targetQuantity) > 1) {
      targetShip +=
        shipInforTargetProduct.get(conf.caseConf.product_target.shipping_method).additional_item_fee *
        (Number(targetQuantity) - 1);
    }
    // Update shipping type then get ship information for recommended product
    shipInforRecommendProduct = await odooService.updateThenGetShippingDatas(
      productRecommendId,
      conf.caseConf.products_recommended.shipping_type,
      shippingAddress.country_code,
    );
    recommedShip = shipInforRecommendProduct.get(conf.caseConf.products_recommended.shipping_method).first_item_fee;
    if (Number(recommendQuantity) > 1) {
      recommedShip +=
        shipInforRecommendProduct.get(conf.caseConf.products_recommended.shipping_method).additional_item_fee *
        (Number(recommendQuantity) - 1);
    }
    const dashboardPage = new DashboardPage(page, shopDomain);
    adminToken = await dashboardPage.getAccessToken({
      shopId: conf.suiteConf.shop_id,
      userId: conf.suiteConf.user_id,
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    plbToken = await plbTemplateDashboardPage.getAccessToken({
      shopId: conf.suiteConf.plb_template["shop_id"],
      userId: conf.suiteConf.plb_template["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.plb_template["username"],
      password: conf.suiteConf.plb_template["password"],
    });
    plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, authRequest);
  });

  // Reset shipping type của product về default: Standard shipping, Fast shipping
  test.afterEach(async ({ odoo }) => {
    const odooService = OdooService(odoo);
    await odooService.updateShippingTypeProductTemplate(productTargetId, defaultShippingType);
    await odooService.updateShippingTypeProductTemplate(productRecommendId, defaultShippingType);
  });

  test("@SB_AUP_50 Kiểm tra hiển thị giá, giá gạch của recommended product trong offer có discount value, giá gạch được set trên odoo", async ({
    page,
    conf,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;

    const sfCheckoutPage = new SFCheckout(page, shopDomain);
    const sfAppsPage = new SFApps(page, shopDomain);

    await test.step("Buyer complete order ở storefront", async () => {
      await sfCheckoutPage.createStripeOrder(productTargetName, targetQuantity, shippingAddress, "");

      // Verify show offer, product recommended
      expect(await sfCheckoutPage.isTextVisible(offerMessage)).toEqual(true);
      expect(await sfCheckoutPage.isTextVisible(offerTitle)).toEqual(true);
      expect(await sfCheckoutPage.isTextVisible(productRecommendName)).toEqual(true);

      // Verify price, compare at price of recommeded product
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      priceAfterDiscount = sfCheckoutPage.calculatePriceAfterDiscount(
        recommendPrice,
        offerDiscount.type,
        offerDiscount.value,
      );
      expect(priceAct).toEqual(priceAfterDiscount);

      const comparePriceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "compare at price")),
      );
      expect(comparePriceAct).toEqual(recommendComparePrice);
    });

    await test.step("Buyer add recommended product to order", async () => {
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      orderAfterCheckoutInfo = await sfCheckoutPage.getOrderInfoAfterCheckout();

      // Verify order summary after add product recommended to order
      const subTotalExp = targetPrice + Number(priceAfterDiscount);
      expect(orderAfterCheckoutInfo.subTotal).toEqual(subTotalExp);

      const taxExp = sfCheckoutPage.calculateTax(taxType, subTotalExp, taxRate);
      expect(orderAfterCheckoutInfo.taxValue).toEqual(taxExp);

      const shippingExp =
        targetShip +
        sfCheckoutPage.calculatePriceAfterDiscount(
          recommedShip,
          offerDiscountShipping.type,
          offerDiscountShipping.value,
        );
      expect(isEqual(Number(orderAfterCheckoutInfo.shippingSF), shippingExp, 0.01)).toEqual(true);

      // const totalAct = Number(removeCurrencySymbol(await sfCheckoutPage.getTotalOnOrderSummary()));
      const totalExp = Number((subTotalExp + taxExp + shippingExp).toFixed(2));
      expect(isEqual(orderAfterCheckoutInfo.totalSF, totalExp, 0.01)).toEqual(true);
    });

    await test.step("Buyer open mailbox", async () => {
      await expect(async () => {
        const mailBoxPage = await sfCheckoutPage.openMailBox(shippingAddress.email);
        await mailBoxPage.openOrderConfirmationNotification(orderAfterCheckoutInfo.orderName);
        // Verify recommended product on email order confirmation
        await expect(mailBoxPage.genLocProductLine(productRecommendName, recommendQuantity)).toBeVisible();
        const totalAct = Number(removeCurrencySymbol(await mailBoxPage.getTotalOrder()));
        expect(isEqual(totalAct, orderAfterCheckoutInfo.totalSF, 0.01)).toEqual(true);
      }).toPass();
    });
  });

  test("@SB_AUP_51 Kiểm tra hiển thị giá, giá gạch của recommended product trong offer không set discount, giá compare (giá gạch) không được set trên odoo", async ({
    conf,
    page,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;
    const sfCheckoutPage = new SFCheckout(page, shopDomain);
    const sfAppsPage = new SFApps(page, shopDomain);

    await test.step("Buyer complete order ở storefront", async () => {
      await sfCheckoutPage.createStripeOrder(productTargetName, targetQuantity, shippingAddress, "");

      // Verify show offer, product recommended
      expect(await sfCheckoutPage.isTextVisible(offerMessage)).toEqual(true);
      expect(await sfCheckoutPage.isTextVisible(offerTitle)).toEqual(true);
      expect(await sfCheckoutPage.isTextVisible(productRecommendName)).toEqual(true);

      // Verify price of recommeded product
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      expect(priceAct).toEqual(recommendPrice);

      // Verify compare at price of recommeded product: compare at price = 130% price
      const comparePriceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "compare at price")),
      );
      expect(comparePriceAct).toEqual(Number((recommendPrice * 1.3).toFixed(2)));
    });

    await test.step("Buyer add recommended product to order", async () => {
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      orderAfterCheckoutInfo = await sfCheckoutPage.getOrderInfoAfterCheckout();

      // Verify order summary after add product recommended to order
      const subTotalExp = roundingTwoDecimalPlaces(targetPrice + recommendPrice);
      expect(orderAfterCheckoutInfo.subTotal).toEqual(subTotalExp);

      const taxExp = sfCheckoutPage.calculateTax(taxType, subTotalExp, taxRate);
      expect(orderAfterCheckoutInfo.taxValue).toEqual(taxExp);

      const shippingExp = targetShip + recommedShip;
      expect(isEqual(Number(orderAfterCheckoutInfo.shippingSF), shippingExp, 0.01)).toEqual(true);

      const totalExp = Number((subTotalExp + taxExp + shippingExp).toFixed(2));
      expect(isEqual(orderAfterCheckoutInfo.totalSF, totalExp, 0.01)).toEqual(true);
    });
  });

  test("@SB_AUP_54 Kiểm tra checkout nhiều recommended product trường hợp add to cart ở product page", async ({
    conf,
    page,
    context,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;
    const sfCheckoutPage = new SFCheckout(page, shopDomain);
    const sfAppsPage = new SFApps(page, shopDomain);
    let sfNewProductPage: SFProduct;
    let sfNewCheckoutPage: SFCheckout;

    await test.step("Thực hiện checkout với item target product", async () => {
      await sfCheckoutPage.createStripeOrder(productTargetName, targetQuantity, shippingAddress, "");
    });

    await test.step("Click vào product name để view sản phẩm recommended", async () => {
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        sfAppsPage.clickElementWithLabel("*", productRecommendName, 1),
      ]);
      sfNewProductPage = new SFProduct(SFPage, shopDomain);

      // Verify price of recommeded product
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      expect(priceAct).toEqual(recommendPrice);

      // Verify compare at price of recommeded product: compare at price = 130% price
      const comparePriceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "compare at price")),
      );
      expect(comparePriceAct).toEqual(Number((recommendPrice * 1.3).toFixed(2)));
    });

    await test.step("Add product to cart > Thực hiện checkout", async () => {
      await sfNewProductPage.inputQuantityProduct(Number(recommendQuantity));
      await sfNewProductPage.addProductToCart();
      sfNewCheckoutPage = await sfNewProductPage.navigateToCheckoutPage();

      await sfNewCheckoutPage.enterShippingAddress(shippingAddress);
      await sfNewCheckoutPage.selectShippingMethod(conf.caseConf.products_recommended.shipping_method);
      await sfNewCheckoutPage.continueToPaymentMethod();
      await sfNewCheckoutPage.completeOrderWithMethod();
      orderAfterCheckoutInfo = await sfNewCheckoutPage.getOrderInfoAfterCheckout();

      // Verify order summary
      const subTotalExp = recommendPrice * Number(recommendQuantity);
      expect(orderAfterCheckoutInfo.subTotal).toEqual(subTotalExp);

      const taxExp = sfCheckoutPage.calculateTax(taxType, subTotalExp, taxRate);
      expect(orderAfterCheckoutInfo.taxValue).toEqual(taxExp);
      expect(isEqual(Number(orderAfterCheckoutInfo.shippingSF), recommedShip, 0.01)).toEqual(true);

      const totalExp = Number((subTotalExp + taxExp + recommedShip).toFixed(2));
      expect(isEqual(orderAfterCheckoutInfo.totalSF, totalExp, 0.01)).toEqual(true);
    });
  });

  test("@SB_AUP_70 Kiểm tra không hiển thị recommended product khi recommended product không trùng shipping group với line ship của order", async ({
    page,
  }) => {
    const sfCheckoutPage = new SFCheckout(page, shopDomain);
    await test.step("Mở storefront > Add product vào cart > Thực hiện checkout", async () => {
      await sfCheckoutPage.createStripeOrder(productTargetName, targetQuantity, shippingAddress, "");
      expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
    });

    await test.step("Verify hiển thị recommended product", async () => {
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(false);
    });
  });

  test("@SB_AUP_76 Kiểm tra shipping fee sau khi add item post-purchase trường hợp offer set up shipping fee discount percentage 100%", async ({
    conf,
    page,
    multipleStore,
  }) => {
    let shippingExp: number;
    await test.step("Mở storefront > Add product vào cart > Thực hiện checkout", async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        "",
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
    });

    await test.step("Add product post purchase to cart > Verify shipping fee", async () => {
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();

      recommedShip = sfCheckoutPage.calculatePriceAfterDiscount(
        recommedShip,
        offerDiscountShipping.type,
        offerDiscountShipping.value,
      );
      shippingExp = roundingTwoDecimalPlaces(targetShip + recommedShip);
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
    });

    await test.step("Vào dashboard > Order detail > Verify shipping fee", async () => {
      const dashboardPage = new DashboardPage(page, shopDomain);
      await dashboardPage.loginWithToken(adminToken);
      const ordersPage = new OrdersPage(page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);

      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });

    await test.step("Vào dashboard shop template > Order detail > Approve order > Verify order information", async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      const orderTplPage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTplPage.goToOrderStoreTemplateByOrderId(orderAfterCheckoutInfo.orderId);
      await orderTplPage.waitForProfitCalculated();
      await orderTplPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      expect(await orderTplPage.getPaymentStatus()).toEqual("Paid");
      orderInfo = await orderTplPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify shipping fee, subtotal, total order, paid buy customer, revenue, handling fee, profit order
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }

      orderTplPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.paid_by_customer, orderSummary.totalPrice, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.revenue, orderTplPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orderTplPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orderTplPage.profit, 0.01)).toEqual(true);
    });
  });

  test("@SB_AUP_77 Kiểm tra shipping fee sau khi add item post-purchase trường hợp offer set up shipping fee discount value < shipping fee", async ({
    page,
    conf,
    multipleStore,
  }) => {
    let shippingExp: number;
    await test.step("Mở storefront > Add product vào cart > Thực hiện checkout", async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        "",
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
    });

    await test.step("Add product post purchase to cart > Verify shipping fee", async () => {
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();

      recommedShip = sfCheckoutPage.calculatePriceAfterDiscount(
        recommedShip,
        offerDiscountShipping.type,
        offerDiscountShipping.value,
      );
      shippingExp = roundingTwoDecimalPlaces(targetShip + recommedShip);
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
    });

    await test.step("Vào dashboard > Order detail > Verify shipping fee", async () => {
      const dashboardPage = new DashboardPage(page, shopDomain);
      await dashboardPage.loginWithToken(adminToken);
      const ordersPage = new OrdersPage(page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);

      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }

      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });

    await test.step("Vào dashboard shop template > Order detail > Approve order > Verify order information", async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      const orderTplPage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTplPage.goToOrderStoreTemplateByOrderId(orderAfterCheckoutInfo.orderId);
      await orderTplPage.waitForProfitCalculated();
      await orderTplPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      expect(await orderTplPage.getPaymentStatus()).toEqual("Paid");
      orderInfo = await orderTplPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify shipping fee, subtotal, total order, paid buy customer, revenue, handling fee, profit order
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }

      orderTplPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.paid_by_customer, orderSummary.totalPrice, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.revenue, orderTplPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orderTplPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orderTplPage.profit, 0.01)).toEqual(true);
    });
  });

  test("@SB_AUP_79 Kiểm tra shipping fee sau khi add item post-purchase trường hợp offer set up shipping fee discount value < shipping fee", async ({
    page,
    conf,
    multipleStore,
  }) => {
    let shippingExp: number;
    await test.step("Mở storefront > Add product vào cart > Thực hiện checkout", async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        "",
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
    });

    await test.step("Add product post purchase to cart > Verify shipping fee", async () => {
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();

      recommedShip = sfCheckoutPage.calculatePriceAfterDiscount(
        recommedShip,
        offerDiscountShipping.type,
        offerDiscountShipping.value,
      );
      shippingExp = roundingTwoDecimalPlaces(targetShip + recommedShip);
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
    });

    await test.step("Vào dashboard > Order detail > Verify shipping fee", async () => {
      const dashboardPage = new DashboardPage(page, shopDomain);
      await dashboardPage.loginWithToken(adminToken);
      const ordersPage = new OrdersPage(page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);

      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }

      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });

    await test.step("Vào dashboard shop template > Order detail > Approve order > Verify order information", async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      const orderTplPage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTplPage.goToOrderStoreTemplateByOrderId(orderAfterCheckoutInfo.orderId);
      await orderTplPage.waitForProfitCalculated();
      await orderTplPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      expect(await orderTplPage.getPaymentStatus()).toEqual("Paid");
      orderInfo = await orderTplPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify shipping fee, subtotal, total order, paid buy customer, revenue, handling fee, profit order
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }

      orderTplPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.paid_by_customer, orderSummary.totalPrice, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.revenue, orderTplPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orderTplPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orderTplPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_AUP_07 Verify profit của order sau khi buyer checkout có nhập discount và add nhiều quantity upsell( offer upsell có discount)`, async ({
    page,
    conf,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      const sfAppsPage = new SFApps(page, shopDomain);
      const offerDiscount = conf.caseConf.offer_discount;
      targetPrice = conf.caseConf.product_target.price;
      recommendPrice = conf.caseConf.products_recommended.price;
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        conf.caseConf.discount.code,
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      priceAfterDiscount = sfCheckoutPage.calculatePriceAfterDiscount(
        recommendPrice,
        offerDiscount.type,
        offerDiscount.value,
      );
      expect(priceAct).toEqual(priceAfterDiscount);
    });

    await test.step(`Chọn variant, nhập quantity > Click button Add to order > Verify order summary`, async () => {
      await sfCheckoutPage.inputQuantityPostPurchase(recommendQuantity, productRecommendName);
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();
      const expSubTotal = Number(targetQuantity) * targetPrice + priceAfterDiscount * Number(recommendQuantity);
      expect(isEqual(orderSummary.subTotal, expSubTotal, 0.01)).toEqual(true);
      expect(isEqual(Number(orderSummary.shippingValue), targetShip + recommedShip, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit hiển thị`, async () => {
      const dashboardPage = new DashboardPage(page, shopDomain);
      await dashboardPage.loginWithToken(adminToken);
      const ordersPage = new OrdersPage(page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);
      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify order profit
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_AUP_10 Verify profit của order sau khi add nhiều quantity recommend product có tax include`, async ({
    page,
    conf,
  }) => {
    const isTax = conf.caseConf.isTax;
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      const sfAppsPage = new SFApps(page, shopDomain);
      const offerDiscount = conf.caseConf.offer_discount;
      targetPrice = conf.caseConf.product_target.price;
      recommendPrice = conf.caseConf.products_recommended.price;
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        null,
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      priceAfterDiscount = sfCheckoutPage.calculatePriceAfterDiscount(
        recommendPrice,
        offerDiscount.type,
        offerDiscount.value,
      );
      expect(priceAct).toEqual(priceAfterDiscount);
    });

    await test.step(`Chọn variant, nhập quantity > Click button Add to order > Verify order summary`, async () => {
      await sfCheckoutPage.inputQuantityPostPurchase(recommendQuantity, productRecommendName);
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();
      const expSubTotal = Number(targetQuantity) * targetPrice + priceAfterDiscount * Number(recommendQuantity);
      expect(isEqual(orderSummary.subTotal, expSubTotal, 0.01)).toEqual(true);
      expect(isEqual(Number(orderSummary.shippingValue), targetShip + recommedShip, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Approve order > Verify order summary, profit của order`, async () => {
      const dashboardPage = new DashboardPage(page, shopDomain);
      await dashboardPage.loginWithToken(adminToken);
      await dashboardPage.navigateToMenu("Orders");
      const ordersPage = new OrdersPage(page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);
      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify order profit
      let taxInclude = 0;
      if (isTax) {
        const tax = Number(removeCurrencySymbol(await ordersPage.getTax()));
        const taxDesciption = await ordersPage.getTaxDesciption();
        if (taxDesciption.includes("include")) {
          taxInclude = tax;
        }
      }
      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_AUP_11 Verify profit của order sau khi add nhiều quantity recommend product có tax exclude`, async ({
    page,
    conf,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      const sfAppsPage = new SFApps(page, shopDomain);
      const offerDiscount = conf.caseConf.offer_discount;
      targetPrice = conf.caseConf.product_target.price;
      recommendPrice = conf.caseConf.products_recommended.price;
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        null,
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      priceAfterDiscount = sfCheckoutPage.calculatePriceAfterDiscount(
        recommendPrice,
        offerDiscount.type,
        offerDiscount.value,
      );
      expect(priceAct).toEqual(priceAfterDiscount);
    });

    await test.step(`Chọn variant, nhập quantity > Click button Add to order > Verify order summary`, async () => {
      await sfCheckoutPage.inputQuantityPostPurchase(recommendQuantity, productRecommendName);
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();
      const expSubTotal = Number(targetQuantity) * targetPrice + priceAfterDiscount * Number(recommendQuantity);
      expect(isEqual(orderSummary.subTotal, expSubTotal, 0.01)).toEqual(true);
      expect(isEqual(Number(orderSummary.shippingValue), targetShip + recommedShip, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Approve order > Verify order summary, profit của order`, async () => {
      const dashboardPage = new DashboardPage(page, shopDomain);
      await dashboardPage.loginWithToken(adminToken);
      await dashboardPage.navigateToMenu("Orders");
      const ordersPage = new OrdersPage(page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);
      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      // Verify order profit
      const isTax = conf.caseConf.isTax;
      let taxInclude = 0;
      if (isTax) {
        const tax = Number(removeCurrencySymbol(await ordersPage.getTax()));
        const taxDesciption = await ordersPage.getTaxDesciption();
        if (taxDesciption.includes("include")) {
          taxInclude = tax;
        }
      }
      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_AUP_08 Verify profit của order sau khi cancel 1 item PPC khi order chưa được approve`, async ({
    page,
    authRequest,
    conf,
    multipleStore,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      const sfAppsPage = new SFApps(page, shopDomain);
      const offerDiscount = conf.caseConf.offer_discount;
      targetPrice = conf.caseConf.product_target.price;
      recommendPrice = conf.caseConf.products_recommended.price;
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        conf.caseConf.discount.code,
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      priceAfterDiscount = sfCheckoutPage.calculatePriceAfterDiscount(
        recommendPrice,
        offerDiscount.type,
        offerDiscount.value,
      );
      expect(priceAct).toEqual(priceAfterDiscount);
    });

    await test.step(`Chọn variant, nhập quantity > Click button Add to order > Verify order summary`, async () => {
      await sfCheckoutPage.inputQuantityPostPurchase(recommendQuantity, productRecommendName);
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();
      const expSubTotal = Number(targetQuantity) * targetPrice + priceAfterDiscount * Number(recommendQuantity);
      expect(isEqual(orderSummary.subTotal, expSubTotal, 0.01)).toEqual(true);
      expect(isEqual(Number(orderSummary.shippingValue), targetShip + recommedShip, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit hiển thị`, async () => {
      const dashboard = await multipleStore.getDashboardPage(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      const dashboardPage = new DashboardPage(dashboard, shopDomain);
      const ordersPage = new OrdersPage(dashboardPage.page, shopDomain);
      await ordersPage.goToOrderByOrderId(orderAfterCheckoutInfo.orderId);
      await ordersPage.waitForProfitCalculated();
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      // Verify order profit
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail trên store template > Chọn More actions > Cancel order > Verify profit của order`, async () => {
      const refunds = conf.caseConf.refunds;
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      const orderTplPage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTplPage.goToOrderStoreTemplateByOrderId(orderAfterCheckoutInfo.orderId);
      await orderTplPage.waitForProfitCalculated();

      const plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
      await orderTplPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await orderTplPage.page.reload();
      const { profitAfterRefund } = await orderTplPage.inputRefundItems(refunds, plbOrderApi, orderAfterCheckoutInfo);
      const profitExpect = profitAfterRefund;
      await orderTplPage.clickButton("Cancel");
      await orderTplPage.waitForElementVisibleThenInvisible(orderTplPage.xpathLoadingButton);
      await orderTplPage.page.reload();
      await orderTplPage.page.waitForLoadState("load");

      // verify profit sau refund
      const profitActual = Number(removeCurrencySymbol(await orderTplPage.getProfit()));
      expect(isEqual(profitActual, profitExpect, 0.01)).toEqual(true);
      const paymentStatus = await orderTplPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
      const reasonActual = await orderTplPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled some items. Reason: Other");
    });
  });

  test(`@SB_PLB_AUP_09 Verify profit của order sau khi refund 1 item PPC của order đã được approve`, async ({
    page,
    conf,
    authRequest,
  }) => {
    const ordersPage = new OrdersPage(page, plbTemplateShopDomain);
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      sfCheckoutPage = new SFCheckout(page, shopDomain);
      const sfAppsPage = new SFApps(page, shopDomain);
      const offerDiscount = conf.caseConf.offer_discount;
      targetPrice = conf.caseConf.product_target.price;
      recommendPrice = conf.caseConf.products_recommended.price;
      orderAfterCheckoutInfo = await sfCheckoutPage.createStripeOrder(
        productTargetName,
        targetQuantity,
        shippingAddress,
        conf.caseConf.discount.code,
      );
      expect(await sfCheckoutPage.isPostPurchaseDisplayed()).toEqual(true);
      const priceAct = Number(
        removeCurrencySymbol(await sfAppsPage.getPriceProductUpsell(productRecommendName, "sale price")),
      );
      priceAfterDiscount = sfCheckoutPage.calculatePriceAfterDiscount(
        recommendPrice,
        offerDiscount.type,
        offerDiscount.value,
      );
      expect(priceAct).toEqual(priceAfterDiscount);
    });

    await test.step(`Chọn variant, nhập quantity > Click button Add to order > Verify order summary`, async () => {
      await sfCheckoutPage.inputQuantityPostPurchase(recommendQuantity, productRecommendName);
      await sfCheckoutPage.addProductPostPurchase(productRecommendName);
      await sfCheckoutPage.completePaymentForPostPurchaseItem("Stripe");
      expect(await sfCheckoutPage.isTextVisible("Thank you!")).toEqual(true);
      orderSummary = await sfCheckoutPage.getOrderSummaryInfo();
      const expSubTotal = Number(targetQuantity) * targetPrice + priceAfterDiscount * Number(recommendQuantity);
      expect(isEqual(orderSummary.subTotal, expSubTotal, 0.01)).toEqual(true);
      expect(isEqual(Number(orderSummary.shippingValue), targetShip + recommedShip, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail  > Approve order > Verify order summary, profit của order`, async () => {
      const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(orderAfterCheckoutInfo.orderName);
      await ordersPage.waitForProfitCalculated();
      const totalOrderActual = Number(removeCurrencySymbol(await ordersPage.getTotalOrder()));
      expect(totalOrderActual).toEqual(orderSummary.totalPrice);
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await ordersPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await ordersPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
      orderInfo = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      // Verify order profit
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      ordersPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, ordersPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, ordersPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, ordersPage.profit, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail trên store template > Chọn Refund orders > Verify profit của order`, async () => {
      const refunds = conf.caseConf.refunds;
      const plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
      await ordersPage.clickOnBtnWithLabel("Refund order");
      const { profitAfterRefund } = await ordersPage.inputRefundItems(refunds, plbOrderApi, orderAfterCheckoutInfo);
      const profitExpect = profitAfterRefund;
      // Wait 1s để tính được transaction refund sau khi input quantity cho item auto upsell
      await ordersPage.page.waitForTimeout(1000);
      await ordersPage.clickButton("Refund");

      await ordersPage.waitForElementVisibleThenInvisible(ordersPage.xpathLoadingButton);
      await ordersPage.page.waitForLoadState("load");
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
      ordersPage.page.reload({ waitUntil: "load" });

      // Verify profit sau refund
      await expect(async () => {
        const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
        expect(isEqual(profitActual, profitExpect, 0.01)).toEqual(true);
      }).toPass();
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase refunded this order. Reason: Other");
    });
  });
});
