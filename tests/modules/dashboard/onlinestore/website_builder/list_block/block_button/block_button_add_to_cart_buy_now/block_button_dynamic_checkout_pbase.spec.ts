import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { WbBtnPaypal } from "@pages/dashboard/wb_btn_dynamic_checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { isEqual } from "@core/utils/checkout";
import { SFProduct } from "@pages/storefront/product";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

test.describe("Verify checkout button Dynamic checkout Printbase SB_WEB_BUILDER_PRD_ 85 86 84 ", () => {
  let storefrontPage: SFHome,
    checkout: SFCheckout,
    btnPaypal: WbBtnPaypal,
    orderPage: OrdersPage,
    orderId: number,
    totalOrderSF: string,
    productPBPage: SFProduct;

  test(`@SB_WEB_BUILDER_PRD_85 dynamic_checkout  Checkout thành công với button Buy with Paypal trên Pbase, order không add product PPC`, async ({
    dashboard,
    page,
    conf,
    token,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderPage = new OrdersPage(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal- Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.page.locator(checkout.xpathPaymentLabel).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);

      await expect(checkout.paypalBlockLoc).toBeVisible();
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();

      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Tại popup PPC  - Click No, thanks`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnNoThanksPPC).click();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeHidden();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken, "printbase");
      const orderStatus = await orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Authorized");
      const actualTotalOrder = await orderPage.getTotalOrder();

      const totalSF = Number(totalOrderSF.replace("$", ""));
      const totalOrderDetail = Number(actualTotalOrder.replace("$", ""));
      expect(isEqual(totalSF, totalOrderDetail, 0.01)).toBe(true);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_86 dynamic_checkout Checkout thành công với button Buy with Paypal trên Pbase, order có add product PPC`, async ({
    dashboard,
    page,
    conf,
    token,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderPage = new OrdersPage(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal  - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await scrollUntilElementIsVisible({
        page: checkout.page,
        scrollEle: checkout.page.locator(checkout.xpathDMCAButton),
        viewEle: checkout.page.locator(checkout.xpathPaymentLabel),
      });

      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.page.locator(checkout.xpathPaymentLabel).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);

      await expect(checkout.paypalBlockLoc).toBeVisible();
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Add product PPC vào store`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnAddPPC).click();
      await expect(checkout.submitPaypalBtnLoc).toBeVisible();
    });

    await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
      await checkout.completePaymentForPostPurchaseItem("PayPal");
      await expect(checkout.thankyouPageLoc).toBeVisible();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order  - Kiểm tra order timeline`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken, "printbase");
      const orderStatus = await orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Authorized");
      const actualTotalOrder = await orderPage.getTotalOrder();

      const totalSF = Number(totalOrderSF.replace("$", ""));
      const totalOrderDetail = Number(actualTotalOrder.replace("$", ""));
      expect(isEqual(totalSF, totalOrderDetail, 0.01)).toBe(true);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_84 dynamic_checkout  Checkout thành công với button Buy with Paypal trên Pbase, order có dùng custom option`, async ({
    dashboard,
    page,
    conf,
    token,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderPage = new OrdersPage(page, domain);
    productPBPage = new SFProduct(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Nhập custom option  - Click button Buy with paypal  - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      await productPBPage.inputCustomOptionSF(caseConf.custom_option);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.page.locator(checkout.xpathPaymentLabel).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);

      await expect(checkout.paypalBlockLoc).toBeVisible();
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();

      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken, "printbase");
      const orderStatus = await orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Authorized");
      const actualTotalOrder = await orderPage.getTotalOrder();

      const totalSF = Number(totalOrderSF.replace("$", ""));
      const totalOrderDetail = Number(actualTotalOrder.replace("$", ""));
      expect(isEqual(totalSF, totalOrderDetail, 0.01)).toBe(true);
    });
  });

  test(`@SB_WEB_BUILDER_LB_BB_27 block_buy_now_ Verify click buynow với product có custom option`, async ({
    page,
    conf,
    token,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    orderPage = new OrdersPage(page, domain);
    productPBPage = new SFProduct(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Không nhập custom option - Click btn Buynow`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      await productPBPage.clickOnBtnLinkWithLabel("Buy Now");
      await expect(productPBPage.genLoc(productPBPage.selectorCustomOptionmsg)).toHaveCount(1);
      await expect(productPBPage.genLoc(productPBPage.selectorCustomOptionmsg)).toHaveText(caseConf.message_error);
    });

    await test.step(`- Nhập custom option - Click btn Buynow`, async () => {
      await productPBPage.inputCustomOptionSF(caseConf.custom_option);
      await productPBPage.clickOnBtnLinkWithLabel("Buy Now");
      await checkout.waitForCheckoutPageCompleteRender();
      await checkout.page.waitForSelector(checkout.xpathOrderSummarySection, { timeout: 90000 });

      await expect(checkout.genLoc(checkout.xpathProductCart)).toContainText(caseConf.product_title);
      await expect(checkout.genLoc(checkout.xpathProductCart)).toContainText(caseConf.custom_option.value);
    });

    await test.step(`- Fill shipping address- Click Place your order`, async () => {
      await checkout.enterShippingAddress(customerInfo);

      await scrollUntilElementIsVisible({
        page: checkout.page,
        scrollEle: checkout.page.locator(checkout.xpathBtnPlaceYourOrder),
        viewEle: checkout.page.locator(checkout.xpathBtnPlaceYourOrder),
      });

      const cardInfo = conf.suiteConf.card_info;
      await checkout.inputCardInfo(cardInfo.number, cardInfo.holder_name, cardInfo.expire_date, cardInfo.cvv);
      await checkout.clickBtnCompleteOrder();
      await checkout.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await checkout.page.waitForSelector(checkout.xpathThankYou, { timeout: 50000 });

      await expect(checkout.genLoc(checkout.xpathProductCart)).toContainText(caseConf.product_title);
      await expect(checkout.genLoc(checkout.xpathProductCart)).toContainText(caseConf.custom_option.value);

      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  `, async () => {
      await checkout.openOrderByAPI(orderId, accessToken, "printbase");
      await expect(orderPage.genLoc(".unfulfilled-card-container")).toContainText(caseConf.product_title);
      await expect(orderPage.genLoc(".unfulfilled-card-container")).toContainText(caseConf.custom_option.value);
    });
  });
});
