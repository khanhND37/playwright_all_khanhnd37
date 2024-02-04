import { APIRequestContext, expect, Page } from "@playwright/test";
import type { DefaultVariantSettings, FacebookConversions } from "../../../../types/sbase/online_store_api";

export class PreferencesAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;
  requestURL: string;

  constructor(domain: string, request?: APIRequestContext, page?: Page) {
    this.page = page;
    this.domain = domain;
    this.request = request;
    this.requestURL = `https://${this.domain}/admin/setting/online-store-preferences.json`;
  }

  /**
   * On/off feature print file generating
   * @param shopID
   */
  async activatePrintFile(shopID: number, disable: boolean) {
    const res = await this.request.put(this.requestURL, {
      data: {
        print_file: {
          disable: disable,
        },
        shop_id: shopID,
      },
    });
    await expect(res.status()).toBe(200);
  }

  /**
   * Setting default variant selection
   * @param defaultVariantSettings setting for default variant
   * @param shopID
   */
  async settingDefaultVariantSelection(defaultVariantSettings: DefaultVariantSettings, shopID: number) {
    const res = await this.request.put(this.requestURL, {
      data: {
        default_variant_settings: defaultVariantSettings,
        shop_id: shopID,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Setting Id for Google Analytics
   * @param googleAnalyticsId Id of Google Analytics
   * @param shopId Id of shop
   */
  async settingGoogleAnalytics(googleAnalyticsId: string, shopId: number) {
    const url = this.requestURL + `?storefront_id=${shopId}`;
    const res = await this.request.put(url, {
      data: {
        ga_id: googleAnalyticsId,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Setting Facebook Pixel & Conversions API
   * @param facebookConversions
   * @param shopId Id of shop
   */
  async settingFacebook(facebookConversions: Array<FacebookConversions>, pixelId: string, shopId: number) {
    const url = this.requestURL + `?storefront_id=${shopId}`;
    const res = await this.request.put(url, {
      data: {
        facebook_conversions_api: facebookConversions,
        fb_pixel_id: pixelId,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * go to preferences page
   */
  async goToPreferencesPage() {
    await this.page.goto(`https://${this.domain}/admin/preferences`, { waitUntil: "load" });
  }

  /**
   * action tick / untick checkbox Enable password and save it
   * @param shopId
   * @param status
   */
  async updatePasswordSF() {
    await this.goToPreferencesPage();
    await this.page.locator("//input/following-sibling::span[contains(text(), 'Enable password')]").click();
    await this.page.locator("//button[contains(@class,'btn-primary')]//span[contains(text(), 'Save')]").click();
    await this.page.waitForLoadState("networkidle");
  }
}
