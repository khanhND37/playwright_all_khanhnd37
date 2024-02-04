import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import { SbCheckoutStripeEUPbaseScheduleData } from "./checkout-EU-payment-pbase";
import { MailBox } from "@pages/thirdparty/mailbox";
import { chromium } from "playwright-extra";

test.describe("Checkout với Stripe EU thành công", () => {
  const caseName = "TC_ST_EU_PB_01";
  const conf = loadData(__dirname, caseName);
  let mailBox: MailBox;
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      product_ppc: productPPCInfo,
      description: description,
      payment_method_info: paymentMethodInfo,
      schedule_time: scheduleTime,
      shipping_address: shippingAddress,
      email: email,
      klarna_gateway_info: klarnaGatewayInfo,
    }) => {
      test(`${description} @${caseID}`, async ({ dashboard, conf, authRequest, scheduler }) => {
        test.setTimeout(conf.suiteConf.timeout);
        let orderPage: OrdersPage, orderAPI: OrderAPI;
        let totalOrderEmailConfirm: number, subTotalBeforePPC: number, subTotalAfterPPC: number;
        let orderId: number, totalOrderSF: number, orderName: string;
        let totalOrderDBStripe = 0,
          totalOrderSandboxKlarna = 0;
        let orderInfo;
        let totalOrderDB: number, actualPaymentStatus: string, paidByCustomer: number;
        let listTransactionID: string[];
        let isSchedule: boolean;
        let scheduleData: SbCheckoutStripeEUPbaseScheduleData;

        const domain = conf.suiteConf.domain;
        const paymentMethod = paymentMethodInfo.payment_type;
        const secretKey = conf.suiteConf.stripe_secret_key;
        const hiveInfo = conf.suiteConf.hive_info;
        const productCheckout = conf.suiteConf.products_checkout;
        const userAgentStrings = conf.suiteConf.list_user_agent;

        // Creat new browser context with random user agent
        const browser = await chromium.launch();
        const context = await browser.newContext({
          userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
        });
        const page = await context.newPage();

        const checkout = new SFCheckout(page, domain);
        const hivePage = new HivePBase(page, hiveInfo.domain);
        const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        const dashboardPage = new DashboardPage(dashboard, domain);
        mailBox = new MailBox(page, domain);

        const rawDataJson = await scheduler.getData();
        if (rawDataJson) {
          scheduleData = rawDataJson as SbCheckoutStripeEUPbaseScheduleData;
          isSchedule = true;
        } else {
          scheduleData = {
            orderId: 0,
            orderName: "",
            totalOrderSF: 0,
          };
        }

        await test.step(`- Tại Storefront: Checkout thành công order qua Sofort 
        + Thêm 1 sản phẩm vào Cart và mở trang Checkout
        + Kiểm tra API payment_method?country_code
        + Click button Completed order/Place your order`, async () => {
          // Nếu isSchedule = true thì bỏ qua steps này
          if (isSchedule) {
            return;
          }

          // Add product to cart and open checkout page
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, email, shippingAddress);
          await checkoutAPI.openCheckoutPageByToken();

          // Kiểm tra API payment_method?country_code
          paymentMethodInfo.checkout_token = checkout.getCheckoutToken();
          await checkoutAPI.getEUPaymentMethodInfo(paymentMethodInfo);
          expect(checkoutAPI.gatewayCode).toEqual("stripe");
          await checkout.footerLoc.scrollIntoViewIfNeeded();

          // Completed order
          await expect(await checkout.getXpathPaymentMethod(paymentMethod)).toBeVisible();
          await checkout.completeOrderWithMethod(paymentMethod, null, null, null, klarnaGatewayInfo);
          await checkout.waitUntilElementVisible(checkout.xpathThankYou);
          subTotalBeforePPC = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
          totalOrderSandboxKlarna += checkout.total;

          // Thêm PPC (nếu có)
          if (productPPCInfo) {
            await checkout.addProductPostPurchase(productPPCInfo.name);
            const productPPCPrice = Number(checkout.itemPostPurchaseValue);
            await checkout.completePaymentForPostPurchaseItem(paymentMethod, null, klarnaGatewayInfo);
            await checkout.waitUntilElementVisible(checkout.xpathThankYou, 20000);
            subTotalAfterPPC = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
            totalOrderSandboxKlarna += checkout.total;

            //Kiểm tra subTotal sau khi thêm PPC = subTotal trước khi thêm PPC + giá PPC
            expect(isEqual(subTotalAfterPPC, subTotalBeforePPC + productPPCPrice, 0.01)).toBe(true);
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
         + Vào Order detail của order vừa tạo`, async () => {
          // Nếu có schedule, get data schedule từ database
          if (isSchedule) {
            orderId = scheduleData.orderId;
            orderName = scheduleData.orderName;
            totalOrderSF = scheduleData.totalOrderSF;
            await scheduler.clear();
          }

          //Kiểm tra order details của order 1
          orderPage = await dashboardPage.goToOrderDetails(orderId, "printbase");
          actualPaymentStatus = await orderPage.getOrderStatus();

          // Nếu order chưa được capture thì lưu thông tin order và schedule lại
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
          paidByCustomer = Number(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
          totalOrderDB = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));

          expect(isEqual(totalOrderDB, totalOrderSF, 0.01)).toBe(true);
          expect(actualPaymentStatus).toEqual("Paid");
          expect(isEqual(Number(paidByCustomer), totalOrderDB, 0.01)).toBe(true);
        });

        await test.step("Tại Hive printbase: Approve 2 order vừa tạo", async () => {
          // Approve order trên Hive printbase
          await hivePage.loginToHivePrintBase(hiveInfo.username, hiveInfo.password);
          await hivePage.goToOrderDetail(orderId, "pbase-order");
          await hivePage.approveOrder();

          //Reload lại trang order details
          await dashboard.reload();
          paidByCustomer = Number(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
          actualPaymentStatus = await orderPage.getPaymentStatus();
          expect(isEqual(paidByCustomer, totalOrderDB, 0.01)).toBe(true);
          expect(actualPaymentStatus).toEqual("Paid");
        });

        await test.step("Tại Stripe dashboard: Tìm kiếm 2 order bằng transaction ID", async () => {
          orderAPI = new OrderAPI(domain, authRequest);
          // Kiểm tra order 1 trên Dashboard Stripe
          listTransactionID = await orderPage.getListTransactionsId();
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
            const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
            await mailBox.openMailDetailWithAPI(email, emailTitle);

            //Kiểm tra email order confirmation của order 1
            totalOrderEmailConfirm = Number(removeCurrencySymbol(await mailBox.getTotalOrder()));
            expect(isEqual(totalOrderEmailConfirm, totalOrderSF, 0.01)).toBe(true);
          }
        });
      });
    },
  );
});
