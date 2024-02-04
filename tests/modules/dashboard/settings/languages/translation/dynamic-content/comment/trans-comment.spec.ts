import { expect, test } from "@fixtures/website_builder";
import { LanguageList } from "@pages/new_ecom/dashboard/translation/language-list";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Settings } from "@pages/dashboard/settings";
import { BlogPage } from "@pages/dashboard/blog";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { CommentInfo } from "@types";

test.describe("Kiểm tra tính năng dịch đối với dynamic content - block comment", async () => {
  let blogPage: BlogPage;
  let dashboardPage: DashboardPage;
  let settings: Settings;
  let languageList: LanguageList;
  let webBuilder: WebBuilder;
  let sfTranslation: SfTranslation;
  let comment: CommentInfo;

  test.beforeEach(async ({ conf, dashboard }) => {
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    settings = new Settings(dashboard, conf.suiteConf.domain);
    languageList = new LanguageList(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await blogPage.goToManageComments();
    comment = conf.suiteConf.comment;
    await blogPage.removeCommentInDB(comment.your_email, comment.comment, comment.blog_post);

    //Remove languages
    await dashboardPage.navigateToMenu("Settings");
    await settings.clickMenu("Languages");
    await expect(languageList.genLoc(languageList.xpathLangList.titleLanguageList)).toBeVisible();
    await languageList.removeAllLanguages();
  });

  test(`@SB_SET_TL_86 [DB+SF - Function] Kiểm tra tính năng dịch tự động với dynamic content - Blog post comment`, async ({
    snapshotFixture,
    conf,
  }) => {
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

    await test.step(`Mở Blog post trong WB đã có sẵn comment > chọn ngôn ngữ tiếng Đức`, async () => {
      await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.theme_id, page: "blog_post" });
      await webBuilder.frameLocator.locator(blogPage.xpathCommentBlock).waitFor({ state: "visible" });
      await webBuilder.frameLocator.locator(blogPage.xpathUserReply).first().click();
      await webBuilder.backToLayerBtn.click({ delay: 2000 });

      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: blogPage.xpathCommentBlock,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-block-comment-WB.png`,
      });
    });

    await test.step(`Mở Blog post ngoài SF đã có sẵn comment > chọn ngôn ngữ tiếng Đức`, async () => {
      sfTranslation = new SfTranslation(webBuilder.page, conf.suiteConf.domain);
      await sfTranslation.goto(`https://${conf.suiteConf.domain}/${caseConf.blog_handle}`);
      await sfTranslation.waitUntilElementVisible(blogPage.xpathCommentSF);
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);

      //Đổi ngôn ngữ sang tiếng Đức
      await sfTranslation.changeSettingLanguage({
        language: caseConf.expected_sf_languages[0],
      });
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
      await sfTranslation.waitUntilElementVisible(sfTranslation.xpathTranslate.globalSwitcherBlock);
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
      await sfTranslation.genLoc(blogPage.xpathUserReply).first().click({ delay: 2000 });
      await sfTranslation.genLoc(sfTranslation.xpathComment.seeContentBtn).first().hover();

      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-block-comment-SF-original.png`,
      });
    });

    await test.step(`Click btn See translation`, async () => {
      await sfTranslation.genLoc(sfTranslation.xpathComment.seeContentBtn).first().click();
      await sfTranslation.genLoc(sfTranslation.xpathComment.seeContentBtn).first().hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTranslation.page,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-block-comment-SF-translated-to-${caseConf.expected_sf_languages[0]}.png`,
      });
    });

    await test.step(`Click write a comment > submit `, async () => {
      await sfTranslation.page.waitForLoadState("networkidle", { timeout: 15000 });
      await blogPage.writeCommentBlogPostV3(comment);
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
      await sfTranslation.genLoc(sfTranslation.xpathComment.buttonTranslateByTextCmt(comment.comment)).click();
      await expect
        .soft(sfTranslation.genLoc(sfTranslation.xpathComment.comment(comment.translated_comment)))
        .toBeVisible();
    });
  });
});
