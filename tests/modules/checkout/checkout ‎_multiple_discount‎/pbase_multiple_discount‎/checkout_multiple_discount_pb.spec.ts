import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@core/utils/checkout";
import type { CheckoutInfo, OrderTotalAmount, discountCode } from "@types";
import { OrderAPI } from "@pages/api/order";
import { SettingShipping } from "@pages/dashboard/setting_shipping";

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

test.describe("Data driven: checkout multiple discount", () => {
  let casesID = "DRIVEN_PB_MULTIPLE_DISCOUNT";
  let conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      tipping: tipping,
      case_name: caseName,
      product: productInfo,
      payment_method: paymentMethod,
      discounts_replace: discountsReplace,
      discount_codes_after: discountCodesAfter,
      discount_codes_before: discountCodesBefore,
      expected_result_after: expectedResultAfter,
      expected_result_before: expectedResultBefore,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ authRequest, request }) => {
        const email = conf.suiteConf.email;
        const domain = conf.suiteConf.domain;
        const shopId = conf.suiteConf.shop_id;
        const cardInfo = conf.suiteConf.card_info;
        const shippingAddress = conf.suiteConf.shipping_address;
        const countryCode = shippingAddress.country_code;
        const discountResets = conf.suiteConf.discount_resets;
        const boostUpsellReset = conf.suiteConf.boost_upsell_reset;
        const accDashboardPayment = conf.suiteConf.acc_dashboard_payment;

        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const orderApi = new OrderAPI(domain, authRequest);

        let checkoutInfo: CheckoutInfo;
        let orderSummary: OrderTotalAmount;
        const offerIds = [];

        await test.step(`Pre-condition`, async () => {
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
        });

        await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          await checkoutAPI.updateCustomerInformation(email, shippingAddress);
          await checkoutAPI.selectDefaultShippingMethod(countryCode);
          await checkoutAPI.addTipping(tipping);

          for (const discountCode of discountCodesBefore) {
            await checkoutAPI.applyDiscountByApi(discountCode.code);
          }

          checkoutInfo = await checkoutAPI.getCheckoutInfo();
          orderSummary = checkoutInfo.totals;

          verifyOrderSummary(orderSummary, expectedResultBefore);
        });

        await test.step(`
        Nhập discount code
        - Remove discount
        - Nhập lại discount`, async () => {
          for (const discountReplace of discountsReplace) {
            const err = (await checkoutAPI.applyDiscountByApiNoExpect(discountReplace.by)).status;
            expect(err).toEqual(404);
            await checkoutAPI.removeAppliedCoupon(discountReplace.by);
            await checkoutAPI.applyDiscountByApi(discountReplace.replace);
          }

          checkoutInfo = await checkoutAPI.getCheckoutInfo();
          orderSummary = checkoutInfo.totals;

          verifyOrderSummary(orderSummary, expectedResultAfter);
        });

        await test.step(`Complete order với Payment method`, async () => {
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
        });

        await test.step(`Kiểm tra order summary`, async () => {
          checkoutInfo = await checkoutAPI.getCheckoutInfo();
          orderSummary = checkoutInfo.totals;

          verifyOrderSummary(orderSummary, expectedResultAfter);
        });

        await test.step(`
          Tại Dashboard
          - Vào Order detail của order đã tạo
          - Kiểm tra order detail`, async () => {
          const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
          const orderSummary = orderInfo.order;
          verifyDiscountCode(orderSummary.discount_code, discountCodesAfter);
          verifyOrderSummaryOnOrderDetail(orderSummary, expectedResultAfter);
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
            paymentMethod,
          );
          expect(isEqual(totalOrderDBStripe.total, expectedResultAfter.total, 0.01)).toBe(true);
        });
      });
    },
  );

  casesID = "DRIVEN_PB_MULTIPLE_DISCOUNT_2";
  conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      tipping: tipping,
      case_name: caseName,
      product: productInfo,
      discount_codes: discountCodes,
      payment_method: paymentMethod,
      expected_result: expectedResult,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ authRequest, request }) => {
        const email = conf.suiteConf.email;
        const domain = conf.suiteConf.domain;
        const cardInfo = conf.suiteConf.card_info;
        const shippingAddress = conf.suiteConf.shipping_address;
        const countryCode = shippingAddress.country_code;
        const discountResets = conf.suiteConf.discount_resets;
        const accDashboardPayment = conf.suiteConf.acc_dashboard_payment;

        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const orderApi = new OrderAPI(domain, authRequest);

        let checkoutInfo: CheckoutInfo;
        let orderSummary: OrderTotalAmount;

        await test.step(`Pre-condition`, async () => {
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

          // Enable selected discount automatic
          for (const discountCode of discountCodes) {
            if (discountCode.code.includes("Automatic")) {
              await dashboardAPI.updateDiscountInfo(discountCode);
            }
          }
        });

        await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
          await checkoutAPI.addProductToCartThenCheckout(productInfo);
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

        await test.step(`Kiểm tra order summary`, async () => {
          checkoutInfo = await checkoutAPI.getCheckoutInfo();
          orderSummary = checkoutInfo.totals;

          verifyOrderSummary(orderSummary, expectedResult);
        });

        await test.step(`
          Tại Dashboard
          - Vào Order detail của order đã tạo
          - Kiểm tra order detail`, async () => {
          const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
          const orderSummary = orderInfo.order;
          verifyDiscountCode(orderSummary.discount_code, discountCodes);
          verifyOrderSummaryOnOrderDetail(orderSummary, expectedResult);
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
            paymentMethod,
          );
          expect(isEqual(totalOrderDBStripe.total, expectedResult.total, 0.01)).toBe(true);
        });
      });
    },
  );

  casesID = "DRIVEN_PB_MULTIPLE_DISCOUNT_3";
  conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product: productInfo,
      shipping_zone: shippingZone,
      discount_codes: discountCodes,
      payment_method: paymentMethod,
      expected_result: expectedResult,
      shipping_method: shippingMethod,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ authRequest, request, dashboard }) => {
        const email = conf.suiteConf.email;
        const domain = conf.suiteConf.domain;
        const cardInfo = conf.suiteConf.card_info;
        const tipping = conf.suiteConf.tipping_info;
        const shippingAddress = conf.suiteConf.shipping_address;
        const countryCode = shippingAddress.country_code;
        const discountResets = conf.suiteConf.discount_resets;
        const accDashboardPayment = conf.suiteConf.acc_dashboard_payment;

        const shippingSetting = new SettingShipping(dashboard, domain);
        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const orderApi = new OrderAPI(domain, authRequest);

        let checkoutInfo: CheckoutInfo;
        let orderSummary: OrderTotalAmount;

        await test.step(`Pre-condition`, async () => {
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

          // Enable selected discount automatic
          for (const discountCode of discountCodes) {
            if (discountCode.code.includes("Automatic")) {
              await dashboardAPI.updateDiscountInfo(discountCode);
            }
          }

          await shippingSetting.goto("/admin/settings/shipping");
          await shippingSetting.settingFreeshipRatePbase(shippingZone);
        });

        await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          await checkoutAPI.updateCustomerInformation(email, shippingAddress);
          await checkoutAPI.selectDefaultShippingMethod(countryCode);
          if (shippingMethod) {
            await checkoutAPI.selectShippingMethodByName(countryCode, shippingMethod);
          }
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

        await test.step(`
          Tại Dashboard
          - Vào Order detail của order đã tạo
          - Kiểm tra order detail`, async () => {
          const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
          const orderSummary = orderInfo.order;
          verifyDiscountCode(orderSummary.discount_code, discountCodes);
          verifyOrderSummaryOnOrderDetail(orderSummary, expectedResult);
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
            paymentMethod,
          );
          expect(isEqual(totalOrderDBStripe.total, expectedResult.total, 0.01)).toBe(true);
        });
      });
    },
  );
});
test(`@SB_DC_MD_PB_11 [Pbase] Order Pbase có thỏa mãn Freeshipping, apply manual discount freeship sau đó remove discount freeship`, async ({
  conf,
  request,
  dashboard,
  authRequest,
}) => {
  const email = conf.suiteConf.email;
  const domain = conf.suiteConf.domain;
  const shippingAddress = conf.suiteConf.shipping_address;
  const countryCode = shippingAddress.country_code;
  const discountResets = conf.suiteConf.discount_resets;

  const expectedResultBefore = conf.caseConf.expected_result_before;
  const expectedResultAfter = conf.caseConf.expected_result_after;
  const discountCodesBefore = conf.caseConf.discount_codes_before;
  const discountsReplace = conf.caseConf.discounts_replace;
  const shippingZone = conf.caseConf.shipping_zone;

  const productInfo = conf.caseConf.product;
  const tipping = conf.suiteConf.tipping;

  const shippingSetting = new SettingShipping(dashboard, domain);
  const dashboardAPI = new DashboardAPI(domain, authRequest);
  const checkoutAPI = new CheckoutAPI(domain, request);

  let checkoutInfo: CheckoutInfo;
  let orderSummary: OrderTotalAmount;

  await test.step(`Pre-condition`, async () => {
    const disableDiscountAt = new Date();

    // Disable all discount automatic
    for (const discountReset of discountResets) {
      const autoDiscountInfo = await dashboardAPI.getDiscountByTitle(discountReset);
      const isDiscountAutoEnabled = autoDiscountInfo.status;
      if (isDiscountAutoEnabled === "active") {
        discountReset.ends_at = disableDiscountAt.toISOString();
        await dashboardAPI.updateDiscountInfo(discountReset);
      }

      await shippingSetting.goto("/admin/settings/shipping");
      await shippingSetting.settingFreeshipRatePbase(shippingZone);
    }
  });

  await test.step(`
    Lên storefront của shop
    - Add product vào cart
    - Đi đến checkout page
    - Tại Bock discount > Nhập discount code
    - Tại order summary: Kiểm tra data`, async () => {
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    await checkoutAPI.addTipping(tipping);

    for (const discountCode of discountCodesBefore) {
      await checkoutAPI.applyDiscountByApi(discountCode.code);
    }

    checkoutInfo = await checkoutAPI.getCheckoutInfo();
    orderSummary = checkoutInfo.totals;

    verifyOrderSummary(orderSummary, expectedResultBefore);
  });

  await test.step(`
    Tại các discount tag
    - Remove discount freeship`, async () => {
    for (const discountReplace of discountsReplace) {
      await checkoutAPI.removeAppliedCoupon(discountReplace.by);
    }

    checkoutInfo = await checkoutAPI.getCheckoutInfo();
    orderSummary = checkoutInfo.totals;

    verifyOrderSummary(orderSummary, expectedResultAfter);
  });
});
