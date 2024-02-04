import { test } from "@core/fixtures";
import { getProxyPageByCountry } from "@core/utils/proxy_page";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Product } from "@types";
import { expect } from "@core/fixtures";
import { SFCart } from "@pages/storefront/cart";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Verify SF checkout flow global", async () => {
  let domain: string;
  let country,
    shippingAddress,
    expectedPrice,
    priceProduct,
    priceProductCartDrawer,
    priceProductCOpage,
    priceProductCartPage;
  let productCheckout: Product[];
  let marketPage: GlobalMarketAddPage;
  let homePage: SFHome;
  let productPage: SFProduct;
  let checkoutPage: SFCheckout;
  let cartPage: SFCart;

  test(`@SB_SET_GM_CSG_02 Check show currency đối với buyer có IP theo country được set up currency market với theme Inside, 1 page CO`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    await test.step(`Pre conditions`, async () => {
      // Get auto rate
      domain = conf.suiteConf.domain;
      productCheckout = conf.suiteConf.products_checkout;
      country = conf.suiteConf.country;
      shippingAddress = conf.suiteConf.shipping_address;
      marketPage = new GlobalMarketAddPage(dashboard, domain, authRequest);
      expectedPrice = await marketPage.convertPriceToMarket(country.country_name, productCheckout[0].price);
      expectedPrice = expectedPrice.toString().replace(".", ",");
      const proxyPage = await getProxyPageByCountry(country.country_code);
      homePage = new SFHome(proxyPage, domain);
      checkoutPage = new SFCheckout(proxyPage, domain);
      productPage = new SFProduct(proxyPage, domain);
      cartPage = new SFCart(proxyPage, domain);
    });

    await test.step(`Chọn 1 Product bất kỳ có giá trị gốc = $50 > Verify Price's currency của product đó`, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(shippingAddress.country_name, "inside");
      await homePage.gotoProductDetail(productCheckout[0].handle);
      // verify price product in product page
      priceProduct = await productPage.getProductPriceSF();
      expect(priceProduct).toEqual(expectedPrice);
    });

    await test.step(`- Add to cart Product vừa chọn- Click Cart icon: Lúc này Cart Draw xuất hiện- Verify Price's currency của Product vừa chọn trong Cart Draw`, async () => {
      // verify price product in cart drawer
      await productPage.addToCart();
      priceProductCartDrawer = await productPage.getPriceProductInCartDrawer();
      expect(priceProductCartDrawer).toEqual(expectedPrice);
    });

    await test.step(`- Click "Go to cart"- Verify Price's currency của Product vừa chọn trong Cart Page`, async () => {
      // verify price product in cart page
      await productPage.gotoCart();
      priceProductCartPage = await cartPage.getProductPriceWithoutCurrency(productCheckout[0].name);
      priceProductCartPage = (priceProductCartPage / 100).toString().replace(".", ",");
      expect(priceProductCartPage).toEqual(expectedPrice);
    });

    await test.step(`- Click btn Checkout - Verify Shipping Price's currency trên trang Checkout `, async () => {
      // verify price product in checkout page
      await cartPage.genLoc(cartPage.xpathCheckoutBtn).click();
      priceProductCOpage = await checkoutPage.getProductPrice(productCheckout[0].name);
      expect(removeCurrencySymbol(priceProductCOpage).replace(".", ",")).toEqual(expectedPrice);
    });
  });
});
