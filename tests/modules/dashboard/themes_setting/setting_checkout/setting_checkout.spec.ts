import { Page, expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ShopTheme } from "@types";

const verifyAFieldOnCheckoutPageIsVisible = async (page: Page, fieldName: string, checkVisible = true) => {
  const locator = page.getByRole("textbox", { name: fieldName });
  if (checkVisible) {
    await expect(locator).toBeVisible();
  } else {
    await expect(locator).toBeHidden();
  }
};

test.describe("Move setting checkout to theme", () => {
  let checkoutAPI: CheckoutAPI;
  let checkoutPage: SFCheckout;
  let themeSetting: SettingThemeAPI;
  let hiddenFieldList: Array<string>;
  let visibleFieldList: Array<string>;
  let productCheckout, domain;
  let themeInfoDefault, themeSettingInfo: ShopTheme;

  test.beforeAll(async ({ token, conf, theme }) => {
    domain = conf.suiteConf.domain;
    themeSetting = new SettingThemeAPI(theme);
    await token.getWithCredentials({
      domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    productCheckout = conf.suiteConf.products_checkout;
    themeInfoDefault = await themeSetting.editCheckoutLayout("multi-step");
  });

  // pre-condition: Created a checkout and add shipping info, then go to payment method page
  test.beforeEach(async ({ authRequest, page }) => {
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    await checkoutAPI.addProductToCartThenCheckout(productCheckout);
  });

  test.afterEach(async () => {
    await themeSetting.editCheckoutLayout("multi-step", themeInfoDefault);
  });

  test(`@SB_OLS_THE_TSC_6 Shopbase: Kiểm tra thay đổi tại trang checkout khi thay đổi setting Form options trong theme`, async ({
    page,
    conf,
  }) => {
    test.slow(); // Increase test timeout
    const shippingAdress1 = conf.caseConf.shippingAdress1;
    const shippingAdress2 = conf.caseConf.shippingAdress2;
    const shippingAdress3 = conf.caseConf.shippingAdress3;

    await test.step(`- Thực hiện thay đổi trạng thái require mỗi trường.
      - Reopen/ reload lại link check out đc tạo trước đó > Kiểm tra form checkout`, async () => {
      await themeSetting.editCheckoutLayout("multi-step");
      await themeSetting.editCheckoutFormOptions({
        fullName: "Require last name only",
        companyName: "hidden",
        addressLine2: "optional",
        phoneNumber: "required",
      });
      await checkoutAPI.openCheckoutPageByToken();
      /**
        Tại Shipping address:
        - Box "First name" hiển thị "(optional)"
        - Không có box "Company name"
        - Box "Apartment, suite, etc." hiển thị "(optional)"
       */
      /**
        - Các textbox còn lại (Email; Last name; Address; Zip Code; City; Country; Phone number) required
         (không có note (optional))
      */
      hiddenFieldList = ["Company name"];
      visibleFieldList = [
        "First name (optional)",
        "Apartment, suite, etc. (optional)",
        "Phone number",
        "Email",
        "Last name",
        "Address",
        "City",
      ];
      for (const field of hiddenFieldList) {
        await verifyAFieldOnCheckoutPageIsVisible(page, field, false);
      }
      for (const field of visibleFieldList) {
        await verifyAFieldOnCheckoutPageIsVisible(page, field, true);
      }
    });

    await test.step(`Thực hiện điền thông tin vào các field không optional và complete order`, async () => {
      await checkoutPage.enterShippingAddress(shippingAdress1);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod();
      /**
        - Vẫn tạo order thành công, không báo lỗi.
       */
      expect(await checkoutPage.isThankyouPage()).toBe(true);
    });

    await test.step(`
      - Thực hiện thay đổi trạng thái require mỗi trường.
      - Tạo check out mới > Kiểm tra form checkout`, async () => {
      await themeSetting.editCheckoutFormOptions({
        fullName: "Require first and last name",
        companyName: "required",
        addressLine2: "hidden",
        phoneNumber: "optional",
      });
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();
      /**
        Tại Shipping address:
        - Không có box "Apartment, suite, etc."
        - Box "Phone number" hiển thị "(optional)"
      */
      /**
        - Các textbox còn lại (Email;  First name; Last name; Address; Company name; Zip Code; City; Country) required
         (không có note (optional))
       */
      hiddenFieldList = ["Apartment, suite, etc."];
      visibleFieldList = [
        "Phone number (optional)",
        "Email",
        "First name",
        "Last name",
        "Address",
        "Company name",
        "City",
      ];
      for (const field of hiddenFieldList) {
        await verifyAFieldOnCheckoutPageIsVisible(page, field, false);
      }
      for (const field of visibleFieldList) {
        await verifyAFieldOnCheckoutPageIsVisible(page, field, true);
      }
    });

    await test.step(`Thực hiện điền thông tin vào các field không optional và complete order`, async () => {
      await checkoutPage.enterShippingAddress(shippingAdress2);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod();
      /**
        - Vẫn tạo order thành công, không báo lỗi.
       */
      expect(await checkoutPage.isThankyouPage()).toBe(true);
    });

    await test.step(`Thực hiện điền thông tin vào đầy đủ các field và complete order`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.enterShippingAddress(shippingAdress3);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod();
      /**
        - Vẫn tạo order thành công, không báo lỗi.
       */
      expect(await checkoutPage.isThankyouPage()).toBe(true);
    });

    await test.step(`- Tạo check out mới > Kiểm tra form checkout
      - Không nhập gì cả để kiểm tra msg required`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.clickOnBtnWithLabel("Continue to shipping method");
      /**
       * - Báo msg required tại các textbox còn lại
       * (Email; First name; Last name; Address; Company name; Zip Code; City)
       */
      expect(await checkoutPage.isErrorMsgVisible("Please enter an email.")).toBe(true);

      await checkoutPage.inputEmail(shippingAdress3.email);
      await checkoutPage.selectCountry(shippingAdress3.country);
      await checkoutPage.clickOnBtnWithLabel("Continue to shipping method");
      const listFieldRequired = ["First name", "Last name", "Address", "Company name", "Zip Code", "City", "State"];
      for (const requiredField of listFieldRequired) {
        expect(await checkoutPage.isRequiredMsgVisible(requiredField)).toBe(true);
      }
    });
  });

  test(`@SB_OLS_THE_TSC_7 Shopbase: Kiểm tra thay đổi tại trang checkout khi thay đổi setting Billing address, Shipping method, Checkout note trong theme`, async ({
    page,
  }) => {
    await test.step(`- Thực hiện thay đổi trạng thái setting.
      - Reopen/ reload lại link check out đc tạo trước đó > Kiểm tra form checkout`, async () => {
      themeSettingInfo = await themeSetting.editCheckoutLayout("one-page");
      themeSettingInfo = await themeSetting.editCheckoutBillingAddress(true, themeSettingInfo);
      themeSettingInfo = await themeSetting.editCheckoutShippingMethod(true, themeSettingInfo);
      themeSettingInfo = await themeSetting.editCheckoutCheckoutNote(false, themeSettingInfo);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.selectCountry("United States");
      await checkoutPage.selectStateOrProvince("Alabama");
      /**
          - Billing address: mặc định chọn "Same as shipping address"
          - Shipping method: Hiển thị tất cả shipping method
          - Không có filed Customer's note
         */
      await expect(page.locator("//textarea[@name='customer-note']")).toBeHidden();
      expect(await checkoutPage.isTickBoxChecked({ textLabel: "Same as shipping address" })).toBe(true);
      await page.locator(checkoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      await page.waitForSelector(
        `(//*[contains(@class,'shipping-method__amount') or @class='shipping-selector__amount'])[1]`,
      );
      await expect(page.locator("//div[@class='shipping-selector']/span[normalize-space()='Change']")).toBeHidden();
    });

    await test.step(`- Thực hiện thay đổi trạng thái setting.
      - Reopen/ reload lại link check out đc tạo trước đó > Kiểm tra form checkout`, async () => {
      themeSettingInfo = await themeSetting.editCheckoutBillingAddress(false, themeSettingInfo);
      themeSettingInfo = await themeSetting.editCheckoutShippingMethod(false, themeSettingInfo);
      await themeSetting.editCheckoutCheckoutNote(true, themeSettingInfo);
      await checkoutAPI.openCheckoutPageByToken();
      await page.reload({ waitUntil: "networkidle" });
      await checkoutPage.selectCountry("United States");
      await checkoutPage.selectStateOrProvince("Alabama");
      /**
          - Billing address: mặc định chọn "Use a different billing address"
          - Shipping method: Chỉ hiển thị default 1 method. Có link text "(Change)" để show all method.
          - Show field Customer's note
         */
      expect(await page.locator("//textarea[@name='customer-note']").count()).toBe(1);
      expect(await checkoutPage.isTickBoxChecked({ textLabel: "Use a different billing address" })).toBe(true);
      await page.getByRole("button", { name: "Place your order" }).hover();
      await page.locator(`//span[normalize-space()='Payment']`).scrollIntoViewIfNeeded();
      await page.waitForSelector(
        `(//*[contains(@class,'shipping-method__amount') or @class='shipping-selector__amount'])[1]`,
      );
      expect(await page.locator("//div[@class='shipping-selector']/span[normalize-space()='Change']").count()).toBe(1);
    });
  });

  test(`@SB_OLS_THE_TSC_9 Shopbase: Kiểm tra thay đổi tại trang checkout khi thay đổi setting Legal & Payments trong theme`, async ({
    page,
    conf,
  }) => {
    await test.step(`- Thay đổi setting trong theme
        - Reopen/ reload lại link check out đc tạo trước đó > Kiểm tra form checkout`, async () => {
      themeSettingInfo = await themeSetting.editCheckoutLayout("one-page");
      themeSettingInfo = await themeSetting.editCheckoutBillingAddress(true, themeSettingInfo);
      await themeSetting.editCheckoutLegal(
        {
          termAgreement: {
            showToS: false,
          },
          marketingConsent: {
            emailMkt: {
              showCheckbox: true,
              preCheck: true,
            },
            smsMkt: {
              showCheckbox: true,
              preCheck: true,
            },
          },
        },
        themeSettingInfo,
      );
      await themeSetting.enablePaypalExpressBtn(true, themeSettingInfo);
      await checkoutAPI.openCheckoutPageByToken();
      /**
        - Không show ToS "I have read and agree to the Terms of service"
        - Show text "Keep me up-to-date on the order progress and exclusive offers via text messages",
        với checkbox được ticked
        - Show text "Keep me up-to-date on the order progress and exclusive offers via Email", với checkbox được ticked
        - Show btn Paypal Express
        */
      await page.locator(`//div[@class="main__footer"]`).scrollIntoViewIfNeeded();
      await expect(page.locator("//span[@class='tos']")).toBeHidden();
      expect(
        await checkoutPage.isTickBoxChecked({
          textLabel: `Keep me up-to-date on the order progress and exclusive offers from ${conf.suiteConf.shop_name} via text messages`,
        }),
      ).toBe(true);
      expect(
        await checkoutPage.isTickBoxChecked({
          textLabel: "Keep me up to date on news and exclusive offers",
        }),
      ).toBe(true);
      await expect(
        page.locator("//div[@class='dynamic-checkout']/div[normalize-space()='Express Checkout']"),
      ).toBeVisible();
    });

    await test.step(`- Thay đổi setting trong theme
        - Reopen/ reload lại link check out đc tạo trước đó > Kiểm tra form checkout`, async () => {
      /*
         - Show legal agreement on the checkout page: checked
           - Chọn Manual confirmation
        - Email marketing: Show email marketing consent checkbox
        - SMS marketing: Tick Show sms marketing consent checkbox
        - Show Paypal express: Untick
        */
      await themeSetting.editCheckoutLegal({
        termAgreement: {
          showToS: true,
          optionsConfirm: "Manual confirmation",
        },
        marketingConsent: {
          emailMkt: {
            preCheck: false,
          },
          smsMkt: {
            preCheck: false,
          },
        },
      });
      await themeSetting.enablePaypalExpressBtn(false);
      await page.reload();
      /*
        - Show ToS "I have read and agree to the Terms of service" Kèm với checkbox
        - Show text "Keep me up-to-date on the order progress and exclusive offers via text messages",
        với checkbox không được tick sẵn
        - Show text "Keep me up-to-date on the order progress and exclusive offers via Email",
        với checkbox không được tick sẵn
        - Không show btn Paypal Express
        */
      await page.locator(`//div[@class="main__footer"]`).scrollIntoViewIfNeeded();
      await checkoutPage.reloadUntilElementExisted(checkoutPage.xpathManualToS, 5, checkoutPage.xpathFooterSF);
      expect(await checkoutPage.isTextVisible("I have read and agreed to the")).toBeTruthy();
      expect(
        await checkoutPage.isTickBoxChecked({
          textLabel: `Keep me up-to-date on the order progress and exclusive offers from ${conf.suiteConf.shop_name} via text messages`,
        }),
      ).toBe(false);
      expect(
        await checkoutPage.isTickBoxChecked({
          textLabel: "Keep me up to date on news and exclusive offers",
        }),
      ).toBe(false);
      await expect(
        page.locator("//div[@class='dynamic-checkout']/div[normalize-space()='Express Checkout']"),
      ).toBeHidden();
    });

    await test.step(`- Thay đổi setting trong theme
        - Reopen/ reload lại link check out đc tạo trước đó > Kiểm tra form checkout`, async () => {
      /*
        - Show legal agreement on the checkout page: Tick
        - Chọn Auto confirmation
        */
      await themeSetting.editCheckoutLegal({
        termAgreement: {
          showToS: true,
          optionsConfirm: "Auto confirmation",
        },
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Place your order" }).hover();
      // - Show ToS "By click button Place the order your buyers agree to the Terms of service." không có checkbox
      await checkoutPage.reloadUntilElementExisted(checkoutPage.xpathAutoToS, 5, checkoutPage.xpathFooterSF);
      expect(await checkoutPage.isTextVisible("By clicking button Place your order, you agree to the")).toBeTruthy();
    });
  });
});
