import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { getProxyPage } from "@core/utils/proxy_page";

test.describe("Checkout qua Paypal buy now pay later Printbase", async () => {
  let checkout: SFCheckout, orderPage: OrdersPage, orderPageTemplate: OrdersPage, mailBox: MailBox;
  let checkoutAPI: CheckoutAPI, dashboardPageTemplate: DashboardPage;
  let orderId: number, orderName: string, totalOrderSF: string, tipAtSF: string, taxAtSF: string;
  let shippingFee: string, customerEmail: string;
  let domain, domainCheckout, accessToken, accessTokenCheckout, ppcItem, productInfo, email, tippingInfo;
  let shippingAddress;

  test.beforeAll(async ({ conf, token }) => {
    domain = conf.suiteConf.domain;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    domainCheckout = conf.suiteConf.shop_checkout.domain;
    const shopTmpCheckout = await token.getWithCredentials({
      domain: conf.suiteConf.shop_checkout.shop_name,
      username: conf.suiteConf.shop_checkout.username,
      password: conf.suiteConf.shop_checkout.password,
    });
    accessTokenCheckout = shopTmpCheckout.access_token;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
  });

  test.beforeEach(async ({ conf, authRequest, page, dashboard }) => {
    productInfo = conf.caseConf.product;
    ppcItem = conf.caseConf.product_ppc_name;
    tippingInfo = conf.caseConf.tipping_info;
    const countryCode = shippingAddress.country_code;

    const proxyPage = await getProxyPage();
    checkoutAPI = new CheckoutAPI(domain, authRequest, proxyPage);
    dashboardPageTemplate = new DashboardPage(dashboard, domain);
    checkout = new SFCheckout(page, domainCheckout);
    orderPage = new OrdersPage(dashboard, domain);
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    await checkoutAPI.openCheckoutPageByToken();

    if (tippingInfo) {
      await checkout.addTip(tippingInfo);
    }
    await checkout.completeOrderWithMethod("PaypalBNPL");
    if (ppcItem) {
      await checkout.addProductPostPurchase(ppcItem);
      await checkout.completePaymentForPPCItemViaPayPalBNPL();
    }
    if (tippingInfo) {
      tipAtSF = await checkout.getTipOnOrderSummary();
    }
    totalOrderSF = await checkout.getTotalOnOrderSummary();
    taxAtSF = await checkout.getTaxOnOrderSummary();
    shippingFee = await checkout.getShippingFeeOnOrderSummary();
    orderId = await checkout.getOrderIdBySDK();
    orderName = await checkout.getOrderName();
    customerEmail = await checkout.getCustomerEmail();
  });

  test(`Kiểm tra checkout 1 order qua paypal khi chọn Pay later thành công @SB_TC_PP_BNPL_47`, async ({}) => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const tipAtDB = await orderPage.getTip();
      const taxAtDB = await orderPage.getTax();
      const shippingFeeDB = await orderPage.getShippingFee();
      const orderStatus = await orderPage.getOrderStatus();
      const totalOrderDB = await orderPage.getTotalOrder();

      expect(orderStatus).toEqual("Authorized");
      expect(paidByCustomer).toEqual("$0.00");
      expect(tipAtDB).toEqual(tipAtSF.split(" ")[0]);
      expect(taxAtDB).toEqual(taxAtSF);
      expect(shippingFeeDB).toEqual(shippingFee.split(" ")[0]);
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    await test.step(`Truy cập order details của order vừa tạo tại shop template > approve order`, async () => {
      orderPageTemplate = await dashboardPageTemplate.goToOpsOrderDetails(orderId, domain);
      await orderPageTemplate.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
    });

    await test.step("Tại trang order details: Reload lại trang order details", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessTokenCheckout);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalOrderSF.split(" ")[0]);
    });

    await test.step("Tại mailbox buyer: Kiểm tra email confirmation gửi cho buyer", async () => {
      mailBox = await checkout.openMailBox(customerEmail);
      await mailBox.openOrderConfirmationNotification(orderName);
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF.split(" ")[0]);
    });
  });

  test(`Kiểm tra checkout 1 orderqua paypal khi chọn Pay later có PPC thành công @SB_TC_PP_BNPL_48`, async () => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Authorized");
      expect(paidByCustomer).toEqual("$0.00");
    });

    await test.step(`Truy cập order details của order vừa tạo tại shop template > approve order`, async () => {
      orderPageTemplate = await dashboardPageTemplate.goToOpsOrderDetails(orderId, domain);
      await orderPageTemplate.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
    });

    await test.step("Tại trang order details: Reload lại trang order details", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessTokenCheckout);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalOrderSF.split(" ")[0]);
    });

    await test.step("Tại mailbox buyer: Kiểm tra email confirmation gửi cho buyer", async () => {
      mailBox = await checkout.openMailBox(customerEmail);
      await mailBox.openOrderConfirmationNotification(orderName);
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);
    });
  });
});
