import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { SettingShipping } from "@pages/dashboard/setting_shipping";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import type { CheckoutInfo, Product } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";

//Calculate shipping amount after apply free shipping cap value
const calShippingAmt = (
  shippingAmt: number,
  maxCapValue: number,
  shippingAmtPPC?: number,
): { originShipFee: number; newShippingValue: string } => {
  let newShippingValue;
  if (!shippingAmtPPC) {
    shippingAmtPPC = 0;
  }
  const originShipFee = shippingAmt + shippingAmtPPC;
  const discountShipValue = shippingAmt + shippingAmtPPC - maxCapValue;
  if (discountShipValue <= 0) {
    newShippingValue = "Free";
  } else {
    newShippingValue = discountShipValue.toFixed(2);
  }
  const expectShippingFee = {
    originShipFee: originShipFee,
    newShippingValue: newShippingValue,
  };
  return expectShippingFee;
};

// Verify shipping fee when apply free shipping cap value in checkout page and order detail
const verifyShippingFee = (actualShippingFee, expectShippingFee) => {
  expect(actualShippingFee.originShipFee).toEqual(expectShippingFee.originShipFee);
  expect(actualShippingFee.newShippingValue).toEqual(expectShippingFee.newShippingValue);
  if (actualShippingFee.shippingValInOrdSummary) {
    expect(actualShippingFee.shippingValInOrdSummary).toEqual(expectShippingFee.newShippingValue);
  }
};

const verifyShippingValue = (actualShippingFee, expectShippingFee) => {
  expect(actualShippingFee.newShippingValue).toEqual(expectShippingFee.finalShippingValue);
  expect(actualShippingFee.shippingValInOrdSummary).toEqual(expectShippingFee.finalShippingValue);
  if (expectShippingFee.originShipFee) {
    expect(actualShippingFee.originShipFee).toEqual(expectShippingFee.originShipFee);
  }
};

