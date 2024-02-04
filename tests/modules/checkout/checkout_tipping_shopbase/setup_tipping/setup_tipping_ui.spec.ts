import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFCheckout } from "@pages/storefront/checkout";
import type { OrderAfterCheckoutInfo, OrderSummary, Product, ShippingAddress } from "@types";
import { Dev, SbSbDBSfTip } from "./setup_tipping_ui";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { DashboardAPI } from "@pages/api/dashboard";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Set up tipping and verify UI on Dashboard", () => {
  let dashboardPage: DashboardPage;
  let dashboardAPI: DashboardAPI;
  let themeSetting: ThemeDashboard;
  let themeSettingAPI: SettingThemeAPI;
  let productCheckout: Array<Product>;
  let checkoutPage: SFCheckout;
  let tippingInfo, tippingValid, tippingValueOption1, tippingValueOption2, tippingValueOption3;
  let shippingAddress: ShippingAddress;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrder: OrderSummary;
  let tippingAmount: string;

  test.beforeEach(async ({ dashboard, conf, page, theme, cConf, authRequest }) => {
    const suiteConf = conf.suiteConf as Dev;
    const caseConf = cConf as SbSbDBSfTip;
    productCheckout = caseConf.product_checkout;
    tippingValid = caseConf.tipping_valid;
    tippingInfo = caseConf.tipping_info;
    tippingValueOption1 = caseConf.tipping_info.percentages[0];
    tippingValueOption2 = caseConf.tipping_info.percentages[1];
    tippingValueOption3 = caseConf.tipping_info.percentages[2];
    shippingAddress = suiteConf.shipping_address;
    dashboardPage = new DashboardPage(dashboard, suiteConf.domain);
    checkoutPage = new SFCheckout(page, suiteConf.domain);
    themeSetting = new ThemeDashboard(dashboard, suiteConf.domain);
    themeSettingAPI = new SettingThemeAPI(theme);
    dashboardAPI = new DashboardAPI(suiteConf.domain, authRequest);

    //setting theme
    await themeSetting.goToCustomizeTheme("Themes");
    await themeSetting.settingTippingLayout(caseConf.tipping_layout);
    await themeSettingAPI.editCheckoutLayout("one-page");

    //Navigate to Checkout in Dashboard
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Checkout");
  });

  test(`@SB_SB_DB_SF_TIP_3 Verify checkout page of storefront If merchant set up 3 tipping options, tipping layout is "Click to show"`, async () => {
    await test.step(`Setup tipping options value <0`, async () => {
      await dashboardPage.inputTippingOption({
        option: "1",
        tipping_amount: tippingValueOption1,
      });
      expect(await dashboardPage.isErrorTextDisplayed("Value must be greater than or equal to 0")).toBeTruthy();
    });

    await test.step(`Setup tipping options value >100`, async () => {
      await dashboardPage.inputTippingOption({
        option: "2",
        tipping_amount: tippingValueOption2,
      });
      expect(await dashboardPage.isErrorTextDisplayed("Value must be smaller than or equal to 100")).toBeTruthy();
    });

    await test.step(`Setup tipping options value >0 and <100`, async () => {
      await dashboardPage.inputTippingOption({
        option: "3",
        tipping_amount: tippingValueOption3,
      });
      await dashboardPage.genLoc(dashboardPage.xpathSaveChangedBtn).click();
      expect(await dashboardPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
    });

    await test.step(`Go to Store Front -> Checkout`, async () => {
      //verify checkbox tipping and section tipping with one page
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      const checkboxTippingSF = checkoutPage.page.locator(checkoutPage.xpathAddTipCheckbox);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      //verify checkbox tipping
      await expect(checkboxTippingSF).toBeVisible();
      //verify section tipping
      await expect(checkoutPage.page.locator(checkoutPage.xpathSectionTipping)).not.toBeVisible();

      //verify block add tip with multi-step
      await themeSettingAPI.editCheckoutLayout("multi-step");
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.continueToPaymentMethod();
      //verify checkbox tipping
      await expect(checkboxTippingSF).toBeVisible();
      //verify block add tip with multi-step
      await expect(checkoutPage.page.locator(checkoutPage.xpathSectionTipping)).not.toBeVisible();
    });

    await test.step(`Select checkbox "Show your support for the team at {shop_name}"`, async () => {
      await checkoutPage.verifyTippingAtCheckoutPage(tippingValid);
    });
  });

  test(`@SB_SB_DB_SF_TIP_2 Verify checkout page of storefront If merchant set up 3 tipping options, tipping layout is "Always show detailed"`, async () => {
    await test.step(`Setup tipping options value <0`, async () => {
      await dashboardPage.inputTippingOption({
        option: "1",
        tipping_amount: tippingValueOption1,
      });
      expect(await dashboardPage.isErrorTextDisplayed("Value must be greater than or equal to 0")).toBeTruthy();
    });
    await test.step(`Setup tipping options value >100`, async () => {
      await dashboardPage.inputTippingOption({
        option: "2",
        tipping_amount: tippingValueOption2,
      });
      expect(await dashboardPage.isErrorTextDisplayed("Value must be smaller than or equal to 100")).toBeTruthy();
    });
    await test.step(`Setup tipping options value >0 and <100`, async () => {
      await dashboardPage.inputTippingOption({
        option: "3",
        tipping_amount: tippingValueOption3,
      });
      await dashboardPage.genLoc(dashboardPage.xpathSaveChangedBtn).click();
      expect(await dashboardPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
    });
    await test.step(`Go to Store Front -> Checkout`, async () => {
      //verify checkbox tipping and section tipping with one-page
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      const checkboxTippingSF = checkoutPage.page.locator(checkoutPage.xpathAddTipCheckbox);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      //verify checkbox tipping
      await expect(checkboxTippingSF).not.toBeVisible();
      //verify section tipping
      await checkoutPage.verifyTippingAtCheckoutPage(tippingValid);

      //verify checkbox tipping and section tipping with multi-step
      await themeSettingAPI.editCheckoutLayout("multi-step");
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.continueToPaymentMethod();
      //verify checkbox tipping
      await expect(checkboxTippingSF).not.toBeVisible();
      //verify section tipping
      await checkoutPage.verifyTippingAtCheckoutPage(tippingValid);
    });
  });

  test(`@SB_SB_DB_SF_TIP_5 Check that customer can choose Custom Tip`, async () => {
    dashboardAPI.setupTipping(tippingInfo);
    await test.step(`Go to Store Front -> Checkout`, async () => {
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      const checkboxTippingSF = checkoutPage.page.locator(checkoutPage.xpathAddTipCheckbox);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      //verify checkbox tipping
      await expect(checkboxTippingSF).toBeVisible();
      //verify tip on Order Summary
      expect(checkoutPage.getTipOnOrderSummary).toBeDefined();
    });

    await test.step(`Check the check box "Show your support for the team at {shop_name}"`, async () => {
      await checkoutPage.verifyTippingAtCheckoutPage(tippingValid);
    });

    await test.step(`Điền "Custom Tip" với value >Subtotal`, async () => {
      await checkoutPage.addCustomTip({ tipping_amount: tippingInfo.tipping_amount[0] }, "Add Tip");
      expect(await checkoutPage.isErrorMsgDisplayed("Enter a tip no more than $10.00")).toBeTruthy();
    });

    await test.step(`Điền "Custom Tip" với value < Subtotal`, async () => {
      await checkoutPage.addCustomTip({ tipping_amount: tippingInfo.tipping_amount[1] }, "Add Tip");
      //verify button Add Tip & Update Tip
      await expect(checkoutPage.page.locator(checkoutPage.xpathBtnAddTip)).toBeDisabled();
      await expect(checkoutPage.getXpathBtnAddTip("Update Tip")).toBeVisible();
      //verify tipping on Order Summaryc
      tippingAmount = await checkoutPage.getTipOnOrderSummary();
      expect(removeCurrencySymbol(tippingAmount)).toEqual(tippingInfo.tipping_amount[1]);
    });

    await test.step(`Điền giá trị mới vào "Custom Tip" với value >Subtotal`, async () => {
      await checkoutPage.addCustomTip({ tipping_amount: tippingInfo.tipping_amount[2] }, "Update Tip");
      expect(await checkoutPage.isErrorMsgDisplayed("Enter a tip no more than $10.00")).toBeTruthy();
    });

    await test.step(`Điền giá trị mới vào "Custom Tip" với value < Subtotal`, async () => {
      await checkoutPage.addCustomTip({ tipping_amount: tippingInfo.tipping_amount[3] }, "Update Tip");
      //verify button Add Tip & Update Tip
      await expect(checkoutPage.page.locator(checkoutPage.xpathBtnAddTip)).toBeDisabled();
      await expect(checkoutPage.getXpathBtnAddTip("Update Tip")).toBeVisible();
      //verify tipping on Order Summary
      tippingAmount = await checkoutPage.getTipOnOrderSummary();
      expect(removeCurrencySymbol(tippingAmount)).toEqual(tippingInfo.tipping_amount[3]);
    });

    await test.step(`Complete order sau khi add tip`, async () => {
      orderSummaryBeforeCompleteOrder = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.completeOrderWithMethod("Stripe");
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.tippingValue).toBe(orderSummaryBeforeCompleteOrder.tippingVal);
    });
  });
});
