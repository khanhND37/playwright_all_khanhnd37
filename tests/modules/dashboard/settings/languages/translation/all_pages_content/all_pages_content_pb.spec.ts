import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { OcgLogger } from "@core/logger";
import { getTranslationDataFromBootstrap } from "@core/utils/translation";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { loadData } from "@core/conf/conf";
import { ShopTheme } from "@types";

const logger = OcgLogger.get();
test.describe("Verify API bootstrap translation ", () => {
  test(`@SB_SET_TL_DEMO_bootstrap Demmo get translation data from bootstrap`, async ({ conf, authRequest }) => {
    await test.step(`Demo step`, async () => {
      const data = await getTranslationDataFromBootstrap(conf.suiteConf.domain, authRequest, {
        localeCode: "fr-us",
      });
      const datahome = data["home"];
      logger.info(JSON.stringify(datahome, null, 2));
      logger.info(JSON.stringify(data, null, 2));
    });

    return;
  });
});

test.describe("Verify Enable auto translate All pages content - Printbase ", () => {
  let dashboardPage: TranslationDetail;
  let duplicatedTheme: ShopTheme;
  let dataDBTargetLanguage;
  let data;
  let dataDB1;

  test.beforeEach(async ({ theme, conf, dashboard }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    data = conf.suiteConf.data_enable;

    // khi publish theme mới thời gian dịch rất lâu, nên tạm thời verify trên 1 theme cố định
    await test.step("Publish theme if needed", async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_id);
        const themeId = duplicatedTheme.id;
        await theme.publish(themeId);
      }
    });

    await test.step("Pre condition: Delete language and add language", async () => {
      await dashboardPage.goToLanguageList();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathLangList.titleLanguageList, { state: "visible" });
      await dashboardPage.removeLanguage(data.language);
      await dashboardPage.waitUntilMessHidden();
      await dashboardPage.addLanguage(data.language);
    });
  });

  const caseDataEnable = loadData(__dirname, "DATA_DRIVEN_ENABLE_AUTO_TRANSLATE_PBASE");
  for (const caseDataItem of caseDataEnable.caseConf.data_cases) {
    const dataEntity = caseDataItem.entity_translate;

    test(`@${caseDataItem.case_id} ${caseDataItem.case_description} `, async ({ conf, authRequest }) => {
      test.setTimeout(2000000);
      const caseConf = caseDataEnable.caseConf;
      const suiteConf = conf.suiteConf;

      await test.step(`Enable auto translate ở All pages content > Mở màn All pages content Translation ${dataEntity.entity} > ${dataEntity.page} page`, async () => {
        await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.clickEntityDetail(dataEntity.entity);
        await dashboardPage.chooseEntityTranslate(dataEntity);
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.translatingAlert)
          .waitFor({ state: "hidden", timeout: 180000 });

        const listBlockNames = await dashboardPage.getListBlockNames();
        expect.soft(listBlockNames).toEqual(caseConf.step1.expect_block_names);

        dataDB1 = await dashboardPage.getTranslationDetailData();
        const transformedData = dataDB1.map(item => {
          return {
            field_name: item.field,
            source_value: item.source.value,
            target_value: item.destination.value,
          };
        });
        for (const itemField of transformedData) {
          expect.soft(itemField.target_value).toContain(`to ${data.language}`);
        }
      });

      await test.step(`Thực hiện edit bản dịch > save > reload `, async () => {
        dataDBTargetLanguage = dataDB1.map(item => {
          return {
            target_type: item.destination.type,
            target_locator: item.destination.locator,
          };
        });

        for (const item of dataDBTargetLanguage) {
          await dashboardPage.fillToField(
            caseConf.edit_translation.value,
            item.target_type,
            caseConf.edit_translation.value_type,
            item.target_locator,
          );
        }
        await dashboardPage.clickOnBtnWithLabel("Save");
        await expect.soft(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
        await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });
        await dashboardPage.page.reload({ waitUntil: "networkidle" });

        const dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
          localeCode: data.subfolder,
        });
        logger.info(JSON.stringify(dataSF[caseDataItem.page], null, 2));
        expect.soft(dataSF[caseDataItem.page]).toEqual(caseConf.step2.expectSF);
      });

      await test.step(`Click Auto translate `, async () => {
        await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert);
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.translatingAlert)
          .waitFor({ state: "hidden", timeout: 180000 });
        await dashboardPage.page.waitForTimeout(2 * 1000);

        // verify bản dịch trong dashboard
        const dataDB = await dashboardPage.getTranslationDetailData();
        for (let i = 0; i < dataDB.length; i++) {
          expect.soft(dataDB[i]).toEqual(
            expect.objectContaining({
              destination: expect.objectContaining({
                value: caseConf.edit_translation.value,
              }),
            }),
          );
        }
      });

      await test.step(`edit tất cả bản dịch về data rỗng > save > reload`, async () => {
        for (const item of dataDBTargetLanguage) {
          await dashboardPage.DeleteToField(item.target_type, item.target_locator);
        }
        await dashboardPage.clickOnBtnWithLabel("Save");
        await expect.soft(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
        await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });
        await dashboardPage.page.reload({ waitUntil: "networkidle" });

        // verify bản dịch trong dashboard
        const dataDB = await dashboardPage.getTranslationDetailData();
        for (let i = 0; i < data.length; i++) {
          expect.soft(dataDB[i]).toEqual(
            expect.objectContaining({
              destination: expect.objectContaining({
                value: "",
              }),
            }),
          );
        }

        // verify bản dịch SF
        const dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
          localeCode: data.subfolder,
        });
        logger.info(JSON.stringify(dataSF[caseDataItem.page], null, 2));
        expect.soft(dataSF[caseDataItem.page]).toEqual(caseConf.step4.expectSF);
      });

      await test.step(`Click Auto translate `, async () => {
        await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert);
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.translatingAlert)
          .waitFor({ state: "hidden", timeout: 180000 });
        await dashboardPage.page.waitForTimeout(2 * 1000); // Do

        // verify bản dịch trong dashboard
        const dataDB = await dashboardPage.getTranslationDetailData();
        const transformedData = dataDB.map(item => {
          return {
            field_name: item.field,
            source_value: item.source.value,
            target_value: item.destination.value,
          };
        });
        for (const itemField of transformedData) {
          expect(itemField.target_value).toContain(`to ${data.language}`);
        }

        // verify bản dịch SF
        const dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
          localeCode: data.subfolder,
        });
        logger.info(JSON.stringify(dataSF[caseDataItem.page], null, 2));
        expect.soft(dataSF[caseDataItem.page]).toEqual(caseConf.step5.expectSF);
      });
    });
  }
});

