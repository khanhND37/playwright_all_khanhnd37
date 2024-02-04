// Feature off

import { expect, test } from "@core/fixtures";
import { ShippingProfile } from "@pages/dashboard/setting_shipping_profile";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Test flow from setting to checkout of shipping @TS_SB_SET_SP_SPR", () => {
  test("Verify shipping profile with UI @TC_SB_SET_SP_SPR_6", async ({ page, conf, dashboard }) => {
    const { domain } = conf.suiteConf as never;

    const shippingSetting = new ShippingProfile(page, domain);
    const orderPage = new OrdersPage(dashboard, domain);
    let checkout: SFCheckout;
    let orderId: number;

    const profileName = conf.caseConf.profile_info.name;
    const productList = conf.caseConf.profile_info.products;
    const zoneName = conf.caseConf.profile_info.zone_name;
    const zoneCountries = conf.caseConf.profile_info.zone_countries;
    const productCheckout = conf.caseConf.product_checkout;

    const weightBasedRate = conf.caseConf.weight_based_rate;
    const priceBasedRate = conf.caseConf.price_based_rate;
    const itemBasedRate = conf.caseConf.item_based_rate;

    const customerInfo = conf.suiteConf.customer_info;

    await test.step(
      "Merchant log in to dashboard and go to Setting/Shipping section then" + "delete all custom shipping profile",
      async () => {
        await shippingSetting.goto(`https://${domain}/admin/settings/shipping`);
        // delete all existed shipping profile
        await shippingSetting.deleteAllCustomShippingProfile();
      },
    );

    await test.step("Create a new shipping profile", async () => {
      await shippingSetting.createShippingProfile(profileName, productList);
      await shippingSetting.createShippingZone(zoneName, zoneCountries);
      await shippingSetting.addRate(zoneName, weightBasedRate);
      await shippingSetting.addRate(zoneName, priceBasedRate);
      await shippingSetting.addRate(zoneName, itemBasedRate);
      await shippingSetting.clickOnBtnWithLabel("Save");
    });

    await test.step("Buyer open homepage then add 'Jeans' to cart and navigate to checkout page", async () => {
      await checkout.addToCartThenGoToShippingMethodPage(productCheckout, customerInfo);
    });

    await test.step("verify shipping methods", async () => {
      expect(await checkout.getShippingFeeByRateName(weightBasedRate.name)).toEqual(weightBasedRate.price);
      expect(await checkout.getShippingFeeByRateName(priceBasedRate.name)).toEqual(priceBasedRate.price);
      expect(await checkout.getShippingFeeByRateName(itemBasedRate.name)).toEqual(itemBasedRate.price);
    });

    await test.step("verify ETA shipping delivery time", async () => {
      let expETAShippingLine: string;
      // weight based
      expETAShippingLine = checkout.calExpETAShippingTime(
        weightBasedRate.min_shipping_time,
        weightBasedRate.max_shipping_time,
      );
      expect(await checkout.getTextETAShippingTime(weightBasedRate.name)).toEqual(expETAShippingLine);
      // price based
      expETAShippingLine = checkout.calExpETAShippingTime(
        priceBasedRate.min_shipping_time,
        priceBasedRate.max_shipping_time,
      );
      expect(await checkout.getTextETAShippingTime(priceBasedRate.name)).toEqual(expETAShippingLine);
      // item based
      expETAShippingLine = checkout.calExpETAShippingTime(
        itemBasedRate.min_shipping_time,
        itemBasedRate.max_shipping_time,
      );
      expect(await checkout.getTextETAShippingTime(itemBasedRate.name)).toEqual(expETAShippingLine);
    });

    await test.step(
      "select shipping method and complete the checkout," + " then verify shipping method on thank you page",
      async () => {
        await checkout.selectShippingThenCompleteOrder(priceBasedRate.name, "Stripe");
        // verify shipping method
        const actShippingRate = removeCurrencySymbol(await checkout.getShippingFeeOnOrderSummary());
        expect(actShippingRate).toEqual(priceBasedRate.price.toString());
        const actShippingRateName = await checkout.getShippingMethodOnThankYouPage();
        expect(actShippingRateName).toEqual(priceBasedRate.name);
        orderId = await checkout.getOrderIdBySDK();
      },
    );

    await test.step("go to order then verify shipping method", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actShippingRate = removeCurrencySymbol(await orderPage.getShippingFee());
      expect(actShippingRate).toEqual(priceBasedRate.price.toString());
      const actShippingRateName = await orderPage.getShippingRateName();
      expect(actShippingRateName).toEqual(priceBasedRate.name);
    });
  });
});
