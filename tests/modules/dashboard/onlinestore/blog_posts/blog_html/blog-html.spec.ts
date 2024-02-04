import { test } from "@fixtures/website_builder";
import { BlogPage } from "@pages/dashboard/blog";
import { ThemeDashboard } from "@pages/dashboard/theme";
import type { BlogInfo } from "@types";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { FrameLocator, Page } from "@playwright/test";

let blogPage: BlogPage;
let blogPost: BlogInfo[];
let themePage: ThemeDashboard;
let themeCloneId;
let maxDiffPixelRatio: number;
let threshold: number;
let maxDiffPixels: number;
let snapshotName;
let previewPage: FrameLocator;
let blogInfo;
let storefront: Page;

test.describe("Verify Blog with HTML block", () => {
  test.beforeEach(async ({ dashboard, conf, theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    snapshotName = conf.caseConf.snapshot_name;
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    themePage = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    blogPost = conf.suiteConf.blog_post_info;
    blogInfo = conf.caseConf.blog_info;
    test.setTimeout(conf.suiteConf.timeout);
    await test.step("Precondition: Re-create blog post and Apply theme Ciadora", async () => {
      if (blogInfo) {
        await blogPage.deleteListBlogOrBlogPost(blogInfo, "blog");
        await blogPage.createListBlog(blogInfo);
      }
      if (!conf.caseConf.resetBlog) {
        await blogPage.goToBlogPostPage();
        await blogPage.deleteListBlogOrBlogPost(blogPost, "blog post");
        await blogPage.createListBlogPost(blogPost);
      }
      const themeList = await theme.list();
      for (let i = 0; i < themeList.length; i++) {
        if (!themeList[i].active && themeList[i].id !== conf.suiteConf.theme_id.criadora) {
          await theme.delete(themeList[i].id);
        }
      }
      const response = await theme.duplicate(conf.suiteConf.theme_id.criadora);
      themeCloneId = response.id;
      await theme.publish(themeCloneId);
      await themePage.goToCustomizeTheme();
    });
  });

  const accessToBlogPost = async (blogTitle: string) => {
    await blogPage.openWebBuilder({
      type: "site",
      id: themeCloneId,
      page: "blog_post",
    });
    let templatePage = await blogPage.page.locator(blogPage.xpathReferencePage).textContent({ timeout: 120000 });
    while (templatePage == "Home") {
      await blogPage.page.reload();
      await blogPage.page.locator(blogPage.xpathReferencePage).waitFor({ state: "visible" });
      templatePage = await blogPage.page.locator(blogPage.xpathReferencePage).textContent({ timeout: 120000 });
    }
    previewPage = blogPage.page.frameLocator("#preview");
    await previewPage.locator(`//span[contains(@class,'breadcrumb_link--current')]`).waitFor({ timeout: 120000 });
    await blogPage.page.click(blogPage.xpathReferencePage);
    await blogPage.page.locator(blogPage.xpathSearchBlogPost).type(blogTitle, { delay: 100 });
    await blogPage.page.locator(blogPage.xpathSearchBlogPost).press("Enter");
    await blogPage.page.click(blogPage.getXpathBlogPostInSearch(blogTitle), { timeout: 100000 });
    while (
      await previewPage
        .locator(`//span[contains(@class,'breadcrumb_link--current') and text()='${blogTitle}']`)
        .isHidden()
    ) {
      await blogPage.page.click(blogPage.xpathReferencePage);
      await blogPage.page.click(blogPage.getXpathBlogPostInSearch(blogTitle), { timeout: 100000 });
    }
  };

  test(`@SB_OLS_BL_BLG_ECOM_14 Kiểm tra chức năng của HTML code block khi được kéo thả trong Website builder`, async ({
    snapshotFixture,
    conf,
    context,
  }) => {
    const sectionSetting = conf.caseConf.add_blank_section;
    const env = process.env.ENV;
    await test.step(`- Đi đến Page Blog Post- Kéo thả HTML block vào website builder`, async () => {
      await accessToBlogPost(blogPost[0].title);
      await previewPage.locator(blogPage.xpathRelatedArticles).scrollIntoViewIfNeeded();
      //add section
      await blogPage.dragAndDropInWebBuilder(sectionSetting);
      await previewPage.locator(blogPage.xpathRelatedArticles).scrollIntoViewIfNeeded();
      //insert block
      await blogPage.insertSectionBlock({
        parentPosition: conf.caseConf.add_block.parent_position,
        category: conf.caseConf.add_block.basics_cate,
        template: conf.caseConf.add_block.template,
      });
      await previewPage.locator(`(${blogPage.xpathCodeBlock})[last()]`).click();
      await blogPage.clickSaveButton();
      await blogPage.page.click(blogPage.xpathContentTab, { timeout: 90000 });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        selector: '//div[contains(@class,"w-builder__settings-layer")]',
        snapshotName: `${env}_${snapshotName.blog_html_content}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await blogPage.page.click(blogPage.xpathDesignTab, { timeout: 90000 });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        selector: '//div[contains(@class,"w-builder__settings-layer")]',
        snapshotName: `${env}_${snapshotName.blog_html_design}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`- Chọn Custom code = input manually- Nhập code
  - Check màn preview/SF`, async () => {
      await blogPage.page.click(blogPage.xpathContentTab, { timeout: 90000 });
      await blogPage.page.click(blogPage.xpathCodeArea);
      await blogPage.page.locator(blogPage.xpathCodeArea).type(conf.caseConf.html_code, { delay: 10, timeout: 300000 });
      await blogPage.page.click(blogPage.xpathContentTab, { timeout: 90000, delay: 2000 });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: `(${blogPage.xpathCodeBlock})[last()]`,
        snapshotName: `${env}_${snapshotName.blog_html_preview}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`- Chọn Custom code = Get content from blog_post> Blog's content- Check màn preview/SF`, async () => {
      await blogPage.page.click('//div[contains(@class,"widget-select-variable")]/span[2]');
      await blogPage.page.hover(
        '//div[@id="popover-select-text-variable"]//div[contains(text(),"Get content from blog post")]',
      );
      await blogPage.page.hover('//div[@id="select-text-variable-blog_post"]');
      await blogPage.page.click('//div[@id="select-text-variable-blog_post"]');
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        selector: '//div[contains(@class,"w-builder__settings-layer")]',
        snapshotName: `${env}_${snapshotName.blog_html_content_from_blog_post}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: `(${blogPage.xpathCodeBlock})[last()]`,
        snapshotName: `${env}_${snapshotName.blog_html_from_blog_post}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`View blog post ngoaif SF`, async () => {
      await blogPage.clickSaveButton();
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: '//span[child::button[@name="Preview on new tab"]]',
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.waitForSelector(blogPage.xpathSectionHtmlCode);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathSectionHtmlCode,
        snapshotName: `${env}_${snapshotName.blog_post_html_code_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
