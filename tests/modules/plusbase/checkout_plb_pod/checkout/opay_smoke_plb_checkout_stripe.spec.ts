import { test, expect } from "@core/fixtures";
import { buildOrderTimelineMsg } from "@core/utils/checkout";
import { removeCurrencySymbol, removeExtraSpace } from "@core/utils/string";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { OrderAfterCheckoutInfo, OrderSummary, Product, ShippingAddress } from "@types";
import { Dev, SbPlbCo108 } from "./opay_smoke_plb_checkout_stripe";

let checkoutPage: SFCheckout;
let orderPage: OrdersPage;
let mailBox: MailBox;
let domain: string;
let shippingAddress: ShippingAddress;
let productCheckout: Array<Product>;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let domainTemplate: string;
let paymentMethod: string;

test.describe("@SB_PLB_CO_108 Checkout PlusBase with Stripe", () => {
  test(`@SB_PLB_CO_108 [Opay_Smoke] Check checkout Plusbase full luồng `, async ({
    page,
    cConf,
    dashboard,
    token,
    conf,
  }) => {
    const suiteConf = conf.suiteConf as Dev;
    const caseConf = cConf as SbPlbCo108;
    domain = suiteConf.domain;
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    productCheckout = caseConf.products_checkout;
    shippingAddress = suiteConf.shipping_address;

    const shopTokenTemplate = await token.getWithCredentials({
      domain: suiteConf.shop_template.shop_name,
      username: suiteConf.shop_template.username,
      password: suiteConf.shop_template.password,
    });

    const accessTokenTemplate = shopTokenTemplate.access_token;
    const expectShippingAdress = removeExtraSpace(
      shippingAddress.first_name +
        " " +
        shippingAddress.last_name +
        " " +
        shippingAddress.address +
        " " +
        shippingAddress.country +
        " " +
        shippingAddress.city +
        " " +
        shippingAddress.zipcode +
        " " +
        shippingAddress.state +
        " " +
        shippingAddress.country_code +
        " " +
        shippingAddress.phone_number.replaceAll("\\s", ""),
    );

    await test.step(`Tại Store front, buyer > add products vào cart > đến Checkout Page`, async () => {
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      const isProductOnOrderSummary = await checkoutPage.isProductsOnOrderSummary(productCheckout);
      expect(isProductOnOrderSummary).toBeTruthy();
    });

    await test.step(`Fill [Shipping address]`, async () => {
      await checkoutPage.enterShippingAddress(shippingAddress);
      const shippingFee = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFee).not.toBe("-");
    });

    await test.step(`Chọn Shipping methods mặc định > Chọn Payment loại [Card] > Fill thông tin Card > Click button [Place Your Order]`, async () => {
      const orderSummaryBeforeCompleteOrder: OrderSummary = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod();
      //verify thank page
      const thankPage = await checkoutPage.isThankyouPage();
      expect(thankPage).toBeTruthy();
      //verify info shipping address
      const ShippingAdressInfo = await checkoutPage.getShippingAddressOnThkPage();
      expect(ShippingAdressInfo).toBe(expectShippingAdress);
      //verify summary info
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrder.subTotal);
      expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrder.totalPrice);
      if (await checkoutPage.btnClosePPCPopup.isVisible()) {
        await checkoutPage.btnClosePPCPopup.click();
      }
    });

    await test.step(`Verify email confirm buyer nhận được`, async () => {
      mailBox = await checkoutPage.openMailBox(shippingAddress.email);
      await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
      //verify total order of email
      const totalOrder = await mailBox.getTotalOrder();
      expect(removeCurrencySymbol(totalOrder)).toBe(orderSummaryInfo.totalSF.toString());
      //verfiy shipping address
      const xpathTextOnShippingAdrSection = await mailBox.genXpathSectionOfCustomerInfo("Shipping address");
      for (const key in shippingAddress) {
        if (key == "email" || key == "phone_number") {
          continue;
        }
        await expect(mailBox.page.locator(xpathTextOnShippingAdrSection)).toContainText(shippingAddress[key]);
      }
    });

    await test.step(`Verrify order details trong dashboard`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      paymentMethod = suiteConf.payment_method;
      //verify shipping address
      const shippingAddressInOrder = await orderPage.getShippingAddressInOrder();
      expect(shippingAddressInOrder.replace(/\s+/g, "")).toBe(expectShippingAdress.replace(/\s+/g, ""));
      //verify order status
      const orderStatus = await orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Authorized");
      //verify order amount
      const subtotalOrder = await orderPage.getSubtotalOrder();
      expect(removeCurrencySymbol(subtotalOrder)).toBe(orderSummaryInfo.subTotal.toFixed(2));
      const totalOrder = await orderPage.getTotalOrder();
      expect(removeCurrencySymbol(totalOrder)).toBe(orderSummaryInfo.totalSF.toString());

      //verify order timeline
      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        shippingAddress.email,
      ).timelineSendEmail;
      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        shippingAddress.email,
      ).timelinePlaceOrd;
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
    });

    await test.step(`Tại link admin > [Orders] > click Order mới được tạo > [More actions] > [Approve order] > Verify order details`, async () => {
      //declare domain shop template
      domainTemplate = conf.suiteConf.shop_template.domain;
      const dashboardPageTemplate = new DashboardPage(page, domainTemplate);
      const orderPageTemplate = new OrdersPage(page, domainTemplate);
      //Approve order on shop template
      await dashboardPageTemplate.loginWithToken(accessTokenTemplate);
      await orderPageTemplate.goToOrderStoreTemplateByOrderId(orderSummaryInfo.orderId);
      await orderPageTemplate.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      //verify payment status
      const paymentStatus = await orderPageTemplate.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
      //verify approve status
      const approveStatus = await orderPageTemplate.getApproveStatus();
      expect(approveStatus).toEqual("Approved");
      //verify order timeline transID
      const orderTimelineTransID = orderPageTemplate.getTimelineTransIDByGW("Stripe");
      await expect(await orderPageTemplate.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });

    await test.step(`Tại shopbase > [Orders detail] > Verify order details`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      //verify payment status
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
      //verify order timeline transID
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });
  });
});
