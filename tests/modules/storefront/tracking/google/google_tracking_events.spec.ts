import { expect, test } from "@fixtures/theme";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import { ProductAPI } from "@pages/api/product";
import { ForceShareTheme } from "@pages/dashboard/force_copy_theme";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { GoogleAnalytic } from "@pages/thirdparty/google";
import { loadData } from "@core/conf/conf";
import type { Dev, GoogleTrackingEvents, Datum } from "./google_tracking_events";

test.describe("Tracking events to Google Analytic", () => {
  let ggEvent: GoogleAnalytic;
  let suiteConf: GoogleTrackingEvents;
  let suiteConfEnv: Dev;
  let themePage: ThemeDashboard;

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

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i] as Datum;
    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, page, theme, authRequest }) => {
      const itemId = [];
      ggEvent = new GoogleAnalytic(page, suiteConfEnv.domain);
      const homepageSF = new SFHome(page, suiteConfEnv.domain);
      const productPage = new SFProduct(page, suiteConfEnv.domain);
      const checkoutPage = new SFCheckout(page, suiteConfEnv.domain);
      const cartPage = new SFCart(page, suiteConfEnv.domain);

      await test.step("Setting theme and Google Analytics", async () => {
        const themes = new ForceShareTheme(dashboard, suiteConfEnv.domain);
        await themes.navigateToMenu("Settings");
        await themes.navigateToMenu("Online Store");
        if (await themes.checkButtonVisible("Disable multiple storefronts")) {
          await dashboard.getByRole("button", { name: "Disable multiple storefronts", exact: true }).click();
          await themes.clickOnBtnWithLabel("Confirm");
          await expect(dashboard.getByRole("button", { name: "Enable multiple storefronts" })).toBeVisible();
        }

        await themes.removeAllThemes();
        const res = await theme.create(3);
        await theme.publish(res.id);
        await dashboard.reload();
        const preferences = new PreferencesAPI(suiteConfEnv.domain, authRequest);
        await preferences.settingGoogleAnalytics(caseData.ga_id, suiteConfEnv.shop_id);
      });

      await test.step("Setting checkout", async () => {
        themePage = new ThemeDashboard(dashboard, suiteConfEnv.domain);
        await themePage.goToCustomizeTheme();
        await themePage.page.waitForSelector("//div[contains(@id,'tab-navigation')]//div[text()='Settings']");
        await themePage.settingCheckOutPage(caseData.checkout_layout);
        await themePage.clickOnBtnWithLabel("Close");
        if (await themePage.checkButtonVisible("Confirm")) {
          await themePage.clickOnBtnWithLabel("Confirm");
        }
      });

      await test.step("Open storefront", async () => {
        await homepageSF.gotoHomePage();
        await homepageSF.page.waitForLoadState("networkidle");
        const events = await ggEvent.getEventsList(caseData.view_page.event);
        for (const i in events) {
          expect(events[i].value.page_path).toEqual(caseData.view_page.page_path);
          expect(events[i].value.page_title).toEqual(caseData.view_page.page_title);
          expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
          expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Search product có với key = name", async () => {
        await homepageSF.searchProduct(suiteConf.product.title);
        await page.waitForLoadState("networkidle");
        await homepageSF.page.waitForTimeout(1000);
        const events = await ggEvent.getEventsList(caseData.search.event);
        for (const i in events) {
          expect(events[i].value.eventName).toEqual(caseData.search.event[i]);
          expect(events[i].value.search_term).toEqual(suiteConf.product.title);
          expect(events[i].value.send_to).toEqual(caseData.send_to);
          expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
          expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click product name (go to product page)", async () => {
        await homepageSF.viewProduct(suiteConf.product.title);
        await page.waitForSelector(homepageSF.xpathProductDetail);
        await homepageSF.page.waitForTimeout(1000);
        const events = await ggEvent.getEventsList(caseData.view_product.event);
        for (const i in events) {
          itemId.push(events[i].value.items[0].item_id);
          expect(events[i].value.eventName).toEqual(caseData.view_product.event[i]);
          expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
          expect(Number(events[i].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
          expect(events[i].value.send_to).toEqual(caseData.send_to);
          expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
          expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click Add to cart", async () => {
        await productPage.selectValueProduct(conf.caseConf.data[i].Variant_product);
        await productPage.addProductToCart();
        await productPage.waitUntilElementVisible(productPage.xpathProductOptionInCart());
        const events = await ggEvent.getEventsList(caseData.add_to_cart.event);
        for (const i in events) {
          expect(events[i].value.eventName).toEqual(caseData.add_to_cart.event[i]);
          expect(events[i].value.items[0].item_id).toEqual(itemId[0]);
          expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
          expect(Number(events[i].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
          expect(Number(events[i].value.items[0].quantity)).toEqual(caseData.add_to_cart.item_quantity);
          expect(events[i].value.send_to).toEqual(caseData.send_to);
          expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
          expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
        }
        await page.click(productPage.xpathCloseCartDrawlIcon);
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click Buy Now", async () => {
        await productPage.clickBuyNow();
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathPageCheckoutLoadDisable);
        await productPage.page.waitForSelector(checkoutPage.xpathCheckOutContent);
        await checkoutPage.inputEmail(suiteConf.checkout_info.email);
        await checkoutPage.inputFirstName(suiteConf.checkout_info.first_name);
        await checkoutPage.inputLastName(suiteConf.checkout_info.last_name);
        //Do khi input data nhanh quá event trên console chưa kip hiện
        //Cần 1 thời gian chờ để event lấy được thông tin event
        await checkoutPage.page.waitForTimeout(3000);
        const events = await ggEvent.getEventsList(caseData.buy_now.event);
        for (const i in events) {
          if (events[i].event == caseData.buy_now.event[0]) {
            expect(events[i].value.eventName).toEqual(caseData.buy_now.event[0]);
            expect(events[i].value.items[0].item_id).toEqual(itemId[0]);
            expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
            expect(Number(events[i].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
            expect(Number(events[i].value.items[0].quantity)).toEqual(caseData.buy_now.item_quantity);
            expect(events[i].value.send_to).toEqual(caseData.send_to);
            expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
            expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
          }
          if (events[i].event == caseData.buy_now.event[1]) {
            expect(events[i].value.eventName).toEqual(caseData.buy_now.event[1]);
            expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
            expect(events[i].value.items[0].item_id == itemId[0]).toBeTruthy();
            expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
            expect(Number(events[i].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
            expect(events[i].value.send_to).toEqual(caseData.send_to);
            expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
            expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
          }
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Go to checkout page", async () => {
        await homepageSF.gotoHomePage();
        await homepageSF.clearTrackingEvent();
        await homepageSF.clickOnCartIconOnHeader();
        await cartPage.checkout();
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathPageCheckoutLoadDisable);
        await checkoutPage.page.waitForSelector(checkoutPage.xpathCheckOutContent);
        await checkoutPage.inputEmail(suiteConf.checkout_info.email);
        await checkoutPage.inputFirstName(suiteConf.checkout_info.first_name);
        await checkoutPage.inputLastName(suiteConf.checkout_info.last_name);
        //Do khi input data nhanh quá event trên console chưa kip hiện
        //Cần 1 thời gian chờ để event lấy được thông tin event
        await checkoutPage.page.waitForTimeout(3000);
        const events = await ggEvent.getEventsList(caseData.begin_checkout.event);
        for (const i in events) {
          expect(events[i].value.eventName).toEqual(caseData.begin_checkout.event[i]);
          expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
          expect(events[i].value.items[0].item_id == itemId[0]).toBeTruthy();
          expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
          expect(Number(events[i].value.items[0].price)).toEqual(suiteConf.product.variantDefault.price);
          expect(events[i].value.send_to).toEqual(caseData.send_to);
          expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
          expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Nhập coupon", async () => {
        await checkoutPage.inputDiscountBox.fill(caseData.promotion_code);
        await checkoutPage.applyDiscountButton.click();
        await checkoutPage.waitUntilElementVisible(checkoutPage.xpathReductionCode);
        await homepageSF.page.waitForTimeout(1000);
        const events = await ggEvent.getEventsList(caseData.use_coupon.event);
        for (const i in events) {
          expect(events[i].value.checkout_option).toEqual(caseData.use_coupon.checkout_option);
          expect(events[i].value.value).toEqual(caseData.promotion_code);
          expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
          expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      if (caseData.checkout_layout === "One page checkout") {
        await test.step(
          "Nhập Customer information, Chọn Shipping method," + "Nhập payment method và click Place order",
          async () => {
            await checkoutPage.enterShippingAddress(suiteConf.checkout_info);
            await checkoutPage.continueToPaymentMethod();
            if (caseData.is_checkout_paypal) {
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(suiteConf.card);
            }
            await checkoutPage.waitUntilElementVisible(checkoutPage.xpathThankYou);
            //Chờ 1 thời gian cho page ổn định để lấy event từ console
            await checkoutPage.page.waitForTimeout(3000);
            const events = await ggEvent.getEventsList(caseData.checkout_info.event);
            for (const i in events) {
              if (events[i].value.eventName === "purchase") {
                expect(events[i].value.coupon).toEqual(caseData.promotion_code);
                expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
                expect(events[i].value.items[0].item_id == itemId[0]).toBeTruthy();
                expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
                expect(events[i].value.send_to).toEqual(caseData.send_to);
              } else {
                if (events[i].value.checkout_option.includes(suiteConf.checkout_info.phone_number)) {
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.first_name)).toBeTruthy();
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.last_name)).toBeTruthy();
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.address)).toBeTruthy();
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.city)).toBeTruthy();
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.zipcode)).toBeTruthy();
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.country)).toBeTruthy();
                  expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.phone_number)).toBeTruthy();
                  expect(events[i].value.checkout_step).toEqual(caseData.checkout_info.checkout_step);
                }
                if (events[i].value.checkout_option === "shipping_method") {
                  expect(events[i].value.checkout_option).toEqual(caseData.shipping_method.checkout_option);
                  expect(events[i].value.checkout_step).toEqual(caseData.shipping_method.checkout_step);
                  expect(events[i].value.eventName).toEqual(caseData.checkout_info.event[i]);
                  expect(events[i].value.value).toEqual(caseData.shipping_method.value);
                  expect(events[i].value.send_to).toEqual(caseData.send_to);
                }
                if (events[i].value.checkout_option === "payment_method") {
                  expect(events[i].value.checkout_option).toEqual(caseData.payment_method.checkout_option);
                  expect(events[i].value.checkout_step).toEqual(caseData.payment_method.checkout_step);
                  expect(events[i].value.eventName).toEqual(caseData.checkout_info.event[i]);
                  expect(events[i].value.value).toEqual(caseData.payment_method.value);
                  expect(events[i].value.send_to).toEqual(caseData.send_to);
                }
              }
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
            await homepageSF.clearTrackingEvent();
          },
        );
      } else {
        await test.step("Nhập customer info và click Continue to shipping method", async () => {
          await checkoutPage.enterShippingAddress(suiteConf.checkout_info);
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathShipLabel);
          await checkoutPage.page.waitForTimeout(2000);
          const events = await ggEvent.getEventsList(caseData.custom_info.event);
          for (const i in events) {
            if (events[i].event == caseData.custom_info.event[0]) {
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.first_name)).toBeTruthy();
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.last_name)).toBeTruthy();
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.address)).toBeTruthy();
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.city)).toBeTruthy();
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.zipcode)).toBeTruthy();
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.country)).toBeTruthy();
              expect(events[i].value.checkout_option.includes(suiteConf.checkout_info.phone_number)).toBeTruthy();
              expect(events[i].value.checkout_step).toEqual(caseData.custom_info.checkout_step);
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
            if (events[i].event == caseData.custom_info.event[1]) {
              expect(events[i].value.coupon).toEqual(caseData.promotion_code);
              expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
          }
          await homepageSF.clearTrackingEvent();
        });

        await test.step("Chọn shipping method và click Continue to Payment method", async () => {
          await checkoutPage.selectShippingMethodWithNo("1");
          await checkoutPage.clickOnBtnWithLabel("Continue to payment method");
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
          await checkoutPage.page.waitForTimeout(2000);
          const events = await ggEvent.getEventsList(caseData.shipping_method.event);
          for (const i in events) {
            if (events[i].value.eventName == caseData.shipping_method.event[0]) {
              expect(events[i].value.eventName).toEqual(caseData.shipping_method.event[0]);
              expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
              expect(events[i].value.items[0].item_id == itemId[0]).toBeTruthy();
              expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
              expect(events[i].value.send_to).toEqual(caseData.send_to);
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
            if (events[i].event == caseData.shipping_method.event[1]) {
              expect(events[i].value.coupon).toEqual(caseData.promotion_code);
              expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
          }
          await homepageSF.clearTrackingEvent();
        });

        await test.step("Nhập payment information và click Place order/Complete order", async () => {
          if (caseData.is_checkout_paypal) {
            await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
            await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
          } else {
            await checkoutPage.completeOrderWithCardInfo(suiteConf.card);
          }
          await checkoutPage.waitUntilElementVisible(checkoutPage.xpathThankYou);
          //Chờ 1 thời gian cho page ổn định để lấy event từ console
          await checkoutPage.page.waitForTimeout(3000);
          const events = await ggEvent.getEventsList(caseData.purchase.event);
          for (const i in events) {
            if (events[i].event == caseData.purchase.event[0]) {
              expect(events[i].value.eventName).toEqual(caseData.purchase.event[0]);
              expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
              expect(events[i].value.items[0].item_id == itemId[0]).toBeTruthy();
              expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
              expect(events[i].value.send_to).toEqual(caseData.send_to);
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
            if (events[i].event == caseData.purchase.event[1]) {
              expect(events[i].value.eventName).toEqual(caseData.purchase.event[1]);
              expect(events[i].value.coupon).toEqual(caseData.promotion_code);
              expect(events[i].value.currency).toEqual(caseData.begin_checkout.currency);
              expect(events[i].value.items[0].item_id == itemId[0]).toBeTruthy();
              expect(events[i].value.items[0].item_name).toEqual(suiteConf.product.title);
              expect(events[i].value.send_to).toEqual(caseData.send_to);
              expect(events[i].value.shop_id).toEqual(suiteConfEnv.shop_id);
              expect(events[i].value.shop_name).toEqual(suiteConfEnv.shop_name);
            }
          }
          await homepageSF.clearTrackingEvent();
        });
      }
    });
  }
});
