import { expect, test } from "@fixtures/theme";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import { ProductAPI } from "@pages/api/product";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { GoogleAnalytic } from "@pages/thirdparty/google";
import type { Dev, GoogleTrackingEvents } from "./google_tracking_events";

test.describe("Tracking events to Google Analytic", () => {
  let ggEvent: GoogleAnalytic;
  let suiteConf: GoogleTrackingEvents;
  let suiteConfEnv: Dev;

  test.beforeEach(async ({ conf, authRequest }) => {
    suiteConf = conf.suiteConf as GoogleTrackingEvents;
    suiteConfEnv = conf.suiteConf as Dev;
    test.setTimeout(suiteConf.timeout);

    await test.step("Create product", async () => {
      const productInfo = JSON.parse(JSON.stringify(suiteConf.product));
      const productAPI = new ProductAPI(suiteConfEnv.domain, authRequest);
      await productAPI.createNewProduct(productInfo);
    });
  });

  test("@SB_SF_TKE_73 Thực hiện tracking event với google analytics", async ({ conf, authRequest, browser }) => {
    const preferences = new PreferencesAPI(suiteConfEnv.domain, authRequest);
    const dataSetting = conf.caseConf.data_test;

    await test.step("-Vào dashboard>>Click Marketing Sales>>Click Google ads - Click vào dropdown chọn storefront -Fill thông Conversions vào các storefront", async () => {
      for (let i = 0; i < dataSetting.length; i++) {
        await preferences.settingGoogleAnalytics(dataSetting[i].ga_id, dataSetting[i].shop_id);
      }
    });
    for (let i = 0; i < dataSetting.length; i++) {
      const itemId = [];
      const context = await browser.newContext();
      const page = await context.newPage();
      await test.setTimeout(conf.suiteConf.timeout);
      const homepageSF = new SFHome(page, dataSetting[i].domain);
      const productPage = new SFProduct(page, dataSetting[i].domain);
      const checkoutPage = new SFCheckout(page, dataSetting[i].domain);
      ggEvent = new GoogleAnalytic(page, dataSetting[i].domain);
      const cartPage = new SFCart(page, dataSetting[i].domain);
      await test.step("Open storefront", async () => {
        await Promise.all([
          homepageSF.page.goto(`https://${dataSetting[i].domain}`),
          homepageSF.waitForEventCompleted(dataSetting[i].domain, "view_page", 200000),
        ]);
        await homepageSF.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
        const events = await ggEvent.getEventsList(dataSetting[i].view_page.event);
        for (const j in events) {
          expect(events[j].value.page_path).toEqual(dataSetting[i].view_page.page_path);
          expect(events[j].value.page_title).toEqual(dataSetting[i].view_page.page_title);
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Search product có với key = name", async () => {
        await homepageSF.searchProduct(suiteConf.product.title);
        await page.waitForLoadState("networkidle");
        const events = await ggEvent.getEventsList(dataSetting[i].search.event);
        for (const j in events) {
          expect(events[j].value.eventName).toEqual(dataSetting[i].search.event[j]);
          expect(events[j].value.search_term).toEqual(suiteConf.product.title);
          expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click product name (go to product page)", async () => {
        await homepageSF.viewProduct(suiteConf.product.title);
        await homepageSF.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
        await homepageSF.page.waitForTimeout(1000);
        const events = await ggEvent.getEventsList(dataSetting[i].view_product.event);
        for (const j in events) {
          itemId.push(events[j].value.items[0].item_id);
          expect(events[j].value.eventName).toEqual(dataSetting[i].view_product.event[j]);
          expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
          expect(Number(events[j].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
          expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click Add to cart", async () => {
        await productPage.addToCart();
        const events = await ggEvent.getEventsList(dataSetting[i].add_to_cart.event);
        for (const j in events) {
          expect(events[j].value.eventName).toEqual(dataSetting[i].add_to_cart.event[j]);
          expect(events[j].value.items[0].item_id).toEqual(itemId[0]);
          expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
          expect(Number(events[j].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
          expect(Number(events[j].value.items[0].quantity)).toEqual(dataSetting[i].add_to_cart.item_quantity);
          expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Go to checkout page", async () => {
        await cartPage.checkout();
        await homepageSF.waitForEventCompleted(dataSetting[i].domain, "reached_checkout");
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathPageCheckoutLoadDisable);
        await checkoutPage.page.waitForSelector(checkoutPage.xpathCheckOutContent);
        await checkoutPage.inputEmail(suiteConf.checkout_info.email);
        await checkoutPage.inputFirstName(suiteConf.checkout_info.first_name);
        await checkoutPage.inputLastName(suiteConf.checkout_info.last_name);
        const events = await ggEvent.getEventsList(dataSetting[i].begin_checkout.event);
        for (const j in events) {
          expect(events[j].value.eventName).toEqual(dataSetting[i].begin_checkout.event[j]);
          expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
          expect(events[j].value.items[0].item_id == itemId[0]).toBeTruthy();
          expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
          expect(Number(events[j].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
          expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Nhập coupon", async () => {
        await checkoutPage.inputDiscountBox.fill(dataSetting[i].promotion_code);
        await checkoutPage.applyDiscountButton.click();
        await checkoutPage.waitUntilElementVisible(checkoutPage.xpathReductionCode);
        await homepageSF.page.waitForTimeout(1000);
        const events = await ggEvent.getEventsList(dataSetting[i].use_coupon.event);
        for (const j in events) {
          expect(events[j].value.checkout_option).toEqual(dataSetting[i].use_coupon.checkout_option);
          expect(events[j].value.value).toEqual(dataSetting[i].promotion_code);
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      if (dataSetting[i].checkout_layout === "One page checkout") {
        await test.step(
          "Nhập Customer information, Chọn Shipping method," + "Nhập payment method và click Place order",
          async () => {
            await checkoutPage.enterShippingAddress(suiteConf.checkout_info);
            await checkoutPage.continueToPaymentMethod();
            if (dataSetting[i].is_checkout_paypal) {
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(suiteConf.card);
              await Promise.all([
                checkoutPage.waitForEventCompleted(dataSetting[i].domain, "purchase", 200000),
                checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou),
              ]);
            }
            await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
            const events = await ggEvent.getEventsList(dataSetting[i].checkout_info.event);
            for (const j in events) {
              if (events[j].value.eventName === "purchase") {
                expect(events[j].value.coupon).toEqual(dataSetting[i].promotion_code);
                expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
                expect(events[j].value.items[0].item_id == itemId[0]).toBeTruthy();
                expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
                expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
              } else {
                if (events[j].value.checkout_option.includes(suiteConf.checkout_info.phone_number)) {
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.first_name)).toBeTruthy();
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.last_name)).toBeTruthy();
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.address)).toBeTruthy();
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.city)).toBeTruthy();
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.zipcode)).toBeTruthy();
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.country)).toBeTruthy();
                  expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.phone_number)).toBeTruthy();
                  expect(events[j].value.checkout_step).toEqual(dataSetting[i].checkout_info.checkout_step);
                }
                if (events[j].value.checkout_option === "shipping_method") {
                  expect(events[j].value.checkout_option).toEqual(dataSetting[i].shipping_method.checkout_option);
                  expect(events[j].value.checkout_step).toEqual(dataSetting[i].shipping_method.checkout_step);
                  expect(events[j].value.eventName).toEqual(dataSetting[i].checkout_info.event[i]);
                  expect(events[j].value.value).toEqual(dataSetting[i].shipping_method.value);
                  expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
                }
                if (events[j].value.checkout_option === "payment_method") {
                  expect(events[j].value.checkout_option).toEqual(dataSetting[i].payment_method.checkout_option);
                  expect(events[j].value.checkout_step).toEqual(dataSetting[i].payment_method.checkout_step);
                  expect(events[j].value.eventName).toEqual(dataSetting[i].checkout_info.event[i]);
                  expect(events[j].value.value).toEqual(dataSetting[i].payment_method.value);
                  expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
                }
              }
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
            await homepageSF.clearTrackingEvent();
          },
        );
      } else {
        await test.step("Nhập customer info và click Continue to shipping method", async () => {
          await checkoutPage.enterShippingAddress(suiteConf.checkout_info);
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathShipLabel);
          await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
          const events = await ggEvent.getEventsList(dataSetting[i].custom_info.event);
          for (const j in events) {
            if (events[j].event == dataSetting[i].custom_info.event[0]) {
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.first_name)).toBeTruthy();
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.last_name)).toBeTruthy();
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.address)).toBeTruthy();
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.city)).toBeTruthy();
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.zipcode)).toBeTruthy();
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.country)).toBeTruthy();
              expect(events[j].value.checkout_option.includes(suiteConf.checkout_info.phone_number)).toBeTruthy();
              expect(events[j].value.checkout_step).toEqual(dataSetting[i].custom_info.checkout_step);
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
            if (events[j].event == dataSetting[i].custom_info.event[1]) {
              expect(events[j].value.coupon).toEqual(dataSetting[i].promotion_code);
              expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
          }
          await homepageSF.clearTrackingEvent();
        });

        await test.step("Chọn shipping method và click Continue to Payment method", async () => {
          await checkoutPage.selectShippingMethodWithNo("1");
          await checkoutPage.page.click(checkoutPage.xpathBtnContinueToPaymentMethod);
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
          await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
          const events = await ggEvent.getEventsList(dataSetting[i].shipping_method.event);
          for (const j in events) {
            if (events[j].value.eventName == dataSetting[i].shipping_method.event[0]) {
              expect(events[j].value.eventName).toEqual(dataSetting[i].shipping_method.event[0]);
              expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
              expect(events[j].value.items[0].item_id == itemId[0]).toBeTruthy();
              expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
              expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
            if (events[j].event == dataSetting[i].shipping_method.event[1]) {
              expect(events[j].value.coupon).toEqual(dataSetting[i].promotion_code);
              expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
          }
          await homepageSF.clearTrackingEvent();
        });

        await test.step("Nhập payment information và click Place order/Complete order", async () => {
          if (dataSetting[i].is_checkout_paypal) {
            await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
            await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
          } else {
            await checkoutPage.completeOrderWithCardInfo(suiteConf.card);
            await Promise.all([
              checkoutPage.waitForEventCompleted(dataSetting[i].domain, "purchase", 200000),
              checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou),
            ]);
          }
          await checkoutPage.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
          const events = await ggEvent.getEventsList(dataSetting[i].purchase.event);
          for (const j in events) {
            if (events[j].event == dataSetting[i].purchase.event[0]) {
              expect(events[j].value.eventName).toEqual(dataSetting[i].purchase.event[0]);
              expect(events[j].value.coupon).toEqual(dataSetting[i].promotion_code);
              expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
              expect(events[j].value.items[0].item_id == itemId[0]).toBeTruthy();
              expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
              expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
            if (events[j].event == dataSetting[i].purchase.event[1]) {
              expect(events[j].value.eventName).toEqual(dataSetting[i].purchase.event[1]);
              expect(events[j].value.currency).toEqual(dataSetting[i].begin_checkout.currency);
              expect(events[j].value.items[0].item_id == itemId[0]).toBeTruthy();
              expect(events[j].value.items[0].item_name).toEqual(suiteConf.product.title);
              expect(events[j].value.send_to).toEqual(dataSetting[i].send_to);
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name).toEqual(dataSetting[i].shop_name);
            }
          }
          await homepageSF.clearTrackingEvent();
        });
      }
      await context.close();
    }
  });
});
