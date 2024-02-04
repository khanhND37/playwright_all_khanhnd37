import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { SfTranslation } from "@pages/dashboard/sf-translation";

test.describe("Kiểm tra editor tiptap hiển thị đúng với font được setting", () => {
  let dashboardPage: TranslationDetail, sfTranslation: SfTranslation;

  test.beforeEach(async ({ dashboard, conf, cConf }) => {
    test.slow();
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([cConf.language_data.language]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathLangList.languageItemByName("Published languages", cConf.language_data.language),
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_SET_TL_49 [DB+SF - Function] Kiểm tra editor tiptap trên trang translation detail`, async ({
    snapshotFixture,
    cConf,
    conf,
  }) => {
    let dataDBTargetLanguage;
    let data;
    test.slow();

    await test.step(`Tại block heading, kiểm tra hiển thị editor tiptap tại các field`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        cConf.language_data.status,
        cConf.language_data.language,
        cConf.language_data.entity,
      );

      await dashboardPage.genLoc(dashboardPage.xpathTD.tiptapEditor).first().waitFor();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-UI-tiptap.png`,
      });
      data = await dashboardPage.getTranslationDetailData();
      dataDBTargetLanguage = data.map(item => {
        return {
          target_locator: item.destination.locator,
        };
      });
    });

    for (const settingData of cConf.setting_data) {
      await test.step(`1. Chọn cả đoạn text, lần lượt thực hiện thay đổi các setting trên toolbar, bấm save lại 2. Preview ngoài SF`, async () => {
        const index = cConf.setting_data.indexOf(settingData);
        await dashboardPage.editTiptap(dataDBTargetLanguage[0].target_locator, settingData);
        const preview = await dashboardPage.clickActionBtn("Preview");
        await preview.waitForLoadState("networkidle");
        sfTranslation = new SfTranslation(preview, conf.suiteConf.domain);
        await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf,
        );

        await preview.waitForTimeout(2 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: preview,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language}-setting-font-${index}.png`,
        });
        await preview.close();
      });
    }
  });
});
