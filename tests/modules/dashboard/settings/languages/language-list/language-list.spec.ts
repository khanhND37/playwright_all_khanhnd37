import { expect, test } from "@fixtures/website_builder";
import { LanguageList } from "@pages/new_ecom/dashboard/translation/language-list";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Settings } from "@pages/dashboard/settings";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { LanguageDetail } from "@pages/new_ecom/dashboard/translation/language-detail";
import { AccountPage } from "@pages/dashboard/accounts";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { GlobalMarkets } from "@pages/dashboard/global-markets";
import { GlobalMarketAPI } from "@pages/dashboard/settings/global-market/global-market-api";
import { LanguageAPI } from "@pages/new_ecom/dashboard/translation/language-api";
import { TemplateStorePage } from "@pages/storefront/template_store";

test.describe("Check UI tại màn language list", async () => {
  let dashboardPage: DashboardPage;
  let accountPage: AccountPage;
  let settings: Settings;
  let onlineStore: OnlineStorePage;
  let languageList: LanguageList;
  let templateId: number;
  let globalMarkets: GlobalMarkets;
  let templateStore: TemplateStorePage;

  test.beforeEach(async ({ conf, page, context }) => {
    await test.step(`Login vào shop, đến màn language list`, async () => {
      if (process.env.ENV === "prodtest") {
        return;
      }
      accountPage = new AccountPage(page, conf.suiteConf.domain_sign_in);
      await page.goto(`https://${conf.suiteConf.domain_sign_in}`);
      await page.waitForLoadState("networkidle");
      await accountPage.createNewShop(
        context,
        conf.suiteConf.account_create_shop.email,
        conf.suiteConf.account_create_shop.password,
        conf.suiteConf.account_create_shop.store_name,
        conf.suiteConf.shop_data,
      );
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);

      dashboardPage = new DashboardPage(page, conf.suiteConf.domain);
      onlineStore = new OnlineStorePage(page, conf.suiteConf.domain);
      settings = new Settings(page, conf.suiteConf.domain);
      globalMarkets = new GlobalMarkets(page, conf.suiteConf.domain);
      languageList = new LanguageList(page, conf.suiteConf.domain);
      templateStore = new TemplateStorePage(page);

      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.genLoc(templateStore.xpathBrowseTemplates).click();
      await templateStore.applyTemplateByIndex(1);
      templateId = await onlineStore.getThemeIdOfJustAddedTheme();
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: templateId,
      });
      const onboardingPopoverVisible = await dashboardPage
        .genLoc(dashboardPage.xpathCloseOnboardingPopover)
        .isVisible();
      if (onboardingPopoverVisible) {
        await dashboardPage.genLoc(dashboardPage.xpathCloseOnboardingPopover).click();
      }
      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
    });
  });

  test(`@SB_SET_TL_07 [DB - Desktop - UI/UX - InFsw] Kiểm tra UI/UX màn Language setting ở shop tạo mới khi publish template v3`, async ({
    conf,
    snapshotFixture,
  }) => {
    if (process.env.ENV === "prodtest") {
      return;
    }
    test.slow();
    const newPriMarket = conf.caseConf.new_primary_market;

    await test.step(`Trong dashboard shop, click Setting > chọn Languages. `, async () => {
      for (const expected of conf.caseConf.expected_ui_blocks) {
        await expect(languageList.genLoc(languageList.xpathLangList.block.heading(expected.heading))).toBeVisible();
        await expect(languageList.genLoc(languageList.xpathLangList.block.desc(expected.heading))).toHaveText(
          expected.desc,
        );
      }
      await expect(languageList.genLoc(languageList.xpathLangList.addLanguage.addLanguageBtn)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: languageList.page,
        selector: languageList.xpathLangList.blockPricing,
        snapshotName: `language-list-pricing-block-${conf.caseName}.png`,
      });

      try {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageLabel(conf.suiteConf.language_default, "Default")),
        ).toBeVisible({ timeout: 75000 });
      } catch (error) {
        await languageList.page.reload();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageLabel(conf.suiteConf.language_default, "Default")),
        ).toBeVisible();
      }
      const publishedLanguageLocs = await languageList
        .genLoc(languageList.xpathLangList.languageItemList(`Published languages`))
        .all();
      const unpublishedLanguageLocs = await languageList
        .genLoc(languageList.xpathLangList.languageItemList(`Unpublished languages`))
        .all();
      expect(publishedLanguageLocs.length).toEqual(1);
      expect(unpublishedLanguageLocs.length).toEqual(0);
    });

    await test.step(`- Publish theme V2.- Click Setting > click Global Markets - Click country ở Primary market và chọn country khác, sau đó click btn Save`, async () => {
      await dashboardPage.navigateToMenu("Online Store");

      await onlineStore.createNew("Themes", "Inside");
      const templateIdV2 = await onlineStore.getThemeIdOfJustAddedTheme();
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: templateIdV2,
      });

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Global Markets");
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.title("Global Markets"))).toBeVisible();
      await globalMarkets.changePrimaryMarketNoAddLanguage(newPriMarket);
    });

    await test.step(`- Click Online store, publish template V3.- Click Setting ở menu sidebar > chọn section Languages`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: templateId,
      });

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();

      for (const expected of conf.caseConf.expected_ui_blocks) {
        await expect(languageList.genLoc(languageList.xpathLangList.block.heading(expected.heading))).toBeVisible();
        await expect(languageList.genLoc(languageList.xpathLangList.block.desc(expected.heading))).toHaveText(
          expected.desc,
        );
      }
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(conf.suiteConf.language_default, "Default")),
      ).toBeVisible();
      await expect(languageList.genLoc(languageList.xpathLangList.addLanguage.addLanguageBtn)).toBeVisible();
      const publishedLanguageLocs = await languageList
        .genLoc(languageList.xpathLangList.languageItemList(`Published languages`))
        .all();
      const unpublishedLanguageLocs = await languageList
        .genLoc(languageList.xpathLangList.languageItemList(`Unpublished languages`))
        .all();
      expect(publishedLanguageLocs.length).toEqual(1);
      expect(unpublishedLanguageLocs.length).toEqual(0);
    });
  });
});

