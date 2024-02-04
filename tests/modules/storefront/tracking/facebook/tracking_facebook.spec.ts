import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { ProductAPI } from "@pages/api/product";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Facebook } from "@pages/thirdparty/facebook";
import { loadData } from "@core/conf/conf";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import { ForceShareTheme } from "@pages/dashboard/force_copy_theme";

const confLoad = loadData(__dirname, "TRACKING_FACE");

interface TrackingEvent {
  fbEvent: Facebook;
  type: string;
  eventName: string;
  shopName: string;
  shopId: number;
  keyValueEvent: string[];
  expectValueEvent: string[];
}

const verifyTrackingEvent = async (trackingValue: TrackingEvent) => {
  const { fbEvent, type, eventName, shopName, shopId, keyValueEvent, expectValueEvent } = trackingValue;
  for (let i = 0; i < keyValueEvent.length; i++) {
    const actualValueEvent = await fbEvent.getValueTrackingEventByKey(type, eventName, keyValueEvent[i]);
    if (keyValueEvent[i] === "shop_name") {
      expect(actualValueEvent).toEqual(shopName.toString());
    } else if (keyValueEvent[i] === "shop_id") {
      expect(actualValueEvent).toEqual(shopId.toString());
    } else {
      expect(actualValueEvent).toEqual(expectValueEvent[i]);
    }
  }
};
test.describe("Tracking events to Facebook", () => {
  let fbEvent: Facebook;
  let shopName: string;
  let shopId: number;
  let preferences: PreferencesAPI;
  let themes: ForceShareTheme;

  test.beforeEach(async ({ conf, authRequest, theme, dashboard }, testInfo) => {
    testInfo.setTimeout(conf.suiteConf.timeout);
    shopId = conf.suiteConf.shop_id;
    shopName = conf.suiteConf.shop_name;
    preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    await test.step("Create product", async () => {
      const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      await productAPI.createNewProduct(conf.suiteConf.product);
    });
    await test.step("Setting theme", async () => {
      if (conf.suiteConf.them_default) {
        await theme.publish(conf.suiteConf.them_default);
      } else {
        const res = await theme.create(3);
        await theme.publish(res.id);
      }
      themes = new ForceShareTheme(dashboard, conf.suiteConf.domain);
      await themes.navigateToMenu("Settings");
      await themes.navigateToMenu("Online Store");
      if (await themes.checkButtonVisible("Disable multiple storefronts")) {
        await dashboard.getByRole("button", { name: "Disable multiple storefronts", exact: true }).click();
        await themes.clickOnBtnWithLabel("Confirm");
        await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
      }
      await themes.removeAllThemes();
    });
  });
  test.afterEach(async ({ conf }) => {
    await preferences.settingFacebook(
      conf.suiteConf.facebook_conversions_off,
      conf.suiteConf.pixelId,
      conf.suiteConf.shop_id,
    );
  });

  confLoad.caseConf.data.forEach(testCase => {
    test(`${testCase.title} @${testCase.case_id}`, async ({ page, conf, dashboard }) => {
      fbEvent = new Facebook(page, conf.suiteConf.domain);
      const store = new SFHome(page, conf.suiteConf.domain);
      const product = new SFProduct(page, conf.suiteConf.domain);
      const checkOut = new SFCheckout(page, conf.suiteConf.domain);
      const cart = new SFCart(page, conf.suiteConf.domain);

      await test.step("Setting checkout", async () => {
        await preferences.settingFacebook(testCase.facebook_conversions, testCase.pixelId, conf.suiteConf.shop_id);
        const themeSF = new ThemeDashboard(dashboard, conf.suiteConf.domain);
        await themeSF.navigateToMenu("Settings");
        await themeSF.goToCustomizeTheme();
        await themeSF.page.waitForSelector("//div[contains(@id,'tab-navigation')]//div[text()='Settings']");
        await themeSF.settingCheckOutPage(testCase.checkout_layout);
      });

      await test.step(`Open storefront`, async () => {
        await store.gotoHomePage();
        await store.page.waitForLoadState("networkidle");
        await store.page.waitForTimeout(2000);
        const events = testCase.view_page;
        for (let i = 0; i < events.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: events[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: events[i].key_value,
            expectValueEvent: events[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });

      await test.step(`Search product có với key = "name"`, async () => {
        await store.searchProduct(conf.suiteConf.product.title);
        await page.waitForLoadState("networkidle");
        // await store.waitForElementVisibleThenInvisible(store.xpathLoadingImage);
        await store.page.waitForTimeout(2000);
        const eventSearch = testCase.search;
        for (let i = 0; i < eventSearch.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventSearch[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventSearch[i].key_value,
            expectValueEvent: eventSearch[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });

      await test.step(`Click product name (go to product page)`, async () => {
        await store.viewProduct(conf.suiteConf.product.title);
        await store.waitForElementVisibleThenInvisible(product.xpathImageLoad);
        await page.waitForSelector(store.xpathProductDetail);
        await store.page.waitForTimeout(2000);
        const eventViewProduct = testCase.view_product;
        for (let i = 0; i < eventViewProduct.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventViewProduct[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventViewProduct[i].key_value,
            expectValueEvent: eventViewProduct[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });

      await test.step(`Click "Add to cart"`, async () => {
        await product.addProductToCart();
        await page.waitForSelector(product.xpathProductOptionInCart());
        const eventAddToCart = testCase.add_to_cart;
        for (let i = 0; i < eventAddToCart.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventAddToCart[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventAddToCart[i].key_value,
            expectValueEvent: eventAddToCart[i].expect_value,
          });
        }
        await page.click(product.xpathCloseCartDrawlIcon);
        await store.clearTrackingEvent();
      });

      await test.step(`Click "Buy Now"`, async () => {
        await product.clickBuyNow();
        await product.waitForEventCompleted(conf.suiteConf.domain, "initiate_checkout");
        await product.waitForElementVisibleThenInvisible(product.xpathPageCheckoutLoadDisable);
        await product.page.waitForSelector(checkOut.xpathCheckOutContent);
        await checkOut.inputEmail(testCase.checkout_info.email);
        await checkOut.inputFirstName(testCase.checkout_info.first_name);
        await checkOut.inputLastName(testCase.checkout_info.last_name);
        //Do khi input data nhanh quá event trên console chưa kip hiện
        //Cần 1 thời gian chờ để event lấy được thông tin event
        await checkOut.page.waitForTimeout(3000);
        const eventBuyNow = testCase.buy_now;
        for (let i = 0; i < eventBuyNow.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventBuyNow[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventBuyNow[i].key_value,
            expectValueEvent: eventBuyNow[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });

      await test.step(`Click vào cart icon trên header`, async () => {
        await store.gotoHomePage();
        await store.clickOnCartIconOnHeader();
        await page.waitForSelector(cart.xpathCartContent);
        const eventAddToCart = testCase.add_to_by_icon;
        for (let i = 0; i < eventAddToCart.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventAddToCart[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventAddToCart[i].key_value,
            expectValueEvent: eventAddToCart[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });

      await test.step(`Go to checkout page`, async () => {
        await cart.checkout();
        await product.waitForEventCompleted(conf.suiteConf.domain, "reached_checkout");
        await product.waitForElementVisibleThenInvisible(product.xpathPageCheckoutLoadDisable);
        await product.page.waitForSelector(checkOut.xpathCheckOutContent);
        await checkOut.inputEmail(testCase.checkout_info.email);
        await checkOut.inputFirstName(testCase.checkout_info.first_name);
        await checkOut.inputLastName(testCase.checkout_info.last_name);
        //Do khi input data nhanh quá event trên console chưa kip hiện
        //Cần 1 thời gian chờ để event lấy được thông tin event
        await checkOut.page.waitForTimeout(3000);
        const eventCheckout = testCase.begin_checkout;
        for (let i = 0; i < eventCheckout.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventCheckout[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventCheckout[i].key_value,
            expectValueEvent: eventCheckout[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });

      await test.step(`Nhập coupon`, async () => {
        await checkOut.inputDiscountBox.fill(testCase.promotion_code);
        await checkOut.applyDiscountButton.click();
        await checkOut.waitUntilElementVisible(checkOut.xpathReductionCode);
        await checkOut.inputEmail(testCase.checkout_info.email);
        await checkOut.inputFirstName(testCase.checkout_info.first_name);
        await checkOut.inputLastName(testCase.checkout_info.last_name);
        await checkOut.page.waitForTimeout(2000);
        const eventCoupon = testCase.use_coupon;
        for (let i = 0; i < eventCoupon.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventCoupon[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventCoupon[i].key_value,
            expectValueEvent: eventCoupon[i].expect_value,
          });
        }
        await store.clearTrackingEvent();
      });
      if (testCase.checkout_layout == "One page checkout") {
        await checkOut.enterShippingAddress(testCase.checkout_info);
        await checkOut.continueToPaymentMethod();
        if (testCase.is_checkout_paypal) {
          await checkOut.selectPaymentMethod(conf.suiteConf.payment_method);
          await checkOut.completeOrderViaPayPal(conf.suiteConf.paypal_account);
        } else {
          await checkOut.completeOrderWithCardInfo(conf.suiteConf.card);
          await Promise.all([
            checkOut.waitForEventCompleted(conf.suiteConf.domain, "purchase", 200000),
            checkOut.page.waitForSelector(checkOut.xpathThankYou),
          ]);
        }
        await checkOut.waitForElementVisibleThenInvisible(product.xpathImageLoad);
        const eventCustom = testCase.custom_info;
        for (let i = 0; i < eventCustom.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventCustom[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventCustom[i].key_value,
            expectValueEvent: eventCustom[i].expect_value,
          });
        }
        const eventShipping = testCase.shipping_method;
        for (let i = 0; i < eventShipping.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventShipping[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventShipping[i].key_value,
            expectValueEvent: eventShipping[i].expect_value,
          });
        }
        const eventPayment = testCase.payments_info;
        for (let i = 0; i < eventPayment.length; i++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventPayment[i].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventPayment[i].key_value,
            expectValueEvent: eventPayment[i].expect_value,
          });
        }
      } else {
        await test.step(`Nhập custommer info và click "Continue to shipping method"`, async () => {
          await checkOut.enterShippingAddress(testCase.checkout_info);
          await checkOut.waitUntilElementVisible(checkOut.xpathShipLabel);
          await checkOut.waitForElementVisibleThenInvisible(product.xpathImageLoad);
          const eventCustom = testCase.custom_info;
          for (let i = 0; i < eventCustom.length; i++) {
            await verifyTrackingEvent({
              fbEvent: fbEvent,
              type: "fb",
              eventName: eventCustom[i].event,
              shopName: shopName,
              shopId: shopId,
              keyValueEvent: eventCustom[i].key_value,
              expectValueEvent: eventCustom[i].expect_value,
            });
          }
          await store.clearTrackingEvent();
        });

        await test.step(`Chọn shipping method và click "Continue to Payment method"`, async () => {
          await checkOut.selectShippingMethodWithNo("1");
          await checkOut.page.click(checkOut.xpathBtnContinueToPaymentMethod);
          await checkOut.waitUntilElementVisible(checkOut.xpathPaymentLabel);
          await checkOut.waitForElementVisibleThenInvisible(product.xpathImageLoad);
          const eventShipping = testCase.shipping_method;
          for (let i = 0; i < eventShipping.length; i++) {
            await verifyTrackingEvent({
              fbEvent: fbEvent,
              type: "fb",
              eventName: eventShipping[i].event,
              shopName: shopName,
              shopId: shopId,
              keyValueEvent: eventShipping[i].key_value,
              expectValueEvent: eventShipping[i].expect_value,
            });
          }

          await store.clearTrackingEvent();
        });

        await test.step(`Nhập payment information và click "Place order"/"Complete order"`, async () => {
          const card = conf.suiteConf.card;
          if (testCase.is_checkout_paypal) {
            await checkOut.selectPaymentMethod(conf.suiteConf.payment_method);
            await checkOut.completeOrderViaPayPal(conf.suiteConf.paypal_account);
          } else {
            await checkOut.completeOrderWithCardInfo(card);
            await Promise.all([
              checkOut.waitForEventCompleted(conf.suiteConf.domain, "purchase", 200000),
              checkOut.page.waitForSelector(checkOut.xpathThankYou),
            ]);
          }
          await checkOut.waitForElementVisibleThenInvisible(product.xpathImageLoad);
          const eventPayment = testCase.payments_info;
          for (let i = 0; i < eventPayment.length; i++) {
            await verifyTrackingEvent({
              fbEvent: fbEvent,
              type: "fb",
              eventName: eventPayment[i].event,
              shopName: shopName,
              shopId: shopId,
              keyValueEvent: eventPayment[i].key_value,
              expectValueEvent: eventPayment[i].expect_value,
            });
          }
          await store.clearTrackingEvent();
        });
      }
    });
  });
});
