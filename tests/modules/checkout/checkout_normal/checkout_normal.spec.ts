import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeExtraSpace } from "@core/utils/string";
import { SettingThemeAPI } from "@pages/api/themes_setting";

test.describe("Checkout normal @SB_CHE_CHEN_1", () => {
  let email, domain, shippingAddress, productCheckout, shopToken;
  let checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout;
  let themeSetting: SettingThemeAPI;

  test.beforeEach(async ({ page, conf, authRequest, token, theme }) => {
    domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkout = new SFCheckout(page, domain);
    themeSetting = new SettingThemeAPI(theme);
    shopToken = await token.getWithCredentials({
      domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });

    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    productCheckout = conf.caseConf.products_checkout;
    await themeSetting.editCheckoutLayout("one-page");
  });

  test(`Kiểm tra checkbox "Accepts email marketing" hoạt động bình thường @SB_CHE_CHEN_1`, async ({
    page,
    conf,
    dashboard,
  }) => {
    const shippingAddress1 = conf.caseConf.shipping_address;

    await test.step(`
      - Tại Dashboard > Setting Theme > Checkout:
        Tại block "Email marketing" tick chọn "Show a sign-up option at checkout", Không chọn pre-select
      - Tại SF: Add product "T-shirt" vào giỏ hàng > điền shipping address hợp lệ.
      - Checkout tích chọn "Keep me up to date on news and exclusive"`, async () => {
      await themeSetting.editCheckoutLayout("multi-step");

      await themeSetting.editCheckoutLegal({
        marketingConsent: {
          emailMkt: {
            showCheckbox: true,
            preCheck: false,
          },
        },
      });

      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      // Expected: - Ban đầu default không tick chọn "Keep me up to date on news and exclusive"
      const xpathCheckBoxAcceptEmailMkt = "//div/label[@id='accept-marketing']/span[@class='s-check']";
      expect(await page.locator(xpathCheckBoxAcceptEmailMkt).isChecked()).toBe(false);
      await page.locator(xpathCheckBoxAcceptEmailMkt).click();
      expect(await page.locator(xpathCheckBoxAcceptEmailMkt).isChecked()).toBe(true);
      await checkout.enterShippingAddress(shippingAddress1);

      // Expected: - API "customer-and-shipping.json" trả về "buyer_accepts_marketing" = true
      const customerInfo = await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      expect(customerInfo.buyer_accepts_marketing).toBe(true);
    });

    await test.step(`Tại phần payment, chọn "Card" > Điền thông tin thẻ > click 'Place your order'`, async () => {
      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
    });

    await test.step(`Tại Dashboard > Customers > Chọn "ShopBase Auto"`, async () => {
      await dashboard.goto(`https://${domain}/admin/customers`);
      await dashboard.waitForSelector("//div[@class='digital-member--list__container']");
      await dashboard
        .locator(`(//div[contains(text(),'${shippingAddress.first_name} ${shippingAddress.last_name}')])[1]`)
        .click();
      await dashboard.waitForSelector(
        `//div[normalize-space('${shippingAddress.first_name} ${shippingAddress.last_name}')]`,
      );

      // Expected: Hiển thị "Accepts email marketing" tại phần contact
      await expect(dashboard.locator(`//p[contains(text(),'Accepts email marketing')]`)).toBeVisible();
      await expect(dashboard.locator(`//p[contains(text(),'Does not accept email marketing')]`)).toBeHidden();
    });
  });

  test(`Checkout với billing address khác shipping address @SB_CHE_CHEN_3`, async ({ page, conf }) => {
    const shippingAddress = conf.suiteConf.shipping_address;
    const billingAddress = conf.caseConf.billing_address;

    const expBillingAddress = removeExtraSpace(
      billingAddress.first_name +
        " " +
        billingAddress.last_name +
        " " +
        billingAddress.address +
        " " +
        billingAddress.city +
        " " +
        billingAddress.country,
    );

    const expShippingAddress = removeExtraSpace(
      shippingAddress.first_name +
        " " +
        shippingAddress.last_name +
        " " +
        shippingAddress.company +
        " " +
        shippingAddress.address1 +
        " " +
        shippingAddress.city +
        " " +
        shippingAddress.zip +
        " " +
        shippingAddress.province +
        " " +
        shippingAddress.country +
        " " +
        shippingAddress.phone.replaceAll("\\s", ""),
    );

    await test.step(`
      - Trên storefront -> Add product to cart-> Checkout
      - Tại màn checkout nhập thông tin checkout`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();

      const checkoutInfo = await checkoutAPI.getCheckoutInfo();
      expect(checkoutInfo.info.shipping_address).not.toBeNull();
      expect(checkoutInfo.info.billing_address).toBeFalsy();
    });

    await test.step(`Tại phần "Billing address", chọn "Use a different Billing address`, async () => {
      await checkout.clickRadioButtonWithLabel("Use a different billing address");
      // will throw error after wait 0.7s
      await page.waitForSelector("//div[contains(@class,'secondary content-box')]", { timeout: 700 });
    });

    await test.step(`- Tại màn checkout nhập thông tin Billing address vào form
    - Tại phần payment, chọn "Card" -> Điền thông tin thẻ => click 'Place your order'`, async () => {
      await checkout.enterBillingAddress(billingAddress);
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
      const actShippingAddress = removeExtraSpace(
        await checkout.getTextContent(
          "//*[normalize-space()='Shipping address']/following-sibling::address[@class='address']",
        ),
      );
      const actBillingAddress = removeExtraSpace(
        await checkout.getTextContent(
          "//*[normalize-space()='Billing address']/following-sibling::address[@class='address']",
        ),
      );
      expect(actShippingAddress).toBe(expShippingAddress);
      expect(actBillingAddress).toBe(expBillingAddress);
    });

    await test.step(`Login dashboard > Orders > Chọn view detail order vừa được tạo`, async () => {
      const checkoutInfo = await checkoutAPI.getCheckoutInfo();
      const orderPage = await checkout.openOrderByAPI(checkoutInfo.order.id, shopToken.access_token);
      const actShippingAddress = await orderPage.getTextContent(
        "(//div[@class='type-container']//div[@class='s-flex--fill'])[2]",
      );
      const actBillingAddress = await orderPage.getTextContent(
        "//div[descendant::*[text()='Billing address'] and @class='s-flex']/following-sibling::div",
      );
      expect(actShippingAddress.replace(/\s+/g, "")).toBe(expShippingAddress.replace(/\s+/g, ""));
      expect(actBillingAddress.replace(/\s+/g, "")).toBe(expBillingAddress.replace(/\s+/g, ""));
    });
  });

  test(`Check checkout với order có total = 0 @SB_CHE_CHEN_8`, async ({ page, conf }) => {
    let totalOrderOnSF, totalOrder;

    await test.step(`Checkout với order có total = 0 (chọn shipping method "Free shipping")`, async () => {
      await themeSetting.editCheckoutLayout("multi-step");
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();

      // Expected: Không show payment method, Checkout thành công, show Thankyou page
      await expect(
        page.locator(`//div[@class='section' and descendant::span[normalize-space()='Payment']]`),
      ).toBeHidden();
      await page.locator(`//button[normalize-space()='Complete order']`).click();
      expect(await checkout.isThankyouPage()).toBe(true);
      totalOrderOnSF = await checkout.getTotalOnOrderSummary();
      expect(totalOrderOnSF).toBe("$0.00");
    });

    await test.step(`Vào dashboard, check order detail`, async () => {
      const checkoutInfo = await checkoutAPI.getCheckoutInfo();
      const orderPage = await checkout.openOrderByAPI(checkoutInfo.order.id, shopToken.access_token);
      totalOrder = await orderPage.getTotalOrder();
      const orderStatus = await orderPage.getOrderStatus();
      const reloadTime = conf.suiteConf.reload_time;

      // Expected:
      // - Total order = 0
      // - Order status = paid
      expect(totalOrder).toBe(totalOrderOnSF);
      await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
    });
  });
});
