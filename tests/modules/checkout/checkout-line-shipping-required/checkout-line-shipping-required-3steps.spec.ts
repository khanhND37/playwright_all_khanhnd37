import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";
import { Product, ShippingAddress } from "@types";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { removeExtraSpace } from "@core/utils/string";

test.describe("Buyer chưa fill phone number tại Shipping Address, 3 steps, theme v2", () => {
  let checkoutPage: SFCheckout;
  let themeSettingAPI: SettingThemeAPI;
  let productCheckout: Array<Product>;
  let domain: string;
  let checkoutAPI: CheckoutAPI;
  let dashboardAPI: DashboardAPI;
  let themeSetting: number;
  let shippingAddress: ShippingAddress;
  let expectShippingAdress;

  const casesID = "SB_HAS_NOT_FILL_3STEPS";
  const conf = loadData(__dirname, casesID);

  test.beforeEach(async ({ page, conf, authRequest, theme }) => {
    domain = conf.suiteConf.domain;
    productCheckout = conf.suiteConf.products_checkout;
    themeSetting = conf.suiteConf.theme_v2;
    themeSettingAPI = new SettingThemeAPI(theme);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    shippingAddress = conf.suiteConf.shipping_address;

    //setting theme: nEcom
    await themeSettingAPI.publishTheme(themeSetting);
    //setting layout-checkout: 1 page
    await dashboardAPI.updateLayoutCheckoutPlb("multi-step");
    expectShippingAdress = removeExtraSpace(
      shippingAddress.first_name +
        " " +
        shippingAddress.last_name +
        " " +
        shippingAddress.address +
        " " +
        shippingAddress.city +
        " " +
        shippingAddress.zipcode +
        " " +
        shippingAddress.state +
        " " +
        shippingAddress.country_code +
        " " +
        conf.suiteConf.phone_number.replaceAll("\\s", ""),
    );
  });

  conf.caseConf.forEach(({ case_id: caseId, case_name: caseName, shipping_method: shippingMethod }) => {
    test(`@${caseId} ${caseName}`, async ({}) => {
      await test.step(`Tại SF:- Add product to cart > Checkout- Fill info `, async () => {
        await checkoutAPI.addProductToCartThenCheckout(productCheckout);
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.enterShippingAddress(shippingAddress);
        await checkoutPage.selectShippingMethod(shippingMethod);
        //Không hiển thị field phone number and message trong block shipping method
        await expect(checkoutPage.genLoc(checkoutPage.xpathPhoneNumberInShippingMethod)).toBeHidden();
        await expect(checkoutPage.genLoc(checkoutPage.xpathMessagePhoneNumberRequired)).toBeHidden();
      });

      await test.step(`Click [Place your order]`, async () => {
        await checkoutPage.completeOrderWithMethod();
        await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
      });
    });
  });

  test(`@SB_CHE_CHF_252 [Plb] Verify checkout khi Buyer select "Premium shipping" method, checkout 3 steps, theme v2`, async ({
    conf,
  }) => {
    await test.step(`Tại SF:- Add product to cart > Checkout- Fill info `, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.selectShippingMethod(conf.caseConf.shipping_method);
      //Không hiển thị field phone number and message trong block shipping method
      await expect(checkoutPage.genLoc(checkoutPage.xpathPhoneNumberInShippingMethod)).toBeVisible();
      await expect(checkoutPage.genLoc(checkoutPage.xpathMessagePhoneNumberRequired)).toBeVisible();
    });

    await test.step(`- Bỏ trống filed phone number- Click [Place your order]`, async () => {
      await checkoutPage.page.locator(checkoutPage.xpathBtnContinueToPaymentMethod).click();
      await expect(checkoutPage.isTextVisible("Please enter a phone number.")).toBeTruthy();
    });

    await test.step(`- Fill phone number không hợp lệ vào filed phone number- Click [Place your order]`, async () => {
      await checkoutPage.inputPhoneNumberInShippingMethod("0336");
      await checkoutPage.page.locator(checkoutPage.xpathBtnContinueToPaymentMethod).click();
      await expect(checkoutPage.isTextVisible("Phone number only contains 7-15 digits.")).toBeTruthy();
    });

    await test.step(`- Fill phone number hợp lệ vào filed phone number- Click [Place your order]`, async () => {
      await checkoutPage.inputPhoneNumberInShippingMethod(conf.suiteConf.phone_number);
      await checkoutPage.completeOrderWithMethod();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
      const ShippingAdressInfo = await checkoutPage.getShippingAddressOnThkPage();
      expect(ShippingAdressInfo).toBe(expectShippingAdress);
    });
  });
});
