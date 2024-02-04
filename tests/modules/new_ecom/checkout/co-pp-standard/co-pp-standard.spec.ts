import { expect, test } from "@fixtures/website_builder";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";

test.describe("Checkout new ecom without setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_PP_NE_3STEPS";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(({ case_id: caseId, case_name: caseName, payment_method: paymentMethod }) => {
    test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard, builder }) => {
      domain = conf.suiteConf.domain;
      const templateId = conf.suiteConf.template_id;
      const settingCheckoutInfo = conf.suiteConf.setting_checkout_info;

      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      checkoutPage = new SFCheckout(page, domain);
      orderPage = new OrdersPage(dashboard, domain);

      productCheckout = conf.suiteConf.products_checkout;

      await builder.updateSettingCheckoutForm(templateId, settingCheckoutInfo);

      await test.step(`Tạo checkout thành công`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();

        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
        await checkoutPage.completeOrderWithMethod(paymentMethod);

        // Expected: - Thanh toán thành công, hiển thị trang thankyou
        await checkoutPage.waitForPageRedirectFromPaymentPage();

        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
        expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
      });

      await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
      });
    });
  });
});

test.describe("Checkout new ecom with setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_PP_NE_3STEPS_PPC";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({ case_id: caseId, case_name: caseName, payment_method: paymentMethod, product_ppc_name: productPPC }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard, builder }) => {
        domain = conf.suiteConf.domain;
        const templateId = conf.suiteConf.template_id;
        const settingCheckoutInfo = conf.suiteConf.setting_checkout_onepage_info;

        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);

        productCheckout = conf.suiteConf.products_checkout_ppc;
        await builder.updateSettingCheckoutForm(templateId, settingCheckoutInfo);

        await test.step(`Tạo checkout thành công`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          await checkoutPage.completeOrderWithMethod(paymentMethod);

          // Add PPC:
          const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
          expect(isShowPPC).toBeTruthy();
          let ppcValue = await checkoutPage.addProductPostPurchase(productPPC);
          if (!ppcValue) {
            // for case don't add PPC
            ppcValue = "0";
          } else {
            await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);
          }

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 20000 });

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue));
        });

        await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });
      });
    },
  );
});

test.describe("Checkout new ecom without setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_PP_NE_1PAGE";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(({ case_id: caseId, case_name: caseName, payment_method: paymentMethod }) => {
    test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard, builder }) => {
      domain = conf.suiteConf.domain;
      const templateId = conf.suiteConf.template_id;
      const settingCheckoutInfo = conf.suiteConf.setting_checkout_onepage_info;

      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      checkoutPage = new SFCheckout(page, domain);
      orderPage = new OrdersPage(dashboard, domain);

      productCheckout = conf.suiteConf.products_checkout;

      await builder.updateSettingCheckoutForm(templateId, settingCheckoutInfo);

      await test.step(`Tạo checkout thành công`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();

        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
        await checkoutPage.completeOrderWithMethod(paymentMethod);

        // Expected: - Thanh toán thành công, hiển thị trang thankyou
        await checkoutPage.waitForPageRedirectFromPaymentPage();

        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
        expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
      });

      await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
      });
    });
  });
});

test.describe("Checkout new ecom with setting PPC", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_PP_NE_1PAGE_PPC";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({ case_id: caseId, case_name: caseName, payment_method: paymentMethod, product_ppc_name: productPPC }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);

        productCheckout = conf.suiteConf.products_checkout_ppc;

        await test.step(`Tạo checkout thành công`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          await checkoutPage.completeOrderWithMethod(paymentMethod);

          // Add PPC:
          const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
          expect(isShowPPC).toBeTruthy();
          let ppcValue = await checkoutPage.addProductPostPurchase(productPPC);
          if (!ppcValue) {
            // for case don't add PPC
            ppcValue = "0";
          } else {
            await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);
          }

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 20000 });

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue));
        });

        await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });
      });
    },
  );
});
