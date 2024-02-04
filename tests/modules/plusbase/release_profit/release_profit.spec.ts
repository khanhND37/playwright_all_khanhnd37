import { expect } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrderAPI } from "@pages/api/order";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@core/utils/checkout";
import { SFHome } from "@pages/storefront/homepage";
import type { CheckoutPaymentMethodInfo, Product } from "@types";
import { CheckoutInfo } from "@types";
import { ContactUsPage } from "@pages/storefront/contact_us";
let domain: string;
let checkoutAPI: CheckoutAPI;
let dashboardPage: DashboardPage;
let ordersPage: OrdersPage;
let sFCheckout: SFCheckout;
let dashboardAPI: DashboardAPI;
let homePage: SFHome;
let infoProduct: Product;
let checkoutInfo: CheckoutInfo;

test.beforeEach(async ({ dashboard, conf, page, authRequest }) => {
  domain = conf.suiteConf.domain;
  checkoutAPI = new CheckoutAPI(domain, authRequest, page);
  dashboardPage = new DashboardPage(dashboard, domain);
  ordersPage = new OrdersPage(dashboardPage.page, domain);
  sFCheckout = new SFCheckout(checkoutAPI.page, domain);
  dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest, page);
  homePage = new SFHome(checkoutAPI.page, domain);
  infoProduct = conf.suiteConf.info_product;
});
test.describe("Release profit flow with update cancel/refund payment fee", async () => {
  const caseName = "SB_ORD_RP_01";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      product: product,
      payment_method: paymentMethod,
      description: description,
      is_create_invoice: isCreateInvoice,
      customer_info: customerInfo,
      index: index,
    }) => {
      test(`@${caseId} ${description}`, async ({ conf, authRequest }) => {
        let paymentFee = 0;

        await test.step("Search product > Add to cart > Checkout", async () => {
          // if have orderId ~> don't need to checkout again
          await checkoutAPI.addProductToCartThenCheckout([infoProduct[product]]);
          if (customerInfo) {
            await checkoutAPI.updateCustomerInformation(customerInfo.email_buyer, customerInfo.shipping_address);
          } else {
            await checkoutAPI.updateCustomerInformation();
          }
          if (customerInfo) {
            await homePage.gotoHomePage();
            await homePage.selectStorefrontCurrencyV2(customerInfo.shipping_address.country, "inside");
          }
          await checkoutAPI.openCheckoutPageByToken();

          await sFCheckout.footerLoc.scrollIntoViewIfNeeded();

          await sFCheckout.completeOrderWithMethod(paymentMethod);
          await expect(sFCheckout.genLoc(sFCheckout.getXpathWithLabel("Thank you!"))).toBeVisible();

          checkoutInfo = await checkoutAPI.getCheckoutInfo();
        });

        await test.step("Vào dashboard > Vào order detail order vừa tạo > Verify profit order ", async () => {
          await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);

          await expect(async () => {
            await ordersPage.page.reload();
            const paymentStt = await ordersPage.getPaymentStatus();
            expect(["Voided", "Refunded"].includes(paymentStt)).toBeTruthy();
          }).toPass();

          await ordersPage.clickShowCalculation();
          const totalOrder = Number(removeCurrencySymbol(await ordersPage.getTotalOrder()));
          paymentFee = totalOrder * conf.suiteConf.payment_fee_rate;
          const baseCost = Number(removeCurrencySymbol(await ordersPage.getBaseCost()));
          const shippingCost = Number(removeCurrencySymbol(await ordersPage.getShippingCost()));
          const shippingFee = Number(removeCurrencySymbol(await ordersPage.getShippingFee()));
          const handlingFee = Number(removeCurrencySymbol(await ordersPage.getHandlingFee()));
          const profit = Number(removeCurrencySymbol(await ordersPage.getProfit()));
          if (paymentMethod === "Afterpay") {
            expect(await ordersPage.getPaymentStatus()).toBe("Refunded");
            expect(handlingFee >= 0).toBeTruthy();
          } else {
            expect(await ordersPage.getPaymentStatus()).toBe("Voided");
            expect(handlingFee <= 0.01 && handlingFee >= -0.01).toBeTruthy();
          }
          expect(baseCost <= 0.01 && baseCost >= -0.01).toBeTruthy();
          expect(shippingCost - shippingFee <= 0.01 && shippingCost + shippingFee >= -0.01).toBeTruthy();
          expect(profit <= 0).toBeTruthy();
        });

        await test.step("Vào balance > Check invoice của order vừa tạo", async () => {
          const orderApi = new OrderAPI(conf.suiteConf.domain, authRequest);
          let invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);

          if (isCreateInvoice) {
            await expect(async () => {
              invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
              expect(invoiceData.id).toBeGreaterThan(0);
            }).toPass();
            const listTransAmt = await dashboardAPI.getOrderTransAmt(invoiceData.id);
            let totalTransAmt = 0;
            for (let i = 0; i < listTransAmt.length; i++) {
              totalTransAmt += listTransAmt[i];
            }
            if (paymentMethod === "Afterpay" && index === "1") {
              expect(totalTransAmt).toBeLessThan(0);
              expect(Math.abs(totalTransAmt)).toEqual(Number(paymentFee.toFixed(2)));
            } else {
              expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);
            }
          } else {
            expect(invoiceData).toBeNull();
          }
        });
      });
    },
  );
});

