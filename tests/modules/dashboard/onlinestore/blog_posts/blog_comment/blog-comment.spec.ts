import { test } from "@fixtures/website_builder";
import { BlogPage, removeSelector } from "@pages/dashboard/blog";
import { ThemeDashboard } from "@pages/dashboard/theme";
import type { BlogInfo } from "@types";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { FrameLocator, Page, expect } from "@playwright/test";
import type { CommentsSF } from "./blog-comment";
import { waitTimeout } from "@core/utils/api";

let blogPage: BlogPage;
let blogPost: BlogInfo[];
let themePage: ThemeDashboard;
let themeCloneId;
let maxDiffPixelRatio: number;
let threshold: number;
let maxDiffPixels: number;
let snapshotName;
let storefront: Page;
let previewPage: FrameLocator;
let blogInfo;
let comment: CommentsSF;

test.describe("Verify Blog post: Comment + Navigate", () => {
  test.beforeEach(async ({ dashboard, theme, conf }, testInfo) => {
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
    comment = conf.caseConf.comment;
    test.setTimeout(conf.suiteConf.timeout);
    await test.step("Precondition: Re-create blog, blog post and Apply theme Ciadora", async () => {
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

  test("@SB_OLS_BL_BLG_ECOM_16 Kiểm tra chức năng của Post navigation block khi được kéo thả trong page Blog post", async ({
    snapshotFixture,
    context,
  }) => {
    await test.step("- Đi đến Page Blog Post > click vào block Post navigation", async () => {
      await accessToBlogPost(blogPost[2].title);
      await previewPage.locator(blogPage.xpathPostNavigate).click();
      const imageThumbnailBlog = `(${blogPage.xpathPostNavigate}//img)`;
      for (let i = 1; i <= (await previewPage.locator(imageThumbnailBlog).count()); i++) {
        await waitForImageLoaded(blogPage.page, `${imageThumbnailBlog}[${i}]`, "#preview");
      }
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: blogPage.xpathPostNavigate,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step("View blog post ngoài SF", async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: '//span[child::button[@name="Preview on new tab"]]',
        redirectUrl: "?theme_preview_id",
        context,
      });

      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 190000 });
      for (let i = 1; i <= (await storefront.locator(blogPage.xpathThumbnailBlogPost).count()); i++) {
        await waitForImageLoaded(storefront, `${blogPage.xpathThumbnailBlogPost}[${i}]`);
      }
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathPostNaviagteSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step("CLick icon Next tại Post navigate", async () => {
      await storefront.click(
        '//div[contains(@class,"post-navigation__next")]//div[contains(@class, "navigation__nav")]',
        { timeout: 19000 },
      );
      await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 19000 });
      await waitTimeout(10000);

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: '//section[@id="gesETS"]//section[@component="heading"]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_next_title}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: '//section[@id="gesETS"]//section[@component="custom_code"]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_next_content}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: '//section[@id="gesETS"]//section[@component="block_image"]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_next_img}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathPostNaviagteSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_next}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step("CLick icon Previous tại Post navigate", async () => {
      // click prev 2 lần để chuyển về blog post trước blog post ban đầu
      for (let i = 1; i < 3; i++) {
        await storefront.click(
          '//div[contains(@class,"post-navigation__prev")]//div[contains(@class, "navigation__nav")]',
        );
        await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 19000 });
      }

      await waitTimeout(10000);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: '//section[@id="gesETS"]//section[@component="heading"]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_prev_title}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: '//section[@id="gesETS"]//section[@component="custom_code"]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_prev_content}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: '//section[@id="gesETS"]//section[@component="block_image"]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_prev_img}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });

      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathPostNaviagteSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF_prev}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_OLS_BL_BLG_ECOM_17 Kiểm tra setting content của Post navigation block khi được kéo thả vào Page`, async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    await test.step(`- Đi đến màn Blog post >  Click block Post navigation > Tại tab Content > Setting value: Arrows = OFF; Post title = OFF; Thumbnail = OFF > Click button save > Check màn hiển thị màn preview`, async () => {
      await accessToBlogPost(blogPost[2].title);
      await previewPage.locator(blogPage.xpathPostNavigate).click();
      await blogPage.page.click(blogPage.xpathContentTab, { timeout: 90000 });
      await blogPage.page.click('//div[@keyid="arrows"]//div[contains(@class, "sb-switch--active")]');
      await blogPage.page.click('//div[@keyid="post_title"]//div[contains(@class, "sb-switch--active")]');
      await blogPage.page.click(blogPage.xpathThubnailOn);
      await blogPage.page.locator(blogPage.xpathThubnailOn).waitFor({ state: "hidden" });
      await blogPage.clickSaveButton();
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: blogPage.xpathPostNavigate,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`View blog post ngoài SF`, async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: '//span[child::button[@name="Preview on new tab"]]',
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 190000 });
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathPostNaviagteSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Kiểm tra khi resize block`, async () => {
      const widthBlog = conf.caseConf.resize;
      let i = 0;
      await blogPage.page.click(blogPage.xpathDesignTab, { timeout: 90000 });
      await blogPage.page.click(blogPage.xpathWidthButton);
      await blogPage.page.click('//label[normalize-space()="Px"]');
      await blogPage.page.waitForSelector('//div[@data-widget-id="width"]//button//span[normalize-space()="Px"]');
      await blogPage.page.click(blogPage.xpathWidthInput);
      for (const width of widthBlog) {
        await blogPage.resizeNagative(width);
        i += 1;
        await snapshotFixture.verifyWithIframe({
          page: blogPage.page,
          iframe: "#preview",
          selector: blogPage.xpathPostNavigate,
          snapshotName: `${process.env.ENV}-${i + "_" + snapshotName.blog_post_navigate_resize}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      }
      await blogPage.page.click(blogPage.xpathWidthButton);
      await blogPage.page.click('//label[normalize-space()="%"]');
      await blogPage.page.waitForSelector('//div[@data-widget-id="width"]//button//span[normalize-space()="%"]');
      await blogPage.resizeNagative("100");
    });

    await test.step(`Kiểm tra hiên thị của blog navigate trên màn hình mobile   - Sử dụng thiết bị android hoặc ios để test`, async () => {
      await blogPage.page.click(blogPage.xpathMobileDevice);
      await blogPage.page.waitForSelector(blogPage.xpathToast, { state: "visible" });
      await blogPage.page.waitForSelector(blogPage.xpathToast, { state: "hidden" });
      await blogPage.page.locator('//div[@class="w-builder__preview-mobile"]').waitFor({ timeout: 5000 });
      await previewPage.locator(blogPage.xpathPostNavigate).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: blogPage.xpathPostNavigate,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_navigate_mobile}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_OLS_BL_BLG_ECOM_18 Kiểm tra chức năng của Comment block khi được kéo thả trong Website builder`, async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    const sectionSetting = conf.caseConf.add_blank_section;

    await test.step(`Đi đến màn Blog post   - Kéo thả Comment block vào website builder`, async () => {
      await accessToBlogPost(blogPost[2].title);
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
      await previewPage.locator(blogPage.xpathPostNavigate).click();
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: blogPage.xpathCommentBlock,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment}-01`,
      });
      await blogPage.clickSaveButton();
    });

    await test.step(`View blog post ngoài SF > Kiểm trra style của form`, async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: '//span[child::button[@name="Preview on new tab"]]',
        redirectUrl: "?theme_preview_id",
        context,
      });

      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 190000 });
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step(`Kiểm tra style của comment`, async () => {
      //add comment
      const commentTotalOld = await storefront.textContent('//div[contains(@class,"comment__total")]/p');
      await storefront.type('//input[@placeholder="Enter your name"]', comment.name, { delay: 100 });
      await storefront.type('//input[@placeholder="Enter your email"]', comment.email, { delay: 100 });
      await storefront.type('//textarea[@placeholder="Enter your message"]', comment.message, { delay: 100 });
      await storefront.click('//button[@type="submit"]');
      await storefront.waitForSelector('//div[@role="alert"]', { state: "visible" });
      await storefront.waitForSelector('//div[@role="alert"]', { state: "hidden" });
      let commentTotalNew: string;
      do {
        await storefront.reload();
        await storefront.waitForLoadState("networkidle");
        commentTotalNew = await storefront.textContent('//div[contains(@class,"comment__total")]/p', { timeout: 9000 });
      } while (commentTotalNew == commentTotalOld);
      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await removeSelector(storefront, "span.comment__content__user-time");
      await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 190000 });
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_message_comment_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step(`Tại màn Wb > Kiểm tra khi đổi blog post`, async () => {
      await blogPage.page.click(blogPage.xpathReferencePage);
      await blogPage.page.locator(blogPage.xpathSearchBlogPost).clear();
      await blogPage.page.locator(blogPage.xpathSearchBlogPost).type(blogPost[1].title, { delay: 100 });
      await blogPage.page.locator(blogPage.xpathSearchBlogPost).press("Enter");
      await blogPage.page.click(blogPage.getXpathBlogPostInSearch(blogPost[1].title), { timeout: 100000 });
      while (
        await previewPage
          .locator(`//span[contains(@class,'breadcrumb_link--current') and text()='${blogPost[1].title}']`)
          .isHidden()
      ) {
        await blogPage.page.click(blogPage.xpathReferencePage);
        await blogPage.page.click(blogPage.getXpathBlogPostInSearch(blogPost[1].title), { timeout: 100000 });
      }
      const imageThumbnailBlog = `(${blogPage.xpathPostNavigate}//img)`;
      for (let i = 1; i <= (await previewPage.locator(imageThumbnailBlog).count()); i++) {
        await waitForImageLoaded(blogPage.page, `${imageThumbnailBlog}[${i}]`, "#preview");
      }
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: blogPage.xpathCommentBlock,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment}-02`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step(`- Tại Wb > đi đến màn Home > kéo thả block Comment > Kiểm tra trường hợp comment được add vào trong page != Blog post`, async () => {
      await blogPage.page.click('//button[@name="Pages"]');
      await blogPage.page.click('//div[contains(normalize-space(),"Home") and contains(@class,"groups--item-label")]');
      await blogPage.page.waitForSelector(
        '//span[contains(@class,"w-builder__header-title") and normalize-space()="Home"]',
      );
      await previewPage.locator("(//section[contains(@class,'section') and not(@selected-block-state)])[3]").waitFor();
      await previewPage
        .locator("(//section[contains(@class,'section') and not(@selected-block-state)])[3]")
        .click({ delay: 3000 });
      //add section
      await blogPage.dragAndDropInWebBuilder(conf.caseConf.add_section);
      //insert block
      await blogPage.insertSectionBlock({
        parentPosition: conf.caseConf.add_comment_block.parent_position,
        category: conf.caseConf.add_comment_block.basics_cate,
        template: conf.caseConf.add_comment_block.template,
      });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: '//div[@id="wb-main"]//section[3]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_warning}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_OLS_BL_BLG_ECOM_30 [Commnent] Kiểm tra khi nhập comment`, async ({ conf, snapshotFixture, context }) => {
    await test.step(`Đi đến màn Blog post   - Kéo thả Comment block vào website builder - Kiểm tra khi post chưa có comment nào`, async () => {
      await accessToBlogPost(blogPost[2].title);
      await previewPage.locator(blogPage.xpathRelatedArticles).scrollIntoViewIfNeeded();
      //add section
      await blogPage.dragAndDropInWebBuilder(conf.caseConf.add_blank_section);
      await previewPage.locator(blogPage.xpathRelatedArticles).scrollIntoViewIfNeeded();
      //insert block
      await blogPage.insertSectionBlock({
        parentPosition: conf.caseConf.add_block.parent_position,
        category: conf.caseConf.add_block.basics_cate,
        template: conf.caseConf.add_block.template,
      });
      await previewPage.locator(blogPage.xpathPostNavigate).click();
      await blogPage.clickSaveButton();
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: "#preview",
        selector: blogPage.xpathCommentBlock,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`View blog post ngoài SF`, async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: '//span[child::button[@name="Preview on new tab"]]',
        redirectUrl: "?theme_preview_id",
        context,
      });

      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await storefront.waitForSelector('//div[contains(@class,"comment__total")]/p', { timeout: 190000 });
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Nhập Your name, Your email, Your message > Click button Submit > Kiểm tra lại list comment`, async () => {
      await storefront.locator('//textarea[@placeholder="Enter your message"]').scrollIntoViewIfNeeded();
      await storefront.type('//input[@placeholder="Enter your name"]', comment.name, { delay: 100 });
      await storefront.type('//input[@placeholder="Enter your email"]', comment.email, { delay: 100 });
      await storefront.type('//textarea[@placeholder="Enter your message"]', comment.message, { delay: 100 });
      await storefront.click('//button[@type="submit"]');
      await expect(storefront.locator('//div[@role="alert"]')).toBeVisible({ timeout: 2000 });
      await storefront.waitForSelector('//div[@role="alert"]', { state: "hidden" });
      let commentTotalNew: string;
      let commentTotalOld: string;
      do {
        commentTotalOld = await storefront.textContent('//div[contains(@class,"comment__total")]/p');
        await storefront.reload();
        await storefront.waitForLoadState("networkidle");
        commentTotalNew = await storefront.textContent('//div[contains(@class,"comment__total")]/p', { timeout: 9000 });
      } while (commentTotalNew == commentTotalOld);
      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await removeSelector(storefront, "span.comment__content__user-time");
      await storefront.waitForSelector(blogPage.xpathPostNaviagteSF, { timeout: 190000 });
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_message_comment_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Click Reply`, async () => {
      await storefront.locator('//span[text()="Reply"]').first().click();
      await storefront.waitForSelector(blogPage.xpathReplyFormSF);
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_reply_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Nhập Your name, Your email, Your messageClick button SubmitKiểm tra lại list comment`, async () => {
      // reply comment
      await storefront.type(`${blogPage.xpathReplyFormSF}//input[@placeholder="Enter your name"]`, comment.name, {
        delay: 100,
      });
      await storefront.type(`${blogPage.xpathReplyFormSF}//input[@placeholder="Enter your email"]`, comment.email, {
        delay: 100,
      });
      await storefront.type(
        `${blogPage.xpathReplyFormSF}//textarea[@placeholder="Enter your message"]`,
        comment.message,
        { delay: 100 },
      );
      await storefront.click(`${blogPage.xpathReplyFormSF}//button[@type="submit"]`);
      await expect(storefront.locator('//div[@role="alert"]')).toBeVisible({ timeout: 2000 });
      await storefront.waitForSelector('//div[@role="alert"]', { state: "hidden" });
      let replyTotalNew: string;
      let replyTotalOld: string;
      do {
        replyTotalOld = await storefront.textContent(
          '((//div[contains(@class,"comment__content__user-reply")])[1])/span[1]',
        );
        await storefront.reload();
        await storefront.waitForLoadState("networkidle");
        replyTotalNew = await storefront.textContent(
          '((//div[contains(@class,"comment__content__user-reply")])[1])/span[1]',
          { timeout: 9000 },
        );
      } while (replyTotalNew == replyTotalOld);
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_reply_comment_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await storefront.click('((//div[contains(@class,"comment__content__user-reply")])[1])/span[1]');
      await storefront.waitForSelector(
        '((//div[contains(@class,"comment__content__user-reply")])[1])/span[text()="Hide reply"]',
        { timeout: 2000 },
      );
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_list_reply_comment_SF}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_OLS_BL_BLG_ECOM_31 [Comment] Kiểm tra page load của block Comment`, async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    await test.step(`Đi đến màn Blog post   - Kéo thả Comment block vào website builderNhập Comment per page = 5Comment loading = PagingKiểm tra list comment`, async () => {
      await accessToBlogPost(conf.caseConf.blog_comment);
      await previewPage.locator(blogPage.xpathRelatedArticles).scrollIntoViewIfNeeded();
      //add section
      await blogPage.dragAndDropInWebBuilder(conf.caseConf.add_blank_section);
      await previewPage.locator(blogPage.xpathRelatedArticles).scrollIntoViewIfNeeded();
      //insert block
      await blogPage.insertSectionBlock({
        parentPosition: conf.caseConf.add_block.parent_position,
        category: conf.caseConf.add_block.basics_cate,
        template: conf.caseConf.add_block.template,
      });
      await previewPage.locator(blogPage.xpathCommentBlock).click();
      await blogPage.page.click(blogPage.xpathContentTab, { timeout: 90000 });
      await blogPage.page.click('//div[@keyid="pagination"]//button[child::span[normalize-space()="5"]]');
      await blogPage.page.click('//div[@keyid="page_load"]//button');
      await blogPage.page.click('//div[@id="widget-popover"]//label[normalize-space()="Paging"]');
      await blogPage.page.click('//button[@name="Save"]', { delay: 1500 });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        selector: '//div[contains(@class,"w-builder__settings-layer")]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_setting_layer_paging}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`View blog post ngoài SF`, async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: '//span[child::button[@name="Preview on new tab"]]',
        redirectUrl: "?theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await storefront.waitForSelector('//div[contains(@class,"comment__total")]/p', { timeout: 190000 });
      while ((await storefront.locator('//span[text()="Reply"]').count()) < 5) {
        await storefront.reload();
        await storefront.waitForLoadState("networkidle");
      }
      await removeSelector(storefront, "span.comment__content__user-time");
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_SF_paging}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Nhập Comment per page = 20Comment loading = Load moreKiểm tra list comment`, async () => {
      await blogPage.page.click('//div[@keyid="pagination"]//button[child::span[normalize-space()="20"]]');
      await blogPage.page.click('//div[@keyid="page_load"]//button');
      await blogPage.page.click('//div[@id="widget-popover"]//label[normalize-space()="Load more"]');
      await blogPage.page.click('//button[@name="Save"]', { delay: 1500 });
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        selector: '//div[contains(@class,"w-builder__settings-layer")]',
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_setting_layer_load_more}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`View blog post ngoài SF`, async () => {
      await waitForImageLoaded(storefront, blogPage.xpathImgBlogPost);
      await storefront.waitForSelector('//div[contains(@class,"comment__total")]/p', { timeout: 190000 });
      while ((await storefront.locator('//span[text()="Reply"]').count()) < 20) {
        await storefront.reload();
        await storefront.waitForLoadState("networkidle");
      }
      await removeSelector(storefront, "span.comment__content__user-time");
      await snapshotFixture.verifyWithIframe({
        page: storefront,
        selector: blogPage.xpathCommentSF,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_comment_SF_load_more}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
