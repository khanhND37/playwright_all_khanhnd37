import { expect, test } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Checkout Paypal luồng live mode", () => {
  let orderId: number, accessToken, customerInfo, prodInfo;
  let domain: string, paypalAccount;

  let checkout: SFCheckout, orderPage: OrdersPage;

  test("Checkout qua paypal @SB_CHE_PP_59", async ({ conf, token, page }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    domain = conf.suiteConf.domain;
    customerInfo = conf.suiteConf.customer_info;
    paypalAccount = conf.suiteConf.paypal_account;
    prodInfo = conf.suiteConf.product;

    checkout = new SFCheckout(page, domain);
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Paypal", async () => {
      await checkout.addProductToCartThenInputShippingAddress(prodInfo, customerInfo);
      await checkout.continueToPaymentMethod();
      await checkout.selectPaymentMethod("PayPal");
      await checkout.completeOrderViaPPSmartButton(paypalAccount);
      await page.locator("//button[@id='payment-submit-btn']").click();
      await page.waitForSelector(`//h2[contains(text(),'Thank you!')]`);
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Kiểm tra order details tại Dashboard", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual("$0.00");
    });
  });
});
