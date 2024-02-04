import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@core/utils/checkout";
import type { CheckoutInfo, OrderTotalAmount, discountCode } from "@types";
import { OrderAPI } from "@pages/api/order";
import { PaymentMethod } from "@pages/storefront/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Action } from "@pages/dashboard/orders";

const verifyOrderSummary = (orderSummary, expectedResult) => {
  expect(isEqual(orderSummary.subtotal_price, expectedResult.subTotal, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_discounts, expectedResult.discount, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_tax, expectedResult.taxes, 0.01)).toBe(true);
  expect(isEqual(orderSummary.shipping_fee, expectedResult.shipping, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_tipping, expectedResult.tipping, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_price, expectedResult.total, 0.01)).toBe(true);
};

const verifyOrderSummaryOnOrderDetail = (orderSummary, expectedResult) => {
  expect(isEqual(orderSummary.subtotal_price, expectedResult.subTotal, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_discounts, expectedResult.discount, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_tax, expectedResult.taxes, 0.01)).toBe(true);
  expect(isEqual(orderSummary.shipping_lines[0].price, expectedResult.shipping, 0.01)).toBe(true);
  expect(isEqual(orderSummary.tip_amount, expectedResult.tipping, 0.01)).toBe(true);
  expect(isEqual(orderSummary.total_price, expectedResult.total, 0.01)).toBe(true);
};

const verifyDiscountCode = (actualResult: Array<discountCode>, expectedResult: Array<discountCode>) => {
  expect(actualResult.length).toEqual(expectedResult.length);
  for (let i = 0; i < actualResult.length; i++) {
    expect(actualResult[i].code).toEqual(expectedResult[i].code);
  }
};