test.describe("Check function tại màn language list", async () => {
  let dashboardPage: DashboardPage;
  let settings: Settings;
  let onlineStore: OnlineStorePage;
  let languageList: LanguageList;
  let languageDetail: LanguageDetail;
  let templateId: number;
  let sfTranslation: SfTranslation;
  let sfTranslationMobile: SfTranslation;
  let globalMarkets: GlobalMarkets;
  let globalMarketApi: GlobalMarketAPI;
  let languageAPI: LanguageAPI;

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    await test.step(`Login vào shop, đến màn language list`, async () => {
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.domain);
      settings = new Settings(dashboard, conf.suiteConf.domain);
      globalMarkets = new GlobalMarkets(dashboard, conf.suiteConf.domain);
      languageList = new LanguageList(dashboard, conf.suiteConf.domain);
      languageDetail = new LanguageDetail(dashboard, conf.suiteConf.domain);
      globalMarketApi = new GlobalMarketAPI(conf.suiteConf.domain, authRequest, dashboard);
      languageAPI = new LanguageAPI(conf.suiteConf.domain, authRequest);

      await dashboardPage.navigateToMenu("Online Store");
      await onlineStore.copyATheme(conf.suiteConf.theme_data.toString());
      templateId = await onlineStore.getThemeIdOfJustAddedTheme();
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: templateId,
      });

      if (conf.caseName === "SB_SET_TL_20" || conf.caseName === "SB_SET_TL_21") {
        await dashboardPage.navigateToMenu("Settings");
        await settings.clickMenu("Global Markets");
        await expect(globalMarkets.genLoc(globalMarkets.xpathGM.title("Global Markets"))).toBeVisible();
        await globalMarkets.changePrimaryMarketNoAddLanguage(conf.suiteConf.primary_market_default);
        const allOtherMArketIds = (await globalMarketApi.getAllOtherMarketByAPI()).map(obj => obj.id);
        for (const id of allOtherMArketIds) {
          await globalMarketApi.deleteMarketByAPI(id);
        }
      }

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
    await test.step(`Publish lại theme data, delete theme copy`, async () => {
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

  test(`@SB_SET_TL_12 [DB - SF - Function - InFsw] Kiểm tra set default language 1 language đang publish`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: Add 2 languages`, async () => {
      await languageList.addLanguages(caseConf.add_languages);
      await languageList.waitUntilMessHidden();
      for (const language of caseConf.add_languages) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
      }
    });

    await test.step(`- Tại trang Languages, click more action language thuộc Published languages- Click Set as default.- Click btn Set default trong popup confirm.`, async () => {
      //Set other language as default
      await languageList.setLanguageAsDefault(caseConf.add_languages[0]);
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        caseConf.mess_set_default_success,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(caseConf.add_languages[0], "Default")),
      ).toBeVisible();
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(conf.suiteConf.language_default, "Default")),
      ).toBeHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", caseConf.add_languages[0]),
        ),
      ).toBeVisible();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", conf.suiteConf.language_default),
        ),
      ).toBeVisible();
    });

    await test.step(`- Click vào 1 language bất kì.- Click detail Product ở mục Store data`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });

    await test.step(`Thay đổi input content 1 product`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });

    await test.step(`- Click btn Back về màn list Languages- Click vào language vừa bị remove khỏi default language- Kiểm tra bản dịch sang tiếng Anh trong trang detail language`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });

    await test.step(`Thay đổi input content 1 product`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });
  });

  test(`@SB_SET_TL_13 [DB - SF - Function - InFsw] Kiểm tra set default language 1 language đang unpublish`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: Add 2 languages and unpublish`, async () => {
      await languageList.addLanguages(caseConf.add_languages);
      await languageList.waitUntilMessHidden();
      for (const language of caseConf.add_languages) {
        await languageList.changeStatusLanguage(language, "Unpublish");
        await languageList.waitUntilMessHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeVisible();
      }
    });

    await test.step(`- Tại trang Languages, click more action language thuộc Unpublished languages- Click Set as default.- Click btn Set default trong popup confirm.`, async () => {
      await languageList.setLanguageAsDefault(caseConf.add_languages[0]);
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        caseConf.mess_set_default_success,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(caseConf.add_languages[0], "Default")),
      ).toBeVisible();
      await expect(
        languageList.genLoc(languageList.xpathLangList.languageLabel(conf.suiteConf.language_default, "Default")),
      ).toBeHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", caseConf.add_languages[0]),
        ),
      ).toBeVisible();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", conf.suiteConf.language_default),
        ),
      ).toBeVisible();
    });

    await test.step(`- Click vào 1 language bất kì.- Click detail Product ở mục Store data`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });

    await test.step(`Thay đổi input content 1 product`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });

    await test.step(`- Click btn Back về màn list Languages- Click vào language vừa bị remove khỏi default language- Kiểm tra bản dịch sang tiếng Anh trong trang detail language`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });

    await test.step(`Thay đổi input content 1 product`, async () => {
      // Tạm skip do dev chưa code xong phần Product
    });
  });

  test(`@SB_SET_TL_17 [DB - Desktop - Function - InFsw] Kiểm tra remove language, check hiển thị language đó ở SF`, async ({
    pageMobile,
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: Add 2 languages and unpublish 1 language`, async () => {
      await languageList.addLanguages(caseConf.add_languages);
      await languageList.waitUntilMessHidden();
      await languageList.changeStatusLanguage(caseConf.add_languages[0], "Unpublish");
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Unpublished languages", caseConf.add_languages[0]),
        ),
      ).toBeVisible();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", caseConf.add_languages[1]),
        ),
      ).toBeVisible();
    });

    await test.step(`- Click more action ở language đang unpublish- Chọn Remove.- Click btn Remove trong popup confirm`, async () => {
      await languageList.removeLanguage(caseConf.add_languages[0]);
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        `${caseConf.add_languages[0]} was removed`,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Unpublished languages", caseConf.add_languages[0]),
        ),
      ).toBeHidden();
    });

    await test.step(`- Click more action ở language đang publish- Chọn Remove.- Click btn Remove trong popup confirm`, async () => {
      await languageList.removeLanguage(caseConf.add_languages[1]);
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        `${caseConf.add_languages[1]} was removed`,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Unpublished languages", caseConf.add_languages[1]),
        ),
      ).toBeHidden();
    });

    await test.step(`View SF của shop, scroll đến block Global switch, chọn language`, async () => {
      //Check SF desktop
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.openStorefront();
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslation.clickDropdownLanguageOnPopup();
      await expect(
        sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.option(caseConf.add_languages[1])),
      ).toBeHidden();
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();

      //Check SF mobile
      sfTranslationMobile = new SfTranslation(pageMobile, conf.suiteConf.domain);
      await sfTranslationMobile.openStorefront();
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslationMobile.clickDropdownLanguageOnPopup();
      await expect(
        sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.option(caseConf.add_languages[1])),
      ).toBeHidden();
      await sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();
    });
  });

  test(`@SB_SET_TL_18 [DB - SF - Function - InFsw] Kiểm tra publish language, check language hiển thị ở SF`, async ({
    conf,
    context,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: Add languages and unpublish`, async () => {
      await languageList.addLanguages(caseConf.add_languages);
      await languageList.waitUntilMessHidden();
      for (const language of caseConf.add_languages) {
        await languageList.changeStatusLanguage(language, "Unpublish");
        await languageList.waitUntilMessHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeVisible();
      }
    });

    await test.step(`- Tại trang Languages, click btn Publish 1 language thuộc block Unpublished languages.`, async () => {
      await languageList.changeStatusLanguage(caseConf.expected[0].language, "Publish");
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        `${caseConf.expected[0].language} was published`,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(languageList.xpathLangList.changeStatusBtn(caseConf.expected[0].language, "Unpublish")),
      ).toBeVisible();
      await expect(
        languageList.genLoc(languageList.xpathLangList.moreActionBtn(caseConf.expected[0].language)),
      ).toBeVisible();
    });

    await test.step(`Mở detail language vừa publish`, async () => {
      await languageList.openLanguageDetail("Published languages", caseConf.expected[0].language);
      await expect(
        languageDetail.genLoc(languageDetail.xpathLD.titleLanguageDetail(caseConf.expected[0].language)),
      ).toBeVisible();
      await expect(languageDetail.genLoc(languageDetail.xpathLD.badge("Published"))).toBeVisible();

      for (const entityBlock of caseConf.toggle_turn_off) {
        const toggleBtnLoc = languageDetail.genLoc(languageDetail.xpathLD.toggleBtn(entityBlock)).locator(`//input`);
        await expect(toggleBtnLoc).not.toBeChecked();
      }

      for (const entityBlock of caseConf.toggle_turn_on) {
        const toggleBtnLoc = languageDetail.genLoc(languageDetail.xpathLD.toggleBtn(entityBlock)).locator(`//input`);
        await expect(toggleBtnLoc).toBeChecked();
      }
      await languageDetail.waitForTranslationToCompleteAfterAddLanguage();
    });

    await test.step(`- Thực hiện Publish language khác - Mở detail language đó`, async () => {
      await languageDetail.genLoc(languageList.xpathLangList.backBtn).click();
      await languageList.changeStatusLanguage(caseConf.expected[1].language, "Publish");
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        `${caseConf.expected[1].language} was published`,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", caseConf.expected[1].language),
        ),
      ).toBeVisible();

      //Check language detail
      await languageList.openLanguageDetail("Published languages", caseConf.expected[1].language);
      await expect(
        languageDetail.genLoc(languageDetail.xpathLD.titleLanguageDetail(caseConf.expected[1].language)),
      ).toBeVisible();
      await expect(languageDetail.genLoc(languageDetail.xpathLD.badge("Published"))).toBeVisible();

      for (const entityBlock of caseConf.toggle_turn_off) {
        const toggleBtnLoc = languageDetail.genLoc(languageDetail.xpathLD.toggleBtn(entityBlock)).locator(`//input`);
        await expect(toggleBtnLoc).not.toBeChecked();
      }

      for (const entityBlock of caseConf.toggle_turn_on) {
        const toggleBtnLoc = languageDetail.genLoc(languageDetail.xpathLD.toggleBtn(entityBlock)).locator(`//input`);
        await expect(toggleBtnLoc).toBeChecked();
      }
      await languageDetail.waitForTranslationToCompleteAfterAddLanguage();
    });

    await test.step(`View SF của shop, scroll đến block Global switch, chọn language`, async () => {
      //Check SF desktop
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.openStorefront();
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslation.clickDropdownLanguageOnPopup();
      for (const expected of caseConf.expected) {
        await expect(
          sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.option(expected.language_sf)),
        ).toBeVisible();
      }
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.dropdownBtnList).nth(1).click();
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();

      //Check SF mobile
      sfTranslationMobile = new SfTranslation(pageMobile, conf.suiteConf.domain);
      await sfTranslationMobile.openStorefront();
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslationMobile.clickDropdownLanguageOnPopup();
      for (const expected of caseConf.expected) {
        await expect(
          sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.option(expected.language_sf)),
        ).toBeVisible();
      }
      await sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.dropdownBtnList).nth(1).click();
      await sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();
    });

    await test.step(`Switch language sang German`, async () => {
      //Check SF desktop
      try {
        await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      } catch (error) {
        await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();
        await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      }
      await sfTranslation.changeSettingLanguage({
        language: caseConf.expected[0].language_sf,
      });

      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.expected[0].language_sf,
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${conf.caseName}-translated-to-${caseConf.expected[0].language}.png`,
      });

      //change lại về default
      await sfTranslation.changeSettingLanguage({
        language: conf.suiteConf.language_default,
      });

      //Check SF mobile
      await sfTranslationMobile.changeSettingLanguage({
        language: caseConf.expected[0].language_sf,
      });

      await sfTranslationMobile.page.waitForLoadState("networkidle");
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.expected[0].language_sf,
      );

      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslationMobile.page,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${process.env.ENV}-${conf.caseName}-translated-to-${caseConf.expected[0].language}-mobile.png`,
      });

      //change lại về default
      await sfTranslationMobile.changeSettingLanguage({
        language: conf.suiteConf.language_default,
      });
    });

    await test.step(`Switch language sang Japanese`, async () => {
      //Check SF desktop
      await sfTranslation.changeSettingLanguage({
        language: caseConf.expected[1].language_sf,
      });
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.expected[1].language_sf,
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${process.env.ENV}-${conf.caseName}-translated-to-${caseConf.expected[1].language}.png`,
      });

      //Check SF mobile
      await sfTranslationMobile.changeSettingLanguage({
        language: caseConf.expected[1].language_sf,
      });
      await sfTranslationMobile.page.waitForLoadState("networkidle");
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await expect(sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        caseConf.expected[1].language_sf,
      );

      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslationMobile.page,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${process.env.ENV}-${conf.caseName}-translated-to-${caseConf.expected[1].language}-mobile.png`,
      });
    });
  });

  test(`@SB_SET_TL_19 [DB - SF - Function - InFsw] Kiểm tra unpublish language, check language hiển thị ở SF`, async ({
    pageMobile,
    context,
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: Add languages and unpublish`, async () => {
      await languageList.addLanguages([caseConf.add_language]);
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Published languages", caseConf.add_language),
        ),
      ).toBeVisible();
    });

    await test.step(`- Tại trang Languages, click btn Unpublish 1 language thuộc block Published languages.- Click btn Unpublish trong popup confirm`, async () => {
      await languageList.changeStatusLanguage(caseConf.add_language, "Unpublish");
      await expect(languageList.genLoc(languageList.xpathLangList.toastMessage)).toHaveText(
        `${caseConf.add_language} was unpublished`,
      );
      await languageList.waitUntilMessHidden();
      await expect(
        languageList.genLoc(
          languageList.xpathLangList.languageItemByName("Unpublished languages", caseConf.add_language),
        ),
      ).toBeVisible();
      await expect(
        languageList.genLoc(languageList.xpathLangList.changeStatusBtn(caseConf.add_language, "Publish")),
      ).toBeVisible();
      await expect(languageList.genLoc(languageList.xpathLangList.moreActionBtn(caseConf.add_language))).toBeVisible();
    });

    await test.step(`Mở detail language vừa unpublish`, async () => {
      await languageList.openLanguageDetail("Unpublished languages", caseConf.add_language);
      await expect(
        languageDetail.genLoc(languageDetail.xpathLD.titleLanguageDetail(caseConf.add_language)),
      ).toBeVisible();
      await expect(languageDetail.genLoc(languageDetail.xpathLD.badge("Unpublished"))).toBeVisible();

      const toggleBtnLocs = await languageDetail.genLoc(languageDetail.xpathLD.toggleBtnList).all();
      for (const toggleBtnLoc of toggleBtnLocs) {
        await expect(toggleBtnLoc).not.toBeChecked();
      }
    });

    await test.step(`View SF của shop, scroll đến block Global switch, chọn language`, async () => {
      //Check SF desktop
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.openStorefront();
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslation.clickDropdownLanguageOnPopup();
      await expect(
        sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.option(caseConf.add_language)),
      ).toBeHidden();
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.openedDropdown).click();
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();

      //Check SF mobile
      sfTranslationMobile = new SfTranslation(pageMobile, conf.suiteConf.domain);
      await sfTranslationMobile.openStorefront();
      await sfTranslationMobile.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      await sfTranslationMobile.clickDropdownLanguageOnPopup();
      await expect(
        sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.option(caseConf.add_language)),
      ).toBeHidden();
      await sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.openedDropdown).click();
      await sfTranslationMobile.genLoc(sfTranslation.xpathTranslate.popupSelect.cancelBtn).click();
    });
  });

  test(`@SB_SET_TL_20 [DB - Function - InFsw] Kiểm tra add thêm ngôn ngữ khi add market ở Global markets`, async ({
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    test.slow();

    await test.step(`Pre-condition: Add languages and unpublish some languagues, add global markets`, async () => {
      //Add languages
      await languageList.addLanguages(caseConf.add_languages_1);
      await languageList.waitUntilMessHidden();
      await languageList.addLanguages(caseConf.add_languages_2);
      await languageList.waitUntilMessHidden();
      for (const language of caseConf.add_languages_2) {
        await languageList.changeStatusLanguage(language, "Unpublish");
        await languageList.waitUntilMessHidden();
      }

      //Add markets
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      for (const market of caseConf.pre_condtition_market) {
        await globalMarkets.addNewMarketNoAddLanguage(market.name, market.countries);
      }
    });

    await test.step(`- Tại màn hình Global market, click btn Add market- Nhập tên market- Click btn- Click btn Add countries / regions và add các countries`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Add market")).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Add new market"));
      await globalMarkets.fillNameAndAddCountries(caseConf.new_market_1.name, caseConf.new_market_1.countries);
      for (const country of caseConf.new_market_1.countries) {
        await expect(globalMarkets.genLoc(globalMarkets.xpathGM.addMarket.addedCountry(country))).toBeVisible();
      }
    });

    await test.step(`- Click btn Add countries / regions và add các countries- Click btn Add- Click btn Confirm trong popup`, async () => {
      await globalMarkets.fillNameAndAddCountries(caseConf.new_market_2.name, caseConf.new_market_2.countries);
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popupCfRemoveCoutries);
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
    });

    await test.step(`- Click btn Add market`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Add Market")).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.toastMessage);
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        `Successfully created ${caseConf.new_market_2.name}`,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popupCfAddLanguage.desc)).toHaveText(
        caseConf.desc_popup_cf_add_language,
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.new_market_2.name}.png`,
      });
    });

    await test.step(`- Click btn Cancel.- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Cancel")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.new_market_2.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeHidden();
      }
    });

    await test.step(`Quay lại trang Global market, tạo thành công market mới`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.addNewMarket(caseConf.new_market_3.name, caseConf.new_market_3.countries);
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.new_market_3.name}.png`,
      });
    });

    await test.step(`- Bỏ tích tất cả các lựa chọn - Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.removeAllLanguagesOnPopup();
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.new_market_3.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeHidden();
      }
    });

    await test.step(`Quay lại trang Global market, tạo thành công market mới`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.addNewMarket(caseConf.new_market_4.name, caseConf.new_market_4.countries);
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.new_market_4.name}.png`,
      });
    });

    await test.step(`- Bỏ tích 1 language- Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets
        .genLoc(globalMarkets.xpathGM.popupCfAddLanguage.checkbox(caseConf.new_market_4.language_not_added[0]))
        .click();
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(caseConf.mess_add_success);
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.new_market_4.language_not_added) {
        if (language === caseConf.new_market_4.language_not_added[0]) {
          await expect(
            languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
          ).toBeHidden();
          await expect(
            languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpblished languages", language)),
          ).toBeHidden();
        } else {
          await expect(
            languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
          ).toBeVisible();
        }
      }
    });

    await test.step(`Quay lại trang Global market, tạo thành công market mới`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.addNewMarket(caseConf.new_market_5.name, caseConf.new_market_5.countries);
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.new_market_5.name}.png`,
      });
    });

    await test.step(`- Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(caseConf.mess_add_success);
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.new_market_5.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
      }
    });

    await test.step(`- Quay lại trang edit market ở Global market và edit market- Click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.otherMarket(caseConf.new_market_1.name)).click();
      await globalMarkets.fillNameAndAddCountries(caseConf.edit_market_1.name, caseConf.edit_market_1.countries);
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Save")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        `Successfully updated ${caseConf.edit_market_1.name}`,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.edit_market_1.name}.png`,
      });
    });

    await test.step(`- Click btn Cancel.- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Cancel")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.edit_market_1.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpblished languages", language)),
        ).toBeHidden();
      }
    });

    await test.step(`- Quay lại trang edit market ở Global market và edit market- Click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.otherMarket(caseConf.edit_market_1.name)).click();
      await globalMarkets.fillNameAndAddCountries(caseConf.edit_market_2.name, caseConf.edit_market_2.countries);
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Save")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        `Successfully updated ${caseConf.edit_market_2.name}`,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.edit_market_2.name}-2.png`,
      });
    });

    await test.step(`- Bỏ tích tất cả các lựa chọn - Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.removeAllLanguagesOnPopup();
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.edit_market_2.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeHidden();
      }
    });

    await test.step(`- Quay lại trang edit market ở Global market và edit market- Click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.otherMarket(caseConf.edit_market_2.name)).click();
      await globalMarkets.fillNameAndAddCountries(caseConf.edit_market_3.name);
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Save")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        `Successfully updated ${caseConf.edit_market_3.name}`,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.edit_market_3.name}.png`,
      });
    });

    await test.step(`- Bỏ tích 1 language- Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets
        .genLoc(globalMarkets.xpathGM.popupCfAddLanguage.checkbox(caseConf.edit_market_3.language_not_added[0]))
        .click();
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(caseConf.mess_add_success);
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.edit_market_3.language_not_added) {
        if (language === caseConf.edit_market_3.language_not_added[0]) {
          await expect(
            languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
          ).toBeHidden();
          await expect(
            languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpblished languages", language)),
          ).toBeHidden();
        } else {
          await expect(
            languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
          ).toBeVisible();
        }
      }
    });

    await test.step(`- Quay lại trang edit market ở Global market và edit market- Click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.otherMarket(caseConf.edit_market_3.name)).click();
      await globalMarkets.fillNameAndAddCountries(caseConf.edit_market_4.name);
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Save")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        `Successfully updated ${caseConf.edit_market_4.name}`,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-20-language-list-${caseConf.edit_market_4.name}.png`,
      });
    });

    await test.step(`- Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(caseConf.mess_add_success);
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of caseConf.edit_market_4.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_SET_TL_21 [DB - Function - InFsw] Kiểm tra add thêm ngôn ngữ khi thay đổi country Primary market`, async ({
    snapshotFixture,
    conf,
  }) => {
    const caseConf = conf.caseConf;
    const newPriMarket1 = caseConf.new_primary_market_1;
    const newPriMarket2 = caseConf.new_primary_market_2;
    const newPriMarket3 = caseConf.new_primary_market_3;
    test.slow();

    await test.step(`Tại màn edit Primary market, thay đổi country thành 1 country sử dụng language chưa được thêm vào shop, click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.primaryMarket.item).click();
      await globalMarkets.page.waitForLoadState("networkidle");
      await globalMarkets.selectCountryAndCurrencyPriMarket({ country: newPriMarket1.country });
      await globalMarkets.page.getByRole("button", { name: "Save" }).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.toastMessage);
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        caseConf.mess_update_market_success,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-21-language-list-${newPriMarket1.country}-languages.png`,
      });
    });

    await test.step(`- Click btn Cancel.- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Cancel")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of newPriMarket1.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeHidden();
      }
    });

    await test.step(`Quay lại trang edit Primary market, thay đổi currency market, click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.primaryMarket.item).click();
      await globalMarkets.page.waitForLoadState("networkidle");
      await globalMarkets.selectCountryAndCurrencyPriMarket({ currency: newPriMarket1.currency });
      await globalMarkets.page.getByRole("button", { name: "Save" }).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.toastMessage);
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        caseConf.mess_update_market_success,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Cancel")).click();
    });

    await test.step(`Thay đổi country Primary market, thay đổi country thành 1 country sử dụng language đã được thêm vào shop, click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.primaryMarket.item).click();
      await globalMarkets.page.waitForLoadState("networkidle");
      await globalMarkets.selectCountryAndCurrencyPriMarket(newPriMarket2);
      await globalMarkets.page.getByRole("button", { name: "Save" }).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.toastMessage);
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        caseConf.mess_update_market_success,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Cancel")).click();
    });

    await test.step(`Thay đổi country và currency Primary market, thay đổi country thành 1 country sử dụng language chưa được thêm vào shop, click btn Save`, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.primaryMarket.item).click();
      await globalMarkets.page.waitForLoadState("networkidle");
      await globalMarkets.selectCountryAndCurrencyPriMarket(newPriMarket3);
      await globalMarkets.page.getByRole("button", { name: "Save" }).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.toastMessage);
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        caseConf.mess_update_market_success,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
      await snapshotFixture.verifyWithAutoRetry({
        page: globalMarkets.page,
        selector: globalMarkets.xpathGM.popup("Add languages"),
        snapshotName: `case-21-language-list-${newPriMarket3.country}-languages.png`,
      });
    });

    await test.step(`- Bỏ tích tất cả các lựa chọn - Click btn Confirm trong popup- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.removeAllLanguagesOnPopup();
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of newPriMarket3.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeHidden();
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Unpublished languages", language)),
        ).toBeHidden();
      }
    });

    await test.step(`- Thay đổi country Primary market, thay đổi country thành 1 country sử dụng language đã được thêm vào shop, click btn Save. `, async () => {
      await dashboardPage.goToSettingGlobalMarkets();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.title("Global Markets"));
      await globalMarkets.genLoc(globalMarkets.xpathGM.primaryMarket.item).click();
      await globalMarkets.page.waitForLoadState("networkidle");
      await globalMarkets.selectCountryAndCurrencyPriMarket({
        country: newPriMarket1.country,
      });
      await globalMarkets.page.getByRole("button", { name: "Save" }).click();
      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.toastMessage);
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.toastMessage)).toHaveText(
        caseConf.mess_update_market_success,
      );
      await globalMarkets.waitUntilElementInvisible(globalMarkets.xpathGM.toastMessage);

      await globalMarkets.waitUntilElementVisible(globalMarkets.xpathGM.popup("Add languages"));
    });

    await test.step(`- Click btn Confirm trong popup add language- Sau đó navigate đến trang list Languages trong dashboard`, async () => {
      await globalMarkets.genLoc(globalMarkets.xpathGM.actionBtn("Confirm")).click();
      await expect(globalMarkets.genLoc(globalMarkets.xpathGM.popup("Add languages"))).toBeHidden();

      await dashboardPage.navigateToMenu("Settings");
      await settings.clickMenu("Languages");
      await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
      for (const language of newPriMarket1.language_not_added) {
        await expect(
          languageList.genLoc(languageList.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
      }
    });
  });
});