test.describe("Case cancel order contact from", async () => {
  let orderId: number;
  let checkoutInfos: CheckoutInfo;

  test(`@SB_ORD_RP_18 [PLB] Verify payment fee trường hợp buyer cancel order qua contact form, order chưa capture`, async ({
    conf,
    page,
    authRequest,
  }) => {
    let contactUsPage = new ContactUsPage(page, domain);
    let gatewayCode: string;
    let totalOrder: string;
    let secretKey: string;

    await test.step(`Search product > Add to cart > Checkout`, async () => {
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[conf.caseConf.product]],
        customerInfo: {
          emailBuyer: conf.caseConf.customer_info.email_buyer,
          shippingAddress: conf.caseConf.customer_info.shipping_address,
        },
      });
      expect(checkoutInfos).not.toBeUndefined();

      orderId = checkoutInfos.order.id;

      // Get payment method infor
      gatewayCode = (await checkoutAPI.getPaymentMethodInfo(undefined, checkoutInfos.token.checkout_token)).result[0]
        .code;
      secretKey = conf.caseConf.stripe_secret_key;
      let paymentMethodInfo: CheckoutPaymentMethodInfo;
      if (gatewayCode === "platform") {
        secretKey = conf.caseConf.platform_secret_key;
        paymentMethodInfo = conf.caseConf.payment_method_info;
        paymentMethodInfo.checkout_token = checkoutInfos.token.checkout_token;
        // get Connected account smp
        await checkoutAPI.getEUPaymentMethodInfo(conf.caseConf.payment_method_info);
      }
    });

    await test.step(`Vào dashboard > vào order detail order vừa tạo `, async () => {
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();
      expect(await ordersPage.getPaymentStatus()).toEqual(`Authorized`);
      await ordersPage.clickShowCalculation();
      totalOrder = await ordersPage.getTotalOrder();

      await ordersPage.verifyOrderInfo(checkoutInfos.totals, 0.03, 0.04, {
        profit: true,
        revenue: true,
        handlingFee: true,
        paidByCustomer: false,
        paymentFee: true,
        processingFee: true,
      });
    });

    await test.step(`Go to storefront > Đến page contact us > Nhập data order vừa tạo > Request cancel`, async () => {
      const contactUsPage = new ContactUsPage(page, domain);
      await contactUsPage.goToContactUs();
      await contactUsPage.fillFormContactUs(checkoutInfos.info.email, checkoutInfos.order.name, "Cancel");
      expect(contactUsPage.messageSuccess).toBeTruthy();
    });

    await test.step(`Vào email buyer > Vào email cancel order > Click "Cancel now"`, async () => {
      const customerInfo = conf.caseConf.customer_info;
      const checkout = new SFCheckout(page, domain, "", authRequest);
      const mailBox = await checkout.openMailBox(customerInfo.email_buyer);
      contactUsPage = await mailBox.confirmCancelOrdInMailBox(checkoutInfos.order.name);
      await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
      await contactUsPage.confirmCancelOrd();
      await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
    });

    await test.step(`Vào order detail order vừa request cancel > Verify profit`, async () => {
      await expect(async () => {
        await ordersPage.goToOrderByOrderId(orderId);
        expect(await ordersPage.getOrderStatus()).toEqual(`Voided`);
        expect(await ordersPage.getCancelStatusInOrderDetail()).toEqual(`Cancelled`);
      }).toPass();
      const orderAPI = new OrderAPI(domain, authRequest);
      await orderAPI.getTransactionId(orderId);

      const orderInfo = await orderAPI.getOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: checkoutAPI.connectedAccount,
        transactionId: orderAPI.paymentIntendId,
      });

      const ordStatus = orderInfo.ordRefundStatus;
      let ordRefundAmt = orderInfo.ordRefundAmt;
      ordRefundAmt = Number((ordRefundAmt / 100).toFixed(2));
      expect(ordStatus).toEqual("refund");
      expect(ordRefundAmt).toEqual(Number(removeCurrencySymbol(totalOrder)));
    });

    await test.step(`Vào balance > Check invoice `, async () => {
      const orderAPI = new OrderAPI(domain, authRequest);
      const invoiceData = await orderAPI.getInvoiceByOrderId(orderId);

      const listTransAmt = await dashboardAPI.getOrderTransAmt(invoiceData.id);
      let totalTransAmt = 0;
      for (let i = 0; i < listTransAmt.length; i++) {
        totalTransAmt += listTransAmt[i];
      }
      expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);
    });
  });

  test(`@SB_ORD_RP_17 [PLB] Verify payment fee trường hợp buyer cancel order qua contact form, order đã capture thành công`, async ({
    conf,
    page,
    authRequest,
  }) => {
    let contactUsPage = new ContactUsPage(page, domain);
    let gatewayCode: string;
    let totalOrder: string;
    let paymentFee: number;
    await test.step(`Search product > Add to cart > Checkout`, async () => {
      await checkoutAPI.addProductToCartThenCheckout([infoProduct[conf.caseConf.product]]);

      await checkoutAPI.updateCustomerInformation(
        conf.caseConf.customer_info.email_buyer,
        conf.caseConf.customer_info.shipping_address,
      );

      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(conf.caseConf.customer_info.shipping_address.country, "inside");

      await checkoutAPI.openCheckoutPageByToken();

      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();

      await sFCheckout.completeOrderWithMethod(conf.caseConf.payment_method);
      await expect(sFCheckout.genLoc(sFCheckout.xpathThankYou)).toBeVisible();
      totalOrder = await sFCheckout.getTotalOnOrderSummary();

      checkoutInfos = await checkoutAPI.getCheckoutInfo();
      orderId = checkoutInfos.order.id;
      gatewayCode = (await checkoutAPI.getPaymentMethodInfo(undefined, checkoutInfos.token.checkout_token)).result[0]
        .code;
    });

    await test.step(`Vào dashboard > vào order detail order vừa tạo `, async () => {
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();

      await expect(async () => {
        await ordersPage.page.reload();
        expect(await ordersPage.getPaymentStatus()).toEqual(`Paid`);
      }).toPass();
      await ordersPage.clickShowCalculation();

      paymentFee = Number((Number(removeCurrencySymbol(totalOrder)) * 0.03).toFixed(2));
      await ordersPage.verifyOrderInfo(checkoutInfos.totals, 0.03, 0.04, {
        profit: true,
        revenue: true,
        handlingFee: true,
        paidByCustomer: false,
        paymentFee: true,
        processingFee: true,
      });
    });

    await test.step(`Go to storefront > Đến page contact us > Nhập data order vừa tạo > Request cancel`, async () => {
      const contactUsPage = new ContactUsPage(page, domain);
      await contactUsPage.goToContactUs();
      await contactUsPage.fillFormContactUs(checkoutInfos.info.email, checkoutInfos.order.name, "Cancel");
      expect(contactUsPage.messageSuccess).toBeTruthy();
    });

    await test.step(`Vào email buyer > Vào email cancel order > Click "Cancel now"`, async () => {
      const customerInfo = conf.caseConf.customer_info;
      const checkout = new SFCheckout(page, domain, "", authRequest);
      const mailBox = await checkout.openMailBox(customerInfo.email_buyer);
      await expect(async () => {
        await mailBox.page.reload();
        contactUsPage = await mailBox.confirmCancelOrdInMailBox(checkoutInfos.order.name);
        await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
      }).toPass({ intervals: [2000] });

      await contactUsPage.confirmCancelOrd();
      await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
    });

    await test.step(`Vào order detail order vừa request cancel > Verify profit`, async () => {
      await ordersPage.goToOrderByOrderId(orderId);

      // reload page để order detail cập nhật order status
      await ordersPage.page.reload();
      expect(await ordersPage.getOrderStatus()).toEqual(`Partially refunded`);
      expect(await ordersPage.getCancelStatusInOrderDetail()).toEqual(`Cancelled`);
      const orderAPI = new OrderAPI(domain, authRequest);
      const secretKey = conf.caseConf.secret_key;
      await orderAPI.getTransactionId(orderId);
      const orderInfo = await orderAPI.getOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
      });

      const ordStatus = orderInfo.ordRefundStatus;
      let ordRefundAmt = orderInfo.ordRefundAmt;
      ordRefundAmt = Number((ordRefundAmt / 100).toFixed(2));
      expect(ordStatus).toEqual("refund");
      expect(isEqual(ordRefundAmt, Number(removeCurrencySymbol(totalOrder)) - paymentFee, 0.01)).toEqual(true);
    });

    await test.step(`Vào balance > Check invoice `, async () => {
      const orderAPI = new OrderAPI(domain, authRequest);
      const invoiceData = await orderAPI.getInvoiceByOrderId(orderId);

      const listTransAmt = await dashboardAPI.getOrderTransAmt(invoiceData.id);
      let totalTransAmt = 0;
      for (let i = 0; i < listTransAmt.length; i++) {
        totalTransAmt += listTransAmt[i];
      }
      expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);
    });
  });
});
