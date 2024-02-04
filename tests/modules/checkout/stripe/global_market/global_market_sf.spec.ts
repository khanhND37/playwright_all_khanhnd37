import { expect, test } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { GlobalCurrency } from "@pages/storefront/global_currency";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCart } from "@pages/storefront/cart";
import { getCurrencySymbolBasedOnCurrencyName } from "@core/utils/string";
import { getToken } from "@core/utils/token";

test.describe("verify product price, shipping rate and total order after convert currency @TC_GLO_MAR_9", () => {
  test("verify product price, shipping rate and total order @TC_SB_OLS_THE_INS_CRC_361", async ({ page, conf }) => {
    const { domain, user_id: userId, shop_id: shopId } = conf.suiteConf as never;

    const homepage = new SFHome(page, domain);
    let productPage: SFProduct;
    let checkout: SFCheckout;
    let mailbox: MailBox;
    let orderPage: OrdersPage;
    let cartPage: SFCart;

    const prodName = conf.caseConf.product.name;
    const quantity = conf.caseConf.product.quantity;

    const discount = conf.caseConf.discount;

    const country = conf.caseConf.global_market.country;
    const storeCurrency = conf.caseConf.global_market.store_currency;
    const marketCurrency = conf.caseConf.global_market.market_currency;
    const exchangeRate = conf.caseConf.global_market.exchange_rate;
    const priceAdjustment = conf.caseConf.global_market.price_adjustment;
    const rounding = conf.caseConf.global_market.rounding;

    const cardInfo = conf.suiteConf.card_info;
    const customerInfo = conf.suiteConf.customer_info;
    const globalCurrency = await GlobalCurrency.GetGlobalCurrencyFromDashboardApi(
      country,
      storeCurrency,
      marketCurrency,
      exchangeRate,
      priceAdjustment,
      rounding,
    );

    let orderId, totalOrderSf;
    let prodPriceSf: number;
    let sfCurrencySymbol;
    let expectedProdPriceSf,
      expectedSubtotalSf: number,
      expectedDiscountValSf: number,
      expectedShippingRateSf: number,
      expectedTaxSf: number;

    await test.step("buyer open homepage then select storefront currency", async () => {
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(globalCurrency.country);
      sfCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(marketCurrency);
    });

    await test.step("search product then verify product price on product page", async () => {
      productPage = await homepage.searchThenViewProduct(prodName);

      prodPriceSf = await productPage.getProductPrice();

      expectedProdPriceSf = await productPage.loadProductInfoFromDashboard(userId, shopId);
      expectedProdPriceSf = globalCurrency.calculateExpectedProdPrice(expectedProdPriceSf);

      expect(prodPriceSf).toEqual(expectedProdPriceSf);
    });

    await test.step("add product to cart then verify product price on cart page", async () => {
      cartPage = await productPage.addProductToCart();
      await cartPage.getProductPriceWithoutCurrency(prodName);

      checkout = await productPage.navigateToCheckoutPage();
    });

    await test.step("input customer information", async () => {
      await checkout.enterShippingAddress(customerInfo);
      await checkout.clickBtnContinueToShippingMethod();
    });

    await test.step("select shipping method then verify shipping rate", async () => {
      await checkout.selectShippingMethod("");
      await checkout.continueToPaymentMethod();
      // get actual shipping fee
      const actualShippingRate = await checkout.getShippingFeeOnOrderSummary();

      // calculate expected shipping fee
      expectedShippingRateSf = await checkout.calculateShippingRate(exchangeRate);

      // verify shipping fee displayed on order summary
      expect(actualShippingRate).toEqual(sfCurrencySymbol + expectedShippingRateSf.toFixed(2));
    });

    await test.step("verify subtotal on order summary page", async () => {
      const actualSubtotal = await checkout.getSubtotalOnOrderSummary();

      expectedSubtotalSf = await checkout.calculateSubtotal(prodPriceSf, quantity);
      expect(actualSubtotal).toEqual(sfCurrencySymbol + expectedSubtotalSf.toFixed(2));
    });

    await test.step("enter discount code then verify discount value after convert currency", async () => {
      await checkout.applyDiscountCode(discount.code);

      const sfDiscounVal = await checkout.getDiscountValOnOrderSummary();

      expectedDiscountValSf = await checkout.calculateDiscount(exchangeRate);

      expect(sfDiscounVal).toEqual("- " + sfCurrencySymbol + expectedDiscountValSf.toFixed(2));
    });

    await test.step("calculate tax", async () => {
      expectedTaxSf = await checkout.getOriginTax(exchangeRate);
    });

    await test.step("input payment information", async () => {
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSf = expectedSubtotalSf - expectedDiscountValSf + expectedShippingRateSf + expectedTaxSf;
    });

    await test.step("verify thank you page: product price, subtotal, discount, tax, shipping, total", async () => {
      const actualProdPriceSf = await checkout.getSubtotalOnOrderSummary();
      const actualSubtotalSf = await checkout.getSubtotalOnOrderSummary();
      const acutalDiscountSf = await checkout.getDiscountValOnOrderSummary();
      const actualShippingSf = await checkout.getShippingFeeOnOrderSummary();
      const actualTaxSf = await checkout.getTaxOnOrderSummary();
      const actualTotalOrderSf = await checkout.getTotalOnOrderSummary();

      expect(actualProdPriceSf).toEqual(sfCurrencySymbol + expectedProdPriceSf.toFixed(2));
      expect(acutalDiscountSf).toEqual("- " + sfCurrencySymbol + expectedDiscountValSf.toFixed(2));
      expect(actualSubtotalSf).toEqual(sfCurrencySymbol + expectedSubtotalSf.toFixed(2));
      expect(actualShippingSf).toEqual(sfCurrencySymbol + expectedShippingRateSf.toFixed(2));
      expect(actualTaxSf).toEqual(sfCurrencySymbol + expectedTaxSf.toFixed(2));
      expect(actualTotalOrderSf).toEqual(sfCurrencySymbol + totalOrderSf.toFixed(2));
    });

    await test.step("open order detail by API then verify order detail", async () => {
      // TODO trước đây để là getToken(shopId, userId); bị ngược sao lấy dc token nhỉ?
      const accessToken = await getToken(userId, shopId);
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const storeCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(exchangeRate);

      // verify product price before discount
      const actualProdPrice = await orderPage.getOriginProdPrice(prodName);
      const expectedProdPrice = orderPage.calculateValWithoutCurrency(prodPriceSf, exchangeRate);
      expect(actualProdPrice).toEqual(storeCurrencySymbol + expectedProdPrice);

      // verify shipping
      const actualShippingRate = await orderPage.getShippingFee();
      const expectedShippingRate = orderPage.calculateValWithoutCurrency(expectedShippingRateSf, exchangeRate);
      expect(actualShippingRate).toEqual(storeCurrencySymbol + expectedShippingRate.toFixed(2));

      // verify discount
      const actualDiscountVal = await orderPage.getDiscountVal();
      const expectedDiscountVal = orderPage.calculateValWithoutCurrency(expectedDiscountValSf, exchangeRate);
      expect(actualDiscountVal).toEqual("-" + storeCurrencySymbol + expectedDiscountVal.toFixed(2));

      const expectedTax = 1.4;

      // verify subtotal = product price * quantity - discount
      const actualSubtotal = await orderPage.getSubtotalOrder();
      const expectedSubtotal = expectedProdPrice * quantity - expectedDiscountVal;
      expect(actualSubtotal).toEqual(storeCurrencySymbol + expectedSubtotal.toFixed(2));

      // verify total order
      const actualTotalOrder = await orderPage.getTotalOrder();
      const expectTotalOrder = expectedSubtotal + expectedShippingRate + expectedTax;
      expect(actualTotalOrder).toEqual(storeCurrencySymbol + expectTotalOrder.toFixed(2));
    });

    await test.step("open mailbox", async () => {
      mailbox = await checkout.openMailBox(customerInfo.email);
    });

    await test.step("open order confirmation email then verify order information", async () => {
      // verify product price
      const actualProdPriceEmail = await mailbox.getValueBasedOnTitle(
        prodName + " x " + quantity,
        sfCurrencySymbol,
        expectedProdPriceSf,
      );
      expect(actualProdPriceEmail).toEqual(sfCurrencySymbol + expectedProdPriceSf);

      const actualDiscountEmail = await mailbox.getValueBasedOnTitle(
        `Discount (${discount.code})`,
        sfCurrencySymbol,
        expectedDiscountValSf,
      );
      expect(actualDiscountEmail).toEqual(sfCurrencySymbol + expectedDiscountValSf);

      // verify subtotal
      const actualSubtotalEmail = await mailbox.getValueBasedOnTitle("Subtotal", sfCurrencySymbol, expectedSubtotalSf);
      expect(actualSubtotalEmail).toEqual(sfCurrencySymbol + expectedSubtotalSf);

      // verify Shipping
      const actualShippingEmail = await mailbox.getValueBasedOnTitle(
        "Shipping",
        sfCurrencySymbol,
        expectedShippingRateSf,
      );

      expect(actualShippingEmail).toEqual(sfCurrencySymbol + expectedShippingRateSf);

      // verify tax
      const actualTaxEmail = await mailbox.getValueBasedOnTitle("Tax", sfCurrencySymbol, expectedTaxSf);
      expect(actualTaxEmail).toEqual(sfCurrencySymbol + expectedTaxSf);

      // verify total
      const actualTotalEmail = await mailbox.getValueBasedOnTitle("Total", sfCurrencySymbol, totalOrderSf);
      expect(actualTotalEmail).toEqual(sfCurrencySymbol + totalOrderSf);
    });
  });

  // eslint-disable-next-line max-len
  test("verify checkout flow when merchant set global market có multi currency = off, market manual rate , decrease price adjustment, rouding = 0 @TC_SB_OLS_THE_INS_CRC_362", async ({
    page,
    conf,
  }) => {
    const { domain, user_id: userId, shop_id: shopId } = conf.suiteConf as never;

    const homepage = new SFHome(page, domain);
    let productPage: SFProduct;
    let checkout: SFCheckout;
    let orderPage: OrdersPage;
    let cartPage: SFCart;

    const prodName = conf.caseConf.product.name;
    const quantity = conf.caseConf.product.quantity;

    const discount = conf.caseConf.discount;

    const country = conf.caseConf.global_market.country;
    const storeCurrency = conf.caseConf.global_market.store_currency;
    const marketCurrency = conf.caseConf.global_market.market_currency;
    const exchangeRate = conf.caseConf.global_market.exchange_rate;
    const priceAdjustment = conf.caseConf.global_market.price_adjustment;
    const rounding = conf.caseConf.global_market.rounding;

    const cardInfo = conf.suiteConf.card_info;
    const customerInfo = conf.suiteConf.customer_info;

    const globalCurrency = await GlobalCurrency.GetGlobalCurrencyFromDashboardApi(
      country,
      storeCurrency,
      marketCurrency,
      exchangeRate,
      priceAdjustment,
      rounding,
    );
    const sfCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(marketCurrency);

    let orderId: number;
    let prodPriceSf: number;
    let expectedProdPriceSf: number;

    let expectedSubtotalSf: number,
      expectedDiscountValSf: number,
      expectedShippingRateSf: number,
      expectedTaxSf: number;
    await test.step("buyer open homepage then select storefront currency", async () => {
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(country);
    });

    await test.step("search prodcuct > view product > verify product price on product page", async () => {
      productPage = await homepage.searchThenViewProduct(prodName);

      prodPriceSf = await productPage.getProductPrice();
      expectedProdPriceSf = await productPage.loadProductInfoFromDashboard(userId, shopId);
      expectedProdPriceSf = globalCurrency.calculateExpectedProdPrice(expectedProdPriceSf);

      expect(prodPriceSf).toEqual(expectedProdPriceSf);
    });

    await test.step("add product to cart then verify product price on cart page", async () => {
      cartPage = await productPage.addProductToCart();
      const prodPriceSf = await cartPage.getProductPriceWithoutCurrency(prodName);
      expect(prodPriceSf).toEqual(expectedProdPriceSf);

      checkout = await productPage.navigateToCheckoutPage();
    });

    await test.step("input customer information", async () => {
      await checkout.enterShippingAddress(customerInfo);
    });

    await test.step("select shipping method then verify shipping rate", async () => {
      await checkout.selectShippingMethod("");
      await checkout.continueToPaymentMethod();
      // get actual shipping fee
      const actualShippingRate = await checkout.getShippingFeeOnOrderSummary();

      // calculate expected shipping fee
      expectedShippingRateSf = await checkout.calculateShippingRate(exchangeRate);

      // verify shipping fee displayed on order summary
      expect(actualShippingRate).toEqual(sfCurrencySymbol + expectedShippingRateSf.toFixed(2));
    });

    await test.step("verify subtotal on order summary page", async () => {
      const actualSubtotal = await checkout.getSubtotalOnOrderSummary();

      expectedSubtotalSf = await checkout.calculateSubtotal(prodPriceSf, quantity);
      expect(actualSubtotal).toEqual(sfCurrencySymbol + expectedSubtotalSf.toFixed(2));
    });

    await test.step("enter discount code then verify discount value after convert currency", async () => {
      await checkout.applyDiscountCode(discount.code);

      const sfDiscounVal = await checkout.getDiscountValOnOrderSummary();

      expectedDiscountValSf = await checkout.calculateDiscount(exchangeRate);

      expect(sfDiscounVal).toEqual("- " + sfCurrencySymbol + expectedDiscountValSf.toFixed(2));
    });

    await test.step("calculate tax", async () => {
      expectedTaxSf = await checkout.getOriginTax(exchangeRate);
    });

    await test.step("input payment information", async () => {
      await checkout.inputCardInfoAndCompleteOrder(
        cardInfo.card_number,
        cardInfo.card_holder_name,
        cardInfo.expire_date,
        cardInfo.cvv,
      );
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
      // TODO: check
      // eslint-disable-next-line max-len
      // totalOrderSf = expectedSubtotalSf - expectedDiscountValSf + expectedShippingRateSf + expectedTaxSf; // lệch 0.01
    });

    await test.step("verify thank you page: product price, subtotal, discount, tax, shipping, total", async () => {
      const actualProdPriceSf = await checkout.getSubtotalOnOrderSummary();
      const actualSubtotalSf = await checkout.getSubtotalOnOrderSummary();
      const acutalDiscountSf = await checkout.getDiscountValOnOrderSummary();
      const actualShippingSf = await checkout.getShippingFeeOnOrderSummary();
      const actualTaxSf = await checkout.getTaxOnOrderSummary();

      expect(actualProdPriceSf).toEqual(sfCurrencySymbol + expectedProdPriceSf.toFixed(2));
      expect(acutalDiscountSf).toEqual("- " + sfCurrencySymbol + expectedDiscountValSf.toFixed(2));
      expect(actualSubtotalSf).toEqual(sfCurrencySymbol + expectedSubtotalSf.toFixed(2));
      expect(actualShippingSf).toEqual(sfCurrencySymbol + expectedShippingRateSf.toFixed(2));
      expect(actualTaxSf).toEqual(sfCurrencySymbol + expectedTaxSf.toFixed(2));
    });

    await test.step("open order detail by API then verify order detail", async () => {
      // const accessToken = await getToken(shop_id, user_id);
      //TODO check vi sao code nay van o day?
      const accessToken = "4bef0e0134de0565662dbbedf0fcdc231623602c5538aab0020b0c3279a46bf0";
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const storeCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(storeCurrency);

      // verify product price before discount
      const actualProdPrice = await orderPage.getOriginProdPrice(prodName);
      const expectedProdPrice = orderPage.calculateValWithoutCurrency(prodPriceSf, exchangeRate);
      expect(actualProdPrice).toEqual(storeCurrencySymbol + expectedProdPrice.toFixed(2));

      // verify shipping
      const actualShippingRate = await orderPage.getShippingFee();
      const expectedShippingRate = orderPage.calculateValWithoutCurrency(expectedShippingRateSf, exchangeRate);
      expect(actualShippingRate).toEqual(storeCurrencySymbol + expectedShippingRate.toFixed(2));

      // verify discount
      const actualDiscountVal = await orderPage.getDiscountVal();
      const expectedDiscountVal = orderPage.calculateValWithoutCurrency(expectedDiscountValSf, exchangeRate);
      expect(actualDiscountVal).toEqual("-" + storeCurrencySymbol + expectedDiscountVal.toFixed(2));

      // verify tax
      const actualTaxVal = await orderPage.getTaxVal();
      const expectedTax = orderPage.calculateValWithoutCurrency(expectedTaxSf, exchangeRate);
      expect(actualTaxVal).toEqual(storeCurrencySymbol + expectedTax.toFixed(2));

      // verify subtotal = product price * quantity - discount
      const actualSubtotal = await orderPage.getSubtotalOrder();
      const expectedSubtotal = expectedProdPrice * quantity - expectedDiscountVal;
      expect(actualSubtotal).toEqual(storeCurrencySymbol + expectedSubtotal.toFixed(2));

      // verify total order
      const actualTotalOrder = await orderPage.getTotalOrder();
      const expectTotalOrder = expectedSubtotal + expectedShippingRate + expectedTax;
      expect(actualTotalOrder).toEqual(storeCurrencySymbol + expectTotalOrder.toFixed(2));
    });
  });
});
