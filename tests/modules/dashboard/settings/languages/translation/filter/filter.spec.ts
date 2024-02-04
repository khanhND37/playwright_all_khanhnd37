import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DashboardAPI } from "@pages/api/dashboard";
import { pressControl } from "@core/utils/keyboard";

test.describe("Automate testcase for entity Filter(feature translation)", () => {
  let dashboardTransPage: TranslationDetail;
  let collectionApi: CollectionAPI;
  let dashboardPage: DashboardPage;
  let dashboardAPI: DashboardAPI;

  test.beforeEach("", async ({ dashboard, conf, authRequest, cConf }) => {
    const suiteConf = conf.suiteConf;
    dashboardTransPage = new TranslationDetail(dashboard, suiteConf.domain);
    collectionApi = new CollectionAPI(suiteConf.domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, suiteConf.domain);
    dashboardAPI = new DashboardAPI(suiteConf.domain, authRequest);

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardTransPage.goToLanguageList();
      await expect(dashboardTransPage.genLoc(dashboardTransPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardTransPage.removeAllLanguages();

      await dashboardTransPage.addLanguages([cConf.language_data.language]);
      await dashboardTransPage.waitUntilMessHidden();
      await expect(
        dashboardTransPage.genLoc(
          dashboardTransPage.xpathLangList.languageItemByName(cConf.language_data.status, cConf.language_data.language),
        ),
      ).toBeVisible();
    });

    await test.step("Pre condition: Delete all filters and add new filters", async () => {
      await dashboardAPI.setSearchFilter(suiteConf.default_filter);

      //Add filter
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
      await dashboardPage.manageFilters(cConf.filter_data);
      for (const filter of cConf.filter_data.filters) {
        const addedFilter = dashboardPage.collectionSearchFilter.filter({ hasText: filter });
        await expect(addedFilter).toBeVisible();
      }
    });
  });

  test(`@SB_SET_TL_83 [DB - UI/UX] Kiểm tra màn translate detail của store data - Pages - Filters`, async ({
    snapshotFixture,
    cConf,
    conf,
  }) => {
    await test.step(`Click vào details của Pages - filter`, async () => {
      await dashboardTransPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await expect(
        dashboardTransPage.genLoc(dashboardTransPage.xpathTD.translationTable.heading.fieldColumn),
      ).toBeVisible();
      await expect(
        dashboardTransPage.genLoc(
          dashboardTransPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        ),
      ).toBeVisible();
      await expect(
        dashboardTransPage.genLoc(
          dashboardTransPage.xpathTD.translationTable.heading.fieldColumnByValue(cConf.language_data.language),
        ),
      ).toBeVisible();
    });

    await test.step(`Kiểm tra droplist pages`, async () => {
      const droplistEntities = await dashboardTransPage.getDropListPagesOptions();
      expect(droplistEntities).toEqual(expect.arrayContaining(dashboardTransPage.dropListPages));
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      //Verify default
      await snapshotFixture.verify({
        page: dashboardTransPage.page,
        selector: dashboardTransPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-filter-UI-default.png`,
      });

      //Verify UI manual
      await dashboardTransPage.page
        .locator(dashboardTransPage.xpathTD.translationTable.inputTextBoxWithLabel(cConf.data_manual.field_name))
        .fill(cConf.data_manual.value);
      await dashboardTransPage.page
        .locator(
          dashboardTransPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        )
        .click();
      await dashboardTransPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardTransPage.page,
        selector: dashboardTransPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-filter-UI-manual.png`,
      });

      //Verify UI auto
      await dashboardTransPage.clickActionBtn("Auto translate");
      await dashboardTransPage.waitUntilElementVisible(
        dashboardTransPage.xpathTD.alertInProgress(cConf.language_data.language),
      );
      await dashboardTransPage.waitForTranslationToComplete(cConf.language_data.language);

      await dashboardTransPage.page
        .locator(dashboardTransPage.xpathTD.translationTable.iconTranslate(cConf.field_name_check_auto_icon))
        .hover();
      await dashboardTransPage.page.waitForTimeout(1 * 1000); //wait for tooltip visible
      await snapshotFixture.verify({
        page: dashboardTransPage.page,
        selector: dashboardTransPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-filter-UI-auto.png`,
      });

      //Verify UI outdate
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
      await dashboardPage.editCustomFilters(cConf.edit_custom_filter);

      await dashboardTransPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardTransPage.page
        .locator(
          dashboardTransPage.xpathTD.translationTable.iconTranslate(`Label ${cConf.edit_custom_filter.edit.name}`),
        )
        .hover();
      await dashboardTransPage.page.waitForTimeout(1 * 1000); //wait for tooltip visible
      await snapshotFixture.verify({
        page: dashboardTransPage.page,
        selector: dashboardTransPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-filter-UI-outdate.png`,
      });
    });

    await test.step(`Kiểm tra edit bản dịch`, async () => {
      //1. Thêm text vào text field - checked above
      await dashboardTransPage.page
        .locator(
          dashboardTransPage.xpathTD.translationTable.inputTextBoxWithLabel(cConf.data_edit_more_characters.field_name),
        )
        .click();
      await pressControl(dashboardTransPage.page, "A");
      await dashboardTransPage.page
        .locator(
          dashboardTransPage.xpathTD.translationTable.inputTextBoxWithLabel(cConf.data_edit_more_characters.field_name),
        )
        .fill(cConf.data_edit_more_characters.value);

      await dashboardTransPage.page
        .locator(
          dashboardTransPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        )
        .click();
      await dashboardTransPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardTransPage.page,
        selector: dashboardTransPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-filter-UI-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_102 [DB+SF - Function] Kiểm tra tính năng auto translate khi enable auto translate Pages - Filters`, async ({
    cConf,
    conf,
  }) => {
    test.slow();
    await test.step(`Enable auto translate ở Pages > Mở màn Filters Translation   > Mở droplist Filters `, async () => {
      await dashboardTransPage.goToLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await dashboardTransPage.switchToggleAutoTranslate("Products", true);
      await dashboardTransPage.waitForElementVisibleThenInvisible(dashboardTransPage.xpathLangList.toastMessage);
      await dashboardTransPage.switchToggleAutoTranslate("Pages", true);
      await dashboardTransPage.waitForElementVisibleThenInvisible(dashboardTransPage.xpathLangList.toastMessage);
      await dashboardTransPage.clickEntityDetail(cConf.language_data.entity);
      await dashboardTransPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardTransPage.waitForTranslationToComplete(cConf.language_data.language);

      //Verify content đã được dịch
      const data = await dashboardTransPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.filter_data.expected_result_translation));
    });

    await test.step(`Thực hiện thêm / xóa Filters tại dashboard > Mở màn Filters Translation`, async () => {
      //Add 1 custom filter
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
      await dashboardPage.manageFilters(cConf.add_filter);

      //Verify màn trans detail
      await dashboardTransPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardTransPage.page.waitForTimeout(3 * 1000); //wait for content visible
      const data = await dashboardTransPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(cConf.add_filter.expected_result_translation));

      //Delete a filter
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
      await dashboardPage.manageFilters(cConf.remove_filter);

      //Verify màn trans detail
      await dashboardTransPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardTransPage.page.waitForTimeout(3 * 1000); //wait for content visible
      const data2 = await dashboardTransPage.getTranslationDetailData();
      const transformedData2 = data2.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect.soft(transformedData2).toEqual(expect.arrayContaining(cConf.remove_filter.expected_result_translation));
    });

    await test.step(`Thực hiện edit tên 1 custom filter
  Mở màn Filters Translation của filter `, async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Navigation");
      await dashboardPage.editCustomFilters(cConf.edit_custom_filter);

      //Verify màn trans detail
      await dashboardTransPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );
      await dashboardTransPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardTransPage.waitForTranslationAfterEditContent();

      const data = await dashboardTransPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect
        .soft(transformedData)
        .toEqual(expect.arrayContaining(cConf.edit_custom_filter.expected_result_translation));

      //verify SF
      for (const handle of conf.suiteConf.collection_handle) {
        const dataTranslatedFilterSF = (
          await collectionApi.getCollectionDataOnSF(handle, cConf.language_data.language_locale)
        ).result.filters;

        const translatedLabelFilterSF = dataTranslatedFilterSF.map(item => item.label);

        for (let i = 0; i < translatedLabelFilterSF.length; i++) {
          expect.soft(translatedLabelFilterSF[i]).toEqual(transformedData[i].target_value);
        }
      }
    });

    await test.step(`Thực hiện edit bản dịch`, async () => {
      for (const field of cConf.edit_manual_translate) {
        await dashboardTransPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardTransPage.page.keyboard.press("Enter");
      await dashboardTransPage.page
        .locator(dashboardTransPage.xpathTD.translationTable.heading.fieldColumnByValue("Field"))
        .click();
      await dashboardTransPage.clickOnBtnWithLabel("Save");
      await expect(dashboardTransPage.toastWithMessage(cConf.toast_success)).toBeVisible();
      await dashboardTransPage.toastWithMessage(cConf.toast_success).waitFor({ state: "hidden" });

      const data = await dashboardTransPage.getTranslationDetailData();
      for (let i = 0; i < data.length; i++) {
        expect.soft(data[i]).toEqual(
          expect.objectContaining({
            field: cConf.edit_manual_translate[i].field_name,
            destination: expect.objectContaining({
              value: cConf.edit_manual_translate[i].content,
            }),
          }),
        );
      }
      const transformedData = data.map(item => {
        return {
          target_value: item.destination.value,
        };
      });

      //verify SF
      for (const handle of conf.suiteConf.collection_handle) {
        const dataTranslatedFilterSF = (
          await collectionApi.getCollectionDataOnSF(handle, cConf.language_data.language_locale)
        ).result.filters;

        const translatedLabelFilterSF = dataTranslatedFilterSF.map(item => item.label);

        for (let i = 0; i < translatedLabelFilterSF.length; i++) {
          expect.soft(translatedLabelFilterSF[i]).toEqual(transformedData[i].target_value);
        }
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardTransPage.clickActionBtn("Auto translate");
      await dashboardTransPage.waitUntilElementVisible(
        dashboardTransPage.xpathTD.alertInProgress(cConf.language_data.language),
      );
      await dashboardTransPage.waitForTranslationToComplete(cConf.language_data.language);

      // verify bản dịch trong dashboard
      const data = await dashboardTransPage.getTranslationDetailData();
      for (let i = 0; i < data.length; i++) {
        expect.soft(data[i]).toEqual(
          expect.objectContaining({
            field: cConf.edit_manual_translate[i].field_name,
            destination: expect.objectContaining({
              value: cConf.edit_manual_translate[i].content,
            }),
          }),
        );
      }
      const transformedData = data.map(item => {
        return {
          target_value: item.destination.value,
        };
      });

      //verify SF
      for (const handle of conf.suiteConf.collection_handle) {
        const dataTranslatedFilterSF = (
          await collectionApi.getCollectionDataOnSF(handle, cConf.language_data.language_locale)
        ).result.filters;

        const translatedLabelFilterSF = dataTranslatedFilterSF.map(item => item.label);

        for (let i = 0; i < translatedLabelFilterSF.length; i++) {
          expect.soft(translatedLabelFilterSF[i]).toEqual(transformedData[i].target_value);
        }
      }
    });

    await test.step(`Xóa Bản dịch manual > save.
  Ra ngoài SF > chọn ngôn ngữ tiếng Việt >  Ra ngoài SF All product`, async () => {
      for (const field of cConf.delete_translation) {
        await dashboardTransPage.fillTranslationDetail({
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
          dashboardTransPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        )
        .click();
      await dashboardTransPage.clickOnBtnWithLabel("Save");
      await expect(dashboardTransPage.toastWithMessage(cConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(cConf.toast_success).waitFor({ state: "hidden" });

      const data = await dashboardTransPage.getTranslationDetailData();
      for (let i = 0; i < data.length; i++) {
        expect.soft(data[i]).toEqual(
          expect.objectContaining({
            field: cConf.delete_translation[i].field_name,
            destination: expect.objectContaining({
              value: cConf.delete_translation[i].content,
            }),
          }),
        );
      }

      //verify SF
      for (const handle of conf.suiteConf.collection_handle) {
        const dataTranslatedFilterSF = (
          await collectionApi.getCollectionDataOnSF(handle, cConf.language_data.language_locale)
        ).result.filters;

        const translatedLabelFilterSF = dataTranslatedFilterSF.map(item => item.label);

        for (let i = 0; i < translatedLabelFilterSF.length; i++) {
          expect.soft(translatedLabelFilterSF[i]).toEqual(cConf.expected_sf_origin[i]);
        }
      }
    });

    await test.step(`click btn auto translate`, async () => {
      await dashboardTransPage.clickActionBtn("Auto translate");
      await dashboardTransPage.waitUntilElementVisible(
        dashboardTransPage.xpathTD.alertInProgress(cConf.language_data.language),
      );
      await dashboardTransPage.waitForTranslationToComplete(cConf.language_data.language);

      const data = await dashboardTransPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });

      expect
        .soft(transformedData)
        .toEqual(expect.arrayContaining(cConf.edit_custom_filter.expected_result_translation));

      //verify SF
      for (const handle of conf.suiteConf.collection_handle) {
        const dataTranslatedFilterSF = (
          await collectionApi.getCollectionDataOnSF(handle, cConf.language_data.language_locale)
        ).result.filters;

        const translatedLabelFilterSF = dataTranslatedFilterSF.map(item => item.label);

        for (let i = 0; i < translatedLabelFilterSF.length; i++) {
          expect.soft(translatedLabelFilterSF[i]).toEqual(transformedData[i].target_value);
        }
      }
    });
  });
});
