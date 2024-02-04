import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { StorefrontInfo } from "./filter_order_with_sf_domain";
import { MailBox } from "@pages/thirdparty/mailbox";
import { EditOrderPage } from "@pages/dashboard/edit_order";
import { generateRandomMailToThisEmail } from "@core/utils/mail";
import { SignUpStorefrontInfo } from "./send_mail_of_multiple_storefronts";
import { DashboardAPI } from "@pages/api/dashboard";
import { APIRequestContext } from "@playwright/test";

test.describe("Verify filter order with multiple storefront", () => {
  let domain, domain1, domain2: string;
  let storefront1Info, storefront2Info: StorefrontInfo;
  let ordersPage: OrdersPage;
  let orderName1, orderName2: string;
  let orderId1, orderId2: number;
  let email, cardInfo, shippingAddress, productInfo, editedReduceProduct, editedAddProduct, refundInfo;
  let editedAddProductName, editedReduceProductName, editedAddProductQuantity, editedReduceProductQuantity;
  let mailBox: MailBox;
  let editOrderPage: EditOrderPage;
  let signInSignUp: DashboardAPI;
  let authRequest: APIRequestContext;
  let accSignUpStorefrontInfo1, accSignUpStorefrontInfo2: SignUpStorefrontInfo;

  test.beforeEach(async ({ conf, page }) => {
    domain = conf.suiteConf.domain;
    domain1 = conf.suiteConf.storefront1_info.domain;
    domain2 = conf.suiteConf.storefront2_info.domain;
    storefront1Info = conf.suiteConf.storefront1_info;
    storefront2Info = conf.suiteConf.storefront2_info;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    cardInfo = conf.suiteConf.card_info;
    productInfo = conf.suiteConf.products;

    mailBox = new MailBox(page, domain);
  });

  test("@SB_ORD_MSF_16 Verify mail content: order confirmation, order edit, order edit invoice, shipping confirmation", async ({
    request,
    conf,
    page,
    dashboard,
  }) => {
    editedReduceProduct = conf.caseConf.edit_reduce_products;
    editedAddProduct = conf.caseConf.edit_add_products;
    editedReduceProductName = editedReduceProduct.product.name;
    editedAddProductName = editedAddProduct.product.name;
    editedReduceProductQuantity = editedReduceProduct.product.quantity;
    editedAddProductQuantity = editedAddProduct.product.quantity;
    refundInfo = conf.caseConf.refund_info;

    ordersPage = new OrdersPage(dashboard, domain);
    editOrderPage = new EditOrderPage(dashboard, domain);

    // checkout main SF
    await test.step(`Checkout with main storefront`, async () => {
      const checkoutAPI1 = new CheckoutAPI(domain1, request, page);
      const checkoutInfo1 = await checkoutAPI1.createAnOrderWithCreditCard({
        productsCheckout: productInfo,
        customerInfo: { emailBuyer: email.buyer1, shippingAddress: shippingAddress },
        cardInfo: cardInfo,
      });
      orderName1 = checkoutInfo1.order.name;
      orderId1 = checkoutInfo1.order.id;
    });

    await test.step(`Go to Order detail of main storefront: reduce quantity of products checkout to verify edit order mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId1);
      expect(await ordersPage.isDisplayStorefrontDomain(storefront1Info)).toBe(true);

      // edit order
      await editOrderPage.navigateToOrderPageByAPI(orderId1);
      await editOrderPage.editOrderByAdjustingQty(editedReduceProductName, editedReduceProductQuantity);
      await editOrderPage.updateOrder();
    });

    await test.step(`Go to Order detail at main storefront: add quantity of products checkout to verify edit invoice order mail`, async () => {
      // edit order invoice
      await editOrderPage.navigateToOrderPageByAPI(orderId1);
      await editOrderPage.editOrderByAdjustingQty(editedAddProductName, editedAddProductQuantity);
      await editOrderPage.sendInvoice();
      await ordersPage.waitForElementVisibleThenInvisible(
        ordersPage.genXpathToastMsg(`All changes were successfully saved`),
      );
    });

    await test.step(`Go to Order detail at main storefront: fulfill order to verify shipping confirmation mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId1);

      //fulfill order
      await ordersPage.markAsFulfillOrd();
      await ordersPage.waitForElementVisibleThenInvisible(
        ordersPage.genXpathToastMsg(`Line item(s) have been fulfilled`),
      );
      expect(await ordersPage.genOrderStatusLoc("Fulfilled").isVisible()).toBe(true);
    });

    await test.step(`Go to Mailinator to verify order confirmation mail after buyer checkout at main storefront`, async () => {
      await mailBox.openOrderConfirmationNotification(orderName1, email.buyer1);

      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      expect((await mailBox.page.getByText(orderName1)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`View your order`);
      await mailBox.page.url().includes(storefront1Info.name);
      await mailBox.page.reload();
    });

    await test.step(`Verify edit order mail at main storefront`, async () => {
      // check mail edit order
      await mailBox.openMailEditOrder(orderName1, email.buyer1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      expect((await mailBox.page.getByText(orderName1)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`View your order`);
      await mailBox.page.url().includes(storefront1Info.name);
    });

    await test.step(`Verify edit order invoice mail at main storefront`, async () => {
      // check mail edit invoice order
      await mailBox.openMailEditOrderInvoice(email.buyer1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      expect((await mailBox.page.getByText(orderName1)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`Pay now`);
      await mailBox.page.url().includes(storefront1Info.name);
    });

    await test.step(`Verify shipping confirmation mail at main storefront`, async () => {
      // check mail shipping confirmation
      await mailBox.openShipmentNotification(orderName1, email.buyer1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      expect((await mailBox.page.getByText(orderName1)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`View your order`);
      await mailBox.page.url().includes(storefront1Info.name);
    });

    // checkout secondary SF
    await test.step(`Checkout with secondary storefront`, async () => {
      const checkoutAPI2 = new CheckoutAPI(domain2, request, page);
      const checkoutInfo2 = await checkoutAPI2.createAnOrderWithCreditCard({
        productsCheckout: productInfo,
        customerInfo: { emailBuyer: email.buyer2, shippingAddress: shippingAddress },
        cardInfo: cardInfo,
      });
      orderName2 = checkoutInfo2.order.name;
      orderId2 = checkoutInfo2.order.id;
    });

    await test.step(`Go to Order detail at secondary storefront: reduce quantity of products checkout to verify edit order mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId2);
      expect(await ordersPage.isDisplayStorefrontDomain(storefront2Info)).toBe(true);

      // edit order
      await editOrderPage.navigateToOrderPageByAPI(orderId2);
      await editOrderPage.editOrderByAdjustingQty(editedReduceProductName, editedReduceProductQuantity);
      await editOrderPage.updateOrder();
    });

    await test.step(`Go to Order detail at secondary storefront: add quantity of products checkout to verify edit invoice order mail`, async () => {
      await editOrderPage.navigateToOrderPageByAPI(orderId2);
      // edit order invoice
      await editOrderPage.editOrderByAdjustingQty(editedAddProductName, editedAddProductQuantity);
      await editOrderPage.sendInvoice();
      await ordersPage.waitForElementVisibleThenInvisible(
        ordersPage.genXpathToastMsg(`All changes were successfully saved`),
      );
    });

    await test.step(`Go to Order detail at secondary storefront: fulfill order to verify shipping confirmation mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId2);

      //fulfill order
      await ordersPage.markAsFulfillOrd();
      await ordersPage.waitForElementVisibleThenInvisible(
        ordersPage.genXpathToastMsg(`Line item(s) have been fulfilled`),
      );
      expect(await ordersPage.genOrderStatusLoc("Fulfilled").isVisible()).toBe(true);
    });

    await test.step(`Go to Mailinator to verify order confirmation mail after buyer checkout at secondary storefront`, async () => {
      await mailBox.openOrderConfirmationNotification(orderName2, email.buyer2);

      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      expect((await mailBox.page.getByText(orderName2)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`View your order`);
      await mailBox.page.url().includes(storefront2Info.name);
    });

    await test.step(`Verify edit order mail at secondary storefront`, async () => {
      // check mail edit order
      await mailBox.openMailEditOrder(orderName2, email.buyer2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      expect((await mailBox.page.getByText(orderName2)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`View your order`);
      await mailBox.page.url().includes(storefront2Info.name);
    });

    await test.step(`Verify edit order invoice mail at secondary storefront`, async () => {
      // check mail edit invoice order
      await mailBox.openMailEditOrderInvoice(email.buyer2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      expect((await mailBox.page.getByText(orderName2)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`Pay now`);
      await mailBox.page.url().includes(storefront2Info.name);
    });

    await test.step(`Verify shipping confirmation mail at secondary storefront`, async () => {
      // check mail shipping confirmation
      await mailBox.openShipmentNotification(orderName2, email.buyer2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      expect((await mailBox.page.getByText(orderName2)) !== undefined).toBeTruthy();
      await mailBox.clickBtnInMail(`View your order`);
      await mailBox.page.url().includes(storefront2Info.name);
    });
  });

  test("@SB_ORD_MSF_38 Verify mail content: refund order, cancel order", async ({ request, conf, page, dashboard }) => {
    refundInfo = conf.caseConf.refund_info;

    ordersPage = new OrdersPage(dashboard, domain);

    // checkout main SF
    await test.step(`Checkout with main storefront`, async () => {
      const checkoutAPI1 = new CheckoutAPI(domain1, request, page);
      const checkoutInfo1 = await checkoutAPI1.createAnOrderWithCreditCard({
        productsCheckout: productInfo,
        customerInfo: { emailBuyer: email.buyer1, shippingAddress: shippingAddress },
        cardInfo: cardInfo,
      });
      orderName1 = checkoutInfo1.order.name;
      orderId1 = checkoutInfo1.order.id;
    });

    // checkout secondary SF
    await test.step(`Checkout with secondary storefront`, async () => {
      const checkoutAPI2 = new CheckoutAPI(domain2, request, page);
      const checkoutInfo2 = await checkoutAPI2.createAnOrderWithCreditCard({
        productsCheckout: productInfo,
        customerInfo: { emailBuyer: email.buyer2, shippingAddress: shippingAddress },
        cardInfo: cardInfo,
      });
      orderName2 = checkoutInfo2.order.name;
      orderId2 = checkoutInfo2.order.id;
    });

    await test.step(`Go to Order detail at main storefront: refund order and verify refund order mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId1);
      const actualPaymentStatus = await ordersPage.reloadUntilOrdCapture();
      expect(actualPaymentStatus).toEqual("Paid");
      await ordersPage.refundOrderAtOrderDetails(refundInfo);
      expect(await ordersPage.getPaymentStatus()).toEqual("Partially refunded");

      // check mail shipping confirmation

      await mailBox.openRefundNotification(email.buyer1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      expect((await mailBox.page.getByText(orderName1)) !== undefined).toBeTruthy();
    });

    await test.step(`Go to Order detail at main storefront: cancel order and verify cancel order mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId1);
      await ordersPage.cancelOrder(1);
      await ordersPage.waitForElementVisibleThenInvisible(ordersPage.genXpathToastMsg(`Order has been canceled`));

      // check mail shipping confirmation
      await mailBox.openOrderCanceledNotification(orderName1, email.buyer1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      expect((await mailBox.page.getByText(orderName1)) !== undefined).toBeTruthy();
    });

    await test.step(`Go to Order detail at secondary storefront: refund order and verify refund order mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId2);
      const actualPaymentStatus = await ordersPage.reloadUntilOrdCapture();
      expect(actualPaymentStatus).toEqual("Paid");
      await ordersPage.refundOrderAtOrderDetails(refundInfo);
      expect(await ordersPage.getPaymentStatus()).toEqual("Partially refunded");

      // check mail shipping confirmation

      await mailBox.openRefundNotification(email.buyer2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      expect((await mailBox.page.getByText(orderName2)) !== undefined).toBeTruthy();
    });

    await test.step(`Go to Order detail at secondary storefront: cancel order and verify cancel order mail`, async () => {
      await ordersPage.goToOrderByOrderId(orderId2);
      await ordersPage.cancelOrder(1);
      await ordersPage.waitForElementVisibleThenInvisible(ordersPage.genXpathToastMsg(`Order has been canceled`));

      // check mail shipping confirmation
      await mailBox.openOrderCanceledNotification(orderName2, email.buyer2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      expect((await mailBox.page.getByText(orderName2)) !== undefined).toBeTruthy();
    });
  });

  test("@SB_ORD_MSF_76 Verify mail content: customer activation, customer welcome, customer reset password", async ({
    conf,
    multipleStore,
  }) => {
    authRequest = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      conf.suiteConf.domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );
    signInSignUp = new DashboardAPI(domain, authRequest);
    const signUpEmail1 = generateRandomMailToThisEmail();
    accSignUpStorefrontInfo1 = {
      domain: domain1,
      email: signUpEmail1,
      password: conf.caseConf.password,
    };

    mailBox = await mailBox.openMailBoxWithProxyDomain(mailBox.page, signUpEmail1);

    const signUpEmail2 = generateRandomMailToThisEmail();
    accSignUpStorefrontInfo2 = {
      domain: domain2,
      email: signUpEmail2,
      password: conf.caseConf.password,
    };

    await test.step(`Go to main SF: sign-up account -> verify customer activation & customer welcome mail`, async () => {
      await signInSignUp.signUpAPI(accSignUpStorefrontInfo1);

      // check mail customer activation of main SF
      await mailBox.openCustomerActivationNotification(signUpEmail1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);

      // check mail customer welcome of main SF
      await mailBox.clickActivateAcc();

      await mailBox.openCustomerWelcomeNotification(signUpEmail1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
    });

    await test.step(`Go to secondary SF: sign-up account -> verify customer activation & customer welcome mail`, async () => {
      await signInSignUp.signUpAPI(accSignUpStorefrontInfo2);

      // check mail customer activation of secondary SF
      await mailBox.openCustomerActivationNotification(signUpEmail2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);

      // check mail customer welcome of secondary SF
      await mailBox.clickActivateAcc();

      await mailBox.openCustomerWelcomeNotification(signUpEmail2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
    });

    await test.step(`Go to main SF: sign-up account -> verify customer activation & customer welcome mail`, async () => {
      mailBox = await mailBox.openMailBoxWithProxyDomain(mailBox.page, signUpEmail1);
      await signInSignUp.resetPasswordAPI(accSignUpStorefrontInfo1);

      // Check mail reset password
      await mailBox.openResetPassMail(signUpEmail1);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront1Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront1Info.customer_email);
      await mailBox.clickBtnInMail(`Reset your password`);
      await mailBox.page.url().includes(storefront1Info.name);
    });

    await test.step(`Go to secondary SF: sign-up account -> verify customer activation & customer welcome mail`, async () => {
      mailBox = await mailBox.openMailBoxWithProxyDomain(mailBox.page, signUpEmail2);
      await signInSignUp.resetPasswordAPI(accSignUpStorefrontInfo2);

      // Check mail reset password
      await mailBox.openResetPassMail(signUpEmail2);
      expect(await mailBox.getStorefrontNameInMail()).toEqual(storefront2Info.name);
      expect(await mailBox.getCustomerMailInMail()).toEqual(storefront2Info.customer_email);
      await mailBox.page.url().includes(storefront2Info.name);
    });
  });
});
