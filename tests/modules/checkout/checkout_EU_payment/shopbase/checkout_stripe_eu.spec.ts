import { loadData } from "@core/conf/conf";
import { OrderAPI } from "@pages/api/order";
import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import { SFHome } from "@pages/storefront/homepage";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SbCheckoutStripeEUScheduleData } from "./checkout-stripe-eu";
import { chromium } from "playwright-extra";

test.describe("Checkout với Stripe EU thành công", () => {
  const caseName = "TC_ST_EU_01";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      customer_info: customerInfo,
      product_ppc: productPPCInfo,
      description: description,
      payment_method_info: paymentMethodInfo,
      schedule_time: scheduleTime,
    }) => {
      test(`${description} @${caseID}`, async ({ authRequest, conf, dashboard, scheduler }) => {
        let orderAPI: OrderAPI;
        let totalOrderEmailConfirm: number, subTotalBeforePPC: number, subTotalAfterPPC: number;
        let orderId: number, totalOrderSF: number, orderName: string;
        let totalOrderDBStripe = 0,
          totalOrderSandboxKlarna = 0;
        let orderInfo;
        let totalOrderDB: number, actualPaymentStatus: string, paidByCustomer: number;
        let listTransactionID: string[];
        let scheduleData: SbCheckoutStripeEUScheduleData;
        let isSchedule: boolean;

        const domain = conf.suiteConf.domain;
        const productInfo = conf.suiteConf.product;
        const paymentMethod = paymentMethodInfo.payment_type;
        const secretKey = conf.suiteConf.stripe_secret_key;
        const timeout = conf.suiteConf.timeout;
        const userAgentStrings = conf.suiteConf.list_user_agent;

        // Creat new browser context with random user agent
        const browser = await chromium.launch();
        const context = await browser.newContext({
          userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
        });
        const page = await context.newPage();

        const checkout = new SFCheckout(page, domain);
        const homePage = new SFHome(page, domain);
        const productPage = new SFProduct(page, domain);
        const mailBox = new MailBox(page, domain);
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const dashboardPage = new DashboardPage(dashboard, domain);
        const orderPage = new OrdersPage(dashboard, domain);

        //Get thông tin trước khi schedule từ database
        const rawDataJson = await scheduler.getData();
        if (rawDataJson) {
          scheduleData = rawDataJson as SbCheckoutStripeEUScheduleData;
          isSchedule = true;
        } else {
          scheduleData = {
            orderId: 0,
            orderName: "",
            totalOrderSF: 0,
          };
        }

        await test.step(`- Tại Storefront: Checkout thành công order qua Sofort`, async () => {
          // Set timeout for test
          test.setTimeout(timeout);
          // Nếu isSchedule = true thì bỏ qua steps này
          if (isSchedule) {
            return;
          }

          // Thêm 1 sản phẩm vào Cart và mở trang Checkout, nhập thông tin customer
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyV2(customerInfo.country);
          await homePage.searchThenViewProduct(productInfo.name);
          await productPage.addProductToCart();
          await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(customerInfo);
          await checkout.continueToPaymentMethod();

          // Kiểm tra API payment_method?country_code
          paymentMethodInfo.checkout_token = checkout.getCheckoutToken();
          await checkoutAPI.getEUPaymentMethodInfo(paymentMethodInfo);
          expect(checkoutAPI.gatewayCode).toEqual("stripe");

          // Completed order
          await expect(await checkout.getXpathPaymentMethod(paymentMethod)).toBeVisible();
          await checkout.completeOrderWithMethod(paymentMethod);
          await checkout.waitUntilElementVisible(checkout.xpathThankYou, 20000);
          subTotalBeforePPC = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
          totalOrderSandboxKlarna += checkout.total;

          // Thêm PPC (nếu có)
          if (productPPCInfo) {
            await checkout.addProductPostPurchase(productPPCInfo.name);
            // Get product PPC price
            const productPPCPrice = Number(checkout.itemPostPurchaseValue);
            await checkout.completePaymentForPostPurchaseItem(paymentMethod);
            await checkout.waitUntilElementVisible(checkout.xpathThankYou, 20000);
            subTotalAfterPPC = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
            totalOrderSandboxKlarna += checkout.total;

            //Kiểm tra subTotal sau khi thêm PPC = subTotal trước khi thêm PPC + giá PPC
            expect(isEqual(subTotalAfterPPC, subTotalBeforePPC + productPPCPrice, 0.01)).toBe(true);
          } else {
            await checkout.genLoc(checkout.xpathClosePPCPopUp).click();
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
        + Vào Order detail của order vừa tạo`, async () => {
          if (isSchedule) {
            orderId = scheduleData.orderId;
            orderName = scheduleData.orderName;
            totalOrderSF = scheduleData.totalOrderSF;
            await scheduler.clear();
          }
          //Kiểm tra order details của order 1
          await dashboardPage.goToOrderDetails(orderId, "shopbase");
          actualPaymentStatus = await orderPage.getOrderStatus();

          // Nếu order chưa được thanh toán thì lưu thông tin order và schedule lại
          if (actualPaymentStatus !== "Paid") {
            scheduleData.orderId = orderId;
            scheduleData.orderName = orderName;
            scheduleData.totalOrderSF = totalOrderSF;
            await scheduler.setData(scheduleData);
            await scheduler.schedule({ mode: "later", minutes: scheduleTime });
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip();
            return;
          }

          // Kiểm tra order details của order
          await orderPage.switchCurrency();
          paidByCustomer = Number(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
          totalOrderDB = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(totalOrderDB, totalOrderSF, 0.01)).toBe(true);
          expect(actualPaymentStatus).toEqual("Paid");
          expect(isEqual(Number(paidByCustomer), totalOrderDB, 0.01)).toBe(true);
        });

        await test.step("Tại Stripe dashboard: Tìm kiếm 2 order bằng transaction ID", async () => {
          orderAPI = new OrderAPI(domain, authRequest); // Kiểm tra order 1 trên Dashboard Stripe
          listTransactionID = await orderPage.getListTransactionsId();
          // Kiểm tra order 1 trên Dashboard Stripe
          for (const transactionID of listTransactionID) {
            //Get payment intend ID by transaction ID
            const paymentIntendID = await orderAPI.getPaymentIntendByTransactionId({
              key: secretKey,
              transactionId: transactionID,
            });

            // Get order info in Stripe dashboard by payment intend ID
            orderInfo = await orderAPI.getOrdInfoInStripe({
              key: secretKey,
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
            // Mở mailbox buyer
            const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
            await mailBox.openMailDetailWithAPI(customerInfo.email, emailTitle);

            //Kiểm tra email order confirmation của order 1
            totalOrderEmailConfirm = Number(removeCurrencySymbol(await mailBox.getTotalOrder()));
            expect(isEqual(totalOrderEmailConfirm, totalOrderSF, 0.01)).toBe(true);
          }
        });
      });
    },
  );
});
