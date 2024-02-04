import { expect, test } from "@core/fixtures";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { LanguageAPI } from "@pages/new_ecom/dashboard/translation/language-api";
import { Market } from "src/types/settings/global-market";
import { Language, LanguageSetting } from "src/types/settings/translation";
test.describe("", async () => {
  //   let marketList: GlobalMarketListPage;
  let marketPage: GlobalMarketAddPage,
    body: Market,
    languageAPI: LanguageAPI,
    bodyLanguage: LanguageSetting,
    bodySetDefaultLanguage: Language;

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;
    marketPage = new GlobalMarketAddPage(dashboard, suiteConf.domain, authRequest);
    languageAPI = new LanguageAPI(suiteConf.domain, authRequest);

    await test.step(`Precondition: edit primary market`, async () => {
      const allMarket = await marketPage.getAllMarketByAPI();
      const primaryMarket = allMarket.result.find(market => market.is_primary);

      body = {
        shop_id: suiteConf.shop_id,
        id: primaryMarket.id,
        global_market_countries: primaryMarket.global_market_countries,
        ...caseConf.currency_data,
      };

      if (
        primaryMarket.name !== caseConf.currency_data.name ||
        primaryMarket.currency !== caseConf.currency_data.currency
      ) {
        const result = await marketPage.editMarketByAPI(body, primaryMarket.id);
        expect(result.result.name).toEqual(caseConf.currency_data.name);
        expect(result.result.currency).toEqual(caseConf.currency_data.currency);
      }
    });

    await test.step(`Precondition: remove and add other market`, async () => {
      const otherMarket = await marketPage.getAllOtherMarketByAPI();
      for (const market of otherMarket) {
        await marketPage.deleteMarketByAPI(market.id);
      }
      for (const market of caseConf.other_market) {
        const result = await marketPage.createMarket(market);
        expect(result.result.name).toEqual(market.name);
      }
    });

    await test.step(`Precondition: remove and add language`, async () => {
      const allLanguage = await languageAPI.getAllLanguageByAPI();
      const expectedLanguageIsExist = await allLanguage.result.find(
        language => language.locale_name === caseConf.default_language.local_name,
      );

      // check language mong muốn là default có tồn tại trong shop rồi
      if (expectedLanguageIsExist) {
        const defaultLanguage = await allLanguage.result.find(language => language.is_default);
        bodySetDefaultLanguage = {
          id: expectedLanguageIsExist.id,
          published: true,
          is_default: true,
        };
        // nếu language tồn tại nhưng chưa set làm default thì thực hiện set default language đó
        if (defaultLanguage.locale_name !== caseConf.default_language.local_name) {
          await languageAPI.setDefaultLanguageByAPI(bodySetDefaultLanguage);
        }
      }
      // check nếu language mong muốn chưa tồn tại trong shop thì add thêm language đó và set nó làm default language
      else {
        bodyLanguage = {
          ...caseConf.default_language,
        };
        const idLanguage = await languageAPI.createLanguageByAPI(bodyLanguage);
        bodySetDefaultLanguage = {
          id: idLanguage,
          published: true,
          is_default: true,
        };
        await languageAPI.setDefaultLanguageByAPI(bodySetDefaultLanguage);
      }

      //sau khi setting default language > xóa các language còn lại > chỉ add thêm những language mong muốn vào shop
      const allLanguageAfter = await languageAPI.getAllLanguageByAPI();
      const otherLanguage = allLanguageAfter.result.filter(language => !language.is_default);
      if (otherLanguage.length > 0) {
        for (const language of otherLanguage) {
          await languageAPI.deleteLanguageByAPI(language.id);
        }
      }
      for (const language of caseConf.add_languages) {
        bodyLanguage = {
          ...language,
        };
        await languageAPI.createLanguageByAPI(bodyLanguage);
      }
    });
  });
  test(`@SB_SET_GM_MC_240 [WB - SF - UI/UX] Kiểm tra update UI/UX setting block Global Switch khi insert trong wb`, async ({}) => {
    await test.step(`Trong wb, insert block Global switcher vào page bất kì`, async () => {
      // fill your code here
    });

    await test.step(`Click vào block`, async () => {
      // fill your code here
    });

    await test.step(`- Chọn các giá trị tương ứng ở các droplist- Click btn Cancel trong popup`, async () => {
      // fill your code here
    });

    await test.step(`- Click lại vào block Global switcher và chọn các giá trị tương ứng ở các droplist- Click btn Save trong popup`, async () => {
      // fill your code here
    });

    await test.step(`- Click btn Save ở navigation Click icon Preview trong wb`, async () => {
      // fill your code here
    });

    await test.step(`Click vào block Golbal switcher`, async () => {
      // fill your code here
    });

    await test.step(`- Chọn các giá trị tương ứng ở các droplist- Click btn Cancel trong popup`, async () => {
      // fill your code here
    });

    await test.step(`- Click lại vào block Global switcher và chọn các giá trị tương ứng ở các droplist- Click btn Save trong popup`, async () => {
      // fill your code here
    });

    await test.step(`View SF shop, click`, async () => {
      // fill your code here
    });

    await test.step(`- Chọn các giá trị tương ứng ở các droplist- Click btn Cancel trong popup`, async () => {
      // fill your code here
    });

    await test.step(`- Click lại vào block Global switcher và chọn các giá trị tương ứng ở các droplist- Click btn Save trong popup`, async () => {
      // fill your code here
    });

    await test.step(`Trong wb, click droplist Type của các block trên`, async () => {
      // fill your code here
    });

    await test.step(`- Chọn Type = Icon only- Click btn Save ở navigation`, async () => {
      // fill your code here
    });

    await test.step(`- Click vào block, chọn country, currency, language- Click btn Save trong popup`, async () => {
      // fill your code here
    });

    await test.step(`- Click icon Preview- Click vào block, chọn country, currency, language- Click btn Save trong popup`, async () => {
      // fill your code here
    });

    await test.step(`- View SF shop, - Click vào block, chọn country, currency, language- Click btn Save trong popup`, async () => {
      // fill your code here
    });

    await test.step(`Test lại các step trên ở màn hình mobile`, async () => {
      // fill your code here
    });
  });
});
