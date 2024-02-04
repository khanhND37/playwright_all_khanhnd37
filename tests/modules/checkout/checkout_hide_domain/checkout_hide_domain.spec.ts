import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { loadData } from "@core/conf/conf";
import { SettingPaymentAPI } from "@pages/api/setting_payment";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { DomainAPI } from "@pages/api/domain";

test.describe("Kiểm tra order detail trong dashboard khi checkout với stripe, Setting checkout 3 pages", () => {
  const caseName = "SB_SB_SF_HD";
  const conf = loadData(__dirname, caseName);
  let gatewaySPDomain: string;
  test.beforeAll(async ({ conf, authRequest }) => {
    const domain = conf.suiteConf.domain;
    const shopID = conf.suiteConf.shop_id;
    const settingPaymentAPI = new SettingPaymentAPI(domain, authRequest);
    const listDomain = await settingPaymentAPI.getCardShieldInfo(shopID);
    const proxyDomainID = listDomain[0].shop_domain_id;

    const domainPage = new DomainAPI(domain, authRequest);
    const shopDomain = await domainPage.getProxyDomain(shopID);
    const domainID = shopDomain.domain_id;

    if (proxyDomainID == domainID) {
      gatewaySPDomain = shopDomain.domain_name;
    }
  });
  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      payment_method: paymentMethod,
      payment_gateway: paymentGateway,
      case_id: caseID,
      email,
      shipping_address: shippingAddress,
    }) => {
      test(`
      [Checkout] Kiểm tra thay đổi domain khi checkout qua cổng
      Paypal standard, Paypal smart button, EU payment @${caseID}`, async ({ page, conf, request }) => {
        let checkout: SFCheckout;

        const domain = conf.suiteConf.domain;
        const theme = conf.suiteConf.theme;
        const countryCode = shippingAddress.country_code;
        const countryName = shippingAddress.country_name;
        const paypalAccount = conf.suiteConf.paypal_account;
        const cardInfo = conf.suiteConf.card_info;
        const productInfo = conf.suiteConf.product;
        const homepage = new SFHome(page, domain);

        await test.step(`
          Lên storefront của shop
          Checkout sản phẩm
          Nhập các thông tin trong trang:
          + Customer information
          + Shipping
          + Chọn Payment method
          Bật F12
          Network
          Tìm đến API payment-method.json
          Vào mục Preview
          Tìm đến mục provider option của cổng
          Verify proxy domain
          `, async () => {
          await homepage.gotoHomePage();
          await homepage.selectStorefrontCurrencyV2(countryName, theme);

          const checkoutAPI = new CheckoutAPI(domain, request, page);

          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          await checkoutAPI.updateCustomerInformation(email, shippingAddress);
          await checkoutAPI.selectDefaultShippingMethod(countryCode);
          const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain(paymentMethod, countryCode);
          expect(cardShieldDomain).toContain(gatewaySPDomain);

          await checkoutAPI.openCheckoutPageByToken();
        });

        await test.step("Chọn payment method và complete order", async () => {
          checkout = new SFCheckout(page, domain);
          await checkout.selectPaymentMethod(paymentMethod);
          switch (paymentGateway) {
            case "Paypal Standard":
              await checkout.completeOrderViaPayPal(paypalAccount);
              break;
            case "Paypal Smart Button":
              await checkout.completeOrderViaPPSmartButton(paypalAccount);
              break;
            default:
              await checkout.completeOrderWithMethod(paymentMethod, cardInfo);
          }
          await expect(checkout.thankyouPageLoc).toBeVisible();
        });
      });
    },
  );
});

