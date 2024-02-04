import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { GatewayInfo } from "@types";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SbCheckoutEUPaymentPlbaseScheduleData } from "../checkout-smp-EU";
import { chromium } from "playwright-extra";

test.describe("Checkout với SMP EU thành công", () => {
  const caseName = "TC_SMP_EU_01";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      shipping_address: shippingAddress,
      product_ppc: productPPCInfo,
      description: description,
      payment_method_info: paymentMethodInfo,
      schedule_time: scheduleTime,
      email: email,
      klarna_gateway_info: klarnaGatewayInfo,
    }) => {
      test(`${description} @${caseID}`, async ({ conf, token, authRequest, dashboard, scheduler }) => {
        test.setTimeout(conf.suiteConf.timeout);

        let orderAPI: OrderAPI;
        let mailBox: MailBox;
        let productPage: SFProduct;
        let totalOrderEmailConfirm: string;
        let orderId: number, totalOrderSF: number, orderName: string;
        let totalOrderDBStripe = 0,
          totalOrderSandboxKlarna = 0;
        let orderInfo;
        let totalOrderDB: number, actualPaymentStatus: string, paidByCustomer: number;
        let listTransactionID: string[];
        let scheduleData: SbCheckoutEUPaymentPlbaseScheduleData;
        let isSchedule: boolean;
        let gatewayInfo: GatewayInfo;

        const domain = conf.suiteConf.domain;
        const domainTemplate = conf.suiteConf.shop_template.domain;
        const listConnectedAccUS = conf.suiteConf.list_connected_acc_us;
        const productCheckout = conf.suiteConf.products_checkout;
        const paymentMethod = paymentMethodInfo.payment_type;
        const userAgentStrings = conf.suiteConf.list_user_agent;

        // Creat new browser context with random user agent
        const browser = await chromium.launch();
        const context = await browser.newContext({
          userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
        });
        const page = await context.newPage();

        const checkout = new SFCheckout(page, domain);
        const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        const dashboardPageTpl = new DashboardPage(page, domainTemplate);
        const dashboardPage = new DashboardPage(dashboard, domain);
        const orderPageTpl = new OrdersPage(page, domainTemplate);
        const orderPage = new OrdersPage(dashboard, domain);
        gatewayInfo = {
          secretKey: "",
          gatewayCode: "",
          connectedAccount: "",
        };

        //Get thông tin trước khi schedule từ database
        const rawDataJson = await scheduler.getData();
        if (rawDataJson) {
          scheduleData = rawDataJson as SbCheckoutEUPaymentPlbaseScheduleData;
          isSchedule = true;
        } else {
          scheduleData = {
            orderId: 0,
            orderName: "",
            totalOrderSF: 0,
            gatewayInfo: gatewayInfo,
          };
        }

        // test.slow();
        await test.step(`- Tại Storefront: Checkout thành công order qua Sofort SMP
        + Thêm 1 sản phẩm vào Cart và mở trang Checkout
        + Kiểm tra API payment_method?country_code
        + Click button Completed order/Place your order`, async () => {
          // Nếu isSchedule = true thì bỏ qua steps này
          if (isSchedule) {
            return;
          }
          const homepage = new SFHome(page, domain);

          // await page.goto("https://au-eu-payment-plbase.onshopbase.com/");
          await homepage.gotoHomePage();
          productPage = await homepage.searchThenViewProduct(productCheckout.name);
          await productPage.addProductToCart();
          await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(shippingAddress);
          await checkout.continueToPaymentMethod();

          // Kiểm tra API payment_method?country_code
          paymentMethodInfo.checkout_token = checkout.getCheckoutToken();
          await checkoutAPI.getEUPaymentMethodInfo(paymentMethodInfo);
          gatewayInfo.gatewayCode = checkoutAPI.gatewayCode;

          // Kiểm tra connected account tại api 'payment_method' khi vào trang checkout khi gateway là 'platform'
          if (gatewayInfo.gatewayCode === "platform") {
            gatewayInfo.connectedAccount = checkoutAPI.connectedAccount;
            gatewayInfo.secretKey = conf.suiteConf.platform_secret_key;
            expect(listConnectedAccUS).toContain(gatewayInfo.connectedAccount);
          } else {
            gatewayInfo.secretKey = conf.suiteConf.stripe_secret_key;
          }

          // Kiểm tra hiển thị EU payment method
          await page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
          await expect(await checkout.getXpathPaymentMethod(paymentMethod)).toBeVisible();

          // Completed order
          await checkout.completeOrderWithMethod(paymentMethod, null, null, null, klarnaGatewayInfo);
          totalOrderSandboxKlarna += checkout.total;

          // Thêm PPC (nếu có)
          if (productPPCInfo) {
            await checkout.addProductPostPurchase(productPPCInfo.name);
            await checkout.completePaymentForPostPurchaseItem(paymentMethod, null, klarnaGatewayInfo);
            await checkout.waitUntilElementVisible(checkout.xpathThankYou, 20000);
            totalOrderSandboxKlarna += checkout.total;
          } else {
            await checkout.btnClosePPCPopup.click();
          }

          // Lưu lại thông tin order
          orderId = await checkout.getOrderIdBySDK();
          totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
          orderName = await checkout.getOrderName();

          //Verify total order at sandbox Klarna = total order at SF
          if (paymentMethod === "Klarna") {
            expect(isEqual(totalOrderSF, totalOrderSandboxKlarna, 0.01)).toBe(true);
          }
        });

        await test.step(`- Login vào Dashboard > Orders:
         + Search order theo order name
         + Vào Order detail của 2 order vừa tạo`, async () => {
          if (isSchedule) {
            orderId = scheduleData.orderId;
            orderName = scheduleData.orderName;
            totalOrderSF = scheduleData.totalOrderSF;
            gatewayInfo = scheduleData.gatewayInfo;
            await scheduler.clear();
          }

          //Kiểm tra order details của order
          await dashboardPage.goToOrderDetails(orderId, "plusbase");
          actualPaymentStatus = await orderPage.getOrderStatus();

          // Nếu order chưa được capture thì lưu thông tin order và schedule lại
          if (actualPaymentStatus !== "Paid") {
            scheduleData.orderId = orderId;
            scheduleData.orderName = orderName;
            scheduleData.totalOrderSF = totalOrderSF;
            scheduleData.gatewayInfo = gatewayInfo;
            await scheduler.setData(scheduleData);
            await scheduler.schedule({ mode: "later", minutes: scheduleTime });
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip();
            return;
          }

          // Kiểm tra order details của order
          paidByCustomer = Number(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
          totalOrderDB = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));

          expect(isEqual(totalOrderDB, totalOrderSF, 0.01)).toBe(true);
          expect(actualPaymentStatus).toEqual("Paid");
          expect(isEqual(Number(paidByCustomer), totalOrderDB, 0.01)).toBe(true);
        });

        await test.step("Tại Dashboard template: Approve order vừa tạo", async () => {
          // Get shop template's access token
          const shopTokenTemplate = await token.getWithCredentials({
            domain: conf.suiteConf.shop_template.shop_name,
            username: conf.suiteConf.shop_template.username,
            password: conf.suiteConf.shop_template.password,
          });
          const accessTokenTemplate = shopTokenTemplate.access_token;

          await dashboardPageTpl.loginWithToken(accessTokenTemplate);
          await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
          await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
          paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
          actualPaymentStatus = await orderPageTpl.getPaymentStatus();
          expect(isEqual(paidByCustomer, totalOrderDB, 0.01)).toBe(true);
          expect(actualPaymentStatus).toEqual("Paid");
        });

        await test.step("Tại Stripe dashboard: Tìm kiếm order bằng transaction ID", async () => {
          orderAPI = new OrderAPI(domain, authRequest);
          // Kiểm tra order 1 trên Dashboard Stripe
          listTransactionID = await orderPage.getListTransactionsId();
          // Kiểm tra order 1 trên Dashboard Stripe
          for (const transactionID of listTransactionID) {
            //Get payment intend ID by transaction ID
            const paymentIntendID = await orderAPI.getPaymentIntendByTransactionId({
              key: gatewayInfo.secretKey,
              gatewayCode: gatewayInfo.gatewayCode,
              connectedAcc: gatewayInfo.connectedAccount,
              transactionId: transactionID,
            });

            // Get order info in Stripe dashboard by payment intend ID
            orderInfo = await orderAPI.getOrdInfoInStripe({
              key: gatewayInfo.secretKey,
              gatewayCode: gatewayInfo.gatewayCode,
              connectedAcc: gatewayInfo.connectedAccount,
              paymentIntendId: paymentIntendID,
            });
            totalOrderDBStripe += orderInfo.ordAmount;
          }
          totalOrderDBStripe = Number((totalOrderDBStripe / 100).toFixed(2));
          expect(isEqual(totalOrderDBStripe, totalOrderSF, 0.01)).toBe(true);
          expect(orderInfo.ordPaymentMethod).toEqual(paymentMethodInfo.payment_code);
        });

        await test.step("Tại mailbox buyer: Kiểm tra email confirmation gửi cho buyer", async () => {
          if (process.env.ENV !== "dev") {
            mailBox = await checkout.openMailBox(email);
            //Kiểm tra email order confirmation của order 1
            await mailBox.openOrderConfirmationNotification(orderName);
            totalOrderEmailConfirm = removeCurrencySymbol(await mailBox.getTotalOrder());
            expect(isEqual(Number(totalOrderEmailConfirm), totalOrderSF, 0.01)).toBe(true);
          }
        });
      });
    },
  );
});
