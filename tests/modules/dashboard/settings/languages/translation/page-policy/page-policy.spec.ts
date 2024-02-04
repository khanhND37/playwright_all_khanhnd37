import { expect, test } from "@fixtures/website_builder";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { pressControl } from "@core/utils/keyboard";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

test.describe("Test translation - page policy for Shopbase", () => {
  let dashboardPage: TranslationDetail;
  let policyPage: OtherPage;
  let onlineStore: OnlineStorePage;

  test.beforeEach("", async ({ conf, cConf, dashboard }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    policyPage = new OtherPage(dashboard, conf.suiteConf.domain);
    onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.domain);

    await test.step(`Login vào shop, publish theme data`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      const isThemeDataPublished = await onlineStore
        .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.theme_data))
        .isVisible();
      if (!isThemeDataPublished) {
        await onlineStore.actionWithThemes({
          action: "Publish",
          themeId: conf.suiteConf.theme_data,
        });
      }
    });

    await test.step("Pre condition: Edit page policy", async () => {
      await policyPage.editPolicyPage(cConf.policy_page);
    });

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([cConf.language_data.language]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathLangList.languageItemByName(cConf.language_data.status, cConf.language_data.language),
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_SET_LG_TLL_66 [Shopbase] [DB+SF - Function] Kiểm tra tính năng auto translate khi enable auto translate Pages - Page policy`, async ({
    conf,
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    const manualData = cConf.manual_data;
    const deleteData = cConf.delete_data;

    await test.step(`Enable auto translate ở Pages > Mở màn Page policy Translation   > Mở droplist Page policy `, async () => {
      await dashboardPage.goToLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await dashboardPage.switchToggleAutoTranslate("Pages", true);
      await dashboardPage.waitForElementVisibleThenInvisible(dashboardPage.xpathLangList.toastMessage);
      await dashboardPage.clickEntityDetail(cConf.language_data.entity);

      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      //Verify droplist page
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(cConf.language_data.placeholder_entity))
        .click();
      const droplistPage = await dashboardPage.getEntitySearchResults();
      expect(droplistPage.length).toEqual(conf.suiteConf.list_page_policy.length);
      for (let i = 0; i < droplistPage.length; i++) {
        expect(droplistPage[i]).toEqual(conf.suiteConf.list_page_policy[i]);
      }

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page.expected_result_translation));

      //Verify SF
      const dataTranslatedSF = (
        await policyPage.getPagePolicyDataOnSF(
          cConf.page_handle,
          cConf.language_data.language_code,
          cConf.language_data.locale,
        )
      ).result;

      expect.soft(dataTranslatedSF.body_html).toEqual(cConf.policy_page.expected_translation_sf.body_html);
      expect
        .soft(dataTranslatedSF.meta_description)
        .toEqual(cConf.policy_page.expected_translation_sf.meta_description);
      expect.soft(dataTranslatedSF.title).toEqual(cConf.policy_page.expected_translation_sf.title);
    });

    await test.step(`Thực hiện edit content page Return policy  
  Mở màn Page policy Translation của page đã edit`, async () => {
      await policyPage.editPolicyPage(cConf.policy_page_edit);
      await dashboardPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationAfterEditContent();

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      const dataTranslatedSF = (
        await policyPage.getPagePolicyDataOnSF(
          cConf.page_handle,
          cConf.language_data.language_code,
          cConf.language_data.locale,
        )
      ).result;

      expect.soft(dataTranslatedSF.body_html).toEqual(cConf.policy_page_edit.expected_translation_sf.body_html);
      expect
        .soft(dataTranslatedSF.meta_description)
        .toEqual(cConf.policy_page_edit.expected_translation_sf.meta_description);
      expect.soft(dataTranslatedSF.title).toEqual(cConf.policy_page_edit.expected_translation_sf.title);
    });

    await test.step(`Thực hiện edit bản dịch > save `, async () => {
      for (const field of manualData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      const dataTranslatedSF = (
        await policyPage.getPagePolicyDataOnSF(
          cConf.page_handle,
          cConf.language_data.language_code,
          cConf.language_data.locale,
        )
      ).result;

      expect.soft(dataTranslatedSF.body_html).toEqual(manualData.expected_translation_sf.body_html);
      expect.soft(dataTranslatedSF.meta_description).toEqual(manualData.expected_translation_sf.meta_description);
      expect.soft(dataTranslatedSF.title).toEqual(manualData.expected_translation_sf.title);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      const dataTranslatedSF = (
        await policyPage.getPagePolicyDataOnSF(
          cConf.page_handle,
          cConf.language_data.language_code,
          cConf.language_data.locale,
        )
      ).result;

      expect.soft(dataTranslatedSF.body_html).toEqual(manualData.expected_translation_sf.body_html);
      expect.soft(dataTranslatedSF.meta_description).toEqual(manualData.expected_translation_sf.meta_description);
      expect.soft(dataTranslatedSF.title).toEqual(manualData.expected_translation_sf.title);
    });

    await test.step(`Xóa Bản dịch manual > save`, async () => {
      for (const field of deleteData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(cConf.toast_success).waitFor({ state: "hidden" });

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-remove-translation-${conf.caseName}.png`,
      });

      //Verify SF
      const dataTranslatedSF = (
        await policyPage.getPagePolicyDataOnSF(
          cConf.page_handle,
          cConf.language_data.language_code,
          cConf.language_data.locale,
        )
      ).result;

      expect.soft(dataTranslatedSF.body_html).toEqual(deleteData.expected_translation_sf.body_html);
      expect.soft(dataTranslatedSF.meta_description).toEqual(deleteData.expected_translation_sf.meta_description);
      expect.soft(dataTranslatedSF.title).toEqual(deleteData.expected_translation_sf.title);
    });

    await test.step(`click btn auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      const dataTranslatedSF = (
        await policyPage.getPagePolicyDataOnSF(
          cConf.page_handle,
          cConf.language_data.language_code,
          cConf.language_data.locale,
        )
      ).result;

      expect.soft(dataTranslatedSF.body_html).toEqual(cConf.policy_page_edit.expected_translation_sf.body_html);
      expect
        .soft(dataTranslatedSF.meta_description)
        .toEqual(cConf.policy_page_edit.expected_translation_sf.meta_description);
      expect.soft(dataTranslatedSF.title).toEqual(cConf.policy_page_edit.expected_translation_sf.title);
    });
  });
});

test.describe("Test translation - page policy on Shopbase: get data from shop template", () => {
  let dashboardPage: TranslationDetail;
  let sfTranslation: SfTranslation;
  let onlineStore: OnlineStorePage;

  test.beforeEach("", async ({ conf, cConf, dashboard }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    sfTranslation = new SfTranslation(dashboard, conf.suiteConf.domain);
    onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.domain);

    await test.step(`Login vào shop, publish theme data`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      const isThemeDataPublished = await onlineStore
        .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.theme_data))
        .isVisible();
      if (!isThemeDataPublished) {
        await onlineStore.actionWithThemes({
          action: "Publish",
          themeId: conf.suiteConf.theme_data,
        });
      }
    });

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages(cConf.language_data.language);
      await dashboardPage.waitUntilMessHidden();
      for (const language of cConf.language_data.language) {
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLangList.languageItemByName(cConf.language_data.status, language)),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_SET_LG_TLL_64 [Shopbase] [SF - Function] Kiểm tra tính năng dịch tự động các page policy lấy data từ shop template`, async ({
    snapshotFixture,
    cConf,
    conf,
  }) => {
    test.slow();
    for (const page of cConf.pages) {
      await test.step(`Đi đến các page policy bằng url, Chọn ngôn ngữ Vietnamese`, async () => {
        await dashboardPage.goto(`https://${conf.suiteConf.domain}/${page.handle}`);
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf[0] });
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf[0],
        );

        await sfTranslation.page.waitForTimeout(3 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf[0]}-${page.title}.png`,
        });
      });

      await test.step(`Chọn ngôn ngữ German `, async () => {
        await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf[1] });
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf[1],
        );

        await sfTranslation.page.waitForTimeout(3 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf[1]}-${page.title}.png`,
        });
      });
    }
  });
});

