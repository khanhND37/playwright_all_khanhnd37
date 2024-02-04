import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
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

test.describe("Shipping profile PrintBase - full flow with UI", () => {
  let checkoutPage: SFCheckout;
  let orderPage: OrdersPage;
  let checkoutAPI: CheckoutAPI;
  let domain, email, shippingAddress, productCheckout;
  let orderId;
  let expShippingMethods: Array<ShippingMethod>;
  let shippingInfoOfOrder, shippingFeeOnOrderSummary;

  test.beforeEach(async ({ conf, page, dashboard }) => {
    domain = conf.suiteConf.domain;
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    productCheckout = conf.caseConf.products_checkout;
    expShippingMethods = conf.caseConf.expected_shipping_methods;
  });

  test(`@SB_SET_SPP_SPR_3 Check hiển thị shipping fee khi thay đổi item trong cart`, async ({ conf, page }) => {
    test.setTimeout(300000);
    const additionalProduct = conf.caseConf.additional_product;
    const expShippingMethodsAfterAddProduct = conf.caseConf.expected_shipping_methods_after_add_product;
    shippingAddress = conf.caseConf.shipping_address;

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
      await orderPage.goToOrderByOrderId(orderId, "pbase");

      // Expected:
      // - Show thông tin shipping:
      //  + Method: "Economic Shipping"
      //  + Shipping fee: $9
      expect(await orderPage.getShippingRateName()).toBe(shippingInfoOfOrder.method_title);
      expect(await orderPage.getShippingFee()).toBe(shippingInfoOfOrder.amount);
    });
  });

  test(`@SB_PLB_SP_SPP_SPR_47 Khi order có 01 sản phẩm không thoả mãn rule shipping thì order không có shipping`, async ({
    page,
    conf,
  }) => {
    test.setTimeout(300000);
    const additionalProduct = conf.caseConf.additional_product;
    shippingAddress = conf.caseConf.shipping_address;

    await test.step(`Buyer thực hiện order item B đến trang checkout > Nhập shipping address > Kiểm tra hiển thị shipping method`, async () => {
      await checkoutPage.addToCartThenGoToShippingMethodPage(productCheckout, shippingAddress);

      // Shipping fee hiển thị tại shipping method:
      //  + Không có shipping method.
      //  + Show thông báo "The following items don’t ship to your location.
      //                    Please replace them with another products and place your order again."
      //  + Disable btn 'Place your order'
      expect(await checkoutPage.verifyShippingMethodOnPage()).toBeTruthy();
    });

    await test.step(`Thực hiện quay lại SF > add thêm item A vào cart > Sang trang checkout > Kiểm tra hiển thị shipping method`, async () => {
      await page.goto(`https://${domain}`);
      await checkoutPage.addToCartThenNavigateToCheckout(additionalProduct);

      // Shipping fee hiển thị tại shipping method:
      //  + Không có shipping method.
      //  + Show thông báo "The following items don’t ship to your location.
      //                    Please replace them with another products and place your order again."
      //  + Disable btn 'Place your order'
      expect(await checkoutPage.verifyShippingMethodOnPage()).toBeTruthy();
    });
  });

  test(`@SB_PLB_SP_SPP_SPR_48 Khi thay đổi Shipping address thì fee shipping cũng thay đổi tương ứng`, async ({
    page,
    conf,
    authRequest,
  }) => {
    test.setTimeout(300000);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address_api;
    const shippingMethodOfRegions = conf.caseConf.shipping_method_for_each_region;

    await test.step(`Buyer thực hiện order 2 item A đến trang checkout > Nhập shipping address đến US - CA > Kiểm tra hiển thị shipping method`, async () => {
      const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productCheckout, email, shippingAddress);
      verifyShippingMethod(expShippingMethods, actShippingMethods);
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.verifyShippingMethodOnPage(expShippingMethods)).toBe(true);
    });

    await test.step(`Chọn shipping method > Kiểm tra Shipping fee hiển thị tại order summary`, async () => {
      await checkoutPage.selectShippingMethod(expShippingMethods[0].method_title);
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
    });

    for (const shippingMethodOfRegion of shippingMethodOfRegions) {
      await test.step(`Update shipping address đến ${shippingMethodOfRegion.shipping_address.city} > Kiểm tra hiển thị shipping method`, async () => {
        await checkoutPage.page.locator("//span[normalize-space()='Shipping address']").scrollIntoViewIfNeeded();
        await checkoutPage.enterShippingAddress(shippingMethodOfRegion.shipping_address);
        expect(await checkoutPage.verifyShippingMethodOnPage(shippingMethodOfRegion.expected_shipping_methods)).toBe(
          true,
        );
      });
    }
  });
});

