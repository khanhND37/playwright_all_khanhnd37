import { expect, test } from "@core/fixtures";
import { BlogPage } from "@pages/dashboard/blog";

test.describe("Verify blog post", async () => {
  test(`@SB_BL_13 ManageCommentBlog_Check kết quả khi search ký tự bất kỳ`, async ({ conf, dashboard }) => {
    const blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    await test.step(`Input ký tự hợp lệ bất kỳ`, async () => {
      await blogPage.goToManageComments();
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathTableLoad);
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathProductDetailLoading);
      for (const keyword of conf.caseConf.keywords) {
        await blogPage.searchComment(keyword.keyword);
        const listComment = await blogPage.getListCommentInDB();
        for (let i = 0; i < listComment.length; i++) {
          expect(listComment[i]).toEqual(keyword.expected[i]);
        }
      }
    });

    await test.step(`Input keywork không tồn tại`, async () => {
      await blogPage.searchComment(conf.caseConf.no_result.keyword);
      const actualText = await blogPage.genLoc(blogPage.xpathBlog.manageComment.textNoCommentFound).innerText();
      expect(actualText).toEqual(conf.caseConf.no_result.expected);
    });
  });
});
