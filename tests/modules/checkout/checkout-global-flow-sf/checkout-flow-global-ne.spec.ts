import { expect, test } from "@fixtures/website_builder";
import { getProxyPageByCountry } from "@core/utils/proxy_page";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Product } from "@types";
import { SFCartv3 } from "@pages/storefront/cart";
import { removeCurrencySymbol } from "@core/utils/string";
import { loadData } from "@core/conf/conf";
import { SettingThemeAPI } from "@pages/api/themes_setting";

test.describe("Verify SF checkout flow global", async () => {
  let domain: string;
  let country,
    expectedPrice,
    priceProduct,
    priceProductCartDrawer,
    priceProductCOpage,
    priceProductCartPage,
    priceProductCartMini,
    themeSetting;
  let productCheckout: Product[];
  let marketPage: GlobalMarketAddPage;
  let homePage: SFHome;
  let productPage: SFProduct;
  let cartPage: SFCartv3;
  let themeSettingAPI: SettingThemeAPI;
  let themeId: number;

  const casesID = "SB_SET_GM_CO";
  const conf = loadData(__dirname, casesID);

  test.beforeEach(async ({ conf, dashboard, authRequest, theme }) => {
    domain = conf.suiteConf.domain;
    productCheckout = conf.suiteConf.products_checkout;
    country = conf.suiteConf.country;
    // Get auto rate
    marketPage = new GlobalMarketAddPage(dashboard, domain, authRequest);
    expectedPrice = await marketPage.convertPriceToMarket(country.country_name, productCheckout[0].price);
    expectedPrice = expectedPrice.toString().replace(".", ",");
    const proxyPage = await getProxyPageByCountry(country.country_code);
    homePage = new SFHome(proxyPage, domain);
    productPage = new SFProduct(proxyPage, domain);
    cartPage = new SFCartv3(proxyPage, domain);
    themeSettingAPI = new SettingThemeAPI(theme);
    themeSetting = conf.suiteConf.theme;
  });

  conf.caseConf.forEach(({ case_id: caseID, case_name: caseName, setting_checkout_form: settingCheckoutInfo }) => {
    test(`@${caseID} ${caseName}`, async ({ builder }) => {
      await test.step(`Pre conditions`, async () => {
        if (caseID == "SB_SET_GM_CSG_11") {
          themeId = themeSetting.trendie;
        } else {
          themeId = themeSetting.swiftWatch;
        }
        // Setting theme
        await themeSettingAPI.publishTheme(themeId);
        // Setting layout-checkout
        await builder.updateSettingCheckoutForm(themeId, settingCheckoutInfo);
      });

      await test.step(`Chọn 1 Product bất kỳ có giá trị gốc = $50 > Verify Price's currency của product đó`, async () => {
        await homePage.gotoHomePage();
        await homePage.selectStorefrontCurrencyNE(country.currency, country.country_name);
        await homePage.gotoProductDetail(productCheckout[0].handle);
        // verify price product in product page
        priceProduct = await productPage.getProductPriceSF();
        expect(priceProduct).toEqual(expectedPrice);
      });

      if (caseID == "SB_SET_GM_CSG_11") {
        await test.step(`- Click "Add to cart"- Verify Price's currency của Product vừa chọn trong Cart Page`, async () => {
          // verify price product in cart page
          await productPage.addToCart();
          await productPage.gotoCart();
          priceProductCartPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
            productCheckout[0].name,
            productCheckout[0].variant_title,
            "large",
          );
          expect(removeCurrencySymbol(priceProductCartPage.price).replace(".", ",")).toEqual(expectedPrice);
        });

        await test.step(`
        - Add to cart Product vừa chọn
        - Click Cart icon: Lúc này Mini Cart xuất hiện
        - Verify Price's currency của Product vừa chọn trong Mini Cart`, async () => {
          // verify price product in cart mini
          await homePage.genLoc(homePage.xpathCartIcon).click();
          const xpathPriceProductCartMini = productPage.xpathPriceProductInCartDrawer;
          priceProductCartMini = await homePage.page.locator(xpathPriceProductCartMini).first().textContent();
          expect(removeCurrencySymbol(priceProductCartMini).replace(".", ",")).toEqual(expectedPrice);
          await cartPage.genLoc(cartPage.xpathCheckoutBtn).click();
        });
      } else {
        await test.step(`
        - Add to cart Product vừa chọn
        - Click Cart icon: Lúc này Mini Drawer xuất hiện
        - Verify Price's currency của Product vừa chọn trong Cart Drawer`, async () => {
          // verify price product in cart drawer
          await productPage.addToCart();
          priceProductCartDrawer = await cartPage.getPriceProductInCartDrawerOrCartPage(
            productCheckout[0].name,
            productCheckout[0].variant_title,
            "small",
          );
          expect(removeCurrencySymbol(priceProductCartDrawer.price).replace(".", ",")).toEqual(expectedPrice);
        });

        await test.step(`- Click "Go to cart"- Verify Price's currency của Product vừa chọn trong Cart Page`, async () => {
          // verify price product in cart page
          await productPage.gotoCart();
          priceProductCartPage = await cartPage.getPriceProductInCartDrawerOrCartPage(
            productCheckout[0].name,
            productCheckout[0].variant_title,
            "large",
          );
          expect(removeCurrencySymbol(priceProductCartPage.price).replace(".", ",")).toEqual(expectedPrice);
          await cartPage.checkout();
        });
      }

      await test.step(`- Click btn Checkout - Verify Shipping Price's currency trên trang Checkout `, async () => {
        // verify price product in checkout page
        priceProductCOpage = await cartPage.getPriceProductInCartDrawerOrCartPage(
          productCheckout[0].name,
          productCheckout[0].variant_title,
          "small",
        );
        expect(removeCurrencySymbol(priceProductCOpage.price).replace(".", ",")).toEqual(expectedPrice);
      });
    });
  });
});
