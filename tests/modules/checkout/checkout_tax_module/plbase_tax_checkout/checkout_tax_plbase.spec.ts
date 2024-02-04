import { expect } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";

import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderSummary } from "@types";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";

/**
 * Zone: United Kingdom: Auto_UK tax
 * -- Tax country: 100$ - 150$ > 10%
 * Zone: United State: Auto_US tax
 * -- Tax country: 0$ - 25$ > 8%
 * -- Tax region:
 * ---- California: 50$ - 100$ > 15%
 * -- Tax override:
 * ---- Auto_OverCa: California: 90$ - 119$ > 30%
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

  const caseName = "TAX_CHECKOUT_PLBASE_01";
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
      test(`${caseName} @${caseID}`, async ({ page, request }) => {
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
  let odooService;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });
  });

  test.beforeEach(async ({ request, page, odoo, conf }) => {
    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkout = new SFCheckout(page, domain);
    odooService = OdooService(odoo);

    if (process.env.ENV === "dev") {
      return;
    }
    for (const productTplId of conf.suiteConf.product_tpl_ids) {
      await odooService.updateShippingTypeProductTemplate(productTplId, ["PlusBase Standard Shipping"]);
    }
  });
  test(`
  [exclude] order PlusBase sau khi add PPC đạt threshold thì sẽ được tính thuế @SB_PLB_TP_TC_126`, async ({ conf }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const usellId = conf.caseConf.usell_id;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const countryCode = shippingAddress.country_code;

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
      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
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
  [exclude] Kiểm tra tax line trên trang checkout, thankyou, và order detail khi checkout với item là Combo @SB_PLB_TP_TC_131`, async ({
    conf,
  }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const usellId = conf.caseConf.usell_id;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const countryCode = shippingAddress.country_code;

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
      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
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
  [exclude] Hiển thị Taxline khi order PlusBase đạt mức Theshold, checkout qua cổng PayPal @SB_PLB_TP_TC_127`, async ({
    conf,
  }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const ppcItem = conf.caseConf.product_ppc_name;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const paymentMethod = conf.caseConf.payment_method;
    const paypalAccount = conf.caseConf.paypal_account;
    const countryCode = shippingAddress.country_code;

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
      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.activatePostPurchase();

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);

      await checkoutAPI.openCheckoutPageByToken();

      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPayPal(paypalAccount);
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
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
});

test.describe("[Include] Kiểm tra tax line ở checkout page, thankyou page, order stt page", () => {
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

  const caseName = "TAX_CHECKOUT_PLBASE_02";
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
      test(`${caseName} @${caseID}`, async ({ page, request }) => {
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
  let domain, accessToken, cardInfo, productInfo, productPPC, usellId, email, shippingAddress, ppcItem, paymentMethod;
  let orderSummaryInfo: OrderSummary;
  let expectTaxAmt: number;
  let odooService;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest, token }) => {
    domain = conf.suiteConf.domain;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });
  });

  test.beforeEach(async ({ request, page, conf, odoo }) => {
    productInfo = conf.caseConf.product;
    productPPC = conf.caseConf.product_ppc;
    usellId = conf.caseConf.usell_id;
    email = conf.caseConf.email;
    shippingAddress = conf.caseConf.shipping_address;
    ppcItem = conf.caseConf.product_ppc_name;
    paymentMethod = conf.caseConf.payment_method;
    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkout = new SFCheckout(page, domain);
    odooService = OdooService(odoo);

    if (process.env.ENV === "dev") {
      return;
    }
    for (const productTplId of conf.suiteConf.product_tpl_ids) {
      await odooService.updateShippingTypeProductTemplate(productTplId, ["PlusBase Standard Shipping"]);
    }
  });

  test(`
  [include] order PlusBase sau khi add PPC đạt threshold thì sẽ được tính thuế @SB_PLB_TP_TC_116`, async () => {
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
  [include] Hiển thị Taxline khi order PlusBase đạt mức Theshold, checkout qua cổng PayPal @SB_PLB_TP_TC_117`, async ({
    page,
  }) => {
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

      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPayPal();
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
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

  test(`
  [include] Check total profits với order có tax đã bao gồm trong giá @SB_PLB_TP_TC_132`, async ({ page }) => {
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

      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPayPal();
    });

    await test.step(`
      Tại popup Post-purchase > Add item: Post-purchase > Commplete order
      `, async () => {
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addProductPostPurchase(ppcItem);
      await checkout.completePaymentForPostPurchaseItem(paymentMethod);
      await page.waitForNavigation();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      orderSummaryInfo = await checkout.getOrderSummaryInfo();
      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(isEqual(actualTaxAmt, expectTaxAmt, 0.01)).toEqual(true);
    });

    await test.step(`
      Tại thankyou page > Lấy ra order name
      Login vào dashboard 
      Vào order detail
      Verify tax line
      Verify order profit
      `, async () => {
      const orderID = await checkoutAPI.getOrderIDByAPI();
      const orderPage = await checkout.openOrderByAPI(orderID, accessToken, "plusbase");
      await orderPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      const orderProfit = removeCurrencySymbol(await orderPage.getProfit());
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(isEqual(totalTaxDB, expectTaxAmt, 0.01)).toEqual(true);

      orderPage.calculateProfitPlusbase(
        orderSummaryInfo.totalPrice,
        orderSummaryInfo.subTotal,
        Number(orderSummaryInfo.discountValue),
        baseCost,
        shippingCost,
        Number(orderSummaryInfo.shippingValue),
        totalTaxDB,
        orderSummaryInfo.tippingVal,
      );
      expect(isEqual(Number(orderProfit), Number(orderPage.profit.toFixed(2)), 0.01)).toEqual(true);
    });
  });
});
