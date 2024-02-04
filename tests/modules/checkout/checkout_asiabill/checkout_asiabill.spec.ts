import { CheckoutAPI } from "@pages/api/checkout";
import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { OrdersPage } from "@pages/dashboard/orders";
import { buildOrderTimelineMsg } from "@core/utils/checkout";
import { PaymentGateway } from "@constants/order";

test.describe("Buyer should be able checkout with the payment method asiabill", () => {
  let customerInfo, email, domain, cardInfo, title, code, layout, productCheckout, reloadTime, timelineName;
  let themeSetting: SettingThemeAPI;
  let checkout: SFCheckout;

  test.beforeEach(async ({ conf, theme, page, authRequest }) => {
    customerInfo = conf.suiteConf.shipping_address;
    email = conf.suiteConf.email;
    domain = conf.suiteConf.domain;
    cardInfo = conf.suiteConf.card_info;
    title = conf.suiteConf.payment_provider.title;
    code = conf.suiteConf.payment_provider.code;
    timelineName = conf.suiteConf.payment_provider.timeline_name;
    reloadTime = conf.suiteConf.reload_time ?? 5;
    productCheckout = conf.caseConf.product;
    layout = conf.caseConf.layout ?? "one-page";

    themeSetting = new SettingThemeAPI(theme);
    checkout = new SFCheckout(page, domain);

    await test.step("Buyer checkout sản phẩm với payment method AsiaBill", async () => {
      const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      await themeSetting.editCheckoutLayout(layout);
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(email, customerInfo);
      await checkoutAPI.selectDefaultShippingMethod(customerInfo.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      //- Redirect sang sandbox Asiabill và thực hiện checkout thành công với cổng asiabill
      await expect(page.locator(`//div[@id='${code}-integrated-hosted-credit-card-header']`)).toBeVisible();
      await expect(page.locator(`//img[@alt='${title}']`)).toBeVisible();
      await checkout.completeOrderWithMethod("Asiabill", cardInfo);
      await checkout.page.waitForSelector(checkout.xpathThankYou);
    });
  });

  test("Buyer checkout 1 page với payment method AsiaBill @SB_CHE_ASB_6", async ({ page, conf, authRequest }) => {
    const { first_name: firstName, last_name: lastName } = conf.suiteConf.shipping_address as never;
    const checkout = new SFCheckout(page, conf.suiteConf.domain);

    await test.step("Buyer checkout sản phẩm với payment method AsiaBill", async () => {
      const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
      await themeSetting.editCheckoutLayout("one-page");
      await checkoutAPI.addProductToCartThenCheckout(conf.caseConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      await expect(page.locator(`//div[@id='asia-bill-integrated-hosted-credit-card-header']`)).toBeVisible();
      await expect(page.locator(`//img[@alt='AsiaBill']`)).toBeVisible();
    });

    await test.step("Buyer complete order", async () => {
      await checkout.completeOrderWithMethod("Asiabill", conf.suiteConf.card_info);
      totalSF = removeCurrencySymbol(await page.innerText("//span[@class='payment-due__price']"));
      // - Thank you page hiển thị payment: AsiaBill
      await expect(
        page.locator(`//h3[contains(text(),'Payment')]/following-sibling::ul/descendant::span`),
      ).toContainText("AsiaBill");
    });

    await test.step("Merchant view order detail", async () => {
      orderId = await checkout.getOrderIdBySDK();
      await checkout.openOrderByAPI(orderId, accessToken);
      //- Order ở trạng thái Paid, thông tin order chính xác
      //- Paid by customer hiển thị total order
      //- Hiển thị đúng timeline
      await expect(page.locator(`//span[contains(text(),'Paid')]`)).toBeVisible();
      await expect(page.locator(`//td[contains(text(),'Paid by customer')]/following-sibling::td`)).toContainText(
        totalSF,
      );
      await expect(
        page.locator(
          `//div[contains(text(),'A $${totalSF} USD payment was processed via Asia-Bill` +
            ` ${conf.suiteConf.account_name}')]`,
        ),
      ).toBeVisible();
      await expect(page.locator(`//div[contains(text(),'The transaction ID is')]`)).toBeVisible();
      await expect(
        page.locator(`//div[contains(text(),'${firstName} ${lastName} placed this order on Online Store')]`),
      ).toBeVisible();
      await expect(
        page.locator(
          `//div[contains(text(),'Order confirmation email was sent` +
            ` to ${firstName} ${lastName} (${conf.suiteConf.email})')]`,
        ),
      ).toBeVisible();
    });
  });

  test("Checkout thành công với order có items được add từ post-purchase @SB_CHE_ASB_7", async ({ dashboard }) => {
    const orderPage = new OrdersPage(dashboard, domain);

    await test.step("Buyer add post purchase", async () => {
      await checkout.page.waitForSelector(`//div[contains(@class,'upsell-relative upsell-w-100 upsell-h')]`);
      await checkout.addPostPurchase();
      await checkout.completePaymentForPostPurchaseItem("Asiabill");
      await checkout.page.waitForSelector(checkout.xpathThankYou);
      // - Thank you page hiển thị payment: AsiaBill
      await expect(
        checkout.page.locator(`//h3[contains(text(),'Payment')]/following-sibling::ul/descendant::span`),
      ).toContainText(title);
    });

    await test.step("Merchant view order detail", async () => {
      const totalSF = await checkout.getTotalOnOrderSummary();
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      let orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);

      //- Order ở trạng thái Paid, thông tin order chính xác
      //- Paid by customer hiển thị total order
      //- Hiển thị đúng timeline
      expect(orderStatus).toEqual("Paid");

      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalSF);

      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(actualPaidByCustomer).toEqual(totalSF);

      // temporarily skip check timeline on dev env
      // need to check again when dev env is stable
      if (process.env.ENV == "dev") {
        return;
      }

      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        email,
      ).timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        email,
      ).timelinePlaceOrd;
      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();

      expect(await orderPage.page.locator(`//div[contains(text(),'The transaction ID is')]`).count()).toEqual(2);
      expect(
        await orderPage.page.locator(`//div[contains(text(),'payment was processed via ${timelineName}')]`).count(),
      ).toEqual(2);
    });
  });
});

