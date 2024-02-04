import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { Entity } from "@pages/new_ecom/dashboard/translation/language-detail";
import { SfTranslation } from "@pages/dashboard/sf-translation";

test.describe("Verify Translation Detail - Preview", () => {
  let dashboardPage: TranslationDetail, xpathPreviewBtn: string, allEntities: Entity[], sfTranslation: SfTranslation;

  test.beforeEach(async ({ dashboard, conf, cConf }) => {
    test.setTimeout(2000000);
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    sfTranslation = new SfTranslation(dashboard, conf.suiteConf.domain);
    xpathPreviewBtn = dashboardPage.xpathBtnWithLabel("Preview");
    allEntities = (await dashboardPage.getAllEntities()).filter(item => item !== "Static content");

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

  test(`@SB_SET_LG_TLL_28 [DB - UI/UX] Kiểm tra button Preview với ngôn ngữ Unpublished`, async ({ cConf }) => {
    await test.step(`Pre-condition: Unpublish language`, async () => {
      await dashboardPage.changeStatusLanguage(cConf.language_data.language, "Unpublish");
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathLangList.languageItemByName(cConf.language_data.status, cConf.language_data.language),
        ),
      ).toBeVisible();
    });

    await test.step(`Chọn ngôn ngữ unpublished > Mở Language translation`, async () => {
      await dashboardPage.openLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(cConf.language_data.language)),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(xpathPreviewBtn)).toBeDisabled();
    });

    for (const entity of allEntities) {
      await test.step(`Mở translation detail với các entity tương ứng`, async () => {
        await dashboardPage.clickEntityDetail(entity);
        await expect(dashboardPage.genLoc(xpathPreviewBtn)).toBeDisabled();
        await dashboardPage.waitForTranslationToCompleteAfterAddLanguage();
      });

      await test.step(`Click btn Auto translate > Đợi đến khi hiện thông báo translate success`, async () => {
        await dashboardPage.clickActionBtn("Auto translate");
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.alertTransSuccess(cConf.language_data.language))
          .waitFor({ state: "visible", timeout: 180000 });
        await expect
          .soft(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel(`View store in ${cConf.language_data.language}`)))
          .toBeDisabled();
        await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(cConf.language_data.language)),
        ).toBeVisible();
      });
    }
  });

  test(`@SB_SET_LG_TLL_29 [DB - UI/UX] Kiểm tra button Preview với ngôn ngữ Published - Primary domain only - Country có code 2 chữ cái`, async ({
    conf,
    cConf,
    snapshotFixture,
  }) => {
    await test.step(`Chọn ngôn ngữ published> Mở Language translation`, async () => {
      await dashboardPage.openLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(cConf.language_data.language)),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(xpathPreviewBtn)).toBeEnabled();
    });

    await test.step(`Click btn Preview`, async () => {
      const preview = await dashboardPage.clickActionBtn("Preview");
      await preview.waitForLoadState("networkidle");
      await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );
      expect(preview.url()).toEqual(
        `https://${conf.suiteConf.domain}/?${cConf.language_data.paramUrl}&theme_preview_id=${conf.suiteConf.theme_id}`,
      );

      await preview.waitForTimeout(2 * 1000); //wait for page stable
      await snapshotFixture.verify({
        page: preview,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf}.png`,
      });
      await preview.close();
    });

    for (const entity of cConf.entities) {
      await test.step(`Mở translation detail với các entity tương ứng theo data > Click btn Preview`, async () => {
        await dashboardPage.clickEntityDetail(entity);
        await expect(dashboardPage.genLoc(xpathPreviewBtn)).toBeEnabled();
        await dashboardPage.waitForTranslationToCompleteAfterAddLanguage();
      });

      await test.step(`Từ màn translation detail theo data  > Click btn Auto translate > Đợi đến khi hiện thông báo translate success`, async () => {
        await dashboardPage.clickActionBtn("Auto translate");
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.alertTransSuccess(cConf.language_data.language))
          .waitFor({ state: "visible", timeout: 180000 });
        await expect
          .soft(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel(`View store in ${cConf.language_data.language}`)))
          .toBeEnabled();
      });

      await test.step(`Từ màn translation detail theo data > Click btn 'View store in ...' `, async () => {
        const preview = await dashboardPage.clickActionBtn("View store");
        await preview.waitForLoadState("networkidle");
        await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf,
        );
        expect(preview.url()).toEqual(
          `https://${conf.suiteConf.domain}/?${cConf.language_data.paramUrl}&theme_preview_id=${conf.suiteConf.theme_id}`,
        );

        await preview.waitForTimeout(2 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: preview,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf}.png`,
        });
        await preview.close();

        await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(cConf.language_data.language)),
        ).toBeVisible();
      });
    }
  });

  test(`@SB_SET_LG_TLL_91 [DB - UI/UX] Kiểm tra button Preview với ngôn ngữ Published - Primary domain only - Country có code 3 chữ cái`, async ({
    conf,
    cConf,
    snapshotFixture,
  }) => {
    await test.step(`Chọn ngôn ngữ published> Mở Language translation`, async () => {
      await dashboardPage.openLanguageDetail(cConf.language_data.status, cConf.language_data.language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(cConf.language_data.language)),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(xpathPreviewBtn)).toBeEnabled();
    });

    await test.step(`Click btn Preview`, async () => {
      const preview = await dashboardPage.clickActionBtn("Preview");
      await preview.waitForLoadState("networkidle");
      await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        cConf.language_data.language_sf,
      );
      expect(preview.url()).toEqual(
        `https://${conf.suiteConf.domain}/?${cConf.language_data.paramUrl}&theme_preview_id=${conf.suiteConf.theme_id}`,
      );

      await preview.waitForTimeout(2 * 1000); //wait for page stable
      await snapshotFixture.verify({
        page: preview,
        selector: sfTranslation.xpathTranslate.sectionContainer(3),
        snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf}.png`,
      });
      await preview.close();
    });

    for (const entity of cConf.entities) {
      await test.step(`Mở translation detail với các entity tương ứng theo data > Click btn Preview`, async () => {
        await dashboardPage.clickEntityDetail(entity);
        await expect(dashboardPage.genLoc(xpathPreviewBtn)).toBeEnabled();
        await dashboardPage.waitForTranslationToCompleteAfterAddLanguage();
      });

      await test.step(`Từ màn translation detail theo data  > Click btn Auto translate > Đợi đến khi hiện thông báo translate success`, async () => {
        await dashboardPage.clickActionBtn("Auto translate");
        await dashboardPage
          .genLoc(dashboardPage.xpathTD.alertTransSuccess(cConf.language_data.language))
          .waitFor({ state: "visible", timeout: 180000 });
        await expect
          .soft(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel(`View store in ${cConf.language_data.language}`)))
          .toBeEnabled();
      });

      await test.step(`Từ màn translation detail theo data > Click btn 'View store in ...' `, async () => {
        const preview = await dashboardPage.clickActionBtn("View store");
        await preview.waitForLoadState("networkidle");
        await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
        await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          cConf.language_data.language_sf,
        );
        expect(preview.url()).toEqual(
          `https://${conf.suiteConf.domain}/?${cConf.language_data.paramUrl}&theme_preview_id=${conf.suiteConf.theme_id}`,
        );

        await preview.waitForTimeout(2 * 1000); //wait for page stable
        await snapshotFixture.verify({
          page: preview,
          selector: sfTranslation.xpathTranslate.sectionContainer(3),
          snapshotName: `${conf.caseName}-${process.env.ENV}-translated-to-${cConf.language_data.language_sf}.png`,
        });
        await preview.close();

        await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(cConf.language_data.language)),
        ).toBeVisible();
      });
    }
  });
});