test.describe("Checkout success when apply free shipping maximum value", () => {
  let domain, shippingZone, shippingZoneDefault, productInfo, customerInfo;
  let expectShippingFee;
  let checkout: SFCheckout;
  let homepage: SFHome;
  let shippingSetting: SettingShipping;
  let orderPage: OrdersPage;

  const caseName = "FREE_SHIPPING_CAP_VAL_01";
  const conf = loadData(__dirname, caseName);
  test.beforeEach(async ({ dashboard, conf, page, request }) => {
    domain = conf.suiteConf.domain;

    productInfo = conf.suiteConf.product_info;
    shippingZone = conf.suiteConf.shipping_zone;
    shippingZoneDefault = conf.suiteConf.shipping_zone_default;
    customerInfo = conf.suiteConf.customer_info;
    checkout = new SFCheckout(page, domain, "", request);
    homepage = new SFHome(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    shippingSetting = new SettingShipping(dashboard, domain);
    await shippingSetting.goto("/admin/settings/shipping");
    await shippingSetting.settingFreeshipRatePbase(shippingZone);
  });

  test.afterEach(async () => {
    await shippingSetting.goto("/admin/settings/shipping");
    await shippingSetting.settingFreeshipRatePbase(shippingZoneDefault);
  });

  // for each data, will do tests
  conf.caseConf.data.forEach(({ shipping_method: shippingMethod, case_id: caseID, case_name: caseName }) => {
    test(`${caseName} @${caseID}`, async () => {
      await test.step(`
        - Lên storefront của shop
        - Checkout sản phẩm: Shirt: 72$
        - Nhập các thông tin trong trang: 
          + Customer information
          + Chọn shipping method
        - Verify discount shipping value`, async () => {
        await homepage.gotoHomePage();
        await checkout.addToCartThenGoToShippingMethodPage(productInfo, customerInfo);
        await checkout.waitForCheckoutPageCompleteRender();
        const shippingValInfo = await checkout.selectAndGetShippingInfoWithMethod(shippingMethod[0].method_name);

        expectShippingFee = calShippingAmt(shippingMethod[0].shipping_fee, shippingZone.max_discount_amt);
        verifyShippingFee(shippingValInfo, expectShippingFee);
      });

      await test.step(`
        - Chọn shipping method còn lại
        - Verify discount shipping value`, async () => {
        const shippingValInfo = await checkout.selectAndGetShippingInfoWithMethod(shippingMethod[1].method_name);

        expectShippingFee = calShippingAmt(shippingMethod[1].shipping_fee, shippingZone.max_discount_amt);
        verifyShippingFee(shippingValInfo, expectShippingFee);
      });

      await test.step(`- Nhập payment method > Click Place your order`, async () => {
        await checkout.selectPaymentMethod();
        await checkout.completeOrderWithMethod();

        //in order to by pass post purchase without adding item
        await checkout.addProductPostPurchase(null);
        expect(await checkout.isThankyouPage()).toBe(true);
      });

      await test.step(`
        - Tại thankyou page > Lấy ra order name
        - Login vào dashboard 
        - Vào order detail
        - Verify shipping line`, async () => {
        const orderId = await checkout.getOrderIdBySDK();
        await orderPage.goToOrderByOrderId(orderId, "pbase");
        const shipInfoInOrdDetail = await orderPage.getShippingValuesInOrdDetail(shippingMethod[1].method_name);
        verifyShippingFee(shipInfoInOrdDetail, expectShippingFee);
      });
    });
  });
});

test.describe("Checkout success when apply free shipping maximum value with post purchase", () => {
  let domain, shippingZone, shippingZoneDefault, productInfo, customerInfo, ppcInfo;
  let expectShippingFee;
  let checkout: SFCheckout;
  let homepage: SFHome;
  let shippingSetting: SettingShipping;
  let orderPage: OrdersPage;

  const caseName = "FREE_SHIPPING_CAP_VAL_02";
  const conf = loadData(__dirname, caseName);
  test.beforeEach(async ({ dashboard, conf, page, request }) => {
    domain = conf.suiteConf.domain;
    productInfo = conf.suiteConf.product_info;
    shippingZone = conf.suiteConf.second_shipping_zone;
    shippingZoneDefault = conf.suiteConf.shipping_zone_default;
    customerInfo = conf.suiteConf.customer_info;
    ppcInfo = conf.suiteConf.post_purchase_info;
    homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain, "", request);
    orderPage = new OrdersPage(dashboard, domain);
    shippingSetting = new SettingShipping(dashboard, domain);
    await shippingSetting.goto("/admin/settings/shipping");
    await shippingSetting.settingFreeshipRatePbase(shippingZone);
  });

  test.afterEach(async () => {
    await shippingSetting.goto("/admin/settings/shipping");
    await shippingSetting.settingFreeshipRatePbase(shippingZoneDefault);
  });

  // for each data, will do tests
  conf.caseConf.data.forEach(({ shipping_method: shippingMethod, case_id: caseID, case_name: caseName }) => {
    test(`${caseName} @${caseID}`, async () => {
      await test.step(`
        - Lên storefront của shop
        - Checkout 1 sản phẩm: Shirt: 72$
        - Nhập các thông tin trong trang: 
          + Customer information
          + Chọn shipping method
        - Verify discount shipping value`, async () => {
        await homepage.gotoHomePage();
        await checkout.addToCartThenGoToShippingMethodPage(productInfo, customerInfo);
        await checkout.waitForCheckoutPageCompleteRender();
        const shippingValInfo = await checkout.selectAndGetShippingInfoWithMethod(shippingMethod.method_name);

        expectShippingFee = calShippingAmt(shippingMethod.shipping_fee, shippingZone.max_discount_amt);
        verifyShippingFee(shippingValInfo, expectShippingFee);
      });

      await test.step(`- Nhập payment method > Click Place your order`, async () => {
        await checkout.continueToPaymentMethod();
        await checkout.selectPaymentMethod();
        await checkout.completeOrderWithMethod();
        expect(await checkout.isThankyouPage({ ignorePPC: true, timeout: 5000 })).toBe(true);
      });

      await test.step(`
        - Tại Popup PPC > Add item PPC vào order
        - Tại Thankyou page > Verify shipping line`, async () => {
        if (ppcInfo.post_purchase_name) {
          await checkout.page.waitForSelector(checkout.xpathPPCPopupContent);
        }
        await checkout.addProductPostPurchase(ppcInfo.post_purchase_name);
        await checkout.completePaymentForPostPurchaseItem("Stripe");
        const shippingValInOrdSummary = await checkout.getShippingFeeOnOrderSummary();
        expectShippingFee = calShippingAmt(
          shippingMethod.shipping_fee,
          shippingZone.max_discount_amt,
          ppcInfo.shipping_fee,
        );
        expect(shippingValInOrdSummary).toEqual(expectShippingFee.newShippingValue);
      });

      await test.step(`
        - Tại thankyou page > Lấy ra order name
        - Login vào dashboard 
        - Vào order detail
        - Verify shipping line`, async () => {
        const orderId = await checkout.getOrderIdBySDK();
        await orderPage.goToOrderByOrderId(orderId, "pbase");
        const shipInfoInOrdDetail = await orderPage.getShippingValuesInOrdDetail(shippingMethod.method_name);

        verifyShippingFee(shipInfoInOrdDetail, expectShippingFee);
      });
    });
  });
});