test.describe("Checkout 3 steps Asiabill", () => {
  test("Buyer checkout 3 page với payment method AsiaBill @TC_SB_SET_PMS_ASIA_1", async ({
    page,
    conf,
    authRequest,
    theme,
    dashboard,
  }) => {
    const customerInfo = conf.suiteConf.shipping_address;
    const email = conf.suiteConf.email;
    const domain = conf.suiteConf.domain;
    const productCheckout = conf.caseConf.product;
    const customerEmail = conf.suiteConf.email;
    const cardInfo = conf.suiteConf.card_info;
    const themeSetting = new SettingThemeAPI(theme);
    const orderPage = new OrdersPage(dashboard, domain);
    const checkout = new SFCheckout(page, domain);
    const reloadTime = conf.suiteConf.reload_time;

    await test.step("Buyer checkout sản phẩm với payment method AsiaBill", async () => {
      const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
      await themeSetting.editCheckoutLayout("multi-step");
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(email, customerInfo);
      await checkoutAPI.selectDefaultShippingMethod(customerInfo.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      await expect(page.locator(checkout.xpathAsiaBillMethod)).toBeVisible();
      await expect(page.locator(checkout.xpathAsiaBillImg)).toBeVisible();
    });

    await test.step("Buyer complete order", async () => {
      await checkout.completeOrderWithMethod("Asiabill", cardInfo);
      await checkout.page.waitForSelector(checkout.xpathThankYou);
    });

    await test.step("Merchant view order detail", async () => {
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      const orderStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");

      const totalSF = await checkout.getTotalOnOrderSummary();
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalSF);

      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        customerEmail,
      ).timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        customerEmail,
      ).timelinePlaceOrd;
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(PaymentGateway.asiabill);

      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
    });
  });
});
