import { expect, test } from "@fixtures/theme";
import { ProductAPI } from "@pages/api/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { GoogleAds } from "@pages/thirdparty/google_ads";
import { SaleChannelAPI } from "@pages/api/dashboard/sale_channel";
import type { CreateNEProduct } from "@types";
import { SFCart } from "@sf_pages/cart";

const getPriceProductByVariant = (product: CreateNEProduct, variantName: string): number => {
  const dataVariant = product.variants.find(variant => variant.title == variantName);
  return dataVariant.price;
};

test.describe("Tracking events to Google ads", () => {
  let ggEvent: GoogleAds;
  let domain: string;
  let title: string;
  let price: number;
  let cart: SFCart;
  let checkoutInfo;
  let cardInfo;
  test.beforeEach(async ({ conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    test.setTimeout(conf.suiteConf.timeout);
    title = conf.suiteConf.product.title;
    checkoutInfo = conf.suiteConf.checkout_info;
    cardInfo = conf.suiteConf.card;

    await test.step("Create product", async () => {
      const productInfo = JSON.parse(JSON.stringify(conf.suiteConf.product));
      const productAPI = new ProductAPI(domain, authRequest);
      await productAPI.createNewProduct(productInfo);
    });
  });

  test("Thực hiện tracking event với Google Ads @SB_SF_TKE_71", async ({ conf, authRequest, browser }) => {
    const settingSaleChannel = new SaleChannelAPI(domain, authRequest);
    const dataSetting = conf.caseConf.data_test;
    await test.step("-Vào dashboard>>Click Marketing Sales>>Click Google ads - Click vào dropdown chọn storefront -Fill thông Conversions vào các storefront", async () => {
      for (let i = 0; i < dataSetting.length; i++) {
        await settingSaleChannel.settingGoogleAds(dataSetting[i].setting_ads, dataSetting[i].shop_id, true);
      }
    });
    for (let i = 0; i < dataSetting.length; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await test.setTimeout(conf.suiteConf.timeout);
      const homepageSF = new SFHome(page, dataSetting[i].domain);
      const productPage = new SFProduct(page, dataSetting[i].domain);
      const checkoutPage = new SFCheckout(page, dataSetting[i].domain);
      cart = new SFCart(page, dataSetting[i].domain);
      ggEvent = new GoogleAds(page, dataSetting[i].domain);
      await test.step("Open storefront>>Search product có với key = 'name'>>Click product name (go to product page)", async () => {
        await homepageSF.goto(`https://${dataSetting[i].domain}`);
        await homepageSF.page.waitForLoadState("networkidle");
        await homepageSF.searchThenViewProduct(title);
        await homepageSF.waitForElementVisibleThenInvisible(productPage.xpathImageLoad);
        const conversions = dataSetting[i].setting_ads.gads_conversions
          .filter(item => item.conversion_goal == "view-product")
          .reverse();
        const events = await ggEvent.getEventsList(dataSetting[i].view_product.event);
        for (const j in conversions) {
          const sendToData = `${conversions[j]["id"]}/${conversions[j]["label"]}`;
          expect(events[j].value.currency).toEqual(dataSetting[i].view_product.currency);
          expect(events[j].value.send_to.trim()).toEqual(sendToData.trim());
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name.trim()).toEqual(dataSetting[i].shop_name.trim());
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click Add to cart", async () => {
        await productPage.addToCart();
        price = getPriceProductByVariant(conf.suiteConf.product, dataSetting[i].Variant_product.size);
        const conversions = dataSetting[i].setting_ads.gads_conversions
          .filter(item => item.conversion_goal == "add-to-cart")
          .reverse();
        const events = await ggEvent.getEventsList(dataSetting[i].view_product.event);
        for (const j in conversions) {
          const sendToData = `${conversions[j]["id"]}/${conversions[j]["label"]}`;
          expect(events[j].value.currency).toEqual(dataSetting[i].view_product.currency);
          expect(events[j].value.value).toEqual(price);
          expect(events[j].value.send_to.trim()).toEqual(sendToData.trim());
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name.trim()).toEqual(dataSetting[i].shop_name.trim());
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Go to checkout page", async () => {
        await cart.checkout();
        await homepageSF.waitForEventCompleted(dataSetting[i].domain, "reached_checkout");
        await checkoutPage.inputEmail(checkoutInfo.email);
        await checkoutPage.inputFirstName(checkoutInfo.first_name);
        await checkoutPage.inputLastName(checkoutInfo.last_name);
        const events = await ggEvent.getEventsList(dataSetting[i].begin_checkout.event);
        const conversions = dataSetting[i].setting_ads.gads_conversions
          .filter(item => item.conversion_goal == "begin-to-checkout")
          .reverse();
        for (const j in conversions) {
          const sendToData = `${conversions[j]["id"]}/${conversions[j]["label"]}`;
          expect(events[j].value.currency).toEqual(dataSetting[i].view_product.currency);
          expect(events[j].value.value).toEqual(price);
          expect(events[j].value.send_to.trim()).toEqual(sendToData.trim());
          expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
          expect(events[j].value.shop_name.trim()).toEqual(dataSetting[i].shop_name.trim());
        }
        await homepageSF.clearTrackingEvent();
      });
      if (dataSetting[i].checkout_layout === "One page checkout") {
        await test.step(
          "Nhập Customer information, Chọn Shipping method," + "Nhập payment method và click Place order",
          async () => {
            await checkoutPage.enterShippingAddress(checkoutInfo);
            await checkoutPage.continueToPaymentMethod();
            if (dataSetting[i].is_checkout_paypal) {
              await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(cardInfo);
              await Promise.all([
                checkoutPage.waitForEventCompleted(dataSetting[i].domain, "purchase", 200000),
                checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou),
              ]);
            }
            const events = await ggEvent.getEventsList(dataSetting[i].purchase.event);
            const conversions = dataSetting[i].setting_ads.gads_conversions
              .filter(item => item.conversion_goal == "purchase")
              .reverse();
            for (const j in conversions) {
              const sendToData = `${conversions[j]["id"]}/${conversions[j]["label"]}`;
              expect(events[j].value.currency).toEqual(dataSetting[i].view_product.currency);
              expect(events[j].value.value).toEqual(price);
              expect(events[j].value.send_to.trim()).toEqual(sendToData.trim());
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name.trim()).toEqual(dataSetting[i].shop_name.trim());
            }
            await homepageSF.clearTrackingEvent();
          },
        );
      } else {
        await test.step(
          "Nhập customer info và click Continue to shipping method->Chọn shipping method và click Continue to Payment method" +
            "Nhập payment information và click Place order/Complete order",
          async () => {
            await checkoutPage.enterShippingAddress(checkoutInfo);
            await checkoutPage.waitUntilElementVisible(checkoutPage.xpathShipLabel);
            await checkoutPage.selectShippingMethodWithNo("1");
            await checkoutPage.page.click(checkoutPage.xpathBtnContinueToPaymentMethod);
            await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
            if (dataSetting[i].is_checkout_paypal) {
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(cardInfo);
              await Promise.all([
                checkoutPage.waitForEventCompleted(dataSetting[i].domain, "purchase", 200000),
                checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou),
              ]);
            }
            const events = await ggEvent.getEventsList(dataSetting[i].purchase.event);
            const conversions = dataSetting[i].setting_ads.gads_conversions
              .filter(item => item.conversion_goal == "purchase")
              .reverse();
            for (const j in conversions) {
              const sendToData = `${conversions[j]["id"]}/${conversions[j]["label"]}`;
              expect(events[j].value.currency).toEqual(dataSetting[i].view_product.currency);
              expect(events[j].value.value).toEqual(price);
              expect(events[j].value.send_to.trim()).toEqual(sendToData.trim());
              expect(events[j].value.shop_id).toEqual(dataSetting[i].shop_id);
              expect(events[j].value.shop_name.trim()).toEqual(dataSetting[i].shop_name.trim());
            }
          },
        );
      }
      await context.close();
    }
  });
});
