import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Buyer thực hiện checkout khi setting phone optional", () => {
  test("[Shopbase]Kiểm tra phone number là optional khi checkout 3 page @TC_SB_PHONE_2 ", async ({
    page,
    conf,
    theme,
  }) => {
    const checkout = new SFCheckout(page, conf.suiteConf.domain);
    const settingTheme = new SettingThemeAPI(theme);
    await settingTheme.editCheckoutLayout("multi-step");
    await settingTheme.editCheckoutFormOptions({ phoneNumber: "optional" });
    await checkout.createStripeOrder(
      conf.suiteConf.product.name,
      conf.suiteConf.product.quantity,
      conf.suiteConf.customer_info,
      conf.suiteConf.discount.code,
      conf.suiteConf.card_info,
    );
    /***** Assertion checkout thành công, shipping address ko chứa phone *******/
    await test.step("Verify phone number when order successully", async () => {
      await expect(page.locator('//h2[normalize-space()="Thank you!"]')).toBeVisible();
      await expect(
        page.locator('//h3[text()="Shipping address"]/following-sibling::address/descendant::br[4]'),
      ).not.toBeVisible();
    });
  });

  test("[Shopbase]Kiểm tra phone number là required khi checkout 3 page @TC_SB_PHONE_1 ", async ({
    page,
    conf,
    theme,
  }) => {
    //pre-step
    const checkout = new SFCheckout(page, conf.suiteConf.domain);
    const settingTheme = new SettingThemeAPI(theme);
    await settingTheme.editCheckoutLayout("multi-step");
    await settingTheme.editCheckoutFormOptions({ phoneNumber: "required" });
    await checkout.goto("/search");
    await checkout.searchProduct(conf.suiteConf.product.name);
    await checkout.addProductToCart(conf.suiteConf.product.name, conf.suiteConf.product.quantity);
    await checkout.clickCheckoutBtn();

    /***** Assertion Display message: "please enter a phone number", hightight field phone number *******/
    await test.step("Verify display message and hightlight filed phonenumber khi nhập thông tin customer", async () => {
      await checkout.enterShippingAddress(conf.suiteConf.customer_info);
      await expect(page.locator('//p[text()="Please enter a phone number."]')).toBeVisible();
      await expect(page.locator('//input[@name="phone-number"]')).toHaveCSS("border", conf.suiteConf.border_css);
    });
  });
});