test.describe("Multi discount plbase", () => {
  let email: string, domain: string, shopId: number, countryCode: string, shippingMethod: string;
  let cardInfo, discountResets, shippingAddress, boostUpsellReset, accDashboardPayment, discountCodes, boostUpsell;
  let productInfo, tipping, expectedResult, expectedResultWithPPC;

  let dashboardAPI: DashboardAPI;
  let checkoutAPI: CheckoutAPI;
  let orderApi: OrderAPI;

  let checkoutInfo: CheckoutInfo;
  let orderSummary: OrderTotalAmount;
  const offerIds = [];

  test.beforeEach(async ({ conf, authRequest, request }) => {
    email = conf.suiteConf.email;
    domain = conf.suiteConf.domain;
    shopId = conf.suiteConf.shop_id;
    cardInfo = conf.suiteConf.card_info;
    tipping = conf.suiteConf.tipping_info;
    countryCode = shippingAddress.country_code;
    discountResets = conf.suiteConf.discount_resets;
    shippingAddress = conf.suiteConf.shipping_address;
    boostUpsellReset = conf.suiteConf.boost_upsell_reset;
    accDashboardPayment = conf.suiteConf.acc_dashboard_payment;

    expectedResultWithPPC = conf.caseConf.expected_result_with_ppc;
    shippingMethod = conf.caseConf.shipping_method;
    expectedResult = conf.caseConf.expected_result;
    discountCodes = conf.caseConf.discount_codes;
    boostUpsell = conf.caseConf.boost_upsell;
    productInfo = conf.caseConf.product;

    dashboardAPI = new DashboardAPI(domain, authRequest);
    checkoutAPI = new CheckoutAPI(domain, request);
    orderApi = new OrderAPI(domain, authRequest);

    const disableDiscountAt = new Date();

    // Disable all discount automatic
    for (const discountReset of discountResets) {
      const autoDiscountInfo = await dashboardAPI.getDiscountByTitle(discountReset);
      const isDiscountAutoEnabled = autoDiscountInfo.status;
      if (isDiscountAutoEnabled === "active") {
        discountReset.ends_at = disableDiscountAt.toISOString();
        await dashboardAPI.updateDiscountInfo(discountReset);
      }
    }

    // Disable all boost upsell
    for (const offer of boostUpsellReset) {
      offerIds.push(offer.id);
    }
    await dashboardAPI.changeOfferStatus(offerIds, false, shopId);

    // Enable selected discount automatic
    for (const discountCode of discountCodes) {
      if (discountCode.code.includes("Automatic")) {
        await dashboardAPI.updateDiscountInfo(discountCode);
      }
    }

    // Enable selected boost upsell
    if (boostUpsell) {
      for (const offer of boostUpsell) {
        offerIds.push(offer.id);
      }
      await dashboardAPI.changeOfferStatus(offerIds, true, shopId);
    }
  });
  test(`@SB_DC_MD_PLB_01 [Plbase] Order Plbase apply auto discount price, manual discount price sau đó lên shop template approve order`, async ({
    page,
    conf,
    token,
  }) => {
    await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Tại upsell offer pre-purchase: Add product upsell
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productInfo);

      for (const offer of boostUpsell) {
        await checkoutAPI.addPrePurchaseToCart(offer.product, offer.id);
      }
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.activatePostPurchase();
      await checkoutAPI.addTipping(tipping);

      for (const discountCode of discountCodes) {
        if (discountCode.code.includes("Manual")) {
          await checkoutAPI.applyDiscountByApi(discountCode.code);
        }
      }

      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      orderSummary = checkoutInfo.totals;

      verifyOrderSummary(orderSummary, expectedResult);
    });

    await test.step(`Complete order với Payment method`, async () => {
      await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
    });

    await test.step(`Tại popup PPC > Add thêm product PPC > Complete order`, async () => {
      const ppcOffer = boostUpsell.find(({ from }) => from === "post-purchase");
      await checkoutAPI.addPostPurchaseToCart(ppcOffer.product, ppcOffer.id);

      expectedResult = expectedResultWithPPC;
    });

    await test.step(`Kiểm tra order summary`, async () => {
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      orderSummary = checkoutInfo.totals;

      verifyOrderSummary(orderSummary, expectedResult);
    });

    await test.step(`
        Tại Dashboard
        - Vào Order detail của order đã tạo
        - Kiểm tra order detail`, async () => {
      const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Plusbase");
      const orderSummary = orderInfo.order;
      verifyDiscountCode(orderSummary.discount_code, discountCodes);
      verifyOrderSummaryOnOrderDetail(orderSummary, expectedResult);
    });

    await test.step(`
        Lên shop template
        - Order
        - Vào detail order của order đã tạo
        - Approve order
        Tại Dashboard
        - Vào Order detail của order đã tạo
        - Kiểm tra order detail`, async () => {
      const shopTemp = conf.suiteConf.shop_template;
      const shopTempToken = await token.getWithCredentials({
        domain: shopTemp.shop_name,
        username: shopTemp.username,
        password: shopTemp.password,
      });
      const accessTokenTemp = shopTempToken.access_token;

      // Pre-condition: approve order on hive
      const dashboardPageTemplate = new DashboardPage(page, shopTemp.domain);
      const orderPageTemplate = await dashboardPageTemplate.goToOpsOrderDetails(
        checkoutInfo.order.id,
        shopTemp.domain,
        accessTokenTemp,
      );
      await orderPageTemplate.waitForProfitCalculated();
      await orderPageTemplate.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
    });

    await test.step(`
        Tại order detail của order > Lấy ra transaction ID 
        - Mở F12 > Network 
        - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
        Lên Stripe sanbox dashboard của MC
        - Search transactions theo các transaction_ids và verify`, async () => {
      const listTransactionID = await orderApi.getListTransactionId(checkoutInfo.order.id);
      const totalOrderDBStripe = await orderApi.getTotalOrderInfoInDashboardPayment(
        accDashboardPayment,
        listTransactionID,
        null,
        PaymentMethod.STRIPE,
      );
      expect(isEqual(totalOrderDBStripe.total, expectedResult.total, 0.01)).toBe(true);
    });
  });

  test(`@SB_DC_MD_PLB_02 [Plbase] Order Plbase apply auto discount price, manual discount có discount free ship, sử dụng line ship Premium shipping`, async () => {
    await test.step(`Lên storefront của shop- Add product vào cart- Đi đến checkout page- Tại Bock discount > Nhập discount code- Tại order summary: Kiểm tra data`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectShippingMethodByName(countryCode, shippingMethod);
      await checkoutAPI.activatePostPurchase();
      await checkoutAPI.addTipping(tipping);

      for (const discountCode of discountCodes) {
        if (discountCode.code.includes("Manual")) {
          await checkoutAPI.applyDiscountByApi(discountCode.code);
        }
      }

      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      orderSummary = checkoutInfo.totals;

      verifyOrderSummary(orderSummary, expectedResult);
    });

    await test.step(`Complete order với Payment method`, async () => {
      await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
    });

    await test.step(`Kiểm tra order summary`, async () => {
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      orderSummary = checkoutInfo.totals;

      verifyOrderSummary(orderSummary, expectedResult);
    });

    await test.step(`Tại Dashboard- Vào Order detail của order đã tạo- Kiểm tra order detail`, async () => {
      const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Plusbase");
      const orderSummary = orderInfo.order;
      verifyDiscountCode(orderSummary.discount_code, discountCodes);
      verifyOrderSummaryOnOrderDetail(orderSummary, expectedResult);
    });

    await test.step(`Tại order detail của order > Lấy ra transaction ID - Mở F12 > Network - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction IDLên Stripe sanbox dashboard của MC- Search transactions theo các transaction_ids và verify`, async () => {
      const listTransactionID = await orderApi.getListTransactionId(checkoutInfo.order.id);
      const totalOrderDBStripe = await orderApi.getTotalOrderInfoInDashboardPayment(
        accDashboardPayment,
        listTransactionID,
        null,
        PaymentMethod.STRIPE,
      );
      expect(isEqual(totalOrderDBStripe.total, expectedResult.total, 0.01)).toBe(true);
    });
  });
});
