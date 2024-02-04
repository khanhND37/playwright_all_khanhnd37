import { expect, test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { loadData } from "@core/conf/conf";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAfterCheckoutInfo } from "@types";

test.describe("Order referrer info", () => {
  let homepageSF: SFHome;
  let productPage: SFProduct;
  let checkoutPage: SFCheckout;
  let orderPage: OrdersPage;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  test.beforeEach(async ({ conf, page }) => {
    homepageSF = new SFHome(page, conf.suiteConf.domain);
    productPage = new SFProduct(page, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, page }) => {
      await test.step("Order product thành công", async () => {
        await homepageSF.gotoProduct(caseData.product);
        await productPage.clickBuyNow();
        await page.waitForSelector(checkoutPage.xpathCheckOutContent);
        await checkoutPage.enterShippingAddress(conf.suiteConf.checkout_info);
        await checkoutPage.waitUntilElementVisible(checkoutPage.xpathShipLabel);
        await checkoutPage.selectShippingMethodWithNo("1");
        await checkoutPage.clickOnBtnWithLabel("Continue to payment method");
        await checkoutPage.waitUntilElementVisible(checkoutPage.xpathPaymentLabel);
        await checkoutPage.completeOrderWithCardInfo(conf.suiteConf.card);
        expect(checkoutPage.isThankyouPage()).toBeTruthy();
      });

      await test.step("- Open order vừa tạo" + "- Trong block 'Conversion summary'>> click View", async () => {
        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

        orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
        let isVisibleBtnConversionDetail;
        do {
          //wait block view conversion display
          await orderPage.page.waitForTimeout(3000);
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          isVisibleBtnConversionDetail = await orderPage.page
            .locator(orderPage.xpathBtnViewConversionDetails)
            .isVisible();
        } while (isVisibleBtnConversionDetail == false);
        await orderPage.page.click(orderPage.xpathBtnViewConversionDetails);
        const textActivity =
          (await orderPage.getTextActivity(1, "//span")) + " " + (await orderPage.getTextActivity(2, "//span"));
        await expect(textActivity.trim()).toEqual(caseData.text_activity);
        const dateLocal = new Date();
        const longEnUSFormatter = new Intl.DateTimeFormat("en", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
        const dateActivity = await orderPage.getTextActivity(2);
        await expect(dateActivity).toEqual(longEnUSFormatter.format(dateLocal));
      });
    });
  }
});
