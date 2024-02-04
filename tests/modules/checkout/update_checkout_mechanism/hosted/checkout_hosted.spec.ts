import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { BuyerInfoApi, CheckoutInfo, DataSetting, Product } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@utils/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Update cơ chế Payment", () => {
  let paymentSettingAPI: PaymentProviders;
  let productsCheckout: Product[];
  let customerInfo: BuyerInfoApi;
  let dashboardAPI: DashboardAPI;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let orderAPI: OrderAPI;
  let homePage: SFHome;
  let domain: string;
  let shopId: number;

  const config = loadData(__dirname, "DATA_DRIVEN_CHECKOUT_HOSTED");
  const numRetries = config.suiteConf.number_retry;
  const accDashboardPayment = config.suiteConf.acc_dashboard_payment;
  config.caseConf.data.forEach(caseData => {
    test(`@${caseData.case_id} ${caseData.case_name}`, async ({ conf, page, authRequest, dashboard }) => {
      domain = conf.suiteConf.domain;
      shopId = conf.suiteConf.shop_id;

      paymentSettingAPI = new PaymentProviders(domain, authRequest);
      checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      dashboardAPI = new DashboardAPI(domain, authRequest);
      orderPage = new OrdersPage(dashboard, domain);
      orderAPI = new OrderAPI(domain, authRequest);
      checkoutPage = new SFCheckout(page, domain);
      homePage = new SFHome(page, domain);

      let checkoutInfoBefore: CheckoutInfo;
      let orderName: string;

      customerInfo = {
        emailBuyer: caseData.email,
        shippingAddress: caseData.shipping_address,
      };
      productsCheckout = caseData.products;
      let orderId = 0;

      await test.step("Reset data to before data change", async () => {
        const dataResetSetting: DataSetting = caseData.data_reset_setting;
        await dashboardAPI.changeDataSetting(dataResetSetting);
        // Enable payment method if need
        if (caseData.gateway_name) {
          const gatewayId = await paymentSettingAPI.getPaymentMethodId(caseData.gateway_name);
          await dashboardAPI.activePaymentMethod(shopId, gatewayId, true);
        }
      });

      await test.step(`\n- Chọn payment method ${caseData.payment_method}\n- Click Complete order / Place your order`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethod(
          productsCheckout,
          customerInfo.emailBuyer,
          customerInfo.shippingAddress,
          "",
          !!caseData.data_setting.boost_upsell,
          caseData.data_setting.discount_hive?.code,
        );

        // select global market
        await homePage.gotoHomePage();
        await homePage.selectStorefrontCurrencyV2(customerInfo.shippingAddress.country);

        // open checkout page
        await checkoutAPI.openCheckoutPageByToken();

        // select payment method and click button complete order
        const paymentCode = await checkoutAPI.getPaymentMethodCode(caseData.payment_method);
        checkoutPage.paymentCode = paymentCode;
        await checkoutPage.selectPaymentMethod(caseData.payment_method);
        if (caseData.payment_method === PaymentMethod.IDEAL) {
          await checkoutPage.selectIdealBank("ABN Amro");
        }
        await checkoutPage.clickBtnCompleteOrder();
        await checkoutPage.waitUntilElementInvisible(checkoutPage.xpathBtnPlaceYourOrder);

        // verify click complete order success
        expect(await checkoutPage.isRedirectToSandboxPayment(caseData.payment_method)).toBe(true);

        // save data before click complete order
        checkoutInfoBefore = await checkoutAPI.getCheckoutInfoWithGlobalMarket(5);
      });

      await test.step(`Khi đang đợi confirm payment tại sandbox ${caseData.payment_method},tại Dashboard thay đổi thông tin`, async () => {
        const dataSetting: DataSetting = caseData.data_setting;
        await dashboardAPI.changeDataSetting(dataSetting);
      });

      await test.step(` Tại sandbox ${caseData.payment_method}: Confirm payment`, async () => {
        await checkoutPage.completeRedirectPage(caseData.payment_method, caseData.login_redirect_page, true);
        const checkoutInfoAfter = await checkoutAPI.getCheckoutInfoWithGlobalMarket(5);
        orderName = await checkoutPage.getOrderName();
        // global market
        expect(checkoutInfoBefore.info.extra_data?.global_market).toStrictEqual(
          checkoutInfoAfter.info.extra_data?.global_market,
        );

        // summary order
        expect(isEqual(checkoutInfoBefore.totals.subtotal_price, checkoutInfoAfter.totals.subtotal_price, 0.01)).toBe(
          true,
        );
        expect(isEqual(checkoutInfoBefore.totals.total_price, checkoutInfoAfter.totals.total_price, 0.01)).toBe(true);
        expect(isEqual(checkoutInfoBefore.totals.total_shipping, checkoutInfoAfter.totals.total_shipping, 0.01)).toBe(
          true,
        );
        expect(isEqual(checkoutInfoBefore.totals.total_discounts, checkoutInfoAfter.totals.total_discounts, 0.01)).toBe(
          true,
        );
      });

      await test.step(`Kiểm tra order tại Order list`, async () => {
        expect(!!orderName && orderName.length > 0).toBe(true);
        await orderPage.gotoOrderPage(conf.suiteConf.platform);
        await orderPage.searchOrder(orderName);
        const expectTotalAmt = await orderPage.getTotalOrderInOrderList(orderName);
        expect(isEqual(checkoutInfoBefore.totals.total_price, Number(expectTotalAmt), 0.01)).toBe(true);
      });

      await test.step(`Kiểm tra order details`, async () => {
        await orderPage.clickOrderByName(orderName);
        //cause sometimes order captures slower than usual
        const orderStatus = await orderPage.reloadUntilOrdCapture("", numRetries);
        orderId = orderPage.getOrderIdInOrderDetail();

        switch (caseData.payment_method) {
          case PaymentMethod.SEPA:
          case PaymentMethod.SOFORT:
            expect(orderStatus).toEqual("Payment in process");
            break;
          default:
            expect(orderStatus).toEqual("Paid");
        }
        const orderInfo = await orderPage.getOrderSummaryShopBaseInOrderDetail();

        expect(isEqual(orderInfo.total, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
        expect(isEqual(orderInfo.subtotal, checkoutInfoBefore.totals.subtotal_price, 0.01)).toBe(true);
        expect(isEqual(orderInfo.shipping_fee, checkoutInfoBefore.totals.shipping_fee, 0.01)).toBe(true);
        let totalDiscounts = checkoutInfoBefore.totals.total_discounts;
        if (checkoutInfoBefore.info.discount_type === "free_shipping") {
          totalDiscounts = checkoutInfoBefore.totals.shipping_fee;
        }
        expect(isEqual(orderInfo.discount, totalDiscounts, 0.01)).toBe(true);
        expect(isEqual(orderInfo.tax_amount, checkoutInfoBefore.totals.total_tax, 0.01)).toBe(true);
        if (!["sepa direct debit", "sofort"].includes(caseData.payment_method.toLowerCase())) {
          expect(isEqual(orderInfo.paid_by_customer, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
        }
      });

      if (!caseData.ignore_check_dashboard_payment_page) {
        await test.step(`Tại Dashboard ${checkoutAPI.getNameDashboardPortal(
          caseData.payment_method,
        )}: Tìm kiếm order bằng transaction ID`, async () => {
          const listTransactionID = await orderAPI.getListTransactionId(orderId);
          const totalOrderDBStripe = await orderAPI.getTotalOrderInfoInDashboardPayment(
            accDashboardPayment,
            listTransactionID,
            checkoutInfoBefore.info?.extra_data?.global_market?.rate,
            caseData.payment_method,
          );
          expect(isEqual(totalOrderDBStripe.total, checkoutInfoBefore.totals.total_price, 0.01)).toBe(true);
          expect(totalOrderDBStripe.payment_method.toLowerCase()).toContain(caseData.payment_method.toLowerCase());
        });
      }

      await test.step("Reset data to after data change", async () => {
        const dataResetSetting: DataSetting = caseData.data_reset_setting;
        await dashboardAPI.changeDataSetting(dataResetSetting);
        if (caseData.stripe_gateway_name) {
          const gatewayId = await paymentSettingAPI.getPaymentMethodId(caseData.stripe_gateway_name);
          await dashboardAPI.activePaymentMethod(shopId, gatewayId, true);
        }
      });
    });
  });

  test(`@SB_CHE_UP_23 [Hosted] Change data: discount offer PPC, global market trước khi create order qua cổng Klarna`, async ({
    page,
    authRequest,
    dashboard,
    conf,
  }) => {
    let orderId: number;
    let orderName: string;
    let checkoutInfoAfter: CheckoutInfo;
    let checkoutInfoBefore: CheckoutInfo;
    let itemPPCValue: string;
    let expPPCValue: number;

    domain = conf.suiteConf.domain;
    shopId = conf.suiteConf.shop_id;
    productsCheckout = conf.caseConf.products;
    customerInfo = {
      emailBuyer: conf.caseConf.email,
      shippingAddress: conf.caseConf.shipping_address,
    };

    const productPPC = conf.caseConf.product_ppc;
    const paymentMethod = conf.caseConf.payment_method;

    const dataResetSetting: DataSetting = conf.caseConf.data_reset_setting;

    paymentSettingAPI = new PaymentProviders(domain, authRequest);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    checkoutPage = new SFCheckout(page, domain);
    homePage = new SFHome(page, domain);

    await test.step("Reset data to before data change", async () => {
      await dashboardAPI.changeDataSetting(dataResetSetting);
    });

    await test.step(`
      - Chọn payment method Klarna
      - Click Complete order / Place your order
      - Confirm payment trên cổng
      - Add item PPC`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        customerInfo.emailBuyer,
        customerInfo.shippingAddress,
      );
      // select global market
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(customerInfo.shippingAddress.country);

      // open checkout page
      await checkoutAPI.openCheckoutPageByToken();

      await checkoutPage.completeOrderWithMethod(paymentMethod);
      itemPPCValue = await checkoutPage.addProductPostPurchase(productPPC);

      // verify click complete order success
      expect(await checkoutPage.isRedirectToSandboxPayment(paymentMethod)).toBe(true);

      // save data before click complete order
      checkoutInfoBefore = await checkoutAPI.getCheckoutInfoWithGlobalMarket(5);
      let exchangeRate = checkoutInfoBefore.info?.extra_data?.global_market?.rate;
      if (!checkoutInfoBefore.info?.extra_data?.global_market?.rate) {
        exchangeRate = 1;
      }
      expPPCValue = Number(removeCurrencySymbol(itemPPCValue)) / exchangeRate;
    });

    await test.step(`
      - Khi đang đợi confirm payment tại sandbox Bancontact, tại Dashboard:
        + Settings > Global: Thay đổi rate market EU
          Country: Belgium, Germany, Netherland
          Rate: manual rate 0.9, decrease 10%, rounding .22
        + Apps > Boost upsell > Upsell: Đổi offer discount PPC = 20%`, async () => {
      const dataSetting: DataSetting = conf.caseConf.data_setting;
      await dashboardAPI.changeDataSetting(dataSetting);
    });

    await test.step(`- Tại sandbox Klarna: Completed purchase item PPC`, async () => {
      await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);
    });

    await test.step(`Kiểm tra order tại Order list`, async () => {
      // fill your code here
      checkoutInfoAfter = await checkoutAPI.getCheckoutInfoWithGlobalMarket(5);
      orderName = await checkoutPage.getOrderName();
      // global market
      expect(checkoutInfoBefore.info.extra_data?.global_market).toStrictEqual(
        checkoutInfoAfter.info.extra_data?.global_market,
      );

      // summary order
      expect(
        isEqual(checkoutInfoBefore.totals.subtotal_price + expPPCValue, checkoutInfoAfter.totals.subtotal_price, 0.01),
      ).toBe(true);
      expect(
        isEqual(checkoutInfoBefore.totals.total_price + expPPCValue, checkoutInfoAfter.totals.total_price, 0.01),
      ).toBe(true);
      expect(isEqual(checkoutInfoBefore.totals.total_shipping, checkoutInfoAfter.totals.total_shipping, 0.01)).toBe(
        true,
      );
      expect(isEqual(checkoutInfoBefore.totals.total_discounts, checkoutInfoAfter.totals.total_discounts, 0.01)).toBe(
        true,
      );
    });

    await test.step(`Kiểm tra order details`, async () => {
      expect(!!orderName && orderName.length > 0).toBe(true);
      await orderPage.gotoOrderPage(conf.suiteConf.platform);
      await orderPage.searchOrder(orderName);
      const expectTotalAmt = await orderPage.getTotalOrderInOrderList(orderName);
      expect(isEqual(checkoutInfoBefore.totals.total_price + expPPCValue, Number(expectTotalAmt), 0.01)).toBe(true);
    });

    await test.step(`Kiểm tra order details`, async () => {
      await orderPage.clickOrderByName(orderName);
      //cause sometimes order captures slower than usual
      const orderStatus = await orderPage.reloadUntilOrdCapture("", numRetries);
      orderId = orderPage.getOrderIdInOrderDetail();

      expect(orderStatus).toEqual("Paid");
      const orderInfo = await orderPage.getOrderSummaryShopBaseInOrderDetail();

      expect(isEqual(orderInfo.total, checkoutInfoAfter.totals.total_price, 0.01)).toBe(true);
      expect(isEqual(orderInfo.subtotal, checkoutInfoAfter.totals.subtotal_price, 0.01)).toBe(true);
      expect(isEqual(orderInfo.shipping_fee, checkoutInfoAfter.totals.shipping_fee, 0.01)).toBe(true);
      expect(isEqual(orderInfo.tax_amount, checkoutInfoAfter.totals.total_tax, 0.01)).toBe(true);
      expect(isEqual(orderInfo.paid_by_customer, checkoutInfoAfter.totals.total_price, 0.01)).toBe(true);
    });

    await test.step(`Tại Dashboard ${checkoutAPI.getNameDashboardPortal(
      paymentMethod,
    )}: Tìm kiếm order bằng transaction ID`, async () => {
      const listTransactionID = await orderAPI.getListTransactionId(orderId);
      const totalOrderDBStripe = await orderAPI.getTotalOrderInfoInDashboardPayment(
        accDashboardPayment,
        listTransactionID,
        checkoutInfoAfter.info?.extra_data?.global_market?.rate,
        paymentMethod,
      );
      expect(isEqual(totalOrderDBStripe.total, checkoutInfoAfter.totals.total_price, 0.01)).toBe(true);
      expect(totalOrderDBStripe.payment_method.toLowerCase()).toContain(paymentMethod.toLowerCase());
    });

    await test.step("Reset data to after data change", async () => {
      await dashboardAPI.changeDataSetting(dataResetSetting);
    });
  });
});
