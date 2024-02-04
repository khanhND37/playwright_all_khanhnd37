import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { loadData } from "@core/conf/conf";

/**
 * Zone: United Kingdom: Auto_UK tax
 * -- Tax country: 100$ - 150$ > 10%
 * Zone: United State: Auto_US tax
 * -- Tax country: 0$ - 25$ > 5%
 * -- Tax region:
 * ---- California: 50$ - 100$ > 10%
 * -- Tax override:
 * ---- TaxOverride: California: 90$ - 119$ > 20%
 */
test.describe("[exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page", () => {
  const caseName = "TC_SB_CHE_TSB_01";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product: productInfo,
      case_id: caseID,
      email,
      shipping_address: shippingAddress,
      tax_shipping: taxShipping,
      discount_code: discountCode,
    }) => {
      test(`[exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page for case @${caseID}`, async ({
        page,
        conf,
        request,
        authRequest,
      }) => {
        // prepair data for
        const domain = conf.suiteConf.domain;
        let expectTaxAmt: number;

        const cardInfo = conf.suiteConf.card_info;
        const countryCode = shippingAddress.country_code;
        const checkoutAPI = new CheckoutAPI(domain, request, page);
        const dashboardAPI = new DashboardAPI(domain, authRequest);

        await test.step(`
          Lên storefront của shop
          Checkout 1 sản phẩm
          Nhập các thông tin trong trang:
          + Customer information
          + Shipping
          Verify tax
            `, async () => {
          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          await checkoutAPI.updateCustomerInformation(email, shippingAddress);
          await checkoutAPI.selectDefaultShippingMethod(countryCode);

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
  test(`
  [exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page for case @TC_SB_SET_TM_TSB_476`, async ({
    page,
    conf,
    request,
    authRequest,
  }) => {
    // prepair data for
    const domain = conf.suiteConf.domain;
    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const usellId = conf.caseConf.usell_id;
    const taxShipping = conf.caseConf.tax_shipping;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    let expectTaxAmt: number;

    const cardInfo = conf.suiteConf.card_info;
    const countryCode = shippingAddress.country_code;
    const checkoutAPI = new CheckoutAPI(domain, request, page);
    const dashboardAPI = new DashboardAPI(domain, authRequest);

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

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo, taxShipping);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);

      await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
    });

    await test.step(`
        Tại popup Post-purchase > Add item: Post-purchase > Commplete order
        `, async () => {
      await checkoutAPI.addPostPurchaseToCart(productPPC, usellId);
      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC, taxShipping);
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
test.describe("[exclude] Kiểm tra tax line ở checkout page, thankyou page, order stt page, order có PPC item", () => {
  test(`
  [exclude] (Paypal) Kiểm tra tax line ở checkout page, thankyou page,
  order stt page for case @TC_SB_SET_TM_TSB_477`, async ({ page, conf, request, authRequest }) => {
    // prepair data for
    const domain = conf.suiteConf.domain;

    const productInfo = conf.caseConf.product;
    const productPPC = conf.caseConf.product_ppc;
    const ppcItem = conf.caseConf.product_ppc_name;
    const taxShipping = conf.caseConf.tax_shipping;
    const email = conf.caseConf.email;
    const shippingAddress = conf.caseConf.shipping_address;
    const paymentMethod = conf.caseConf.payment_method;
    const paypalAccount = conf.caseConf.paypal_account;
    let expectTaxAmt: number;

    const countryCode = shippingAddress.country_code;
    const checkoutAPI = new CheckoutAPI(domain, request, page);
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    const checkout = new SFCheckout(page, domain);

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

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo, taxShipping);
      const actualTaxAmt = await checkoutAPI.getTotalTax();
      expect(actualTaxAmt).toEqual(expectTaxAmt);

      await checkoutAPI.openCheckoutPageByToken();

      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.completeOrderViaPayPal(paypalAccount);
    });

    await test.step(`
        Tại popup Post-purchase > Add item: Post-purchase > Commplete order
        `, async () => {
      await checkout.addProductPostPurchase(ppcItem);
      await checkout.completePaymentForPostPurchaseItem(paymentMethod);

      expectTaxAmt = await checkoutAPI.calTaxItemPPC(productPPC, taxShipping);
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
