import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@core/utils/checkout";
import type { CheckoutInfo, OrderTotalAmount, discountCode } from "@types";
import { OrderAPI } from "@pages/api/order";
import { SFCheckout } from "@pages/storefront/checkout";
import { MultiDiscountScheduleData } from "./capture_discount";

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
  let checkoutInfo: CheckoutInfo;
  let orderSummary: OrderTotalAmount;
  const offerIds = [];

  let casesID = "DRIVEN_MULTIPLE_DISCOUNT";
  let conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product: productInfo,
      boost_upsell: boostUpsell,
      discount_codes: discountCodes,
      payment_method: paymentMethod,
      expected_result: expectedResult,
      expected_result_with_ppc: expectedResultWithPPC,
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
        const tipping = conf.suiteConf.tipping_info;

        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const orderApi = new OrderAPI(domain, authRequest);

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

        await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
          await checkoutAPI.addProductToCartThenCheckout(productInfo);

          // Add boost upsell if have
          if (boostUpsell) {
            for (const offer of boostUpsell) {
              switch (offer.from) {
                case "bundle":
                  await checkoutAPI.addBundleToCart(offer.product, offer.id);
                  break;
                case "pre-purchase":
                  await checkoutAPI.addPrePurchaseToCart(offer.product, offer.id);
                  break;
                case "in-cart":
                  await checkoutAPI.addOffertInCartToCart(offer.product, offer.id);
                  break;
                case "quantity-discount":
                  await checkoutAPI.applyDiscountByApi(`${offer.code}-${checkoutAPI.cartToken}`);
                  break;
              }
            }
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

        if (expectedResultWithPPC) {
          await test.step(`Tại popup PPC > Add thêm product PPC > Complete order`, async () => {
            const ppcOffer = boostUpsell.find(({ from }) => from === "post-purchase");
            await checkoutAPI.addPostPurchaseToCart(ppcOffer.product, ppcOffer.id);

            expectedResult = expectedResultWithPPC;
          });
        }

        await test.step(`Kiểm tra order summary`, async () => {
          checkoutInfo = await checkoutAPI.getCheckoutInfo();
          orderSummary = checkoutInfo.totals;

          verifyOrderSummary(orderSummary, expectedResult);
        });

        await test.step(`
          Tại Dashboard
          - Vào Order detail của order đã tạo
          - Kiểm tra order detail`, async () => {
          const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Shopbase");
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

  casesID = "DRIVEN_MULTIPLE_DISCOUNT_2";
  conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product: productInfo,
      payment_method: paymentMethod,
      discount_replace: discountReplace,
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
        const tipping = conf.suiteConf.tipping_info;
        const shippingAddress = conf.suiteConf.shipping_address;
        const countryCode = shippingAddress.country_code;
        const discountResets = conf.suiteConf.discount_resets;
        const boostUpsellReset = conf.suiteConf.boost_upsell_reset;
        const accDashboardPayment = conf.suiteConf.acc_dashboard_payment;

        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const orderApi = new OrderAPI(domain, authRequest);

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
          const err = (await checkoutAPI.applyDiscountByApiNoExpect(discountReplace.by)).status;
          expect(err).toEqual(404);
          await checkoutAPI.removeAppliedCoupon(discountReplace.by);
          await checkoutAPI.applyDiscountByApi(discountReplace.replace);

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
          const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Shopbase");
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

  casesID = "DRIVEN_MULTIPLE_DISCOUNT_EXPRESS";
  conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product: productInfo,
      boost_upsell: boostUpsell,
      discount_codes: discountCodes,
      payment_method: paymentMethod,
      expected_result: expectedResult,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ page, authRequest, request, scheduler }) => {
        const domain = conf.suiteConf.domain;
        const shopId = conf.suiteConf.shop_id;
        const discountResets = conf.suiteConf.discount_resets;
        const boostUpsellReset = conf.suiteConf.boost_upsell_reset;
        const accDashboardPayment = conf.suiteConf.acc_dashboard_payment;

        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const orderApi = new OrderAPI(domain, authRequest);
        const checkoutPage = new SFCheckout(page, domain);

        let isSchedule: boolean;
        let scheduleData: MultiDiscountScheduleData;

        test.setTimeout(400000);

        const rawDataJson = await scheduler.getData();
        if (rawDataJson) {
          scheduleData = rawDataJson as MultiDiscountScheduleData;
          isSchedule = true;
        } else {
          scheduleData = {
            checkoutInfo: null,
          };
        }
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

        await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
          if (isSchedule) {
            return;
          }
          // Tạo checkout
          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          if (caseID === "SB_DC_MD_SB_26") {
            for (const discountCode of discountCodes) {
              if (discountCode.code.includes("Manual")) {
                await checkoutAPI.applyDiscountByApi(discountCode.code);
              }
            }
          }
          await checkoutAPI.openCheckoutPageByToken();
          const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();

          const popupPage = new SFCheckout(expressPopup, domain);
          await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
          await popupPage.page.waitForEvent("close");

          await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toBeVisible();

          if (caseID === "SB_DC_MD_SB_23") {
            for (const discountCode of discountCodes) {
              if (discountCode.code.includes("Manual")) {
                await checkoutAPI.applyDiscountByApi(discountCode.code);
              }
            }
          }

          checkoutInfo = await checkoutAPI.getCheckoutInfo();
          orderSummary = checkoutInfo.totals;

          verifyOrderSummary(orderSummary, expectedResult);

          scheduleData.checkoutInfo = checkoutInfo;
          await scheduler.setData(scheduleData);
          await scheduler.schedule({ mode: "later", minutes: 12 });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        });

        await test.step(`
          Tại Dashboard
          - Vào Order detail của order đã tạo
          - Kiểm tra order detail`, async () => {
          if (isSchedule) {
            checkoutInfo = scheduleData.checkoutInfo;
          }
          // Clear schedule data
          if (isSchedule) {
            await scheduler.clear();
          }
          const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Shopbase");
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

  casesID = "DRIVEN_MULTIPLE_DISCOUNT_3";
  conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product: productInfo,
      boost_upsell: boostUpsell,
      discount_codes: discountCodes,
      expected_result: expectedResult,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ authRequest, request }) => {
        const email = conf.suiteConf.email;
        const domain = conf.suiteConf.domain;
        const shopId = conf.suiteConf.shop_id;
        const tipping = conf.suiteConf.tipping_info;
        const shippingAddress = conf.suiteConf.shipping_address;
        const countryCode = shippingAddress.country_code;
        const discountResets = conf.suiteConf.discount_resets;
        const boostUpsellReset = conf.suiteConf.boost_upsell_reset;

        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const checkoutAPI = new CheckoutAPI(domain, request);
        const offerIds = [];

        test.setTimeout(400000);

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

        await test.step(`
        Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Tại Bock discount > Nhập discount code
        - Tại order summary: Kiểm tra data`, async () => {
          // Tạo checkout
          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          await checkoutAPI.updateCustomerInformation(email, shippingAddress);
          await checkoutAPI.selectDefaultShippingMethod(countryCode);
          await checkoutAPI.addTipping(tipping);

          for (const discountCode of discountCodes) {
            const err = await checkoutAPI.applyDiscountByApiNoExpect(discountCode.code);
            if (discountCode.error_message) {
              expect(err.resBody.error).toEqual(discountCode.error_message);
            }
          }
          if (expectedResult) {
            checkoutInfo = await checkoutAPI.getCheckoutInfo();
            orderSummary = checkoutInfo.totals;
            expect(isEqual(orderSummary.total_discounts, expectedResult.discount, 0.01)).toBe(true);
          }
        });
      });
    },
  );
});

