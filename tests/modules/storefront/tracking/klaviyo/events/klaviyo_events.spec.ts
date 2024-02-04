import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Klaviyo } from "@pages/thirdparty/klaviyo";

test.describe.parallel("Verify tracking data sent to Klaviyo", () => {
  const xpathOrderSF = "//div[@class='os-order-number']";

  test(
    "Check bắn event View product, Add to cart, Started checkout, Placed Order" +
      "và Ordered Product @TS_SB_MAR_SALES_ME_KLV_IMP_TRK_18",
    async ({ page, conf, request }) => {
      const { domain, products } = conf.suiteConf as never;

      const klaviyo = new Klaviyo(page, domain);
      const storefront = new SFHome(page, domain);
      let productPage: SFProduct;
      let checkout: SFCheckout;
      let metricId: string;

      /**
       * @Step
       */
      await test.step(`Open storefront`, async () => {
        await storefront.gotoHomePage();
        await page.locator('button:has-text("Close form")').click();
      });

      await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
        productPage = await storefront.searchThenViewProduct(conf.suiteConf.products[0].product_name);
        await page.locator(`//button[normalize-space()='${conf.suiteConf.products[0].variant_name}']`).click();
        await productPage.addToCart();
        checkout = await productPage.navigateToCheckoutPageInCaseBoostUpsell();
      });

      await test.step("Input customer information", async () => {
        await checkout.inputEmail(conf.suiteConf.profile.email);
        await checkout.inputFirstName(conf.suiteConf.profile.first_name);
        await checkout.inputLastName(conf.suiteConf.profile.last_name);
        await checkout.inputAddress(conf.suiteConf.profile.address1);
        await checkout.selectCountry(conf.suiteConf.profile.country);
        await checkout.inputCity(conf.suiteConf.profile.city);
        await checkout.inputZipcode(conf.suiteConf.profile.zip);
        await checkout.inputPhoneNumber(conf.suiteConf.profile.phone_number);
        await checkout.clickBtnContinueToShippingMethod();
      });

      const email = conf.suiteConf.profile.email;
      const apiKey = conf.suiteConf.private_api_key;
      metricId = conf.suiteConf.metric_id.viewed_product;

      await test.step("Verify event Viewed Product is sent to Klaviyo @TC_SB_SET_SC_KLA_30", async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventViewedProduct(conditions)).toBe(true);
      });

      metricId = conf.suiteConf.metric_id.added_to_cart;
      await test.step("Verify event Added to Cart is sent to Klaviyo @TC_SB_SET_SC_KLA_30", async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventAddedToCart(conditions)).toBe(true);
      });

      metricId = conf.suiteConf.metric_id.started_checkout;
      await test.step("Verify event Started checkout is sent to Klaviyo @TC_SB_SET_SC_KLA_30", async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventStartedCheckout(conditions)).toBe(true);
      });

      await test.step("Select shipping method then verify shipping rate", async () => {
        await checkout.continueToPaymentMethod();
      });

      await test.step("Input payment information", async () => {
        await page
          .frameLocator("//div[@id='stripe-card-number']//iframe")
          .locator('[placeholder="Card number"]')
          .fill(conf.suiteConf.card_info.number);
        await page.locator('[placeholder="Cardholder name"]').fill(conf.suiteConf.card_info.holder_name);
        await page
          .frameLocator("//div[@id='stripe-card-expiry']//iframe")
          .locator('[placeholder="MM\\/YY"]')
          .fill(conf.suiteConf.card_info.expire_date);
        await page
          .frameLocator("//div[@id='stripe-card-cvc']//iframe")
          .locator('[placeholder="CVV"]')
          .fill(conf.suiteConf.card_info.cvv);
      });

      await test.step("Complete order", async () => {
        await page.locator(`//button[normalize-space()='Complete order']`).click();
      });

      metricId = conf.suiteConf.metric_id.ordered_product;
      await test.step("Verify event Ordered Product is sent to Klaviyo @TC_SB_SET_SC_KLA_29", async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventOrderedProduct(conditions)).toBe(true);
      });

      metricId = conf.suiteConf.metric_id.placed_order;
      await test.step("Verify event Placed Order is sent to Klaviyo @TC_SB_SET_SC_KLA_29", async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventPlacedOrder(conditions)).toBe(true);
      });
    },
  );

  test("Check bắn event Fulfilled Order @TS_SB_MAR_SALES_ME_KLV_IMP_TRK_18", async ({ dashboard, conf, request }) => {
    const { domain, products } = conf.suiteConf as never;

    const email = conf.suiteConf.profile.email;
    const apiKey = conf.suiteConf.private_api_key;

    const klaviyo = new Klaviyo(dashboard, domain);
    const storefront = new SFHome(dashboard, domain);
    let productPage: SFProduct;
    let checkout: SFCheckout;
    let orderName: string;

    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });

    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.suiteConf.products[0].product_name);
      await dashboard.locator(`//button[normalize-space()='${conf.suiteConf.products[0].variant_name}']`).click();
      await productPage.addToCart();
      checkout = await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });

    await test.step("Input customer information", async () => {
      await checkout.inputEmail(conf.suiteConf.profile.email);
      await checkout.inputFirstName(conf.suiteConf.profile.first_name);
      await checkout.inputLastName(conf.suiteConf.profile.last_name);
      await checkout.inputAddress(conf.suiteConf.profile.address1);
      await checkout.selectCountry(conf.suiteConf.profile.country);
      await checkout.inputCity(conf.suiteConf.profile.city);
      await checkout.inputZipcode(conf.suiteConf.profile.zip);
      await checkout.inputPhoneNumber(conf.suiteConf.profile.phone_number);
      await checkout.clickBtnContinueToShippingMethod();
    });

    await test.step("Select shipping method then verify shipping rate", async () => {
      await checkout.continueToPaymentMethod();
    });

    await test.step("Input payment information", async () => {
      await dashboard
        .frameLocator("//div[@id='stripe-card-number']//iframe")
        .locator('[placeholder="Card number"]')
        .fill(conf.suiteConf.card_info.number);
      await dashboard.locator('[placeholder="Cardholder name"]').fill(conf.suiteConf.card_info.holder_name);
      await dashboard
        .frameLocator("//div[@id='stripe-card-expiry']//iframe")
        .locator('[placeholder="MM\\/YY"]')
        .fill(conf.suiteConf.card_info.expire_date);
      await dashboard
        .frameLocator("//div[@id='stripe-card-cvc']//iframe")
        .locator('[placeholder="CVV"]')
        .fill(conf.suiteConf.card_info.cvv);
    });

    await test.step("Complete order", async () => {
      await dashboard.locator(`//button[normalize-space()='Complete order']`).click();
      orderName = (await dashboard.locator(xpathOrderSF).textContent()).trim().replace("Order ", "");
    });

    await test.step(`Chọn menu Orders`, async () => {
      await dashboard.goto(`https://` + domain + `/admin/orders`);
    });

    await test.step(`Chọn order vừa được tạo`, async () => {
      await dashboard.locator(`(//*[contains(text(), '${orderName}')])[1]`).click();
    });

    await test.step(`Chọn Mark as fulfilled và xác nhận`, async () => {
      await dashboard.locator("text=Mark as fulfilled").click();
      await Promise.all([dashboard.waitForNavigation(), dashboard.locator('button:has-text("Fulfill items")').click()]);
    });

    const metricId = conf.suiteConf.metric_id.fulfilled_order;
    await test.step(
      `Kiểm tra event Fulfilled Order gửi Variant data` + `thay vì Product data trên Klaviyo @TC_SB_SET_SC_KLA_30`,
      async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventFulfilledOrder(conditions)).toBe(true);
      },
    );
  });

  test("Check bắn event Refunded Order, Canceled Order @TS_SB_MAR_SALES_ME_KLV_IMP_TRK_18", async ({
    dashboard,
    conf,
    request,
  }) => {
    const { domain, products } = conf.suiteConf as never;

    const email = conf.suiteConf.profile.email;
    const apiKey = conf.suiteConf.private_api_key;

    const klaviyo = new Klaviyo(dashboard, domain);
    const storefront = new SFHome(dashboard, domain);
    let productPage: SFProduct;
    let checkout: SFCheckout;
    let orderName: string;
    let metricId: string;

    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });

    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.suiteConf.products[0].product_name);
      await dashboard.locator(`//button[normalize-space()='${conf.suiteConf.products[0].variant_name}']`).click();
      await productPage.addToCart();
      checkout = await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });

    await test.step("Input customer information", async () => {
      await checkout.inputEmail(conf.suiteConf.profile.email);
      await checkout.inputFirstName(conf.suiteConf.profile.first_name);
      await checkout.inputLastName(conf.suiteConf.profile.last_name);
      await checkout.inputAddress(conf.suiteConf.profile.address1);
      await checkout.selectCountry(conf.suiteConf.profile.country);
      await checkout.inputCity(conf.suiteConf.profile.city);
      await checkout.inputZipcode(conf.suiteConf.profile.zip);
      await checkout.inputPhoneNumber(conf.suiteConf.profile.phone_number);
      await checkout.clickBtnContinueToShippingMethod();
    });

    await test.step("Select shipping method then verify shipping rate", async () => {
      await checkout.continueToPaymentMethod();
    });

    await test.step("Input payment information", async () => {
      await dashboard
        .frameLocator("//div[@id='stripe-card-number']//iframe")
        .locator('[placeholder="Card number"]')
        .fill(conf.suiteConf.card_info.number);
      await dashboard.locator('[placeholder="Cardholder name"]').fill(conf.suiteConf.card_info.holder_name);
      await dashboard
        .frameLocator("//div[@id='stripe-card-expiry']//iframe")
        .locator('[placeholder="MM\\/YY"]')
        .fill(conf.suiteConf.card_info.expire_date);
      await dashboard
        .frameLocator("//div[@id='stripe-card-cvc']//iframe")
        .locator('[placeholder="CVV"]')
        .fill(conf.suiteConf.card_info.cvv);
    });

    await test.step("Complete order", async () => {
      await dashboard.locator(`//button[normalize-space()='Complete order']`).click();
      orderName = (await dashboard.locator(xpathOrderSF).textContent()).trim().replace("Order ", "");
    });

    await test.step(`Chọn menu Orders`, async () => {
      await dashboard.goto(`https://` + domain + `/admin/orders`);
    });

    await test.step(`Chọn order vừa được tạo`, async () => {
      await dashboard.locator(`(//*[contains(text(), '${orderName}')])[1]`).click();
    });

    await test.step(`Chọn Cancel Order trong order details và xác nhận`, async () => {
      await dashboard.locator(`//button[normalize-space()='More actions']`).click();
      await dashboard.locator(`(//span[normalize-space()='Cancel order'])[1]`).click();
      await dashboard.locator(`//button[normalize-space()='Cancel order']`).click();
    });

    metricId = conf.suiteConf.metric_id.refunded_order;
    await test.step(
      `Kiểm tra event Refunded Order gửi Variant data` + `thay vì Product data trên Klaviyo @TC_SET_SC_KLA_26`,
      async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventRefundedOrder(conditions)).toBe(true);
      },
    );

    metricId = conf.suiteConf.metric_id.canceled_order;
    await test.step(
      `Kiểm tra event Canceled Order gửi Variant data` + `thay vì Product data trên Klaviyo @TC_SET_SC_KLA_27`,
      async () => {
        const conditions = {
          domain: domain,
          email: email,
          metricId: metricId,
          apiKey: apiKey,
          products: products,
          request: request,
        };
        expect(await klaviyo.verifyEventCanceledOrder(conditions)).toBe(true);
      },
    );
  });
});
