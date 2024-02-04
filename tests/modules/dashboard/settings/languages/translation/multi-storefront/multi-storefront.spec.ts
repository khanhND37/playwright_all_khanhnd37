import { test } from "@fixtures/website_builder";
import { Locator, expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { TranslationBootstrapData, TranslationDetailTableData } from "@types";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { getTranslationDataFromBootstrap } from "@core/utils/translation";

export type TransformedData = {
  field_name?: string;
  source_value?: string;
  target_value?: string;
  target_type?: "text" | "tiny_mce" | "tiptap";
  target_locator?: Locator;
};
test.describe("Verify translate multi storefront", () => {
  let dashboardPage: TranslationDetail,
    data: TranslationDetailTableData[],
    dataSFActive: TranslationDetailTableData[],
    dataSF: TranslationBootstrapData,
    language,
    transformedData: TransformedData[];

  test.beforeEach(async ({ dashboard, conf, theme }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    language = conf.caseConf.language_info;

    await test.step(`Precondition: publish template V3`, async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([language.name]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLangList.languageItemByName("Published languages", language.name)),
      ).toBeVisible();

      await dashboardPage.openLanguageDetail("Published languages", language.name);
      await dashboardPage.clickEntityDetail(conf.caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(conf.caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
    });

    if (conf.caseConf.unpublish_language) {
      await test.step(`Unpublish language`, async () => {
        await dashboardPage.goToLanguageList();
        const xpathBtnUnpublishLanguage = await dashboardPage
          .genLoc(dashboardPage.xpathLangList.changeStatusBtn(conf.caseConf.unpublish_language, "Unpublish"))
          .isVisible();
        if (xpathBtnUnpublishLanguage) {
          await dashboardPage.changeStatusLanguage(conf.caseConf.unpublish_language, "Unpublish");
        }
        await dashboardPage.openLanguageDetail(language.block, language.name);
      });
    }
  });

  test(`@SB_SET_LG_TLL_79 [Function] Kiểm tra chức năng auto translate giữa các sf ở language publish`, async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const sfActive = caseConf.storefront_active;
    const sfDefault = caseConf.storefront_default;

    await test.step(`1. Tại trang detail language, select sf default, turn on các toggle auto translate.
       2. Click detail entity Website pages `, async () => {
      // verify list block
      const listBlockNames = await dashboardPage.getListBlockNames();
      expect.soft(listBlockNames).toEqual(sfDefault.expected_block_names);
      // verify các field có data
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      expect.soft(transformedData).toEqual(expect.arrayContaining(sfDefault.expected_dashboard));

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfDefault.expected_sf_auto_translate);
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      transformedData = data.map(item => {
        return {
          target_type: item.destination.type,
          target_locator: item.destination.locator,
        };
      });

      for (const item of transformedData) {
        await dashboardPage.fillToField(
          caseConf.edit_translation.value,
          item.target_type,
          caseConf.edit_translation.value_type,
          item.target_locator,
        );
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfDefault.expected_sf_after_edit_manual);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfDefault.expected_sf_after_edit_manual);
    });

    await test.step(`Xóa Bản dịch manual > save
    Ra ngoài SF page [Home] của sf default`, async () => {
      for (const item of transformedData) {
        await dashboardPage.DeleteToField(item.target_type, item.target_locator);
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      data = await dashboardPage.getTranslationDetailData();
      transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });

      for (let i = 0; i < 5; i++) {
        const field = transformedData.filter(dataField => dataField.target_value !== "");
        if (field.length !== 0) {
          for (const item of field) {
            await dashboardPage.DeleteToField(item.target_type, item.target_locator);
          }
          await dashboardPage.clickOnBtnWithLabel("Save");
          await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

          data = await dashboardPage.getTranslationDetailData();
          transformedData = data.map(item => {
            return {
              field_name: item.field,
              source_value: item.source.value,
              target_value: item.destination.value,
              target_locator: item.destination.locator,
              target_type: item.destination.type,
            };
          });
        } else {
          break;
        }
      }

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfDefault.expected_sf_original_content);
    });

    await test.step(`Click auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      await dashboardPage.waitAbit(3000); // do sau khi translate xong thì có 1 số field hiển thị bản dịch chậm

      // verify các field có data
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      expect.soft(transformedData).toEqual(expect.arrayContaining(sfDefault.expected_dashboard));

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfDefault.expected_sf_auto_translate);
    });

    await test.step(`- Quay lại màn detail language, select 1 sf active khác default > Click detail entity Website pages`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
      await dashboardPage.selectStorefront(suiteConf.sf_active.storefront_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // verify list block
      const listBlockNames = await dashboardPage.getListBlockNames();
      expect.soft(listBlockNames).toEqual(sfActive.expected_block_names);

      // verify các field có data
      dataSFActive = await dashboardPage.getTranslationDetailData();
      const transformedData = dataSFActive.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActive.expected_dashboard));
      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.sf_active.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfActive.expected_sf_active_auto_translate);
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      transformedData = dataSFActive.map(item => {
        return {
          target_type: item.destination.type,
          target_locator: item.destination.locator,
        };
      });

      for (const item of transformedData) {
        await dashboardPage.fillToField(
          caseConf.edit_translation.value,
          item.target_type,
          caseConf.edit_translation.value_type,
          item.target_locator,
        );
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
        };
      });

      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.sf_active.domain, authRequest, {
        localeCode: language.locale_code,
      });

      expect.soft(dataSF["home"]).toEqual(sfActive.expected_sf_after_edit_manual);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.sf_active.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfActive.expected_sf_after_edit_manual);
    });

    await test.step(`Xóa Bản dịch manual > save
    Ra ngoài SF page [Home] của sf default`, async () => {
      for (const item of transformedData) {
        await dashboardPage.DeleteToField(item.target_type, item.target_locator);
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      data = await dashboardPage.getTranslationDetailData();
      transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });

      for (let i = 0; i < 5; i++) {
        const field = transformedData.filter(dataField => dataField.target_value !== "");
        if (field.length !== 0) {
          for (const item of field) {
            await dashboardPage.DeleteToField(item.target_type, item.target_locator);
          }
          await dashboardPage.clickOnBtnWithLabel("Save");
          await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

          data = await dashboardPage.getTranslationDetailData();
          transformedData = data.map(item => {
            return {
              field_name: item.field,
              source_value: item.source.value,
              target_value: item.destination.value,
              target_locator: item.destination.locator,
              target_type: item.destination.type,
            };
          });
        } else {
          break;
        }
      }

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.sf_active.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfActive.expected_sf_active_original_content);
    });

    await test.step(`Click auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify các field có data
      dataSFActive = await dashboardPage.getTranslationDetailData();
      const transformedData = dataSFActive.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActive.expected_dashboard));

      // verify bản dịch ngoài SF
      dataSF = await getTranslationDataFromBootstrap(suiteConf.sf_active.domain, authRequest, {
        localeCode: language.locale_code,
      });
      expect.soft(dataSF["home"]).toEqual(sfActive.expected_sf_active_auto_translate);
    });
  });

  test(`@SB_SET_LG_TLL_80 [Function] Kiểm tra chức năng auto translate giữa các sf ở language unpublish`, async ({
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const sfDefault = caseConf.storefront_default;
    const sfActive = caseConf.storefront_active;

    await test.step(`- Tại trang detail language, select sf default
    - Click detail entity Website pages
    - Thực hiện edit bản dịch > save`, async () => {
      await dashboardPage.selectStorefront(suiteConf.shop_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      data = await dashboardPage.getTranslationDetailData();
      transformedData = data.map(item => {
        return {
          target_type: item.destination.type,
          target_locator: item.destination.locator,
        };
      });

      for (const item of transformedData) {
        await dashboardPage.fillToField(
          caseConf.edit_translation.value,
          item.target_type,
          caseConf.edit_translation.value_type,
          item.target_locator,
        );
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }
    });

    await test.step(`Xóa Bản dịch manual > save`, async () => {
      for (const item of transformedData) {
        await dashboardPage.DeleteToField(item.target_type, item.target_locator);
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      data = await dashboardPage.getTranslationDetailData();
      transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });

      for (let i = 0; i < 5; i++) {
        const field = transformedData.filter(dataField => dataField.target_value !== "");
        if (field.length !== 0) {
          for (const item of field) {
            await dashboardPage.DeleteToField(item.target_type, item.target_locator);
          }
          await dashboardPage.clickOnBtnWithLabel("Save");
          await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

          data = await dashboardPage.getTranslationDetailData();
          transformedData = data.map(item => {
            return {
              field_name: item.field,
              source_value: item.source.value,
              target_value: item.destination.value,
              target_locator: item.destination.locator,
              target_type: item.destination.type,
            };
          });
        } else {
          break;
        }
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify bản dịch trong dashboard
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      expect.soft(transformedData).toEqual(expect.arrayContaining(sfDefault.expected_dashboard));
    });

    await test.step(`- Quay lại màn detail language, select 1 sf khác default
    - Click detail entity Website pages
    - Thực hiện edit bản dịch > save`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
      await dashboardPage.selectStorefront(suiteConf.sf_active.storefront_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      dataSFActive = await dashboardPage.getTranslationDetailData();
      transformedData = dataSFActive.map(item => {
        return {
          target_type: item.destination.type,
          target_locator: item.destination.locator,
        };
      });

      for (const item of transformedData) {
        await dashboardPage.fillToField(
          caseConf.edit_translation.value,
          item.target_type,
          caseConf.edit_translation.value_type,
          item.target_locator,
        );
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify bản dịch trong dashboard
      const dataAfterManual = await dashboardPage.getTranslationDetailData();
      transformedData = dataAfterManual.map(item => {
        return {
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });
      for (const item of transformedData) {
        expect.soft(item.target_value).toEqual(caseConf.edit_translation.value);
      }
    });

    await test.step(`Xóa Bản dịch manual > save`, async () => {
      for (const item of transformedData) {
        await dashboardPage.DeleteToField(item.target_type, item.target_locator);
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

      data = await dashboardPage.getTranslationDetailData();
      transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
          target_locator: item.destination.locator,
          target_type: item.destination.type,
        };
      });

      for (let i = 0; i < 5; i++) {
        const field = transformedData.filter(dataField => dataField.target_value !== "");
        if (field.length !== 0) {
          for (const item of field) {
            await dashboardPage.DeleteToField(item.target_type, item.target_locator);
          }
          await dashboardPage.clickOnBtnWithLabel("Save");
          await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();

          data = await dashboardPage.getTranslationDetailData();
          transformedData = data.map(item => {
            return {
              field_name: item.field,
              source_value: item.source.value,
              target_value: item.destination.value,
              target_locator: item.destination.locator,
              target_type: item.destination.type,
            };
          });
        } else {
          break;
        }
      }
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify bản dịch trong dashboard
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActive.expected_dashboard));
    });
  });
});

