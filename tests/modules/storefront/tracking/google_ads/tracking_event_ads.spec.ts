import { expect, test } from "@fixtures/theme";
import { ProductAPI } from "@pages/api/product";
import { ForceShareTheme } from "@pages/dashboard/force_copy_theme";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { GoogleAds } from "@pages/thirdparty/google_ads";
import { loadData } from "@core/conf/conf";
import { SaleChannelAPI } from "@pages/api/dashboard/sale_channel";
import type { CreateNEProduct } from "@types";

const getPriceProductByVariant = (product: CreateNEProduct, variantName: string): number => {
  const dataVariant = product.variants.find(variant => variant.title == variantName);
  return dataVariant.price;
};

test.describe("Tracking events to Google ads", () => {
  let ggEvent: GoogleAds;
  let themePage: ThemeDashboard;
  let domain: string;
  let title: string;
  let price: number;
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

  const confEdit = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < confEdit.caseConf.data.length; i++) {
    const caseData = confEdit.caseConf.data[i];
    const dataSettingAds = caseData.setting_ads;
    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, page, theme, authRequest, conf }) => {
      ggEvent = new GoogleAds(page, domain);
      const homepageSF = new SFHome(page, domain);
      const productPage = new SFProduct(page, domain);
      const checkoutPage = new SFCheckout(page, domain);

      await test.step("Setting theme and Google Ads", async () => {
        const themes = new ForceShareTheme(dashboard, domain);
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
        const settingSaleChannel = new SaleChannelAPI(domain, authRequest);
        await settingSaleChannel.settingGoogleAds(caseData.setting_ads, conf.suiteConf.shop_id);
      });

      await test.step("Setting checkout", async () => {
        themePage = new ThemeDashboard(dashboard, domain);
        await themePage.goToCustomizeTheme();
        await themePage.page.waitForSelector("//div[contains(@id,'tab-navigation')]//div[text()='Settings']");
        await themePage.settingCheckOutPage(caseData.checkout_layout);
        await themePage.clickOnBtnWithLabel("Close");
        if (await themePage.checkButtonVisible("Confirm")) {
          await themePage.clickOnBtnWithLabel("Confirm");
        }
      });

      await test.step("Open storefront>>Search product có với key = 'name'>>Click product name (go to product page)", async () => {
        await homepageSF.gotoHomePage();
        await homepageSF.page.waitForLoadState("networkidle");
        await homepageSF.searchThenViewProduct(title);
        //Do khi input data nhanh quá event trên console chưa kip hiện
        //Cần 1 thời gian chờ để event lấy được thông tin event
        await homepageSF.page.waitForTimeout(3000);
        const conversions = dataSettingAds.gads_conversions
          .filter(item => item.conversion_goal == "view-product")
          .reverse();
        const events = await ggEvent.getEventsList(caseData.view_product.event);
        for (const i in conversions) {
          const sendToData = `${conversions[i]["id"]}/${conversions[i]["label"]}`;
          expect(events[i].value.currency).toEqual(caseData.view_product.currency);
          expect(events[i].value.send_to).toEqual(sendToData);
          expect(events[i].value.shop_id).toEqual(conf.suiteConf.shop_id);
          expect(events[i].value.shop_name).toEqual(conf.suiteConf.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Click Add to cart", async () => {
        await productPage.selectValueProduct(caseData.Variant_product);
        await productPage.addProductToCart();
        await productPage.waitUntilElementVisible(productPage.xpathProductOptionInCart());
        price = getPriceProductByVariant(conf.suiteConf.product, caseData.Variant_product.size);
        const conversions = dataSettingAds.gads_conversions
          .filter(item => item.conversion_goal == "add-to-cart")
          .reverse();
        const events = await ggEvent.getEventsList(caseData.view_product.event);
        for (const i in conversions) {
          const sendToData = `${conversions[i]["id"]}/${conversions[i]["label"]}`;
          expect(events[i].value.currency).toEqual(caseData.view_product.currency);
          expect(events[i].value.value).toEqual(price);
          expect(events[i].value.send_to).toEqual(sendToData);
          expect(events[i].value.shop_id).toEqual(conf.suiteConf.shop_id);
          expect(events[i].value.shop_name).toEqual(conf.suiteConf.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });

      await test.step("Go to checkout page", async () => {
        await productPage.navigateToCheckoutPage();
        await checkoutPage.inputEmail(checkoutInfo.email);
        await checkoutPage.inputFirstName(checkoutInfo.first_name);
        await checkoutPage.inputLastName(checkoutInfo.last_name);
        //Do khi input data nhanh quá event trên console chưa kip hiện
        //Cần 1 thời gian chờ để event lấy được thông tin event
        await checkoutPage.page.waitForTimeout(5000);
        const events = await ggEvent.getEventsList(caseData.begin_checkout.event);
        const conversions = dataSettingAds.gads_conversions
          .filter(item => item.conversion_goal == "begin-to-checkout")
          .reverse();
        for (const i in conversions) {
          const sendToData = `${conversions[i]["id"]}/${conversions[i]["label"]}`;
          expect(events[i].value.currency).toEqual(caseData.view_product.currency);
          expect(events[i].value.value).toEqual(price);
          expect(events[i].value.send_to).toEqual(sendToData);
          expect(events[i].value.shop_id).toEqual(conf.suiteConf.shop_id);
          expect(events[i].value.shop_name).toEqual(conf.suiteConf.shop_name);
        }
        await homepageSF.clearTrackingEvent();
      });
      if (caseData.checkout_layout === "One page checkout") {
        await test.step(
          "Nhập Customer information, Chọn Shipping method," + "Nhập payment method và click Place order",
          async () => {
            await checkoutPage.enterShippingAddress(checkoutInfo);
            await checkoutPage.continueToPaymentMethod();
            if (caseData.is_checkout_paypal) {
              await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(cardInfo);
            }
            await checkoutPage.waitUntilElementVisible(checkoutPage.xpathThankYou);
            //Chờ 1 thời gian cho page ổn định để lấy event từ console
            await checkoutPage.page.waitForTimeout(3000);
            const events = await ggEvent.getEventsList(caseData.purchase.event);
            const conversions = dataSettingAds.gads_conversions
              .filter(item => item.conversion_goal == "purchase")
              .reverse();
            for (const i in conversions) {
              const sendToData = `${conversions[i]["id"]}/${conversions[i]["label"]}`;
              expect(events[i].value.currency).toEqual(caseData.view_product.currency);
              expect(events[i].value.value).toEqual(price);
              expect(events[i].value.send_to).toEqual(sendToData);
              expect(events[i].value.shop_id).toEqual(conf.suiteConf.shop_id);
              expect(events[i].value.shop_name).toEqual(conf.suiteConf.shop_name);
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
            await checkoutPage.clickOnBtnWithLabel("Continue to payment method");
            await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
            if (caseData.is_checkout_paypal) {
              await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
              await checkoutPage.completeOrderViaPayPal(conf.suiteConf.paypal_account);
            } else {
              await checkoutPage.completeOrderWithCardInfo(cardInfo);
            }
            await checkoutPage.waitUntilElementVisible(checkoutPage.xpathThankYou);
            //Chờ 1 thời gian cho page ổn định để lấy event từ console
            await checkoutPage.page.waitForTimeout(3000);
            const events = await ggEvent.getEventsList(caseData.purchase.event);
            const conversions = dataSettingAds.gads_conversions
              .filter(item => item.conversion_goal == "purchase")
              .reverse();
            for (const i in conversions) {
              const sendToData = `${conversions[i]["id"]}/${conversions[i]["label"]}`;
              expect(events[i].value.currency).toEqual(caseData.view_product.currency);
              expect(events[i].value.value).toEqual(price);
              expect(events[i].value.send_to).toEqual(sendToData);
              expect(events[i].value.shop_id).toEqual(conf.suiteConf.shop_id);
              expect(events[i].value.shop_name).toEqual(conf.suiteConf.shop_name);
            }
          },
        );
      }
    });
  }
});