test(`@SB_DC_MD_SB_57 Apply upsell discount product với manual discount không combine với upsell Post-purchase discount`, async ({
  conf,
  request,
  authRequest,
}) => {
  const email = conf.suiteConf.email;
  const domain = conf.suiteConf.domain;
  const shopId = conf.suiteConf.shop_id;
  const tipping = conf.suiteConf.tipping_info;
  const shippingAddress = conf.suiteConf.shipping_address;
  const countryCode = shippingAddress.country_code;
  const discountResets = conf.suiteConf.discount_resets;
  const boostUpsellReset = conf.suiteConf.boost_upsell_reset;

  const productInfo = conf.caseConf.product;
  const productPPC = conf.caseConf.product_ppc;
  const boostUpsell = conf.caseConf.boost_upsell;
  const discountCodes = conf.caseConf.discount_codes;
  const expectedResult = conf.caseConf.expected_result;

  const dashboardAPI = new DashboardAPI(domain, authRequest);
  const checkoutAPI = new CheckoutAPI(domain, request);
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

  await test.step(`Lên storefront của shop- Add product vào cart- Đi đến checkout page- Tại Bock discount > Nhập discount code- Thực hiện complete checkout- Add PPC vào order`, async () => {
    // Tạo checkout
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    await checkoutAPI.activatePostPurchase();
    await checkoutAPI.addTipping(tipping);

    for (const discountCode of discountCodes) {
      await checkoutAPI.applyDiscountByApi(discountCode.code);
    }

    await checkoutAPI.addPostPurchaseToCart(productPPC, boostUpsell.id);
    const ppcAmount = await checkoutAPI.getItemPriceByID(productPPC.variant_id);
    expect(isEqual(ppcAmount.item_price_after_discount, productPPC.post_purchase_price, 0.01)).toBe(true);
  });

  await test.step(`- Verify discount sau khi complete checkout`, async () => {
    checkoutInfo = await checkoutAPI.getCheckoutInfo();
    orderSummary = checkoutInfo.totals;
    expect(isEqual(orderSummary.total_discounts, expectedResult.discount, 0.01)).toBe(true);
  });
});
