import { expect, test } from "@fixtures/website_builder";
import { LanguageList } from "@pages/new_ecom/dashboard/translation/language-list";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Settings } from "@pages/dashboard/settings";
import { ReviewPage } from "@pages/dashboard/product_reviews";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { Review } from "@types";

test.describe("Kiểm tra tính năng dịch đối với dynamic content - block product review", async () => {
  let productReview: ReviewPage;
  let dashboardPage: DashboardPage;
  let settings: Settings;
  let languageList: LanguageList;
  let webBuilder: WebBuilder;
  let sfTranslation: SfTranslation;
  let review: Review;

  test.beforeEach(async ({ conf, dashboard }) => {
    productReview = new ReviewPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    settings = new Settings(dashboard, conf.suiteConf.domain);
    languageList = new LanguageList(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    review = conf.suiteConf.review;

    await dashboardPage.goto(`admin/apps/review/v3/all-reviews`);
    await productReview.removeReviewInDB(review.name, review.review, review.product);

    //Remove languages
    await dashboardPage.navigateToMenu("Settings");
    await settings.clickMenu("Languages");
    await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
    await languageList.removeAllLanguages();
  });

  test(`@SB_SET_TL_85 [DB+SF - Function] Kiểm tra tính năng dịch tự động với dynamic content - Product review`, async ({
    snapshotFixture,
    conf,
    context,
  }) => {
    test.slow();
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

    await test.step(`Mở Product detail trong WB đã có sẵn review > chọn ngôn ngữ tiếng Đức`, async () => {
      await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.theme_id, page: "product" });
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`Product review`)).click();

      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("Product review", "Product Reviews")).click();
      await webBuilder.switchToTab("Design");
      await productReview.selectLayOutOfProductReview(caseConf.layout);
      await webBuilder.backToLayerBtn.first().click({ delay: 3000 });
      await webBuilder.clickSaveButton();

      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: productReview.xpathPrReview.block,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-block-product-review-WB-${caseConf.layout}.png`,
      });
    });
    await test.step(` Mở Product detail ngoài SF đã có sẵn review > chọn ngôn ngữ tiếng Đức`, async () => {
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.goto(caseConf.product_handle);
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);

      //Đổi ngôn ngữ sang tiếng Đức
      await sfTranslation.changeSettingLanguage({
        language: caseConf.expected_sf_languages[0],
      });
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
      try {
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          caseConf.expected_sf_languages[0],
        );
      } catch (error) {
        await sfTranslation.page.reload();
        await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
        await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          caseConf.expected_sf_languages[0],
        );
      }
      await sfTranslation.genLoc(`//section[contains(@class , 'wb-builder__section')]`).nth(4).scrollIntoViewIfNeeded();
      await sfTranslation.waitUntilElementVisible(productReview.xpathPrReview.block);
      await webBuilder.page.waitForTimeout(3 * 1000); //wait for page stable
      await sfTranslation.genLoc(sfTranslation.xpathProductReview.seeContentBtn).first().hover();

      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: productReview.xpathPrReview.block,
        snapshotName: `${process.env.ENV}-block-product-review-SF-original-${caseConf.layout}.png`,
      });
    });

    await test.step(`Click btn See translation`, async () => {
      await sfTranslation.genLoc(sfTranslation.xpathProductReview.seeContentBtn).first().click();
      await sfTranslation.genLoc(sfTranslation.xpathProductReview.seeContentBtn).first().hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: productReview.xpathPrReview.block,
        snapshotName: `${process.env.ENV}-block-review-SF-translated-to-${caseConf.expected_sf_languages[0]}-${caseConf.layout}.png`,
      });
      await sfTranslation.page.close();
    });

    await test.step(`Click write a review > submit `, async () => {
      const newTab = await context.newPage();
      sfTranslation = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfTranslation.goto(caseConf.product_handle);
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });

      //Đổi ngôn ngữ về default
      await sfTranslation.changeSettingLanguage({
        language: conf.suiteConf.language_default,
      });
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
      await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
        conf.suiteConf.language_default,
      );

      await sfTranslation.page.waitForTimeout(3 * 1000); //run bị issue scroll trượt nên cần wait
      await sfTranslation.genLoc(`//section[contains(@class , 'wb-builder__section')]`).nth(3).scrollIntoViewIfNeeded();
      await sfTranslation.waitUntilElementVisible(productReview.xpathPrReview.block);
      await sfTranslation.genLoc(productReview.xpathPrReview.block).scrollIntoViewIfNeeded();
      productReview = new ReviewPage(sfTranslation.page, conf.suiteConf.domain);
      await productReview.writeReviewV3(review);
      await sfTranslation.page.reload();
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
    });

    await test.step(`chọn ngôn ngữ tiếng Việt > Click btn See translation`, async () => {
      //Đổi ngôn ngữ sang tiếng Việt
      await sfTranslation.changeSettingLanguage({
        language: caseConf.expected_sf_languages[1],
      });
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
      try {
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          caseConf.expected_sf_languages[1],
        );
      } catch (error) {
        await sfTranslation.page.reload();
        await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
        await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
        await expect(sfTranslation.genLoc(sfTranslation.xpathTranslate.globalSwitcherBlock)).toContainText(
          caseConf.expected_sf_languages[1],
        );
      }
      await sfTranslation.genLoc(`//section[contains(@class , 'wb-builder__section')]`).nth(4).scrollIntoViewIfNeeded();
      await sfTranslation.waitUntilElementVisible(productReview.xpathPrReview.block);
      await sfTranslation.genLoc(sfTranslation.xpathProductReview.buttonTranslateByTextReview(review.review)).click();
      await expect(
        sfTranslation.genLoc(sfTranslation.xpathProductReview.review(review.translated_review)),
      ).toBeVisible();
    });
  });
});