test.describe("Verify edit original content multi storefront", () => {
  let dashboardPage: TranslationDetail,
    data: TranslationDetailTableData[],
    dataSFActive: TranslationDetailTableData[],
    language,
    onlineStore: OnlineStorePage,
    templateId: number,
    webBuilder: WebBuilder,
    currentTemplates: number[];

  test.beforeEach(async ({ dashboard, conf, theme }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    onlineStore = new OnlineStorePage(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    language = conf.caseConf.language_info;

    await test.step(`Precondition: publish template V3 ở sf default`, async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });

    await test.step(`Pre-condition: Publish theme v3 cho các sf khác`, async () => {
      currentTemplates = [];
      await dashboardPage.goto(`admin/storefronts/${conf.suiteConf.storefront_edit.shop_id}/themes`);
      const currentTemplate = await onlineStore.getThemeIdCurrentTheme();
      //check current template nếu không phải là template exp thì publish template exp > remove template vừa unpublish
      if (currentTemplate !== conf.suiteConf.storefront_edit.theme_id) {
        await onlineStore.actionWithThemes({
          action: "Publish",
          themeId: conf.suiteConf.storefront_edit.theme_id,
        });

        await onlineStore.actionWithThemes({
          action: "Remove",
          themeId: currentTemplate,
        });
      }

      // add theme template mới và publish nó
      await onlineStore.copyATheme(conf.suiteConf.storefront_edit.theme_id.toString());
      templateId = await onlineStore.getThemeIdOfJustAddedTheme();
      await onlineStore.actionWithThemes({
        action: "Publish",
        themeId: templateId,
      });
      currentTemplates.push(templateId);

      await test.step("Pre condition: Delete all languages and add new language", async () => {
        await dashboardPage.goToLanguageList();
        await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
        await dashboardPage.removeAllLanguages();

        await dashboardPage.addLanguages([language.name]);
        await dashboardPage.waitUntilMessHidden();
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLangList.languageItemByName("Published languages", language.name)),
        ).toBeVisible();
        await dashboardPage.openLanguageDetail("Published languages", language.name);
        await dashboardPage.clickEntityDetail(conf.caseConf.entity_name);
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(conf.caseConf.alert_text_in_translate))
          .waitFor({ state: "hidden", timeout: 180 * 1000 });
      });

      // với case test language unpublish thì update status của language trước
      if (conf.caseConf.unpublish_language) {
        await test.step(`Unpublish language`, async () => {
          await dashboardPage.goToLanguageList();
          const xpathBtnUnpublishLanguage = await dashboardPage
            .genLoc(dashboardPage.xpathLangList.changeStatusBtn(conf.caseConf.unpublish_language, "Unpublish"))
            .isVisible();
          if (xpathBtnUnpublishLanguage) {
            await dashboardPage.changeStatusLanguage(conf.caseConf.unpublish_language, "Unpublish");
          }
          await dashboardPage.openLanguageDetail(language.block, language.name);
        });
      }
    });
  });

  test(`@SB_SET_LG_TLL_81 [Function] Kiểm tra chức năng auto translate giữa các sf ở language publish khi thay đổi data source language`, async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const sfActiveEdit = caseConf.storefront_active_edit;
    const sfDefault = caseConf.storefront_default;

    await test.step(`Tại trang detail language, select sf cần edit, turn on các toggle auto translate.
    - Click detail entity Website pages`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
      await dashboardPage.selectStorefront(suiteConf.storefront_edit.storefront_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage.genLoc(dashboardPage.xpathTD.translatingAlert).waitFor({ state: "hidden" });
      await dashboardPage.waitAbit(2000); //đợi load hết bản dịch

      // verify các field có data
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActiveEdit.expected_dashboard));
    });

    await test.step(`- Open web builder, tại Home page, edit content các block
  - Click btn Save > click Exit.
  - Đi đến trang detail language trên, mở detail entity Website pages, chọn page Home`, async () => {
      await dashboardPage.goto(`admin/storefronts/${suiteConf.storefront_edit.shop_id}/themes`);
      await dashboardPage.clickOnBtnWithLabel("Customize");

      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
      await webBuilder.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });

      // kéo block button
      await webBuilder.insertSectionBlock({
        parentPosition: suiteConf.add_block.parent_position,
        template: suiteConf.add_block.template,
      });

      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(suiteConf.add_block_info.input_content);
      await webBuilder.backBtn.click();

      // edit content block paragraph
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "Paragraph", 1);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(caseConf.edit_block.edit_content_paragraph);
      await webBuilder.backBtn.click();

      // edit content block heading
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "Heading", 1);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(caseConf.edit_block.edit_content_heading);
      await webBuilder.backBtn.click();

      // edit label button
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "Button", 1);
      await webBuilder.switchToTab("Content");
      await webBuilder.inputTextBox("title", caseConf.edit_block.edit_label_button);
      await webBuilder.backBtn.click();

      // xóa block html code
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "HTML code", 1);
      await webBuilder.genLoc(webBuilder.getXpathByText("Delete block")).click();

      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText(caseConf.toast_success_in_wb);
      await webBuilder.toastMessage.waitFor({ state: "hidden" });

      await webBuilder.genLoc(XpathNavigationButtons["exit"]).click();
      await dashboardPage.goToLanguageDetail(language.block, language.name);
      await dashboardPage.selectStorefront(suiteConf.storefront_edit.storefront_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage.waitAbit(2000);

      await dashboardPage.waitForTranslationAfterEditContent(caseConf.retry);
      await dashboardPage.waitAbit(2000); //đợi load hết bản dịch

      // verify các field có data
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActiveEdit.expected_dashboard_after_edit));
    });

    await test.step(`- Back về màn detail language, chọn sf default.
  - Mở detail entity Website pages, kiểm tra nội dung ở page Home`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
      await dashboardPage.selectStorefront(suiteConf.shop_name);

      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage.waitAbit(2000); //đợi load hết bản dịch

      // verify các field có data
      dataSFActive = await dashboardPage.getTranslationDetailData();
      const transformedData = dataSFActive.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(sfDefault.expected_dashboard));
    });

    await test.step(`View SF vừa setting, chọn ngôn ngữ đã được dịch, kiểm tra bản dịch`, async () => {
      // verify bản dịch ngoài SF
      const dataSF = await getTranslationDataFromBootstrap(suiteConf.storefront_edit.domain, authRequest, {
        localeCode: language.locale_code,
      });

      expect.soft(dataSF["home"]).toEqual(sfActiveEdit.expected_sf_active_after_edit_content);
    });
  });

  test(`@SB_SET_LG_TLL_82 [Function] Kiểm tra chức năng auto translate giữa các sf ở language unpublish khi thay đổi data source language`, async ({
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    const sfActiveEdit = caseConf.storefront_active_edit;
    const sfDefault = caseConf.storefront_default;

    await test.step(`Tại trang detail language, select sf > Click detail entity Website pages`, async () => {
      await dashboardPage.selectStorefront(suiteConf.storefront_edit.storefront_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage.waitAbit(2000); //đợi load hết bản dịch

      // verify các field có data
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActiveEdit.expected_dashboard));
    });

    await test.step(`- Open web builder, tại Home page, edit content các block > Click btn Save > click Exit 
    > Đi đến trang detail language trên, mở detail entity Website pages, chọn page Home`, async () => {
      await dashboardPage.goto(`admin/storefronts/${suiteConf.storefront_edit.shop_id}/themes`);
      await dashboardPage.clickOnBtnWithLabel("Customize");

      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
      await webBuilder.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });

      // kéo block button
      await webBuilder.insertSectionBlock({
        parentPosition: suiteConf.add_block.parent_position,
        template: suiteConf.add_block.template,
      });

      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(suiteConf.add_block_info.input_content);
      await webBuilder.backBtn.click();

      // edit content block paragraph
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "Paragraph", 1);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(caseConf.edit_block.edit_content_paragraph);
      await webBuilder.backBtn.click();

      // edit content block heading
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "Heading", 1);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(caseConf.edit_block.edit_content_heading);
      await webBuilder.backBtn.click();

      // edit label button
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "Button", 1);
      await webBuilder.switchToTab("Content");
      await webBuilder.inputTextBox("title", caseConf.edit_block.edit_label_button);
      await webBuilder.backBtn.click();

      // xóa block html code
      await webBuilder.openQuickBarSetting(caseConf.edit_block.section_name, "HTML code", 1);
      await webBuilder.genLoc(webBuilder.getXpathByText("Delete block")).click();

      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText(caseConf.toast_success_in_wb);
      await webBuilder.toastMessage.waitFor({ state: "hidden" });

      await webBuilder.genLoc(XpathNavigationButtons["exit"]).click();
      await dashboardPage.goToLanguageDetail(language.block, language.name);
      await dashboardPage.selectStorefront(suiteConf.storefront_edit.storefront_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage.waitAbit(2000); //đợi load hết bản dịch

      // verify các field có data
      data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(sfActiveEdit.expected_dashboard_after_edit));
    });

    await test.step(`Click auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      // sau khi dịch xong thì thi thoảng bản dịch hiển thị chậm nên dẽ bị get ra data rỗng, nên cần đợi 1,2 giây
      await dashboardPage.waitAbit(3000);

      // verify các field có data
      dataSFActive = await dashboardPage.getTranslationDetailData();
      const transformedData = dataSFActive.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect
        .soft(transformedData)
        .toEqual(expect.arrayContaining(sfActiveEdit.expected_dashboard_after_edit_content_then_click_auto_translate));
    });

    await test.step(`- Back về màn detail language, chọn sf default.-> Mở detail entity Website pages, kiểm tra nội dung ở page Home`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
      await dashboardPage.selectStorefront(suiteConf.shop_name);
      await dashboardPage.clickEntityDetail(caseConf.entity_name);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.blockColumn);
      await dashboardPage.waitAbit(2000); //đợi load hết bản dịch

      // verify các field có data
      dataSFActive = await dashboardPage.getTranslationDetailData();
      const transformedData = dataSFActive.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      expect.soft(transformedData).toEqual(expect.arrayContaining(sfDefault.expected_dashboard));
    });
  });
});
