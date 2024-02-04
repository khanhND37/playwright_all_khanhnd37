import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import type { OrderSummary, Product, ShippingAddress } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";
import { AppsAPI } from "@pages/api/apps";

test.describe("Discount Dropship, POD", () => {
  let discountInfo;
  let productInfo: Array<Product>;
  let productPODInfo: Array<Product>;
  let productDropshipInfo: Product;
  let shippingAddress: ShippingAddress;
  let orderSummaryInfo: OrderSummary;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let homePage: SFHome;
  let productPage: SFProduct;
  let expDiscountValue = 0;
  let domain: string;
  let notiMessage: string;

  test.beforeEach(async ({ page, conf, authRequest, dashboard }) => {
    // prepair data for
    domain = conf.suiteConf.domain;
    productPODInfo = conf.suiteConf.product_pod_info;
    productDropshipInfo = conf.suiteConf.product_dropship_info;
    shippingAddress = conf.suiteConf.shipping_address;
    discountInfo = conf.caseConf.discount_info;
    productInfo = conf.caseConf.product_info;
    notiMessage = conf.caseConf.noti_message;

    checkout = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    homePage = new SFHome(page, domain);
    const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    await appsAPI.actionEnableDisableApp(conf.suiteConf.app.app_name, conf.suiteConf.app.is_enable);
  });
  test(`@SB_PLB_PODPL_POPLD_1 Kiểm tra không apply discount setup trên hive-pbase khi checkout product POD và Dropship`, async () => {
    await test.step(`Mở storefront > Add product POD vào cart > đến màn checkout > apply discount: discount-code`, async () => {
      //add product to cart input shipping address
      await checkout.addProductToCartThenInputShippingAddress(productPODInfo, shippingAddress);

      //apply discount code
      await checkout.enterAndApplyDiscount(discountInfo.code);
      await checkout.waitForNoticeMessage(notiMessage);
    });

    await test.step(`Quay lại cart > Add product Dropship vào cart > đến màn checkout > apply discount: discount-code `, async () => {
      //add additional product and back to checkout page
      await homePage.gotoHomePage();
      productPage = await homePage.searchThenViewProduct(productDropshipInfo.name);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();

      //apply discount code
      await checkout.enterAndApplyDiscount(discountInfo.code);
      await checkout.waitForNoticeMessage(notiMessage);
    });

    await test.step(`Nhập card > Complete order `, async () => {
      //checkout product
      await checkout.waitForCheckoutPageCompleteRender();
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
      orderSummaryInfo = await checkout.getOrderSummaryInfo();

      //verify discount value
      expect(Math.abs(Number(orderSummaryInfo.discountValue))).toEqual(expDiscountValue);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      //open order detail
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //get order detail info
      const subtotal = await orderPage.getSubtotalOrder();
      const total = await orderPage.getTotalOrder();
      const discount = await orderPage.getDiscountVal();

      //expect order info
      expect(Number(removeCurrencySymbol(subtotal))).toEqual(orderSummaryInfo.subTotal);
      expect(Number(removeCurrencySymbol(total))).toEqual(orderSummaryInfo.totalPrice);
      expect(Number(removeCurrencySymbol(discount))).toEqual(Number(orderSummaryInfo.discountValue));
    });
  });

  test(`@SB_PLB_PODPL_POPLD_2 Kiểm tra apply discount-code merchant setup trên store PlusBase khi checkout product POD và Dropship`, async () => {
    await test.step(`Mở storefront > Add product POD vào cart > đến màn checkout > apply discount: discount-10$`, async () => {
      //add product to cart input shipping address
      await checkout.addProductToCartThenInputShippingAddress(productPODInfo, shippingAddress);

      //apply discount code
      await checkout.applyDiscountCode(discountInfo.first_discount.code);

      //verify discount value
      expDiscountValue = await checkout.calculateDiscountByType(discountInfo.first_discount);
      const actDiscountValue = await checkout.getDiscountValOnOrderSummary();
      expect(Math.abs(Number(actDiscountValue))).toEqual(expDiscountValue);
    });

    await test.step(`Quay lại cart > Add product Dropship vào cart > đến màn checkout > apply discount: discount-30%`, async () => {
      //add additional product and back to checkout page
      await homePage.gotoHomePage();
      productPage = await homePage.searchThenViewProduct(productDropshipInfo.name);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingAddress);

      //re-calculate subtotal
      checkout.subtotal += productPage.priceStorefront * productDropshipInfo.quantity;

      //apply discount code
      await checkout.getRemoveDiscountIcon(discountInfo.first_discount.code).click();
      await expect(checkout.applyDiscountButton).toBeDisabled();
      await checkout.applyDiscountCode(discountInfo.second_discount.code);

      //verify discount value
      expDiscountValue = await checkout.calculateDiscountByType(discountInfo.second_discount);
      const actDiscountValue = await checkout.getDiscountValOnOrderSummary();
      expect(Math.abs(Number(actDiscountValue))).toEqual(expDiscountValue);
    });

    await test.step(`Nhập card > Complete order `, async () => {
      //checkout product
      await checkout.waitForCheckoutPageCompleteRender();
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
      orderSummaryInfo = await checkout.getOrderSummaryInfo();

      //verify discount value
      expect(Math.abs(Number(orderSummaryInfo.discountValue))).toEqual(expDiscountValue);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      //open order detail
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //get order detail info
      const subtotal = await orderPage.getSubtotalOrder();
      const total = await orderPage.getTotalOrder();
      const discount = await orderPage.getDiscountVal();

      //expect order info
      expect(Number(removeCurrencySymbol(subtotal))).toEqual(orderSummaryInfo.subTotal);
      expect(Number(removeCurrencySymbol(total))).toEqual(orderSummaryInfo.totalPrice);
      expect(Number(removeCurrencySymbol(discount))).toEqual(Number(orderSummaryInfo.discountValue));
    });
  });

  test(`@SB_PLB_PODPL_POPLD_3 Kiểm tra apply discount auto Buy X get Y merchant setup trên store PlusBase khi checkout product POD và Dropship`, async () => {
    await test.step(`Mở storefront > Add product POD + Dropship vào cart > đến màn checkout >verify discount`, async () => {
      //add product to cart input shipping address
      await checkout.addProductToCartThenInputShippingAddress(productInfo, shippingAddress);

      //apply discount code
      await checkout.applyDiscountCode(discountInfo.code);

      //verify discount value
      expDiscountValue = await checkout.calculateDiscountByType(discountInfo);
      const actDiscountValue = await checkout.getDiscountValOnOrderSummary();
      expect(Math.abs(Number(actDiscountValue))).toEqual(expDiscountValue);
    });

    await test.step(`Nhập card > Complete order `, async () => {
      //checkout product
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
      orderSummaryInfo = await checkout.getOrderSummaryInfo();

      //verify discount value
      expect(Math.abs(Number(orderSummaryInfo.discountValue))).toEqual(expDiscountValue);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      //open order detail
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //get order detail info
      const subtotal = await orderPage.getSubtotalOrder();
      const total = await orderPage.getTotalOrder();
      const discount = await orderPage.getDiscountVal();

      //expect order info
      expect(Number(removeCurrencySymbol(subtotal))).toEqual(orderSummaryInfo.subTotal);
      expect(Number(removeCurrencySymbol(total))).toEqual(orderSummaryInfo.totalPrice);
      expect(Number(removeCurrencySymbol(discount))).toEqual(Number(orderSummaryInfo.discountValue));
    });
  });
});
