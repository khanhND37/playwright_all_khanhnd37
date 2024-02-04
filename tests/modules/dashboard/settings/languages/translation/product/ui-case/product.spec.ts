import { OcgLogger } from "@core/logger";
import { getSnapshotNameWithEnvAndCaseCode } from "@core/utils/env";
import { test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { expect } from "@playwright/test";

const logger = OcgLogger.get();

test.describe("Verify Translation detail của Online store - Product ", () => {
  let dashboardPage: TranslationDetail;

  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([conf.caseConf.language]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(
          // eslint-disable-next-line max-len
          dashboardPage.xpathLangList.languageItemByName(conf.caseConf.status, conf.caseConf.language),
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_SET_TL_59 [DB - UI/UX] Kiểm tra màn translate detail của store data - Products - products`, async ({
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click vào details của products`, async () => {
      await dashboardPage.openLanguageDetail("Published languages", conf.caseConf.language);
      await dashboardPage.page.waitForLoadState("networkidle");
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      await dashboardPage.switchToggleAutoTranslate("Products", true);

      await dashboardPage.goToTranslationDetailScreen("Published languages", "German", "Products");
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue("English")),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue("German")),
      ).toBeVisible();
    });

    await test.step(`Kiểm tra droplist pages`, async () => {
      const droplistPages = await dashboardPage.getDropListPagesOptions();
      logger.info(`droplistPages: ${JSON.stringify(droplistPages)}`);
      expect(droplistPages).toEqual(expect.arrayContaining(dashboardPage.dropListPages));
    });

    await test.step(`Kiểm tra droplist Product`, async () => {
      // Verify auto select first product
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.topBar,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(caseConf.snapshot.topbar, caseConf.case_code),
      });

      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.searchBar.product.activeSearchPopup,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(caseConf.snapshot.search_container, caseConf.case_code),
      });

      await dashboardPage.clickOnTitle();
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.searchProduct(caseConf.product.not_exist);

      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.noResult)).toBeVisible();
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.searchProduct(caseConf.product.exist);

      const searchResult = await dashboardPage.getProductSearchResults();
      expect(searchResult).toEqual(expect.arrayContaining(caseConf.product.expect_search_result));
    });

    await test.step(`Chọn product 1, Kiểm tra các field`, async () => {
      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      await dashboardPage.chooseProduct(caseConf.verify.first_product.search);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData1 = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      for (const itemDT of transformedData1) {
        expect(itemDT.target_value).not.toEqual("");
        expect(itemDT.target_value).not.toEqual(itemDT.source_value);
      }
      // expect.soft(transformedData1).toEqual(expect.arrayContaining(caseConf.verify.first_product.expected_result));
    });

    await test.step(`Chọn product 4, Kiểm tra các field`, async () => {
      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      await dashboardPage.chooseProduct(caseConf.verify.second_product.search);

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });
      for (const itemData of transformedData) {
        expect(itemData.target_value).not.toEqual("");
        expect(itemData.target_value).not.toEqual(itemData.source_value);
      }

      // logger.info(`transformedData: ${JSON.stringify(transformedData)}`);

      // expect.soft(transformedData).toEqual(expect.arrayContaining(caseConf.verify.second_product.expected_result));
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      // TODO: verify screenshot after dev update
    });

    await test.step(`Kiểm tra UI edit bản dịch`, async () => {
      // Fill to title
      await dashboardPage.fillTranslationDetails([
        {
          inputDataType: "text",
          inputData: caseConf.input.text_field,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Title",
          },
        },
      ]);
      await dashboardPage.page.waitForTimeout(3000);

      // Capture image
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(caseConf.snapshot.body, caseConf.case_code),
      });
    });
  });
});
