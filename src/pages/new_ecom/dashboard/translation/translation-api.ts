import { OcgLogger } from "@core/logger";
import { buildQueryString } from "@core/utils/string";
import { expect } from "@playwright/test";
import {
  AuthRequestWithExchangeFixture,
  AvailableLocale,
  TranslateText,
  TranslationSettingApiRequest,
  TranslationSettingApiResponse,
  TranslationSettingApiUpdateBody,
} from "@types";

const logger = OcgLogger.get();

export class TranslationAPI {
  domain: string;
  request: AuthRequestWithExchangeFixture;

  constructor(domain: string, request: AuthRequestWithExchangeFixture) {
    this.domain = domain;
    this.request = request;
  }

  async getTranslationSettings(req: TranslationSettingApiRequest): Promise<TranslationSettingApiResponse> {
    const request = await this.request.changeToken();

    const res = await request.get(
      `https://${this.domain}/admin/translations/translation-setting.json${buildQueryString(req)}`,
    );
    if (!res.ok()) {
      const resData = await res.text();
      logger.info(`Got error when get translation setting: ${resData}`);
    }

    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    return result;
  }

  async updateTranslationSetting(body: TranslationSettingApiUpdateBody) {
    const request = await this.request.changeToken();

    logger.info(`Update body: ${JSON.stringify(body)}`);

    const res = await request.put(`https://${this.domain}/admin/translations/translation-settings.json`, {
      data: body,
    });
    if (!res.ok()) {
      const resData = await res.text();
      logger.info(`Got error when get translation setting: ${resData}`);
    }

    expect(res.ok()).toBeTruthy();
  }

  async isAutoTranslateEnable(localeCode: AvailableLocale, groupName: string): Promise<boolean> {
    const setting = await this.getTranslationSettings({
      locale_code: localeCode,
    });

    const group = setting.data.data.find(group => group.group.toLowerCase() === groupName.toLowerCase());
    return group.is_auto_translate;
  }

  async updateAutoTranslateSetting(localeCode: AvailableLocale, groupName: string, isEnable: boolean) {
    const setting = await this.getTranslationSettings({ locale_code: localeCode });
    const data = setting.data.data;

    for (const item of data) {
      if (item.group.toLowerCase() === groupName.toLowerCase()) {
        item.is_auto_translate = isEnable;
      }
      // Delete property payment_type
      delete item.payment_type;
    }

    const updateReq: TranslationSettingApiUpdateBody = {
      id: setting.data.id,
      data: data,
      published: setting.data.published,
    };

    await this.updateTranslationSetting(updateReq);
    logger.info(`Update auto translate setting: ${JSON.stringify(updateReq)}`);
  }

  /**
   * Get infomation of translate of content with chat GPT
   * @param dataTranslate is the request body
   */
  async translateTextWithAPI(dataTranslate: TranslateText) {
    const request = await this.request.changeToken();

    logger.info(`Update body: ${JSON.stringify(dataTranslate)}`);

    const res = await request.post(`https://${this.domain}/admin/translations/translate/internal.json`, {
      data: dataTranslate,
    });
    if (!res.ok()) {
      const resData = await res.text();
      logger.info(`Get data fail: ${resData}`);
    }
    expect(res.ok()).toBeTruthy();
    return res.json();
  }
}
