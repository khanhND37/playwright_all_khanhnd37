import { APIRequestContext, expect } from "@playwright/test";
import type { ShippingZoneInfo, ShippingProfile, ShippingRates, ItemBasedShippingRate } from "@types";

export class SettingShippingAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  //=== Shipping Profiles SBase ================================================
  /**
   * Create a shipping profile
   * @param profileData
   * @returns body of response of the new shipping profile
   */
  async createShippingProfile(profileData: ShippingProfile): Promise<ShippingProfile> {
    const resNewProfile = await this.request.post(`https://${this.domain}/admin/shipping/profile.json`, {
      data: {
        ...profileData,
      },
    });
    if (resNewProfile.ok()) {
      const resNewProfileBody = await resNewProfile.json();
      return resNewProfileBody.shipping_profile;
    }
    return Promise.reject(`Error message: ${(await resNewProfile.json()).error} ${new Error().stack}`);
  }

  /**
   * Get body of API shipping profile with profile ID
   * @param profileID
   * @returns
   */
  async getProfileInfoById(profileID: number): Promise<ShippingProfile> {
    const resProfile = await this.request.get(`https://${this.domain}/admin/shipping/profile/${profileID}.json`);
    if (resProfile.ok()) {
      const resProfileBody = await resProfile.json();
      return resProfileBody.shipping_profile;
    }
    return Promise.reject(`Error message: ${(await resProfile.json()).error} ${new Error().stack}`);
  }

  /**
   * Get body of API general shipping profile
   * @returns
   */
  async getGeneralProfileInfo(): Promise<ShippingProfile> {
    const resProfile = await this.request.get(`https://${this.domain}/admin/shipping/profiles.json?general_only=true`);
    if (resProfile.ok()) {
      const resProfileBody = await resProfile.json();
      return resProfileBody.data[0];
    }
    return Promise.reject(`Error message: ${(await resProfile.json()).error} ${new Error().stack}`);
  }

  /**
   * Edit a shipping profile with profile ID
   * @param profileID
   * @param payload
   * @returns body of shipping profile after update
   */
  async editShippingProfileById(profileID: number, payload: ShippingProfile): Promise<ShippingProfile> {
    const res = await this.request.put(`https://${this.domain}/admin/shipping/profile/${profileID}.json`, {
      data: payload,
    });
    if (res.ok) {
      return await this.getProfileInfoById(profileID);
    }
    return Promise.reject(`editShippingProfileById Error: ${res.status}`);
  }

  /**
   * Delete custom profile with profile ID
   * @param profileID
   */
  async deleteCustomProfile(profileID: number): Promise<boolean> {
    const res = await this.request.delete(`https://${this.domain}/admin/shipping/profile/${profileID}.json`);
    if (res.ok) {
      return true;
    }
    return false;
  }

  /**
   * Get list of custom profiles
   * @returns
   */
  async getListCustomProfiles(): Promise<Array<ShippingProfile>> {
    // get list custom profile
    const res = await this.request.get(`https://${this.domain}/admin/shipping/profiles.json?custom_only=true`);
    if (res.ok) {
      return (await res.json()).data || [];
    }
    return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
  }

  /**
   * Delete all current custom profiles
   * @returns
   */
  async deleteAllCustomProfile(): Promise<boolean> {
    const listCustomProfiles = await this.getListCustomProfiles();
    let isSuccess = true;
    const lengthList = listCustomProfiles.length;
    for (let i = 0; i < lengthList; i++) {
      const respone = await this.deleteCustomProfile(listCustomProfiles[i].id);
      if (!respone) {
        isSuccess = false;
        break;
      }
    }
    return isSuccess;
  }

  /**
   * Delete all current zones of General profile
   * @returns
   */
  async deleteAllZonesOfGeneralProfile(): Promise<ShippingProfile> {
    const bodyProfile = await this.getGeneralProfileInfo();
    // remove all shipping zone
    bodyProfile.shipping_zones = [];
    return await this.editShippingProfileById(bodyProfile.id, {
      ...bodyProfile,
    });
  }

  /**
   * Update shipping zones of profile
   * @param currentProfileInfo can be current Profile ID, or full body of current Profile.
   * @param payloadShippingZones
   *           - if have object "id": action <=> update shipping zone with ID
   *           - if don't have "id" : action <=> create/replate shipping zone
   * @returns new body of shipping zone
   */
  async updateShippingZones(
    currentProfileInfo: number | ShippingProfile,
    payloadShippingZones: Array<ShippingZoneInfo>,
  ): Promise<Array<ShippingZoneInfo>> {
    let profileId: number;
    let bodyProfile: ShippingProfile;
    if (typeof currentProfileInfo === "number") {
      profileId = currentProfileInfo;
      bodyProfile = await this.getProfileInfoById(profileId);
    } else {
      profileId = currentProfileInfo.id;
      bodyProfile = currentProfileInfo;
    }

    bodyProfile.shipping_zones = payloadShippingZones;
    const newProfileBody = await this.editShippingProfileById(profileId, { ...bodyProfile });

    // return new body of shipping zone
    const newShippingZones: Array<ShippingZoneInfo> = newProfileBody.shipping_zones;
    return newShippingZones;
  }

  /**
   * Update shipping rate of shipping profile
   * @param currentProfileInfo can be current Profile ID, or full body of current Profile.
   * @param payloadShippingRates
   * @returns shipping rates info
   */
  async updateShippingRates(
    currentProfileInfo: number | ShippingProfile,
    payloadShippingRates: ShippingRates,
  ): Promise<ShippingRates> {
    let profileId: number;
    let bodyProfile: ShippingProfile;
    if (typeof currentProfileInfo === "number") {
      profileId = currentProfileInfo;
      bodyProfile = await this.getProfileInfoById(profileId);
    } else {
      profileId = currentProfileInfo.id;
      bodyProfile = currentProfileInfo;
    }

    // do nothing if profile don't have any shipping zone
    if (!bodyProfile.shipping_zones?.length) {
      return;
    }

    switch (payloadShippingRates.type) {
      case "item_based":
        bodyProfile.shipping_zones[0].item_based_shipping_rate = payloadShippingRates.rates;
        break;
      case "price_based":
        bodyProfile.shipping_zones[0].price_based_shipping_rate = payloadShippingRates.rates;
        break;
      case "weight_based":
        bodyProfile.shipping_zones[0].weight_based_shipping_rate = payloadShippingRates.rates;
        break;
    }
    const newProfileBody = await this.editShippingProfileById(profileId, { ...bodyProfile });

    // return rate info
    const newShippingRates: ShippingRates = {
      type: payloadShippingRates.type,
      rates: [],
    };

    switch (payloadShippingRates.type) {
      case "item_based":
        if (newProfileBody.shipping_zones[0].item_based_shipping_rate) {
          newShippingRates.rates = newProfileBody.shipping_zones[0].item_based_shipping_rate;
        }
        break;
      case "price_based":
        if (newProfileBody.shipping_zones[0].price_based_shipping_rate) {
          newShippingRates.rates = newProfileBody.shipping_zones[0].price_based_shipping_rate;
        }
        break;
      case "weight_based":
        if (newProfileBody.shipping_zones[0].weight_based_shipping_rate) {
          newShippingRates.rates = newProfileBody.shipping_zones[0].weight_based_shipping_rate;
        }
        break;
    }
    return newShippingRates;
  }

  //=== Shipping base Zones SBase ================================================
  /**
   * Create new shipping zone
   * @param shippingZone is info of shipping zone
   * return Item base rate shipping rate: name, first item price, additional item price ...
   */
  async createShippingZone(shippingZone: ShippingZoneInfo): Promise<ItemBasedShippingRate> {
    const resNewShippingZone = await this.request.post(`https://${this.domain}/admin/shipping/zone.json`, {
      data: {
        ...shippingZone,
      },
    });
    if (resNewShippingZone.ok()) {
      const resNewShippingZoneBody = await resNewShippingZone.json();
      return resNewShippingZoneBody.item_based_shipping_rate;
    }
    return Promise.reject(`Error message: ${(await resNewShippingZone.json()).error} ${new Error().stack}`);
  }

  /**
   * Delete all shipping zone
   */
  async deleteAllShippingZone() {
    const listShippingZones = await this.getListShippingZone();
    if (!listShippingZones || listShippingZones.length === 0) {
      return;
    }
    const lengthList = listShippingZones.length;
    for (let i = 0; i < lengthList; i++) {
      await this.deleteShippingZoneWithId(listShippingZones[i].id);
    }
  }

  /**
   * get all shipping zone
   * return shipping zone plb: name, item base rate name, id, countries ...
   */
  async getListShippingZone(): Promise<ShippingZoneInfo[]> {
    const response = await this.request.get(`https://${this.domain}/admin/shipping/zones.json`);
    expect(response.ok()).toBeTruthy();
    const resp = await response.json();
    return resp.shipping_zones;
  }

  /**
   * Delete shipping zone with profile ID
   * @param shippingZoneId is shipping zone ID
   */
  async deleteShippingZoneWithId(shippingZoneId: number) {
    const res = await this.request.delete(`https://${this.domain}/admin/shipping/zone/${shippingZoneId}.json`);
    expect(res.ok()).toBeTruthy();
  }

  /**
   * Get shipping zone id list
   * @returns list of shipping zone ID
   */
  async getListShippingZoneID(): Promise<Array<number>> {
    const shippingIdList = [];
    const resBody = await this.getListShippingZone();
    if (resBody == null) {
      return shippingIdList;
    }
    const shippingZoneList = resBody;
    for (const shippingZone of shippingZoneList) {
      shippingIdList.push(shippingZone.id);
    }
    return shippingIdList;
  }

  /**
   * update shipping zone with shipping zone ID
   * @param shippingZoneId is shipping zone ID
   */
  async updateShippingZone(shippingZone: ShippingZoneInfo) {
    expect(shippingZone.id).toBeGreaterThan(0);
    const res = await this.request.put(`https://${this.domain}/admin/shipping/zone/${shippingZone.id}.json`, {
      data: shippingZone,
    });
    expect(res.ok()).toBeTruthy();
    return res;
  }

  /**
   * get first shipping zone id by zone name
   * @param zoneName zone name
   * @returns zone id
   */
  async getZoneIdByName(zoneName: string): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/shipping/zones.json`);
    expect(res.ok()).toBeTruthy();
    const resBody = await res.json();
    const zoneID = resBody.shipping_zones.find(({ name }) => name === zoneName).id;
    return zoneID;
  }

  /**
   * get first shipping zone info by zone name
   * @param zoneName ZONE NAME
   * @returns Shipping zone info
   */
  async getShippingZoneInfo(zoneName: string): Promise<ShippingZoneInfo> {
    const zoneID = await this.getZoneIdByName(zoneName);
    const res = await this.request.get(`https://${this.domain}/admin/shipping/zone/${zoneID}.json`);
    expect(res.ok()).toBeTruthy();
    return await res.json();
  }

  /**
   * Add shipping zone to store by call api
   * @param shippingZoneInfo shipping zone info
   */
  async addShippingZone(shippingZoneInfo: ShippingZoneInfo) {
    const res = await this.request.post(`https://${this.domain}/admin/shipping/zone.json`, {
      data: shippingZoneInfo,
    });
    expect(res.status()).toBe(200);
  }
}