test.describe("Shipping PrintBase - auto free shipping fee for regions", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let productCheckout: Array<Product>;
  let shopToken;
  let checkoutInfo: CheckoutInfo;
  let expShippingMethods;
  let shippingFeeOnOrderSummary: string;
  let productPPC: string;

  // let paymentFeePercent: number;
  // let processingFeePercent: number;
  // let expOrderProfit: number;
  // let actOrderProfit: number;

  // Config setting on dashboard:
  // - Setting free shipping khi mua $70 với shipping address = US
  // - Setting manual discount: "discount" - fixed amount $20
  // - Setting PPC Products PPC sau khi mua Products checkout

  test.beforeEach(async ({ conf, authRequest, page, token }) => {
    const { domain, email, shipping_address_api } = conf.suiteConf as never;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    shopToken = await token.getWithCredentials({
      domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    productCheckout = conf.caseConf.products_checkout;
    expShippingMethods = conf.caseConf.expected_shipping_methods;
    productPPC = conf.caseConf.product_ppc_name;

    await checkoutAPI.addProductThenSelectShippingMethod(productCheckout, email, shipping_address_api);
    await checkoutAPI.openCheckoutPageByToken();
  });

  test(`Order được apply free shipping khi thoả mãn điều kiện đã setting @SB_SET_SPP_FS_1`, async () => {
    await test.step(`Trên SF, mua 4 sản phẩm Products checkout > nhập shipping address đến US > kiểm tra shipping fee`, async () => {
      // Step's actions on beforeEach()
      // Expected:
      // - Checkout được apply rule free shipping
      // - Order summary hiển thị free shipping
      // - Phần select shipping sẽ hiển thị cả: orginal shipping và freeshipping (orginal shipping sẽ bị gạch ngang)
      // - Eg: 6.99$ Free
      await checkoutPage.waitForCheckoutPageCompleteRender();
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, expShippingMethods[0]);
    });

    await test.step(`Nhập card > click Place your order`, async () => {
      await checkoutPage.completeOrderWithMethod();
      // Expected:
      // - Checkout thành công
      // - Shipping hiển thị free
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe("Free");
    });

    await test.step(`Login vào dashboard, kiểm tra Profit ở order detail`, async () => {
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      await checkoutPage.openOrderByAPI(checkoutInfo.order.id, shopToken.access_token, "printbase");

      // Later: need to check the rules of display shipping
      // - Different betwen 15060470 - 452417519
      // - API order with the field max_free_shipping_value
      // - Value of "Discount shipping" and "Adjusted shipping"

      // Verify profit
      // paymentFeePercent = conf.suiteConf.persent_rates_for_order_fee.payment_fee;
      // processingFeePercent = conf.suiteConf.persent_rates_for_order_fee.processing_fee;
      // expOrderProfit = (await orderPage.calculateProfitAndFeesOrderPbase(paymentFeePercent, processingFeePercent))
      //   .profit;
      // actOrderProfit = parseFloat(await orderPage.getProfit());
      // expect(isEqual(expOrderProfit, actOrderProfit, 0.01)).toBeTruthy();
    });
  });

  test(`Sau khi apply manual discount thì order không thoả mãn điều kiện đã setting, Sau đó add PPC thì vẫn không được free @SB_SET_SPP_FS_2`, async ({
    conf,
  }) => {
    await test.step(`
      - Trên SF, mua 4 sản phẩm Products checkout
      - Nhập shipping address đến US (lúc này order được free shipping)
      - Nhập discount (Total after applying discount = 63.96$)
      - Kiểm tra shipping fee`, async () => {
      // Apply discount
      await checkoutPage.applyDiscountCode(conf.caseConf.discount_code);
      // Need to wait 1-2s because after applying discount need to wait time to call api
      // payment-method and update to UI
      await checkoutPage.page.waitForTimeout(2000);

      // Expected:
      // - Checkout không còn được apply free shipping nữa, hiển thị shipping fee
      await checkoutPage.waitForCheckoutPageCompleteRender();
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, expShippingMethods[0]);
    });

    await test.step(`Complete order > Add product PPC vào order`, async () => {
      await checkoutPage.completeOrderWithMethod();
      await checkoutPage.addProductPostPurchase(productPPC);

      // Expected:
      // - Checkout thành công, hiển thị thankyou page
      // - Checkout vẫn được tính shipping fee (cả phần order + phần PPC)
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(conf.caseConf.shipping_fee_after_ppc);
    });
  });

  test(`Sau khi apply manual discount thì order vẫn thoả mãn điều kiện đã setting @SB_SET_SPP_FS_4`, async ({
    conf,
  }) => {
    await test.step(`
      - Trên SF, mua 5 sản phẩm Products checkout
      - Nhập shipping address đến US (lúc này order được free shipping)
      - Nhập discount (Total after applying discount = 84.95$)- Kiểm tra shipping fee`, async () => {
      // Apply discount
      await checkoutPage.applyDiscountCode(conf.caseConf.discount_code);
      // Need to wait 1-2s because after applying discount need to wait time to call api
      // payment-method and update to UI
      await checkoutPage.page.waitForTimeout(2000);

      // Expected:
      // - Checkout được apply rule free shipping
      // - Order summary hiển thị free shipping
      // - Phần select shipping sẽ hiển thị cả: orginal shipping và freeshipping (orginal shipping sẽ bị gạch ngang)
      // - Eg: 6.99$ Free
      await checkoutPage.waitForCheckoutPageCompleteRender();
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, expShippingMethods[0]);
    });
  });

  test(`Sau khi apply auto discount thì order vẫn thoả mãn điều kiện đã setting, checkout qua paypal, có PPC @SB_SET_SPP_FS_5`, async ({
    conf,
  }) => {
    await test.step(`
      - Trên SF, mua 4 sản phẩm Products checkout
      - Nhập shipping address đến US (lúc này order được free shipping)
      - Checkout được apply discount
      - Kiểm tra shipping fee`, async () => {
      // Expected:
      // - Checkout được apply rule free shipping
      await checkoutPage.waitForCheckoutPageCompleteRender();
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, expShippingMethods[0]);
    });

    await test.step(`Thực hiện complete order qua cổng PayPal`, async () => {
      await checkoutPage.completeOrderWithMethod("Paypal");
      // - Checkout thành công, show PPC
      expect(await checkoutPage.isPostPurchaseDisplayed()).toBeTruthy();
    });

    await test.step(`Add product PPC vào order`, async () => {
      await checkoutPage.addProductPostPurchase(productPPC);
      // await checkoutPage.completePaymentForPPCItemViaPayPalBNPL();
      await checkoutPage.completePaymentForPostPurchaseItem("PayPal");

      // Expected:
      // - Checkout thành công, hiển thị thankyou page
      // - Checkout vẫn được tính shipping fee (cả phần order + phần PPC)
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      shippingFeeOnOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOnOrderSummary).toBe(conf.caseConf.shipping_fee_after_ppc);
    });
    await test.step(`Click Pay now`, async () => {
      // fill your code here
    });
  });

  test(`Checkout được apply discount vendor = 'free shipping' và total amount không thoả mãn điều kiện @SB_SET_SPP_FS_6`, async ({
    conf,
  }) => {
    await test.step(`
      - Trên SF, mua 3 sản phẩm Products checkout
      - Nhập shipping address đến US (lúc này order không free shipping)
      - Nhập discount
      - Kiểm tra shipping fee`, async () => {
      await checkoutPage.waitForCheckoutPageCompleteRender();
      let shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, conf.caseConf.expected_shipping_methods_before_discount[0]);

      await checkoutPage.applyDiscountCode(conf.caseConf.discount_code);

      shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, expShippingMethods[0]);
    });
  });
});
