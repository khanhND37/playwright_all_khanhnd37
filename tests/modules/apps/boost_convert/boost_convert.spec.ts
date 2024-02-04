import { expect, test } from "@core/fixtures";
import { BoostConvertAPI } from "@pages/api/apps/boost_convert/boostconvert";
import { SFCart } from "@pages/storefront/cart";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { BoostConvertInsidePage } from "@pages/dashboard/apps/boost_convert/boost_convert_inside";
import { CheckoutAPI } from "@pages/api/checkout";
import { Card, Product } from "@types";
import { OrderAPI } from "@pages/api/order";

test.describe("Boost Convert theme Roller", async () => {
  let homepage: SFHome,
    productDetail: SFProduct,
    checkoutAPI: CheckoutAPI,
    cart: SFCart,
    boostConvert: BoostConvertInsidePage,
    apiBoostConvert: BoostConvertAPI,
    productsCheckout: Array<Product>,
    cardInfo: Card,
    orderId: number,
    orderAPI: OrderAPI,
    checkoutInfo;

  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    apiBoostConvert = new BoostConvertAPI(conf.suiteConf.domain, conf.suiteConf.shop_id, authRequest);
    boostConvert = new BoostConvertInsidePage(dashboard, conf.suiteConf.domain, authRequest);
    await apiBoostConvert.deleteAllNotificationsList();
    await boostConvert.deleteCacheNoti("Sale noti");
    await apiBoostConvert.deleteAllCountdownTimer();
  });

  test("Check hiển thị Sale notification & Checkout notification @SB_SF_BC_13", async ({ conf, authRequest, page }) => {
    homepage = new SFHome(page, conf.suiteConf.domain);
    productDetail = new SFProduct(page, conf.suiteConf.domain);
    cart = new SFCart(page, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    let countNotiDBBeforeCheckout;
    const productB = conf.caseConf.data.product_name[0];
    const productA = conf.caseConf.data.product_name[1];
    productsCheckout = conf.suiteConf.products_checkout;
    cardInfo = conf.suiteConf.card_info;

    await test.step("Go to add a custom notification page and create noti", async () => {
      await boostConvert.goto(conf.suiteConf.settings_path);
      await boostConvert.selectProductToCreateNoti(productB);
      await expect(boostConvert.genLoc(boostConvert.selectProductOrCollectionPopup.productSelected)).toBeVisible();
      await boostConvert.selectLocationToCreateNoti(conf.caseConf.data.location);
      await expect(boostConvert.genLoc(boostConvert.xpathTagByLocation(conf.caseConf.data.location))).toBeVisible();
      await boostConvert.genLoc(boostConvert.createNowBtn).click();
      await expect(boostConvert.genLoc(boostConvert.titleNotifiList)).toBeVisible();
      await expect(boostConvert.genLoc(boostConvert.xpathNotiTypeByProductName(productB, "Custom"))).toBeVisible();
      await expect(boostConvert.genLoc(boostConvert.xpathNotiStatusByProductName(productB))).toBeChecked();
      await boostConvert.deleteCacheNoti("Sale noti");
      countNotiDBBeforeCheckout = await apiBoostConvert.getIdsAtNotificationsList();
    });

    await test.step("Open Homepage and verify show custom notification", async () => {
      await homepage.gotoHomePage();
      await expect(homepage.genLoc(boostConvert.xpathSaleNotiByProductAtSF(productB))).toBeVisible();
    });

    await test.step("Click to sale notification on storefront", async () => {
      await homepage.genLoc(boostConvert.xpathSaleNotiByProductAtSF(productB)).click();
      await productDetail.waitForXpathState(productDetail.xpathProductDescription, "visible");
      await expect(productDetail.genLoc(productDetail.xpathProductDescription)).toBeVisible();
      expect(await productDetail.getProductTitle()).toEqual(productB);
    });

    await test.step("Processing checkout order with product A by API", async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });

      orderId = checkoutInfo.order.id;

      await expect(async () => {
        const object = await orderAPI.getOrderInfo(orderId);
        expect(await object.statusOrder).toEqual("paid");
      }).toPass({ intervals: [1000], timeout: 60000 });
      await boostConvert.deleteCacheNoti("Checkout noti", conf.caseConf.product_id);
    });

    await test.step("Back to dashboard and open noti list screen", async () => {
      await expect(async () => {
        const countNotiDBAfterCheckout = await apiBoostConvert.getIdsAtNotificationsList();
        expect(countNotiDBAfterCheckout.length).toEqual(countNotiDBBeforeCheckout.length + 1);
      }).toPass();

      await boostConvert.goto(conf.suiteConf.notifications_list_path);
      await expect(boostConvert.genLoc(boostConvert.titleNotifiList)).toBeVisible();
      const notification = boostConvert.xpathNotiTypeByProductName(productA, "Sync");
      await expect(boostConvert.genLoc(notification)).toBeVisible();
      await boostConvert.deleteCacheNoti("Sale noti");
    });

    await test.step("Open Homepage and verify show sync notification", async () => {
      await homepage.gotoHomePage();
      await expect(homepage.genLoc(boostConvert.xpathSaleNotiByProductAtSF(productA))).toBeVisible();
    });

    await test.step("click sync notification of product A", async () => {
      await homepage.genLoc(boostConvert.xpathSaleNotiByProductAtSF(productA)).click();
      await expect(productDetail.genLoc(productDetail.xpathProductDescription)).toBeVisible();
      expect(await productDetail.getProductTitle()).toEqual(productA);
    });

    await test.step("Add to cart product A and open cart page", async () => {
      await productDetail.addToCart();
      await expect(cart.productsInCart()).toBeVisible();
      await expect(cart.genLoc(boostConvert.xpathCheckoutNotiByProductAtSF(productA))).toBeVisible();
    });
  });

  test("Check hiển thị countdown tool ngoài SF @SB_SF_BC_23", async ({ conf, page }) => {
    await apiBoostConvert.settingsCustomize(conf.caseConf.data.customize);
    await apiBoostConvert.editProductCountdown(conf.caseConf.data.product_countdown_default);
    await apiBoostConvert.editRealtimeVisitor(conf.caseConf.data.realtime_visitor_default);
    productDetail = new SFProduct(page, conf.suiteConf.domain);
    homepage = new SFHome(page, conf.suiteConf.domain);
    const timer = conf.caseConf.data.timer_countdown;
    const prodCountdown = conf.caseConf.data.product_countdown;
    const visitor = conf.caseConf.data.realtime_visitor;

    await test.step("Thay đổi setting  Customize page", async () => {
      await boostConvert.goto(conf.suiteConf.customize_path);
      await boostConvert.settingsTimerCountdown(timer.color, timer.front_size);
      await boostConvert.settingsProductCountdown(prodCountdown);
      await boostConvert.settingsVisitor(visitor);
      await boostConvert.genLoc(boostConvert.saveBtn).click();
      await boostConvert.waitForElementVisibleThenInvisible(boostConvert.success_message);
      await expect(boostConvert.xpathInputDataAtCustomize("Timer countdown", "Color")).toHaveValue(timer.color);
    });

    await test.step("Trong dashboard, tạo timer countdown", async () => {
      await boostConvert.goto(conf.suiteConf.timer_countdown_path);
      await boostConvert.genLoc(boostConvert.durationTimer).fill(timer.duration.toString());
      await boostConvert.genLoc(boostConvert.createTimerBtn).click();
      await expect(boostConvert.genLoc(boostConvert.titleTimerList)).toBeVisible();

      await expect(async () => {
        const countdownTimer = await apiBoostConvert.getCountdownTimer();
        expect(countdownTimer.total).toEqual(1);
        expect(countdownTimer.timers[0].duration).toEqual(timer.duration);
        expect(countdownTimer.timers[0].duration_type).toEqual(conf.caseConf.data.duration_type);
      }).toPass();
    });

    await test.step("Open product detail of product A and verify show countdown timer", async () => {
      await homepage.gotoProduct(conf.caseConf.data.handle);
      await productDetail.page.waitForLoadState("domcontentloaded");
      expect(await productDetail.getProductTitle()).toEqual(conf.caseConf.data.product_name);
      // eslint-disable-next-line max-len
      await productDetail.waitForElementVisibleThenInvisible(
        boostConvert.numberTimerCountdownSF(conf.caseConf.data.timer),
      );
      const color = `rgb(${productDetail.convertHexToRGB(timer.color)})`;
      await expect(productDetail.genLoc(boostConvert.contentTimerCountdownSF)).toBeVisible();
      await expect(productDetail.genLoc(boostConvert.contentTimerCountdownSF)).toHaveCSS("color", color, {
        timeout: 2000,
      });
      await expect(productDetail.genLoc(boostConvert.contentTimerCountdownSF)).toHaveCSS(
        "font-size",
        timer.front_size + "px",
        { timeout: 2000 },
      );
    });

    await test.step("Back to dashboard and setting product countdown", async () => {
      await boostConvert.goto(conf.suiteConf.product_countdown_path);
      await boostConvert.genLoc(boostConvert.xpathChooseProductCountdown("Number of items left in stock")).click();
      await boostConvert.genLoc(boostConvert.changeBtn).click();
      await boostConvert
        .genLoc(boostConvert.xpathRandomField("Random from"))
        .fill(prodCountdown.number_random_from.toString());
      await boostConvert.genLoc(boostConvert.xpathRandomField("to")).fill(prodCountdown.number_random_to.toString());
      await boostConvert.genLoc(boostConvert.saveBtn).click();
      await boostConvert.waitForElementVisibleThenInvisible(boostConvert.success_message);
    });

    await test.step("Open product A ngoài storefront và verify show product countdown", async () => {
      await homepage.gotoProduct(conf.caseConf.data.handle);
      await homepage.page.reload();
      await expect(homepage.genLoc(boostConvert.productCountdownSF.message)).toBeVisible();
      await expect(homepage.genLoc(boostConvert.productCountdownSF.progressBar)).toBeVisible();
      const message = await homepage.genLoc(boostConvert.productCountdownSF.message).textContent();
      const number = parseInt(message);
      expect(number).toBeGreaterThanOrEqual(prodCountdown.number_random_from);
      expect(number).toBeLessThanOrEqual(prodCountdown.number_random_to);
      const color = `rgb(${productDetail.convertHexToRGB(prodCountdown.process_color)})`;
      await expect(productDetail.genLoc(boostConvert.productCountdownSF.message)).toHaveCSS("color", color, {
        timeout: 2000,
      });
      await expect(productDetail.genLoc(boostConvert.productCountdownSF.message)).toHaveCSS(
        "font-size",
        prodCountdown.front_size + "px",
        { timeout: 2000 },
      );
    });

    await test.step("Setting realtime visitor", async () => {
      await boostConvert.goto(conf.suiteConf.realtime_visitor_path);
      await boostConvert.genLoc(boostConvert.changeBtn).click();
      await boostConvert
        .genLoc(boostConvert.xpathRandomField("Random from"))
        .fill(visitor.number_random_from.toString());
      await boostConvert.genLoc(boostConvert.xpathRandomField("to")).fill(visitor.number_random_to.toString());
      await boostConvert.genLoc(boostConvert.saveBtn).click();
      await boostConvert.waitForElementVisibleThenInvisible(boostConvert.success_message);
    });
    await test.step("Open product detail product A và verify Realtime visitor", async () => {
      await homepage.gotoProduct(conf.caseConf.data.handle);
      await homepage.page.reload();
      await expect(homepage.genLoc(boostConvert.contentRealTimeVisitorSF)).toBeVisible();

      const number = parseInt(await homepage.page.locator(boostConvert.numberRealTimeVisitorSF).textContent());
      const content = await homepage.genLoc(boostConvert.contentRealTimeVisitorSF).textContent();
      expect(content).toContain("people viewing this product right now.");
      expect(number).toBeGreaterThanOrEqual(visitor.number_random_from);
      expect(number).toBeLessThanOrEqual(visitor.number_random_to);

      const numberColor = `rgb(${productDetail.convertHexToRGB(visitor.number_color)})`;
      await expect(productDetail.genLoc(boostConvert.numberRealTimeVisitorSF)).toHaveCSS("color", numberColor, {
        timeout: 2000,
      });
      await expect(productDetail.genLoc(boostConvert.numberRealTimeVisitorSF)).toHaveCSS(
        "font-size",
        visitor.font_size + "px",
        { timeout: 2000 },
      );

      const textColor = `rgb(${productDetail.convertHexToRGB(visitor.text_color)})`;
      await expect(productDetail.genLoc(boostConvert.contentRealTimeVisitorSF)).toHaveCSS("color", textColor, {
        timeout: 2000,
      });
      await expect(productDetail.genLoc(boostConvert.contentRealTimeVisitorSF)).toHaveCSS(
        "font-size",
        visitor.font_size + "px",
        { timeout: 2000 },
      );
    });
  });
});
