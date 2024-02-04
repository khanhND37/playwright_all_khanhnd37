import { expect, test } from "@core/fixtures";
import { getCurrencySymbolBasedOnCurrencyName, removeCurrencySymbol } from "@core/utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { GlobalCurrency } from "@pages/storefront/global_currency";
import { SFHome } from "@pages/storefront/homepage";
import type { ShippingAddress } from "@types";

test.describe("Kiểm tra thanh toán thành công khi Buyer thanh toán qua cổng paypal với currency support", () => {
  let accessToken: string;
  let homePage: SFHome;
  let checkoutPage: SFCheckout;
  let orderPage: OrdersPage;
  let productName: string;
  let shippingAdress: ShippingAddress;
  let paypalAccount;
  let country: string;
  let storeCurrency: string;
  let marketCurrency: string;
  let exchangeRate: number;
  let sfCurrencySymbol, dbCurrencySymbol;
  let prodPriceSf: string;
  let subtotalSf: string;
  let shippingSf: string;
  let taxSf: string;
  let orderId: number;

  test.beforeAll(async ({ token, conf }) => {
    const { shop_name: shopName, username, password } = conf.suiteConf as never;
    const tokenObject = await token.getWithCredentials({
      domain: shopName,
      username,
      password,
    });
    accessToken = tokenObject.access_token;

    productName = conf.suiteConf.products.name;
    shippingAdress = conf.suiteConf.customer_info;
    paypalAccount = conf.suiteConf.paypal_account;
  });

  test.beforeEach(async ({ conf, page }) => {
    country = conf.caseConf.global_market.country;
    storeCurrency = conf.caseConf.global_market.store_currency;
    marketCurrency = conf.caseConf.global_market.market_currency;
    exchangeRate = conf.caseConf.global_market.exchange_rate;
    const priceAdjustment = conf.caseConf.global_market.price_adjustment;
    const rounding = conf.caseConf.global_market.rounding;
    await GlobalCurrency.GetGlobalCurrencyFromDashboardApi(
      country,
      storeCurrency,
      marketCurrency,
      exchangeRate,
      priceAdjustment,
      rounding,
    );
    sfCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(marketCurrency);
    dbCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(storeCurrency);

    homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step("Checkout thành công order trên paypal", async () => {
      //1. Search then select market currency
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(country);

      // 2. add product to cart > input customer information
      const productPage = await homePage.searchThenViewProduct(productName);
      await productPage.addProductToCart();
      checkoutPage = await productPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(shippingAdress);
      await checkoutPage.continueToPaymentMethod();

      // 3. Complete order by PayPal
      await checkoutPage.selectPaymentMethod("PayPal");
      await checkoutPage.completeOrderViaPayPal(paypalAccount);

      // 4. get checkout info
      orderId = await checkoutPage.getOrderIdBySDK();
      prodPriceSf = removeCurrencySymbol(await checkoutPage.getProductPrice(productName));
      subtotalSf = removeCurrencySymbol(await checkoutPage.getSubtotalOnOrderSummary());
      taxSf = removeCurrencySymbol(await checkoutPage.getTaxOnOrderSummary());
      shippingSf = removeCurrencySymbol(await checkoutPage.getShippingFeeOnOrderSummary());

      orderPage = await checkoutPage.openOrderByAPI(orderId, accessToken);
    });
  });

  // eslint-disable-next-line max-len
  test(
    "Kiểm tra thanh toán thành công khi Buyer thanh toán qua cổng paypal với " +
      "currency support @TC_SB_OLS_THE_INS_CRC_400",
    async () => {
      await test.step(
        "Login vào dashbboard > orders > verify thông tin order " + "hiển thị theo store currency = USD",
        async () => {
          const prodPriceDb = await orderPage.getOriginProdPrice(productName);
          const expProdPriceDb = orderPage.calculateValWithoutCurrency(Number(prodPriceSf), exchangeRate);
          expect(prodPriceDb).toEqual(dbCurrencySymbol + expProdPriceDb);

          const shippingRateDb = await orderPage.getShippingFee();
          const expShippingRateDb = orderPage.calculateValWithoutCurrency(Number(shippingSf), exchangeRate);
          expect(expShippingRateDb).toEqual(dbCurrencySymbol + expShippingRateDb);

          const subtotalDb = await orderPage.getSubtotalOrder();
          const expsubtotalDb = orderPage.calculateValWithoutCurrency(Number(subtotalSf), exchangeRate);
          expect(subtotalDb).toEqual(dbCurrencySymbol + expsubtotalDb);

          const taxDb = await orderPage.getTaxVal();
          const expTaxDb = orderPage.calculateValWithoutCurrency(Number(taxSf), exchangeRate);
          expect(taxDb).toEqual(dbCurrencySymbol + expTaxDb);

          const totalDb = await orderPage.getTotalOrder();
          const expTotalDb = subtotalDb + shippingRateDb + taxDb;
          expect(totalDb).toEqual(dbCurrencySymbol + expTotalDb);
        },
      );

      await test.step(
        "Switch sang storefront currency và kiểm tra thông tin order" + "theo storefront currency = EUR",
        async () => {
          await orderPage.switchCurrency();

          const prodPriceDb = await orderPage.getOriginProdPrice(productName);
          expect(prodPriceDb).toEqual(sfCurrencySymbol + prodPriceSf);

          const shippingRateDb = await orderPage.getShippingFee();
          expect(shippingRateDb).toEqual(sfCurrencySymbol + shippingSf);

          const subtotalDb = await orderPage.getSubtotalOrder();
          expect(subtotalDb).toEqual(sfCurrencySymbol + subtotalSf);

          const totalDb = await orderPage.getTotalOrder();
          const expTotalDb = subtotalDb + shippingRateDb;
          expect(totalDb).toEqual(dbCurrencySymbol + expTotalDb);
        },
      );
    },
  );

  // eslint-disable-next-line max-len
  test("Kiểm tra thanh toán thành công khi Buyer thanh toán qua cổng paypal với currency không support @TC_SB_OLS_THE_INS_CRC_401", async () => {
    orderPage = await checkoutPage.openOrderByAPI(orderId, accessToken);
    await test.step("Kiểm tra order detail", async () => {
      const prodPriceDb = await orderPage.getOriginProdPrice(productName);
      expect(prodPriceDb).toEqual(dbCurrencySymbol + prodPriceSf);

      const shippingRateDb = await orderPage.getShippingFee();
      expect(shippingRateDb).toEqual(dbCurrencySymbol + shippingSf);

      const subtotalDb = await orderPage.getSubtotalOrder();
      expect(subtotalDb).toEqual(dbCurrencySymbol + subtotalSf);

      const totalDb = await orderPage.getTotalOrder();
      const expTotalDb = subtotalDb + shippingRateDb;
      expect(totalDb).toEqual(dbCurrencySymbol + expTotalDb);
    });
  });
});
