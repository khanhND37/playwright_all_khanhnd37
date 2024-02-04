// Feature off

import { expect, test } from "@core/fixtures";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import type { ShippingCountry, ShippingRates, ShippingZoneInfo } from "@types";

// verify shipping zone
const verifyShippingZone = (newShippingZones, payloadShippingZones) => {
  newShippingZones.forEach((zone: ShippingZoneInfo, index: number) => {
    expect(zone.name).toBe(payloadShippingZones[index].name);

    const eachActCountryCodeToCountry: Record<string, ShippingCountry> = {};
    zone.countries.forEach(country => {
      eachActCountryCodeToCountry[country.code] = country;
    });

    const eachExpCountryCodeToCountry: Record<string, ShippingCountry> = {};
    payloadShippingZones[index].countries.forEach((country: ShippingCountry) => {
      eachExpCountryCodeToCountry[country.code] = country;
    });

    // check countries
    expect(Object.keys(eachActCountryCodeToCountry).sort()).toEqual(Object.keys(eachExpCountryCodeToCountry).sort());

    // check provinces
    Object.keys(eachActCountryCodeToCountry).forEach((countryCode: string) => {
      if (!eachActCountryCodeToCountry[countryCode].provinces?.length) {
        return;
      }
      const eachActProvinceCodeToProvince: Record<string, unknown> = {};
      eachActCountryCodeToCountry[countryCode].provinces.forEach(province => {
        eachActProvinceCodeToProvince[province.code as string] = province;
      });

      const eachExpProvinceCodeToProvince: Record<string, unknown> = {};
      eachExpCountryCodeToCountry[countryCode].provinces.forEach(province => {
        eachExpProvinceCodeToProvince[province.code as string] = province;
      });

      expect(Object.keys(eachActProvinceCodeToProvince).sort()).toEqual(
        Object.keys(eachExpProvinceCodeToProvince).sort(),
      );
    });
  });
};

// verify item based rate
const verifyItemBasedRates = (newItemBaseRate, payloadShippingRate) => {
  expect(newItemBaseRate.rates[0].name).toBe(payloadShippingRate.rates[0].name);
  expect(newItemBaseRate.rates[0].additional_item_price).toBe(payloadShippingRate.rates[0].additional_item_price);
  expect(newItemBaseRate.rates[0].first_item_price).toBe(payloadShippingRate.rates[0].first_item_price);
};

// verify price based rate
const verifyPriceBasedRates = (newPriceBasedRates, payloadShippingRate) => {
  const rateNames = [payloadShippingRate.rates[0].name, payloadShippingRate.rates[1].name];
  for (let i = 0; i < rateNames.length; i++) {
    const actNewPriceBasedRate = newPriceBasedRates.rates.filter(function (actRate) {
      return actRate.name === rateNames[i];
    });
    expect(actNewPriceBasedRate[0].price).toBe(payloadShippingRate.rates[i].price);
    if (payloadShippingRate.rates[i].min_order_subtotal !== undefined) {
      expect(actNewPriceBasedRate[0].min_order_subtotal).toBe(payloadShippingRate.rates[i].min_order_subtotal);
    }
    if (payloadShippingRate.rates[i].max_order_subtotal !== undefined) {
      expect(actNewPriceBasedRate[0].max_order_subtotal).toBe(payloadShippingRate.rates[i].max_order_subtotal);
    }
  }
};

// verify weight based rate
const verifyWeightBasedRates = (newWeightBasedRates, payloadShippingRate) => {
  const rateNames = [payloadShippingRate.rates[0].name];
  if (payloadShippingRate.rates.length > 1) {
    rateNames.push(payloadShippingRate.rates[1].name);
  }

  for (let i = 0; i < rateNames.length; i++) {
    const actNewWeightBasedRate = newWeightBasedRates.rates.filter(function (actRate) {
      return actRate.name === rateNames[i];
    });
    expect(actNewWeightBasedRate[0].price).toBe(payloadShippingRate.rates[i].price);
    if (payloadShippingRate.rates[i].weight_high !== undefined) {
      expect(actNewWeightBasedRate[0].weight_high).toBe(payloadShippingRate.rates[i].weight_high);
    }
    if (payloadShippingRate.rates[i].weight_low !== undefined) {
      expect(actNewWeightBasedRate[0].weight_low).toBe(payloadShippingRate.rates[i].weight_low);
    }
    if (payloadShippingRate.rates[i].weight_unit !== undefined) {
      expect(actNewWeightBasedRate[0].weight_unit).toBe(payloadShippingRate.rates[i].weight_unit);
    }
  }
};