test.describe("Kiểm tra shipping rules với case không có PPC", () => {
  const casesID = "DD_14_15_16_18_19";
  const conf = loadData(__dirname, casesID);

  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      products_checkout: productCheckout,
      expected_shipping_methods: expShippingMethods,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest, page }) => {
        const { domain, email, shipping_address } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        let checkoutPage: SFCheckout;
        let shippingFeeOnOrderSummary;

        await test.step(`Buyer thực hiện order 2 items A và 2 items B đến trang checkout > Nhập shipping address > Kiểm tra hiển thị shipping method`, async () => {
          const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(
            productCheckout,
            email,
            shipping_address,
          );
          verifyShippingMethod(expShippingMethods, actShippingMethods);

          checkoutPage = await checkoutAPI.openCheckoutPageByToken();
          expect(await checkoutPage.verifyShippingMethodOnPage(expShippingMethods)).toBeTruthy();
          await checkoutPage.selectShippingMethod(expShippingMethods[0].method_title);
          shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
          expect(shippingFeeOnOrderSummary).toBe(expShippingMethods[0].amount.toFixed(2));
        });
      });
    },
  );
});

test.describe("Kiểm tra các case có Post-Purchase", () => {
  const casesID = "DD_26_28_30_33";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      products_checkout: productsCheckout,
      product_ppc: productPPC,
      usell_id: uSellId,
      shipping_method_before_ppc: shippingBeforePPC,
      shipping_method_after_ppc: expShippingAfterPPC,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest, page, token }) => {
        const { domain, email, shipping_address_api, card_info } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const checkoutPage = new SFCheckout(page, domain);
        const shopToken = await token.getWithCredentials({
          domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const orderPage = new OrdersPage(page, domain);
        const shippingMethodName = shippingBeforePPC.method_title;
        let orderId, actShippingAfterPPC;

        await test.step("Buyer Chọn shipping method > Complete checkout > Add item PPC > Kiểm tra shipping method", async () => {
          await checkoutAPI.addProductThenSelectShippingMethod(
            productsCheckout,
            email,
            shipping_address_api,
            shippingMethodName,
          );
          await checkoutAPI.activatePostPurchase();
          await checkoutAPI.authorizedThenCreateStripeOrder(card_info);
          await checkoutAPI.addPostPurchaseToCart(productPPC, uSellId);
          actShippingAfterPPC = await checkoutAPI.getShippingInfoAfterCompleteOrder();
          // verify
          expect(actShippingAfterPPC.amount).toBe(expShippingAfterPPC.amount);
          expect(actShippingAfterPPC.method_title).toBe(expShippingAfterPPC.method_title);
        });

        await test.step("User kiểm tra thông tin shipping và profit của order vừa tạo tại order detail trong dashboard.", async () => {
          orderId = await checkoutAPI.getOrderIDByAPI();
          await checkoutPage.openOrderByAPI(orderId, shopToken.access_token, "printbase");

          // Expected:
          // - Show thông tin shipping đúng với actShippingAfterPPC
          expect(await orderPage.getShippingRateName()).toBe(actShippingAfterPPC.method_title);
          expect(await orderPage.getShippingFee()).toBe(actShippingAfterPPC.amount.toFixed(2));
        });
      });
    },
  );
});
