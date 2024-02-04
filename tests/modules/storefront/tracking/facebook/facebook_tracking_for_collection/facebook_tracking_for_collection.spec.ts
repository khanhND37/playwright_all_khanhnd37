import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { Facebook } from "@pages/thirdparty/facebook";
import { expect } from "@core/fixtures";
import { SFProduct } from "@sf_pages/product";
import { ProductPage } from "@pages/dashboard/products";
import { SFCheckout } from "@sf_pages/checkout";

interface TrackingEvent {
  fbEvent: Facebook;
  type: string;
  eventName: string;
  shopName: string;
  shopId: string;
  productId: number[];
  keyValueEvent: string[];
  expectValueEvent: string[];
}

test.describe("Support single-item tracking ID for each collection", () => {
  test.describe.configure({ mode: "serial" });

  const verifyTrackingEvent = async (trackingValue: TrackingEvent) => {
    const { fbEvent, type, eventName, shopName, shopId, productId, keyValueEvent, expectValueEvent } = trackingValue;
    for (let i = 0; i < keyValueEvent.length; i++) {
      if (keyValueEvent[i] === "shop_name") {
        expectValueEvent[i] = shopName;
      }
      if (keyValueEvent[i] === "shop_id") {
        expectValueEvent[i] = shopId;
      }
      if (keyValueEvent[i] === "content_ids") {
        expectValueEvent[i] = productId.toString();
      }
      const actualValueEvent = await fbEvent.getValueTrackingEventByKey(type, eventName, keyValueEvent[i]);
      expect(actualValueEvent).toEqual(expectValueEvent[i]);
    }
  };

  test(`Check khi user add Pixel ID & Access Token trong collection @SB_SF_TKE_SIT_15`, async ({
    page,
    conf,
    authRequest,
  }) => {
    const homepage = new SFHome(page, conf.suiteConf.domain);
    const fbEvent = new Facebook(page, conf.suiteConf.domain);
    const productPage = new SFProduct(page, conf.suiteConf.domain);
    const product = new ProductPage(page, conf.suiteConf.domain);
    const checkout = new SFCheckout(page, conf.suiteConf.domain);
    const shopName = conf.suiteConf.shopName;
    const shopId = conf.suiteConf.shopId;
    const productCollection = conf.caseConf.productCollection;
    const productNotCollection = conf.caseConf.productNotCollection;
    const expectValueEvent = conf.caseConf.expectValue;
    const keyValueEvent = conf.caseConf.keyValue;
    const cardInfo = conf.suiteConf.card_info;
    const customerInfo = conf.suiteConf.customer_info;
    const productIdCollection = await product.getProductId(authRequest, productCollection, conf.suiteConf.domain);
    const productIdNotCollection = await product.getProductId(authRequest, productNotCollection, conf.suiteConf.domain);

    await test.step("Open storefront then search product and open product detail thuộc collection", async () => {
      await homepage.gotoHomePage();
      await homepage.searchThenViewProduct(productCollection);
      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "ViewContent",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection],
        keyValueEvent: keyValueEvent.ViewContent,
        expectValueEvent: expectValueEvent.ViewContent,
      });
      await fbEvent.clearTrackingEvent();
    });

    await test.step("Tại màn product detail thuộc collection , click button Add to cart", async () => {
      await productPage.addToCart();
      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "AddToCart",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection],
        keyValueEvent: keyValueEvent.AddToCart,
        expectValueEvent: expectValueEvent.AddToCart,
      });
      await fbEvent.clearTrackingEvent();
      await page.click("//div[contains(@class,'cart-drawer-icon-close')]");
    });

    await test.step("Open storefront then search product and open product detail không thuộc collection", async () => {
      await homepage.gotoHomePage();
      await homepage.searchThenViewProduct(productCollection);
      const isCheckEventTrackingExit = await fbEvent.getListTrackingEvent("fb", "ViewContent");
      expect(isCheckEventTrackingExit).toEqual(undefined);
      await fbEvent.clearTrackingEvent();
    });

    await test.step("Tại màn product detail không thuộc collection , click button Add to cart", async () => {
      await productPage.addToCart();
      const isCheckEventTrackingExit = await fbEvent.getListTrackingEvent("fb", "AddToCart");
      expect(isCheckEventTrackingExit).toEqual(undefined);
      await fbEvent.clearTrackingEvent();
      await page.click("//div[contains(@class,'cart-drawer-icon-close')]");
    });

    await test.step("Click Cart Icon tại Header", async () => {
      await homepage.clickOnCartIconOnHeader();
      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "CartDrawerIconClicked",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection, productIdNotCollection],
        keyValueEvent: keyValueEvent.CartDrawerIconClicked,
        expectValueEvent: expectValueEvent.CartDrawerIconClicked,
      });
      await fbEvent.clearTrackingEvent();
    });

    await test.step("Tại màn product detail, click button Checkout", async () => {
      await productPage.navigateToCheckoutPage();
      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "CheckoutButtonClicked",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection, productIdNotCollection],
        keyValueEvent: keyValueEvent.CheckoutButtonClicked,
        expectValueEvent: expectValueEvent.CheckoutButtonClicked,
      });
      await fbEvent.clearTrackingEvent();
    });

    await test.step("Tại Cart page, click Checkout Button", async () => {
      await productPage.gotoCart();
      await productPage.navigateToCheckoutPage();
      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "CheckoutButtonClicked",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection, productIdNotCollection],
        keyValueEvent: keyValueEvent.CheckoutButtonClicked,
        expectValueEvent: expectValueEvent.CheckoutButtonClicked,
      });
      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "InitiateCheckout",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection, productIdNotCollection],
        keyValueEvent: keyValueEvent.InitiateCheckout,
        expectValueEvent: expectValueEvent.InitiateCheckout,
      });
      await fbEvent.clearTrackingEvent();
    });

    await test.step("Checkout product thành công", async () => {
      await checkout.enterShippingAddress(customerInfo);
      await checkout.selectShippingMethod("");
      await checkout.continueToPaymentMethod();
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );

      await verifyTrackingEvent({
        fbEvent: fbEvent,
        type: "fb",
        eventName: "Purchase",
        shopName: shopName,
        shopId: shopId,
        productId: [productIdCollection, productIdNotCollection],
        keyValueEvent: keyValueEvent.Purchase,
        expectValueEvent: expectValueEvent.Purchase,
      });
      await fbEvent.clearTrackingEvent();
    });
  });
});
