import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { getStyle } from "@core/utils/css";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";

test.describe("Kiểm tra editor tiptap hiển thị đúng với font được setting", () => {
  let dashboardPage: TranslationDetail, sfTranslation: SfTranslation, webBuilder: WebPageStyle, languageData;

  test.beforeEach(async ({ dashboard, conf, cConf }) => {
    test.slow();
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    webBuilder = new WebPageStyle(dashboard, conf.suiteConf.domain);
    languageData = cConf.language_data;

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages(cConf.add_languages);
      await dashboardPage.waitUntilMessHidden();
      for (const language of cConf.add_languages) {
        await expect(
          dashboardPage.genLoc(dashboardPage.xpathLangList.languageItemByName("Published languages", language)),
        ).toBeVisible();
      }
    });

    await test.step("Pre condition: Set font", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.openLanguageDetail(languageData[1].status, languageData[1].language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(languageData[1].language)),
      ).toBeVisible();
      await dashboardPage.clickActionButton("Edit font");
      await expect(webBuilder.genLoc(webBuilder.xpathSelectLangLabel)).toHaveText(languageData[1].language);
      await webBuilder.genLoc(webBuilder.xpathFontSetting.tab("Heading")).click();
      await webBuilder.chooseFonts(languageData[1].heading.font);
      await webBuilder.clickSaveButton();
    });
  });

  test(`@SB_SET_TL_84 [DB+SF - UI] Kiểm tra UI setting font`, async ({
    conf,
    cConf,
    snapshotFixture,
    context,
    dashboard,
  }) => {
    let headingLoc;
    let fontHeading;

    await test.step(`Đi tới màn settings/ language/ Arabric, click preview`, async () => {
      await dashboardPage.goToLanguageList();
      await dashboardPage.openLanguageDetail(languageData[0].status, languageData[0].language);
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(languageData[0].language)),
      ).toBeVisible();

      const preview = await dashboardPage.clickActionBtn("Preview");
      await preview.waitForLoadState("networkidle");
      sfTranslation = new SfTranslation(preview, conf.suiteConf.domain);
      await sfTranslation.changeSettingLanguage({ language: languageData[0].language_sf });
      await preview.waitForLoadState("networkidle");
      await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        languageData[0].language_sf,
      );

      //verify Heading
      const headingLoc = preview.locator(sfTranslation.xpathTranslate.blockByText(cConf.heading_content));
      const fontHeading = await getStyle(headingLoc, "font-family");
      expect(fontHeading).toContain(languageData[0].heading.font);

      const fontWeightHeading = await getStyle(headingLoc, "font-weight");
      expect(fontWeightHeading).toEqual(languageData[0].heading.font_weight);

      //verify Paragraph
      const paragraphLoc = preview.locator(sfTranslation.xpathTranslate.blockByText(cConf.paragraph_content));
      const fontParagraph = await getStyle(paragraphLoc, "font-family");
      expect(fontParagraph).toContain(languageData[0].paragraph.font);

      const fontWeightParagraph = await getStyle(paragraphLoc, "font-weight");
      expect(fontWeightParagraph).toEqual(languageData[0].paragraph.font_weight);

      await preview.close();
    });

    await test.step(`Tại dashboard, click edit font`, async () => {
      await dashboardPage.clickActionButton("Edit font");
      await expect(webBuilder.genLoc(webBuilder.xpathSelectLangLabel)).toHaveText(languageData[0].language);
      await webBuilder.genLoc(webBuilder.xpathFontSetting.tab("Heading")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.fontDropdownLabel)).toHaveText(
        languageData[0].heading.font,
      );
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.styleDropdownLabel)).toHaveText(
        languageData[0].heading.style,
      );

      await webBuilder.genLoc(webBuilder.xpathFontSetting.tab("Paragraph")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.fontDropdownLabel)).toHaveText(
        languageData[0].paragraph.font,
      );
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.styleDropdownLabel)).toHaveText(
        languageData[0].paragraph.style,
      );
    });

    await test.step(`Kiểm tra giá trị padding, margin sidebar font`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebar,
        snapshotName: `${process.env.ENV}-setting-font-${languageData[0].language}.png`,
      });
    });

    await test.step(`Kiểm tra font preview`, async () => {
      // check cùng ảnh screenshot step trên
    });

    await test.step(`Tại dropdown chọn language, chọn sang ngôn ngữ German`, async () => {
      await webBuilder.genLoc(webBuilder.xpathSelectLangLabel).click();
      await webBuilder.genLoc(webBuilder.xpathFontSetting.languageOption(languageData[1].language)).click();

      await webBuilder.genLoc(webBuilder.xpathFontSetting.tab("Heading")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.fontDropdownLabel)).toHaveText(
        languageData[1].heading.font,
      );
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.styleDropdownLabel)).toHaveText(
        languageData[1].heading.style,
      );

      await webBuilder.genLoc(webBuilder.xpathFontSetting.tab("Paragraph")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.fontDropdownLabel)).toHaveText(
        languageData[1].paragraph.font,
      );
      await expect(webBuilder.genLoc(webBuilder.xpathFontSetting.styleDropdownLabel)).toHaveText(
        languageData[1].paragraph.style,
      );
    });

    await test.step(`Click button save và preview ngoài storefront`, async () => {
      await webBuilder.clickSaveButton();
      const preview = await webBuilder.clickPreview({ context, dashboard });
      await preview.waitForLoadState("networkidle");
      sfTranslation = new SfTranslation(preview, conf.suiteConf.domain);
      await sfTranslation.changeSettingLanguage({ language: languageData[1].language_sf });
      await preview.waitForLoadState("networkidle");
      await preview.waitForSelector(sfTranslation.xpathTranslate.countryFlag);
      await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        languageData[1].language_sf,
      );

      //verify Heading
      const headingLoc = preview.locator(sfTranslation.xpathTranslate.blockByText(cConf.heading_content));
      const fontHeading = await getStyle(headingLoc, "font-family");
      expect(fontHeading).toContain(languageData[1].heading.font);

      const fontWeightHeading = await getStyle(headingLoc, "font-weight");
      expect(fontWeightHeading).toEqual(languageData[1].heading.font_weight);

      //verify Paragraph
      const paragraphLoc = preview.locator(sfTranslation.xpathTranslate.blockByText(cConf.paragraph_content));
      const fontParagraph = await getStyle(paragraphLoc, "font-family");
      expect(fontParagraph).toContain(languageData[1].paragraph.font);

      const fontWeightParagraph = await getStyle(paragraphLoc, "font-weight");
      expect(fontWeightParagraph).toEqual(languageData[1].paragraph.font_weight);

      await preview.close();
    });

    await test.step(`Thay đổi font heading của German`, async () => {
      await webBuilder.genLoc(webBuilder.xpathFontSetting.tab("Heading")).click();
      await webBuilder.chooseFonts(languageData[1].heading.font_edit);
      await webBuilder.clickSaveButton();
      const preview = await webBuilder.clickPreview({ context, dashboard });
      await preview.waitForLoadState("networkidle");
      sfTranslation = new SfTranslation(preview, conf.suiteConf.domain);
      await sfTranslation.changeSettingLanguage({ language: languageData[1].language_sf });
      await preview.waitForLoadState("networkidle");
      await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        languageData[1].language_sf,
      );

      //verify Heading
      headingLoc = preview.locator(sfTranslation.xpathTranslate.blockByText(cConf.heading_content));
      fontHeading = await getStyle(headingLoc, "font-family");
      expect(fontHeading).toContain(languageData[1].heading.font_edit);

      //check ngoài SF
      await preview.goto(`https://${conf.suiteConf.domain}`);
      await preview.waitForLoadState("networkidle");
      await sfTranslation.changeSettingLanguage({ language: languageData[1].language_sf });
      await preview.waitForLoadState("networkidle");
      await expect(preview.locator(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        languageData[1].language_sf,
      );

      //verify Heading
      headingLoc = preview.locator(sfTranslation.xpathTranslate.blockByText(cConf.heading_content));
      fontHeading = await getStyle(headingLoc, "font-family");
      expect(fontHeading).toContain(languageData[1].heading.font_edit);
    });

    await test.step(`Tại web builder, click button exit`, async () => {
      await webBuilder.genLoc(webBuilder.xpathBtnExit).click();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(languageData[0].language)),
      ).toBeVisible();
    });
  });
});
