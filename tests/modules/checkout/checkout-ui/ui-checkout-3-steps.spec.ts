import { expect, test } from "@fixtures/website_builder";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { Locator } from "@playwright/test";
import { Product, SettingCheckoutForm, ShippingAddress } from "@types";

test.describe("Checkout UI/UX", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let domain: string;
  let productCheckout: Array<Product>;
  let shippingAddressUS: ShippingAddress;
  let shippingAddressVN: ShippingAddress;
  let shippingAddressUK: ShippingAddress;
  let templateId: number;
  let settingCheckoutInfo: SettingCheckoutForm;
  let premiumShipping, standardShipping, ecoShipping, shippingFee, textEtaShipping;
  let xpathStandardShipping: Locator, xpathPremiumShipping: Locator, xpathEcoShipping: Locator;
  let islineStandardVisible: boolean, islinePremiumVisible: boolean, islineEcoVisible: boolean;

  test.beforeEach(async ({ conf, page, authRequest }) => {
    domain = conf.suiteConf.domain;
    templateId = conf.suiteConf.template_id;
    productCheckout = conf.suiteConf.product_checkout;
    shippingAddressUS = conf.suiteConf.shipping_address_us;
    shippingAddressVN = conf.suiteConf.shipping_address_vn;
    shippingAddressUK = conf.suiteConf.shipping_address_uk;
    checkoutPage = new SFCheckout(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    settingCheckoutInfo = conf.caseConf.setting_checkout_form;
    premiumShipping = conf.suiteConf.premium_shipping;
    standardShipping = conf.suiteConf.standard_shipping;
    ecoShipping = conf.suiteConf.eco_shipping;
  });

  test(`@SB_CHE_UX_Sep23_11 [Sbase][Theme NE] Check hiển thị shipping checkout 3 steps theo layout "Methods only"`, async ({
    builder,
  }) => {
    await test.step(`Pre conditions`, async () => {
      await builder.updateSettingCheckoutForm(templateId, settingCheckoutInfo);
      xpathStandardShipping = checkoutPage.xpathLabelShippingMethod(standardShipping.name);
      xpathPremiumShipping = checkoutPage.xpathLabelShippingMethod(premiumShipping.name);
      xpathEcoShipping = checkoutPage.xpathLabelShippingMethod(ecoShipping.name);
    });

    await test.step(`Buyer lên storefront của shop 
    - Checkout sản phẩm: Shirt 
    - Nhập các thông tin trong trang: Customer information + Shipping `, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.enterShippingAddress(shippingAddressVN);
      const messageNoShippingMethod = await checkoutPage.isTextVisible(
        "There are no shipping methods available for your cart or address",
      );
      expect(messageNoShippingMethod).toBeTruthy();
    });

    await test.step(`Buyer nhập thông tin shipping đến quốc gia khác`, async () => {
      await checkoutPage.page.click(checkoutPage.xpathStepInformation);
      await checkoutPage.enterShippingAddress(shippingAddressUK);
      // wait for loading shipping method
      await checkoutPage.page.waitForTimeout(2000);
      islineStandardVisible = await xpathStandardShipping.isVisible();
      islinePremiumVisible = await xpathPremiumShipping.isVisible();
      islineEcoVisible = await xpathEcoShipping.isVisible();

      await expect(islineStandardVisible).toBeTruthy();
      await expect(islinePremiumVisible).toBeFalsy();
      await expect(islineEcoVisible).toBeFalsy();
    });

    await test.step(`Buyer nhập thông tin shipping đến quốc gia khác`, async () => {
      await checkoutPage.page.click(checkoutPage.xpathStepInformation);
      await checkoutPage.enterShippingAddress(shippingAddressUS);
      // wait for loading shipping method
      await checkoutPage.page.waitForTimeout(2000);
      islineStandardVisible = await xpathStandardShipping.isVisible();
      islinePremiumVisible = await xpathPremiumShipping.isVisible();
      islineEcoVisible = await xpathEcoShipping.isVisible();

      await expect(islineStandardVisible).toBeTruthy();
      await expect(islinePremiumVisible).toBeTruthy();
      await expect(islineEcoVisible).toBeTruthy();
    });

    await test.step(`Buyer chọn line premium_shipping`, async () => {
      await checkoutPage.selectShippingMethod(premiumShipping.name);
      shippingFee = await checkoutPage.getShippingFeeByRateName(premiumShipping.name);
      // veify shipping fee & eta shipping
      expect(+shippingFee).toEqual(premiumShipping.price);
      textEtaShipping = checkoutPage.textEtaShipping(
        premiumShipping.min_shipping_time,
        premiumShipping.max_shipping_time,
      );
      expect(await checkoutPage.isTextVisible(textEtaShipping)).toBeTruthy();
    });

    await test.step(`Buyer check các thông tin:- Delivery shipping- Shipping fee`, async () => {
      // select line Standard shipping
      await checkoutPage.selectShippingMethod(standardShipping.name);
      shippingFee = await checkoutPage.getShippingFeeByRateName(standardShipping.name);
      // veify shipping fee & eta shipping
      expect(+shippingFee).toEqual(standardShipping.price);
      textEtaShipping = checkoutPage.textEtaShipping(
        standardShipping.min_shipping_time,
        standardShipping.max_shipping_time,
      );
      expect(await checkoutPage.isTextVisible(textEtaShipping)).toBeTruthy();
      // select line Eco shipping
      await checkoutPage.selectShippingMethod(ecoShipping.name);
      shippingFee = await checkoutPage.getShippingFeeByRateName(ecoShipping.name);
      // veify shipping fee & eta shipping
      expect(+shippingFee).toEqual(ecoShipping.price);
      textEtaShipping = checkoutPage.textEtaShipping(ecoShipping.min_shipping_time, ecoShipping.max_shipping_time);
      expect(await checkoutPage.isTextVisible(textEtaShipping)).toBeTruthy();
    });

    await test.step(`Buyer nhập discount shipping`, async () => {
      await checkoutPage.enterAndApplyDiscount("FreeShip");
      const shippingFeeOrderSummary = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(shippingFeeOrderSummary).toEqual("Free");
    });
  });
});
