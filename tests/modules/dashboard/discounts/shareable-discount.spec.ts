import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import type { DiscountAPI, Order, OrderSummary } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { isEqual } from "@core/utils/checkout";
import { OrderAPI } from "@pages/api/order";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DiscountPage } from "@pages/dashboard/discounts";

test.describe("Shareable discount", () => {
  let domain: string;
  let dashboardPage: DashboardPage;
  let dashboardAPI: DashboardAPI;
  let discounts: DiscountAPI[] | DiscountAPI;
  let checkout: SFCheckout;
  let homepage: SFHome;
  let productName: string;
  let productPage: SFProduct;
  let orderId: number;
  let orderSummary: OrderSummary;
  let orderInfo: Order;
  let orderPage: OrdersPage;
  let orderApi: OrderAPI;
  let discountPage: DiscountPage;
  let expectedDiscountSf: number;

  test.beforeEach(async ({ conf, page, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    checkout = new SFCheckout(page, domain, "");
    homepage = new SFHome(page, domain);
    orderPage = new OrdersPage(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    discountPage = new DiscountPage(dashboard, conf.suiteConf.domain);
    productName = conf.suiteConf.product_name;
    discounts = conf.caseConf.discounts;
    //create discount
    await dashboardAPI.createDiscountInfo(discounts);
  });

  test.afterEach(async ({}) => {
    //  delete all discount
    await dashboardPage.navigateToSubMenu("Discounts", "Codes");
    await discountPage.delAllDiscount();
  });

  test(`@SB_DC_89 Verify khi user click vào 2 shareable link của cùng một store và cả 2 link đều được process đến checkout`, async ({
    authRequest,
    conf,
  }) => {
    const customerInfo = conf.suiteConf.customer_info;
    await test.step(`Vào link 1 > Search product > Add to cart > Checkout`, async () => {
      await homepage.goto(discounts[0].metadata.shareable_link);
      await homepage.page.waitForLoadState("networkidle");
      productPage = await homepage.searchThenViewProduct(productName);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      orderSummary = await checkout.getOrderSummaryInfo();
      let taxAmount = 0;
      if (orderSummary.taxes !== "Tax included") {
        taxAmount = Number(orderSummary.taxes);
      }
      expectedDiscountSf = orderSummary.subTotal * (discounts[0].value / 100);
      expect(Number(orderSummary.discountValue)).toEqual(Number(expectedDiscountSf.toFixed(1)));
      const totalPrice =
        Number(orderSummary.subTotal) +
        Number(orderSummary.shippingValue) +
        Number(orderSummary.discountValue) +
        taxAmount;
      expect(isEqual(totalPrice, Number(orderSummary.totalPrice), 0.01)).toEqual(true);
    });

    await test.step(`Vào link 2 > Click vào cart > Checkout`, async () => {
      await homepage.goto(discounts[1].metadata.shareable_link);
      await homepage.page.waitForLoadState("networkidle");
      await productPage.gotoCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      orderSummary = await checkout.getOrderSummaryInfo();
      let taxAmount = 0;
      if (orderSummary.taxes !== "Tax included") {
        taxAmount = Number(orderSummary.taxes);
      }
      expect(orderSummary.discountCode).toEqual(discounts[1].title);
      expectedDiscountSf = orderSummary.subTotal * (discounts[1].value / 100);
      expect(Number(orderSummary.discountValue)).toEqual(Number(expectedDiscountSf.toFixed(1)));
      const totalPrice =
        Number(orderSummary.subTotal) +
        Number(orderSummary.shippingValue) +
        Number(orderSummary.discountValue) +
        taxAmount;
      expect(isEqual(totalPrice, Number(orderSummary.totalPrice), 0.01)).toEqual(true);
    });

    await test.step(`Vào link 1 > Click vào cart > Checkout`, async () => {
      await homepage.goto(discounts[0].metadata.shareable_link);
      await homepage.page.waitForLoadState("networkidle");
      await productPage.gotoCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      orderSummary = await checkout.getOrderSummaryInfo();
      let taxAmount = 0;
      if (orderSummary.taxes !== "Tax included") {
        taxAmount = Number(orderSummary.taxes);
      }
      expect(orderSummary.discountCode).toEqual(discounts[1].title);
      expectedDiscountSf = orderSummary.subTotal * (discounts[1].value / 100);
      expect(Number(orderSummary.discountValue)).toEqual(Number(expectedDiscountSf.toFixed(1)));
      const totalPrice =
        Number(orderSummary.subTotal) +
        Number(orderSummary.shippingValue) +
        Number(orderSummary.discountValue) +
        taxAmount;
      expect(isEqual(totalPrice, Number(orderSummary.totalPrice), 0.01)).toEqual(true);
    });

    await test.step(`Complete order > Vào order detail verify profit order`, async () => {
      const plbOrder = new PlusbaseOrderAPI(domain, authRequest);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Shopbase payment");
      expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
      orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_DC_91 Verify khi buyer click vào shareable link mà discount code đã disable`, async ({
    authRequest,
    conf,
  }) => {
    const customerInfo = conf.suiteConf.customer_info;
    //disable discount
    const discountReset = conf.caseConf.discount_reset;
    const disableDiscountAt = new Date();
    discountReset.ends_at = disableDiscountAt.toISOString();
    await dashboardAPI.updateDiscountInfo(discountReset);

    await test.step(`Vào link 1 > Search product > Add to cart > Checkout`, async () => {
      await homepage.goto(discounts[0].metadata.shareable_link);
      await homepage.page.waitForLoadState("networkidle");
      productPage = await homepage.searchThenViewProduct(productName);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();
      expect(await checkout.isDiscApplied()).toBeFalsy();
      await checkout.enterShippingAddress(customerInfo);

      orderSummary = await checkout.getOrderSummaryInfo();
      let taxAmount = 0;
      if (orderSummary.taxes !== "Tax included") {
        taxAmount = Number(orderSummary.taxes);
      }
      expect(orderSummary.discountValue).toEqual("0");
      const totalPrice =
        Number(orderSummary.subTotal) +
        Number(orderSummary.shippingValue) +
        Number(orderSummary.discountValue) +
        taxAmount;
      expect(isEqual(totalPrice, Number(orderSummary.totalPrice), 0.01)).toEqual(true);
    });

    await test.step(`Complete order > Vào order detail verify profit order`, async () => {
      const plbOrder = new PlusbaseOrderAPI(domain, authRequest);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Shopbase payment");
      expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
      orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_DC_93 Verify khi buyer click vào shareable link nhưng order chưa đủ điều kiện apply discount`, async ({
    authRequest,
    conf,
  }) => {
    const customerInfo = conf.suiteConf.customer_info;
    await test.step(`Vào link 1 > Search product > Add to cart > Checkout`, async () => {
      await homepage.goto(discounts[0].metadata.shareable_link);
      await homepage.page.waitForLoadState("networkidle");
      productPage = await homepage.searchThenViewProduct(productName);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      expect(await checkout.isDiscApplied()).toBeFalsy();
      orderSummary = await checkout.getOrderSummaryInfo();
      let taxAmount = 0;
      if (orderSummary.taxes !== "Tax included") {
        taxAmount = Number(orderSummary.taxes);
      }
      expect(orderSummary.discountValue).toEqual("0");
      const totalPrice =
        Number(orderSummary.subTotal) +
        Number(orderSummary.shippingValue) +
        Number(orderSummary.discountValue) +
        taxAmount;
      expect(isEqual(totalPrice, Number(orderSummary.totalPrice), 0.01)).toEqual(true);
    });

    await test.step(`Complete order > Vào order detail verify profit order`, async () => {
      const plbOrder = new PlusbaseOrderAPI(domain, authRequest);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Shopbase payment");
      expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
      orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Number(orderSummary.discountValue),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
    });
  });
});
