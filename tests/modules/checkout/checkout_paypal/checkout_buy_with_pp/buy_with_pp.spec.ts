import { test } from "@fixtures/theme";
import { expect } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { OrderAPI } from "@pages/api/order";
import { SFHome } from "@pages/storefront/homepage";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFProduct } from "@pages/storefront/product";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { isEqual } from "@core/utils/checkout";

test.describe("Checkout buy with paypal sbase", () => {
  let themeSetting: SettingThemeAPI;
  let orderPage: OrdersPage;
  let checkout: SFCheckout;
  let orderApi: OrderAPI;
  let homePage: SFHome;
  let orderId: number;
  let totalOrderSF: string;
  let orderAmt = 0;
  let isPostPurchase = false;
  let itemPostPurchaseValue = "0";

  const casePPCName = "BUY_WITH_PP_SBASE_PPC";
  const confCasePPC = loadData(__dirname, casePPCName);
  // for each data, will do tests
  confCasePPC.caseConf.data.forEach(
    ({
      case_description: caseDescription,
      checkout_layout: checkoutLayout,
      product_name: productName,
      product_ppc_name: ppcItem,
      case_id: caseID,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ page, conf, token, request, theme, dashboard }) => {
        // prepair data for
        const domain = conf.suiteConf.domain;
        const reloadTime = conf.suiteConf.reload_time;
        const customerInfo = conf.suiteConf.customer_info;
        const paymentMethod = conf.suiteConf.payment_method;
        const paypalAccount = conf.suiteConf.paypal_account;
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessToken = shopToken.access_token;
        // Init page
        homePage = new SFHome(page, domain);
        checkout = new SFCheckout(page, domain);
        orderApi = new OrderAPI(domain, request);
        orderPage = new OrdersPage(dashboard, domain);
        themeSetting = new SettingThemeAPI(theme);
        // Set timeout for test
        test.setTimeout(200000);
        // Precondition: Set checkout layout onepage or multistep
        await themeSetting.editCheckoutLayout(checkoutLayout);

        await test.step(`
          - Tại Storefront của store:
          - Vào Product detail của product
          - Click button Buy with paypal
          - Login vào Paypal dashboard
          - Click Paynow tại paypal dashboard`, async () => {
          // Go to storefront and search product
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(productName);
          // Click button buy with paypal
          await checkout.submitItemWhenClickBuyWithPaypal();
          await checkout.inputPhoneNumber(customerInfo.phone_number);
          // Click continue to shipping method and payment method if need (3 pages checkout)
          await checkout.clickBtnContinueToShippingMethod();
          await checkout.continueToPaymentMethod();
          // Wait for choose payment method page is visible
          await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
        });

        await test.step(`- Click Complete order/Place your order`, async () => {
          // Click complete order and wait for thankyou page is visible, then popup PPC is visible
          if (await checkout.isOnePageCheckout()) {
            await checkout.footerLoc.scrollIntoViewIfNeeded();
            await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
          }
          await expect(checkout.paypalBlockLoc).toBeVisible();
          await checkout.clickCompleteOrder();
          await expect(checkout.thankyouPageLoc).toBeVisible();
          await expect(checkout.btnClosePPCPopup).toBeVisible();
        });

        await test.step(`
          - Tại popup PPC
          - Add product PPC vào store`, async () => {
          itemPostPurchaseValue = await checkout.addProductPostPurchase(ppcItem);
          await expect(checkout.submitPaypalBtnLoc).toBeVisible();
        });

        await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
          if (itemPostPurchaseValue != null) {
            isPostPurchase = true;
            await checkout.completePaymentForPostPurchaseItem(PaymentMethod.BUYWITHPAYPAL);
          }
          await expect(checkout.thankyouPageLoc).toBeVisible();
          totalOrderSF = await checkout.getTotalOnOrderSummary();
          orderId = await checkout.getOrderIdBySDK();
        });

        await test.step(`
          - Login vào Dashboard
          - Vào Order detail của order vừa tạo
          - Kiẻm tra order status
          - Kiểm tra total order
          - Kiểm tra order timeline`, async () => {
          await orderPage.goToOrderByOrderId(orderId);
          let orderStatus = await orderPage.getOrderStatus();
          //cause sometimes order captures slower than usual
          orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
          expect(orderStatus).toEqual("Paid");
          const actualTotalOrder = await orderPage.getTotalOrder();
          expect(actualTotalOrder).toEqual(totalOrderSF);
          const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
            total_amount: totalOrderSF,
            payment_gateway: paymentMethod,
            item_post_purchase_value: itemPostPurchaseValue,
          });

          const orderTimelineList = [
            orderTimeline.timelineTransId,
            orderTimeline.timelinePaymentProcessed,
            orderTimeline.timelinePaymentProcessedPPC,
          ];
          for (const orderTimeline of orderTimelineList) {
            // Expect order timeline is visible
            await expect(await orderPage.orderTimeLines(orderTimeline)).toBeVisible();
          }
          // With order have PPC item and check out paypal, the order timeline will have 2 transaction id
          await expect(
            await orderPage.orderTimeLines(orderTimelineList[0], isPostPurchase, paymentMethod),
          ).toBeVisible();
        });

        await test.step(`
          - Tại order timeline: lấy ra transaction id
          - Lên Paypal sanbox dashboard của MC
          - Search transactions theo các transaction_ids`, async () => {
          // Reset orderAmt to 0 on each case
          orderAmt = 0;
          const transIDs = await orderApi.getListTransactionId(orderId, accessToken);
          for (const transID of transIDs) {
            const totalAmt = Number(
              (
                await orderApi.getOrdInfoInPaypal({
                  id: paypalAccount.id,
                  secretKey: paypalAccount.secret_key,
                  transactionId: transID,
                })
              ).total_amount,
            );
            orderAmt += totalAmt;
          }
          expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
        });
      });
    },
  );

  const caseName = "BUY_WITH_PP_SBASE";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_description: caseDescription,
      checkout_layout: checkoutLayout,
      product_name: productName,
      case_id: caseID,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ page, conf, token, request, theme, dashboard }) => {
        // prepair data for
        const domain = conf.suiteConf.domain;
        const reloadTime = conf.suiteConf.reload_time;
        const customerInfo = conf.suiteConf.customer_info;
        const paymentMethod = conf.suiteConf.payment_method;
        const paypalAccount = conf.suiteConf.paypal_account;
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessToken = shopToken.access_token;
        // Init page
        homePage = new SFHome(page, domain);
        checkout = new SFCheckout(page, domain);
        orderApi = new OrderAPI(domain, request);
        orderPage = new OrdersPage(dashboard, domain);
        themeSetting = new SettingThemeAPI(theme);
        // Set timeout for test
        test.setTimeout(200000);
        // Precondition: Set checkout layout onepage or multistep
        await themeSetting.editCheckoutLayout(checkoutLayout);

        await test.step(`
          - Tại Storefront của store:
          - Vào Product detail của product
          - Click button Buy with paypal
          - Login vào Paypal dashboard
          - Click Paynow tại paypal dashboard`, async () => {
          // Go to storefront and search product
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(productName);
          // Click button buy with paypal
          await checkout.submitItemWhenClickBuyWithPaypal();
          await checkout.inputPhoneNumber(customerInfo.phone_number);
          // Click continue to shipping method and payment method if need (3 pages checkout)
          await checkout.clickBtnContinueToShippingMethod();
          await checkout.continueToPaymentMethod();
          // Wait for choose payment method page is visible
          await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
        });

        await test.step(`- Click Complete order/Place your order`, async () => {
          // Click complete order and wait for thankyou page is visible
          if (await checkout.isOnePageCheckout()) {
            await checkout.footerLoc.scrollIntoViewIfNeeded();
            await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
          }
          await expect(checkout.paypalBlockLoc).toBeVisible();
          await checkout.clickCompleteOrder();
          await expect(checkout.thankyouPageLoc).toBeVisible();
          totalOrderSF = await checkout.getTotalOnOrderSummary();
          orderId = await checkout.getOrderIdBySDK();
        });

        await test.step(`
          - Login vào Dashboard
          - Vào Order detail của order vừa tạo
          - Kiẻm tra order status
          - Kiểm tra total order
          - Kiểm tra order timeline`, async () => {
          await orderPage.goToOrderByOrderId(orderId);
          let orderStatus = await orderPage.getOrderStatus();
          //cause sometimes order captures slower than usual
          orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
          expect(orderStatus).toEqual("Paid");
          const actualTotalOrder = await orderPage.getTotalOrder();
          expect(actualTotalOrder).toEqual(totalOrderSF);
          const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
            total_amount: totalOrderSF,
            payment_gateway: paymentMethod,
          });

          const orderTimeLine = [orderTimeline.timelineTransId, orderTimeline.timelinePaymentProcessed];
          for (const timeLine of orderTimeLine) {
            // Expect order timeline is visible
            await expect(await orderPage.orderTimeLines(timeLine)).toBeVisible();
          }
        });

        await test.step(`
          - Tại order timeline: lấy ra transaction id
          - Lên Paypal sanbox dashboard của MC
          - Search transactions theo các transaction_ids`, async () => {
          const transID = await orderApi.getTransactionId(orderId, accessToken);
          const orderAmt = Number(
            (
              await orderApi.getOrdInfoInPaypal({
                id: paypalAccount.id,
                secretKey: paypalAccount.secret_key,
                transactionId: transID,
              })
            ).total_amount,
          );
          expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
        });
      });
    },
  );
});

