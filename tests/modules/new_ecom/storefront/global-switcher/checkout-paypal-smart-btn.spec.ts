import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { getProxyPageByCountry } from "@core/utils/proxy_page";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { dataCurrencyOfCountry } from "@pages/dashboard/settings/global-market/global-market-list";
import { SFCartv3 } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { OrderAfterCheckoutInfo } from "@types";

test.describe("Verify checkout cổng Paypal setting smart button với currency theo location buyer", async () => {
  let marketPage: GlobalMarketAddPage,
    checkoutPage: SFCheckout,
    homePage: SFHome,
    cartPage: SFCartv3,
    expectedPriceProduct: string,
    expectedComparePriceProduct: string,
    orderSummaryInfo: OrderAfterCheckoutInfo,
    orderPage: OrdersPage,
    dataCountry: dataCurrencyOfCountry,
    checkoutAPI: CheckoutAPI;

  test(`@SB_SET_GM_MC_272 Kiểm tra auto select country (United States, United Kingdom, Canada), currency theo location của buyer khi buyer truy cập sf và checkout product qua Paypal smart button`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.slow();
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const retry = suiteConf.retry;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    for (const country of caseConf.countries) {
      await test.step(`Pre-condition: get auto rate`, async () => {
        {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          const expectedPrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product_info.price,
          );
          const expectedComparePrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product_info.compare_price,
          );
          const currencyOptions = {
            style: "decimal",
            minimumFractionDigits: country.minimum_fraction_digits,
            maximumFractionDigits: country.maximum_fraction_digits,
          };

          expectedPriceProduct = expectedPrice.toLocaleString(country.language_code_country_code, currencyOptions);
          expectedComparePriceProduct = expectedComparePrice.toLocaleString(
            country.language_code_country_code,
            currencyOptions,
          );
        }
      });

      await test.step(`Truy cập SF của shop, click block Global switcher`, async () => {
        const proxyPage = await getProxyPageByCountry(country.country_code);
        await proxyPage.goto(`https://${suiteConf.domain}`);
        await proxyPage.waitForLoadState("networkidle");
        homePage = new SFHome(proxyPage, suiteConf.domain);
        checkoutPage = new SFCheckout(proxyPage, suiteConf.domain);
        cartPage = new SFCartv3(proxyPage, suiteConf.domain);
        orderPage = new OrdersPage(dashboard, suiteConf.domain);
        checkoutAPI = new CheckoutAPI(suiteConf.domain, authRequest, proxyPage);

        await homePage.genLoc(homePage.xpathBlockGlobalSwitcher).click();
        await homePage.page.waitForSelector(homePage.xpathGlobalSwitcher.xpathPopupGlobalSwitcher);

        await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathCountrySelected)).toContainText(
          country.country_name,
        );
        await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathLanguageOrCurrencySelected(2))).toContainText(
          country.currency_format,
        );
        await homePage.genLoc(homePage.xpathBtnWithLabel("Save")).click();
      });

      await test.step(`Add to cart product > go to checkout page > Verify Price's currency trên trang Checkout`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(conf.suiteConf.products_checkout);
        await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product_info.name,
          caseConf.product_info.variant,
          "small",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.price)).toEqual(
          expectedPriceProduct,
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCheckoutPage.price.toLocaleUpperCase()).toContain(country.currency_symbol);
      });

      await test.step(`Checkout Product qua paypal > Verify Price's currency của Product trên trang Thankyou`, async () => {
        await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
        await checkoutPage.completeOrderViaPPSmartButton(conf.suiteConf.paypal_account);

        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product_info.name,
          caseConf.product_info.variant,
          "small",
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.price)).toEqual(
          expectedPriceProduct,
        );
        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      });

      await test.step(`Tại Dashboard > Order > Order list > Mở order vừa checkout > Verify Price's currency`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order status
        await orderPage.reloadUntilOrdCapture("", retry);
        const statusOrd = await orderPage.getOrderStatus();
        expect(statusOrd).toBe("Paid");

        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        const expectedTotalConvertToStoreCurrency = orderSummaryInfo.totalSF / dataCountry.exchangeRateAuto;
        expect(isEqual(actTotalOrder, expectedTotalConvertToStoreCurrency, 0.01)).toBe(true);
      });

      const xpathSwitchCurrency = await orderPage.genLoc(orderPage.xpathBtnSwitchCurrency).isVisible();
      if (xpathSwitchCurrency) {
        await test.step(`Click "Switch currency" trong trường hợp currency checkout khác với store currency (USD)`, async () => {
          // Click button 'Switch currency'
          await orderPage.switchCurrency();
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

          const settingPrice = await orderPage.getInfoSwitchCurrency();
          const expectedExchangeRate = dataCountry.exchangeRateAuto.toFixed(4);
          expect(settingPrice.exchangeRate).toEqual(expectedExchangeRate);

          expect(settingPrice.priceAdjustment).toEqual(`${dataCountry.priceAddjustment}%`);
          if (dataCountry.isRouding) {
            expect(settingPrice.rounding).toEqual(dataCountry.rounding.toFixed(2));
          } else {
            expect(settingPrice.rounding).toEqual("-");
          }
        });
      }
    }
  });

  test(`@SB_SET_GM_MC_273 Kiểm tra auto select country (German, Brazil), currency theo location của buyer khi buyer truy cập sf và checkout product qua Paypal smart button`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.slow();
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const retry = suiteConf.retry;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    for (const country of caseConf.countries) {
      await test.step(`Pre-condition: get auto rate`, async () => {
        {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          const expectedPrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product_info.price,
          );
          const expectedComparePrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product_info.compare_price,
          );

          const currencyOptions = {
            style: "decimal",
            minimumFractionDigits: country.minimum_fraction_digits,
            maximumFractionDigits: country.maximum_fraction_digits,
          };

          expectedPriceProduct = expectedPrice.toLocaleString(country.language_code_country_code, currencyOptions);
          expectedComparePriceProduct = expectedComparePrice.toLocaleString(
            country.language_code_country_code,
            currencyOptions,
          );
        }
      });

      await test.step(`Truy cập SF của shop, click block Global switcher`, async () => {
        const proxyPage = await getProxyPageByCountry(country.country_code);
        await proxyPage.goto(`https://${suiteConf.domain}`);
        await proxyPage.waitForLoadState("networkidle");
        homePage = new SFHome(proxyPage, suiteConf.domain);
        checkoutPage = new SFCheckout(proxyPage, suiteConf.domain);
        cartPage = new SFCartv3(proxyPage, suiteConf.domain);
        orderPage = new OrdersPage(dashboard, suiteConf.domain);
        checkoutAPI = new CheckoutAPI(suiteConf.domain, authRequest, proxyPage);

        await homePage.genLoc(homePage.xpathBlockGlobalSwitcher).click();
        await homePage.page.waitForSelector(homePage.xpathGlobalSwitcher.xpathPopupGlobalSwitcher);

        await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathCountrySelected)).toContainText(
          country.country_name,
        );
        await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathLanguageOrCurrencySelected(2))).toContainText(
          country.currency_format,
        );
        await homePage.genLoc(homePage.xpathBtnWithLabel("Save")).click();
      });

      await test.step(`Add to cart product > go to checkout page > Verify Price's currency trên trang Checkout`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(conf.suiteConf.products_checkout);
        await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product_info.name,
          caseConf.product_info.variant,
          "small",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.price)).toEqual(
          expectedPriceProduct,
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCheckoutPage.price.toLocaleUpperCase()).toContain(country.currency_symbol);
      });

      await test.step(`Checkout Product qua paypal > Verify Price's currency của Product trên trang Thankyou`, async () => {
        await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
        await checkoutPage.completeOrderViaPPSmartButton(conf.suiteConf.paypal_account);

        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product_info.name,
          caseConf.product_info.variant,
          "small",
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.price)).toEqual(
          expectedPriceProduct,
        );
        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      });

      await test.step(`Tại Dashboard > Order > Order list > Mở order vừa checkout > Verify Price's currency`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order status
        await orderPage.reloadUntilOrdCapture("", retry);
        const statusOrd = await orderPage.getOrderStatus();
        expect(statusOrd).toBe("Paid");

        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        const expectedTotalConvertToStoreCurrency = orderSummaryInfo.totalSF / dataCountry.exchangeRateAuto;
        expect(isEqual(actTotalOrder, expectedTotalConvertToStoreCurrency, 0.01)).toBe(true);
      });

      const xpathSwitchCurrency = await orderPage.genLoc(orderPage.xpathBtnSwitchCurrency).isVisible();
      if (xpathSwitchCurrency) {
        await test.step(`Click "Switch currency" trong trường hợp currency checkout khác với store currency (USD)`, async () => {
          // Click button 'Switch currency'
          await orderPage.switchCurrency();
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

          const settingPrice = await orderPage.getInfoSwitchCurrency();
          const expectedExchangeRate = dataCountry.exchangeRateAuto.toFixed(4);
          expect(settingPrice.exchangeRate).toEqual(expectedExchangeRate);

          expect(settingPrice.priceAdjustment).toEqual(`${dataCountry.priceAddjustment}%`);
          if (dataCountry.isRouding) {
            expect(settingPrice.rounding).toEqual(dataCountry.rounding.toFixed(2));
          } else {
            expect(settingPrice.rounding).toEqual("-");
          }
        });
      }
    }
  });

  test(`@SB_SET_GM_MC_274 Kiểm tra auto select country (India, Sweden), currency theo location của buyer khi buyer truy cập sf và checkout product qua Paypal smart button`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.slow();
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const retry = suiteConf.retry;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    for (const country of caseConf.countries) {
      await test.step(`Pre-condition: get auto rate`, async () => {
        {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          const expectedPrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product_info.price,
          );
          const expectedComparePrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product_info.compare_price,
          );

          const currencyOptions = {
            style: "decimal",
            minimumFractionDigits: country.minimum_fraction_digits,
            maximumFractionDigits: country.maximum_fraction_digits,
          };

          expectedPriceProduct = expectedPrice.toLocaleString(country.language_code_country_code, currencyOptions);
          expectedComparePriceProduct = expectedComparePrice.toLocaleString(
            country.language_code_country_code,
            currencyOptions,
          );
        }
      });

      await test.step(`Truy cập SF của shop, click block Global switcher`, async () => {
        const proxyPage = await getProxyPageByCountry(country.country_code);
        await proxyPage.goto(`https://${suiteConf.domain}`);
        await proxyPage.waitForLoadState("networkidle");
        homePage = new SFHome(proxyPage, suiteConf.domain);
        checkoutPage = new SFCheckout(proxyPage, suiteConf.domain);
        cartPage = new SFCartv3(proxyPage, suiteConf.domain);
        orderPage = new OrdersPage(dashboard, suiteConf.domain);
        checkoutAPI = new CheckoutAPI(suiteConf.domain, authRequest, proxyPage);

        await homePage.genLoc(homePage.xpathBlockGlobalSwitcher).click();
        await homePage.page.waitForSelector(homePage.xpathGlobalSwitcher.xpathPopupGlobalSwitcher);

        await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathCountrySelected)).toContainText(
          country.country_name,
        );
        await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathLanguageOrCurrencySelected(2))).toContainText(
          country.currency_format,
        );
        await homePage.genLoc(homePage.xpathBtnWithLabel("Save")).click();
      });

      await test.step(`Add to cart product > go to checkout page > Verify Price's currency trên trang Checkout`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(conf.suiteConf.products_checkout);
        await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product_info.name,
          caseConf.product_info.variant,
          "small",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.price)).toEqual(
          expectedPriceProduct,
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCheckoutPage.price.toLocaleUpperCase()).toContain(country.currency_symbol);
      });

      await test.step(`Checkout Product qua paypal > Verify Price's currency của Product trên trang Thankyou`, async () => {
        await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
        await checkoutPage.completeOrderViaPPSmartButton(conf.suiteConf.paypal_account);

        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product_info.name,
          caseConf.product_info.variant,
          "small",
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCheckoutPage.price)).toEqual(
          expectedPriceProduct,
        );
        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      });

      await test.step(`Tại Dashboard > Order > Order list > Mở order vừa checkout > Verify Price's currency`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        // verify order status
        await orderPage.reloadUntilOrdCapture("", retry);
        const statusOrd = await orderPage.getOrderStatus();
        expect(statusOrd).toBe("Paid");

        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        const expectedTotalConvertToStoreCurrency = orderSummaryInfo.totalSF / dataCountry.exchangeRateAuto;
        expect(isEqual(actTotalOrder, expectedTotalConvertToStoreCurrency, 0.05)).toBe(true);
      });

      const xpathSwitchCurrency = await orderPage.genLoc(orderPage.xpathBtnSwitchCurrency).isVisible();
      if (xpathSwitchCurrency) {
        await test.step(`Click "Switch currency" trong trường hợp currency checkout khác với store currency (USD)`, async () => {
          // Click button 'Switch currency'
          await orderPage.switchCurrency();
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.05)).toBe(true);

          const settingPrice = await orderPage.getInfoSwitchCurrency();
          const expectedExchangeRate = dataCountry.exchangeRateAuto.toFixed(4);
          expect(settingPrice.exchangeRate).toEqual(expectedExchangeRate);

          expect(settingPrice.priceAdjustment).toEqual(`${dataCountry.priceAddjustment}%`);
          if (dataCountry.isRouding) {
            expect(settingPrice.rounding).toEqual(dataCountry.rounding.toFixed(2));
          } else {
            expect(settingPrice.rounding).toEqual("-");
          }
        });
      }
    }
  });
});