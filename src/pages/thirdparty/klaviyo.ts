import { SBPage } from "@pages/page";
import { expect } from "@playwright/test";
import type { ProductKlaviyo } from "@types";
import { APIRequestContext, Page } from "@playwright/test";

class KlaviyoProfile {
  private id: string;
  private address1: string;
  private address2: string;
  private city: string;
  private country: string;
  private region: string;
  private zip: string;
  private organization: string;
  private firstName: string;
  private lastName: string;
  private title: string;
  private email: string;
  private phoneNumber: string;

  constructor(id: string) {
    this.id = id;
  }

  async setKlaviyoProfile(
    id: string,
    address1: string,
    address2: string,
    city: string,
    country: string,
    region: string,
    zip: string,
    organization: string,
    firstName: string,
    lastName: string,
    title: string,
    email: string,
    phoneNumber: string,
  ) {
    this.id = id;
    this.address1 = address1;
    this.address2 = address2;
    this.city = city;
    this.country = country;
    this.region = region;
    this.zip = zip;
    this.organization = organization;
    this.firstName = firstName;
    this.lastName = lastName;
    this.title = title;
    this.email = email;
    this.phoneNumber = phoneNumber;
  }

  async setId(id: string) {
    this.id = id;
  }

  async getId() {
    return this.id;
  }

  async setAddress1(address1: string) {
    this.address1 = address1;
  }

  async getAddress1() {
    return this.address1;
  }

  async setAddress2(address2: string) {
    this.address2 = address2;
  }

  async getAddress2() {
    return this.address2;
  }

  async setCity(city: string) {
    this.city = city;
  }

  async getCity() {
    return this.city;
  }

  async setCountry(country: string) {
    this.country = country;
  }

  async getCountry() {
    return this.country;
  }

  async setRegion(region: string) {
    this.region = region;
  }

  async getRegion() {
    return this.region;
  }

  async setZip(zip: string) {
    this.zip = zip;
  }

  async getZip() {
    return this.zip;
  }

  async setOrganization(organization: string) {
    this.organization = organization;
  }

  async getOrganization() {
    return this.organization;
  }

  async setFirstname(firstName: string) {
    this.firstName = firstName;
  }

  async getFirstname() {
    return this.firstName;
  }

  async setLastname(lastName: string) {
    this.lastName = lastName;
  }

  async getLastname() {
    return this.lastName;
  }

  async setTitle(title: string) {
    this.title = title;
  }

  async getTitle() {
    return this.title;
  }

  async setEmail(email: string) {
    this.email = email;
  }

  async getEmail() {
    return this.email;
  }

  async setPhoneNumber(phoneNumber: string) {
    this.phoneNumber = phoneNumber;
  }

  async getPhoneNumber() {
    return this.phoneNumber;
  }
}