test.describe("Verify Disable auto translate All pages content - Printbase ", () => {
  let dashboardPage: TranslationDetail;
  let duplicatedTheme: ShopTheme;
  let dataDBTargetLanguage;
  let data;
  let dataDB1;

  test.beforeEach(async ({ theme, conf, dashboard }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    data = conf.suiteConf.data_disable;

    await test.step("Disable Auto translate ", async () => {
      await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
      await dashboardPage.page.waitForLoadState("networkidle");
      await dashboardPage.switchToggleAutoTranslate("All pages content", false);
    });

    await test.step("Duplicate and publish theme", async () => {
      duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_id);
      const themeId = duplicatedTheme.id;
      await theme.publish(themeId);
    });
  });

  test.afterEach(async ({ theme, conf }) => {
    await test.step("Restore data theme", async () => {
      const listTemplate = [];
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
      const listTheme = await theme.list();
      listTheme.forEach(template => {
        if (!template.active) {
          listTemplate.push(template.id);
        }
      });
      if (listTemplate.length > 0) {
        for (const template of listTemplate) {
          if (template !== conf.suiteConf.theme_id) {
            await theme.delete(template);
          }
        }
      }
    });
  });

  const caseDataDisable = loadData(__dirname, "DATA_DRIVEN_DISABLE_AUTO_TRANSLATE_PBASE");
  for (const caseDataItem of caseDataDisable.caseConf.data_cases) {
    const dataEntity = caseDataItem.entity_translate;

    test(`@${caseDataItem.case_id} ${caseDataItem.case_description} `, async ({ conf, authRequest }) => {
      test.setTimeout(2000000);
      const caseConf = caseDataDisable.caseConf;
      const suiteConf = conf.suiteConf;

      await test.step(`Disable auto translate ở All pages content > Mở màn All pages content Translation ${dataEntity.entity} > ${dataEntity.page} page`, async () => {
        await dashboardPage.clickEntityDetail(dataEntity.entity);
        await dashboardPage.chooseEntityTranslate(dataEntity);
        await dashboardPage.page.waitForLoadState("networkidle");

        const listBlockNames = await dashboardPage.getListBlockNames();
        expect.soft(listBlockNames).toEqual(caseConf.step1.expect_block_names);

        // verify bản dịch trong dashboard
        dataDB1 = await dashboardPage.getTranslationDetailData();
        for (let i = 0; i < data.length; i++) {
          expect.soft(dataDB1[i]).toEqual(
            expect.objectContaining({
              destination: expect.objectContaining({
                value: "",
              }),
            }),
          );
        }
      });

      await test.step(`Thực hiện edit bản dịch > save `, async () => {
        dataDBTargetLanguage = dataDB1.map(item => {
          return {
            target_type: item.destination.type,
            target_locator: item.destination.locator,
          };
        });

        for (const item of dataDBTargetLanguage) {
          await dashboardPage.fillToField(
            caseConf.edit_translation.value,
            item.target_type,
            caseConf.edit_translation.value_type,
            item.target_locator,
          );
        }
        await dashboardPage.clickOnBtnWithLabel("Save");
        await expect.soft(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
        await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });

        const dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
          localeCode: data.subfolder,
        });
        logger.info(JSON.stringify(dataSF[caseDataItem.page], null, 2));
        expect.soft(dataSF[caseDataItem.page]).toEqual(caseConf.step2.expectSF);
      });

      await test.step(`Click Auto translate `, async () => {
        await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert);
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.translatingAlert)
          .waitFor({ state: "hidden", timeout: 180000 });
        await dashboardPage.page.waitForTimeout(2 * 1000);

        // verify bản dịch trong dashboard
        const dataDB = await dashboardPage.getTranslationDetailData();
        for (let i = 0; i < dataDB.length; i++) {
          expect.soft(dataDB[i]).toEqual(
            expect.objectContaining({
              destination: expect.objectContaining({
                value: caseConf.edit_translation.value,
              }),
            }),
          );
        }
      });

      await test.step(`edit tất cả bản dịch về data rỗng > save`, async () => {
        for (const item of dataDBTargetLanguage) {
          await dashboardPage.DeleteToField(item.target_type, item.target_locator);
        }
        await dashboardPage.clickOnBtnWithLabel("Save");
        await expect.soft(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
        await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });

        // verify bản dịch trong dashboard
        const dataDB = await dashboardPage.getTranslationDetailData();
        for (let i = 0; i < data.length; i++) {
          expect.soft(dataDB[i]).toEqual(
            expect.objectContaining({
              destination: expect.objectContaining({
                value: "",
              }),
            }),
          );
        }

        // verify bản dịch SF
        const dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
          localeCode: data.subfolder,
        });
        logger.info(JSON.stringify(dataSF[caseDataItem.page], null, 2));
        expect.soft(dataSF[caseDataItem.page]).toEqual(caseConf.step4.expectSF);
      });

      await test.step(`Click Auto translate `, async () => {
        await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert);
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.translatingAlert)
          .waitFor({ state: "hidden", timeout: 180000 });
        await dashboardPage.page.waitForTimeout(2 * 1000);

        // verify bản dịch trong dashboard
        const dataDB = await dashboardPage.getTranslationDetailData();
        const transformedData = dataDB.map(item => {
          return {
            field_name: item.field,
            source_value: item.source.value,
            target_value: item.destination.value,
          };
        });
        for (const itemField of transformedData) {
          expect.soft(itemField.target_value).toContain(`to ${data.language}`);
        }

        // verify bản dịch SF
        const dataSF = await getTranslationDataFromBootstrap(suiteConf.domain, authRequest, {
          localeCode: data.subfolder,
        });
        logger.info(JSON.stringify(dataSF[caseDataItem.page], null, 2));
        expect.soft(dataSF[caseDataItem.page]).toEqual(caseConf.step5.expectSF);
      });
    });
  }
});
