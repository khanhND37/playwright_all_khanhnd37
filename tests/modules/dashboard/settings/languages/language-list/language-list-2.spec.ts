import { expect, test } from "@fixtures/website_builder";
import { LanguageList } from "@pages/new_ecom/dashboard/translation/language-list";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Settings } from "@pages/dashboard/settings";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { LanguageDetail } from "@pages/new_ecom/dashboard/translation/language-detail";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { LanguageAPI } from "@pages/new_ecom/dashboard/translation/language-api";

test.describe("Check function add language", async () => {
  let dashboardPage: DashboardPage;
  let settings: Settings;
  let onlineStore: OnlineStorePage;
  let languageList: LanguageList;
  let languageDetail: LanguageDetail;
  let templateId: number;
  let sfTranslation: SfTranslation;
  let sfTranslationMobile: SfTranslation;
  let languageAPI: LanguageAPI;

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    await test.step(`Login vào shop, đến màn language list`, async () => {
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.domain);
      settings = new Settings(dashboard, conf.suiteConf.domain);
      languageList = new LanguageList(dashboard, conf.suiteConf.domain);
      languageDetail = new LanguageDetail(dashboard, conf.suiteConf.domain);
      languageAPI = new LanguageAPI(conf.suiteConf.domain, authRequest);

      await dashboardPage.navigateToMenu("Online Store");
      await onlineStore.copyATheme(conf.suiteConf.theme_data.toString());
      templateId = await onlineStore.getThemeIdOfJustAddedTheme();
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: templateId,
      });

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();

      //Set English is default language
      const isEnglishVisible = await languageList
        .genLoc(languageList.xpathLangList.languageItemByName("Published languages", conf.suiteConf.language_default))
        .isVisible();
      if (!isEnglishVisible) {
        await languageList.addLanguages([conf.suiteConf.language_default]);
        await languageList.waitUntilMessHidden();
      }
      const isEnglishAsDefault = await languageList
        .genLoc(languageList.xpathLangList.languageLabel(conf.suiteConf.language_default, "Default"))
        .isVisible();
      if (!isEnglishAsDefault) {
        await languageList.setLanguageAsDefault(conf.suiteConf.language_default);
        await languageList.waitUntilMessHidden();
      }

      //Delete all other languages
      const allLanguages = (await languageAPI.getAllLanguageByAPI()).result;
      const otherLanguages = allLanguages.filter(language => !language.is_default);
      for (const language of otherLanguages) {
        await languageAPI.deleteLanguageByAPI(language.id);
      }
      await languageList.page.reload();
      await languageList.page.waitForLoadState("networkidle");
    });
  });

  test.afterEach(async ({ conf }) => {
    await test.step(`Login vào shop, đến màn language list`, async () => {
      const isPopupVisible = await languageList.genLoc(languageList.xpathLangList.closePopupBtn).isVisible();
      if (isPopupVisible) {
        await languageList.genLoc(languageList.xpathLangList.closePopupBtn).click();
      }
      await dashboardPage.navigateToMenu("Online Store");
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: conf.suiteConf.theme_data,
      });
      await onlineStore.actionWithThemes({
        action: "Remove",
        themeId: templateId,
      });
    });
  });

  test(`@SB_SET_TL_14 [DB - SF - Function - InFsw] Kiểm tra add language thành công, check hiển thị ở SF`, async ({
    conf,
    context,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`- Tại trang Languages, click btn Add language- Chọn 1 language bất kì- Click btn Add languages`, async () => {
      await languageList.addLanguages([caseConf.add_language]);
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(caseConf.mess_add_success);
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", caseConf.add_language),
        ),
      ).toBeVisible();
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(caseConf.add_language, "In progress")),
      ).toBeVisible();
    });

    await test.step(`Click vào language vừa add`, async () => {
      await languageList.openLanguageDetail("Published languages", caseConf.add_language);
      await expect(
        languageDetail.genLoc(languageDetail.xpathLD.titleLanguageDetail(caseConf.add_language)),
      ).toBeVisible();
      await expect(languageDetail.genLoc(languageDetail.xpathLD.alertTitle)).toHaveText(caseConf.title_in_progress);
      await expect(languageDetail.genLoc(languageDetail.xpathLD.alertDesc)).toHaveText(caseConf.desc_in_progress);
    });

    await test.step(`Trong dashboard, đợi sau khi hoàn thành bản dịch sang ngôn ngữ Indonesian thì reload page`, async () => {
      await languageDetail.waitForTranslationToCompleteAfterAddLanguage();
    });

    await test.step(`Click btn Back về màn list Language`, async () => {
      await languageDetail.genLoc(languageDetail.xpathLangList.backBtn).click();
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(caseConf.add_language, "In progress")),
      ).toBeHidden();
    });

    await test.step(`View SF shop, scroll đến block Global switch và chọn language = language vừa add`, async () => {
      //Check default SF desktop
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.openStorefront();
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.language_sf_default,
      );
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.paragraphHeader).nth(1)).toContainText(
        caseConf.default_paragraph_header,
      );

      //Check default SF mobile
      sfTranslationMobile = new SfTranslation(pageMobile, conf.suiteConf.domain);
      await sfTranslationMobile.openStorefront();
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.language_sf_default,
      );
      await expect(sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.paragraphHeader).nth(1)).toContainText(
        caseConf.default_paragraph_header,
      );

      //Đổi languague = language vừa add trên desktop
      await sfTranslation.changeSettingLanguage({
        language: caseConf.language_sf,
      });
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 7000 });
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.language_sf,
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${conf.caseName}-translated-to-${caseConf.add_language}.png`,
      });

      //Đổi languague = language vừa add trên mobile
      await sfTranslationMobile.changeSettingLanguage({
        language: caseConf.language_sf,
      });
      await sfTranslationMobile.page.waitForLoadState("networkidle", { timeout: 7000 });
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslationMobile.genLoc(sfTranslationMobile.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.language_sf,
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslationMobile.page,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${conf.caseName}-translated-to-${caseConf.add_language}-mobile.png`,
      });
    });
  });

  test(`@SB_SET_TL_15 [DB - SF - Function - InFsw] Kiểm tra add language thành công trong đó có language thuộc Europeans countries`, async ({
    pageMobile,
    conf,
    context,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    let noOfSelectedCountries: number;

    await test.step(`- Trong dashboard, tại màn list Languages, click btn Add language- Tích checkbox 1 số languages`, async () => {
      await languageList.genLoc(languageList.xpathLangList.addLanguage.addLanguageBtn).click();
      await languageList.waitUntilElementVisible(languageList.xpathLangList.addLanguage.addLanguagePopup);

      for (const language of caseConf.add_languages) {
        await languageList
          .genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language))
          .scrollIntoViewIfNeeded();
        await languageList.genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language)).click();
        await expect(
          languageList.genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language)),
        ).toBeChecked();
      }
    });

    await test.step(`- Click Select {X} languages in Europeans countries`, async () => {
      await languageList.genLoc(languageList.xpathLangList.addLanguage.euroCountries).click();
      for (const language of caseConf.add_languages) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language)),
        ).not.toBeChecked();
      }
      for (const language of caseConf.euro_countries) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language)),
        ).toBeChecked();
      }
      noOfSelectedCountries = await languageList.getNumberOfSelectedCountries();
      expect(noOfSelectedCountries).toEqual(caseConf.euro_countries.length);
    });

    await test.step(`- Click thêm các language khác- Click btn Add languages`, async () => {
      for (const language of caseConf.add_languages_2) {
        await languageList
          .genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language))
          .scrollIntoViewIfNeeded();
        await languageList.genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language)).click();
        await expect(
          languageList.genLoc(languageList.xpathLangList.addLanguage.languageCheckBox(language)),
        ).toBeChecked();
      }
      noOfSelectedCountries = await languageList.getNumberOfSelectedCountries();
      expect(noOfSelectedCountries).toEqual(caseConf.euro_countries.length + caseConf.add_languages.length);
      await languageList.genLoc(languageList.xpathLangList.addLanguage.addLanguageBtnOnPopup).click();
      await languageList.waitUntilMessVisible();
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(caseConf.mess_add_success);
      await languageList.waitUntilMessHidden();

      for (const language of caseConf.euro_countries) {
        await languageList
          .genLoc(languageList.xpathLangList.languageItemByName("Published languages", language))
          .scrollIntoViewIfNeeded();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageLabel(language, "In progress")),
        ).toBeVisible();
      }
      for (const language of caseConf.add_languages_2) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageLabel(language, "In progress")),
        ).toBeVisible();
      }
    });

    await test.step(`View SF shop, scoll đến block Global switch`, async () => {
      //Check SF desktop
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.openStorefront();
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslation.clickDropdownLanguageOnPopup();
      for (const language of caseConf.language_sf) {
        await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.option(language)).scrollIntoViewIfNeeded();
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.option(language))).toBeVisible();
      }

      //Check SF mobile
      sfTranslationMobile = new SfTranslation(pageMobile, conf.suiteConf.domain);
      await sfTranslationMobile.openStorefront();
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslationMobile.clickDropdownLanguageOnPopup();
      for (const language of caseConf.language_sf) {
        await sfTranslationMobile
          .genLoc(sfTranslation.xpathTranslate.popupSelect.option(language))
          .scrollIntoViewIfNeeded();
        await expect(
          sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.option(language)),
        ).toBeVisible();
      }
    });
  });
});
