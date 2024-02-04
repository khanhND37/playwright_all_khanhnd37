import { expect, test } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Verify profit order plusbase được tính", async () => {
  test(`@SB_STD_02 Verify profit order plusbase được tính`, async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);

    let productPage: SFProduct;
    let checkoutPage: SFCheckout;
    let orderId: number;
    const domain = conf.suiteConf.domain;
    const ordersPage = new OrdersPage(dashboard, domain);

    await test.step("Mở SF > Add product to cart > Thực hiện checkout", async () => {
      const homepage = new SFHome(dashboard, domain);
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
      productPage = await homepage.searchThenViewProduct(conf.caseConf.product);
      await productPage.addProductToCart();
      checkoutPage = await productPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(conf.suiteConf.customer_info);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithCardInfo(conf.suiteConf.card_infor);
      await checkoutPage.addProductPostPurchase(null);
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();
      orderId = await checkoutPage.getOrderIdBySDK();
    });

    await test.step("Vào dashboard > Mở order detail > Verify profit đã được tính", async () => {
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.clickShowCalculation();
      expect(Number(removeCurrencySymbol(await ordersPage.getProfit()))).toBeGreaterThan(0);
    });
  });
});
