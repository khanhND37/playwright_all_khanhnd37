import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationAPI } from "@pages/new_ecom/dashboard/translation/translation-api";
let translationAPI: TranslationAPI;
test(`@SB_SET_LG_TLL_89 [API] Kiểm tra translate với các content của chat GPT`, async ({
  conf,
  authRequestWithExchangeToken,
}) => {
  translationAPI = new TranslationAPI(conf.suiteConf.domain, authRequestWithExchangeToken);
  await test.step(`Get data và verify bản dịch conten `, async () => {
    const itemText = conf.caseConf.data;
    const source = conf.caseConf.source;
    const target = conf.caseConf.target;

    for (const item of itemText) {
      const getDataTranslate = await translationAPI.translateTextWithAPI({
        q: [item.text],
        source: source,
        target: target,
      });
      const actualTranslate = getDataTranslate.data.translations[0].translatedText;
      const expectTranslate = item.translated;

      expect.soft(actualTranslate).toEqual(expectTranslate);
    }
  });
});