export class Klaviyo extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get profile_id from customer_email via api
   * @param email
   * @param privateApiKey
   * @returns id - Klaviyo profile_id
   */
  async getProfileIdByEmail(email: string, privateApiKey: string, request: APIRequestContext) {
    const response = await request.get(
      `https://a.klaviyo.com/api/v2/people/search?email=${email}&api_key=${privateApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return response.json().then(result => result[`id`]);
    } else {
      return null;
    }
  }

  /**
   * Get profile information from profileId via api
   * @param profileId
   * @param privateApiKey
   * @returns new KlaviyoProfile
   */
  async getProfileById(profileId: string, privateApiKey: string, request: APIRequestContext) {
    const profile = new KlaviyoProfile(profileId);
    const response = await request.get(`https://a.klaviyo.com/api/v1/person/${profileId}?api_key=${privateApiKey}`, {
      headers: {
        Accept: "application/json",
      },
    });
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return response
        .json()
        .then(response =>
          profile.setKlaviyoProfile(
            response[`id`],
            response[`$address1`],
            response[`$address2`],
            response[`$city`],
            response[`$country`],
            response[`$region`],
            response[`$zip`],
            response[`$organization`],
            response[`$first_name`],
            response[`last_name`],
            response[`title`],
            response[`email`],
            response[`phone_number`],
          ),
        );
    } else {
      return null;
    }
  }

  /**
   * Get events list for all metrics from profileId via api
   * @param profileId
   * @param privateApiKey
   * @returns event list
   */
  async getEventsForAllMetricsByProfileId(profileId: string, privateApiKey: string, request: APIRequestContext) {
    const response = await request.get(
      `https://a.klaviyo.com/api/v1/person/${profileId}/metrics/timeline?count=50&sort=desc&api_key=${privateApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return response.json().then(result => result);
    } else {
      return null;
    }
  }

  /**
   * Get events list for special metric by metricId from profileId via api
   * @param profileId
   * @param metricId : statistic_id
   * @param privateApiKey
   * @returns events list for special metric of profileId
   */
  async getEventsForSpecialMetricByProfileId(
    profileId: string,
    metricId: string,
    privateApiKey: string,
    request: APIRequestContext,
  ) {
    const response = await request.get(
      `https://a.klaviyo.com/api/v1/person/${profileId}/metric/${metricId}/timeline` +
        `?count=1&sort=desc&api_key=${privateApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return await response.json().then(result => result.data[0].event_properties);
    } else {
      return null;
    }
  }

  /**
   * Verify event Viewed Product is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventViewedProduct(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    if (
      event[`ProductName`] == products[0].product_name &&
      event[`ProductID`] == products[0].first_variant_id &&
      event[`VariantName`] == products[0].first_variant_name &&
      event[`VariantSKU`] == products[0].variant_sku &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`ImageURL`] == products[0].image_url &&
      event[`URL`] == `https://` + conditions[`domain`] + products[0].url &&
      event[`Brand`] == products[0].brand &&
      event[`Price`] == products[0].price &&
      event[`CompareAtPrice`] == products[0].compare_at_price
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Verify event Added to Cart is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventAddedToCart(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity &&
      event[`AddedItemProductID`] == id &&
      event[`AddedItemProductName`] == products[0].product_name &&
      event[`AddedItem_Brand`] == products[0].brand &&
      event[`AddedItem_Categories`].toString() == products[0].categories.toString() &&
      event[`AddedItem_ImageURL`] == products[0].image_url &&
      event[`AddedItem_Price`] == products[0].price &&
      event[`AddedItem_Quantity`] == products[0].quantity &&
      event[`AddedItem_SKU`] == products[0].item_sku &&
      event[`AddedItem_URL`] == `https://` + conditions[`domain`] + id
    ) {
      if (
        event[`Items`][0].Brand == products[0].brand &&
        event[`Items`][0].ImageURL == products[0].image_url &&
        event[`Items`][0].ItemPrice == products[0].price &&
        event[`Items`][0].ProductCategories.toString() == products[0].categories.toString() &&
        event[`Items`][0].ProductID == id &&
        event[`Items`][0].ProductName == products[0].product_name &&
        event[`Items`][0].ProductURL == `https://` + conditions[`domain`] + products[0].variant_url &&
        event[`Items`][0].Quantity == products[0].quantity &&
        event[`Items`][0].RowTotal == products[0].price * products[0].quantity &&
        event[`Items`][0].SKU == products[0].sku &&
        event[`Items`][0].VariantName == products[0].variant_name
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Verify event Started Checkout is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventStartedCheckout(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`ItemNames`][0] == products[0].product_name
    ) {
      if (
        event[`Items`][0].Brand == products[0].brand &&
        event[`Items`][0].ImageURL == products[0].image_url &&
        event[`Items`][0].ItemPrice == products[0].price &&
        event[`Items`][0].ProductCategories.toString() == products[0].categories.toString() &&
        event[`Items`][0].ProductID == id &&
        event[`Items`][0].ProductName == products[0].product_name &&
        event[`Items`][0].ProductURL == `https://` + conditions[`domain`] + products[0].variant_url &&
        event[`Items`][0].Quantity == products[0].quantity &&
        event[`Items`][0].RowTotal == products[0].price * products[0].quantity &&
        event[`Items`][0].SKU == products[0].sku &&
        event[`Items`][0].VariantName == products[0].variant_name
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Verify event Ordered Order is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventOrderedProduct(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity + products[0].shipping_fee &&
      event[`Brand`] == products[0].brand &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`ProductID`] == id &&
      event[`ProductName`] == products[0].product_name &&
      event[`Quantity`] == products[0].quantity &&
      event[`RowTotal`] == products[0].price * products[0].quantity &&
      event[`VariantID`] == id &&
      event[`VariantImageURL`] == products[0].image_url &&
      event[`VariantName`] == products[0].variant_name &&
      event[`VariantPrice`] == products[0].price &&
      event[`VariantSKU`] == products[0].item_sku &&
      event[`VariantURL`] == `https://` + conditions[`domain`] + products[0].variant_url
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Verify event Placed Order is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventPlacedOrder(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity + products[0].shipping_fee &&
      event[`Brands`].toString() == products[0].brand &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`Discount Code`] == products[0].discount_code &&
      event[`Discount Value`] == products[0].discount_value &&
      event[`ItemNames`].toString() == products[0].product_name &&
      event[`Shipping`] == products[0].shipping_fee &&
      event[`Subtotal`] == products[0].price * products[0].quantity
    ) {
      if (
        event[`Items`][0][`Brand`] == products[0].brand &&
        event[`Items`][0][`Categories`].toString() == products[0].categories.toString() &&
        event[`Items`][0][`ProductID`] == id &&
        event[`Items`][0][`ProductName`] == products[0].product_name &&
        event[`Items`][0][`Quantity`] == products[0].quantity &&
        event[`Items`][0][`RowTotal`] == products[0].price * products[0].quantity &&
        event[`Items`][0][`VariantID`] == id &&
        event[`Items`][0][`VariantImageURL`] == products[0].image_url &&
        event[`Items`][0][`VariantName`] == products[0].variant_name &&
        event[`Items`][0][`VariantPrice`] == products[0].price &&
        event[`Items`][0][`VariantSKU`] == products[0].item_sku &&
        event[`Items`][0][`VariantURL`] == `https://` + conditions[`domain`] + products[0].variant_url
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Verify event Fulfilled Order is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventFulfilledOrder(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity + products[0].shipping_fee &&
      event[`Brands`].toString() == products[0].brand &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`Discount Code`] == products[0].discount_code &&
      event[`Discount Value`] == products[0].discount_value &&
      event[`ItemNames`].toString() == products[0].product_name &&
      event[`Shipping`] == products[0].shipping_fee &&
      event[`Subtotal`] == products[0].price * products[0].quantity
    ) {
      if (
        event[`Items`][0][`Brand`] == products[0].brand &&
        event[`Items`][0][`Categories`].toString() == products[0].categories.toString() &&
        event[`Items`][0][`ProductID`] == id &&
        event[`Items`][0][`ProductName`] == products[0].product_name &&
        event[`Items`][0][`Quantity`] == products[0].quantity &&
        event[`Items`][0][`RowTotal`] == products[0].price * products[0].quantity &&
        event[`Items`][0][`VariantID`] == id &&
        event[`Items`][0][`VariantImageURL`] == products[0].image_url &&
        event[`Items`][0][`VariantName`] == products[0].variant_name &&
        event[`Items`][0][`VariantPrice`] == products[0].price &&
        event[`Items`][0][`VariantSKU`] == products[0].item_sku &&
        event[`Items`][0][`VariantURL`] == `https://` + conditions[`domain`] + products[0].variant_url
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Verify event Refunded Order is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventRefundedOrder(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity + products[0].shipping_fee &&
      event[`Brands`].toString() == products[0].brand &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`Discount Code`] == products[0].discount_code &&
      event[`Discount Value`] == products[0].discount_value &&
      event[`ItemNames`].toString() == products[0].product_name &&
      event[`Shipping`] == products[0].shipping_fee &&
      event[`Subtotal`] == products[0].price * products[0].quantity
    ) {
      if (
        event[`Items`][0][`Brand`] == products[0].brand &&
        event[`Items`][0][`Categories`].toString() == products[0].categories.toString() &&
        event[`Items`][0][`ProductID`] == id &&
        event[`Items`][0][`ProductName`] == products[0].product_name &&
        event[`Items`][0][`Quantity`] == products[0].quantity &&
        event[`Items`][0][`RowTotal`] == products[0].price * products[0].quantity &&
        event[`Items`][0][`VariantID`] == id &&
        event[`Items`][0][`VariantImageURL`] == products[0].image_url &&
        event[`Items`][0][`VariantName`] == products[0].variant_name &&
        event[`Items`][0][`VariantPrice`] == products[0].price &&
        event[`Items`][0][`VariantSKU`] == products[0].item_sku &&
        event[`Items`][0][`VariantURL`] == `https://` + conditions[`domain`] + products[0].variant_url
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Verify event Cancelled Order is sent to Klaviyo
   * @param conditions includes domain, email, metricId, apiKey, products & request
   * @returns true | false
   */
  async verifyEventCanceledOrder(conditions: object) {
    const products: Array<ProductKlaviyo> = conditions["products"];
    const request: APIRequestContext = conditions["request"];

    const profileId = await this.getProfileIdByEmail(conditions["email"], conditions["apiKey"], request);
    const event: object = await this.getEventsForSpecialMetricByProfileId(
      profileId,
      conditions["metricId"],
      conditions["apiKey"],
      request,
    );

    // Nếu có variant có thêm track_id thì hệ thống sẽ gửi lên chính track-id đó thay vì product_id hoặc variant_id
    let id;
    if (products[0].track_id == "") {
      id = products[0].variant_id;
    } else {
      id = products[0].track_id;
    }

    if (
      event[`$value`] == products[0].price * products[0].quantity + products[0].shipping_fee &&
      event[`Brands`].toString() == products[0].brand &&
      event[`Categories`].toString() == products[0].categories.toString() &&
      event[`Discount Code`] == products[0].discount_code &&
      event[`Discount Value`] == products[0].discount_value &&
      event[`ItemNames`].toString() == products[0].product_name &&
      event[`Shipping`] == products[0].shipping_fee &&
      event[`Subtotal`] == products[0].price * products[0].quantity
    ) {
      if (
        event[`Items`][0][`Brand`] == products[0].brand &&
        event[`Items`][0][`Categories`].toString() == products[0].categories.toString() &&
        event[`Items`][0][`ProductID`] == id &&
        event[`Items`][0][`ProductName`] == products[0].product_name &&
        event[`Items`][0][`Quantity`] == products[0].quantity &&
        event[`Items`][0][`RowTotal`] == products[0].price * products[0].quantity &&
        event[`Items`][0][`VariantID`] == id &&
        event[`Items`][0][`VariantImageURL`] == products[0].image_url &&
        event[`Items`][0][`VariantName`] == products[0].variant_name &&
        event[`Items`][0][`VariantPrice`] == products[0].price &&
        event[`Items`][0][`VariantSKU`] == products[0].item_sku &&
        event[`Items`][0][`VariantURL`] == `https://` + conditions[`domain`] + products[0].variant_url
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Get timestamp of first event for special metric by metricId from profileId via api
   * @param profileId
   * @param metricId
   * @param privateApiKey
   * @returns timestamp of 1st event for special metric of profileId
   */
  async getTimestampOfFirstEventForSpecialMetricByProfileId(
    profileId: string,
    metricId: string,
    privateApiKey: string,
    request: APIRequestContext,
  ) {
    const response = await request.get(
      `https://a.klaviyo.com/api/v1/person/${profileId}/metric/${metricId}/timeline` +
        `?count=50&sort=desc&api_key=${privateApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return response.json().then(result => result.data[0].timestamp);
    } else {
      return null;
    }
  }

  /**
   * Get count of event type using metricId by profileId via api
   * @param profileId
   * @param metricId
   * @param privateApiKey
   * @returns count of event for special metric of profileId
   */
  async getCountOfEventForSpecialMetricByProfileId(
    profileId: string,
    metricId: string,
    privateApiKey: string,
    request: APIRequestContext,
  ) {
    const response = await request.get(
      `https://a.klaviyo.com/api/v1/person/${profileId}/metric/${metricId}/timeline` +
        `?count=50&sort=desc&api_key=${privateApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return response.json().then(result => result.count);
    } else {
      return null;
    }
  }

  /**
   * Get events list for special metric using metricId via api
   * @param metricId
   * @param privateApiKey
   * @returns events list for special metric
   */
  async getEventsForSpecialMetric(metricId: string, privateApiKey: string, request: APIRequestContext) {
    const response = await request.get(
      `https://a.klaviyo.com/api/v1/metric/${metricId}/timeline` + `?api_key=${privateApiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    if (response.status() == 200) {
      return response.json().then(result => result);
    } else {
      return null;
    }
  }
}