test.describe("Checkout buy with paypal pbase", () => {
  let productPage: SFProduct;
  let orderPage: OrdersPage;
  let checkout: SFCheckout;
  let homePage: SFHome;
  let orderId: number;
  let totalOrderSF: string;
  let itemPostPurchaseValue;

  const casePBaseName = "BUY_WITH_PP_PBASE";
  const confCasePbase = loadData(__dirname, casePBaseName);
  // for each data, will do tests
  confCasePbase.caseConf.data.forEach(
    ({
      case_description: caseDescription,
      custom_option: customOption,
      product_name: productName,
      product_ppc_name: ppcItem,
      shop_name: shopName,
      username: username,
      password: password,
      case_id: caseID,
      domain: domainPbase,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ page, conf, token }) => {
        // prepair data for test
        const customerInfo = conf.suiteConf.customer_info;
        const shopToken = await token.getWithCredentials({
          domain: shopName,
          username: username,
          password: password,
        });
        const accessToken = shopToken.access_token;
        // Init page
        homePage = new SFHome(page, domainPbase);
        checkout = new SFCheckout(page, domainPbase);
        orderPage = new OrdersPage(page, domainPbase);
        productPage = new SFProduct(page, domainPbase);
        // Set timeout for test
        test.setTimeout(200000);
        await test.step(`
          - Tại Storefront của store:
          - Vào Product detail của product
          - Click button Buy with paypal
          - Login vào Paypal dashboard
          - Click Paynow tại paypal dashboard`, async () => {
          // Go to storefront and search product
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(productName);
          if (customOption) {
            await productPage.inputCustomOptionSF(customOption);
          }
          // Click button buy with paypal
          await checkout.submitItemWhenClickBuyWithPaypal();
          await checkout.inputPhoneNumber(customerInfo.phone_number);
          await checkout.footerLoc.scrollIntoViewIfNeeded();
          // Wait for choose payment method page is visible
          await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
        });

        await test.step(`- Click Complete order/Place your order`, async () => {
          // Click complete order and wait for thankyou page is visible, then popup PPC is visible
          await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
          await checkout.clickCompleteOrder();
          await expect(checkout.thankyouPageLoc).toBeVisible();
          await expect(checkout.btnClosePPCPopup).toBeVisible();
        });

        await test.step(`
          - Tại popup PPC
          - Add product PPC vào store / - Click No, thanks`, async () => {
          if (ppcItem) {
            itemPostPurchaseValue = await checkout.addProductPostPurchase(ppcItem);
            await expect(checkout.submitPaypalBtnLoc).toBeVisible();
          } else {
            await checkout.btnClosePPCPopupLoc.click();
            await expect(checkout.btnClosePPCPopupLoc).toBeHidden();
          }
        });

        await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
          if (itemPostPurchaseValue != null) {
            await checkout.completePaymentForPostPurchaseItem("PayPal");
          }
          await expect(checkout.thankyouPageLoc).toBeVisible();
          totalOrderSF = await checkout.getTotalOnOrderSummary();
          orderId = await checkout.getOrderIdBySDK();
        });

        await test.step(`
          - Login vào Dashboard
          - Vào Order detail của order vừa tạo
          - Kiẻm tra order status
          - Kiểm tra total order
          - Kiểm tra order timeline`, async () => {
          await checkout.openOrderByAPI(orderId, accessToken, "printbase");
          const orderStatus = await orderPage.getOrderStatus();
          expect(orderStatus).toEqual("Authorized");
          const actualTotalOrder = await orderPage.getTotalOrder();

          const totalSF = Number(totalOrderSF.replace("$", ""));
          const totalOrderDetail = Number(actualTotalOrder.replace("$", ""));
          expect(isEqual(totalSF, totalOrderDetail, 0.01)).toBe(true);
        });
      });
    },
  );
});

