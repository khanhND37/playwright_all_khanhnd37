import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import type { ShippingMethod } from "@types";

// verify shipping amount following shipping rate name
const verifyShippingMethod = (expShippingMethods, actShippingMethods) => {
  for (const expShippingMethod of expShippingMethods) {
    const actShippingMethod = actShippingMethods.find(
      // eslint-disable-next-line camelcase
      ({ method_title }) => method_title === expShippingMethod.method_title,
    );
    expect(actShippingMethod.amount).toBe(expShippingMethod.amount);
  }
};

test.describe("Shipping profile cho item POD trong store PlusBase - full flow with UI", () => {
  let checkoutPage: SFCheckout;
  let orderPage: OrdersPage;
  let checkoutAPI: CheckoutAPI;
  let domain: string;
  let email: string;
  // Không có kiểu dữ liệu do mỗi chỗ dùng một kiểu
  let shippingAddress;
  let productCheckout: Array<{ name: string; quantity: number }>;
  let orderId: number;
  let expShippingMethods: Array<ShippingMethod>;
  let shippingInfoOfOrder: {
    amount: string;
    method_title: string;
  };
  let shippingFeeOnOrderSummary: string;

  test.beforeEach(async ({ conf, page }) => {
    domain = conf.suiteConf.domain;
    checkoutPage = new SFCheckout(page, domain);
    productCheckout = conf.caseConf.products_checkout;
    expShippingMethods = conf.caseConf.expected_shipping_methods;
    test.setTimeout(conf.suiteConf.timeout);
  });

  test(`@SB_PLB_PODPL_POPLS_27 [POD only] Check hiển thị shipping fee khi thay đổi item trong cart`, async ({
    conf,
    page,
    dashboard,
  }) => {
    const additionalProduct = conf.caseConf.additional_product;
    const expShippingMethodsAfterAddProduct = conf.caseConf.expected_shipping_methods_after_add_product;
    shippingAddress = conf.caseConf.shipping_address;
    orderPage = new OrdersPage(dashboard, domain);

    await test.step(`Buyer thực hiện order item A đến trang checkout > Nhập shipping address > Chọn shipping method > Kiểm tra hiển thị shipping method`, async () => {
      await checkoutPage.addToCartThenGoToShippingMethodPage(productCheckout, shippingAddress);

      // Expected:
      // Shipping fee hiển thị tại shipping method:
      // | Economic Shipping | 7
      // | Expedite Shipping | 7
      // Shipping fee hiển thị tại order summary: $7
      await checkoutPage.verifyShippingMethodOnPage(expShippingMethods);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
    });

    await test.step(`Thực hiện quay lại SF > add thêm item B vào cart > Sang trang checkout > Kiểm tra hiển thị shipping method`, async () => {
      await page.goto(`https://${domain}`);
      await checkoutPage.addToCartThenNavigateToCheckout(additionalProduct);

      // Expected:
      // Shipping fee tăng, hiển thị tại shipping method:
      // - Economic Shipping | 9
      // - Expedite Shipping | 11
      // Shipping fee hiển thị tại order summary: $9
      await checkoutPage.verifyShippingMethodOnPage(expShippingMethodsAfterAddProduct);
      await checkoutPage.selectShippingMethod(expShippingMethodsAfterAddProduct[0].method_title);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethodsAfterAddProduct[0].amount.toFixed(2));
    });

    await test.step(`Complete order với credit cart`, async () => {
      await checkoutPage.completeOrderWithMethod();
      await checkoutPage.addProductPostPurchase(null);

      // Expected:
      // - Checkout thành công, hiển thị trang Thankyou.
      // - Show shipping với:
      //  + Method: "Economic Shipping"
      //  + Shipping fee hiển thị tại order summary: $9
      expect(await checkoutPage.isThankyouPage()).toBe(true);
      shippingInfoOfOrder = await checkoutPage.getShippingInfoOnThankyouPage();
      expect(shippingInfoOfOrder.amount).toBe(expShippingMethodsAfterAddProduct[0].amount.toFixed(2));
      expect(shippingInfoOfOrder.method_title).toBe(expShippingMethodsAfterAddProduct[0].method_title);
    });

    await test.step(`User kiểm tra thông tin shipping và profit của order vừa tạo tại order detail trong dashboard.`, async () => {
      orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      // Expected:
      // - Show thông tin shipping:
      //  + Method: "Economic Shipping"
      //  + Shipping fee: $9
      expect(await orderPage.getShippingRateName()).toBe(shippingInfoOfOrder.method_title);
      expect(await orderPage.getShippingFee()).toBe(shippingInfoOfOrder.amount);
    });
  });

  test(`@SB_PLB_PODPL_POPLS_28 [POD only] Khi order có 01 sản phẩm không thoả mãn rule shipping thì order không có shipping`, async ({
    page,
    conf,
  }) => {
    const additionalProduct = conf.caseConf.additional_product;
    shippingAddress = conf.caseConf.shipping_address;
    const homePage = new SFHome(page, domain);
    let productPage: SFProduct;
    let cartSFPage: SFCart;

    await test.step(`Buyer thực hiện order item B đến trang checkout > Nhập shipping address > Kiểm tra hiển thị shipping method`, async () => {
      await homePage.gotoHomePage();
      productPage = await homePage.searchThenViewProduct(productCheckout[0].name);
      cartSFPage = await productPage.addProductToCart();
      await cartSFPage.clickOnBtnWithLabel("Checkout");
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.page.locator(checkoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      await checkoutPage.page.waitForSelector(checkoutPage.xpathShippingLabel);

      // Shipping fee hiển thị tại shipping method:
      //  + Không có shipping method.
      //  + Show thông báo "The following items don’t ship to your location.
      //                    Please replace them with another products and place your order again."
      //  + Disable btn 'Place your order'
      expect(await checkoutPage.verifyShippingMethodOnPage()).toBeTruthy();
    });
    await test.step(`Thực hiện quay lại SF > add thêm item A vào cart > Sang trang checkout > Kiểm tra hiển thị shipping method`, async () => {
      productPage = await homePage.searchThenViewProduct(additionalProduct[0].name);
      cartSFPage = await productPage.addProductToCart();
      await cartSFPage.clickOnBtnWithLabel("Checkout");
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.page.locator(checkoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      await checkoutPage.page.waitForSelector(checkoutPage.xpathShippingLabel);

      // Shipping fee hiển thị tại shipping method:
      //  + Không có shipping method.
      //  + Show thông báo "The following items don’t ship to your location.
      //                    Please replace them with another products and place your order again."
      //  + Disable btn 'Place your order'
      expect(await checkoutPage.verifyShippingMethodOnPage()).toBeTruthy();
    });
  });

  test(`@SB_PLB_PODPL_POPLS_29 [POD only] Khi thay đổi Shipping address thì fee shipping cũng thay đổi tương ứng`, async ({
    page,
    conf,
    authRequest,
  }) => {
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address_api;
    const shippingMethodOfRegions = conf.caseConf.shipping_method_for_each_region;

    await test.step(`Buyer thực hiện order 2 item A đến trang checkout > Nhập shipping address đến US - CA > Kiểm tra hiển thị shipping method`, async () => {
      const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productCheckout, email, shippingAddress);
      verifyShippingMethod(expShippingMethods, actShippingMethods);
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.page.locator(checkoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      expect(await checkoutPage.verifyShippingMethodOnPage(expShippingMethods)).toBe(true);
    });

    await test.step(`Chọn shipping method > Kiểm tra Shipping fee hiển thị tại order summary`, async () => {
      await checkoutPage.selectShippingMethod(expShippingMethods[0].method_title);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
    });

    for (const shippingMethodOfRegion of shippingMethodOfRegions) {
      await test.step(`Update shipping address đến ${shippingMethodOfRegion.shipping_address.city} > Kiểm tra hiển thị shipping method`, async () => {
        await checkoutPage.enterShippingAddress(shippingMethodOfRegion.shipping_address);
        await checkoutPage.page.locator(checkoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
        expect(await checkoutPage.verifyShippingMethodOnPage(shippingMethodOfRegion.expected_shipping_methods)).toBe(
          true,
        );
      });
    }
  });

  test(`@SB_PLB_PODPL_POPLS_30 [POD only] Order có 2 items Chung group, có 1 Rate name giống nhau`, async ({
    conf,
    authRequest,
    page,
  }) => {
    const shippingAddress = conf.suiteConf.shipping_address_api;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    email = conf.suiteConf.email;

    await test.step(`Buyer thực hiện order 2 items A và 2 items B đến trang checkout > Nhập shipping address > Kiểm tra hiển thị shipping method`, async () => {
      const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productCheckout, email, shippingAddress);

      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      // Verify API
      verifyShippingMethod(expShippingMethods, actShippingMethods);
      // Verify UI
      const isCheck = await checkoutPage.isTextVisible("Change method");
      if (isCheck) {
        await checkoutPage.clickElementWithLabel("span", "Change method");
      }
      expect(await checkoutPage.verifyShippingMethodOnPage(expShippingMethods)).toBeTruthy();
      await checkoutPage.selectShippingMethod(expShippingMethods[0].method_title);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
    });
  });

  test(`@SB_PLB_PODPL_POPLS_31 [POD only] Order có 2 items Chung group, Rate name giống nhau, 1st item price bằng nhau`, async ({
    conf,
    authRequest,
    page,
  }) => {
    const shippingAddress = conf.suiteConf.shipping_address_api;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    email = conf.suiteConf.email;

    await test.step(`Buyer thực hiện order 2 items A và 2 items B đến trang checkout > Nhập shipping address > Kiểm tra hiển thị shipping method`, async () => {
      const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productCheckout, email, shippingAddress);

      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      // Verify API
      verifyShippingMethod(expShippingMethods, actShippingMethods);
      // Verify UI
      const isCheck = await checkoutPage.isTextVisible("Change method");
      if (isCheck) {
        await checkoutPage.clickElementWithLabel("span", "Change method");
      }
      expect(await checkoutPage.verifyShippingMethodOnPage(expShippingMethods)).toBeTruthy();
      await checkoutPage.selectShippingMethod(expShippingMethods[0].method_title);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
    });
  });

  test(`@SB_PLB_PODPL_POPLS_32 [POD only] Verify Order có 2 items Khác group, Rate name khác nhau`, async ({
    conf,
    authRequest,
    page,
  }) => {
    const shippingAddress = conf.suiteConf.shipping_address_api;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    email = conf.suiteConf.email;

    await test.step(`Buyer thực hiện order 2 items A và 2 items B đến trang checkout > Nhập shipping address > Kiểm tra hiển thị shipping method`, async () => {
      const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productCheckout, email, shippingAddress);

      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      // Verify API
      verifyShippingMethod(expShippingMethods, actShippingMethods);
      // Verify UI
      const isCheck = await checkoutPage.isTextVisible("Change method");
      if (isCheck) {
        await checkoutPage.clickElementWithLabel("span", "Change method");
      }
      expect(await checkoutPage.verifyShippingMethodOnPage(expShippingMethods)).toBeTruthy();
      await checkoutPage.selectShippingMethod(expShippingMethods[0].method_title);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
    });
  });

  test(`@SB_PLB_PODPL_POPLS_33 [POD only] Verify order PPC có rate trùng tên với Shipping method đã chọn của order, cùng group`, async ({
    conf,
    authRequest,
    page,
    dashboard,
  }) => {
    const shippingBeforePPC = conf.caseConf.shipping_method_before_ppc;
    const expShippingAfterPPC = conf.caseConf.shipping_method_after_ppc;
    const shippingAddress = conf.suiteConf.shipping_address_api;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(dashboard, domain);
    let actShippingInfo: ShippingMethod;

    await test.step("Buyer Chọn shipping method > Complete checkout > Add item PPC > Kiểm tra shipping method", async () => {
      // Create a checkout then select shipping method
      await checkoutAPI.addProductThenSelectShippingMethod(
        productCheckout,
        email,
        shippingAddress,
        shippingBeforePPC.method_title,
      );

      // Complete order
      await checkoutAPI.activatePostPurchase();
      await checkoutAPI.authorizedThenCreateStripeOrder(conf.suiteConf.card_info);

      // Verify shipping before add PPC
      actShippingInfo = await checkoutAPI.getShippingInfoAfterCompleteOrder();
      expect(actShippingInfo.amount).toBe(shippingBeforePPC.amount);

      // Add PPC then verify shipping info
      await checkoutAPI.addPostPurchaseToCart(conf.caseConf.product_ppc, conf.caseConf.usell_id);
      actShippingInfo = await checkoutAPI.getShippingInfoAfterCompleteOrder();
      // verify
      expect(actShippingInfo.amount).toBe(expShippingAfterPPC.amount);
      expect(actShippingInfo.method_title).toBe(expShippingAfterPPC.method_title);
    });

    await test.step("User kiểm tra thông tin shipping và profit của order vừa tạo tại order detail trong dashboard.", async () => {
      orderId = await checkoutAPI.getOrderIDByAPI();
      await orderPage.goToOrderByOrderId(orderId);

      // Expected:
      // - Show thông tin shipping đúng với actShippingAfterPPC
      expect(await orderPage.getShippingRateName()).toBe(actShippingInfo.method_title);
      expect(await orderPage.getShippingFee()).toBe(actShippingInfo.amount.toFixed(2));
    });
  });

  test(`@SB_PLB_PODPL_POPLS_34 PPC có rate khác tên với Shipping method đã chọn của order.Shipping method đã chọn của order là rate giá cao, cùng group`, async ({
    conf,
    authRequest,
    page,
    dashboard,
  }) => {
    const shippingBeforePPC = conf.caseConf.shipping_method_before_ppc;
    const expShippingAfterPPC = conf.caseConf.shipping_method_after_ppc;
    const shippingAddress = conf.suiteConf.shipping_address_api;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(dashboard, domain);
    let actShippingInfo: ShippingMethod;

    await test.step("Buyer Chọn shipping method > Complete checkout > Add item PPC > Kiểm tra shipping method", async () => {
      // Create a checkout then select shipping method
      await checkoutAPI.addProductThenSelectShippingMethod(
        productCheckout,
        email,
        shippingAddress,
        shippingBeforePPC.method_title,
      );

      // Complete order
      await checkoutAPI.activatePostPurchase();
      await checkoutAPI.authorizedThenCreateStripeOrder(conf.suiteConf.card_info);

      // Verify shipping before add PPC
      actShippingInfo = await checkoutAPI.getShippingInfoAfterCompleteOrder();
      expect(actShippingInfo.amount).toBe(shippingBeforePPC.amount);

      // Add PPC then verify shipping info
      await checkoutAPI.addPostPurchaseToCart(conf.caseConf.product_ppc, conf.caseConf.usell_id);
      actShippingInfo = await checkoutAPI.getShippingInfoAfterCompleteOrder();
      // verify
      expect(actShippingInfo.amount).toBe(expShippingAfterPPC.amount);
      expect(actShippingInfo.method_title).toBe(expShippingAfterPPC.method_title);
    });

    await test.step("User kiểm tra thông tin shipping và profit của order vừa tạo tại order detail trong dashboard.", async () => {
      orderId = await checkoutAPI.getOrderIDByAPI();
      await orderPage.goToOrderByOrderId(orderId);

      // Expected:
      // - Show thông tin shipping đúng với actShippingAfterPPC
      expect(await orderPage.getShippingRateName()).toBe(actShippingInfo.method_title);
      expect(await orderPage.getShippingFee()).toBe(actShippingInfo.amount.toFixed(2));
    });
  });
});
