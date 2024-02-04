import { expect, test } from "@core/fixtures";
import { getProxyPage } from "@core/utils/proxy_page";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Checkout qua Paypal buy now pay later Printbase", async () => {
  let checkout: SFCheckout, orderPage: OrdersPage, mailBox: MailBox, hivePbase: HivePBase;
  let checkoutAPI: CheckoutAPI;
  let orderId: number, orderName: string, totalOrderSF: string, tipAtSF: string, taxAtSF: string;
  let shippingFee: string, customerEmail: string;
  let domain, accessToken, ppcItem, productInfo, email, tippingInfo;
  let shippingAddress, hivePbDomain, hiveUsername: string, hivePasswd: string;

  test.beforeAll(async ({ conf, token }) => {
    domain = conf.suiteConf.domain;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    hivePbDomain = conf.suiteConf.hive_info.domain;
    hiveUsername = conf.suiteConf.hive_info.username;
    hivePasswd = conf.suiteConf.hive_info.password;
  });

  test.beforeEach(async ({ conf, authRequest, page, dashboard }) => {
    hivePbase = new HivePBase(page, hivePbDomain);
    productInfo = conf.caseConf.product;
    ppcItem = conf.caseConf.product_ppc_name;
    tippingInfo = conf.caseConf.tipping_info;
    const countryCode = shippingAddress.country_code;
    const proxyPage = await getProxyPage();
    checkoutAPI = new CheckoutAPI(domain, authRequest, proxyPage);
    orderPage = new OrdersPage(dashboard, domain);
    checkout = new SFCheckout(page, domain);
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

  test(`Kiểm tra checkout 1 order qua paypal khi chọn Pay later thành công @SB_TC_PP_BNPL_28`, async () => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const tipAtDB = await orderPage.getTip();
      const taxAtDB = await orderPage.getTax();
      const shippingFeeDB = await orderPage.getShippingFee();
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Authorized");
      expect(paidByCustomer).toEqual("$0.00");
      expect(tipAtDB).toEqual(tipAtSF.split(" ")[0]);
      expect(taxAtDB).toEqual(taxAtSF);
      expect(shippingFeeDB).toEqual(shippingFee.split(" ")[0]);
    });

    await test.step(`Truy cập order details của order vừa tạo tại shop template > approve order`, async () => {
      await hivePbase.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePbase.goToOrderDetail(orderId);
      await hivePbase.approveOrder();
    });

    await test.step("Tại trang order details: Reload lại trang order details", async () => {
      await checkout.openOrderPBaseByAPI(orderId, accessToken);
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

  test(`Kiểm tra checkout 1 order qua paypal khi chọn Pay later có PPC thành công @SB_TC_PP_BNPL_29`, async () => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Authorized");
      expect(paidByCustomer).toEqual("$0.00");
    });

    await test.step(`Truy cập order details của order vừa tạo tại Hive > approve order`, async () => {
      await hivePbase.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePbase.goToOrderDetail(orderId);
      await hivePbase.approveOrder();
    });

    await test.step("Tại trang order details: Reload lại trang order details", async () => {
      await checkout.openOrderPBaseByAPI(orderId, accessToken);
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
});
