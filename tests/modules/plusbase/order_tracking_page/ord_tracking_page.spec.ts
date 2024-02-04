import { expect, test } from "@fixtures/website_builder";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { SFCheckout } from "@pages/storefront/checkout";

let webPageStyle: WebPageStyle;
let sfCheckoutPage: SFCheckout;
test.describe("Order tracking page", () => {
  test.beforeEach(async ({ conf, dashboard }) => {
    webPageStyle = new WebPageStyle(dashboard, conf.suiteConf.domain);
    sfCheckoutPage = new SFCheckout(webPageStyle.page, conf.suiteConf.domain);
  });
  test(`@PLB_OTP_17 Verify block Order tracking được add vào Web Builder`, async ({ conf }) => {
    await test.step(`Vào dashboard > Online Store > chọn Pages > Tại Header bar, click Insert > Kéo block Order tracking vào khu vực page > Click Save`, async () => {
      await webPageStyle.openWebBuilder({ type: "page", id: conf.suiteConf.page_id });
      // Wait 3s chờ cho WB load hết ổn định
      await webPageStyle.waitAbit(3000);
      //Delete all block berfore verify
      const countBlock = await webPageStyle.frameLocator.locator(webPageStyle.xpathForgotOrd).count();
      if (countBlock > 0) {
        for (let i = 0; i < countBlock; i++) {
          await webPageStyle.frameLocator.locator(`(${webPageStyle.xpathForgotOrd})[1]`).click();
          await webPageStyle.selectOptionOnQuickBar("Delete");
        }
        await webPageStyle.clickBtnNavigationBar("save");
        expect(webPageStyle.isTextVisible("All changes are saved")).toBeTruthy();
      }

      await webPageStyle.dragAndDropInWebBuilder({
        from: {
          category: "Basics",
          template: "Order Tracking",
        },
        to: {
          position: conf.suiteConf.position,
          isBottom: false,
        },
      });

      await webPageStyle.clickBtnNavigationBar("save");
      expect(webPageStyle.isTextVisible("All changes are saved")).toBeTruthy();
    });

    await test.step(`Đi đến block ngoài SF > Input thông tin order > Click Find my order > Verify trang order confirmation`, async () => {
      await expect(async () => {
        await sfCheckoutPage.goto(`/pages/order-tracking-page-auto`);
        // Wait 2s chờ cho block ngoài SF load hết ổn định
        await sfCheckoutPage.waitAbit(2000);
        expect(sfCheckoutPage.isTextVisible("Thank you!")).toBeTruthy();
      }).toPass();
      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFillOrdName).fill(conf.caseConf.order_name);
      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFillEmail).fill(conf.caseConf.email);
      await sfCheckoutPage.clickOnBtnWithLabel("Find my orders");
      for (const shipmentStatus of conf.suiteConf.shipment_status) {
        expect(sfCheckoutPage.isTextVisible(shipmentStatus)).toBeTruthy();
      }
      expect(sfCheckoutPage.isTextVisible(conf.caseConf.email)).toBeTruthy();

      await expect(async () => {
        expect(await sfCheckoutPage.page.locator(sfCheckoutPage.xpathTrackingStep).count()).toBeGreaterThan(1);
      }).toPass();
      expect(
        (await sfCheckoutPage.getTextContent(`(${sfCheckoutPage.xpathTrackingStep})[1]`)).includes(`Delivered`),
      ).toBeTruthy();
    });
  });
});