test.describe("Test setting shipping profile by API @TS_SB_SET_SP_SPR", () => {
  // pre: login dashboard and delete all shipping profile
  test.beforeEach(async ({ conf, authRequest }) => {
    const { domain } = conf.suiteConf as never;
    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

    // delete all existed shipping profile
    await shippingSettingAPI.deleteAllCustomProfile();
    await shippingSettingAPI.deleteAllZonesOfGeneralProfile();
  });

  test("Check chức năng create, edit, delete một custom profile @TC_SB_SET_SP_SPS_35", async ({
    conf,
    authRequest,
  }) => {
    let profileId: number;
    let profileBody;
    const { domain } = conf.suiteConf as never;

    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

    await test.step("Tạo mới một custom shipping profile", async () => {
      const profileData = conf.caseConf.profile_data_1;
      profileBody = await shippingSettingAPI.createShippingProfile(profileData);
      profileId = profileBody.id;

      // verify data
      expect(profileBody.name).toBe(profileData.name);
      expect(profileBody.shipping_zones[0].name).toBe(profileData.shipping_zones[0].name);
      expect(profileBody.shipping_zones[0].countries.name).toBe(profileData.shipping_zones[0].countries.name);
    });

    await test.step("Update custom shipping profile vừa tạo", async () => {
      const profileData = conf.caseConf.profile_data_2;
      profileData.id = profileId;
      profileBody = await shippingSettingAPI.editShippingProfileById(profileId, profileData);

      // verify data
      expect(profileBody.name).toBe(profileData.name);
      expect(profileBody.shipping_conditions[0].reference_key).toBe(profileData.variant_ids[0]);
      expect(profileBody.shipping_zones[0].name).toBe(profileData.shipping_zones[0].name);
      expect(profileBody.shipping_zones[0].countries.name).toBe(profileData.shipping_zones[0].countries.name);
    });

    await test.step("Delete custom shipping profile vừa tạo", async () => {
      await shippingSettingAPI.deleteCustomProfile(profileId);

      // verify delete profile successful
      const listCustomProfiles = await shippingSettingAPI.getListCustomProfiles();
      expect(listCustomProfiles.length).toEqual(0);
    });
  });

  test("Check chức năng create, edit, delete zone của general profile @TC_SB_SET_SP_SPS_52_53_54", async ({
    conf,
    authRequest,
  }) => {
    let profileBody;
    let zoneId: number;
    const { domain } = conf.suiteConf as never;
    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

    await test.step("Tạo mới một shipping zone trong General profile", async () => {
      profileBody = await shippingSettingAPI.getGeneralProfileInfo();
      const payloadShippingZones = conf.caseConf.shipping_zones_create;
      const newShippingZones = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);

      verifyShippingZone(newShippingZones, payloadShippingZones);

      zoneId = newShippingZones[0].id;
      profileBody.shipping_zones = newShippingZones;
    });

    await test.step("Edit shipping zone vừa tạo của General profile", async () => {
      const payloadShippingZones = conf.caseConf.shipping_zones_edit as Array<ShippingZoneInfo>;
      payloadShippingZones[0].id = zoneId;
      const newShippingZones = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);

      verifyShippingZone(newShippingZones, payloadShippingZones);

      profileBody.shipping_zones = newShippingZones;
    });

    await test.step("Delete shipping zone vừa tạo của General profile", async () => {
      const payloadShippingZones = [];
      const newShippingZone = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);

      // verify data
      expect(newShippingZone).toEqual(payloadShippingZones);
    });
  });

  test("Check chức năng add, edit, delete rate trong zone của General Profile @TC_SB_SET_SP_SPS_55_58_61", async ({
    conf,
    authRequest,
  }) => {
    const { domain } = conf.suiteConf as never;
    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);
    let profileBody;
    let profileId;
    const rateID = [];

    await test.step("Tạo mới một shipping zone trong General profile", async () => {
      profileBody = await shippingSettingAPI.getGeneralProfileInfo();
      const payloadShippingZones = conf.caseConf.shipping_zones_create;
      const newShippingZone = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);
      profileBody.shipping_zones = newShippingZone;
      profileId = profileBody.id;
    });

    await test.step("Tạo mới một item based rate", async () => {
      const payloadShippingRate = conf.caseConf.item_based_shipping_rate_create;
      const newItemBaseRate = await shippingSettingAPI.updateShippingRates(profileBody, payloadShippingRate);

      // verify data
      if (newItemBaseRate.type === "item_based") {
        verifyItemBasedRates(newItemBaseRate, payloadShippingRate);
      }
      rateID[0] = newItemBaseRate.rates[0].id;
    });

    await test.step("Edit item based rate vừa tạo", async () => {
      const payloadShippingRate = conf.caseConf.item_based_shipping_rate_edit;
      payloadShippingRate.rates[0].id = rateID[0];
      const newItemBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      // verify data
      if (newItemBaseRate.type === "item_based") {
        verifyItemBasedRates(newItemBaseRate, payloadShippingRate);
      }
    });

    await test.step("Delete item based rate vừa tạo", async () => {
      const payloadShippingRate: ShippingRates = {
        type: "item_based",
        rates: [],
      };
      const newItemBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      // verify data
      expect(newItemBaseRate).toEqual(payloadShippingRate);
    });

    await test.step("Tạo mới một price based rate", async () => {
      const payloadShippingRate = conf.caseConf.price_based_shipping_rate_create;
      const newPriceBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      //verify data
      if (newPriceBasedRates.type === "price_based") {
        verifyPriceBasedRates(newPriceBasedRates, payloadShippingRate);
      }
      rateID[0] = newPriceBasedRates.rates[0].id;
      rateID[1] = newPriceBasedRates.rates[1].id;
    });

    await test.step("Edit price based rate vừa tạo", async () => {
      const payloadShippingRate = conf.caseConf.price_based_shipping_rate_create;
      const lengthList = payloadShippingRate.rates.length;
      for (let i = 1; i < lengthList; i++) {
        payloadShippingRate.rates[i].id = rateID[i];
      }
      const newPriceBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      //verify data
      if (newPriceBasedRates.type === "price_based") {
        verifyPriceBasedRates(newPriceBasedRates, payloadShippingRate);
      }
    });

    await test.step("Delete price based rate vừa tạo", async () => {
      const payloadShippingRate: ShippingRates = {
        type: "price_based",
        rates: [],
      };
      const newPriceBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);
      expect(newPriceBaseRate).toEqual(payloadShippingRate);
    });

    await test.step("Tạo mới một weight based rate", async () => {
      const payloadShippingRate = conf.caseConf.weight_based_shipping_rate_create;
      const newWeightBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      //verify data
      if (newWeightBasedRates.type === "weight_based") {
        verifyWeightBasedRates(newWeightBasedRates, payloadShippingRate);
      }
      rateID[0] = newWeightBasedRates.rates[0].id;
    });

    await test.step("Edit weight based rate vừa tạo", async () => {
      const payloadShippingRate = conf.caseConf.weight_based_shipping_rate_edit;
      payloadShippingRate.rates[0].id = rateID[0];
      const newWeightBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      // verify
      if (newWeightBasedRates.type === "weight_based") {
        verifyWeightBasedRates(newWeightBasedRates, payloadShippingRate);
      }
    });

    await test.step("Delete weight based rate vừa tạo", async () => {
      const payloadShippingRate: ShippingRates = {
        type: "weight_based",
        rates: [],
      };
      const newPriceBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);
      expect(newPriceBaseRate).toEqual(payloadShippingRate);
    });
  });

  test("Check chức năng create, edit, delete zone của một custom profile @TC_SB_SET_SP_SPS_38_40_41_42", async ({
    conf,
    authRequest,
  }) => {
    let profileBody;
    let zoneId: number;
    const { domain } = conf.suiteConf as never;
    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

    await test.step("Tạo mới một custom shipping profile", async () => {
      const profileData = conf.caseConf.profile_data;
      profileBody = await shippingSettingAPI.createShippingProfile(profileData);
    });

    await test.step("Tạo mới một shipping zone trong custom profile vừa tạo", async () => {
      const payloadShippingZones = conf.caseConf.shipping_zones_create;
      const newShippingZones = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);

      verifyShippingZone(newShippingZones, payloadShippingZones);

      zoneId = newShippingZones[0].id;
      profileBody.shipping_zones = newShippingZones;
    });

    await test.step("Edit shipping zone vừa tạo", async () => {
      const payloadShippingZones = conf.caseConf.shipping_zones_edit as Array<ShippingZoneInfo>;
      payloadShippingZones[0].id = zoneId;
      const newShippingZones = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);

      verifyShippingZone(newShippingZones, payloadShippingZones);

      profileBody.shipping_zones = newShippingZones;
    });

    await test.step("Delete shipping zone vừa tạo", async () => {
      const payloadShippingZones = [];
      const newShippingZone = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);

      // verify data
      expect(newShippingZone).toEqual(payloadShippingZones);
    });
  });

  test("Check chức năng add, edit, delete rate trong zone của 1 custom Profile @TC_SB_SET_SP_SPS_76_79_82", async ({
    conf,
    authRequest,
  }) => {
    const { domain } = conf.suiteConf as never;
    const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);
    let profileBody;
    let profileId;
    const rateID = [];

    await test.step("Tạo mới một custom shipping profile và một shipping zone trong đó", async () => {
      const profileData = conf.caseConf.profile_data;
      profileBody = await shippingSettingAPI.createShippingProfile(profileData);
      const payloadShippingZones = conf.caseConf.shipping_zones_create;
      const newShippingZones = await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);
      profileBody.shipping_zones = newShippingZones;
      profileId = profileBody.id;
    });

    await test.step("Tạo mới một item based rate", async () => {
      const payloadShippingRate = conf.caseConf.item_based_shipping_rate_create;
      const newItemBaseRate = await shippingSettingAPI.updateShippingRates(profileBody, payloadShippingRate);

      // verify data
      if (newItemBaseRate.type === "item_based") {
        verifyItemBasedRates(newItemBaseRate, payloadShippingRate);
      }
      rateID[0] = newItemBaseRate.rates[0].id;
    });

    await test.step("Edit item based rate vừa tạo", async () => {
      const payloadShippingRate = conf.caseConf.item_based_shipping_rate_edit;
      payloadShippingRate.rates[0].id = rateID[0];
      const newItemBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      // verify data
      if (newItemBaseRate.type === "item_based") {
        verifyItemBasedRates(newItemBaseRate, payloadShippingRate);
      }
    });

    await test.step("Delete item based rate vừa tạo", async () => {
      const payloadShippingRate: ShippingRates = {
        type: "item_based",
        rates: [],
      };
      const newItemBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      // verify data
      expect(newItemBaseRate).toEqual(payloadShippingRate);
    });

    await test.step("Tạo mới một price based rate", async () => {
      const payloadShippingRate = conf.caseConf.price_based_shipping_rate_create;
      const newPriceBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      //verify data
      if (newPriceBasedRates.type === "price_based") {
        verifyPriceBasedRates(newPriceBasedRates, payloadShippingRate);
      }
      rateID[0] = newPriceBasedRates.rates[0].id;
      rateID[1] = newPriceBasedRates.rates[1].id;
    });

    await test.step("Edit price based rate vừa tạo", async () => {
      const payloadShippingRate = conf.caseConf.price_based_shipping_rate_create;
      const lengthList = payloadShippingRate.rates.length;
      for (let i = 1; i < lengthList; i++) {
        payloadShippingRate.rates[i].id = rateID[i];
      }
      const newPriceBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      //verify data
      if (newPriceBasedRates.type === "price_based") {
        verifyPriceBasedRates(newPriceBasedRates, payloadShippingRate);
      }
    });

    await test.step("Delete price based rate vừa tạo", async () => {
      const payloadShippingRate: ShippingRates = {
        type: "price_based",
        rates: [],
      };
      const newPriceBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);
      expect(newPriceBaseRate).toEqual(payloadShippingRate);
    });

    await test.step("Tạo mới một weight based rate", async () => {
      const payloadShippingRate = conf.caseConf.weight_based_shipping_rate_create;
      const newWeightBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      //verify data
      if (newWeightBasedRates.type === "weight_based") {
        verifyWeightBasedRates(newWeightBasedRates, payloadShippingRate);
      }
      rateID[0] = newWeightBasedRates.rates[0].id;
    });

    await test.step("Edit weight based rate vừa tạo", async () => {
      const payloadShippingRate = conf.caseConf.weight_based_shipping_rate_edit;
      payloadShippingRate.rates[0].id = rateID[0];
      const newWeightBasedRates = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);

      // verify
      if (newWeightBasedRates.type === "weight_based") {
        verifyWeightBasedRates(newWeightBasedRates, payloadShippingRate);
      }
    });

    await test.step("Delete weight based rate vừa tạo", async () => {
      const payloadShippingRate: ShippingRates = {
        type: "weight_based",
        rates: [],
      };
      const newPriceBaseRate = await shippingSettingAPI.updateShippingRates(profileId, payloadShippingRate);
      expect(newPriceBaseRate).toEqual(payloadShippingRate);
    });
  });
});
