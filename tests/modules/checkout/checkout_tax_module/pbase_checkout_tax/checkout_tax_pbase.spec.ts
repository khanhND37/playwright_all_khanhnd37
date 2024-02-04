import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";
import { isEqual } from "@core/utils/checkout";

/**
 * Zone: United Kingdom: Auto_UK tax
 * -- Tax country: 100$ - 150$ > 10%
 * Zone: United State: Auto_US tax
 * -- Tax country: 0$ - 25$ > 5%
 * -- Tax region:
 * ---- California: 50$ - 100$ > 10%
 * -- Tax override:
 * ---- AOP-KidSweatshirt-Alloverprint-S: California: 90$ - 119$ > 20%
 */
test.describe("[exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let domain, cardInfo;
  let expectTaxAmt: number;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });
  });

  const caseName = "SB_CHE_TPB_01";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product: productInfo,
      case_id: caseID,
      case_name: caseName,
      email,
      shipping_address: shippingAddress,
      tax_shipping: taxShipping,
      discount_code: discountCode,
    }) => {
      test(`${caseName} @${caseID}`, async ({ request, page }) => {
        checkoutAPI = new CheckoutAPI(domain, request, page);
        // prepair data for
        await test.step(`
          Lên storefront của shop
          Checkout 1 sản phẩm
          Nhập các thông tin trong trang:
          + Customer information
          + Shipping
          Verify tax
          `, async () => {
          await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
          if (discountCode) {
            await checkoutAPI.applyDiscountByApi(discountCode);
          }
          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo, taxShipping);
          const actualTaxAmt = await checkoutAPI.getTotalTax();
          expect(actualTaxAmt).toEqual(expectTaxAmt);
        });

        await test.step(`
          Nhập payment method > Click Place your order
          Verify Tax line tại trang checkout
        `, async () => {
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
          const actualTaxAmt = await checkoutAPI.getTotalTax();
          expect(actualTaxAmt).toEqual(expectTaxAmt);
        });

        await test.step(`
          Tại thankyou page > Lấy ra order name
          Login vào dashboard
          Order > Search theo order name
          Vào order detail
          Verify tax line
        `, async () => {
          const orderID = await checkoutAPI.getOrderIDByAPI();
          const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
          expect(totalTaxDB).toEqual(expectTaxAmt);
        });
      });
    },
  );
});

test.describe("[exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page, order có PPC item", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout;
  let domain, cardInfo;
  let expectTaxAmt: number;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });
  });

  test.beforeEach(({ request, page }) => {
    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkout = new SFCheckout(page, domain);
  });
  test(`
  [exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page for case @SB_SET_TM_TPRB_172`, async ({
    conf,
  }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const usellId = conf.caseConf.usell_id;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;

    await test.step(`
      Lên storefront của shop
      Checkout 1 sản phẩm:
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping
      Verify tax line
      Nhập card/account checkout
      Click Complete order
      `, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI.activatePostPurchase();

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);

      await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await checkoutAPI.addPostPurchaseToCart(productPPC, usellId);
      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);
    });

    await test.step(`
      Tại thankyou page > Lấy ra order name
      Login vào dashboard
      Order > Search theo order name
      Vào order detail
      Verify tax line
      `, async () => {
      const orderID = await checkoutAPI.getOrderIDByAPI();
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(totalTaxDB).toEqual(expectTaxAmt);
    });
  });

  test(`
  [exclude] (Paypal) Kiểm tra tax line ở checkout page, thankyou page,
  order stt page for case @SB_SET_TM_TPRB_173`, async ({ page, conf }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const ppcItem = conf.caseConf.product_ppc_name;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const paymentMethod = conf.caseConf.payment_method;
    const paypalAccount = conf.caseConf.paypal_account;

    await test.step(`
      Lên storefront của shop
      Checkout 1 sản phẩm:
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping
      Verify tax line
      Nhập card/account checkout
      Click Complete order
      `, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI.activatePostPurchase();

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);

      await checkoutAPI.openCheckoutPageByToken();
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.clickRadioButtonWithLabel("Same as shipping address");

      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPayPal(paypalAccount);
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await checkout.addProductPostPurchase(ppcItem);
      await checkout.completePaymentForPostPurchaseItem(paymentMethod);

      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);
    });

    await test.step(`
      Tại thankyou page > Lấy ra order name
      Login vào dashboard
      Order > Search theo order name
      Vào order detail
      Verify tax line
      `, async () => {
      const orderID = await checkoutAPI.getOrderIDByAPI();
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(totalTaxDB).toEqual(expectTaxAmt);
    });
  });

  test(`
  [exclude] Check total profits với order có tax đã bao gồm trong giá @SB_SET_TM_TPRB_175`, async ({
    conf,
    authRequest,
    page,
  }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const usellId = conf.caseConf.usell_id;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;

    await test.step(`
      Lên storefront của shop
      Checkout 1 sản phẩm:
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping
      Verify tax line
      Nhập card/account checkout
      Click Complete order
      `, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI.activatePostPurchase();

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);

      await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await checkoutAPI.addPostPurchaseToCart(productPPC, usellId);
      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);
    });

    await test.step(`
      Tại thankyou page > Lấy ra order name
      Login vào dashboard
      Order > Search theo order name
      Vào order detail
      Verify tax line
      Verify order profit
      `, async () => {
      dashboardAPI = new DashboardAPI(domain, authRequest, page);
      const orderID = await checkoutAPI.getOrderIDByAPI();
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(totalTaxDB).toEqual(expectTaxAmt);

      let orderInfo, isProfitcalculated;
      orderInfo = await dashboardAPI.getOrderInfoByApi(orderID, "Printbase");
      isProfitcalculated = JSON.stringify(orderInfo.pbase_order).includes("profit");

      // Wait for profit to be calculated on Dev
      if (process.env.ENV === "dev" && !isProfitcalculated) {
        for (let i = 0; i < 10; i++) {
          await dashboardAPI.waitAbit(5000);
          orderInfo = await dashboardAPI.getOrderInfoByApi(orderID, "Printbase");
          isProfitcalculated = JSON.stringify(orderInfo.pbase_order).includes("profit");
          if (isProfitcalculated) {
            break;
          }
        }
      }

      const actProfit = orderInfo.pbase_order.profit;
      const expProfitAndFee = await dashboardAPI.calculateProfitAndFeesPbaseFromAPI(orderID);
      expect(actProfit.toFixed(2)).toEqual(expProfitAndFee.profit.toFixed(2));
    });
  });
});

