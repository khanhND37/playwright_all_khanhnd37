import { APIRequestContext, expect } from "@playwright/test";
import type { LanguageSetting, ResponeLanguageList, Language } from "@types";

export class LanguageAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  async createLanguageByAPI(body: LanguageSetting): Promise<number> {
    const res = await this.request.post(`https://${this.domain}/admin/translations/translation-settings.json`, {
      data: body,
    });
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    return result.last_id;
  }

  async getAllLanguageByAPI(): Promise<ResponeLanguageList> {
    const res = await this.request.get(`https://${this.domain}/admin/translations/translation-settings.json`);
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    return result;
  }

  async deleteLanguageByAPI(id: number) {
    const res = await this.request.delete(`https://${this.domain}/admin/translations/translation-settings.json`, {
      data: { id: id },
    });
    expect(res.ok()).toBeTruthy();
  }

  async setDefaultLanguageByAPI(body: Language) {
    const res = await this.request.put(`https://${this.domain}/admin/translations/translation-settings.json`, {
      data: body,
    });
    expect(res.ok()).toBeTruthy();
  }

  /**
   * delete Cache Locale on SF
   */
  async deleteCacheLocaleOnSF(shopId: number, localeCode: string) {
    const res = await this.request.delete(`https://${this.domain}/cache/locale`, {
      data: {
        type: "shop",
        handle: "outside",
        shop_id: shopId,
        locale: localeCode,
      },
    });
    expect(res.ok()).toBeTruthy();
  }
}
