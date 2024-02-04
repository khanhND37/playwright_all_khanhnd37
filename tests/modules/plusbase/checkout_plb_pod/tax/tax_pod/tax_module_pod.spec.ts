import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";
import { isEqual } from "@core/utils/checkout";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import type { OrderSummary } from "@types";
import { AppsAPI } from "@pages/api/apps";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";

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
test.describe("Kiểm tra tax line ở checkout page, thankyou page, order stt page", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let domain, cardInfo;
  let expectTaxAmt: number;

  const caseName = "TAX_PLB_POD_1";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product: productInfo,
      case_id: caseID,
      case_description: caseDescription,
      email,
      shipping_address: shippingAddress,
      tax_shipping: taxShipping,
      discount_code: discountCode,
      is_tax_include: isTaxInclude,
      is_add_ppc: isAddPPC,
    }) => {
      test(`@${caseID} ${caseDescription}`, async ({ request, page, authRequest }) => {
        domain = conf.suiteConf.domain;
        cardInfo = conf.suiteConf.card_info;
        dashboardAPI = new DashboardAPI(domain, authRequest);
        checkoutAPI = new CheckoutAPI(domain, request, page);
        const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
        if (isAddPPC) {
          await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, true);
        } else {
          await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, false);
        }

        await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: isTaxInclude });
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
          expect(Number(actualTaxAmt.toFixed(2))).toEqual(expectTaxAmt);
        });

        await test.step(`
          Nhập payment method > Click Place your order
          Verify Tax line tại trang checkout
        `, async () => {
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
          const actualTaxAmt = await checkoutAPI.getTotalTax();
          expect(Number(actualTaxAmt.toFixed(2))).toEqual(expectTaxAmt);
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
          expect(Number(totalTaxDB.toFixed(2))).toEqual(expectTaxAmt);
        });
      });
    },
  );
});

test.describe("[exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page, order có PPC item", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout;
  let domain;
  let expectTaxAmt: number;
  let orderApi: OrderAPI;
  let orderSummaryInfo: OrderSummary;
  //setting tax exclude
  test.beforeAll(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });
  });

  test.beforeEach(({ request, page, authRequest }) => {
    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkout = new SFCheckout(page, domain);
    orderApi = new OrderAPI(domain, authRequest);
  });
  test(`
  @SB_PLB_PODPL_TAX_21 [exclude] (Paypal) Kiểm tra tax line ở checkout page, thankyou page,
  order stt page for case`, async ({ page, conf, authRequest }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const ppcItem = conf.caseConf.product_ppc_name;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const paymentMethod = conf.caseConf.payment_method;
    const paypalAccount = conf.caseConf.paypal_account;
    const isAddPPC = conf.caseConf.is_add_ppc;
    const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    if (isAddPPC) {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, true);
    } else {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, false);
    }

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
  @SB_PLB_PODPL_TAX_23 [exclude] Check total profits với order có tax đã bao gồm trong giá`, async ({
    page,
    conf,
    token,
    authRequest,
  }) => {
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const ppcItem = conf.caseConf.product_ppc_name;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const paymentMethod = conf.caseConf.payment_method;
    const paypalAccount = conf.caseConf.paypal_account;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    const orderPage = new OrdersPage(page, domain);
    const isAddPPC = conf.caseConf.is_add_ppc;
    const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    if (isAddPPC) {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, true);
    } else {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, false);
    }

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
      Verify order profit
      `, async () => {
      const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);

      //get order summary info
      orderSummaryInfo = await checkout.getOrderSummaryInfo();

      //open order detail page
      const orderID = await checkoutAPI.getOrderIDByAPI();
      await checkout.openOrderByAPI(orderID, accessToken, "plusbase");

      // Verify tax
      const totalTaxDB = await dashboardAPI.getTotalTaxInOrderDetail(orderID);
      expect(totalTaxDB).toEqual(expectTaxAmt);

      // wait until order's profit has been calculated
      await orderPage.waitForProfitCalculated();

      // Verify profit
      await orderPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost(plusbaseOrderAPI)));
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orderPage.getTax()));
      const taxDesciption = await orderPage.getTaxDesciption();
      if (taxDesciption.includes("include")) {
        taxInclude = tax;
      }

      const expProfitAndFee = orderPage.calculateProfitPlusbase(
        orderSummaryInfo.totalPrice,
        orderSummaryInfo.subTotal,
        Math.abs(Number(orderSummaryInfo.discountValue)),
        baseCost,
        shippingCost,
        Number(orderSummaryInfo.shippingValue),
        taxInclude,
        orderSummaryInfo.tippingVal,
      ).profit;
      const actProfit = await orderApi.getOrderProfit(orderID, "plusbase");
      expect(actProfit.toFixed(2)).toEqual(expProfitAndFee.toFixed(2));
    });
  });
});

test.describe("[include] Kiểm tra tax line ở checkout page, thankyou page, order stt page, order có PPC item", () => {
  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let domain, cardInfo;
  let expectTaxAmt: number;
  //setting tax exclude
  test.beforeEach(async ({ conf, authRequest, request, page }) => {
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    checkoutAPI = new CheckoutAPI(domain, request, page);
    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });
    const isAddPPC = conf.caseConf.is_add_ppc;
    const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    if (isAddPPC) {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, true);
    } else {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, false);
    }
  });
  test(`
  @SB_PLB_PODPL_TAX_9 [Include] Order có add item PPC, item PPC sau discount thỏa mãn threshold`, async ({ conf }) => {
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
});
