import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { getSnapshotNameWithEnvAndCaseCode } from "@utils/env";

test.describe("Verify UI Translation detail của  All pages content ", () => {
  let dashboardPage: TranslationDetail;
  let data;

  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    data = conf.caseConf.data;
  });

  test(`@SB_SET_LG_TLL_23 [DB - UI/UX] Kiểm tra màn translate detail của All pages content - all pages`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;

    for (const dataEntity of caseConf.data_entities) {
      await test.step(`Click vào details của ${dataEntity.entity_name}`, async () => {
        await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
        await dashboardPage.clickEntityDetail(dataEntity.entity_name);
        await expect
          .soft(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.blockColumn))
          .toBeVisible();
        await expect
          .soft(
            dashboardPage.genLoc(
              dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(data.default_language),
            ),
          )
          .toBeVisible();
        await expect
          .soft(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(data.language)))
          .toBeVisible();
      });

      await test.step(`Kiểm tra droplist Entity & Page`, async () => {
        const droplistEntities = await dashboardPage.getDropListPagesOptions();
        expect.soft(droplistEntities).toEqual(expect.arrayContaining(dashboardPage.dropListPages));

        await dashboardPage.genLoc(dashboardPage.xpathTD.pageDropdownBtn).click();
        const droplistPages = await dashboardPage.getDropListPagesWBOptions();
        expect.soft(droplistPages).toEqual(dataEntity.expect);
      });
    }

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
      await dashboardPage.clickEntityDetail(caseConf.entity_translate.entity);
      await dashboardPage.chooseEntityTranslate(caseConf.entity_translate);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.tableTranslation,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(`page_test_icon.png`, "SB_SET_LG_TLL_23"),
      });
    });
  });

  test(`@SB_SET_TL_53 [DB - UI/UX] Kiểm tra màn translate detail của All pages content - Header & footer`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click vào details của Header & Footer`, async () => {
      await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
      await dashboardPage.clickEntityDetail(data.entity_name);
      await expect.soft(dashboardPage.genLoc(dashboardPage.xpathTD.dropdownAllPagesbtn)).toBeHidden();
      await expect.soft(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.blockColumn)).toBeVisible();
      await expect
        .soft(
          dashboardPage.genLoc(
            dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(data.default_language),
          ),
        )
        .toBeVisible();
      await expect
        .soft(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(data.language)))
        .toBeVisible();

      // tên block in đậm, các label ,.. không in đâm (xpath có class `text-bold`)
      await expect.soft(dashboardPage.genLoc(dashboardPage.xpathTD.block.blockName(caseConf.block.name))).toBeVisible();
      for (const name of caseConf.block.fields) {
        await expect.soft(dashboardPage.genLoc(dashboardPage.xpathTD.block.fieldName(name))).toBeVisible();
      }
    });

    await test.step(`Kiểm tra Header`, async () => {
      for (const sectionName of caseConf.header_sections) {
        await expect.soft(dashboardPage.page.locator(dashboardPage.xpathTD.sectionName(sectionName))).toBeVisible();
      }
    });

    await test.step(`Kiểm tra Footer`, async () => {
      for (const sectionName of caseConf.footer_sections) {
        await expect.soft(dashboardPage.page.locator(dashboardPage.xpathTD.sectionName(sectionName))).toBeVisible();
      }
    });

    await test.step(`Kiểm tra droplist Entity `, async () => {
      const droplistEntities = await dashboardPage.getDropListPagesOptions();
      expect.soft(droplistEntities).toEqual(expect.arrayContaining(dashboardPage.dropListPages));
    });
  });
});