test.describe("[include] Kiểm tra tax line ở checkout page, thankyou page, order stt page", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let domain, cardInfo;
  let expectTaxAmt: number;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });
  });

  const caseName = "SB_CHE_TPB_02";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product: productInfo,
      case_id: caseID,
      case_name: caseName,
      email,
      shipping_address: shippingAddress,
      tax_shipping: taxShipping,
      discount_code: discountCode,
    }) => {
      test(`${caseName} @${caseID}`, async ({ request, page }) => {
        checkoutAPI = new CheckoutAPI(domain, request, page);
        // prepair data for
        await test.step(`
          Lên storefront của shop
          Checkout 1 sản phẩm
          Nhập các thông tin trong trang:
          + Customer information
          + Shipping
          Verify tax
          `, async () => {
          await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
          if (discountCode) {
            await checkoutAPI.applyDiscountByApi(discountCode);
          }
          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo, taxShipping);
          const actualTaxAmt = await checkoutAPI.getTotalTax();
          expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);
        });

        await test.step(`
          Nhập payment method > Click Place your order
          Verify Tax line tại trang checkout
        `, async () => {
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
          const actualTaxAmt = await checkoutAPI.getTotalTax();
          expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);
        });

        await test.step(`
          Tại thankyou page > Lấy ra order name
          Login vào dashboard
          Order > Search theo order name
          Vào order detail
          Verify tax line
        `, async () => {
          const orderID = await checkoutAPI.getOrderIDByAPI();
          const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
          expect(isEqual(totalTaxDB, expectTaxAmt, 0.01)).toEqual(true);
        });
      });
    },
  );
});

test.describe("[include] Kiểm tra tax line ở checkout page, thankyou page, order stt page, order có PPC item", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout;
  let domain, cardInfo;
  let expectTaxAmt: number;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });
  });

  test.beforeEach(({ request, page }) => {
    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkout = new SFCheckout(page, domain);
  });
  test(`
  [include] Kiểm tra tax line ở checkout page, thankyou page, order stt page for case @SB_SET_TM_TPRB_172`, async ({
    conf,
  }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const usellId = conf.caseConf.usell_id;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;

    await test.step(`
      Lên storefront của shop
      Checkout 1 sản phẩm:
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping
      Verify tax line
      Nhập card/account checkout
      Click Complete order
      `, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI.activatePostPurchase();

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);

      await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await checkoutAPI.addPostPurchaseToCart(productPPC, usellId);
      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);
    });

    await test.step(`
      Tại thankyou page > Lấy ra order name
      Login vào dashboard
      Order > Search theo order name
      Vào order detail
      Verify tax line
      `, async () => {
      const orderID = await checkoutAPI.getOrderIDByAPI();
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(isEqual(totalTaxDB, expectTaxAmt, 0.01)).toEqual(true);
    });
  });

  test(`
  [include] (Paypal) Kiểm tra tax line ở checkout page, thankyou page, 
  order stt page for case @SB_SET_TM_TPRB_154`, async ({ page, conf }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const ppcItem = conf.caseConf.product_ppc_name;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const paymentMethod = conf.caseConf.payment_method;
    const paypalAccount = conf.caseConf.paypal_account;

    await test.step(`
      Lên storefront của shop
      Checkout 1 sản phẩm:
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping
      Verify tax line
      Nhập card/account checkout
      Click Complete order
      `, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI.activatePostPurchase();

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);

      await checkoutAPI.openCheckoutPageByToken();
      await checkout.clickRadioButtonWithLabel("Same as shipping address");

      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPayPal(paypalAccount);
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await checkout.addProductPostPurchase(ppcItem);
      await checkout.completePaymentForPostPurchaseItem(paymentMethod);
      await page.waitForNavigation();
      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);
    });

    await test.step(`
      Tại thankyou page > Lấy ra order name
      Login vào dashboard 
      Order > Search theo order name 
      Vào order detail
      Verify tax line
      `, async () => {
      const orderID = await checkoutAPI.getOrderIDByAPI();
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(isEqual(totalTaxDB, expectTaxAmt, 0.01)).toEqual(true);
    });
  });
});
