import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Kiểm tra hiển thị đúng ảnh variant sản phẩm", () => {
  test("Kiểm tra hiển thị đúng ảnh variant sản phẩm khi buyer checkout thành công @TC_SB_CHE_STR_79", async ({
    page,
    conf,
  }) => {
    const homepage = new SFCheckout(page, conf.suiteConf.domain);
    await test.step("Buyer add to cart sản phẩm ở màn hình store font", async () => {
      await homepage.goto("/search");
      await homepage.searchProduct(conf.suiteConf.product.name);
      await page.click(`//span[text()='${conf.suiteConf.product.name}']//ancestor::a`);
      await page.click("//div[@class='flex flex-wrap align-center']/descendant::img[2]");
      await page.fill(`(//input[@class='quantity__num'])[1]`, conf.suiteConf.product.quantity);
      await page.click("//span[text()='Add to cart']//ancestor::button");
      await page.waitForNavigation({ waitUntil: "networkidle" });
      /***** Hiển thị đúng ảnh variant sản phẩm ******/
      expect(await page.screenshot()).toMatchSnapshot("variant-picture.png");
    });
    await test.step("Buyer check out sản phẩm ở màn hình store font", async () => {
      await page.click(`//button[normalize-space()='Checkout']`);
      await page.waitForSelector("#checkout-layout-loader");
      await page.waitForNavigation({ waitUntil: "networkidle" });
      /***** Hiển thị đúng ảnh variant sản phẩm ******/
      expect(await page.screenshot()).toMatchSnapshot("variant-checkout.png");
    });
    await test.step("Buyer nhập thông tin shipping, payment method sau đó complete order", async () => {
      await homepage.enterShippingAddress(conf.suiteConf.customer_info);
      await homepage.continueToPaymentMethod();
      await homepage.completeOrderWithCardInfo(conf.suiteConf.card_info);
      /***** Hiển thị đúng ảnh variant sản phẩm ******/
      expect(await page.screenshot()).toMatchSnapshot("variant-checkoutComplete.png");
    });
    const orderName = (await page.innerText("//div[@class='os-order-number']")).replace("Order ", "");

    await test.step("Buyer open email", async () => {
      const checkout = new SFCheckout(page, conf.suiteConf.shop_name, "");
      const mailbox = await checkout.openMailBox(conf.suiteConf.customer_info.email);
      await mailbox.openOrderConfirmationNotification(orderName);
      /***** Hiển thị đúng ảnh variant sản phẩm ******/
      expect(await page.screenshot()).toMatchSnapshot("variant-emailBuyer.png");
    });
  });
});