test.describe("Test translation - page policy on Pb, Plb: get data from shop template", () => {
  let dashboardPage: TranslationDetail;
  let sfTranslation: SfTranslation;
  let onlineStore: OnlineStorePage;

  test.beforeEach(async ({ conf, cConf, dashboard, token }) => {
    await test.step(`Login vào shop, publish theme data`, async () => {
      if (conf.caseName === "SB_SET_LG_TLL_62") {
        onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.printbase.domain);
        dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.printbase.domain);
        sfTranslation = new SfTranslation(dashboard, conf.suiteConf.printbase.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: conf.suiteConf.printbase.domain,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await dashboardPage.loginWithToken(accessToken);
        await dashboardPage.navigateToMenu("Online Store");
        const isThemeDataPublished = await onlineStore
          .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.printbase.theme_data))
          .isVisible();
        if (!isThemeDataPublished) {
          await onlineStore.actionWithThemes({
            action: "Publish",
            themeId: conf.suiteConf.printbase.theme_data,
          });
        }
      } else {
        onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.plusbase.domain);
        dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.plusbase.domain);
        sfTranslation = new SfTranslation(dashboard, conf.suiteConf.plusbase.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: conf.suiteConf.plusbase.domain,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await dashboardPage.loginWithToken(accessToken);
        await dashboardPage.navigateToMenu("Online Store");
        const isThemeDataPublished = await onlineStore
          .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.plusbase.theme_data))
          .isVisible();
        if (!isThemeDataPublished) {
          await onlineStore.actionWithThemes({
            action: "Publish",
            themeId: conf.suiteConf.plusbase.theme_data,
          });
        }
      }
    });

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages(cConf.language_data.language);
      await dashboardPage.waitUntilMessHidden();
      for (const language of cConf.language_data.language) {
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLangList.languageItemByName(cConf.language_data.status, language)),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_SET_LG_TLL_62 [PB] [SF - Function] Kiểm tra tính năng dịch tự động các page policy lấy data từ shop template`, async ({
    snapshotFixture,
    cConf,
    conf,
  }) => {
    test.slow();

    for (const page of cConf.pages) {
      await test.step(`Đi đến các page policy bằng url, Chọn ngôn ngữ Vietnamese`, async () => {
        await dashboardPage.goto(`https://${conf.suiteConf.printbase.domain}/${page.handle}`);
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf[0] });
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf[0],
        );

        await sfTranslation.page.waitForTimeout(3 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf[0]}-${page.title}.png`,
        });
      });

      await test.step(`Chọn ngôn ngữ German `, async () => {
        await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf[1] });
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf[1],
        );

        await sfTranslation.page.waitForTimeout(3 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf[1]}-${page.title}.png`,
        });
      });
    }
  });

  test(`@SB_SET_LG_TLL_88 [PLB] [SF - Function] Kiểm tra tính năng dịch tự động các page policy lấy data từ shop template`, async ({
    snapshotFixture,
    cConf,
    conf,
  }) => {
    test.slow();

    for (const page of cConf.pages) {
      await test.step(`Đi đến các page policy bằng url, Chọn ngôn ngữ Vietnamese`, async () => {
        await dashboardPage.goto(`https://${conf.suiteConf.plusbase.domain}/${page.handle}`);
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf[0] });
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf[0],
        );

        await sfTranslation.page.waitForTimeout(3 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf[0]}-${page.title}.png`,
        });
      });

      await test.step(`Chọn ngôn ngữ German `, async () => {
        await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf[1] });
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf[1],
        );

        await sfTranslation.page.waitForTimeout(3 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf[1]}-${page.title}.png`,
        });
      });
    }
  });
});