test.describe("Mobile web, checkout buy with pp", () => {
  let themeSetting: SettingThemeAPI;
  let checkout: SFCheckout;
  let homePage: SFHome;
  let itemPostPurchaseValue;

  const casePPCName = "BUY_WITH_PP_MOBILE_WEB";
  const confCasePPC = loadData(__dirname, casePPCName);
  // for each data, will do tests
  confCasePPC.caseConf.data.forEach(
    ({
      case_description: caseDescription,
      checkout_layout: checkoutLayout,
      product_name: productName,
      product_ppc_name: ppcItem,
      case_id: caseID,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ pageMobile, conf, theme }) => {
        // prepair data for
        const domain = conf.suiteConf.domain;
        const customerInfo = conf.suiteConf.customer_info;
        // Init page
        homePage = new SFHome(pageMobile, domain);
        checkout = new SFCheckout(pageMobile, domain);
        themeSetting = new SettingThemeAPI(theme);
        // Set timeout for test
        test.setTimeout(200000);
        // Precondition: Set checkout layout onepage or multistep
        await themeSetting.editCheckoutLayout(checkoutLayout);

        await test.step(`
          - Tại Storefront của store:
          - Vào Product detail của product
          - Click button Buy with paypal
          - Login vào Paypal dashboard
          - Click Paynow tại paypal dashboard`, async () => {
          // Go to storefront and search product
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(productName);
          // Click button buy with paypal
          await checkout.submitItemWhenClickBuyWithPaypal();
          if (checkoutLayout === "multi-step") {
            await checkout.btnExpandOrdSummaryLoc.click();
          }
          await checkout.inputPhoneNumber(customerInfo.phone_number);
          // Click continue to shipping method and payment method if need (3 pages checkout)
          await checkout.clickBtnContinueToShippingMethod();
          await checkout.continueToPaymentMethod();
          // Wait for choose payment method page is visible
          await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
        });

        await test.step(`- Click Complete order/Place your order`, async () => {
          // Click complete order and wait for thankyou page is visible, then popup PPC is visible
          if (await checkout.isOnePageCheckout()) {
            await checkout.page.locator(checkout.xpathPaymentLabel).scrollIntoViewIfNeeded();
            await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
          }
          await expect(checkout.paypalBlockLoc).toBeVisible();
          await checkout.clickCompleteOrder();
          await expect(checkout.thankyouPageLoc).toBeVisible();
          await expect(checkout.btnClosePPCPopup).toBeVisible();
        });

        await test.step(`
          - Tại popup PPC
          - Add product PPC vào store`, async () => {
          if (ppcItem) {
            itemPostPurchaseValue = await checkout.addProductPostPurchase(ppcItem);
            await expect(checkout.submitPaypalBtnLoc).toBeVisible();
          } else {
            await checkout.btnClosePPCPopupLoc.click();
            await expect(checkout.btnClosePPCPopupLoc).toBeHidden();
          }
        });

        await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
          if (itemPostPurchaseValue != null) {
            await checkout.completePaymentForPostPurchaseItem("PayPal");
          }
          await expect(checkout.thankyouPageLoc).toBeVisible();
        });
      });
    },
  );
});
