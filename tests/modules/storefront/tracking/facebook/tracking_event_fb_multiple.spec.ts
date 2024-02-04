import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { ProductAPI } from "@pages/api/product";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Facebook } from "@pages/thirdparty/facebook";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";

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

  test.beforeEach(async ({ conf, authRequest }, testInfo) => {
    testInfo.setTimeout(conf.suiteConf.timeout);
    shopId = conf.suiteConf.shop_id;
    shopName = conf.suiteConf.shop_name;
    await test.step("Create product", async () => {
      const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      await productAPI.createNewProduct(conf.suiteConf.product);
    });
  });

  test("@SB_SF_TKE_72 Thực hiện tracking event với facebook", async ({ conf, authRequest, browser }) => {
    const preferences = new PreferencesAPI(conf.suiteConf.domain, authRequest);
    const dataSetting = conf.caseConf.data_test;
    await test.step("-Vào dashboard>>Click Marketing Sales>>Click Google ads - Click vào dropdown chọn storefront -Fill thông Conversions vào các storefront", async () => {
      for (let i = 0; i < dataSetting.length; i++) {
        await preferences.settingFacebook(
          dataSetting[i].facebook_conversions,
          dataSetting[i].pixelId,
          dataSetting[i].shop_id,
        );
      }
    });
    for (let i = 0; i < dataSetting.length; i++) {
      shopId = dataSetting[i].shop_id;
      shopName = dataSetting[i].shop_name;
      const context = await browser.newContext();
      const page = await context.newPage();
      await test.setTimeout(conf.suiteConf.timeout);
      const homepageSF = new SFHome(page, dataSetting[i].domain);
      const productPage = new SFProduct(page, dataSetting[i].domain);
      const checkoutPage = new SFCheckout(page, dataSetting[i].domain);
      fbEvent = new Facebook(page, dataSetting[i].domain);
      const cartPage = new SFCart(page, dataSetting[i].domain);
      await test.step("Open storefront", async () => {
        await Promise.all([
          homepageSF.page.goto(`https://${dataSetting[i].domain}`),
          homepageSF.waitForEventCompleted(dataSetting[i].domain, "view_page", 200000),
        ]);
        await homepageSF.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
        const events = dataSetting[i].view_page;
        for (let j = 0; j < events.length; j++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: events[j].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: events[j].key_value,
            expectValueEvent: events[j].expect_value,
          });
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Search product có với key = name", async () => {
        await homepageSF.searchProduct(conf.suiteConf.product.title);
        await page.waitForLoadState("networkidle");
        const eventSearch = dataSetting[i].search;
        for (let j = 0; j < eventSearch.length; j++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventSearch[j].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventSearch[j].key_value,
            expectValueEvent: eventSearch[j].expect_value,
          });
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click product name (go to product page)", async () => {
        await homepageSF.viewProduct(conf.suiteConf.product.title);
        await homepageSF.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
        const eventViewProduct = dataSetting[i].view_product;
        for (let j = 0; j < eventViewProduct.length; j++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventViewProduct[j].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventViewProduct[j].key_value,
            expectValueEvent: eventViewProduct[j].expect_value,
          });
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click Add to cart", async () => {
        await productPage.addToCart();
        const eventAddToCart = dataSetting[i].add_to_cart;
        for (let j = 0; j < eventAddToCart.length; j++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventAddToCart[j].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventAddToCart[j].key_value,
            expectValueEvent: eventAddToCart[j].expect_value,
          });
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Go to checkout page", async () => {
        await cartPage.checkout();
        await homepageSF.waitForEventCompleted(dataSetting[i].domain, "reached_checkout");
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathPageCheckoutLoadDisable);
        await checkoutPage.page.waitForSelector(checkoutPage.xpathCheckOutContent);
        await checkoutPage.inputEmail(dataSetting[i].checkout_info.email);
        await checkoutPage.inputFirstName(dataSetting[i].checkout_info.first_name);
        await checkoutPage.inputLastName(dataSetting[i].checkout_info.last_name);
        const eventCheckout = dataSetting[i].begin_checkout;
        for (let j = 0; j < eventCheckout.length; j++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventCheckout[j].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventCheckout[j].key_value,
            expectValueEvent: eventCheckout[j].expect_value,
          });
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Nhập coupon", async () => {
        await checkoutPage.inputDiscountBox.fill(dataSetting[i].promotion_code);
        await checkoutPage.applyDiscountButton.click();
        await checkoutPage.waitUntilElementVisible(checkoutPage.xpathReductionCode);
        await homepageSF.page.waitForTimeout(1000);
        const eventCoupon = dataSetting[i].use_coupon;
        for (let j = 0; j < eventCoupon.length; j++) {
          await verifyTrackingEvent({
            fbEvent: fbEvent,
            type: "fb",
            eventName: eventCoupon[j].event,
            shopName: shopName,
            shopId: shopId,
            keyValueEvent: eventCoupon[j].key_value,
            expectValueEvent: eventCoupon[j].expect_value,
          });
        }
        await homepageSF.clearTrackingEvent();
      });

      if (dataSetting[i].checkout_layout === "One page checkout") {
        await test.step(
          "Nhập Customer information, Chọn Shipping method," + "Nhập payment method và click Place order",
          async () => {
            await checkoutPage.enterShippingAddress(dataSetting[i].checkout_info);
            await checkoutPage.continueToPaymentMethod();
            if (dataSetting[i].is_checkout_paypal) {
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(conf.suiteConf.card);
              await Promise.all([
                checkoutPage.waitForEventCompleted(dataSetting[i].domain, "purchase", 200000),
                checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou),
              ]);
            }
            await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
            const eventCustom = dataSetting[i].custom_info;
            for (let j = 0; j < eventCustom.length; j++) {
              await verifyTrackingEvent({
                fbEvent: fbEvent,
                type: "fb",
                eventName: eventCustom[j].event,
                shopName: shopName,
                shopId: shopId,
                keyValueEvent: eventCustom[j].key_value,
                expectValueEvent: eventCustom[j].expect_value,
              });
            }

            const eventShipping = dataSetting[i].shipping_method;
            for (let j = 0; j < eventShipping.length; j++) {
              await verifyTrackingEvent({
                fbEvent: fbEvent,
                type: "fb",
                eventName: eventShipping[j].event,
                shopName: shopName,
                shopId: shopId,
                keyValueEvent: eventShipping[j].key_value,
                expectValueEvent: eventShipping[j].expect_value,
              });
            }
            const eventPayment = dataSetting[i].payments_info;
            for (let j = 0; j < eventPayment.length; j++) {
              await verifyTrackingEvent({
                fbEvent: fbEvent,
                type: "fb",
                eventName: eventPayment[j].event,
                shopName: shopName,
                shopId: shopId,
                keyValueEvent: eventPayment[j].key_value,
                expectValueEvent: eventPayment[j].expect_value,
              });
            }
            await homepageSF.clearTrackingEvent();
          },
        );
      } else {
        await test.step("Nhập customer info và click Continue to shipping method", async () => {
          await checkoutPage.enterShippingAddress(dataSetting[i].checkout_info);
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathShipLabel);
          await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
          const eventCustom = dataSetting[i].custom_info;
          for (let j = 0; j < eventCustom.length; j++) {
            await verifyTrackingEvent({
              fbEvent: fbEvent,
              type: "fb",
              eventName: eventCustom[j].event,
              shopName: shopName,
              shopId: shopId,
              keyValueEvent: eventCustom[j].key_value,
              expectValueEvent: eventCustom[j].expect_value,
            });
          }
          await homepageSF.clearTrackingEvent();
        });

        await test.step("Chọn shipping method và click Continue to Payment method", async () => {
          await checkoutPage.selectShippingMethodWithNo("1");
          await checkoutPage.page.click(checkoutPage.xpathBtnContinueToPaymentMethod);
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
          await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
          const eventShipping = dataSetting[i].shipping_method;
          for (let j = 0; j < eventShipping.length; j++) {
            await verifyTrackingEvent({
              fbEvent: fbEvent,
              type: "fb",
              eventName: eventShipping[j].event,
              shopName: shopName,
              shopId: shopId,
              keyValueEvent: eventShipping[j].key_value,
              expectValueEvent: eventShipping[j].expect_value,
            });
          }
          await homepageSF.clearTrackingEvent();
        });

        await test.step("Nhập payment information và click Place order/Complete order", async () => {
          const card = conf.suiteConf.card;
          if (dataSetting[i].is_checkout_paypal) {
            await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
            await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
          } else {
            await checkoutPage.completeOrderWithCardInfo(card);
            await Promise.all([
              checkoutPage.waitForEventCompleted(dataSetting[i].domain, "purchase", 200000),
              checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou),
            ]);
          }
          await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
          const eventPayment = dataSetting[i].payments_info;
          for (let j = 0; j < eventPayment.length; j++) {
            await verifyTrackingEvent({
              fbEvent: fbEvent,
              type: "fb",
              eventName: eventPayment[j].event,
              shopName: shopName,
              shopId: shopId,
              keyValueEvent: eventPayment[j].key_value,
              expectValueEvent: eventPayment[j].expect_value,
            });
          }
          await homepageSF.clearTrackingEvent();
        });
      }
      await context.close();
    }
  });
});