test.describe("Test translation - custom page policy", () => {
  let dashboardPage: TranslationDetail,
    policyPage: OtherPage,
    onlineStore: OnlineStorePage,
    webBuilder: Blocks,
    sfTranslation: SfTranslation,
    blockId: Array<string>;

  test.beforeEach("", async ({ token, conf, cConf, dashboard }) => {
    switch (conf.caseName) {
      default:
        dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
        policyPage = new OtherPage(dashboard, conf.suiteConf.domain);
        onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.domain);
        webBuilder = new Blocks(dashboard, conf.suiteConf.domain);

        await test.step(`Login vào shop, publish theme data`, async () => {
          await dashboardPage.navigateToMenu("Online Store");
          const isThemeDataPublished = await onlineStore
            .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.customize_theme_id))
            .isVisible();
          if (!isThemeDataPublished) {
            await onlineStore.actionWithThemes({
              action: "Publish",
              themeId: conf.suiteConf.customize_theme_id,
            });
          }
        });
        break;
      case "SB_SET_LG_TLL_70":
        dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.plusbase.domain);
        policyPage = new OtherPage(dashboard, conf.suiteConf.plusbase.domain);
        onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.plusbase.domain);
        webBuilder = new Blocks(dashboard, conf.suiteConf.plusbase.domain);

        await test.step(`Login vào shop, publish theme data`, async () => {
          const accessToken = (
            await token.getWithCredentials({
              domain: conf.suiteConf.plusbase.domain,
              username: conf.suiteConf.username,
              password: conf.suiteConf.password,
            })
          ).access_token;
          await dashboardPage.loginWithToken(accessToken);
          await dashboardPage.navigateToMenu("Online Store");
          const isThemeDataPublished = await onlineStore
            .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.plusbase.customize_theme_id))
            .isVisible();
          if (!isThemeDataPublished) {
            await onlineStore.actionWithThemes({
              action: "Publish",
              themeId: conf.suiteConf.plusbase.customize_theme_id,
            });
          }
        });
        break;
      case "SB_SET_LG_TLL_71":
        dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.printbase.domain);
        policyPage = new OtherPage(dashboard, conf.suiteConf.printbase.domain);
        onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.printbase.domain);
        webBuilder = new Blocks(dashboard, conf.suiteConf.printbase.domain);

        await test.step(`Login vào shop, publish theme data`, async () => {
          const accessToken = (
            await token.getWithCredentials({
              domain: conf.suiteConf.printbase.domain,
              username: conf.suiteConf.username,
              password: conf.suiteConf.password,
            })
          ).access_token;
          await dashboardPage.loginWithToken(accessToken);
          await dashboardPage.navigateToMenu("Online Store");
          const isThemeDataPublished = await onlineStore
            .genLoc(onlineStore.xpathTheme.publishedTheme(conf.suiteConf.printbase.customize_theme_id))
            .isVisible();
          if (!isThemeDataPublished) {
            await onlineStore.actionWithThemes({
              action: "Publish",
              themeId: conf.suiteConf.printbase.customize_theme_id,
            });
          }
        });
        break;
    }

    await test.step("Pre condition: Delete and add blocks", async () => {
      await dashboardPage.goto(`admin/pages?tab=policyPages`);
      await policyPage.genLoc(policyPage.getXpathButtonCustomizeByTitle(cConf.policy_page.title)).click();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathLoadingWb);

      blockId = [];
      for (const block of cConf.dnd_block) {
        await webBuilder.genLoc(webBuilder.xpathLayoutIcon(block.template)).click();
        const isBlockVisible = await webBuilder
          .genLoc(webBuilder.xpathLayoutBlock(block.template, block.template))
          .isVisible();
        if (isBlockVisible) {
          await webBuilder.genLoc(webBuilder.xpathLayoutBlock(block.template, block.template)).click();
          await webBuilder.genLoc(webBuilder.btnDeleteInSidebar).click();
        }

        await webBuilder.insertSectionBlock({
          parentPosition: block.parent_position,
          template: block.template,
        });
        blockId.push(await webBuilder.getAttrsDataId());

        await webBuilder.selectOptionOnQuickBar("Edit text");
        await pressControl(webBuilder.page, "A");
        await webBuilder.page.keyboard.press("Backspace");
        await webBuilder.page.waitForTimeout(1 * 1000);
        await webBuilder.page.keyboard.type(block.edit.content);
        await webBuilder.backToLayerBtn.first().click({ delay: 2000 });
      }

      await webBuilder.clickSaveButton();
    });

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([cConf.language_data.language]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathLangList.languageItemByName(cConf.language_data.status, cConf.language_data.language),
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_SET_LG_TLL_72 [Shopbase] [DB+SF - Function] Kiểm tra tính năng dịch với shop đã setup page có đầy đủ các block trong WB khi enable Auto translate - All pages content - Page Policy`, async ({
    context,
    cConf,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const manualData = cConf.manual_data;
    const deleteData = cConf.delete_data;

    await test.step(`Enable auto translate ở All pages content > Mở màn All pages content Translation Policy page > Return policy`, async () => {
      await dashboardPage.goToLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("All pages content")).locator(`//input`),
      ).toBeChecked();
      await dashboardPage.clickEntityDetail(cConf.language_data.entity);
      await dashboardPage.chooseEntityTranslate({ page: cConf.policy_page.title });

      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page.expected_result_translation));

      //Verify SF
      const sfPage = await context.newPage();
      sfTranslation = new SfTranslation(sfPage, conf.suiteConf.domain);
      await sfTranslation.goto(`https://${conf.suiteConf.domain}/policies/${cConf.page_handle}`);
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for page stable
      await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf });
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for page stable
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-1-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Thực hiện edit content các block trong WB của page Return policy. Mở màn Page policy Translation của page đã edit`, async () => {
      await dashboardPage.goto(`admin/pages?tab=policyPages`);
      await policyPage.genLoc(policyPage.getXpathButtonCustomizeByTitle(cConf.policy_page.title)).click();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathLoadingWb);
      for (const block of cConf.dnd_block) {
        await webBuilder.genLoc(webBuilder.xpathLayoutIcon(block.template)).click();
        await webBuilder.genLoc(webBuilder.xpathLayoutBlock(block.template, block.template)).click();
        await webBuilder.selectOptionOnQuickBar("Edit text");
        await pressControl(webBuilder.page, "A");
        await webBuilder.page.keyboard.press("Backspace");
        await webBuilder.page.waitForTimeout(1 * 1000);
        await webBuilder.page.keyboard.type(block.edit.content_edit);
        await webBuilder.backToLayerBtn.first().click();
      }
      await webBuilder.clickSaveButton();

      await dashboardPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardPage.chooseEntityTranslate({ page: cConf.policy_page.title });
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationAfterEditContent(cConf.policy_page.title);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-2-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      for (const field of manualData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: field.field_index,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        const content = await sfTranslation
          .genLoc(sfTranslation.xpathTranslate.contentBlockById(blockId[i]))
          .innerText();
        expect.soft(content).toEqual(manualData.expected_result_translation[i].target_value);
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        const content = await sfTranslation
          .genLoc(sfTranslation.xpathTranslate.contentBlockById(blockId[i]))
          .innerText();
        expect.soft(content).toEqual(manualData.expected_result_translation[i].target_value);
      }
    });

    await test.step(`Xóa Bản dịch manual > save.   
  Ra ngoài SF page Return policy`, async () => {
      for (const field of deleteData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: field.field_index,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(cConf.toast_success).waitFor({ state: "hidden" });

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-remove-translation-${conf.caseName}.png`,
      });

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-5-${cConf.dnd_block[i].template}-empty-translated-content-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-6-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });
  });

  test(`@SB_SET_LG_TLL_70 [Plusbase] [DB+SF - Function] Kiểm tra tính năng dịch với shop đã setup page có đầy đủ các block trong WB khi enable Auto translate - All pages content - Page Policy`, async ({
    context,
    cConf,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const manualData = cConf.manual_data;
    const deleteData = cConf.delete_data;

    await test.step(`Enable auto translate ở All pages content > Mở màn All pages content Translation Policy page > Return policy`, async () => {
      await dashboardPage.goToLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("All pages content")).locator(`//input`),
      ).toBeChecked();
      await dashboardPage.clickEntityDetail(cConf.language_data.entity);
      await dashboardPage.chooseEntityTranslate({ page: cConf.policy_page.title });

      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page.expected_result_translation));

      //Verify SF
      const sfPage = await context.newPage();
      sfTranslation = new SfTranslation(sfPage, conf.suiteConf.plusbase.domain);
      await sfTranslation.goto(`https://${conf.suiteConf.plusbase.domain}/policies/${cConf.page_handle}`);
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for page stable
      await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf });
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for page stable
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-1-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Thực hiện edit content các block trong WB của page Return policy. Mở màn Page policy Translation của page đã edit`, async () => {
      await dashboardPage.goto(`admin/pages?tab=policyPages`);
      await policyPage.genLoc(policyPage.getXpathButtonCustomizeByTitle(cConf.policy_page.title)).click();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathLoadingWb);
      for (const block of cConf.dnd_block) {
        await webBuilder.genLoc(webBuilder.xpathLayoutIcon(block.template)).click();
        await webBuilder.genLoc(webBuilder.xpathLayoutBlock(block.template, block.template)).click();
        await webBuilder.selectOptionOnQuickBar("Edit text");
        await pressControl(webBuilder.page, "A");
        await webBuilder.page.keyboard.press("Backspace");
        await webBuilder.page.waitForTimeout(1 * 1000);
        await webBuilder.page.keyboard.type(block.edit.content_edit);
        await webBuilder.backToLayerBtn.first().click();
      }
      await webBuilder.clickSaveButton();

      await dashboardPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardPage.chooseEntityTranslate({ page: cConf.policy_page.title });
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationAfterEditContent(cConf.policy_page.title);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-2-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      for (const field of manualData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: field.field_index,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        const content = await sfTranslation
          .genLoc(sfTranslation.xpathTranslate.contentBlockById(blockId[i]))
          .innerText();
        expect.soft(content).toEqual(manualData.expected_result_translation[i].target_value);
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        const content = await sfTranslation
          .genLoc(sfTranslation.xpathTranslate.contentBlockById(blockId[i]))
          .innerText();
        expect.soft(content).toEqual(manualData.expected_result_translation[i].target_value);
      }
    });

    await test.step(`Xóa Bản dịch manual > save.   
  Ra ngoài SF page Return policy`, async () => {
      for (const field of deleteData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: field.field_index,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(cConf.toast_success).waitFor({ state: "hidden" });

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-remove-translation-${conf.caseName}.png`,
      });

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-5-${cConf.dnd_block[i].template}-empty-translated-content-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-6-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });
  });

  test(`@SB_SET_LG_TLL_71 [Printbase] [DB+SF - Function] Kiểm tra tính năng dịch với shop đã setup page có đầy đủ các block trong WB khi enable Auto translate - All pages content - Page Policy`, async ({
    context,
    cConf,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const manualData = cConf.manual_data;
    const deleteData = cConf.delete_data;

    await test.step(`Enable auto translate ở All pages content > Mở màn All pages content Translation Policy page > Return policy`, async () => {
      await dashboardPage.goToLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("All pages content")).locator(`//input`),
      ).toBeChecked();
      await dashboardPage.clickEntityDetail(cConf.language_data.entity);
      await dashboardPage.chooseEntityTranslate({ page: cConf.policy_page.title });

      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page.expected_result_translation));

      //Verify SF
      const sfPage = await context.newPage();
      sfTranslation = new SfTranslation(sfPage, conf.suiteConf.printbase.domain);
      await sfTranslation.goto(`https://${conf.suiteConf.printbase.domain}/policies/${cConf.page_handle}`);
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for page stable
      await sfTranslation.changeSettingLanguage({ language: cConf.language_data.language_sf });
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for page stable
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-1-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Thực hiện edit content các block trong WB của page Return policy. Mở màn Page policy Translation của page đã edit`, async () => {
      await dashboardPage.goto(`admin/pages?tab=policyPages`);
      await policyPage.genLoc(policyPage.getXpathButtonCustomizeByTitle(cConf.policy_page.title)).click();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathLoadingWb);
      for (const block of cConf.dnd_block) {
        await webBuilder.genLoc(webBuilder.xpathLayoutIcon(block.template)).click();
        await webBuilder.genLoc(webBuilder.xpathLayoutBlock(block.template, block.template)).click();
        await webBuilder.selectOptionOnQuickBar("Edit text");
        await pressControl(webBuilder.page, "A");
        await webBuilder.page.keyboard.press("Backspace");
        await webBuilder.page.waitForTimeout(1 * 1000);
        await webBuilder.page.keyboard.type(block.edit.content_edit);
        await webBuilder.backToLayerBtn.first().click();
      }
      await webBuilder.clickSaveButton();

      await dashboardPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardPage.chooseEntityTranslate({ page: cConf.policy_page.title });
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationAfterEditContent(cConf.policy_page.title);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-2-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      for (const field of manualData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: field.field_index,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        const content = await sfTranslation
          .genLoc(sfTranslation.xpathTranslate.contentBlockById(blockId[i]))
          .innerText();
        expect.soft(content).toEqual(manualData.expected_result_translation[i].target_value);
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(manualData.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        const content = await sfTranslation
          .genLoc(sfTranslation.xpathTranslate.contentBlockById(blockId[i]))
          .innerText();
        expect.soft(content).toEqual(manualData.expected_result_translation[i].target_value);
      }
    });

    await test.step(`Xóa Bản dịch manual > save.   
  Ra ngoài SF page Return policy`, async () => {
      for (const field of deleteData.edit_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: field.field_index,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(
            conf.suiteConf.default_language_data.language,
          ),
        )
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(cConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(cConf.toast_success).waitFor({ state: "hidden" });

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-remove-translation-${conf.caseName}.png`,
      });

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-5-${cConf.dnd_block[i].template}-empty-translated-content-to-${cConf.language_data.language}.png`,
        });
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathTD.alertInProgress(cConf.language_data.language));
      await dashboardPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.policy_page_edit.expected_result_translation));

      //Verify SF
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle");
      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      await sfTranslation.genLoc(sfTranslation.xpathTranslate.sectionContainer(4)).scrollIntoViewIfNeeded();
      await sfTranslation.page.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );

      await sfTranslation.page.waitForTimeout(2 * 1000); //wait for content visible
      for (let i = 0; i < blockId.length; i++) {
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTranslation.page,
          selector: sfTranslation.xpathTranslate.blockById(blockId[i]),
          snapshotName: `${conf.caseName}-step-6-${cConf.dnd_block[i].template}-translated-to-${cConf.language_data.language}.png`,
        });
      }
    });
  });
});
