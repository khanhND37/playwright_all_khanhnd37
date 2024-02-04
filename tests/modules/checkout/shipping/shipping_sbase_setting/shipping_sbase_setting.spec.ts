import { expect, test } from "@core/fixtures";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { SettingShipping } from "@pages/dashboard/setting_shipping";
import type { ShippingRate } from "@types";

test.describe("Setting full flow shipping sbase", () => {
  let domain: string;
  let shippingInfo, shippingAdjustInfo, deletedShippingInfo;
  let priceBaseRate: ShippingRate;
  let weightBaseRate: ShippingRate;
  let itemBaseRate: ShippingRate;
  let shippingPage: SettingShipping;
  let shippingApi: SettingShippingAPI;

  test.beforeEach(async ({ authRequest, conf, dashboard }) => {
    domain = conf.suiteConf.domain;
    shippingInfo = conf.caseConf.shipping_info;
    shippingAdjustInfo = conf.caseConf.shipping_adjust_info;
    deletedShippingInfo = conf.caseConf.deleted_shipping_info;
    priceBaseRate = shippingInfo.price_based_rate;
    weightBaseRate = shippingInfo.weight_based_rate;
    itemBaseRate = shippingInfo.item_based_rate;
    shippingPage = new SettingShipping(dashboard, domain);
    shippingApi = new SettingShippingAPI(domain, authRequest);
  });

  test(`Setting shipping profile với đầy đủ các rate @SB_SET_SP_23`, async () => {
    await test.step(`Tại dashboard > Setting > Shipping* Click add shipping zone- Nhập zone name- Add country - Add Price base rate`, async () => {
      await shippingPage.gotoShippingSettingPage();
      await shippingPage.checkAndRemoveShippingZone(deletedShippingInfo);
      await shippingPage.clickAddShippingZone();
      await shippingPage.fillShippingZoneName(shippingInfo.name);
      await shippingPage.addCountryToShippingZone(shippingInfo.countries);
      await shippingPage.addShippingRate(priceBaseRate);
      const shippingRateLine = shippingPage.genLocShippingRate(priceBaseRate.name);
      expect(await shippingRateLine.isVisible()).toBeTruthy();
    });

    await test.step(`- Add Weight base rate`, async () => {
      await shippingPage.addShippingRate(weightBaseRate);
      const shippingRateLine = shippingPage.genLocShippingRate(weightBaseRate.name);
      expect(await shippingRateLine.isVisible()).toBeTruthy();
    });

    await test.step(`- Add Item base rate`, async () => {
      await shippingPage.addShippingRate(itemBaseRate);
      const shippingRateLine = shippingPage.genLocShippingRate(itemBaseRate.name);
      expect(await shippingRateLine.isVisible()).toBeTruthy();
    });

    await test.step(`Click Save change`, async () => {
      await shippingPage.btnSaveChange.click();
      const shippingZone = shippingPage.genLocShippingZone(shippingInfo.name);
      await expect(shippingZone).toBeVisible();
    });

    await test.step(`Tại trang shipping list- Click vào edit zone vừa tạo- Thực hiện add thêm country`, async () => {
      await shippingPage.addCountryToShippingZone(shippingAdjustInfo.countries);
      const zoneCountry = shippingPage.genLocZoneCountry(shippingInfo.countries);
      const additionalZoneCountry = shippingPage.genLocZoneCountry(shippingAdjustInfo.countries);
      await expect(zoneCountry).toBeVisible();
      await expect(additionalZoneCountry).toBeVisible();
    });

    await test.step(`Tại rate price base > Click edit rate > Click done > Click Save change`, async () => {
      await shippingPage.editShippingRate(shippingAdjustInfo.price_based_rate);
      await shippingPage.btnSaveChange.click();
      const shippingZoneInfo = await shippingApi.getShippingZoneInfo(shippingInfo.name);
      const priceBaseRateInfo = shippingZoneInfo.price_based_shipping_rate.find(
        rate => rate.name === shippingAdjustInfo.price_based_rate.name,
      );
      expect(priceBaseRateInfo.price).toEqual(shippingAdjustInfo.price_based_rate.price);
    });

    await test.step(`Tại weight price base > Click edit rate > Click done > Click Save change`, async () => {
      await shippingPage.editShippingRate(shippingAdjustInfo.weight_based_rate);
      await shippingPage.btnSaveChange.click();
      const shippingZoneInfo = await shippingApi.getShippingZoneInfo(shippingInfo.name);
      const weightBaseRateInfo = shippingZoneInfo.weight_based_shipping_rate.find(
        rate => rate.name === shippingAdjustInfo.weight_based_rate.name,
      );
      expect(weightBaseRateInfo.price).toEqual(shippingAdjustInfo.weight_based_rate.price);
    });

    await test.step(`Tại item price base > Click edit rate > Click done > Click Save change`, async () => {
      await shippingPage.editShippingRate(shippingAdjustInfo.item_based_rate);
      await shippingPage.btnSaveChange.click();
      const shippingZoneInfo = await shippingApi.getShippingZoneInfo(shippingInfo.name);
      const itemBaseRateInfo = shippingZoneInfo.item_based_shipping_rate.find(
        rate => rate.name === shippingAdjustInfo.item_based_rate.name,
      );
      expect(itemBaseRateInfo.first_item_price).toEqual(shippingAdjustInfo.item_based_rate.first_item_price);
    });

    await test.step(`Tại rate price base > Click icon x `, async () => {
      await shippingPage.clickXtoPrepareDeleteShippingRate(priceBaseRate.name);
      await expect(shippingPage.genLocShippingRate(priceBaseRate.name)).toBeHidden();
    });

    await test.step(`Tại rate weight base > Click icon x `, async () => {
      await shippingPage.clickXtoPrepareDeleteShippingRate(weightBaseRate.name);
      await expect(shippingPage.genLocShippingRate(weightBaseRate.name)).toBeHidden();
    });

    await test.step(`Tại rate item base > Click icon x `, async () => {
      await shippingPage.clickXtoPrepareDeleteShippingRate(itemBaseRate.name);
      await expect(shippingPage.genLocShippingRate(itemBaseRate.name)).toBeHidden();
    });

    await test.step(`Click button Delete zone > Tại popup click delete shipping zone`, async () => {
      await shippingPage.btnDeleteShippingZone.click();
      await shippingPage.btnConfirmDeleteShippingZone.click();
      await expect(shippingPage.genLocShippingZone(shippingInfo.name)).toBeHidden();
    });
  });
});
