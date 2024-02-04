import { test } from "@core/fixtures";
import { getProxyPageByCountry } from "@core/utils/proxy_page";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrderAfterCheckoutInfo, Product } from "@types";
import { expect } from "@core/fixtures";
import { SFCart } from "@pages/storefront/cart";
import { removeCurrencySymbol } from "@core/utils/string";
import { dataCurrencyOfCountry } from "@pages/dashboard/settings/global-market/global-market-list";
import { OrdersPage } from "@pages/dashboard/orders";
import { isEqual } from "@core/utils/checkout";

test.describe("Verify SF checkout flow global", async () => {
  let domain: string;
  let country,
    shippingAddress,
    expectedPrice,
    priceProduct,
    priceProductCartMini,
    priceProductCOpage,
    priceProductCartPage,
    shippingFee,
    expectShippingFee,
    totalOrder,
    expectedTotal,
    priceProductThankyoupage,
    newExpectedPrice,
    totalOrderThankyoupage,
    totalOrderInOrderDetail,
    settingPrice;
  let productCheckout: Product[];
  let marketPage: GlobalMarketAddPage;
  let homePage: SFHome;
  let productPage: SFProduct;
  let checkoutPage: SFCheckout;
  let cartPage: SFCart;
  let dataCountry: dataCurrencyOfCountry;
  let orderPage: OrdersPage;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let popupPage: SFCheckout;

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    await test.step(`Pre conditions`, async () => {
      // Get auto rate
      domain = conf.suiteConf.domain;
      productCheckout = conf.suiteConf.products_checkout;
      country = conf.caseConf.country;
      shippingAddress = conf.caseConf.shipping_address;
      marketPage = new GlobalMarketAddPage(dashboard, domain, authRequest);
      dataCountry = await marketPage.getDataCountry(country.country_name);
      expectedPrice = await marketPage.convertPriceToMarket(country.country_name, productCheckout[0].price);
      expectedPrice = expectedPrice.toString().replace(".", ",");
      const proxyPage = await getProxyPageByCountry(country.country_code);
      homePage = new SFHome(proxyPage, domain);
      checkoutPage = new SFCheckout(proxyPage, domain);
      productPage = new SFProduct(proxyPage, domain);
      cartPage = new SFCart(proxyPage, domain);
      orderPage = new OrdersPage(dashboard, domain);
    });
  });

  test(`@SB_SET_GM_CSG_30 Check Price adjustment curency & rounding trên Storefront, checkout thành công`, async ({
    conf,
  }) => {
    await test.step(`
    - Tại Storefront > Chọn Collection page > Verify Price's currency của các Products
    - Chọn product A = 50$ > Verify Price's currency của product đó `, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(country.country_name, "roller");
      await homePage.gotoProductDetail(productCheckout[0].handle);

      // verify price product in product page
      priceProduct = await productPage.getProductPriceSF();
      expect(priceProduct).toEqual(expectedPrice);
    });

    await test.step(`
    Add to cart Product vừa chọn 
    > Open cart và Mini cart 
    > Verify Price's currency của Product vừa chọn trong Cart và Mini cart`, async () => {
      // verify price product in cart page
      await productPage.addToCart();
      priceProductCartPage = await cartPage.getProductPriceWithoutCurrency(productCheckout[0].name);
      priceProductCartPage = (priceProductCartPage / 100).toString().replace(".", ",");
      expect(priceProductCartPage).toEqual(expectedPrice);

      // verify price product in cart mini
      await homePage.genLoc(homePage.xpathCartIcon).click();
      const xpathPriceProductCartMini = productPage.xpathPriceProductInCartDrawer;
      priceProductCartMini = await homePage.page.locator(xpathPriceProductCartMini).first().textContent();
      expect(removeCurrencySymbol(priceProductCartMini).replace(".", ",")).toEqual(expectedPrice);
      await homePage.genLoc(homePage.xpathCartIcon).click();
    });

    await test.step(`Verify Price's currency trên trang Checkout  `, async () => {
      await cartPage.genLoc(cartPage.xpathCheckoutBtn).click();
      priceProductCOpage = await checkoutPage.getProductPrice(productCheckout[0].name);

      // verify price product in checkout page
      expect(removeCurrencySymbol(priceProductCOpage).replace(".", ",")).toEqual(expectedPrice);
    });

    await test.step(`Verify Shipping Price's currency trên trang Checkout shipping`, async () => {
      await checkoutPage.enterShippingAddress(shippingAddress);
      shippingFee = await checkoutPage.getShippingFeeByRateName("Standard Shipping");
      expectShippingFee = (conf.caseConf.shipping_fee * dataCountry.exchangeRateAuto).toFixed(2);

      // verify shiping price in checkout page
      expect(shippingFee).toEqual(expectShippingFee);
    });

    await test.step(`Order thêm product thứ 2  product B = 50$ > Verify total amount`, async () => {
      await homePage.gotoProductDetail(productCheckout[0].handle);
      await productPage.addToCart();
      await cartPage.genLoc(cartPage.xpathCheckoutBtn).click();
      totalOrder = await checkoutPage.getTotalOnOrderSummary();
      expectedTotal = (+removeCurrencySymbol(expectedPrice) * 2 + +expectShippingFee).toFixed(2);

      // verify total amount in Checkout page
      expect(+removeCurrencySymbol(totalOrder)).toEqual(+expectedTotal);
    });

    await test.step(`Checkout Product > Verify Price's currency của Product trên trang Thankyou `, async () => {
      await checkoutPage.completeOrderWithMethod();
      priceProductThankyoupage = await checkoutPage.getProductPrice(productCheckout[0].name);
      newExpectedPrice = (+removeCurrencySymbol(expectedPrice) * 2).toFixed(2);

      // verify Price's currency của Product trên trang Thankyou
      expect(removeCurrencySymbol(priceProductThankyoupage)).toEqual(newExpectedPrice);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    await test.step(`Reload lại page > Verify Price's currency trên trang Order status`, async () => {
      await checkoutPage.page.reload();
      totalOrderThankyoupage = await checkoutPage.getTotalOnOrderSummary();
      expectedTotal = (+removeCurrencySymbol(expectedPrice) * 2 + +expectShippingFee).toFixed(2);

      // verify Price's currency trên trang Order status
      expect(+removeCurrencySymbol(totalOrderThankyoupage)).toEqual(+expectedTotal);
    });

    await test.step(`Tại Dashboard > Order > Order list > Mở order vừa checkout > Verify Price's currency `, async () => {
      // verify order status
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", conf.suiteConf.retry);
      const statusOrd = await orderPage.getOrderStatus();
      expect(statusOrd).toBe("Paid");

      // verify total amount currency USD in Order detail
      totalOrderInOrderDetail = await orderPage.getTotalOrder();
      const expectedTotalOrderDetail = (+expectedTotal / dataCountry.exchangeRateAuto).toFixed(2);
      expect(isEqual(+removeCurrencySymbol(totalOrderInOrderDetail), +expectedTotalOrderDetail, 0.01)).toBe(true);
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      settingPrice = await orderPage.getInfoSwitchCurrency();
      // verify exchange rate
      expect(settingPrice.exchangeRate).toEqual(dataCountry.exchangeRateAuto.toFixed(4));

      // verify price adjustment
      expect(settingPrice.priceAdjustment).toEqual(`${dataCountry.priceAddjustment}%`);

      // verify rounding
      expect(settingPrice.rounding).toEqual(dataCountry.rounding.toFixed(2));
    });
  });

  test(`@SB_SET_GM_CSG_41 Check convert Currency khi checkout với cổng Paypal  với Currency được Paypal support với Checkout 3 page`, async ({}) => {
    await test.step(`Tại Storefront > Chọn Collection page > Verify Price's currency của các Products`, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(country.country_name, "roller");
      await homePage.gotoProductDetail(productCheckout[0].handle);

      // verify price product in product page
      priceProduct = await productPage.getProductPriceSF();
      expect(priceProduct).toEqual(expectedPrice);
    });

    await test.step(`Checkout với Paypal express > Verify Currency trên Paypal `, async () => {
      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();
      popupPage = new SFCheckout(expressPopup, domain);

      // verify currency in Paypal popup
      const cartAmount = await popupPage.getTextContent(popupPage.xpathCartSummaryOnPP);
      expect(cartAmount).toContain("€");
    });

    await test.step(`Verify Price's currency trên trang Thankyou `, async () => {
      await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
      await popupPage.page.waitForEvent("close");
      priceProductThankyoupage = await checkoutPage.getProductPrice(productCheckout[0].name);
      newExpectedPrice = removeCurrencySymbol(expectedPrice);

      // verify Price's currency của Product trên trang Thankyou
      expect(removeCurrencySymbol(priceProductThankyoupage)).toEqual(newExpectedPrice);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    await test.step(`Tại Dashboard > Order > Order list > Mở order vừa checkout > Verify Price's currency `, async () => {
      // verify currency in Order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await expect(orderPage.isTextVisible("€")).toBeTruthy();
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      settingPrice = await orderPage.getInfoSwitchCurrency();
      // verify exchange rate
      expect(settingPrice.exchangeRate).toEqual(dataCountry.exchangeRateAuto.toFixed(4));

      // verify price adjustment
      expect(settingPrice.priceAdjustment).toEqual(`${dataCountry.priceAddjustment}%`);

      // verify rounding
      expect(settingPrice.rounding).toEqual(dataCountry.rounding.toFixed(2));
    });
  });

  test(`@SB_SET_GM_CSG_45 Check convert Currency khi checkout với cổng Paypal  với Currency không được Paypal support và Store Currency được Paypal support`, async ({}) => {
    await test.step(`Checkout 1 product bất kỳ > Verify Price's currency trên trang Checkout`, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(country.country_name, "roller");
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      priceProductCOpage = await checkoutPage.getProductPrice(productCheckout[0].name);
      expectedPrice = (+removeCurrencySymbol(expectedPrice)).toFixed(0);

      // verify Price's currency trên trang Checkout
      expect(removeCurrencySymbol(priceProductCOpage).replaceAll(".", "")).toEqual(expectedPrice);
    });

    await test.step(`Checkout với Paypal express > Verify Currency trên Paypal `, async () => {
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.selectPaymentMethod("PayPal");
      await checkoutPage.clickBtnCompleteOrder();
      await checkoutPage.logInPayPalToPay();

      // verify currency in Paypal
      const cartAmount = await checkoutPage.getTextContent(checkoutPage.xpathTotalOrderSandboxPaypal);
      expect(cartAmount).toContain("$");
    });

    await test.step(`Verify Price's currency trên trang Thankyou `, async () => {
      await checkoutPage.clickPayNowBtnOnPayPal();
      await checkoutPage.waitForPageRedirectFromPaymentPage();
      priceProductThankyoupage = await checkoutPage.getProductPrice(productCheckout[0].name);

      // verify Price's currency của Product trên trang Thankyou
      expect(removeCurrencySymbol(priceProductThankyoupage).replaceAll(".", "")).toEqual(expectedPrice);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    await test.step(`Tại Dashboard > Order > Order list > Mở order vừa checkout > Verify Price's currency `, async () => {
      // currency trên trang order detail đều hiện theo US
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await expect(orderPage.isTextVisible("$")).toBeTruthy();

      // không hiện btn "Switch currency"
      const isXpathDisplay = await orderPage.isElementExisted(orderPage.xpathBtnSwitchCurrency);
      expect(isXpathDisplay).toBe(false);
    });
  });
});
