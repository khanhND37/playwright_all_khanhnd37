import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { getProxyPageByCountry } from "@core/utils/proxy_page";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { dataCurrencyOfCountry } from "@pages/dashboard/settings/global-market/global-market-list";
import { SFCartv3 } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrderAfterCheckoutInfo } from "@types";

test.describe("Verify checkout cổng stripe với currency theo location buyer", async () => {
  let marketPage: GlobalMarketAddPage,
    checkoutPage: SFCheckout,
    homePage: SFHome,
    sfProductPage: SFProduct,
    cartPage: SFCartv3,
    expectedPriceProduct: string,
    expectedComparePriceProduct: string,
    orderSummaryInfo: OrderAfterCheckoutInfo,
    orderPage: OrdersPage,
    dataCountry: dataCurrencyOfCountry;

  test(`@SB_SET_GM_MC_266 Kiểm tra auto select country (United States, United Kingdom, Canada), currency theo location của buyer khi buyer truy cập sf và checkout product qua cổng Stripe`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.slow();
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const cardInfo = suiteConf.card_info;
    const retry = suiteConf.retry;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    sfProductPage = new SFProduct(dashboard, suiteConf.domain);
    for (const country of caseConf.countries) {
      await test.step(`Pre-condition: get auto rate`, async () => {
        {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          const expectedPrice = await marketPage.convertPriceToMarket(country.country_name, caseConf.product.price);
          const expectedComparePrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product.compare_price,
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
        sfProductPage = new SFProduct(proxyPage, suiteConf.domain);
        cartPage = new SFCartv3(proxyPage, suiteConf.domain);
        orderPage = new OrdersPage(dashboard, suiteConf.domain);

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

      await test.step(`Mở trang detail product A`, async () => {
        await checkoutPage.goto(`https://${suiteConf.domain}/products/${caseConf.product.handle}`);
        await checkoutPage.page.waitForSelector(sfProductPage.xpathProductDetailV3.price);
        const priceVisible = await sfProductPage.page.innerText(sfProductPage.xpathProductDetailV3.price);
        const price = await checkoutPage.getPriceProductIgnoreCurrency(priceVisible);
        const comparePriceVisible = await checkoutPage.getPriceProductIgnoreCurrency(
          await sfProductPage.page.innerText(sfProductPage.xpathProductDetailV3.comparePrice),
        );
        expect(price).toEqual(expectedPriceProduct);
        expect(comparePriceVisible).toEqual(expectedComparePriceProduct);
        expect(priceVisible.toLocaleUpperCase()).toContain(country.currency_symbol);
      });

      await test.step(`Add to cart Product vừa chọn > Open cart và Mini cart > Verify Price's currency của Product vừa chọn trong Cart và Mini cart`, async () => {
        await checkoutPage.page.waitForSelector(sfProductPage.xpathVariantsSelector);
        await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await checkoutPage.waitAbit(10 * 1000); // đợi để page ổn định sau đó mới click btn add to cart
        await checkoutPage.genLoc(sfProductPage.xpathBtnAddToCart).first().click();
        await checkoutPage.page.waitForResponse(res => res.url().includes("cart.json") && res.status() === 200);
        await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await checkoutPage.page.waitForSelector(checkoutPage.xpathPPPopupSummary);

        // verify in cart drawer
        const productInCartDrawer = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
          "small",
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartDrawer.price)).toEqual(
          expectedPriceProduct,
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartDrawer.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCartDrawer.price.toLocaleUpperCase()).toContain(country.currency_symbol);

        // verify in cart page
        await checkoutPage.genLoc(cartPage.getXpathWithLabel("Go to cart")).click();
        await checkoutPage.page.waitForURL(new RegExp("/cart"));
        try {
          await expect(checkoutPage.genLoc(cartPage.xpathProductsInCartv3)).toBeVisible({ timeout: 15000 });
        } catch (error) {
          checkoutPage.page.reload();
          await checkoutPage.page.waitForLoadState("networkidle");
          await expect(checkoutPage.genLoc(cartPage.xpathProductsInCartv3)).toBeVisible({ timeout: 15000 });
        }

        const productInCartPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
          "large",
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartPage.price)).toEqual(expectedPriceProduct);
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartPage.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCartPage.price.toLocaleUpperCase()).toContain(country.currency_symbol);

        const subTotal = await cartPage.getSubTotalV3();
        expect(subTotal).toEqual(expectedPriceProduct);
      });

      await test.step(`Verify Price's currency trên trang Checkout`, async () => {
        await checkoutPage.genLoc(cartPage.getXpathWithLabel("Checkout")).click();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
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

      await test.step(`Checkout Product qua cổng stripe > Verify Price's currency của Product trên trang Thankyou`, async () => {
        await checkoutPage.page.waitForSelector(checkoutPage.xpathDroplistCountry);
        await checkoutPage.enterShippingAddress(suiteConf.customer_info);
        await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
        await checkoutPage.waitAbit(1000); //wait for Card visible
        await checkoutPage.inputCardInfoAndCompleteOrder(
          cardInfo.number,
          cardInfo.holder_name,
          cardInfo.expire_date,
          cardInfo.cvv,
        );
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
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

  test(`@SB_SET_GM_MC_267 Kiểm tra auto select country (Germany, Brazil), currency theo location của buyer khi buyer truy cập sf và checkout product qua cổng Stripe`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.slow();
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const cardInfo = suiteConf.card_info;
    const retry = suiteConf.retry;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    sfProductPage = new SFProduct(dashboard, suiteConf.domain);

    for (const country of caseConf.countries) {
      await test.step(`Pre-condition: get auto rate`, async () => {
        {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          const expectedPrice = await marketPage.convertPriceToMarket(country.country_name, caseConf.product.price);
          const expectedComparePrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product.compare_price,
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
        sfProductPage = new SFProduct(proxyPage, suiteConf.domain);
        cartPage = new SFCartv3(proxyPage, suiteConf.domain);
        orderPage = new OrdersPage(dashboard, suiteConf.domain);

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

      await test.step(`Mở trang detail product A`, async () => {
        await checkoutPage.goto(`https://${suiteConf.domain}/products/${caseConf.product.handle}`);
        await checkoutPage.page.waitForSelector(sfProductPage.xpathProductDetailV3.price);
        const priceVisible = await sfProductPage.page.innerText(sfProductPage.xpathProductDetailV3.price);
        const price = await checkoutPage.getPriceProductIgnoreCurrency(priceVisible);
        const comparePriceVisible = await checkoutPage.getPriceProductIgnoreCurrency(
          await sfProductPage.page.innerText(sfProductPage.xpathProductDetailV3.comparePrice),
        );

        expect(price).toEqual(expectedPriceProduct);
        expect(comparePriceVisible).toEqual(expectedComparePriceProduct);
        expect(priceVisible.toLocaleUpperCase()).toContain(country.currency_symbol);
      });

      await test.step(`Add to cart Product vừa chọn > Open cart và Mini cart > Verify Price's currency của Product vừa chọn trong Cart và Mini cart`, async () => {
        await checkoutPage.page.waitForSelector(sfProductPage.xpathVariantsSelector);
        await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await checkoutPage.waitAbit(10 * 1000); // đợi để page ổn định sau đó mới click btn add to cart
        await checkoutPage.genLoc(sfProductPage.xpathBtnAddToCart).first().click();
        await checkoutPage.page.waitForResponse(res => res.url().includes("cart.json") && res.status() === 200);
        await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await checkoutPage.page.waitForSelector(checkoutPage.xpathPPPopupSummary);

        // verify in cart drawer
        const productInCartDrawer = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
          "small",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartDrawer.price)).toEqual(
          expectedPriceProduct,
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartDrawer.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCartDrawer.price.toLocaleUpperCase()).toContain(country.currency_symbol);

        // verify in cart page
        await checkoutPage.genLoc(cartPage.getXpathWithLabel("Go to cart")).click();
        await checkoutPage.page.waitForURL(new RegExp("/cart"));
        try {
          await expect(checkoutPage.genLoc(cartPage.xpathProductsInCartv3)).toBeVisible({ timeout: 15000 });
        } catch (error) {
          checkoutPage.page.reload();
          await checkoutPage.page.waitForLoadState("networkidle");
          await expect(checkoutPage.genLoc(cartPage.xpathProductsInCartv3)).toBeVisible({ timeout: 15000 });
        }

        const productInCartPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
          "large",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartPage.price)).toEqual(expectedPriceProduct);
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartPage.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCartPage.price.toLocaleUpperCase()).toContain(country.currency_symbol);

        const subTotal = await cartPage.getSubTotalV3();
        expect(subTotal).toEqual(expectedPriceProduct);
      });

      await test.step(`Verify Price's currency trên trang Checkout`, async () => {
        await checkoutPage.genLoc(cartPage.getXpathWithLabel("Checkout")).click();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
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

      await test.step(`Checkout Product qua cổng stripe > Verify Price's currency của Product trên trang Thankyou`, async () => {
        await checkoutPage.page.waitForSelector(checkoutPage.xpathDroplistCountry);
        await checkoutPage.enterShippingAddress(suiteConf.customer_info);
        await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
        await checkoutPage.waitAbit(1000); //wait for Card visible
        await checkoutPage.inputCardInfoAndCompleteOrder(
          cardInfo.number,
          cardInfo.holder_name,
          cardInfo.expire_date,
          cardInfo.cvv,
        );
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
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

  test(`@SB_SET_GM_MC_268 Kiểm tra auto select country (India, Sweden), currency theo location của buyer khi buyer truy cập sf và checkout product qua cổng Stripe`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    test.slow();
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const cardInfo = suiteConf.card_info;
    const retry = suiteConf.retry;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    sfProductPage = new SFProduct(dashboard, suiteConf.domain);

    for (const country of caseConf.countries) {
      await test.step(`Pre-condition: get auto rate`, async () => {
        {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          const expectedPrice = await marketPage.convertPriceToMarket(country.country_name, caseConf.product.price);
          const expectedComparePrice = await marketPage.convertPriceToMarket(
            country.country_name,
            caseConf.product.compare_price,
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
        sfProductPage = new SFProduct(proxyPage, suiteConf.domain);
        cartPage = new SFCartv3(proxyPage, suiteConf.domain);
        orderPage = new OrdersPage(dashboard, suiteConf.domain);

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

      await test.step(`Mở trang detail product A`, async () => {
        await checkoutPage.goto(`https://${suiteConf.domain}/products/${caseConf.product.handle}`);
        await checkoutPage.page.waitForSelector(sfProductPage.xpathProductDetailV3.price);
        const priceVisible = await sfProductPage.page.innerText(sfProductPage.xpathProductDetailV3.price);
        const price = await checkoutPage.getPriceProductIgnoreCurrency(priceVisible);
        const comparePriceVisible = await checkoutPage.getPriceProductIgnoreCurrency(
          await sfProductPage.page.innerText(sfProductPage.xpathProductDetailV3.comparePrice),
        );

        expect(price).toEqual(expectedPriceProduct);
        expect(comparePriceVisible).toEqual(expectedComparePriceProduct);
        expect(priceVisible.toLocaleUpperCase()).toContain(country.currency_symbol);
      });

      await test.step(`Add to cart Product vừa chọn > Open cart và Mini cart > Verify Price's currency của Product vừa chọn trong Cart và Mini cart`, async () => {
        await checkoutPage.page.waitForSelector(sfProductPage.xpathVariantsSelector);
        await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await checkoutPage.waitAbit(10 * 1000); // đợi để page ổn định sau đó mới click btn add to cart
        await checkoutPage.genLoc(sfProductPage.xpathBtnAddToCart).first().click();
        await checkoutPage.page.waitForResponse(res => res.url().includes("cart.json") && res.status() === 200);
        await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await checkoutPage.page.waitForSelector(checkoutPage.xpathPPPopupSummary);

        // verify in cart drawer
        const productInCartDrawer = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
          "small",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartDrawer.price)).toEqual(
          expectedPriceProduct,
        );
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartDrawer.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCartDrawer.price.toLocaleUpperCase()).toContain(country.currency_symbol);

        // verify in cart page
        await checkoutPage.genLoc(cartPage.getXpathWithLabel("Go to cart")).click();
        await checkoutPage.page.waitForURL(new RegExp("/cart"));
        try {
          await expect(checkoutPage.genLoc(cartPage.xpathProductsInCartv3)).toBeVisible({ timeout: 15000 });
        } catch (error) {
          checkoutPage.page.reload();
          await checkoutPage.page.waitForLoadState("networkidle");
          await expect(checkoutPage.genLoc(cartPage.xpathProductsInCartv3)).toBeVisible({ timeout: 15000 });
        }

        const productInCartPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
          "large",
        );

        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartPage.price)).toEqual(expectedPriceProduct);
        expect(await checkoutPage.getPriceProductIgnoreCurrency(productInCartPage.comparePrice)).toEqual(
          expectedComparePriceProduct,
        );
        expect(productInCartPage.price.toLocaleUpperCase()).toContain(country.currency_symbol);

        const subTotal = await cartPage.getSubTotalV3();
        expect(subTotal).toEqual(expectedPriceProduct);
      });

      await test.step(`Verify Price's currency trên trang Checkout`, async () => {
        await checkoutPage.genLoc(cartPage.getXpathWithLabel("Checkout")).click();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
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

      await test.step(`Checkout Product qua cổng stripe > Verify Price's currency của Product trên trang Thankyou`, async () => {
        await checkoutPage.page.waitForSelector(checkoutPage.xpathDroplistCountry);
        await checkoutPage.enterShippingAddress(suiteConf.customer_info);
        await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
        await checkoutPage.waitAbit(1000); //wait for Card visible
        await checkoutPage.inputCardInfoAndCompleteOrder(
          cardInfo.number,
          cardInfo.holder_name,
          cardInfo.expire_date,
          cardInfo.cvv,
        );
        const productInCheckoutPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          caseConf.product.name,
          caseConf.product.variant,
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