test.describe(`Kiểm tra thay đổi proxy domain khi checkout qua Paypal express và Buy with paypal`, () => {
  let gatewaySPDomain: string;
  test.beforeAll(async ({ conf, authRequest }) => {
    const domain = conf.suiteConf.domain;
    const shopID = conf.suiteConf.shop_id;
    const settingPaymentAPI = new SettingPaymentAPI(domain, authRequest);
    const listDomain = await settingPaymentAPI.getCardShieldInfo(shopID);
    const proxyDomainID = listDomain[0].shop_domain_id;

    const domainPage = new DomainAPI(domain, authRequest);
    const shopDomain = await domainPage.getProxyDomain(shopID);
    const domainID = shopDomain.domain_id;

    if (proxyDomainID == domainID) {
      gatewaySPDomain = shopDomain.domain_name;
    }
  });
  test(`[Checkout] Kiểm tra thay đổi domain khi checkout qua cổng Paypal express @SB_SB_SF_HD_14`, async ({
    page,
    conf,
    request,
  }) => {
    // prepair data for
    const domain = conf.suiteConf.domain;

    const homepage = new SFHome(page, domain);
    let checkout: SFCheckout;
    let productPage: SFProduct;

    const paypalAccount = conf.suiteConf.paypal_account;
    const customerInfo = conf.caseConf.customer_info;
    const productName = conf.caseConf.product_name;
    const paymentMethod = conf.caseConf.payment_method;

    await test.step(`
    Lên storefront của shop
    Checkout sản phẩm
    Nhập các thông tin trong trang:
    + Customer information
    + Shipping
    + Chọn Payment method
    Bật F12
    Network
    Tìm đến API payment-method.json
    Vào mục Preview
    Tìm đến mục provider option của cổng
    Verify proxy domain`, async () => {
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(productName);
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();
      await checkout.completeOrderViaPPExpress(paypalAccount);
      await checkout.inputPhoneNumber(customerInfo.phone_number);

      const checkoutAPI = new CheckoutAPI(domain, request, page);
      const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain(paymentMethod);
      expect(cardShieldDomain).toContain(gatewaySPDomain);
    });

    await test.step("Chọn payment method và complete order", async () => {
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.clickBtnCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });
  });

  test(`[Checkout] Kiểm tra thay đổi domain khi checkout qua Buy with paypal @SB_SB_SF_HD_15`, async ({
    page,
    conf,
    request,
  }) => {
    // prepair data for
    const domain = conf.suiteConf.domain;

    const homepage = new SFHome(page, domain);
    const checkoutAPI = new CheckoutAPI(domain, request, page);
    const checkout = new SFCheckout(page, domain);

    const customerInfo = conf.caseConf.customer_info;
    const productName = conf.caseConf.product_name;
    const paymentMethod = conf.caseConf.payment_method;

    await test.step(`
    Lên storefront của shop
    Checkout sản phẩm
    Nhập các thông tin trong trang:
    + Customer information
    + Shipping
    + Chọn Payment method
    Bật F12
    Network
    Tìm đến API payment-method.json
    Vào mục Preview
    Tìm đến mục provider option của cổng
    Verify proxy domain`, async () => {
      await homepage.gotoHomePage();
      await homepage.searchThenViewProduct(productName);
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain(paymentMethod);
      expect(cardShieldDomain).toContain(gatewaySPDomain);
    });

    await test.step("Chọn payment method và complete order", async () => {
      await checkout.selectPaymentMethod(paymentMethod);
      await checkout.clickBtnCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });
  });

  test(`@SB_SB_SF_HD_26 [Checkout] Kiểm tra thay đổi domain khi checkout qua cổng Stripe`, async ({
    page,
    conf,
    request,
  }) => {
    // prepair data for
    const domain = conf.suiteConf.domain;
    const productInfo = conf.suiteConf.product;
    const paymentMethod = conf.caseConf.payment_method;
    const shippingAddress = conf.caseConf.shipping_address;

    const checkout = new SFCheckout(page, domain);

    await test.step(`
    Lên storefront của shop
    Checkout sản phẩm: Shirt
    Nhập các thông tin trong trang:   
    + Customer information  
    + Shipping  
    + Chọn Payment method
    Bật F12
    Network
    Tìm đến API payment-method.json
    Vào mục Preview
    Tìm đến mục provider option của cổng Credit card
    Verify proxy domain
    `, async () => {
      await checkout.addProductToCartThenInputShippingAddress(productInfo, shippingAddress);
      const checkoutAPI = new CheckoutAPI(domain, request, page);
      const cardShieldDomain = await checkoutAPI.getPaymentProxyDomain(paymentMethod);
      const isExistIframe = await checkout.isElementExisted(`//iframe[contains(@src, '${cardShieldDomain}')]`);
      expect(isExistIframe).toBe(true);
    });

    await test.step(`Click Place order`, async () => {
      await checkout.completeOrderWithMethod("Stripe");
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });
  });
});
